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

// =====================================================================
//  HUD — ESTÉTICA RPG MEDIEVAL (madeira, ferro, ouro e pergaminho)
//  Guiado pelas skills: game-ui-design (hierarquia, contraste, cooldown
//  em varredura, cor + forma), game-ui-ux (âncoras, escala, safe area),
//  game-feel (pops com easeOutBack que voltam ao repouso) e
//  pixel-art-sprites (paleta curta, sombreamento em faixas, sem gradiente).
// =====================================================================

// Paleta limitada do HUD
const MED = {
  ink: '#140b06',
  woodDark: '#2a170c', wood: '#4a2c16', woodLight: '#7a4b26',
  iron: '#4b4f57', ironLight: '#9aa0a8', ironDark: '#26282d',
  gold: '#d9a441', goldLight: '#ffe08a', goldDark: '#8a5a1c',
  parch: '#e6cf9c', parchDark: '#b8955a', parchInk: '#3b2412',
  leather: '#1f140c',
  blood: '#8f1414', bloodLight: '#e0413a', bloodDark: '#4a0808',
  mana: '#2a4f9e', manaLight: '#6fb0ff',
  leaf: '#4f8a2b', leafLight: '#9be36a',
  purple: '#6a2a9e', purpleLight: '#c58cff',
};

// Estado de animação do HUD (sempre volta ao repouso)
let hudGhostHp = 0, hudGhostXp = 0;
let hudLastT = 0;
let hudLastHp = -1, hudHurtT = 0;
let hudLastCombo = 0, hudComboPop = 0;
let hudLastCoins = 0, hudCoinPop = 0;
let hudLastLevel = 1, hudLevelPop = 0;
let hudPrevDashReady = true, hudDashFlash = 0;
let hudPrevUltReady = false, hudUltFlash = 0;
let hudBannerRef = null, hudBannerT = 0;
const hudPanelCache = new Map();

function easeOutBack(k) {
  const c1 = 1.70158, c3 = c1 + 1, m = k - 1;
  return 1 + c3 * m * m * m + c1 * m * m;
}
// Pop: 0 = em repouso, >0 = tempo restante do pop (0.22s)
function popScale(t, dur = 0.22, amount = 0.35) {
  if (t <= 0) return 1;
  const k = clamp(1 - t / dur, 0, 1);         // 0 -> 1
  // começa em 1+amount, passa levemente de 1 (overshoot) e assenta em 1
  return 1 + amount * (1 - easeOutBack(k));
}

function hudScale() { return clamp(Math.min(W / 1280, H / 720), 0.72, 1.5); }

function toRoman(n) {
  if (n <= 0) return '0';
  if (n >= 4000) return '' + n;
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

// Texto sem contorno (para escrever "a tinta" sobre pergaminho)
function inkTxt(s, x, y, size, color = MED.parchInk, align = 'center') {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,240,200,0.55)';
  ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function hudImg(key) {
  const im = IMG[key];
  return im && im.complete && im.naturalWidth > 0 ? im : null;
}

// ---------------------------------------------------------------------
//  MOLDURA MEDIEVAL (pré-renderizada em cache: custo ~zero por frame)
// ---------------------------------------------------------------------
function buildMedPanel(w, h, style) {
  const pad = 6;
  const c = document.createElement('canvas');
  c.width = w + pad * 2; c.height = h + pad * 2;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const x = pad, y = pad;
  const f = style === 'thin' ? 3 : 4;          // espessura da madeira

  // sombra projetada
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.fillRect(x + 3, y + 3, w, h);

  // contorno de tinta
  g.fillStyle = MED.ink;
  g.fillRect(x - 1, y - 1, w + 2, h + 2);

  // moldura de madeira com faixas de luz/sombra (pixel art, sem gradiente)
  g.fillStyle = MED.wood;
  g.fillRect(x, y, w, h);
  g.fillStyle = MED.woodLight;
  g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h);
  g.fillStyle = MED.woodDark;
  g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
  // veios da madeira (determinísticos)
  g.fillStyle = 'rgba(20,10,4,0.35)';
  for (let i = 0; i < w; i += 7) {
    const seed = (i * 37 + w * 13 + h * 7) % 11;
    g.fillRect(x + i, y + 1 + (seed % 2), Math.min(4, w - i), 1);
    g.fillRect(x + i + 2, y + h - 2 - (seed % 2), Math.min(3, w - i - 2), 1);
  }

  // interior
  const ix = x + f, iy = y + f, iw = w - f * 2, ih = h - f * 2;
  g.fillStyle = MED.ink;
  g.fillRect(ix - 1, iy - 1, iw + 2, ih + 2);
  if (style === 'parch') {
    g.fillStyle = MED.parch;
    g.fillRect(ix, iy, iw, ih);
    // manchas e borda envelhecida
    g.fillStyle = 'rgba(140,100,50,0.18)';
    for (let i = 0; i < (iw * ih) / 90; i++) {
      const px = (i * 53 + 17) % iw, py = (i * 29 + 7) % ih;
      g.fillRect(ix + px, iy + py, 2, 1);
    }
    g.fillStyle = 'rgba(120,80,30,0.35)';
    g.fillRect(ix, iy, iw, 2); g.fillRect(ix, iy + ih - 2, iw, 2);
    g.fillRect(ix, iy, 2, ih); g.fillRect(ix + iw - 2, iy, 2, ih);
  } else {
    g.fillStyle = 'rgba(31,20,12,0.94)';
    g.fillRect(ix, iy, iw, ih);
    // costura de couro
    g.fillStyle = 'rgba(217,164,65,0.22)';
    for (let i = 4; i < iw - 4; i += 6) { g.fillRect(ix + i, iy + 2, 3, 1); g.fillRect(ix + i, iy + ih - 3, 3, 1); }
    g.fillStyle = 'rgba(255,230,180,0.05)';
    g.fillRect(ix, iy, iw, 2);
  }

  // cantoneiras de ferro com rebite dourado
  const k = style === 'thin' ? 6 : 8;
  const corners = [[x - 1, y - 1, 1, 1], [x + w + 1, y - 1, -1, 1], [x - 1, y + h + 1, 1, -1], [x + w + 1, y + h + 1, -1, -1]];
  for (const [cx, cy, sx, sy] of corners) {
    const rx = sx > 0 ? cx : cx - k, ry = sy > 0 ? cy : cy - k;
    g.fillStyle = MED.ink;
    g.fillRect(rx - 1, sy > 0 ? ry - 1 : ry + k - 3, k + 2, 4);
    g.fillRect(sx > 0 ? rx - 1 : rx + k - 3, ry - 1, 4, k + 2);
    g.fillStyle = MED.iron;
    g.fillRect(rx, sy > 0 ? ry : ry + k - 2, k, 2);
    g.fillRect(sx > 0 ? rx : rx + k - 2, ry, 2, k);
    g.fillStyle = MED.ironLight;
    g.fillRect(sx > 0 ? rx : rx + k - 2, sy > 0 ? ry : ry + k - 2, 1, 1);
    // rebite
    const bx = sx > 0 ? rx + 2 : rx + k - 4, by = sy > 0 ? ry + 2 : ry + k - 4;
    g.fillStyle = MED.goldDark; g.fillRect(bx, by, 2, 2);
    g.fillStyle = MED.goldLight; g.fillRect(bx, by, 1, 1);
  }
  return c;
}

