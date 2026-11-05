import type { StatsSnapshot } from '../services/bf6-stats-history';

export type KdHistoryPeriod = '30' | 'year' | 'all';
const berlinDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

export function historyDateKey(savedAt: string | Date): string {
  return berlinDate.format(new Date(savedAt));
}

export function kdHistoryReadings(snapshots: StatsSnapshot[], period: KdHistoryPeriod, month: string | null = null, now = new Date()): StatsSnapshot[] {
  const today = historyDateKey(now);
  const cutoff = new Date(`${today}T12:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 29);
  const firstDay = cutoff.toISOString().slice(0, 10);
  const firstMonth = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 12, 1)).toISOString().slice(0, 7);
  const readings = snapshots.filter(snapshot => Number.isFinite(Date.parse(snapshot.savedAt))
    && typeof snapshot.values.killDeath === 'number' && Number.isFinite(snapshot.values.killDeath) && snapshot.values.killDeath >= 0)
    .sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))
    .filter(snapshot => {
      const day = historyDateKey(snapshot.savedAt);
      if (day > today) return false;
      if (month) return day.slice(0, 7) === month;
      return period === 'all' || (period === '30' ? day >= firstDay : day.slice(0, 7) >= firstMonth);
    });
  if (month || period === '30') return readings;
  const months = new Map<string, StatsSnapshot>();
  for (const reading of readings) months.set(historyDateKey(reading.savedAt).slice(0, 7), reading);
  return [...months.values()];
}

export function kdHistoryChart(snapshots: StatsSnapshot[]) {
  const readings = snapshots.filter(snapshot => Number.isFinite(Date.parse(snapshot.savedAt)) && typeof snapshot.values.killDeath === 'number'
    && Number.isFinite(snapshot.values.killDeath) && snapshot.values.killDeath >= 0)
    .sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt));
  if (!readings.length) return { points: [], line: '', ticks: [] };
  const values = readings.map(snapshot => snapshot.values.killDeath!);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max((high - low) * .2, .05);
  const min = Math.max(0, Math.floor((low - padding) * 100) / 100);
  const max = Math.ceil((high + padding) * 100) / 100;
  const first = Date.parse(readings[0].savedAt);
  const last = Date.parse(readings.at(-1)!.savedAt);
  const points = readings.map(snapshot => ({
    savedAt: snapshot.savedAt, value: snapshot.values.killDeath!,
    x: last === first ? 360 : 64 + (Date.parse(snapshot.savedAt) - first) / (last - first) * 592,
    y: 244 - (snapshot.values.killDeath! - min) / (max - min) * 212
  }));
  return {
    points,
    line: points.map(point => `${point.x},${point.y}`).join(' '),
    ticks: [max, (min + max) / 2, min].map((value, index) => ({ value, y: 32 + index * 106 }))
  };
}

export type KdImpact = { direction: 'up' | 'down' | 'flat' | 'unknown'; delta: number | null; exact: boolean };
export type CombatReading = {
  savedAt: string; kills: number | null; deaths: number | null; value: number | null;
  state: 'value' | 'inactive' | 'missing'; validDays: number; recordedDays: number;
  impact: KdImpact;
};
const calendarTime = (savedAt: string) => Date.parse(historyDateKey(savedAt) + 'T12:00:00Z');
const validCounter = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const unknownImpact = (): KdImpact => ({ direction: 'unknown', delta: null, exact: false });

/** Compare cumulative ratios, never daily K/D against a rounded overall ratio. */
function kdImpact(current: StatsSnapshot, previous?: StatsSnapshot): KdImpact {
  if (!previous) return unknownImpact();
  const a = current.values, b = previous.values;
  const counters = validCounter(a.kills) && validCounter(a.deaths) && validCounter(b.kills) && validCounter(b.deaths);
  if (counters && (a.kills! < b.kills! || a.deaths! < b.deaths!)) return unknownImpact();
  const exact = counters && a.deaths! > 0 && b.deaths! > 0;
  const delta = exact ? a.kills! / a.deaths! - b.kills! / b.deaths! : a.killDeath! - b.killDeath!;
  if (Math.abs(delta) < 1e-12) return { direction: 'flat', delta: 0, exact };
  return { direction: delta > 0 ? 'up' : 'down', delta, exact };
}

export function formatKdImpact(impact: KdImpact): string {
  if (impact.delta === null) return '';
  if (impact.direction === 'flat') return '→ Unverändert';
  const arrow = impact.direction === 'up' ? '↑' : '↓';
  const sign = impact.direction === 'up' ? '+' : '−';
  const digits = impact.exact ? 4 : 2;
  if (Math.abs(impact.delta) < 10 ** -digits) return `${arrow} ${impact.direction === 'up' ? 'Verbessert' : 'Gesenkt'} (< ${(10 ** -digits).toLocaleString('de-DE', { maximumFractionDigits: digits })})`;
  return `${arrow} ${sign}${Math.abs(impact.delta).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** Differences are calculated before filtering so the first visible day can use its preceding day. */
export function combatHistoryReadings(snapshots: StatsSnapshot[], period: KdHistoryPeriod, month: string | null = null, now = new Date()): CombatReading[] {
  const days = new Map<string, StatsSnapshot>();
  for (const snapshot of [...snapshots].filter(s => Number.isFinite(Date.parse(s.savedAt)) && Date.parse(s.savedAt) <= now.getTime()
    && typeof s.values.killDeath === 'number' && Number.isFinite(s.values.killDeath) && s.values.killDeath >= 0)
    .sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))) days.set(historyDateKey(snapshot.savedAt), snapshot);
  const recorded = [...days.values()];
  const source: StatsSnapshot[] = [];
  for (const snapshot of recorded) {
    const previous = source.at(-1);
    if (previous) {
      for (let time = calendarTime(previous.savedAt) + 86400000; time < calendarTime(snapshot.savedAt); time += 86400000) {
        source.push({ savedAt: new Date(time).toISOString(), values: { ...previous.values } });
      }
    }
    source.push(snapshot);
  }
  const selected = kdHistoryReadings(source, period, month, now);
  const monthly = period !== '30' && !month;
  const keys = new Set(selected.map(s => historyDateKey(s.savedAt).slice(0, monthly ? 7 : 10)));
  const daily = source.map((snapshot, index): CombatReading => {
    const previous = source[index - 1];
    const current = snapshot.values;
    const before = previous?.values;
    const valid = !!previous && validCounter(current.kills) && validCounter(current.deaths)
      && validCounter(before?.kills) && validCounter(before?.deaths)
      && current.kills >= before.kills && current.deaths >= before.deaths;
    const kills = valid ? current.kills! - before!.kills! : null;
    const deaths = valid ? current.deaths! - before!.deaths! : null;
    return {
      savedAt: snapshot.savedAt, kills, deaths, value: snapshot.values.killDeath,
      state: !valid ? 'missing' : kills === 0 && deaths === 0 ? 'inactive' : 'value',
      validDays: valid ? 1 : 0, recordedDays: 1,
      impact: kdImpact(snapshot, previous)
    };
  }).filter(s => keys.has(historyDateKey(s.savedAt).slice(0, monthly ? 7 : 10)));
  if (!monthly) return daily;
  const groups = new Map<string, CombatReading[]>();
  for (const reading of daily) {
    const key = historyDateKey(reading.savedAt).slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), reading]);
  }
  const monthEnds = new Map<string, StatsSnapshot>();
  for (const snapshot of source) monthEnds.set(historyDateKey(snapshot.savedAt).slice(0, 7), snapshot);
  const allMonthEnds = [...monthEnds.values()];
  return [...groups.values()].map((readings): CombatReading => {
    const known = readings.filter(r => r.validDays);
    const kills = known.length ? known.reduce((sum, r) => sum + r.kills!, 0) : null;
    const deaths = known.length ? known.reduce((sum, r) => sum + r.deaths!, 0) : null;
    const monthEnd = monthEnds.get(historyDateKey(readings.at(-1)!.savedAt).slice(0, 7))!;
    const previousMonth = allMonthEnds[allMonthEnds.indexOf(monthEnd) - 1];
    return {
      savedAt: readings.at(-1)!.savedAt, kills, deaths, value: readings.at(-1)!.value,
      state: !known.length ? 'missing' : kills === 0 && deaths === 0 ? 'inactive' : 'value',
      validDays: known.length, recordedDays: readings.length,
      impact: kdImpact(monthEnd, previousMonth)
    };
  });
}

