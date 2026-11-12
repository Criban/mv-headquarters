# MV / Battlefield

Persönliche, responsive Battlefield-Fanseite für den Clan MV als interaktives Spielmenü. Die Clanübersicht ist der menüfreie Einstieg und zeigt Blackhawk und Criban bei der Einsatzvorbereitung in der Garage; beide öffnen per Klick oder Tastatur ihre Fokusansicht. KingCoffee und 54bI44 sind im Hintergrund zu sehen und nicht auswählbar. Videos sind über das Menü der Fokusansicht erreichbar.

Die Battlefield-Historie lässt sich für öffentliche Profile öffnen.

## Lokal starten

Im Menü **VIDEOS** stehen die YouTube-Shorts mit Vorschaubildern und einem eingebetteten Player im Hochformat zur Auswahl. Die Liste wird in `src/app/data/videos.ts` gepflegt: Neue Videos unten mit YouTube-ID und Titel ergänzen. Beim Öffnen wird das letzte verfügbare Video ausgewählt; „Coming soon“-Einträge werden übersprungen. Die Titel „Short 01“ bis „Short 10“ können dort durch eigene Beschreibungen ersetzt werden. Der Player verwendet `youtube-nocookie.com`; Vorschauen werden von YouTube geladen. Ob ein Video eingebettet abgespielt werden kann, hängt von seinen YouTube-Einstellungen ab. Jeder Clip hat zusätzlich einen Link zu YouTube.

Die Seiten verwenden eine gemeinsame Garagenkulisse und Farbpalette; eine Auswahl alternativer Einsatzorte gibt es nicht mehr.

```sh
npm install
npm start
```

Anschließend http://localhost:4200 öffnen. `npm run build` erstellt den Produktionsbuild in `dist/bf6-squad/browser`.

Die passende Node-22-Laufzeit wird als lokale Entwicklungsabhängigkeit installiert. Die npm-Skripte nutzen sie direkt, sodass die globale Node-Installation unverändert bleibt.

Die Profile samt Tracker-Links stehen im typisierten `players`-Array in `src/main.ts`. Das Menü und die Soldatenauswahl stehen in `src/app/app.component.html`. Die wiederverwendbare `ProfileCardComponent` in `src/app/profile-card/` zeigt die Statistikansicht des ausgewählten Spielers. Globale Farben und Layout stehen in `src/styles.css`.

Die Clanansicht nutzt `public/images/focus/clan-panorama-action.webp` als zusammenhängende Szene. Für die Fokusansicht zeigen eigene Panorama-Szenen derselben Garage jeweils Blackhawk oder Criban im Vordergrund; über die Pfeile kann zwischen ihnen gewechselt werden. Auf Desktop blendet der Spielerwechsel kurz über, sofern der Browser dies unterstützt und keine reduzierte Bewegung eingestellt ist. Der zuletzt ausgewählte Soldat wird lokal gespeichert und lässt sich von der Videoseite über „Spieler“ wieder öffnen. Auf schmalen Bildschirmen zeigt die Clanübersicht jeweils einen Soldaten; Wischen oder die Pfeile wechseln zum anderen Profil. In der Fokusansicht stehen die verfügbaren Rangdaten unter dem Namen. Mobil zeigt sie zusätzlich Treffgenauigkeit und Schüsse ohne Soldatenbild.

Criban trägt eine schwarze Vollgesichtsmaske und einen Helm mit hochgeklapptem Nachtsichtgerät. Er hält sein Gewehr einhändig schräg vor dem Körper, mit dem Lauf nach unten (`public/images/criban-black-armor-low-ready.png`). Seine fünf Animationsebenen und die Bildprompts liegen in `public/images/criban-black-rig/`.

Weitere Bildprompts und Herkunft sind in `public/images/GENERATION.md` dokumentiert. Angular kopiert `public/` in den Build. Schriften werden von Google Fonts geladen; ohne Netzwerk greifen lokale Ersatzschriften.

`Bf6StatsService` lädt K/D, Matches und Spielzeit über `/bf6/stats/`. Die Stunden werden aus `secondsPlayed / 3600` berechnet (numerische Entsprechung zu `timePlayed`). Der Rang kommt separat aus `/bf6/profile/`, Feld `playerProfiles[0].playerCard.rank`. Schlägt nur die Profilabfrage fehl, bleiben die anderen Werte sichtbar; der Rang wird als nicht verfügbar markiert. Die Karten zeigen Lade- und Fehlerzustände mit Wiederholen-Button. Die API kann Daten zwischenspeichern; die Werte sind keine Echtzeit-Spielstände.

Nach Änderungen an `angular.json` den Entwicklungsserver neu starten (`Strg+C`, dann `npm start`), damit neue Asset-Verzeichnisse wie `public/images/` ausgeliefert werden.

## BF6-Statistik-Abzug

Beim Seitenaufruf werden die BF6-Statistiken aller öffentlichen Profile geladen. Die Kampfstatistik und der Vergleich mit dem jüngsten Tag vor heute verwenden ausschließlich die gemeinsame Historie aus public/data/bf6-stats-history.json. Die automatische Erfassung speichert diese Datei im Repository; eine Datenbank ist nicht erforderlich. Live-Abrufe im Browser erzeugen keine Tagesstände. API-Ersatzdaten zeigen keinen Vergleich, damit ein älterer Abzug keine irreführenden Rückgänge auslöst. Rhythmus und Verhalten stehen unter [Dateibasierte Historie](docs/history.md).

