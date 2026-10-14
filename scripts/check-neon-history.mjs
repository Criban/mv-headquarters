import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeReading, buildExports, saveSnapshots } from './neon-history.mjs';

const bundled = JSON.parse(await readFile(new URL('../public/data/bf6-stats-snapshot.json', import.meta.url), 'utf8'));
const fixture = Object.values(bundled.players)[0];
const early = { ...fixture, capturedAt: '2026-10-01T10:00:00Z' };
const late = { ...fixture, capturedAt: '2026-10-02T10:00:00Z' };
const reading = normalizeReading(late);
assert.equal(reading.values.killDeath, Number(fixture.response.infantryKillDeath));
assert.equal(reading.values.hoursPlayed, Number(fixture.response.secondsPlayed) / 3600);
assert.equal(normalizeReading({ ...late, response: { infantryKillDeath: 2, accuracy: '25,4 %' } }).values.accuracy, 25.4);
assert.equal(normalizeReading({ ...late, response: { infantryKillDeath: 2 } }).values.matchesPlayed, null);
assert.equal(normalizeReading({ ...late, response: { infantryKillDeath: 2, accuracy: 101 } }).values.accuracy, null);
assert.throws(() => normalizeReading({ ...late, capturedAt: 'invalid' }));
assert.throws(() => normalizeReading({ ...late, response: { infantryKillDeath: 0, secondsPlayed: 0 } }));
const rows = [{ player_name: 'A', snapshot: late }, { player_name: 'B', snapshot: early }, { player_name: 'A', snapshot: early }, { player_name: 'A', snapshot: { ...late, capturedAt: '2027-01-01T00:00:00Z' } }];
const exported = buildExports(rows, new Date('2026-10-03T00:00:00Z'));
assert.equal(exported.history.players.A.length, 2);
assert.deepEqual(exported.history.players.A.map(row => row.savedAt), ['2026-10-01T10:00:00.000Z', '2026-10-02T10:00:00.000Z']);
assert.deepEqual(exported.snapshot.players.A, late);
assert.equal(exported.history.players.B.length, 1);
assert.equal(Object.keys(buildExports([]).snapshot.players).length, 0);
let transactions = 0;
const sql = (parts, ...parameters) => ({ text: parts.join('?'), parameters });
sql.transaction = async queries => { transactions++; assert.equal(queries.length, 2); };
await saveSnapshots(sql, { players: { A: early, B: late } });
assert.equal(transactions, 1);
await assert.rejects(saveSnapshots(sql, { players: { A: early, B: { ...late, capturedAt: 'invalid' } } }));
assert.equal(transactions, 1, 'All readings are validated before the atomic write');
console.log('Neon normalization, atomic capture and export checks passed.');

const imported = JSON.parse(await readFile(new URL('../database/imports/browser-history.json', import.meta.url), 'utf8'));
const importedRows = imported.players['MV-8lackh4wk'].map(reading => ({ player_name: 'MV-8lackh4wk', captured_at: reading.savedAt, metrics: reading.values, snapshot: null }));
const historyOnly = buildExports(importedRows, new Date('2026-10-15T00:00:00Z'));
assert.equal(historyOnly.history.players['MV-8lackh4wk'].length, 12);
assert.deepEqual(historyOnly.history.players['MV-8lackh4wk'], imported.players['MV-8lackh4wk']);
assert.equal(Object.keys(historyOnly.snapshot.players).length, 0, 'Imported metrics never create fake API fallback data');
console.log('Imported browser history exports all twelve actual days.');

for (const [name, snapshots] of Object.entries(imported.players)) {
  assert.equal(snapshots.length, 12);
  const rows = snapshots.map(reading => ({ player_name: name, captured_at: reading.savedAt, metrics: reading.values, snapshot: null }));
  assert.deepEqual(buildExports(rows, new Date('2026-10-15T00:00:00Z')).history.players[name], snapshots);
}
assert.equal(imported.players['MV-Criban'][0].values.killDeath, 2.02, 'Criban uses the genuine v2 history');
assert.ok(imported.players['MV-54bI44'].every(reading => reading.values.killDeath === 3.05));
assert.equal(Object.values(imported.players).flat().length, 36);
console.log('All 36 supplied readings retain their player identities and values.');
