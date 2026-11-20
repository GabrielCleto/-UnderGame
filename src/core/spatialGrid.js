// =====================================================================
//  SPATIAL GRID O(N) + GPU FX HUB + QUALIDADE GRÁFICA & TELEMETRIA
//  Zero-GC em hot loops, suporte a 60Hz/120Hz/144Hz e WCAG Photosensitivity
// =====================================================================

const GFX_STORAGE_KEY = 'underground_gfx_v1';

const GFX_BUDGET = {
  ultra: { label: 'ULTRA', maxParticles: 1200, maxEnemies: 280, useShader: true, useBloomBlur: true, dprCap: 1.5 },
  high:  { label: 'ALTA',  maxParticles: 750,  maxEnemies: 220, useShader: true, useBloomBlur: false, dprCap: 1.25 },
  low:   { label: 'LEVE',  maxParticles: 280,  maxEnemies: 150, useShader: false, useBloomBlur: false, dprCap: 1.0 },
};

const _prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

const _isCoarsePointer = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(pointer: coarse)').matches
  : false;

const GFX_SETTINGS = {
  quality: _isCoarsePointer ? 'high' : 'ultra',
  reduceShake: _prefersReducedMotion,
  reduceFlash: _prefersReducedMotion,
  showPerf: false,
};

function loadGfxSettings() {
  try {
    const raw = localStorage.getItem(GFX_STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d && typeof d === 'object') {
      if (d.quality && GFX_BUDGET[d.quality]) GFX_SETTINGS.quality = d.quality;
      if (typeof d.reduceShake === 'boolean') GFX_SETTINGS.reduceShake = d.reduceShake;
      if (typeof d.reduceFlash === 'boolean') GFX_SETTINGS.reduceFlash = d.reduceFlash;
      if (typeof d.showPerf === 'boolean') GFX_SETTINGS.showPerf = d.showPerf;
    }
  } catch (_) {}
}
loadGfxSettings();

function saveGfxSettings() {
  try {
    localStorage.setItem(GFX_STORAGE_KEY, JSON.stringify({
      quality: GFX_SETTINGS.quality,
      reduceShake: GFX_SETTINGS.reduceShake,
      reduceFlash: GFX_SETTINGS.reduceFlash,
      showPerf: GFX_SETTINGS.showPerf,
    }));
  } catch (_) {}
}

function getGfxBudget() {
  return GFX_BUDGET[GFX_SETTINGS.quality] || GFX_BUDGET.high;
}

function cycleGfxQuality() {
  const order = ['ultra', 'high', 'low'];
  const idx = order.indexOf(GFX_SETTINGS.quality);
  GFX_SETTINGS.quality = order[(idx + 1) % order.length];
  saveGfxSettings();
  if (typeof applyPixiQuality === 'function') applyPixiQuality();
  if (typeof texts !== 'undefined' && typeof player !== 'undefined' && player && typeof state !== 'undefined' && state === 'play') {
    texts.push({
      x: player.x, y: player.y - 125,
      txt: 'GRÁFICOS: ' + getGfxBudget().label,
      life: 1.3, color: '#62f6ff', size: 11,
    });
  }
  return GFX_SETTINGS.quality;
}

function toggleReduceShake() {
  GFX_SETTINGS.reduceShake = !GFX_SETTINGS.reduceShake;
  GFX_SETTINGS.reduceFlash = GFX_SETTINGS.reduceShake;
  saveGfxSettings();
  return GFX_SETTINGS.reduceShake;
}

function togglePerfMonitor() {
  GFX_SETTINGS.showPerf = !GFX_SETTINGS.showPerf;
  saveGfxSettings();
  return GFX_SETTINGS.showPerf;
}

// =====================================================================
//  SPATIAL HASH GRID O(N) — ZERO ALOCAÇÕES POR FRAME
// =====================================================================
class SpatialGrid {
  constructor(cellSize = 96, worldW = 2600, worldH = 2100) {
    this.cellSize = cellSize;
    this.invCell = 1 / cellSize;
    this.cols = Math.ceil(worldW / cellSize) + 2;
    this.rows = Math.ceil(worldH / cellSize) + 2;
    const total = this.cols * this.rows;
    this.cells = new Array(total);
    this.stamps = new Int32Array(total);
    this.counts = new Int32Array(total);
    for (let i = 0; i < total; i++) {
      this.cells[i] = [];
    }
    this.stamp = 1;
  }

  clear() {
    this.stamp++;
    if (this.stamp >= 0x7fffffff) {
      this.stamp = 1;
      this.stamps.fill(0);
    }
  }

