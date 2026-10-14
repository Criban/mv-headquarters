import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/app/services/bf6-stats-history.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { compareDailyStats, getDailyStatsHistory, setSharedStatsHistory, removeLegacyStatsHistory } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const initial = { killDeath: 2, hoursPlayed: 10, matchesPlayed: 538, accuracy: 25, shotsFired: 2000 };
const update = { ...initial, killDeath: 1.9, matchesPlayed: 540, accuracy: 26, shotsFired: 2100 };
const snapshot = (savedAt, values = initial) => ({ savedAt, values });
const entries = new Map([
  ['bf6-stats-history:v1:MV-Criban', '{}'],
  ['bf6-stats-history:v2:MV-Criban', '{}'],
  ['bf6-stats-history:v2:MV-8lackh4wk', '{}'],
  ['holydex-ratings', 'preserve'], ['bf6-settings', 'preserve']
]);
const storage = { get length() { return entries.size; }, key: index => [...entries.keys()][index] ?? null, removeItem: key => entries.delete(key) };
removeLegacyStatsHistory(storage);
assert.deepEqual([...entries.keys()], ['holydex-ratings', 'bf6-settings'], 'Only legacy BF6 history is deleted');
removeLegacyStatsHistory(storage);
assert.equal(entries.size, 2, 'Cleanup is repeatable');
assert.doesNotThrow(() => removeLegacyStatsHistory({ get length() { throw new Error('Blocked'); } }));
assert.doesNotThrow(() => removeLegacyStatsHistory({ length: 1, key: () => 'bf6-stats-history:v2:A', removeItem() { throw new Error('Blocked'); } }));

const published = { version: 2, players: { A: [
  snapshot('2026-10-03T10:00:00Z'), snapshot('2026-10-02T10:00:00Z'), snapshot('2026-10-02T11:00:00Z', update),
  snapshot('2026-10-04T10:00:00Z'), snapshot('invalid'), { ...snapshot('2026-10-01T10:00:00Z'), source: 'demo' },
  snapshot('2026-10-01T10:00:00Z', { killDeath: 0, hoursPlayed: 0, matchesPlayed: 0, accuracy: 0, shotsFired: 0 })
] } };
setSharedStatsHistory(published);
const now = new Date('2026-10-03T12:00:00Z');
assert.deepEqual(getDailyStatsHistory('A', now).map(reading => reading.values.killDeath), [1.9, 2]);
assert.deepEqual(compareDailyStats('A', initial, now).baseline.values, update);
assert.equal(compareDailyStats('B', initial, now).baseline, null, 'Players remain isolated');
assert.equal(compareDailyStats('A', { ...initial, capturedAt: '2026-10-01T10:00:00Z' }, now), null, 'Fallback readings have no misleading comparison');
const before = JSON.stringify(getDailyStatsHistory('A', now));
compareDailyStats('A', update, now);
assert.equal(JSON.stringify(getDailyStatsHistory('A', now)), before, 'Live requests never create or overwrite historical days');
assert.deepEqual(compareDailyStats('A', initial, new Date('2026-10-09T10:00:00Z')).baseline.values, initial);
Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('No browser storage'); } });
assert.deepEqual(compareDailyStats('A', initial, now).baseline.values, update, 'Shared comparisons need no localStorage');
delete globalThis.localStorage;

setSharedStatsHistory({ version: 2, players: { DST: [snapshot('2026-10-25T00:30:00Z'), snapshot('2026-10-25T01:30:00Z', update)] } });
assert.equal(getDailyStatsHistory('DST', new Date('2026-10-26T00:00:00Z')).length, 1);
setSharedStatsHistory({ version: 2, players: { Midnight: [snapshot('2026-10-02T21:59:00Z'), snapshot('2026-10-02T22:00:00Z', update)] } });
assert.equal(getDailyStatsHistory('Midnight', now).length, 2);
assert.deepEqual(compareDailyStats('Midnight', update, new Date('2026-10-02T22:01:00Z')).baseline.values, initial);
setSharedStatsHistory({ version: 2, players: {} });
assert.deepEqual(getDailyStatsHistory('A', now), []);