Die alten Local-Storage-Schlüssel bf6-stats-history:v1: und bf6-stats-history:v2: werden beim nächsten Seitenaufruf entfernt. Andere Browserdaten bleiben erhalten. Die vom Betreiber gelieferten Historien wurden vorher in die gemeinsame Historie importiert und liegen zusätzlich im Repository. npm run test:history prüft die gemeinsame Historie und die gezielte Bereinigung.

Erfolgreich geladene API-Statistiken werden pro Spieler für fünf Minuten im Arbeitsspeicher gecached. Beim Spielerwechsel werden sie wiederverwendet; parallele Abfragen für denselben Spieler teilen einen Request. Nach einem Neuladen der Seite beginnt der Cache neu. „Erneut laden“ leert den Cache des ausgewählten Spielers. Fehler und lokale Statistik-Abzüge werden nicht gecached.

Für Live-Statistiken und automatische Abzüge wird zunächst `platform=ea` versucht, jeweils mit Spielernamen und bei Bedarf Spieler-ID. Scheitern beide Abfragen, folgt dieselbe Reihenfolge mit `platform=pc`. Erst wenn beide Plattformen fehlschlagen, verwendet die Website den gespeicherten Abzug; die automatische Erfassung erhält die vorhandenen Daten.

Die BF6-Ansicht zeigt auch die abgefeuerten Schüsse (`shotsFired`). Die Historie summiert Spielzeit, Schüsse und Matches aus den numerischen `totals` der Einträge in `src/app/data/battlefield-history.ts` und den aktuellen BF6-Werten (bei API-Problemen aus dem lokalen Abzug). BF6 wird einmal gezählt. Fehlende Werte werden nicht als null Schüsse oder null Matches interpretiert, sondern als unvollständige Summe gekennzeichnet. Bei neuen historischen Einträgen die numerischen `totals` zusammen mit den angezeigten `stats` pflegen.

`npm run snapshot:bf6` ruft die Statistiken und den Rang von MV-8lackh4wk, MV-Criban und MV-54bI44 ab und speichert sie mit dem jeweiligen Abrufdatum in `public/data/bf6-stats-snapshot.json`. Private Profile werden nicht abgerufen. Erfolgreiche Abrufe werden nach Prüfung von K/D und Rang je Spieler übernommen; bei fehlgeschlagenen Abrufen bleiben dessen gespeicherte Werte erhalten.

Der Abzug wird mit der Seite ausgeliefert. Bei API-Fehlern, ungültiger K/D oder Zeitüberschreitungen lädt die Statistikansicht automatisch diese Datei. Sie kennzeichnet die gespeicherten Werte und zeigt Datum und Uhrzeit des Abzugs in der Zeitzone Europe/Berlin. „Live-Daten erneut laden“ versucht erneut die API. Bei erfolgreichen API-Abfragen werden weiterhin Live-Daten angezeigt. Zum Aktualisieren den Befehl erneut ausführen und die Seite mit der aktualisierten Datei veröffentlichen.

Inoffizielles Fanprojekt, nicht mit EA oder DICE verbunden. Die gemeinsame Tageshistorie wird durch GitHub Actions als JSON im Repository gespeichert; das Frontend bleibt statisch.


## GitHub Pages

Der Workflow `.github/workflows/pages.yml` baut und veröffentlicht die Seite nach jedem Push auf `main`. Im Repository unter Settings > Pages als Quelle GitHub Actions wählen. Der Basis-Pfad wird automatisch aus der Pages-Konfiguration übernommen. Auch die Hallenkulisse funktioniert im Unterverzeichnis einer Projektseite.

## Gemeinsame Statistik-Historie

Dateien, automatische Speicherung und Diagramm: [Historie](docs/history.md). Ein separater Statistik-Workflow erfasst täglich um 12:00 und 19:00 Uhr Berliner Zeit validierte BF6-Tagesstände und startet nach erfolgreichen Datenänderungen die Veröffentlichung. Der Pages-Workflow veröffentlicht Änderungen unabhängig von der API. Eine Datenbank oder ein Datenbank-Secret ist nicht erforderlich.

Die Clanübersicht ist die Startseite und auch unter `#/clan` erreichbar. Ein Klick auf einen aktiven Spieler öffnet seine Fokusansicht innerhalb derselben Seite mit einer kurzen Kamerafahrt und Überblendung; bei reduzierter Bewegung entfällt die Animation; „Übersicht“ im Menü führt zur Clanübersicht zurück. Die Übersicht zeigt die K/D und bei vergleichbaren Live-Daten den Trendpfeil. Gespeicherte Abzüge sind mit Datum und Uhrzeit gekennzeichnet. K/D, Spielzeit und Matches zeigen bei verfügbaren Live-Daten ihre Änderung zum letzten gespeicherten Tag vor heute; die K/D zeigt zusätzlich den Trend des letzten vergleichbaren Tagessegments. Ersatzdaten und fehlende Vergleichswerte erhalten keine Änderungsanzeige. Die Battlefield-Historie zeigt neueste Spiele zuerst und ergänzt BF6 mit verfügbaren aktuellen Werten; Ersatzdaten und unvollständige Summen werden gekennzeichnet.

Die Squad-K/D auf der Startseite umfasst Blackhawk und Criban: Ihre Spieler-Kills werden addiert und durch ihre gemeinsamen Deaths geteilt. Fehlen dafür Werte, ist die Squad-K/D nicht verfügbar. Verwendete gespeicherte Abzüge werden je Spieler mit Datum und Uhrzeit gekennzeichnet.
