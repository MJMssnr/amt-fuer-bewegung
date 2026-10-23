// Erzeugt assets/sprites.json aus den Pixel-Definitionen unten.
// Aufruf:  node tools/gensprites.mjs
// Jede Zeile ist eine Pixelreihe, jedes Zeichen ein Farbindex aus der Palette ('.' = transparent).

import { writeFileSync } from 'node:fs';
const R = (s, n) => s.repeat(n);

const palette = {
  k: '#1a1c2c', w: '#f4f4f4', W: '#94b0c2', r: '#b13e53', R: '#ef7d57', y: '#ffcd75', g: '#38b764',
  G: '#257179', l: '#a7f070', b: '#3b5dc9', B: '#29366f', c: '#73eff7', s: '#f2c9a0', S: '#d9a07a',
  h: '#5d3a1a', H: '#8a5a32', n: '#566c86', N: '#94b0c2', p: '#8b3d8f', P: '#b55fb8', d: '#333c57',
  o: '#a7f070', m: '#b13e53', t: '#c58b5e',
};

// ---------- Florian (14×22), drei Ansichten, Laufzyklus ----------
const fFrontHead = [
  '....kkkkkk....', '...kHHhhhhk...', '..khhhhhhhhk..', '..khhHhhhhhk..', '..khsshhsshk..',
  '..kssssssssk..', '..kskssssksk..', '..kSssssssSk..', '...kSsmmsSk...', '....kkkkkk....',
];
const fBackHead = [
  '....kkkkkk....', '...kHHhhhhk...', '..khhHhhhhhk..', '..khhhhhhhhk..', '..khhhhhhhhk..',
  '..khhhhHhhhk..', '..kShhhhhhSk..', '..khhhhhhhhk..', '...khhhhhhk...', '....kkkkkk....',
];
const fTorso = (top) => [
  top, '.kggggggggggk.', '.kGggggggggGk.', '.kGggggggggGk.', '.ksGGGGGGGGsk.', '..kbbbbbbbbk..', '..kbbbBBbbbk..',
];
const legsStand = ['..kbbbkkbbbk..', '..kbBk..kBbk..', '..kbBk..kBbk..', '..kwwk..kwwk..', '...kk....kk...'];
const legsA = ['..kbbbkkbbbk..', '..kbBk..kBbk..', '..kwwk..kBbk..', '...kk...kwwk..', '.........kk...'];
const legsB = ['..kbbbkkbbbk..', '..kbBk..kBbk..', '..kbBk..kwwk..', '..kwwk...kk...', '...kk.........'];
const front = (legs) => [...fFrontHead, ...fTorso('..kgglgglggk..'), ...legs];
const back = (legs) => [...fBackHead, ...fTorso('..kggGGGGggk..'), ...legs];

const fSideHead = [
  '.....kkkkk....', '....kHHhhhk...', '...khhhhhhhk..', '...khhhhhhhhk.', '...khhhhssssk.',
  '...khhhsssssk.', '...khSssssksk.', '....kSssssssk.', '....kSssmmsk..', '.....kkkkkk...',
];
const fSideTorso = ['....kgggggk...', '...kgggggggk..', '...kgGggggggk.', '...kgGgggggk..', '...kGGGGGGGk..', '....kbbbbbk...', '....kbbbbbk...'];
const sideStand = ['....kbbBbbk...', '....kbBkbBk...', '....kbBkbBk...', '....kwwkwwwk..', '.....kk.kkk...'];
const sideStride = ['....kbbBbbk...', '...kbBk.kbBk..', '..kbBk...kbBk.', '.kwwk.....kwwk', '..kk.......kk.'];
const sidePass = ['....kbbBbbk...', '....kbBBbk....', '....kbBBbk....', '....kwwwwk....', '.....kkkk.....'];
const side = (legs) => [...fSideHead, ...fSideTorso, ...legs];

const florian_down = { w: 14, h: 22, fps: 10, frames: [front(legsStand), front(legsA), front(legsStand), front(legsB)] };
const florian_up = { w: 14, h: 22, fps: 10, frames: [back(legsStand), back(legsA), back(legsStand), back(legsB)] };
const florian_side = { w: 14, h: 22, fps: 10, turns: true, frames: [side(sideStand), side(sideStride), side(sidePass), side(sideStride)] };
// "florian" = Seitenansicht (Szenen, Porträt); Stand-Frame zuerst
const florian = { ...florian_side, frames: [side(sideStand), side(sideStride), side(sidePass), side(sideStride)] };

// Florian notiert (Block vor der Brust, Stift wackelt) und fotografiert (Kamera vor dem Gesicht)
const noteTorso = (pen) => ['....kgggggk...', pen, '...kgGggsswwk.', '...kgGgggwwwk.', '...kGGGGGGGk..', '....kbbbbbk...', '....kbbbbbk...'];
const florian_note = {
  w: 14, h: 22, fps: 4, turns: true,
  frames: [
    [...fSideHead, ...noteTorso('...kggggggyk..'), ...sideStand],
    [...fSideHead, ...noteTorso('...kgggggggyk.'), ...sideStand],
  ],
};
const photoHead = [...fSideHead.slice(0, 5), '...khhhsskkkk.', '...khSsskNNk..', '....kSsskkkk..', ...fSideHead.slice(8)];
const florian_photo = {
  w: 14, h: 22, turns: true,
  frames: [[...photoHead, '....kgggggsk..', ...fSideTorso.slice(1), ...sideStand]],
};

