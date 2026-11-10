import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import { KdTrendComponent } from '../profile-card/kd-trend.component';
import { liveKdTrend } from '../profile-card/kd-history-chart';
import { Bf6StatsService } from '../services/bf6-stats.service';
import { getDailyStatsHistory } from '../services/bf6-stats-history';

type KdState = { status: 'loading' | 'error' } | { status: 'ready'; value: string; trend: 'up' | 'down' | null; savedAt: string | null };

@Component({
  selector: 'app-clan-kd',
  standalone: true,
  imports: [KdTrendComponent],
  template: `
    <span class="clan-kd" [attr.aria-busy]="state().status === 'loading'">
      @let kd = state();
      @if (kd.status === 'ready') {
        <span>K/D {{ kd.value }}</span>
        @if (!kd.savedAt) { <app-kd-trend [direction]="kd.trend" /> }
        @if (kd.savedAt) { <small [attr.title]="'Gespeicherter Abzug vom ' + kd.savedAt + ' Uhr (Berlin)'">ABZUG {{ kd.savedAt }} UHR (BERLIN)</small> }
      } @else if (kd.status === 'loading') { <span>K/D LÄDT …</span> }
      @else { <span>K/D NICHT VERFÜGBAR</span> }
    </span>
  `,
  styles: [`
    :host { display:block; }
    .clan-kd { display:flex; align-items:center; flex-wrap:wrap; gap:6px; color:#eff7f3; font:600 14px/1.3 'Barlow Condensed',sans-serif; letter-spacing:.6px; }
    small { flex-basis:100%; color:#d6e3dc; font:500 9px/1.3 'Barlow',sans-serif; letter-spacing:.3px; }
  `],
})
export class ClanKdComponent {
  readonly player = input.required<PlayerProfile>();
  private readonly service = inject(Bf6StatsService);
  private readonly formatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  readonly state = toSignal(toObservable(this.player).pipe(
    switchMap(player => this.service.getStats(player.name, player.id).pipe(
      map((stats): KdState => ({ status: 'ready', value: this.formatter.format(stats.killDeath), trend: stats.capturedAt ? null : liveKdTrend(getDailyStatsHistory(player.name), stats), savedAt: stats.capturedAt ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(stats.capturedAt)) : null })),
      catchError(() => of<KdState>({ status: 'error' })),
      startWith<KdState>({ status: 'loading' }),
    )),
  ), { initialValue: { status: 'loading' } as KdState });
}
