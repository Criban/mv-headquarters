import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CURRENT_DESIGN, DESIGNS, type DesignPreset } from './data/designs';
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
  readonly design = signal<DesignPreset>(this.readDesign());
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
    { id: '1811857213', image: 'images/8lackh4wk-hooded-m16.png', imageAlt: 'Soldat mit grauer Kapuze, dunkler Schutzbrille und Gesichtsmaske hält eine M16 ohne Vordergriff mit rundem Thermalvisier im Schulteranschlag', name: 'MV-8lackh4wk', description: 'Born to Rush, built to destroy.' },
    { id: '353727533', image: 'images/criban-gasmask-soldier.png', imageAlt: 'Soldat mit Gasmaske, Helm und dunkler taktischer Ausrüstung', name: 'MV-Criban', description: 'Wir geben unser Bestes – meistens reicht\'s.' },
    { id: 'unknown', image: 'images/kingcoffee-coffee-break.png', imageAlt: 'Soldat mit Helm und Sonnenbrille lehnt entspannt mit einem Kaffeebecher an einer Versorgungskiste. Links leicht hinter ihm steht ein aufmerksamer Schäferhund mit dunklem Geschirr.', name: 'MV-KingCoffee', description: 'Noch einen Kaffee. Dann vielleicht.', privateProfile: true },
    { id: '1008896742053', image: 'images/54bi44-camping-chair.png', imageAlt: 'Soldat mit Kapuze und Schutzbrille sitzt entspannt auf einem Campingstuhl', name: 'MV-54bI44', description: 'Kurze Einsatzpause.' },
  ];
  private readonly statsService = inject(Bf6StatsService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
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
  private readDesign(): DesignPreset {
    try {
      const id = this.document.defaultView?.localStorage.getItem('mv-design');
      return DESIGNS.find(design => design.id === id) ?? CURRENT_DESIGN;
    } catch {
      return CURRENT_DESIGN;
    }
  }
  setDesign(id: string): void {
    const design = DESIGNS.find(preset => preset.id === id);
    if (!design) return;
    this.design.set(design);
    this.applyDesign();
    try {
      this.document.defaultView?.localStorage.setItem('mv-design', id);
    } catch { /* Design switching works even when browser storage is unavailable. */ }
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
