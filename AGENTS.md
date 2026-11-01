# Projektanweisungen

## Ziel und Orientierung

- MV Headquarters ist eine responsive Battlefield-Fanseite im Stil eines interaktiven Spielmenüs. Neue Funktionen sollen sich in Gestaltung und Bedienung der bestehenden Website einfügen, sofern die Aufgabe nichts anderes verlangt.
- Vor Änderungen die betroffenen Komponenten und `README.md` ansehen; für Historie und Design bei Bedarf auch `docs/history.md` und `docs/designs.md` lesen. Der vorhandene Code ist bei veralteter Dokumentation maßgeblich.
- Angular-, TypeScript- und CSS-Konventionen des Projekts beibehalten. Änderungen auf die Aufgabe beschränken und vorhandene Änderungen anderer nicht überschreiben.
- Commits und Pushes nur auf ausdrückliche Anweisung des Nutzers durchführen.

## Website und Bedienung

- Änderungen an Oberfläche und Layout auf schmalen und breiten Ansichten prüfen. Bei sichtbaren Änderungen die betroffenen Ansichten möglichst im Browser kontrollieren und auch Überläufe sowie Lade- und Fehlerzustände beachten.
- Interaktive Elemente mit Tastatur bedienbar und mit sichtbarem Fokus gestalten. Semantische HTML-Elemente, verständliche Beschriftungen und ausreichenden Kontrast verwenden; Animationen sollen `prefers-reduced-motion` berücksichtigen.
- Bestehende Bildassets und Animationsebenen gezielt behandeln. Neue oder geänderte Bildquellen und Prompts gegebenenfalls in `public/images/GENERATION.md` dokumentieren; Dateigröße und Ladeverhalten beachten.
- Die Seite wird statisch über GitHub Pages veröffentlicht und kann unter einem Unterverzeichnis laufen. Asset- und Navigationspfade entsprechend prüfen; keine serverseitige Laufzeit voraussetzen.

## Statistiken und Daten

- Private Spielerprofile nicht für Statistikabfragen verwenden. Bei Änderungen an BF6-Daten Lade-, Fehler- und Ersatzdatenzustände sowie die Kennzeichnung gespeicherter Werte erhalten.
- Gemeinsame Historie und Abzüge sorgfältig behandeln: bestehende Daten nicht unbeabsichtigt überschreiben, fehlende Werte nicht als null ausgeben und historische Vergleiche nicht durch Ersatzdaten verfälschen. Details stehen in `docs/history.md`.

## Prüfung und Dokumentation

- Für Code- und Konfigurationsänderungen `npm run build` ausführen. Bei Änderungen an der Historie zusätzlich `npm run test:history` ausführen; weitere Prüfungen nach Bedarf wählen.
- Relevante Dokumentation aktualisieren, wenn sich Einrichtung, Bedienung, Datenverhalten oder Deployment ändern. Keine Geheimnisse oder Zugangsdaten im Repository ablegen.
- Ergebnisse und nicht ausgeführte oder fehlgeschlagene Prüfungen mit Grund kurz mitteilen.