  insert(obj) {
    let cx = (obj.x * this.invCell) | 0;
    let cy = (obj.y * this.invCell) | 0;
    if (cx < 0) cx = 0; else if (cx >= this.cols) cx = this.cols - 1;
    if (cy < 0) cy = 0; else if (cy >= this.rows) cy = this.rows - 1;
    const idx = cy * this.cols + cx;
    const bucket = this.cells[idx];
    if (this.stamps[idx] !== this.stamp) {
      this.stamps[idx] = this.stamp;
      this.counts[idx] = 0;
    }
    const pos = this.counts[idx];
    bucket[pos] = obj;
    this.counts[idx] = pos + 1;
  }

  query(x, y, radius, outArr) {
    outArr.length = 0;
    const inv = this.invCell;
    let minX = ((x - radius) * inv) | 0;
    let maxX = ((x + radius) * inv) | 0;
    let minY = ((y - radius) * inv) | 0;
    let maxY = ((y + radius) * inv) | 0;
    if (minX < 0) minX = 0;
    if (minY < 0) minY = 0;
    if (maxX >= this.cols) maxX = this.cols - 1;
    if (maxY >= this.rows) maxY = this.rows - 1;

    const st = this.stamp;
    for (let cy = minY; cy <= maxY; cy++) {
      const rowOff = cy * this.cols;
      for (let cx = minX; cx <= maxX; cx++) {
        const idx = rowOff + cx;
        if (this.stamps[idx] !== st) continue;
        const n = this.counts[idx];
        const bucket = this.cells[idx];
        for (let k = 0; k < n; k++) {
          outArr.push(bucket[k]);
        }
      }
    }
    return outArr;
  }
}

const enemyGrid = new SpatialGrid(96, 2600, 2100);
const _gridQueryBuf = [];
const _sepQueryBuf = [];

