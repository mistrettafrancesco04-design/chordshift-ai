# CHORDSHIFT AI

**AI Sheet-Music Chord Transposer** für iOS & Android – fotografiere oder lade ein Notenblatt hoch und transponiere
**ausschließlich die Akkordsymbole**. Noten, Liedtexte und alle anderen Elemente bleiben unverändert.

React Native · Expo SDK 58 · Expo Router · TypeScript (strict) · Zustand · Jest

## Schnellstart

```bash
npm install
npm start            # Expo Dev Server – QR-Code mit „Expo Go“ (iOS/Android) scannen
```

Weitere Befehle:

| Befehl              | Zweck                                         |
| ------------------- | --------------------------------------------- |
| `npm run ios`       | iOS-Simulator (macOS + Xcode)                 |
| `npm run android`   | Android-Emulator / per USB verbundenes Gerät  |
| `npm run web`       | Browser-Vorschau (nur zur schnellen Kontrolle) |
| `npm test`          | Unit-Tests (Musik-Engine, Analyse-Validierung) |
| `npm run typecheck` | TypeScript-Prüfung                            |
| `npm run lint`      | ESLint                                        |
| `npm run validate`  | Typecheck + Lint + Tests                      |

## Funktionen (Stand 0.2)

- **Home-Dashboard** – animierter Hero, Import (Kamera / Fotos / PDF / Dateien), laufende Session, Statistiken,
  zuletzt bearbeitete Songs und Favoriten
- **Transposer Studio**
  - Vorschau mit Live-Overlay, Original-Vergleich (gedrückt halten), Seitenleiste für mehrseitige PDFs
  - **On-Device-Akkorderkennung** (offline, keine Uploads) mit Fortschrittsanzeige
  - Tonartenkreis mit allen 12 Tonarten (Dur/Moll), Halbton-Stepper, Kreuz/Be-Schreibweise
  - Vorschau aller Akkordänderungen („G → A ×3“)
  - Vollbild-Vorschau mit Zoom: *Live*, *Ergebnis* (echtes Exportbild), *Original*, *Bearbeiten*
    (Akkord korrigieren/entfernen, fehlenden Akkord markieren)
  - Export: 1 Seite als PNG, mehrere Seiten als PDF (Teilen-Dialog)
- **Meine Songs** – Suche, Sortierung, Favoriten-Stern, Löschen (lange drücken)
- **Favoriten** – angeheftete Songs
- **Chord Lab** – Akkorde-über-Text live transponieren
- **Einstellungen** – Notation (B/H) für Ein- und Ausgabe, Vorzeichen, Haptik

Die Bildverarbeitung ersetzt nur die Pixel innerhalb der erkannten Akkordfelder – siehe
[Architektur](docs/ARCHITECTURE.md).

## Dokumentation

- [Architektur & Roadmap](docs/ARCHITECTURE.md)
- [Analyse-API-Vertrag](docs/ANALYZER_API.md)

## Builds

Für Store-Builds wird EAS verwendet (`npx eas-cli@latest build`). Die Bundle-IDs sind `ai.chordshift.app`
(iOS & Android) und können in `app.json` angepasst werden.
