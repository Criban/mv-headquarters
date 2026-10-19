import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SQUAD_VIDEOS, SquadVideo } from '../data/videos';

@Component({
  selector: 'app-videos',
  standalone: true,
  templateUrl: './videos.component.html',
  styleUrl: './videos.component.css',
})
export class VideosComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly today = signal(this.localDate());
  private midnightTimer?: ReturnType<typeof setTimeout>;
  readonly videos = [...SQUAD_VIDEOS].reverse();
  private readonly availableVideos = computed(() => this.videos.filter(video => this.isAvailable(video)));
  private readonly selection = signal<SquadVideo | undefined>(this.randomAvailableVideo());
  readonly selected = computed<SquadVideo | undefined>(() => this.selection() ?? this.availableVideos()[0]);
  readonly playerUrl = computed(() => {
    const video = this.selected();
    return video ? this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${video.id}?playsinline=1&rel=0`,
    ) : null;
  });

  constructor() {
    this.scheduleMidnightUpdate();
  }

  isAvailable(video: SquadVideo): boolean {
    return !video.publishDate || video.publishDate < this.today();
  }

  selectVideo(video: SquadVideo): void {
    if (this.isAvailable(video)) this.selection.set(video);
  }

  ngOnDestroy(): void {
    clearTimeout(this.midnightTimer);
  }

  private randomAvailableVideo(): SquadVideo | undefined {
    const videos = this.availableVideos();
    return videos[Math.floor(Math.random() * videos.length)];
  }

  private localDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private scheduleMidnightUpdate(): void {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    this.midnightTimer = setTimeout(() => {
      this.today.set(this.localDate());
      this.scheduleMidnightUpdate();
    }, midnight.getTime() - now.getTime());
  }
}
