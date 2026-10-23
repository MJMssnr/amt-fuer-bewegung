# CLAUDE.md – Amt für Bewegung aller Art

Lernspiel (FOS 11/12) zu Bewegungsdiagrammen: t-x, t-vₓ, t-aₓ, später 2D (Würfe, Vektoraddition).
Spieler ist Florian, der per Namensverwechslung das „Amt für Bewegung aller Art“ leitet und Bürgeranfragen (Tickets) löst.

## Regeln für die Arbeit an diesem Repo
- **Kein Build, kein npm-Framework.** Vanilla JS, ES-Module, läuft direkt auf GitHub Pages.
- **Sprache:** UI-Texte und Kommentare auf Deutsch. Zahlen mit Dezimalkomma (`js/render/format.js`).
- **Dateien klein halten** (< ~300 Zeilen). Gezielt einzelne Dateien ändern, nicht alles neu schreiben.
- **Physik nur in `js/engine/`** (kein DOM). Darstellung nur in `js/render/`. Spielablauf in `js/ui/` und `js/main.js`.
- **Inhalte sind Daten:** Neue Aufträge/Bewegungen als JSON in `data/`, nicht im Code.
- **Tests:** `node --test tests/*.test.mjs` muss grün bleiben. Neue Goals/Engine-Funktionen bekommen einen Test.
- Zielgeräte: Notebook, iPad, Smartphone **quer**. Layout bei 667×375 prüfen.
- Fachsprache korrekt: „verzögert/bremst“ nur, wenn der *Betrag* von v abnimmt.

## Struktur
```
index.html, css/style.css
js/main.js                 Einstieg: lädt Daten, verbindet Karte ↔ Tickets ↔ Aufgaben
js/engine/kinematics.js    2D-Kinematik, stückweise konstantes a, Ereignisse ("until")
js/engine/goals.js         Auswertbare Fragen, erweiterbar per registerGoal()
js/render/graph.js         SVG-Diagramme (KINDS: xt, vt, at, yt, vyt, ayt)
js/render/scene.js         Pixel-Animation der Akteure mit Maßband
js/render/pixel.js         Sprites aus assets/sprites.json oder PNG
js/render/format.js        Zahlenformat, schöne Achsenteilung
js/tasks/index.js          Register der Aufgabentypen
js/tasks/match.js          Typ A: Zuordnen
js/tasks/distractors.js    Distraktoren aus Fehlvorstellungen (CATALOG)
js/ui/overworld.js         Stadtkarte (data/map.json)
js/ui/dialog.js, state.js  Dialoge, Spielstand (localStorage)
data/tickets.json          Aufträge (Level)
data/scenarios/*.json      Bewegungen
data/story.json            Figuren, Intro, Outro
data/map.json              Orte, Straßen, Bäume
assets/sprites.json        Pixel-Sprites; assets/img/ für eigene PNGs
schema/                    Formatbeschreibung der JSON-Dateien
```

## Erweitern
- **Neuer Aufgabentyp:** `js/tasks/<typ>.js` mit `export function mount(root, { ticket, world, onSolved })` → `{ destroy() }`, dann in `js/tasks/index.js` eintragen.
- **Neues Goal:** in `goals.js` `registerGoal('name', (goal, world) => ({ wert: … }))`.
- **Neue Fehlvorstellung:** Eintrag in `CATALOG` und `PRIORITY` in `distractors.js`.

## Geplant (Reihenfolge offen)
H Berechnen (Goals → Eingabe mit Toleranz), G Beschreiben (Fachsprache-Distraktoren), C Achsen-Detektiv,
D Regie, E Fehlerjagd, F Live-Steuerung, 2D-Szenen (Wurf), Vektoraddition, PWA/offline, Geld ausgeben (Messgeräte).
