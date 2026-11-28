/*
 * Ledgerlands — game engine, world, UI and rules.
 * Sections: helpers · map · objects & people · state · money · feedback · audio ·
 * quests & next step · dialogue · windows · month-end · movement · rendering ·
 * minimap · side panel · input · title screen · loop.
 */
(() => {
'use strict';
const { SKILLS, ITEMS, ASSETS, BUDGET_CARDS, QUIZ, MONTH_EVENTS, FOLK_TIPS, GLOSSARY } = window.LLDATA;

/* ======================= helpers ======================= */
const TS = 32, COLS = 56, ROWS = 40, MAX_LVL = 50, SAVE_KEY = 'ledgerlands-save-v2', OLD_KEY = 'ledgerlands-save-v1';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fmt = n => Math.floor(n).toLocaleString('en-US');
const fmt2 = n => (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = n => (n >= 0 ? '+' : '−') + fmt2(Math.abs(n));
const pct = n => (n >= 0 ? '+' : '−') + Math.abs(n * 100).toFixed(1) + '%';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const mapRand = mulberry32(1117);
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const f = amt < 0 ? v => v * (1 + amt) : v => v + (255 - v) * amt;
  return `rgb(${f(r) | 0},${f(g) | 0},${f(b) | 0})`;
}
const tileDist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const SHIRTS = ['#3f6fb5', '#b4472f', '#4f9a44', '#7a4fa8', '#d39a2c', '#2f8b8b', '#c25d86'];
const HAIRS = ['#5a3a22', '#1c1410', '#c9a24a', '#9b3b22', '#d8d2c8', '#3b4a7a'];
const SKINS = ['#f3d0b0', '#e8b98f', '#c98e62', '#a8714c', '#7a4e33'];

/* ======================= map ======================= */
const GRASS = 0, PATH = 1, STONE = 2, WATER = 3, BUILD = 4, TREE = 5, FLOWER = 6, BRIDGE = 7, SAND = 8, MUD = 9, BUSH = 10;
const tiles = Array.from({ length: ROWS }, () => new Array(COLS).fill(GRASS));
const noise = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => mapRand()));
const inb = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
const tileAt = (x, y) => inb(x, y) ? tiles[y][x] : TREE;
function fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(x, y)) tiles[y][x] = t; }

const BUILDINGS = [
  { name: 'Bank of Thrift', x0: 13, y0: 8, x1: 19, y1: 12, door: 16, wall: '#ddd2bb', trim: '#5b4632', roof: '#2f6f68', icon: 'coin', chimney: false },
  { name: 'Counting House', x0: 31, y0: 8, x1: 38, y1: 12, door: 34, wall: '#e3cca3', trim: '#5e3f22', roof: '#8e3d26', icon: 'ledger', chimney: true },
  { name: 'Academy', x0: 41, y0: 13, x1: 47, y1: 17, door: 44, wall: '#d8d4ca', trim: '#4a4a52', roof: '#3a4f86', icon: 'book', chimney: false },
  { name: 'Credit Union', x0: 5, y0: 13, x1: 10, y1: 17, door: 7, wall: '#e6caab', trim: '#5a3a28', roof: '#9a4f2c', icon: 'scales', chimney: true },
  { name: 'Your Lodging', x0: 5, y0: 24, x1: 10, y1: 28, door: 7, wall: '#e8d9bc', trim: '#6a4b30', roof: '#6b5a3a', icon: 'house', chimney: true },
  { name: 'Budget Hall', x0: 13, y0: 26, x1: 19, y1: 30, door: 16, wall: '#e2e3c6', trim: '#4e5a2e', roof: '#5f7a35', icon: 'pie', chimney: false },
  { name: 'The Exchange', x0: 31, y0: 26, x1: 38, y1: 30, door: 34, wall: '#dbd2e4', trim: '#3d3358', roof: '#5a4590', icon: 'chart', chimney: false },
];

function buildMap() {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (x < 2 || y < 2 || x >= COLS - 2 || y >= ROWS - 2) tiles[y][x] = TREE;
  fill(49, 2, 49, ROWS - 3, SAND); fill(52, 2, 53, ROWS - 3, SAND);
  fill(50, 0, 51, ROWS - 1, WATER);
  fill(40, 3, 47, 7, SAND); fill(41, 4, 46, 6, WATER);
  fill(3, 20, 49, 21, PATH); fill(25, 3, 26, 37, PATH); fill(4, 33, 42, 33, PATH);
  fill(50, 20, 51, 21, BRIDGE); fill(52, 20, 53, 21, PATH);
  fill(20, 15, 31, 25, STONE);
  fill(13, 13, 19, 14, PATH); fill(16, 15, 16, 19, PATH);
  fill(30, 13, 39, 16, PATH); fill(33, 17, 35, 19, PATH);
  fill(41, 18, 47, 19, PATH);
  fill(5, 18, 10, 19, PATH);
  fill(5, 29, 10, 30, PATH); fill(7, 31, 8, 32, PATH);
  fill(13, 31, 19, 32, PATH); fill(31, 31, 38, 32, PATH);
  fill(3, 34, 6, 36, MUD);
  for (const b of BUILDINGS) {
    fill(b.x0, b.y0, b.x1, b.y1, BUILD);
    for (const x of [b.x0 - 1, b.x1 + 1]) if (tileAt(x, b.y1) === GRASS) tiles[b.y1][x] = BUSH;
  }
  const near = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const t = tileAt(x + i, y + j); if (t !== GRASS && t !== FLOWER && t !== TREE) return true; } return false; };
  for (let y = 2; y < ROWS - 2; y++) for (let x = 2; x < 49; x++) {
    if (tiles[y][x] !== GRASS) continue;
    const r = mapRand();
    if (!near(x, y, 1) && r < 0.11) tiles[y][x] = TREE;
    else if (r > 0.94) tiles[y][x] = FLOWER;
  }
}
buildMap();

const solid = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => [WATER, BUILD, TREE, BUSH].includes(tiles[y][x])));
const TREES = [], BUSHES = [], FLOWER_TILES = [];
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
  const t = tiles[y][x], v = noise[y][x];
  if (t === TREE) TREES.push({ x, y, v, kind: v < 0.3 ? 'pine' : 'oak', ph: v * 10 });
  if (t === BUSH) BUSHES.push({ x, y, v });
  if (t === FLOWER) FLOWER_TILES.push({ x, y });
}
// water depth (distance to the nearest shore tile), for colour
const depth = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (tiles[y][x] === WATER) {
  let d = 4; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const t = tileAt(x + i, y + j); if (t !== WATER && t !== BRIDGE && inb(x + i, y + j)) d = Math.min(d, Math.max(Math.abs(i), Math.abs(j))); }
  depth[y][x] = d;
}

/* ======================= objects & people ======================= */
const OBJECTS = [
  { type: 'desk', x: 31, y: 15, name: 'Clerk’s desk', verb: 'Tally-at', req: 1, item: 'ledger_clerk', xp: 12, ex: 'A sloped desk, an inkwell and a pile of unsummed receipts. Earning level 1.' },
  { type: 'desk', x: 33, y: 15, name: 'Clerk’s desk', verb: 'Tally-at', req: 1, item: 'ledger_clerk', xp: 12, ex: 'Another clerk’s desk. The receipts never end. Earning level 1.' },
  { type: 'auditdesk', x: 36, y: 15, name: 'Auditor’s desk', verb: 'Audit-at', req: 8, item: 'ledger_audit', xp: 28, ex: 'Red ink, a magnifying glass and a stern ruler. Needs Earning level 8.' },
  { type: 'terminal', x: 38, y: 15, name: 'Analyst’s orrery', verb: 'Analyse-at', req: 18, item: 'ledger_analyst', xp: 55, ex: 'A brass calculating engine for market analysis. Needs Earning level 18.' },
  { type: 'chest', x: 18, y: 13, name: 'Bank chest', verb: 'Use', act: () => openBank(), ex: 'An iron-bound deposit chest. Coins inside earn interest.' },
  { type: 'ticker', x: 36, y: 31, name: 'Ticker board', verb: 'Read', act: () => openMarket(), ex: 'Chalk prices, updated every month-end by a very tired runner.' },
  { type: 'board', x: 18, y: 31, name: 'Budget board', verb: 'Study', act: () => openBudget(), ex: 'Expense notes pinned under three headings: Needs, Wants, Saves.' },
  { type: 'lectern', x: 46, y: 18, name: 'Lectern', verb: 'Study', act: () => openQuiz(), ex: 'An open copy of “Coin & Consequence”. Someone has underlined the word compound.' },
  { type: 'fountain', x: 25, y: 17, w: 2, h: 2, name: 'Wishing fountain', verb: 'Toss-coin', act: () => tossCoin(), ex: 'The bottom glitters with coins. None of them are earning interest.' },
  { type: 'sign', x: 28, y: 19, name: 'Signpost', verb: 'Read', act: () => openMap(), ex: 'Directions to every building in town.' },
  { type: 'sign', x: 53, y: 19, name: 'Signpost', verb: 'Read', act: () => msg('“Road to the Capital — closed for repairs. Budget overrun.”'), ex: 'The road beyond is closed.' },
  { type: 'lamp', x: 20, y: 15, name: 'Lamp post', ex: 'An oil lamp. The town pays for the oil out of guild taxes.' },
  { type: 'lamp', x: 31, y: 15, name: 'Lamp post', ex: 'An oil lamp. The town pays for the oil out of guild taxes.' },
  { type: 'lamp', x: 20, y: 25, name: 'Lamp post', ex: 'An oil lamp. The town pays for the oil out of guild taxes.' },
  { type: 'lamp', x: 31, y: 25, name: 'Lamp post', ex: 'An oil lamp. The town pays for the oil out of guild taxes.' },
  { type: 'crate', x: 6, y: 35, name: 'Crates', ex: 'Stamped “GUARANTEED RETURNS”. They are empty.' },
  { type: 'crate', x: 3, y: 36, name: 'Crates', ex: 'More empty crates. Suspicious.' },
];
for (const o of OBJECTS) { o.w = o.w || 1; o.h = o.h || 1; o.kind = 'obj'; for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) solid[o.y + j][o.x + i] = true; }

const LOOK = {
  tamsin: { skin: '#c98e62', hair: '#2b1d14', shirt: '#4f9a44', pants: '#4b3a2a' },
  gus: { skin: '#e3a982', hair: '#9a9a9a', shirt: '#8a5a2b', pants: '#3b3026', hat: '#4a3726' },
  odile: { skin: '#f0c8a0', hair: '#c9a24a', shirt: '#2f7f73', pants: '#2b2b33' },
  marlo: { skin: '#8d5a3b', hair: '#1c1410', shirt: '#6b4fa3', pants: '#26222e', hat: '#1f1a26' },
  wren: { skin: '#f2cfa8', hair: '#9b3b22', shirt: '#9fb84f', pants: '#3d3a2a' },
  basil: { skin: '#d7a27a', hair: '#3a2a1c', shirt: '#b4472f', pants: '#2c2620' },
  ines: { skin: '#b97c55', hair: '#151010', shirt: '#3c5f9e', pants: '#252a3a' },
  hale: { skin: '#e0b08a', hair: '#4a3a2a', shirt: '#5d6670', pants: '#33373c', hat: '#7d8690' },
  pim: { skin: '#efc6a6', hair: '#ddd6cc', shirt: '#a873a8', pants: '#4a3b45' },
  pete: { skin: '#d4b48c', hair: '#222222', shirt: '#c8b23a', pants: '#5a1f1f', hat: '#c8b23a' },
  f1: { skin: '#e9c09a', hair: '#704020', shirt: '#c07a3a', pants: '#40352a' },
  f2: { skin: '#a8714c', hair: '#2a1a10', shirt: '#4f8a8a', pants: '#3a3030' },
  f3: { skin: '#f3d0b0', hair: '#e0b050', shirt: '#9a4a6a', pants: '#2e2a36' },
};
const NPCS = [];
function addNpc(o) { const n = Object.assign({ kind: 'npc', px: (o.x + .5) * TS, py: (o.y + .8) * TS, path: [], facing: 'down', wander: false, home: { x: o.x, y: o.y }, wt: 1 + Math.random() * 4, seed: Math.random() * 10, moving: false }, o); NPCS.push(n); return n; }
addNpc({ id: 'tamsin', name: 'Guide Tamsin', role: 'Town guide', x: 27, y: 22, look: LOOK.tamsin, ex: 'She knows every coin-counting trick in town.', talk: talkTamsin });
addNpc({ id: 'gus', name: 'Foreman Gus', role: 'Counting House', x: 34, y: 13, look: LOOK.gus, quest: 'first_pay', ex: 'Runs the Counting House. Pays fairly and withholds the guild tax.', talk: talkGus });
addNpc({ id: 'odile', name: 'Banker Odile', role: 'Bank of Thrift', x: 16, y: 13, look: LOOK.odile, quest: 'rainy_day', ex: 'Keeps the Bank of Thrift’s books. Loves the word “compound”.', talk: talkOdile });
addNpc({ id: 'marlo', name: 'Broker Marlo', role: 'The Exchange', x: 34, y: 31, look: LOOK.marlo, quest: 'own_meadow', ex: 'Buys and sells shares for a 1-coin fee. Never guesses next month’s prices.', talk: talkMarlo });
addNpc({ id: 'wren', name: 'Clerk Wren', role: 'Budget Hall', x: 16, y: 31, look: LOOK.wren, quest: 'needs_wants', ex: 'Has a budget for her budget.', talk: talkWren });
addNpc({ id: 'basil', name: 'Loan Officer Basil', role: 'Credit Union', x: 7, y: 18, look: LOOK.basil, quest: 'borrower', ex: 'Lends coins at a rate that depends on your credit score.', talk: talkBasil });
addNpc({ id: 'ines', name: 'Scholar Ines', role: 'Academy', x: 44, y: 18, look: LOOK.ines, quest: 'scholar', ex: 'Teaches money at the Academy. Her questions are fair but sharp.', talk: talkInes });
addNpc({ id: 'hale', name: 'Warden Hale', role: 'Town warden', x: 22, y: 24, look: LOOK.hale, quest: 'too_good', ex: 'Keeps the peace, and keeps an eye on swindlers.', talk: talkHale });
addNpc({ id: 'pim', name: 'Landlady Pim', role: 'Your lodging', x: 7, y: 29, look: LOOK.pim, ex: 'Owns your lodging. Collects rent at every month-end.', talk: talkPim });
addNpc({ id: 'pete', name: 'Pyramid Pete', role: '“Opportunities”', x: 4, y: 35, look: LOOK.pete, ex: 'A gold-painted hat and a very big smile.', talk: talkPete });
addNpc({ id: 'f1', name: 'Townsfolk', role: 'Local', x: 23, y: 21, look: LOOK.f1, wander: true, ex: 'A local, going about their business.', talk: talkFolk });
addNpc({ id: 'f2', name: 'Townsfolk', role: 'Local', x: 29, y: 18, look: LOOK.f2, wander: true, ex: 'A local, going about their business.', talk: talkFolk });
addNpc({ id: 'f3', name: 'Townsfolk', role: 'Local', x: 28, y: 24, look: LOOK.f3, wander: true, ex: 'A local, going about their business.', talk: talkFolk });
const npcById = id => NPCS.find(n => n.id === id);
const npcVisible = n => !(n.id === 'pete' && S && S.flags.peteArrested);

const player = { kind: 'player', name: 'You', x: 25, y: 23, px: 0, py: 0, path: [], facing: 'down', pending: null, action: null, actT: 0, moving: false, seed: 0 };
const playerLook = () => ({ skin: S.profile.skin, hair: S.profile.hair, shirt: S.profile.shirt, pants: '#3a3127' });

// light sources for night time
const LIGHTS = [], WINDOWS = [];
for (const b of BUILDINGS) {
  const Y1 = (b.y1 + 1) * TS, wallTop = Y1 - TS * 1.4;
  for (let x = b.x0; x <= b.x1; x++) { if (x === b.door) continue; WINDOWS.push({ x: x * TS + 9, y: wallTop + 12, w: 14, h: 14 }); LIGHTS.push({ x: x * TS + 16, y: wallTop + 24, r: 44, s: .55 }); }
  LIGHTS.push({ x: b.door * TS + 33, y: Y1 - 28, r: 64, s: .9 });
}
for (const o of OBJECTS) if (o.type === 'lamp') LIGHTS.push({ x: (o.x + .5) * TS, y: o.y * TS - 13, r: 92, s: 1 });

