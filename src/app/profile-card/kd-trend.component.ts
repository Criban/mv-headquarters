import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kd-trend',
  standalone: true,
  template: `@if (direction(); as trend) {
    <span class="trend" [class.down]="trend === 'down'" role="img" [attr.aria-label]="trend === 'up' ? 'K/D-Trend gestiegen' : 'K/D-Trend gesunken'" [attr.title]="trend === 'up' ? 'K/D-Trend gestiegen' : 'K/D-Trend gesunken'">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path [attr.d]="trend === 'up' ? 'M3 17 L9 11 L12 14 L21 5 M16 5 H21 V10' : 'M3 7 L9 13 L12 10 L21 19 M16 19 H21 V14'" /></svg>
    </span>
  }`,
  styles: [`
    :host { display:inline-flex; align-items:center; }
    .trend { display:inline-flex; color:#8cdb96; }
    .trend.down { color:#ff9990; }
    svg { display:block; width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:square; stroke-linejoin:miter; }
    @media(max-width:760px) { svg { width:13px; height:13px; } }
  `],
})
export class KdTrendComponent {
  readonly direction = input<'up' | 'down' | null>(null);
}