function medPanel(x, y, w, h, style = 'leather') {
  w = Math.max(16, Math.round(w)); h = Math.max(16, Math.round(h));
  const key = style + '|' + w + '|' + h;
  let c = hudPanelCache.get(key);
  if (!c) {
    if (hudPanelCache.size > 80) hudPanelCache.clear();
    c = buildMedPanel(w, h, style);
    hudPanelCache.set(key, c);
  }
  ctx.drawImage(c, Math.round(x) - 6, Math.round(y) - 6);
}

// Barra em calha de ferro, preenchimento em faixas (sem gradiente)
function medBar(x, y, w, h, cur, max, opts = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const frac = clamp(max > 0 ? cur / max : 0, 0, 1);
  const fw = Math.round(w * frac);
  ctx.fillStyle = MED.ink; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = MED.iron; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = MED.ironLight; ctx.fillRect(x - 1, y - 1, w + 2, 1);
  ctx.fillStyle = opts.back || '#120a06'; ctx.fillRect(x, y, w, h);
  if (opts.ghost !== undefined) {
    const gw = Math.round(w * clamp(max > 0 ? opts.ghost / max : 0, 0, 1));
    if (gw > fw) { ctx.fillStyle = opts.ghostCol || MED.goldLight; ctx.fillRect(x + fw, y, gw - fw, h); }
  }
  if (fw > 0) {
    ctx.fillStyle = opts.col || MED.bloodLight; ctx.fillRect(x, y, fw, h);
    ctx.fillStyle = opts.light || 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, fw, Math.max(1, Math.floor(h / 3)));
    ctx.fillStyle = opts.dark || 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + h - Math.max(1, Math.floor(h / 4)), fw, Math.max(1, Math.floor(h / 4)));
  }
  if (opts.notches > 1) {
    ctx.fillStyle = MED.ink;
    for (let i = 1; i < opts.notches; i++) ctx.fillRect(x + Math.round((w * i) / opts.notches), y, 1, h);
  }
}

// Escudo heráldico (forma usada para o retrato)
function shieldPath(x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h * 0.55);
  ctx.quadraticCurveTo(x + w, y + h * 0.85, x + w / 2, y + h);
  ctx.quadraticCurveTo(x, y + h * 0.85, x, y + h * 0.55);
  ctx.closePath();
}

