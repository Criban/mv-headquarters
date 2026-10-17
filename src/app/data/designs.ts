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
    id: 'rooftop-daylight', name: 'Stadteinsatz', current: true,
    preview: 'images/rooftop-city-daylight.png', description: 'Über den Dächern · Tageslicht',
    browserColor: '#191e1c',
    portraitMatrix: '.98 0 0 0 .018  0 .97 0 0 .016  0 0 .94 0 .014  0 0 0 1 0',
    portraitLightMap: 'portrait-daylight-light', portraitLightStrength: .48,
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
