// =====================================================================
//  UNDERGROUND GAME  —  Ação Roguelite Top-Down no Navegador
//  Personagens: Manguinha, Amxral e Tuiuba
// =====================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;
var cam = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function getCamZoom() {
  if (H <= 450) {
    // Celular em modo paisagem (ex: 844x390, 896x414): afasta a câmera para abrir bem o campo de visão!
    return clamp(H / 540, 0.65, 0.76);
  }
  if (W <= 480) {
    // Celular em modo retrato (ex: 390x844)
    return clamp(W / 560, 0.70, 0.82);
  }
  if (H <= 620) {
    // Telas médias
    return clamp(H / 660, 0.80, 0.92);
  }
  return 1.0;
}

function resize() {
  W = canvas.width = window.innerWidth || document.documentElement.clientWidth;
  H = canvas.height = window.innerHeight || document.documentElement.clientHeight;
  ctx.imageSmoothingEnabled = false;
  if (typeof cam !== 'undefined' && cam) cam.zoom = getCamZoom();
  if (window.__touchReady) updateTouchLayout();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

const FONT = '"Press Start 2P", monospace';
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// =====================================================================
//  ASSETS & IMAGENS
// =====================================================================
const IMG = {}, WHITE = {};
const IMAGE_LIST = {
  player_manguinha: 'assets/personagem_transparente.png',
  player_amxral: 'assets/amxral_transparente.png',
  player_tuiuba: 'assets/tuiuba_transparente.png',
  portrait_manguinha: 'assets/manguinha_portrait.png',
  portrait_amxral: 'assets/amxral_portrait.png',
  portrait_tuiuba: 'assets/tuiuba_portrait.png',
  manguinha_atk: 'assets/manguinha_attack_strip.png',
  terraria_star: 'assets/icons/terraria_star.png',
  orange_ball: 'assets/icons/orange_pure.png',
  orange_splash: 'assets/icons/orange_splash.png',
  grass: 'assets/lpc/grass.png', grassalt: 'assets/lpc/grassalt.png', dirt: 'assets/lpc/dirt.png',
  water: 'assets/lpc/water.png', treetop: 'assets/lpc/treetop.png', trunk: 'assets/lpc/trunk.png',
  rock: 'assets/lpc/rock.png', barrel: 'assets/lpc/barrel.png',
};
['slime', 'bat', 'bee', 'snake', 'small_worm', 'eyeball', 'ghost', 'big_worm', 'man_eater_flower', 'pumpking']
  .forEach(m => (IMAGE_LIST['m_' + m] = `assets/lpc/monsters/${m}.png`));
[
  'I_GoldCoin', 'I_Sapphire', 'I_Ruby', 'P_Red01', 'P_Red02', 'A_Shoes03', 'Ac_Ring01', 'I_Clock', 'I_Clover', 'S_Buff04',
  'S_Buff08', 'S_Fire01', 'S_Fire02', 'S_Ice01', 'S_Holy01', 'S_Light01', 'S_Light02', 'S_Light03', 'S_Light04', 'S_Magic02',
  'I_Chest01', 'A_Armour01', 'I_Diamond', 'heart_full', 'heart_empty', 'S_Dagger03', 'S_Earth01', 'S_Axe03', 'I_Book',
  'Ac_Medal01', 'S_Buff01', 'S_Buff03', 'S_Magic03', 'S_Magic04', 'P_Medicine01'
].forEach(i => (IMAGE_LIST['i_' + i] = `assets/icons/${i}.png`));

function makeWhite(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

let loaded = 0, total = Object.keys(IMAGE_LIST).length, ready = false;
const loadPromises = Object.entries(IMAGE_LIST).map(([k, src]) => new Promise(res => {
  const im = new Image();
  im.onload = () => { IMG[k] = im; loaded++; res(); };
  im.onerror = () => { console.warn('Falha:', src); loaded++; res(); };
  im.src = src;
}));
Promise.all([...loadPromises, document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => { }) : null]).then(() => {
  for (const k in IMG) if (k.startsWith('player_') || k.startsWith('m_')) WHITE[k] = makeWhite(IMG[k]);
  buildWorld();
  ready = true;
});

// ---------- ÁUDIO ----------
const SND_LIST = {
  swing1: 'swing.wav', swing2: 'swing2.wav', swing3: 'swing3.wav', unsheathe: 'sword-unsheathe.wav',
  magic: 'magic1.wav', coin: 'coin3.wav', bottle: 'bottle.wav', bubble: 'bubble.wav', clang: 'metal-small1.wav',
  ui1: 'interface1.wav', ui2: 'interface2.wav', slime1: 'slime1.wav', slime3: 'slime3.wav', slime5: 'slime5.wav',
  mnstr1: 'mnstr1.wav', mnstr7: 'mnstr7.wav', giant1: 'giant1.wav', giant3: 'giant3.wav', shade: 'shade1.wav',
  bite: 'bite-small.wav',
};
const SND = {};
for (const k in SND_LIST) { const a = new Audio('assets/audio/' + SND_LIST[k]); a.preload = 'auto'; SND[k] = a; }
const lastPlay = {};
let sfxOn = true;
function play(name, vol = 0.5, rateVar = 0.1) {
  if (!sfxOn || !SND[name]) return;
  const now = performance.now();
  if (lastPlay[name] && now - lastPlay[name] < 40) return;
  lastPlay[name] = now;
  const a = SND[name].cloneNode();
  a.volume = clamp(vol, 0, 1);
  a.playbackRate = 1 + rand(-rateVar, rateVar);
  a.play().catch(() => { });
}
const music = { loop: true, volume: 0.3, paused: true, play: () => Promise.resolve(), pause: () => { } };
let musicOn = false;
function startMusic() { }

let actx = null;
function beep(freq = 440, dur = 0.1, type = 'square', vol = 0.05, slide = 0) {
  if (!sfxOn) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, actx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), actx.currentTime + dur);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) { }
}

const SFX = {
  slash: () => play(pick(['swing1', 'swing2', 'swing3']), 0.35, 0.15),
  hit: () => beep(140, 0.08, 'square', 0.05, -80),
  starThrow: () => { play('magic', 0.45, 0.2); beep(700, 0.12, 'triangle', 0.06, 600); },
  orangeThrow: () => { play('swing1', 0.4, 0.25); beep(420, 0.08, 'triangle', 0.05, 300); },
  orangePop: () => { play('bubble', 0.5, 0.2); beep(260, 0.14, 'square', 0.06, -100); },
  kill: type => {
    if (type === 'slime') play(pick(['slime1', 'slime3', 'slime5']), 0.5);
    else if (type === 'ghost') play('shade', 0.25);
    else if (type === 'bat' || type === 'bee') play('bite', 0.4, 0.2);
    else play(pick(['mnstr1', 'mnstr7']), 0.25, 0.15);
  },
  hurt: () => { beep(110, 0.25, 'sawtooth', 0.07, -60); play('mnstr7', 0.15, 0.05); },
  coin: () => play('coin', 0.3, 0.15),
  gem: () => beep(1200 + Math.random() * 400, 0.05, 'triangle', 0.03),
  potion: () => play('bottle', 0.6),
  dash: () => { play('swing2', 0.25, 0.1); beep(320, 0.15, 'sine', 0.04, 500); },
  reflect: () => play('clang', 0.5, 0.15),
  level: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'triangle', 0.06), i * 80)); },
  select: () => play('ui1', 0.5, 0),
  wave: () => [400, 500, 650, 800].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.05), i * 110)),
  boss: () => play('giant1', 0.7, 0),
  bossDie: () => play('giant3', 0.7, 0),
  ult: () => { play('magic', 0.6, 0); play('unsheathe', 0.5, 0); },
  over: () => [400, 300, 220, 150].forEach((f, i) => setTimeout(() => beep(f, 0.25, 'sawtooth', 0.05), i * 200)),
  barrel: () => play('bubble', 0.3, 0.2),
  explode: () => { play('giant3', 0.45, 0.25); beep(95, 0.32, 'sawtooth', 0.09, -65); },
  shrine: () => { play('magic', 0.6, 0.1); [587, 784, 988, 1175].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.06), i * 65)); },
  dodge: () => { play('clang', 0.45, 0.25); beep(920, 0.12, 'sine', 0.06, 480); },
  freezeBomb: () => { play('magic', 0.55, 0.3); beep(1100, 0.22, 'triangle', 0.06, -700); },
  magnet: () => { [440, 660, 880, 1320].forEach((f, i) => setTimeout(() => beep(f, 0.09, 'sine', 0.05), i * 50)); },
  shieldBreak: () => { play('clang', 0.6, 0.1); beep(300, 0.2, 'sawtooth', 0.06, -150); },
  shopBuy: () => { play('coin', 0.6, 0.1); beep(880, 0.12, 'triangle', 0.05, 400); },
  shopNo: () => beep(180, 0.15, 'sawtooth', 0.05, -50),
};

// =====================================================================
//  SABRE DE LUZ CORES
// =====================================================================
const SABER_COLORS = [
  { name: 'Azul Celeste', hex: '#3aa2ff', glow: 'rgba(60,160,255,', blade: '#bfe8ff' },
  { name: 'Verde Esmeralda', hex: '#3aff75', glow: 'rgba(60,255,120,', blade: '#c2ffd5' },
  { name: 'Roxo Estelar', hex: '#c844ff', glow: 'rgba(200,70,255,', blade: '#f2c8ff' },
  { name: 'Laranja Flamejante', hex: '#ff7728', glow: 'rgba(255,120,40,', blade: '#ffe0b2' },
  { name: 'Rubi Sith', hex: '#ff264a', glow: 'rgba(255,40,70,', blade: '#ffccd4' },
];
let saberColorIndex = +localStorage.getItem('gabriel_saber_color') || 0;

// =====================================================================
//  DEFINIÇÃO E ANIMAÇÃO DOS PERSONAGENS (Âncoras Pixel-Perfect)
// =====================================================================
// 1. MANGUINHA (Garoto Comum)
const ANIM_MANGUINHA = {
  idle: [{x:260, y:11, w:45, h:59, ax:21.5, ay:59}, {x:312, y:11, w:46, h:60, ax:22.5, ay:60}, {x:368, y:11, w:45, h:61, ax:21.0, ay:61}, {x:420, y:11, w:44, h:60, ax:22.6, ay:60}, {x:477, y:11, w:45, h:60, ax:22.1, ay:60}, {x:530, y:11, w:48, h:60, ax:23.2, ay:60}, {x:584, y:11, w:47, h:60, ax:24.0, ay:60}, {x:641, y:11, w:45, h:60, ax:22.1, ay:60}, {x:696, y:11, w:44, h:60, ax:21.8, ay:60}],
  idleSide: [{x:17, y:144, w:41, h:60, ax:18.9, ay:60}],
  idleUp: [{x:17, y:211, w:41, h:61, ax:18.2, ay:61}],
  walkDown: [{x:144, y:78, w:40, h:58, ax:17.9, ay:58}, {x:195, y:78, w:46, h:58, ax:22.1, ay:58}, {x:255, y:78, w:42, h:59, ax:20.1, ay:59}, {x:309, y:79, w:43, h:58, ax:20.4, ay:58}, {x:367, y:79, w:43, h:58, ax:19.5, ay:58}, {x:420, y:79, w:45, h:57, ax:21.2, ay:57}, {x:473, y:78, w:45, h:60, ax:20.9, ay:60}, {x:525, y:78, w:47, h:60, ax:22.1, ay:60}],
  walkSide: [{x:126, y:144, w:41, h:59, ax:20.4, ay:59}, {x:180, y:144, w:39, h:59, ax:18.3, ay:59}, {x:234, y:144, w:40, h:59, ax:17.7, ay:59}, {x:285, y:144, w:38, h:60, ax:18.3, ay:60}, {x:339, y:144, w:40, h:59, ax:19.3, ay:59}, {x:393, y:144, w:40, h:59, ax:17.7, ay:59}, {x:446, y:144, w:40, h:59, ax:18.0, ay:59}, {x:498, y:144, w:40, h:59, ax:18.6, ay:59}, {x:551, y:144, w:39, h:59, ax:18.3, ay:59}, {x:604, y:144, w:39, h:59, ax:18.3, ay:59}, {x:659, y:144, w:39, h:59, ax:18.0, ay:59}, {x:713, y:144, w:41, h:59, ax:19.0, ay:59}, {x:763, y:144, w:41, h:59, ax:20.2, ay:59}, {x:820, y:144, w:41, h:59, ax:18.2, ay:59}],
  walkUp: [{x:65, y:211, w:43, h:61, ax:22.6, ay:61}, {x:122, y:211, w:42, h:60, ax:19.4, ay:60}, {x:174, y:211, w:43, h:61, ax:20.5, ay:61}, {x:228, y:210, w:43, h:62, ax:21.0, ay:62}, {x:280, y:211, w:42, h:61, ax:21.6, ay:61}, {x:336, y:211, w:40, h:60, ax:18.9, ay:60}, {x:387, y:211, w:42, h:59, ax:21.0, ay:59}, {x:440, y:211, w:42, h:60, ax:21.5, ay:60}, {x:492, y:211, w:44, h:61, ax:22.1, ay:61}, {x:546, y:211, w:42, h:61, ax:21.3, ay:61}, {x:602, y:211, w:39, h:61, ax:18.4, ay:61}, {x:653, y:211, w:44, h:59, ax:20.5, ay:59}, {x:707, y:210, w:44, h:61, ax:19.8, ay:61}, {x:758, y:210, w:45, h:62, ax:21.7, ay:62}, {x:814, y:211, w:42, h:61, ax:19.7, ay:61}],
  spin: [{x:230, y:289, w:58, h:63, ax:22.9, ay:58}, {x:299, y:286, w:58, h:66, ax:25.3, ay:61}, {x:370, y:285, w:58, h:67, ax:27.4, ay:62}, {x:441, y:283, w:58, h:69, ax:28.4, ay:64}, {x:508, y:283, w:59, h:69, ax:29.2, ay:64}, {x:574, y:286, w:58, h:66, ax:30.5, ay:61}, {x:642, y:287, w:60, h:66, ax:31.6, ay:61}, {x:714, y:289, w:58, h:64, ax:34.2, ay:59}],
  attack: [{x:157, y:358, w:54, h:84, ax:24.6, ay:84}, {x:739, y:373, w:67, h:69, ax:20.2, ay:69}, {x:871, y:370, w:73, h:72, ax:19.6, ay:72}, {x:157, y:358, w:54, h:84, ax:24.6, ay:84}],
};

// 2. AMXRAL (Estrela do Bloco)
const ANIM_AMXRAL = {
  idle: [{x:290, y:13, w:50, h:94, ax:24.6, ay:94}, {x:352, y:13, w:44, h:93, ax:19.9, ay:93}, {x:407, y:13, w:45, h:94, ax:21.3, ay:94}, {x:464, y:13, w:44, h:94, ax:22.8, ay:94}, {x:521, y:13, w:45, h:94, ax:20.8, ay:94}, {x:577, y:13, w:45, h:94, ax:20.6, ay:94}, {x:640, y:13, w:47, h:94, ax:21.7, ay:94}],
  idleSide: [{x:122, y:123, w:46, h:90, ax:18.8, ay:90}],
  idleUp: [{x:75, y:339, w:43, h:93, ax:20.9, ay:93}],
  walkDown: [{x:699, y:580, w:48, h:85, ax:19.1, ay:85, sc:1.08}, {x:764, y:582, w:52, h:85, ax:20.7, ay:85, sc:1.08}, {x:834, y:584, w:43, h:87, ax:17.4, ay:87, sc:1.08}, {x:901, y:582, w:51, h:86, ax:20.0, ay:86, sc:1.08}, {x:834, y:584, w:43, h:87, ax:17.4, ay:87, sc:1.08}, {x:764, y:582, w:52, h:85, ax:20.7, ay:85, sc:1.08}],
  walkSide: [{x:119, y:228, w:54, h:89, ax:30.9, ay:89, sc:1.03}, {x:196, y:228, w:56, h:89, ax:30.1, ay:89, sc:1.03}, {x:269, y:227, w:55, h:90, ax:30.6, ay:90, sc:1.03}, {x:343, y:228, w:53, h:91, ax:28.6, ay:91, sc:1.03}, {x:412, y:229, w:57, h:90, ax:30.2, ay:90, sc:1.03}, {x:487, y:228, w:57, h:91, ax:30.4, ay:91, sc:1.03}, {x:559, y:228, w:54, h:91, ax:26.8, ay:91, sc:1.03}, {x:625, y:228, w:51, h:91, ax:26.5, ay:91, sc:1.03}, {x:690, y:228, w:53, h:89, ax:27.6, ay:89, sc:1.03}, {x:760, y:230, w:53, h:88, ax:27.4, ay:88, sc:1.03}, {x:839, y:229, w:54, h:88, ax:29.1, ay:88, sc:1.03}],
  walkUp: [{x:75, y:339, w:43, h:93, ax:20.9, ay:93}, {x:151, y:339, w:39, h:93, ax:18.5, ay:93}, {x:222, y:340, w:42, h:92, ax:19.0, ay:92}, {x:292, y:340, w:42, h:92, ax:19.0, ay:92}],
  spin: [{x:351, y:450, w:53, h:86, ax:26.1, ay:90}, {x:419, y:446, w:57, h:86, ax:26.9, ay:90}, {x:488, y:446, w:55, h:90, ax:25.9, ay:94}, {x:557, y:452, w:51, h:92, ax:23.6, ay:96}],
  attack: [{x:494, y:576, w:50, h:87, ax:19.9, ay:87, sc:1.08}, {x:555, y:574, w:44, h:89, ax:17.3, ay:89, sc:1.08}, {x:608, y:575, w:71, h:91, ax:39.8, ay:91, sc:1.08}, {x:699, y:580, w:48, h:81, ax:19.0, ay:81, sc:1.08}],
};

// 3. TUIUBA (Orange Jui)
const ANIM_TUIUBA = {
  idle: [{x:114, y:20, w:46, h:92, ax:21.9, ay:92, sc:0.92}, {x:169, y:20, w:44, h:92, ax:21.2, ay:92, sc:0.92}, {x:218, y:20, w:40, h:91, ax:18.8, ay:91, sc:0.92}, {x:270, y:20, w:42, h:92, ax:19.6, ay:92, sc:0.92}, {x:321, y:20, w:42, h:91, ax:20.1, ay:91, sc:0.92}, {x:371, y:20, w:41, h:91, ax:20.0, ay:91, sc:0.92}, {x:421, y:20, w:41, h:91, ax:19.5, ay:91, sc:0.92}, {x:470, y:20, w:41, h:90, ax:19.2, ay:90, sc:0.92}],
  idleSide: [{x:582, y:124, w:42, h:85, ax:21.9, ay:85}],
  idleUp: [{x:652, y:119, w:43, h:87, ax:22.7, ay:87}],
  walkDown: [{x:7, y:220, w:44, h:82, ax:21.9, ay:82}, {x:66, y:220, w:50, h:83, ax:25.4, ay:83}, {x:130, y:220, w:47, h:82, ax:23.7, ay:82}, {x:188, y:221, w:49, h:80, ax:27.3, ay:80}, {x:249, y:220, w:51, h:83, ax:28.7, ay:83}, {x:318, y:221, w:46, h:82, ax:24.0, ay:82}, {x:376, y:222, w:50, h:82, ax:27.9, ay:82}, {x:442, y:222, w:48, h:83, ax:25.1, ay:83}, {x:508, y:224, w:50, h:81, ax:26.1, ay:81}, {x:570, y:224, w:53, h:80, ax:28.6, ay:80}, {x:633, y:225, w:49, h:79, ax:27.4, ay:79}, {x:701, y:226, w:45, h:79, ax:23.9, ay:79}],
  walkSide: [{x:10, y:124, w:46, h:84, ax:24.9, ay:84}, {x:68, y:123, w:50, h:85, ax:27.6, ay:85}, {x:124, y:123, w:56, h:84, ax:30.1, ay:84}, {x:189, y:124, w:50, h:84, ax:27.1, ay:84}, {x:246, y:124, w:48, h:84, ax:27.6, ay:84}, {x:302, y:124, w:50, h:84, ax:27.5, ay:84}, {x:360, y:124, w:52, h:82, ax:27.7, ay:82}, {x:427, y:124, w:51, h:86, ax:29.2, ay:86}, {x:501, y:124, w:51, h:84, ax:29.0, ay:84}],
  walkUp: [{x:652, y:119, w:43, h:87, ax:22.7, ay:87}, {x:724, y:119, w:43, h:87, ax:21.5, ay:87}, {x:795, y:119, w:45, h:87, ax:22.4, ay:87}, {x:863, y:119, w:47, h:87, ax:21.9, ay:87}, {x:934, y:120, w:45, h:87, ax:22.3, ay:87}],
  spin: [{x:407, y:517, w:63, h:65, ax:37.6, ay:65, sc:1.05}, {x:495, y:517, w:50, h:69, ax:26.5, ay:69, sc:1.05}, {x:571, y:520, w:63, h:64, ax:35.8, ay:64, sc:1.05}],
  attack: [{x:320, y:321, w:50, h:83, ax:28.2, ay:83}, {x:385, y:322, w:51, h:83, ax:29.3, ay:83}, {x:438, y:325, w:55, h:83, ax:33.8, ay:83}, {x:502, y:328, w:50, h:78, ax:27.5, ay:78}, {x:563, y:332, w:68, h:75, ax:31.9, ay:75}],
};

const CHARACTERS = [
  {
    id: 'manguinha',
    name: 'Manguinha',
    title: 'Garoto Comum',
    weaponType: 'saber',
    attackName: 'Corte de Sabre',
    ultName: 'Fúria do Sabre',
    desc: 'Equilibrado e letal a curta distância. Seu sabre de luz corta inimigos e rebate projéteis com precisão!',
    speedMod: 1.0,
    hpMod: 6,
    dmgMod: 1,
    imgKey: 'player_manguinha',
    portraitKey: 'portrait_manguinha',
    anim: ANIM_MANGUINHA,
    scale: 1.6,
  },
  {
    id: 'amxral',
    name: 'Amxral',
    title: 'Estrela do Bloco',
    weaponType: 'star',
    attackName: 'Estrela Cintilante',
    ultName: 'Chuva Estelar',
    desc: 'Mestre do ataque à distância. Arremessa estrelas cadentes amarelas que perfuram os inimigos!',
    speedMod: 1.08,
    hpMod: 6,
    dmgMod: 1,
    imgKey: 'player_amxral',
    portraitKey: 'portrait_amxral',
    anim: ANIM_AMXRAL,
    scale: 1.1,
  },
  {
    id: 'tuiuba',
    name: 'Tuiuba',
    title: 'Orange Jui',
    weaponType: 'orange',
    attackName: 'Tiro de Laranja',
    ultName: 'Explosão Cítrica',
    desc: 'Veloz e explosivo! Arremessa laranjas que detonam em suco cítrico causando dano em área.',
    speedMod: 1.12,
    hpMod: 6,
    dmgMod: 1,
    imgKey: 'player_tuiuba',
    portraitKey: 'portrait_tuiuba',
    anim: ANIM_TUIUBA,
    scale: 1.18,
  }
];

let selectedCharIndex = +localStorage.getItem('gabriel_char_index') || 0;

function drawCharacterFrame(charObj, f, x, y, flip, white = 0, opts = null) {
  ctx.save();
  const bobY = opts && opts.bobY ? opts.bobY : 0;
  ctx.translate(Math.round(x), Math.round(y + bobY));
  if (opts && opts.tilt) ctx.rotate(opts.tilt);
  if (flip) ctx.scale(-1, 1);
  if (opts && (opts.squashX || opts.squashY)) ctx.scale(opts.squashX || 1, opts.squashY || 1);
  const sc = charObj.scale * (f.sc || 1);
  const dx = Math.round(-f.ax * sc), dy = Math.round(-f.ay * sc);
  const dw = Math.round(f.w * sc), dh = Math.round(f.h * sc);
  const img = IMG[charObj.imgKey];
  const wimg = WHITE[charObj.imgKey];
  if (opts && opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
  if (white > 0 && wimg) {
    ctx.globalAlpha = (opts && opts.alpha !== undefined ? opts.alpha : 1) * white;
    if (opts && opts.additive) ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
  }
  ctx.restore();
}

// =====================================================================
//  MONSTROS
// =====================================================================
const MON = {
  slime: { img: 'slime', fw: 32, fh: 32, hp: 3, speed: 75, r: 15, dmg: 1, xp: 1, score: 10, scale: 1.6, shadow: true },
  worm: { img: 'small_worm', fw: 32, fh: 32, hp: 2, speed: 85, r: 12, dmg: 1, xp: 1, score: 8, scale: 1.5, shadow: true },
  bat: { img: 'bat', fw: 32, fh: 32, hp: 1, speed: 150, r: 12, dmg: 1, xp: 1, score: 12, scale: 1.5, fly: true },
  bee: { img: 'bee', fw: 32, fh: 32, hp: 2, speed: 110, r: 12, dmg: 1, xp: 2, score: 15, scale: 1.5, fly: true },
  snake: { img: 'snake', fw: 32, fh: 32, hp: 3, speed: 110, r: 14, dmg: 1, xp: 2, score: 15, scale: 1.6, shadow: true },
  eyeball: { img: 'eyeball', fw: 32, fh: 38, hp: 3, speed: 85, r: 14, dmg: 1, xp: 2, score: 20, scale: 1.5, fly: true },
  ghost: { img: 'ghost', fw: 40, fh: 46, hp: 5, speed: 95, r: 16, dmg: 1, xp: 3, score: 25, scale: 1.4, fly: true },
  bigworm: { img: 'big_worm', fw: 35, fh: 50, hp: 15, speed: 48, r: 22, dmg: 2, xp: 6, score: 60, scale: 1.7, shadow: true },
  flower: { img: 'man_eater_flower', fw: 60, fh: 76, hp: 14, speed: 0, r: 24, dmg: 1, xp: 6, score: 60, scale: 1.3, shadow: true },
  bomber: { img: 'slime', fw: 32, fh: 32, hp: 4, speed: 138, r: 15, dmg: 2, xp: 3, score: 30, scale: 1.55, shadow: true },
  viper: { img: 'snake', fw: 32, fh: 32, hp: 5, speed: 132, r: 14, dmg: 1, xp: 3, score: 32, scale: 1.7, shadow: true },
  sniper: { img: 'eyeball', fw: 32, fh: 38, hp: 5, speed: 75, r: 15, dmg: 2, xp: 4, score: 40, scale: 1.65, fly: true },
  necromancer: { img: 'ghost', fw: 40, fh: 46, hp: 9, speed: 72, r: 18, dmg: 1, xp: 5, score: 55, scale: 1.65, fly: true },
  golem: { img: 'pumpking', fw: 46, fh: 46, hp: 22, speed: 56, r: 24, dmg: 2, xp: 8, score: 85, scale: 1.85, shadow: true },
  goblin: { img: 'small_worm', fw: 32, fh: 32, hp: 16, speed: 168, r: 16, dmg: 0, xp: 10, score: 250, scale: 1.9, shadow: true },
  boss: { img: 'pumpking', fw: 46, fh: 46, hp: 95, speed: 80, r: 40, dmg: 2, xp: 35, score: 600, scale: 3.2, shadow: true, bossName: 'REI ABÓBORA', isBoss: true },
  leviathan: { img: 'big_worm', fw: 35, fh: 50, hp: 120, speed: 94, r: 42, dmg: 2, xp: 45, score: 750, scale: 3.1, shadow: true, bossName: 'LEVIATÃ ABISSAL', isBoss: true },
  necro_boss: { img: 'ghost', fw: 40, fh: 46, hp: 140, speed: 86, r: 38, dmg: 2, xp: 55, score: 900, scale: 2.8, fly: true, shadow: true, bossName: 'SOBERANO NECROMANTE', isBoss: true },
  hydra_boss: { img: 'man_eater_flower', fw: 60, fh: 76, hp: 165, speed: 52, r: 44, dmg: 2, xp: 65, score: 1100, scale: 2.35, shadow: true, bossName: 'IMPERATRIZ CARNÍVORA', isBoss: true },
  beholder_boss: { img: 'eyeball', fw: 32, fh: 38, hp: 185, speed: 88, r: 40, dmg: 2, xp: 75, score: 1300, scale: 3.3, fly: true, shadow: true, bossName: 'OLHO ASTRAL SUPREMO', isBoss: true },
};

// =====================================================================
//  INPUT (Teclado, Mouse e Toque Mobile)
// =====================================================================
const keys = {}, pressed = {};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault();
  touch.active = false; // voltou pro teclado: esconde os botões touch
  startMusic();
});
addEventListener('keyup', e => (keys[e.key.toLowerCase()] = false));

const mouse = { x: 0, y: 0, down: false, click: false, rclick: false, moved: false };
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) { mouse.down = true; mouse.click = true; }
  if (e.button === 2) mouse.rclick = true;
  startMusic();
});
addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.moved = true; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// =====================================================================
//  CONTROLES TOUCH / MOBILE RESPONSIVO & MULTITOUCH ERGONÔMICO
// =====================================================================
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const touch = {
  active: false,
  isMobile: isTouchDevice,

  // Joystick Virtual (Analógico Dinâmico na Esquerda)
  joyId: null,
  joyBaseX: 95,
  joyBaseY: 0,
  joyCurrX: 95,
  joyCurrY: 0,
  joyX: 0,
  joyY: 0,
  joyDist: 0,
  joyAngle: 0,
  joyBaseRadius: 62,
  joyStickRadius: 26,

  // Botões de Ação na Direita
  atkId: null,
  dashId: null,
  ultId: null,
  isAtkDown: false,
  justAtk: false,
  justDash: false,
  justUlt: false,

  // Retângulos e Círculos Dinâmicos
  atkBtn: { x: 0, y: 0, r: 44 },
  dashBtn: { x: 0, y: 0, r: 32 },
  ultBtn: { x: 0, y: 0, r: 34 },
  pauseBtn: { x: 0, y: 0, w: 42, h: 42 },
  fullBtn: { x: 0, y: 0, w: 42, h: 42 },
};

function updateTouchLayout() {
  const minDim = Math.min(W, H);
  const isPortrait = H > W;
  const isLandscapeMobile = H <= 460 && W > H;

  // Joystick Base (mais compacto e nos cantos no celular paisagem)
  const jR = isLandscapeMobile ? 46 : clamp(minDim * 0.12, 52, 70);
  touch.joyBaseRadius = jR;
  touch.joyStickRadius = clamp(jR * 0.44, 20, 28);
  const defJoyX = isLandscapeMobile ? 66 : clamp(W * 0.13, jR + 18, 120);
  const defJoyY = isLandscapeMobile ? H - 66 : H - clamp(H * 0.18, jR + 24, 130);
  if (touch.joyId === null) {
    touch.joyBaseX = defJoyX;
    touch.joyBaseY = defJoyY;
    touch.joyCurrX = defJoyX;
    touch.joyCurrY = defJoyY;
  }

  // Botão Atacar (Grande, bem no canto inferior direito)
  const atkR = isLandscapeMobile ? 36 : clamp(minDim * 0.105, 38, 52);
  const atkX = W - atkR - (isLandscapeMobile ? 18 : clamp(W * 0.05, 18, 38));
  const atkY = H - atkR - (isLandscapeMobile ? 14 : clamp(H * 0.09, 20, 44));
  touch.atkBtn = { x: atkX, y: atkY, r: atkR };

  // Botão Giro / Esquiva (À esquerda do ataque)
  const dashR = isLandscapeMobile ? 27 : clamp(atkR * 0.74, 28, 36);
  const dashX = atkX - atkR - dashR - (isLandscapeMobile ? 10 : 14);
  const dashY = atkY + (isPortrait ? -6 : (isLandscapeMobile ? 6 : 10));
  touch.dashBtn = { x: dashX, y: dashY, r: dashR };

  // Botão Ultimate (Acima do ataque)
  const ultR = isLandscapeMobile ? 28 : clamp(atkR * 0.78, 30, 38);
  const ultX = atkX - (isPortrait ? 8 : (isLandscapeMobile ? 8 : 18));
  const ultY = atkY - atkR - ultR - (isLandscapeMobile ? 10 : 16);
  touch.ultBtn = { x: ultX, y: ultY, r: ultR };

  // Botões de Topo: Pausa e Tela Cheia
  const topSize = isLandscapeMobile ? 32 : clamp(minDim * 0.075, 36, 42);
  touch.pauseBtn = { x: W - topSize - 10, y: 10, w: topSize, h: topSize };
  touch.fullBtn = { x: W - topSize * 2 - 18, y: 10, w: topSize, h: topSize };
}
window.__touchReady = true;
updateTouchLayout();

function toggleFullscreen() {
  const doc = document;
  const el = doc.documentElement;
  try {
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    }
  } catch (e) {}
}

function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
    startMusic();
  } catch (e) {}
}

function getTouchPos(t) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (t.clientX - rect.left) * (canvas.width / rect.width),
    y: (t.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function inCircle(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) <= r;
}

canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchmove', onTouchMove, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

