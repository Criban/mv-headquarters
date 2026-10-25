# Dateibasierte BF6-Historie

Die Historie liegt in `public/data/bf6-stats-history.json`, der neueste API-Abzug in `public/data/bf6-stats-snapshot.json`. Neon, eine Datenbank und `DATABASE_URL` sind nicht mehr nötig. Die 63 bisher veröffentlichten Tagesstände (21 je öffentlichem Spieler, bis 24.10.2026) sind in die Datei übernommen. Fehlende historische Kills werden nicht rekonstruiert. Die ursprünglich gelieferten Browserdaten bleiben als Archiv in `database/imports/browser-history.json` erhalten; es gibt keinen Datenbankimport mehr.

## Automatische Erfassung

Der bestehende Pages-Workflow erfasst täglich um 12:00, 21:45 und 23:30 Uhr Berliner Zeit sowie bei Pushes auf main und manuellen Läufen die öffentlichen Profile. Pro Spieler und Berliner Kalendertag bleibt der neueste erfolgreiche Stand erhalten. Alle älteren Tage bleiben in der Datei. Fehlgeschlagene Abrufe werden bis zu zweimal nach 30 bzw. 60 Sekunden wiederholt; nach drei Fehlschlägen bleibt die vorherige Veröffentlichung online.

Der Workflow lädt beim Checkout den aktuellen Branchstand und sichert die API-Erfassung außerhalb des Git-Arbeitsverzeichnisses. Vor dem Speichern aktualisiert er main und fügt die erfassten Daten in dessen Historie ein. Neuere Tagesstände und API-Abzüge haben Vorrang. Nach erfolgreichen Historienprüfungen committed er ausschließlich die zwei Datendateien auf main. Wird ein Push wegen zwischenzeitlicher Änderungen abgelehnt, entfernt er nur seinen gerade erstellten Bot-Commit, lädt main erneut und führt die gesicherten Daten wieder zusammen (bis zu drei Versuche, ohne Force-Push). Danach baut er den aktualisierten Quellstand und veröffentlicht das Ergebnis. Ohne erfolgreichen Push wird nicht veröffentlicht.

Dafür hat der Build-Job `contents: write`. Durch den GitHub-Actions-Token erzeugte Pushes starten keinen weiteren Push-Workflow. Branchschutz muss diese Daten-Commits erlauben. Keine Zugangsdaten gelangen ins Frontend. Das bisherige DATABASE_URL-Secret kann in GitHub entfernt und das Neon-Projekt separat gelöscht werden; der Code benötigt beides nicht mehr.

Die JSON-Datei muss gültig und vorhanden sein. Ein fehlender oder beschädigter Verlauf wird nicht durch eine leere Historie ersetzt. Browserzugriffe sind ausschließlich lesend.

## Diagramm

Das gemeinsame Diagramm zeigt tägliche Kills gegen menschliche Spieler und Deaths als Balken, das gespeicherte Gesamt-K/D des jeweiligen Tages als Linie. Die Linie verwendet das bisherige `infantryKillDeath`, nicht das Tages-K/D. Dieses entspricht `dividedKills.human / deaths`. Gesamt-Kills inklusive Bots werden nicht als Ersatz verwendet. Die kumulativen Zähler werden aus derselben Statistikantwort gespeichert.

Tageswerte sind Differenzen zwischen Ständen aufeinanderfolgender Berliner Kalendertage, keine exakten Mitternachtsintervalle. Für den ersten Zählerstand ist noch kein Tageswert bestimmbar. Fehlende Tage, fehlende Zähler und Rückgänge nach Zählerkorrekturen erzeugen Lücken in den Balken. Die Monatsansicht summiert auswertbare Tageswerte und zeigt den letzten gespeicherten Gesamt-K/D-Stand je Monat. Die Abdeckung wird für den gewählten Monat angezeigt. Auch an Tagen ohne neue Kills oder Deaths zeigt die Linie das gespeicherte Gesamt-K/D. Der Tagesregler und die Diagrammauswahl zeigen alle zugehörigen Werte.

Die Linie erhält die bisherige Historie einschließlich alter Stände ohne Kills-/Deaths-Zähler. Solange keine auswertbaren Tageswerte vorliegen, bleibt die Linie sichtbar und ein Hinweis erklärt die fehlenden Balken. Die Monatsübersicht erlaubt den Sprung zu den Tageswerten eines Monats.

Die rechte Achse „K/D · ZOOM“ passt sich mit etwas Rand an die Gesamt-K/D-Werte des gewählten Zeitraums an. Dadurch sind auch kleine Änderungen sichtbar. Die linke Anzahlachse beginnt für die Balken weiterhin bei null.

Linienabschnitte erhalten dezente grüne oder rote Akzente, wenn das Gesamt-K/D gegenüber dem vorherigen gespeicherten Stand steigt oder fällt, auch über Tageslücken hinweg. Unveränderte oder nicht vergleichbare Abschnitte bleiben in der Design-Akzentfarbe. Der ausgewählte Punkt wird entsprechend stärker eingefärbt. Die Änderung mit Richtungspfeil steht im Tooltip und im zugänglichen Reglertext; eine zusätzliche wechselnde Textzeile entfällt, damit die Diagrammposition stabil bleibt. Wo vollständige kumulative Zähler vorliegen, werden deren ungerundete Verhältnisse verglichen, sodass auch Änderungen unterhalb der sichtbaren K/D-Rundung erkennbar sind. Alte Stände verwenden die gespeicherte K/D und kennzeichnen die Änderung als gerundet. Tagesbalken bleiben bei Lücken weiterhin leer; die Linienfarbe beschreibt dann die Gesamtänderung zwischen den gespeicherten Ständen, keine einzelne Tagesleistung. Zurückgesetzte Zähler erhalten keine Richtungsbewertung. Die Monatsübersicht vergleicht die letzten Gesamtstände der gespeicherten Monate.

## Lokal

`npm run history:sync` ruft die API ab und aktualisiert beide JSON-Dateien. `npm run test:history` prüft Speicherung und Diagrammberechnungen ohne Netzwerk oder Datenbank; `npm run build` prüft das Frontend. Die bestehenden Zeitpläne können durch GitHub verzögert werden oder ausfallen. Erfassungslücken werden nicht erfunden.

Quellen: [GameTools BF6-API](https://api.gametools.network/redoc), [GitHub Actions: Ereignisse durch GITHUB_TOKEN](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow), [GitHub Actions: Zeitpläne](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
