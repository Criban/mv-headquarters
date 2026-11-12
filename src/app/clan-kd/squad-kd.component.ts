import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import { Bf6StatsService } from '../services/bf6-stats.service';

type SquadKdState = { status: 'loading' | 'error' } | { status: 'ready'; value: string; saved: string[] };

@Component({
  selector: 'app-squad-kd',
  standalone: true,
  template: `
    <p class="squad-kd" [attr.aria-busy]="state().status === 'loading'" aria-live="polite">
      @let kd = state();
      @if (kd.status === 'ready') {
        <span>SQUAD K/D / <strong>{{ kd.value }}</strong></span>
        @for (saved of kd.saved; track saved) { <small>{{ saved }}</small> }
      } @else if (kd.status === 'loading') { <span>SQUAD K/D / LÄDT …</span> }
      @else { <span>SQUAD K/D / NICHT VERFÜGBAR</span> }
    </p>
  `,
  styles: [`
    .squad-kd { margin:8px 0 0; color:#d1ddd9; font:500 11px/1.4 'Barlow',sans-serif; letter-spacing:.18em; }
    strong { color:#eff7f3; font-weight:700; }
    small { display:block; margin-top:3px; font-size:9px; letter-spacing:.05em; }
  `],
})
export class SquadKdComponent {
  readonly players = input.required<PlayerProfile[]>();
  private readonly service = inject(Bf6StatsService);
  private readonly numberFormat = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  private readonly dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });
  readonly state = toSignal(toObservable(this.players).pipe(
    switchMap(players => {
      if (players.length !== 2 || players.some(player => player.privateProfile)) return of<SquadKdState>({ status: 'error' });
      return forkJoin(players.map(player => this.service.getStats(player.name, player.id))).pipe(
        map((stats): SquadKdState => {
          if (stats.some(stat => stat.kills === null || stat.deaths === null)) return { status: 'error' };
          const kills = stats.reduce((sum, stat) => sum + stat.kills!, 0);
          const deaths = stats.reduce((sum, stat) => sum + stat.deaths!, 0);
          if (deaths === 0) return { status: 'error' };
          const saved = stats.flatMap((stat, index) => stat.capturedAt ? [`${players[index].name.slice(3)}: ABZUG ${this.dateFormat.format(new Date(stat.capturedAt))} UHR (BERLIN)`] : []);
          return { status: 'ready', value: this.numberFormat.format(kills / deaths), saved };
        }),
        catchError(() => of<SquadKdState>({ status: 'error' })),
        startWith<SquadKdState>({ status: 'loading' }),
      );
    }),
  ), { initialValue: { status: 'loading' } as SquadKdState });
}
