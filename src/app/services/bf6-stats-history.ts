import type { Bf6Stats } from './bf6-stats.service';

export const HISTORY_METRICS = ['killDeath', 'hoursPlayed', 'matchesPlayed', 'accuracy', 'shotsFired'] as const;
export type HistoryMetric = typeof HISTORY_METRICS[number];
type Values = Record<HistoryMetric, number | null>;
export type StatsSnapshot = { savedAt: string; values: Values };
export type StatsComparison = { baseline: StatsSnapshot | null; savedAt: string };
type LegacyStorage = Pick<Storage, 'length' | 'key' | 'removeItem'>;

const sharedHistory = new Map<string, StatsSnapshot[]>();

/** Load the published server history; it never writes browser data to the server. */
export function setSharedStatsHistory(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const history = value as { version?: unknown; players?: Record<string, unknown> };
  if (history.version !== 2 || !history.players || typeof history.players !== 'object' || Array.isArray(history.players)) return;
  sharedHistory.clear();
  for (const [name, readings] of Object.entries(history.players)) {
    if (Array.isArray(readings)) sharedHistory.set(name, readings.filter(validSnapshot));
  }
}

function validSnapshot(value: unknown): value is StatsSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as StatsSnapshot;
  // Remove test snapshots persisted by the former Criban demo.
  return (value as { source?: unknown }).source !== 'demo'
    && typeof snapshot.savedAt === 'string' && Number.isFinite(Date.parse(snapshot.savedAt))
    && !!snapshot.values
    && (snapshot.values.killDeath !== 0 || (snapshot.values.hoursPlayed ?? 0) > 0 || (snapshot.values.matchesPlayed ?? 0) > 0)
    && HISTORY_METRICS.every(key => snapshot.values[key] === null
      || (typeof snapshot.values[key] === 'number' && Number.isFinite(snapshot.values[key]) && snapshot.values[key]! >= 0));
}

function calendarDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Retire only the old BF6 history keys, preserving other data on this origin. */
export function removeLegacyStatsHistory(storage?: LegacyStorage): void {
  try {
    const target = storage ?? globalThis.localStorage;
    const keys: string[] = [];
    for (let index = 0; index < target.length; index++) {
      const key = target.key(index);
      if (key?.startsWith('bf6-stats-history:v1:') || key?.startsWith('bf6-stats-history:v2:')) keys.push(key);
    }
    for (const key of keys) target.removeItem(key);
  } catch { /* Restricted browser storage must not prevent the page from loading. */ }
}

/** Read the published daily history; live browser requests never change it. */
export function getDailyStatsHistory(name: string, now = new Date()): StatsSnapshot[] {
  const daily = new Map<string, StatsSnapshot>();
  for (const snapshot of [...(sharedHistory.get(name) ?? [])].sort((a, b) => Date.parse(a.savedAt) - Date.parse(b.savedAt))) {
    if (Date.parse(snapshot.savedAt) <= now.getTime()) daily.set(calendarDay(new Date(snapshot.savedAt)), snapshot);
  }
  return [...daily.values()];
}

/** Compare live statistics with the latest published day before today. */
export function compareDailyStats(name: string, stats: Bf6Stats, now = new Date()): StatsComparison | null {
  // A bundled API fallback must not report changes against a newer daily reading.
  if (stats.capturedAt || (stats.killDeath === 0 && !(stats.hoursPlayed && stats.hoursPlayed > 0) && !(stats.matchesPlayed && stats.matchesPlayed > 0))) return null;
  const baseline = getDailyStatsHistory(name, now).filter(snapshot => calendarDay(new Date(snapshot.savedAt)) < calendarDay(now)).at(-1) ?? null;
  return { baseline, savedAt: now.toISOString() };
}
