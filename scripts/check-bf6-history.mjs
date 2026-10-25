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
const { kdHistoryChart, kdHistoryReadings, historyDateKey, combatHistoryReadings, combatHistoryChart, formatKdImpact } = await import(`data:text/javascript;base64,${Buffer.from(chartCompiled).toString('base64')}`);
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

const counts = (savedAt, kills, deaths) => snapshot(savedAt, { ...initial, kills, deaths });
const combatSource = [
  counts('2026-09-30T21:00:00Z', 100, 50),
  counts('2026-10-01T21:00:00Z', 120, 60),
  counts('2026-10-02T21:00:00Z', 125, 60),
  counts('2026-10-03T21:00:00Z', 125, 60),
  counts('2026-10-05T21:00:00Z', 145, 70),
  counts('2026-10-06T21:00:00Z', 150, 80),
  counts('2026-10-07T21:00:00Z', 10, 5),
  counts('2026-10-08T21:00:00Z', 20, 10),
  counts('2026-10-09T21:00:00Z', undefined, 15),
  counts('2026-10-10T21:00:00Z', 30, 20)
];
const combatNow = new Date('2026-10-11T12:00:00Z');
const days = combatHistoryReadings(combatSource, '30', null, combatNow);
assert.deepEqual(days.map(r => r.kills), [null, 20, 5, 0, null, 5, null, 10, null, null]);
assert.deepEqual(days.map(r => r.value), Array(10).fill(2), 'The line uses the stored overall K/D, never the daily ratio');
assert.equal(days[2].state, 'value', 'Kills without new deaths retain the stored overall ratio');
assert.equal(days[3].state, 'inactive', 'Zero activity is distinct from zero K/D');
assert.equal(days[4].state, 'missing', 'Gaps cannot become misleading daily spikes');
assert.equal(days[6].state, 'missing', 'Counter resets are not negative daily values');
const monthlyCombat = combatHistoryReadings(combatSource, 'year', null, combatNow);
assert.equal(monthlyCombat[1].kills, 40);
assert.equal(monthlyCombat[1].deaths, 25);
assert.equal(monthlyCombat[1].value, 2, 'Monthly line uses the last overall K/D, not a monthly or daily ratio');
assert.equal(monthlyCombat[1].validDays, 5);
assert.equal(monthlyCombat[1].recordedDays, 9);
assert.equal(combatHistoryReadings(combatSource, 'all', '2026-10', combatNow)[0].kills, 20, 'Month detail uses a baseline outside the month');
const windowReadings = [counts('2026-09-14T12:00:00Z', 100, 50), counts('2026-09-15T12:00:00Z', 110, 55)];
assert.equal(combatHistoryReadings(windowReadings, '30', null, periodNow)[0].kills, 10, 'The first visible day uses its baseline outside the 30-day window');
const dstDays = combatHistoryReadings([counts('2026-10-24T21:30:00Z', 10, 5), counts('2026-10-25T22:30:00Z', 20, 10)], '30', null, new Date('2026-10-26T12:00:00Z'));
assert.equal(dstDays[1].kills, 10, '25-hour DST days are consecutive calendar days');
const duplicateDays = combatHistoryReadings([combatSource[0], combatSource[1], counts('2026-10-01T21:30:00Z', 130, 65)], '30', null, combatNow);
assert.equal(duplicateDays.length, 2);
assert.equal(duplicateDays[1].kills, 30, 'Newest same-day reading supplies the daily difference');
const combatPlot = combatHistoryChart(days);
assert.equal(combatPlot.lines.length, 1, 'Missing daily counters do not remove recorded overall K/D values');
assert.ok(combatPlot.points.filter(p => p.value !== null).every(p => Number.isFinite(p.y) && p.y >= 32 && p.y <= 244));
assert.ok(combatPlot.points.filter(p => p.kills !== null).every(p => p.killsY >= 32 && p.killsY <= 244));
assert.deepEqual(combatHistoryChart([]).points, []);
assert.equal(combatHistoryChart([days[1]]).points[0].x, 360);
assert.equal(combatHistoryReadings([snapshot('2026-10-01T12:00:00Z'), snapshot('2026-10-02T12:00:00Z')], '30', null, combatNow).every(r => r.kills === null), true, 'Legacy K/D never invents historical kills');
setSharedStatsHistory({ version: 2, players: { A: [counts('2026-10-01T12:00:00Z', 100, 50), counts('2026-10-02T12:00:00Z', -1, 60)] } });
assert.equal(getDailyStatsHistory('A', now).length, 1, 'Invalid counters cannot enter the shared chart');
assert.equal(combatHistoryReadings([counts('2026-10-01T12:00:00Z', 100, 50), snapshot('2026-10-02T12:00:00Z', { ...initial, killDeath: 2.34, kills: 150, deaths: 60 })], '30', null, combatNow)[1].value, 2.34, 'A daily ratio of 5 cannot replace the overall K/D of 2.34');
console.log('PASS daily combat counts with overall K/D, monthly sums, baselines, gaps, resets, zero deaths, inactivity, deduplication and DST.');

