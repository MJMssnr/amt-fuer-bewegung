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
  `tests/data.test.mjs` prüft alle Tickets (Orte, Figuren, Sprites, lösbare Goals).
- **Sprites ändern:** `tools/gensprites.mjs` bearbeiten, dann `node tools/gensprites.mjs`.
- Zielgeräte: Notebook, iPad, Smartphone **quer**. Layout bei 667×375 prüfen.
- Fachsprache korrekt: „verzögert/bremst“ nur, wenn der *Betrag* von v abnimmt.

## Struktur
```
index.html, css/style.css
js/main.js                 Einstieg: Demo-Hinweis → Startbildschirm → Karte; Aufträge, Geld-Regeln, Prüfung
js/engine/kinematics.js    2D-Kinematik, stückweise konstantes a, Ereignisse ("until")
js/engine/goals.js         Auswertbare Fragen, erweiterbar per registerGoal()
js/engine/answer.js        Antwortprüfung: Toleranz = 1 Einheit in der 2. signifikanten Stelle
js/engine/variants.js      Zufallsvarianten: "vary" im Ticket, {Ausdrücke} in Texten, Spieler-Seed
js/render/graph.js         SVG-Diagramme (KINDS: xt, vt, at, yt, vyt, ayt)
js/render/scene.js         Pixel-Animation der Akteure mit Maßband
js/render/pixel.js         Sprites aus assets/sprites.json oder PNG
js/render/painter.js       Welt->Bildschirm, kantenscharf; Text in nativer Auflösung (scharf)
js/render/town.js          Stadtboden, Bäume (round/pine/birch/fruit/blossom), Büsche, Blumen, Möbel
js/render/buildings.js     Gebäude, Schilder (wachsen mit dem Text), Kuckucks-Stadtuhr, Skatepark, Parkplatz
js/render/treehouse.js     Florians Baumhaus auf der Karte
js/render/school.js        Schule (FOS) auf der Karte
js/render/room-art.js      Baumhaus-Zimmer: Hintergrund, feste Plätze (SLOTS), Gegenstände (DRAW)
js/render/vehicles.js      Auto, Sportmotorrad, Rakete, Partikel (Startbildschirm, Finale)
js/render/format.js        Zahlenformat, schöne Achsenteilung
js/tasks/index.js          Register der Aufgabentypen
js/tasks/common.js         Linke Spalte für alle Typen (Animation, Diagramme, Datenblatt, Notizzettel)
js/tasks/match.js          Typ A: Zuordnen
js/tasks/calc.js           Typ H: Berechnen (Goals -> Eingabe, Hinweise für typische Fehler)
js/tasks/describe.js       Typ G: Beschreiben; Textgenerator in describe-text.js
js/tasks/axes.js           Typ C: Achsen-Detektiv (Diagramm ohne Zahlen, markierte Linien)
js/tasks/errorhunt.js      Typ E: Fehlerjagd (Ralfs Diagramm, ein falscher Abschnitt)
js/tasks/live.js           Typ F: Live-Steuerung (vₓ per Regler, Spur gegen Soll)
js/tasks/construct.js      Konstrukteur: Diagramm selbst bauen (Endwerte + Form je Abschnitt)
js/tasks/reaction.js       Reaktionstest -> eigener Anhalteweg
js/tasks/questions.js      Gemeinsamer Eingabe-/Prüfblock für H, C und Reaktionstest
js/tasks/distractors.js    Distraktoren aus Fehlvorstellungen (CATALOG)
js/ui/overworld.js         Stadtkarte (data/map.json)
js/ui/dialog.js, state.js  Dialoge, Spielstand (localStorage)
js/ui/title.js, title-scene.js  Demo-Hinweis, animierter Startbildschirm
js/ui/room.js              Baumhaus-Zimmer mit Shop und Kiste
js/ui/finale.js            Raketenstart nach bestandener Prüfung
data/tickets.json          Aufträge (Level)
data/scenarios/*.json      Bewegungen
data/story.json            Figuren, Intro, Outro
data/map.json              Orte, Straßen, Bäume
data/shop.json             Gegenstände, Preise, Klicktexte, Raketenteile (Balancing hier)
data/exam.json             Abschlussprüfung (Teile, Bestehensgrenze, Dialoge)
assets/sprites.json        Pixel-Sprites (erzeugt von tools/gensprites.mjs); assets/img/ für eigene PNGs
schema/                    Formatbeschreibung der JSON-Dateien
```

## Geld-Regeln
- Auswahl-Aufgaben (A, G, E): nur beim ersten Versuch richtig → voller Lohn, sonst 0 €.
- Rechen-/Ablese-Aufgaben (H, C) und Live (F): erster Versuch → voll; selbst gelöst nach Hinweisen → halb; „Lösung zeigen“ → 0 €.
- Konstrukteur und Reaktionstest wie H.
- Module melden onSolved({ attempts, grade: 'perfect' | 'partial' | 'fail' }).
- Verpatzte Aufträge (fail) kommen als „Nachfrage“ zurück, sobald zwei weitere erledigt sind (state.retry), mit neuer Variante.

## Erweitern
- **Neuer Aufgabentyp:** `js/tasks/<typ>.js` mit `export function mount(root, { ticket, world, onSolved })` → `{ destroy() }`, dann in `js/tasks/index.js` eintragen.
- **Neues Goal:** in `goals.js` `registerGoal('name', (goal, world) => ({ wert: … }))`.
- **Neue Fehlvorstellung:** Eintrag in `CATALOG` und `PRIORITY` in `distractors.js`.

## Geplant (Reihenfolge offen)
D Regie, Flächen-Puzzle, Steigungsdreieck, Druck-Arbeitsblatt, Sounds, 2D-Szenen (Wurf) = Teil 2, Vektoraddition, PWA/offline, Schrift lokal einbinden.
