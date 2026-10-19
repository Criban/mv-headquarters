export interface SquadVideo {
  id: string;
  title: string;
  /** Veröffentlichung als YYYY-MM-DD, z. B. '2026-10-19'.
   * Anklickbar ab 00:00 Uhr am Folgetag (Ortszeit des Besuchers).
   * Ohne Datum ist das Video sofort verfügbar.
   */
  publishDate?: string;
}

// Neue Shorts unten ergänzen. Die Video-Auswahl zeigt die neuesten zuerst.
export const SQUAD_VIDEOS: readonly SquadVideo[] = [
  { id: 'S_lo5pVSCRg', title: 'Ehrenmate in letzter Sekunde' },
  { id: 'Gg72FdawYWs', title: 'Thanks for Standing Still' },
  { id: 'oSJwFtVtVBc', title: 'Smooth Slide Kill' },
  { id: 'Eqj8P500MZA', title: 'Hip-Fire Luck Level 100' },
  { id: 'DKfsIzFnCxY', title: 'Wenn der Mate regelt' },
  { id: 'szdSzdoI9Hw', title: '2 Sekunden vor dem Einschlag' },
  { id: 'T6UlTTTZtlA', title: 'Bester Panzerfahrer' },
  { id: 'yxQZAnmMPWs', title: 'Die Granate hats erledigt' },
  { id: 'LN52-LySPXI', title: 'Präzisionslandung auf dem Boot' },
  { id: 'Z7blPZ9gbVw', title: 'Wenn das ganze Team da steht' },
  { id: 'inbxlK1G8hQ', title: 'Was passiert hier denn?' },
  { id: 'ode9q5VBj78', title: 'Wenn ich es schaffe...' },
  { id: '41IbFY5jXh0', title: '1v1 oder Tanzkurs?'},
  { id: 'R52afg0ZDhQ', title: 'Ehre für den Versuch!'},
  { id: '-AgiQMZvIAI', title: 'ANDI IST WIEDER DA!'},
  { id: 'jxGXTJido8A', title: 'Dutzende Hammer-Schläge & KEIN TREFFER?!'},
  { id: 'aSK1EX4xYhQ', title: 'Totgeglaubte leben (und laufen) länger'},
  { id: 'hGjO5Y-QEwM', title: 'Um die Ecke gesprungen & DIESEN Lucky Kill gedrückt!'},
  { id: '7Q6z2_7u_fQ', title: 'Wenn dich das Spiel mitten im Gunfight komplett ablenkt...', publishDate: '2026-10-20'},
  { id: 'N993NyWCfJU', title: 'Von der Übermacht überrannt', publishDate: '2026-10-20'},
];
