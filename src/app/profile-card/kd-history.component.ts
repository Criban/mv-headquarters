import { AfterViewInit, Component, computed, ElementRef, input, output, signal, viewChild } from '@angular/core';
import type { StatsSnapshot } from '../services/bf6-stats-history';
import { historyDateKey, kdHistoryChart, kdHistoryReadings, type KdHistoryPeriod } from './kd-history-chart';

@Component({
  selector: 'app-kd-history',
  standalone: true,
  templateUrl: './kd-history.component.html',
  styleUrl: './kd-history.component.css'
})
export class KdHistoryComponent implements AfterViewInit {
  readonly name = input.required<string>();
  readonly snapshots = input.required<StatsSnapshot[]>();
  readonly closed = output<void>();
  readonly periods = [{ value: '30', label: '30 Tage' }, { value: 'year', label: '1 Jahr' }, { value: 'all', label: 'Alles' }] as const;
  readonly period = signal<KdHistoryPeriod>('30');
  readonly month = signal<string | null>(null);
  readonly monthly = computed(() => this.period() !== '30' && this.month() === null);
  readonly chart = computed(() => kdHistoryChart(kdHistoryReadings(this.snapshots(), this.period(), this.month())));
  readonly selectedIndex = signal<number | null>(null);
  readonly index = computed(() => Math.min(this.selectedIndex() ?? this.chart().points.length - 1, this.chart().points.length - 1));
  readonly selected = computed(() => this.chart().points[this.index()]);
  readonly axisLabels = computed(() => {
    const points = this.chart().points;
    const stride = Math.max(1, Math.ceil((points.length - 1) / 5));
    return points.filter((_, index) => index % stride === 0 || index === points.length - 1)
      .map(point => ({ x: point.x, label: this.monthly() ? this.axisMonthFormat.format(new Date(point.savedAt)) : this.shortDate(point.savedAt) }));
  });
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly numberFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  private readonly dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
  private readonly shortDateFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' });
  private readonly monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' });
  private readonly axisMonthFormat = new Intl.DateTimeFormat('de-DE', { month: 'short', year: '2-digit', timeZone: 'Europe/Berlin' });

  ngAfterViewInit(): void { this.dialog().nativeElement.showModal(); }
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
    const x = (event.clientX - rect.left) / rect.width * 720;
    const points = this.chart().points;
    if (!points.length) return;
    this.selectedIndex.set(points.reduce((nearest, point, index) => Math.abs(point.x - x) < Math.abs(points[nearest].x - x) ? index : nearest, 0));
  }
  selectSlider(event: Event): void { this.selectedIndex.set(Number((event.target as HTMLInputElement).value)); }
  formatValue(value: number): string { return this.numberFormat.format(value); }
  formatDate(value: string): string { return this.dateFormat.format(new Date(value)); }
  shortDate(value: string): string { return this.shortDateFormat.format(new Date(value)); }
  formatMonth(value: string): string { return this.monthFormat.format(new Date(value)); }
}
