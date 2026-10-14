# Neon für MV Headquarters

GitHub Pages liefert weiterhin das Angular-Frontend aus. Der Pages-Workflow erfasst täglich um 12:00, 21:45 und 23:30 Uhr Berliner Zeit die öffentlichen BF6-Profile. Die Workflow-Zeitzone Europe/Berlin berücksichtigt Sommer- und Winterzeit automatisch. Der Job speichert validierte Tagesstände in Neon und veröffentlicht die Historie als JSON zusammen mit der Seite. Auch Pushes auf main und manuelle Workflow-Läufe erfassen einen Stand. Es gibt keine Datenbankzugangsdaten im Frontend und keine Schreibzugriffe aus dem Browser.

## Einrichten

1. Auf https://console.neon.tech ein kostenloses Projekt namens mv-headquarters erstellen. Eine EU-Region wählen, beispielsweise Frankfurt, sofern angeboten. Auth ist nicht nötig.
2. In Neon über Connect den PostgreSQL Connection String der gewünschten Datenbank und des dauerhaften Hauptbranches kopieren. Die Standarddatenbank und die Standardrolle reichen aus; SSL-Einstellungen im Connection String beibehalten.
3. In https://github.com/Criban/mv-headquarters/settings/secrets/actions ein Repository-Secret namens DATABASE_URL anlegen und den vollständigen Connection String als Wert eintragen. Nicht in Quellcode, Frontend-Konfiguration oder Chat einfügen.
4. Unter Settings → Pages muss GitHub Actions als Quelle ausgewählt sein. Durch die Repository-Umbenennung lautet die Standard-Projektseiten-URL https://criban.github.io/mv-headquarters/ (bei eigener Domain gilt deren Konfiguration).
5. Unter Actions → Publish GitHub Pages → Run workflow einmal initialize_history aktivieren und den Workflow auf main starten. Das führt database/001-bf6-history.sql aus, erfasst die Statistiken und veröffentlicht die Seite. Dafür müssen diese lokalen Änderungen erst nach ausdrücklicher Freigabe committed und gepusht werden.
6. In Neon im SQL-Editor prüfen: SELECT player_name, day, captured_at FROM bf6_daily_stats ORDER BY captured_at DESC;
7. Die K/D-Historie öffnen. Nach dem ersten erfolgreichen Lauf gibt es einen Punkt pro Spieler; nach einem weiteren Kalendertag entsteht der Verlauf.

## Daten und Verhalten

Pro Spieler und Kalendertag in Europe/Berlin bleibt der neueste erfolgreiche Stand erhalten. Wiederholte oder ältere Erfassungen überschreiben keinen neueren Stand. Alle älteren Tage bleiben bestehen. Gespeichert werden K/D, Spielstunden, Matches, Treffgenauigkeit, Schüsse und der bestehende API-Abzug für die Ersatzanzeige. Nur die veröffentlichten Metriken und Ersatzdaten werden als JSON ausgeliefert; das Frontend fragt Neon nicht direkt ab.

Die aktuelle Profil-Liste im Erfassungsskript enthält MV-8lackh4wk, MV-Criban und MV-54bI44, wie im aktuellen Frontend. MV-KingCoffee ist privat und wird nicht erfasst. Die gesamte Erfassung wird vor dem Speichern geprüft; bei API-Fehlern werden keine Ersatzwerte als neue Tagesstände geschrieben. Bei einem fehlgeschlagenen Erfassungsschritt wiederholt der Workflow den gesamten Abruf bis zu zweimal, nach 30 und 60 Sekunden Pause. Nach drei erfolglosen Versuchen schlägt er fehl und die zuletzt erfolgreich veröffentlichte Seite bleibt bestehen. Der zusätzliche Lauf um 21:45 Uhr sichert den Stand nach der üblichen Spielzeit 19:00–21:30 Uhr; der Lauf um 23:30 Uhr kann denselben Tagesstand aktualisieren. Scheitert der späte Lauf, bleibt ein früherer erfolgreicher Tagesstand erhalten. Browserdaten werden nicht hochgeladen. Die Ansicht verwendet ausschließlich die gemeinsame Historie. Alte BF6-Local-Storage-Verläufe werden beim Seitenaufruf entfernt; historische Tage können nicht rückwirkend aus der aktuellen API rekonstruiert werden.

