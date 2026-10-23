# Roadmap – offen, geplant, bekannte Schwächen

Stand: 23.10.2026, Ende Sitzung 2. Reihenfolge offen, Herr Messner entscheidet.

## Offene Entscheidungen (bitte nicht eigenmächtig festlegen)
- derzeit keine

## Nächste Schritte (Sitzung 3)
- Playtest-Feedback einarbeiten (Liste in `docs/PLAYTEST.md`), Einstufungen als `difficulty` eintragen
- **D Regie**: 2 weitere Aufträge, sobald „Der Imagefilm“ abgenommen ist
- **Balancing**: Shop 2265 € vs. verdienbar 4950 € → mehr Gegenstände oder höhere Preise (Herr Messner entscheidet)
- `difficulty` soll später Lohn und Toleranz steuern (noch ohne Wirkung)
- Optional: Rennmotorrad sichtbar unter dem Baumhaus parken (bisher nur Helm im Zimmer)
- Finale-Länge (~1 min) nach Playtest anpassen

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
