# Scanner – Dokumente scannen auf dem iPhone

Web-App, die Papier wie eine Scanner-App erfasst: Live-Kamera mit automatischer
Blatterkennung, Perspektivkorrektur, Aufbereitung (weißes Papier, scharfer Text)
und Export als mehrseitiges PDF. Alles läuft auf dem Gerät, auch offline.

## Auf dem iPhone einrichten

Die Kamera funktioniert nur über **https**. Am einfachsten über GitHub Pages:

1. Auf GitHub im Repo **Settings → Pages** öffnen.
2. Bei *Build and deployment* → *Source*: **Deploy from a branch**.
3. Branch wählen (z. B. `main`, nachdem der Code dort ist) und Ordner **`/ (root)`**, dann **Save**.
4. Nach ca. 1 Minute ist die App erreichbar unter
   `https://<dein-github-name>.github.io/chordshift-ai/scanner/`
5. Die Adresse in **Safari** öffnen → Kamera erlauben → **Teilen → Zum Home-Bildschirm**.

Beim ersten Öffnen werden ca. 11 MB geladen (Bildverarbeitung). Danach startet
die App sofort und funktioniert auch ohne Internet.

## Bedienung

- **Kamera**: Blatt ins Bild halten. Es wird blau umrandet; liegt es ca. 1 Sekunde
  ruhig, löst die App automatisch aus (Schalter „Auto“ oben links). Der große
  Auslöser funktioniert immer. Für die nächste Seite einfach das Blatt wechseln.
- **Galerie** (unten links): vorhandene Fotos importieren.
- **Vorschau** (unten rechts): alle Seiten. Antippen öffnet „Seite prüfen“:
  Ecken mit Lupe verschieben, Filter (Auto, S/W, Grau, Original), Drehen,
  Ganzes Bild, Neu aufnehmen, Löschen.
- **Seiten**: Reihenfolge mit ↑/↓ oder lange drücken und ziehen, Dateiname
  ändern, **PDF teilen** (Dateien, Mail, WhatsApp, AirDrop …).
- Normale Blätter werden A4, Kassenbons behalten ihr schmales Format.
- Seiten bleiben gespeichert, auch wenn du die App zwischendurch verlässt.

## Entwicklung

```bash
npm install
npm run vendor          # OpenCV.js + jsPDF nach scanner/vendor kopieren
npm test                # Unit-Tests + Browser-Tests (Playwright, simulierte Kamera)
node scripts/make-icons.mjs
```

Lokal testen: `scanner/` über einen Webserver ausliefern (localhost gilt als sicher,
die Kamera funktioniert dort im Desktop-Browser).

Nach Änderungen an App-Dateien `CACHE` in `scanner/sw.js` hochzählen
(z. B. `scanner-v2`), damit installierte Apps sicher die neue Version laden.