/* ======================= state ======================= */
let S = null, mode = 'title';
function stepPrice(p, a) { const dt = 1 / 12; return Math.max(0.5, p * Math.exp((a.mu - a.sigma * a.sigma / 2) * dt + a.sigma * Math.sqrt(dt) * gauss())); }
function defaultSettings() { return { sound: true, vol: 0.6, monthLen: 40, daynight: true, reduceMotion: false, ui: 1, pathDots: true, zoom: 1.15, tracker: true }; }
function defaultState() {
  const s = { v: 2, started: false, profile: { name: 'Traveler', shirt: SHIRTS[0], hair: HAIRS[0], skin: SKINS[1] }, settings: defaultSettings(),
    inv: Array(24).fill(null), bank: 0, vault: false, maxBank: 0, xp: {}, quests: {}, qp: {}, flags: {}, hold: {}, prices: {}, loan: null,
    credit: 650, month: 1, monthT: 0, priceIndex: 1, netHist: [], realHist: [], interestEarned: 0, pos: { x: 25, y: 23 }, asked: [],
    stats: { ledgers: 0, sorted: 0, quiz: 0, paid: 0 }, petePaid: 0, journal: [], lastReport: null, trackQuest: null, paused: false };
  SKILLS.forEach(k => s.xp[k.id] = 0);
  QUESTS.forEach(q => s.quests[q.id] = 0);
  s.inv[0] = { id: 'coins', n: 50 };
  for (const sym in ASSETS) { const a = ASSETS[sym]; let p = a.start; const h = []; for (let i = 0; i < 24; i++) { p = stepPrice(p, a); h.push(+p.toFixed(2)); } s.prices[sym] = h; }
  return s;
}
function mergeDefaults(s) {
  const d = defaultState();
  for (const k in d) if (!(k in s)) s[k] = d[k];
  for (const k in d.settings) if (!(k in s.settings)) s.settings[k] = d.settings[k];
  for (const k in d.xp) if (!(k in s.xp)) s.xp[k] = 0;
  for (const q of QUESTS) if (!(q.id in s.quests)) s.quests[q.id] = 0;
  s.paused = false;
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.v === 2) return mergeDefaults(s); }
    const old = localStorage.getItem(OLD_KEY);
    if (old) { // carry over a save from the first version
      const o = JSON.parse(old); if (!o || o.v !== 1) return null;
      const s = mergeDefaults(Object.assign({}, o, { v: 2, started: true }));
      s.settings.sound = o.sound !== false; s.settings.zoom = o.zoom || 1.15; delete s.sound; delete s.zoom; delete s.log;
      return s;
    }
  } catch (e) { /* storage unavailable or corrupt */ }
  return null;
}
function save() { if (!S || !S.started) return; try { S.pos = { x: player.x, y: player.y }; localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
const motionOK = () => !(S && S.settings.reduceMotion) && !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ======================= inventory & money ======================= */
const STACKABLE = new Set(['coins']);
const invCount = id => S.inv.reduce((a, it) => a + (it && it.id === id ? it.n : 0), 0);
const invFree = () => S.inv.filter(i => !i).length;
const coins = () => invCount('coins');
const ledgerCount = () => invCount('ledger_clerk') + invCount('ledger_audit') + invCount('ledger_analyst');
function invAdd(id, n = 1) {
  if (STACKABLE.has(id)) { const it = S.inv.find(i => i && i.id === id); if (it) { it.n += n; markDirty('pack'); return true; }
    const k = S.inv.indexOf(null); if (k < 0) return false; S.inv[k] = { id, n }; markDirty('pack'); return true; }
  if (invFree() < n) return false;
  for (let i = 0; i < n; i++) S.inv[S.inv.indexOf(null)] = { id, n: 1 };
  markDirty('pack'); return true;
}
function invRemove(id, n = 1) {
  if (n <= 0) return;
  if (STACKABLE.has(id)) { const k = S.inv.findIndex(i => i && i.id === id); if (k < 0) return; S.inv[k].n -= n; if (S.inv[k].n <= 0) S.inv[k] = null; }
  else { for (let i = 0; i < S.inv.length && n > 0; i++) if (S.inv[i] && S.inv[i].id === id) { S.inv[i] = null; n--; } }
  markDirty('pack');
}
function addCoins(n, float = true) {
  n = Math.floor(n); if (n <= 0) return;
  if (!invAdd('coins', n)) { S.bank += n; msg(`Your pack is full, so ${n} coins went straight into your bank account.`, '', 'money'); }
  if (float) floatText(player.px, player.py - 44, `+${n}`, '#ffe36b');
}
function payBill(n) {
  n = Math.ceil(n); const purse = coins();
  if (purse + S.bank < n) return { ok: false };
  const fromPurse = Math.min(purse, n); invRemove('coins', fromPurse);
  const fromBank = n - fromPurse; S.bank -= fromBank; return { ok: true, purse: fromPurse, bank: fromBank };
}
const price = sym => S.prices[sym][S.prices[sym].length - 1];
const portfolioValue = () => Object.keys(S.hold).reduce((a, k) => a + S.hold[k].n * price(k), 0);
const netWorth = () => coins() + S.bank + portfolioValue() - (S.loan ? S.loan.bal : 0);
const lvl = id => levelOf(S.xp[id]);
const rent = () => Math.max(1, Math.round(20 * S.priceIndex) - (lvl('budgeting') >= 10 ? 2 : 0));
function loanTerms() {
  const sc = S.credit; let apr = sc >= 740 ? 0.09 : sc >= 670 ? 0.14 : 0.22; if (lvl('credit') >= 10) apr -= 0.02;
  const amt = sc >= 720 ? 400 : 200, n = 6, r = apr / 12, pay = amt * r / (1 - Math.pow(1 + r, -n));
  return { amt, apr, n, pay, total: pay * n };
}
function schedule(bal, apr, pay, max = 24) {
  const rows = []; let b = bal;
  for (let i = 1; i <= max && b > 0.005; i++) { const int = b * apr / 12, p = Math.min(pay, b + int); b = b + int - p; rows.push({ i, p, int, prin: p - int, bal: Math.max(0, b) }); }
  return rows;
}
const creditBand = sc => sc >= 800 ? 'Excellent' : sc >= 740 ? 'Very good' : sc >= 670 ? 'Good' : sc >= 580 ? 'Fair' : 'Poor';
const xpFor = L => L <= 1 ? 0 : Math.round(40 * (L - 1) ** 2 + 60 * (L - 1));
function levelOf(xp) { let L = 1; while (L < MAX_LVL && xp >= xpFor(L + 1)) L++; return L; }

/* ======================= feedback ======================= */
const chatEl = $('#chat');
let chatFilter = 'all';
function msg(html, cls = '', cat) {
  cat = cat || (cls === 'lesson' ? 'lesson' : (cls === 'good' || cls === 'bad' || cls === 'month') ? 'money' : 'game');
  const p = document.createElement('p'); p.className = (cls ? 'm-' + cls + ' ' : '') + 'c-' + cat; p.innerHTML = html; chatEl.appendChild(p);
  while (chatEl.children.length > 120) chatEl.firstChild.remove();
  chatEl.scrollTop = chatEl.scrollHeight;
  if (chatFilter !== 'all' && chatFilter !== cat) $('.chat-tabs [data-f="all"]').classList.add('unread');
}
function lesson(title, text) {
  msg(`<b>Lesson · ${esc(title)}:</b> ${text}`, 'lesson');
  const plain = text.replace(/<[^>]+>/g, '');
  const i = S.journal.findIndex(j => j.t === title);
  if (i >= 0) S.journal.splice(i, 1);
  S.journal.unshift({ t: title, x: plain, m: S.month });
  if (tab !== 'journal') $('#tabs [data-tab="journal"]').classList.add('has-new');
  markDirty('journal');
}
function drop(skill, amount) {
  const k = SKILLS.find(s => s.id === skill); const d = document.createElement('div'); d.className = 'drop'; d.style.setProperty('--c', k.color);
  d.innerHTML = `+${fmt(amount)} <b>${k.name}</b>`; $('#drops').appendChild(d); setTimeout(() => d.remove(), 1800);
}
const floats = [];
function floatText(x, y, text, color) { floats.push({ x, y, text, color, t: 0 }); }
function banner(t1, t2) { const b = $('#banner'); b.hidden = false; b.innerHTML = `<div class="b1">${esc(t1)}</div><div class="b2">${esc(t2 || '')}</div>`; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; clearTimeout(banner._t); banner._t = setTimeout(() => b.hidden = true, 3300); }
function toast(html, cls = '', ms = 6000) {
  const el = document.createElement('div'); el.className = 'toast ' + cls; el.innerHTML = html; el.title = 'Click to dismiss';
  const kill = () => { if (el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => el.remove(), 360); };
  el.onclick = kill; $('#toasts').appendChild(el); setTimeout(kill, ms);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  return el;
}
function addXP(skill, amount) {
  amount = Math.round(amount); if (amount <= 0) return;
  const before = levelOf(S.xp[skill]); S.xp[skill] += amount; const after = levelOf(S.xp[skill]);
  drop(skill, amount); markDirty('skills');
  if (after > before) {
    const k = SKILLS.find(s => s.id === skill);
    const unlocked = k.unlocks.filter(u => u[0] > before && u[0] <= after).map(u => u[1]);
    msg(`Congratulations, your ${k.name} level is now ${after}.${unlocked.length ? ' Unlocked: ' + unlocked.join('; ') + '.' : ''}`, 'good', 'game');
    banner('Level up!', `${k.name} is now level ${after}${unlocked.length ? ' · ' + unlocked[0] : ''}`); sfx('level');
  }
}

/* ======================= audio ======================= */
let actx = null;
function sfx(kind) {
  if (!S || !S.settings.sound) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const seq = { coin: [[988, .05], [1319, .12]], good: [[660, .07], [880, .12]], bad: [[220, .16]], level: [[523, .1], [659, .1], [784, .1], [1047, .3]], click: [[700, .03]], quest: [[392, .12], [523, .12], [659, .12], [784, .12], [1047, .4]], tick: [[440, .05], [330, .08]], open: [[520, .04], [780, .06]] }[kind] || [];
  const vol = .1 * S.settings.vol; let t = actx.currentTime;
  for (const [f, d] of seq) { const o = actx.createOscillator(), g = actx.createGain(); o.type = kind === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + .02); t += d * .85; }
}

/* ======================= quests & next step ======================= */
// Listed in the order the next-step card suggests them.
const QUESTS = [
  { id: 'first_pay', name: 'First Paycheck', giver: 'Foreman Gus', giverId: 'gus', where: 'Counting House, north-east of the plaza',
    desc: 'Tally ledgers at a clerk’s desk, then hand 5 of them to Foreman Gus.',
    prog: s => `${Math.min(5, s.qp.first_pay || 0)} of 5 ledgers handed in`, frac: s => Math.min(1, (s.qp.first_pay || 0) / 5), goal: s => (s.qp.first_pay || 0) >= 5,
    reward: { xp: { earning: 150 }, coins: 30, item: 'stub' }, rtext: '150 Earning XP · 30 coins · First pay stub' },
  { id: 'rainy_day', name: 'Rainy Day Fund', giver: 'Banker Odile', giverId: 'odile', where: 'Bank of Thrift, north-west of the plaza',
    desc: 'Build an emergency fund: have 150 coins saved in the Bank of Thrift.',
    prog: s => `${fmt(Math.min(150, s.bank))} of 150 coins saved`, frac: s => Math.min(1, s.bank / 150), goal: s => s.bank >= 150,
    reward: { xp: { saving: 350 }, coins: 0, item: 'piggy' }, rtext: '350 Saving XP · Brass piggy bank' },
  { id: 'needs_wants', name: 'Needs, Wants and Saves', giver: 'Clerk Wren', giverId: 'wren', where: 'Budget Hall, south-west',
    desc: 'Sort 10 expenses correctly at the Budget Hall board.',
    prog: s => `${Math.min(10, s.qp.needs_wants || 0)} of 10 sorted correctly`, frac: s => Math.min(1, (s.qp.needs_wants || 0) / 10), goal: s => (s.qp.needs_wants || 0) >= 10,
    reward: { xp: { budgeting: 300 }, coins: 25, item: 'sorter' }, rtext: '300 Budgeting XP · 25 coins · Budget quill' },
  { id: 'own_meadow', name: 'A Slice of the Meadow', giver: 'Broker Marlo', giverId: 'marlo', where: 'The Exchange, south-east',
    desc: 'Buy shares of the Meadow Index Fund and keep holding them for 3 month-ends.',
    prog: s => `${Math.min(3, s.qp.own_meadow || 0)} of 3 month-ends held`, frac: s => Math.min(1, (s.qp.own_meadow || 0) / 3), goal: s => (s.qp.own_meadow || 0) >= 3,
    reward: { xp: { investing: 400 }, coins: 20, item: 'certificate' }, rtext: '400 Investing XP · 20 coins · Meadow certificate' },
  { id: 'scholar', name: 'Scholar’s Seal', giver: 'Scholar Ines', giverId: 'ines', where: 'Academy, east road',
    desc: 'Answer 8 of Scholar Ines’s questions correctly.',
    prog: s => `${Math.min(8, s.qp.scholar || 0)} of 8 correct`, frac: s => Math.min(1, (s.qp.scholar || 0) / 8), goal: s => (s.qp.scholar || 0) >= 8,
    reward: { xp: { knowledge: 400 }, coins: 30, item: 'seal' }, rtext: '400 Knowledge XP · 30 coins · Scholar’s seal' },
  { id: 'borrower', name: 'Borrower’s Oath', giver: 'Loan Officer Basil', giverId: 'basil', where: 'Credit Union, west road',
    desc: 'Take out a loan from the Credit Union and repay all of it.',
    prog: s => s.loan ? `${fmt2(s.loan.bal)} coins still owed` : (s.flags.loanTakenQ ? 'Repaid' : 'No loan taken yet'),
    frac: s => s.flags.loanRepaidQ ? 1 : s.loan && s.flags.loanTakenQ ? clamp(1 - s.loan.bal / (s.loan.orig || s.loan.bal), 0, 1) * .9 + .1 : 0, goal: s => !!s.flags.loanRepaidQ,
    reward: { xp: { credit: 400 }, coins: 40, item: 'oath' }, rtext: '400 Credit XP · 40 coins · Borrower’s oath' },
  { id: 'too_good', name: 'Too Good To Be True', giver: 'Warden Hale', giverId: 'hale', where: 'Town plaza',
    desc: 'Someone in the south-west alley promises guaranteed riches. Hear the pitch, then report it to Warden Hale.',
    prog: s => s.flags.heardPitch ? 'Pitch heard. Report it to Warden Hale.' : 'Find the stranger in the south-west alley.', frac: s => s.flags.peteArrested ? 1 : s.flags.heardPitch ? .5 : 0, goal: s => !!s.flags.peteArrested,
    reward: { xp: { knowledge: 300 }, coins: 50, item: 'badge' }, rtext: '300 Knowledge XP · 50 coins · Scam-buster badge' },
];
const qs = id => S.quests[id];
const questById = id => QUESTS.find(q => q.id === id);
function startQuest(id) {
  if (S.quests[id]) return; S.quests[id] = 1; if (id === 'borrower' && S.loan) { S.flags.loanTakenQ = true; S.loan.orig = S.loan.orig || S.loan.bal; }
  const q = questById(id); S.trackQuest = id;
  msg(`New quest: ${q.name}.`, 'quest', 'game'); sfx('open'); markDirty('quests');
  toast(`<h3>Quest started</h3><b>${esc(q.name)}</b><p class="hint2">${esc(q.desc)}</p>`, 'quest', 4500);
  checkQuests(); refreshObjective(); save();
}
function checkQuests() {
  for (const q of QUESTS) {
    if (S.quests[q.id] !== 1 || !q.goal(S)) continue;
    S.quests[q.id] = 2; const r = q.reward;
    for (const k in r.xp) addXP(k, r.xp[k]);
    if (r.coins) addCoins(r.coins);
    if (r.item && !invAdd(r.item, 1)) msg(`Your pack is full, so the ${ITEMS[r.item].name} was left with ${q.giver}.`);
    if (S.trackQuest === q.id) S.trackQuest = null;
    msg(`Quest complete: ${q.name}!`, 'quest', 'game'); sfx('quest'); markDirty('quests');
    const done = QUESTS.filter(x => S.quests[x.id] === 2).length;
    toast(`<h3>Quest complete!</h3><b>${esc(q.name)}</b><p class="hint2">${esc(q.rtext)}</p><p class="hint2">${done} of ${QUESTS.length} quests done${done === QUESTS.length ? '. You finished every quest in Ledgerlands!' : ''}</p>`, 'quest', 7000);
    save();
  }
}
function nearestObj(type) { let best = null, bd = 1e9; for (const o of OBJECTS) if (o.type === type) { const d = tileDist(o, player); if (d < bd) { bd = d; best = o; } } return best; }
function questStep(id) {
  const gus = npcById('gus');
  switch (id) {
    case 'first_pay': {
      const need = Math.max(1, 5 - (S.qp.first_pay || 0)), have = ledgerCount();
      if (have >= need || (!invFree() && have)) return { title: 'First Paycheck', text: `Hand your <b>${have}</b> ledger${have > 1 ? 's' : ''} to <b>Foreman Gus</b>.`, target: gus };
      return { title: 'First Paycheck', text: `Tally ledgers at a <b>clerk’s desk</b>: ${have} of ${need} ready.`, target: nearestObj('desk') };
    }
    case 'rainy_day':
      if (coins() < 10 && S.bank < 150) return { title: 'Rainy Day Fund', text: `Earn coins at a <b>clerk’s desk</b>, then deposit them. Saved ${fmt(S.bank)} of 150.`, target: ledgerCount() >= 5 ? gus : nearestObj('desk') };
      return { title: 'Rainy Day Fund', text: `Deposit coins with <b>Banker Odile</b>: ${fmt(S.bank)} of 150 saved.`, target: npcById('odile') };
    case 'needs_wants': return { title: 'Needs, Wants and Saves', text: `Sort expenses at the <b>Budget board</b>: ${Math.min(10, S.qp.needs_wants || 0)} of 10.`, target: nearestObj('board') };
    case 'own_meadow':
      if (!(S.hold.MIDX && S.hold.MIDX.n)) return { title: 'A Slice of the Meadow', text: `Buy <b>Meadow Index</b> shares from <b>Broker Marlo</b> (about ${Math.ceil(price('MIDX')) + 1} coins each).`, target: npcById('marlo') };
      return { title: 'A Slice of the Meadow', text: `Hold your shares through month-ends: ${Math.min(3, S.qp.own_meadow || 0)} of 3. Meanwhile, try another quest.`, target: null };
    case 'scholar': return { title: 'Scholar’s Seal', text: `Answer questions at the <b>Academy lectern</b>: ${Math.min(8, S.qp.scholar || 0)} of 8.`, target: nearestObj('lectern') };
    case 'borrower':
      if (!S.loan) return { title: 'Borrower’s Oath', text: 'Take a small loan from <b>Loan Officer Basil</b>.', target: npcById('basil') };
      return { title: 'Borrower’s Oath', text: `Repay your loan: <b>${fmt2(S.loan.bal)}</b> owed. Payments come out at each month-end, or pay early with Basil.`, target: npcById('basil') };
    case 'too_good':
      if (!S.flags.heardPitch) return { title: 'Too Good To Be True', text: 'Find the stranger in the <b>south-west alley</b> and hear his pitch.', target: npcById('pete') };
      return { title: 'Too Good To Be True', text: 'Report the pitch to <b>Warden Hale</b> on the plaza.', target: npcById('hale') };
  }
  return null;
}
function objective() {
  if (!S.flags.metTamsin) return { title: 'Meet the town guide', text: 'Talk to <b>Guide Tamsin</b>, just east of you on the plaza.', target: npcById('tamsin') };
  const order = [];
  if (S.trackQuest && S.quests[S.trackQuest] === 1) order.push(S.trackQuest);
  for (const q of QUESTS) if (S.quests[q.id] === 1 && !order.includes(q.id)) order.push(q.id);
  let holding = null;
  for (const id of order) { const st = questStep(id); if (st && st.target) return st; if (st && !holding) holding = st; }
  const next = QUESTS.find(q => S.quests[q.id] === 0 && npcVisible(npcById(q.giverId)));
  if (next) return { title: next.name, text: `${holding ? 'While you wait, talk' : 'Talk'} to <b>${esc(next.giver)}</b> to start this quest.`, target: npcById(next.giverId) };
  if (holding) return holding;
  return { title: 'Grow your net worth', text: 'Every quest is done. Keep earning, saving and investing, and watch your ledger.', target: null };
}
let curObj = null, objKey = '';
function refreshObjective() {
  curObj = objective();
  const key = curObj.title + '|' + curObj.text;
  if (key !== objKey) { objKey = key; $('#trk-title').textContent = curObj.title; $('#trk-text').innerHTML = curObj.text; }
  const show = mode === 'play' && S.settings.tracker;
  $('#tracker').hidden = !show; $('#trk-show').hidden = !(mode === 'play' && !S.settings.tracker);
  $('#trk-main').disabled = !curObj.target;
}

/* ======================= dialogue ======================= */
const dlg = { el: $('#dialog'), name: $('#dlg-name'), role: $('#dlg-role'), text: $('#dlg-text'), opts: $('#dlg-opts'), open: false, choices: [], npc: null };
function say(npc, text, options) {
  dlg.open = true; dlg.npc = npc; dlg.el.hidden = false; $('#chatbox').hidden = true;
  dlg.name.textContent = npc.name; dlg.role.textContent = npc.role || ''; dlg.text.innerHTML = text;
  drawPortrait(npc.look);
  const opts = options && options.length ? options : [{ t: 'Continue', f: closeDialog }];
  dlg.choices = opts; dlg.opts.innerHTML = '';
  opts.forEach((o, i) => { const b = document.createElement('button'); b.innerHTML = `<span class="k">${opts.length > 1 ? i + 1 : '↵'}</span><span>${esc(o.t)}</span>`; b.onclick = () => { sfx('click'); o.f(); }; dlg.opts.appendChild(b); });
  faceEachOther(npc);
}
function closeDialog() { if (!dlg.open) return; objT = 0; dlg.open = false; dlg.npc = null; dlg.el.hidden = true; $('#chatbox').hidden = false; chatEl.scrollTop = chatEl.scrollHeight; }
const bye = { t: 'Goodbye.', f: closeDialog };
function faceEachOther(n) { const dx = player.x - n.x, dy = player.y - n.y; n.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); player.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'right' : 'left') : (dy < 0 ? 'down' : 'up'); }
function questOffer(npc, id, pitch, accept) {
  return { t: `Ask about “${questById(id).name}”`, f: () => say(npc, pitch, [{ t: 'I’ll do it.', f: () => { startQuest(id); say(npc, accept); } }, { t: 'Maybe later.', f: closeDialog }]) };
}
const statusLine = id => { const q = questById(id); return `<i>${esc(q.name)}:</i> ${esc(q.prog(S))}.`; };
const name = () => esc(S.profile.name);

function talkTamsin(n) {
  const first = !S.flags.metTamsin; S.flags.metTamsin = true;
  const main = () => say(n, first ? `Welcome to Ledgerlands, ${name()}! Here coins are earned, saved, invested and sometimes lost. You grow six skills as you learn how money works.` : `Back again, ${name()}? Ask me anything.`, [
    { t: 'Where should I start?', f: () => say(n, 'Follow the <b>Next step</b> card in the top-left corner. Click it and you’ll walk straight there. First stop: Foreman Gus at the Counting House, for your first paycheck.', [{ t: 'Something else…', f: main }, bye]) },
    { t: 'How do I earn coins?', f: () => say(n, 'At the Counting House, north-east of here, sit at a clerk’s desk to tally ledgers. Hand them to Foreman Gus and he pays a wage, minus the guild tax.', [{ t: 'Something else…', f: main }, bye]) },
    { t: 'What happens at each month-end?', f: () => say(n, 'Watch the clock in the top-right corner. At midnight on month-end Landlady Pim collects rent, the bank pays interest, prices move and loan payments come due. You get a short report each time. Press <b>P</b> to pause whenever you like.', [{ t: 'Something else…', f: main }, bye]) },
    { t: 'How do I move around?', f: () => say(n, 'Click the ground, or use <b>WASD</b> or the arrow keys. Click a person or object to use it; right-click, or press and hold on a phone, for every option. <b>M</b> opens the town map.', [{ t: 'Something else…', f: main }, bye]) },
    bye]);
  main(); markDirty('all');
}
function talkGus(n) {
  const ledgers = ledgerCount(), opts = [];
  if (ledgers) opts.push({ t: `Hand in ${ledgers} ledger${ledgers > 1 ? 's' : ''}.`, f: () => handIn(n) });
  if (!qs('first_pay')) opts.push(questOffer(n, 'first_pay', 'Need work? Sit at one of the clerk’s desks out front and tally receipts into ledgers. Bring me 5 and I’ll pay you, plus a bonus.', 'Good. The desks are right behind you. Click one and you’ll keep working until you stop or your pack fills up.'));
  opts.push({ t: 'How does pay work here?', f: () => say(n, 'I pay a gross wage for each ledger. The guild takes 10% as tax, and you keep the rest: your net pay. Better desks pay more, but you need more Earning skill to use them.', [{ t: 'Thanks.', f: () => talkGus(n) }]) });
  opts.push(bye);
  say(n, qs('first_pay') === 1 ? `Back already? ${statusLine('first_pay')}` : 'Counting House. Ledgers in, coins out. What do you need?', opts);
}
function handIn(n) {
  let gross = 0, count = 0;
  for (const id of ['ledger_clerk', 'ledger_audit', 'ledger_analyst']) { const c = invCount(id); if (c) { gross += c * ITEMS[id].pay; count += c; invRemove(id, c); } }
  const tax = Math.floor(gross * 0.10), net = gross - tax;
  addCoins(net); S.stats.paid += net; sfx('coin');
  if (qs('first_pay') === 1) S.qp.first_pay = (S.qp.first_pay || 0) + count;
  msg(`You hand in ${count} ledger${count > 1 ? 's' : ''}. Gross pay ${gross}, guild tax ${tax}, net pay <b>${net}</b> coins.`, 'good');
  if (!S.flags.taxLesson) { S.flags.taxLesson = true; lesson('Gross vs net pay', 'Gross pay is what you earn. Net pay is what you keep after taxes. Budget with your net pay.'); }
  say(n, `Here you go: ${gross} coins gross, minus ${tax} guild tax. That’s <b>${net} coins</b> in your purse.`, [{ t: 'Thanks, Gus.', f: () => { closeDialog(); checkQuests(); } }]);
  save();
}
function talkOdile(n) {
  const opts = [{ t: 'I’d like to use my account.', f: () => { closeDialog(); openBank(); } }];
  if (!qs('rainy_day')) opts.push(questOffer(n, 'rainy_day', 'Something can go wrong any month: a broken wheel, a fever. Savers with an emergency fund pay those bills without borrowing. Save 150 coins with me and I’ll reward you.', 'Wonderful. Deposit at my counter or the bank chest. Your coins earn interest while they wait.'));
  opts.push({ t: 'What is APY?', f: () => say(n, 'Annual Percentage Yield: what your savings earn in a year, including interest on interest. At 2% APY, 100 coins become about 102 after a year. Leave them for years and the growth speeds up.', [{ t: 'Thanks.', f: () => talkOdile(n) }]) });
  opts.push(bye);
  say(n, qs('rainy_day') === 1 ? `Welcome back. ${statusLine('rainy_day')}` : 'Welcome to the Bank of Thrift. Coins left here earn interest at every month-end.', opts);
}
function talkMarlo(n) {
  const opts = [{ t: 'Show me the market.', f: () => { closeDialog(); openMarket(); } }];
  if (!qs('own_meadow')) opts.push(questOffer(n, 'own_meadow', 'Want to own a slice of the whole town? Buy shares of the Meadow Index Fund and hold them for three month-ends, even if prices dip.', 'Splendid. Prices change at each month-end. Patience is the trick.'));
  opts.push({ t: 'Index fund or single company?', f: () => say(n, 'An index fund owns many companies, so one failure barely hurts. Dragonfly Mining is one company: it can double or halve. Most patient investors keep the core of their money diversified.', [{ t: 'Thanks.', f: () => talkMarlo(n) }]) });
  opts.push({ t: 'What will prices do next month?', f: () => say(n, 'Nobody knows, including me. Short-term moves are mostly noise. Over many years diversified holdings have tended to grow, but never in a straight line.', [{ t: 'Thanks.', f: () => talkMarlo(n) }]) });
  opts.push(bye);
  say(n, qs('own_meadow') === 1 ? `Holding steady? ${statusLine('own_meadow')}` : 'The Exchange! Shares, bonds and a 1-coin fee per trade.', opts);
}
function talkWren(n) {
  const opts = [{ t: 'Let me sort some expenses.', f: () => { closeDialog(); openBudget(); } }];
  if (!qs('needs_wants')) opts.push(questOffer(n, 'needs_wants', 'Most budgets fail because people mix up needs and wants. Sort 10 expenses correctly at my board and I’ll give you my spare quill.', 'Lovely. Click the board, or ask me any time.'));
  opts.push({ t: 'What is 50/30/20?', f: () => say(n, 'Split your net pay: about 50% for needs like rent and food, 30% for wants, and 20% for savings and extra debt payments. Adjust it to your life, but always know where your coins go.', [{ t: 'Thanks.', f: () => talkWren(n) }]) });
  opts.push(bye);
  say(n, qs('needs_wants') === 1 ? `Back to sorting? ${statusLine('needs_wants')}` : 'Budget Hall. A budget is a plan for your coins before they disappear.', opts);
}
function talkBasil(n) {
  const opts = [{ t: 'Show me loans and my credit.', f: () => { closeDialog(); openLoan(); } }];
  if (!qs('borrower')) opts.push(questOffer(n, 'borrower', 'Credit is trust. Borrow from me, make every payment on time, and repay it all. Your score rises, and better rates follow.', 'Good. Payments come out of your purse, or your bank if your purse is short, at each month-end.'));
  opts.push({ t: 'How does my credit score work?', f: () => say(n, `It runs from 300 to 850. Paying on time raises it; missed payments and unpaid bills drop it hard. A higher score gets lower interest rates. Yours is ${S.credit}, which counts as ${creditBand(S.credit)}.`, [{ t: 'Thanks.', f: () => talkBasil(n) }]) });
  opts.push(bye);
  say(n, qs('borrower') === 1 ? `Hello again. ${statusLine('borrower')}` : 'Credit Union. We lend, you repay, everybody stays friends.', opts);
}
function talkInes(n) {
  const opts = [{ t: 'Quiz me.', f: () => { closeDialog(); openQuiz(); } }];
  if (!qs('scholar')) opts.push(questOffer(n, 'scholar', 'Knowledge compounds faster than coins. Answer 8 of my questions correctly and you’ll earn the Scholar’s Seal.', 'Then let us begin whenever you are ready. Use the lectern or ask me.'));
  opts.push({ t: 'Teach me the Rule of 72.', f: () => { lesson('Rule of 72', 'Divide 72 by a yearly growth rate to estimate the years it takes to double. 6% → about 12 years. It works for debt too: at 24% interest a debt doubles in about 3 years.'); say(n, 'Divide 72 by a yearly growth rate to estimate how many years it takes to double. At 6%: about 12 years. At 9%: about 8. It works for debt too. At 24% interest, a debt doubles in about 3 years.', [{ t: 'Thanks.', f: () => talkInes(n) }]); } });
  opts.push(bye);
  say(n, qs('scholar') === 1 ? `Ready for more? ${statusLine('scholar')}` : 'Welcome to the Academy. What would you like to learn?', opts);
}
function talkHale(n) {
  if (!qs('too_good')) return say(n, 'Keep your wits about you. There’s talk of a stranger in the south-west alley promising guaranteed riches. Hear him out, keep your coins, and report back to me.', [{ t: 'I’ll look into it.', f: () => { startQuest('too_good'); closeDialog(); } }, bye]);
  if (qs('too_good') === 1 && S.flags.heardPitch) return say(n, 'Well? What did the stranger offer?', [{ t: '“Double your coins in a month, guaranteed.” He pays old investors with new investors’ coins.', f: () => {
    S.flags.peteArrested = true; const p = npcById('pete'); p.path = [];
    lesson('Pyramid and Ponzi schemes', 'They pay early members with money from new members. When new money stops, the scheme collapses and most people lose everything. Guaranteed high returns are the warning sign.');
    say(n, 'That’s a textbook pyramid scheme. My guards will escort “Pyramid Pete” out of town. Thank you, citizen.', [{ t: 'Glad to help.', f: () => { closeDialog(); checkQuests(); } }]);
  } }, bye]);
  if (qs('too_good') === 1) return say(n, 'The alley is south-west, past the lodgings. Hear the stranger’s pitch, then come back.', [bye]);
  say(n, 'Quiet day, thanks to you. Remember: if it sounds too good to be true, it probably is.', [bye]);
}
function talkPim(n) {
  say(n, `Rent is ${rent()} coins at each month-end. It comes from your purse, or from your bank if your purse is short. Prices creep up every month with inflation, so rent does too.${lvl('budgeting') >= 10 ? ' You’ve been reliable, so I take 2 coins off.' : ''}`, [
    { t: 'What if I can’t pay?', f: () => say(n, 'Then it goes on your record as an unpaid bill, and your credit score drops. Keep an emergency fund and that never happens.', [bye]) }, bye]);
}
function talkPete(n) {
  if (S.petePaid) return say(n, 'Patience, friend! Your coins are working very hard. Come back next month!', [bye]);
  const pitch = () => say(n, 'Hand me 100 coins today, and next month I’ll hand you back <b>200</b>. Guaranteed! No risk at all!', [
    { t: 'Here are 100 coins!', f: () => { if (coins() < 100) return say(n, `Only ${coins()} coins? Come back when your purse is fatter, friend!`, [bye]); invRemove('coins', 100); S.petePaid = 100; S.flags.heardPitch = true; floatText(player.px, player.py - 44, '−100', '#ff8a6a'); msg('You hand Pyramid Pete 100 coins.', 'bad'); sfx('coin'); say(n, 'Wise choice! See you next month!', [bye]); save(); } },
    { t: 'Where do the profits come from?', f: () => { S.flags.heardPitch = true; say(n, 'Er… from new investors who join after you! The more friends you bring, the more everyone earns. Well, the early ones do.', [{ t: 'No thanks.', f: () => { closeDialog(); msg('You keep your coins. Warden Hale would want to hear about this.'); } }, { t: 'Tell me again…', f: pitch }]); } },
    { t: 'No thanks.', f: () => { S.flags.heardPitch = true; closeDialog(); msg('You keep your coins. Warden Hale would want to hear about this.'); } }]);
  say(n, 'Psst! Want to get rich? Truly, wildly rich?', [{ t: 'I’m listening…', f: pitch }, bye]);
}
function talkFolk(n) { say(n, pick(FOLK_TIPS), [bye]); }
function tossCoin() {
  if (!coins()) return msg('You have no coins to toss.');
  invRemove('coins', 1); sfx('coin'); floatText(player.px, player.py - 44, '−1', '#ff8a6a');
  msg('You toss a coin into the fountain and make a wish. Wishing is not a financial plan.');
}

