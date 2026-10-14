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