// ---------------------------------------------------------------------
//  1. BRASÃO DO HERÓI (sup. esquerdo): escudo-retrato, corações, EXP
// ---------------------------------------------------------------------
function drawHeroCrest(p, s, m, dt) {
  const pw = Math.round(Math.min(310 * s, W * 0.46));
  const ph = Math.round(78 * s);
  const px = m, py = m;
  medPanel(px, py, pw, ph, 'leather');

  // Escudo com o retrato
  const sw = Math.round(52 * s), sh = Math.round(62 * s);
  const sx = px + Math.round(8 * s), sy = py + Math.round(6 * s);
  ctx.save();
  shieldPath(sx - 3, sy - 3, sw + 6, sh + 6); ctx.fillStyle = MED.ink; ctx.fill();
  shieldPath(sx - 2, sy - 2, sw + 4, sh + 4); ctx.fillStyle = MED.gold; ctx.fill();
  shieldPath(sx, sy, sw, sh); ctx.fillStyle = MED.blood; ctx.fill();
  ctx.save();
  shieldPath(sx, sy, sw, sh); ctx.clip();
  const portrait = hudImg('portrait_' + p.char.id) || hudImg('portrait_manguinha');
  if (portrait) ctx.drawImage(portrait, sx, sy, sw, sw);
  if (hudHurtT > 0) { ctx.fillStyle = `rgba(224,65,58,${hudHurtT * 1.6})`; ctx.fillRect(sx, sy, sw, sh); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,224,138,0.5)'; ctx.fillRect(sx + 2, sy + 1, sw - 4, 1);
  ctx.restore();

  // Medalhão de nível (pop ao subir de nível)
  const lvS = popScale(hudLevelPop, 0.3, 0.6);
  const mx = sx + sw / 2, my = sy + sh - Math.round(4 * s), mr = Math.round(11 * s);
  ctx.save();
  ctx.translate(mx, my); ctx.scale(lvS, lvS);
  ctx.beginPath(); ctx.arc(0, 0, mr + 2, 0, Math.PI * 2); ctx.fillStyle = MED.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, mr + 1, 0, Math.PI * 2); ctx.fillStyle = MED.goldLight; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, mr - 1, 0, Math.PI * 2); ctx.fillStyle = MED.goldDark; ctx.fill();
  txt('' + p.level, 0, Math.round(4 * s), Math.round(9 * s), MED.goldLight);
  ctx.restore();

  // Nome
  const cx = sx + sw + Math.round(10 * s);
  const cw = px + pw - cx - Math.round(10 * s);
  txt(p.char.name.toUpperCase(), cx, py + Math.round(19 * s), Math.round(10 * s), MED.goldLight, 'left');

  // Escudos mágicos: ícone + número (forma + texto, não só cor)
  if (p.shields > 0) {
    const ic = hudImg('i_S_Buff03'), isz = Math.round(16 * s);
    const ex = px + pw - Math.round(10 * s);
    txt('x' + p.shields, ex, py + Math.round(19 * s), Math.round(9 * s), MED.manaLight, 'right');
    ctx.font = `${Math.round(9 * s)}px ${FONT}`;
    const tw = ctx.measureText('x' + p.shields).width;
    if (ic) ctx.drawImage(ic, ex - tw - isz - 3, py + Math.round(6 * s), isz, isz);
  }

  // Corações (balançam quando você toma dano; pulsam com vida baixa)
  const hearts = Math.ceil(stats.maxHp / 2);
  let hsz = Math.round(20 * s);
  let step = hsz + Math.round(2 * s);
  if (hearts * step > cw) { step = cw / hearts; hsz = Math.min(hsz, Math.floor(step)); }
  const hy0 = py + Math.round(26 * s);
  const hE = hudImg('i_heart_empty'), hF = hudImg('i_heart_full');
  for (let i = 0; i < hearts; i++) {
    const v = p.hp - i * 2;
    let hx = cx + i * step, hy = hy0;
    if (hudHurtT > 0) hx += Math.sin(time * 70 + i) * 2 * (hudHurtT / 0.35);
    if (p.hp <= 2 && i === 0) { const beat = Math.sin(time * 9); if (beat > 0.4) hy -= (beat - 0.4) * 4 * s; }
    if (hE) ctx.drawImage(hE, Math.round(hx), Math.round(hy), hsz, hsz);
    if (hF) {
      if (v >= 2) ctx.drawImage(hF, Math.round(hx), Math.round(hy), hsz, hsz);
      else if (v === 1) ctx.drawImage(hF, 0, 0, hF.width / 2, hF.height, Math.round(hx), Math.round(hy), hsz / 2, hsz);
    }
  }

  // Barra de EXP dourada com "fantasma" que acompanha suavemente
  const xbY = py + ph - Math.round(18 * s), xbH = Math.max(5, Math.round(7 * s));
  medBar(cx, xbY, cw, xbH, p.xp, p.xpNext, {
    col: MED.gold, light: 'rgba(255,224,138,0.7)', ghost: hudGhostXp, ghostCol: 'rgba(255,240,200,0.6)', notches: 5,
  });
  txt('EXP', cx, xbY + xbH + Math.round(10 * s), Math.round(8 * s), MED.parchDark, 'left');
  txt(Math.floor(p.xp) + '/' + p.xpNext, cx + cw, xbY + xbH + Math.round(10 * s), Math.round(8 * s), MED.parch, 'right');

  // Efeitos ativos: ícone em moldura de ferro + tempo (ícone + texto)
  const buffs = [];
  if (p.frenzyT > 0) buffs.push({ icon: 'i_S_Fire01', t: p.frenzyT.toFixed(1), col: '#ff9436' });
  if (p.ironskinT > 0) buffs.push({ icon: 'i_A_Armour01', t: '' + Math.ceil(p.ironskinT), col: MED.goldLight });
  if (p.thornsT > 0) buffs.push({ icon: 'i_S_Earth01', t: '' + Math.ceil(p.thornsT), col: MED.leafLight });
  if (p.prefix) buffs.push({ icon: 'i_S_Dagger03', t: p.prefix.name.slice(0, 6).toUpperCase(), col: p.prefix.color });
  let by = py + ph + Math.round(8 * s);
  const bsz = Math.round(24 * s);
  let bx = px;
  for (const b of buffs) {
    ctx.fillStyle = MED.ink; ctx.fillRect(bx - 1, by - 1, bsz + 2, bsz + 2);
    ctx.fillStyle = MED.iron; ctx.fillRect(bx, by, bsz, bsz);
    ctx.fillStyle = MED.leather; ctx.fillRect(bx + 2, by + 2, bsz - 4, bsz - 4);
    const ic = hudImg(b.icon);
    if (ic) ctx.drawImage(ic, bx + 3, by + 3, bsz - 6, bsz - 6);
    txt(b.t, bx + bsz / 2, by + bsz + Math.round(10 * s), Math.round(7 * s), b.col);
    ctx.font = `${Math.round(7 * s)}px ${FONT}`;
    bx += Math.max(bsz, ctx.measureText(b.t).width) + Math.round(8 * s);
  }
  const bottom = buffs.length ? by + bsz + Math.round(14 * s) : py + ph;
  return { x: px, y: py, w: pw, h: ph, bottom };
}

// ---------------------------------------------------------------------
//  2. BAÚ DO TESOURO (sup. direito): ouro, pontos, tempo, recorde
// ---------------------------------------------------------------------
function drawTreasury(s, m, topY, showWave) {
  const tw = Math.round(Math.min(196 * s, W * 0.36));
  const rows = (showWave ? 1 : 0) + (H >= 520 ? 3 : 2);
  const th = Math.round((34 + rows * 15) * s);
  const tx = W - m - tw, ty = topY;
  medPanel(tx, ty, tw, th, 'leather');

  const pad = Math.round(10 * s);
  // Ouro com pop ao ganhar moedas
  const coin = hudImg('i_I_GoldCoin'), csz = Math.round(22 * s);
  if (coin) ctx.drawImage(coin, tx + pad, ty + Math.round(7 * s), csz, csz);
  const cs = popScale(hudCoinPop, 0.2, 0.3);
  ctx.save();
  ctx.translate(tx + tw - pad, ty + Math.round(25 * s));
  ctx.scale(cs, cs);
  txt('' + coins, 0, 0, Math.round(14 * s), MED.goldLight, 'right');
  ctx.restore();
  // divisória
  ctx.fillStyle = MED.goldDark; ctx.fillRect(tx + pad, ty + Math.round(33 * s), tw - pad * 2, 1);

  const mm = Math.floor(playTime / 60), ss = Math.floor(playTime % 60);
  const list = [];
  if (showWave) list.push(['ONDA', toRoman(wave), MED.goldLight]);
  list.push(['PONTOS', '' + score, '#fff1c9']);
  list.push(['TEMPO', `${mm}:${ss < 10 ? '0' : ''}${ss}`, MED.parch]);
  if (H >= 520) list.push(['RECORDE', '' + best, MED.gold]);
  let ry = ty + Math.round(48 * s);
  for (const [k, v, col] of list) {
    txt(k, tx + pad, ry, Math.round(8 * s), MED.parchDark, 'left');
    txt(v, tx + tw - pad, ry, Math.round(9 * s), col, 'right');
    ry += Math.round(15 * s);
  }
  return { x: tx, y: ty, w: tw, h: th, bottom: ty + th };
}