/* ======================= windows ======================= */
const win = { el: $('#win'), title: $('#win-title'), body: $('#win-body'), refresh: null, onKey: null };
function openWindow(title, build) {
  closeCtx(); closeDialog(); player.action = null;
  win.title.textContent = title; win.body.onclick = null; win.body.oninput = null; win.onKey = null; win.body.innerHTML = '';
  win.el.hidden = false; $('#scrim').hidden = false; sfx('open');
  win.refresh = build(win.body) || null; win.body.scrollTop = 0;
  const f = win.body.querySelector('button:not(:disabled), input'); (f || $('#win-close')).focus({ preventScroll: true });
}
function closeWindow() { if (win.el.hidden) return; win.el.hidden = true; $('#scrim').hidden = true; win.refresh = null; win.onKey = null; win.body.innerHTML = ''; view.focus({ preventScroll: true }); }
$('#win-close').onclick = closeWindow;
$('#scrim').onclick = closeWindow;
const stepper = (id, val, max) => `<span class="stepper"><button data-step="-" data-for="${id}" aria-label="Less">−</button><input id="${id}" type="number" inputmode="numeric" min="0" max="${max}" value="${val}" aria-label="Amount"><button data-step="+" data-for="${id}" aria-label="More">+</button></span>`;
function readAmt(id, max) { const el = document.getElementById(id); const v = clamp(Math.floor(+el.value || 0), 0, max); return v; }
function stepAmt(btn, max, step) { const el = document.getElementById(btn.dataset.for); el.value = clamp((Math.floor(+el.value || 0)) + (btn.dataset.step === '+' ? step : -step), 0, max); }

function openBank() {
  let mode2 = 'dep';
  openWindow('Bank of Thrift', body => {
    const avail = () => mode2 === 'dep' ? coins() : Math.floor(S.bank + 1e-9);
    const render = () => {
      const canVault = lvl('saving') >= 6, a = avail();
      body.innerHTML = `
        <div class="stats"><div class="stat"><span>Purse</span><b>${fmt(coins())}</b></div><div class="stat"><span>Savings</span><b>${fmt2(S.bank)}</b></div><div class="stat"><span>Interest earned</span><b>${fmt2(S.interestEarned)}</b></div></div>
        <p>Account: <b>${S.vault ? 'Thrift Vault · 5.00% APY' : 'Basic Savings · 2.00% APY'}</b>, paid at each month-end.</p>
        <div class="seg" role="group" aria-label="Deposit or withdraw"><button data-mode="dep" aria-pressed="${mode2 === 'dep'}">Deposit</button><button data-mode="wd" aria-pressed="${mode2 === 'wd'}">Withdraw</button></div>
        <div class="amount">${stepper('amt', Math.min(a, mode2 === 'dep' ? Math.max(10, Math.floor(a / 2)) : 10), a)}
          <div class="chips"><button class="chip" data-q="10">10</button><button class="chip" data-q="50">50</button><button class="chip" data-q="half">Half</button><button class="chip" data-q="all">All ${fmt(a)}</button></div></div>
        <button class="pbtn primary" id="bank-go"></button>
        ${S.vault ? '' : `<p style="margin-top:14px"><button class="pbtn" data-vault ${canVault ? '' : 'disabled'}>Move to the Thrift Vault · 5% APY</button> ${canVault ? '' : '<span class="lock">Unlocks at Saving level 6</span>'}</p>`}
        <p style="margin-top:12px" id="bank-proj"></p>
        <aside class="lesson"><b>Compound interest</b>Each month the bank pays interest on your balance, including last month’s interest. Small rates add up over years. Different accounts pay different rates, so it pays to compare.</aside>`;
      sync();
    };
    const sync = () => { const a = avail(), n = readAmt('amt', a), b = $('#bank-go'); b.textContent = n ? `${mode2 === 'dep' ? 'Deposit' : 'Withdraw'} ${fmt(n)} coin${n === 1 ? '' : 's'}` : (a ? 'Choose an amount' : mode2 === 'dep' ? 'Your purse is empty' : 'Your savings are empty'); b.disabled = !n;
      const rate = S.vault ? 0.05 : 0.02, base = Math.max(0, S.bank + (mode2 === 'dep' ? n : -n)), g = m => base * Math.pow(1 + rate / 12, m);
      $('#bank-proj').innerHTML = base > 0 ? `${n ? `After this ${mode2 === 'dep' ? 'deposit' : 'withdrawal'}, if` : 'If'} you leave <b>${fmt2(base)}</b> alone at ${(rate * 100).toFixed(0)}% APY: <b>${fmt2(g(12))}</b> after 1 year, <b>${fmt2(g(60))}</b> after 5 years, <b>${fmt2(g(240))}</b> after 20.` : 'Deposit some coins to see how they grow.'; };
    body.oninput = e => { if (e.target.id === 'amt') sync(); };
    body.onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const a = avail();
      if (b.dataset.mode) { mode2 = b.dataset.mode; render(); return; }
      if (b.dataset.step) { stepAmt(b, a, 10); sync(); return; }
      if (b.dataset.q) { $('#amt').value = b.dataset.q === 'all' ? a : b.dataset.q === 'half' ? Math.floor(a / 2) : Math.min(+b.dataset.q, a); sync(); return; }
      if (b.id === 'bank-go') {
        const n = readAmt('amt', a); if (!n) return;
        if (mode2 === 'dep') { invRemove('coins', n); S.bank += n; sfx('coin'); msg(`You deposit ${n} coins.`, '', 'money'); if (S.bank > S.maxBank) { addXP('saving', (S.bank - S.maxBank) * 0.6); S.maxBank = S.bank; } }
        else { if (!invAdd('coins', n)) return msg('Your pack is full.'); S.bank -= n; if (S.bank < 1e-9) S.bank = 0; sfx('click'); msg(`You withdraw ${n} coins.`, '', 'money'); }
        checkQuests();
      } else if (b.dataset.vault !== undefined) { S.vault = true; msg('Your savings now earn 5% APY in the Thrift Vault.', 'good'); lesson('Shop around', 'The same coins earned 2.5 times more interest just by moving to a better account.'); }
      markDirty('all'); render(); save();
    };
    render(); return render;
  });
}

function sparkline(cv, data, color) {
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 150, h = cv.clientHeight || 54; cv.width = w * dpr; cv.height = h * dpr;
  const c = cv.getContext('2d'); c.scale(dpr, dpr); c.clearRect(0, 0, w, h);
  if (data.length < 2) return; const lo = Math.min(...data), hi = Math.max(...data), sp = hi - lo || 1;
  const X = i => 4 + i / (data.length - 1) * (w - 10), Y = v => h - 6 - (v - lo) / sp * (h - 12);
  c.strokeStyle = 'rgba(0,0,0,.07)'; c.lineWidth = 1; for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(0, h * i / 3); c.lineTo(w, h * i / 3); c.stroke(); }
  c.beginPath(); data.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)));
  c.lineTo(X(data.length - 1), h); c.lineTo(X(0), h); c.closePath(); c.globalAlpha = .16; c.fillStyle = color; c.fill(); c.globalAlpha = 1;
  c.beginPath(); data.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.strokeStyle = color; c.lineWidth = 1.8; c.lineJoin = 'round'; c.stroke();
  circ(c, X(data.length - 1), Y(data[data.length - 1]), 3, color);
}
function openMarket() {
  openWindow('The Exchange', body => {
    const render = () => {
      const pv = portfolioValue(), cost = Object.keys(S.hold).reduce((a, k) => a + S.hold[k].cost, 0), held = Object.keys(S.hold);
      body.innerHTML = `
        <div class="stats"><div class="stat"><span>Purse</span><b>${fmt(coins())}</b></div><div class="stat"><span>Portfolio value</span><b>${fmt2(pv)}</b></div><div class="stat"><span>Gain or loss</span><b class="${pv - cost >= 0 ? 'good' : 'bad'}">${signed(pv - cost)}</b></div></div>
        ${held.length ? `<div class="note">Your mix</div><div class="alloc">${held.map(k => `<i style="width:${(S.hold[k].n * price(k) / pv * 100).toFixed(1)}%;background:${ASSETS[k].color}"></i>`).join('')}</div>
          <div class="alloc-legend">${held.map(k => `<span><i style="background:${ASSETS[k].color}"></i>${k} ${(S.hold[k].n * price(k) / pv * 100).toFixed(0)}%</span>`).join('')}</div>` : '<p class="note">You don’t own any assets yet. Start small: one share of the index fund is a fine first step.</p>'}
        ${Object.keys(ASSETS).map(sym => {
          const a = ASSETS[sym], h = S.prices[sym], p = price(sym), m1 = p / h[h.length - 2] - 1, y1 = p / h[Math.max(0, h.length - 13)] - 1, hd = S.hold[sym], locked = lvl('investing') < a.req;
          return `<div class="asset"><div><h3><i class="dot" style="background:${a.color}"></i>${a.name}<span class="tick">${sym}</span></h3><div class="blurb">${a.blurb}</div>
            <div><span class="px">${fmt2(p)}</span> <span class="${m1 >= 0 ? 'good' : 'bad'}">${pct(m1)} this month</span> · <span class="${y1 >= 0 ? 'good' : 'bad'}">${pct(y1)} in 12 months</span></div>
            <div class="note">${hd && hd.n ? `You own <b>${hd.n}</b> share${hd.n > 1 ? 's' : ''}, worth ${fmt2(hd.n * p)} (paid ${fmt2(hd.cost)})` : 'You own none.'}</div></div>
            <canvas data-spark="${sym}" aria-label="${a.name} price, last 36 months"></canvas>
            <div class="trade">${locked ? `<span class="lock">Unlocks at Investing level ${a.req}. Practise with safer assets first.</span>` : `
              ${stepper('q-' + sym, 1, 999)}
              <button class="pbtn primary" data-buy="${sym}"></button>
              <button class="pbtn" data-sell="${sym}" ${hd && hd.n ? '' : 'disabled'}></button>
              <button class="pbtn ghost" data-sellall="${sym}" ${hd && hd.n ? '' : 'disabled'}>Sell all</button>`}</div></div>`;
        }).join('')}
        <p class="note">Each trade costs a 1-coin fee. Prices change at each month-end.</p>
        <aside class="lesson"><b>Risk, return and diversification</b>Riskier assets can grow faster, but they also fall harder. Owning many companies through an index fund spreads that risk. Frequent trading adds up in fees, and last month’s move says little about next month’s.</aside>`;
      body.querySelectorAll('canvas[data-spark]').forEach(cv => sparkline(cv, S.prices[cv.dataset.spark].slice(-36), ASSETS[cv.dataset.spark].color));
      sync();
    };
    const sync = () => { for (const sym in ASSETS) { const inp = document.getElementById('q-' + sym); if (!inp) continue; const n = Math.max(1, readAmt('q-' + sym, 999)), p = price(sym), hd = S.hold[sym];
      const buy = body.querySelector(`[data-buy="${sym}"]`), sell = body.querySelector(`[data-sell="${sym}"]`), cost = Math.ceil(p * n) + 1;
      buy.textContent = `Buy ${n} · ${fmt(cost)} coins`; buy.disabled = coins() < cost;
      const sn = Math.min(n, hd ? hd.n : 0); sell.textContent = sn ? `Sell ${sn} · ${fmt(Math.max(0, Math.floor(p * sn) - 1))} coins` : 'Sell'; sell.disabled = !sn; } };
    body.oninput = e => { if (e.target.id && e.target.id.startsWith('q-')) sync(); };
    const sell = (sym, n) => {
      const hd = S.hold[sym]; if (!hd || !hd.n) return; n = Math.min(n, hd.n); const p = price(sym), proceeds = Math.max(0, Math.floor(p * n) - 1);
      const basis = hd.cost * n / hd.n; hd.cost -= basis; hd.n -= n; if (!hd.n) delete S.hold[sym];
      if (!invAdd('coins', proceeds)) { S.bank += proceeds; msg('Your pack is full, so the proceeds went to your bank.'); }
      sfx('coin'); const g = proceeds - basis;
      msg(`You sell ${n} ${sym} for ${proceeds} coins after the fee: a ${g >= 0 ? 'gain' : 'loss'} of ${fmt2(Math.abs(g))}.`, g >= 0 ? 'good' : 'bad');
      if (g < 0 && !S.flags.lossLesson) { S.flags.lossLesson = true; lesson('Selling low', 'Selling after a drop locks in the loss. Long-term investors usually only sell when they need the money or their plan changes.'); }
    };
    body.onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.step) { stepAmt(b, 999, 1); if (+document.getElementById(b.dataset.for).value < 1) document.getElementById(b.dataset.for).value = 1; sync(); return; }
      const sym = b.dataset.buy || b.dataset.sell || b.dataset.sellall; if (!sym) return;
      const n = Math.max(1, readAmt('q-' + sym, 999)), p = price(sym);
      if (b.dataset.buy) {
        const cost = Math.ceil(p * n) + 1; if (coins() < cost) return;
        invRemove('coins', cost); const hd = S.hold[sym] || (S.hold[sym] = { n: 0, cost: 0 }); hd.n += n; hd.cost += cost; sfx('coin');
        msg(`You buy ${n} ${sym} for ${cost} coins, fee included.`, '', 'money');
        if (!S.flags.firstBuy) { S.flags.firstBuy = true; addXP('investing', 40); lesson('Owning shares', 'You now own a small piece of what you bought. Its value rises and falls every month. Invest money you won’t need soon.'); }
        if (Object.keys(S.hold).length >= 2 && !S.flags.diverse) { S.flags.diverse = true; lesson('Diversification', 'You now hold more than one kind of asset. When one falls, the other may not. You also earn a monthly Investing bonus for this.'); }
      } else if (b.dataset.sell) sell(sym, n); else sell(sym, S.hold[sym] ? S.hold[sym].n : 0);
      markDirty('all'); render(); save();
    };
    render(); return render;
  });
}

function openBudget() {
  let card = pick(BUDGET_CARDS), answered = null, streak = 0;
  openWindow('Budget Hall', body => {
    const render = () => {
      const q = qs('needs_wants') === 1, qn = Math.min(10, S.qp.needs_wants || 0);
      body.innerHTML = `<p>Which slice of a 50/30/20 budget does this expense belong to?</p>
        <div class="card"><div class="c-name">${esc(card.n)}</div><div class="c-amt">${Math.round(card.a * S.priceIndex)} coins a month</div></div>
        ${answered === null ? `<div class="choice"><button class="pbtn" data-cat="need"><span class="kbd">1</span>Need<small>about 50%</small></button><button class="pbtn" data-cat="want"><span class="kbd">2</span>Want<small>up to 30%</small></button><button class="pbtn" data-cat="save"><span class="kbd">3</span>Save or repay<small>at least 20%</small></button></div>`
          : `<div class="feedback"><b class="${answered ? 'good' : 'bad'}">${answered ? 'Correct.' : `Not quite: it’s a ${card.c}.`}</b> ${esc(card.why)}</div><div class="choice"><button class="pbtn primary" data-next>Next expense <span class="kbd">↵</span></button></div>`}
        <p class="note">Streak ${streak} · ${S.stats.sorted} sorted correctly in total</p>
        ${q ? `<div class="note">Quest progress: ${qn} of 10</div><div class="meter"><i style="width:${qn * 10}%"></i></div>` : ''}
        <aside class="lesson"><b>The 50/30/20 rule</b>About half of your net pay covers needs, up to 30% goes to wants, and at least 20% goes to savings and extra debt payments. Sorting honestly is the hard part: a want can feel like a need.</aside>`;
      const f = body.querySelector('[data-cat],[data-next]'); if (f) f.focus({ preventScroll: true });
    };
    const answer = cat => {
      if (answered !== null) return; answered = cat === card.c;
      if (answered) { streak++; S.stats.sorted++; if (qs('needs_wants') === 1) S.qp.needs_wants = (S.qp.needs_wants || 0) + 1; addXP('budgeting', 16 + Math.min(streak, 10) * 2); sfx('good'); }
      else { streak = 0; sfx('bad'); if (!S.flags.budgetLesson) { S.flags.budgetLesson = true; lesson('Needs vs wants', 'A need keeps you housed, fed, healthy or earning. Everything else is a want, even if it feels important.'); } }
      markDirty('quests'); render(); checkQuests(); save();
    };
    const next = () => { if (answered === null) return; let c; do { c = pick(BUDGET_CARDS); } while (c === card); card = c; answered = null; render(); };
    body.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.cat) answer(b.dataset.cat); else if (b.dataset.next !== undefined) next(); };
    win.onKey = e => { const m = { 1: 'need', 2: 'want', 3: 'save' }[e.key]; if (m) { answer(m); return true; } if (e.key === 'Enter' && answered !== null) { next(); return true; } return false; };
    render(); return render;
  });
}

function openQuiz() {
  const nextQ = () => { if (S.asked.length >= QUIZ.length) S.asked = []; let i; do { i = Math.floor(Math.random() * QUIZ.length); } while (S.asked.includes(i)); S.asked.push(i); return i; };
  let qi = nextQ(), order = shuffle([0, 1, 2, 3]), chosen = null;
  openWindow('The Academy', body => {
    const render = () => {
      const q = QUIZ[qi], quest = qs('scholar') === 1, qn = Math.min(8, S.qp.scholar || 0);
      body.innerHTML = `<p class="note">Topic: ${esc(q.k)}</p><p><b>${esc(q.q)}</b></p><div class="qopts">${order.map((oi, i) => `<button data-o="${oi}" ${chosen !== null ? 'disabled' : ''} class="${chosen === null ? '' : oi === q.a ? 'right' : oi === chosen ? 'wrong' : ''}"><span class="kbd">${i + 1}</span><span>${esc(q.o[oi])}</span></button>`).join('')}</div>
        ${chosen === null ? '' : `<div class="feedback"><b class="${chosen === q.a ? 'good' : 'bad'}">${chosen === q.a ? 'Correct.' : 'Not this time.'}</b> ${esc(q.why)}</div><div class="choice"><button class="pbtn primary" data-next>Next question <span class="kbd">↵</span></button></div>`}
        <p class="note">${S.stats.quiz} correct in total · ${lvl('knowledge') >= 5 ? 5 : 2} coins per correct answer</p>
        ${quest ? `<div class="note">Quest progress: ${qn} of 8</div><div class="meter"><i style="width:${qn / 8 * 100}%"></i></div>` : ''}`;
      const f = body.querySelector('.qopts button:not(:disabled), [data-next]'); if (f) f.focus({ preventScroll: true });
    };
    const answer = oi => {
      if (chosen !== null) return; chosen = oi; const q = QUIZ[qi], right = chosen === q.a;
      if (right) { S.stats.quiz++; if (qs('scholar') === 1) S.qp.scholar = (S.qp.scholar || 0) + 1; addXP('knowledge', 35); addCoins(lvl('knowledge') >= 5 ? 5 : 2, false); sfx('good'); } else sfx('bad');
      lesson(q.k, q.why);
      markDirty('all'); render(); checkQuests(); save();
    };
    const next = () => { if (chosen === null) return; qi = nextQ(); order = shuffle([0, 1, 2, 3]); chosen = null; render(); };
    body.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; if (b.dataset.o !== undefined) answer(+b.dataset.o); else if (b.dataset.next !== undefined) next(); };
    win.onKey = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4 && chosen === null) { answer(order[n - 1]); return true; } if (e.key === 'Enter' && chosen !== null) { next(); return true; } return false; };
    render(); return render;
  });
}

