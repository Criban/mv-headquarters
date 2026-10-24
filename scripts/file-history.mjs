import { readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { captureSnapshots, writeSnapshot } from './snapshot-bf6.mjs';

const metrics = ['killDeath', 'hoursPlayed', 'matchesPlayed', 'accuracy', 'shotsFired'];
const counter = value => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};
const dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
const day = value => dayFormat.format(new Date(value));

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
    shotsFired: number(response.weaponGroups?.find(group => group.id === 'wp_temp')?.shotsFired),
    // BF6 infantryKillDeath is human kills / deaths, not total kills / deaths.
    kills: counter(response.dividedKills?.human), deaths: counter(response.deaths)
  };
  if (killDeath === 0 && !(values.hoursPlayed > 0) && !(values.matchesPlayed > 0)) throw new Error('Empty reading');
  return { savedAt: new Date(player.capturedAt).toISOString(), values };
}

export function validateReading(reading) {
  if (!reading || reading.source === 'demo' || typeof reading.savedAt !== 'string' || !Number.isFinite(Date.parse(reading.savedAt))) throw new Error('Invalid history date');
  if (!reading.values || metrics.some(key => reading.values[key] !== null && (typeof reading.values[key] !== 'number' || !Number.isFinite(reading.values[key]) || reading.values[key] < 0))) throw new Error('Invalid history metrics');
  if (reading.values.killDeath === null || (reading.values.accuracy !== null && reading.values.accuracy > 100)) throw new Error('Invalid K/D or accuracy');
  const values = Object.fromEntries(metrics.map(key => [key, reading.values[key]]));
  for (const key of ['kills', 'deaths']) if (Object.hasOwn(reading.values, key)) {
    if (reading.values[key] !== null && counter(reading.values[key]) !== reading.values[key]) throw new Error('Invalid history counter');
    values[key] = reading.values[key];
  }
  return { savedAt: new Date(reading.savedAt).toISOString(), values };
}

/** Retain the latest actual reading per player and Berlin calendar day. */
export function mergeHistory(history, snapshot, now = new Date()) {
  if (history?.version !== 2 || !history.players || typeof history.players !== 'object' || Array.isArray(history.players)) throw new Error('Invalid history file');
  if (!snapshot?.players || typeof snapshot.players !== 'object' || Array.isArray(snapshot.players)) throw new Error('Invalid snapshot');
  const players = Object.create(null);
  const names = new Set([...Object.keys(history.players), ...Object.keys(snapshot.players)]);
  for (const name of names) {
    const previous = history.players[name] ?? [];
    if (!Array.isArray(previous)) throw new Error('Invalid player history');
    const readings = previous.map(validateReading);
    if (Object.hasOwn(snapshot.players, name)) readings.push(normalizeReading(snapshot.players[name]));
    const days = new Map();
    for (const reading of readings.sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))) {
      if (Date.parse(reading.savedAt) > now.getTime()) throw new Error('Future history reading');
      days.set(day(reading.savedAt), reading);
    }
    players[name] = [...days.values()];
  }
  return { version: 2, generatedAt: now.toISOString(), players };
}

async function main() {
  const destination = new URL('../public/data/bf6-stats-history.json', import.meta.url);
  // Fail on missing/corrupt history instead of discarding existing days.
  const history = JSON.parse(await readFile(destination, 'utf8'));
  const snapshot = await captureSnapshots();
  const next = mergeHistory(history, snapshot);
  await writeSnapshot(snapshot);
  const temporary = new URL(destination.href + '.tmp');
  await writeFile(temporary, JSON.stringify(next) + '\n');
  await rename(temporary, destination);
  console.log('Saved shared daily history to public/data/bf6-stats-history.json');
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => { console.error('History capture failed:', error.message); process.exitCode = 1; });
}
