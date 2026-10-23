# Verlauf – Wünsche, Rückmeldungen, Umsetzung

Chronologisch. [W…] = Wunsch/Rückmeldung von Herrn Messner. Neue Sitzungen unten anhängen.
Hinweis: Sitzung 1 wurde nachträglich aus einer Zusammenfassung des Chats rekonstruiert (der Original-Chat war zu lang).

## Sitzung 1 – 23.10.2026

| Nr. | Wunsch / Rückmeldung (sinngemäß) | Umgesetzt in |
|---|---|---|
| W1 | Brainstorming: Browser-Lernspiel fürs Handy mit Humor; t-x, t-vₓ, t-aₓ ineinander überführen; mehrere Abschnitte (Beispiel: 4,5 s mit 2,5 m/s, dann 3 s mit −2,0 m/s); papiergestützt (Achsen beschriften und skalieren); animierte Menschen, Fahrzeuge, Räder, Raketen, E-Scooter, Inliner, Züge; mehrere Level; GitHub-Projekt und JSON-Datenstruktur | Konzept |
| W2 | Zielgruppe FOS 11 T / 12 NT. Erzähler unklar. Alltagsbewegungen mit Größen (Tempo überschritten, Flughöhe/-weite, Bremsweg, Bremszeit, Gesamtweg, Durchschnittsgeschwindigkeit) intrinsisch. Idee „Teenager mit Streichen“. Pixel-Art-Umgebung, Diagramme klar im Fenster | Konzept |
| W3 | Clip-Motivation zu künstlich → Stadtbeauftragter, der Anfragen bearbeitet. Typen A–F ok; Freihand mit Toleranz/Auto-Begradigung. Neu: G Beschreiben (Fachsprache, gute Distraktoren), H Rechnen. 2D (Würfe, Vektoraddition) langfristig Pflicht, kein 3D. Mehrere Akteure | Konzept |
| W4 | Twist: Florian bekommt das „Amt für Bewegung aller Art“ per Namensverwechslung; Geld pro Auftrag für Ausstattung. Freihand für Demo streichen. G und H ja. 2D-Engine ja. Goals erweiterbar. Account MJMssnr, klare Ordnertrennung. Notebook/iPad/Handy quer. Prototyp mit A. Später eigene PNGs | d393960 |
| W5–W6 | GitHub verbunden, Repo angelegt; GitHub App installiert, Pages aktiviert | – |
| W7 | Test am MacBook: Figuren schöner (DS-Stil, nicht C64); Schilder unscharf; Stadt ausbauen (Park, Skatepark, Supermarkt, Bäume, Blumen). H bauen, dann einen weiteren Typ. Toleranz 2. sign. Stelle | 5d39ba2 |
| W8 | Hinweis zur Rundungstoleranz (in der Prüfung genauer). Animierter Startbildschirm. Demo-Hinweis vorab. Baumhaus neben Rathaus mit Uhr-Animation; Zimmer mit Shop (Sessel, TV, Konsole, Lavalampe, Musikanlage, Kühlschrank mit Bar, Rennrad an der Wand, Teppich, Whirlpool + eigene Ideen), feste Plätze, Preise fürs Balancing; Raketenteile ohne Beschreibung in Kiste → Abschlussprüfung → Raketenflug als Teaser für Teil 2; Shop einklappbar. Bug: „Lösung zeigen“ und falsche Auswahl → 0 € mit verständnisvollem Dialog. Drei weitere Aufgabentypen mit je ≥ 3 Aufträgen | 5308829 |
| W9 | Weitere Vorschläge erbeten | Vorschläge 1–3 |
| W10 | 1–3 umsetzen (Zufallsvarianten + Nachfragen, Konstrukteur, Reaktionstest). Handy-Test: Hinweis, dass Steuerung per Tippen geht (kein WASD); Ausrufezeichen beim ersten Auftrag größer, mit Finger/Klick-Symbol | 6ae269e |
| W11 | Kleiner Auftrag für den Rest der Sitzung erbeten | Vorschlag: Sound |
| W12 | Sounddesign: Sprechlaute pro Buchstabe nach Vokal, Pausen nach Satzzeichen; unterscheidbare Stimmen (Florian + 3 Modelle zum Test); keine Musik in Aufgaben; Vogelzwitschern auf der Karte, leise; Lautstärke-Menü | 7ae1a69 |
| W13 | Gelb gekleideter Postbote bringt Bestellungen mit Paket ins Baumhaus, freundlicher Dialog, erst dann erscheint der Gegenstand | d2d3fb4 |
| W14 | Sorge wegen Qualitätsverlust durch Chat-Komprimierung → alles Relevante im Repo ablegen | dieses Dokument, `ENTSCHEIDUNGEN.md`, `ROADMAP.md` |
| W15 | Shop-Preise um ca. 20 % erhöhen; Postbote behält seinen Flavour-Text (keine Kurzfassung) | siehe Commit „Balancing +20 %“ |