const smallChanges = combatHistoryChart([2, 2.01, 1.99, 2.02].map((value, i) => ({ ...days[i], value })));
const lineYs = smallChanges.points.map(p => p.y);
assert.ok(Math.max(...lineYs) - Math.min(...lineYs) > 60, 'Small overall K/D changes use a visible part of the plot');
assert.ok(smallChanges.ticks.at(-1).value > 0, 'K/D axis zooms into the observed range');
assert.equal(smallChanges.ticks.at(-1).count, 0, 'Count axis keeps its zero baseline');
assert.ok(smallChanges.points.every((p, i) => p.killsY === combatPlot.points[i].killsY), 'Zooming K/D does not change the count scale');
assert.ok(combatHistoryChart([0, 0].map((value, i) => ({ ...days[i], value }))).points.every(p => Number.isFinite(p.y) && p.y >= 32 && p.y <= 244));
assert.ok(combatHistoryChart([days[1]]).points.every(p => Number.isFinite(p.y) && p.y > 32 && p.y < 244), 'A constant K/D retains padding');
console.log('PASS adaptive K/D axis, visible small changes, independent count baseline and constant/zero ratios.');

const impactSource = [
  counts('2026-09-30T12:00:00Z', 2000, 1000),
  counts('2026-10-01T12:00:00Z', 2101, 1050),
  counts('2026-10-02T12:00:00Z', 2200, 1100),
  counts('2026-10-03T12:00:00Z', 2300, 1150),
  counts('2026-10-05T12:00:00Z', 2400, 1200),
  counts('2026-10-06T12:00:00Z', 10, 5)
];
const impacts = combatHistoryReadings(impactSource, '30', null, combatNow);
assert.deepEqual(impacts.map(r => r.impact.direction), ['unknown', 'up', 'down', 'flat', 'flat', 'unknown']);
assert.ok(impacts[1].impact.delta > 0 && impacts[1].impact.delta < .001, 'Exact counters reveal an improvement hidden by two-digit K/D rounding');
assert.equal(impacts[1].impact.exact, true);
assert.equal(impacts[1].value, 2, 'Impact precision does not replace the stored overall line value');
assert.ok(formatKdImpact(impacts[1].impact).startsWith('↑ +0,0010'));
assert.ok(formatKdImpact(impacts[2].impact).startsWith('↓ −'));
assert.equal(formatKdImpact(impacts[3].impact), '→ Unverändert');
assert.equal(formatKdImpact(impacts[4].impact), '→ Unverändert', 'Line direction compares saved overall ratios even across an unrecorded day');
assert.equal(impacts[4].kills, null, 'A line comparison across a gap cannot create a daily bar');
assert.equal(formatKdImpact(impacts[5].impact), '', 'No attribution after counter resets');
assert.ok(formatKdImpact({ direction: 'up', delta: .000001, exact: true }).includes('< 0,0001'), 'Tiny changes never display as positive zero');
const legacyImpact = combatHistoryReadings([snapshot('2026-10-01T12:00:00Z'), snapshot('2026-10-02T12:00:00Z', update)], '30', null, combatNow)[1].impact;
assert.equal(legacyImpact.direction, 'down');
assert.equal(legacyImpact.exact, false, 'Legacy comparisons are explicitly based on rounded saved K/D');
const colored = combatHistoryChart(impacts).coloredSegments;
assert.deepEqual(colored.map(s => s.direction), ['up', 'down', 'flat', 'flat', 'unknown']);
const monthImpact = combatHistoryReadings(impactSource.slice(0, 4), 'year', null, combatNow)[1].impact;
assert.equal(monthImpact.direction, 'flat', 'Monthly direction compares month-end cumulative ratios, not the last daily impact');
const boundaryImpact = combatHistoryReadings(impactSource, 'all', '2026-10', combatNow)[0].impact;
assert.equal(boundaryImpact.direction, 'up', 'A month detail uses the actual preceding day outside its filter');
console.log('PASS subtle line directions, precise cumulative impacts, rounded legacy comparisons, monthly baselines, gaps and resets.');

const gapReadings = combatHistoryReadings([19, 21, 23, 25].map((day, index) => snapshot(`2026-10-${day}T12:00:00Z`, { ...initial, killDeath: [2.01, 2, 2.02, 2.02][index] })), '30', null, new Date('2026-10-26T12:00:00Z'));
assert.deepEqual(combatHistoryChart(gapReadings).coloredSegments.map(s => s.direction), ['down', 'up', 'flat'], 'Criban 19–21 October decline is red despite the missing 20 October reading');
assert.ok(gapReadings.every(r => r.kills === null && r.deaths === null), 'Missing days still leave the daily bars empty');
console.log('PASS red, green and neutral line segments across gaps without fabricated daily counts.');