// Praktikant Ralf (Farbvariante) und Raketenschlitten für die Abschlussprüfung
const sled = {
  w: 24, h: 10, turns: false, fps: 12,
  frames: [
    ['....kkkkkkkkkkkkkk......', '...kwwwwwwwwwwwwwwkk....', '..kwwwwwBBwwwwwwwwwrrk..', 'rrkwwwwwBBwwwwwwwwwwrrrk',
     'yrkwwwwwwwwwwwwwwwwwrrk.', '..kwwwwwwwwwwwwwwwwrk...', '...krrkkkkkkkkkkkrrk....', '....kNk.......kNk.......',
     'nnnnnnnnnnnnnnnnnnnnnnnn', '........................'],
    ['....kkkkkkkkkkkkkk......', '...kwwwwwwwwwwwwwwkk....', '..kwwwwwBBwwwwwwwwwrrk..', 'yrkwwwwwBBwwwwwwwwwwrrrk',
     'Rykwwwwwwwwwwwwwwwwwrrk.', '..kwwwwwwwwwwwwwwwwrk...', '...krrkkkkkkkkkkkrrk....', '....kNk.......kNk.......',
     'nnnnnnnnnnnnnnnnnnnnnnnn', '........................'],
  ],
};

// Oma Gerda mit Rollator (18×16)
const omaTop = [
  '...NNN............', '..NNNNN...........', '..NNsss...........', '..Nssks...........', '...ssss...........',
  '...PPPP...........', '..PPPPPPss.nnn....', '..PPPPPP..n..n....', '..pppppp..n..n....', '..pppppp..nwwn....',
  '..pppppp..nnnn....', '...pppp...n..n....',
];
const oma_rollator = {
  w: 18, h: 16, turns: true, fps: 3,
  frames: [
    [...omaTop, '...s..s...n..n....', '...s..s...n..n....', '..kk.kk..kNk.kNk..', '..........k...k...'],
    [...omaTop, '...s.s....n..n....', '...s.s....n..n....', '..kkkk...kNk.kNk..', '..........k...k...'],
  ],
};

