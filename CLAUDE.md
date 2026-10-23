# CLAUDE.md – Amt für Bewegung aller Art

Lernspiel (FOS 11/12) zu Bewegungsdiagrammen: t-x, t-vₓ, t-aₓ, später 2D (Würfe, Vektoraddition).
Spieler ist Florian, der per Namensverwechslung das „Amt für Bewegung aller Art“ leitet und Bürgeranfragen (Tickets) löst.

## Zuerst lesen (Projektgedächtnis)
- **`docs/ENTSCHEIDUNGEN.md`** – alle Entscheidungen mit Begründung. Vor jeder Arbeit lesen; nicht stillschweigend davon abweichen.
- `docs/ROADMAP.md` – Geplantes, offene Entscheidungen, bekannte Schwächen.
- `docs/VERLAUF.md` – Wünsche von Herrn Messner und in welchem Commit sie umgesetzt wurden.
- **`docs/PLAYTEST.md`** – welche Aufträge schon Feedback/Einstufung haben, was noch zu testen ist.
- `docs/QUESTPLAN.md` + `docs/questplan.png` – Freischaltplan (automatisch erzeugt).
- **Pflege:** Neue Wünsche/Entscheidungen am Ende jeder Arbeitsrunde dort eintragen (im selben Commit wie der Code).

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
- **Gültige Ziffern:** Florians Zahlen in Dialogen mit mindestens 2 g.Z. („6,0 m“). Regeln in ENTSCHEIDUNGEN § 5.
- **Arbeitsweise mit Herrn Messner:** kurze Blöcke, je Block Commit + Push + kurze Meldung; er schreibt parallel.
- **Freischaltplan** nach Ticket-Änderungen neu erzeugen: `node tools/questplan.mjs && dot -Tpng -Gdpi=110 docs/questplan.dot -o docs/questplan.png`.
- `data/tickets.json` nie komplett neu serialisieren (Format!), neue Tickets im Repo-Stil anhängen.

