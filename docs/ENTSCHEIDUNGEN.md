# Entscheidungen – das Gedächtnis des Projekts

> **Für Claude (und jede weitere KI/Person):** Diese Datei vor jeder Arbeit lesen.
> Sie hält fest, *was* entschieden wurde und *warum*. Wer davon abweichen will, fragt zuerst Herrn Messner.
> Herkunft jeder Entscheidung: siehe `docs/VERLAUF.md` (Nummern in Klammern, z. B. [W4] = Wunsch Nr. 4).

## 1. Rahmen

| Thema | Entscheidung | Grund |
|---|---|---|
| Auftraggeber | Herr Messner, Physiker und Lehrer (GitHub: MJMssnr) | – |
| Zielgruppe | FOS 11 Technik, FOS 12 Nichttechnik [W2] | Prüfungsrelevante Kinematik |
| Inhalt Teil 1 | t-x, t-vₓ, t-aₓ ineinander überführen; gleichförmig und gleichmäßig beschleunigt; mehrere Abschnitte; mehrere Akteure (Einholen, Begegnung, x(t) = ½at² + v₀t + x₀) [W1, W3] | Lehrplan |
| Teil 2 (später) | 2D: waagrechter und schiefer Wurf, grafische Vektoraddition. **Pflicht**, 3D nicht nötig [W3] | Darum ist die Engine schon jetzt 2D |
| Papier | Spiel ist **papiergestützt**: Achsen skalieren, rechnen von Hand. Notizzettel-Hinweise im Spiel [W1] | Prüfung findet auf Papier statt |
| Geräte | Notebook, iPad, Smartphone **quer**. Prüfen bei 667×375, 844×390, 1180×820, 1440×810 [W4] | Schüler spielen am Handy |
| Technik | Vanilla JS, ES-Module, kein Build, GitHub Pages [W1, W4] | Wartbar ohne Toolchain |
| Erweiterbarkeit | Bewegungen und Aufträge als JSON; Goals per `registerGoal` erweiterbar [W1, W4] | Herr Messner liefert später selbst Inhalte |
| Eigene Grafiken | Langfristig eigene PNGs möglich (Stadtwappen, Logos) [W4] | `assets/img/`, siehe README |
| Arbeitsweise | Token-sparsam; Dateien klein; gezielte Änderungen statt Neuschreiben | Wochenlimit |
| Sitzungsablauf | Herr Messner schreibt auch, während Claude arbeitet. Claude arbeitet in **kurzen Blöcken** und schließt jeden mit Commit + kurzer Meldung ab, damit Nachrichten zeitnah ankommen. Rückfragen kurz [W17] | Paralleles Arbeiten |
| Schrift | Lokal in `assets/fonts/` (keine Google Fonts). **Silkscreen** („AmtTitel“) für Titel, HUD, Knöpfe, Namen, Auftragsbuch; **VT323** („AmtPixel“) für Aufgabentexte, Zahlen, Einheiten, Canvas. Silkscreen nie für Einheiten: keine Kleinbuchstaben (m/s → M/S) [W16, W17] | Pixelify-Ziffern unlesbar (5 wie S, 2 wie ?) |

## 2. Story und Ton

- **Florian** (Junge) bekommt durch eine **Namensverwechslung** das „Amt für Bewegung aller Art“ – eigentlich unqualifiziert, aber gut bezahlt [W4]. Wird als „Herr Doktor Florian Brandl“ angesprochen.
- Bürger reichen **Tickets/Aufträge** ein; Florian löst sie. Sympathische Rolle, kein Streiche-Spielen [W2 verworfen → W3].
- **Verworfen:** Teenager, der Leuten Streiche spielt (Bein stellen, Ei auf Radfahrer) [W2]; Clip-/Video-Motivation („künstlich“) [W3].
- Physikalische Größen sollen **aus der Geschichte heraus** gebraucht werden (Raser? Bremsweg? Durchschnittsgeschwindigkeit?) [W2].
- **Humor** ja, pixelig und freundlich. Fehler werden nicht bestraft-zynisch kommentiert, sondern verständnisvoll: „Du bist neu, jeder macht Fehler – gib dir nächstes Mal mehr Mühe“ [W8].
- Figuren: Erzähler (stumm, ohne Bild), Florian, Bürgermeisterin Kranz, Frau Brösel, Kevin (Fahrradkurier), Ötzi (Busfahrer), Bäcker, Jo (Skaterin), Filialleiterin, Ralf (macht falsche Diagramme), Oma Gerda (Rollator), Dr. Ohm (Schule), Paul Paket (Postbote).
- **g.Z.-Polizist** [W16]: Comic-Relief wie Paul. Pfeift (Sportpfeife), drängt sich groß und animiert ins Rätselfenster (wackelt, stampft, anfangs roter Kopf), verwarnt freundlich, kündigt an, jedes Mal wiederzukommen, bedankt sich für die Mitarbeit im Amt, kleines Pixelherz. Regeln siehe § 5.
- **Herr Messner als „Raketenmann“** [W18, Umsetzung später]: weißes T-Shirt, blaue Jeans, unauffällige Sneaker, dunkelbraune/schwarze flache Cap nach vorn, Oberlippen- und Kinnbart plus kleines Dreieck unter der Unterlippe, dunkle Haare, keine Brille. Die Raketenteile stammen von ihm; er gratuliert, wenn alle Teile da sind und die Rakete gebaut wird (Endgame). Brücke zu Teil 2.
- **Raketenteile künftig als Quest-Belohnung** [W18, später]: nicht mehr von Anfang an kaufbar. Z. B. alle 5 erfolgreichen Aufträge Mitteilung „rätselhaftes Paket während deiner Abwesenheit im Baumhaus zugestellt“, mit kryptischer Notiz („irgendwann wirst du wissen, was damit zu tun ist“). Letzte Lieferung → Endgame-Animation. Ersetzt dann den Kauf im Shop (Balancing in § 5 anpassen).
- **Belohnung:** Geld → Baumhaus-Einrichtung. Geheimnisvolle **Raketenteile** ohne Beschreibung → Kiste → Abschlussprüfung → Raketenstart als **Teaser für Teil 2** [W8].

