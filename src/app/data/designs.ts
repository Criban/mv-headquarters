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
    id: 'urban-night', name: 'Urban Night', current: false,
    preview: 'images/hangar-urban-night.png', description: 'Im Hangar · Nachtbeleuchtung',
    browserColor: '#090e1b',
    portraitMatrix: '.92 0 0 0 0  0 .98 0 0 0  0 0 1.08 0 0  0 0 0 1 0',
    portraitLightMap: 'portrait-night-light', portraitLightStrength: .68,
  },
];

export const CURRENT_DESIGN = DESIGNS.find(design => design.current)!;
