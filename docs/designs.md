# Design-Auswahl

Das Dropdown in der Kopfzeile zeigt das aktuelle Design und archivierte Varianten.
Neue Besucher erhalten das als `current` markierte Design. Eine bewusste Auswahl
wird unter `mv-design` im lokalen Browser gespeichert und nach einem Neuladen
wiederhergestellt. Unbekannte IDs oder gesperrter Browserspeicher fallen auf das
aktuelle Design zurück; der Wechsel selbst funktioniert auch ohne Speicherung.

Die Varianten stehen in `src/app/data/designs.ts` mit stabiler ID, Anzeigename,
Browserfarbe und Soldatenbeleuchtung. Derzeit ist **Stadteinsatz** aktuell und
**Urban Night** archiviert. Ein Wechsel verändert weder die Spielerauswahl noch
die geöffnete Ansicht oder Historie. Soldaten und Animationen bleiben eingebunden.

## Eine neue Variante ergänzen

1. Neue Hintergrund- und gegebenenfalls Beleuchtungsbilder unter `public/images/`
   hinzufügen. Für die gespiegelte Sitzpose eine gespiegelte Lichtkarte vorsehen.
2. Einen Eintrag in `DESIGNS` ergänzen. Genau einen Eintrag als `current: true`
   markieren, ältere Einträge mit `current: false` behalten.
3. In `src/styles.css` über `:root[data-design="neue-id"]` die Farbvariablen,
   `--scene-image`, Belichtung, Sättigung und Oberflächen definieren. Bei Bedarf
   die Porträtbelichtung mit passenden Soldaten-Selektoren überschreiben.
4. `npm run build` ausführen und die neue Variante sowie den Rückwechsel prüfen.

Das Dropdown entsteht automatisch aus den registrierten Varianten. IDs bleiben
stabil, damit bereits gespeicherte Auswahlen nach einem Update weiter funktionieren.
