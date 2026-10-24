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
  { id: '7Q6z2_7u_fQ', title: 'Wenn dich das Spiel mitten im Gunfight komplett ablenkt...'},
  { id: 'N993NyWCfJU', title: 'Von der Übermacht überrannt'},
  { id: '7iWjF4UbC-4', title: 'Camper-Nest auf dem Berg komplett gesäubert!'},
  { id: 'gMr0LXxo5so', title: 'LMG Dauerfeuer gegen die Zombie-Horde!'},
  { id: '9prgdllKHJA', title: 'Wenn die HE-Granaten heute einfach PERFEKT fliegen'},
  { id: 'C-CvOIkBmJA', title: 'Erst ballert der Panzer, dann finisht auch noch der Heli!'},
  { id: 'EFflqk5HV24', title: 'Style-Punkte beim Flagge einnehmen geholt!'},
  { id: 'iN4Gj4uO7i4', title: 'Wenn du deinen eigenen Play kurz selber nicht fassen kannst!'},
  { id: 'ybZONpIEZa8', title: 'Wenn du den Gegner nicht siehst, aber das C4 perfekt sitzt! '},
  { id: 'SOoeoUNRL5g', title: 'Mate gerächt, in Deckung gezerrt & den nächsten Gegner geholt!', publishDate: '2026-10-25'},
  { id: 'FEfs1GDskbU', title: 'C4-Kills machen einfach IMMER Spaß.', publishDate: '2026-10-25'},
];
