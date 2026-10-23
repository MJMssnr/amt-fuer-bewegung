# Playtest-Stand (Feedback von Herrn Messner)

> Stand: 23.10.2026, Ende Sitzung 2. Nach jedem Playtest hier nachtragen (Einstufung → auch `difficulty` im Ticket).
> „schwer“ bei t39–t53 hat Claude gesetzt, nicht Herr Messner – noch zu bestätigen.

## Mit Feedback und Einstufung
| Auftrag | Typ | Einstufung | Feedback (umgesetzt) |
|---|---|---|---|
| Der rote Blitz | A | leicht | passt |
| Bremsen durch? | A | leicht | passt |
| Ruckelt der Bus? | A | leicht | passt |
| Der Hund, der zurückläuft | A | leicht | passt |
| Partnerschafts-Radeln | H | leicht | Ort in km; Hinweis „t in Animation ablesbar, Ort berechnen“; Florian sagt 1,2 km [W18, W20] |
| Frau Brösels Rache | H | mittel | kein Maßband (`ruler: false`), Gesamtweg 550–650 m, v̄ 28–34 km/h, vmax exakt 54 km/h [W20] |
| Zu schnell im Skatepark? | G | leicht | g.Z. in Florians Text („4,0 s“) [W18] |
| Der Einkaufswagen | G | leicht | Hinweis auf Richtung/Vorzeichen [W20] |
| Der verschmierte Ausdruck | C | leicht | „Schau genau hin, was hier verlangt ist!“; kein Polizist bei C [W18] |
| Der Stadtlauf | C | leicht | passt |
| Ralfs erstes Diagramm | E | leicht | passt |
| Der rote Blitz am Abend | L | mittel | Polizist bei Δt = 2 fehlte (war noch nicht gebaut) [W18] |

## Feedback ohne Einstufung
- Hausaufgabe: Der Bus (I): Diagramm unlesbar → Feinraster [W16]
- Kevin im Blitzlicht (M): Polizist nur Text, kein Bild → Cache/Safari-Fix, **erneut prüfen** [W25]
- Stroboskop bauen (O) allgemein: Skala fehlte → Maßband + Hilfslinien [W25]

## Noch ohne Feedback (gezielt testen)
- C: Die nasse Ampelkamera
- E: Ralf und die Bremse, Ralfs Busfahrt
- F: Brezels Ersatzrunde, Oma Gerda am Zebrastreifen, Kevins Express-Lieferung
- I: Hausaufgabe: Selbst zeichnen!, Hausaufgabe: Die Falle
- J: Tempo 30 vor der Schule? (t21 „Die Schrecksekunde“ gestrichen [W28])
- B: Brezels Tagebuch (Herr Messner will Freihand explizit testen)
- K: Wie lang ist mein Run?, Hin und zurück, Wie knapp war's?
- L: Ralfs positive Rückwärtsrechnung, Bremst Ötzi zu scharf?
- D: Der Imagefilm (Testauftrag; danach 2 weitere D-Aufträge bauen)
- M/N/O: alle Fotolabor-Aufträge außer „Kevin im Blitzlicht“
- alle 15 schweren Aufträge t39–t53
- Systeme: Pakete/Kiste, Bärti, Rennrad/Motorrad auf der Karte, Finale am Bauplatz, Auftragsbuch-Animation, Weiter-Tippen nach dem Lösen

## So testet man schnell
Testmodus (20× Oma im Startbildschirm, „amtstest“ tippen oder `?amtstest=1`) → 📖: ▶ starten, ✔/◐/✘ setzen, ↺ zurücksetzen, +100 €, „alle abhaken“ (löst alle Pakete aus) → Baumhaus (auspacken) → Bauplatz (Finale).
Für automatische Browser-Tests gibt es `window.amtTest` (arrive, state, room, ow) in `js/main.js`.
