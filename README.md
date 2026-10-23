# Amt für Bewegung aller Art

Ein Browser-Lernspiel zu Bewegungsdiagrammen (t-x, t-vₓ, t-aₓ) für die Oberstufe.
Florian bekommt durch eine Namensverwechslung das städtische „Amt für Bewegung aller Art“ und
löst Bürgeranfragen, indem er Bewegungen analysiert – mit Papier und Bleistift.

**Spielen:** https://mjmssnr.github.io/amt-fuer-bewegung/ (Smartphone bitte quer halten)

## Lokal starten
Die Seite lädt JSON-Dateien und muss daher über einen Webserver laufen (Doppelklick auf `index.html` geht nicht):

```bash
python3 -m http.server 8000
# dann im Browser: http://localhost:8000
```

Tests der Physik-Engine: `node --test tests/*.test.mjs`

## Neue Inhalte hinzufügen (ohne Programmieren)

### 1. Eine Bewegung: `data/scenarios/<id>.json`
```json
{
  "id": "oma-scooter",
  "title": "Oma auf dem E-Scooter",
  "actors": [
    { "id": "oma", "sprite": "broesel", "x0": 0,
      "segments": [
        { "dt": 4.5, "v": 2.5 },
        { "dt": 3,   "v": -2.0 },
        { "dt": 2,   "a": 1.5 },
        { "until": "rest", "a": -3 }
      ] }
  ]
}
```
- `"v"`: konstante Geschwindigkeit, `"a"`: konstante Beschleunigung ab der aktuellen Geschwindigkeit
- `"v0"` im Abschnitt: Geschwindigkeit springt vorher auf diesen Wert
- `"until"`: statt `dt` – `"rest"` (Stillstand), `"landing"` (y = 0), `{"x": 50}`, `{"vx": 0}` …
- 2D: Vektoren als `[x, y]`, z. B. `"v0": [5, 10]`, `"a": [0, -9.81]`
- Mehrere Akteure sind möglich (Begegnung, Einholen).

### 2. Ein Auftrag: Eintrag in `data/tickets.json`
```json
{
  "id": "t05-oma", "title": "Oma ist zu flott", "from": "broesel", "node": "lindenstrasse",
  "requires": ["t01-sportwagen"], "reward": 60, "scenario": "oma-scooter",
  "intro":   [["broesel", "Text …"], ["florian", "Text …"]],
  "task":    { "type": "match", "actor": "oma", "given": ["anim", "vt"], "ask": "xt",
               "paper": "Was auf Papier gerechnet werden soll." },
  "success": [["florian", "Auflösung mit Fachsprache …"]]
}
```
Diagrammarten: `xt`, `vt`, `at` (später `yt`, `vyt`, `ayt`). `given` darf `"anim"` enthalten.

### 3. Figuren und Orte
- Figuren: `data/story.json` → `characters`
- Orte und Straßen: `data/map.json`
- Sprites: `assets/sprites.json`. Eigene PNGs: Datei nach `assets/img/` legen und z. B.
  `"wappen": { "png": "assets/img/wappen.png", "w": 32, "h": 32 }` eintragen.

Formatbeschreibungen: siehe `schema/`.
