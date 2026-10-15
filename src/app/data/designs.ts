export interface DesignPreset {
  id: string;
  name: string;
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
    browserColor: '#191e1c',
    portraitMatrix: '1.03 0 0 0 0  0 1.01 0 0 0  0 0 .96 0 0  0 0 0 1 0',
    portraitLightMap: 'portrait-daylight-light', portraitLightStrength: .35,
  },
  {
    id: 'urban-night', name: 'Urban Night', current: false,
    browserColor: '#090e1b',
    portraitMatrix: '.92 0 0 0 0  0 .98 0 0 0  0 0 1.08 0 0  0 0 0 1 0',
    portraitLightMap: 'portrait-night-light', portraitLightStrength: .55,
  },
];

export const CURRENT_DESIGN = DESIGNS.find(design => design.current)!;