export function combatHistoryChart(readings: CombatReading[], width = 720) {
  const maxCount = Math.max(4, ...readings.flatMap(r => [r.kills ?? 0, r.deaths ?? 0]));
  const countMagnitude = 10 ** Math.floor(Math.log10(maxCount * 1.1 / 4));
  const countMax = Math.ceil(maxCount * 1.1 / 4 / countMagnitude) * countMagnitude * 4;
  const ratios = readings.flatMap(r => r.value === null ? [] : [r.value]);
  const ratioLow = ratios.length ? Math.min(...ratios) : 0;
  const ratioHigh = ratios.length ? Math.max(...ratios) : 0;
  // Zoom only the line axis; count bars always retain their zero baseline.
  // At least .02 padding keeps constant values and rounded API readings stable.
  const ratioPadding = Math.max((ratioHigh - ratioLow) * .2, .02);
  const ratioMin = Math.max(0, Math.floor((ratioLow - ratioPadding) * 100) / 100);
  const ratioMax = Math.ceil((ratioHigh + ratioPadding) * 100) / 100;
  const first = readings.length ? calendarTime(readings[0].savedAt) : 0;
  const last = readings.length ? calendarTime(readings.at(-1)!.savedAt) : 0;
  const points = readings.map(reading => ({ ...reading,
    x: last === first ? width / 2 : 80 + (calendarTime(reading.savedAt) - first) / (last - first) * (width - 160),
    y: reading.value === null ? null : 244 - (reading.value - ratioMin) / (ratioMax - ratioMin) * 212,
    killsY: reading.kills === null ? null : 244 - reading.kills / countMax * 212,
    deathsY: reading.deaths === null ? null : 244 - reading.deaths / countMax * 212
  }));
  const segments: string[] = [];
  let segment: string[] = [];
  for (const point of points) {
    if (point.y === null) { if (segment.length) segments.push(segment.join(' ')); segment = []; }
    else segment.push(`${point.x},${point.y}`);
  }
  if (segment.length) segments.push(segment.join(' '));
  const coloredSegments = points.slice(1).flatMap((point, index) => {
    const previous = points[index];
    if (previous.y === null || point.y === null) return [];
    return [{ points: `${previous.x},${previous.y} ${point.x},${point.y}`, direction: point.impact.direction, reading: point }];
  });
  const spacing = points.length > 1 ? Math.min(...points.slice(1).map((p, i) => p.x - points[i].x)) : 40;
  return { points, lines: segments, coloredSegments, barWidth: Math.min(14, spacing * .3),
    ticks: Array.from({ length: 5 }, (_, i) => ({ value: ratioMax - (ratioMax - ratioMin) * i / 4, count: countMax * (1 - i / 4), y: 32 + i * 53 })) };
}

