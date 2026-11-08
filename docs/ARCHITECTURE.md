# Architektur – CHORDSHIFT AI

## Grundprinzip

> **Nur Akkordsymbole werden verändert. Noten, Liedtexte und alle anderen Elemente bleiben pixelgenau erhalten.**

Die App bearbeitet das Notenblatt nie als Ganzes:

1. **Erfassen** – Kamera, Fotomediathek, PDF (pdf.js rendert jede Seite in 1800 px Breite) → `SheetSource` mit `pages[]`
2. **Erkennen** – On-Device-OCR (Tesseract, gebündelt, offline) liefert Wörter mit Boxen
3. **Filtern** – `extractChordsFromWords` behält nur *Akkordzeilen* (≥ 60 % gültige Akkorde, strenge Grammatik);
   Liedtextzeilen wie „A - ma - zing grace“ werden verworfen, obwohl „A“ ein gültiger Akkord ist
4. **Messen** – die Engine bestimmt pro Akkord Papierfarbe, Tintenfarbe, die **enge Tinten-Box** und den nachweislich
   leeren Platz rechts daneben
5. **Transponieren** – reine TypeScript-Engine (`src/features/music`)
6. **Rendern** – `compose` übermalt ausschließlich die Tinten-Box (+1 px Kantenglättung) und – nur falls der neue
   Akkord länger ist – leeres Papier rechts davon. Jedes andere Pixel wird 1:1 kopiert.

Die Live-Vorschau (`ChordOverlay`) bildet denselben Algorithmus mit React-Native-Views nach; die Ansicht „Ergebnis“
in der Vollbild-Vorschau zeigt das echte, von der Engine gerenderte Exportbild.

## Bildverarbeitungs-Engine (`src/features/engine`)

Eine unsichtbare WebView (Web: gleich-originiger iframe) führt `engine-runtime.ts` aus:

| Operation   | Aufgabe                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `renderPdf` | PDF-Seiten → PNG (pdf.js)                                               |
| `ocr`       | Notenlinien entfernen, Volltext-OCR + zeilenweise OCR (Tesseract, LSTM)  |
| `measure`   | Papier-/Tintenfarbe, enge Tinten-Box, freier Platz; `grow` für manuell gezogene Boxen |
| `compose`   | Endbild rendern – nur Akkordflächen werden neu gezeichnet               |

Bibliotheken liegen als Binär-Assets in `assets/engine/*.bin` (Update: `npm run engine:sync`) und werden beim ersten
Gebrauch in die WebView geladen. Alles funktioniert in **Expo Go** – es ist kein Development Build nötig.

## Ordnerstruktur

```
src/
├── app/                        Expo Router
│   ├── _layout.tsx             Root: Fonts, Gesten, Engine-Host, Import-Overlay, Stack
│   ├── (tabs)/                 Home · Meine Songs · Studio · Favoriten · Einstellungen
│   ├── preview.tsx             Vollbild-Vorschau: Zoom, Live/Ergebnis/Original, Akkorde bearbeiten/markieren
│   └── lab.tsx                 Chord Lab (Text-Transposer)
├── components/                 Design-System (Glass, Neon, Animationen), Tab-Bar, Logo
├── features/
│   ├── engine/                 Bildverarbeitung (WebView-Laufzeit + Client)
│   ├── music/                  Musiktheorie – pure TS, voll getestet
│   ├── transposer/             Studio: Store, Import, Analyse, Export, Komponenten
│   ├── library/                Songs & Favoriten (persistiert, Migration v1→v2)
│   ├── home/                   Dashboard-Komponenten
│   └── settings/               Einstellungen (persistiert)
├── lib/                        Haptik, Dialoge, Storage, Formatierung
└── theme/                      Design-Tokens
```

## Musik-Engine (`src/features/music`)

Dur, Moll, Septakkorde (7, maj7, m7, m7b5, dim7 …), Erweiterungen/Alterationen und Slash-Chords. Der Akkord-Suffix
bleibt zeichengenau erhalten, nur Grundton und Bass werden verschoben. Die Schreibweise (Kreuz/Be) folgt der
Zieltonart; deutsche Notation (H/B) für Ein- und Ausgabe.

## Optionaler Server-Analyzer

Mit `EXPO_PUBLIC_ANALYZER_URL` wird statt der On-Device-Erkennung ein HTTP-Dienst verwendet
(Vertrag: [ANALYZER_API.md](./ANALYZER_API.md)). Beide implementieren `SheetAnalyzer`.

## Bekannte Grenzen / nächste Schritte

- Handschriftliche Akkorde und stark perspektivisch verzerrte Fotos werden schlechter erkannt → Korrektur per
  Antippen bzw. „Fehlenden Akkord markieren“ in der Vollbild-Vorschau
- Perspektivkorrektur / Dokumentscanner für Kamerafotos
- Deutsche Langnamen (Fis, Es, As …) im Parser
- PDFs werden bis 12 Seiten importiert