// =====================================================================
//  GPU_FX HUB — SHOCKWAVES, CHROMA, ZOOM PUNCH, TRAUMA SHAKE, SLOW-MO
//  Decai em REAL-TIME (não congela em hit-stop) + WCAG Flash Limiter
// =====================================================================
const GPU_FX = {
  shockwaves: [
    { active: false, wx: 0, wy: 0, radius: 0, maxR: 260, strength: 0, age: 0, dur: 0.45 },
    { active: false, wx: 0, wy: 0, radius: 0, maxR: 260, strength: 0, age: 0, dur: 0.45 },
    { active: false, wx: 0, wy: 0, radius: 0, maxR: 260, strength: 0, age: 0, dur: 0.45 },
  ],
  chromaVal: 0,
  zoomPunchVal: 0,
  flashAmt: 0,
  flashCol: [1, 1, 1],
  _flashTimestamps: [],
  slowMoT: 0,
  slowMoScale: 1,
  shakeT: 0,
  shakeX: 0,
  shakeY: 0,
  shakeRoll: 0,

  shockwave(wx, wy, maxR = 260, strength = 0.042, dur = 0.44) {
    if (GFX_SETTINGS.reduceShake) {
      strength *= 0.35;
    }
    let chosen = this.shockwaves[0];
    let oldestAge = -1;
    for (let i = 0; i < 3; i++) {
      const s = this.shockwaves[i];
      if (!s.active) {
        chosen = s;
        break;
      }
      if (s.age > oldestAge) {
        oldestAge = s.age;
        chosen = s;
      }
    }
    chosen.active = true;
    chosen.wx = wx;
    chosen.wy = wy;
    chosen.radius = 8;
    chosen.maxR = maxR;
    chosen.strength = strength;
    chosen.age = 0;
    chosen.dur = Math.max(0.15, dur);
  },

  chroma(amt = 0.01) {
    const scale = GFX_SETTINGS.reduceShake ? 0.25 : 1.0;
    this.chromaVal = Math.min(0.025, Math.max(this.chromaVal, amt * scale));
  },

  chromaPunch(amt = 0.01) {
    this.chroma(amt);
  },

  zoomPunch(amt = 0.04) {
    const scale = GFX_SETTINGS.reduceShake ? 0.25 : 1.0;
    this.zoomPunchVal = clamp(this.zoomPunchVal + amt * scale, -0.08, 0.12);
  },

  flash(r = 1, g = 1, b = 1, alpha = 0.24) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // WCAG 2.3.1: máximo de 3 flashes em janela de 1000ms
    while (this._flashTimestamps.length > 0 && now - this._flashTimestamps[0] > 1000) {
      this._flashTimestamps.shift();
    }
    if (this._flashTimestamps.length >= 3) return;
    this._flashTimestamps.push(now);

    const maxA = GFX_SETTINGS.reduceFlash ? 0.08 : alpha;
    this.flashCol[0] = r;
    this.flashCol[1] = g;
    this.flashCol[2] = b;
    this.flashAmt = Math.min(0.42, Math.max(this.flashAmt, maxA));
  },

  slowMo(dur = 0.22, scale = 0.28) {
    this.slowMoT = Math.max(this.slowMoT, dur);
    this.slowMoScale = Math.min(this.slowMoScale, scale);
  },

  update(realDt) {
    for (let i = 0; i < 3; i++) {
      const s = this.shockwaves[i];
      if (!s.active) continue;
      s.age += realDt;
      if (s.age >= s.dur) {
        s.active = false;
        s.strength = 0;
      } else {
        const k = s.age / s.dur;
        // Ease-out quad expansion
        const ek = 1 - (1 - k) * (1 - k);
        s.radius = s.maxR * ek;
      }
    }

    this.chromaVal = Math.max(0, this.chromaVal - realDt * 0.045);
    if (this.chromaVal < 0.0002) this.chromaVal = 0;

    this.flashAmt = Math.max(0, this.flashAmt - realDt * 1.45);
    if (this.flashAmt < 0.001) this.flashAmt = 0;

    const zpDecay = 1 - Math.exp(-9.5 * realDt);
    this.zoomPunchVal += (0 - this.zoomPunchVal) * zpDecay;
    if (Math.abs(this.zoomPunchVal) < 0.0005) this.zoomPunchVal = 0;

    if (this.slowMoT > 0) {
      this.slowMoT = Math.max(0, this.slowMoT - realDt);
      if (this.slowMoT <= 0) this.slowMoScale = 1;
    } else {
      this.slowMoScale = 1;
    }

    // Trauma shake com senos incomensuráveis + snap exato ao repouso (decai em tempo real)
    const curTrauma = typeof trauma !== 'undefined' ? trauma : 0;
    if (curTrauma > 0.001) {
      if (typeof trauma !== 'undefined') {
        trauma = Math.max(0, trauma - 1.65 * realDt);
      }
      const str = GFX_SETTINGS.reduceShake ? 0.28 : 1.0;
      const sh = curTrauma * curTrauma * str;
      this.shakeT += realDt * 28;
      this.shakeX = 11 * sh * (0.6 * Math.sin(this.shakeT * 1.1) + 0.4 * Math.sin(this.shakeT * 2.3));
      this.shakeY = 8 * sh * (0.6 * Math.cos(this.shakeT * 1.37) + 0.4 * Math.cos(this.shakeT * 2.71));
      this.shakeRoll = GFX_SETTINGS.reduceShake ? 0 : 0.018 * sh * Math.sin(this.shakeT * 0.93);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeRoll = 0;
    }
  },

  reset() {
    for (let i = 0; i < 3; i++) {
      this.shockwaves[i].active = false;
      this.shockwaves[i].strength = 0;
      this.shockwaves[i].age = 0;
    }
    this.chromaVal = 0;
    this.zoomPunchVal = 0;
    this.flashAmt = 0;
    this.slowMoT = 0;
    this.slowMoScale = 1;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeRoll = 0;
    this._flashTimestamps.length = 0;
  },
};

// =====================================================================
//  TELEMETRIA DE PERFORMANCE (MONITOR FPS / MS / p95 — TECLA [F])
// =====================================================================
const PERF_STATS = {
  fps: 60,
  frameMs: 16.6,
  p95Ms: 16.6,
  _ring: new Float32Array(60),
  _sorted: new Array(60).fill(16.6),
  _idx: 0,
  _count: 0,
  _recalcTimer: 0,

  recordFrame(realDt) {
    const ms = clamp(realDt * 1000, 0.5, 100);
    const instFps = 1000 / ms;
    this.frameMs += (ms - this.frameMs) * 0.12;
    this.fps += (instFps - this.fps) * 0.12;

    this._ring[this._idx] = ms;
    this._idx = (this._idx + 1) % 60;
    if (this._count < 60) this._count++;

    this._recalcTimer += realDt;
    if (this._recalcTimer >= 0.45 && this._count > 10) {
      this._recalcTimer = 0;
      for (let i = 0; i < this._count; i++) this._sorted[i] = this._ring[i];
      // Insertion sort parcial simples só nos primeiros _count itens (<=60) a cada ~0.45s
      for (let i = 1; i < this._count; i++) {
        const key = this._sorted[i];
        let j = i - 1;
        while (j >= 0 && this._sorted[j] > key) {
          this._sorted[j + 1] = this._sorted[j];
          j--;
        }
        this._sorted[j + 1] = key;
      }
      const pIdx = Math.min(this._count - 1, Math.floor(this._count * 0.95));
      this.p95Ms = this._sorted[pIdx];
    }
  },
};
