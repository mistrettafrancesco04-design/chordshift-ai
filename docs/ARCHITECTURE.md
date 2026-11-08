# Architektur – CHORDSHIFT AI

## Grundprinzip

> **Nur Akkordsymbole werden verändert. Noten, Liedtexte und alle anderen Elemente bleiben pixelgenau erhalten.**

Die App bearbeitet das Notenblatt nie als Ganzes. Stattdessen:

1. **Erfassen** – Foto (Kamera), Galerie oder Bilddatei → `SheetSource`
2. **Erkennen** – ein `SheetAnalyzer` liefert nur Akkordsymbole + Bounding-Boxes (normiert 0–1) → `SheetAnalysis`
3. **Validieren** – jede erkannte Zeichenkette muss den strengen Akkord-Parser bestehen, sonst wird sie verworfen
4. **Transponieren** – reine TypeScript-Engine (`src/features/music`) berechnet neue Akkordtexte
5. **Rendern** – `ChordOverlay` maskiert ausschließlich die Akkord-Boxen und schreibt den neuen Akkord hinein

## Ordnerstruktur

```
src/
├── app/                      Expo Router – jede Datei ist ein Screen
│   ├── _layout.tsx           Root: Fonts, Splash, Theme, Stack
│   ├── +not-found.tsx
│   └── (tabs)/               Tab-Navigation (eigene NeonTabBar)
│       ├── index.tsx         Home-Dashboard
│       ├── library.tsx       Bibliothek
│       ├── studio.tsx        Transposer Studio
│       ├── lab.tsx           Chord Lab (Text-Transposer)
│       └── settings.tsx      Optionen
├── components/
│   ├── ui/                   Design-System-Primitives (AppText, GlassCard, NeonButton …)
│   ├── navigation/           NeonTabBar
│   └── brand/                Logo
├── features/
│   ├── music/                Musiktheorie-Domäne – pure TS, keine RN-Imports, voll getestet
│   ├── transposer/           Studio: Typen, Store, Services (Import, Speicher, Analyse), Komponenten
│   ├── library/              Gespeicherte Projekte (persistiert)
│   └── settings/             Benutzereinstellungen (persistiert)
├── lib/                      Querschnitt: Haptics, Storage, IDs, Formatierung
└── theme/                    Design-Tokens: Farben, Abstände, Typografie, Effekte
```

**Regeln**

- `src/app/` enthält nur Screens; Logik lebt in `src/features/*`.
- `src/features/music` hat keine Abhängigkeiten zu React/React Native → auf Server/Web wiederverwendbar.
- Komponenten verwenden ausschließlich Tokens aus `src/theme` (keine Hex-Werte in Screens).
- State: `zustand`. Persistente Stores (`settings`, `library`) über AsyncStorage; der Studio-Store ist Sitzungs-State.

## Musik-Engine (`src/features/music`)

| Modul           | Aufgabe                                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| `notes.ts`      | Tonhöhenklassen, Notennamen parsen/schreiben, internationale & deutsche Notation (H/B) |
| `chord.ts`      | Strenge Akkord-Grammatik: Grundton, Suffix (unverändert), Bassnote; lehnt Wörter wie „Bob“, „Do“ ab |
| `keys.ts`       | 24 Tonarten mit Vorzeichen-Schreibweise, Intervall zwischen Tonarten          |
| `transpose.ts`  | Akkord transponieren, enharmonische Schreibweise nach Zieltonart, Text mit Akkordzeilen (Spalten bleiben ausgerichtet) |
| `detect-key.ts` | Tonart-Schätzung aus einer Akkordfolge                                         |

## Analyse-Engine austauschen

Alle Engines implementieren `SheetAnalyzer` (`src/features/transposer/services/analysis/sheet-analyzer.ts`).
`getSheetAnalyzer()` wählt die Engine. Aktuell vorhanden:

- `RemoteSheetAnalyzer` – HTTP-Dienst, aktiviert über `EXPO_PUBLIC_ANALYZER_URL` (Vertrag: [ANALYZER_API.md](./ANALYZER_API.md))
- Fallback ohne Konfiguration – meldet „Analyse-Engine nicht verbunden“

Geplant: On-Device-Erkennung (ML Kit / Apple Vision) als zweite Implementierung – erfordert einen Development Build.

## Roadmap (nächste Schritte)

1. Akkorderkennung anbinden (Cloud-OCR + Akkord-Klassifikation, danach On-Device)
2. Export: gerendertes Notenblatt als PNG/PDF teilen (`react-native-view-shot` / Print)
3. PDF-Import (mehrseitig)
4. Manuelle Korrektur einzelner Akkorde (Tippen auf Box)
5. Deutsche Langnamen (Fis, Es, As …) im Parser
