import { AfterViewInit, Component, computed, ElementRef, input, OnDestroy, output, signal, viewChild } from '@angular/core';
import type { StatsSnapshot } from '../services/bf6-stats-history';
import { combatHistoryChart, combatHistoryReadings, formatKdImpact, historyDateKey, type CombatReading, type KdHistoryPeriod } from './kd-history-chart';

@Component({
  selector: 'app-kd-history',
  standalone: true,
  templateUrl: './kd-history.component.html',
  styleUrl: './kd-history.component.css'
})
export class KdHistoryComponent implements AfterViewInit, OnDestroy {
  readonly name = input.required<string>();
  readonly snapshots = input.required<StatsSnapshot[]>();
  readonly closed = output<void>();
  readonly periods = [{ value: '30', label: '30 Tage' }, { value: 'year', label: '1 Jahr' }, { value: 'all', label: 'Alles' }] as const;
  readonly period = signal<KdHistoryPeriod>('30');
  readonly month = signal<string | null>(null);
  readonly monthly = computed(() => this.period() !== '30' && this.month() === null);
  readonly combatReadings = computed(() => combatHistoryReadings(this.snapshots(), this.period(), this.month()));
  readonly chartWidth = signal(720);
  readonly chart = computed(() => combatHistoryChart(this.combatReadings(), this.chartWidth()));
  readonly hasCombat = computed(() => this.combatReadings().some(reading => reading.validDays > 0));
  readonly selectedIndex = signal<number | null>(null);
  readonly index = computed(() => Math.min(this.selectedIndex() ?? this.chart().points.length - 1, this.chart().points.length - 1));
  readonly selected = computed(() => this.chart().points[this.index()]);
  readonly axisLabels = computed(() => {
    const points = this.chart().points;
    const labels: typeof points = [];
    for (const point of points) if (!labels.length || point.x - labels.at(-1)!.x >= 84) labels.push(point);
    const last = points.at(-1);
    if (last && labels.at(-1) !== last) {
      if (labels.length > 1 && last.x - labels.at(-1)!.x < 84) labels.pop();
      if (!labels.length || last.x - labels.at(-1)!.x >= 60) labels.push(last);
    }
    return labels.map(point => ({ x: point.x, label: this.monthly() ? this.axisMonthFormat.format(new Date(point.savedAt)) : this.shortDate(point.savedAt) }));
  });
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly numberFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  private readonly dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
  private readonly shortDateFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' });
  private readonly monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });
  private readonly axisMonthFormat = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit', timeZone: 'Europe/Berlin' });

  private resizeObserver?: ResizeObserver;
  ngAfterViewInit(): void {
    this.dialog().nativeElement.showModal();
    this.resizeObserver = new ResizeObserver(([entry]) => this.chartWidth.set(Math.max(240, Math.round(entry.contentRect.width))));
    this.resizeObserver.observe(this.dialog().nativeElement);
  }
  ngOnDestroy(): void { this.resizeObserver?.disconnect(); }
  close(): void { this.dialog().nativeElement.close(); }
  selectPeriod(period: KdHistoryPeriod): void {
    this.period.set(period);
    this.month.set(null);
    this.selectedIndex.set(null);
  }
  openMonth(): void {
    const point = this.selected();
    if (!this.monthly() || !point) return;
    this.month.set(historyDateKey(point.savedAt).slice(0, 7));
    this.selectedIndex.set(null);
  }
  openPointMonth(event: MouseEvent): void { this.selectPoint(event); this.openMonth(); }
  backToOverview(): void { this.month.set(null); this.selectedIndex.set(null); }
  dismissBackdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const rect = this.dialog().nativeElement.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.close();
  }
  selectPoint(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * this.chartWidth();
    const points = this.chart().points;
    if (!points.length) return;
    this.selectedIndex.set(points.reduce((nearest, point, index) => Math.abs(point.x - x) < Math.abs(points[nearest].x - x) ? index : nearest, 0));
  }
  selectSlider(event: Event): void { this.selectedIndex.set(Number((event.target as HTMLInputElement).value)); }
  formatValue(value: number | null): string { return value === null ? '—' : this.numberFormat.format(value); }
  formatCount(value: number | null): string { return value === null ? '—' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value); }
  selectedValue(): string { return this.formatValue(this.selected()?.value ?? null); }
  impactText(reading: CombatReading): string {
    const text = formatKdImpact(reading.impact);
    return text ? `${text} ${this.monthly() ? 'zum vorherigen Monatsstand' : 'zum vorherigen gespeicherten Stand'}${reading.impact.exact ? '' : ' (gerundet)'}` : '';
  }
  formatDate(value: string): string { return this.dateFormat.format(new Date(value)); }
  shortDate(value: string): string { return this.shortDateFormat.format(new Date(value)); }
  formatMonth(value: string): string { return this.monthFormat.format(new Date(value)); }
}