/** Match the final segment of the default 30-day chart, without comparing fallback data. */
export function liveKdTrend(snapshots: StatsSnapshot[], stats: { killDeath: number; kills: number | null; deaths: number | null; hoursPlayed: number | null; matchesPlayed: number | null; accuracy: number | null; shotsFired: number | null; capturedAt?: string; source?: string }, now = new Date()): 'up' | 'down' | null {
  if (stats.capturedAt) {
    if (stats.source !== 'tracker.gg (manuell)' || historyDateKey(stats.capturedAt) !== historyDateKey(now)) return null;
    const readings = combatHistoryReadings(snapshots, '30', null, now);
    const last = readings.at(-1);
    const matching = snapshots.find(snapshot => snapshot.savedAt === stats.capturedAt);
    if (!last || last.savedAt !== stats.capturedAt || !matching || matching.values.kills !== stats.kills || matching.values.deaths !== stats.deaths) return null;
    const direction = last.impact.direction;
    return direction === 'up' || direction === 'down' ? direction : null;
  }
  if (stats.kills === null || stats.deaths === null) return null;
  const today = historyDateKey(now);
  const earlier = snapshots.filter(snapshot => historyDateKey(snapshot.savedAt) !== today);
  const current: StatsSnapshot = { savedAt: now.toISOString(), values: { killDeath: stats.killDeath, kills: stats.kills, deaths: stats.deaths, hoursPlayed: stats.hoursPlayed, matchesPlayed: stats.matchesPlayed, accuracy: stats.accuracy, shotsFired: stats.shotsFired } };
  const readings = combatHistoryReadings([...earlier, current], '30', null, now);
  if (readings.length < 2) return null;
  const direction = readings.at(-1)?.impact.direction;
  return direction === 'up' || direction === 'down' ? direction : null;
}