// ---------------------------------------------------------------------
//  3. MAPA-BÚSSOLA (redondo, pergaminho, jogador no centro)
// ---------------------------------------------------------------------
function drawMinimap(s, m, topY) {
  if (!minimapOn || W < 380) return null;
  const r = Math.round((H < 520 ? 40 : 54) * s);
  const cx = W - m - r - 4, cy = topY + r + 4;
  const range = 1100;                        // unidades do mundo do centro até a borda
  const k = r / range;

  ctx.save();
  // anel de madeira
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.fillStyle = MED.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2); ctx.fillStyle = MED.wood; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, r + 1, 0, Math.PI * 2); ctx.fillStyle = MED.ink; ctx.fill();
  // pergaminho
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = MED.parch; ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

  const px = player ? player.x : WORLD.w / 2, py = player ? player.y : WORLD.h / 2;
  const toMap = (wx, wy) => [cx + (wx - px) * k, cy + (wy - py) * k];

  // limite do mundo (fora = sombreado)
  ctx.fillStyle = 'rgba(59,36,18,0.35)';
  const [wx0, wy0] = toMap(0, 0), [wx1, wy1] = toMap(WORLD.w, WORLD.h);
  ctx.fillRect(cx - r, cy - r, r * 2, Math.max(0, wy0 - (cy - r)));
  ctx.fillRect(cx - r, wy1, r * 2, Math.max(0, cy + r - wy1));
  ctx.fillRect(cx - r, cy - r, Math.max(0, wx0 - (cx - r)), r * 2);
  ctx.fillRect(wx1, cy - r, Math.max(0, cx + r - wx1), r * 2);

  // rosa dos ventos a tinta
  ctx.strokeStyle = 'rgba(59,36,18,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();

  // lagos
  ctx.fillStyle = 'rgba(42,79,158,0.55)';
  for (const pd of ponds) { const [ax, ay] = toMap(pd.x, pd.y); ctx.fillRect(ax, ay, Math.max(2, pd.w * k), Math.max(2, pd.h * k)); }

  // santuários = losango, baú = quadrado dourado
  for (const sh of shrines) {
    const [ax, ay] = toMap(sh.x, sh.y);
    ctx.fillStyle = MED.ink; ctx.beginPath(); ctx.moveTo(ax, ay - 5); ctx.lineTo(ax + 5, ay); ctx.lineTo(ax, ay + 5); ctx.lineTo(ax - 5, ay); ctx.fill();
    ctx.fillStyle = sh.col; ctx.beginPath(); ctx.moveTo(ax, ay - 3); ctx.lineTo(ax + 3, ay); ctx.lineTo(ax, ay + 3); ctx.lineTo(ax - 3, ay); ctx.fill();
  }
  for (const it of pickups) {
    if (it.kind !== 'chest') continue;
    const [ax, ay] = toMap(it.x, it.y);
    ctx.fillStyle = MED.ink; ctx.fillRect(ax - 3, ay - 3, 6, 6);
    ctx.fillStyle = MED.gold; ctx.fillRect(ax - 2, ay - 2, 4, 4);
  }
  // inimigos: ponto vermelho; elite: ponto com borda dourada
  for (const e of enemies) {
    if (isBossType(e.type)) continue;
    const [ax, ay] = toMap(e.x, e.y);
    if (e.elite) { ctx.fillStyle = MED.goldDark; ctx.fillRect(ax - 2, ay - 2, 5, 5); }
    ctx.fillStyle = MED.blood; ctx.fillRect(ax - 1, ay - 1, 3, 3);
  }
  ctx.restore();

  // chefes: caveira grande; presos na borda se estiverem longe
  for (const e of enemies) {
    if (!isBossType(e.type)) continue;
    let [ax, ay] = toMap(e.x, e.y);
    const dx = ax - cx, dy = ay - cy, d = Math.hypot(dx, dy);
    if (d > r - 6) { ax = cx + dx / d * (r - 6); ay = cy + dy / d * (r - 6); }
    ctx.fillStyle = MED.ink; ctx.fillRect(ax - 5, ay - 5, 10, 10);
    ctx.fillStyle = MED.bloodLight; ctx.fillRect(ax - 4, ay - 4, 8, 8);
    ctx.fillStyle = MED.ink; ctx.fillRect(ax - 3, ay - 2, 2, 2); ctx.fillRect(ax + 1, ay - 2, 2, 2); ctx.fillRect(ax - 1, ay + 1, 2, 2);
  }

  // jogador: seta apontando para a mira
  const a = player ? player.aim : -Math.PI / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
  ctx.fillStyle = MED.ink; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-3, 0); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -3); ctx.lineTo(-2, 0); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
  ctx.restore();

  // rebites + marcador do Norte
  for (let i = 0; i < 4; i++) {
    const ang = i * Math.PI / 2 + Math.PI / 4;
    const rx = cx + Math.cos(ang) * (r + 3), ry = cy + Math.sin(ang) * (r + 3);
    ctx.fillStyle = MED.goldDark; ctx.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, 3, 3);
    ctx.fillStyle = MED.goldLight; ctx.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, 1, 1);
  }
  const ny = cy - r - 5;
  ctx.fillStyle = MED.ink; ctx.beginPath(); ctx.moveTo(cx, ny - 9); ctx.lineTo(cx + 7, ny); ctx.lineTo(cx, ny + 7); ctx.lineTo(cx - 7, ny); ctx.fill();
  ctx.fillStyle = MED.gold; ctx.beginPath(); ctx.moveTo(cx, ny - 7); ctx.lineTo(cx + 5, ny); ctx.lineTo(cx, ny + 5); ctx.lineTo(cx - 5, ny); ctx.fill();
  txt('N', cx, ny + 3, Math.round(6 * s), MED.ink);
  txt(gamepadInfo.connected ? 'MAPA [RB]' : 'MAPA [N]', cx, cy + r + Math.round(18 * s), Math.round(7 * s), MED.parchDark);
  ctx.restore();
  return { bottom: cy + r + Math.round(22 * s), left: cx - r - 6 };
}