const chartSource = await readFile(new URL('../src/app/profile-card/kd-history-chart.ts', import.meta.url), 'utf8');
const chartCompiled = ts.transpileModule(chartSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { kdHistoryChart, kdHistoryReadings, historyDateKey } = await import(`data:text/javascript;base64,${Buffer.from(chartCompiled).toString('base64')}`);
assert.deepEqual(kdHistoryChart([]).points, []);
const single = kdHistoryChart([{ savedAt: '2026-10-01T10:00:00Z', values: initial }]);
assert.equal(single.points[0].x, 360, 'One reading is centered');
assert.ok(Number.isFinite(single.points[0].y));
const plot = kdHistoryChart([1, 2, 5].map((day, index) => ({ savedAt: `2026-10-0${day}T10:00:00Z`, values: { ...initial, killDeath: [2, 0, 3][index] } })));
assert.deepEqual(plot.points.map(point => point.x), [64, 212, 656], 'Skipped days retain their actual time spacing');
assert.ok(plot.points[2].y < plot.points[0].y && plot.points[0].y < plot.points[1].y, 'Higher K/D plots above lower K/D');
assert.ok(plot.points.every(point => Number.isFinite(point.y) && point.y >= 32 && point.y <= 244));
assert.equal(kdHistoryChart([{ savedAt: '2026-10-01T10:00:00Z', values: { ...initial, killDeath: null } }]).points.length, 0);
assert.ok(kdHistoryChart([1, 2].map(day => ({ savedAt: `2026-10-0${day}T10:00:00Z`, values: { ...initial, killDeath: 0 } }))).points.every(point => Number.isFinite(point.y)), 'Constant zero readings have a valid scale');
const periodNow = new Date('2026-10-14T12:00:00Z');
const periodReadings = [
  snapshot('2025-10-31T12:00:00Z'), snapshot('2025-11-01T12:00:00Z'),
  snapshot('2026-09-14T21:59:00Z'), snapshot('2026-09-14T22:00:00Z'),
  snapshot('2026-09-30T21:30:00Z'), snapshot('2026-09-30T22:30:00Z'),
  snapshot('2026-10-14T10:00:00Z'), snapshot('2026-10-15T10:00:00Z'),
  snapshot('2026-10-14T11:00:00Z', { ...initial, killDeath: null }), snapshot('invalid')
];
const originalReadings = JSON.stringify(periodReadings);
assert.deepEqual(kdHistoryReadings(periodReadings, '30', null, periodNow).map(r => r.savedAt), [
  '2026-09-14T22:00:00Z', '2026-09-30T21:30:00Z', '2026-09-30T22:30:00Z', '2026-10-14T10:00:00Z'
], '30 calendar days include Berlin midnight and exclude old, future and invalid values');
assert.deepEqual(kdHistoryReadings([...periodReadings].reverse(), 'year', null, periodNow).map(r => r.savedAt), [
  '2025-11-01T12:00:00Z', '2026-09-30T21:30:00Z', '2026-10-14T10:00:00Z'
], 'Year includes current and previous eleven months, picking the newest valid value per Berlin month');
assert.equal(kdHistoryReadings(periodReadings, 'all', null, periodNow).length, 4, 'All retains older months');
assert.equal(kdHistoryReadings(periodReadings, 'all', '2026-09', periodNow).length, 3, 'Month detail restores every saved day in that Berlin month');
assert.equal(JSON.stringify(periodReadings), originalReadings, 'Aggregation preserves source history');
assert.equal(historyDateKey('2026-09-30T22:30:00Z'), '2026-10-01');
assert.deepEqual(kdHistoryReadings([], 'year', null, periodNow), []);
const yearReadings = Array.from({ length: 24 }, (_, i) => snapshot(new Date(Date.UTC(2025, i, 15, 12)).toISOString()));
assert.equal(kdHistoryReadings(yearReadings, 'year', null, new Date('2026-12-31T12:00:00Z')).length, 12);
console.log('PASS shared daily history, comparisons, fallback, Berlin midnight/DST, selective legacy cleanup, K/D chart and period aggregation.');