function openLoan() {
  openWindow('Credit Union', body => {
    const render = () => {
      const t = loanTerms(), L = S.loan;
      const rows = L ? schedule(L.bal, L.apr, L.pay) : schedule(t.amt, t.apr, t.pay);
      const table = `<div class="scroll-x"><table class="amort"><thead><tr><th>Month-end</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Still owed</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.i}</td><td>${fmt2(r.p)}</td><td>${fmt2(r.int)}</td><td>${fmt2(r.prin)}</td><td>${fmt2(r.bal)}</td></tr>`).join('')}</tbody></table></div>`;
      body.innerHTML = `
        <div class="stats"><div class="stat"><span>Credit score</span><b>${S.credit}</b></div><div class="stat"><span>Rating</span><b style="font-size:1.4em">${creditBand(S.credit)}</b></div><div class="stat"><span>Purse</span><b>${fmt(coins())}</b></div></div>
        ${L ? `<p>You owe <b>${fmt2(L.bal)}</b> coins at ${(L.apr * 100).toFixed(0)}% APR. Each month-end, <b>${fmt2(L.pay)}</b> comes out of your purse (or your bank if your purse is short).</p>
              <p class="note">Your remaining schedule if you only make the regular payments:</p>${table}
              <div class="choice" style="justify-content:flex-start"><button class="pbtn" data-extra>Pay 25 extra</button><button class="pbtn primary" data-payoff>Pay it all off · ${Math.ceil(L.bal)} coins</button></div>
              <p class="note">Extra payments go straight to the balance, so less interest builds up. There’s no penalty for paying early.</p>`
          : `<p>With your score, Basil offers <b>${t.amt} coins</b> at <b>${(t.apr * 100).toFixed(0)}% APR</b>, repaid over ${t.n} month-ends.</p>
             <p>Monthly payment <b>${fmt2(t.pay)}</b>. You repay <b>${fmt2(t.total)}</b> in total, so this loan costs <b>${fmt2(t.total - t.amt)}</b> in interest.</p>${table}
             <div class="choice" style="justify-content:flex-start"><button class="pbtn primary" data-take>Accept the loan</button></div>`}
        <p class="note">Rates by score: 740 and up 9% · 670 to 739 14% · below 670 22%${lvl('credit') >= 10 ? ' · minus 2 points for trusted borrowers' : ''}. A score of 720 or more unlocks a 400-coin loan.</p>
        <aside class="lesson"><b>APR and your credit score</b>APR is the yearly cost of borrowing. In the table, see how early payments are mostly interest. Every on-time payment raises your score; a missed one lowers it far more. A better score means cheaper loans.</aside>`;
    };
    body.onclick = e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.take !== undefined && !S.loan) {
        const t = loanTerms(); S.loan = { bal: t.amt, orig: t.amt, apr: t.apr, pay: t.pay }; addCoins(t.amt); sfx('coin');
        if (qs('borrower') === 1) S.flags.loanTakenQ = true;
        msg(`You borrow ${t.amt} coins at ${(t.apr * 100).toFixed(0)}% APR. The first payment is due at month-end.`, '', 'money');
        if (!S.flags.loanLesson) { S.flags.loanLesson = true; lesson('Borrowing', 'A loan gives you coins now, but you repay more than you borrowed. The difference is interest, the price of borrowing.'); }
      } else if (b.dataset.extra !== undefined && S.loan) {
        const n = Math.min(25, Math.ceil(S.loan.bal)); if (coins() < n) return msg('Not enough coins in your purse.', 'bad');
        invRemove('coins', n); S.loan.bal -= n; sfx('coin'); msg(`You pay ${n} coins extra on your loan.`, '', 'money'); if (S.loan.bal <= 0.005) loanRepaid();
      } else if (b.dataset.payoff !== undefined && S.loan) {
        const n = Math.ceil(S.loan.bal); if (coins() < n) return msg(`You need ${n} coins in your purse.`, 'bad');
        invRemove('coins', n); sfx('coin'); loanRepaid();
      }
      markDirty('all'); render(); checkQuests(); save();
    };
    render(); return render;
  });
}
function loanRepaid() {
  S.loan = null; S.credit = clamp(S.credit + 15, 300, 850); addXP('credit', 150);
  msg('Your loan is fully repaid! Credit score +15.', 'good');
  if (qs('borrower') === 1 && S.flags.loanTakenQ) S.flags.loanRepaidQ = true;
}

function openMap() {
  openWindow('Map of Ledgerlands', body => {
    body.innerHTML = `<div class="mapwrap"><canvas id="bigmap" width="1120" height="800" aria-label="Town map. Click a place to walk there."></canvas></div><p class="note" style="margin-top:8px">Click anywhere to walk there. Gold marks are people with a quest for you; the star is your next step.</p>`;
    const cv = $('#bigmap'), c = cv.getContext('2d');
    const draw = () => {
      const sx = cv.width / COLS, sy = cv.height / ROWS; c.imageSmoothingEnabled = true; c.drawImage(ground, 0, 0, cv.width, cv.height);
      for (const tr of TREES) circ(c, (tr.x + .5) * sx, (tr.y + .4) * sy, tr.kind === 'pine' ? 5 : 6.5, tr.kind === 'pine' ? '#1d4a28' : '#2f6b38');
      for (const b of BUILDINGS) { c.fillStyle = b.roof; rr(c, b.x0 * sx + 1, b.y0 * sy + 1, (b.x1 - b.x0 + 1) * sx - 2, (b.y1 - b.y0 + 1) * sy - 2, 3); c.fill(); }
      c.font = '700 22px "Outfit", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const b of BUILDINGS) {
        const x = (b.x0 + b.x1 + 1) / 2 * sx, y = (b.y0 + b.y1 + 1) / 2 * sy, tw = c.measureText(b.name).width;
        c.fillStyle = 'rgba(10,16,14,.82)'; rr(c, x - tw / 2 - 10, y - 16, tw + 20, 32, 9); c.fill();
        c.strokeStyle = 'rgba(228,194,122,.9)'; c.lineWidth = 1.6; c.stroke();
        c.fillStyle = '#fff1c9'; c.fillText(b.name, x, y);
      }
      c.font = '700 17px "Outfit", sans-serif';
      for (const n of NPCS) { if (!npcVisible(n) || n.wander) continue; const x = n.px / TS * sx, y = n.py / TS * sy; const q = n.quest && S.quests[n.quest] === 0;
        circ(c, x, y, 7, '#1a120b'); circ(c, x, y, 5, q ? '#ffd34d' : '#efe3c6'); c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(n.name, x, y + 18); c.fillStyle = q ? '#ffe36b' : '#fff'; c.fillText(n.name, x, y + 18); }
      if (curObj && curObj.target) { const t = targetPos(curObj.target); star(c, t.x / TS * sx, t.y / TS * sy - 22, 12); }
      const px = player.px / TS * sx, py = player.py / TS * sy; circ(c, px, py, 9, '#1a120b'); circ(c, px, py, 7, '#ffffff'); c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText('You', px, py - 18); c.fillStyle = '#fff'; c.fillText('You', px, py - 18);
    };
    draw();
    cv.onclick = e => { const r = cv.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS); closeWindow(); walkTo(clamp(x, 0, COLS - 1), clamp(y, 0, ROWS - 1)); };
    return draw;
  });
}
function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const rad = i % 2 ? r * .45 : r, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath(); c.fillStyle = '#ffd34d'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#1a120b'; c.stroke(); }

/* ======================= month-end ======================= */
function monthEnd() {
  const nwBefore = netWorth(), pvBefore = portfolioValue(), rows = [];
  S.month++;
  S.priceIndex *= 1 + 0.03 / 12;
  if (S.bank > 0) { const r = S.vault ? 0.05 : 0.02, i = S.bank * r / 12; S.bank += i; S.interestEarned += i; rows.push(['Interest', i]); addXP('saving', i * 8 + (S.bank >= 10 ? 4 : 0)); if (S.bank > S.maxBank) S.maxBank = S.bank; }
  for (const sym in ASSETS) { const h = S.prices[sym]; h.push(+stepPrice(h[h.length - 1], ASSETS[sym]).toFixed(2)); if (h.length > 72) h.shift(); }
  const held = Object.keys(S.hold).filter(k => S.hold[k].n > 0);
  if (held.length) { rows.push(['Investments', portfolioValue() - pvBefore]); addXP('investing', Math.min(300, portfolioValue() * 0.03 + (held.length >= 2 ? 15 : 0))); if (qs('own_meadow') === 1 && S.hold.MIDX && S.hold.MIDX.n) S.qp.own_meadow = (S.qp.own_meadow || 0) + 1; }
  const r = rent(), pr = payBill(r);
  if (pr.ok) { rows.push(['Rent', -r]); floatText(player.px, player.py - 44, `−${r} rent`, '#ff8a6a'); if (pr.bank === 0) addXP('budgeting', 12); else msg(`Your purse was short, so ${pr.bank} coins of rent came from your savings.`, '', 'money'); }
  else { rows.push(['Rent (unpaid)', 0]); S.credit = clamp(S.credit - 40, 300, 850); msg(`You couldn’t pay ${r} coins of rent. Landlady Pim reports an unpaid bill. Credit score −40.`, 'bad'); }
  if (S.loan) {
    const L = S.loan, interest = L.bal * L.apr / 12, due = Math.min(L.pay, L.bal + interest), pl = payBill(due);
    if (pl.ok) { L.bal = L.bal + interest - Math.ceil(due); S.credit = clamp(S.credit + 8, 300, 850); addXP('credit', 40); rows.push(['Loan payment', -Math.ceil(due)]); if (L.bal <= 0.005) loanRepaid(); }
    else { L.bal += interest + 10; S.credit = clamp(S.credit - 45, 300, 850); rows.push(['Loan payment (missed)', 0]); msg('You missed a loan payment. A 10-coin late fee was added. Credit score −45.', 'bad'); }
  }
  if (S.petePaid) { S.petePaid = 0; S.flags.scammed = true; msg('Pyramid Pete promised to pay you today. He’s nowhere to be found, and neither are your 100 coins.', 'bad');
    lesson('Guaranteed returns', 'No honest investment can guarantee to double your money. Report scams to Warden Hale.'); }
  if (S.month > 3 && Math.random() < 0.25) {
    const ev = pick(MONTH_EVENTS), amt = Math.round(Math.abs(ev.amt) * S.priceIndex);
    if (ev.amt < 0) { addCoins(amt); rows.push(['Windfall', amt]); msg(`${ev.t} ${amt} coins.`, 'good'); }
    else { const p = payBill(amt); if (p.ok) { rows.push(['Surprise bill', -amt]); msg(`${ev.t} ${amt} coins.${p.bank ? ` Your savings covered ${p.bank} of it.` : ''}`, 'bad'); if (p.bank) { addXP('saving', 30); lesson('Emergency funds', 'Your savings paid a surprise bill, so you didn’t need to borrow.'); } }
      else { rows.push(['Surprise bill (unpaid)', 0]); S.credit = clamp(S.credit - 30, 300, 850); msg(`${ev.t} ${amt} coins, and you can’t pay. It becomes an unpaid bill. Credit score −30.`, 'bad'); lesson('Emergency funds', 'Three to six months of expenses saved would have covered this.'); } }
  }
  const nw = netWorth(); S.netHist.push(Math.round(nw)); S.realHist.push(Math.round(nw / S.priceIndex)); if (S.netHist.length > 120) { S.netHist.shift(); S.realHist.shift(); }
  S.lastReport = { month: S.month - 1, rows, delta: nw - nwBefore, nw };
  msg(`Month ${S.month} begins. ${rows.map(([l, v]) => `${l} ${v ? signed(v) : '—'}`).join(' · ')}.`, 'month');
  sfx('tick');
  toast(`<h3>Month ${S.month - 1} report</h3><table>${rows.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="${v > 0 ? 'good' : v < 0 ? 'bad' : ''}">${v ? signed(v) : '—'}</td></tr>`).join('')}<tr class="sum"><td>Net worth change</td><td class="${nw - nwBefore >= 0 ? 'good' : 'bad'}">${signed(nw - nwBefore)}</td></tr></table><p class="hint2">Next rent: ${rent()} coins · Credit ${S.credit}</p>`, '', 7500);
  checkQuests(); markDirty('all'); if (win.refresh) win.refresh(); save();
}

/* ======================= movement & pathfinding ======================= */
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function staticNpcAt(x, y) { return NPCS.some(n => !n.wander && npcVisible(n) && n.x === x && n.y === y); }
const blocked = (x, y) => !inb(x, y) || solid[y][x] || staticNpcAt(x, y);
function findPath(sx, sy, goal, limit = 6000) {
  const key = (x, y) => y * COLS + x, start = key(sx, sy);
  const prev = new Int32Array(COLS * ROWS).fill(-1), seen = new Uint8Array(COLS * ROWS);
  const q = [start]; seen[start] = 1;
  for (let h = 0; h < q.length && h < limit; h++) {
    const k = q[h], x = k % COLS, y = (k / COLS) | 0;
    if (goal(x, y)) { const path = []; let c = k; while (c !== start) { path.push({ x: c % COLS, y: (c / COLS) | 0 }); c = prev[c]; } return path.reverse(); }
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) continue; const nk = key(nx, ny);
      if (seen[nk] || blocked(nx, ny)) continue; if (dx && dy && (blocked(x + dx, y) || blocked(x, y + dy))) continue;
      seen[nk] = 1; prev[nk] = k; q.push(nk);
    }
  }
  return null;
}
function targetTiles(t) { if (t.kind === 'npc') return [{ x: t.x, y: t.y }]; const a = []; for (let j = 0; j < t.h; j++) for (let i = 0; i < t.w; i++) a.push({ x: t.x + i, y: t.y + j }); return a; }
const adjacentTo = (t, x, y) => targetTiles(t).some(p => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) === 1);
const centered = () => Math.abs(player.px - (player.x + .5) * TS) < 1 && Math.abs(player.py - (player.y + .8) * TS) < 1;
const targetPos = t => t.kind === 'npc' ? { x: t.px, y: t.py } : { x: (t.x + t.w / 2) * TS, y: (t.y + t.h) * TS - 4 };
let marker = null;
function walkTo(tx, ty) {
  player.pending = null; player.action = null;
  let path = blocked(tx, ty) ? findPath(player.x, player.y, (x, y) => Math.max(Math.abs(x - tx), Math.abs(y - ty)) === 1) : findPath(player.x, player.y, (x, y) => x === tx && y === ty);
  if (!path) { msg('You can’t reach that spot.'); sfx('bad'); return; }
  if (!path.length && !centered()) path = [{ x: player.x, y: player.y }];
  player.path = path; marker = { x: tx, y: ty, t: 0, c: '#ffe36b' };
}
function interact(target) {
  player.action = null; closeCtx();
  const go = () => runAction(target);
  if (adjacentTo(target, player.x, player.y)) { if (centered()) { player.path = []; go(); } else { player.path = [{ x: player.x, y: player.y }]; player.pending = go; } return; }
  const path = findPath(player.x, player.y, (x, y) => adjacentTo(target, x, y));
  if (!path) { msg('You can’t reach that.'); return; }
  player.path = path; player.pending = go; marker = { x: target.x, y: target.y, t: 0, c: '#ff8a6a' };
}
function runAction(t) {
  if (t.kind === 'npc') { if (t.wander) t.path = []; t.talk(t); return; }
  if (t.item) {
    if (lvl('earning') < t.req) { sfx('bad'); return msg(`You need Earning level ${t.req} to use the ${t.name.toLowerCase()}. You’re level ${lvl('earning')}.`, 'bad', 'game'); }
    if (!invFree()) return msg('Your pack is full. Hand your ledgers to Foreman Gus.', 'bad', 'game');
    player.action = t; player.actT = 2.4; msg(`You sit down at the ${t.name.toLowerCase()} and start working. Click anywhere to stop.`);
    const dx = t.x - player.x, dy = t.y - player.y; player.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    return;
  }
  if (t.act) t.act(); else msg(t.ex);
}
function skillTick() {
  const t = player.action, L = lvl('earning'), chance = clamp(0.5 + (L - t.req) * 0.03, 0.35, 0.95);
  if (Math.random() < chance) {
    if (!invAdd(t.item, 1)) { player.action = null; return msg('Your pack is full. Hand your ledgers to Foreman Gus.', 'bad', 'game'); }
    S.stats.ledgers++; addXP('earning', t.xp); floatText(player.px, player.py - 44, '+1 ' + ITEMS[t.item].name.split(' ').pop(), '#f2ead6');
    if (!invFree()) { player.action = null; msg('Your pack is full. Hand your ledgers to Foreman Gus.', 'bad', 'game'); }
    else if (qs('first_pay') === 1 && ledgerCount() === Math.max(1, 5 - (S.qp.first_pay || 0))) msg('That’s enough ledgers for Gus. Hand them in, or keep working.', 'quest', 'game');
  } else floatText(player.px, player.py - 44, 'lost count', '#cfc4ae');
  save();
}
function moveEntity(e, dt, speed) {
  if (!e.path.length) { e.moving = false; return false; }
  const n = e.path[0], tx = (n.x + .5) * TS, ty = (n.y + .8) * TS, dx = tx - e.px, dy = ty - e.py, d = Math.hypot(dx, dy), st = speed * TS * dt;
  if (Math.abs(dx) > Math.abs(dy) + .5) e.facing = dx < 0 ? 'left' : 'right'; else if (d > .5) e.facing = dy < 0 ? 'up' : 'down';
  e.moving = true;
  if (d <= st) { e.px = tx; e.py = ty; e.x = n.x; e.y = n.y; e.path.shift(); if (!e.path.length) { e.moving = false; return 'arrived'; } }
  else { e.px += dx / d * st; e.py += dy / d * st; }
  return true;
}
const keysDown = new Set();
function keyStep() {
  let dx = 0, dy = 0;
  if (keysDown.has('left')) dx--; if (keysDown.has('right')) dx++; if (keysDown.has('up')) dy--; if (keysDown.has('down')) dy++;
  if (!dx && !dy) return;
  const tryStep = (sx, sy) => { const nx = player.x + sx, ny = player.y + sy; if (blocked(nx, ny)) return false; if (sx && sy && (blocked(player.x + sx, player.y) || blocked(player.x, player.y + sy))) return false; player.path = [{ x: nx, y: ny }]; return true; };
  player.pending = null; player.action = null;
  if (!(tryStep(dx, dy) || (dx && tryStep(dx, 0)) || (dy && tryStep(0, dy)))) player.facing = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
}

/* ======================= rendering ======================= */
const view = $('#view'), ctx = view.getContext('2d');
view.tabIndex = -1;
let VW = 0, VH = 0, DPR = 1, cam = { x: 0, y: 0 }, zoom = 1.15, hover = null, mouse = null;
function resize() { const r = view.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1); VW = r.width; VH = r.height; view.width = Math.max(1, Math.round(VW * DPR)); view.height = Math.max(1, Math.round(VH * DPR)); }
new ResizeObserver(resize).observe(view);

