// ---------- ÁUDIO ----------
const SND_LIST = {
  swing1: 'swing.wav', swing2: 'swing2.wav', swing3: 'swing3.wav', unsheathe: 'sword-unsheathe.wav',
  magic: 'magic1.wav', coin: 'coin3.wav', bottle: 'bottle.wav', bubble: 'bubble.wav', clang: 'metal-small1.wav',
  ui1: 'interface1.wav', ui2: 'interface2.wav', slime1: 'slime1.wav', slime3: 'slime3.wav', slime5: 'slime5.wav',
  mnstr1: 'mnstr1.wav', mnstr7: 'mnstr7.wav', giant1: 'giant1.wav', giant3: 'giant3.wav', shade: 'shade1.wav',
  bite: 'bite-small.wav',
  meteor_crash: 'meteor_crash.ogg', shield_block: 'shield_block.ogg', boss_roar: 'boss_roar.ogg',
  boss_awake: 'boss_awake.ogg', lucky_open: 'lucky_open.ogg', blood_rite: 'blood_rite.ogg',
  book_open: 'book_open.ogg', book_close: 'book_close.ogg', book_flip1: 'book_flip1.ogg', book_flip2: 'book_flip2.ogg',
  coins_bag: 'coins_bag.ogg', portal_open: 'portal_open.ogg', footstep1: 'footstep1.ogg', footstep2: 'footstep2.ogg',
  clash1: 'clash1.ogg', clash2: 'clash2.ogg', heavy_hit1: 'heavy_hit1.ogg', heavy_hit2: 'heavy_hit2.ogg',
  glass_break1: 'glass_break1.ogg', glass_break2: 'glass_break2.ogg',
  wood_break1: 'wood_break1.ogg', wood_break2: 'wood_break2.ogg', rock_break: 'rock_break.ogg',
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

const bossMusic = new Audio('assets/audio/music/boss_battle.mp3');
bossMusic.loop = true;
bossMusic.volume = 0.35;
bossMusic.preload = 'auto';
let bossMusicActive = false;

function playBossMusic() {
  bossMusicActive = true;
  if (!musicOn) return;
  if (activeCharMusic && !activeCharMusic.paused) {
    try { activeCharMusic.pause(); } catch (_) {}
  }
  if (!bossMusic.paused) return;
  bossMusic.currentTime = 0;
  bossMusic.volume = 0.35;
  const p = bossMusic.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

function stopBossMusic(resumeHero = true) {
  bossMusicActive = false;
  try {
    bossMusic.pause();
    bossMusic.currentTime = 0;
  } catch (_) {}
  if (resumeHero && musicOn && typeof state !== 'undefined' && state === 'play') {
    startMusic();
  }
}

function playCharacterMusic(cid) {
  if (!musicOn) return;
  const target = charAudioMap[cid];
  if (!target) return;

  if (!bossMusic.paused) {
    try { bossMusic.pause(); } catch (_) {}
  }
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
  bossMusicActive = false;
  try { bossMusic.pause(); bossMusic.currentTime = 0; } catch (_) {}
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
  get volume() {
    if (bossMusicActive && !bossMusic.paused) return bossMusic.volume;
    return activeCharMusic ? activeCharMusic.volume : 0.3;
  },
  set volume(v) {
    const vol = clamp(v, 0, 1);
    bossMusic.volume = vol;
    if (activeCharMusic) activeCharMusic.volume = vol;
  },
  get paused() {
    if (bossMusicActive) return bossMusic.paused;
    return activeCharMusic ? activeCharMusic.paused : true;
  },
  play: () => {
    if (bossMusicActive) return bossMusic.play().catch(() => {});
    if (activeCharMusic) return activeCharMusic.play();
    const cur = CHARACTERS[selectedCharIndex];
    if (cur) playCharacterMusic(cur.id);
    return Promise.resolve();
  },
  pause: () => {
    try { bossMusic.pause(); } catch (_) {}
    if (activeCharMusic) activeCharMusic.pause();
  }
};

function startMusic() {
  if (!musicOn) return;
  if (bossMusicActive && typeof state !== 'undefined' && (state === 'play' || state === 'levelup')) {
    if (bossMusic.paused) {
      bossMusic.volume = 0.35;
      const p = bossMusic.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
    return;
  }
  if (activeCharMusic && !activeCharMusic.paused) return;
  if (typeof state !== 'undefined' && (state === 'play' || state === 'select_char' || state === 'shop' || state === 'levelup')) {
    const cur = (typeof CHARACTERS !== 'undefined' && CHARACTERS[selectedCharIndex]) ? CHARACTERS[selectedCharIndex] : null;
    if (cur) playCharacterMusic(cur.id);
  }
}

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
  slash: () => { play(pick(['swing1', 'swing2', 'swing3']), 0.35, 0.15); beep(240 * (0.92 + Math.random() * 0.16), 0.04, 'triangle', 0.018, -90); },
  hit: () => beep(140 * (0.92 + Math.random() * 0.16), 0.08, 'square', 0.05, -80),
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
  reflect: () => { play(pick(['clash1', 'clash2']), 0.55, 0.12); play('clang', 0.25, 0.15); },
  level: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.15, 'triangle', 0.06), i * 80)); },
  select: () => play('ui1', 0.5, 0),
  wave: () => [400, 500, 650, 800].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.05), i * 110)),
  boss: () => { play('giant1', 0.65, 0); play('boss_roar', 0.6, 0.05); },
  bossAwake: () => play('boss_awake', 0.7, 0.05),
  bossTelegraph: () => { beep(165, 0.32, 'sawtooth', 0.06, 220); beep(95, 0.38, 'triangle', 0.07, 90); },
  crystalShatter: () => { play(pick(['glass_break1', 'glass_break2']), 0.6, 0.12); [980, 1320, 1760].forEach((f, i) => setTimeout(() => beep(f * (0.95 + Math.random() * 0.1), 0.09, 'triangle', 0.045, -260), i * 32)); },
  bossDie: () => play('giant3', 0.7, 0),
  meteorCrash: () => play('meteor_crash', 0.65, 0.1),
  luckyOpen: () => play('lucky_open', 0.65, 0.08),
  bloodRite: () => play('blood_rite', 0.6, 0.05),
  ult: () => { play('magic', 0.6, 0); play('unsheathe', 0.5, 0); },
  over: () => [400, 300, 220, 150].forEach((f, i) => setTimeout(() => beep(f, 0.25, 'sawtooth', 0.05), i * 200)),
  barrel: () => play('bubble', 0.3, 0.2),
  barrelBreak: () => play(pick(['wood_break1', 'wood_break2']), 0.5, 0.15),
  explode: () => { play('giant3', 0.45, 0.25); beep(95, 0.32, 'sawtooth', 0.09, -65); },
  rockSlam: () => play('rock_break', 0.55, 0.12),
  shrine: () => { play('magic', 0.6, 0.1); [587, 784, 988, 1175].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.06), i * 65)); },
  dodge: () => { play('clang', 0.45, 0.25); beep(920, 0.12, 'sine', 0.06, 480); },
  freezeBomb: () => { play('magic', 0.55, 0.3); beep(1100, 0.22, 'triangle', 0.06, -700); },
  magnet: () => { [440, 660, 880, 1320].forEach((f, i) => setTimeout(() => beep(f, 0.09, 'sine', 0.05), i * 50)); },
  shieldBreak: () => { play(pick(['clash1', 'clash2']), 0.45, 0.12); play('shield_block', 0.65, 0.1); beep(300, 0.2, 'sawtooth', 0.06, -150); },
  shopBuy: () => { play('coins_bag', 0.55, 0.1); beep(880, 0.12, 'triangle', 0.05, 400); },
  shopNo: () => beep(180, 0.15, 'sawtooth', 0.05, -50),
  critHit: () => play(pick(['heavy_hit1', 'heavy_hit2']), 0.42, 0.12),
  bookOpen: () => play('book_open', 0.55, 0.05),
  bookClose: () => play('book_close', 0.55, 0.05),
  bookFlip: () => play(pick(['book_flip1', 'book_flip2']), 0.5, 0.08),
  portal: () => play('portal_open', 0.6, 0.05),
  footstep: () => play(pick(['footstep1', 'footstep2']), 0.11, 0.15),
};