## 3. Optik

- **Pixel-Art**, Stil „Game Boy DS“, **nicht C64** [W7]. Diagramme selbst **klar und sauber** (SVG) in einem Fenster [W2].
- **Kein Hochskalieren** von Text: Karte und Zimmer rendern in nativer Auflösung (Painter), Text scharf [W7].
- Stadt: Park mit Blumen, Skatepark, Supermarkt, verschiedene Baumarten, Rathaus mit Kuckucksuhr, Baumhaus neben dem Rathaus, Schule [W7, W8].
- Startbildschirm: viel animierte Bewegung (Rad, Rakete, Auto, Oma mit Rollator, Sportmotorrad, Effekte); Florian beobachtet, notiert, fotografiert, hat das Chaos im Griff [W8].
- Vor dem Start: **Demo-Hinweis** (Fehler an Herrn Messner melden; Feinheiten wie gültige Ziffern noch nicht umgesetzt; Ziel: Visualisierung + interaktive Aufgabentypen). Kurz, sympathisch, korrekt [W8].

## 4. Aufgabentypen

| Typ | Name | Status | Entscheidungen |
|---|---|---|---|
| A | Zuordnen (match) | ✓ | Distraktoren aus Fehlvorstellungen, nicht zufällig |
| B | Freihand (freehand) | ✓ 1 Auftrag, Playtest offen [W16] | Zeichnen in einem Zug, Auto-Begradigung (Ramer-Douglas-Peucker), Toleranz ±tolY senkrecht, ±0,3 s an Knicken. Bleibt bis zum Feedback so (3 Abschnitte inkl. Stillstand) [W17] |
| C | Achsen-Detektiv (axes) | ✓ | Diagramm ohne Zahlen, Ablesen an markierten Linien |
| D | Regie (direct) | in Arbeit [W17] | **Variante a:** Schüler stellt Startort, Startzeit und vₓ der Akteure ein, damit ein Drehbuch-Ereignis eintritt (z. B. Begegnung am Ort X zur Zeit T); Animation als Kontrolle. 3 Aufträge |
| E | Fehlerjagd (errorhunt) | ✓ | Ralfs Diagramm hat genau einen falschen Abschnitt |
| F | Live-Steuerung (live) | ✓ | vₓ per Regler, Spur gegen Soll |
| G | Beschreiben (describe) | ✓ [W3] | **Fachsprache**, gute Distraktoren; „verzögert/bremst“ nur, wenn \|v\| abnimmt |
| H | Berechnen (calc) | ✓ [W3] | **Prüfungsrelevant**; Hinweise für typische Fehlwerte |
| I | Konstrukteur (construct) | ✓ [W10] | Diagramm selbst bauen: Endwerte + Form je Abschnitt |
| J | Reaktionstest (reaction) | ✓ [W10] | Eigene Reaktionszeit → eigener Anhalteweg. Achtung: Touch-Latenz verfälscht |
| K | Flächen-Puzzle (area) | ✓ 3 Aufträge [W17] | Fläche unter t-vₓ automatisch in Rechtecke/Dreiecke zerlegt; Teilflächen mit Vorzeichen, Δx, ggf. Endort oder Weg. Hinweise für Vorzeichen, ½ vergessen, Weg statt Δx |
| L | Steigungsdreieck (slope) | ✓ 3 Aufträge [W17] | Zwei Punkte antippen (rasten aufs Feinraster), Δt und Δx am **eigenen** Dreieck ablesen, Steigung berechnen. Dreieck nach erstem Prüfen fest |

