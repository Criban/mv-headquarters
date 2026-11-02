import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, model, NgZone, output, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { BattlefieldHistoryComponent } from '../battlefield-history/battlefield-history.component';
import type { PlayerProfile } from '../profile-card/profile-card.component';
import type { Bf6Stats } from '../services/bf6-stats.service';
import { SoldierPortraitComponent } from './soldier-portrait/soldier-portrait.component';
import { SoldierKdPreviewComponent } from './soldier-kd-preview.component';
import { getBerlinLighting } from './hangar-lighting';

import { CURRENT_DESIGN, DESIGNS, type DesignPreset } from '../data/designs';

@Component({
  selector: 'app-soldiers',
  standalone: true,
  imports: [BattlefieldHistoryComponent, SoldierPortraitComponent, SoldierKdPreviewComponent],
  host: { style: 'display:contents' },
  templateUrl: './soldiers.component.html',
})
export class SoldiersComponent {
  readonly designs = DESIGNS;
  readonly design = input<DesignPreset>(CURRENT_DESIGN);
  readonly sceneTransition = input<{ outgoing: string | null; entering: string | null }>({ outgoing: null, entering: null });
  readonly lighting = signal(getBerlinLighting());
  readonly mobile = signal(false);
  readonly players = input.required<PlayerProfile[]>();
  readonly selected = input.required<number>();
  readonly squadActive = input(false);
  readonly stats = input<Bf6Stats | null>(null);
  readonly historyOpen = model(false);
  readonly soldierSelected = output<number>();
  readonly soldierActivated = output<number>();
  readonly soldierBrowsed = output<number>();
  private browsingRoster = false;
  readonly visibleSoldier = output<number>();
  readonly showOnBreak = signal(false);
  readonly rosterPosition = signal(0);
  private readonly roster = viewChild<ElementRef<HTMLElement>>('roster');
  readonly onBreakCount = computed(() => this.players().filter(player => player.onBreak).length);
  readonly visiblePlayers = computed(() => this.players()
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => this.showOnBreak() || !player.onBreak));
  // The history panel occupies the right two thirds of the scene.
  readonly sceneColumns = computed(() => this.squadActive() && this.historyOpen()
    ? Math.max(3, this.visiblePlayers().length) : this.visiblePlayers().length);
  readonly selectedColumn = computed(() => this.visiblePlayers().findIndex(({ index }) => index === this.selected()));

  scrollRoster(roster: HTMLElement, direction: number): void {
    this.browsingRoster = true;
    const next = Math.max(0, Math.min(this.visiblePlayers().length - 1, this.rosterPosition() + direction));
    this.scrollToRosterPosition(roster, next);
  }

  beginBrowsing(): void { this.browsingRoster = true; }

  activateSoldier(roster: HTMLElement, playerIndex: number): void {
    if (window.matchMedia('(max-width: 760px)').matches) {
      const position = this.visiblePlayers().findIndex(entry => entry.index === playerIndex);
      if (position >= 0) this.scrollToRosterPosition(roster, position, 'instant');
    }
    this.soldierActivated.emit(playerIndex);
  }

  private scrollToRosterPosition(roster: HTMLElement, position: number, behavior?: ScrollBehavior): void {
    const slide = roster.querySelectorAll<HTMLElement>('.soldier-slide')[position];
    if (!slide) return;
    const left = slide.offsetLeft - (roster.clientWidth - slide.offsetWidth) / 2;
    roster.scrollTo({ left, behavior: behavior ?? (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') });
  }

  updateRosterPosition(roster: HTMLElement): void {
    const slides = Array.from(roster.querySelectorAll<HTMLElement>('.soldier-slide'));
    if (!slides.length) return;
    const center = roster.scrollLeft + roster.clientWidth / 2;
    const nearest = slides.reduce((best, slide, index) =>
      Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center) < Math.abs(slides[best].offsetLeft + slides[best].offsetWidth / 2 - center) ? index : best, 0);
    this.rosterPosition.set(nearest);
    const player = this.visiblePlayers()[nearest];
    if (player) {
      this.visibleSoldier.emit(player.index);
      if (this.browsingRoster && window.matchMedia('(max-width: 760px)').matches && player.index !== this.selected() && !player.player.inactive) this.soldierBrowsed.emit(player.index);
    }
  }

  toggleOnBreak(): void {
    if (this.showOnBreak() && this.players()[this.selected()]?.onBreak) {
      const firstActive = this.players().findIndex(player => !player.onBreak && !player.inactive);
      this.historyOpen.set(false);
      if (firstActive >= 0) this.soldierSelected.emit(firstActive);
    }
    this.showOnBreak.update(show => !show);
    this.rosterPosition.update(position => Math.min(position, this.visiblePlayers().length - 1));
  }

  ngOnInit(): void {
    if (this.players()[this.selected()]?.onBreak) this.showOnBreak.set(true);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);
    const zone = inject(NgZone);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    this.mobile.set(mobileQuery.matches);
    const onViewportChange = (event: MediaQueryListEvent) => this.mobile.set(event.matches);
    mobileQuery.addEventListener('change', onViewportChange);
    destroyRef.onDestroy(() => mobileQuery.removeEventListener('change', onViewportChange));
    afterNextRender(() => {
      const roster = this.roster()?.nativeElement;
      if (!roster || !window.matchMedia('(max-width: 760px)').matches) return;
      const position = this.selectedColumn();
      if (position >= 0) {
        this.scrollToRosterPosition(roster, position, 'instant');
        this.rosterPosition.set(position);
        this.visibleSoldier.emit(this.visiblePlayers()[position].index);
      }
    });

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