## Struktur
```
index.html, css/style.css (+ fonts.css, questlog.css, tasks-neu.css)
assets/fonts/              Silkscreen (Titel) und VT323 (Text/Zahlen), OFL
tools/questplan.mjs        Freischaltplan docs/QUESTPLAN.md + questplan.dot
js/main.js                 Einstieg: Demo-Hinweis → Startbildschirm → Karte; Aufträge, Geld-Regeln, Prüfung
js/engine/kinematics.js    2D-Kinematik, stückweise konstantes a, Ereignisse ("until")
js/engine/goals.js         Auswertbare Fragen, erweiterbar per registerGoal()
js/engine/answer.js        Antwortprüfung: Toleranz = 1 Einheit in der 2. signifikanten Stelle
js/engine/variants.js      Zufallsvarianten: "vary" im Ticket, {Ausdrücke} in Texten, Spieler-Seed
js/engine/freehand.js      B: Begradigung (RDP) und Vergleich mit Toleranz
js/engine/geometry.js      K: Flächen-Zerlegung unter t-v; L: Steigung eines Abschnitts
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
js/tasks/types.js          Kennbuchstaben A–L der Typen (nie umnummerieren!)
js/tasks/common.js         Linke Spalte für alle Typen (Animation, Diagramme, Datenblatt, Notizzettel)
js/tasks/match.js          Typ A: Zuordnen
js/tasks/calc.js           Typ H: Berechnen (Goals -> Eingabe, Hinweise für typische Fehler)
js/tasks/describe.js       Typ G: Beschreiben; Textgenerator in describe-text.js
js/tasks/axes.js           Typ C: Achsen-Detektiv (Diagramm ohne Zahlen, markierte Linien)
js/tasks/errorhunt.js      Typ E: Fehlerjagd (Ralfs Diagramm, ein falscher Abschnitt)
js/tasks/live.js           Typ F: Live-Steuerung (vₓ per Regler, Spur gegen Soll)
js/tasks/construct.js      I: Konstrukteur: Diagramm selbst bauen (Endwerte + Form je Abschnitt)
js/tasks/reaction.js       J: Reaktionstest -> eigener Anhalteweg
js/tasks/freehand.js       B: Freihand mit Auto-Begradigung
js/tasks/area.js           K: Flächen-Puzzle
js/tasks/slope.js          L: Steigungsdreieck
js/tasks/direct.js         D: Regie (Engine: js/engine/direct.js)
js/tasks/strobe*.js        M/N/O: Stroboskop rechnen/beschreiben/bauen (Engine js/engine/strobe.js, Bild js/render/strobe.js)
js/ui/police.js            Gültige-Ziffern-Polizist (Texte data/police.json, Regeln js/engine/sigfig.js)
js/render/fotolabor.js     Slavis Fotolabor auf der Karte
js/tasks/questions.js      Gemeinsamer Eingabe-/Prüfblock für H, C und Reaktionstest
js/tasks/distractors.js    Distraktoren aus Fehlvorstellungen (CATALOG)
js/ui/overworld.js         Stadtkarte (data/map.json)
js/ui/dialog.js, state.js  Dialoge, Spielstand (localStorage; order/earned fürs Auftragsbuch)
js/ui/questlog.js          Auftragsbuch 📖 (Notizbuch-Animation, Status, Testmodus-Knöpfe)
js/ui/testmode.js          Testmodus: 20× Oma im Startbildschirm, „amtstest“ tippen, ?amtstest=1
js/ui/title.js, title-scene.js  Demo-Hinweis, animierter Startbildschirm
js/ui/room.js              Baumhaus-Zimmer mit Shop und Kiste
js/ui/delivery.js          Lieferung: Postbote Paul bringt jede Bestellung durch die Luke (Texte: shop.json → delivery)
js/ui/finale.js            Finale am Bauplatz (Bauen, Herr Messner, Stadt, Start), Texte data/finale.json
js/engine/packages.js      7 rätselhafte Pakete (Schwellen, 80-%-Regel)
js/ui/baerti.js            Waschbär Bärti im Baumhaus
js/render/ride.js          Rennrad/Motorrad auf der Karte
js/render/room-art2.js     Baumhaus-Anbau und neue Gegenstände
js/render/bauplatz.js      Bauplatz neben dem Baumhaus
js/ui/sound-menu.js        Klang-Menü im HUD (Lautstärken, stumm)
js/audio/sound.js          WebAudio-Synthese ohne Dateien: Stimmen (Formanten je Vokal, VOICES), Natur auf der Karte, Effekte
data/tickets.json          Aufträge (Level)
data/scenarios/*.json      Bewegungen
data/story.json            Figuren (mit "voice": florian | frau_mittel | frau_alt | mann_kraeftig | mann_duenn), Intro, Outro
data/map.json              Orte, Straßen, Bäume
data/shop.json             Gegenstände, Preise, Klicktexte; Raketenteile (nur Pakete, nicht kaufbar) und Paket-Texte
data/finale.json           Texte des Finales
data/police.json           Texte des Gültige-Ziffern-Polizisten
assets/sprites.json        Pixel-Sprites (erzeugt von tools/gensprites.mjs); assets/img/ für eigene PNGs
schema/                    Formatbeschreibung der JSON-Dateien
```

## Geld-Regeln
- Auswahl-Aufgaben (A, G, E): nur beim ersten Versuch richtig → voller Lohn, sonst 0 €.
- Rechen-/Ablese-Aufgaben (H, C) und Live (F): erster Versuch → voll; selbst gelöst nach Hinweisen → halb; „Lösung zeigen“ → 0 €.
- Konstrukteur (I), Reaktionstest (J), Freihand (B), Fläche (K), Steigung (L), Regie (D), Strobo M und O wie H. Strobo N wie A/G.
- Module melden onSolved({ attempts, grade: 'perfect' | 'partial' | 'fail' }).
- Verpatzte Aufträge (fail) kommen als „Nachfrage“ zurück, sobald zwei weitere erledigt sind (state.retry), mit neuer Variante.

## Erweitern
- **Neuer Aufgabentyp:** `js/tasks/<typ>.js` mit `export function mount(root, { ticket, world, onSolved })` → `{ destroy() }`, dann in `js/tasks/index.js` eintragen.
- **Neues Goal:** in `goals.js` `registerGoal('name', (goal, world) => ({ wert: … }))`.
- **Neue Fehlvorstellung:** Eintrag in `CATALOG` und `PRIORITY` in `distractors.js`.

## Geplant
Siehe `docs/ROADMAP.md`.
