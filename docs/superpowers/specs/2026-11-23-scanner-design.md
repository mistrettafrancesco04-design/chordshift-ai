# Dokumentenscanner – iPhone Web-App (Design)

Stand: 2026-11-23

## Wofür und warum

Eine Web-App fürs iPhone, die Papier so scannt wie eine echte Scanner-App:
Kamera aufs Blatt halten, die App findet das Blatt live, schneidet alles drumherum
weg, zieht die Perspektive gerade und bereitet das Bild auf. Das Ergebnis ist ein sauberes PDF.

Genutzt wird sie für **Rechnungen** (auch lange, schmale Kassenbons) und **Schulunterlagen**
(Arbeitsblätter, Mitschriften, oft mit Textmarker und Farbstift).

## Ziele

- Live-Kamera: Das Blatt wird im Kamerabild in Echtzeit umrandet.
- Automatisches Auslösen, sobald das Blatt ruhig erkannt wird. Der Auslöser-Knopf funktioniert immer zusätzlich.
- Perspektivkorrektur: Ein schräg fotografiertes Blatt wird zum geraden Rechteck.
- Professionelle Aufbereitung: weißes Papier ohne Schatten, kräftiger, scharfer Text.
- Mehrere Seiten pro PDF, die sich umsortieren, löschen und neu aufnehmen lassen.
- Ecken lassen sich nach der Aufnahme per Finger korrigieren (mit Lupe).
- Das PDF wird über das iPhone-Teilen-Menü weitergegeben (Dateien, Mail, WhatsApp, AirDrop).
- Alles läuft auf dem Gerät, ohne Server. Die App funktioniert nach dem ersten Laden auch offline.
- Die Oberfläche ist auf Deutsch.

## Nicht-Ziele

- Keine Texterkennung (OCR) und keine durchsuchbaren PDFs.
- Keine Konten, keine Cloud, keine Ablage/Ordnerverwaltung in der App.
- Keine native App (App Store).

## Was wäre ein Fehlschlag, auch wenn es technisch läuft

- Scans sehen aus wie Fotos: grauer Hintergrund, Schatten der Hand oder des Handys, schiefe Ränder.
- Die Umrandung zittert oder springt so, dass Auto-Auslösen nie oder im falschen Moment passiert.
- Textmarker und Farbe gehen bei Schulunterlagen verloren, weil nur Schwarz-Weiß angeboten wird.
- Kassenbons werden auf A4 gestreckt oder gequetscht.
- Dokumente verlassen das Gerät.
- Bereits aufgenommene Seiten gehen verloren, wenn man kurz in eine andere App wechselt.

## Rahmenbedingungen

- iPhone Safari und als Homescreen-App (PWA). Kamera über `getUserMedia` (Rückkamera, so hohe
  Auflösung wie möglich). Die Kamera braucht **HTTPS**, gehostet wird also z. B. über GitHub Pages.
- Safari kennt `ImageCapture.takePhoto` nicht. Die Aufnahme ist daher ein Einzelbild aus dem
  Videostream in voller Stream-Auflösung (Ziel 3840×2160 bzw. 4K anfragen).
- iOS begrenzt Canvas-Größe und Arbeitsspeicher. Bilder werden auf eine sinnvolle Größe begrenzt
  (lange Seite der fertigen Seite ca. 2400–2500 px, also etwa 300 dpi bei A4).
- Das Repo heißt `chordshift-ai` (laut README ein Noten-Transponierer) und ist sonst leer. Die App
  kommt deshalb in einen eigenen Ordner `scanner/`, damit das Repo-Thema nicht vermischt wird.

## Ansätze

| Ansatz | Vorteil | Nachteil |
|---|---|---|
| **A) OpenCV.js (gewählt)** | bewährte Kanten-/Konturerkennung, Perspektivkorrektur und Filter aus einer Hand; robust bei unruhigem Hintergrund und schlechtem Licht | ca. 8–10 MB beim ersten Laden (danach gecacht, offline nutzbar) |
| B) Eigene schlanke Erkennung | lädt sofort | deutlich unzuverlässiger (weißes Blatt auf hellem Tisch, Schatten), öfter manuelles Nachziehen |
| C) KI-Modell | evtl. am robustesten | groß, langsamer, kein gutes fertiges Modell → verworfen |

A wurde gewählt, weil „so professionell wie möglich“ Vorrang vor der Ladezeit beim ersten Öffnen hat.
Der Nutzer hat das Wie an Claude übergeben. A ist Claudes Wahl.

## Entschieden vom Nutzer

- Live-Kamera als Hauptweg.
- Einsatz: Rechnungen und Schule.

## Claudes Entscheidungen (bitte prüfen)

1. **Galerie-Import zusätzlich** als Notlösung (z. B. für ältere Fotos), mit derselben Erkennung und Bearbeitung.
2. **Filter** (pro Seite umschaltbar, eine Vorschau pro Filter):
   - **Auto (Standard):** Ausleuchtung ausgleichen (Schatten raus, Papier weiß), Kontrast strecken,
     leicht nachschärfen. **Farben bleiben erhalten**, damit Textmarker und Stempel sichtbar bleiben.
   - **S/W Dokument:** reines Schwarz-Weiß für maximale Lesbarkeit und kleine Dateien (Rechnungen).
   - **Graustufen**
   - **Original:** nur zugeschnitten und entzerrt.