let ground = null;
function buildGround() {
  const SCALE = 2;
  const g = document.createElement('canvas'); g.width = COLS * TS * SCALE; g.height = ROWS * TS * SCALE;
  const c = g.getContext('2d'); c.scale(SCALE, SCALE); const R = mulberry32(77);
  const grassCol = v => `hsl(${132 + v * 16} 46% ${23 + v * 9}%)`;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { c.fillStyle = grassCol(noise[y][x]); c.fillRect(x * TS, y * TS, TS, TS); }
  for (let i = 0; i < 220; i++) {
    const x = R() * COLS * TS, y = R() * ROWS * TS, r = 36 + R() * 120, light = R() < .55;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, light ? 'rgba(198,226,120,.14)' : 'rgba(6,28,12,.18)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const X = x * TS, Y = y * TS;
    c.strokeStyle = 'rgba(16,46,18,.6)'; c.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const bx = X + 2 + R() * (TS - 4), by = Y + 8 + R() * (TS - 10), h = 5 + R() * 5, lean = (R() - .5) * 2.4;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + lean, by - h * .55, bx + lean * 1.3, by - h); c.stroke();
    }
    if (R() < .16) {
      const cx0 = X + 6 + R() * 18, cy0 = Y + 6 + R() * 18, petal = R() < .5 ? '#e7f6b0' : '#f4f1d8';
      circ(c, cx0, cy0, 1.35, petal); circ(c, cx0 + 2.1, cy0 + .3, 1.15, petal); circ(c, cx0 + .9, cy0 + 2, 1.15, petal);
    }
  }
  const edgeOf = (x, y, t) => [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => {
    const n = tileAt(x + dx, y + dy);
    return n !== t && !(t === PATH && (n === STONE || n === BRIDGE || n === MUD)) && !(t === STONE && n === PATH);
  });
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const t = tiles[y][x], v = noise[y][x], X = x * TS, Y = y * TS;
    if (t === PATH || t === MUD) {
      c.fillStyle = t === PATH ? `hsl(30 18% ${28 + v * 5}%)` : `hsl(22 20% ${18 + v * 5}%)`;
      c.fillRect(X, Y, TS, TS);
      if (t === PATH) {
        c.save(); c.beginPath(); c.rect(X, Y, TS, TS); c.clip();
        for (let row = 0; row < 3; row++) {
          const off = ((x + y + row) % 2) ? 6 : -2;
          for (let col = 0; col < 3; col++) {
            const sx = X + off + col * 13, sy = Y + 1 + row * 10.6;
            const s = (v * 7 + row * .37 + col * .19) % 1;
            c.fillStyle = `hsl(${32 + s * 12} ${16 + s * 12}% ${50 + s * 16}%)`;
            rr(c, sx, sy, 11, 8.6, 2.4); c.fill();
            c.fillStyle = 'rgba(255,248,230,.22)'; c.fillRect(sx + 1.6, sy + 1.3, 7.2, 1.3);
            c.fillStyle = 'rgba(60,40,20,.16)'; c.fillRect(sx + 1.2, sy + 7.2, 8.4, 1);
          }
        }
        c.restore();
      } else {
        for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(30,48,62,.45)'; ell(c, X + 6 + R() * 18, Y + 6 + R() * 18, 5 + R() * 4, 2.2 + R() * 1.6); c.fill(); }
      }
      const e = edgeOf(x, y, t);
      c.fillStyle = grassCol(v);
      e.forEach((on, i) => { if (!on) return; for (let k = 0; k < 5; k++) {
        const o = 2 + R() * (TS - 4); let ax, ay, bx, by, tx2, ty2;
        if (i === 0) { ax = X + o - 2; ay = Y; bx = X + o + 2; by = Y; tx2 = X + o; ty2 = Y + 3 + R() * 4; }
        else if (i === 2) { ax = X + o - 2; ay = Y + TS; bx = X + o + 2; by = Y + TS; tx2 = X + o; ty2 = Y + TS - 3 - R() * 4; }
        else if (i === 3) { ax = X; ay = Y + o - 2; bx = X; by = Y + o + 2; tx2 = X + 3 + R() * 4; ty2 = Y + o; }
        else { ax = X + TS; ay = Y + o - 2; bx = X + TS; by = Y + o + 2; tx2 = X + TS - 3 - R() * 4; ty2 = Y + o; }
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(tx2, ty2); c.lineTo(bx, by); c.fill();
      } });
    } else if (t === SAND) {
      const sg = c.createLinearGradient(X, Y, X + TS, Y + TS);
      sg.addColorStop(0, `hsl(42 58% ${68 + v * 6}%)`); sg.addColorStop(1, `hsl(36 42% ${58 + v * 4}%)`);
      c.fillStyle = sg; c.fillRect(X, Y, TS, TS);
      for (let i = 0; i < 6; i++) { c.fillStyle = R() < .5 ? 'rgba(120,80,30,.16)' : 'rgba(255,250,220,.4)'; c.fillRect(X + R() * TS, Y + R() * TS, 2, 1); }
      [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => { if (tileAt(x + dx, y + dy) !== WATER) return; c.fillStyle = 'rgba(70,55,30,.3)'; c.fillRect(X + (dx === 1 ? TS - 6 : 0), Y + (dy === 1 ? TS - 6 : 0), dx ? 6 : TS, dy ? 6 : TS); });
    } else if (t === WATER || t === BRIDGE) {
      const d = depth[y][x] || 1;
      const base = c.createLinearGradient(X, Y, X, Y + TS);
      base.addColorStop(0, `hsl(${186 + d * 5} 62% ${46 - d * 6 + v * 4}%)`);
      base.addColorStop(1, `hsl(${204 + d * 2} 72% ${22 - d * 2}%)`);
      c.fillStyle = base; c.fillRect(X, Y, TS, TS);
      c.strokeStyle = `rgba(230,248,255,${.16 + v * .18})`; c.lineWidth = 1.15;
      c.beginPath(); c.moveTo(X + 3, Y + 9 + v * 8); c.quadraticCurveTo(X + 16, Y + 5 + v * 6, X + 29, Y + 13); c.stroke();
    } else if (t === BUILD) { c.fillStyle = 'hsl(28 14% 16%)'; c.fillRect(X, Y, TS, TS); }
    else if (t === FLOWER) {
      for (let i = 0; i < 4; i++) {
        const fx = X + 6 + R() * 20, fy = Y + 8 + R() * 16, col = ['#ffe56a', '#f4a0c4', '#fffaf0', '#d7b4f6', '#ffb35c'][(R() * 5) | 0];
        c.strokeStyle = '#246838'; c.lineWidth = 1.15; c.beginPath(); c.moveTo(fx, fy + 1); c.quadraticCurveTo(fx + 2.2, fy + 4, fx + .4, fy + 7); c.stroke();
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - .2; circ(c, fx + Math.cos(a) * 2.4, fy + Math.sin(a) * 2.4, 1.75, col); }
        circ(c, fx, fy, 1.3, '#ffe08a');
      }
    } else if (t === GRASS && R() < .06) {
      const rx = X + 8 + R() * 16, ry = Y + 12 + R() * 12;
      c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, rx + 1, ry + 2.2, 5.5, 2.5); c.fill();
      c.fillStyle = '#8a8780'; ell(c, rx, ry, 5, 3); c.fill();
      c.fillStyle = '#c8c4bb'; ell(c, rx - 1.3, ry - .9, 2.1, 1.15); c.fill();
    }
  }
  const PX0 = 20 * TS, PY0 = 15 * TS, PX1 = 32 * TS, PY1 = 26 * TS;
  c.save(); c.beginPath(); c.rect(PX0, PY0, PX1 - PX0, PY1 - PY0); c.clip();
  c.fillStyle = '#c8c0b3'; c.fillRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  for (let y = PY0, row = 0; y < PY1; y += 12, row++) for (let x = PX0 - (row % 2) * 11; x < PX1; x += 22) {
    const s = R(); c.fillStyle = `hsl(${34 + s * 14} ${9 + s * 7}% ${74 + s * 12}%)`;
    rr(c, x + 1.4, y + 1.3, 19, 9.4, 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.32)'; c.fillRect(x + 2.6, y + 1.8, 14, 1.2);
    c.fillStyle = 'rgba(70,55,35,.14)'; c.fillRect(x + 2, y + 9, 17, 1);
  }
  const mx = (PX0 + PX1) / 2, my = (PY0 + PY1) / 2 + 10;
  c.strokeStyle = 'rgba(168,124,52,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(mx, my, 36, 0, 7); c.stroke();
  c.lineWidth = 1.25; c.beginPath(); c.arc(mx, my, 26, 0, 7); c.stroke();
  c.fillStyle = 'rgba(196,148,62,.55)'; c.beginPath(); c.moveTo(mx, my - 11); c.lineTo(mx + 9, my); c.lineTo(mx, my + 11); c.lineTo(mx - 9, my); c.closePath(); c.fill();
  circ(c, mx, my, 2.4, '#fff1c9');
  c.restore();
  c.strokeStyle = '#b8923f'; c.lineWidth = 4; c.strokeRect(PX0 + 2, PY0 + 2, PX1 - PX0 - 4, PY1 - PY0 - 4);
  c.strokeStyle = 'rgba(255,244,214,.7)'; c.lineWidth = 1.4; c.strokeRect(PX0 + 6, PY0 + 6, PX1 - PX0 - 12, PY1 - PY0 - 12);
  for (let y = 20; y <= 21; y++) for (let x = 50; x <= 51; x++) {
    const X = x * TS, Y = y * TS; c.fillStyle = '#6a4828'; c.fillRect(X, Y, TS, TS);
    for (let i = 0; i < TS; i += 5) { c.fillStyle = i % 10 ? '#916844' : '#5a3c22'; c.fillRect(X + i, Y, 4, TS); c.fillStyle = 'rgba(255,220,160,.14)'; c.fillRect(X + i, Y, 1, TS); }
  }
  c.fillStyle = '#3a2816'; c.fillRect(50 * TS - 1, 20 * TS, 2 * TS + 2, 5); c.fillRect(50 * TS - 1, 22 * TS - 5, 2 * TS + 2, 5);
  for (const x of [50, 51, 52]) {
    c.fillStyle = '#3e2a17'; c.fillRect(x * TS - 3, 20 * TS - 8, 7, 12); c.fillRect(x * TS - 3, 22 * TS - 6, 7, 12);
    circ(c, x * TS, 20 * TS - 2, 1.7, '#e4c27a'); circ(c, x * TS, 22 * TS - 1, 1.7, '#e4c27a');
  }
  ground = g;
}