// ---------------------------------------------------------------------
//  4. ESTANDARTE DA ONDA (centro, quando não há chefe)
// ---------------------------------------------------------------------
function drawWaveBanner(s, left) {
  const bw = Math.round(118 * s), bh = Math.round(58 * s);
  const bx = Math.round(W / 2 - bw / 2), by = Math.round(10 * s);
  ctx.save();
  // haste de madeira
  ctx.fillStyle = MED.ink; ctx.fillRect(bx - 10, by - 2, bw + 20, 7);
  ctx.fillStyle = MED.woodLight; ctx.fillRect(bx - 9, by - 1, bw + 18, 5);
  ctx.fillStyle = MED.woodDark; ctx.fillRect(bx - 9, by + 3, bw + 18, 1);
  ctx.fillStyle = MED.gold; ctx.fillRect(bx - 13, by - 3, 5, 9); ctx.fillRect(bx + bw + 8, by - 3, 5, 9);
  // tecido com cauda de andorinha
  const notch = Math.round(12 * s);
  const cloth = waveEvent === 'bloodmoon' ? MED.bloodDark : waveEvent === 'void_eclipse' ? MED.purple : waveEvent === 'golden' ? MED.goldDark : MED.blood;
  ctx.beginPath();
  ctx.moveTo(bx, by + 4); ctx.lineTo(bx + bw, by + 4); ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw / 2, by + bh - notch); ctx.lineTo(bx, by + bh); ctx.closePath();
  ctx.fillStyle = MED.ink; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 2, by + 5); ctx.lineTo(bx + bw - 2, by + 5); ctx.lineTo(bx + bw - 2, by + bh - 4);
  ctx.lineTo(bx + bw / 2, by + bh - notch - 3); ctx.lineTo(bx + 2, by + bh - 4); ctx.closePath();
  ctx.fillStyle = cloth; ctx.fill();
  // barra dourada
  ctx.fillStyle = MED.gold; ctx.fillRect(bx + 2, by + 5, bw - 4, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx + bw - 8, by + 7, 6, bh - notch - 8);

  txt('ONDA', W / 2, by + Math.round(19 * s), Math.round(7 * s), MED.parch);
  txt(toRoman(wave), W / 2, by + Math.round(36 * s), Math.round(14 * s), MED.goldLight);
  ctx.restore();

  // fita de pergaminho com o estado da onda
  let label;
  if (toSpawn === 0 && left === 0) label = 'HORDA VENCIDA!';
  else if (waveEvent) {
    const ev = { bloodmoon: 'LUA DE SANGUE', void_eclipse: 'ECLIPSE DO VAZIO', magma_surge: 'FÚRIA DE MAGMA', swarm: 'ENXAME', meteors: 'CHUVA DE METEOROS', golden: 'ONDA DOURADA', ambush: 'EMBOSCADA' };
    label = ev[waveEvent] || waveEvent.toUpperCase();
  } else label = 'INIMIGOS: ' + left;
  const fs = Math.round(8 * s);
  ctx.font = `${fs}px ${FONT}`;
  const lw = Math.round(ctx.measureText(label).width + 22 * s);
  const ly = by + bh + Math.round(2 * s), lh = Math.round(16 * s);
  const lx = Math.round(W / 2 - lw / 2);
  ctx.fillStyle = MED.ink; ctx.fillRect(lx - 1, ly - 1, lw + 2, lh + 2);
  ctx.fillStyle = MED.parch; ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = MED.parchDark; ctx.fillRect(lx, ly + lh - 2, lw, 2);
  // pontas dobradas
  ctx.fillStyle = MED.parchDark; ctx.fillRect(lx - 6, ly + 3, 6, lh - 6); ctx.fillRect(lx + lw, ly + 3, 6, lh - 6);
  inkTxt(label, W / 2, ly + Math.round(11.5 * s), fs, waveEvent ? MED.blood : MED.parchInk);
  return ly + lh;
}

// ---------------------------------------------------------------------
//  5. BARRA DO CHEFE (pedra e ferro, nome em faixa de sangue)
// ---------------------------------------------------------------------
function drawBossBar(s, y, maxW) {
  if (!boss || boss.dead || boss.hp <= 0 || state !== 'play') return y;
  const bw = Math.round(Math.min(560 * s, maxW));
  const bx = Math.round(W / 2 - bw / 2);
  const d = MON[boss.type];
  const name = ((d && d.bossName) ? d.bossName : 'CHEFÃO').toUpperCase();

  // fantasma do dano do chefe
  if (!boss._hudGhost || boss._hudGhost < boss.hp) boss._hudGhost = boss.hp;
  boss._hudGhost += (boss.hp - boss._hudGhost) * 0.06;

  medPanel(bx, y, bw, Math.round(40 * s), 'leather');
  // faixa do nome
  const fs = Math.round(9 * s);
  ctx.font = `${fs}px ${FONT}`;
  const nw = Math.round(ctx.measureText(name).width + 50 * s);
  const nx = Math.round(W / 2 - nw / 2), ny = y - Math.round(9 * s), nh = Math.round(18 * s);
  ctx.fillStyle = MED.ink; ctx.fillRect(nx - 1, ny - 1, nw + 2, nh + 2);
  ctx.fillStyle = MED.blood; ctx.fillRect(nx, ny, nw, nh);
  ctx.fillStyle = MED.gold; ctx.fillRect(nx, ny, nw, 1); ctx.fillRect(nx, ny + nh - 1, nw, 1);
  txt('☠ ' + name + ' ☠', W / 2, ny + Math.round(13 * s), fs, MED.goldLight);

  const barX = bx + Math.round(12 * s), barW = bw - Math.round(24 * s);
  const barY = y + Math.round(16 * s), barH = Math.round(12 * s);
  const enraged = boss.hp < boss.maxHp / 2;
  medBar(barX, barY, barW, barH, boss.hp, boss.maxHp, {
    col: enraged && Math.sin(time * 10) > 0 ? '#ff5a3c' : MED.bloodLight,
    ghost: boss._hudGhost, ghostCol: MED.goldLight, back: MED.bloodDark, notches: 4,
  });
  const pct = Math.round(clamp(boss.hp / boss.maxHp, 0, 1) * 100);
  txt(pct + '%' + (enraged ? '  FURIOSO' : ''), W / 2, barY + barH - Math.round(2 * s), Math.round(8 * s), '#fff1c9');
  return y + Math.round(46 * s);
}

