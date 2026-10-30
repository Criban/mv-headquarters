import { Component, computed, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DESIGNS, type DesignPreset } from './data/designs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { ProfileCardComponent, type PlayerProfile } from './profile-card/profile-card.component';
import { SoldiersComponent } from './soldiers/soldiers.component';
import { Bf6StatsService, type Bf6Stats } from './services/bf6-stats.service';
import { removeLegacyStatsHistory } from './services/bf6-stats-history';
import { VideosComponent } from './videos/videos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProfileCardComponent, SoldiersComponent, VideosComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly document = inject(DOCUMENT);
  readonly designs = DESIGNS;
  readonly design = signal<DesignPreset>(DESIGNS[Math.floor(Math.random() * DESIGNS.length)]);
  readonly sceneTransition = signal<{ outgoing: string | null; entering: string | null }>({ outgoing: null, entering: null });
  readonly loaderVisible = signal(true);
  readonly locationPickerOpen = signal(false);

  @HostListener('document:click', ['$event'])
  closeLocationPickerOutside(event: MouseEvent): void {
    if (!(event.target instanceof Element) || !event.target.closest('.design-picker')) {
      this.locationPickerOpen.set(false);
    }
  }

  closeLocationPicker(trigger: HTMLButtonElement): void {
    this.locationPickerOpen.set(false);
    trigger.focus();
  }
  readonly view = signal<'squad' | 'clan' | 'videos'>('clan');
  readonly selected = signal(0);
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
  private sceneTransitionTimers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    const loaderTimeout = setTimeout(() => this.loaderVisible.set(false), 2000);
    this.destroyRef.onDestroy(() => clearTimeout(loaderTimeout));
    this.applyDesign();
    removeLegacyStatsHistory();
    for (const player of this.players.filter(player => !player.privateProfile)) {
      this.statsService.getStats(player.name, player.id).pipe(
        catchError(() => EMPTY), takeUntilDestroyed(this.destroyRef)
      ).subscribe(stats => {
        this.recordStats({ playerId: player.id, stats });
      });
    }
  }
  setDesign(id: string): void {
    const design = DESIGNS.find(preset => preset.id === id);
    if (!design || design.id === this.design().id) return;
    this.sceneTransitionTimers.forEach(clearTimeout);
    this.sceneTransitionTimers = [];
    const outgoing = this.design().id;
    this.sceneTransition.set({ outgoing, entering: null });
    this.design.set(design);
    this.applyDesign();
    this.sceneTransitionTimers.push(setTimeout(() => this.sceneTransition.set({ outgoing, entering: design.id }), 900));
    this.sceneTransitionTimers.push(setTimeout(() => this.sceneTransition.set({ outgoing: null, entering: null }), 1550));
  }
  ngOnDestroy(): void {
    this.sceneTransitionTimers.forEach(clearTimeout);
  }
  private applyDesign(): void {
    this.document.documentElement.dataset['design'] = this.design().id;
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', this.design().browserColor);
  }
  toggleHistory(): void { this.historyOpen.update(open => !open); }
  closeHistory(): void { this.historyOpen.set(false); }
  selectSoldier(index: number): void {
    if (!this.players[index] || this.players[index].inactive) return;
    this.closeHistory(); this.selected.set(index); this.view.set('squad');
  }
}
