# PHÖNIX Beta 0.3

Eine lokale, installierbare Web-App für tägliche Selbstorganisation.

## Enthalten

- Dashboard mit automatischem Score
- tägliche Missionen
- Daily Check-in
- Mission Center
- 7-Tage-Review
- lokaler Datenspeicher
- Datenexport und -import
- installierbare PWA
- Offline-Unterstützung nach dem ersten Laden

## Schnellster Weg zur Nutzung: Netlify

1. Entpacke `PHOENIX_WebApp_Beta_0_3.zip`.
2. Öffne Netlify Drop im Browser.
3. Ziehe den kompletten Ordner `phoenix-webapp` in das Upload-Feld.
4. Netlify erstellt eine Webadresse.
5. Öffne diese Adresse auf dem iPhone.
6. Safari: Teilen → „Zum Home-Bildschirm“.
7. PHÖNIX erscheint danach wie eine App.

Wichtig: Nicht nur die Datei `index.html` hochladen. Der ganze Ordner muss hochgeladen werden, damit CSS, JavaScript, Icons und Offline-Funktion vorhanden sind.

## Alternative: GitHub Pages

1. Erstelle bei GitHub ein neues öffentliches Repository, z. B. `phoenix`.
2. Lade alle Dateien aus diesem Ordner in die oberste Ebene des Repositorys.
3. Öffne im Repository: Settings → Pages.
4. Wähle als Quelle „Deploy from a branch“.
5. Wähle Branch `main` und Ordner `/root`.
6. Speichere und warte auf die veröffentlichte Adresse.
7. Öffne die Adresse auf dem iPhone und füge sie zum Home-Bildschirm hinzu.

## Lokal am Computer testen

Die zuverlässigste Methode ist ein kleiner lokaler Webserver.

### Mit Python

Öffne ein Terminal im Projektordner und führe aus:

    python3 -m http.server 8080

Danach im Browser öffnen:

    http://localhost:8080

### Mit Visual Studio Code

Installiere die Erweiterung „Live Server“, öffne den Projektordner und starte „Open with Live Server“.

## Daten

PHÖNIX nutzt `localStorage`. Daten liegen ausschließlich im jeweiligen Browser und auf dem jeweiligen Gerät.

- Browserdaten löschen = PHÖNIX-Daten löschen.
- Regelmäßig unter „Daten“ ein Backup exportieren.
- Ein Backup kann später über „Daten importieren“ wiederhergestellt werden.
- Ohne Backend werden Daten nicht automatisch zwischen Geräten synchronisiert.

## Dateien

- `index.html`: Oberfläche
- `styles.css`: Design
- `app.js`: Logik und Datenspeicherung
- `manifest.webmanifest`: Installierbarkeit
- `service-worker.js`: Offline-Unterstützung
- `icon-192.png`, `icon-512.png`: App-Symbole

## Nächste sinnvolle Entwicklungsstufe

Beta 0.4:
- optionales Benutzerkonto
- verschlüsselte Cloud-Synchronisierung
- echte Datenbank
- konfigurierbare Aufgaben
- PHÖNIX-Priorisierungsengine
- Wochenziele und Trends