## Sitzung 2 – 23.10.2026

| Nr. | Wunsch / Rückmeldung (sinngemäß) | Umgesetzt in |
|---|---|---|
| W16 | Bugs: „Hausaufgabe: Der Bus“ unlesbar skaliert; Sprache zu laut. Aufgabentyp erkennbar machen. Ziffern der Pixelschrift schlecht lesbar (5 wie S, 2 wie ?). Questlog mit Status, Person, Typ-Buchstabe (für Selbstcheck-PDF). Typ D, Fläche/Steigung, B Freihand (1 Quest). Gültige Ziffern + g.Z.-Polizist. Testmodus. Freischaltplan als Datei + PNG | 3e98851, 5324127, b57792b |
| W17 | Paralleles Arbeiten: Nachrichten während der Arbeit erlaubt. D = Variante a. Fläche und Steigung als zwei Typen (je 3). g.Z.: Standard 2, Polizist bei 1 g.Z. und bei ≥ 4 g.Z. Testmodus nicht per Titel, sondern 20× auf die Oma im Startbildschirm. Auftragsbuch als blaues Notizbuch mit Öffnungs-Animation, immer verfügbar, Reihenfolge der Annahme, Kreis-Symbole, Geld. Feld `difficulty` später. Schrift: zuerst Silkscreen gewünscht → Einwand (keine Kleinbuchstaben) → Silkscreen nur Titel, VT323 für Text | b06791b |
| W18 | Freihand bleibt bis zum Playtest unverändert. Herr Messner wird der **Raketenmann** (Aussehen in ENTSCHEIDUNGEN § 2); Raketenteile später als Quest-Belohnung mit kryptischen Paketen, Endgame-Animation (später). 0 hat keine g.Z.; Naturkonstanten exakt. Dokumentieren, dann Playtest | e02c17e |
| W19 | Playtest Teil 1: Schwierigkeit für 9 Aufträge (8× leicht, „Der rote Blitz am Abend“ mittel) → Feld `difficulty`. g.Z.-Polizist fehlte (war noch nicht gebaut) → jetzt gebaut. Partnerschafts-Radeln: Ort in **km** abfragen, Hinweis „t zur Kontrolle in der Animation ablesbar, Ort berechnen“. „Der verschmierte Ausdruck“: Hinweis „Schau genau hin, was hier verlangt ist!“, g.Z. bei Diagrammarbeit (Typ C) nicht prüfen. Dialoge: keine Werte mit 1 g.Z. („4,0 s“). Auftragsbuch-Animation doppelt so schnell. Beschriftung der Animation 10 px größer (Missverständnis, siehe W20) | e8ae2a1 |
| W20 | Animationsschrift: **10 %** gemeint → 15 px (statt 13 px). Polizist **höchstens einmal pro Auftrag**, nicht bei I, aber bei K. Radeln: Florian sagt 1,2 km. Einkaufswagen (leicht): Hinweis auf Richtung/Vorzeichen. Frau Brösels Rache (mittel): **kein Maßband** in der Animation, Gesamtweg 550–650 m akzeptiert, Durchschnitt 28–34 km/h (= 550/70 s bis 650/70 s), Höchstgeschwindigkeit exakt 54 km/h. Ralfs erstes Diagramm: leicht. **Nach dem Lösen bleibt der Bildschirm stehen, bis getippt wird** (Lösungshinweis lesen und notieren) | dieser Commit |