// ---------------------------------------------------------------------
//  6. COMBO (centro): pop com overshoot a cada acerto, títulos por nível
// ---------------------------------------------------------------------
function drawComboSeal(p, s, y) {
  if (p.combo < 3) return;
  const tier = p.combo >= 40 ? ['LENDÁRIO', MED.purpleLight] : p.combo >= 20 ? ['BRUTAL', MED.bloodLight] : p.combo >= 10 ? ['FEROZ', '#ff9436'] : ['COMBO', MED.goldLight];
  const sc = popScale(hudComboPop, 0.18, 0.45);
  ctx.save();
  ctx.translate(W / 2, y + Math.round(20 * s));
  ctx.scale(sc, sc);
  txt('x' + p.combo, 0, 0, Math.round(16 * s), tier[1]);
  txt(tier[0], 0, Math.round(14 * s), Math.round(8 * s), MED.parch);
  ctx.restore();
  // pavio do combo (tempo restante)
  const w = Math.round(80 * s), fr = clamp(p.comboT / 2.9, 0, 1);
  const x = Math.round(W / 2 - w / 2), yy = y + Math.round(40 * s);
  ctx.fillStyle = MED.ink; ctx.fillRect(x - 1, yy - 1, w + 2, 5);
  ctx.fillStyle = MED.woodDark; ctx.fillRect(x, yy, w, 3);
  ctx.fillStyle = tier[1]; ctx.fillRect(x, yy, Math.round(w * fr), 3);
}

// ---------------------------------------------------------------------
//  7. HABILIDADES (inf. direito): ATAQUE, GIRO e FÚRIA em molduras de ferro
//     Cooldown em varredura + número + brilho quando pronto (game-ui-design)
// ---------------------------------------------------------------------
function drawSkillSlot(x, y, sz, s, o) {
  ctx.fillStyle = MED.ink; ctx.fillRect(x - 2, y - 2, sz + 4, sz + 4);
  ctx.fillStyle = o.ready ? MED.gold : MED.iron; ctx.fillRect(x - 1, y - 1, sz + 2, sz + 2);
  ctx.fillStyle = o.ready ? MED.goldLight : MED.ironLight; ctx.fillRect(x - 1, y - 1, sz + 2, 1);
  ctx.fillStyle = MED.leather; ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);

  const pad = Math.round(6 * s);
  if (o.img) ctx.drawImage(o.img, x + pad, y + pad, sz - pad * 2, sz - pad * 2);
  else if (o.swatch) { ctx.fillStyle = o.swatch; ctx.fillRect(x + pad, y + pad, sz - pad * 2, sz - pad * 2); }

  if (!o.ready) {
    if (o.mode === 'fill') {
      // medidor enchendo de baixo pra cima
      const fh = Math.round((sz - 2) * (1 - o.frac));
      ctx.fillStyle = 'rgba(10,6,4,0.72)'; ctx.fillRect(x + 1, y + 1, sz - 2, fh);
      ctx.fillStyle = o.accent; ctx.fillRect(x + 1, y + 1 + fh, sz - 2, 2);
    } else {
      // varredura de relógio
      ctx.save();
      ctx.beginPath(); ctx.rect(x + 1, y + 1, sz - 2, sz - 2); ctx.clip();
      ctx.beginPath();
      ctx.moveTo(x + sz / 2, y + sz / 2);
      ctx.arc(x + sz / 2, y + sz / 2, sz, -Math.PI / 2 + Math.PI * 2 * o.frac, Math.PI * 1.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(10,6,4,0.72)'; ctx.fill();
      ctx.restore();
    }
    if (o.count) txt(o.count, x + sz / 2, y + sz / 2 + Math.round(5 * s), Math.round(11 * s), '#fff1c9');
  } else if (o.flash > 0) {
    ctx.fillStyle = `rgba(255,224,138,${o.flash * 2.2})`; ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
  }
  if (o.ready && o.glow) {
    const a = 0.35 + 0.25 * Math.sin(time * 6);
    ctx.strokeStyle = `rgba(255,224,138,${a})`; ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, sz + 8, sz + 8);
  }

  // nome em cima
  txt(o.label, x + sz / 2, y - Math.round(7 * s), Math.round(7 * s), o.ready ? MED.goldLight : MED.parchDark);
  // etiqueta da tecla (pergaminho)
  const fs = Math.round(7 * s);
  ctx.font = `${fs}px ${FONT}`;
  const kw = Math.round(ctx.measureText(o.key).width + 8 * s), kh = Math.round(13 * s);
  const kx = Math.round(x + sz / 2 - kw / 2), ky = y + sz - Math.round(5 * s);
  ctx.fillStyle = MED.ink; ctx.fillRect(kx - 1, ky - 1, kw + 2, kh + 2);
  ctx.fillStyle = MED.parch; ctx.fillRect(kx, ky, kw, kh);
  inkTxt(o.key, x + sz / 2, ky + Math.round(10 * s), fs);
}

