# Roadmap – offen, geplant, bekannte Schwächen

Stand: 23.10.2026 (Sitzung 2). Reihenfolge offen, Herr Messner entscheidet.

## Offene Entscheidungen (bitte nicht eigenmächtig festlegen)
- derzeit keine

## In Arbeit (Sitzung 2, Branch, noch nicht auf main)
- **D Regie**: Testauftrag „Der Imagefilm“ fertig; 2 weitere Aufträge nach Playtest (Ideen: Einholen mit Wartezeit t₀, Begegnung dreier Akteure)

## Wartet auf Playtest-Feedback
- B Freihand („Brezels Tagebuch“), K Flächen-Puzzle, L Steigungsdreieck, Auftragsbuch, Schrift, Feinraster
- Danach: Feld `difficulty` (leicht/mittel/schwer) pro Ticket → Lohn und Toleranz

## Geplant
- **Balancing Shop** nach Playtest: 23 Gegenstände für 2265 €, verdienbar 4950 € [W24/W26]
- **Teil 2 (2D):** waagrechter und schiefer Wurf, grafische Vektoraddition. Engine kann 2D schon (`until: landing`, Vektoren `[x, y]`, Diagrammarten `yt`, `vyt`, `ayt`).
- **Druck-Arbeitsblatt** (passend zur Papierstütze)
- Stimme **frau_jung**
- PWA/offline
- Mehr Bewegungsarten aus W1: E-Scooter, Inliner, Züge
- Gültige Ziffern auch in Aufgabentexten und Lösungsanzeigen konsequent (Demo-Hinweis anpassen, sobald umgesetzt)

## Bekannte Schwächen
- Reaktionstest: Touch-Latenz verlängert die gemessene Reaktionszeit.
- Klang wurde nur technisch geprüft (keine Fehler), nicht angehört – Feinabstimmung der Stimmen in `js/audio/sound.js` → `VOICES`.
