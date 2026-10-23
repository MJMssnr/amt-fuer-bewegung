// Kennbuchstaben und Namen der Aufgabentypen (Questlog, Auftragskopf, Selbstcheck-PDF).
// Buchstaben NIE umnummerieren: Schüler bekommen sie als Liste [W16].

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
};

export const typeOf = (type) => TYPES[type] ?? { letter: '?', name: type };
