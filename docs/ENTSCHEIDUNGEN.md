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

## 2. Story und Ton

- **Florian** (Junge) bekommt durch eine **Namensverwechslung** das „Amt für Bewegung aller Art“ – eigentlich unqualifiziert, aber gut bezahlt [W4]. Wird als „Herr Doktor Florian Brandl“ angesprochen.
- Bürger reichen **Tickets/Aufträge** ein; Florian löst sie. Sympathische Rolle, kein Streiche-Spielen [W2 verworfen → W3].
- **Verworfen:** Teenager, der Leuten Streiche spielt (Bein stellen, Ei auf Radfahrer) [W2]; Clip-/Video-Motivation („künstlich“) [W3].
- Physikalische Größen sollen **aus der Geschichte heraus** gebraucht werden (Raser? Bremsweg? Durchschnittsgeschwindigkeit?) [W2].
- **Humor** ja, pixelig und freundlich. Fehler werden nicht bestraft-zynisch kommentiert, sondern verständnisvoll: „Du bist neu, jeder macht Fehler – gib dir nächstes Mal mehr Mühe“ [W8].
- Figuren: Erzähler (stumm, ohne Bild), Florian, Bürgermeisterin Kranz, Frau Brösel, Kevin (Fahrradkurier), Ötzi (Busfahrer), Bäcker, Jo (Skaterin), Filialleiterin, Ralf (macht falsche Diagramme), Oma Gerda (Rollator), Dr. Ohm (Schule), Paul Paket (Postbote).
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
| B | Freihand zeichnen | **zurückgestellt** [W4] | Später evtl. mit Toleranz und Auto-Begradigung zu Geraden [W3] |
| C | Achsen-Detektiv (axes) | ✓ | Diagramm ohne Zahlen, Ablesen an markierten Linien |
| D | Regie | offen | – |
| E | Fehlerjagd (errorhunt) | ✓ | Ralfs Diagramm hat genau einen falschen Abschnitt |
| F | Live-Steuerung (live) | ✓ | vₓ per Regler, Spur gegen Soll |
| G | Beschreiben (describe) | ✓ [W3] | **Fachsprache**, gute Distraktoren; „verzögert/bremst“ nur, wenn \|v\| abnimmt |
| H | Berechnen (calc) | ✓ [W3] | **Prüfungsrelevant**; Hinweise für typische Fehlwerte |
| – | Konstrukteur (construct) | ✓ [W10] | Diagramm selbst bauen: Endwerte + Form je Abschnitt |
| – | Reaktionstest (reaction) | ✓ [W10] | Eigene Reaktionszeit → eigener Anhalteweg. Achtung: Touch-Latenz verfälscht |

Jeder neue Typ: mindestens 3 konkrete Aufträge [W8].

## 5. Bewertung und Geld

- **Toleranz:** 1 Einheit in der **2. signifikanten Stelle** [W7]. Im Spiel steht (Amtsregel § 3), dass kleine Rundungsfehler hier akzeptiert werden, **in der Prüfung aber genauer gerechnet werden muss** [W8].
- Auswahl (A, G, E): nur **erster Versuch** richtig → voller Lohn, sonst **0 €** [W8].
- Rechnen/Ablesen (H, C), Live (F), Konstrukteur, Reaktionstest: erster Versuch voll; nach Hinweisen selbst gelöst halb; **„Lösung zeigen“ → 0 €** [W8].
- Verpatzt → **Nachfrage**: kommt nach 2 weiteren Aufträgen mit **neuer Zufallsvariante** zurück [W10].
- **Zufallsvarianten** pro Spieler (Seed), damit Schüler nicht abschreiben [W10].
- Balancing [W15]: Einrichtung um **20 %** teurer (gerundet auf 5 €) → 1220 €; Raketenteile bleiben bei 40 € (5 × 40 = 200 €), damit niemand vor der Prüfung hängen bleibt. Gesamt 1420 € von 1730 € verdienbar (≈ 82 %).

## 6. Bedienung

- **Touch zuerst**: kein WASD. Tutorial-Hinweis „Hier tippen!“ mit großem Ausrufezeichen und tippendem Finger beim ersten Auftrag [W10].
- Baumhaus: Shop-Menü einklappbar; jeder Gegenstand hat einen **festen Platz**, genug Platz lassen [W8].
- Bestellungen bringt **Postbote Paul** (gelb) durch die Luke; Gegenstand erscheint erst nach dem Auspacken [W13].
- Paul behält **immer** seinen vollen Dialog – keine Kurzfassung. Herr Messner mag den Postboten sehr [W15].

## 7. Klang [W12]

- WebAudio-Synthese, **keine Audiodateien** (webgünstig).
- Sprechen: pro Buchstabe ein Laut, **Vokale über Formanten** modelliert, Pausen nach Leerzeichen und Satzzeichen.
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
- Google Fonts ist im Cloud-Container blockiert (harmloser Konsolenfehler); „Schrift lokal einbinden“ steht auf der Roadmap.
- Playwright: pulsierende Knöpfe mit `force=True` klicken.

## 9. Git

- Commits als `MJMssnr <MJMssnr@users.noreply.github.com>`.
- GitHub Pages: https://mjmssnr.github.io/amt-fuer-bewegung/ (vom Nutzer manuell aktiviert).
