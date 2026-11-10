import { afterNextRender, Component, computed, DestroyRef, HostListener, inject, Injector, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { ProfileCardComponent, type PlayerProfile } from './profile-card/profile-card.component';
import { Bf6StatsService, type Bf6Stats } from './services/bf6-stats.service';
import { removeLegacyStatsHistory } from './services/bf6-stats-history';
import { VideosComponent } from './videos/videos.component';
import { BattlefieldHistoryComponent } from './battlefield-history/battlefield-history.component';
import { ClanKdComponent } from './clan-kd/clan-kd.component';

const LAST_SOLDIER_KEY = 'mv-last-soldier';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProfileCardComponent, VideosComponent, BattlefieldHistoryComponent, ClanKdComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  readonly loaderVisible = signal(true);
  readonly focusOpen = signal(false);
  readonly focusPortraits = [
    { src: 'images/focus/blackhawk-panorama.webp', alt: 'Blackhawk steht mit Gewehr in der Garage.' },
    { src: 'images/focus/criban-panorama.webp', alt: 'Criban steht mit Gewehr in der Garage.' },
  ];

  @HostListener('window:hashchange')
  syncRoute(): void {
    const hash = this.document.defaultView?.location.hash;
    this.view.set(hash === '#/videos' ? 'videos' : 'clan');
    this.focusOpen.set(false);
    this.closeHistory();
  }
  skipToMain(event: Event): void { event.preventDefault(); this.document.getElementById('main')?.focus(); }
  private transitionSequence = 0;
  private transitionScene(update: () => void, zoomPlayer?: number): void {
    const doc = this.document as Document & { startViewTransition?: (callback: () => Promise<void>) => { finished: Promise<void> } };
    if (!doc.startViewTransition || this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update();
      return;
    }
    const root = this.document.documentElement;
    const transitionId = ++this.transitionSequence;
    root.classList.add('scene-view-transition');
    if (zoomPlayer !== undefined) {
      const mobile = this.document.defaultView?.matchMedia('(max-width: 760px)').matches;
      const target = mobile ? this.document.querySelectorAll<HTMLElement>('.mobile-soldier-card')[zoomPlayer] : this.document.querySelector<HTMLElement>(zoomPlayer === 0 ? '.clan-blackhawk' : '.clan-criban');
      const rect = target?.getBoundingClientRect();
      if (rect) {
        root.style.setProperty('--scene-origin-x', `${rect.left + rect.width / 2}px`);
        root.style.setProperty('--scene-origin-y', `${rect.top + rect.height * .35}px`);
      }
      root.classList.add('scene-zoom-in');
    } else {
      root.classList.remove('scene-zoom-in');
    }
    try {
      const transition = doc.startViewTransition(() => new Promise<void>(resolve => {
        update();
        afterNextRender(() => {
          const image = this.document.querySelector<HTMLImageElement>(zoomPlayer === undefined ? '.clan-picture img' : '.focus-scene-image');
          if (!image || typeof image.decode !== 'function') { resolve(); return; }
          // Keep the old snapshot visible until the new scene is decoded; don't block indefinitely on an image failure.
          const timeout = setTimeout(resolve, 1800);
          image.decode().catch(() => undefined).then(() => { clearTimeout(timeout); resolve(); });
        }, { injector: this.injector });
      }));
      const cleanup = () => {
        if (transitionId !== this.transitionSequence) return;
        root.classList.remove('scene-view-transition', 'scene-zoom-in');
        root.style.removeProperty('--scene-origin-x');
        root.style.removeProperty('--scene-origin-y');
      };
      transition.finished.then(cleanup, cleanup);
    } catch {
      root.classList.remove('scene-view-transition', 'scene-zoom-in');
      root.style.removeProperty('--scene-origin-x');
      root.style.removeProperty('--scene-origin-y');
      update();
    }
  }
  changeFocusPlayer(step: number): void {
    this.selectSoldier((this.selected() + step + this.focusPortraits.length) % this.focusPortraits.length, false, true);
  }
  onMobileClanScroll(event: Event): void {
    const track = event.currentTarget as HTMLElement;
    if (track.clientWidth) this.visibleSoldier.set(Math.max(0, Math.min(this.focusPortraits.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
  }
  moveMobileSoldier(step: number): void {
    const track = this.document.querySelector<HTMLElement>('.mobile-clan-track');
    if (!track) return;
    const next = Math.max(0, Math.min(this.focusPortraits.length - 1, this.visibleSoldier() + step));
    const reducedMotion = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: next * track.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' });
  }
  openSelectedPlayer(): void {
    const window = this.document.defaultView;
    if (window?.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    this.selectSoldier(this.selected());
  }
  openMainView(view: 'clan' | 'videos'): void {
    const returnToClan = this.focusOpen() && view === 'clan';
    const update = () => {
      this.focusOpen.set(false);
      this.view.set(view);
      this.closeHistory();
      if (this.document.defaultView) this.document.defaultView.location.hash = view === 'clan' ? '' : '#/videos';
      afterNextRender(() => {
        const mobile = this.document.defaultView?.matchMedia('(max-width: 760px)').matches;
        const track = mobile && returnToClan ? this.document.querySelector<HTMLElement>('.mobile-clan-track') : null;
        if (track) track.scrollLeft = this.selected() * track.clientWidth;
        const target = returnToClan ? (mobile ? this.document.querySelectorAll<HTMLButtonElement>('.mobile-soldier-card')[this.selected()] : this.document.querySelector<HTMLButtonElement>(this.selected() === 0 ? '.clan-blackhawk' : '.clan-criban')) : this.document.getElementById('main');
        target?.focus({ preventScroll: true });
      }, { injector: this.injector });
    };
    if (returnToClan) this.transitionScene(update); else update();
  }

  readonly view = signal<'squad' | 'clan' | 'videos'>('clan');
  readonly selected = signal(0);
  readonly visibleSoldier = signal(0);
  readonly historyOpen = signal(false);
  readonly hasHistoryStats = computed(() => !this.players[this.selected()].privateProfile);
  readonly playerStats = signal<Partial<Record<string, Bf6Stats>>>({});
  readonly selectedStats = computed(() => this.playerStats()[this.players[this.selected()].id] ?? null);
  recordStats(event: { playerId: string; stats: Bf6Stats }): void {
    this.playerStats.update(players => ({ ...players, [event.playerId]: event.stats }));
  }
  readonly players: PlayerProfile[] = [
    { id: '1811857213', image: 'images/8lackh4wk-forward-m16.png', imageAlt: 'Soldat mit grauer Kapuze, dunkler Schutzbrille und Gesichtsmaske schaut nach vorne und zielt mit einer M16 ohne Vordergriff und mit rundem Thermalvisier in den Vordergrund', name: 'MV-8lackh4wk', description: 'Born to Rush, built to destroy.' },
    { id: '353727533', image: 'images/criban-black-armor-low-ready.png', imageAlt: 'Soldat mit schwarzer Vollgesichtsmaske, Helm mit hochgeklapptem Nachtsichtgerät und dunkler Rüstung hält sein Gewehr einhändig schräg vor dem Körper mit dem Lauf nach unten', name: 'MV-Criban', description: 'Wir geben unser Bestes – meistens reicht\'s.' },
    { id: 'unknown', image: 'images/kingcoffee-coffee-break.png', imageAlt: 'Soldat mit Helm und Sonnenbrille lehnt entspannt mit einem Kaffeebecher an einer Versorgungskiste.', name: 'MV-KingCoffee', description: 'Noch einen Kaffee. Dann vielleicht.', privateProfile: true, onBreak: true },
    { id: '1008896742053', image: 'images/54bi44-camping-chair.png', imageAlt: 'Soldat mit Kapuze und Schutzbrille sitzt entspannt auf einem Campingstuhl', name: 'MV-54bI44', description: 'Kurze Einsatzpause.', onBreak: true },
  ];
  private readonly statsService = inject(Bf6StatsService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const loaderTimeout = setTimeout(() => this.loaderVisible.set(false), 2000);
    this.destroyRef.onDestroy(() => clearTimeout(loaderTimeout));
    this.syncRoute();
    try {
      const savedName = this.document.defaultView?.localStorage.getItem(LAST_SOLDIER_KEY);
      const savedIndex = this.players.findIndex(player => player.name === savedName && !player.inactive);
      if (savedIndex >= 0) {
        this.selected.set(savedIndex);
      }
    } catch { /* Keep the default when browser storage is unavailable. */ }
    if (this.selected() >= this.focusPortraits.length) this.selected.set(0);
    removeLegacyStatsHistory();
    for (const player of this.players.filter(player => !player.privateProfile)) {
      this.statsService.getStats(player.name, player.id).pipe(
        catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef)
      ).subscribe(stats => {
        this.recordStats({ playerId: player.id, stats });
      });
    }
  }
  toggleHistory(): void { this.historyOpen.update(open => !open); }
  closeHistory(): void { this.historyOpen.set(false); }
  selectSoldier(index: number, scrollToDetails = false, rememberSelection = scrollToDetails): void {
    if (!this.players[index] || this.players[index].inactive) return;
    if (index >= this.focusPortraits.length) return;
    const opening = !this.focusOpen();
    const update = () => {
      this.closeHistory(); this.selected.set(index); this.view.set('squad');
      this.focusOpen.set(true);
      if (opening) afterNextRender(() => this.document.getElementById('main')?.focus({ preventScroll: true }), { injector: this.injector });
    };
    if (rememberSelection) {
      try { this.document.defaultView?.localStorage.setItem(LAST_SOLDIER_KEY, this.players[index].name); }
      catch { /* Selection still works when storage is unavailable. */ }
    }
    if (opening && this.view() === 'clan') this.transitionScene(update, index); else update();
  }
}