- **Kennbuchstaben** stehen in `js/tasks/types.js` und werden **nie umnummeriert** (Schüler bekommen sie als PDF zum Selbstcheck) [W16]. Anzeige als gelbes Badge im Auftragskopf und im Auftragsbuch; keine Farbcodierung (bei vielen Typen verwirrend).
- **Schwierigkeit** [W17, W19]: Feld `difficulty` (leicht/mittel/schwer) pro Ticket, eingetragen nach Playtest durch Herrn Messner. Steuert später Lohn und Toleranz (noch ohne Wirkung). Herr Messner fragt die Einstufung ab und gibt verbal Rückmeldung.

Jeder neue Typ: mindestens 3 konkrete Aufträge [W8].

## 5. Bewertung und Geld

- **Toleranz:** 1 Einheit in der **2. signifikanten Stelle** [W7]. Im Spiel steht (Amtsregel § 3), dass kleine Rundungsfehler hier akzeptiert werden, **in der Prüfung aber genauer gerechnet werden muss** [W8].
- Auswahl (A, G, E): nur **erster Versuch** richtig → voller Lohn, sonst **0 €** [W8].
- Rechnen/Ablesen (H, C), Live (F), Konstrukteur, Reaktionstest: erster Versuch voll; nach Hinweisen selbst gelöst halb; **„Lösung zeigen“ → 0 €** [W8].
- Verpatzt → **Nachfrage**: kommt nach 2 weiteren Aufträgen mit **neuer Zufallsvariante** zurück [W10].
- **Zufallsvarianten** pro Spieler (Seed), damit Schüler nicht abschreiben [W10].
- **Antwortbereich** statt Toleranz: Frage-Feld `"range": [min, max]`, z. B. wenn Werte aus einem Diagramm grob ermittelt werden (Frau Brösels Rache: 550–650 m) [W20]. `"tol": 0` erzwingt den exakten Wert.
- **Nach dem Lösen** bleibt der Aufgabenbildschirm mit grüner Antwort und Lösungshinweis stehen, bis getippt (oder Leertaste/Enter) wird; der Lohn-Kasten oben zeigt „Weiter ▶“. Hier entsteht der Lerneffekt [W20].
- **Gültige Ziffern (g.Z.)** [W16, W17]: g.Z. = Ziffern ab der ersten von 0 verschiedenen (00035,4455 → 6; 1,00 → 3; 120 → 3). Standard im Spiel: **2 g.Z.** **Eine g.Z. ist immer zu wenig!** Eingabe mit 1 g.Z. (z. B. „3“ statt „3,0“) → g.Z.-Polizist; **≥ 4 g.Z.** → Polizist („so genau geht das hier nicht“). 2 oder 3 g.Z. sind okay. **0 hat keine g.Z.** → kein Polizist. Naturkonstanten (g = 9,81 m/s², π) gelten als exakt und begrenzen die Genauigkeit nicht. **Kein Geldabzug** für g.Z.-Fehler. Alle Spieltexte (Dialoge, Hinweise, Datenblatt, Beschreibungen, `{Ausdrücke}`) nennen Werte mit mindestens 2 g.Z. (z. B. „6,0 m“, nicht „6 m“); exakte Umrechnungen wie 1 km = 1000 m bleiben [W18, W19]. Typ C (Achsen-Detektiv, Diagrammarbeit) prüft g.Z. nicht (`sigCheck: true` schaltet ein); alle anderen Eingabetypen prüfen (`sigCheck: false` schaltet aus). Polizist kommt **höchstens einmal pro Auftrag** [W20]; beim Konstrukteur (I) nur mit `sigCheck: true`, bei K ja. Er zählt Verwarnungen (localStorage), Texte in `data/police.json`, Regeln in `js/engine/sigfig.js`.
- Balancing [W15]: Einrichtung um **20 %** teurer (gerundet auf 5 €) → 1220 €; Raketenteile bleiben bei 40 € (5 × 40 = 200 €), damit niemand vor der Prüfung hängen bleibt. Gesamt 1420 € von 1730 € verdienbar (≈ 82 %).

## 6. Bedienung

