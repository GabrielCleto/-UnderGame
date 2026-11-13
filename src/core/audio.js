// ---------- ÁUDIO ----------
const SND_LIST = {
  swing1: 'swing.wav', swing2: 'swing2.wav', swing3: 'swing3.wav', unsheathe: 'sword-unsheathe.wav',
  magic: 'magic1.wav', coin: 'coin3.wav', bottle: 'bottle.wav', bubble: 'bubble.wav', clang: 'metal-small1.wav',
  ui1: 'interface1.wav', ui2: 'interface2.wav', slime1: 'slime1.wav', slime3: 'slime3.wav', slime5: 'slime5.wav',
  mnstr1: 'mnstr1.wav', mnstr7: 'mnstr7.wav', giant1: 'giant1.wav', giant3: 'giant3.wav', shade: 'shade1.wav',
  bite: 'bite-small.wav',
};
const SND = {};
for (const k in SND_LIST) { const a = new Audio('assets/audio/sfx/' + SND_LIST[k]); a.preload = 'auto'; SND[k] = a; }
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
// =====================================================================
//  SISTEMA DE MÚSICA & TRILHAS DOS PERSONAGENS (v.2)
// =====================================================================
const CHAR_MUSIC_FILES = {
  manguinha: 'assets/audio/music/Manguinha.mp3',
  amxral: 'assets/audio/music/amxral.mp3',
  tuiuba: 'assets/audio/music/tuiuba.mp3'
};

const charAudioMap = {};
for (const cid in CHAR_MUSIC_FILES) {
  try {
    const aud = new Audio(encodeURI(CHAR_MUSIC_FILES[cid]));
    aud.loop = true;
    aud.volume = 0.35;
    aud.preload = 'auto';
    charAudioMap[cid] = aud;
  } catch (err) {
    console.warn('Erro ao inicializar áudio de', cid, err);
  }
}

let activeCharMusic = null;
let activeCharId = null;
let musicOn = true;

function playCharacterMusic(cid) {
  if (!musicOn) return;
  const target = charAudioMap[cid];
  if (!target) return;

  if (activeCharMusic === target && !target.paused) return;

  // Pausa o anterior de forma limpa
  if (activeCharMusic && activeCharMusic !== target) {
    try {
      activeCharMusic.pause();
      activeCharMusic.currentTime = 0;
    } catch (_) {}
  }

  activeCharMusic = target;
  activeCharId = cid;
  target.currentTime = 0;
  target.volume = 0.35;
  const p = target.play();
  if (p && typeof p.catch === 'function') {
    p.catch(() => {});
  }
}

function stopCharacterMusic() {
  if (activeCharMusic) {
    try {
      activeCharMusic.pause();
      activeCharMusic.currentTime = 0;
    } catch (_) {}
    activeCharMusic = null;
    activeCharId = null;
  }
}

function enterCharacterSelect() {
  state = 'select_char';
  SFX.select();
  const cur = CHARACTERS[selectedCharIndex];
  if (cur) playCharacterMusic(cur.id);
}

const music = {
  get loop() { return true; },
  set loop(_) {},
  get volume() { return activeCharMusic ? activeCharMusic.volume : 0.3; },
  set volume(v) { if (activeCharMusic) activeCharMusic.volume = clamp(v, 0, 1); },
  get paused() { return activeCharMusic ? activeCharMusic.paused : true; },
  play: () => {
    if (activeCharMusic) return activeCharMusic.play();
    const cur = CHARACTERS[selectedCharIndex];
    if (cur) playCharacterMusic(cur.id);
    return Promise.resolve();
  },
  pause: () => {
    if (activeCharMusic) activeCharMusic.pause();
  }
};

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

