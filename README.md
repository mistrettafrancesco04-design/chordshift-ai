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

## Funktionen (Stand 0.1)

- **Home-Dashboard** – Import (Kamera / Galerie / Datei), Statistiken, zuletzt bearbeitete Projekte
- **Transposer Studio** – Vorschau mit Akkord-Overlay (gedrückt halten = Original), Analyse-Pipeline,
  Halbton-Stepper, Original- & Zieltonart, Kreuz/Be-Schreibweise, Speichern in der Bibliothek
- **Chord Lab** – Akkorde-über-Text eingeben/einfügen und live transponieren
- **Bibliothek** – gespeicherte Projekte (Bild wird dauerhaft im App-Speicher abgelegt)
- **Optionen** – internationale (B) oder deutsche (H) Notation für Ein- und Ausgabe, Vorzeichen, Haptik

Die automatische **Akkorderkennung** wird über eine austauschbare Schnittstelle angebunden
(`EXPO_PUBLIC_ANALYZER_URL`, siehe [docs/ANALYZER_API.md](docs/ANALYZER_API.md)). Ohne Konfiguration zeigt das Studio
„Analyse-Engine nicht verbunden“ – alle anderen Funktionen arbeiten bereits vollständig.

## Dokumentation

- [Architektur & Roadmap](docs/ARCHITECTURE.md)
- [Analyse-API-Vertrag](docs/ANALYZER_API.md)

## Builds

Für Store-Builds wird EAS verwendet (`npx eas-cli@latest build`). Die Bundle-IDs sind `ai.chordshift.app`
(iOS & Android) und können in `app.json` angepasst werden.