function onTouchStart(e) {
  e.preventDefault();
  touch.active = true;
  unlockAudio();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const { x, y } = getTouchPos(t);
    const id = t.identifier;

    // Se estiver em menus ou escolha de poderes, repassa o toque como clique direto
    if (state !== 'play') {
      mouse.x = x; mouse.y = y; mouse.click = true; mouse.down = false; mouse.moved = true;
      continue;
    }

    // 1. Pausa no topo
    if (inRect(x, y, touch.pauseBtn)) {
      state = 'pause'; SFX.select();
      continue;
    }

    // 2. Tela Cheia no topo
    if (inRect(x, y, touch.fullBtn)) {
      toggleFullscreen();
      continue;
    }

    // 3. Botão ATACAR
    if (inCircle(x, y, touch.atkBtn.x, touch.atkBtn.y, touch.atkBtn.r + 12)) {
      touch.atkId = id;
      touch.isAtkDown = true;
      touch.justAtk = true;
      continue;
    }

    // 4. Botão GIRO / ESQUIVA
    if (inCircle(x, y, touch.dashBtn.x, touch.dashBtn.y, touch.dashBtn.r + 10)) {
      touch.dashId = id;
      touch.justDash = true;
      continue;
    }

    // 5. Botão ULTIMATE
    if (inCircle(x, y, touch.ultBtn.x, touch.ultBtn.y, touch.ultBtn.r + 10)) {
      touch.ultId = id;
      touch.justUlt = true;
      continue;
    }

    // 6. Joystick Virtual na metade esquerda (Floating)
    if (x < W * 0.52 && touch.joyId === null) {
      touch.joyId = id;
      touch.joyBaseX = x;
      touch.joyBaseY = y;
      touch.joyCurrX = x;
      touch.joyCurrY = y;
      touch.joyDist = 0;
      touch.joyX = 0;
      touch.joyY = 0;
      continue;
    }

    // Toques livres na metade direita disparam ataque
    if (x >= W * 0.52 && touch.atkId === null) {
      touch.atkId = id;
      touch.isAtkDown = true;
      touch.justAtk = true;
    }
  }
}

function onTouchMove(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const { x, y } = getTouchPos(t);
    const id = t.identifier;

    if (id === touch.joyId) {
      touch.joyCurrX = x;
      touch.joyCurrY = y;
      const dx = x - touch.joyBaseX, dy = y - touch.joyBaseY;
      const d = Math.hypot(dx, dy);
      touch.joyAngle = Math.atan2(dy, dx);
      touch.joyDist = Math.min(1, d / touch.joyBaseRadius);
      touch.joyX = Math.cos(touch.joyAngle) * touch.joyDist;
      touch.joyY = Math.sin(touch.joyAngle) * touch.joyDist;
    }
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  if (!e.touches || e.touches.length === 0) mouse.down = false;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const id = t.identifier;

    if (id === touch.joyId) {
      touch.joyId = null;
      touch.joyDist = 0;
      touch.joyX = 0;
      touch.joyY = 0;
      const minDim = Math.min(W, H);
      touch.joyBaseX = clamp(W * 0.13, touch.joyBaseRadius + 18, 120);
      touch.joyBaseY = H - clamp(H * 0.18, touch.joyBaseRadius + 24, 130);
      touch.joyCurrX = touch.joyBaseX;
      touch.joyCurrY = touch.joyBaseY;
    }
    if (id === touch.atkId) {
      touch.atkId = null;
      touch.isAtkDown = false;
    }
    if (id === touch.dashId) {
      touch.dashId = null;
    }
    if (id === touch.ultId) {
      touch.ultId = null;
    }
  }
}
const anyPressed = (...ks) => ks.some(k => pressed[k]);

// =====================================================================
//  SUPORTE TOTAL A CONTROLES (GAMEPAD - Plug & Play Universal)
//  Xbox, PlayStation (DS4/DualSense), Switch Pro, 8BitDo e Genéricos USB/BT
// =====================================================================
const gamepadInfo = {
  connected: false,
  id: '',
  toastTimer: 0,
  toastName: '',
  prevButtons: [],
  stickFlickX: false,
  stickFlickY: false,
};

let gpState = {
  moveX: 0,
  moveY: 0,
  hasAim: false,
  aimAngle: 0,
  justPressed: [],
  curr: []
};

window.addEventListener('gamepadconnected', e => {
  onGamepadDetected(e.gamepad);
});

window.addEventListener('gamepaddisconnected', () => {
  gamepadInfo.connected = false;
  gamepadInfo.toastName = 'CONTROLE DESCONECTADO';
  gamepadInfo.toastTimer = 2.5;
});

function onGamepadDetected(gp) {
  if (!gp) return;
  gamepadInfo.connected = true;
  gamepadInfo.id = gp.id;
  let name = gp.id || 'Controle USB';
  if (/xbox/i.test(name)) name = 'Controle Xbox';
  else if (/dualshock|dualsense|054c|playstation/i.test(name)) name = 'Controle PlayStation';
  else if (/nintendo|switch|joy-con/i.test(name)) name = 'Controle Nintendo Switch';
  else if (/8bitdo/i.test(name)) name = 'Controle 8BitDo';
  else if (name.length > 25) name = name.slice(0, 23) + '...';
  gamepadInfo.toastName = name;
  gamepadInfo.toastTimer = 3.5;
  startMusic();
  try { SFX.select(); } catch (e) {}
}

const GP_DEADZONE = 0.20;
const GP_AIM_DEADZONE = 0.26;
function applyDeadzone(v, dz = GP_DEADZONE) {
  return Math.abs(v) > dz ? (v - Math.sign(v) * dz) / (1 - dz) : 0;
}

function pollGamepad(dt = 0) {
  if (gamepadInfo.toastTimer > 0) gamepadInfo.toastTimer -= dt;
  if (!navigator.getGamepads) return null;
  const gamepads = navigator.getGamepads();
  if (!gamepads) return null;
  let gp = null;
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].connected) { gp = gamepads[i]; break; }
  }
  if (!gp) {
    if (gamepadInfo.connected) {
      gamepadInfo.connected = false;
      gamepadInfo.toastName = 'CONTROLE DESCONECTADO';
      gamepadInfo.toastTimer = 2.0;
    }
    return null;
  }
  if (!gamepadInfo.connected) {
    onGamepadDetected(gp);
  }
  return gp;
}

function updateGamepadState(dt) {
  const gp = pollGamepad(dt);
  if (!gp) {
    gpState = {
      moveX: 0,
      moveY: 0,
      hasAim: false,
      aimAngle: 0,
      attackHold: false,
      attackJust: false,
      dashJust: false,
      ultJust: false,
      justPressed: [],
      curr: []
    };
    return gpState;
  }

  const prev = gamepadInfo.prevButtons;
  function isBtnDown(b, isTrigger = false) {
    if (!b) return false;
    if (typeof b === 'object') {
      if (isTrigger) {
        // Gatilhos analógicos traseiros (RT / LT):
        // Threshold seguro de 0.35 para NUNCA disparar sozinho por ruído/folga
        if (typeof b.value === 'number') return b.value > 0.35;
        return Boolean(b.pressed);
      }
      return Boolean(b.pressed || (typeof b.value === 'number' && b.value > 0.5));
    }
    return typeof b === 'number' && b > (isTrigger ? 0.35 : 0.5);
  }

  const curr = [];
  const justPressed = [];
  const btnCount = Math.max(16, gp.buttons.length);
  for (let i = 0; i < btnCount; i++) {
    const isTrig = (i === 6 || i === 7);
    const down = isBtnDown(gp.buttons[i], isTrig);
    curr[i] = down;
    justPressed[i] = down && !prev[i];
  }
  gamepadInfo.prevButtons = curr;

  // Analógico Esquerdo (Movimento)
  const lx = applyDeadzone(gp.axes[0] || 0);
  const ly = applyDeadzone(gp.axes[1] || 0);

  // Analógico Direito (Mira 360°)
  let rx = 0, ry = 0;
  if (gp.axes.length >= 4) {
    rx = gp.axes[2] || 0;
    ry = gp.axes[3] || 0;
  } else if (gp.axes.length >= 6) {
    rx = gp.axes[4] || 0;
    ry = gp.axes[5] || 0;
  }
  const rDist = Math.hypot(rx, ry);
  let hasAim = false, aimAngle = 0;
  if (rDist > GP_AIM_DEADZONE) {
    hasAim = true;
    aimAngle = Math.atan2(ry, rx);
  }

  // D-Pad / Botões direcionais
  let dpadX = 0, dpadY = 0;
  if (curr[14]) dpadX -= 1; // Left
  if (curr[15]) dpadX += 1; // Right
  if (curr[12]) dpadY -= 1; // Up
  if (curr[13]) dpadY += 1; // Down

  let moveX = Math.abs(lx) > 0.05 ? lx : dpadX;
  let moveY = Math.abs(ly) > 0.05 ? ly : dpadY;
  const mLen = Math.hypot(moveX, moveY);
  if (mLen > 1) { moveX /= mLen; moveY /= mLen; }

  // =========================================================
  //  AÇÕES DO JOGO - GATILHOS TRASEIROS & BOTÕES DEDICADOS
  // =========================================================
  // ATAQUE EXCLUSIVO NOS GATILHOS TRASEIROS:
  // RT / R2 (Gatilho Traseiro Direito, Botão 7) e RB / R1 (Botão Traseiro Superior Direito, Botão 5)
  const attackHold = Boolean(curr[7] || curr[5]);
  const attackJust = Boolean(justPressed[7] || justPressed[5]);

  // GIRO / ESQUIVA:
  // LT / L2 (Gatilho Traseiro Esquerdo, Botão 6), LB / L1 (Botão 4), B (Botão 1) ou L3 (Botão 10)
  const dashJust = Boolean(justPressed[6] || justPressed[4] || justPressed[1] || justPressed[10]);

  // FÚRIA / ESPECIAL (ULTIMATE):
  // Botão Y (Botão 3) ou Botão X (Botão 2)
  const ultJust = Boolean(justPressed[2] || justPressed[3]);

  // NAVEGAÇÃO EM MENUS (SEM DISPARAR ATAQUE):
  // Botão 0 (A / Cross): Apenas Confirmar / Selecionar nos Menus! NÃO ataca!
  if (justPressed[0]) { pressed['enter'] = true; }
  // Botão 1 (B / Círculo): Cancelar / Voltar nos Menus
  if (justPressed[1]) { pressed['escape'] = true; }
  // Botão 11 (R3): Radar Minimapa
  if (justPressed[11]) { pressed['n'] = true; }
  // Botão 8 (Select / Back): Menu de Personagem
  if (justPressed[8]) { pressed['tab'] = true; }
  // Botão 9 (Start / Options): Pause
  if (justPressed[9]) { pressed['p'] = true; pressed['start'] = true; }

  // Navegação em Menus com D-Pad ou Toque no Analógico (com auto-repeat suave)
  const navRawL = Boolean(curr[14] || lx < -0.42);
  const navRawR = Boolean(curr[15] || lx > 0.42);
  const navRawU = Boolean(curr[12] || ly < -0.42);
  const navRawD = Boolean(curr[13] || ly > 0.42);

  if (navRawL) {
    if (!gamepadInfo.holdL) {
      pressed['arrowleft'] = true; pressed['a'] = true;
      gamepadInfo.holdL = true; gamepadInfo.repL = 0.28;
    } else {
      gamepadInfo.repL -= dt;
      if (gamepadInfo.repL <= 0) {
        pressed['arrowleft'] = true; pressed['a'] = true;
        gamepadInfo.repL = 0.16;
      }
    }
  } else {
    gamepadInfo.holdL = false;
  }

  if (navRawR) {
    if (!gamepadInfo.holdR) {
      pressed['arrowright'] = true; pressed['d'] = true;
      gamepadInfo.holdR = true; gamepadInfo.repR = 0.28;
    } else {
      gamepadInfo.repR -= dt;
      if (gamepadInfo.repR <= 0) {
        pressed['arrowright'] = true; pressed['d'] = true;
        gamepadInfo.repR = 0.16;
      }
    }
  } else {
    gamepadInfo.holdR = false;
  }

  if (navRawU) {
    if (!gamepadInfo.holdU) {
      pressed['arrowup'] = true; pressed['w'] = true;
      gamepadInfo.holdU = true; gamepadInfo.repU = 0.28;
    } else {
      gamepadInfo.repU -= dt;
      if (gamepadInfo.repU <= 0) {
        pressed['arrowup'] = true; pressed['w'] = true;
        gamepadInfo.repU = 0.16;
      }
    }
  } else {
    gamepadInfo.holdU = false;
  }

  if (navRawD) {
    if (!gamepadInfo.holdD) {
      pressed['arrowdown'] = true; pressed['s'] = true;
      gamepadInfo.holdD = true; gamepadInfo.repD = 0.28;
    } else {
      gamepadInfo.repD -= dt;
      if (gamepadInfo.repD <= 0) {
        pressed['arrowdown'] = true; pressed['s'] = true;
        gamepadInfo.repD = 0.16;
      }
    }
  } else {
    gamepadInfo.holdD = false;
  }

  // ATENÇÃO: NUNCA definir keys[' '] = true para não travar o ataque do teclado!
  gpState = { moveX, moveY, hasAim, aimAngle, attackHold, attackJust, dashJust, ultJust, justPressed, curr };
  return gpState;
}

function gamepadRumble(weak = 0.3, strong = 0.3, duration = 120) {
  try {
    const gp = pollGamepad(0);
    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
      gp.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: clamp(weak, 0, 1),
        strongMagnitude: clamp(strong, 0, 1),
      }).catch(() => {});
    }
  } catch (e) {}
}

function drawGamepadToast() {
  if (gamepadInfo.toastTimer <= 0) return;
  const a = Math.min(1, gamepadInfo.toastTimer, (3.5 - gamepadInfo.toastTimer) * 4);
  ctx.save();
  ctx.globalAlpha = a;
  const tw = Math.min(460, W - 40), th = 38;
  const tx = W / 2 - tw / 2, ty = 18;
  ctx.fillStyle = 'rgba(12, 16, 26, 0.94)';
  ctx.strokeStyle = gamepadInfo.connected ? '#4fe3ff' : '#ff5d5d';
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 8); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillRect(tx, ty, tw, th); ctx.strokeRect(tx, ty, tw, th);
  }
  ctx.fillStyle = gamepadInfo.connected ? '#7fe8ff' : '#ff8585';
  ctx.font = '9px ' + FONT;
  ctx.textAlign = 'center';
  const prefix = gamepadInfo.connected ? '🎮 CONTROLE CONECTADO: ' : '❌ ';
  ctx.fillText(prefix + gamepadInfo.toastName.toUpperCase(), W / 2, ty + 24);
  ctx.restore();
}

// =====================================================================
//  MUNDO & MAPA
// =====================================================================
const TS = 48;
const COLS = 50, ROWS = 38;
const WORLD = { w: COLS * TS, h: ROWS * TS };
const ground = document.createElement('canvas');
let trees = [], rocks = [], ponds = [], props = [];

function blocked(x, y, r) {
  if (x < 60 || y < 80 || x > WORLD.w - 60 || y > WORLD.h - 40) return true;
  for (const t of trees) if (Math.hypot(x - t.x, y - t.y) < r + t.r + 10) return true;
  for (const t of rocks) if (Math.hypot(x - t.x, y - t.y) < r + t.r + 6) return true;
  for (const t of props) if (Math.hypot(x - t.x, y - t.y) < r + t.r + 6) return true;
  for (const p of ponds) if (x > p.x - r && x < p.x + p.w + r && y > p.y - r && y < p.y + p.h + r) return true;
  return false;
}

function buildWorld() {
  trees = []; rocks = []; ponds = []; props = [];
  ground.width = WORLD.w; ground.height = WORLD.h;
  const g = ground.getContext('2d');
  g.imageSmoothingEnabled = false;
  const tile = (img, tx, ty, dx, dy) => g.drawImage(img, tx * 32, ty * 32, 32, 32, dx, dy, TS, TS);

  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const r = Math.random();
      if (r < 0.55) tile(IMG.grass, 1, 3, x * TS, y * TS);
      else tile(Math.random() < 0.5 ? IMG.grass : IMG.grassalt, randi(0, 2), 5, x * TS, y * TS);
    }
  const cx = COLS / 2, cy = ROWS / 2;
  const block = (img, bx, by, bw, bh, interiorVariants) => {
    for (let j = 0; j < bh; j++)
      for (let i = 0; i < bw; i++) {
        const tx = i === 0 ? 0 : i === bw - 1 ? 2 : 1;
        const ty = j === 0 ? 2 : j === bh - 1 ? 4 : 3;
        if (tx === 1 && ty === 3 && interiorVariants && Math.random() < 0.4) tile(img, randi(0, 2), 5, (bx + i) * TS, (by + j) * TS);
        else tile(img, tx, ty, (bx + i) * TS, (by + j) * TS);
      }
  };
  block(IMG.dirt, cx - 4, cy - 3, 8, 6, true);
  for (let n = 0; n < 9; n++) {
    const bw = randi(3, 6), bh = randi(3, 5);
    block(IMG.dirt, randi(1, COLS - bw - 1), randi(1, ROWS - bh - 1), bw, bh, true);
  }
  let tries = 0;
  while (ponds.length < 4 && tries++ < 100) {
    const bw = randi(4, 7), bh = randi(3, 5);
    const bx = randi(2, COLS - bw - 2), by = randi(2, ROWS - bh - 2);
    if (Math.abs(bx + bw / 2 - cx) < 9 && Math.abs(by + bh / 2 - cy) < 7) continue;
    const rect = { x: bx * TS + 18, y: by * TS + 22, w: bw * TS - 36, h: bh * TS - 40 };
    if (ponds.some(p => rect.x < p.x + p.w + 150 && rect.x + rect.w > p.x - 150 && rect.y < p.y + p.h + 150 && rect.y + rect.h > p.y - 150)) continue;
    block(IMG.water, bx, by, bw, bh, true);
    ponds.push(rect);
  }
  for (let i = 0; i < 220; i++) {
    const x = rand(0, WORLD.w), y = rand(0, WORLD.h);
    if (blocked(x, y, 10)) continue;
    if (Math.random() < 0.6) g.drawImage(IMG.grass, 0, Math.random() < 0.5 ? 0 : 32, 32, 32, x, y, TS, TS);
    else {
      const p = pick([[35, 0, 16, 9], [43, 11, 18, 15], [34, 13, 10, 6]]);
      g.drawImage(IMG.rock, p[0], p[1], p[2], p[3], x, y, p[2] * 1.5, p[3] * 1.5);
    }
  }
  tries = 0;
  while (trees.length < 55 && tries++ < 2000) {
    const t = { x: rand(70, WORLD.w - 70), y: rand(140, WORLD.h - 30), r: 20, v: randi(0, 3) };
    if (Math.hypot(t.x - WORLD.w / 2, t.y - WORLD.h / 2) < 300) continue;
    if (trees.some(o => dist(o, t) < 120)) continue;
    if (blocked(t.x, t.y, 40)) continue;
    trees.push(t);
  }
  for (let x = -20; x < WORLD.w + 60; x += 70) {
    trees.push({ x: x + rand(-10, 10), y: 40 + rand(-8, 8), r: 0, v: randi(0, 3), deco: true });
    trees.push({ x: x + rand(-10, 10), y: WORLD.h + 90, r: 0, v: randi(0, 3), deco: true });
  }
  for (let y = 120; y < WORLD.h + 60; y += 70) {
    trees.push({ x: -10 + rand(-8, 8), y, r: 0, v: randi(0, 3), deco: true });
    trees.push({ x: WORLD.w + 10 + rand(-8, 8), y, r: 0, v: randi(0, 3), deco: true });
  }
  tries = 0;
  while (rocks.length < 22 && tries++ < 1000) {
    const r = { x: rand(60, WORLD.w - 60), y: rand(80, WORLD.h - 40), r: 18 };
    if (Math.hypot(r.x - WORLD.w / 2, r.y - WORLD.h / 2) < 200 || blocked(r.x, r.y, 30)) continue;
    rocks.push(r);
  }
  for (let i = 0; i < 6; i++) {
    const p = { x: rand(100, WORLD.w - 100), y: rand(120, WORLD.h - 60), r: 30, stack: true };
    if (!blocked(p.x, p.y, 50) && Math.hypot(p.x - WORLD.w / 2, p.y - WORLD.h / 2) > 250) rocks.push(p);
  }
}

function refillBarrels(n) {
  let tries = 0, made = 0;
  const cur = props.filter(p => p.kind === 'barrel' || p.kind === 'tnt').length;
  while (cur + made < n && tries++ < 300) {
    const isTnt = Math.random() < 0.3;
    const p = { kind: isTnt ? 'tnt' : 'barrel', x: rand(80, WORLD.w - 80), y: rand(120, WORLD.h - 60), r: 15, hp: isTnt ? 1 : 2, hurt: 0 };
    if (blocked(p.x, p.y, 40)) continue;
    if (player && Math.hypot(p.x - player.x, p.y - player.y) < 220) continue;
    props.push(p); made++;
  }
}

const SHRINE_TYPES = [
  { id: 'frenzy', name: 'ALTAR DO FRENESI', sub: '+Velocidade e Cadência Máxima por 10s!', col: '#ff6438', icon: 'i_S_Fire01' },
  { id: 'shield', name: 'ALTAR CELESTIAL', sub: '+2 Escudos Orbitais Protetores!', col: '#4fe3ff', icon: 'i_S_Buff03' },
  { id: 'fortune', name: 'ALTAR DA FORTUNA', sub: 'Chuva de Moedas + Ímã Global!', col: '#ffd23f', icon: 'i_I_GoldCoin' },
  { id: 'storm', name: 'ALTAR DO TROVÃO', sub: 'Tempestade de Raios + Fúria!', col: '#d26bff', icon: 'i_S_Light02' },
  { id: 'pact', name: 'ALTAR DO PACTO', sub: 'Sacrifique 1 Coração por +1 NÍVEL e +1 DANO!', col: '#ff2a55', icon: 'i_I_Ruby' },
  { id: 'cursed', name: 'BAÚ DESAFIADOR', sub: 'Derrote a Emboscada de Elites por Recompensa Épica!', col: '#ff9a2e', icon: 'i_I_Chest01' },
];

function spawnShrine() {
  if (!shrines || shrines.length >= 2) return;
  for (let tries = 0; tries < 120; tries++) {
    const x = rand(180, WORLD.w - 180), y = rand(200, WORLD.h - 160);
    if (blocked(x, y, 65)) continue;
    if (player && Math.hypot(x - player.x, y - player.y) < 280) continue;
    if (shrines.some(s => Math.hypot(x - s.x, y - s.y) < 420)) continue;
    const st = pick(SHRINE_TYPES);
    shrines.push({ ...st, x, y, r: 58, prog: 0, t: 0 });
    texts.push({ x: player.x, y: player.y - 130, txt: '✦ ' + st.name + ' SURGIU!', life: 2.0, color: st.col, size: 11 });
    return;
  }
}

function triggerExplosion(x, y, radius, dmg, fromPlayer = true) {
  SFX.explode();
  shake = Math.max(shake, 14);
  fxRings.push({ kind: 'explosion', x, y, r: 12, maxR: radius, life: 0.34, max: 0.34, col: '#ff7b24' });
  burst(x, y - 10, '#ff6a1a', 26, 340);
  burst(x, y - 10, '#ffe159', 16, 250);
  burst(x, y - 10, '#ffffff', 8, 160);
  for (const e of enemies) {
    if (!e.dead && Math.hypot(e.x - x, e.y - y) < radius + e.r) {
      damageEnemy(e, dmg, x, y, 520, { color: '#ff7b24', noFreeze: true, silent: true });
    }
  }
  for (const b of props) {
    if (!b.dead && Math.hypot(b.x - x, b.y - y) < radius * 0.85) {
      b.chainDelay = 0.12;
    }
  }
  if (!fromPlayer && player && Math.hypot(player.x - x, (player.y - 20) - y) < radius * 0.72) {
    hurtPlayer(1, x, y);
  }
}

function collideStatic(e, r) {
  for (const o of trees) {
    if (!o.r) continue;
    const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), m = r + o.r;
    if (d < m && d > 0) { e.x = o.x + dx / d * m; e.y = o.y + dy / d * m; }
  }
  for (const o of rocks.concat(props)) {
    const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), m = r + o.r;
    if (d < m && d > 0) { e.x = o.x + dx / d * m; e.y = o.y + dy / d * m; }
  }
  for (const p of ponds) {
    if (e.x > p.x - r && e.x < p.x + p.w + r && e.y > p.y - r && e.y < p.y + p.h + r) {
      const l = e.x - (p.x - r), rr = p.x + p.w + r - e.x, t = e.y - (p.y - r), b = p.y + p.h + r - e.y;
      const m = Math.min(l, rr, t, b);
      if (m === l) e.x = p.x - r; else if (m === rr) e.x = p.x + p.w + r; else if (m === t) e.y = p.y - r; else e.y = p.y + p.h + r;
    }
  }
  e.x = clamp(e.x, 40 + r, WORLD.w - 40 - r);
  e.y = clamp(e.y, 90 + r, WORLD.h - 20 - r);
}

// =====================================================================
//  MELHORIAS (Level Up & Sinergias Despertas)
// =====================================================================
const UPGRADES = [
  { id: 'dmg', name: 'Poder Puro', icon: 'S_Buff08', max: 5, desc: l => '+1 de dano no ataque principal', apply: s => (s.dmg += 1) },
  { id: 'rate', name: 'Mãos Rápidas', icon: 'I_Clock', max: 5, desc: l => 'Ataques +14% mais rápidos', apply: s => (s.atkRate *= 1.14) },
  { id: 'multi', name: 'Ataque Múltiplo', icon: 'S_Light04', max: 3, desc: l => '+1 projétil em leque ou corte extra de sabre', apply: s => (s.multi = (s.multi || 0) + 1) },
  { id: 'speed', name: 'Tênis Turbo', icon: 'A_Shoes03', max: 5, desc: l => 'Anda +10% mais rápido', apply: s => (s.speed *= 1.10) },
  { id: 'hp', name: 'Coração Extra', icon: 'S_Holy01', max: 5, desc: l => '+1 coração máximo e cura 3 de vida', apply: (s, p) => { s.maxHp += 2; p.hp = Math.min(s.maxHp, p.hp + 6); } },
  { id: 'range', name: 'Alcance Ampliado', icon: 'S_Light01', max: 4, desc: l => 'Alcance do golpe/projéteis +16%', apply: s => (s.range *= 1.16) },
  { id: 'wave', name: 'Onda Cósmica', icon: 'S_Magic02', max: 5, desc: l => ['Cada ataque dispara uma onda cósmica', 'Ondas atravessam mais inimigos', '3 ondas em leque', 'Ondas maiores e com dano elevado', '★ DESPERTAR: Supernova Cósmica 360°!'][l], apply: s => (s.wave += 1) },
  { id: 'fire', name: 'Bolas de Fogo', icon: 'S_Fire02', max: 5, desc: l => l === 4 ? '★ DESPERTAR: Sol Solar Supremo que queima tudo!' : (l === 0 ? 'Uma bola de fogo te orbita' : '+1 bola de fogo orbitando'), apply: s => (s.fire += 1) },
  { id: 'bolt', name: 'Raio em Cadeia', icon: 'S_Light02', max: 5, desc: l => l === 4 ? '★ DESPERTAR: Tempestade de Thor (raios duplos e paralisia)!' : (l === 0 ? 'Raios caem nos inimigos' : 'Raios mais frequentes e saltam +1'), apply: s => (s.bolt += 1) },
  { id: 'axe', name: 'Machado Bumerangue', icon: 'S_Axe03', max: 4, desc: l => l === 3 ? '★ DESPERTAR: Guilhotina Espiral Gigante!' : (l === 0 ? 'Lança machados giratórios que voltam até você' : '+1 machado bumerangue e mais dano'), apply: s => (s.axe = (s.axe || 0) + 1) },
  { id: 'ice', name: 'Aura de Gelo', icon: 'S_Ice01', max: 4, desc: l => l === 3 ? '★ DESPERTAR: Zero Absoluto (congela inimigos na aura)!' : (l === 0 ? 'Desacelera e fere quem chega perto' : 'Aura maior e mais gelada'), apply: s => (s.ice += 1) },
  { id: 'earth', name: 'Tremor Sísmico', icon: 'S_Earth01', max: 4, desc: l => (l === 0 ? 'A cada 4.5s um choque atordoa e fere em área' : 'Choque sísmico com maior raio e força'), apply: s => (s.earth = (s.earth || 0) + 1) },
  { id: 'phantom', name: 'Lâminas Fantasmas', icon: 'S_Dagger03', max: 4, desc: l => l === 3 ? '★ DESPERTAR: Exército Espectral Perfurante!' : (l === 0 ? 'Adagas de luz perseguem o inimigo mais próximo' : '+1 adaga automática e mais veloz'), apply: s => (s.phantom = (s.phantom || 0) + 1) },
  { id: 'vortex', name: 'Vórtice Abissal', icon: 'S_Magic04', max: 4, desc: l => (l === 0 ? 'Cria buracos negros que puxam e esmagam inimigos' : 'Vórtice maior, mais forte e mais frequente'), apply: s => (s.vortex = (s.vortex || 0) + 1) },
  { id: 'venom', name: 'Peçonha Letal', icon: 'P_Medicine01', max: 4, desc: l => (l === 0 ? 'Ataques envenenam inimigos e explodem ao morrer' : 'Veneno mais letal e explosão tóxica maior'), apply: s => (s.venom = (s.venom || 0) + 1) },
  { id: 'berserk', name: 'Sangue Berserker', icon: 'S_Fire01', max: 4, desc: l => 'Ganha até +45% velocidade de ataque conforme seu Combo ou vida baixa', apply: s => (s.berserk = (s.berserk || 0) + 1) },
  { id: 'ricochet', name: 'Cristal de Eco', icon: 'I_Diamond', max: 3, desc: l => 'Ataques têm 25% de chance por nível de disparar um raio de eco em outro alvo', apply: s => (s.ricochet = (s.ricochet || 0) + 1) },
  { id: 'aegis', name: 'Égide Divina', icon: 'S_Buff03', max: 3, desc: l => (l === 0 ? 'Gera 1 escudo protetor a cada 16s' : 'Escudo recarrega mais rápido e explode forte'), apply: (s, p) => { s.aegis = (s.aegis || 0) + 1; p.shields = Math.min(3, (p.shields || 0) + 1); } },
  { id: 'critNova', name: 'Impacto Arcano', icon: 'S_Magic03', max: 3, desc: l => 'Acertos críticos explodem causando dano em área', apply: s => (s.critNova = (s.critNova || 0) + 1) },
  { id: 'luck', name: 'Trevo da Sorte', icon: 'I_Clover', max: 4, desc: l => '+7% crítico e mais drops raros', apply: s => { s.crit += 0.07; s.luck += 1; } },
  { id: 'magnet', name: 'Anel Ímã', icon: 'Ac_Ring01', max: 3, desc: l => 'Puxa itens de mais longe (+85 alcance)', apply: s => (s.magnet += 85) },
  { id: 'vamp', name: 'Rubi Vampiro', icon: 'I_Ruby', max: 3, desc: l => 'Chance de curar 1 de vida ao derrotar inimigos', apply: s => (s.vamp += 1) },
  { id: 'dash', name: 'Giro Cortante', icon: 'S_Buff04', max: 4, desc: l => 'Giro recarrega 16% mais rápido e causa +2 de dano', apply: s => { s.dashCd *= 0.84; s.dashDmg += 2; } },
  { id: 'armor', name: 'Jaqueta Blindada', icon: 'A_Armour01', max: 3, desc: l => 'Mais tempo invencível após dano e reduz dano pesado em ondas altas', apply: s => { s.invTime += 0.3; s.armor = (s.armor || 0) + 1; } },
];

// =====================================================================
//  TERRARIA REFORGE & PREFIX SYSTEM (Terraria PrefixID.cs)
// =====================================================================
const TERRARIA_PREFIXES = [
  { id: 'legendary', name: 'Lendário', color: '#ffaa2b', dmgMul: 1.25, critAdd: 0.10, speedMul: 1.15, sizeMul: 1.22, kbMul: 1.25, desc: '+25% Dano, +15% Vel., +10% Crítico, +22% Sabre' },
  { id: 'godly',     name: 'Divino',   color: '#ffe855', dmgMul: 1.20, critAdd: 0.08, speedMul: 1.05, sizeMul: 1.15, kbMul: 1.30, desc: '+20% Dano, +8% Crítico, +30% Repulsão' },
  { id: 'demonic',   name: 'Demoníaco',color: '#ff4d6d', dmgMul: 1.22, critAdd: 0.10, speedMul: 1.00, sizeMul: 1.10, kbMul: 1.00, desc: '+22% Dano Bruto, +10% Chance de Crítico' },
  { id: 'unreal',    name: 'Irreal',   color: '#52f6ff', dmgMul: 1.18, critAdd: 0.08, speedMul: 1.20, sizeMul: 1.05, kbMul: 1.15, desc: '+18% Dano, +20% Velocidade de Ataque, +8% Crítico' },
  { id: 'mythical',  name: 'Mítico',   color: '#d66fff', dmgMul: 1.15, critAdd: 0.06, speedMul: 1.12, sizeMul: 1.10, kbMul: 1.10, desc: '+15% Dano, +12% Vel., +6% Crítico, +Regenera Fúria' },
  { id: 'massive',   name: 'Titânico', color: '#7aff61', dmgMul: 1.14, critAdd: 0.04, speedMul: 0.95, sizeMul: 1.35, kbMul: 1.35, desc: '+14% Dano, +35% Alcance Gigantesco do Sabre!' },
  { id: 'ruthless',  name: 'Implacável',color: '#ff7043', dmgMul: 1.28, critAdd: 0.00, speedMul: 1.02, sizeMul: 1.10, kbMul: 0.85, desc: '+28% Dano Destruidor (Poder Absoluto)' },
  { id: 'deadly',    name: 'Mortal',   color: '#ff85b8', dmgMul: 1.16, critAdd: 0.08, speedMul: 1.10, sizeMul: 1.00, kbMul: 1.00, desc: '+16% Dano, +10% Vel., +8% Crítico' },
];

