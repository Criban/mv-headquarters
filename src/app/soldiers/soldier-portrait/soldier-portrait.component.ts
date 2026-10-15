import { Component, input, signal } from '@angular/core';

import { CURRENT_DESIGN, type DesignPreset } from '../../data/designs';

@Component({
  selector: 'app-soldier-portrait',
  standalone: true,
  host: { style: 'display:contents' },
  templateUrl: './soldier-portrait.component.html',
  styleUrl: './soldier-portrait.component.css',
})
export class SoldierPortraitComponent {
  readonly design = input<DesignPreset>(CURRENT_DESIGN);
  readonly src = input.required<string>();
  readonly description = input.required<string>();
  readonly index = input(0);
  readonly inactive = input(false);
  readonly failed = signal(false);
}