Ohne DATABASE_URL können normale Pushes die Seite weiter mit den eingecheckten Ersatzdaten veröffentlichen. Geplante Erfassungen benötigen das Secret. Nach Aktivierung muss es erhalten bleiben: ohne das Secret würde ein normaler Build wieder die eingecheckten Daten verwenden. Ist Neon oder die Statistik-API vorübergehend nicht erreichbar, kann bei Bedarf lokal history:export ausgeführt werden, um vorhandene Daten ohne neue API-Erfassung zu exportieren.

Die JSON-Dateien entstehen im Build-Arbeitsverzeichnis und werden als Pages-Artefakt veröffentlicht. Der Workflow erstellt keine Commits und benötigt keine Schreibrechte am Repository-Inhalt. Der Basis-Pfad stammt weiterhin aus actions/configure-pages und passt damit auch zum neuen Repository-Namen.

## Lokal

DATABASE_URL als Umgebungsvariable setzen (nicht ausgeben). npm run history:init initialisiert das Schema, npm run history:sync erfasst und exportiert, npm run history:export exportiert nur bestehende DB-Daten. Die npm-Kommandos nutzen die mitinstallierte Node-22-Laufzeit. npm run test:history prüft Tagesgrenzen und Datenexport ohne Neon-Zugang.

## Betriebsgrenzen

GitHub-Zeitpläne können verspätet laufen oder ausfallen und werden bei öffentlichen Repositories nach 60 Tagen ohne Repository-Aktivität deaktiviert. Es gibt daher keine garantierte tägliche Erfassung; fehlende Tage werden nicht erfunden. Das Frontend liest die gemeinsame Historie beim Seitenaufruf, neue Exportdaten stehen nach einem erneuten Laden zur Verfügung. Neon-Free-Kontingente und Actions-Verbrauch im Blick behalten.

Quellen: https://neon.com/docs/serverless/serverless-driver und https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

## Bestehende Browserhistorie importieren

Die vom Betreiber bereitgestellten je zwölf Tagesstände für MV-8lackh4wk, MV-Criban und MV-54bI44 (02.–14.10.2026, ohne 06.10.) stehen unverändert in database/imports/browser-history.json. Die vollständigen v2-Historien werden verwendet; die älteren v1-Duplikate werden nicht zusätzlich importiert. Der bei Criban mitgelieferte v1-Eintrag enthält Blackhawk-Werte und wird nicht übernommen. Es werden keine fehlenden Tage ergänzt.

Nach Veröffentlichung dieser Änderungen unter Actions → Publish GitHub Pages → Run workflow die Option import_browser_history aktivieren. Dieser Lauf importiert und veröffentlicht die Historie ohne neue API-Abfrage. Lokal entspricht dies npm run history:import mit gesetztem DATABASE_URL. Bereits vorhandene Datenbanktage bleiben vollständig erhalten; wiederholte Importe sind daher sicher. Bei mehreren mitgelieferten Ständen desselben Tages wird der neueste zuerst eingefügt.

Der Import erlaubt historische Metriken ohne vollständigen API-Abzug. Dazu wird snapshot nullable; die reguläre Erfassung speichert weiterhin vollständige Antworten. Die Ersatzanzeige verwendet ausschließlich echte API-Abzüge. Browserdaten enthalten keinen historischen Rang oder Waffenstatistiken; solche Werte werden nicht erfunden. Weitere bereitgestellte Spielerhistorien können im gleichen JSON-Format ergänzt werden.
