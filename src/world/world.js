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
  const cur = props.filter(p => p.kind === 'barrel' || p.kind === 'tnt' || p.kind === 'lucky').length;
  while (cur + made < n && tries++ < 300) {
    const roll = Math.random();
    const kind = roll < 0.16 ? 'lucky' : roll < 0.44 ? 'tnt' : 'barrel';
    const p = { kind, x: rand(80, WORLD.w - 80), y: rand(120, WORLD.h - 60), r: 15, hp: kind === 'barrel' ? 2 : 1, hurt: 0 };
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
  shake = Math.max(shake, 7);
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

