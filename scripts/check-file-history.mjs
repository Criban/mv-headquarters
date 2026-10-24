import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeReading, validateReading, mergeHistory } from './file-history.mjs';

const bundled = JSON.parse(await readFile(new URL('../public/data/bf6-stats-snapshot.json', import.meta.url), 'utf8'));
const fixture = Object.values(bundled.players)[0];
const make = (capturedAt, response = {}) => ({ ...fixture, capturedAt, response: { ...fixture.response, ...response } });
const early = make('2026-10-01T10:00:00Z', { dividedKills: { human: 100 }, kills: 999, deaths: 50 });
const late = make('2026-10-02T10:00:00Z', { dividedKills: { human: 150 }, deaths: 75 });
const reading = normalizeReading(early);
assert.equal(reading.values.kills, 100, 'Human kills match the existing infantry K/D');
assert.equal(reading.values.deaths, 50);
assert.equal(normalizeReading(make(early.capturedAt, { dividedKills: undefined, kills: 999 })).values.kills, null, 'Never substitute total kills or derive kills from a rounded ratio');
assert.equal(normalizeReading(make(early.capturedAt, { dividedKills: { human: -1 }, deaths: 1.5 })).values.deaths, null);
assert.equal(normalizeReading(make(early.capturedAt, { accuracy: '25,4 %' })).values.accuracy, 25.4);
assert.throws(() => normalizeReading(make('invalid')));
assert.throws(() => normalizeReading(make(early.capturedAt, { infantryKillDeath: 0, secondsPlayed: 0, gameModeGroups: [] })));
assert.throws(() => validateReading({ ...reading, values: { ...reading.values, kills: -1 } }));

const empty = { version: 2, players: {} };
const first = mergeHistory(empty, { players: { A: early, B: early } }, new Date('2026-10-03'));
const original = JSON.stringify(first);
const next = mergeHistory(first, { players: { A: late } }, new Date('2026-10-03'));
assert.equal(JSON.stringify(first), original, 'Merges preserve input data');
assert.equal(next.players.A.length, 2);
assert.equal(next.players.B.length, 1, 'Players missing from a new capture keep their existing history');
assert.equal(mergeHistory(next, { players: { A: early } }, new Date('2026-10-03')).players.A.length, 2);
const newer = make('2026-10-02T12:00:00Z', { dividedKills: { human: 160 } });
const replaced = mergeHistory(next, { players: { A: newer } }, new Date('2026-10-03'));
assert.equal(replaced.players.A.length, 2);
assert.equal(replaced.players.A[1].values.kills, 160, 'Newest same-day capture replaces only that day');
assert.equal(mergeHistory(replaced, { players: { A: late } }, new Date('2026-10-03')).players.A[1].values.kills, 160, 'Older captures cannot overwrite newer values');
const midnight = mergeHistory(empty, { players: { A: make('2026-10-02T21:59:00Z') } }, new Date('2026-10-03'));
assert.equal(mergeHistory(midnight, { players: { A: make('2026-10-02T22:00:00Z') } }, new Date('2026-10-03')).players.A.length, 2);
const dst = mergeHistory(empty, { players: { A: make('2026-10-25T00:30:00Z') } }, new Date('2026-10-26'));
assert.equal(mergeHistory(dst, { players: { A: make('2026-10-25T01:30:00Z') } }, new Date('2026-10-26')).players.A.length, 1);
assert.throws(() => mergeHistory({ version: 2 }, { players: {} }));
assert.throws(() => mergeHistory(next, { players: { A: make('2027-01-01') } }, new Date('2026-10-03')));

const history = JSON.parse(await readFile(new URL('../public/data/bf6-stats-history.json', import.meta.url), 'utf8'));
const preserved = mergeHistory(history, { players: {} }, new Date());
for (const [name, readings] of Object.entries(history.players)) {
  assert.deepEqual(preserved.players[name], readings.map(validateReading), 'Existing published history remains complete');
  assert.ok(readings.length >= 21, 'All 21 published days per player are preserved');
}
console.log('PASS JSON history validation, human kill counters, same-day replacement, player isolation, Berlin midnight/DST and existing history preservation.');