// ---------- weitere Figuren und Fahrzeuge (Seitenansicht) ----------
const car = {
  w: 24, h: 9, turns: false,
  frames: [[
    '........kkkkkkkk........', '.......kBBBBBBBBrk......', '......kBccBBBBBBrrk.....',
    '..kkkkrrrrrrrrrrrrrkkk..', '.kRRRRRRRRRRRRRRRRRRRRyk', 'krrrrrrrrrrrrrrrrrrrrrrk',
    'krrkkkrrrrrrrrrrrkkkrrrk', '.kkknNnkkkkkkkkkknNnkkk.', '....kkk..........kkk....',
  ]],
};
const riderTop = [
  '......kkk.......', '.....kBBBk......', '......ssks......', '......sss.......',
  '.....RRRR.......', '.....RRRRsss....', '.....RRRR...k...', '.....dddd...k...',
];
const cyclist = {
  w: 16, h: 14, turns: true, fps: 8,
  frames: [
    [...riderTop, '......dd....k...', '.kkk..dd...kkk..', 'k...kdddddk...k.', 'k.n.k..d..k.n.k.', 'k...k.....k...k.', '.kkk.......kkk..'],
    [...riderTop, '.....d..d...k...', '.kkk.d..d..kkk..', 'k...kdddddk...k.', 'k.n.k...dk.n.k..'.slice(0, 16), 'k...k.....k...k.', '.kkk.......kkk..'],
  ],
};
const cyclist_b = { ...cyclist, palette: { R: '#41a6f6', B: '#38b764' } };
const kevin = { ...cyclist, frames: [cyclist.frames[0], cyclist.frames[1]] };
const broesel = {
  w: 10, h: 16, turns: true, fps: 4,
  frames: [[
    '...NNN....', '..NNNNN...', '..NNsss...', '..Nssks...', '...ssss...', '...pppp...',
    '..pppppp..', '..ppppps.n', '..pppppp.n', '..pPpppp.n', '..pppppp.n', '...pppp..n',
    '...s..s..n', '...s..s..n', '..kk.kk..n', '..........',
  ]],
};
const dog = {
  w: 12, h: 8, turns: true, fps: 10,
  frames: [
    ['.........hh.', 'h.......tttt', '.h......ttkt', '..tttttttttk', '..tttttttt..', '..ttttttt...', '..t.t...t.t.', '..k.k...k.k.'],
    ['.........hh.', 'h.......tttt', '.h......ttkt', '..tttttttttk', '..tttttttt..', '..ttttttt...', '...tt...tt..', '...kk...kk..'],
  ],
};
const bus = {
  w: 32, h: 14, turns: false,
  frames: [[
    '.' + R('k', 30) + '.', 'k' + R('y', 30) + 'k', 'k' + R('yBccB', 6) + 'k', 'k' + R('yBBBB', 6) + 'k',
    'k' + R('y', 30) + 'k', 'k' + R('g', 30) + 'k', 'k' + R('y', 29) + 'R' + 'k', 'k' + R('y', 30) + 'k',
    'k' + R('y', 30) + 'k', 'kyyy.kkk.' + R('y', 14) + '.kkk.yyyk', 'kkkkk...k' + R('k', 14) + 'k...kkkkk',
    '....k.n.k' + R('.', 14) + 'k.n.k....', '....k...k' + R('.', 14) + 'k...k....', '.....kkk.' + R('.', 14) + '.kkk.....',
  ]],
};
const oetzi = {
  w: 10, h: 16, turns: true,
  frames: [[
    '..bbbbbb..', '..kkkkkkk.', '..hsssss..', '..sssks...', '...ssSs...', '....ss....',
    '...BBBB...', '..BBBBBB..', '..BBBBBB..', '..BBBBBs..', '...dddd...', '...dddd...',
    '...dd.dd..', '...d...d..', '...d...d..', '..kk..kk..',
  ]],
};
const kranz = {
  w: 10, h: 16, turns: true,
  frames: [[
    '...rrrr...', '..rrrrrr..', '..rrssss..', '..rssks...', '..r.ssss..', '....ss....',
    '...yyyy...', '..pyyyyp..', '..pppppp..', '..ppppps..', '...pppp...', '...pppp...',
    '...pppp...', '...s..s...', '...s..s...', '..kk..kk..',
  ]],
};
const baecker = { ...oetzi, palette: { b: '#f4f4f4', B: '#f4f4f4', d: '#94b0c2' } };
const filiale = { ...kranz, palette: { r: '#333c57', p: '#257179', y: '#f4f4f4' } };
const skater = {
  w: 12, h: 16, turns: true, fps: 2,
  frames: [[
    '....kkkk....', '...krrrrk...', '...krrrrrrk.', '...kssksk...', '...ksssssk..', '....kkkkk...',
    '...kppppk...', '..kpppppps..', '..kppppppk..', '...kppppk...', '...kddddk...', '...kdkkdk...',
    '..kdk..kdk..', '..kwk..kwk..', 'kkkkkkkkkkkk', '.kNk....kNk.',
  ]],
};
const jo = { ...skater };
const cart = {
  w: 16, h: 12, turns: false,
  frames: [[
    'k...............', '.k..............', '..kkkkkkkkkkkkkk', '..kNkNkNkNkNkNk.', '...kNkNkNkNkNk..', '...kkkkkkkkkkk..',
    '....kNkNkNkNk...', '....kkkkkkkkk...', '.....k.....k....', '...kkkkkkkkkk...', '....kNk..kNk....', '.....k....k.....',
  ]],
};

// Postbote: gelbe Uniform, Mütze mit Schirm, Posttasche (Y/Z = Postgelb)
const postTop = [
  '...YYYY...', '..YYYYYYk.', '..hsssss..', '..sssks...', '...ssSs...', '....ss....',
  '...YYYY...', '..YhYYYY..', '..YYhYYY..', '..YZhhZs..', '...BBBB...', '...BBBB...',
];
const postbote = {
  w: 10, h: 16, fps: 6, turns: true, palette: { Y: '#f7c815', Z: '#c9960c' },
  frames: [
    [...postTop, '...BB.BB..', '...B...B..', '...B...B..', '..kk..kk..'],
    [...postTop, '...BB.BB..', '..B....B..', '.B.....B..', 'kk....kk..'],
    [...postTop, '...BB.BB..', '...B...B..', '...B...B..', '..kk..kk..'],
    [...postTop, '...BB.BB..', '...B....B.', '...B.....B', '..kk....kk'],
  ],
};
const sprites = {
  palette,
  sprites: {
    florian, florian_down, florian_up, florian_side, car_red: car, cyclist, cyclist_b, kevin, broesel, dog,
    bus, oetzi, kranz, baecker, filiale, skater, jo, cart, florian_note, florian_photo, oma_rollator, sled, ohm: { ...kranz, palette: { r: '#c2a56b', p: '#257179', y: '#f4f4f4' } }, postbote, ralf: { ...oetzi, palette: { b: '#e43b44', B: '#ffcd75', d: '#3b5dc9' } },
  },
};
for (const [name, sp] of Object.entries(sprites.sprites))
  for (const f of sp.frames) {
    if (f.length !== sp.h) throw new Error(`${name}: ${f.length} Zeilen statt ${sp.h}`);
    for (const row of f) if (row.length !== sp.w) throw new Error(`${name}: "${row}" hat ${row.length} statt ${sp.w}`);
  }

const out = JSON.stringify(sprites, null, 1).replace(/\n\s+"([^"]{1,40})",?/g, (m) => m);
writeFileSync(new URL('../assets/sprites.json', import.meta.url), out + '\n');
console.log('assets/sprites.json geschrieben:', Object.keys(sprites.sprites).length, 'Sprites');