function rollTerrariaPrefix() {
  if (!player) return null;
  const pref = pick(TERRARIA_PREFIXES);
  player.prefix = pref;
  texts.push({ x: player.x, y: player.y - 110, txt: 'Reforja: [' + pref.name + ']!', life: 1.8, color: pref.color, size: 14 });
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: player.x, y: player.y - 30,
      vx: rand(-140, 140), vy: rand(-140, 140),
      life: rand(0.35, 0.75), max: 0.75, color: pref.color, size: rand(3, 7)
    });
  }
  return pref;
}

// =====================================================================
//  LOJA ENTRE ONDAS (Preços Dinâmicos & Inflação Equilibrada)
// =====================================================================
let shopBuys = {};
function getShopCost(item) {
  const n = shopBuys[item.id] || 0;
  return item.baseCost + n * item.stepCost;
}
const SHOP_ITEMS = [
  { id: 'potion', name: 'Frasco de Vida', icon: 'P_Red01', baseCost: 12, stepCost: 6, get cost() { return getShopCost(this); }, desc: 'Recupera 2 corações cheios', buy: (s, p) => { p.hp = Math.min(s.maxHp, p.hp + 4); SFX.potion(); } },
  { id: 'reforge', name: 'Forja Goblin', icon: 'S_Axe03', baseCost: 15, stepCost: 8, get cost() { return getShopCost(this); }, desc: 'Reforja sua arma com prefixos lendários do Terraria (Lendário, Divino, etc.)', buy: (s, p) => { rollTerrariaPrefix(); SFX.level(); } },
  { id: 'ironskin', name: 'Pele de Ferro', icon: 'A_Armour01', baseCost: 14, stepCost: 6, get cost() { return getShopCost(this); }, desc: 'Concede +4 Armadura e corta dano recebido pela metade por 35s', buy: (s, p) => { p.ironskinT = Math.max(p.ironskinT || 0, 35); texts.push({ x: p.x, y: p.y - 95, txt: '🛡 PELE DE FERRO!', life: 1.4, color: '#ffea60', size: 12 }); SFX.potion(); } },
  { id: 'thorns', name: 'Poção Espinhos', icon: 'S_Buff08', baseCost: 15, stepCost: 6, get cost() { return getShopCost(this); }, desc: 'Devolve 100% do dano aos inimigos atacantes por 30s', buy: (s, p) => { p.thornsT = Math.max(p.thornsT || 0, 30); texts.push({ x: p.x, y: p.y - 95, txt: '🌵 ESPINHOS ATIVOS!', life: 1.4, color: '#7aff61', size: 12 }); SFX.potion(); } },
  { id: 'shield_orb', name: 'Orbe de Escudo', icon: 'S_Buff03', baseCost: 18, stepCost: 10, get cost() { return getShopCost(this); }, desc: 'Concede +2 Escudos Orbitais que bloqueiam dano', buy: (s, p) => { p.shields = Math.min(4, (p.shields || 0) + 2); SFX.shrine(); } },
  { id: 'mystery', name: 'Tomo do Destino', icon: 'I_Book', baseCost: 24, stepCost: 14, get cost() { return getShopCost(this); }, desc: 'Concede +100% Fúria, Ímã Global e +10% Crítico na próxima onda', buy: (s, p) => { p.ultMeter = 100; p.frenzyT = Math.max(p.frenzyT, 8); for (const k of pickups) k.pull = true; SFX.ult(); } },
  { id: 'medal', name: 'Medalha Honra', icon: 'Ac_Medal01', baseCost: 42, stepCost: 28, get cost() { return getShopCost(this); }, desc: 'Aumenta permanentemente o dano principal e de giro em +1', buy: (s, p) => { s.dmg += 1; s.dashDmg += 1; SFX.level(); } },
];
let shopSel = 0;

// =====================================================================
//  ESTADO GLOBAL
// =====================================================================
let state = 'loading'; // loading | menu | select_char | play | levelup | shop | pause | over
let player, stats, ups, enemies, ebullets, pshots, particles, pickups, texts, slashes, bolts;
let shrines = [], hazards = [], fxRings = [], afterimages = [], puddles = [];
let shake, freeze, wave, waveTimer, toSpawn, spawnTimer, score, coins, kills, banner, time, playTime;
let trauma = 0.0;
function addTrauma(amt) { trauma = Math.min(1.0, trauma + amt); shake = Math.max(shake, amt * 18); }
let waveEvent = null, meteorTimer = 0, minimapOn = true;
let levelChoices, levelSel, boss, bossCount;
let best = +localStorage.getItem('gabriel_best2') || 0;

function reset() {
  keys[' '] = false;
  buildWorld();
  const curChar = CHARACTERS[selectedCharIndex];
  stats = {
    dmg: curChar.dmgMod, atkRate: 1, speed: 220 * curChar.speedMod, maxHp: curChar.hpMod, range: 1,
    dashCd: 0.95, dashDmg: 2, crit: 0.08, magnet: 110, wave: 0, fire: 0, bolt: 0, ice: 0,
    earth: 0, phantom: 0, multi: 0, axe: 0, aegis: 0, critNova: 0,
    vortex: 0, venom: 0, berserk: 0, ricochet: 0, armor: 0,
    luck: 0, vamp: 0, invTime: 1.0, nukeNext: false
  };
  ups = {};
  shopBuys = {};
  player = {
    char: curChar,
    x: WORLD.w / 2, y: WORLD.h / 2, dir: 'down', flip: false, moving: false, aim: Math.PI / 2,
    hp: curChar.hpMod, inv: 0, animT: 0, idleT: 0, attack: null, attackCd: 0, dash: null, dashCd: 0,
    ult: null, ultMeter: 0, combo: 0, comboT: 0, bestStreakMilestone: 0,
    level: 1, xp: 0, xpNext: 6, pendingLevels: 0,
    fireAng: 0, boltT: 2, iceT: 0, earthT: 3, phantomT: 1.5, axeT: 1.4, aegisT: 12, vortexT: 3.5,
    frenzyT: 0, shields: 0, ghostT: 0, stepT: 0, goblinT: 16, prefix: null, ironskinT: 0, thornsT: 0, starTimer: 5.0,
  };
  enemies = []; ebullets = []; pshots = []; particles = []; pickups = []; texts = []; slashes = []; bolts = [];
  shrines = []; hazards = []; fxRings = []; afterimages = []; puddles = [];
  waveEvent = null; meteorTimer = 0;
  cam = { x: player.x, y: player.y, zoom: getCamZoom() }; shake = 0; freeze = 0;
  wave = 0; waveTimer = 1.0; toSpawn = 0; spawnTimer = 0; boss = null; bossCount = 0;
  score = 0; coins = 0; kills = 0; banner = null; time = 0; playTime = 0;
  refillBarrels(15);
}

// =====================================================================
//  INIMIGOS & SPAWN (Balanceamento Progressivo & Variedade de Arquétipos)
// =====================================================================
function isBossType(t) {
  return Boolean(MON[t] && MON[t].isBoss);
}

function wavePool() {
  if (waveEvent === 'swarm') return pick(['bat', 'slime', 'bee', 'worm', 'viper']);
  const p = [['slime', 5], ['worm', 3]];
  if (wave >= 2) p.push(['bat', 4], ['snake', 2]);
  if (wave >= 3) p.push(['bee', 3], ['bomber', 2]);
  if (wave >= 4) p.push(['eyeball', 2], ['bigslime', 1], ['viper', 2]);
  if (wave >= 6) p.push(['ghost', 2], ['flower', 1], ['sniper', 2]);
  if (wave >= 7) p.push(['bigworm', 2], ['necromancer', 2]);
  if (wave >= 9) p.push(['golem', 2], ['sniper', 2], ['bomber', 3]);
  if (wave >= 12) p.push(['golem', 3], ['necromancer', 3], ['bigslime', 2]);
  const tot = p.reduce((a, b) => a + b[1], 0);
  let r = Math.random() * tot;
  for (const [t, w] of p) { if ((r -= w) <= 0) return t; }
  return 'slime';
}

function spawnPos(minD, maxD, r) {
  const z = (cam && cam.zoom) || 1;
  const adjMin = minD / Math.min(1, z);
  const adjMax = maxD / Math.min(1, z);
  for (let i = 0; i < 40; i++) {
    const a = rand(0, Math.PI * 2), d = rand(adjMin, adjMax);
    const x = player.x + Math.cos(a) * d, y = player.y + Math.sin(a) * d;
    if (x < 70 || y < 110 || x > WORLD.w - 70 || y > WORLD.h - 50) continue;
    if (!blocked(x, y, r)) return { x, y };
  }
  return { x: clamp(player.x + rand(-500, 500), 80, WORLD.w - 80), y: clamp(player.y + rand(-400, 400), 120, WORLD.h - 60) };
}

function spawnEnemy(kind, at, opts = {}) {
  let type = kind, scaleMul = 1, hpMul = 1, extra = {};
  if (kind === 'bigslime') { type = 'slime'; scaleMul = 1.7; hpMul = 3.5; extra.big = true; }
  if (kind === 'minislime') { type = 'slime'; scaleMul = 0.7; hpMul = 0.36; extra.mini = true; }
  const d = MON[type];
  const eliteChance = waveEvent === 'golden' ? 0.28 : waveEvent === 'bloodmoon' ? 0.18 : Math.min(0.22, 0.05 + Math.max(0, wave - 4) * 0.01);
  const elite = Boolean(opts.forceElite || (!opts.noElite && !isBossType(type) && type !== 'goblin' && (wave >= 4 || waveEvent === 'golden' || waveEvent === 'bloodmoon') && Math.random() < eliteChance));
  if (elite) { scaleMul *= 1.32; hpMul *= 2.9; }
  if (opts.bounty) { scaleMul *= 1.65; hpMul *= 6.5; extra.bounty = true; extra.bountyT = 22; }
  const pos = at || (type === 'flower' ? spawnPos(260, 480, 40) : spawnPos(Math.max(W, H) * 0.55, Math.max(W, H) * 0.7, 30));

  // Escalonamento composto: mantém o início acessível e impede que o jogador delete tudo em ondas avançadas
  const lvlFactor = player ? Math.max(0, player.level - 4) * 0.07 : 0;
  const hpScale = 1 + (wave - 1) * 0.24 + Math.pow(Math.max(0, wave - 3), 1.62) * 0.14 + lvlFactor;
  const hp = Math.max(1, Math.round(d.hp * hpMul * (isBossType(type) ? 1 : hpScale)));
  const spdScale = (1 + Math.min(wave, 25) * 0.022) * (extra.mini ? 1.28 : 1) * (waveEvent === 'swarm' ? 1.15 : 1) * (waveEvent === 'bloodmoon' ? 1.18 : 1);
  const scaledDmg = d.dmg + (wave >= 12 && (elite || isBossType(type)) ? 1 : 0) + (waveEvent === 'bloodmoon' ? 1 : 0);

  const e = {
    type, x: pos.x, y: pos.y, vx: 0, vy: 0, kx: 0, ky: 0, hp, maxHp: hp,
    r: d.r * scaleMul, scale: d.scale * scaleMul, speed: d.speed * spdScale,
    dmg: scaledDmg, xp: Math.ceil(d.xp * (elite ? 2.4 : 1) * (waveEvent === 'swarm' ? 1.25 : 1) * (waveEvent === 'bloodmoon' ? 1.8 : 1)),
    score: Math.round(d.score * hpMul * (waveEvent === 'bloodmoon' ? 1.5 : 1)),
    t: rand(0, 10), row: 2, hurt: 0, spawn: opts.instant ? 0 : 0.7, act: rand(1.1, 2.6), mode: 'move', slow: 0, freezeT: 0,
    poisonT: 0, poisonDmg: 0, poisonTick: 0, shieldOn: false,
    elite, fireHit: 0, ...extra,
  };
  if (type === 'goblin') {
    e.escapeT = 16;
    e.coinT = 0.6;
  }
  if (isBossType(type)) {
    bossCount++;
    const bossWaveScale = 1 + Math.max(0, wave - 5) * 0.25 + Math.pow(Math.max(0, bossCount - 1), 1.35) * 0.45;
    e.hp = e.maxHp = Math.round((d.hp + (bossCount - 1) * 70) * bossWaveScale);
    e.phase = 'chase'; e.pt = 2.4; e.cycle = 0; e.spawn = 1.2;
    boss = e;
  }
  enemies.push(e);
  return e;
}

function charThemeHex() {
  if (!player) return '#ffe042';
  return player.char.weaponType === 'orange' ? '#ff8a14' : player.char.weaponType === 'star' ? '#ffe042' : SABER_COLORS[saberColorIndex].hex;
}

function damageEnemy(e, dmg, fromX, fromY, power = 380, opts = {}) {
  if (e.dead || e.spawn > 0) return false;
  if ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded) return false;
  let crit = false;
  const pref = (player && player.prefix) || null;
  const critChance = stats.crit + (pref ? pref.critAdd : 0);
  if (!opts.noCrit && Math.random() < critChance) { dmg *= 2; crit = true; }
  if (pref && pref.dmgMul && !opts.noCrit) { dmg = Math.max(1, Math.round(dmg * pref.dmgMul)); }
  if (pref && pref.kbMul && power) { power *= pref.kbMul; }
  if (pref && pref.id === 'mythical' && player && player.ultMeter < 100) { player.ultMeter = Math.min(100, player.ultMeter + 0.6); }
  if (e.shieldOn && !opts.ignoreShield) {
    dmg = Math.max(1, Math.ceil(dmg * 0.4));
    power *= 0.25;
  }
  if (isBossType(e.type)) {
    const maxHit = Math.max(8, Math.ceil(e.maxHp * 0.14));
    if (dmg > maxHit) dmg = maxHit + Math.ceil((dmg - maxHit) * 0.25);
  }
  e.hp -= dmg;
  e.hurt = 0.18;
  if (stats.venom > 0 && !opts.isPoison) {
    e.poisonT = 3.2 + stats.venom * 0.5;
    e.poisonDmg = Math.max(e.poisonDmg || 0, stats.venom + Math.floor(stats.dmg * 0.35));
  }
  if (fromX !== undefined) {
    const a = Math.atan2(e.y - fromY, e.x - fromX);
    const res = isBossType(e.type) ? 0.07 : e.type === 'golem' || e.type === 'bigworm' || e.type === 'flower' ? 0.18 : e.big ? 0.4 : 1;
    e.kx += Math.cos(a) * power * res; e.ky += Math.sin(a) * power * res;
  }
  burst(e.x, e.y - e.r, '#ffffff', 4, 160);
  burst(e.x, e.y - e.r, opts.color || charThemeHex(), 5, 200);
  texts.push({ x: e.x + rand(-10, 10), y: e.y - e.r * 2.2 - 10, txt: '' + dmg + (crit ? '!' : ''), life: 0.8, color: crit ? '#ffd23f' : (opts.isPoison ? '#7dff7a' : '#ffffff'), size: crit ? 16 : 11 });
  if (crit && stats.critNova > 0 && !opts.isNova) {
    const nr = 75 + stats.critNova * 20;
    fxRings.push({ kind: 'nova', x: e.x, y: e.y - e.r * 0.5, r: 10, maxR: nr, life: 0.25, max: 0.25, col: '#d26bff' });
    const ndmg = Math.max(1, Math.round(dmg * 0.4 * stats.critNova));
    for (const o of enemies) {
      if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < nr + o.r) {
        damageEnemy(o, ndmg, e.x, e.y, 200, { color: '#d26bff', noFreeze: true, silent: true, noCrit: true, isNova: true });
      }
    }
  }
  if (stats.ricochet > 0 && !opts.isRicochet && !opts.isPoison && !opts.isNova && Math.random() < stats.ricochet * 0.24) {
    let ricTarget = null, rDist = 240;
    for (const o of enemies) {
      if (o === e || o.dead || o.spawn > 0 || (o.type === 'ghost' && o.faded)) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d < rDist) { rDist = d; ricTarget = o; }
    }
    if (ricTarget) {
      bolts.push({ pts: [e.x, e.y - e.r, ricTarget.x, ricTarget.y - ricTarget.r], life: 0.18 });
      damageEnemy(ricTarget, Math.max(1, Math.round(dmg * 0.65)), e.x, e.y, 140, { color: '#5be8ff', noFreeze: true, silent: true, isRicochet: true });
    }
  }
  if (!opts.silent) SFX.hit();
  if (!opts.noFreeze) freeze = Math.max(freeze, crit ? 0.05 : 0.025);
  shake = Math.max(shake, crit ? 6 : 3);
  addTrauma(crit ? 0.35 : 0.16);
  if (e.hp <= 0) killEnemy(e);
  return true;
}

function dropItem(kind, x, y, extra = {}) {
  pickups.push({ kind, x: x + rand(-12, 12), y: y + rand(-12, 12), vz: rand(160, 260), z: 0, t: 0, vx: rand(-60, 60), vy: rand(-60, 60), ...extra });
}

const STREAK_CALLS = [
  [15, 'MASSACRE!', '#ffb347', 4],
  [30, 'IMPLACÁVEL!', '#ff6b4a', 8],
  [50, 'LENDÁRIO!', '#ffd23f', 15],
  [80, 'DEUS DA ARENA!', '#ff4df0', 25],
  [120, 'TRANSCENDENTE!', '#4fe3ff', 40],
];

function killEnemy(e) {
  e.dead = true;
  kills++;
  const p = player;
  p.combo++; p.comboT = 2.9;
  p.ultMeter = Math.min(100, p.ultMeter + (isBossType(e.type) ? 40 : e.elite ? 10 : 3.2));
  const mult = 1 + Math.floor(p.combo / 10) * 0.25;
  score += Math.round(e.score * mult);

  for (const [cnt, title, col, bonusCoins] of STREAK_CALLS) {
    if (p.combo === cnt && p.bestStreakMilestone < cnt) {
      p.bestStreakMilestone = cnt;
      coins += bonusCoins;
      score += cnt * 5;
      texts.push({ x: p.x, y: p.y - 135, txt: `${title} +${bonusCoins} MOEDAS`, life: 1.6, color: col, size: 15 });
      fxRings.push({ kind: 'nova', x: p.x, y: p.y - 25, r: 15, maxR: 150, life: 0.35, max: 0.35, col });
      SFX.magnet();
    }
  }

  burst(e.x, e.y - e.r, e.type === 'slime' || e.type === 'viper' ? '#5fd35f' : e.type === 'ghost' || e.type === 'necromancer' ? '#e8ffd0' : isBossType(e.type) ? '#ff9a2e' : '#c9a0ff', 18, 260);
  burst(e.x, e.y - e.r, '#ffffff', 8, 180);
  SFX.kill(e.type);

  // Explosão de Inimigo Volátil (Bomber) ou Inimigo Envenenado (Peçonha Letal)
  if (e.type === 'bomber') {
    hazards.push({ kind: 'meteor', x: e.x, y: e.y, r: 68, t: 0, dur: 0.65 });
  }
  if (e.poisonT > 0 && stats.venom > 0) {
    const vR = 65 + stats.venom * 18;
    fxRings.push({ kind: 'nova', x: e.x, y: e.y - e.r * 0.5, r: 10, maxR: vR, life: 0.28, max: 0.28, col: '#5dff6b' });
    for (const o of enemies) {
      if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < vR + o.r) {
        o.poisonT = Math.max(o.poisonT || 0, 3.0);
        o.poisonDmg = Math.max(o.poisonDmg || 0, stats.venom + 1);
        damageEnemy(o, stats.venom * 2, e.x, e.y, 150, { color: '#5dff6b', noFreeze: true, silent: true, noCrit: true, isPoison: true });
      }
    }
  }

  if (e.type === 'goblin') {
    SFX.shrine();
    shake = Math.max(shake, 16);
    for (let i = 0; i < 18; i++) dropItem('coin', e.x, e.y);
    for (let i = 0; i < 4; i++) dropItem('ruby', e.x, e.y);
    dropItem('potion', e.x, e.y);
    dropItem(pick(['magnet_orb', 'frenzy_orb']), e.x, e.y);
    banner = { txt: 'DUENDE CAPTURADO!', sub: 'Jackpot de Ouro e Rubis!', life: 2.4, max: 2.4, small: true };
    return;
  }

  if (e.bounty) {
    SFX.shrine();
    for (let i = 0; i < 12; i++) dropItem('coin', e.x, e.y);
    for (let i = 0; i < 3; i++) dropItem('ruby', e.x, e.y);
    p.pendingLevels++;
    texts.push({ x: e.x, y: e.y - 80, txt: '★ ALVO ELIMINADO! +1 NÍVEL!', life: 2.0, color: '#ffd23f', size: 14 });
  }

  let xp = e.xp;
  while (xp >= 5) { dropItem('ruby', e.x, e.y); xp -= 5; }
  for (let i = 0; i < xp; i++) dropItem('gem', e.x, e.y);
  const coinChance = (waveEvent === 'bloodmoon' ? 0.55 : 0.28) + stats.luck * 0.06;
  if (Math.random() < coinChance) dropItem('coin', e.x, e.y);
  if (Math.random() < 0.025 + stats.luck * 0.01) dropItem('potion', e.x, e.y);

  // Power-ups especiais raros
  const pwrRoll = Math.random();
  const pwrChance = (e.elite ? 0.20 : 0.014) + stats.luck * 0.005;
  if (pwrRoll < pwrChance) {
    dropItem(pick(['magnet_orb', 'frenzy_orb', 'ice_bomb']), e.x, e.y);
  }

  if (e.elite) { for (let i = 0; i < 4; i++) dropItem('coin', e.x, e.y); dropItem('potion', e.x, e.y); }
  if (stats.vamp && Math.random() < stats.vamp * 0.035 && p.hp < stats.maxHp) { p.hp++; texts.push({ x: p.x, y: p.y - 110, txt: '+1', life: 0.8, color: '#ff5d7a', size: 12 }); }
  if (e.big) for (let i = 0; i < 3; i++) spawnEnemy('minislime', { x: e.x + rand(-20, 20), y: e.y + rand(-20, 20) }, { instant: true, noElite: true });
  if (isBossType(e.type)) {
    const otherBoss = enemies.find(o => !o.dead && o !== e && isBossType(o.type));
    boss = otherBoss || null;
    SFX.bossDie();
    shake = 25; freeze = 0.3;
    for (let i = 0; i < 22; i++) dropItem('coin', e.x, e.y);
    dropItem('chest', e.x, e.y);
    if (!boss) {
      ebullets = [];
      banner = { txt: 'CHEFÃO DERROTADO!', sub: 'Pegue o baú do tesouro!', life: 3, max: 3 };
    } else {
      banner = { txt: '1º CHEFÃO ABATIDO!', sub: 'Derrote o Chefão restante!', life: 2.2, max: 2.2, small: true };
    }
  } else if (e.elite || e.big || e.type === 'bigworm' || e.type === 'golem') { shake = Math.max(shake, 10); freeze = Math.max(freeze, 0.07); }
}

function enemyShoot(e, ang, speed = 200, r = 7, color = 'purple') {
  ebullets.push({ x: e.x, y: e.y - e.r * 1.2, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r, life: 6, color });
}

function burst(x, y, color, n, spd) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(spd * 0.3, spd);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.7), max: 0.7, color, size: rand(2, 5) });
  }
}

// =====================================================================
//  LEVEL UP & LOJA
// =====================================================================
function gainXp(n) {
  const p = player;
  p.xp += n;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = Math.floor(6 + p.level * 3.2 + Math.pow(p.level, 1.4));
    p.pendingLevels++;
  }
}

function openLevelUp() {
  const avail = UPGRADES.filter(u => (ups[u.id] || 0) < u.max);
  if (!avail.length) {
    player.pendingLevels = 0;
    player.hp = stats.maxHp;
    coins += 25;
    player.ultMeter = 100;
    texts.push({ x: player.x, y: player.y - 120, txt: '★ BÊNÇÃO SUPREMA: VIDA CHEIA + 25 MOEDAS!', life: 1.8, color: '#ffd23f', size: 13 });
    SFX.level();
    return;
  }
  const choices = [];
  while (choices.length < 3 && choices.length < avail.length) {
    const u = pick(avail);
    if (!choices.includes(u)) choices.push(u);
  }
  levelChoices = choices; levelSel = 0;
  state = 'levelup';
  SFX.level();
}
function chooseUpgrade(i) {
  const u = levelChoices[i];
  if (!u) return;
  u.apply(stats, player, ups[u.id] || 0);
  ups[u.id] = (ups[u.id] || 0) + 1;
  if (ups[u.id] === u.max && ['wave', 'fire', 'bolt', 'axe', 'ice', 'phantom'].includes(u.id)) {
    banner = { txt: '★ FORMA DESPERTA!', sub: u.name.toUpperCase() + ' ATINGIU O NÍVEL MÁXIMO!', life: 2.2, max: 2.2, small: true };
    SFX.shrine();
  }
  player.pendingLevels--;
  SFX.select();
  burst(player.x, player.y - 40, '#ffd23f', 30, 300);
  state = 'play';
  player.inv = Math.max(player.inv, 0.8);
}

function openShop() {
  shopSel = 0;
  state = 'shop';
  SFX.level();
}

let shopToast = null;
function buyShopItem(i) {
  const item = SHOP_ITEMS[i];
  if (!item) return;
  const curCost = item.cost;
  if (coins >= curCost) {
    coins -= curCost;
    shopBuys[item.id] = (shopBuys[item.id] || 0) + 1;
    item.buy(stats, player);
    shopToast = { txt: '✓ COMPROU ' + item.name.toUpperCase() + '!', time: 1.5, col: '#7aff7a' };
    texts.push({ x: player.x, y: player.y - 90, txt: 'COMPRADO!', life: 0.9, color: '#7aff7a', size: 14 });
    SFX.shopBuy();
    gamepadRumble(0.2, 0.4, 100);
  } else {
    shopToast = { txt: '❌ MOEDAS INSUFICIENTES (' + curCost + ' necessarias)!', time: 1.5, col: '#ff5d5d' };
    SFX.shopNo();
    gamepadRumble(0.4, 0.5, 140);
    shake = 4;
  }
}

// =====================================================================
//  SISTEMA DE ATAQUE (MANGUINHA, AMXRAL E TUIUBA)
// =====================================================================
function spreadAngles(base, count, step = 0.17) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(base + (i - (count - 1) / 2) * step);
  return arr;
}

function getNearestEnemyAngle(p, maxDist = 520) {
  let closest = null, minDist = maxDist;
  for (const m of enemies) {
    if (m.dead || m.hp <= 0 || m.spawn > 0 || ((m.type === 'ghost' || m.type === 'necro_boss') && m.faded)) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < minDist) {
      minDist = d;
      closest = m;
    }
  }
  if (closest) {
    return Math.atan2(closest.y - (p.y - 36), closest.x - p.x);
  }
  return null;
}

function startAttack(fromMouse, fromTouch) {
  const p = player;
  if (fromTouch) {
    const autoAng = getNearestEnemyAngle(p, 520);
    if (autoAng !== null) {
      p.aim = autoAng;
    } else if (touch.joyDist > 0.08) {
      p.aim = touch.joyAngle;
    }
  } else if (fromMouse) {
    const z = (cam && cam.zoom) || 1;
    const wx = (mouse.x - W / 2) / z + cam.x, wy = (mouse.y - H / 2) / z + cam.y;
    p.aim = Math.atan2(wy - (p.y - 40), wx - p.x);
  }
  const a = p.aim, c = Math.cos(a), s = Math.sin(a);
  if (Math.abs(c) > Math.abs(s)) p.dir = c > 0 ? 'right' : 'left'; else p.dir = s > 0 ? 'down' : 'up';
  if (Math.abs(c) > 0.05) p.flip = c < 0;

  const berserkBonus = stats.berserk ? stats.berserk * 0.08 * (Math.min(1, p.combo / 25) + (p.hp <= 2 ? 0.8 : 0)) : 0;
  const pPrefix = p.prefix;
  const prefSpd = pPrefix ? pPrefix.speedMul : 1;
  const prefSize = pPrefix ? pPrefix.sizeMul : 1;
  const rateMul = stats.atkRate * (1 + berserkBonus) * (p.frenzyT > 0 ? 1.55 : 1) * prefSpd;
  const dur = (p.char.weaponType === 'saber' ? 0.32 : 0.25) / rateMul;
  p.attack = { t: 0, dur, hit: new Set() };

  const shotCount = 1 + (stats.multi || 0);

  if (p.char.weaponType === 'star') {
    // Amxral: Arremessa Estrela Amarela Estilo Terraria
    SFX.starThrow();
    const starSpeed = 590 * Math.min(1.5, 0.85 + stats.range * 0.15);
    for (const an of spreadAngles(a, shotCount, 0.16)) {
      pshots.push({
        kind: 'star', x: p.x + Math.cos(an) * 20, y: p.y - 36 + Math.sin(an) * 20,
        vx: Math.cos(an) * starSpeed, vy: Math.sin(an) * starSpeed,
        r: 16 * stats.range, dmg: stats.dmg + 1, pierce: 2, life: 1.25, rot: rand(0, 6),
        hit: new Set()
      });
    }
  } else if (p.char.weaponType === 'orange') {
    // Tuiuba: Arremessa Laranja Suculenta Explosiva
    SFX.orangeThrow();
    const orangeSpeed = 570 * Math.min(1.5, 0.85 + stats.range * 0.15);
    for (const an of spreadAngles(a, shotCount, 0.18)) {
      pshots.push({
        kind: 'orange', x: p.x + Math.cos(an) * 22, y: p.y - 34 + Math.sin(an) * 22,
        vx: Math.cos(an) * orangeSpeed, vy: Math.sin(an) * orangeSpeed,
        r: 16 * stats.range, dmg: stats.dmg + 1, pierce: 1, life: 1.3, rot: rand(0, 6),
        hit: new Set()
      });
    }
  } else {
    // Manguinha: Golpe de Sabre Melee (+ Cortes Duplos/Cruzados com Ataque Múltiplo)
    slashes.push({ a, life: 0.2, max: 0.2, r: 72 * stats.range * prefSize, follow: true });
    if (stats.multi >= 1) slashes.push({ a: a + 0.45, life: 0.22, max: 0.22, r: 82 * stats.range, follow: true });
    if (stats.multi >= 2) slashes.push({ a: a - 0.45, life: 0.22, max: 0.22, r: 82 * stats.range, follow: true });
    if (stats.multi >= 3) slashes.push({ a: a + Math.PI, life: 0.22, max: 0.22, r: 74 * stats.range, follow: true });
    SFX.slash();
  }

  // Ondas Cósmicas (Poder Roguelite adicional + Forma Desperta)
  if (stats.wave > 0) {
    const lvl = stats.wave;
    const angs = lvl >= 5 ? [a - 0.35, a, a + 0.35, a + Math.PI - 0.25, a + Math.PI + 0.25] : (lvl >= 3 ? [a - 0.3, a, a + 0.3] : [a]);
    for (const an of angs) pshots.push({
      kind: 'wave', x: p.x + Math.cos(an) * 30, y: p.y - 40 + Math.sin(an) * 30,
      vx: Math.cos(an) * (lvl >= 5 ? 580 : 520), vy: Math.sin(an) * (lvl >= 5 ? 580 : 520),
      r: lvl >= 5 ? 30 : (lvl >= 4 ? 26 : 18), dmg: stats.dmg + (lvl >= 5 ? 2 : (lvl >= 4 ? 1 : 0)),
      pierce: lvl >= 5 ? 8 : (lvl >= 2 ? 4 : 2), life: 0.78, hit: new Set(), ang: an,
    });
  }
}

