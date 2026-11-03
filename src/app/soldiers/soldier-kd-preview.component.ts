import { Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap } from 'rxjs';
import { KdHistoryComponent } from '../profile-card/kd-history.component';
import { liveKdTrend } from '../profile-card/kd-history-chart';
import { KdTrendComponent } from '../profile-card/kd-trend.component';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import { Bf6StatsService, type Bf6Stats } from '../services/bf6-stats.service';
import { compareDailyStats, getDailyStatsHistory, type StatsSnapshot } from '../services/bf6-stats-history';

type PreviewState = { status: 'loading' | 'error' | 'private' } | { status: 'ready'; trend: 'up' | 'down' | null; value: string; savedAt: string | null; stats: Bf6Stats; change: number | null };

@Component({
  selector: 'app-soldier-kd-preview',
  standalone: true,
  imports: [KdHistoryComponent, KdTrendComponent],
  template: `
    <div class="kd-preview" [attr.aria-label]="'K/D für ' + player().name" [attr.aria-busy]="state().status === 'loading'">
      <span class="kd-label">K/D<small>KILLS / TODE</small></span>
      @switch (state().status) {
        @case ('loading') { <span class="kd-message" role="status">LÄDT …</span> }
        @case ('private') { <span class="kd-message">PRIVATES PROFIL</span> }
        @case ('error') { <button type="button" class="retry" (click)="retry()">NICHT VERFÜGBAR<br>ERNEUT LADEN ↻</button> }
        @case ('ready') { @if (state(); as ready) { @if (ready.status === 'ready') {
          <div class="kd-value"><div class="kd-number"><button type="button" class="history-button" aria-haspopup="dialog" [attr.aria-label]="'K/D-Verlauf für ' + player().name + ' öffnen, aktuelle K/D ' + ready.value + (ready.trend === 'up' ? ', K/D-Trend gestiegen' : ready.trend === 'down' ? ', K/D-Trend gesunken' : '')" (click)="openHistory(ready.stats)"><strong>{{ ready.value }}</strong><small class="history-hint">VERLAUF <app-kd-trend [direction]="ready.trend" /></small></button></div>
            @if (ready.savedAt) { <small class="saved" [attr.title]="'Gespeicherter Abzug vom ' + ready.savedAt + ' Uhr (Berlin)'">GESPEICHERT</small> }
            @if (ready.change !== null) { <span class="change" [class.negative]="ready.change < 0">({{ ready.change > 0 ? '+' : '−' }}{{ formatChange(ready.change) }})</span> }
          </div>
        } } }
      }
    </div>
    @if (history(); as snapshots) { <app-kd-history [name]="player().name" [snapshots]="snapshots" (closed)="history.set(null)" /> }
  `,
  styles: [`
    :host { display:none; }
    @media(max-width:760px) {
      :host { display:block; position:absolute; z-index:3; right:0; bottom:0; width:150px; height:90px; }
      .kd-preview { box-sizing:border-box; width:100%; height:100%; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border:0; border-left:1px solid var(--line); background:transparent; }
      .kd-label { font-size:14px; font-weight:600; } small { display:block; margin-top:4px; color:var(--muted); font-size:8px; letter-spacing:.5px; }
      .history-hint { display:flex; align-items:center; justify-content:flex-end; gap:4px; }
      .kd-number { display:flex; align-items:baseline; justify-content:flex-end; gap:4px; }
      .kd-value { text-align:right; min-width:0; } .kd-value strong { color:var(--accent); font:600 42px/1 'Barlow Condensed',sans-serif; font-variant-numeric:tabular-nums; }
      .kd-value .saved { color:var(--accent); } .kd-message, .retry { max-width:85px; color:var(--text); font-size:9px; line-height:1.4; text-align:right; }
      button { border:0; padding:0; background:transparent; cursor:pointer; color:inherit; } .history-button { min-height:44px; text-align:right; } .retry { min-height:44px; }
      .change { display:block; color:#8cdb96; font:600 14px/1.2 'Barlow Condensed',sans-serif; white-space:nowrap; } .change.negative { color:#ff9990; }
    }
  `],
})
export class SoldierKdPreviewComponent {
  readonly player = input.required<PlayerProfile>();
  readonly history = signal<StatsSnapshot[] | null>(null);
  private readonly service = inject(Bf6StatsService);
  private readonly reload = new Subject<void>();
  private readonly formatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  readonly state = toSignal(combineLatest([toObservable(this.player), this.reload.pipe(startWith(undefined))]).pipe(
    switchMap(([player]) => player.privateProfile ? of<PreviewState>({ status: 'private' }) : this.service.getStats(player.name, player.id).pipe(
      map(stats => {
        const previous = compareDailyStats(player.name, stats)?.baseline?.values.killDeath;
        const difference = previous == null ? null : Number((stats.killDeath - previous).toFixed(2));
        return { status: 'ready', trend: liveKdTrend(getDailyStatsHistory(player.name), stats), value: this.formatter.format(stats.killDeath), stats, change: difference || null, savedAt: stats.capturedAt ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(stats.capturedAt)) : null } as PreviewState;
      }),
      catchError(() => of<PreviewState>({ status: 'error' })),
      startWith<PreviewState>({ status: 'loading' })
    ))
  ), { initialValue: { status: 'loading' } as PreviewState });
  formatChange(change: number): string { return this.formatter.format(Math.abs(change)); }
  retry(): void { this.service.invalidateCache(this.player().name, this.player().id); this.reload.next(); }
  openHistory(stats: Bf6Stats): void {
    const snapshots = getDailyStatsHistory(this.player().name);
    if (!stats.capturedAt && stats.kills !== null && stats.deaths !== null) {
      const now = new Date();
      const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
      const existing = snapshots.findIndex(snapshot => day.format(new Date(snapshot.savedAt)) === day.format(now));
      if (existing >= 0) snapshots.splice(existing, 1);
      snapshots.push({ savedAt: now.toISOString(), values: { killDeath: stats.killDeath, hoursPlayed: stats.hoursPlayed, matchesPlayed: stats.matchesPlayed, accuracy: stats.accuracy, shotsFired: stats.shotsFired, kills: stats.kills, deaths: stats.deaths } });
    }
    this.history.set(snapshots);
  }
}
