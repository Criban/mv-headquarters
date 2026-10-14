import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { captureSnapshots, writeSnapshot } from './snapshot-bf6.mjs';

export function normalizeReading(player) {
  const number = value => {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };
  const response = player.response;
  const killDeath = number(response.infantryKillDeath);
  if (!Number.isFinite(Date.parse(player.capturedAt)) || killDeath === null) throw new Error('Invalid reading');
  const seconds = number(response.secondsPlayed);
  const accuracy = number(typeof response.accuracy === 'string' ? response.accuracy.trim().replace(/\s*%$/, '').replace(',', '.') : response.accuracy);
  const values = {
    killDeath, hoursPlayed: seconds === null ? null : seconds / 3600,
    matchesPlayed: number(response.gameModeGroups?.find(group => group.gamemodeName === 'All')?.matches),
    accuracy: accuracy !== null && accuracy <= 100 ? accuracy : null,
    shotsFired: number(response.weaponGroups?.find(group => group.id === 'wp_temp')?.shotsFired)
  };
  if (killDeath === 0 && !(values.hoursPlayed > 0) && !(values.matchesPlayed > 0)) throw new Error('Empty reading');
  return { savedAt: new Date(player.capturedAt).toISOString(), values };
}

export function buildExports(rows, now = new Date()) {
  const players = Object.create(null);
  const latest = Object.create(null);
  for (const row of rows) {
    const reading = normalizeReading(row.snapshot);
    if (Date.parse(reading.savedAt) > now.getTime()) continue;
    (players[row.player_name] ??= []).push(reading);
    if (!latest[row.player_name] || Date.parse(reading.savedAt) > Date.parse(latest[row.player_name].capturedAt)) latest[row.player_name] = row.snapshot;
  }
  for (const readings of Object.values(players)) readings.sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt));
  return { history: { version: 2, generatedAt: now.toISOString(), players }, snapshot: { players: latest } };
}

export async function saveSnapshots(sql, snapshot) {
  // Validate everything before starting one atomic write transaction.
  const entries = Object.entries(snapshot.players).map(([name, player]) => [name, player, normalizeReading(player)]);
  await sql.transaction(entries.map(([name, player, reading]) => sql`INSERT INTO bf6_daily_stats (player_name, day, captured_at, metrics, snapshot)
     VALUES (${name}, (${reading.savedAt}::timestamptz AT TIME ZONE 'Europe/Berlin')::date,
       ${reading.savedAt}::timestamptz, ${JSON.stringify(reading.values)}::jsonb, ${JSON.stringify(player)}::jsonb)
     ON CONFLICT (player_name, day) DO UPDATE SET
       captured_at = EXCLUDED.captured_at, metrics = EXCLUDED.metrics, snapshot = EXCLUDED.snapshot
     WHERE bf6_daily_stats.captured_at < EXCLUDED.captured_at`));
}

async function exportHistory(sql) {
  const rows = await sql`SELECT player_name, snapshot FROM bf6_daily_stats ORDER BY captured_at`;
  const exported = buildExports(rows);
  const destination = fileURLToPath(new URL('../public/data/bf6-stats-history.json', import.meta.url));
  await mkdir(fileURLToPath(new URL('../public/data/', import.meta.url)), { recursive: true });
  await writeFile(destination + '.tmp', JSON.stringify(exported.history) + '\n');
  await rename(destination + '.tmp', destination);
  if (rows.length) await writeSnapshot(exported.snapshot);
  console.log('Exported ' + rows.length + ' daily readings.');
}

async function main() {
  const command = process.argv[2];
  if (!['init', 'sync', 'export'].includes(command)) throw new Error('Usage: neon-history.mjs init|sync|export');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; use a GitHub Actions secret or local environment.');
  const { neon, neonConfig } = await import('@neondatabase/serverless');
  neonConfig.fetchFunction = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) });
  const sql = neon(process.env.DATABASE_URL);
  if (command === 'init') {
    const schema = await readFile(new URL('../database/001-bf6-history.sql', import.meta.url), 'utf8');
    await sql.query(schema);
    console.log('History schema ready.');
    return;
  }
  if (command === 'sync') await saveSnapshots(sql, await captureSnapshots());
  await exportHistory(sql);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(() => {
    // Driver errors can include connection details; do not print credentials to CI logs.
    console.error('Neon history failed. Check DATABASE_URL, the initialized schema and the statistics API. No connection details logged.');
    process.exitCode = 1;
  });
}