const ICONS = {
  coin(c, s) { circ(c, 0, 0, s, '#e8c35a'); c.strokeStyle = '#8c6f30'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, s * .62, 0, 7); c.stroke(); },
  ledger(c, s) { c.fillStyle = '#f2ead6'; c.fillRect(-s * .7, -s, s * 1.4, s * 2); c.strokeStyle = '#5b4a35'; c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-s * .45, -s * .55 + i * s * .4); c.lineTo(s * .45, -s * .55 + i * s * .4); c.stroke(); } },
  book(c, s) { c.fillStyle = '#f2ead6'; c.beginPath(); c.moveTo(0, -s * .6); c.quadraticCurveTo(-s * .5, -s, -s, -s * .7); c.lineTo(-s, s * .7); c.quadraticCurveTo(-s * .5, s * .4, 0, s * .8); c.quadraticCurveTo(s * .5, s * .4, s, s * .7); c.lineTo(s, -s * .7); c.quadraticCurveTo(s * .5, -s, 0, -s * .6); c.fill(); c.strokeStyle = '#3c5f9e'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, -s * .6); c.lineTo(0, s * .8); c.stroke(); },
  scales(c, s) { c.strokeStyle = '#e8c35a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s * .8); c.moveTo(-s * .5, s * .8); c.lineTo(s * .5, s * .8); c.moveTo(-s, -s * .5); c.lineTo(s, -s * .5); c.stroke(); for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * s * .8, -s * .1, s * .35, 0, Math.PI); c.stroke(); } },
  house(c, s) { c.fillStyle = '#e8c35a'; c.beginPath(); c.moveTo(-s, 0); c.lineTo(0, -s); c.lineTo(s, 0); c.fill(); c.fillRect(-s * .7, 0, s * 1.4, s * .9); c.fillStyle = '#3a2716'; c.fillRect(-s * .2, s * .3, s * .4, s * .6); },
  pie(c, s) { circ(c, 0, 0, s, '#7fc866'); c.fillStyle = '#e8c35a'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s, -Math.PI / 2, Math.PI / 2); c.fill(); c.fillStyle = '#5ec2b1'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, s, Math.PI / 2, Math.PI / 2 + Math.PI * .4); c.fill(); },
  chart(c, s) { c.fillStyle = '#e8c35a'; [[-s * .9, .5], [-s * .3, .9], [s * .3, 1.3], [s * .9 - s * .4, 1.8]].forEach(([x, h], i) => c.fillRect(-s + i * s * .5, s - h * s * .55, s * .38, h * s * .55)); c.strokeStyle = '#7fc866'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-s, s * .2); c.lineTo(-s * .2, -s * .2); c.lineTo(s * .2, s * .05); c.lineTo(s, -s * .8); c.stroke(); },
};
function renderBuilding(b) {
  const X0 = b.x0 * TS - 6, X1 = (b.x1 + 1) * TS + 6, W = X1 - X0, Y0 = b.y0 * TS, Y1 = (b.y1 + 1) * TS, wallH = TS * 1.4, wallTop = Y1 - wallH, rTop = Y0 - TS * .75, rBot = wallTop + 8;
  const ox = X0 - 14, oy = rTop - 34, w = W + 28, h = Y1 + 14 - oy;
  const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2; const c = cv.getContext('2d'); c.scale(2, 2); c.translate(-ox, -oy);
  const R = mulberry32(b.x0 * 97 + b.y0);
  // ground shadow
  c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, (X0 + X1) / 2 + 6, Y1 + 3, W * .46, 9); c.fill();
  // wall
  const wg = c.createLinearGradient(0, wallTop, 0, Y1); wg.addColorStop(0, shade(b.wall, .16)); wg.addColorStop(1, shade(b.wall, -.16)); c.fillStyle = wg; c.fillRect(X0 + 4, wallTop, W - 8, wallH);
  const wash = c.createLinearGradient(X0, wallTop, X1, wallTop); wash.addColorStop(0, 'rgba(255,255,255,.1)'); wash.addColorStop(.55, 'rgba(255,255,255,0)'); wash.addColorStop(1, 'rgba(0,0,0,.1)'); c.fillStyle = wash; c.fillRect(X0 + 4, wallTop, W - 8, wallH - 8);
  c.save(); c.globalAlpha = .08; for (let i = 0; i < 28; i++) { c.fillStyle = R() < .5 ? '#000' : '#fff'; c.fillRect(X0 + 8 + R() * (W - 20), wallTop + 6 + R() * (wallH - 18), 2, 1); } c.restore();
  // foundation
  c.fillStyle = '#7d766c'; c.fillRect(X0 + 3, Y1 - 8, W - 6, 8); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
  for (let x = X0 + 3, i = 0; x < X1 - 3; x += 11, i++) { c.beginPath(); c.moveTo(x + .5, Y1 - 8); c.lineTo(x + .5, Y1); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X0 + 3, Y1 - 8, W - 6, 1.5);
  // timber frame
  c.fillStyle = b.trim;
  for (let x = b.x0; x <= b.x1 + 1; x++) c.fillRect(x * TS - 2, wallTop, 4, wallH - 8);
  c.fillRect(X0 + 4, wallTop + 6, W - 8, 3);
  for (let x = b.x0; x <= b.x1; x++) { if (x === b.door || (x - b.x0) % 2) continue; c.save(); c.strokeStyle = b.trim; c.lineWidth = 3; c.beginPath(); c.moveTo(x * TS + 2, Y1 - 9); c.lineTo(x * TS + 9, Y1 - 18); c.stroke(); c.restore(); }
  // windows
  for (let x = b.x0; x <= b.x1; x++) {
    if (x === b.door) continue; const wx = x * TS + 9, wy = wallTop + 12;
    if (Math.abs(x - b.door) > 1) { c.fillStyle = shade(b.roof, -.15); c.fillRect(wx - 6, wy - 1, 5, 16); c.fillRect(wx + 15, wy - 1, 5, 16);
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.strokeRect(wx - 5.5, wy - .5, 4, 15); c.strokeRect(wx + 15.5, wy - .5, 4, 15); }
    c.fillStyle = b.trim; c.fillRect(wx - 2, wy - 2, 18, 18);
    const gg = c.createLinearGradient(wx, wy, wx + 14, wy + 14); gg.addColorStop(0, shade(b.roof, .62)); gg.addColorStop(.42, '#163044'); gg.addColorStop(1, '#0c1c28'); c.fillStyle = gg; c.fillRect(wx, wy, 14, 14);
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(wx, wy + 9); c.lineTo(wx + 7, wy); c.lineTo(wx + 10, wy); c.lineTo(wx, wy + 12); c.fill();
    c.fillStyle = 'rgba(255,236,180,.22)'; c.fillRect(wx + 1, wy + 1, 4, 3);
    c.fillStyle = b.trim; c.fillRect(wx + 6, wy, 2, 14); c.fillRect(wx, wy + 6, 14, 2);
    c.fillStyle = shade(b.trim, .2); c.fillRect(wx - 3, wy + 15, 20, 3);
    if ((x - b.x0) % 2 === 0) { c.fillStyle = '#3f6f2e'; c.fillRect(wx - 2, wy + 18, 18, 4); for (let i = 0; i < 5; i++) circ(c, wx + 1 + i * 3.5, wy + 18, 1.6, ['#f39cc2', '#f4e86c', '#ffffff'][i % 3]); }
  }
  // door
  const dx = b.door * TS + 6;
  c.fillStyle = '#8d867a'; c.beginPath(); c.moveTo(dx - 3, Y1 - 4); c.lineTo(dx - 3, Y1 - 26); c.arc(dx + 10, Y1 - 26, 13, Math.PI, 0); c.lineTo(dx + 23, Y1 - 4); c.closePath(); c.fill();
  c.fillStyle = '#4a2e18'; c.beginPath(); c.moveTo(dx, Y1 - 4); c.lineTo(dx, Y1 - 26); c.arc(dx + 10, Y1 - 26, 10, Math.PI, 0); c.lineTo(dx + 20, Y1 - 4); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(dx + i * 5 + .5, Y1 - 34); c.lineTo(dx + i * 5 + .5, Y1 - 4); c.stroke(); }
  c.fillStyle = '#2a1b10'; c.fillRect(dx + 2, Y1 - 24, 16, 2); c.fillRect(dx + 2, Y1 - 12, 16, 2); circ(c, dx + 16, Y1 - 17, 1.6, '#d9b052');
  c.fillStyle = '#9a9488'; c.fillRect(dx - 5, Y1 - 4, 30, 5); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(dx - 5, Y1 - 4, 30, 1.5);
  // lantern by the door
  const lx = dx + 27, ly = Y1 - 32; c.fillStyle = '#2a2622'; c.fillRect(lx - 1, ly - 4, 2, 5); c.fillRect(lx - 4, ly, 8, 2); c.fillStyle = '#ffd98a'; c.fillRect(lx - 3, ly + 2, 6, 7); c.strokeStyle = '#2a2622'; c.strokeRect(lx - 3.5, ly + 1.5, 7, 8);
  // eave shadow on the wall
  const es = c.createLinearGradient(0, rBot, 0, rBot + 12); es.addColorStop(0, 'rgba(0,0,0,.38)'); es.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = es; c.fillRect(X0 + 4, rBot, W - 8, 12);
  // roof
  c.save(); c.beginPath(); c.moveTo(X0 - 4, rBot); c.lineTo(X1 + 4, rBot); c.lineTo(X1 - 2, rTop); c.lineTo(X0 + 2, rTop); c.closePath();
  const rg = c.createLinearGradient(0, rTop, 0, rBot); rg.addColorStop(0, shade(b.roof, .16)); rg.addColorStop(1, shade(b.roof, -.2)); c.fillStyle = rg; c.fill(); c.clip();
  for (let y = rTop + 3, row = 0; y < rBot; y += 7, row++) for (let x = X0 - 10 + (row % 2) * 6; x < X1 + 10; x += 12) {
    c.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * .08})`; c.fillRect(x, y, 11, 7);
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y + 6, 12, 1); c.fillRect(x + 11, y, 1, 7);
  }
  c.restore();
  c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X0 - 4, rBot); c.lineTo(X0 + 2, rTop); c.moveTo(X1 + 4, rBot); c.lineTo(X1 - 2, rTop); c.stroke();
  c.fillStyle = shade(b.roof, -.35); rr(c, X0, rTop - 4, W, 7, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(X0 + 3, rTop - 3, W - 6, 1.5);
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(X0 - 4, rBot - 3, W + 8, 4);
  const peak = (X0 + X1) / 2;
  c.fillStyle = shade(b.roof, .28); c.beginPath(); c.moveTo(peak, rTop - 1); c.lineTo(peak + 16, rTop + 8); c.lineTo(peak, rTop + 13); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; c.beginPath(); c.moveTo(peak, rTop); c.lineTo(peak + 9, rTop + 6); c.stroke();
  circ(c, peak, rTop - 6, 3.1, '#e4c27a'); circ(c, peak, rTop - 6, 1.3, '#fff6d2');
  // chimney
  if (b.chimney) {
    const cx = X1 - TS * 1.6; c.fillStyle = '#7a4f3d'; c.fillRect(cx, rTop - 18, 15, 28);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; for (let y = rTop - 18, i = 0; y < rTop + 10; y += 5, i++) { c.beginPath(); c.moveTo(cx, y + .5); c.lineTo(cx + 15, y + .5); c.stroke(); c.beginPath(); c.moveTo(cx + (i % 2 ? 5 : 10) + .5, y); c.lineTo(cx + (i % 2 ? 5 : 10) + .5, y + 5); c.stroke(); }
    c.fillStyle = '#4a3226'; c.fillRect(cx - 2, rTop - 21, 19, 4);
    b.smoke = { x: cx + 7.5, y: rTop - 22 };
  }
  // roof plaque
  c.font = '700 12px "Outfit", sans-serif'; const tw = c.measureText(b.name).width + 38, sx = (b.door + .5) * TS - tw / 2, sy = rBot - 32;
  c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, sx + 1, sy + 2, tw, 22, 5); c.fill();
  const pg = c.createLinearGradient(sx, sy, sx, sy + 22); pg.addColorStop(0, '#31443a'); pg.addColorStop(1, '#15201a'); c.fillStyle = pg; rr(c, sx, sy, tw, 22, 5); c.fill(); c.strokeStyle = '#e4c27a'; c.lineWidth = 1.5; c.stroke();
  c.save(); c.translate(sx + 13, sy + 11); ICONS[b.icon](c, 6); c.restore();
  c.fillStyle = '#fff1c9'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.name, sx + 23 + (tw - 28) / 2, sy + 11.5);
  b.img = cv; b.ox = ox; b.oy = oy; b.w = w; b.h = h;
}

function drawPerson(c, x, y, look, t, o = {}) {
  const f = o.facing || 'down', mv = o.moving, wk = o.working, anim = motionOK();
  const ph = t * 9 + (o.seed || 0), bob = mv ? Math.abs(Math.sin(ph)) * 1.6 : anim ? Math.sin(t * 2.2 + (o.seed || 0)) * .5 : 0, step = mv ? Math.sin(ph) * 3 : 0;
  const OL = 'rgba(22,13,6,.85)'; c.lineWidth = 1.3; c.strokeStyle = OL; c.lineJoin = 'round';
  const sh = c.createRadialGradient(x, y, 1, x, y, 12); sh.addColorStop(0, 'rgba(8,16,8,.42)'); sh.addColorStop(1, 'rgba(8,16,8,0)'); c.fillStyle = sh; ell(c, x, y, 11, 4.2); c.fill();
  const side = f === 'left' || f === 'right', dir = f === 'left' ? -1 : 1;
  const shirt = look.shirt, skin = look.skin, by = y - 12 - bob;
  const leg = (lx, len, col) => { c.fillStyle = col; rr(c, lx, y - 12, 4, len, 1.2); c.fill(); c.stroke(); c.fillStyle = '#2a1b12'; rr(c, lx - .5, y - 12 + len - 3, 5, 3.2, 1); c.fill(); };
  if (side) { leg(x - 2 + step * .7, 12, shade(look.pants, -.3)); leg(x - 2 - step * .7, 12, look.pants); }
  else { leg(x - 5, 12 - Math.max(0, step), look.pants); leg(x + 1, 12 - Math.max(0, -step), look.pants); }
  const swing = wk ? Math.sin(t * 16) * 3 : step * .9;
  const arm = (ax, ay, col) => { c.fillStyle = col; rr(c, ax, ay, 3.4, 10, 1.5); c.fill(); c.stroke(); circ(c, ax + 1.7, ay + 10.6, 1.9, skin); };
  if (side) arm(x - 1.7 - swing * dir * .6, by - 12, shade(shirt, -.28));
  const g = c.createLinearGradient(0, by - 13, 0, by + 2); g.addColorStop(0, shade(shirt, .2)); g.addColorStop(.55, shirt); g.addColorStop(1, shade(shirt, -.25));
  c.fillStyle = g; rr(c, side ? x - 5.5 : x - 7, by - 13, side ? 11 : 14, 15, 3.5); c.fill(); c.stroke();
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(side ? x - 5.5 : x - 7, by - 1.5, side ? 11 : 14, 2);
  c.fillStyle = '#d9b052'; c.fillRect(x - 1 + (side ? dir * 2 : 0), by - 1.5, 2, 2);
  if (f === 'down') { c.fillStyle = shade(skin, -.12); c.beginPath(); c.moveTo(x - 2.6, by - 13); c.lineTo(x, by - 10); c.lineTo(x + 2.6, by - 13); c.fill(); }
  if (side) arm(x - 1.7 + swing * dir * .6, by - 12, shirt);
  else { arm(x - 10.4, by - 12 + swing * .4, shirt); arm(x + 7, by - 12 - swing * .4, shirt); }
  const hx = x + (side ? dir * .8 : 0), hy = by - 19.5;
  c.fillStyle = skin; c.beginPath(); c.arc(hx, hy, 6.8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = look.hair;
  if (f === 'up') { c.beginPath(); c.arc(hx, hy, 6.9, 0, Math.PI * 2); c.fill(); c.stroke(); }
  else {
    c.beginPath(); c.arc(hx, hy - .4, 7.1, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(hx + 7, hy + .5); c.lineTo(hx + 4.5, hy - 2.5); c.lineTo(hx + 1, hy - 1.8); c.lineTo(hx - 2.5, hy - 3); c.lineTo(hx - 5, hy - 1.5); c.lineTo(hx - 7, hy + .5); c.closePath(); c.fill(); c.stroke();
    if (side) { c.fillRect(hx - dir * 7.2 - (dir > 0 ? 0 : -0) - (dir > 0 ? 0 : 3.5), hy - 2, 3.5, 6); }
    c.fillStyle = '#1b130d';
    if (side) { c.fillRect(hx + dir * 3 - 1, hy, 2, 2.2); }
    else { c.fillRect(hx - 3.4, hy, 2, 2.2); c.fillRect(hx + 1.4, hy, 2, 2.2); c.fillStyle = 'rgba(230,110,110,.35)'; c.fillRect(hx - 5, hy + 2.6, 2.2, 1.4); c.fillRect(hx + 2.8, hy + 2.6, 2.2, 1.4); c.fillStyle = 'rgba(60,25,15,.6)'; c.fillRect(hx - 1, hy + 3.6, 2, 1); }
    c.fillStyle = 'rgba(255,255,255,.92)';
    if (side) c.fillRect(hx + dir * 3.2, hy + .35, .85, .85);
    else { c.fillRect(hx - 3.05, hy + .35, .75, .75); c.fillRect(hx + 1.75, hy + .35, .75, .75); }
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(hx - 1.1, hy - 3.3, 2.3, 1.1, -.45, 0, 7); c.fill();
  }
  if (look.hat) { c.fillStyle = look.hat; rr(c, hx - 9.5, hy - 6, 19, 3.2, 1.5); c.fill(); c.stroke(); rr(c, hx - 5.5, hy - 13, 11, 8, 2); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(hx - 4.5, hy - 12, 2, 6); }
}
const portraitCtx = $('#portrait').getContext('2d');
function drawPortrait(look) {
  const c = portraitCtx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 160, 160);
  const g = c.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, '#16384a'); g.addColorStop(.4, '#2c6a62'); g.addColorStop(.7, '#6f9a52'); g.addColorStop(1, '#e0c07a'); c.fillStyle = g; c.fillRect(0, 0, 160, 160);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(36, 30, 36, 0, 7); c.fill();
  c.fillStyle = '#245c32'; c.beginPath(); c.moveTo(0, 112); c.quadraticCurveTo(48, 92, 90, 110); c.quadraticCurveTo(130, 126, 160, 98); c.lineTo(160, 160); c.lineTo(0, 160); c.fill();
  c.setTransform(4.6, 0, 0, 4.6, 80, 80 + 4.6 * 27); drawPerson(c, 0, 0, look, 0, { facing: 'down' }); c.setTransform(1, 0, 0, 1, 0, 0);
}

function drawTree(c, tr, t) {
  const cx = (tr.x + .5) * TS, by = (tr.y + 1) * TS - 2, v = tr.v, sw = motionOK() ? Math.sin(t * 1.3 + tr.ph) * .9 : 0;
  c.fillStyle = 'rgba(0,0,0,.26)'; ell(c, cx + 2, by - 3, 15, 5.5); c.fill();
  if (tr.kind === 'pine') {
    c.fillStyle = '#4e3520'; c.fillRect(cx - 2.5, by - 12, 5, 10);
    const cols = ['#1f4527', '#2a5a31', '#3a7340'];
    for (let i = 0; i < 3; i++) { const w = 15 - i * 3.6, top = by - 22 - i * 9, base = by - 9 - i * 9, s = sw * (i + 1) * .5;
      c.fillStyle = '#132a17'; c.beginPath(); c.moveTo(cx - w - 1.2, base + 1); c.lineTo(cx + s, top - 2); c.lineTo(cx + w + 1.2, base + 1); c.fill();
      c.fillStyle = cols[i]; c.beginPath(); c.moveTo(cx - w, base); c.lineTo(cx + s, top); c.lineTo(cx + w, base); c.fill();
      c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(cx + s, top); c.lineTo(cx - w * .6, base); c.lineTo(cx - w * .1, base); c.fill();
      c.fillStyle = 'rgba(210,255,170,.16)'; c.beginPath(); c.moveTo(cx + s - 1, top + 2); c.lineTo(cx - w * .45, base - 1); c.lineTo(cx - w * .15, base - 1); c.fill(); }
    return;
  }
  c.fillStyle = '#5a3d24'; c.beginPath(); c.moveTo(cx - 4, by - 2); c.lineTo(cx - 2.5, by - 19); c.lineTo(cx + 2.5, by - 19); c.lineTo(cx + 4, by - 2); c.fill();
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(cx + .5, by - 19, 2, 17);
  const g = v < .55 ? ['#2a5226', '#3a6e31', '#57924a', '#76ad5c'] : ['#38561f', '#4a722d', '#6a9641', '#8ab35a'];
  const blobs = [[0, -27, 13], [-8, -22, 9.5], [8, -23, 9.5], [-3, -33, 9], [5, -31, 7.5]];
  c.fillStyle = '#15290f'; for (const [dx, dy, r] of blobs) { c.beginPath(); c.arc(cx + dx + sw, by + dy, r + 1.4, 0, 7); c.fill(); }
  for (const [dx, dy, r] of blobs) circ(c, cx + dx + sw, by + dy, r, g[1]);
  for (const [dx, dy, r] of blobs) circ(c, cx + dx + sw - r * .2, by + dy - r * .25, r * .7, g[2]);
  circ(c, cx - 5 + sw, by - 32, 3.5, g[3]); circ(c, cx + 4 + sw, by - 28, 2.2, g[3]);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(cx + 6 + sw, by - 21, 8, 0, 7); c.fill();
  c.fillStyle = 'rgba(220,255,170,.22)'; c.beginPath(); c.ellipse(cx - 4 + sw, by - 33, 6.2, 2.6, -.55, 0, 7); c.fill();
}
function drawBush(c, b) {
  const cx = (b.x + .5) * TS, by = (b.y + 1) * TS - 4;
  c.fillStyle = 'rgba(0,0,0,.25)'; ell(c, cx, by, 13, 4); c.fill();
  c.fillStyle = '#15290f'; for (const [dx, dy, r] of [[-6, -6, 7.5], [6, -6, 7.5], [0, -11, 8]]) { c.beginPath(); c.arc(cx + dx, by + dy, r + 1.2, 0, 7); c.fill(); }
  for (const [dx, dy, r] of [[-6, -6, 7.5], [6, -6, 7.5], [0, -11, 8]]) circ(c, cx + dx, by + dy, r, '#3d7333');
  circ(c, cx - 3, by - 13, 3.5, '#7cbc68'); circ(c, cx + 5, by - 8, 2.5, '#8fd07a'); circ(c, cx - 1, by - 15, 2, 'rgba(230,255,190,.55)');
  if (b.v > .5) for (let i = 0; i < 4; i++) circ(c, cx - 7 + i * 4.5, by - 6 - (i % 2) * 5, 1.4, '#d8404a');
}
function drawObject(c, o, t) {
  const X = o.x * TS, Y = o.y * TS, cx = X + TS / 2;
  const shadow = (w = 13) => { c.fillStyle = 'rgba(0,0,0,.28)'; ell(c, cx, Y + TS - 4, w, 4); c.fill(); };
  c.lineJoin = 'round';
  switch (o.type) {
    case 'desk': case 'auditdesk': {
      shadow(14); c.fillStyle = '#4a311c'; c.fillRect(X + 5, Y + 16, 3, 13); c.fillRect(X + 24, Y + 16, 3, 13);
      c.fillStyle = o.type === 'desk' ? '#8a5a32' : '#6e3a2a'; rr(c, X + 2, Y + 8, 28, 10, 2); c.fill(); c.strokeStyle = 'rgba(20,12,6,.7)'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(X + 3, Y + 9, 26, 2);
      c.fillStyle = '#f2ead6'; c.fillRect(X + 7, Y + 5, 10, 8); c.fillStyle = '#e6dcc2'; c.fillRect(X + 9, Y + 3, 10, 8);
      c.strokeStyle = o.type === 'desk' ? '#2a2017' : '#b4202a'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 3; i++) { c.moveTo(X + 10.5, Y + 5.5 + i * 2); c.lineTo(X + 17.5, Y + 5.5 + i * 2); } c.stroke();
      circ(c, X + 24, Y + 10, 2.5, '#1a1410'); c.strokeStyle = '#f0f0f0'; c.beginPath(); c.moveTo(X + 24, Y + 9); c.lineTo(X + 28, Y + 1); c.stroke(); break; }
    case 'terminal': {
      shadow(14); c.fillStyle = '#4a3a24'; c.fillRect(X + 3, Y + 14, 26, 14); c.fillStyle = '#b8902e'; rr(c, X + 4, Y - 2, 24, 18, 3); c.fill(); c.strokeStyle = '#5b4419'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#0d1f14'; c.fillRect(X + 7, Y + 1, 18, 12); c.strokeStyle = '#62e08a'; c.lineWidth = 1.2; c.beginPath();
      for (let i = 0; i < 7; i++) { const yy = Y + 9 - Math.sin(t * 2 + i * 1.3) * 3; i ? c.lineTo(X + 8 + i * 2.7, yy) : c.moveTo(X + 8, yy); } c.stroke();
      for (let i = 0; i < 3; i++) circ(c, X + 9 + i * 7, Y + 20, 2, '#d9b052'); break; }
    case 'chest': {
      shadow(13); c.fillStyle = '#6a4424'; rr(c, X + 4, Y + 10, 24, 18, 3); c.fill(); c.fillStyle = '#7c522c'; rr(c, X + 4, Y + 6, 24, 9, 4); c.fill();
      c.strokeStyle = 'rgba(20,12,6,.7)'; c.lineWidth = 1.2; rr(c, X + 4, Y + 6, 24, 22, 3); c.stroke();
      c.fillStyle = '#c8a24a'; c.fillRect(X + 4, Y + 13, 24, 2); c.fillRect(X + 9, Y + 6, 2, 22); c.fillRect(X + 21, Y + 6, 2, 22); c.fillStyle = '#f5dc93'; c.fillRect(X + 14, Y + 15, 4, 5); break; }
    case 'ticker': {
      c.fillStyle = '#4a3420'; c.fillRect(X + 4, Y + 10, 3, 20); c.fillRect(X + 25, Y + 10, 3, 20); c.fillStyle = '#1e2a22'; c.fillRect(X - 3, Y - 8, 38, 24); c.strokeStyle = '#8e7133'; c.lineWidth = 2; c.strokeRect(X - 3, Y - 8, 38, 24);
      c.font = '9px "VT323", monospace'; c.textAlign = 'left'; c.textBaseline = 'top'; let yy = Y - 6;
      for (const sym of Object.keys(ASSETS)) { const h = S.prices[sym], up = h[h.length - 1] >= h[h.length - 2]; c.fillStyle = up ? '#7be08a' : '#f07a6a'; c.fillText(`${sym} ${up ? '▲' : '▼'} ${h[h.length - 1].toFixed(0)}`, X, yy); yy += 7; } break; }
    case 'board': {
      c.fillStyle = '#4a3420'; c.fillRect(X + 5, Y + 12, 3, 18); c.fillRect(X + 24, Y + 12, 3, 18); c.fillStyle = '#8a6a44'; c.fillRect(X, Y - 4, 32, 20); c.strokeStyle = '#4a3420'; c.lineWidth = 2; c.strokeRect(X, Y - 4, 32, 20);
      [['#f2ead6', 3, -1], ['#e9f0c8', 12, 1], ['#f4d6c8', 22, -2], ['#f2ead6', 7, 7], ['#d8ecea', 18, 7]].forEach(([col, dx, dy]) => { c.fillStyle = col; c.fillRect(X + dx, Y + dy, 8, 7); circ(c, X + dx + 4, Y + dy + 1, 1, '#b4202a'); }); break; }
    case 'lectern': {
      shadow(10); c.fillStyle = '#5a3b22'; c.fillRect(X + 13, Y + 12, 6, 16); c.fillRect(X + 8, Y + 26, 16, 3); c.fillStyle = '#6e4a2a'; c.beginPath(); c.moveTo(X + 4, Y + 14); c.lineTo(X + 28, Y + 14); c.lineTo(X + 25, Y + 6); c.lineTo(X + 7, Y + 6); c.fill();
      c.fillStyle = '#f2ead6'; c.fillRect(X + 8, Y + 4, 7, 8); c.fillRect(X + 17, Y + 4, 7, 8); c.fillStyle = '#3c5f9e'; c.fillRect(X + 15, Y + 4, 2, 9); break; }
    case 'fountain': {
      const fx = X + TS, fy = Y + TS + 4; c.fillStyle = 'rgba(0,0,0,.25)'; ell(c, fx, fy + 8, 31, 12); c.fill();
      c.fillStyle = '#a19b90'; ell(c, fx, fy + 2, 29, 15); c.fill(); c.fillStyle = '#7d776d'; ell(c, fx, fy + 5, 29, 13); c.fill(); c.strokeStyle = 'rgba(20,12,6,.5)'; c.lineWidth = 1.2; ell(c, fx, fy + 2, 29, 15); c.stroke();
      const wg = c.createRadialGradient(fx, fy, 2, fx, fy, 24); wg.addColorStop(0, '#8fd4f2'); wg.addColorStop(1, '#14556e'); c.fillStyle = wg; ell(c, fx, fy + 1, 24, 10); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1; for (let i = 0; i < 2; i++) { const r2 = ((t * 9 + i * 12) % 24); c.globalAlpha = 1 - r2 / 24; ell(c, fx, fy + 1, r2, r2 * .42); c.stroke(); } c.globalAlpha = 1;
      for (let i = 0; i < 6; i++) circ(c, fx - 14 + i * 5, fy + 3 + (i % 2) * 2, 1.2, '#f5dc93');
      c.fillStyle = '#aca69b'; c.fillRect(fx - 3, fy - 20, 6, 21); c.fillStyle = '#bdb7ac'; ell(c, fx, fy - 20, 8, 3); c.fill();
      if (motionOK()) for (let i = 0; i < 10; i++) { const a = (t * 1.4 + i / 10) % 1, ang = i / 10 * Math.PI * 2; circ(c, fx + Math.cos(ang) * a * 15, fy - 22 + a * 21 - Math.sin(a * Math.PI) * 11, 1.4, 'rgba(200,232,255,.85)'); }
      break; }
    case 'lamp': {
      shadow(6); c.fillStyle = '#2d2a28'; c.fillRect(cx - 2, Y - 10, 4, 38); c.fillRect(cx - 5, Y + 26, 10, 3); c.fillRect(cx - 6, Y - 18, 12, 10);
      c.fillStyle = '#ffd98a'; c.fillRect(cx - 4, Y - 16, 8, 6); c.fillStyle = '#2d2a28'; c.fillRect(cx - 7, Y - 20, 14, 3); break; }
    case 'sign': {
      shadow(6); c.fillStyle = '#5a3b22'; c.fillRect(cx - 2, Y + 2, 4, 26); c.fillStyle = '#8a6a44'; c.strokeStyle = 'rgba(20,12,6,.7)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - 13, Y + 2); c.lineTo(cx + 10, Y + 2); c.lineTo(cx + 15, Y + 6); c.lineTo(cx + 10, Y + 10); c.lineTo(cx - 13, Y + 10); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(cx + 13, Y + 12); c.lineTo(cx - 10, Y + 12); c.lineTo(cx - 15, Y + 16); c.lineTo(cx - 10, Y + 20); c.lineTo(cx + 13, Y + 20); c.closePath(); c.fill(); c.stroke(); break; }
    case 'crate': {
      shadow(13); c.fillStyle = '#8a6438'; c.fillRect(X + 4, Y + 8, 24, 20); c.strokeStyle = '#5a3f22'; c.lineWidth = 2; c.strokeRect(X + 4, Y + 8, 24, 20); c.beginPath(); c.moveTo(X + 4, Y + 8); c.lineTo(X + 28, Y + 28); c.stroke(); break; }
  }
}

/* ambient life: smoke, butterflies, fireflies, cloud shadows */
const smoke = [], butterflies = [], fireflies = [], clouds = [];
for (let i = 0; i < 9 && FLOWER_TILES.length; i++) { const f = pick(FLOWER_TILES); butterflies.push({ x: (f.x + .5) * TS, y: (f.y + .5) * TS, hx: (f.x + .5) * TS, hy: (f.y + .5) * TS, ph: Math.random() * 6, col: pick(['#ffffff', '#f7d24a', '#f39cc2', '#9fd3ff']) }); }
for (let i = 0; i < 34; i++) fireflies.push({ x: (4 + Math.random() * 44) * TS, y: (4 + Math.random() * 32) * TS, ph: Math.random() * 6 });
for (let i = 0; i < 5; i++) clouds.push({ x: Math.random() * COLS * TS, y: Math.random() * ROWS * TS, r: 120 + Math.random() * 140, v: 6 + Math.random() * 8 });
let smokeT = 0;
function updateAmbient(dt, t) {
  if (!motionOK()) { smoke.length = 0; return; }
  smokeT -= dt; if (smokeT <= 0) { smokeT = .35; for (const b of BUILDINGS) if (b.smoke) smoke.push({ x: b.smoke.x, y: b.smoke.y, vx: 4 + Math.random() * 4, vy: -10 - Math.random() * 5, r: 3, life: 0 }); }
  for (let i = smoke.length - 1; i >= 0; i--) { const p = smoke[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 5; if (p.life > 3.2) smoke.splice(i, 1); }
  for (const b of butterflies) { b.ph += dt * 3; b.x = b.hx + Math.sin(b.ph * .7) * 26 + Math.sin(b.ph * 1.9) * 6; b.y = b.hy + Math.cos(b.ph * .5) * 18 + Math.sin(b.ph * 2.3) * 4; }
  for (const f of fireflies) { f.ph += dt; f.x += Math.sin(f.ph * .8) * dt * 9; f.y += Math.cos(f.ph * .6) * dt * 7; }
  for (const cl of clouds) { cl.x += cl.v * dt; cl.y += cl.v * .3 * dt; if (cl.x - cl.r > COLS * TS) { cl.x = -cl.r; cl.y = Math.random() * ROWS * TS; } }
}
function timeOfDay() {
  const p = clamp(S.monthT / S.settings.monthLen, 0, 1);
  // each month is one day: daylight, dusk, night, then dawn just before the month-end
  let d = p < .6 ? 0 : p < .8 ? (p - .6) / .2 : p < .93 ? 1 : 1 - (p - .93) / .07;
  d = d * d * (3 - 2 * d);
  const warm = Math.max(0, 1 - Math.abs(p - .68) / .1) * .8 + Math.max(0, 1 - Math.abs(p - .97) / .04) * .4;
  return S.settings.daynight ? { night: d * .78, warm, phase: p } : { night: 0, warm: 0, phase: p };
}

const worldToTile = (wx, wy) => ({ x: Math.floor(wx / TS), y: Math.floor(wy / TS) });
const screenToWorld = (sx, sy) => ({ x: (sx - VW / 2) / zoom + cam.x, y: (sy - VH / 2) / zoom + cam.y });
const worldToScreen = (wx, wy) => ({ x: (wx - cam.x) * zoom + VW / 2, y: (wy - cam.y) * zoom + VH / 2 });
function hitTest(sx, sy) {
  const w = screenToWorld(sx, sy); let best = null;
  for (const n of NPCS) { if (!npcVisible(n)) continue; if (Math.abs(w.x - n.px) < 12 && w.y < n.py + 5 && w.y > n.py - 42) { if (!best || n.py > best.py) best = n; } }
  if (best) return best;
  for (const o of OBJECTS) if (w.x >= o.x * TS && w.x < (o.x + o.w) * TS && w.y >= o.y * TS - TS * .6 && w.y < (o.y + o.h) * TS) return o;
  const t = worldToTile(w.x, w.y); return { kind: 'ground', x: t.x, y: t.y };
}
function optionsFor(t) {
  if (t.kind === 'npc') return [{ label: `Talk to <span class="t-npc">${esc(t.name)}</span>`, f: () => interact(t) }, { label: `Examine <span class="t-npc">${esc(t.name)}</span>`, f: () => msg(`${esc(t.name)}: ${esc(t.ex)}`) }, { label: 'Walk here', f: () => walkTo(t.x, t.y) }];
  if (t.kind === 'obj') { const a = []; if (t.verb) a.push({ label: `${esc(t.verb.replace('-', ' '))} <span class="t-obj">${esc(t.name)}</span>`, f: () => interact(t) }); a.push({ label: `Examine <span class="t-obj">${esc(t.name)}</span>`, f: () => msg(`${esc(t.name)}: ${esc(t.ex)}`) }); a.push({ label: 'Walk here', f: () => walkTo(t.x, t.y + t.h) }); return a; }
  return [{ label: 'Walk here', f: () => walkTo(t.x, t.y) }];
}

let titleCam = 0;
function render(t) {
  const c = ctx; if (!ground || !VW) return;
  const spanX = VW / zoom, spanY = VH / zoom, mw = COLS * TS, mh = ROWS * TS;
  let fx = player.px, fy = player.py - 12;
  if (mode === 'title') { fx = 26 * TS + Math.cos(titleCam) * 7 * TS; fy = 20 * TS + Math.sin(titleCam * 1.3) * 5 * TS; }
  cam.x = spanX >= mw ? mw / 2 : clamp(fx, spanX / 2, mw - spanX / 2);
  cam.y = spanY >= mh ? mh / 2 : clamp(fy, spanY / 2, mh - spanY / 2);
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0c1612'; c.fillRect(0, 0, view.width, view.height);
  const s = DPR * zoom; c.setTransform(s, 0, 0, s, (VW / 2 - cam.x * zoom) * DPR, (VH / 2 - cam.y * zoom) * DPR);
  const vx0 = cam.x - spanX / 2, vy0 = cam.y - spanY / 2;
  c.imageSmoothingEnabled = true; if (c.imageSmoothingQuality) c.imageSmoothingQuality = 'high'; c.drawImage(ground, 0, 0, COLS * TS, ROWS * TS);
  const x0 = Math.max(0, Math.floor(vx0 / TS) - 1), x1 = Math.min(COLS - 1, Math.ceil((cam.x + spanX / 2) / TS) + 1);
  const y0 = Math.max(0, Math.floor(vy0 / TS) - 1), y1 = Math.min(ROWS - 1, Math.ceil((cam.y + spanY / 2) / TS) + 2);
  const anim = motionOK(), tod = timeOfDay();
  // water: shimmer and shoreline foam
  c.lineWidth = 1.2;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (tiles[y][x] === WATER) {
    const o = anim ? Math.sin(t * 1.4 + x * .9 + y * 1.7) * 5 : 0; c.strokeStyle = 'rgba(215,238,255,.32)';
    c.beginPath(); c.moveTo(x * TS + 7 + o, y * TS + 11); c.lineTo(x * TS + 15 + o, y * TS + 11); c.moveTo(x * TS + 17 - o, y * TS + 23); c.lineTo(x * TS + 25 - o, y * TS + 23); c.stroke();
    const fa = .25 + (anim ? Math.sin(t * 2 + x + y) * .15 : 0);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = tileAt(x + dx, y + dy); if (n === WATER || n === BRIDGE || !inb(x + dx, y + dy)) continue; c.fillStyle = `rgba(235,248,255,${fa})`; c.fillRect(x * TS + (dx === 1 ? TS - 3 : 0), y * TS + (dy === 1 ? TS - 3 : 0), dx ? 3 : TS, dy ? 3 : TS); }
  }
  // path preview dots
  if (mode === 'play' && S.settings.pathDots && player.path.length > 1) { c.fillStyle = 'rgba(255,227,107,.55)'; for (let i = 0; i < player.path.length - 1; i++) { const p = player.path[i]; c.beginPath(); c.arc((p.x + .5) * TS, (p.y + .62) * TS, 2.2, 0, 7); c.fill(); } }
  // hover glow
  if (hover && mouse && hover.kind !== 'ground') { const tp = targetPos(hover), pulse = .5 + Math.sin(t * 5) * .2; c.strokeStyle = `rgba(255,220,120,${pulse})`; c.lineWidth = 2; ell(c, tp.x, tp.y, hover.kind === 'npc' ? 12 : hover.w * 15, hover.kind === 'npc' ? 5 : 6); c.stroke(); }
  else if (hover && mouse && mode === 'play') { c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.strokeRect(hover.x * TS + .5, hover.y * TS + .5, TS - 1, TS - 1); }
  if (marker) { marker.t += 1 / 60; const a = 1 - marker.t / .7; if (a <= 0) marker = null; else { c.strokeStyle = marker.c; c.globalAlpha = a; c.lineWidth = 2.2; ell(c, (marker.x + .5) * TS, (marker.y + .75) * TS, 4 + marker.t * 18, 2 + marker.t * 8); c.stroke(); c.globalAlpha = 1; } }
  // y-sorted world
  const list = [];
  for (const tr of TREES) if (tr.x >= x0 && tr.x <= x1 && tr.y >= y0 && tr.y <= y1 + 1) list.push({ k: (tr.y + 1) * TS - 2, d: () => drawTree(c, tr, t) });
  for (const b of BUSHES) if (b.x >= x0 && b.x <= x1 && b.y >= y0 && b.y <= y1) list.push({ k: (b.y + 1) * TS - 4, d: () => drawBush(c, b) });
  for (const b of BUILDINGS) if (b.img && b.x1 >= x0 - 1 && b.x0 <= x1 + 1 && b.y1 >= y0 && b.y0 <= y1 + 2) list.push({ k: (b.y1 + 1) * TS, d: () => c.drawImage(b.img, b.ox, b.oy, b.w, b.h) });
  for (const o of OBJECTS) if (o.x + o.w >= x0 && o.x <= x1 && o.y + o.h >= y0 && o.y <= y1 + 1) list.push({ k: (o.y + o.h) * TS - 3, d: () => drawObject(c, o, t) });
  for (const n of NPCS) if (npcVisible(n)) list.push({ k: n.py, d: () => drawPerson(c, n.px, n.py, n.look, t, { facing: n.facing, moving: n.moving, seed: n.seed }) });
  if (mode === 'play') list.push({ k: player.py, d: () => { c.strokeStyle = 'rgba(255,236,180,.95)'; c.lineWidth = 2; ell(c, player.px, player.py, 11.5, 4.6); c.stroke(); drawPerson(c, player.px, player.py, playerLook(), t, { facing: player.facing, moving: player.moving, working: !!player.action && !player.moving }); } });
  list.sort((a, b) => a.k - b.k).forEach(it => it.d());
  // smoke over roofs
  for (const p of smoke) { c.fillStyle = `rgba(220,215,205,${.35 * (1 - p.life / 3.2)})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }
  // butterflies and pollen (daytime)
  if (anim && tod.night < .4) for (const b of butterflies) { if (b.x < vx0 || b.x > vx0 + spanX || b.y < vy0 || b.y > vy0 + spanY) continue; const fl = Math.abs(Math.sin(b.ph * 8)) * 3 + .6; c.fillStyle = b.col; ell(c, b.x - fl / 2 - .5, b.y, fl, 1.8); c.fill(); ell(c, b.x + fl / 2 + .5, b.y, fl, 1.8); c.fill(); }
  if (anim && tod.night < .45) { for (let i = 0; i < 16; i++) { const px = (i * 137 + t * (10 + i % 4)) % (COLS * TS), py = (i * 89 + Math.sin(t * .5 + i) * 24) % (ROWS * TS); if (px < vx0 - 8 || px > vx0 + spanX + 8 || py < vy0 - 8 || py > vy0 + spanY + 8) continue; const rise = (t * 14 + i * 17) % 36; circ(c, px, py - rise, 1.15, 'rgba(255,236,190,.75)'); } }
  // cloud shadows (daytime)
  if (anim && tod.night < .5) for (const cl of clouds) { const g = c.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, cl.r); g.addColorStop(0, `rgba(10,20,30,${.1 * (1 - tod.night * 2)})`); g.addColorStop(1, 'rgba(10,20,30,0)'); c.fillStyle = g; c.fillRect(cl.x - cl.r, cl.y - cl.r, cl.r * 2, cl.r * 2); }
  // lighting
  if (tod.night > .01 || tod.warm > .01) {
    c.save(); c.globalCompositeOperation = 'multiply';
    const n = tod.night, w = tod.warm * (1 - n * .6);
    c.fillStyle = `rgb(${lerp(255, 72, n) | 0},${lerp(255, 92, n) - w * 36 | 0},${lerp(255, 148, n) - w * 70 | 0})`; c.fillRect(vx0, vy0, spanX, spanY);
    c.globalCompositeOperation = 'lighter';
    if (n > .05) {
      for (const L of LIGHTS) { if (L.x < vx0 - L.r || L.x > vx0 + spanX + L.r || L.y < vy0 - L.r || L.y > vy0 + spanY + L.r) continue; const fl = anim ? 1 + Math.sin(t * 7 + L.x) * .05 : 1, g = c.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r * fl); g.addColorStop(0, `rgba(255,206,120,${n * L.s * .7})`); g.addColorStop(.45, `rgba(255,170,70,${n * L.s * .22})`); g.addColorStop(1, 'rgba(255,160,80,0)'); c.fillStyle = g; c.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); }
      c.fillStyle = `rgba(255,200,110,${n * .8})`; for (const wd of WINDOWS) c.fillRect(wd.x, wd.y, wd.w, wd.h);
      if (anim) for (const f of fireflies) { const a = (Math.sin(f.ph * 3) * .5 + .5) * n; if (a < .05) continue; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 6); g.addColorStop(0, `rgba(220,255,140,${a})`); g.addColorStop(1, 'rgba(220,255,140,0)'); c.fillStyle = g; c.fillRect(f.x - 6, f.y - 6, 12, 12); }
    }
    c.restore();
  }
  // markers above everything
  if (mode === 'play') {
    for (const n of NPCS) { if (!npcVisible(n)) continue; const avail = n.quest && S.quests[n.quest] === 0; if (avail) badge(c, n.px, n.py - 50 + (anim ? Math.sin(t * 4 + n.seed) * 2.5 : 0), '!', '#ffd34d'); }
    if (curObj && curObj.target && S.settings.tracker) { const tp = targetPos(curObj.target), top = curObj.target.kind === 'npc' ? tp.y - (curObj.target.quest && S.quests[curObj.target.quest] === 0 ? 72 : 52) : curObj.target.y * TS - 18; chevron(c, tp.x, top + (anim ? Math.sin(t * 5) * 3 : 0)); }
    // hover name
    if (hover && mouse && (hover.kind === 'npc' || hover.kind === 'obj')) {
      const nx = hover.kind === 'npc' ? hover.px : (hover.x + hover.w / 2) * TS, ny = hover.kind === 'npc' ? hover.py - 44 : hover.y * TS - 12;
      c.font = '700 11px "Outfit", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(hover.name, nx, ny); c.fillStyle = hover.kind === 'npc' ? '#ffe36b' : '#84ebe6'; c.fillText(hover.name, nx, ny);
    }
    // floating text
    c.font = '600 18px "IBM Plex Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const f of floats) { const a = 1 - f.t / 1.6; c.globalAlpha = clamp(a * 1.5, 0, 1); c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(f.text, f.x, f.y - f.t * 22); c.fillStyle = f.color; c.fillText(f.text, f.x, f.y - f.t * 22); } c.globalAlpha = 1;
    // work progress ring
    if (player.action && !player.moving) { const p = 1 - player.actT / 2.4; c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 4; c.beginPath(); c.arc(player.px, player.py - 50, 6, 0, 7); c.stroke(); c.strokeStyle = '#ffe36b'; c.lineWidth = 3; c.beginPath(); c.arc(player.px, player.py - 50, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p, 0, 1)); c.stroke(); }
  }
  // vignette (screen space)
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (tod.night < .9) { c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = .22 * (1 - tod.night); const day = c.createLinearGradient(0, 0, 0, view.height); day.addColorStop(0, '#ffe2a8'); day.addColorStop(1, '#6a8a48'); c.fillStyle = day; c.fillRect(0, 0, view.width, view.height); c.restore(); }
  const vg = c.createRadialGradient(view.width / 2, view.height * .42, Math.min(view.width, view.height) * .28, view.width / 2, view.height / 2, Math.max(view.width, view.height) * .72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.62, 'rgba(6,12,18,0)'); vg.addColorStop(1, 'rgba(4,8,14,.5)'); c.fillStyle = vg; c.fillRect(0, 0, view.width, view.height);
  // off-screen pointer to the next step
  if (mode === 'play' && curObj && curObj.target && S.settings.tracker) {
    const tp = targetPos(curObj.target), sp = worldToScreen(tp.x, tp.y - 20);
    if (sp.x < 0 || sp.y < 0 || sp.x > VW || sp.y > VH) {
      // keep the pointer inside the area not covered by the HUD cards
      const L = 40, Rt = 40, T = Math.min(VH / 2 - 30, $('#clock').offsetHeight + 46), B = Math.min(VH / 2 - 30, $('#dock').offsetHeight + 40);
      const cx = VW / 2, cy = VH / 2, ang = Math.atan2(sp.y - cy, sp.x - cx), co = Math.cos(ang), si = Math.sin(ang);
      const ks = []; if (co > 1e-6) ks.push((VW - Rt - cx) / co); if (co < -1e-6) ks.push((L - cx) / co); if (si > 1e-6) ks.push((VH - B - cy) / si); if (si < -1e-6) ks.push((T - cy) / si);
      const k = Math.max(0, Math.min(...ks)), ax = cx + co * k, ay = cy + si * k;
      c.setTransform(DPR, 0, 0, DPR, 0, 0); c.save(); c.translate(ax, ay);
      c.fillStyle = 'rgba(12,18,28,.92)'; c.strokeStyle = '#e4c27a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill(); c.stroke();
      c.rotate(ang); c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(11, 0); c.lineTo(-5, -8); c.lineTo(-1, 0); c.lineTo(-5, 8); c.closePath(); c.fill(); c.restore();
      const label = curObj.target.name, dist = Math.round(Math.hypot(tp.x - player.px, tp.y - player.py) / TS);
      c.font = '700 12px "Outfit", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const ly = ay + (ay > VH / 2 ? -28 : 28), txt = `${label} · ${dist} steps`; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(txt, clamp(ax, 70, VW - 70), ly); c.fillStyle = '#ffe36b'; c.fillText(txt, clamp(ax, 70, VW - 70), ly);
    }
  }
}
function badge(c, x, y, ch, col) {
  c.fillStyle = '#1a120b'; c.beginPath(); c.arc(x, y, 8.5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill();
  c.fillStyle = '#1a120b'; c.font = '700 13px "Outfit", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x, y + .5);
}
function chevron(c, x, y) { c.fillStyle = '#1a120b'; c.beginPath(); c.moveTo(x - 9, y - 9); c.lineTo(x + 9, y - 9); c.lineTo(x, y + 3); c.closePath(); c.fill(); c.fillStyle = '#ffd34d'; c.beginPath(); c.moveTo(x - 6.5, y - 7.5); c.lineTo(x + 6.5, y - 7.5); c.lineTo(x, y + .5); c.closePath(); c.fill(); }

/* ======================= minimap ======================= */
const mini = $('#mini'), mctx = mini.getContext('2d'); let miniBase = null;
function buildMini() {
  const g = document.createElement('canvas'); g.width = COLS * 4; g.height = ROWS * 4; const c = g.getContext('2d');
  const colors = { [GRASS]: '#2c6a3a', [PATH]: '#c6b089', [STONE]: '#d5cec2', [WATER]: '#1a6d86', [BUILD]: '#5c4638', [TREE]: '#1a4424', [FLOWER]: '#3d7a3e', [BRIDGE]: '#8a6236', [SAND]: '#e6cb90', [MUD]: '#3e3228', [BUSH]: '#245c30' };
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { c.fillStyle = colors[tiles[y][x]]; c.fillRect(x * 4, y * 4, 4, 4); }
  for (const b of BUILDINGS) { c.fillStyle = b.roof; c.fillRect(b.x0 * 4, b.y0 * 4, (b.x1 - b.x0 + 1) * 4, (b.y1 - b.y0 + 1) * 4); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(b.x0 * 4, b.y1 * 4 + 2, (b.x1 - b.x0 + 1) * 4, 2); }
  miniBase = g;
}
function renderMini(t) {
  if (!miniBase) return; const c = mctx; c.clearRect(0, 0, 224, 160); c.drawImage(miniBase, 0, 0, 224, 160);
  const sx = 224 / COLS, sy = 160 / ROWS;
  for (const n of NPCS) { if (!npcVisible(n)) continue; const q = n.quest && S.quests[n.quest] === 0; c.fillStyle = q ? '#ffd34d' : '#efe3c6'; c.fillRect(n.px / TS * sx - 1.5, n.py / TS * sy - 2.5, 3, 3); }
  if (curObj && curObj.target && Math.sin(t * 6) > -.3) { const tp = targetPos(curObj.target); star(c, tp.x / TS * sx, tp.y / TS * sy - 3, 5); }
  c.fillStyle = '#ffe7a3'; c.strokeStyle = '#1a120b'; c.lineWidth = 1.4; c.beginPath(); c.arc(player.px / TS * sx, player.py / TS * sy - 1, 3.2, 0, 7); c.fill(); c.stroke();
  const spanX = VW / zoom / TS * sx, spanY = VH / zoom / TS * sy; c.strokeStyle = 'rgba(255,255,255,.55)'; c.strokeRect(cam.x / TS * sx - spanX / 2, cam.y / TS * sy - spanY / 2, spanX, spanY);
}
mini.addEventListener('click', e => { if (mode !== 'play') return; const r = mini.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * COLS), y = Math.floor((e.clientY - r.top) / r.height * ROWS); closeDialog(); walkTo(clamp(x, 0, COLS - 1), clamp(y, 0, ROWS - 1)); });
$('#mini-expand').onclick = () => { if (mode === 'play') openMap(); };

