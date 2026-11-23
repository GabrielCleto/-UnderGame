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
let eventSynthMusicActive = false;
let eventSynthTimer = null;
let actx = null;
let musicGain = null;
let audioUnlocked = false;
let _noiseBuf = null;

function ensureAudioCtx() {
  try {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      musicGain = actx.createGain();
      musicGain.gain.value = 0.72;
      musicGain.connect(actx.destination);
    }
    if (!musicGain && actx) {
      musicGain = actx.createGain();
      musicGain.gain.value = 0.72;
      musicGain.connect(actx.destination);
    }
    return actx;
  } catch (_) {
    return null;
  }
}

function unlockEventAudio() {
  const ctxA = ensureAudioCtx();
  if (!ctxA) return false;
  if (ctxA.state === 'suspended') {
    ctxA.resume().then(() => {
      audioUnlocked = true;
      if (typeof window !== 'undefined' && window.updateEventAudioBtnUI) window.updateEventAudioBtnUI();
    }).catch(() => {});
  } else if (ctxA.state === 'running') {
    audioUnlocked = true;
  }
  if (typeof window !== 'undefined' && window.updateEventAudioBtnUI) window.updateEventAudioBtnUI();
  return ctxA.state === 'running';
}

function synthNote(freq, dur, type = 'triangle', vol = 0.16, cutoff = 1800, slide = 0) {
  if (!musicOn) return;
  const ctxA = actx;
  if (!ctxA || ctxA.state !== 'running') return;
  try {
    const now = ctxA.currentTime;
    const o = ctxA.createOscillator();
    const flt = ctxA.createBiquadFilter();
    const g = ctxA.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(28, freq + slide), now + dur);
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(cutoff, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + Math.min(0.025, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    o.connect(flt).connect(g).connect(musicGain || ctxA.destination);
    o.start(now);
    o.stop(now + dur + 0.02);
  } catch (_) {}
}

function synthKick(startF = 115, endF = 38, dur = 0.16, vol = 0.24) {
  if (!musicOn || !actx || actx.state !== 'running') return;
  try {
    const now = actx.currentTime;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(startF, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(25, endF), now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g).connect(musicGain || actx.destination);
    o.start(now);
    o.stop(now + dur + 0.02);
  } catch (_) {}
}

function synthPerc(dur = 0.06, vol = 0.08, highpass = 3500) {
  if (!musicOn || !actx || actx.state !== 'running') return;
  try {
    if (!_noiseBuf) {
      const len = Math.floor(actx.sampleRate * 0.5);
      _noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
      const data = _noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const now = actx.currentTime;
    const src = actx.createBufferSource();
    src.buffer = _noiseBuf;
    const flt = actx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(highpass, now);
    flt.Q.value = 1.2;
    const g = actx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(flt).connect(g).connect(musicGain || actx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);
  } catch (_) {}
}

// =====================================================================
//  GERADOR DE TRILHA SONORA PROCEDURAL DOS EVENTOS MEGALOMANÍACOS
//  WebAudio Synth: Jazz Noir, Marcha Carmesim, Vazio, Glacial, Solar, Surreal
// =====================================================================
const EVENT_THEMES = {
  noir: {
    name: '🎷 JAZZ NOIR',
    tempo: 390,
    bass: [110.0, 130.81, 146.83, 155.56, 146.83, 164.81, 196.0, 155.56], // Lam blues walking bass
    chords: [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [146.83, 261.63, 329.63, 440.0], // Dm9
      [196.0, 246.94, 329.63, 392.0], // G13
      [164.81, 207.65, 293.66, 392.0], // E7#9
    ],
    melody: [440.0, 0, 523.25, 587.33, 622.25, 587.33, 523.25, 392.0, 440.0, 0, 659.25, 587.33, 523.25, 493.88, 392.0, 329.63],
    wave: 'triangle',
    cutoff: 1250,
    vinyl: true,
  },
  blood: {
    name: '🩸 MARCHA DE SANGUE',
    tempo: 280,
    bass: [73.42, 73.42, 87.31, 73.42, 110.0, 98.0, 87.31, 69.3], // D menor sombrio
    chords: [
      [146.83, 174.61, 220.0],
      [138.59, 174.61, 207.65],
      [130.81, 164.81, 196.0],
      [123.47, 155.56, 185.0]
    ],
    melody: [293.66, 349.23, 329.63, 293.66, 440.0, 415.30, 349.23, 277.18],
    wave: 'sawtooth',
    cutoff: 900,
    kick: true,
  },
  void: {
    name: '🌌 SINFONIA DO VAZIO',
    tempo: 360,
    bass: [65.41, 77.78, 65.41, 92.5, 65.41, 110.0, 103.83, 87.31],
    chords: [
      [196.0, 246.94, 311.13, 392.0],
      [185.0, 233.08, 293.66, 369.99],
    ],
    melody: [523.25, 622.25, 783.99, 622.25, 523.25, 466.16, 392.0, 466.16],
    wave: 'sine',
    cutoff: 2200,
  },
  frost: {
    name: '❄️ VALSA GLACIAL',
    tempo: 340,
    bass: [130.81, 164.81, 196.0, 246.94],
    chords: [
      [523.25, 659.25, 783.99, 1046.5],
      [440.0, 523.25, 659.25, 880.0]
    ],
    melody: [1046.5, 987.77, 783.99, 659.25, 880.0, 783.99, 659.25, 523.25],
    wave: 'sine',
    cutoff: 3600,
    wind: true,
  },
  solar: {
    name: '☀️ MARCHA SOLAR',
    tempo: 250,
    bass: [82.41, 123.47, 82.41, 146.83, 164.81, 123.47],
    chords: [
      [329.63, 415.3, 493.88, 659.25],
      [293.66, 369.99, 440.0, 587.33]
    ],
    melody: [329.63, 415.30, 493.88, 659.25, 587.33, 493.88, 440.0, 392.0],
    wave: 'sawtooth',
    cutoff: 1700,
    kick: true,
  },
  psychedelic: {
    name: '🌀 FEBRE SURREAL',
    tempo: 260,
    bass: [98.0, 146.83, 116.54, 98.0, 174.61, 146.83, 130.81, 196.0],
    chords: [
      [293.66, 369.99, 440.0, 554.37],
      [261.63, 329.63, 392.0, 493.88],
    ],
    melody: [587.33, 739.99, 880.0, 659.25, 783.99, 1046.5, 880.0, 587.33],
    wave: 'sawtooth',
    sweep: true,
    kick: true,
  }
};

let eventBeatIdx = 0;
let currentEventTheme = null;

function resolveEventThemeKey(key) {
  if (key === 'bloodmoon') return 'blood';
  if (key === 'void_eclipse') return 'void';
  if (key === 'glacial') return 'frost';
  if (key === 'magma_surge') return 'solar';
  return EVENT_THEMES[key] ? key : 'noir';
}

function playEventMusic(themeKey) {
  const k = resolveEventThemeKey(themeKey);
  currentEventTheme = EVENT_THEMES[k];
  eventSynthMusicActive = true;
  eventBeatIdx = 0;

  // Pausa qualquer música normal que esteja tocando
  if (activeCharMusic && !activeCharMusic.paused) {
    try { activeCharMusic.pause(); } catch (_) {}
  }
  if (typeof bossMusic !== 'undefined' && !bossMusic.paused) {
    try { bossMusic.pause(); } catch (_) {}
  }

  if (eventSynthTimer) clearInterval(eventSynthTimer);
  eventSynthTimer = setInterval(() => {
    if (!musicOn || !eventSynthMusicActive || !currentEventTheme) return;
    if (!actx || actx.state !== 'running') return;
    const t = currentEventTheme;
    const step = eventBeatIdx;
    const durS = (t.tempo / 1000) * 0.9;
    const sweepCut = t.sweep ? (700 + Math.abs(Math.sin(step * 0.45)) * 2200) : (t.cutoff || 1600);

    // 1. Baixo marcante
    const bNote = t.bass[step % t.bass.length];
    synthNote(bNote, durS, t.wave, 0.17, sweepCut);

    // 2. Acordes harmônicos
    if (step % 2 === 0) {
      const chord = t.chords[Math.floor(step / 2) % t.chords.length];
      chord.forEach((f, ci) => {
        setTimeout(() => {
          synthNote(f, durS * 1.75, 'triangle', 0.065, 1900);
        }, ci * 18);
      });
    }

    // 3. Melodia principal / solo (sax noir, sino glacial, órgão de sangue, acid synth)
    if (t.melody && (t.melody[step % t.melody.length] > 0)) {
      const mNote = t.melody[step % t.melody.length];
      synthNote(mNote, durS * 0.95, t.vinyl ? 'sine' : (t.wind ? 'sine' : 'triangle'), 0.11, sweepCut + 800, t.vinyl ? 4 : 0);
    }

    // 4. Texturas e percussão por tema
    if (t.vinyl) {
      // Prato escovado estilo jazz swing + estalo sutil de vinil
      synthPerc(step % 2 === 0 ? 0.055 : 0.035, step % 2 === 0 ? 0.06 : 0.035, 5200);
      if (Math.random() < 0.45) synthPerc(0.015, 0.025, 2400);
    }
    if (t.kick && step % 2 === 0) {
      synthKick(115, 38, 0.15, 0.22);
    }
    if (t.wind && step % 3 === 0) {
      synthPerc(0.28, 0.045, 1100);
    }

    eventBeatIdx++;
  }, currentEventTheme.tempo);

  if (typeof window !== 'undefined' && window.updateEventAudioBtnUI) window.updateEventAudioBtnUI();
}

function stopEventMusic(resumeHero = false) {
  eventSynthMusicActive = false;
  if (eventSynthTimer) {
    clearInterval(eventSynthTimer);
    eventSynthTimer = null;
  }
  currentEventTheme = null;
  if (resumeHero && musicOn && typeof state !== 'undefined' && state === 'play') {
    startMusic();
  }
  if (typeof window !== 'undefined' && window.updateEventAudioBtnUI) window.updateEventAudioBtnUI();
}

function toggleEventMusicMute() {
  unlockEventAudio();
  if (!musicOn) {
    musicOn = true;
    if (typeof waveEvent !== 'undefined' && waveEvent) {
      playEventMusic(waveEvent);
    }
  } else {
    musicOn = false;
    if (activeCharMusic && !activeCharMusic.paused) try { activeCharMusic.pause(); } catch (_) {}
  }
  if (typeof window !== 'undefined' && window.updateEventAudioBtnUI) window.updateEventAudioBtnUI();
}

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
  if (eventSynthMusicActive && currentEventTheme) {
    if (activeCharMusic && !activeCharMusic.paused) {
      try { activeCharMusic.pause(); } catch (_) {}
    }
    return;
  }
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

function beep(freq = 440, dur = 0.1, type = 'square', vol = 0.05, slide = 0) {
  if (!sfxOn) return;
  if (!actx || actx.state !== 'running') return;
  try {
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

const PENTA_HZ = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1567.98, 1760.0];
let gemPitchIdx = 0, gemPitchLast = 0;

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
  gem: () => {
    const now = performance.now();
    if (now - gemPitchLast < 420) gemPitchIdx = Math.min(PENTA_HZ.length - 1, gemPitchIdx + 1);
    else gemPitchIdx = 0;
    gemPitchLast = now;
    beep(PENTA_HZ[gemPitchIdx], 0.065, 'triangle', 0.032, 60);
  },
  feverUp: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => setTimeout(() => beep(f, 0.12, 'triangle', 0.045, 90), i * 48)),
  synergy: () => {
    play('magic', 0.55, 0.05);
    [440, 554.37, 659.25, 880, 1108.73, 1318.5].forEach((f, i) => {
      setTimeout(() => {
        beep(f, 0.18, 'triangle', 0.05, 40);
        beep(f * 0.5, 0.20, 'sine', 0.04, 0);
      }, i * 55);
    });
  },
  multiKill: () => [880, 1174.66, 1567.98].forEach((f, i) => setTimeout(() => beep(f, 0.075, 'triangle', 0.038, 120), i * 36)),
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

