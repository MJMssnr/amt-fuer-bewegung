# Roadmap – offen, geplant, bekannte Schwächen

Stand: 24.10.2026, Ende Sitzung 4 (W53). Arbeitsplan nach Playtest-Runde 3 komplett erledigt.

## Offene Entscheidungen (bitte nicht eigenmächtig festlegen)
- Gratisversion: Umfang steht (6 Aufträge, Bärti + 1. Paket), Technik/Vertrieb später gemeinsam
- Musik: Herr Messner komponiert selbst (Titelbildschirm, Finale) – Weg wählen: MIDI → Chiptune-Synth oder fertige Audiodateien (Optionen unten)

## Für die nächste Sitzung (Übergabe)
1. **Playtest Runde 4** (Herr Messner): neue Aufträge t81–t91 (vor allem t84 Tangente, t82), Training Q und W (handgeschriebene Formeltexte), Material-Hinweis, Finale (Sockel, Untertitel, Slavi-Blitze, großes „!“ am Bauplatz), Bärti-Cam mit neuen Aktivitäten (Mülltonnen-Positionen in `BINS`, `js/ui/baerti-acts.js`).
2. **Musik** einbauen, sobald Format entschieden und erste Datei da ist.
3. **Gratisversion** (endet nach 6 Aufträgen) gemeinsam planen.
4. **Raketen-Minispiel** (Geld = Treibstoff) gemeinsam entwerfen.
5. Verkauf als iOS-App: Technik (Wrapper/PWA), Repo privat, Preismodell – noch offen.

## Musik – technische Optionen (Entscheidung Herr Messner)
- **A: MIDI → eigener Chiptune-Synth (WebAudio, wie die Stimmen):** MIDI-Datei (Typ 1, eine Spur je Instrument, Spurnamen = Rolle, Schlagzeug auf Kanal 10, Loop-Marker „loop_start“/„loop_end“). Ein Werkzeug wandelt sie in eine kleine JSON-Notenliste. Wenige KB, nahtlose Loops, Ebenen zu-/abschaltbar, Tempo änderbar. Grenzen: Klangfarben synthetisch (Puls, Dreieck, Säge, Rauschen, weiches Pad), Effekte einfach (Hüllkurven, Vibrato, Glides, Arpeggio, Echo, Hall, Filterfahrten).
- **B: Fertige Audiodateien aus der DAW:** volle klangliche Freiheit. Abgabe als WAV, wird zu MP3/AAC (~128 kbit/s, ca. 1 MB pro Minute) – OGG läuft nicht überall auf iOS. Loop-Punkte in Samples angeben (MP3-Lücken werden über WebAudio umgangen). Grenzen: Dateigröße, keine Anpassung im Spiel außer über Stems.
- **Hybrid:** Melodie/Harmonie als MIDI für A, einzelne Stingers (Countdown, Start) als Audio.

## Arbeitsplan (W47, in dieser Reihenfolge)
1. ✅ Bugs, Texte, Hinweise, Einstufungen, Streichungen (W47)
2. ✅ (W47b) **Mechanik:** T Puppe per Klick greifen (wie B); t74 statt Lösung eine Auswahlfrage „Warum unmöglich?“; O-Aufträge mit Verständnisfrage (gleiche Zeitabstände ≠ gleiche Ortsabstände, was ist konstant/null, Richtung nur aus dem Kontext); W Zeitraffer sichtbar (⏩, schnelle Uhr); t06 Folgefehler-Bewertung (ENTSCHEIDUNGEN § 6)
3. ✅ (W48–W50) **Generator-Kern + Endlosmodus** für K, L, H, U, dann A, E, R, V – mit Stufen (ENTSCHEIDUNGEN § 6), Seed-Tests
4. ✅ (W51) **Story auf 85 Aufträge** nach Favoriten
5. ✅ (W50) Endlosmodus erweitern: I, B, F, Q (mehr Formeln umstellen), S, W-Rechenvariante
6. ✅ (W52) **Rahmen:** Material-Animation nach dem Demo-Hinweis (Karopapier, Kuli, Taschenrechner, Formelsammlung fliegen ein; „Lege das Material bereit!“, weiter per Tippen/Leertaste); Finale: Slavi „Bitte lächeln“ mit mehreren Blitzen hintereinander; Wiederholungsflug am Bauplatz prüfen (gibt es seit W33)
7. ✅ (W52) **Bärti:** Aktivitätenwahl nach „lange nicht gemacht“, nie Besuch direkt nach Besuch; Schwimm-Sprite mit Kopf (Maske, Öhrchen, Schwanz aus dem Wasser); neu: Mülltonnen in der Stadt (wühlen), Tanzen/Freudensprung, Einkugeln und Rollen, Schmetterlingssprung, auf dem Rücken mit den Beinen wackeln
- Später: Raketen-Minispiel (Geld = Treibstoff), Gratisversion, Musik

## Wartet auf Playtest-Feedback
- siehe „Für die nächste Sitzung“ und `docs/PLAYTEST.md`

## Geplant
- **Raketen-Minispiel** mit Geld als Treibstoff (Shop 2315 € bei 8310 € verdienbar, Überschuss gewollt)
- **Teil 2 (2D):** waagrechter und schiefer Wurf, grafische Vektoraddition. Engine kann 2D schon (`until: landing`, Vektoren `[x, y]`, Diagrammarten `yt`, `vyt`, `ayt`).
- **Druck-Arbeitsblatt** (passend zur Papierstütze)
- Stimme **frau_jung**
- PWA/offline
- Mehr Bewegungsarten aus W1: E-Scooter, Inliner, Züge
- Gültige Ziffern auch in Aufgabentexten und Lösungsanzeigen konsequent (Demo-Hinweis anpassen, sobald umgesetzt)

## Bekannte Schwächen
- Reaktionstest: Touch-Latenz verlängert die gemessene Reaktionszeit.
- Klang wurde nur technisch geprüft (keine Fehler), nicht angehört – Feinabstimmung der Stimmen in `js/audio/sound.js` → `VOICES`.