function drawSkillBar(p, s, m) {
  if (touch.active) return null;          // no celular os botões de toque cumprem esse papel
  const gp = gamepadInfo.connected;
  const sz = Math.round(48 * s), gap = Math.round(16 * s);
  const n = 3;
  const pw = n * sz + (n - 1) * gap + Math.round(28 * s);
  const ph = sz + Math.round(40 * s);
  const px = W - m - pw, py = H - m - ph;
  medPanel(px, py, pw, ph, 'leather');
  let x = px + Math.round(14 * s);
  const y = py + Math.round(20 * s);

  // Ataque (arma do personagem)
  const wt = p.char.weaponType;
  const wImg = wt === 'orange' ? hudImg('orange_ball') : wt === 'saber' ? hudImg('i_S_Dagger03') : hudImg('terraria_star');
  drawSkillSlot(x, y, sz, s, {
    label: wt === 'saber' ? 'SABRE' : wt === 'orange' ? 'LARANJA' : 'ESTRELA',
    key: gp ? 'RT' : 'ESPAÇO', ready: true, img: wImg, frac: 1,
  });
  if (wt === 'saber' && SABER_COLORS[saberColorIndex]) {
    // gema com a cor atual do sabre (tecla C troca)
    ctx.fillStyle = MED.ink; ctx.fillRect(x + sz - 9, y + 2, 8, 8);
    ctx.fillStyle = SABER_COLORS[saberColorIndex].hex; ctx.fillRect(x + sz - 8, y + 3, 6, 6);
  }
  x += sz + gap;

  // Giro / esquiva
  const dashReady = p.dashCd <= 0;
  drawSkillSlot(x, y, sz, s, {
    label: 'GIRO', key: gp ? 'LB' : 'SHIFT', ready: dashReady, img: hudImg('i_A_Shoes03'),
    frac: clamp(1 - p.dashCd / stats.dashCd, 0, 1), count: dashReady ? '' : p.dashCd.toFixed(1),
    flash: hudDashFlash, mode: 'sweep',
  });
  x += sz + gap;

  // Fúria / ultimate
  const ultReady = p.ultMeter >= 100;
  drawSkillSlot(x, y, sz, s, {
    label: ultReady ? 'FÚRIA!' : 'FÚRIA', key: gp ? 'Y' : 'E', ready: ultReady, img: hudImg('i_S_Fire02'),
    frac: clamp(p.ultMeter / 100, 0, 1), count: ultReady ? '' : Math.floor(p.ultMeter) + '%',
    flash: hudUltFlash, mode: 'fill', accent: MED.purpleLight, glow: true,
  });
  return { x: px, y: py, w: pw, h: ph };
}

// ---------------------------------------------------------------------
//  8. CINTO DE RELÍQUIAS (inf. esquerdo)
// ---------------------------------------------------------------------
function drawRelicBelt(s, m, topY, rightLimit) {
  const owned = UPGRADES.filter(u => ups[u.id] > 0);
  if (!owned.length) return;
  const sz = Math.round((touch.active ? 24 : 30) * s), gap = Math.round(4 * s);
  const maxW = rightLimit - m - m;
  const fit = Math.max(1, Math.floor((maxW - 16) / (sz + gap)));
  const shown = owned.length > fit ? owned.slice(0, fit - 1) : owned;
  const extra = owned.length - shown.length;
  const cells = shown.length + (extra > 0 ? 1 : 0);
  const bw = cells * (sz + gap) - gap + Math.round(16 * s), bh = sz + Math.round(14 * s);
  const bx = m, by = topY !== null ? topY : H - m - bh;
  medPanel(bx, by, bw, bh, 'thin');
  let x = bx + Math.round(8 * s);
  const y = by + Math.round(7 * s);
  for (const u of shown) {
    ctx.fillStyle = MED.ink; ctx.fillRect(x - 1, y - 1, sz + 2, sz + 2);
    ctx.fillStyle = '#2c1d12'; ctx.fillRect(x, y, sz, sz);
    const ic = hudImg('i_' + u.icon);
    if (ic) ctx.drawImage(ic, x + 2, y + 2, sz - 4, sz - 4);
    const n = ups[u.id];
    if (n > 1) txt('' + n, x + sz - 1, y + sz - 1, Math.round(7 * s), MED.goldLight, 'right');
    x += sz + gap;
  }
  if (extra > 0) txt('+' + extra, x + sz / 2, y + sz / 2 + Math.round(4 * s), Math.round(9 * s), MED.goldLight);
}

// ---------------------------------------------------------------------
//  9. SETAS FORA DA TELA (pontas de flecha; chefe = maior com caveira)
// ---------------------------------------------------------------------
function drawOffscreenThreatIndicators(topSafe, bottomSafe) {
  const left = enemies.length + toSpawn;
  const poi = [];
  for (const e of enemies) {
    if (isBossType(e.type)) poi.push({ x: e.x, y: e.y, col: MED.bloodLight, big: true });
    else if (e.type === 'goblin' || e.bounty) poi.push({ x: e.x, y: e.y, col: MED.goldLight });
    else if (left <= 3) poi.push({ x: e.x, y: e.y, col: MED.bloodLight });
  }
  for (const sh of shrines) poi.push({ x: sh.x, y: sh.y, col: sh.col });
  for (const k of pickups) if (k.kind === 'chest') poi.push({ x: k.x, y: k.y, col: MED.gold });

  const z = (cam && cam.zoom) || 1;
  for (const t of poi) {
    const sx = (t.x - cam.x) * z + W / 2, sy = (t.y - cam.y) * z + H / 2;
    if (sx > 24 && sx < W - 24 && sy > 24 && sy < H - 24) continue;
    const a = Math.atan2(sy - H / 2, sx - W / 2);
    const ex = clamp(sx, 30, W - 30), ey = clamp(sy, topSafe, H - bottomSafe);
    const sc = t.big ? 1.5 : 1;
    ctx.save();
    ctx.translate(ex, ey); ctx.rotate(a); ctx.scale(sc, sc);
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-7, -10); ctx.lineTo(-2, 0); ctx.lineTo(-7, 10); ctx.closePath();
    ctx.fillStyle = MED.ink; ctx.fill();
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-5, -7); ctx.lineTo(-1, 0); ctx.lineTo(-5, 7); ctx.closePath();
    ctx.fillStyle = t.col; ctx.fill();
    ctx.restore();
    if (t.big) txt('☠', ex - Math.cos(a) * 22, ey - Math.sin(a) * 22 + 4, 11, MED.bloodLight);
  }
}