/* ======================= side panel ======================= */
const dirty = new Set(['all']); let tab = 'skills', skillSel = null, slotSel = null, qSel = null, confirmReset = false;
function markDirty(k) { dirty.add(k); }
function itemIcon(cv, id, n) {
  const c = cv.getContext('2d'); cv.width = 64; cv.height = 64; c.translate(32, 34); c.lineJoin = 'round';
  const paper = (col, lines) => { c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-12, -15, 28, 34); c.fillStyle = col; c.fillRect(-14, -18, 28, 34); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.2; c.strokeRect(-14, -18, 28, 34); c.strokeStyle = lines; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-9, -11 + i * 6); c.lineTo(9 - (i % 2) * 6, -11 + i * 6); c.stroke(); } };
  switch (id) {
    case 'coins': { const k = n >= 1000 ? 5 : n >= 100 ? 4 : n >= 10 ? 3 : n >= 2 ? 2 : 1; for (let i = 0; i < k; i++) { const x = [-8, 6, -2, 9, -10][i], y = 8 - [0, 2, -8, -8, -14][i]; c.fillStyle = '#7a5e26'; ell(c, x, y + 2, 10, 5); c.fill(); c.fillStyle = '#e8c35a'; ell(c, x, y, 10, 5); c.fill(); c.strokeStyle = '#7a5e26'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#f7e39a'; ell(c, x - 2, y - 1, 4, 1.6); c.fill(); } break; }
    case 'ledger_clerk': paper('#efe4c6', '#5b4a35'); break;
    case 'ledger_audit': paper('#f0e2d6', '#b4202a'); circ(c, 8, 10, 5, '#b4202a'); break;
    case 'ledger_analyst': paper('#e4ecf2', '#3c5f9e'); c.strokeStyle = '#2c7f3a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-10, 8); c.lineTo(-3, 0); c.lineTo(3, 4); c.lineTo(11, -8); c.stroke(); break;
    case 'stub': paper('#f2ead6', '#2c6b1f'); break;
    case 'piggy': c.fillStyle = '#d9b052'; ell(c, 0, 2, 17, 12); c.fill(); circ(c, 14, -2, 6, '#d9b052'); c.fillStyle = '#8e7133'; c.fillRect(-10, 10, 5, 7); c.fillRect(5, 10, 5, 7); c.fillRect(-4, -10, 8, 2); circ(c, 16, -3, 1.5, '#3a2716'); break;
    case 'certificate': c.fillStyle = '#f2ead6'; c.fillRect(-16, -14, 32, 26); c.strokeStyle = '#5a4590'; c.lineWidth = 2; c.strokeRect(-13, -11, 26, 20); circ(c, 8, 8, 6, '#b4202a'); break;
    case 'oath': c.fillStyle = '#efe4c6'; c.fillRect(-12, -16, 24, 30); c.fillStyle = '#c8b28a'; c.fillRect(-15, -18, 30, 5); c.fillRect(-15, 12, 30, 5); c.strokeStyle = '#5b4a35'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-7, 4); c.quadraticCurveTo(0, -4, 8, 4); c.stroke(); break;
    case 'seal': circ(c, 0, 0, 15, '#9a2a1e'); circ(c, 0, 0, 10, '#b8402e'); c.fillStyle = '#f5dc93'; c.font = '16px "Fraunces", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('K', 0, 1); break;
    case 'badge': c.fillStyle = '#c0c6cc'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 16, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); circ(c, 0, 0, 5, '#5d6670'); break;
    case 'sorter': c.strokeStyle = '#f2ead6'; c.lineWidth = 6; c.beginPath(); c.moveTo(-12, 14); c.quadraticCurveTo(4, 2, 14, -16); c.stroke(); c.strokeStyle = '#7fc866'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, 14); c.lineTo(-4, 4); c.stroke(); break;
  }
}
let lastOrb = {};
function setOrb(id, val, text) { const el = $('#' + id); if (lastOrb[id] !== undefined && val !== lastOrb[id]) { el.classList.remove('flash-up', 'flash-down'); void el.offsetWidth; el.classList.add(val > lastOrb[id] ? 'flash-up' : 'flash-down'); } lastOrb[id] = val; el.textContent = text; }
function renderPanel(force) {
  if (!S || (!dirty.size && !force)) return;
  const all = dirty.has('all');
  setOrb('o-purse', coins(), fmt(coins())); setOrb('o-bank', Math.floor(S.bank), fmt(S.bank)); setOrb('o-net', Math.floor(netWorth()), fmt(netWorth())); setOrb('o-credit', S.credit, S.credit);
  $('#who').textContent = S.profile.name;
  const need = force || all || dirty.has(tab) || tab === 'ledger';
  dirty.clear();
  if (!need || (tab === 'settings' && !force)) return;
  const body = $('#tab-body');
  if (tab === 'skills') {
    const total = SKILLS.reduce((a, k) => a + lvl(k.id), 0), txp = SKILLS.reduce((a, k) => a + S.xp[k.id], 0);
    body.innerHTML = `<div class="skills">${SKILLS.map(k => { const xp = S.xp[k.id], L = levelOf(xp), a = xpFor(L), b = xpFor(L + 1), p = L >= MAX_LVL ? 1 : (xp - a) / (b - a);
      return `<button class="skill" data-skill="${k.id}" aria-pressed="${skillSel === k.id}" style="--c:${k.color}" title="Level ${L} of ${MAX_LVL} · ${fmt(xp)} XP · ${L >= MAX_LVL ? 'max level' : fmt(b - xp) + ' XP to level ' + (L + 1)}"><span class="medal">${k.glyph}</span><span class="sk-name">${k.name}</span><span class="sk-lvl">${L}</span><span class="sk-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></span></button>`; }).join('')}</div>
      <div class="total">Total level <b>${total}</b> · Total XP <b>${fmt(txp)}</b></div>
      ${skillSel ? skillDetail(skillSel) : '<p class="hint">Select a skill to see how to train it and what it unlocks.</p>'}`;
  } else if (tab === 'pack') {
    body.innerHTML = `<div class="pack">${S.inv.map((it, i) => `<button class="slot" data-slot="${i}" aria-pressed="${slotSel === i}" ${it ? `title="${esc(ITEMS[it.id].name)}" aria-label="${esc(ITEMS[it.id].name)}${it.n > 1 ? ', ' + it.n : ''}"` : 'aria-label="Empty slot" disabled'}>${it ? `<canvas></canvas>${STACKABLE.has(it.id) ? `<span class="qty">${it.n >= 100000 ? Math.floor(it.n / 1000) + 'K' : it.n}</span>` : ''}` : ''}</button>`).join('')}</div>
      <p class="hint">${invFree()} of 24 slots free.</p>${slotSel !== null && S.inv[slotSel] ? itemDetail(slotSel) : '<p class="hint">Select an item to read about it.</p>'}`;
    body.querySelectorAll('.slot').forEach(sl => { const it = S.inv[+sl.dataset.slot]; if (it) itemIcon(sl.querySelector('canvas'), it.id, it.n); });
  } else if (tab === 'quests') {
    const done = QUESTS.filter(q => S.quests[q.id] === 2).length;
    body.innerHTML = `<div class="qlist">${QUESTS.map(q => { const st = S.quests[q.id]; return `<button class="qitem s${st}" data-q="${q.id}" aria-pressed="${qSel === q.id}"><span class="st"></span><span>${esc(q.name)}${S.trackQuest === q.id && st === 1 ? ' ★' : ''}</span><small>${['Not started', 'In progress', 'Done'][st]}</small>${st === 1 ? `<span class="meter"><i style="width:${(q.frac(S) * 100).toFixed(0)}%"></i></span>` : ''}</button>`; }).join('')}</div>
      <p class="hint">${done} of ${QUESTS.length} complete.</p>${qSel ? questDetail(qSel) : ''}`;
  } else if (tab === 'ledger') {
    const pv = portfolioValue(), debt = S.loan ? S.loan.bal : 0, nw = netWorth(), rep = S.lastReport;
    body.innerHTML = `<h3 class="sec-h">Balance sheet</h3><table class="ledger"><tbody>
      <tr><td>Purse</td><td>${fmt(coins())}</td></tr><tr><td>Savings (${S.vault ? '5%' : '2%'} APY)</td><td>${fmt2(S.bank)}</td></tr><tr><td>Investments</td><td>${fmt2(pv)}</td></tr>
      <tr><td>Debt</td><td class="${debt ? 'neg' : ''}">${debt ? '−' + fmt2(debt) : '0'}</td></tr><tr class="sum"><td>Net worth</td><td>${fmt2(nw)}</td></tr>
      <tr><td>In month-1 prices</td><td>${fmt2(nw / S.priceIndex)}</td></tr></tbody></table>
      <canvas id="nwchart" aria-label="Net worth history"></canvas><div class="legend"><span><i style="background:#d9b052"></i>Net worth</span><span><i style="background:#5ec2b1"></i>In month-1 prices</span></div>
      <h3 class="sec-h">${rep ? `Month ${rep.month} report` : 'Monthly report'}</h3>
      ${rep ? `<table class="ledger"><tbody>${rep.rows.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}">${v ? signed(v) : '—'}</td></tr>`).join('')}<tr class="sum"><td>Net worth change</td><td class="${rep.delta >= 0 ? 'pos' : 'neg'}">${signed(rep.delta)}</td></tr></tbody></table>` : '<p class="hint">Your first report arrives at the first month-end.</p>'}
      <h3 class="sec-h">Town facts</h3><table class="ledger"><tbody>
      <tr><td>Price level</td><td>${(S.priceIndex * 100).toFixed(1)}</td></tr><tr><td>Rent next month-end</td><td>${rent()}</td></tr><tr><td>Credit score</td><td>${S.credit} · ${creditBand(S.credit)}</td></tr>
      <tr><td>Net pay earned</td><td>${fmt(S.stats.paid)}</td></tr><tr><td>Interest earned</td><td>${fmt2(S.interestEarned)}</td></tr></tbody></table>
      <p class="hint">The gap between the two chart lines is inflation: the same coins buy a little less every month.</p>`;
    drawNW($('#nwchart'));
  } else if (tab === 'journal') {
    body.innerHTML = `<h3 class="sec-h">Lessons learned</h3>${S.journal.length ? `<div class="jlist">${S.journal.map(j => `<div class="jitem"><b>${esc(j.t)}</b>${esc(j.x)} <small>· month ${j.m}</small></div>`).join('')}</div>` : '<p class="hint">Lessons you pick up around town are saved here so you can reread them.</p>'}
      <h3 class="sec-h">Glossary</h3><dl class="gloss">${GLOSSARY.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`;
  } else if (tab === 'settings') {
    const st = S.settings, tg = (id, on, label) => `<div class="row"><span id="${id}-l">${label}</span><button class="toggle" role="switch" id="${id}" aria-checked="${on}" aria-labelledby="${id}-l"></button></div>`;
    body.innerHTML = `<div class="set">
      <h3 class="sec-h">Game</h3>
      <div class="row"><span>Pace</span><span class="segd" data-set="monthLen">${[[60, 'Relaxed'], [40, 'Standard'], [25, 'Brisk']].map(([v, l]) => `<button data-v="${v}" aria-pressed="${st.monthLen === v}">${l}</button>`).join('')}</span></div>
      ${tg('s-tracker', st.tracker, 'Next-step card and pointer')}${tg('s-path', st.pathDots, 'Show walking path')}${tg('s-day', st.daynight, 'Day and night lighting')}
      <h3 class="sec-h">Display &amp; sound</h3>
      <div class="row"><span>Text size</span><span class="segd" data-set="ui">${[[.9, 'S'], [1, 'M'], [1.12, 'L']].map(([v, l]) => `<button data-v="${v}" aria-pressed="${st.ui === v}">${l}</button>`).join('')}</span></div>
      <div class="row"><label for="s-zoom">Zoom</label><input id="s-zoom" type="range" min="0.75" max="2" step="0.05" value="${zoom}"></div>
      ${tg('s-motion', st.reduceMotion, 'Reduce motion')}${tg('s-sound', st.sound, 'Sound')}
      <div class="row"><label for="s-vol">Volume</label><input id="s-vol" type="range" min="0" max="1" step="0.05" value="${st.vol}"></div>
      <h3 class="sec-h">Controls</h3>
      <div class="keys"><kbd>Click</kbd><span>Walk, talk or use</span><kbd>Right-click</kbd><span>All options (press and hold on touch)</span><kbd>WASD</kbd><span>Walk (arrow keys too)</span><kbd>1–4</kbd><span>Pick a reply or answer</span><kbd>P</kbd><span>Pause the clock</span><kbd>M</kbd><span>Town map</span><kbd>K I Q L J</kbd><span>Skills, pack, quests, ledger, journal</span><kbd>Wheel</kbd><span>Zoom</span><kbd>Esc</kbd><span>Close</span></div>
      <h3 class="sec-h">About</h3>
      <p>Ledgerlands is a teaching game. Rates and prices are simplified and fictional, and nothing here is financial advice. Progress saves in this browser.</p>
      <button id="s-title" class="pbtn">Back to title screen</button>
      <button id="s-reset" class="pbtn">${confirmReset ? 'Click again to erase all progress' : 'Start over'}</button></div>`;
  }
}
function skillDetail(id) {
  const k = SKILLS.find(s => s.id === id), xp = S.xp[id], L = levelOf(xp), a = xpFor(L), b = xpFor(L + 1), p = L >= MAX_LVL ? 1 : (xp - a) / (b - a);
  return `<div class="detail" style="--c:${k.color}"><h4>${k.name} · level ${L}</h4><div class="meter"><i style="width:${(p * 100).toFixed(1)}%"></i></div><p class="muted">${fmt(xp)} XP${L < MAX_LVL ? ` · ${fmt(b - xp)} to level ${L + 1}` : ''}</p><p>${esc(k.how)}</p>
    <ul>${k.unlocks.map(([lv, txt]) => `<li class="${L >= lv ? 'open' : 'locked'}"><span class="lv">Lv ${lv}</span><span>${L >= lv ? '✓ ' : ''}${esc(txt)}</span></li>`).join('')}</ul></div>`;
}
function itemDetail(i) {
  const it = S.inv[i], d = ITEMS[it.id];
  return `<div class="detail"><h4>${esc(d.name)}${it.n > 1 ? ` ×${fmt(it.n)}` : ''}</h4><p>${esc(d.ex)}</p>${d.droppable ? `<div class="row"><button class="pbtn" data-drop="${i}">Drop</button></div>` : ''}</div>`;
}
function questDetail(id) {
  const q = questById(id), st = S.quests[id];
  return `<div class="detail"><h4>${esc(q.name)}</h4><p>${esc(q.desc)}</p><p><b>Start:</b> ${esc(q.giver)}, ${esc(q.where)}.</p>${st === 1 ? `<p><b>Progress:</b> ${esc(q.prog(S))}</p><div class="meter"><i style="width:${(q.frac(S) * 100).toFixed(0)}%"></i></div>` : ''}<p><b>Reward:</b> ${esc(q.rtext)}</p>
    ${st === 2 ? '<p class="good"><b>Complete.</b></p>' : `<div class="row">${st === 1 ? `<button class="pbtn" data-track="${id}">${S.trackQuest === id ? 'Tracking ★' : 'Track this quest'}</button>` : ''}<button class="pbtn" data-goto="${id}">${st === 0 ? `Walk to ${esc(q.giver.split(' ').pop())}` : 'Walk there'}</button></div>`}</div>`;
}
function drawNW(cv) {
  if (!cv) return; const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight; if (!w) return; cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const a = S.netHist.concat([Math.round(netWorth())]), b = S.realHist.concat([Math.round(netWorth() / S.priceIndex)]);
  c.font = '12px "Outfit", sans-serif'; c.fillStyle = '#cbbfa8';
  if (a.length < 2) { c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Your history appears after the first month-end.', w / 2, h / 2); return; }
  const lo = Math.min(0, ...a, ...b), hi = Math.max(1, ...a, ...b), X = i => 8 + i / (a.length - 1) * (w - 16), Y = v => h - 16 - (v - lo) / (hi - lo) * (h - 30);
  c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; for (let i = 0; i <= 3; i++) { const yy = 14 + i * (h - 30) / 3; c.beginPath(); c.moveTo(8, yy); c.lineTo(w - 8, yy); c.stroke(); }
  c.beginPath(); a.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.lineTo(X(a.length - 1), Y(lo)); c.lineTo(X(0), Y(lo)); c.closePath(); c.fillStyle = 'rgba(217,176,82,.12)'; c.fill();
  for (const [d, col] of [[b, '#5ec2b1'], [a, '#d9b052']]) { c.beginPath(); d.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); c.strokeStyle = col; c.lineWidth = 1.8; c.lineJoin = 'round'; c.stroke(); circ(c, X(d.length - 1), Y(d[d.length - 1]), 2.8, col); }
  c.fillStyle = '#b9a785'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(fmt(hi), 10, 2); c.textBaseline = 'bottom'; c.fillText(`${a.length - 1} month${a.length > 2 ? 's' : ''}`, 10, h - 1);
}
function setTab(name) { tab = name; confirmReset = false; $$('#tabs button').forEach(x => x.setAttribute('aria-selected', x.dataset.tab === name)); $(`#tabs [data-tab="${name}"]`).classList.remove('has-new'); renderPanel(true); }
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });
$('#tab-body').addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.skill) { skillSel = skillSel === t.dataset.skill ? null : t.dataset.skill; renderPanel(true); return; }
  if (t.dataset.slot !== undefined) { const i = +t.dataset.slot; slotSel = slotSel === i ? null : i; renderPanel(true); return; }
  if (t.dataset.drop !== undefined) { const it = S.inv[+t.dataset.drop]; if (it && ITEMS[it.id].droppable) { S.inv[+t.dataset.drop] = null; slotSel = null; msg(`You drop the ${ITEMS[it.id].name.toLowerCase()}.`); markDirty('pack'); save(); renderPanel(true); } return; }
  if (t.dataset.q) { qSel = qSel === t.dataset.q ? null : t.dataset.q; renderPanel(true); return; }
  if (t.dataset.track) { S.trackQuest = t.dataset.track; S.settings.tracker = true; renderPanel(true); save(); return; }
  if (t.dataset.goto) { const q = questById(t.dataset.goto); const st = S.quests[q.id] === 1 ? questStep(q.id) : null; const target = (st && st.target) || npcById(q.giverId); if (S.quests[q.id] === 1) S.trackQuest = q.id; closeDialog(); interact(target); return; }
  const seg = t.closest('.segd'); if (seg) { const k = seg.dataset.set, v = +t.dataset.v; if (k === 'monthLen') { const p = S.monthT / S.settings.monthLen; S.settings.monthLen = v; S.monthT = p * v; } else { S.settings.ui = v; applySettings(); } save(); renderPanel(true); return; }
  if (t.classList.contains('toggle')) { const map = { 's-tracker': 'tracker', 's-path': 'pathDots', 's-day': 'daynight', 's-motion': 'reduceMotion', 's-sound': 'sound' }; const k = map[t.id]; S.settings[k] = !S.settings[k]; t.setAttribute('aria-checked', S.settings[k]); applySettings(); save(); return; }
  if (t.id === 's-title') { save(); showTitle(); return; }
  if (t.id === 's-reset') { if (!confirmReset) { confirmReset = true; t.textContent = 'Click again to erase all progress'; return; } resetGame(); }
});
$('#tab-body').addEventListener('input', e => { if (e.target.id === 's-zoom') { zoom = +e.target.value; S.settings.zoom = zoom; } if (e.target.id === 's-vol') S.settings.vol = +e.target.value; });
$('#tab-body').addEventListener('change', e => { if (e.target.id === 's-zoom' || e.target.id === 's-vol') { save(); sfx('click'); } });
function applySettings() { document.documentElement.style.setProperty('--ui', S.settings.ui); document.body.classList.toggle('reduce-motion', S.settings.reduceMotion); zoom = S.settings.zoom; refreshObjective(); }

