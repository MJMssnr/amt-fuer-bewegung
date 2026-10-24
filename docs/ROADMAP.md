# Roadmap – offen, geplant, bekannte Schwächen

Stand: 24.10.2026 (W47, nach Playtest-Runde 3). Reihenfolge mit Herrn Messner abgestimmt.

## Offene Entscheidungen (bitte nicht eigenmächtig festlegen)
- Gratisversion: Umfang steht (6 Aufträge, Bärti + 1. Paket), Technik/Vertrieb später gemeinsam
- Musik: Herr Messner komponiert selbst (Titel, letzte Mission) – Format klären

## Arbeitsplan (W47, in dieser Reihenfolge)
1. ✅ Bugs, Texte, Hinweise, Einstufungen, Streichungen (W47)
2. ✅ (W47b) **Mechanik:** T Puppe per Klick greifen (wie B); t74 statt Lösung eine Auswahlfrage „Warum unmöglich?“; O-Aufträge mit Verständnisfrage (gleiche Zeitabstände ≠ gleiche Ortsabstände, was ist konstant/null, Richtung nur aus dem Kontext); W Zeitraffer sichtbar (⏩, schnelle Uhr); t06 Folgefehler-Bewertung (ENTSCHEIDUNGEN § 6)
3. **Generator-Kern + Endlosmodus** für K, L, H, U, dann A, E, R, V – mit Stufen (ENTSCHEIDUNGEN § 6), Seed-Tests
4. **Story auf 83–85 Aufträge** (derzeit 74) nach Favoriten, Zahlen aus dem Generator
5. Endlosmodus erweitern: I, B, F, Q (mehr Formeln umstellen), S, W-Rechenvariante
6. **Rahmen:** Material-Animation nach dem Demo-Hinweis (Karopapier, Kuli, Taschenrechner, Formelsammlung fliegen ein; „Lege das Material bereit!“, weiter per Tippen/Leertaste); Finale: Slavi „Bitte lächeln“ mit mehreren Blitzen hintereinander; Wiederholungsflug am Bauplatz prüfen (gibt es seit W33)
7. **Bärti:** Aktivitätenwahl nach „lange nicht gemacht“, nie Besuch direkt nach Besuch; Schwimm-Sprite mit Kopf (Maske, Öhrchen, Schwanz aus dem Wasser); neu: Mülltonnen in der Stadt (wühlen), Tanzen/Freudensprung, Einkugeln und Rollen, Schmetterlingssprung, auf dem Rücken mit den Beinen wackeln
- Später: Raketen-Minispiel (Geld = Treibstoff), Gratisversion, Musik

## Wartet auf Playtest-Feedback
- B Freihand („Brezels Tagebuch“), K Flächen-Puzzle, L Steigungsdreieck, Auftragsbuch, Schrift, Feinraster
- Danach: Feld `difficulty` (leicht/mittel/schwer) pro Ticket → Lohn und Toleranz

## Geplant
- **Balancing Shop** nach Playtest: 23 Gegenstände für 2265 €, verdienbar 7360 € [W24/W26]
- **Teil 2 (2D):** waagrechter und schiefer Wurf, grafische Vektoraddition. Engine kann 2D schon (`until: landing`, Vektoren `[x, y]`, Diagrammarten `yt`, `vyt`, `ayt`).
- **Druck-Arbeitsblatt** (passend zur Papierstütze)
- Stimme **frau_jung**
- PWA/offline
- Mehr Bewegungsarten aus W1: E-Scooter, Inliner, Züge
- Gültige Ziffern auch in Aufgabentexten und Lösungsanzeigen konsequent (Demo-Hinweis anpassen, sobald umgesetzt)

## Bekannte Schwächen
- Reaktionstest: Touch-Latenz verlängert die gemessene Reaktionszeit.
- Klang wurde nur technisch geprüft (keine Fehler), nicht angehört – Feinabstimmung der Stimmen in `js/audio/sound.js` → `VOICES`.