3. **Seitengröße im PDF:** Wenn das Seitenverhältnis nahe an A4 liegt (±10 %), wird die Seite A4.
   Sonst behält sie ihr echtes Seitenverhältnis bei A4-Breite (z. B. Kassenbon), ohne Verzerrung.
4. **Dateiname:** `Scan_JJJJ-MM-TT_HH-MM.pdf`, umbenennbar vor dem Teilen.
5. **Seiten zwischenspeichern** im Gerätespeicher (IndexedDB), damit nach einem App-Wechsel nichts
   verloren geht. Nach dem Erstellen des PDFs kann man die Sitzung leeren.
6. **Auto-Auslösen:** wenn die erkannten Ecken ca. 1 Sekunde lang stabil sind (kleine Bewegung
   toleriert), mit kurzer Füll-Animation am Rand. Auto-Auslösen lässt sich ein- und ausschalten.
7. **Optik:** dunkle, ruhige Kamera-Oberfläche wie bei Scanner-Apps. Erkannte Blattfläche
   halbtransparent blau mit kräftigem Rand. Große Bedienelemente unten (Daumenbereich), Safe-Area beachtet.

## Ablauf (Bildschirme)

```
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ [Auto ●]       [⚡]   │   │ ← Zurück   Seite 2/3 │   │ Scan_2026-11-23.pdf  │
│                      │   │                      │   │ ┌──┐┌──┐┌──┐         │
│   ┌─────────────┐    │   │   ○───────────○      │   │ │1 ││2 ││3 │  [+]    │
│   │ blau umran- │    │   │   │  Ecken     │     │   │ └──┘└──┘└──┘         │
│   │ detes Blatt │    │   │   │  ziehen    │     │   │ halten = verschieben │
│   └─────────────┘    │   │   ○───────────○      │   │                      │
│                      │   │ [Auto][S/W][Grau][Orig]│ │                      │
│ [Galerie] (◯) [3 ▸]  │   │ [⟲ Drehen] [✓ Fertig]│   │   [ PDF teilen ]     │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
   Kamera                     Seite prüfen               Seiten & PDF
```

1. **Kamera:** Livebild mit Umrandung, Auslöser, Auto-Schalter, Blitz/Taschenlampe (falls vom
   Gerät unterstützt), Galerie-Knopf und Zähler der Seiten mit Vorschau.
2. **Seite prüfen** (nach jeder Aufnahme kurz, oder später antippen): Ecken ziehen mit Lupe,
   90° drehen, Filter wählen, neu aufnehmen. Standard: Nach Auto-Aufnahme geht es direkt weiter
   zur nächsten Aufnahme, die Prüfung ist über die Vorschau erreichbar (wie bei Scanner-Apps).
3. **Seiten & PDF:** Vorschaubilder, umsortieren, löschen, weitere hinzufügen, Dateiname, PDF teilen.

## Technik (für den Bauenden)

- **Erkennung (live):** Bild verkleinert (lange Seite ca. 500 px), etwa alle 100–150 ms.
  Graustufen → Weichzeichnen → Canny + Dilatation → Konturen → `approxPolyDP` → größtes
  konvexes Viereck mit Mindestfläche (ca. 15–20 % des Bildes). Ersatzweise ein zweiter Durchgang
  über Schwellwert (Otsu/morphologisch), falls Canny nichts findet. Ecken über die Zeit glätten,
  damit die Umrandung nicht zittert.
- **Aufnahme:** Vollbild aus dem Stream, Ecken auf volle Auflösung hochrechnen, dort ggf. fein nachsuchen.
- **Entzerrung:** `getPerspectiveTransform` + `warpPerspective`. Die Zielgröße folgt aus den
  gemessenen Kantenlängen, begrenzt wie oben beschrieben.
- **Aufbereitung „Auto“:** Hintergrundhelligkeit schätzen (große morphologische Schließung oder
  starker Weichzeichner auf der Helligkeit), Bild dadurch teilen, Kontrast strecken, Unschärfemaske.
- **PDF:** jsPDF, JPEG (Qualität ca. 0,8). Dokumenttitel in den Metadaten.
- **Teilen:** `navigator.share({ files })`, sonst Download.
- **Offline:** OpenCV.js und jsPDF liegen als Dateien im Projekt (nicht vom CDN zur Laufzeit) und
  werden vom Service Worker gecacht. Manifest + Icons für den Homescreen.
- **Erkennung im Hintergrund-Thread** (Web Worker), wenn die Oberfläche sonst ruckelt.
- **Prüfen:** Logik (Ecken sortieren, Zielgröße, Seitengröße) mit Tests. Erkennung mit
  synthetischen Testbildern. End-to-End mit Chromium-Fake-Kamera (Videodatei als Kamera).

## Offen für den Bauenden

- Genaue Schwellwerte und Parameter der Erkennung und der Filter (durch Testen festlegen).
- Animationen und Feinheiten der Optik im Rahmen von Punkt 7.
- App-Name und Icon (Arbeitstitel: „Scanner“).

## Nach dem Bauen (Nutzer)

- GitHub Pages im Repo einschalten, damit die App eine HTTPS-Adresse bekommt. Dann in Safari
  öffnen → Teilen → „Zum Home-Bildschirm“.