// ---------------------------------------------------------------------
//  10. PERGAMINHO DE ANÚNCIO (desenrola com overshoot)
// ---------------------------------------------------------------------
function drawAnnounceScroll(s) {
  if (!banner) { hudBannerRef = null; return; }
  if (hudBannerRef !== banner) { hudBannerRef = banner; hudBannerT = 0; }
  const a = clamp(Math.min(banner.life * 2, 1), 0, 1);
  const open = easeOutBack(clamp(hudBannerT / 0.35, 0, 1));
  const fullW = Math.round(Math.min(560 * s, W * 0.86));
  const w = Math.max(30, Math.round(fullW * open));
  const h = Math.round((banner.sub ? 74 : 54) * s);
  const x = Math.round(W / 2 - w / 2), y = Math.round(H * 0.26 - h / 2);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = MED.ink; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = MED.parch; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(120,80,30,0.3)'; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y + h - 3, w, 3);
  // rolos de madeira nas pontas
  const rw = Math.round(10 * s);
  for (const rx of [x - rw, x + w]) {
    ctx.fillStyle = MED.ink; ctx.fillRect(rx - 1, y - 7, rw + 2, h + 14);
    ctx.fillStyle = MED.wood; ctx.fillRect(rx, y - 6, rw, h + 12);
    ctx.fillStyle = MED.woodLight; ctx.fillRect(rx + 2, y - 6, 2, h + 12);
    ctx.fillStyle = MED.gold; ctx.fillRect(rx - 2, y - 9, rw + 4, 4); ctx.fillRect(rx - 2, y + h + 5, rw + 4, 4);
  }
  if (open > 0.7) {
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    inkTxt(banner.txt, W / 2, y + Math.round(30 * s), Math.round((banner.small ? 16 : 20) * s), banner.boss ? MED.blood : MED.parchInk);
    if (banner.sub) inkTxt(banner.sub, W / 2, y + Math.round(54 * s), Math.round(9 * s), banner.boss ? MED.bloodDark : MED.parchInk);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------
//  FUNÇÃO PRINCIPAL DO HUD
// ---------------------------------------------------------------------
function drawHUD() {
  const p = player;
  if (!p) return;
  const now = performance.now();
  const dt = hudLastT ? clamp((now - hudLastT) / 1000, 0, 0.05) : 0.016;
  hudLastT = now;
  const s = hudScale();
  const m = Math.round(Math.max(10, Math.min(W, H) * 0.02));   // margem de segurança
  const left = enemies.length + toSpawn;

  // --- detecção de eventos -> feedback curto que volta ao repouso (game-feel)
  if (hudLastHp < 0) hudLastHp = p.hp;
  if (p.hp < hudLastHp) hudHurtT = 0.35;
  hudLastHp = p.hp;
  if (p.combo > hudLastCombo) hudComboPop = 0.18;
  hudLastCombo = p.combo;
  if (coins > hudLastCoins) hudCoinPop = 0.2;
  hudLastCoins = coins;
  if (p.level > hudLastLevel) hudLevelPop = 0.3;
  hudLastLevel = p.level;
  const dashReady = p.dashCd <= 0, ultReady = p.ultMeter >= 100;
  if (dashReady && !hudPrevDashReady) hudDashFlash = 0.25;
  if (ultReady && !hudPrevUltReady) hudUltFlash = 0.35;
  hudPrevDashReady = dashReady; hudPrevUltReady = ultReady;
  hudHurtT = Math.max(0, hudHurtT - dt);
  hudComboPop = Math.max(0, hudComboPop - dt);
  hudCoinPop = Math.max(0, hudCoinPop - dt);
  hudLevelPop = Math.max(0, hudLevelPop - dt);
  hudDashFlash = Math.max(0, hudDashFlash - dt);
  hudUltFlash = Math.max(0, hudUltFlash - dt);
  hudBannerT += dt;
  hudGhostXp += (p.xp - hudGhostXp) * Math.min(1, dt * 6);
  if (p.xp < hudGhostXp) hudGhostXp = p.xp;      // subiu de nível: zera sem "arrastar"
  hudGhostHp = p.hp;

  // --- layout por âncoras
  const hero = drawHeroCrest(p, s, m, dt);
  const treasTop = touch.active && touch.pauseBtn ? touch.pauseBtn.y + touch.pauseBtn.h + 10 : m;
  const heroW = hero.w;
  const treasW = Math.round(Math.min(196 * s, W * 0.36));
  const centerFree = W - heroW - treasW - m * 4;
  const bannerFits = centerFree >= 140 * s;
  const treas = drawTreasury(s, m, treasTop, !bannerFits);
  const map = drawMinimap(s, m, treas.bottom + Math.round(10 * s));

  // centro: chefe ou estandarte da onda
  let centerBottom;
  const bossActive = boss && !boss.dead && boss.hp > 0;
  if (bossActive) {
    if (centerFree >= 300 * s) centerBottom = drawBossBar(s, Math.round(20 * s), centerFree);
    else centerBottom = drawBossBar(s, hero.bottom + Math.round(16 * s), W - m * 2 - (map ? (W - map.left) + m : 0));
  } else if (bannerFits) {
    centerBottom = drawWaveBanner(s, left);
  } else {
    centerBottom = hero.bottom;
  }
  drawComboSeal(p, s, centerBottom + Math.round(4 * s));

  // inferior
  const skills = drawSkillBar(p, s, m);
  const beltTop = touch.active ? hero.bottom + Math.round(8 * s) : null;
  drawRelicBelt(s, m, beltTop, skills ? skills.x : W);

  drawAnnounceScroll(s);

  const topSafe = Math.max(hero.bottom, 60) + 10;
  drawOffscreenThreatIndicators(Math.min(topSafe, H * 0.4), skills ? H - skills.y + 10 : 50);

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