- **Touch zuerst**: kein WASD. Tutorial-Hinweis „Hier tippen!“ mit großem Ausrufezeichen und tippendem Finger beim ersten Auftrag [W10].
- Baumhaus: Shop-Menü einklappbar; jeder Gegenstand hat einen **festen Platz**, genug Platz lassen [W8].
- Bestellungen bringt **Postbote Paul** (gelb) durch die Luke; Gegenstand erscheint erst nach dem Auspacken [W13].
- Paul behält **immer** seinen vollen Dialog – keine Kurzfassung. Herr Messner mag den Postboten sehr [W15].
- **Auftragsbuch 📖** im HUD, **immer verfügbar** [W16, W17]: blaues Notizbuch mit Pixel-Aufschrift „Aufträge“, Öffnungs-Animation ca. 0,5 s (heranzoomen, Deckel klappt auf; vorher 1 s, war zu lang [W19]). Liste in **Reihenfolge der Annahme** (oben zuerst), dann offene Aufträge. Spalten: Nr., Status, Typ-Buchstabe, Auftrag, Auftraggeber, Ort, verdientes Geld. Status: grüner Kreis mit weißem ✓ (voll), gelber Kreis mit ~ (halb), roter Kreis mit weißem ✕ (verpatzt). Spielstand speichert `order` und `earned`.
- **Testmodus** [W16, W17]: **20× im Startbildschirm auf Oma Gerda tippen**, am Notebook „amtstest“ tippen oder `?amtstest=1`. Nicht leicht erratbar (Schüler!). Kein Strg+Shift+T (vom Browser belegt). Im Auftragsbuch dann: gesperrte Aufträge sehen, ▶ starten, ✔/◐/✘ setzen, ↺ zurücksetzen, +100 €, alle abhaken.
- **Freischaltplan**: `docs/QUESTPLAN.md` (Mermaid) und `docs/questplan.png`, erzeugt mit `node tools/questplan.mjs` + `dot`. PNG auf Nachfrage schicken [W16].

## 7. Klang [W12]

- WebAudio-Synthese, **keine Audiodateien** (webgünstig).
- Sprechen: pro Buchstabe ein Laut, **Vokale über Formanten** modelliert, Pausen nach Leerzeichen und Satzzeichen.
- Sprache startet mit Lautstärke **0,3** (halb so laut wie vorher); alte Spielstände einmal halbiert [W16].
- Stimmen: `florian`, `frau_mittel`, `frau_alt`, `mann_kraeftig`, `mann_duenn` (Paul). Gewünscht, noch offen: `frau_jung`. Erzähler stumm.
- **Keine Musik während der Aufgaben** (lenkt ab). Auf der Karte **leise** Vögel und Wind.
- Klang-Menü im HUD (🔊): Stimmen, Natur, Effekte, stumm; wird gespeichert.

## 8. Technische Fallstricke (nicht wiederholen!)

- `speedCheck`-Goal liefert schon km/h → nicht nochmal mit 3,6 multiplizieren.
- Intro-Texte dürfen **keine Lösungen verraten** (war bei Brösel passiert).
- Genitiv: „des t-x-Diagramm**s**“.
- Describe-Distraktoren dürfen sich nicht selbst widersprechen; einheitlicher Satzbau.
- `parseNum('')` muss NaN liefern, nicht 0.
- Variantenauswahl: murmur3-Mix und `>>> 0` (sonst gleiche/undefinierte Varianten).
- Zustand: DEFAULT per `structuredClone` kopieren.
- Erster `requestAnimationFrame` kann negatives dt liefern → klemmen.
- graph.js: der Block `// Kurve` wurde einmal versehentlich gelöscht; Regressionstest existiert.
- Schriften sind lokal; im Cloud-Container sind npm-Registry und CDNs blockiert, Google-Fonts-Dateien kamen per sparse `git clone` von github.com/google/fonts.
- Animation (Scene): Maßband-/Zeitschrift **15 px** (+10 % gegenüber 13 px; „10 größer“ hieß 10 %, nicht 10 px!) [W20]. Maßband-Teilung passt sich der Beschriftungsbreite an. Ticket-Feld `"ruler": false` blendet das Maßband aus, wenn eine Strecke nicht direkt ablesbar sein darf [W20].
- Diagrammraster: `niceStep` ohne 2,5 (sonst Rasterlinien bei 1,25 usw.); Feinraster über `minorDiv` (1→5, 2→4, 5→5 Kästchen). Achtung, wirkt auf alle Diagramme [W16].
- `data/tickets.json` beim Ergänzen **nicht** komplett mit `json.dump` neu schreiben (zerstört das kompakte Format, riesiger Diff) – neue Tickets im Repo-Stil anhängen.
- Lokale Schriften fürs Canvas mit `document.fonts.load(…)` vorladen, sonst Ersatzschrift.
- Playwright: pulsierende Knöpfe mit `force=True` klicken.

## 9. Git

- Commits als `MJMssnr <MJMssnr@users.noreply.github.com>`.
- GitHub Pages: https://mjmssnr.github.io/amt-fuer-bewegung/ (vom Nutzer manuell aktiviert).