// =====================================================================
//  UPDATE
// =====================================================================
function update(dt) {
  time += dt; playTime += dt;
  const p = player;

  // ---------- ONDAS & EVENTOS ----------
  if (toSpawn === 0 && enemies.length === 0) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      wave++;
      waveEvent = null;
      if (wave > 1 && (wave - 1) % 3 === 0 && state === 'play') {
        openShop();
        waveTimer = 1.6;
        return;
      }
      const isBoss = wave % 5 === 0;
      toSpawn = isBoss ? 8 + Math.floor(wave * 1.5) : 9 + Math.floor(wave * 3.4);
      spawnTimer = 0.5;
      if (!isBoss && wave >= 2) {
        const roll = Math.random();
        if (roll < 0.18 && wave >= 3) { waveEvent = 'meteors'; meteorTimer = 1.2; }
        else if (roll < 0.34 && wave >= 3) { waveEvent = 'golden'; }
        else if (roll < 0.50) { waveEvent = 'swarm'; toSpawn = Math.round(toSpawn * 1.35); }
        else if (roll < 0.65 && wave >= 4) { waveEvent = 'bloodmoon'; }
        else if (roll < 0.78 && wave >= 3) { waveEvent = 'ambush'; }
        else if (roll < 0.88 && wave >= 4) { waveEvent = 'bounty'; }
      }
      if (stats.nukeNext) {
        stats.nukeNext = false;
        toSpawn = Math.floor(toSpawn * 0.4);
        texts.push({ x: p.x, y: p.y - 140, txt: 'PERGAMINHO ATIVADO!', life: 2, color: '#ffd23f', size: 14 });
      }
      if (isBoss) {
        const bossCycle = ['boss', 'leviathan', 'necro_boss', 'hydra_boss', 'beholder_boss'];
        const bIdx = (Math.floor(wave / 5) - 1) % bossCycle.length;
        const bType = bossCycle[bIdx];
        const bObj = spawnEnemy(bType, spawnPos(340, 440, 60));
        if (wave >= 20) {
          const secondType = bossCycle[(bIdx + 1) % bossCycle.length];
          spawnEnemy(secondType, spawnPos(360, 460, 60));
          banner = { txt: 'ONDA ' + wave + ' • PANTEÃO DUPLO', sub: MON[bObj.type].bossName + ' & ' + MON[secondType].bossName + '!', life: 3.5, max: 3.5, boss: true };
        } else {
          banner = { txt: 'ONDA ' + wave, sub: 'CHEFÃO: ' + MON[bObj.type].bossName + '!', life: 3.2, max: 3.2, boss: true };
        }
        SFX.boss();
      } else {
        if (waveEvent === 'ambush') {
          const ringCnt = Math.min(14, 7 + Math.floor(wave * 0.6));
          const ambType = pick(['bat', 'snake', 'viper', 'slime']);
          for (let i = 0; i < ringCnt; i++) {
            const ang = (i * Math.PI * 2) / ringCnt;
            const rx = clamp(p.x + Math.cos(ang) * 280, 80, WORLD.w - 80);
            const ry = clamp(p.y + Math.sin(ang) * 240, 120, WORLD.h - 60);
            spawnEnemy(ambType, { x: rx, y: ry }, { noElite: true });
          }
        } else if (waveEvent === 'bounty') {
          spawnEnemy(pick(['golem', 'necromancer', 'bigworm', 'sniper']), spawnPos(300, 420, 40), { forceElite: true, bounty: true });
        }
        const evSub = waveEvent === 'meteors' ? '☄ EVENTO: CHUVA DE METEOROS!'
          : waveEvent === 'golden' ? '✦ EVENTO: INVASÃO DOURADA!'
          : waveEvent === 'swarm' ? '⚡ EVENTO: ENXAME FRENÉTICO!'
          : waveEvent === 'bloodmoon' ? '🩸 LUA DE SANGUE: INIMIGOS FEROZES + DOBRO DE RECOMPENSAS!'
          : waveEvent === 'ambush' ? '⚔ CERCO RELÂMPAGO: QUEBRE O CÍRCULO INIMIGO!'
          : waveEvent === 'bounty' ? '🎯 CAÇADA AO COMANDANTE: DERROTE O ALVO P/ +1 NÍVEL!'
          : (wave === 1 ? 'Sobreviva!' : 'Prepare-se!');
        banner = { txt: 'ONDA ' + wave, sub: evSub, life: 2.6, max: 2.6, boss: waveEvent === 'meteors' || waveEvent === 'bloodmoon' };
        SFX.wave();
      }
      if (wave > 1) p.hp = Math.min(stats.maxHp, p.hp + 1);
      if (wave >= 2 && (wave % 2 === 0 || shrines.length === 0)) spawnShrine();
      refillBarrels(15);
      waveTimer = 2.4;
    }
  }
  if (toSpawn > 0) {
    spawnTimer -= dt;
    const cap = (waveEvent === 'swarm' ? 52 : 38) + wave * 2;
    if (spawnTimer <= 0 && enemies.length < cap) {
      const groupSize = (wave >= 3 && (waveEvent === 'swarm' || Math.random() < 0.28)) ? randi(3, 5) : 1;
      const kind = wavePool();
      if (groupSize > 1 && kind !== 'flower' && kind !== 'bigworm' && kind !== 'golem' && kind !== 'necromancer') {
        const c = spawnPos(Math.max(W, H) * 0.55, Math.max(W, H) * 0.7, 30);
        for (let i = 0; i < groupSize && toSpawn > 0; i++) { spawnEnemy(kind, { x: c.x + rand(-40, 40), y: c.y + rand(-40, 40) }); toSpawn--; }
      } else { spawnEnemy(kind); toSpawn--; }
      const baseRate = Math.max(0.18, 0.90 - wave * 0.052);
      spawnTimer = waveEvent === 'swarm' ? baseRate * 0.65 : baseRate;
    }
  }

  // ---------- DUENDE DO TESOURO (Aparição Surpresa no Meio da Partida) ----------
  if (wave >= 2 && (toSpawn > 0 || enemies.length > 3)) {
    p.goblinT = (p.goblinT || 20) - dt;
    if (p.goblinT <= 0) {
      p.goblinT = rand(36, 54);
      if (!enemies.some(e => e.type === 'goblin') && Math.random() < 0.65) {
        const g = spawnEnemy('goblin', spawnPos(280, 420, 30), { noElite: true });
        SFX.coin();
        texts.push({ x: g.x, y: g.y - 60, txt: '💰 DUENDE DO TESOURO APARECEU!', life: 2.2, color: '#ffd23f', size: 13 });
      }
    }
  }

  // ---------- CHUVA DE METEOROS (EVENTO DE ONDA) ----------
  if (waveEvent === 'meteors' && (toSpawn > 0 || enemies.length > 0)) {
    meteorTimer -= dt;
    if (meteorTimer <= 0) {
      meteorTimer = rand(1.1, 1.9);
      const targetPos = enemies.length && Math.random() < 0.55 ? pick(enemies) : p;
      const mx0 = clamp(targetPos.x + rand(-140, 140), 100, WORLD.w - 100);
      const my0 = clamp(targetPos.y + rand(-120, 120), 130, WORLD.h - 70);
      hazards.push({ kind: 'meteor', x: mx0, y: my0, r: 78, t: 0, dur: 1.35 });
    }
  }
  for (const h of hazards) {
    h.t += dt;
    if (h.kind === 'fallen_star') {
      const k = Math.min(1, h.t / h.dur);
      h.curX = h.startX + (h.targetX - h.startX) * k;
      h.curY = h.startY + (h.targetY - h.startY) * k;
      if (Math.random() < 0.6) {
        particles.push({ x: h.curX, y: h.curY, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.35, max: 0.35, color: '#8ef5ff', size: 3 });
      }
      if (h.t >= h.dur) {
        h.dead = true;
        shake = Math.max(shake, 12);
        SFX.explode();
        fxRings.push({ kind: 'nova', x: h.targetX, y: h.targetY, r: 10, maxR: 125, life: 0.35, max: 0.35, col: '#62f6ff' });
        burst(h.targetX, h.targetY, '#ffe042', 25, 240);
        burst(h.targetX, h.targetY, '#7bf5ff', 25, 260);
        for (const e of enemies) {
          if (!e.dead && Math.hypot(e.x - h.targetX, e.y - h.targetY) < 125 + e.r) {
            damageEnemy(e, 85 + wave * 5, h.targetX, h.targetY, 520, { color: '#62f6ff' });
          }
        }
        pickups.push({ kind: 'star', x: h.targetX, y: h.targetY, z: 20, vz: 180, vx: rand(-35, 35), vy: rand(-35, 35), t: 0 });
      }
      continue;
    }
    if (h.t >= h.dur) {
      h.dead = true;
      triggerExplosion(h.x, h.y, h.r, 7 + wave, false);
    }
  }
  hazards = hazards.filter(h => !h.dead);

  // ---------- SANTUÁRIOS MÍSTICOS ----------
  for (const sh of shrines) {
    sh.t += dt;
    const inside = Math.hypot(p.x - sh.x, p.y - sh.y) < sh.r + 14;
    if (inside) {
      sh.prog = Math.min(1, sh.prog + dt / 1.65);
      if (Math.random() < 0.5) particles.push({ x: sh.x + rand(-sh.r, sh.r), y: sh.y + rand(-20, 15), vx: 0, vy: -55, life: 0.45, max: 0.45, color: sh.col, size: 4 });
      if (sh.prog >= 1) {
        sh.dead = true;
        SFX.shrine();
        shake = Math.max(shake, 10);
        fxRings.push({ kind: 'nova', x: sh.x, y: sh.y, r: 16, maxR: 190, life: 0.45, max: 0.45, col: sh.col });
        banner = { txt: sh.name + '!', sub: sh.sub, life: 2.0, max: 2.0, small: true };
        if (sh.id === 'frenzy') {
          p.frenzyT = 10;
        } else if (sh.id === 'shield') {
          p.shields = Math.min(4, (p.shields || 0) + 2);
          p.hp = Math.min(stats.maxHp, p.hp + 2);
        } else if (sh.id === 'fortune') {
          for (let i = 0; i < 14; i++) dropItem('coin', sh.x, sh.y);
          for (let i = 0; i < 2; i++) dropItem('ruby', sh.x, sh.y);
          dropItem('potion', sh.x, sh.y);
          for (const k of pickups) if (k.kind !== 'chest') k.pull = true;
        } else if (sh.id === 'storm') {
          p.ultMeter = Math.min(100, p.ultMeter + 45);
          let count = 0;
          for (const e of enemies) {
            if (!e.dead && e.spawn <= 0 && count < 12) {
              bolts.push({ pts: [e.x + rand(-25, 25), e.y - 520, e.x, e.y - e.r], life: 0.35 });
              damageEnemy(e, 6 + stats.dmg * 2, sh.x, sh.y, 260, { color: '#fff36b', noFreeze: true, silent: true });
              count++;
            }
          }
        } else if (sh.id === 'pact') {
          if (p.hp > 2) {
            p.hp -= 2;
            shake = Math.max(shake, 14);
            burst(p.x, p.y - 36, '#ff2a55', 24, 240);
          }
          stats.dmg += 1;
          stats.crit += 0.06;
          p.pendingLevels += 1;
          p.inv = Math.max(p.inv, 1.2);
        } else if (sh.id === 'cursed') {
          for (let i = 0; i < 4; i++) {
            const ang = (i * Math.PI) / 2 + rand(-0.2, 0.2);
            const ex = clamp(sh.x + Math.cos(ang) * 190, 80, WORLD.w - 80);
            const ey = clamp(sh.y + Math.sin(ang) * 170, 120, WORLD.h - 60);
            spawnEnemy(pick(['bomber', 'viper', 'sniper', 'snake']), { x: ex, y: ey }, { forceElite: true });
          }
          for (let i = 0; i < 12; i++) dropItem('coin', sh.x, sh.y);
          for (let i = 0; i < 3; i++) dropItem('ruby', sh.x, sh.y);
          dropItem('chest', sh.x, sh.y);
        }
      }
    } else {
      sh.prog = Math.max(0, sh.prog - dt * 0.35);
    }
  }
  shrines = shrines.filter(s => !s.dead);

  // ---------- INPUT & MOVIMENTO ----------
  let mx = 0, my = 0;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (touch.joyDist > 0.08) { mx = touch.joyX; my = touch.joyY; }

  // Entrada de Controle (Analógico Esquerdo / D-Pad)
  if (gpState && (Math.abs(gpState.moveX) > 0.05 || Math.abs(gpState.moveY) > 0.05)) {
    mx = gpState.moveX;
    my = gpState.moveY;
  }
  const ml = Math.hypot(mx, my);

  // Entrada de Mira: Stick Direito (360° twin-stick) tem prioridade, senão direção do movimento
  if (gpState && gpState.hasAim) {
    p.aim = gpState.aimAngle;
  } else if (ml > 0.05) {
    p.aim = Math.atan2(my, mx);
  }

  p.inv = Math.max(0, p.inv - dt);
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.frenzyT = Math.max(0, p.frenzyT - dt);
  p.ironskinT = Math.max(0, (p.ironskinT || 0) - dt);
  p.thornsT = Math.max(0, (p.thornsT || 0) - dt);
  p.starTimer = (p.starTimer || 5) - dt;
  if (p.starTimer <= 0) {
    p.starTimer = rand(7, 13);
    spawnTerrariaFallenStar();
  }
  p.comboT -= dt;
  if (p.comboT <= 0) { p.combo = 0; p.bestStreakMilestone = 0; }

  if (p.frenzyT > 0 && Math.random() < 0.45) {
    particles.push({ x: p.x + rand(-14, 14), y: p.y - rand(5, 55), vx: rand(-20, 20), vy: -50, life: 0.32, max: 0.32, color: pick(['#ffd23f', '#ff6438', '#ffffff']), size: rand(3, 5) });
  }

  // Ultimate (Teclado E/L/Q, Gatilho/Botão Y/X no Controle, ou Botão Touch ULT)
  const trigUlt = anyPressed('e', 'l', 'q') || (gpState && gpState.ultJust) || touch.justUlt;
  if (trigUlt && p.ultMeter >= 100 && !p.ult) {
    p.ult = { t: 0, dur: 2.6, tick: 0 };
    p.ultMeter = 0; p.attack = null; p.dash = null;
    SFX.ult();
    gamepadRumble(0.6, 0.8, 320);
    shake = 16;
    banner = { txt: p.char.ultName + '!', life: 1.4, max: 1.4, small: true };
  }

  // Ataque (Teclado Espaço/J, Mouse Clique, Gatilhos RT / RB no Controle, ou Botão Touch ATACAR)
  const gpAtkHold = gpState ? gpState.attackHold : false;
  const gpAtkJust = gpState ? gpState.attackJust : false;
  const holdAttack = keys[' '] || keys['j'] || mouse.down || gpAtkHold || touch.isAtkDown;
  if ((holdAttack || mouse.click || gpAtkJust || touch.justAtk) && !p.attack && !p.dash && !p.ult && p.attackCd <= 0) {
    startAttack(mouse.down || mouse.click, touch.isAtkDown || touch.justAtk);
  }

  // Giro / Esquiva (Teclado Shift/K, Botão Dir do Mouse, Gatilho LT / LB / B no Controle, ou Botão Touch GIRO)
  const gpDash = gpState ? gpState.dashJust : false;
  if ((anyPressed('shift', 'k') || mouse.rclick || gpDash || touch.justDash) && !p.dash && !p.ult && p.dashCd <= 0) {
    let dx = mx, dy = my;
    if (!dx && !dy) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); }
    if (Math.abs(dx) > 0.05) p.flip = dx < 0;
    if (Math.abs(dx) > Math.abs(dy)) p.dir = dx > 0 ? 'right' : 'left';
    else p.dir = dy > 0 ? 'down' : 'up';
    p.dash = { t: 0, dur: 0.3, dx, dy, hit: new Set(), dodged: false };
    p.attack = null;
    p.dashCd = stats.dashCd;
    p.inv = Math.max(p.inv, 0.36);
    SFX.dash();
    gamepadRumble(0.2, 0.3, 90);
  }

  let speed = stats.speed * (p.frenzyT > 0 ? 1.3 : 1);
  if (p.attack && p.char.weaponType === 'saber') speed *= 0.62;
  if (p.dash) {
    p.dash.t += dt;
    p.x += p.dash.dx * 650 * dt; p.y += p.dash.dy * 650 * dt;
    const dashCol = p.char.weaponType === 'orange' ? '#ff7e14' : p.char.weaponType === 'star' ? '#ffe042' : SABER_COLORS[saberColorIndex].blade;
    particles.push({ x: p.x + rand(-12, 12), y: p.y - rand(0, 14), vx: 0, vy: -20, life: 0.32, max: 0.32, color: dashCol, size: 5 });

    // Rastro Fantasma (Afterimage)
    p.ghostT -= dt;
    if (p.ghostT <= 0) {
      p.ghostT = 0.042;
      const pf = playerFrame();
      afterimages.push({ char: p.char, f: pf.f, x: p.x, y: p.y, flip: pf.flip, life: 0.24, max: 0.24 });
    }

    // Dano de Giro Cortante em inimigos e barris
    for (const e of enemies) if (!e.dead && !p.dash.hit.has(e) && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 38) {
      p.dash.hit.add(e);
      damageEnemy(e, stats.dashDmg, p.x, p.y, 520);
    }
    for (const b of props) if (!b.dead && !p.dash.hit.has(b) && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 34) {
      p.dash.hit.add(b);
      hitBarrel(b);
    }

    // Esquiva Perfeita ao atravessar projéteis inimigos com o Giro!
    for (const eb of ebullets) {
      if (!eb.dead && Math.hypot(eb.x - p.x, eb.y - (p.y - 34)) < eb.r + 28) {
        eb.dead = true;
        burst(eb.x, eb.y, '#7fe0ff', 12, 220);
        if (!p.dash.dodged) {
          p.dash.dodged = true;
          p.ultMeter = Math.min(100, p.ultMeter + 15);
          score += 50;
          SFX.dodge();
          gamepadRumble(0.25, 0.45, 110);
          fxRings.push({ kind: 'nova', x: p.x, y: p.y - 28, r: 10, maxR: 95, life: 0.24, max: 0.24, col: '#7fe0ff' });
          texts.push({ x: p.x, y: p.y - 115, txt: 'ESQUIVA PERFEITA! +15% FÚRIA', life: 1.0, color: '#7fe0ff', size: 10 });
        }
      }
    }
    if (p.dash.t >= p.dash.dur) p.dash = null;
  } else {
    p.x += mx * speed * dt; p.y += my * speed * dt;
    if (p.frenzyT > 0 && ml > 0) {
      p.ghostT -= dt;
      if (p.ghostT <= 0) {
        p.ghostT = 0.085;
        const pf = playerFrame();
        afterimages.push({ char: p.char, f: pf.f, x: p.x, y: p.y, flip: pf.flip, life: 0.18, max: 0.18 });
      }
    }
  }
  p.moving = ml > 0;
  if (p.moving) {
    p.idleT = 0;
    if (!p.attack) {
      if (Math.abs(mx) > Math.abs(my) + 0.05) p.dir = mx > 0 ? 'right' : 'left';
      else p.dir = my > 0 ? 'down' : 'up';
      if (Math.abs(mx) > 0.05) p.flip = mx < 0;
    }
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = 0.18;
      particles.push({ x: p.x + rand(-8, 8), y: p.y, vx: rand(-20, 20), vy: -10, life: 0.4, max: 0.4, color: 'rgba(200,180,140,0.6)', size: 4 });
    }
  } else {
    p.idleT += dt;
  }
  collideStatic(p, 14);
  p.animT += dt;

  // ---------- ATAQUE MELEE (Manguinha Sabre) ----------
  if (p.attack) {
    p.attack.t += dt;
    const prog = p.attack.t / p.attack.dur;
    if (p.char.weaponType === 'saber' && prog > 0.05 && prog < 0.78) {
      const range = 96 * stats.range;
      const arcHalf = 1.38 + (stats.multi || 0) * 0.35;
      const cx = p.x, cy = p.y - 35;
      const inArc = (x, y, rr) => {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d > range + rr) return false;
        if (d < 32 || Math.abs(angDiff(Math.atan2(dy, dx), p.aim)) < arcHalf) return true;
        if (stats.multi >= 3 && Math.abs(angDiff(Math.atan2(dy, dx), p.aim + Math.PI)) < 1.1) return true;
        return false;
      };
      const meleeDmg = stats.dmg + (stats.multi >= 2 ? 1 : 0);
      for (const e of enemies) {
        if (e.dead || p.attack.hit.has(e)) continue;
        if (inArc(e.x, e.y - e.r, e.r)) { p.attack.hit.add(e); damageEnemy(e, meleeDmg, p.x, p.y - 20); }
      }
      for (const b of props) {
        if (b.dead || p.attack.hit.has(b)) continue;
        if (inArc(b.x, b.y - 20, b.r)) { p.attack.hit.add(b); hitBarrel(b); }
      }
      for (const b of ebullets) {
        if (b.dead) continue;
        if (inArc(b.x, b.y, b.r + 14)) {
          b.dead = true;
          const sp = Math.hypot(b.vx, b.vy) * 1.65;
          pshots.push({ kind: 'orb', x: b.x, y: b.y, vx: Math.cos(p.aim) * sp, vy: Math.sin(p.aim) * sp, r: b.r + 3, dmg: stats.dmg * 2 + 2, pierce: 3, life: 2, hit: new Set() });
          SFX.reflect();
          burst(b.x, b.y, SABER_COLORS[saberColorIndex].hex, 10, 220);
          texts.push({ x: b.x, y: b.y - 20, txt: 'REBATIDA!', life: 0.7, color: '#7ff', size: 9 });
          score += 15;
        }
      }
    }
    if (p.attack.t >= p.attack.dur) { p.attack = null; p.attackCd = 0.03; }
  }

  // ---------- ULTIMATE UPDATE ----------
  if (p.ult) {
    p.ult.t += dt; p.ult.tick -= dt;
    p.inv = Math.max(p.inv, 0.2);
    if (p.ult.tick <= 0) {
      p.ult.tick = 0.12;
      const R = 200 * stats.range;
      if (p.char.weaponType === 'star') {
        for (let i = 0; i < 4; i++) {
          const a = rand(0, Math.PI * 2);
          pshots.push({
            kind: 'star', x: p.x, y: p.y - 30, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600,
            r: 20 * stats.range, dmg: stats.dmg + 2, pierce: 3, life: 1.0, rot: 0, hit: new Set()
          });
        }
        SFX.starThrow();
      } else if (p.char.weaponType === 'orange') {
        for (let i = 0; i < 5; i++) {
          const a = rand(0, Math.PI * 2);
          pshots.push({
            kind: 'orange', x: p.x, y: p.y - 30, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620,
            r: 18 * stats.range, dmg: stats.dmg + 2, pierce: 1, life: 1.1, rot: 0, hit: new Set()
          });
        }
        SFX.orangeThrow();
      } else {
        slashes.push({ a: rand(0, Math.PI * 2), life: 0.22, max: 0.22, r: rand(60, R), follow: true, big: true });
        for (const e of enemies) if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) damageEnemy(e, stats.dmg, p.x, p.y, 250, { silent: true, noFreeze: true });
        if (Math.random() < 0.5) SFX.slash();
      }
      for (const b of props) if (!b.dead && Math.hypot(b.x - p.x, b.y - p.y) < R) hitBarrel(b);
      for (const b of ebullets) if (Math.hypot(b.x - p.x, b.y - p.y) < R) { b.dead = true; burst(b.x, b.y, '#9ff', 4, 120); }
      SFX.hit(); shake = Math.max(shake, 6);
    }
    if (p.ult.t >= p.ult.dur) p.ult = null;
  }

  // ---------- HABILIDADES PASSIVAS ----------
  if (stats.aegis > 0 && (p.shields || 0) < stats.aegis) {
    p.aegisT -= dt;
    if (p.aegisT <= 0) {
      p.aegisT = Math.max(7, 16 - stats.aegis * 2.5);
      p.shields = (p.shields || 0) + 1;
      beep(880, 0.1, 'sine', 0.04, 320);
      texts.push({ x: p.x, y: p.y - 105, txt: '+ESCUDO!', life: 0.8, color: '#6ee7ff', size: 10 });
    }
  }
  if (stats.axe > 0) {
    p.axeT -= dt;
    if (p.axeT <= 0 && enemies.length > 0) {
      p.axeT = Math.max(0.95, 2.2 - stats.axe * 0.22);
      let target = null, md = 520;
      for (const e of enemies) {
        if (e.dead || e.spawn > 0 || ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded)) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < md) { md = d; target = e; }
      }
      const baseAng = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.aim;
      const isAwakened = stats.axe >= 4;
      for (const an of spreadAngles(baseAng, stats.axe, 0.35)) {
        pshots.push({
          kind: 'axe', x: p.x, y: p.y - 34,
          vx: Math.cos(an) * (isAwakened ? 510 : 460), vy: Math.sin(an) * (isAwakened ? 510 : 460),
          ox: Math.cos(an), oy: Math.sin(an),
          r: isAwakened ? 24 : 18, dmg: stats.dmg + 1 + Math.floor(stats.axe / 2) + (isAwakened ? 2 : 0),
          pierce: 99, life: isAwakened ? 1.85 : 1.55, age: 0, rot: 0, hit: new Set()
        });
      }
      play('swing2', 0.32, 0.2);
    }
  }
  if (stats.fire > 0) {
    const isAwakened = stats.fire >= 5;
    p.fireAng += dt * (2.6 + stats.fire * 0.22 + (isAwakened ? 0.5 : 0));
    const n = stats.fire, R = isAwakened ? 92 : 80;
    for (let i = 0; i < n; i++) {
      const a = p.fireAng + i * Math.PI * 2 / n;
      const fx = p.x + Math.cos(a) * R, fy = p.y - 35 + Math.sin(a) * R * 0.8;
      if (Math.random() < 0.5) particles.push({ x: fx, y: fy, vx: rand(-20, 20), vy: rand(-50, -10), life: 0.3, max: 0.3, color: pick(['#ffb02e', '#ff5a1f', '#ffe36b']), size: rand(3, 6) });
      for (const e of enemies) {
        if (e.dead || e.fireHit > time) continue;
        if (Math.hypot(e.x - fx, e.y - e.r - fy) < e.r + (isAwakened ? 22 : 16)) {
          e.fireHit = time + (isAwakened ? 0.35 : 0.45);
          damageEnemy(e, 1 + Math.floor(stats.fire / 2) + (isAwakened ? 1 : 0), fx, fy, 200, { color: '#ff8a2e', noFreeze: true, silent: true });
        }
      }
    }
  }
  if (stats.bolt > 0) {
    p.boltT -= dt;
    if (p.boltT <= 0) {
      const isAwakened = stats.bolt >= 5;
      p.boltT = Math.max(0.68, 2.5 - stats.bolt * 0.32);
      let from = null, hitSet = new Set();
      let target = null, bd = 520;
      for (const e of enemies) { if (e.dead || e.spawn > 0 || ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; target = e; } }
      let jumps = stats.bolt + (isAwakened ? 2 : 0);
      while (target && jumps-- >= 0) {
        const pts = from ? [from.x, from.y - from.r, target.x, target.y - target.r] : [target.x + rand(-30, 30), target.y - 500, target.x, target.y - target.r];
        bolts.push({ pts, life: 0.25 });
        hitSet.add(target);
        if (isAwakened && !isBossType(target.type)) target.slow = Math.max(target.slow, 0.8);
        damageEnemy(target, 2 + Math.floor(stats.bolt / 2) + (isAwakened ? 2 : 0), target.x, target.y - 10, 100, { color: '#fff36b', noFreeze: true, silent: true });
        from = target; target = null; let nd = 210;
        for (const e of enemies) { if (e.dead || hitSet.has(e) || e.spawn > 0 || ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < nd) { nd = d; target = e; } }
      }
      if (hitSet.size) { beep(900, 0.12, 'sawtooth', 0.04, -700); shake = Math.max(shake, 4); }
    }
  }
  const iceR = stats.ice ? 85 + stats.ice * 20 : 0;
  if (stats.ice > 0) {
    p.iceT -= dt;
    const tick = p.iceT <= 0;
    const isAwakened = stats.ice >= 4;
    if (tick) p.iceT = Math.max(0.48, 1.15 - stats.ice * 0.14);
    for (const e of enemies) {
      if (e.dead || e.spawn > 0 || ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded)) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < iceR + e.r) {
        e.slow = Math.max(e.slow, 0.35);
        if (tick) {
          if (isAwakened && !isBossType(e.type) && Math.random() < 0.28) e.freezeT = Math.max(e.freezeT || 0, 1.1);
          damageEnemy(e, isAwakened ? 2 : 1, undefined, undefined, 0, { color: '#bff', noFreeze: true, silent: true, noCrit: true });
        }
      }
    }
    if (Math.random() < 0.4) {
      const a = rand(0, Math.PI * 2), rr = rand(0, iceR);
      particles.push({ x: p.x + Math.cos(a) * rr, y: p.y + Math.sin(a) * rr * 0.6, vx: 0, vy: -25, life: 0.6, max: 0.6, color: '#dff6ff', size: 3 });
    }
  }
  if (stats.earth > 0) {
    p.earthT -= dt;
    if (p.earthT <= 0) {
      p.earthT = Math.max(2.6, 4.5 - stats.earth * 0.45);
      const eR = 120 + stats.earth * 38;
      shake = Math.max(shake, 8);
      beep(120, 0.3, 'sawtooth', 0.08, -80);
      fxRings.push({ kind: 'nova', x: p.x, y: p.y, r: 20, maxR: eR, life: 0.32, max: 0.32, col: '#d49a62' });
      burst(p.x, p.y, '#99734e', 24, 280);
      for (const e of enemies) {
        if (!e.dead && e.spawn <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < eR + e.r) {
          damageEnemy(e, 2 + stats.earth, p.x, p.y, 400, { color: '#c79867' });
          e.slow = Math.max(e.slow, 0.9);
        }
      }
      texts.push({ x: p.x, y: p.y - 60, txt: 'TREMOR!', life: 0.8, color: '#e0a96d', size: 12 });
    }
  }
  if (stats.phantom > 0) {
    p.phantomT -= dt;
    if (p.phantomT <= 0) {
      const isAwakened = stats.phantom >= 4;
      p.phantomT = Math.max(0.95, 2.7 - stats.phantom * 0.4);
      let target = null, md = 460;
      for (const e of enemies) {
        if (e.dead || e.spawn > 0 || ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded)) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < md) { md = d; target = e; }
      }
      if (target) {
        const cnt = stats.phantom + (isAwakened ? 1 : 0);
        for (let i = 0; i < cnt; i++) {
          const an = Math.atan2(target.y - p.y, target.x - p.x) + rand(-0.3, 0.3);
          pshots.push({
            kind: 'dagger', x: p.x, y: p.y - 30, vx: Math.cos(an) * 460, vy: Math.sin(an) * 460,
            r: 10, dmg: stats.dmg + 2 + (isAwakened ? 1 : 0), pierce: isAwakened ? 2 : 1, life: 1.8, target, hit: new Set()
          });
        }
        play('swing1', 0.3, 0.2);
      }
    }
  }
  if (stats.vortex > 0) {
    p.vortexT = (p.vortexT || 3.5) - dt;
    if (p.vortexT <= 0 && enemies.length > 0) {
      p.vortexT = Math.max(3.2, 5.8 - stats.vortex * 0.55);
      let vTarget = null, md = 420;
      for (const e of enemies) {
        if (e.dead || e.spawn > 0) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < md) { md = d; vTarget = e; }
      }
      const vx0 = vTarget ? vTarget.x : p.x + Math.cos(p.aim) * 140;
      const vy0 = vTarget ? vTarget.y : p.y + Math.sin(p.aim) * 140;
      puddles.push({ kind: 'vortex', x: vx0, y: vy0, r: 82 + stats.vortex * 18, life: 2.4, max: 2.4, tick: 0.25 });
      beep(220, 0.25, 'sine', 0.05, -120);
    }
  }

  // ---------- POÇAS CÍTRICAS (Tuiuba), VÓRTICE ABISSAL & ÁCIDO TÓXICO ----------
  for (const pd of puddles) {
    pd.life -= dt; pd.tick -= dt;
    if (pd.kind === 'vortex') {
      for (const e of enemies) {
        if (e.dead || e.spawn > 0) continue;
        const dx = pd.x - e.x, dy = pd.y - e.y, d = Math.hypot(dx, dy);
        if (d < pd.r * 1.45 && d > 8) {
          const pullStr = (isBossType(e.type) ? 45 : 195) * dt;
          e.x += (dx / d) * pullStr;
          e.y += (dy / d) * pullStr;
        }
      }
      if (Math.random() < 0.5) {
        const a = rand(0, Math.PI * 2), rr = rand(12, pd.r);
        particles.push({ x: pd.x + Math.cos(a) * rr, y: pd.y + Math.sin(a) * rr * 0.6, vx: -Math.cos(a) * 65, vy: -Math.sin(a) * 45, life: 0.3, max: 0.3, color: pick(['#d26bff', '#7a28ff', '#ffffff']), size: 3 });
      }
      if (pd.tick <= 0) {
        pd.tick = 0.42;
        for (const e of enemies) {
          if (!e.dead && e.spawn <= 0 && Math.hypot(e.x - pd.x, e.y - pd.y) < pd.r + e.r * 0.5) {
            e.slow = Math.max(e.slow, 0.4);
            damageEnemy(e, 1 + Math.floor((stats.vortex || 1) / 2), pd.x, pd.y, -80, { color: '#d26bff', noFreeze: true, silent: true, noCrit: true });
          }
        }
      }
    } else if (pd.kind === 'acid') {
      if (Math.hypot(p.x - pd.x, p.y - pd.y) < pd.r + 10) {
        hurtPlayer(1, pd.x, pd.y);
      }
    } else if (pd.tick <= 0) {
      pd.tick = 0.45;
      for (const e of enemies) {
        if (!e.dead && e.spawn <= 0 && Math.hypot(e.x - pd.x, e.y - pd.y) < pd.r + e.r * 0.5) {
          e.slow = Math.max(e.slow, 0.45);
          damageEnemy(e, 1, undefined, undefined, 0, { color: '#ff9a1f', noFreeze: true, silent: true, noCrit: true });
        }
      }
    }
  }
  puddles = puddles.filter(pd => pd.life > 0);

  // ---------- BARRIS EM CADEIA ----------
  for (const b of props) {
    if (!b.dead && b.kind === 'tnt' && Math.random() < 0.25) {
      particles.push({ x: b.x + rand(-4, 4), y: b.y - 52, vx: rand(-18, 18), vy: rand(-45, -15), life: 0.25, max: 0.25, color: pick(['#ffe042', '#ff5a1f']), size: 3 });
    }
    if (!b.dead && b.chainDelay !== undefined) {
      b.chainDelay -= dt;
      if (b.chainDelay <= 0) { delete b.chainDelay; b.hp = 1; hitBarrel(b); }
    }
  }

  // ---------- INIMIGOS UPDATE ----------
  for (const e of enemies) updateEnemy(e, dt);
  enemies = enemies.filter(e => !e.dead);

  // ---------- PROJÉTEIS & DISPAROS ----------
  for (const b of ebullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0 || b.x < 0 || b.y < 0 || b.x > WORLD.w || b.y > WORLD.h) b.dead = true;
    if (!b.dead && Math.hypot(b.x - p.x, b.y - (p.y - 35)) < b.r + 16) { b.dead = true; hurtPlayer(1, b.x, b.y); }
  }
  ebullets = ebullets.filter(b => !b.dead);

  for (const s of pshots) {
    if (s.kind === 'axe') {
      s.age += dt;
      s.rot += dt * 20;
      if (s.age > 0.52) {
        const retAng = Math.atan2((p.y - 34) - s.y, p.x - s.x);
        s.vx += Math.cos(retAng) * 1450 * dt;
        s.vy += Math.sin(retAng) * 1450 * dt;
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > 540) { s.vx = (s.vx / sp) * 540; s.vy = (s.vy / sp) * 540; }
        if (s.age > 0.7 && Math.hypot(p.x - s.x, (p.y - 34) - s.y) < 30) s.dead = true;
        if (s.age > 0.52 && !s.resetHit) { s.resetHit = true; s.hit.clear(); }
      }
    }
    if (s.kind === 'dagger' && s.target && !s.target.dead) {
      const ta = Math.atan2(s.target.y - s.y, s.target.x - s.x);
      s.vx += Math.cos(ta) * 900 * dt; s.vy += Math.sin(ta) * 900 * dt;
      const sp = Math.hypot(s.vx, s.vy);
      if (sp > 480) { s.vx = (s.vx / sp) * 480; s.vy = (s.vy / sp) * 480; }
    }
    if (s.kind === 'star') {
      s.rot += dt * 15;
      if (Math.random() < 0.45) {
        particles.push({ x: s.x, y: s.y, vx: rand(-15, 15), vy: rand(-15, 15), life: 0.25, max: 0.25, color: '#ffe769', size: 3 });
      }
    }
    if (s.kind === 'orange') {
      s.rot += dt * 18;
      if (Math.random() < 0.5) {
        particles.push({ x: s.x, y: s.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, color: pick(['#ff9214', '#ffa834', '#ff7000', '#ffd65c']), size: rand(3, 5) });
      }
    }
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0) s.dead = true;
    for (const e of enemies) {
      if (s.dead || e.dead || s.hit.has(e)) continue;
      if (Math.hypot(e.x - s.x, e.y - e.r - s.y) < e.r + s.r) {
        s.hit.add(e);
        if (s.kind === 'orange') {
          SFX.orangePop();
          burst(s.x, s.y, '#ff8a14', 16, 260);
          burst(s.x, s.y, '#ffd242', 10, 200);
          fxRings.push({ kind: 'orange_splash', x: s.x, y: s.y, r: 22, maxR: 70 * stats.range, life: 0.28, max: 0.28, col: '#ff8a14' });
          if (puddles.length < 18) puddles.push({ x: s.x, y: e.y, r: 42 * stats.range, life: 2.0, max: 2.0, tick: 0.35 });
          shake = Math.max(shake, 4);
          for (const o of enemies) {
            if (!o.dead && o !== e && Math.hypot(o.x - s.x, o.y - s.y) < 72 * stats.range) {
              damageEnemy(o, Math.max(1, Math.round(s.dmg * 0.6)), s.x, s.y, 180, { color: '#ff8a14', noFreeze: true, silent: true });
            }
          }
        }
        const col = s.kind === 'orange' ? '#ff8a14' : s.kind === 'star' ? '#ffe042' : s.kind === 'axe' ? '#e6eef8' : s.kind === 'dagger' ? '#ff3ad2' : SABER_COLORS[saberColorIndex].hex;
        damageEnemy(e, s.dmg, s.x - s.vx, s.y - s.vy, 250, { color: col, noFreeze: true });
        if (--s.pierce <= 0) s.dead = true;
      }
    }
    for (const b of props) if (!s.dead && !b.dead && !s.hit.has(b) && Math.hypot(b.x - s.x, b.y - 20 - s.y) < b.r + s.r) { s.hit.add(b); hitBarrel(b); if (s.kind === 'orange') s.dead = true; }
  }
  pshots = pshots.filter(s => !s.dead);
  props = props.filter(b => !b.dead);

  // ---------- ITENS & COLETÁVEIS ----------
  for (const k of pickups) {
    k.t += dt;
    k.vz -= 700 * dt; k.z += k.vz * dt;
    if (k.z < 0) { k.z = 0; k.vz = -k.vz * 0.4; k.vx *= 0.5; k.vy *= 0.5; }
    k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= 0.95; k.vy *= 0.95;
    const d = Math.hypot(p.x - k.x, p.y - 20 - k.y);
    const mag = k.kind === 'chest' ? 0 : stats.magnet;
    if (k.t > 0.35 && (d < mag || k.pull)) {
      k.pull = true;
      const sp = 360 + k.t * 250;
      k.x += (p.x - k.x) / Math.max(1, d) * sp * dt; k.y += (p.y - 20 - k.y) / Math.max(1, d) * sp * dt;
    }
    if (d < 28 && k.t > 0.22) collect(k);
    if (k.t > 28 && k.kind !== 'chest') k.dead = true;
  }
  pickups = pickups.filter(k => !k.dead);

  // ---------- PARTÍCULAS, ANÉIS, RASTROS & TEXTOS ----------
  for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; q.life -= dt; }
  particles = particles.filter(q => q.life > 0);
  if (particles.length > 950) particles.splice(0, particles.length - 950);
  for (const r of fxRings) r.life -= dt;
  fxRings = fxRings.filter(r => r.life > 0);
  for (const g of afterimages) g.life -= dt;
  afterimages = afterimages.filter(g => g.life > 0);
  for (const t of texts) { t.y -= 40 * dt; t.life -= dt; }
  texts = texts.filter(t => t.life > 0);
  for (const s of slashes) s.life -= dt;
  slashes = slashes.filter(s => s.life > 0);
  for (const b of bolts) b.life -= dt;
  bolts = bolts.filter(b => b.life > 0);
  for (const b of props) b.hurt = Math.max(0, b.hurt - dt);
  if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }

  if (p.pendingLevels > 0 && !p.ult && state === 'play') openLevelUp();

  // ---------- CÂMERA ----------
  cam.x += (p.x - cam.x) * Math.min(1, dt * 8);
  cam.y += (p.y - 40 - cam.y) * Math.min(1, dt * 8);
  clampCam();
  shake = Math.max(0, shake - dt * 40);
  trauma = Math.max(0, trauma - dt * 1.35);
}


