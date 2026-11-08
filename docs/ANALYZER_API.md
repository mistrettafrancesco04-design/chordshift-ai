# Analyse-API (Vertrag)

Die App spricht mit einem Erkennungsdienst über **einen** Endpunkt.

## Request

`POST {EXPO_PUBLIC_ANALYZER_URL}/v1/analyze` – `multipart/form-data`

| Feld     | Typ    | Beschreibung                         |
| -------- | ------ | ------------------------------------ |
| `image`  | Datei  | Notenblatt (JPEG/PNG), Originalqualität |
| `width`  | String | Bildbreite in Pixeln                 |
| `height` | String | Bildhöhe in Pixeln                   |

## Response `200 application/json`

```json
{
  "chords": [
    {
      "id": "c1",
      "text": "Am7",
      "box": { "x": 0.112, "y": 0.204, "width": 0.041, "height": 0.018 },
      "confidence": 0.97
    }
  ],
  "detectedKey": "C",
  "durationMs": 840
}
```

- `box` ist **normiert** (0–1) relativ zum gesendeten Bild, Ursprung oben links, und umschließt nur das Akkordsymbol.
- Der Dienst soll **nur Akkordsymbole** liefern. Die App prüft trotzdem jeden `text` mit ihrem Akkord-Parser
  und verwirft alles, was kein gültiger Akkord ist (z. B. Liedtext-Fragmente).
- `detectedKey` (optional) – Tonart-ID wie `C`, `F#m`, `Bb`. Fehlt sie, schätzt die App die Tonart selbst.
- Fehler: beliebiger HTTP-Status ≠ 2xx → die App zeigt „Analyse fehlgeschlagen (HTTP …)“.

Implementierung der Validierung: `src/features/transposer/services/analysis/parse-response.ts` (mit Tests).
