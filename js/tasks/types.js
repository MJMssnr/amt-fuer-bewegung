// Kennbuchstaben und Namen der Aufgabentypen (Questlog, Auftragskopf, Selbstcheck-PDF).
// Buchstaben NIE umnummerieren: Schüler bekommen sie als Liste [W16].
// Geht das Alphabet aus: weiter mit griechischen Buchstaben (Α, Β, Γ …) [W22].

export const TYPES = {
  match:     { letter: 'A', name: 'Zuordnen' },
  freehand:  { letter: 'B', name: 'Freihand zeichnen' },
  axes:      { letter: 'C', name: 'Achsen-Detektiv' },
  direct:    { letter: 'D', name: 'Regie' },
  errorhunt: { letter: 'E', name: 'Fehlerjagd' },
  live:      { letter: 'F', name: 'Live-Steuerung' },
  describe:  { letter: 'G', name: 'Beschreiben' },
  calc:      { letter: 'H', name: 'Berechnen' },
  construct: { letter: 'I', name: 'Konstrukteur' },
  reaction:  { letter: 'J', name: 'Reaktionstest' },
  area:      { letter: 'K', name: 'Flächen-Puzzle' },
  slope:     { letter: 'L', name: 'Steigungsdreieck' },
  strobecalc:     { letter: 'M', name: 'Stroboskop: rechnen' },
  strobedescribe: { letter: 'N', name: 'Stroboskop: beschreiben' },
  strobebuild:    { letter: 'O', name: 'Stroboskop: bauen' },
};

export const typeOf = (type) => TYPES[type] ?? { letter: '?', name: type };
