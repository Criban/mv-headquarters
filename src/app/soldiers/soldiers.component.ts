import { isPlatformBrowser } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, model, NgZone, output, PLATFORM_ID, signal } from '@angular/core';
import { BattlefieldHistoryComponent } from '../battlefield-history/battlefield-history.component';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import type { Bf6Stats } from '../services/bf6-stats.service';
import { SoldierPortraitComponent } from './soldier-portrait/soldier-portrait.component';
import { getBerlinLighting } from './hangar-lighting';

import { CURRENT_DESIGN, DESIGNS, type DesignPreset } from '../data/designs';

@Component({
  selector: 'app-soldiers',
  standalone: true,
  imports: [BattlefieldHistoryComponent, SoldierPortraitComponent],
  host: { style: 'display:contents' },
  templateUrl: './soldiers.component.html',
})
export class SoldiersComponent {
  readonly designs = DESIGNS;
  readonly design = input<DesignPreset>(CURRENT_DESIGN);
  readonly sceneTransition = input<{ outgoing: string | null; entering: string | null }>({ outgoing: null, entering: null });
  readonly lighting = signal(getBerlinLighting());
  readonly players = input.required<PlayerProfile[]>();
  readonly selected = input.required<number>();
  readonly squadActive = input(false);
  readonly stats = input<Bf6Stats | null>(null);
  readonly historyOpen = model(false);
  readonly soldierSelected = output<number>();
  readonly showOnBreak = signal(false);
  readonly onBreakCount = computed(() => this.players().filter(player => player.onBreak).length);
  readonly visiblePlayers = computed(() => this.players()
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => this.showOnBreak() || !player.onBreak));
  // The history panel occupies the right two thirds of the scene.
  readonly sceneColumns = computed(() => this.squadActive() && this.historyOpen()
    ? Math.max(3, this.visiblePlayers().length) : this.visiblePlayers().length);
  readonly selectedColumn = computed(() => this.visiblePlayers().findIndex(({ index }) => index === this.selected()));

  toggleOnBreak(): void {
    if (this.showOnBreak() && this.players()[this.selected()]?.onBreak) {
      const firstActive = this.players().findIndex(player => !player.onBreak && !player.inactive);
      this.historyOpen.set(false);
      if (firstActive >= 0) this.soldierSelected.emit(firstActive);
    }
    this.showOnBreak.update(show => !show);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    const zone = inject(NgZone);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const refresh = () => zone.run(() => this.lighting.set(getBerlinLighting()));
    zone.runOutsideAngular(() => {
      const timer = window.setInterval(refresh, 60_000);
      const onVisibilityChange = () => { if (!document.hidden) refresh(); };
      document.addEventListener('visibilitychange', onVisibilityChange);
      destroyRef.onDestroy(() => {
        window.clearInterval(timer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      });
    });
  }
}
