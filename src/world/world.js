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

  // Fundo base verde sólido para eliminar qualquer artefato de transparência
  g.fillStyle = '#225526';
  g.fillRect(0, 0, WORLD.w, WORLD.h);

  const tile = (img, tx, ty, dx, dy) => g.drawImage(img, tx * 32, ty * 32, 32, 32, dx, dy, TS, TS);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const r = Math.random();
      if (r < 0.60) {
        tile(IMG.grass, 1, 3, x * TS, y * TS);
      } else if (r < 0.85) {
        tile(IMG.grassalt, 1, 3, x * TS, y * TS);
      } else {
        // Variações sólidas de grama na linha 5 (sempre IMG.grass para evitar quadrados vazados)
        tile(IMG.grass, randi(0, 2), 5, x * TS, y * TS);
      }
    }
  }
  const cx = COLS / 2, cy = ROWS / 2;
  const centerX = cx * TS, centerY = cy * TS;
  const block = (img, bx, by, bw, bh, interiorVariants) => {
    for (let j = 0; j < bh; j++)
      for (let i = 0; i < bw; i++) {
        const tx = i === 0 ? 0 : i === bw - 1 ? 2 : 1;
        const ty = j === 0 ? 2 : j === bh - 1 ? 4 : 3;
        if (tx === 1 && ty === 3 && interiorVariants && Math.random() < 0.35) {
          tile(img, randi(0, 2), 5, (bx + i) * TS, (by + j) * TS);
        } else {
          tile(img, tx, ty, (bx + i) * TS, (by + j) * TS);
        }
      }
  };
  block(IMG.dirt, cx - 4, cy - 3, 8, 6, true);
  // 4 caminhos de lajes antigas saindo da Praça Ancestral Central (N/S/L/O)
  for (let d = 3; d <= 9; d++) {
    const drawFlagstone = (fx, fy) => {
      g.fillStyle = 'rgba(42, 38, 52, 0.55)';
      g.fillRect(fx - 18, fy - 14, 36, 28);
      g.fillStyle = 'rgba(130, 122, 148, 0.45)';
      g.fillRect(fx - 16, fy - 12, 15, 11);
      g.fillRect(fx + 1, fy - 10, 14, 12);
      g.fillRect(fx - 14, fy + 1, 28, 10);
    };
    drawFlagstone(centerX + d * TS, centerY + rand(-4, 4));
    drawFlagstone(centerX - d * TS, centerY + rand(-4, 4));
    drawFlagstone(centerX + rand(-4, 4), centerY + d * TS * 0.85);
    drawFlagstone(centerX + rand(-4, 4), centerY - d * TS * 0.85);
  }
  // Praça Ancestral Central: anéis concêntricos de pedra e 8 runas místicas
  g.save();
  g.fillStyle = 'rgba(45, 42, 58, 0.42)';
  g.beginPath(); g.arc(centerX, centerY, 138, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#8b839e';
  g.lineWidth = 4;
  g.beginPath(); g.arc(centerX, centerY, 136, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(139, 131, 158, 0.72)';
  g.lineWidth = 2;
  g.beginPath(); g.arc(centerX, centerY, 96, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(centerX, centerY, 52, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI * 2) / 8;
    const rx = centerX + Math.cos(a) * 116;
    const ry = centerY + Math.sin(a) * 116;
    g.fillStyle = '#9f96b8';
    g.fillRect(rx - 5, ry - 5, 10, 10);
    g.fillStyle = '#e4dcff';
    g.fillRect(rx - 2, ry - 2, 4, 4);
  }
  g.restore();

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
  // Flores silvestres coloridas espalhadas pela grama
  const flowerCols = ['#ffd84a', '#ff6b9d', '#7ee8ff', '#ffffff'];
  for (let i = 0; i < 240; i++) {
    const fx = rand(40, WORLD.w - 40), fy = rand(60, WORLD.h - 40);
    if (Math.hypot(fx - centerX, fy - centerY) < 160) continue;
    if (ponds.some(pd => fx > pd.x - 10 && fx < pd.x + pd.w + 10 && fy > pd.y - 10 && fy < pd.y + pd.h + 10)) continue;
    g.fillStyle = '#1f4d20';
    g.fillRect(fx - 2, fy + 1, 5, 3);
    g.fillStyle = pick(flowerCols);
    g.fillRect(fx - 2, fy - 2, 4, 4);
    g.fillStyle = '#fff9d6';
    g.fillRect(fx - 1, fy - 1, 2, 2);
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

  // Ruínas Ancestrais: 4 pilares emoldurando os cantos externos do pátio central + 8 pelo mapa
  const plazaCorners = [
    [centerX - 185, centerY - 135],
    [centerX + 185, centerY - 135],
    [centerX - 185, centerY + 135],
    [centerX + 185, centerY + 135],
  ];
  for (const [px, py] of plazaCorners) {
    if (!blocked(px, py, 24)) {
      props.push({ kind: 'pillar', x: px, y: py, r: 18, sprite: 'ruin_pillar', solid: true });
    }
  }
  tries = 0;
  while (props.filter(p => p.kind === 'pillar').length < 12 && tries++ < 600) {
    const px = rand(120, WORLD.w - 120), py = rand(140, WORLD.h - 100);
    if (blocked(px, py, 45) || Math.hypot(px - centerX, py - centerY) < 240) continue;
    props.push({ kind: 'pillar', x: px, y: py, r: 18, sprite: 'ruin_pillar', solid: true });
  }

  // Estátuas dos Campeões Caídos: 2 flanqueando o norte do pátio + 2 externas
  const statueSpots = [
    [(cx - 5) * TS, (cy - 4) * TS],
    [(cx + 5) * TS, (cy - 4) * TS],
    [(cx - 12) * TS, (cy + 8) * TS],
    [(cx + 12) * TS, (cy - 8) * TS],
  ];
  for (const [sx, sy] of statueSpots) {
    if (!blocked(sx, sy, 28)) {
      props.push({ kind: 'statue', x: sx, y: sy, r: 20, sprite: 'hero_statue', solid: true });
    }
  }

  // Geodos de Cristal Arcano Interativos: 2 perto da praça + 8 espalhados
  const nearGeodes = [
    [centerX - 235, centerY + 15],
    [centerX + 235, centerY - 15],
  ];
  for (const [gx, gy] of nearGeodes) {
    if (!blocked(gx, gy, 24)) {
      props.push({ kind: 'geode', x: gx, y: gy, r: 16, hp: 3, maxHp: 3, sprite: 'crystal_geode', hurt: 0 });
    }
  }
  tries = 0;
  while (props.filter(p => p.kind === 'geode').length < 10 && tries++ < 700) {
    const gx = rand(140, WORLD.w - 140), gy = rand(140, WORLD.h - 120);
    if (blocked(gx, gy, 45) || Math.hypot(gx - centerX, gy - centerY) < 250) continue;
    props.push({ kind: 'geode', x: gx, y: gy, r: 16, hp: 3, maxHp: 3, sprite: 'crystal_geode', hurt: 0 });
  }

  // Cogumelos Mágicos Bioluminescentes (noCollide: true para não travar movimento)
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6 + 0.35;
    const mx = centerX + Math.cos(a) * 165;
    const my = centerY + Math.sin(a) * 130;
    if (!blocked(mx, my, 10)) {
      props.push({ kind: 'shroom', x: mx, y: my, r: 12, sprite: 'magic_mushroom', glow: Math.random(), noCollide: true });
    }
  }
  for (let i = 0; i < 22; i++) {
    const mx = rand(90, WORLD.w - 90), my = rand(100, WORLD.h - 80);
    if (!blocked(mx, my, 20)) {
      props.push({ kind: 'shroom', x: mx, y: my, r: 12, sprite: 'magic_mushroom', glow: Math.random(), noCollide: true });
    }
  }
}

function applyEventMapMutation(eventName) {
  if (!Array.isArray(props)) return;
  props = props.filter(p => !p.eventProp);

  const refX = (typeof player !== 'undefined' && player) ? player.x : WORLD.w / 2;
  const refY = (typeof player !== 'undefined' && player) ? player.y : WORLD.h / 2;

  const makeSpec = (kind) => {
    if (kind === 'noir_lamp') return { kind: 'noir_lamp', r: 14, sprite: 'noir_lamp', solid: true, eventProp: true };
    if (kind === 'blood_obelisk') return { kind: 'blood_obelisk', r: 18, hp: 3, maxHp: 3, hurt: 0, sprite: 'blood_obelisk', eventProp: true };
    if (kind === 'void_rift') return { kind: 'void_rift', r: 22, sprite: 'void_rift', noCollide: true, phase: Math.random() * 6.28, eventProp: true };
    if (kind === 'ice_spire') return { kind: 'ice_spire', r: 17, hp: 2, maxHp: 2, hurt: 0, sprite: 'ice_spire', eventProp: true };
    if (kind === 'solar_monolith') return { kind: 'solar_monolith', r: 18, hp: 3, maxHp: 3, hurt: 0, sprite: 'solar_monolith', eventProp: true };
    if (kind === 'geode') return { kind: 'geode', r: 16, hp: 3, maxHp: 3, hurt: 0, sprite: 'crystal_geode', eventProp: true };
    return { kind: 'shroom', r: 12, sprite: 'magic_mushroom', glow: Math.random(), noCollide: true, eventProp: true };
  };

  let kinds = [];
  if (eventName === 'noir') kinds = ['noir_lamp'];
  else if (eventName === 'bloodmoon') kinds = ['blood_obelisk'];
  else if (eventName === 'void_eclipse') kinds = ['void_rift'];
  else if (eventName === 'glacial') kinds = ['ice_spire'];
  else if (eventName === 'solar' || eventName === 'magma_surge') kinds = ['solar_monolith'];
  else if (eventName === 'psychedelic') kinds = ['void_rift', 'geode', 'shroom'];
  else return;

  // 4 objetos próximos ao jogador para aparecerem imediatamente na tela!
  for (let i = 0; i < 4; i++) {
    const chosenKind = kinds[i % kinds.length];
    let placed = false;
    for (let t = 0; t < 30 && !placed; t++) {
      const ang = (i * Math.PI / 2) + (Math.PI / 4) + rand(-0.35, 0.35);
      const distR = rand(170, 310);
      const px = clamp(refX + Math.cos(ang) * distR, 90, WORLD.w - 90);
      const py = clamp(refY + Math.sin(ang) * distR * 0.78, 120, WORLD.h - 70);
      if (!blocked(px, py, 22)) {
        props.push({ ...makeSpec(chosenKind), x: px, y: py });
        placed = true;
      }
    }
  }
  // Mais 5 objetos espalhados pela arena
  let extra = 0, tries = 0;
  while (extra < 5 && tries++ < 200) {
    const chosenKind = kinds[extra % kinds.length];
    const px = rand(110, WORLD.w - 110), py = rand(130, WORLD.h - 80);
    if (Math.hypot(px - refX, py - refY) < 280 || blocked(px, py, 32)) continue;
    props.push({ ...makeSpec(chosenKind), x: px, y: py });
    extra++;
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
  { id: 'frenzy', name: 'ALTAR DO FRENESI', sub: '+Velocidade e Cadência Máxima por 10s!', col: '#ff6438', icon: 'i_S_Fire01', sprite: 'altar_frenzy' },
  { id: 'shield', name: 'ALTAR CELESTIAL', sub: '+2 Escudos Orbitais Protetores!', col: '#4fe3ff', icon: 'i_S_Buff03', sprite: 'altar_shield' },
  { id: 'fortune', name: 'ALTAR DA FORTUNA', sub: 'Chuva de Moedas + Ímã Global!', col: '#ffd23f', icon: 'i_I_GoldCoin', sprite: 'altar_fortune' },
  { id: 'storm', name: 'ALTAR DO TROVÃO', sub: 'Tempestade de Raios + Fúria!', col: '#d26bff', icon: 'i_S_Light02', sprite: 'altar_storm' },
  { id: 'pact', name: 'ALTAR DO PACTO', sub: 'Sacrifique 1 Coração por +1 NÍVEL e +1 DANO!', col: '#ff2a55', icon: 'i_I_Ruby', sprite: 'altar_pact' },
  { id: 'cursed', name: 'BAÚ DESAFIADOR', sub: 'Derrote a Emboscada de Elites por Recompensa Épica!', col: '#ff9a2e', icon: 'i_I_Chest01', sprite: 'altar_cursed' },
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
  if (typeof addTrauma === 'function') addTrauma(0.42);
  if (typeof GPU_FX !== 'undefined') {
    GPU_FX.shockwave(x, y, radius * 2.1, 0.048, 0.42);
    GPU_FX.chroma(0.009);
    GPU_FX.zoomPunch(0.025);
  }
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
    hurtPlayer(1, x, y, 'Explosão / Meteoro');
  }
}

function collideStatic(e, r) {
  for (const o of trees) {
    if (!o.r) continue;
    const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), m = r + o.r;
    if (d < m && d > 0) { e.x = o.x + dx / d * m; e.y = o.y + dy / d * m; }
  }
  for (const o of rocks) {
    const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), m = r + o.r;
    if (d < m && d > 0) { e.x = o.x + dx / d * m; e.y = o.y + dy / d * m; }
  }
  for (const o of props) {
    if (o.noCollide) continue;
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

