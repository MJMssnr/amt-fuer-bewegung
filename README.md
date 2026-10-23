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
Diagrammarten: `xt`, `vt`, `at` (später `yt`, `vyt`, `ayt`). `given` darf außerdem `"anim"` (Animation)
und `"data"` (Datenblatt der Bewegung) enthalten.

**Aufgabentypen** (`task.type`):
- `match` – passendes Diagramm wählen (`ask`: gesuchte Diagrammart)
- `describe` – fachsprachlich korrekte Beschreibung wählen (Texte werden automatisch erzeugt)
- `axes` – Achsen-Detektiv: `"graph": "vt"`, `"marks": ["t","y"]`, optional `"hints": {"t":[…], "y":[…]}`
- `errorhunt` – Fehlerjagd: `"graph": "xt"`, `"error": {"segment": 1, "kind": "sign" | "value" | "shape", "factor": 0.5}`
- `live` – Live-Steuerung: `"player": "florian"`, `"vmax": 4`, `"ghost": false`, optional `"tol"` (nur gleichförmige Abschnitte)
- `construct` – Konstrukteur: `"given": ["anim","vt"]`, `"ask": "xt"` (Endwerte und Form je Abschnitt selbst eintragen)
- `reaction` – Reaktionstest: `"v_kmh": 25`, `"a": 4`, `"sprite": "cyclist"`, `"vehicle": "mit dem Fahrrad"`
- `calc` – Werte berechnen und eintippen:
```json
"task": { "type": "calc", "given": ["anim", "data"], "paper": "…",
  "questions": [
    { "label": "Treffzeitpunkt", "symbol": "t_T", "unit": "s",
      "goal": { "type": "meet", "a": "anna", "b": "bernd", "ask": "t" },
      "hints": [ { "value": 600, "text": "Hinweis, wenn genau dieser falsche Wert eingegeben wird" } ],
      "help": "Allgemeiner Tipp nach dem 2. Fehlversuch" } ] }
```
Einheiten: `m`, `s`, `m/s`, `m/s²`, `km/h`, `km`, `min`. Toleranz: eine Einheit in der 2. signifikanten Stelle
(eigene Toleranz mit `"tol"`). Verfügbare Goals: `meet`, `timeUntil`, `valueAt`, `displacement`, `totalPath`,
`avgSpeed`, `avgVelocity`, `segment` (Weg/Dauer eines Abschnitts), `max`, `min`, `distanceAt`, `duration`, `solveFor`.

**Zufallsvarianten** (jeder Spieler bekommt andere Zahlen):
```json
"vary": { "options": [ { "v": 10 }, { "v": 12.5 } ], "set": { "actors.car.segments.0.v": "v" } }
```
In allen Texten und Hinweisen des Tickets werden `{Ausdrücke}` eingesetzt, z. B. `"{v*3.6} km/h"` oder `"value": "{3000/va}"`.

Nach dem Bearbeiten: `node --test tests/*.test.mjs` prüft, ob alle Verweise stimmen und jede Frage lösbar ist.

### 3. Figuren und Orte
- Figuren: `data/story.json` → `characters`
- Orte und Straßen: `data/map.json`
- Sprites: `assets/sprites.json`. Eigene PNGs: Datei nach `assets/img/` legen und z. B.
  `"wappen": { "png": "assets/img/wappen.png", "w": 32, "h": 32 }` eintragen.

### 4. Baumhaus-Shop und Prüfung
- Gegenstände, Preise und Texte: `data/shop.json` (neue Gegenstände brauchen einen Platz in `js/render/room-art.js`).
- Abschlussprüfung: `data/exam.json`.

Formatbeschreibungen: siehe `schema/`.

## Projektdokumentation
- `docs/ENTSCHEIDUNGEN.md` – Konzept, Didaktik, Regeln und ihre Begründung
- `docs/ROADMAP.md` – was als Nächstes kommt
- `docs/VERLAUF.md` – Wünsche und Umsetzung, chronologisch