// =====================================================================
//  TERRARIA FALLEN STAR HAZARD & MECHANIC (Star.cs)
// =====================================================================
function spawnTerrariaFallenStar(targetX, targetY) {
  if (!player || state !== 'play') return;
  const tx = targetX !== undefined ? targetX : clamp(player.x + rand(-240, 240), 90, WORLD.w - 90);
  const ty = targetY !== undefined ? targetY : clamp(player.y + rand(-180, 180), 90, WORLD.h - 90);
  const sx = tx + rand(-160, 160);
  const sy = ty - rand(420, 560);
  hazards.push({
    kind: 'fallen_star',
    x: tx, y: ty, r: 85,
    startX: sx, startY: sy,
    targetX: tx, targetY: ty,
    curX: sx, curY: sy,
    dur: 1.15, t: 0, dead: false
  });
}

function clampCam() {
  const z = (cam && cam.zoom) || getCamZoom();
  const halfW = (W / 2) / z, halfH = (H / 2) / z;
  cam.x = clamp(cam.x, Math.min(halfW, WORLD.w / 2), Math.max(WORLD.w - halfW, WORLD.w / 2));
  cam.y = clamp(cam.y, Math.min(halfH, WORLD.h / 2), Math.max(WORLD.h - halfH, WORLD.h / 2));
}

function hitBarrel(b) {
  if (b.dead) return;
  b.hp--; b.hurt = 0.15;
  SFX.barrel();
  burst(b.x, b.y - 25, b.kind === 'tnt' ? '#ff5533' : '#8a5a2b', 6, 160);
  if (b.hp <= 0) {
    b.dead = true;
    if (b.kind === 'tnt') {
      triggerExplosion(b.x, b.y - 10, 140, 8 + wave * 2, true);
      score += 20;
      if (Math.random() < 0.35) dropItem('coin', b.x, b.y);
      return;
    }
    burst(b.x, b.y - 25, '#6b4220', 16, 240);
    play('clang', 0.25, 0.3);
    const r = Math.random();
    if (r < 0.28) dropItem('potion', b.x, b.y);
    else if (r < 0.44) dropItem('ruby', b.x, b.y);
    else if (r < 0.54) dropItem(pick(['magnet_orb', 'frenzy_orb', 'ice_bomb']), b.x, b.y);
    for (let i = 0; i < randi(2, 4); i++) dropItem('coin', b.x, b.y);
    score += 5;
  }
}

function collect(k) {
  k.dead = true;
  const p = player;
  if (k.kind === 'coin') { coins++; score += 10; SFX.coin(); }
  else if (k.kind === 'gem') { gainXp(1); SFX.gem(); }
  else if (k.kind === 'ruby') { gainXp(5); SFX.gem(); beep(1600, 0.08, 'triangle', 0.04); }
  else if (k.kind === 'star') {
    SFX.ult();
    p.ultMeter = Math.min(100, (p.ultMeter || 0) + 35);
    p.frenzyT = Math.max(p.frenzyT || 0, 6);
    score += 50;
    texts.push({ x: p.x, y: p.y - 110, txt: '+35 FÚRIA! (Estrela Cadente)', life: 1.3, color: '#ffee55', size: 13 });
    burst(p.x, p.y - 40, '#ffee55', 20, 220);
  } else if (k.kind === 'potion') {
    p.hp = Math.min(stats.maxHp, p.hp + 2); SFX.potion();
    texts.push({ x: p.x, y: p.y - 110, txt: '+2 VIDA', life: 1, color: '#ff7a9c', size: 12 });
    burst(p.x, p.y - 40, '#ff7a9c', 14, 160);
  } else if (k.kind === 'magnet_orb') {
    SFX.magnet();
    for (const o of pickups) if (o.kind !== 'chest') o.pull = true;
    fxRings.push({ kind: 'nova', x: p.x, y: p.y - 25, r: 16, maxR: 220, life: 0.4, max: 0.4, col: '#57e2ff' });
    texts.push({ x: p.x, y: p.y - 115, txt: 'ÍMÃ GLOBAL!', life: 1.2, color: '#57e2ff', size: 13 });
  } else if (k.kind === 'frenzy_orb') {
    p.frenzyT = Math.max(p.frenzyT, 8);
    SFX.shrine();
    burst(p.x, p.y - 40, '#ff6438', 24, 240);
    texts.push({ x: p.x, y: p.y - 115, txt: 'MODO FRENESI!', life: 1.2, color: '#ff8a3d', size: 13 });
  } else if (k.kind === 'ice_bomb') {
    SFX.freezeBomb();
    shake = Math.max(shake, 10);
    fxRings.push({ kind: 'nova', x: p.x, y: p.y - 20, r: 20, maxR: 380, life: 0.45, max: 0.45, col: '#9beeff' });
    for (const e of enemies) {
      if (!e.dead && e.spawn <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < 420) {
        e.freezeT = 3.8; e.slow = 4.5;
        damageEnemy(e, 3 + stats.dmg, p.x, p.y, 120, { color: '#9beeff', noFreeze: true, silent: true });
      }
    }
    texts.push({ x: p.x, y: p.y - 115, txt: 'BOMBA GLACIAL!', life: 1.2, color: '#9beeff', size: 13 });
  } else if (k.kind === 'chest') {
    p.hp = stats.maxHp;
    p.pendingLevels += 1;
    p.ultMeter = 100;
    SFX.potion(); SFX.level();
    for (let i = 0; i < 12; i++) dropItem('coin', p.x, p.y - 10);
    for (let i = 0; i < 2; i++) dropItem('ruby', p.x, p.y - 10);
    burst(p.x, p.y - 40, '#ffd23f', 40, 320);
    texts.push({ x: p.x, y: p.y - 120, txt: 'TESOURO!', life: 1.5, color: '#ffd23f', size: 16 });
  }
}

function hurtPlayer(dmg, fx, fy) {
  const p = player;
  if (p.inv > 0 || p.ult || state !== 'play') return;
  if (p.shields > 0) {
    p.shields--;
    p.inv = 0.75;
    SFX.shieldBreak();
    gamepadRumble(0.3, 0.4, 150);
    shake = 8;
    fxRings.push({ kind: 'nova', x: p.x, y: p.y - 28, r: 16, maxR: 135, life: 0.3, max: 0.3, col: '#4fe3ff' });
    burst(p.x, p.y - 36, '#7fe8ff', 20, 260);
    for (const e of enemies) {
      if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 135 + e.r) {
        damageEnemy(e, 2 + (stats.aegis || 0) * 2, p.x, p.y, 480, { color: '#4fe3ff', noFreeze: true, silent: true });
      }
    }
    texts.push({ x: p.x, y: p.y - 115, txt: 'BLOQUEADO!', life: 0.9, color: '#7fe8ff', size: 13 });
    return;
  }
  if (dmg > 1 && stats.armor && Math.random() < stats.armor * 0.25) dmg = Math.max(1, dmg - 1);
  p.hp -= dmg;
  p.inv = stats.invTime;
  p.combo = 0; p.bestStreakMilestone = 0;
  shake = 14; freeze = 0.08; addTrauma(0.55);
  SFX.hurt();
  gamepadRumble(0.45, 0.75, 230);
  burst(p.x, p.y - 40, '#ff4d4d', 16, 220);
  const a = Math.atan2(p.y - fy, p.x - fx);
  p.x += Math.cos(a) * 28; p.y += Math.sin(a) * 28;
  collideStatic(p, 14);
  texts.push({ x: p.x, y: p.y - 110, txt: '-' + dmg, life: 0.9, color: '#ff5d5d', size: 16 });
  if (p.hp <= 0) gameOver();
}

function updateEnemy(e, dt) {
  const p = player;
  e.t += dt;
  e.hurt = Math.max(0, e.hurt - dt);
  e.slow = Math.max(0, e.slow - dt);
  e.freezeT = Math.max(0, (e.freezeT || 0) - dt);
  if (e.spawn > 0) { e.spawn -= dt; return; }
  if (e.poisonT > 0) {
    e.poisonT -= dt;
    e.poisonTick = (e.poisonTick || 0) - dt;
    if (e.poisonTick <= 0) {
      e.poisonTick = 0.55;
      damageEnemy(e, e.poisonDmg || 1, undefined, undefined, 0, { color: '#5dff6b', noFreeze: true, silent: true, noCrit: true, isPoison: true });
      if (e.dead) return;
    }
  }
  if (e.bounty) {
    e.bountyT -= dt;
    if (e.bountyT <= 0) { e.bounty = false; }
  }
  if (e.freezeT > 0 && !isBossType(e.type)) {
    e.kx *= Math.pow(0.003, dt); e.ky *= Math.pow(0.003, dt);
    e.x += e.kx * dt; e.y += e.ky * dt;
    collideStatic(e, e.r);
    return;
  }
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
  const ux = dx / d, uy = dy / d;
  let sx = ux * e.speed, sy = uy * e.speed;
  const slowMul = e.freezeT > 0 ? 0.3 : e.slow > 0 ? 0.55 : 1;

  switch (e.type) {
    case 'slime': {
      const hop = Math.max(0, Math.sin(e.t * 5));
      sx *= hop * 1.9; sy *= hop * 1.9; e.z = hop * 12;
      break;
    }
    case 'bomber': {
      const hop = Math.max(0.2, Math.abs(Math.sin(e.t * 9)));
      sx *= 1.15; sy *= 1.15; e.z = hop * 9;
      if (d < 52 && e.act > 0) {
        e.act = -1;
        hazards.push({ kind: 'meteor', x: e.x, y: e.y, r: 72, t: 0, dur: 0.55 });
      }
      break;
    }
    case 'viper': {
      const zig = Math.sin(e.t * 9) * 115;
      sx += -uy * zig; sy += ux * zig;
      e.act -= dt;
      if (e.act <= 0) {
        e.act = rand(2.2, 3.4);
        if (puddles.length < 22) puddles.push({ kind: 'acid', x: e.x, y: e.y, r: 28, life: 2.6, max: 2.6, tick: 0.4 });
      }
      break;
    }
    case 'bat':
      sx += Math.cos(e.t * 6) * 90; sy += Math.sin(e.t * 7) * 90;
      break;
    case 'bee':
      e.act -= dt;
      if (e.mode === 'move' && e.act <= 0 && d < 380) { e.mode = 'aim'; e.act = 0.45; e.cx = ux; e.cy = uy; }
      else if (e.mode === 'aim') { sx = sy = 0; if (e.act <= 0) { e.mode = 'charge'; e.act = 0.45; } }
      else if (e.mode === 'charge') { sx = e.cx * 430; sy = e.cy * 430; if (e.act <= 0) { e.mode = 'move'; e.act = rand(1.8, 3); } }
      else { sx += Math.cos(e.t * 4) * 50; sy += Math.sin(e.t * 5) * 50; }
      break;
    case 'eyeball':
      if (d < 220) { sx = -sx; sy = -sy; } else if (d < 300) { sx = -uy * e.speed; sy = ux * e.speed; }
      e.act -= dt;
      if (e.act <= 0 && d < 600) { e.act = rand(1.8, 2.6); enemyShoot(e, Math.atan2(p.y - 35 - (e.y - e.r * 1.2), dx), 230); beep(500, 0.08, 'sine', 0.025, -200); }
      break;
    case 'sniper':
      if (d < 260) { sx = -sx * 0.9; sy = -sy * 0.9; } else if (d < 380) { sx = 0; sy = 0; }
      e.act -= dt;
      if (e.mode === 'move' && e.act <= 0 && d < 680) {
        e.mode = 'lock'; e.act = 0.75;
        e.aimAng = Math.atan2(p.y - 35 - (e.y - e.r * 1.2), dx);
      } else if (e.mode === 'lock') {
        sx = sy = 0;
        if (e.act > 0.2) e.aimAng = Math.atan2(p.y - 35 - (e.y - e.r * 1.2), dx);
        if (e.act <= 0) {
          e.mode = 'move'; e.act = rand(2.2, 3.2);
          enemyShoot(e, e.aimAng, 420, 7, 'orange');
          beep(780, 0.1, 'sawtooth', 0.04, -300);
        }
      }
      break;
    case 'ghost': {
      const cyc = e.t % 5;
      e.faded = cyc > 3.6;
      const s = 0.7 + Math.sin(e.t * 2) * 0.5;
      sx *= s; sy *= s;
      break;
    }
    case 'necromancer': {
      if (d < 240) { sx = -sx * 0.85; sy = -sy * 0.85; } else if (d < 340) { sx = -uy * e.speed * 0.7; sy = ux * e.speed * 0.7; }
      e.act -= dt;
      if (e.act <= 0 && d < 640) {
        e.act = rand(3.2, 4.5);
        const a = Math.atan2(p.y - 35 - (e.y - e.r), dx);
        enemyShoot(e, a - 0.18, 210, 8, 'purple');
        enemyShoot(e, a + 0.18, 210, 8, 'purple');
        if (enemies.length < 55) {
          spawnEnemy(pick(['bat', 'minislime', 'worm']), { x: e.x + rand(-45, 45), y: e.y + rand(-45, 45) }, { noElite: true });
          burst(e.x, e.y - 24, '#d26bff', 12, 180);
        }
      }
      break;
    }
    case 'golem': {
      e.shieldOn = (e.t % 4.5) > 2.6;
      if (e.shieldOn) { sx *= 0.55; sy *= 0.55; }
      e.act -= dt;
      if (e.act <= 0 && d < 220) {
        e.act = rand(3.0, 4.2);
        fxRings.push({ kind: 'nova', x: e.x, y: e.y, r: 14, maxR: 110, life: 0.3, max: 0.3, col: '#ff9a2e' });
        for (let i = 0; i < 6; i++) enemyShoot(e, (i * Math.PI) / 3, 175, 8, 'orange');
        shake = Math.max(shake, 5);
      }
      break;
    }
    case 'goblin': {
      // Foge do jogador e solta moedas pelo caminho!
      sx = -ux * e.speed; sy = -uy * e.speed;
      if (e.x < 140 || e.x > WORLD.w - 140) sx = -uy * e.speed;
      if (e.y < 160 || e.y > WORLD.h - 120) sy = ux * e.speed;
      e.coinT = (e.coinT || 0.6) - dt;
      if (e.coinT <= 0) {
        e.coinT = 0.85;
        dropItem('coin', e.x, e.y);
      }
      e.escapeT = (e.escapeT || 16) - dt;
      if (e.escapeT <= 0) {
        e.dead = true;
        burst(e.x, e.y - 16, '#ffd23f', 20, 220);
        texts.push({ x: e.x, y: e.y - 40, txt: 'DUENDE ESCAPOU!', life: 1.4, color: '#ffb347', size: 11 });
        return;
      }
      break;
    }
    case 'bigworm':
      e.act -= dt;
      if (e.act <= 0 && d < 600) { e.act = rand(3, 4.2); const a = Math.atan2(dy - 35, dx); for (let i = -1; i <= 1; i++) enemyShoot(e, a + i * 0.25, 190, 8); }
      break;
    case 'flower':
      sx = sy = 0;
      e.act -= dt;
      if (e.mode === 'move' && e.act <= 0) { e.mode = 'open'; e.act = 0.7; }
      else if (e.mode === 'open' && e.act <= 0) {
        e.mode = 'move'; e.act = rand(2.5, 3.5);
        const off = rand(0, Math.PI);
        for (let i = 0; i < 8; i++) enemyShoot(e, off + i * Math.PI / 4, 160, 8, 'green');
        beep(300, 0.15, 'triangle', 0.04, -150);
      }
      break;
    case 'boss':
      bossAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'leviathan':
      leviathanAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'necro_boss':
      necroBossAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'hydra_boss':
      hydraBossAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'beholder_boss':
      beholderBossAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
  }

  e.kx *= Math.pow(0.003, dt); e.ky *= Math.pow(0.003, dt);
  e.x += (sx * slowMul + e.kx) * dt;
  e.y += (sy * slowMul + e.ky) * dt;
  const fx = Math.abs(sx) + Math.abs(sy) > 1 ? sx : dx, fy = Math.abs(sx) + Math.abs(sy) > 1 ? sy : dy;
  e.row = Math.abs(fx) > Math.abs(fy) ? (fx > 0 ? 3 : 1) : (fy > 0 ? 2 : 0);
  for (const o of enemies) {
    if (o === e || o.dead) continue;
    const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy), m = (e.r + o.r) * 0.9;
    if (od < m && od > 0) {
      const push = isBossType(e.type) || e.type === 'flower' ? 0 : (m - od) * 0.5;
      e.x += ox / od * push; e.y += oy / od * push;
    }
  }
  if (!MON[e.type].fly && !isBossType(e.type)) collideStatic(e, e.r);
  else { e.x = clamp(e.x, 40, WORLD.w - 40); e.y = clamp(e.y, 90, WORLD.h - 20); }
  if (!((e.type === 'ghost' || e.type === 'necro_boss') && e.faded) && e.type !== 'goblin' && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 14) hurtPlayer(e.dmg, e.x, e.y);
}

function bossAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.3 : 1); e.vy = uy * e.speed * (enraged ? 1.3 : 1);
    if (e.pt <= 0) {
      e.phase = ['burst', 'charge', 'summon', 'charge'][e.cycle++ % 4];
      e.pt = e.phase === 'burst' ? 0.4 : e.phase === 'charge' ? 0.9 : 0.6;
      e.shots = enraged ? 5 : 3;
      if (e.phase === 'charge') { e.ca = Math.atan2(p.y - e.y, p.x - e.x); play('giant1', 0.4, 0.2); }
    }
  } else if (e.phase === 'burst') {
    if (e.pt <= 0) {
      const n = enraged ? 18 : 14, off = e.shots * 0.2;
      for (let i = 0; i < n; i++) enemyShoot(e, off + i * Math.PI * 2 / n, 170, 9, 'orange');
      shake = Math.max(shake, 5);
      beep(200, 0.2, 'square', 0.04, -100);
      e.shots--; e.pt = 0.55;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.2; }
    }
  } else if (e.phase === 'charge') {
    if (e.pt > 0) { e.ca = e.pt > 0.35 ? Math.atan2(p.y - e.y, p.x - e.x) : e.ca; }
    else {
      e.vx = Math.cos(e.ca) * 700; e.vy = Math.sin(e.ca) * 700;
      if (Math.random() < 0.6) particles.push({ x: e.x + rand(-20, 20), y: e.y, vx: 0, vy: -30, life: 0.5, max: 0.5, color: 'rgba(255,160,60,0.7)', size: 7 });
      if (e.pt < -0.55) { e.phase = 'chase'; e.pt = 1.8; shake = 8; }
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const n = enraged ? 5 : 3;
      for (let i = 0; i < n; i++) spawnEnemy(pick(['bat', 'bee', 'slime']), { x: e.x + rand(-90, 90), y: e.y + rand(-90, 90) }, { noElite: true });
      burst(e.x, e.y - 60, '#ff9a2e', 30, 250);
      e.phase = 'chase'; e.pt = 2.5;
    }
  }
}

function leviathanAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (e.phase === 'chase') {
    const waveSway = Math.sin(e.t * 5) * 65;
    e.vx = ux * e.speed * (enraged ? 1.35 : 1.05) - uy * waveSway;
    e.vy = uy * e.speed * (enraged ? 1.35 : 1.05) + ux * waveSway;
    if (e.pt <= 0) {
      e.phase = ['spiral', 'charge', 'meteors', 'summon'][e.cycle++ % 4];
      e.pt = e.phase === 'charge' ? 0.85 : 0.45;
      e.shots = enraged ? 8 : 5;
      e.spinA = rand(0, Math.PI * 2);
      if (e.phase === 'charge') { e.ca = Math.atan2(p.y - e.y, p.x - e.x); play('giant1', 0.5, 0.15); }
    }
  } else if (e.phase === 'spiral') {
    if (e.pt <= 0) {
      e.spinA += 0.45;
      for (let i = 0; i < 6; i++) enemyShoot(e, e.spinA + i * Math.PI / 3, 210, 8, 'green');
      beep(340, 0.1, 'triangle', 0.04, -120);
      e.shots--; e.pt = 0.24;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.0; }
    }
  } else if (e.phase === 'charge') {
    if (e.pt > 0) { e.ca = e.pt > 0.3 ? Math.atan2(p.y - e.y, p.x - e.x) : e.ca; }
    else {
      e.vx = Math.cos(e.ca) * 760; e.vy = Math.sin(e.ca) * 760;
      if (Math.random() < 0.7) particles.push({ x: e.x + rand(-22, 22), y: e.y, vx: 0, vy: -35, life: 0.45, max: 0.45, color: 'rgba(140,255,100,0.75)', size: 7 });
      if (e.pt < -0.58) { e.phase = 'chase'; e.pt = 1.6; shake = 9; }
    }
  } else if (e.phase === 'meteors') {
    if (e.pt <= 0) {
      const cnt = enraged ? 4 : 3;
      for (let i = 0; i < cnt; i++) {
        hazards.push({ kind: 'meteor', x: clamp(p.x + rand(-180, 180), 90, WORLD.w - 90), y: clamp(p.y + rand(-150, 150), 120, WORLD.h - 60), r: 72, t: 0, dur: 1.25 });
      }
      e.phase = 'chase'; e.pt = 2.2;
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const n = enraged ? 5 : 3;
      for (let i = 0; i < n; i++) spawnEnemy(pick(['snake', 'worm', 'eyeball']), { x: e.x + rand(-100, 100), y: e.y + rand(-100, 100) }, { noElite: true });
      burst(e.x, e.y - 50, '#7dff6b', 30, 260);
      e.phase = 'chase'; e.pt = 2.3;
    }
  }
}

function necroBossAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  e.faded = false;
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.3 : 1);
    e.vy = uy * e.speed * (enraged ? 1.3 : 1);
    if (e.pt <= 0) {
      e.phase = ['teleport', 'volley', 'summon', 'volley'][e.cycle++ % 4];
      e.pt = e.phase === 'teleport' ? 0.65 : 0.45;
      e.shots = enraged ? 6 : 4;
    }
  } else if (e.phase === 'teleport') {
    e.faded = true;
    if (e.pt <= 0) {
      const ang = rand(0, Math.PI * 2), dist = rand(210, 310);
      e.x = clamp(p.x + Math.cos(ang) * dist, 100, WORLD.w - 100);
      e.y = clamp(p.y + Math.sin(ang) * dist, 140, WORLD.h - 80);
      e.faded = false;
      fxRings.push({ kind: 'nova', x: e.x, y: e.y - 20, r: 14, maxR: 130, life: 0.32, max: 0.32, col: '#d26bff' });
      for (let i = 0; i < 12; i++) enemyShoot(e, (i * Math.PI * 2) / 12, 200, 8, 'purple');
      beep(420, 0.15, 'sine', 0.05, 250);
      e.phase = 'chase'; e.pt = 1.9;
    }
  } else if (e.phase === 'volley') {
    if (e.pt <= 0) {
      const base = Math.atan2(p.y - 35 - (e.y - e.r), p.x - e.x);
      for (let i = -2; i <= 2; i++) enemyShoot(e, base + i * 0.22, 235, 8, 'purple');
      beep(310, 0.1, 'triangle', 0.04, -100);
      e.shots--; e.pt = 0.35;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.1; }
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const cnt = enraged ? 5 : 3;
      for (let i = 0; i < cnt; i++) spawnEnemy(pick(['ghost', 'bomber', 'bat']), { x: e.x + rand(-110, 110), y: e.y + rand(-110, 110) }, { noElite: true });
      burst(e.x, e.y - 45, '#d26bff', 32, 260);
      e.phase = 'chase'; e.pt = 2.4;
    }
  }
}

function hydraBossAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.35 : 1);
    e.vy = uy * e.speed * (enraged ? 1.35 : 1);
    if (e.pt <= 0) {
      e.phase = ['bloom', 'acid_rain', 'pull', 'summon'][e.cycle++ % 4];
      e.pt = 0.5;
      e.shots = enraged ? 6 : 4;
      e.spinA = rand(0, Math.PI * 2);
    }
  } else if (e.phase === 'bloom') {
    e.mode = 'open';
    if (e.pt <= 0) {
      e.spinA += 0.35;
      const n = enraged ? 12 : 9;
      for (let i = 0; i < n; i++) enemyShoot(e, e.spinA + (i * Math.PI * 2) / n, 185, 9, 'green');
      beep(260, 0.12, 'triangle', 0.04, -90);
      e.shots--; e.pt = 0.36;
      if (e.shots <= 0) { e.mode = 'move'; e.phase = 'chase'; e.pt = 2.1; }
    }
  } else if (e.phase === 'acid_rain') {
    if (e.pt <= 0) {
      for (let i = 0; i < (enraged ? 5 : 3); i++) {
        const ax = clamp(p.x + rand(-200, 200), 90, WORLD.w - 90);
        const ay = clamp(p.y + rand(-160, 160), 120, WORLD.h - 70);
        puddles.push({ kind: 'acid', x: ax, y: ay, r: 44, life: 4.0, max: 4.0, tick: 0.4 });
        hazards.push({ kind: 'meteor', x: ax, y: ay, r: 64, t: 0, dur: 1.1 });
      }
      e.phase = 'chase'; e.pt = 2.2;
    }
  } else if (e.phase === 'pull') {
    if (d < 440 && d > 40) {
      p.x -= ux * 115 * dt;
      p.y -= uy * 115 * dt;
      collideStatic(p, 14);
    }
    if (Math.random() < 0.5) particles.push({ x: p.x + rand(-20, 20), y: p.y - 20, vx: -ux * 80, vy: -uy * 80, life: 0.3, max: 0.3, color: '#6eff6b', size: 4 });
    if (e.pt < -1.1) {
      for (let i = 0; i < 10; i++) enemyShoot(e, (i * Math.PI * 2) / 10, 200, 8, 'green');
      e.phase = 'chase'; e.pt = 2.0;
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      for (let i = 0; i < (enraged ? 4 : 2); i++) spawnEnemy(pick(['viper', 'flower', 'bee']), { x: e.x + rand(-120, 120), y: e.y + rand(-120, 120) }, { noElite: true });
      e.phase = 'chase'; e.pt = 2.4;
    }
  }
}

function beholderBossAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.3 : 1);
    e.vy = uy * e.speed * (enraged ? 1.3 : 1);
    if (e.pt <= 0) {
      e.phase = ['laser_fan', 'charge', 'rings', 'meteors'][e.cycle++ % 4];
      e.pt = e.phase === 'charge' ? 0.8 : 0.45;
      e.shots = enraged ? 6 : 4;
      if (e.phase === 'charge') { e.ca = Math.atan2(p.y - e.y, p.x - e.x); play('giant1', 0.5, 0.2); }
    }
  } else if (e.phase === 'laser_fan') {
    if (e.pt <= 0) {
      const base = Math.atan2(p.y - 35 - (e.y - e.r), p.x - e.x);
      for (let i = -3; i <= 3; i++) enemyShoot(e, base + i * 0.16, 310, 8, 'orange');
      beep(660, 0.1, 'sawtooth', 0.04, -240);
      e.shots--; e.pt = 0.34;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.0; }
    }
  } else if (e.phase === 'charge') {
    if (e.pt > 0) { e.ca = e.pt > 0.28 ? Math.atan2(p.y - e.y, p.x - e.x) : e.ca; }
    else {
      e.vx = Math.cos(e.ca) * 780; e.vy = Math.sin(e.ca) * 780;
      if (e.pt < -0.55) { e.phase = 'chase'; e.pt = 1.7; shake = 9; }
    }
  } else if (e.phase === 'rings') {
    if (e.pt <= 0) {
      const n = enraged ? 16 : 12;
      for (let i = 0; i < n; i++) enemyShoot(e, e.shots * 0.25 + (i * Math.PI * 2) / n, 205, 8, i % 2 === 0 ? 'purple' : 'orange');
      e.shots--; e.pt = 0.42;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.1; }
    }
  } else if (e.phase === 'meteors') {
    if (e.pt <= 0) {
      for (let i = 0; i < (enraged ? 5 : 4); i++) {
        hazards.push({ kind: 'meteor', x: clamp(p.x + rand(-190, 190), 90, WORLD.w - 90), y: clamp(p.y + rand(-160, 160), 120, WORLD.h - 60), r: 75, t: 0, dur: 1.15 });
      }
      e.phase = 'chase'; e.pt = 2.2;
    }
  }
}

function gameOver() {
  state = 'over';
  time = 0;
  SFX.over();
  music.volume = 0.12;
  if (score > best) { best = score; localStorage.setItem('gabriel_best2', best); }
}

