export interface DesignPreset {
  id: string;
  name: string;
  preview: string;
  description: string;
  current: boolean;
  browserColor: string;
  portraitMatrix: string;
  portraitLightMap: string;
  portraitLightStrength: number;
}

// Add new designs here and provide matching data-design styles in styles.css.
// Keep exactly one current design; archived designs remain selectable by ID.
export const DESIGNS: readonly DesignPreset[] = [
  {
    id: 'rooftop-daylight', name: 'Vegas Strip', current: true,
    preview: 'images/rooftop-vegas-strip-terrace.png', description: 'Vegas Strip · Über den Dächern',
    browserColor: '#191e1c',
    portraitMatrix: '.99 0 0 0 .022  0 .96 0 0 .012  0 0 .91 0 .004  0 0 0 1 0',
    portraitLightMap: 'portrait-daylight-light', portraitLightStrength: .72,
  },
  {
    id: 'tsuru-reef', name: 'Tsuru-Riff', current: false,
    preview: 'images/tsuru-reef-landing.png', description: 'Am Bootsanleger · Tropisches Tageslicht',
    browserColor: '#1b211f',
    portraitMatrix: '.98 0 0 0 .016  0 .99 0 0 .018  0 0 1 0 .02  0 0 0 1 0',
    portraitLightMap: 'portrait-tsuru-light', portraitLightStrength: .62,
  },
];

export const CURRENT_DESIGN = DESIGNS.find(design => design.current)!;