/* ======================= input ======================= */
const ctxEl = $('#ctx'), tipEl = $('#tip');
function openCtx(sx, sy, t) {
  const opts = optionsFor(t); ctxEl.innerHTML = `<div class="ctx-h">Choose an option</div>` + opts.map((o, i) => `<button data-i="${i}">${o.label}</button>`).join('') + `<button data-i="cancel">Cancel</button>`;
  ctxEl.hidden = false; tipEl.hidden = true; const r = $('#world').getBoundingClientRect(); const w = ctxEl.offsetWidth, h = ctxEl.offsetHeight;
  ctxEl.style.left = clamp(sx - w / 2, 4, r.width - w - 4) + 'px'; ctxEl.style.top = clamp(sy - 10, 4, r.height - h - 4) + 'px';
  ctxEl.querySelector('button').focus({ preventScroll: true });
  ctxEl.onclick = e => { const b = e.target.closest('button'); if (!b) return; closeCtx(); if (b.dataset.i !== 'cancel') { closeDialog(); opts[+b.dataset.i].f(); } };
}
function closeCtx() { ctxEl.hidden = true; }
function showTip(sx, sy, t) {
  if (!t || t.kind === 'ground' || mode !== 'play' || !ctxEl.hidden) { tipEl.hidden = true; return; }
  const o = optionsFor(t); tipEl.innerHTML = `${o[0].label}<small>${t.kind === 'npc' && t.role ? esc(t.role) + ' · ' : ''}Right-click for more</small>`; tipEl.hidden = false;
  const r = $('#world').getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = (sx + 16 + w > r.width ? sx - w - 12 : sx + 16) + 'px'; tipEl.style.top = clamp(sy + 16, 4, r.height - h - 4) + 'px';
}
let press = null, suppressClick = false;
view.addEventListener('pointerdown', e => {
  if (e.button === 2 || mode !== 'play') return; const r = view.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  press = { sx, sy, long: false };
  if (e.pointerType !== 'mouse') press.timer = setTimeout(() => { if (press) { press.long = true; openCtx(sx, sy, hitTest(sx, sy)); } }, 480);
});
view.addEventListener('pointermove', e => {
  const r = view.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (press && Math.hypot(sx - press.sx, sy - press.sy) > 10) clearTimeout(press.timer);
  if (e.pointerType === 'mouse' && mode === 'play') { mouse = { sx, sy }; hover = hitTest(sx, sy); showTip(sx, sy, hover); view.classList.toggle('grab', hover.kind === 'ground'); }
});
view.addEventListener('pointerleave', () => { mouse = null; hover = null; tipEl.hidden = true; });
view.addEventListener('pointerup', e => {
  if (!press) return; clearTimeout(press.timer); const p = press; press = null; if (p.long) return;
  const r = view.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; if (Math.hypot(sx - p.sx, sy - p.sy) > 14) return;
  if (suppressClick) { suppressClick = false; return; }
  if (!actx) sfx('click');
  const t = hitTest(sx, sy); closeDialog();
  optionsFor(t)[0].f();
});
view.addEventListener('contextmenu', e => { e.preventDefault(); if (mode !== 'play') return; const r = view.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top; openCtx(sx, sy, hitTest(sx, sy)); });
view.addEventListener('wheel', e => { if (mode !== 'play') return; e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), .75, 2); S.settings.zoom = zoom; const z = $('#s-zoom'); if (z) z.value = zoom; }, { passive: false });
document.addEventListener('pointerdown', e => { suppressClick = false; if (!ctxEl.hidden && !e.target.closest('#ctx')) { closeCtx(); suppressClick = e.target === view; } }, true);
const MOVE_KEYS = { w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' };
window.addEventListener('keydown', e => {
  if (mode !== 'play' || e.metaKey || e.ctrlKey || e.altKey) return;
  const tgt = e.target instanceof Element ? e.target : document.body, typing = !!tgt.closest('input, textarea, select'), k = e.key.toLowerCase();
  if (k === 'escape') { if (!ctxEl.hidden) closeCtx(); else if (!win.el.hidden) closeWindow(); else if (dlg.open) closeDialog(); return; }
  if (typing) return;
  if (!win.el.hidden) { if (win.onKey && win.onKey(e)) e.preventDefault(); return; }
  if (dlg.open) { const n = parseInt(e.key, 10); if (n >= 1 && n <= dlg.choices.length) { e.preventDefault(); sfx('click'); dlg.choices[n - 1].f(); return; }
    if ((k === ' ' || k === 'enter') && dlg.choices.length === 1 && !tgt.closest('button')) { e.preventDefault(); dlg.choices[0].f(); return; } }
  if (MOVE_KEYS[k]) { e.preventDefault(); keysDown.add(MOVE_KEYS[k]); closeDialog(); closeCtx(); return; }
  if (tgt.closest('button') && (k === ' ' || k === 'enter')) return;
  const tabs = { k: 'skills', i: 'pack', q: 'quests', l: 'ledger', j: 'journal' };
  if (tabs[k]) { setTab(tabs[k]); return; }
  if (k === 'm') { openMap(); return; }
  if (k === 'p') { togglePause(); return; }
});
window.addEventListener('keyup', e => { const k = MOVE_KEYS[e.key.toLowerCase()]; if (k) keysDown.delete(k); });
window.addEventListener('blur', () => keysDown.clear());
$$('.chat-tabs button').forEach(b => b.onclick = () => { chatFilter = b.dataset.f; chatEl.dataset.f = chatFilter; $$('.chat-tabs button').forEach(x => x.setAttribute('aria-selected', x === b)); b.classList.remove('unread'); chatEl.scrollTop = chatEl.scrollHeight; });
$('#chat-toggle').onclick = () => { const box = $('#chatbox'), c = !box.classList.contains('collapsed'); box.classList.toggle('collapsed', c); $('#chat-toggle').setAttribute('aria-expanded', !c); $('#chat-toggle').setAttribute('aria-label', c ? 'Expand messages' : 'Collapse messages'); };
$('#btn-pause').onclick = () => togglePause();
$('#btn-map').onclick = () => { if (mode === 'play') openMap(); };
$('#trk-main').onclick = () => { closeDialog(); refreshObjective(); if (curObj && curObj.target) interact(curObj.target); };
$('#trk-hide').onclick = () => { S.settings.tracker = false; refreshObjective(); save(); };
$('#trk-show').onclick = () => { S.settings.tracker = true; refreshObjective(); save(); };
function togglePause() { S.paused = !S.paused; msg(S.paused ? 'The town clock is paused. Press P to resume.' : 'The town clock is running again.'); }

/* ======================= title screen ======================= */
let draft = null;
function showTitle() {
  mode = 'title'; closeWindow(); closeDialog(); closeCtx(); tipEl.hidden = true;
  $('#title').hidden = false; $('#title-main').hidden = false; $('#title-create').hidden = true;
  const has = S && S.started;
  $('#t-continue').hidden = !has;
  $('#t-saveinfo').textContent = has ? `Saved game: ${S.profile.name} · month ${S.month} · net worth ${fmt(netWorth())} coins` : 'Progress saves automatically in this browser.';
  refreshObjective();
  (has ? $('#t-continue') : $('#t-new')).focus({ preventScroll: true });
}
function hideTitle() { $('#title').hidden = true; mode = 'play'; applySettings(); refreshObjective(); markDirty('all'); renderPanel(true); view.focus({ preventScroll: true }); }
$('#t-continue').onclick = () => { sfx('open'); hideTitle(); msg(`Welcome back, ${name()}. It is month ${S.month}.`); };
$('#t-new').onclick = () => {
  draft = { name: S && S.started ? S.profile.name : 'Traveler', shirt: pick(SHIRTS), hair: pick(HAIRS), skin: pick(SKINS) };
  $('#title-main').hidden = true; $('#title-create').hidden = false; $('#c-name').value = draft.name;
  for (const [k, arr] of [['shirt', SHIRTS], ['hair', HAIRS], ['skin', SKINS]]) {
    const box = document.querySelector(`.swatches[data-k="${k}"]`);
    box.innerHTML = arr.map(col => `<button class="swatch" style="--sw:${col}" data-c="${col}" aria-label="${k} colour ${col}" aria-pressed="${draft[k] === col}"></button>`).join('');
    box.onclick = e => { const b = e.target.closest('.swatch'); if (!b) return; draft[k] = b.dataset.c; box.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  }
  const warn = S && S.started; $('#c-begin').textContent = warn ? 'Begin (replaces your saved game)' : 'Begin';
  $('#c-name').focus();
};
$('#c-back').onclick = () => { $('#title-create').hidden = true; $('#title-main').hidden = false; };
$('#c-begin').onclick = () => {
  const nm = $('#c-name').value.trim().slice(0, 14) || 'Traveler', pace = +document.querySelector('input[name="pace"]:checked').value;
  const keep = S ? S.settings : defaultSettings();
  S = defaultState(); S.started = true; S.profile = { name: nm, shirt: draft.shirt, hair: draft.hair, skin: draft.skin }; S.settings = Object.assign(defaultSettings(), keep, { monthLen: pace });
  placePlayer(); chatEl.innerHTML = ''; lastOrb = {}; skillSel = slotSel = qSel = null;
  hideTitle(); sfx('quest'); welcome(); save();
};
$('#c-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('#c-begin').click(); });
function drawPreview(t) {
  const cv = $('#c-preview'), c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0);
  const sky = c.createLinearGradient(0, 0, 0, 240); sky.addColorStop(0, '#7eb6d8'); sky.addColorStop(.42, '#d5eaf4'); sky.addColorStop(.58, '#8fb56a'); sky.addColorStop(1, '#3d6a34');
  c.fillStyle = sky; c.fillRect(0, 0, 200, 240);
  c.fillStyle = '#5d8c48'; c.beginPath(); c.moveTo(0, 148); c.quadraticCurveTo(55, 118, 110, 146); c.quadraticCurveTo(160, 168, 200, 136); c.lineTo(200, 168); c.lineTo(0, 168); c.fill();
  c.fillStyle = '#6ea456'; c.fillRect(0, 156, 200, 84);
  c.fillStyle = '#cbb48a'; c.beginPath(); c.moveTo(78, 240); c.lineTo(96, 164); c.lineTo(114, 164); c.lineTo(136, 240); c.fill();
  c.fillStyle = 'rgba(20,30,10,.2)'; ell(c, 100, 205, 42, 10); c.fill();
  const facing = ['down', 'right', 'down', 'left'][Math.floor(t / 1.6) % 4];
  c.setTransform(4.6, 0, 0, 4.6, 100, 205); drawPerson(c, 0, 0, { skin: draft.skin, hair: draft.hair, shirt: draft.shirt, pants: '#3a3127' }, t, { facing, moving: true });
}

/* ======================= loop ======================= */
let last = performance.now(), miniT = 0, uiT = 0, objT = 0;
function update(dt, t) {
  updateAmbient(dt, t);
  for (let i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.6) floats.splice(i, 1); }
  for (const n of NPCS) {
    if (!n.wander || !npcVisible(n)) continue;
    if (dlg.open && dlg.npc === n) continue;
    moveEntity(n, dt, 1.6);
    if (!n.path.length) { n.wt -= dt; if (n.wt <= 0) { n.wt = 2 + Math.random() * 5; const tx = clamp(n.home.x + Math.round((Math.random() - .5) * 10), 3, 48), ty = clamp(n.home.y + Math.round((Math.random() - .5) * 8), 3, 36);
      if (!blocked(tx, ty)) { const p = findPath(n.x, n.y, (x, y) => x === tx && y === ty, 1500); if (p && p.length < 14) n.path = p; } } }
  }
  if (mode === 'title') { titleCam += dt * .07; if (!$('#title-create').hidden) drawPreview(t); return; }
  if (!player.path.length && keysDown.size) keyStep();
  const res = moveEntity(player, dt, 3.9);
  if (res === 'arrived' && player.pending) { const f = player.pending; player.pending = null; f(); }
  if (player.path.length === 0 && keysDown.size) keyStep();
  if (player.action && !player.moving) { player.actT -= dt; if (player.actT <= 0) { player.actT = 2.4; skillTick(); } }
  if (dlg.open && dlg.npc && tileDist(dlg.npc, player) > 3) closeDialog();
  const winOpen = !win.el.hidden, paused = winOpen || S.paused;
  $('#clock').classList.toggle('paused', paused);
  const sky = timeOfDay(); $('#clock').classList.toggle('is-night', sky.night > .55); $('#clock').classList.toggle('is-dusk', sky.warm > .2 && sky.night <= .55);
  if (!paused) { S.monthT += dt; if (S.monthT >= S.settings.monthLen) { S.monthT -= S.settings.monthLen; monthEnd(); } }
  objT -= dt; if (objT <= 0) { objT = .4; refreshObjective(); }
  uiT -= dt; if (uiT <= 0) { uiT = .25;
    $('#clock-month').textContent = `Month ${((S.month - 1) % 12) + 1}`; $('#clock-year').textContent = `Year ${Math.floor((S.month - 1) / 12) + 1}`;
    $('#clock-fill').style.width = (S.monthT / S.settings.monthLen * 100).toFixed(1) + '%';
    const secs = Math.ceil(S.settings.monthLen - S.monthT);
    $('#clock-state').textContent = S.paused ? 'Paused · press P' : winOpen ? 'Paused while reading' : `Rent ${rent()} due in ${secs}s`;
    $('#btn-pause').setAttribute('aria-label', S.paused ? 'Resume the clock' : 'Pause the clock');
  }
}
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now; const t = now / 1000;
  try { if (S) { update(dt, t); render(t); miniT -= dt; if (miniT <= 0) { miniT = .15; renderMini(t); } renderPanel(false); } }
  catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function placePlayer() {
  player.x = S.pos.x; player.y = S.pos.y; if (blocked(player.x, player.y)) { player.x = 25; player.y = 23; }
  player.px = (player.x + .5) * TS; player.py = (player.y + .8) * TS; player.path = []; player.action = null; player.pending = null;
}
function resetGame() {
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_KEY); } catch (e) { /* ignore */ }
  const keep = S.settings; S = defaultState(); S.settings = keep; confirmReset = false; chatEl.innerHTML = ''; placePlayer(); lastOrb = {}; showTitle();
}
function welcome() {
  msg(`Welcome to <b>Ledgerlands</b>, ${name()}.`);
  msg('Your <b>Next step</b> is always in the top-left card. Click it to walk there.');
}
function start(data) {
  S = (data && data.S) || load() || defaultState();
  zoom = S.settings.zoom || 1.15;
  placePlayer(); buildGround(); BUILDINGS.forEach(renderBuilding); buildMini(); resize(); applySettings();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => BUILDINGS.forEach(renderBuilding));
  if (data && data.mode === 'play' && S.started) hideTitle(); else showTitle();
  renderPanel(true);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  requestAnimationFrame(t => { last = t; frame(t); });
}
window.claude?.hot?.snapshot?.(() => ({ S, mode }));
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
})();