// =====================================================================
//  RENDERIZAÇÃO
// =====================================================================
function shadow(x, y, rx, ry, a = 0.28) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

const TS15 = 1.5;
function drawTree(t) {
  const c = t.v % 2, r = t.v < 2 ? 0 : 1, tc = r;
  const ox = t.x - 48 * TS15, oy = t.y - 122 * TS15;
  ctx.drawImage(IMG.trunk, tc * 96, 0, 96, 96, ox, oy + 64 * TS15, 96 * TS15, 96 * TS15);
  const p = player;
  const behind = p && p.y < t.y && p.y > oy && Math.abs(p.x - t.x) < 70 && p.y < t.y - 10;
  if (behind) ctx.globalAlpha = 0.5;
  ctx.drawImage(IMG.treetop, c * 96, r * 96, 96, 96, ox, oy, 96 * TS15, 96 * TS15);
  ctx.globalAlpha = 1;
}
function drawRock(o) {
  if (o.stack) { ctx.drawImage(IMG.barrel, 64, 2, 48, 61, o.x - 36, o.y - 80, 72, 92); return; }
  ctx.drawImage(IMG.rock, 0, 0, 32, 32, o.x - 24, o.y - 40, 48, 48);
}
function drawBarrel(b) {
  const sx = b.hurt > 0 ? rand(-2, 2) : 0;
  shadow(b.x, b.y - 4, 17, 6, 0.3);
  if (b.kind === 'tnt') {
    const pulse = 0.25 + 0.2 * Math.sin(time * 10);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,70,20,${pulse})`;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 22, 24, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.drawImage(IMG.barrel, 2, 10, 28, 38, b.x - 21 + sx, b.y - 52, 42, 57);
    ctx.save();
    ctx.fillStyle = `rgba(220,30,20,${0.38 + pulse * 0.4})`;
    ctx.fillRect(b.x - 16 + sx, b.y - 40, 32, 24);
    ctx.restore();
    txt('TNT', b.x + sx, b.y - 24, 7, '#ffe042');
    return;
  }
  ctx.drawImage(IMG.barrel, 2, 10, 28, 38, b.x - 21 + sx, b.y - 52, 42, 57);
}

function drawShrine(sh) {
  ctx.save();
  const pulse = 0.5 + 0.3 * Math.sin(sh.t * 4);
  ctx.strokeStyle = sh.col;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.55 + pulse * 0.3;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -sh.t * 24;
  ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sh.r, sh.r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = sh.col;
  ctx.globalAlpha = 0.12 + sh.prog * 0.25;
  ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sh.r, sh.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();

  if (sh.prog > 0) {
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, sh.r - 4, (sh.r - 4) * 0.62, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sh.prog);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  shadow(sh.x, sh.y, 18, 7, 0.35);
  const bob = Math.sin(sh.t * 4) * 5;
  if (IMG[sh.icon]) ctx.drawImage(IMG[sh.icon], sh.x - 18, sh.y - 44 + bob, 36, 36);
  txt(sh.name, sh.x, sh.y - 54 + bob, 7, sh.col);
  ctx.restore();
}

function drawHazard(h) {
  if (h.kind === 'fallen_star') {
    const k = clamp(h.t / h.dur, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(100,240,255," + (0.15 + k * 0.35) + ")";
    ctx.beginPath(); ctx.ellipse(h.targetX, h.targetY, 32, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(140,250,255," + (0.6 + 0.4 * Math.sin(h.t * 26)) + ")";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(h.targetX, h.targetY, 32 * k, 14 * k, 0, 0, Math.PI * 2); ctx.stroke();

    const sx = h.curX || h.startX, sy = h.curY || h.startY;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(sx, sy, 3, sx, sy, 36);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#7ef8ff');
    g.addColorStop(0.7, '#ffd843');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, 36, 0, Math.PI * 2); ctx.fill();
    if (IMG.terraria_star) ctx.drawImage(IMG.terraria_star, sx - 20, sy - 20, 40, 40);
    ctx.restore();
    return;
  }
  const k = clamp(h.t / h.dur, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(255,40,20,${0.12 + k * 0.25})`;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,80,40,${0.6 + 0.4 * Math.sin(h.t * 24)})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,40,0.35)';
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * k, h.r * 0.62 * k, 0, 0, Math.PI * 2); ctx.fill();

  if (k > 0.55) {
    const fall = (1 - (k - 0.55) / 0.45) * 420;
    const mx = h.x + fall * 0.35, my = h.y - fall;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(mx, my, 4, mx, my, 32);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#ff9a2e'); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(e) {
  const d = MON[e.type];
  const img = IMG['m_' + d.img], wimg = WHITE['m_' + d.img];
  const s = e.scale * (e.spawn > 0 ? Math.max(0.05, 1 - e.spawn / 0.7) : 1);
  let row = e.row, col = Math.floor(e.t * (e.type === 'bat' || e.type === 'bee' ? 12 : 7)) % 3;
  if (e.type === 'slime' || e.type === 'bomber') col = e.z > 6 ? 2 : e.z > 1 ? 1 : 0;
  if (e.type === 'flower' || e.type === 'hydra_boss') { row = e.mode === 'open' ? 1 + (Math.floor(e.t * 10) % 3) : 0; col = Math.floor(e.t * 5) % 3; }
  const w = d.fw * s, h = d.fh * s;
  const dx = e.x - w / 2, dy = e.y - h + 4 * s - (e.z || 0);

  if (e.spawn > 0) {
    ctx.strokeStyle = `rgba(255,70,70,${0.4 + 0.4 * Math.sin(e.t * 20)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.4, e.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (d.shadow) shadow(e.x, e.y, e.r * 1.05, e.r * 0.4);

  // Auras distintas para novos inimigos, elites, comandantes e chefões
  const specialAura = e.elite || e.bounty || isBossType(e.type) || ['bomber', 'viper', 'sniper', 'necromancer', 'golem', 'goblin'].includes(e.type);
  if (specialAura) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let auraCol = `rgba(255,200,60,${0.25 + 0.1 * Math.sin(e.t * 8)})`;
    if (e.type === 'leviathan' || e.type === 'viper' || e.type === 'hydra_boss') auraCol = `rgba(100,255,100,${0.24 + 0.1 * Math.sin(e.t * 7)})`;
    else if (e.type === 'bomber') auraCol = `rgba(255,70,25,${0.32 + 0.2 * Math.sin(e.t * 16)})`;
    else if (e.type === 'necromancer' || e.type === 'necro_boss') auraCol = `rgba(195,80,255,${0.28 + 0.12 * Math.sin(e.t * 8)})`;
    else if (e.type === 'sniper' || e.type === 'beholder_boss') auraCol = `rgba(75,225,255,${0.25 + 0.12 * Math.sin(e.t * 9)})`;
    else if (e.type === 'golem') auraCol = `rgba(255,155,55,${0.24 + 0.1 * Math.sin(e.t * 6)})`;
    else if (e.type === 'goblin' || e.bounty) auraCol = `rgba(255,220,40,${0.38 + 0.16 * Math.sin(e.t * 12)})`;
    ctx.fillStyle = auraCol;
    ctx.beginPath(); ctx.ellipse(e.x, e.y - h * 0.45, w * 0.56, h * 0.56, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Laser de Mira do Sniper
  if (e.type === 'sniper' && e.mode === 'lock' && e.aimAng !== undefined) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,55,55,${0.45 + 0.4 * Math.sin(e.t * 32)})`;
    ctx.lineWidth = e.act < 0.22 ? 3.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - e.r * 1.2);
    ctx.lineTo(e.x + Math.cos(e.aimAng) * 620, e.y - e.r * 1.2 + Math.sin(e.aimAng) * 620);
    ctx.stroke();
    ctx.restore();
  }

  if (isBossType(e.type) && e.phase === 'charge' && e.pt > 0) {
    ctx.strokeStyle = `rgba(255,40,40,${0.3 + 0.3 * Math.sin(e.t * 30)})`; ctx.lineWidth = e.r * 1.2;
    ctx.beginPath(); ctx.moveTo(e.x, e.y - 20); ctx.lineTo(e.x + Math.cos(e.ca) * 600, e.y - 20 + Math.sin(e.ca) * 600); ctx.stroke();
  }
  let alpha = 1;
  if (e.type === 'ghost' || e.type === 'necro_boss') alpha = e.faded ? 0.22 : 0.88;
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.hurt > 0) {
    const k = e.hurt / 0.18;
    ctx.scale(1 + k * 0.22, 1 - k * 0.20);
  }
  ctx.translate(-e.x, -e.y);
  ctx.drawImage(img, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
  if (e.hurt > 0) {
    ctx.globalAlpha = alpha * Math.min(1, e.hurt / 0.1);
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
  } else if (e.freezeT > 0) {
    ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (e.poisonT > 0) {
    ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (e.slow > 0) {
    ctx.globalAlpha = 0.32; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (e.shieldOn) {
    ctx.save();
    ctx.strokeStyle = 'rgba(110,235,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y - h * 0.45, e.r * 1.25, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (e.type === 'goblin') {
    txt('💰 DUENDE', e.x, dy - 12, 7.5, '#ffd23f');
  } else if (e.bounty) {
    txt('🎯 ALVO (' + Math.ceil(e.bountyT) + 's)', e.x, dy - 12, 7.5, '#ff6438');
  }

  if (e.hp < e.maxHp && !isBossType(e.type) && e.spawn <= 0) {
    const bw = Math.max(28, e.r * 2), by = dy - 8;
    ctx.fillStyle = '#1a0d12'; ctx.fillRect(e.x - bw / 2 - 2, by - 2, bw + 4, 8);
    ctx.fillStyle = '#5a1f2a'; ctx.fillRect(e.x - bw / 2, by, bw, 4);
    ctx.fillStyle = e.type === 'goblin' || e.bounty || e.elite ? '#ffc23d' : (e.poisonT > 0 ? '#5dff6b' : '#ff4d5e');
    ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
}

function playerFrame() {
  const p = player;
  const an = p.char.anim;
  const cid = p.char.id;
  if (p.dash) {
    const fr = an.spin;
    const fps = cid === 'manguinha' ? 28 : 16;
    return {
      f: fr[Math.floor(p.dash.t * fps) % fr.length],
      flip: cid === 'manguinha' ? false : p.flip,
      bobY: cid === 'amxral' ? -5 : 0,
      tilt: 0
    };
  }
  if (p.ult) {
    if (cid === 'manguinha') {
      const fr = an.spin;
      return { f: fr[Math.floor(p.ult.t * 24) % fr.length], flip: false, bobY: 0, tilt: 0 };
    }
    const fr = an.attack;
    return { f: fr[Math.floor(p.ult.t * 18) % fr.length], flip: Math.floor(p.ult.t * 5) % 2 === 1, bobY: -3, tilt: 0 };
  }
  if (p.attack) {
    const fr = an.attack;
    const idx = Math.min(fr.length - 1, Math.floor((p.attack.t / p.attack.dur) * fr.length));
    return { f: fr[idx], flip: p.flip, bobY: 0, tilt: 0 };
  }
  if (!p.moving) {
    if (p.dir === 'down' || p.idleT > 1.2) {
      return { f: an.idle[Math.floor(p.animT * 7) % an.idle.length], flip: false, bobY: 0, tilt: 0 };
    }
    if (p.dir === 'up') {
      return { f: an.idleUp[0], flip: cid === 'amxral' ? false : p.flip, bobY: Math.sin(p.animT * 4) * 1, tilt: 0 };
    }
    return { f: an.idleSide[0], flip: p.dir === 'left', bobY: Math.sin(p.animT * 4) * 1, tilt: 0 };
  }
  const spd = clamp((stats.speed * (p.frenzyT > 0 ? 1.25 : 1)) / 220, 0.85, 1.75);
  if (p.dir === 'down') {
    const fps = cid === 'tuiuba' ? 15 : cid === 'manguinha' ? 13 : 11;
    const bob = cid === 'amxral' ? -Math.abs(Math.sin(p.animT * 11 * spd)) * 1.5 : 0;
    return {
      f: an.walkDown[Math.floor(p.animT * fps * spd) % an.walkDown.length],
      flip: cid === 'amxral' ? false : p.flip,
      bobY: bob,
      tilt: 0
    };
  }
  if (p.dir === 'up') {
    const fps = cid === 'manguinha' ? 17 : cid === 'tuiuba' ? 9 : 8;
    const bob = cid === 'amxral' ? -Math.abs(Math.sin(p.animT * 12 * spd)) * 3 : cid === 'tuiuba' ? -Math.abs(Math.sin(p.animT * 12 * spd)) * 2 : 0;
    const tilt = cid === 'manguinha' ? 0 : Math.sin(p.animT * 12 * spd) * 0.026;
    return {
      f: an.walkUp[Math.floor(p.animT * fps * spd) % an.walkUp.length],
      flip: cid === 'manguinha' ? p.flip : false,
      bobY: bob,
      tilt
    };
  }
  const sideFps = cid === 'manguinha' ? 17 : cid === 'amxral' ? 15 : 14;
  return {
    f: an.walkSide[Math.floor(p.animT * sideFps * spd) % an.walkSide.length],
    flip: p.dir === 'left',
    bobY: 0,
    tilt: 0
  };
}

function drawPlayer() {
  const p = player;
  shadow(p.x, p.y, 20, 7, 0.35);
  if (p.frenzyT > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,170,40,${0.45 + 0.25 * Math.sin(time * 14)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 28, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (p.ult) {
    const R = 195 * stats.range;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p.x, p.y - 30, 10, p.x, p.y - 30, R);
    const colGlow = p.char.weaponType === 'orange' ? 'rgba(255,140,20,' : p.char.weaponType === 'star' ? 'rgba(255,220,60,' : SABER_COLORS[saberColorIndex].glow;
    g.addColorStop(0, colGlow + '0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 30, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (!(p.inv > 0 && !p.dash && !p.ult && Math.floor(p.inv * 15) % 2 === 0)) {
    const { f, flip, bobY, tilt } = playerFrame();
    let sqX = 1, sqY = 1;
    if (p.dash) { sqX = 1.14; sqY = 0.90; }
    else if (p.inv > stats.invTime - 0.14) { sqX = 1.16; sqY = 0.84; }
    drawCharacterFrame(p.char, f, p.x, p.y, flip, p.inv > stats.invTime - 0.12 ? 0.8 : 0, { bobY, tilt, squashX: sqX, squashY: sqY });
  }
  if (p.shields > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < p.shields; i++) {
      const a = time * 3.2 + (i * Math.PI * 2) / p.shields;
      const sx = p.x + Math.cos(a) * 34, sy = p.y - 36 + Math.sin(a) * 20;
      ctx.fillStyle = 'rgba(90,230,255,0.75)';
      ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(90,230,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 36, 35, 44, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function drawFireballs() {
  if (!stats.fire) return;
  const p = player, n = stats.fire, R = 80;
  for (let i = 0; i < n; i++) {
    const a = p.fireAng + i * Math.PI * 2 / n;
    const fx = p.x + Math.cos(a) * R, fy = p.y - 35 + Math.sin(a) * R * 0.8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, 22);
    g.addColorStop(0, 'rgba(255,240,150,0.9)'); g.addColorStop(0.5, 'rgba(255,120,30,0.5)'); g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(a + Math.PI / 2);
    ctx.drawImage(IMG.i_S_Fire01, -17, -17, 34, 34);
    ctx.restore();
  }
}

function drawSlash(s) {
  const p = player;
  const k = 1 - s.life / s.max;
  const colorObj = SABER_COLORS[saberColorIndex];
  ctx.save();
  ctx.translate(p.x, p.y - 38);
  ctx.rotate(s.a);
  ctx.globalCompositeOperation = 'lighter';
  const start = -1.35 + k * 0.5, end = start + 2.7 * Math.min(1, k * 2.8);
  const R = s.r;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = [colorObj.glow + '0.45)', colorObj.glow + '0.8)', '#ffffff'][i];
    ctx.lineWidth = [22, 11, 4][i] * (1 - k * 0.6) * (s.big ? 1.3 : 1);
    ctx.beginPath(); ctx.arc(0, 0, R, start, end); ctx.stroke();
  }
  ctx.restore();
}

function drawBullet(b) {
  const cols = { purple: ['#ff9cff', 'rgba(190,60,255,'], green: ['#d6ff8a', 'rgba(80,200,40,'], orange: ['#fff0a0', 'rgba(255,120,20,'] }[b.color];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.r * 2.2);
  g.addColorStop(0, cols[1] + '0.9)'); g.addColorStop(1, cols[1] + '0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#2a0f2f'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(b.x - b.r * 0.5, b.y - b.r * 0.5, b.r * 0.5, b.r * 0.5);
}

function drawShot(s) {
  ctx.save();
  const colObj = SABER_COLORS[saberColorIndex];
  if (s.kind === 'orange') {
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s.r * 1.6);
    g.addColorStop(0, 'rgba(255, 230, 140, 0.9)');
    g.addColorStop(0.5, 'rgba(255, 130, 20, 0.5)');
    g.addColorStop(1, 'rgba(255, 90, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, s.r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const sz = s.r * 2.1;
    if (IMG.orange_ball) ctx.drawImage(IMG.orange_ball, -sz / 2, -sz / 2, sz, sz);
    else { ctx.fillStyle = '#ff7b00'; ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.fill(); }
  } else if (s.kind === 'star') {
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s.r * 1.8);
    g.addColorStop(0, 'rgba(255, 255, 210, 0.95)');
    g.addColorStop(0.45, 'rgba(255, 205, 30, 0.6)');
    g.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, s.r * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if (IMG.terraria_star) {
      const sz = s.r * 2.2;
      ctx.drawImage(IMG.terraria_star, -sz / 2, -sz / 2, sz, sz);
    } else {
      ctx.drawImage(IMG.i_S_Light04, -s.r, -s.r, s.r * 2, s.r * 2);
    }
  } else if (s.kind === 'axe') {
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(180,230,255,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 1.5); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(IMG.i_S_Axe03, -18, -18, 36, 36);
  } else if (s.kind === 'wave') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(s.x, s.y); ctx.rotate(s.ang);
    const a = Math.min(1, s.life * 3);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = [colObj.glow + `${0.5 * a})`, colObj.glow + `${0.8 * a})`, `rgba(255,255,255,${a})`][i];
      ctx.lineWidth = [14, 7, 3][i];
      ctx.beginPath(); ctx.arc(-s.r * 0.6, 0, s.r, -1.1, 1.1); ctx.stroke();
    }
  } else if (s.kind === 'dagger') {
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.drawImage(IMG.i_S_Dagger03, -16, -16, 32, 32);
  } else {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 2.4);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, colObj.glow + '0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBolt(b) {
  const [x1, y1, x2, y2] = b.pts;
  const segs = 8;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? `rgba(255,255,255,${b.life * 4})` : `rgba(255,230,80,${b.life * 3})`;
    ctx.lineWidth = pass ? 2 : 7;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      ctx.lineTo(x1 + (x2 - x1) * t + rand(-14, 14), y1 + (y2 - y1) * t + rand(-14, 14));
    }
    ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.restore();
}

const PICK_ICON = {
  coin: 'i_I_GoldCoin', gem: 'i_I_Sapphire', ruby: 'i_I_Ruby', potion: 'i_P_Red01', chest: 'i_I_Chest01',
  magnet_orb: 'i_I_Diamond', frenzy_orb: 'i_P_Red02', ice_bomb: 'i_S_Ice01', star: 'terraria_star'
};
const PICK_SIZE = { coin: 20, gem: 16, ruby: 24, potion: 28, chest: 48, magnet_orb: 30, frenzy_orb: 30, ice_bomb: 30, star: 28 };
function drawPickup(k) {
  if (k.t > 24 && Math.floor(k.t * 8) % 2 === 0) return;
  const sz = PICK_SIZE[k.kind] || 24;
  shadow(k.x, k.y, sz * 0.35, sz * 0.14, 0.3);
  const bob = k.kind === 'chest' ? 0 : Math.sin(k.t * 5 + k.x) * 2.5;
  const y = k.y - sz * 0.5 - k.z + bob;
  if (k.kind === 'coin') {
    const w = Math.max(0.15, Math.abs(Math.cos(k.t * 6 + k.x)));
    ctx.drawImage(IMG.i_I_GoldCoin, k.x - sz * w / 2, y - sz / 2, sz * w, sz);
  } else {
    if (k.kind === 'chest' || k.kind === 'magnet_orb' || k.kind === 'frenzy_orb' || k.kind === 'ice_bomb') {
      const gcol = k.kind === 'chest' ? '255,210,60' : k.kind === 'magnet_orb' ? '80,225,255' : k.kind === 'frenzy_orb' ? '255,100,40' : '150,240,255';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(${gcol},${0.25 + 0.15 * Math.sin(time * 7)})`;
      ctx.beginPath(); ctx.arc(k.x, y, k.kind === 'chest' ? 44 : 24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const ic = IMG[PICK_ICON[k.kind]];
    if (ic) ctx.drawImage(ic, k.x - sz / 2, y - sz / 2, sz, sz);
  }
}

function drawWorld() {
  const sqTrauma = trauma * trauma;
  const shakeOffset = sqTrauma * 22;
  const shakeRoll = sqTrauma * 0.024;
  const sx = shakeOffset > 0.1 ? Math.sin(time * 38) * shakeOffset : (shake ? rand(-shake, shake) : 0);
  const sy = shakeOffset > 0.1 ? Math.cos(time * 32) * shakeOffset * 0.8 : (shake ? rand(-shake, shake) : 0);
  const roll = shakeRoll > 0.001 ? Math.sin(time * 26) * shakeRoll : 0;
  const z = (cam && cam.zoom) || getCamZoom();
  ctx.save();
  ctx.translate(Math.round(W / 2 + sx), Math.round(H / 2 + sy));
  if (roll) ctx.rotate(roll);
  ctx.scale(z, z);
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
  ctx.fillStyle = '#1d4220';
  ctx.fillRect(-2000, -2000, WORLD.w + 4000, WORLD.h + 4000);
  ctx.drawImage(ground, 0, 0);

  // Poças cítricas (Tuiuba), Vórtice Abissal & Ácido Tóxico
  for (const pd of puddles) {
    ctx.save();
    if (pd.kind === 'vortex') {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(pd.x, pd.y, 4, pd.x, pd.y, pd.r);
      g.addColorStop(0, 'rgba(30, 5, 55, 0.9)');
      g.addColorStop(0.5, 'rgba(165, 65, 255, 0.55)');
      g.addColorStop(1, 'rgba(90, 20, 180, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(220, 140, 255, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r * (0.4 + 0.3 * Math.sin(time * 8)), pd.r * 0.38, time * 4, 0, Math.PI * 2); ctx.stroke();
    } else if (pd.kind === 'acid') {
      ctx.globalAlpha = Math.min(0.6, pd.life * 0.4);
      ctx.fillStyle = '#38d64a';
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9eff7a';
      ctx.beginPath(); ctx.ellipse(pd.x - pd.r * 0.15, pd.y - 2, pd.r * 0.5, pd.r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = Math.min(0.55, pd.life * 0.4);
      ctx.fillStyle = '#ff8c1a';
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.58, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath(); ctx.ellipse(pd.x - pd.r * 0.15, pd.y - 2, pd.r * 0.55, pd.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Santuários Místicos & Avisos de Meteoro
  for (const sh of shrines) drawShrine(sh);
  for (const h of hazards) drawHazard(h);

  if (player && stats.ice) {
    const R = 85 + stats.ice * 20;
    ctx.save();
    ctx.fillStyle = 'rgba(150,220,255,0.13)'; ctx.strokeStyle = 'rgba(200,240,255,0.5)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]); ctx.lineDashOffset = -time * 20;
    ctx.beginPath(); ctx.ellipse(player.x, player.y, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  for (const k of pickups) drawPickup(k);

  // Rastros Fantasmas de Dash / Frenesi
  for (const g of afterimages) {
    const a = (g.life / g.max) * 0.48;
    drawCharacterFrame(g.char, g.f, g.x, g.y, g.flip, 0.65, { alpha: a, additive: true });
  }

  const halfW = (W / 2) / z, halfH = (H / 2) / z;
  const viewL = cam.x - halfW - 200, viewR = cam.x + halfW + 200, viewT = cam.y - halfH - 100, viewB = cam.y + halfH + 250;
  const vis = o => o.x > viewL && o.x < viewR && o.y > viewT && o.y < viewB;
  const list = [];
  for (const t of trees) if (vis(t)) list.push({ y: t.y, d: () => drawTree(t) });
  for (const r of rocks) if (vis(r)) list.push({ y: r.y, d: () => drawRock(r) });
  for (const b of props) if (vis(b)) list.push({ y: b.y, d: () => drawBarrel(b) });
  for (const e of enemies) if (vis(e)) list.push({ y: e.y, d: () => drawEnemy(e) });
  if (player && state !== 'menu' && state !== 'select_char') list.push({ y: player.y, d: drawPlayer });
  list.sort((a, b) => a.y - b.y);
  for (const o of list) o.d();

  if (player && state !== 'menu' && state !== 'select_char') drawFireballs();
  for (const s of slashes) drawSlash(s);
  for (const s of pshots) drawShot(s);
  for (const b of ebullets) drawBullet(b);
  for (const b of bolts) drawBolt(b);

  // Anéis de Choque, Explosões & Splash Cítrico
  for (const r of fxRings) {
    const k = 1 - r.life / r.max;
    const curR = r.r + (r.maxR - r.r) * k;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, 1 - k);
    if (r.kind === 'orange_splash' && IMG.orange_splash) {
      ctx.drawImage(IMG.orange_splash, r.x - curR, r.y - curR, curR * 2, curR * 2);
    }
    ctx.strokeStyle = r.col;
    ctx.lineWidth = r.kind === 'explosion' ? 8 * (1 - k * 0.5) : 4 * (1 - k * 0.5);
    ctx.beginPath(); ctx.arc(r.x, r.y, curR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  for (const q of particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    const maxL = t.maxLife || 0.8;
    const progress = clamp(1 - t.life / maxL, 0, 1);
    const pop = progress < 0.18 ? 1 + (progress / 0.18) * 0.38 : 1.38 - ((progress - 0.18) / 0.82) * 0.38;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t.life * 2.4);
    ctx.translate(t.x, t.y);
    ctx.scale(pop, pop);
    txt(t.txt, 0, 0, t.size, t.color);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, waveEvent === 'bloodmoon' ? 'rgba(65,0,15,0.58)' : 'rgba(0,0,10,0.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (player && player.hp <= 2 && state === 'play') {
    // Low HP pulsing vignette
    const pulse = 0.12 + 0.08 * Math.sin(time * 8);
    const lowHpG = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
    lowHpG.addColorStop(0, 'rgba(0,0,0,0)');
    lowHpG.addColorStop(1, "rgba(180,0,20," + pulse + ")");
    ctx.fillStyle = lowHpG;
    ctx.fillRect(0, 0, W, H);
  }
  if (player && player.inv > stats.invTime - 0.3 && !player.dash && !player.ult && player.hp < stats.maxHp && state === 'play') {
    ctx.fillStyle = `rgba(255,0,0,${(player.inv - (stats.invTime - 0.3)) * 0.8})`; ctx.fillRect(0, 0, W, H);
  }
}

// =====================================================================
//  INTERFACE & HUD
// =====================================================================
function txt(s, x, y, size, color = '#fff', align = 'center') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size / 3.2); ctx.strokeStyle = '#120a10';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function panel(x, y, w, h, hl = false) {
  ctx.fillStyle = '#120a10'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = hl ? '#d9a441' : '#7a5230'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#2b1d16'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, y, w, 4);
}
function bar(x, y, w, h, v, col, back = '#2a1a22') {
  ctx.fillStyle = '#120a10'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = back; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(v, 0, 1), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w * clamp(v, 0, 1), Math.max(1, h / 3));
}
function wrap(s, maxW, size) {
  ctx.font = `${size}px ${FONT}`;
  const words = s.split(' '), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}

function drawMinimap() {
  if (!minimapOn || W < 380) return;
  const isCompactH = H < 520;
  const mw = isCompactH ? 80 : 128, mh = isCompactH ? 56 : 96;
  const mx = W - mw - 12, my = isCompactH ? 42 : 136;
  const sx = mw / WORLD.w, sy = mh / WORLD.h;
  ctx.save();
  ctx.fillStyle = 'rgba(12, 10, 16, 0.78)';
  ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 2;
  ctx.strokeRect(mx - 1, my - 1, mw + 2, mh + 2);
  ctx.fillStyle = 'rgba(34, 68, 36, 0.75)';
  ctx.fillRect(mx, my, mw, mh);

  ctx.fillStyle = 'rgba(65, 145, 225, 0.75)';
  for (const pd of ponds) ctx.fillRect(mx + pd.x * sx, my + pd.y * sy, Math.max(2, pd.w * sx), Math.max(2, pd.h * sy));

  for (const b of props) {
    if (b.kind === 'tnt') {
      ctx.fillStyle = '#ff6b2b';
      ctx.fillRect(mx + b.x * sx - 1, my + b.y * sy - 1, 2, 2);
    }
  }
  for (const sh of shrines) {
    ctx.fillStyle = sh.col;
    ctx.fillRect(mx + sh.x * sx - 2, my + sh.y * sy - 2, isCompactH ? 4 : 6, isCompactH ? 4 : 6);
  }
  for (const k of pickups) {
    if (k.kind === 'chest') {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(mx + k.x * sx - 2, my + k.y * sy - 2, isCompactH ? 4 : 6, isCompactH ? 4 : 6);
    }
  }
  for (const e of enemies) {
    if (isBossType(e.type)) {
      ctx.fillStyle = '#ff9a2e';
      ctx.fillRect(mx + e.x * sx - 2.5, my + e.y * sy - 2.5, isCompactH ? 5 : 7, isCompactH ? 5 : 7);
    } else {
      ctx.fillStyle = e.elite ? '#ffd23f' : '#ff4d5e';
      ctx.fillRect(mx + e.x * sx - 1, my + e.y * sy - 1, 2, 2);
    }
  }
  if (player) {
    ctx.fillStyle = '#7dff7d';
    ctx.fillRect(mx + player.x * sx - 2, my + player.y * sy - 2, isCompactH ? 4 : 5, isCompactH ? 4 : 5);
  }
  if (!isCompactH) {
    txt(gamepadInfo.connected ? 'MAPA [RB]' : 'MAPA [N]', mx + mw - 2, my + mh + 13, 7, '#99a', 'right');
  }
  ctx.restore();
}

function drawHUD() {
  const p = player;
  const isCompactH = H < 520;
  const heartSz = isCompactH ? 24 : 34;
  const heartStep = isCompactH ? 26 : 38;
  const hearts = stats.maxHp / 2;
  const hy = isCompactH ? 8 : 14;
  for (let i = 0; i < hearts; i++) {
    const v = p.hp - i * 2;
    let x = 14 + i * heartStep, y = hy;
    if (p.hp <= 2 && i === 0) {
      const beat = Math.sin(time * 9);
      if (beat > 0.45) y -= (beat - 0.45) * 5;
    }
    ctx.drawImage(IMG.i_heart_empty, x, y, heartSz, heartSz);
    if (v >= 2) ctx.drawImage(IMG.i_heart_full, x, y, heartSz, heartSz);
    else if (v === 1) ctx.drawImage(IMG.i_heart_full, 0, 0, 17, 34, x, y, heartSz / 2, heartSz);
  }
  if (p.shields > 0) {
    const sx0 = 14 + hearts * heartStep + 4;
    const sSz = isCompactH ? 20 : 26;
    for (let i = 0; i < p.shields; i++) {
      ctx.drawImage(IMG.i_S_Buff03, sx0 + i * (sSz + 2), hy + (heartSz - sSz) / 2, sSz, sSz);
    }
  }

  if (isCompactH) {
    const xw = Math.min(260, W * 0.35);
    bar(14, 36, xw, 8, p.xp / p.xpNext, '#4fa8ff', '#1a2440');
    txt(p.char.name + ' • NV ' + p.level, 14, 54, 8.5, '#9fd0ff', 'left');

    bar(130, 48, 65, 6, 1 - p.dashCd / stats.dashCd, p.dashCd <= 0 ? '#7fe0ff' : '#3a6a8a');
    txt('GIRO', 200, 54, 6.5, '#bfe8ff', 'left');

    const full = p.ultMeter >= 100;
    bar(14, 62, 110, 7, p.ultMeter / 100, full ? `hsl(${(time * 300) % 360},90%,60%)` : '#c06bff', '#2a1a3a');
    txt(full ? p.char.ultName.toUpperCase() : 'FÚRIA', 130, 69, 6.5, full ? '#fff36b' : '#d9b8ff', 'left');

    if (p.frenzyT > 0) {
      txt(`🔥 FRENESI ${p.frenzyT.toFixed(1)}s`, 14, 82, 7.5, '#ff9442', 'left');
    }
    if (p.prefix) {
      txt(`[${p.prefix.name}] Sabre`, 14, 94, 7, p.prefix.color, 'left');
    }
    if (p.ironskinT > 0) {
      txt(`🛡 PELE DE FERRO ${Math.ceil(p.ironskinT)}s`, 14, 105, 6.5, '#ffea60', 'left');
    }
    if (p.thornsT > 0) {
      txt(`🌵 ESPINHOS ${Math.ceil(p.thornsT)}s`, 14, 116, 6.5, '#7aff61', 'left');
    }

    const mm = Math.floor(playTime / 60), ss = Math.floor(playTime % 60);
    ctx.drawImage(IMG.i_I_GoldCoin, W - 32, 6, 20, 20);
    txt('' + coins, W - 36, 22, 13, '#ffd23f', 'right');
    txt('ONDA ' + wave, W - 95, 21, 9, '#bbf', 'right');
    txt(`PTS ${score} • ${mm}:${ss < 10 ? '0' : ''}${ss}`, W - 14, 35, 7.5, '#cfe8ff', 'right');
  } else {
    const xw = Math.min(420, W * 0.4);
    bar(20, 60, xw, 12, p.xp / p.xpNext, '#4fa8ff', '#1a2440');
    txt(p.char.name + ' • NV ' + p.level, 20, 92, 11, '#9fd0ff', 'left');

    bar(155, 82, 85, 8, 1 - p.dashCd / stats.dashCd, p.dashCd <= 0 ? '#7fe0ff' : '#3a6a8a');
    txt('GIRO' + (gamepadInfo.connected ? ' [LT/B]' : ''), 246, 91, 8, '#bfe8ff', 'left');

    const full = p.ultMeter >= 100;
    bar(20, 104, 180, 10, p.ultMeter / 100, full ? `hsl(${(time * 300) % 360},90%,60%)` : '#c06bff', '#2a1a3a');
    txt(full ? p.char.ultName.toUpperCase() + (gamepadInfo.connected ? ' [Y/X]' : ' [E]') : 'FÚRIA', 206, 114, 8, full ? '#fff36b' : '#d9b8ff', 'left');

    if (p.frenzyT > 0) {
      txt(`🔥 FRENESI ${p.frenzyT.toFixed(1)}s`, 20, 134, 9, '#ff9442', 'left');
    }
    if (p.prefix) {
      txt(`ARMY: [${p.prefix.name}]`, 20, 150, 8.5, p.prefix.color, 'left');
    }
    if (p.ironskinT > 0) {
      txt(`🛡 PELE DE FERRO ${Math.ceil(p.ironskinT)}s`, 20, 164, 8, '#ffea60', 'left');
    }
    if (p.thornsT > 0) {
      txt(`🌵 ESPINHOS ${Math.ceil(p.thornsT)}s`, 20, 178, 8, '#7aff61', 'left');
    }

    ctx.drawImage(IMG.i_I_GoldCoin, W - 50, 14, 32, 32);
    txt('' + coins, W - 58, 40, 18, '#ffd23f', 'right');
    txt('PONTOS: ' + score, W - 20, 70, 12, '#cfe8ff', 'right');
    txt('ONDA ' + wave, W - 20, 90, 10, '#bbf', 'right');
    const mm = Math.floor(playTime / 60), ss = Math.floor(playTime % 60);
    txt(`${mm}:${ss < 10 ? '0' : ''}${ss}`, W - 20, 108, 9, '#aab', 'right');
    txt('RECORDE ' + best, W - 20, 124, 8, '#998', 'right');
    // Combo streak badge (v.2)
    if (p.combo >= 3) {
      const cbX = isCompactH ? W - 14 : W - 20;
      const cbY = isCompactH ? 50 : 148;
      const colCombo = p.combo >= 40 ? '#d25bff' : (p.combo >= 20 ? '#ff3e5b' : (p.combo >= 10 ? '#ff9436' : '#ffd23f'));
      const bounce = 1 + 0.12 * Math.sin(p.comboT * 16);
      ctx.save();
      ctx.translate(cbX, cbY);
      ctx.scale(bounce, bounce);
      txt("⚡ " + p.combo + "x COMBO!", 0, 0, isCompactH ? 8.5 : 10, colCombo, 'right');
      ctx.restore();
    }
  }

  drawMinimap();

  if (!touch.active) {
    if (p.char.weaponType === 'saber') {
      txt('SABRE ' + (gamepadInfo.connected ? '[GATILHO RT]' : '[C / ESPAÇO]'), W - 220, H - 20, 9, '#aaa', 'left');
      ctx.fillStyle = SABER_COLORS[saberColorIndex].hex;
      ctx.fillRect(W - 40, H - 30, 20, 14);
    } else if (p.char.weaponType === 'orange') {
      txt('LARANJAS ' + (gamepadInfo.connected ? '[GATILHO RT]' : '[ESPAÇO / CLIQUE]'), W - 220, H - 20, 9, '#ff9214', 'left');
    } else {
      txt('ESTRELAS ' + (gamepadInfo.connected ? '[GATILHO RT]' : '[ESPAÇO / CLIQUE]'), W - 220, H - 20, 9, '#ffe042', 'left');
    }
  }

  if (p.combo >= 3) {
    const s = 14 + Math.min(14, p.combo / 2);
    txt('COMBO x' + p.combo, W / 2, 46 + (boss ? 50 : 0), s, p.combo >= 20 ? '#ff5d5d' : '#ff9f3f');
  }
  if (boss) {
    const bw = Math.min(600, W * 0.6);
    const bName = MON[boss.type].bossName || 'CHEFÃO';
    const bCol = boss.type === 'leviathan' || boss.type === 'hydra_boss' ? '#8cff7a' : boss.type === 'necro_boss' ? '#e29eff' : boss.type === 'beholder_boss' ? '#7fe8ff' : '#ffb35d';
    const barCol = boss.hp < boss.maxHp / 2 ? '#ff3b3b' : (boss.type === 'leviathan' || boss.type === 'hydra_boss' ? '#4ad66d' : boss.type === 'necro_boss' ? '#b855ff' : boss.type === 'beholder_boss' ? '#3ac2ff' : '#ff8a2e');
    txt(bName, W / 2, 26, 12, bCol);
    bar(W / 2 - bw / 2, 34, bw, 14, boss.hp / boss.maxHp, barCol, '#3a1410');
  }
  if (banner) {
    const a = Math.min(1, banner.life * 2, (banner.max - banner.life) * 4);
    ctx.globalAlpha = a;
    txt(banner.txt, W / 2, H * 0.3, banner.small ? 28 : 40, banner.boss ? '#ff7a3d' : '#ffffff');
    if (banner.sub) txt(banner.sub, W / 2, H * 0.3 + 40, 14, banner.boss ? '#ffb35d' : '#cfe8ff');
    ctx.globalAlpha = 1;
  }
  let ix = 14;
  const upSz = isCompactH ? 24 : 34;
  const upY = isCompactH ? (touch.active ? 88 : H - 34) : (touch.active ? 122 : H - 50);
  for (const u of UPGRADES) {
    if (!ups[u.id]) continue;
    ctx.fillStyle = 'rgba(18,10,16,0.7)'; ctx.fillRect(ix - 2, upY, upSz, upSz);
    ctx.drawImage(IMG['i_' + u.icon], ix, upY + 2, upSz - 4, upSz - 4);
    txt('' + ups[u.id], ix + upSz - 4, upY + upSz - 4, isCompactH ? 6.5 : 8, '#fff36b', 'right');
    ix += upSz + 4;
  }
  const left = enemies.length + toSpawn;
  if (!touch.active && left > 0) txt('INIMIGOS: ' + left, W - 20, H - 45, 10, '#ddd', 'right');

  // Setas indicadoras fora da tela (Chefões, Duende, Alvos, Últimos Inimigos e Santuários)
  const poi = [];
  for (const e of enemies) {
    if (isBossType(e.type) || e.type === 'goblin' || e.bounty || left <= 5) {
      poi.push({ x: e.x, y: e.y, col: e.type === 'goblin' || e.bounty ? '#ffd23f' : (isBossType(e.type) ? '#ff7a3d' : '#ff4d5e') });
    }
  }
  for (const sh of shrines) poi.push({ x: sh.x, y: sh.y, col: sh.col });
  for (const k of pickups) if (k.kind === 'chest') poi.push({ x: k.x, y: k.y, col: '#ffd23f' });

  const z = (cam && cam.zoom) || 1;
  for (const t of poi) {
    const sx = (t.x - cam.x) * z + W / 2, sy = (t.y - cam.y) * z + H / 2;
    if (sx > 20 && sx < W - 20 && sy > 20 && sy < H - 20) continue;
    const a = Math.atan2(sy - H / 2, sx - W / 2);
    const ex = clamp(sx, 30, W - 30), ey = clamp(sy, isCompactH ? 50 : 130, H - 50);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.fillStyle = t.col;
    ctx.strokeStyle = '#120a10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
  }

  drawTouchControls();
}

function drawTouchControls() {
  if (!touch.active || state !== 'play') return;
  const t = performance.now() / 1000;
  ctx.save();

  // 1. BOTÕES DE TOPO (Pausa e Tela Cheia)
  const pb = touch.pauseBtn, fb = touch.fullBtn;
  ctx.fillStyle = 'rgba(18, 24, 38, 0.72)';
  ctx.strokeStyle = '#4fe3ff';
  ctx.lineWidth = 1.5;
  ctx.fillRect(fb.x, fb.y, fb.w, fb.h);
  ctx.strokeRect(fb.x, fb.y, fb.w, fb.h);
  txt('⛶', fb.x + fb.w / 2, fb.y + fb.h / 2 + 5, 12, '#4fe3ff');

  ctx.fillStyle = 'rgba(18, 24, 38, 0.72)';
  ctx.strokeStyle = '#ffd23f';
  ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
  ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);
  txt('⏸', pb.x + pb.w / 2, pb.y + pb.h / 2 + 5, 12, '#ffd23f');

  // 2. JOYSTICK VIRTUAL (Analógico Dinâmico na Esquerda)
  const bx = touch.joyBaseX, by = touch.joyBaseY, br = touch.joyBaseRadius;
  const jActive = touch.joyId !== null;

  ctx.beginPath();
  ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fillStyle = jActive ? 'rgba(14, 22, 38, 0.55)' : 'rgba(14, 22, 38, 0.32)';
  ctx.fill();
  ctx.strokeStyle = jActive ? '#4fe3ff' : 'rgba(79, 227, 255, 0.38)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Marcas nos 4 cantos
  ctx.fillStyle = 'rgba(79, 227, 255, 0.55)';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
    ctx.beginPath();
    ctx.arc(bx + Math.cos(a) * (br - 8), by + Math.sin(a) * (br - 8), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thumbstick móvel
  const kx = touch.joyId !== null ? touch.joyCurrX : bx;
  const ky = touch.joyId !== null ? touch.joyCurrY : by;
  const kdx = kx - bx, kdy = ky - by;
  const kd = Math.hypot(kdx, kdy);
  const maxK = br - touch.joyStickRadius + 4;
  const visKx = kd > maxK ? bx + (kdx / kd) * maxK : kx;
  const visKy = kd > maxK ? by + (kdy / kd) * maxK : ky;

  ctx.beginPath();
  ctx.arc(visKx, visKy, touch.joyStickRadius, 0, Math.PI * 2);
  const joyGrad = ctx.createRadialGradient(visKx - 4, visKy - 4, 2, visKx, visKy, touch.joyStickRadius);
  joyGrad.addColorStop(0, '#5be8ff');
  joyGrad.addColorStop(0.6, '#0f527c');
  joyGrad.addColorStop(1, '#08253b');
  ctx.fillStyle = joyGrad;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. BOTÃO ATACAR (⚔️ Grande)
  const ab = touch.atkBtn;
  const atkPress = touch.isAtkDown;
  const atkCurR = atkPress ? ab.r * 0.92 : ab.r;

  ctx.beginPath();
  ctx.arc(ab.x, ab.y, atkCurR, 0, Math.PI * 2);
  const atkGrad = ctx.createRadialGradient(ab.x - 6, ab.y - 6, 4, ab.x, ab.y, atkCurR);
  if (atkPress) {
    atkGrad.addColorStop(0, '#ff9e6b');
    atkGrad.addColorStop(0.7, '#e03a1b');
    atkGrad.addColorStop(1, '#7a1103');
  } else {
    atkGrad.addColorStop(0, '#ff6e40');
    atkGrad.addColorStop(0.7, '#c92a10');
    atkGrad.addColorStop(1, '#5e0d02');
  }
  ctx.fillStyle = atkGrad;
  ctx.fill();
  ctx.strokeStyle = atkPress ? '#ffffff' : '#ffb885';
  ctx.lineWidth = atkPress ? 3 : 2;
  ctx.stroke();

  txt('⚔️', ab.x, ab.y - 4, 15, '#ffffff');
  txt('ATACAR', ab.x, ab.y + 14, 7, '#ffe7d6');

  // 4. BOTÃO GIRO / ESQUIVA (💨)
  const db = touch.dashBtn;
  const dashReady = player.dashCd <= 0;
  ctx.beginPath();
  ctx.arc(db.x, db.y, db.r, 0, Math.PI * 2);
  const dashGrad = ctx.createRadialGradient(db.x - 4, db.y - 4, 3, db.x, db.y, db.r);
  if (dashReady) {
    dashGrad.addColorStop(0, '#7fe0ff');
    dashGrad.addColorStop(0.7, '#0084b4');
    dashGrad.addColorStop(1, '#003e54');
  } else {
    dashGrad.addColorStop(0, '#4a606b');
    dashGrad.addColorStop(1, '#1b262c');
  }
  ctx.fillStyle = dashGrad;
  ctx.fill();
  ctx.strokeStyle = dashReady ? '#b8f2ff' : '#455a64';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!dashReady) {
    const cdAngle = (player.dashCd / stats.dashCd) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(db.x, db.y);
    ctx.arc(db.x, db.y, db.r + 2, -Math.PI / 2, -Math.PI / 2 + cdAngle, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();
  }

  txt('💨', db.x, db.y - 3, 12, '#ffffff');
  txt('GIRO', db.x, db.y + 11, 6.5, dashReady ? '#e0f7fa' : '#8899a6');

  // 5. BOTÃO ULTIMATE / FÚRIA (⚡)
  const ub = touch.ultBtn;
  const ultReady = player.ultMeter >= 100;
  const ultPulse = ultReady ? Math.sin(t * 8) * 2.5 : 0;
  const ultCurR = ub.r + ultPulse;

  ctx.beginPath();
  ctx.arc(ub.x, ub.y, ultCurR, 0, Math.PI * 2);
  const ultGrad = ctx.createRadialGradient(ub.x - 4, ub.y - 4, 3, ub.x, ub.y, ultCurR);
  if (ultReady) {
    ultGrad.addColorStop(0, '#fff47d');
    ultGrad.addColorStop(0.6, '#ffaa00');
    ultGrad.addColorStop(1, '#b85c00');
  } else {
    ultGrad.addColorStop(0, '#9a59b5');
    ultGrad.addColorStop(0.7, '#4a154b');
    ultGrad.addColorStop(1, '#1e0521');
  }
  ctx.fillStyle = ultGrad;
  ctx.fill();
  ctx.strokeStyle = ultReady ? '#ffffff' : '#8e44ad';
  ctx.lineWidth = ultReady ? 2.8 : 1.5;
  ctx.stroke();

  if (!ultReady) {
    const rageFrac = clamp(player.ultMeter / 100, 0, 1);
    ctx.beginPath();
    ctx.arc(ub.x, ub.y, ub.r + 3, -Math.PI / 2, -Math.PI / 2 + rageFrac * Math.PI * 2, false);
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  txt('⚡', ub.x, ub.y - 3, 13, '#ffffff');
  txt(ultReady ? 'PRONTO!' : Math.floor(player.ultMeter) + '%', ub.x, ub.y + 11, 6, ultReady ? '#fffbe0' : '#d9b8ff');

  // 6. DICA DE ORIENTAÇÃO (Se o celular estiver em modo retrato)
  if (H > W) {
    const hintW = Math.min(380, W - 20), hintH = 24;
    const hx = W / 2 - hintW / 2, hy = 58;
    ctx.fillStyle = 'rgba(12, 18, 30, 0.85)';
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 1;
    ctx.fillRect(hx, hy, hintW, hintH);
    ctx.strokeRect(hx, hy, hintW, hintH);
    txt('📱 GIRE O CELULAR P/ MODO PAISAGEM', W / 2, hy + 16, 7, '#ffe042');
  }

  ctx.restore();
}

function overlay(alpha = 0.6) { ctx.fillStyle = `rgba(8,5,12,${alpha})`; ctx.fillRect(0, 0, W, H); }

let cardRects = [];
function drawLevelUp() {
  overlay(0.65);
  const isPortrait = H > W;
  const isCompactH = H <= 520;
  cardRects = [];

  if (isPortrait) {
    txt('SUBIU DE NÍVEL!', W / 2, H * 0.11, 22, '#ffd23f');
    txt(touch.active ? 'Toque em um poder para escolher' : (gamepadInfo.connected ? 'Use D-Pad / Analógico e aperte [A]' : 'Escolha um poder (1, 2, 3)'), W / 2, H * 0.11 + 26, 7.5, '#cfe8ff');
    const cw = Math.min(390, W - 28);
    const y0 = H * 0.11 + 42;
    const availH = Math.min(430, H - y0 - 18);
    const ch = Math.min(110, (availH - 16) / 3);
    const gap = 8;
    const x = W / 2 - cw / 2;
    levelChoices.forEach((u, i) => {
      const y = y0 + i * (ch + gap);
      const sel = levelSel === i;
      panel(x, y, cw, ch, sel);
      const lvl = ups[u.id] || 0;
      const iconSize = clamp(ch - 22, 44, 58);
      ctx.drawImage(IMG['i_' + u.icon], x + 10, y + ch / 2 - iconSize / 2, iconSize, iconSize);
      txt(u.name.toUpperCase(), x + iconSize + 18, y + 22, 9, '#ffd23f', 'left');
      txt(lvl ? 'NV ' + (lvl + 1) : 'NOVO!', x + cw - 12, y + 22, 7.5, lvl ? '#9fd0ff' : '#7dff7d', 'right');
      const dLines = wrap(u.desc(lvl), cw - iconSize - 32, 7);
      dLines.slice(0, 3).forEach((l, j) => txt(l, x + iconSize + 18, y + 38 + j * 13, 7, '#e8eefc', 'left'));
      txt(sel ? '✓ ESCOLHIDO' : 'TOQUE P/ ESCOLHER', x + cw - 10, y + ch - 10, 6.5, sel ? '#7dff7d' : '#889', 'right');
      cardRects.push({ x, y, w: cw, h: ch, index: i });
    });
  } else if (isCompactH) {
    // Modo Paisagem Celular (Espaçoso, sem aperto vertical)
    txt('SUBIU DE NÍVEL!', W / 2, 24, 18, '#ffd23f');
    txt(touch.active ? 'Toque no poder desejado para escolher' : (gamepadInfo.connected ? 'D-Pad + [A] ou botões [X / Y / B]' : 'Escolha um poder (1, 2, 3 ou clique)'), W / 2, 38, 7.5, '#cfe8ff');

    const gap = 12;
    const cw = clamp((W - 50 - gap * 2) / 3, 190, 240);
    const ch = clamp(H - 68, 200, 245);
    const x0 = W / 2 - (cw * 3 + gap * 2) / 2, y0 = 48;

    levelChoices.forEach((u, i) => {
      const x = x0 + i * (cw + gap);
      if (mouse.moved) {
        const hov = mouse.x > x && mouse.x < x + cw && mouse.y > y0 && mouse.y < y0 + ch;
        if (hov) levelSel = i;
      }
      const sel = levelSel === i;
      const lift = sel ? -4 : 0;
      panel(x, y0 + lift, cw, ch, sel);
      const lvl = ups[u.id] || 0;
      txt(lvl ? 'NV ' + (lvl + 1) : 'NOVO!', x + cw / 2, y0 + lift + 18, 8, lvl ? '#9fd0ff' : '#7dff7d');

      const iconSz = 50;
      ctx.drawImage(IMG['i_' + u.icon], x + cw / 2 - iconSz / 2, y0 + lift + 24, iconSz, iconSz);

      const nameLines = wrap(u.name.toUpperCase(), cw - 16, 9.5);
      nameLines.forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 88 + j * 13, 9.5, '#ffd23f'));

      const dLines = wrap(u.desc(lvl), cw - 20, 7);
      dLines.slice(0, 3).forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 92 + nameLines.length * 13 + j * 12, 7, '#e8eefc'));

      const directBtn = i === 0 ? '[X]' : i === 1 ? '[Y]' : '[B]';
      const hint = gamepadInfo.connected ? (sel ? '✓ ESCOLHER [A]' : directBtn) : (touch.active ? '✓ ESCOLHER' : '[' + (i + 1) + ']');
      txt(hint, x + cw / 2, y0 + lift + ch - 10, 8, sel ? '#7dff7d' : '#99a');
      cardRects.push({ x, y: y0, w: cw, h: ch, index: i });
    });
  } else {
    txt('SUBIU DE NÍVEL!', W / 2, H * 0.18, 30, '#ffd23f');
    txt(touch.active ? 'Toque em um poder para escolher' : (gamepadInfo.connected ? 'Use D-Pad / Analógico e aperte [A] (ou botões X, Y, B)' : 'Escolha um poder  (1, 2, 3 ou clique)'), W / 2, H * 0.18 + 34, 10, '#cfe8ff');
    const cw = Math.min(250, (W - 80) / 3), ch = Math.min(300, H * 0.65), gap = 24;
    const x0 = W / 2 - (cw * 3 + gap * 2) / 2, y0 = H * 0.18 + 60;
    levelChoices.forEach((u, i) => {
      const x = x0 + i * (cw + gap);
      if (mouse.moved) {
        const hov = mouse.x > x && mouse.x < x + cw && mouse.y > y0 && mouse.y < y0 + ch;
        if (hov) levelSel = i;
      }
      const sel = levelSel === i;
      const lift = sel ? -10 : 0;
      panel(x, y0 + lift, cw, ch, sel);
      const lvl = ups[u.id] || 0;
      txt(lvl ? 'NV ' + (lvl + 1) : 'NOVO!', x + cw / 2, y0 + lift + 26, 10, lvl ? '#9fd0ff' : '#7dff7d');
      ctx.drawImage(IMG['i_' + u.icon], x + cw / 2 - 51, y0 + lift + 40, 102, 102);
      const nameLines = wrap(u.name, cw - 20, 12);
      nameLines.forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 170 + j * 18, 12, '#ffd23f'));
      wrap(u.desc(lvl), cw - 28, 9).forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 176 + nameLines.length * 18 + j * 16, 9, '#e8eefc'));

      const directBtn = i === 0 ? '[X]' : i === 1 ? '[Y]' : '[B]';
      const hint = gamepadInfo.connected ? (sel ? '✓ ESCOLHER [A]' : directBtn) : (touch.active ? '✓ TOQUE P/ ESCOLHER' : '[' + (i + 1) + ']');
      txt(hint, x + cw / 2, y0 + lift + ch - 14, 10, sel ? '#7dff7d' : '#a98');
      cardRects.push({ x, y: y0, w: cw, h: ch, index: i });
    });
  }
}

let shopRects = [], shopExitRect = null;
function drawShop() {
  overlay(0.7);
  const isPortrait = H > W;
  const isCompactH = H <= 520;
  shopRects = [];

  if (isPortrait) {
    txt('MERCADO DA ARENA', W / 2, H * 0.10, 22, '#ffd23f');
    txt(touch.active ? 'Moedas: ' + coins + '   •   Toque para comprar itens' : (gamepadInfo.connected ? 'Moedas: ' + coins + '   •   [A] Comprar   •   [START] Continuar' : 'Moedas: ' + coins + '   •   Clique para comprar ou ENTER para continuar'), W / 2, H * 0.10 + 24, 8, '#cfe8ff');
    const y0 = H * 0.10 + 42;

    if (shopToast && shopToast.time > 0) {
      shopToast.time -= 0.016;
      txt(shopToast.txt, W / 2, y0 - 10, 11, shopToast.col);
    }

    const gapX = 10, gapY = 8;
    const cw = Math.min(200, (W - 32 - gapX) / 2);
    const ch = clamp((H * 0.54) / 2, 110, 135);
    const x0 = W / 2 - (cw * 2 + gapX) / 2;
    SHOP_ITEMS.forEach((it, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + col * (cw + gapX);
      const y = y0 + row * (ch + gapY);
      const sel = shopSel === i;
      panel(x, y, cw, ch, sel);
      ctx.drawImage(IMG['i_' + it.icon], x + 8, y + 10, 36, 36);
      txt(it.name, x + 48, y + 20, 7.5, '#ffd23f', 'left');
      txt(it.cost + ' MOEDAS', x + 48, y + 36, 7.5, coins >= it.cost ? '#7dff7d' : '#ff6b6b', 'left');
      const dLines = wrap(it.desc, cw - 14, 6.5);
      dLines.slice(0, 2).forEach((l, j) => txt(l, x + cw / 2, y + 60 + j * 12, 6.5, '#e8eefc'));
      txt(coins >= it.cost ? '✓ COMPRAR' : 'SEM MOEDAS', x + cw / 2, y + ch - 10, 7, coins >= it.cost ? '#7dff7d' : '#ff5d5d');
      shopRects.push({ x, y, w: cw, h: ch, index: i });
    });
    const bw = Math.min(340, W - 32), bh = 40;
    const bx = W / 2 - bw / 2, by = y0 + 2 * (ch + gapY) + 8;
    const bsel = shopSel === SHOP_ITEMS.length;
    panel(bx, by, bw, bh, bsel);
    txt('▶ CONTINUAR BATALHA', W / 2, by + 25, 10, bsel ? '#ffd23f' : '#ffffff');
    shopExitRect = { x: bx, y: by, w: bw, h: bh };
  } else if (isCompactH) {
    // 4 cards horizontais compactos para celular em modo paisagem
    txt('MERCADO DA ARENA', W / 2, 20, 16, '#ffd23f');
    txt(`Moedas: ${coins}  •  ` + (touch.active ? 'Toque no item para comprar' : (gamepadInfo.connected ? '[A] Comprar  •  [START / B] Continuar' : 'Clique p/ comprar')), W / 2, 33, 7.5, '#cfe8ff');
    const y0 = 44;
    if (shopToast && shopToast.time > 0) {
      shopToast.time -= 0.016;
      txt(shopToast.txt, W / 2, y0 - 8, 9, shopToast.col);
    }
    const gap = 8;
    const cw = clamp((W - 40 - gap * (SHOP_ITEMS.length - 1)) / SHOP_ITEMS.length, 100, 185);
    const ch = clamp(H - 96, 180, 225);
    const x0 = W / 2 - (cw * SHOP_ITEMS.length + gap * (SHOP_ITEMS.length - 1)) / 2;

    SHOP_ITEMS.forEach((it, i) => {
      const x = x0 + i * (cw + gap);
      if (mouse.moved) {
        const hov = mouse.x > x && mouse.x < x + cw && mouse.y > y0 && mouse.y < y0 + ch;
        if (hov) shopSel = i;
      }
      const sel = shopSel === i;
      const lift = sel ? -4 : 0;
      panel(x, y0 + lift, cw, ch, sel);
      const iconSz = 38;
      ctx.drawImage(IMG['i_' + it.icon], x + cw / 2 - iconSz / 2, y0 + lift + 10, iconSz, iconSz);

      const nameLines = wrap(it.name, cw - 12, 8.5);
      nameLines.forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 58 + j * 12, 8.5, '#ffd23f'));

      txt(it.cost + ' MOEDAS', x + cw / 2, y0 + lift + 62 + nameLines.length * 12, 7.5, coins >= it.cost ? '#7dff7d' : '#ff6b6b');

      const dLines = wrap(it.desc, cw - 16, 6.5);
      dLines.slice(0, 2).forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 80 + nameLines.length * 12 + j * 11, 6.5, '#e8eefc'));

      const cardHint = gamepadInfo.connected ? (sel ? '✓ [A] COMPRAR' : '[' + (i + 1) + ']') : (coins >= it.cost ? '✓ COMPRAR' : 'SEM MOEDAS');
      txt(cardHint, x + cw / 2, y0 + lift + ch - 10, 7.5, sel ? '#ffd23f' : (coins >= it.cost ? '#7dff7d' : '#778'));
      shopRects.push({ x, y: y0, w: cw, h: ch, index: i });
    });

    const bw = Math.min(320, W - 40), bh = 34;
    const bx = W / 2 - bw / 2, by = Math.min(H - 40, y0 + ch + 8);
    if (mouse.moved) {
      const bhov = mouse.x > bx && mouse.x < bx + bw && mouse.y > by && mouse.y < by + bh;
      if (bhov) shopSel = SHOP_ITEMS.length;
    }
    const bsel = shopSel === SHOP_ITEMS.length;
    panel(bx, by, bw, bh, bsel);
    txt(gamepadInfo.connected ? '▶ CONTINUAR BATALHA [START / B / A]' : '▶ CONTINUAR BATALHA', W / 2, by + 22, 9.5, bsel ? '#ffd23f' : '#ffffff');
    shopExitRect = { x: bx, y: by, w: bw, h: bh };
  } else {
    txt('MERCADO DA ARENA', W / 2, H * 0.16, 28, '#ffd23f');
    txt(touch.active ? 'Moedas: ' + coins + '   •   Toque para comprar itens' : (gamepadInfo.connected ? 'Moedas: ' + coins + '   •   [A] Comprar selecionado   •   [START / B] Continuar' : 'Moedas: ' + coins + '   •   (Clique para comprar ou ENTER para continuar)'), W / 2, H * 0.16 + 34, 10, '#cfe8ff');
    const y0 = H * 0.16 + 66;

    if (shopToast && shopToast.time > 0) {
      shopToast.time -= 0.016;
      txt(shopToast.txt, W / 2, y0 - 10, 11, shopToast.col);
    }
    const cw = Math.min(210, (W - 80) / SHOP_ITEMS.length), ch = 280, gap = 12;
    const x0 = W / 2 - (cw * SHOP_ITEMS.length + gap * (SHOP_ITEMS.length - 1)) / 2;
    SHOP_ITEMS.forEach((it, i) => {
      const x = x0 + i * (cw + gap);
      if (mouse.moved) {
        const hov = mouse.x > x && mouse.x < x + cw && mouse.y > y0 && mouse.y < y0 + ch;
        if (hov) shopSel = i;
      }
      const sel = shopSel === i;
      const lift = sel ? -8 : 0;
      panel(x, y0 + lift, cw, ch, sel);
      ctx.drawImage(IMG['i_' + it.icon], x + cw / 2 - 40, y0 + lift + 30, 80, 80);
      const nameLines = wrap(it.name, cw - 20, 11);
      nameLines.forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 140 + j * 16, 11, '#ffd23f'));
      wrap(it.desc, cw - 24, 8).forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 145 + nameLines.length * 16 + j * 15, 8, '#e8eefc'));
      txt(it.cost + ' MOEDAS', x + cw / 2, y0 + lift + ch - 26, 10, coins >= it.cost ? '#7dff7d' : '#ff6b6b');

      const cardHint = gamepadInfo.connected ? (sel ? '✓ [A] COMPRAR' : '[' + (i + 1) + ']') : (touch.active ? '✓ COMPRAR' : '[' + (i + 1) + ']');
      txt(cardHint, x + cw / 2, y0 + lift + ch - 10, 9, sel ? '#ffd23f' : '#778');
      shopRects.push({ x, y: y0, w: cw, h: ch, index: i });
    });

    const bw = 380, bh = 42, bx = W / 2 - bw / 2, by = Math.min(H - 60, y0 + ch + 28);
    if (mouse.moved) {
      const bhov = mouse.x > bx && mouse.x < bx + bw && mouse.y > by && mouse.y < by + bh;
      if (bhov) shopSel = SHOP_ITEMS.length;
    }
    const bsel = shopSel === SHOP_ITEMS.length;
    panel(bx, by, bw, bh, bsel);
    txt(gamepadInfo.connected ? '▶ CONTINUAR BATALHA [START / B / A]' : '▶ CONTINUAR BATALHA [ENTER]', W / 2, by + 27, 11, bsel ? '#ffd23f' : '#ffffff');
    shopExitRect = { x: bx, y: by, w: bw, h: bh };
  }
}

// =====================================================================
//  MENU DE SELEÇÃO DE PERSONAGENS
// =====================================================================
let charCardRects = [], charPlayRect = null, charBackRect = null;
let charPrevRect = null, charNextRect = null, charTabRects = [];
function drawCharacterSelect() {
  overlay(0.75);
  const t = performance.now() / 1000;
  const isPortrait = H > W;
  const isCompactH = H <= 520;

  charCardRects = [];
  charTabRects = [];
  charPrevRect = null;
  charNextRect = null;

  if (isPortrait) {
    txt('SELEÇÃO DE PERSONAGEM', W / 2, H * 0.08, 20, '#ffd23f');
    txt('Escolha seu lutador para entrar na Arena', W / 2, H * 0.08 + 22, 8, '#cfe8ff');

    // 1. TABS NO TOPO: [Manguinha] [Amxral] [Tuiuba]
    const tabY = H * 0.08 + 36;
    const tabH = 34, gapT = 8;
    const tabW = Math.min(110, (W - 32 - gapT * 2) / 3);
    const tabStartX = W / 2 - (tabW * 3 + gapT * 2) / 2;

    CHARACTERS.forEach((chData, i) => {
      const tx = tabStartX + i * (tabW + gapT);
      const isCur = selectedCharIndex === i;
      panel(tx, tabY, tabW, tabH, isCur);
      txt(chData.name.toUpperCase(), tx + tabW / 2, tabY + 22, 7.5, isCur ? '#ffd23f' : '#cfe8ff');
      charTabRects.push({ x: tx, y: tabY, w: tabW, h: tabH, index: i });
    });

    // 2. CARD CENTRAL GRANDE DO PERSONAGEM SELECIONADO
    const curCh = CHARACTERS[selectedCharIndex];
    const cw = Math.min(320, W - 60);
    const cardY = tabY + tabH + 12;
    const ch = Math.min(340, H * 0.52);
    const cx = W / 2 - cw / 2;
    panel(cx, cardY, cw, ch, true);

    txt(curCh.name.toUpperCase(), cx + cw / 2, cardY + 28, 14, '#ffd23f');
    txt(curCh.title, cx + cw / 2, cardY + 44, 8, '#9fd0ff');

    const previewWalk = Math.floor(t / 2.2) % 2 === 1;
    const animArr = previewWalk ? curCh.anim.walkDown : curCh.anim.idle;
    const fr = animArr[Math.floor(t * (previewWalk ? 11 : 7)) % animArr.length];
    shadow(cx + cw / 2, cardY + 140, 24, 8, 0.4);
    drawCharacterFrame(curCh, fr, cx + cw / 2, cardY + 140, false);

    let wIcon = IMG.i_S_Buff08;
    if (curCh.weaponType === 'star') wIcon = IMG.terraria_star || IMG.i_S_Light04;
    else if (curCh.weaponType === 'orange') wIcon = IMG.orange_ball || IMG.i_P_Red01;
    ctx.drawImage(wIcon, cx + 16, cardY + 160, 28, 28);
    txt('ATK: ' + curCh.attackName, cx + 52, cardY + 174, 7.5, '#ffe042', 'left');
    txt('ULT: ' + curCh.ultName, cx + 52, cardY + 188, 7, '#d9b8ff', 'left');

    const dLines = wrap(curCh.desc, cw - 24, 7.5);
    dLines.slice(0, 3).forEach((l, j) => txt(l, cx + cw / 2, cardY + 214 + j * 14, 7.5, '#e8eefc'));

    txt('✓ SELECIONADO', cx + cw / 2, cardY + ch - 14, 8, '#7dff7d');
    charCardRects.push({ x: cx, y: cardY, w: cw, h: ch, index: selectedCharIndex });

    // 3. SETAS LATERAIS [ ◀ ] e [ ▶ ] PARA NAVEGAÇÃO
    const arrowSize = 42;
    const arrowY = cardY + ch / 2 - arrowSize / 2;
    const prevX = Math.max(6, cx - arrowSize - 6);
    const nextX = Math.min(W - arrowSize - 6, cx + cw + 6);
    panel(prevX, arrowY, arrowSize, arrowSize, false);
    txt('◀', prevX + arrowSize / 2, arrowY + 28, 14, '#ffd23f');
    charPrevRect = { x: prevX, y: arrowY, w: arrowSize, h: arrowSize };

    panel(nextX, arrowY, arrowSize, arrowSize, false);
    txt('▶', nextX + arrowSize / 2, arrowY + 28, 14, '#ffd23f');
    charNextRect = { x: nextX, y: arrowY, w: arrowSize, h: arrowSize };

    // 4. BOTÕES INFERIORES: [ ▶ JOGAR ] e [ ← MENU ]
    const btnBottomY = Math.min(H - 52, cardY + ch + 14);
    const bw = Math.min(100, W * 0.28), bx = W / 2 - cw / 2;
    panel(bx, btnBottomY, bw, 40, false);
    txt('← MENU', bx + bw / 2, btnBottomY + 25, 8.5, '#cfe8ff');
    charBackRect = { x: bx, y: btnBottomY, w: bw, h: 40 };

    const pw = cw - bw - 10, px = bx + bw + 10;
    panel(px, btnBottomY, pw, 40, true);
    txt('▶ JOGAR COM ' + curCh.name.toUpperCase(), px + pw / 2, btnBottomY + 25, 9.5, '#ffd23f');
    charPlayRect = { x: px, y: btnBottomY, w: pw, h: 40 };

  } else if (isCompactH) {
    // Modo Paisagem Celular: 3 cards lado a lado com layout elegante e espaçoso
    txt('SELEÇÃO DE PERSONAGEM', W / 2, 20, 16, '#ffd23f');
    txt('Escolha seu lutador para entrar na Arena', W / 2, 33, 7.5, '#cfe8ff');

    const gap = 12;
    const cw = clamp((W - 50 - gap * 2) / 3, 190, 240);
    const ch = clamp(H - 86, 200, 245);
    const x0 = W / 2 - (cw * CHARACTERS.length + gap * (CHARACTERS.length - 1)) / 2;
    const y0 = 42;

    CHARACTERS.forEach((chData, i) => {
      const x = x0 + i * (cw + gap);
      if (mouse.moved) {
        const hov = mouse.x > x && mouse.x < x + cw && mouse.y > y0 && mouse.y < y0 + ch;
        if (hov) selectedCharIndex = i;
      }
      const sel = selectedCharIndex === i;
      const lift = sel ? -4 : 0;
      panel(x, y0 + lift, cw, ch, sel);

      txt(chData.name.toUpperCase(), x + cw / 2, y0 + lift + 18, 11, sel ? '#ffd23f' : '#ffffff');
      txt(chData.title, x + cw / 2, y0 + lift + 31, 7, '#9fd0ff');

      const previewWalk = sel && (Math.floor(t / 2.2) % 2 === 1);
      const animArr = previewWalk ? chData.anim.walkDown : chData.anim.idle;
      const fr = animArr[Math.floor(t * (previewWalk ? 11 : 7)) % animArr.length];
      shadow(x + cw / 2, y0 + lift + 88, 20, 6, 0.4);
      drawCharacterFrame(chData, fr, x + cw / 2, y0 + lift + 88, false);

      let wIcon = IMG.i_S_Buff08;
      if (chData.weaponType === 'star') wIcon = IMG.terraria_star || IMG.i_S_Light04;
      else if (chData.weaponType === 'orange') wIcon = IMG.orange_ball || IMG.i_P_Red01;
      ctx.drawImage(wIcon, x + 10, y0 + lift + 102, 22, 22);
      txt('ATK: ' + chData.attackName, x + 36, y0 + lift + 113, 6.5, '#ffe042', 'left');
      txt('ULT: ' + chData.ultName, x + 36, y0 + lift + 123, 6, '#d9b8ff', 'left');

      const dLines = wrap(chData.desc, cw - 20, 6.5);
      dLines.slice(0, 3).forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 140 + j * 11, 6.5, '#e8eefc'));

      txt(sel ? '✓ SELECIONADO' : 'TOQUE P/ ESCOLHER', x + cw / 2, y0 + lift + ch - 10, 7.5, sel ? '#7dff7d' : '#889');
      charCardRects.push({ x, y: y0, w: cw, h: ch, index: i });
    });

    const py = Math.min(H - 38, y0 + ch + 6);
    const pw = Math.min(260, W * 0.45), ph = 32;
    const px = W / 2 - pw / 2 + 55;
    const phov = mouse.x > px && mouse.x < px + pw && mouse.y > py && mouse.y < py + ph;
    panel(px, py, pw, ph, phov || true);
    txt('▶ JOGAR COM ' + CHARACTERS[selectedCharIndex].name.toUpperCase(), px + pw / 2, py + 21, 9, phov ? '#7dff7d' : '#ffd23f');
    charPlayRect = { x: px, y: py, w: pw, h: ph };

    const bw = 95, bx = W / 2 - pw / 2 - 50;
    const bhov = mouse.x > bx && mouse.x < bx + bw && mouse.y > py && mouse.y < py + ph;
    panel(bx, py, bw, ph, bhov);
    txt('← MENU', bx + bw / 2, py + 21, 8.5, bhov ? '#ffd23f' : '#cfe8ff');
    charBackRect = { x: bx, y: py, w: bw, h: ph };
  } else {
    txt('SELEÇÃO DE PERSONAGEM', W / 2, H * 0.11, 26, '#ffd23f');
    txt('Escolha seu lutador para entrar na Arena', W / 2, H * 0.11 + 30, 10, '#cfe8ff');
    const cw = Math.min(270, (W - 80) / 3), ch = Math.min(410, H * 0.62), gap = 20;
    const x0 = W / 2 - (cw * CHARACTERS.length + gap * (CHARACTERS.length - 1)) / 2, y0 = H * 0.11 + 55;
    CHARACTERS.forEach((chData, i) => {
      const x = x0 + i * (cw + gap);
      if (mouse.moved) {
        const hov = mouse.x > x && mouse.x < x + cw && mouse.y > y0 && mouse.y < y0 + ch;
        if (hov) selectedCharIndex = i;
      }
      const sel = selectedCharIndex === i;
      const lift = sel ? -8 : 0;
      panel(x, y0 + lift, cw, ch, sel);

      txt(chData.name.toUpperCase(), x + cw / 2, y0 + lift + 32, 15, sel ? '#ffd23f' : '#ffffff');
      txt(chData.title, x + cw / 2, y0 + lift + 50, 8, '#9fd0ff');

      const previewWalk = sel && (Math.floor(t / 2.2) % 2 === 1);
      const animArr = previewWalk ? chData.anim.walkDown : chData.anim.idle;
      const fr = animArr[Math.floor(t * (previewWalk ? 11 : 7)) % animArr.length];
      shadow(x + cw / 2, y0 + lift + 175, 24, 8, 0.4);
      drawCharacterFrame(chData, fr, x + cw / 2, y0 + lift + 175, false);

      let wIcon = IMG.i_S_Buff08;
      if (chData.weaponType === 'star') wIcon = IMG.terraria_star || IMG.i_S_Light04;
      else if (chData.weaponType === 'orange') wIcon = IMG.orange_ball || IMG.i_P_Red01;
      ctx.drawImage(wIcon, x + 16, y0 + lift + 198, 32, 32);
      txt('ATK: ' + chData.attackName, x + 56, y0 + lift + 213, 8, '#ffe042', 'left');
      txt('ULT: ' + chData.ultName, x + 56, y0 + lift + 227, 7, '#d9b8ff', 'left');

      const dLines = wrap(chData.desc, cw - 26, 8);
      dLines.forEach((l, j) => txt(l, x + cw / 2, y0 + lift + 252 + j * 15, 8, '#e8eefc'));

      const btnCol = sel ? '#7dff7d' : '#bbb';
      txt(sel ? '✓ SELECIONADO (CLIQUE P/ JOGAR)' : '[' + (i + 1) + '] SELECIONAR', x + cw / 2, y0 + lift + ch - 18, 8, btnCol);

      charCardRects.push({ x, y: y0, w: cw, h: ch, index: i });
    });

    const py = Math.min(H - 58, y0 + ch + 22);
    const pw = 340, ph = 42, px = W / 2 - pw / 2 + 70;
    const phov = mouse.x > px && mouse.x < px + pw && mouse.y > py && mouse.y < py + ph;
    panel(px, py, pw, ph, phov || true);
    txt('▶ JOGAR COM ' + CHARACTERS[selectedCharIndex].name.toUpperCase(), px + pw / 2, py + 27, 11, phov ? '#7dff7d' : '#ffd23f');
    charPlayRect = { x: px, y: py, w: pw, h: ph };

    const bw = 130, bx = W / 2 - pw / 2 - 75;
    const bhov = mouse.x > bx && mouse.x < bx + bw && mouse.y > py && mouse.y < py + ph;
    panel(bx, py, bw, ph, bhov);
    txt('← MENU', bx + bw / 2, py + 27, 10, bhov ? '#ffd23f' : '#cfe8ff');
    charBackRect = { x: bx, y: py, w: bw, h: ph };
  }
}

function selectCharacter(index) {
  selectedCharIndex = index;
  localStorage.setItem('gabriel_char_index', selectedCharIndex);
  SFX.select();
}

function startWithSelectedCharacter() {
  reset();
  state = 'play';
  play('unsheathe', 0.5, 0);
  startMusic();
  music.volume = 0.3;
}

// =====================================================================
//  MENU PRINCIPAL
// =====================================================================
let menuPlayRect = null, menuCharRect = null;
function drawMenu() {
  overlay(0.52);
  const t = performance.now() / 1000;
  const isCompactH = H <= 520;

  if (isCompactH) {
    // Menu compacto modo paisagem celular
    txt('UNDERGROUND GAME', W / 2, 24, 20, '#ffd23f');
    txt('★ V.2 DEFINITIVA ★', W / 2, 40, 7, '#ffaa30');

    const curChar = CHARACTERS[selectedCharIndex];
    const fr = curChar.anim.idle;
    const charY = 80;
    shadow(W / 2, charY, 26, 8, 0.4);
    drawCharacterFrame(curChar, fr[Math.floor(t * 7) % fr.length], W / 2, charY, false);
    txt(curChar.name + ' (' + curChar.title + ')', W / 2, charY + 28, 9, '#ffe042');

    const gp = gamepadInfo.connected;
    const isTouch = touch.active;
    if (gp) {
      txt('🎮 ' + gamepadInfo.toastName.toUpperCase() + ' CONECTADO!', W / 2, charY + 42, 7.5, '#4fe3ff');
    } else if (isTouch) {
      txt('📱 TOQUE NA TELA OU USE CONTROLE BLUETOOTH', W / 2, charY + 42, 7, '#7fe0ff');
    } else {
      txt('🎮 SUPORTE A CONTROLE PLUG & PLAY ATIVO', W / 2, charY + 42, 7, '#6788a5');
    }

    const btnY = charY + 54;
    const bw = Math.min(220, (W - 36) / 2), bh = 36;
    const pRect = { x: W / 2 - bw - 6, y: btnY, w: bw, h: bh };
    const cRect = { x: W / 2 + 6, y: btnY, w: bw, h: bh };

    const pHov = mouse.x > pRect.x && mouse.x < pRect.x + pRect.w && mouse.y > pRect.y && mouse.y < pRect.y + pRect.h;
    const cHov = mouse.x > cRect.x && mouse.x < cRect.x + cRect.w && mouse.y > cRect.y && mouse.y < cRect.y + cRect.h;
    panel(pRect.x, pRect.y, pRect.w, pRect.h, pHov || true);
    txt(gp ? '▶ JOGAR [A]' : (isTouch ? '▶ JOGAR AGORA' : '▶ JOGAR [ENTER]'), pRect.x + pRect.w / 2, pRect.y + 23, 9, pHov ? '#7dff7d' : '#ffd23f');
    panel(cRect.x, cRect.y, cRect.w, cRect.h, cHov);
    txt(gp ? '⇄ PERSONAGENS [SELECT]' : (isTouch ? '⇄ PERSONAGENS' : '⇄ PERSONAGENS [TAB]'), cRect.x + cRect.w / 2, cRect.y + 23, 8.5, cHov ? '#ffd23f' : '#7fe0ff');
    menuPlayRect = pRect;
    menuCharRect = cRect;

    if (best) txt('RECORDE: ' + best, W / 2, Math.min(H - 12, btnY + bh + 24), 8.5, '#ffd23f');
  } else {
    const isSmall = W < 620;

    txt('UNDERGROUND', W / 2, isSmall ? H * 0.12 : H * 0.14, Math.min(isSmall ? 36 : 48, W / 13), '#ffd23f');
    txt('GAME', W / 2, (isSmall ? H * 0.12 : H * 0.14) + (isSmall ? 32 : 38), Math.min(isSmall ? 22 : 26, W / 24), '#6fc3ff');

    const curChar = CHARACTERS[selectedCharIndex];
    const fr = curChar.anim.idle;
    const charY = isSmall ? H * 0.34 : H * 0.38;
    shadow(W / 2, charY, 30, 10, 0.4);
    drawCharacterFrame(curChar, fr[Math.floor(t * 7) % fr.length], W / 2, charY, false);

    txt(curChar.name + ' (' + curChar.title + ')', W / 2, charY + 36, isSmall ? 10 : 12, '#ffe042');

    const gp = gamepadInfo.connected;
    const isTouch = touch.active;
    if (gp) {
      txt('🎮 ' + gamepadInfo.toastName.toUpperCase() + ' CONECTADO!', W / 2, charY + 54, 8, '#4fe3ff');
    } else if (isTouch) {
      txt('📱 TOQUE NA TELA OU USE CONTROLE BLUETOOTH', W / 2, charY + 54, 7.5, '#7fe0ff');
    } else {
      txt('🎮 SUPORTE A CONTROLE PLUG & PLAY ATIVO', W / 2, charY + 54, 7, '#6788a5');
    }

    const btnY = isSmall ? H * 0.52 : H * 0.50;
    let pRect, cRect;
    if (isSmall) {
      const bw = Math.min(290, W - 32), bh = 42;
      pRect = { x: W / 2 - bw / 2, y: btnY, w: bw, h: bh };
      cRect = { x: W / 2 - bw / 2, y: btnY + bh + 10, w: bw, h: bh };
    } else {
      const bw = Math.min(270, (W - 50) / 2), bh = 42;
      pRect = { x: W / 2 - bw - 10, y: btnY, w: bw, h: bh };
      cRect = { x: W / 2 + 10, y: btnY, w: bw, h: bh };
    }

    const pHov = mouse.x > pRect.x && mouse.x < pRect.x + pRect.w && mouse.y > pRect.y && mouse.y < pRect.y + pRect.h;
    const cHov = mouse.x > cRect.x && mouse.x < cRect.x + cRect.w && mouse.y > cRect.y && mouse.y < cRect.y + cRect.h;
    panel(pRect.x, pRect.y, pRect.w, pRect.h, pHov || true);
    txt(gp ? '▶ JOGAR [A / START]' : (isTouch ? '▶ JOGAR AGORA' : '▶ JOGAR [ENTER]'), pRect.x + pRect.w / 2, pRect.y + 26, isSmall ? 9 : 10, pHov ? '#7dff7d' : '#ffd23f');
    panel(cRect.x, cRect.y, cRect.w, cRect.h, cHov);
    txt(gp ? '⇄ PERSONAGENS [SELECT]' : (isTouch ? '⇄ ESCOLHER PERSONAGEM' : '⇄ PERSONAGENS [TAB]'), cRect.x + cRect.w / 2, cRect.y + 26, isSmall ? 9 : 10, cHov ? '#ffd23f' : '#7fe0ff');
    menuPlayRect = pRect;
    menuCharRect = cRect;

    const mons = ['slime', 'bat', 'eyeball', 'ghost', 'snake', 'bee'];
    const maxMons = isSmall ? 4 : mons.length;
    for (let i = 0; i < maxMons; i++) {
      const m = mons[i];
      const d = MON[m], img = IMG['m_' + d.img];
      const x = W / 2 + (i - (maxMons - 1) / 2) * (isSmall ? 70 : 90);
      const y = btnY + (isSmall ? 106 : 92) + Math.sin(t * 3 + i) * 4;
      ctx.drawImage(img, (Math.floor(t * 6 + i) % 3) * d.fw, 2 * d.fh, d.fw, d.fh, x - d.fw * 0.75, y - d.fh * 1.5, d.fw * 1.5, d.fh * 1.5);
    }

    const lines = gp ? [
      ['STICK ESQ / D-PAD', 'mover pelo cenário'],
      ['STICK DIR / MIRA', 'mirar livremente em 360°'],
      ['GATILHOS RT / RB', 'ATACAR (gatilhos de trás)'],
      ['GATILHOS LT / LB / B', 'giro invencível + esquiva perfeita'],
      ['Y / X', 'FÚRIA / ESPECIAL (Ultimate)'],
      ['A (CONFIRMAR)', 'selecionar poderes e menus'],
    ] : (isTouch ? [
      ['JOYSTICK VIRTUAL', 'mover pelo cenário (toque livre)'],
      ['BOTÃO ATACAR', 'golpear com mira inteligente'],
      ['BOTÃO GIRO', 'esquiva e invencibilidade'],
      ['BOTÃO ULT', 'poder especial destruidor'],
      ['BOTÃO ⛶', 'alternar tela cheia'],
    ] : [
      ['WASD / SETAS', 'mover pelos 4 lados'],
      ['ESPAÇO / CLIQUE', 'atacar na direção da mira'],
      ['SHIFT / BOTÃO DIR.', 'giro invencível + esquiva perfeita'],
      ['E / Q / L', 'FÚRIA / ESPECIAL'],
      ['TAB', 'trocar personagem (Manguinha / Amxral / Tuiuba)'],
      ['P / ESC', 'pausar   •   M música   •   N radar'],
    ]);

    const by = btnY + (isSmall ? 136 : 124);
    lines.forEach(([k, v], i) => { txt(k, W / 2 - 14, by + i * 18, isSmall ? 7 : 8, '#ffd23f', 'right'); txt(v, W / 2 + 14, by + i * 18, isSmall ? 7 : 8, '#e8eefc', 'left'); });
    if (best) txt('RECORDE: ' + best, W / 2, H - 18, 10, '#ffd23f');
  }
}


// =====================================================================
//  MENU DE PAUSA (v.2 — Game UI/UX Design System)
// =====================================================================
let pauseResumeRect = null, pauseCharRect = null, pauseRestartRect = null;
function drawPauseMenu() {
  overlay(0.68);
  const isPortrait = H > W;
  const isCompactH = H <= 520;
  const p = player;
  const pw = Math.min(440, W - 32);
  const ph = Math.min(320, H - 40);
  const px = W / 2 - pw / 2;
  const py = H / 2 - ph / 2;

  panel(px, py, pw, ph, true);
  txt('★ JOGO PAUSADO ★', W / 2, py + 26, isCompactH ? 12 : 14, '#ffd23f');

  // Mini painel de status do jogador
  const statsY = py + 48;
  const curPrefix = p && p.prefix ? '[' + p.prefix.name + '] ' : '';
  const charTitle = (p ? p.char.name : '') + ' • ' + curPrefix + (p && p.char.weaponType === 'orange' ? 'Laranjas' : p && p.char.weaponType === 'star' ? 'Estrelas' : 'Sabre');
  txt(charTitle, W / 2, statsY, 8.5, '#7fe0ff');

  const infoY = statsY + 22;
  txt("ONDA: " + wave + "   •   KILLS: " + kills + "   •   MOEDAS: " + coins + "   •   PTS: " + score, W / 2, infoY, 7.5, '#cfe8ff');

  // Botões de Ação
  const btnW = Math.min(280, pw - 40);
  const btnH = 32;
  const btnGap = 8;
  const b0Y = infoY + 22;

  const r0 = { x: W / 2 - btnW / 2, y: b0Y, w: btnW, h: btnH };
  const r1 = { x: W / 2 - btnW / 2, y: b0Y + btnH + btnGap, w: btnW, h: btnH };
  const r2 = { x: W / 2 - btnW / 2, y: b0Y + (btnH + btnGap) * 2, w: btnW, h: btnH };

  const hov0 = inRect(mouse.x, mouse.y, r0);
  const hov1 = inRect(mouse.x, mouse.y, r1);
  const hov2 = inRect(mouse.x, mouse.y, r2);

  panel(r0.x, r0.y, r0.w, r0.h, hov0);
  txt(gamepadInfo.connected ? '▶ CONTINUAR [START / A]' : '▶ CONTINUAR [ESC / ENTER]', W / 2, r0.y + 20, 8.5, hov0 ? '#7dff7d' : '#ffffff');

  panel(r1.x, r1.y, r1.w, r1.h, hov1);
  txt(gamepadInfo.connected ? '⇄ TROCAR PERSONAGEM [SELECT]' : '⇄ TROCAR PERSONAGEM [TAB]', W / 2, r1.y + 20, 8.5, hov1 ? '#ffd23f' : '#cfe8ff');

  panel(r2.x, r2.y, r2.w, r2.h, hov2);
  txt('🔄 REINICIAR PARTIDA [R]', W / 2, r2.y + 20, 8.5, hov2 ? '#ff6438' : '#e0e0e0');

  pauseResumeRect = r0;
  pauseCharRect = r1;
  pauseRestartRect = r2;
}

function drawOver() {
  overlay(0.75);
  const isCompactH = H <= 520;
  const isSmall = H < 650;
  txt('FIM DE JOGO', W / 2, isCompactH ? 26 : (isSmall ? H * 0.16 : H * 0.22), isCompactH ? 22 : (isSmall ? 32 : 44), '#ff5d5d');
  const rows = [
    ['PERSONAGEM', player.char.name],
    ['PONTOS', score], ['ONDA', wave], ['NÍVEL', player.level], ['ABATES', kills], ['MOEDAS', coins],
    ['TEMPO', `${Math.floor(playTime / 60)}:${String(Math.floor(playTime % 60)).padStart(2, '0')}`],
  ];
  const rowGap = isCompactH ? 16 : (isSmall ? 20 : 26);
  const startY = isCompactH ? 48 : ((isSmall ? H * 0.16 : H * 0.22) + (isSmall ? 40 : 55));
  rows.forEach(([k, v], i) => {
    txt(k, W / 2 - 20, startY + i * rowGap, isCompactH ? 8 : (isSmall ? 9 : 11), '#cfe8ff', 'right');
    txt('' + v, W / 2 + 20, startY + i * rowGap, isCompactH ? 8 : (isSmall ? 9 : 11), '#ffffff', 'left');
  });
  const recY = startY + rows.length * rowGap + (isCompactH ? 10 : 16);
  txt(score >= best && score > 0 ? 'NOVO RECORDE!' : 'RECORDE: ' + best, W / 2, recY, isCompactH ? 9 : (isSmall ? 11 : 13), '#ffd23f');
  if (time > 1 && Math.floor(time * 2) % 2 === 0) {
    txt(touch.active ? 'TOQUE NA TELA para jogar de novo' : 'ENTER ou CLIQUE para jogar de novo', W / 2, Math.min(H - 14, recY + (isCompactH ? 20 : 36)), isCompactH ? 8.5 : (isSmall ? 10 : 12));
  }
}

// =====================================================================
//  LOOP PRINCIPAL
// =====================================================================
function inRect(mx, my, r) { return r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h; }

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  updateGamepadState(dt);

  if (anyPressed('m')) { musicOn = !musicOn; if (musicOn) music.play().catch(() => { }); else music.pause(); }
  if (anyPressed('n')) { minimapOn = !minimapOn; SFX.select(); }
  if (anyPressed('c')) {
    saberColorIndex = (saberColorIndex + 1) % SABER_COLORS.length;
    localStorage.setItem('gabriel_saber_color', saberColorIndex);
    SFX.slash();
  }

  if (!ready) {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);
    txt('Carregando... ' + Math.floor(loaded / total * 100) + '%', W / 2, H / 2, 16);
  } else {
    if (state === 'loading') { reset(); state = 'menu'; }
    if (state === 'menu') {
      time += dt;
      cam.x = WORLD.w / 2 + Math.cos(time * 0.15) * 500; cam.y = WORLD.h / 2 + Math.sin(time * 0.15) * 350;
      clampCam();
      if (anyPressed('tab', 'p')) { state = 'select_char'; SFX.select(); }
      else if (anyPressed('enter', ' ')) {
        startWithSelectedCharacter();
      } else if (mouse.click) {
        if (inRect(mouse.x, mouse.y, menuCharRect) || Math.hypot(mouse.x - W / 2, mouse.y - H * 0.36) < 75) {
          state = 'select_char'; SFX.select();
        } else if (inRect(mouse.x, mouse.y, menuPlayRect)) {
          startWithSelectedCharacter();
        }
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'select_char') {
      if (anyPressed('1')) selectCharacter(0);
      if (anyPressed('2')) selectCharacter(1);
      if (anyPressed('3')) selectCharacter(2);
      if (anyPressed('arrowleft', 'a')) { selectedCharIndex = (selectedCharIndex + CHARACTERS.length - 1) % CHARACTERS.length; selectCharacter(selectedCharIndex); }
      if (anyPressed('arrowright', 'd')) { selectedCharIndex = (selectedCharIndex + 1) % CHARACTERS.length; selectCharacter(selectedCharIndex); }
      if (mouse.click) {
        if (charPrevRect && inRect(mouse.x, mouse.y, charPrevRect)) {
          selectedCharIndex = (selectedCharIndex + CHARACTERS.length - 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
          mouse.click = false; mouse.down = false;
        } else if (charNextRect && inRect(mouse.x, mouse.y, charNextRect)) {
          selectedCharIndex = (selectedCharIndex + 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
          mouse.click = false; mouse.down = false;
        } else if (charTabRects && charTabRects.some(r => inRect(mouse.x, mouse.y, r))) {
          const tab = charTabRects.find(r => inRect(mouse.x, mouse.y, r));
          if (tab) selectCharacter(tab.index);
          mouse.click = false; mouse.down = false;
        } else if (inRect(mouse.x, mouse.y, charPlayRect)) {
          startWithSelectedCharacter();
          mouse.click = false; mouse.down = false;
        } else if (inRect(mouse.x, mouse.y, charBackRect)) {
          state = 'menu'; SFX.select();
        } else {
          charCardRects.forEach(r => {
            if (inRect(mouse.x, mouse.y, r)) {
              if (selectedCharIndex === r.index) {
                startWithSelectedCharacter();
                mouse.click = false; mouse.down = false;
              } else {
                selectCharacter(r.index);
              }
            }
          });
        }
      }
      if (anyPressed('enter', ' ')) {
        startWithSelectedCharacter();
      }
      if (anyPressed('escape')) { state = 'menu'; SFX.select(); }
    } else if (state === 'play') {
      if (anyPressed('p', 'escape')) state = 'pause';
      else if (anyPressed('tab')) { state = 'select_char'; SFX.select(); }
      else if (freeze > 0) { freeze -= dt; shake = Math.max(0, shake - dt * 20); trauma = Math.max(0, trauma - dt * 0.8); }
      else update(dt);
    } else if (state === 'levelup') {
      // Atalhos diretos: 1, 2, 3 no teclado ou botões X, Y, B no controle
      if (pressed['1'] || (gpState && gpState.justPressed[2])) chooseUpgrade(0);
      else if (pressed['2'] || (gpState && gpState.justPressed[3])) chooseUpgrade(1);
      else if (pressed['3'] || (gpState && gpState.justPressed[1])) chooseUpgrade(2);

      if (state === 'levelup') {
        if (anyPressed('arrowleft', 'a')) {
          levelSel = (levelSel + levelChoices.length - 1) % levelChoices.length;
          SFX.select();
        }
        if (anyPressed('arrowright', 'd')) {
          levelSel = (levelSel + 1) % levelChoices.length;
          SFX.select();
        }
        const gpConfirm = gpState && (gpState.justPressed[0] || gpState.justPressed[7]);
        if (anyPressed('enter', ' ') || gpConfirm) {
          chooseUpgrade(levelSel);
        }
        if (mouse.click) {
          cardRects.forEach((r, i) => {
            if (mouse.x > r.x && mouse.x < r.x + r.w && mouse.y > r.y - 10 && mouse.y < r.y + r.h) chooseUpgrade(i);
          });
        }
        mouse.down = false;
      }
    } else if (state === 'shop') {
      for (const k of ['1', '2', '3', '4']) if (pressed[k]) buyShopItem(+k - 1);
      const totalOptions = SHOP_ITEMS.length + 1; // 0..3 itens, 4 = Continuar
      if (anyPressed('arrowleft', 'a')) {
        shopSel = (shopSel + totalOptions - 1) % totalOptions;
        SFX.select();
      }
      if (anyPressed('arrowright', 'd')) {
        shopSel = (shopSel + 1) % totalOptions;
        SFX.select();
      }
      if (anyPressed('arrowup', 'w')) {
        if (shopSel === SHOP_ITEMS.length) shopSel = 0;
        SFX.select();
      }
      if (anyPressed('arrowdown', 's')) {
        shopSel = SHOP_ITEMS.length;
        SFX.select();
      }

      // Confirmar compra com Botão A (0), RT (7) ou Enter
      const gpShopConfirm = gpState && (gpState.justPressed[0] || gpState.justPressed[7]);
      if (anyPressed('enter', ' ') || gpShopConfirm) {
        if (shopSel === SHOP_ITEMS.length) {
          state = 'play'; SFX.wave(); player.inv = Math.max(player.inv, 0.8);
        } else {
          buyShopItem(shopSel);
        }
      }

      // Sair da loja com Botão B (1), Start (9) ou Escape
      const gpShopExit = gpState && (gpState.justPressed[1] || gpState.justPressed[9]);
      if (anyPressed('escape', 'start') || gpShopExit) {
        state = 'play';
        SFX.wave();
        player.inv = Math.max(player.inv, 0.8);
      }

      if (mouse.click) {
        if (inRect(mouse.x, mouse.y, shopExitRect)) {
          state = 'play'; SFX.wave(); player.inv = Math.max(player.inv, 0.8);
          mouse.click = false; mouse.down = false;
        } else {
          shopRects.forEach((r, i) => { if (inRect(mouse.x, mouse.y, r)) buyShopItem(i); });
        }
      }
    } else if (state === 'pause') {
      if (anyPressed('p', 'escape', 'enter') || (gpState && (gpState.justPressed[0] || gpState.justPressed[9]))) {
        state = 'play';
        mouse.click = false; mouse.down = false;
      }
      if (anyPressed('tab') || (gpState && gpState.justPressed[8])) { state = 'select_char'; SFX.select(); }
      if (anyPressed('r')) { reset(); state = 'play'; SFX.wave(); }
      if (mouse.click) {
        if (inRect(mouse.x, mouse.y, pauseResumeRect)) { state = 'play'; }
        else if (inRect(mouse.x, mouse.y, pauseCharRect)) { state = 'select_char'; SFX.select(); }
        else if (inRect(mouse.x, mouse.y, pauseRestartRect)) { reset(); state = 'play'; SFX.wave(); }
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'over') {
      time += dt;
      for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
      particles = particles.filter(q => q.life > 0);
      if (time > 1 && (anyPressed('enter') || mouse.click)) { state = 'select_char'; music.volume = 0.3; mouse.down = false; }
    }

    ctx.clearRect(0, 0, W, H);
    drawWorld();
    if (state === 'menu') drawMenu();
    else if (state === 'select_char') drawCharacterSelect();
    else {
      drawHUD();
      if (state === 'levelup') drawLevelUp();
      if (state === 'shop') drawShop();
      if (state === 'pause') {
        overlay(0.5);
        txt('PAUSADO', W / 2, H / 2, 38);
        txt(touch.active ? 'TOQUE NA TELA para continuar' : 'P / START para continuar  •  TAB / SELECT trocar', W / 2, H / 2 + 38, 10);
      }
      if (state === 'over') drawOver();
    }
    drawGamepadToast();
  }

  for (const k in pressed) delete pressed[k];
  mouse.click = false; mouse.rclick = false; mouse.moved = false;
  touch.justAtk = false; touch.justDash = false; touch.justUlt = false;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
