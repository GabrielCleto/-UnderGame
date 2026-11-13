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
  const d = MON[type] || MON.slime;
  const eliteChance = waveEvent === 'golden' ? 0.28 : waveEvent === 'bloodmoon' ? 0.18 : Math.min(0.22, 0.05 + Math.max(0, wave - 4) * 0.01);
  const elite = Boolean(opts.forceElite || (!opts.noElite && !isBossType(type) && type !== 'goblin' && (wave >= 4 || waveEvent === 'golden' || waveEvent === 'bloodmoon') && Math.random() < eliteChance));
  const ELITE_TRAITS = [
    { id: 'vampiric', label: 'Vampírico', col: '#ff4268' },
    { id: 'teleporter', label: 'Dimensional', col: '#c844ff' },
    { id: 'armored', label: 'Encouraçado', col: '#9aa0a8' },
    { id: 'volatile', label: 'Volátil', col: '#ff7a29' },
    { id: 'frost', label: 'Glacial', col: '#62f6ff' },
  ];
  const eliteTrait = elite ? pick(ELITE_TRAITS) : null;
  if (elite) {
    scaleMul *= 1.32;
    hpMul *= (eliteTrait.id === 'armored' ? 3.8 : 2.9);
  }
  if (opts.bounty) { scaleMul *= 1.65; hpMul *= 6.5; extra.bounty = true; extra.bountyT = 22; }
  const pos = at || (type === 'flower' ? spawnPos(260, 480, 40) : spawnPos(Math.max(W, H) * 0.55, Math.max(W, H) * 0.7, 30));

  // Escalonamento implacável: inimigos ficam mais resistentes, velozes e letais conforme o jogador evolui seus atributos
  const attrScale = player ? Math.max(0, player.level - 1) * 0.14 + Math.max(0, stats.dmg - 1) * 0.22 + Math.max(0, stats.atkRate - 1) * 0.35 : 0;
  const diff = DIFFICULTY_MODES[difficultyIdx] || DIFFICULTY_MODES[0];
  const hpScale = (1.25 + (wave - 1) * 0.38 + Math.pow(Math.max(0, wave - 2), 1.68) * 0.20 + attrScale) * diff.hpMul;
  const hp = Math.max(2, Math.round(d.hp * hpMul * (isBossType(type) ? diff.hpMul : hpScale)));
  const spdScale = (1.12 + Math.min(wave, 30) * 0.035 + Math.min(0.45, player ? (player.level - 1) * 0.025 : 0)) * diff.spdMul * (extra.mini ? 1.28 : 1) * (waveEvent === 'swarm' ? 1.18 : 1) * (waveEvent === 'bloodmoon' ? 1.22 : 1);
  const scaledDmg = d.dmg + (wave >= 5 ? 1 : 0) + (wave >= 10 && (elite || isBossType(type)) ? 1 : 0) + (wave >= 16 ? 1 : 0) + (waveEvent === 'bloodmoon' ? 1 : 0);

  const e = {
    type, x: pos.x, y: pos.y, vx: 0, vy: 0, kx: 0, ky: 0, hp, maxHp: hp,
    r: d.r * scaleMul, scale: d.scale * scaleMul, speed: d.speed * spdScale,
    dmg: scaledDmg, xp: Math.ceil(d.xp * (elite ? 2.4 : 1) * (waveEvent === 'swarm' ? 1.25 : 1) * (waveEvent === 'bloodmoon' ? 1.8 : 1)),
    score: Math.round(d.score * hpMul * (waveEvent === 'bloodmoon' ? 1.5 : 1)),
    t: rand(0, 10), row: 2, hurt: 0, spawn: opts.instant ? 0 : 0.7, act: rand(1.1, 2.6), mode: 'move', slow: 0, freezeT: 0,
    poisonT: 0, poisonDmg: 0, poisonTick: 0, shieldOn: false,
    elite, eliteTrait, fireHit: 0, ...extra,
  };
  if (type === 'goblin') {
    e.escapeT = 16;
    e.coinT = 0.6;
  }
  if (isBossType(type)) {
    bossCount++;
    const bossAttrScale = player ? Math.max(0, player.level - 1) * 0.09 + Math.max(0, stats.dmg - 1) * 0.16 : 0;
    const bossWaveScale = 1.35 + Math.max(0, wave - 5) * 0.25 + Math.pow(Math.max(0, bossCount - 1), 1.3) * 0.45 + bossAttrScale;
    e.hp = e.maxHp = Math.round((d.hp + (bossCount - 1) * 160) * bossWaveScale);
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
  if (e.dead || e.spawn > 0 || e.invul || e.burrowed) return false;
  if ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded) return false;
  let crit = false;
  const pref = (player && player.prefix) || null;
  const critChance = stats.crit + (pref ? pref.critAdd : 0);
  if (!opts.noCrit && Math.random() < critChance) { dmg *= 2; crit = true; burst(e.x, e.y - e.r, '#ffe042', 12, 240); }
  if (pref && pref.dmgMul && !opts.noCrit) { dmg = Math.max(1, Math.round(dmg * pref.dmgMul)); }
  if (pref && pref.kbMul && power) { power *= pref.kbMul; }
  if (pref && pref.id === 'mythical' && player && player.ultMeter < 100) { player.ultMeter = Math.min(100, player.ultMeter + 0.6); }
  if (stats.infPower) dmg = Math.ceil(dmg * (1 + 0.25 * stats.infPower));
  if (stats.bloodOrb && player && player.hp <= stats.maxHp * 0.5) dmg = Math.ceil(dmg * (1 + 0.20 * stats.bloodOrb));
  if (e.type === 'twilight_lich' && (e.lichShields || 0) > 0) {
    e.lichShieldHits = (e.lichShieldHits || 0) + 1;
    dmg = Math.max(1, Math.ceil(dmg * 0.35));
    if (e.lichShieldHits >= 4) {
      e.lichShields--; e.lichShieldHits = 0;
      SFX.shieldBreak();
      fxRings.push({ kind: 'nova', x: e.x, y: e.y - 30, r: 16, maxR: 110, life: 0.3, max: 0.3, col: '#ffe042' });
      texts.push({ x: e.x, y: e.y - 80, txt: 'ESCUDO DO LICH QUEBRADO!', life: 1.1, color: '#ffe042', size: 11 });
    }
  }
  if (crit && stats.infPower && !opts.isNova) {
    fxRings.push({ kind: 'nova', x: e.x, y: e.y - 16, r: 10, maxR: 95, life: 0.25, max: 0.25, col: '#c844ff' });
  }
  if (stats.bloodOrb && player && player.combo > 0 && player.combo % 12 === 0) {
    player.hp = Math.min(stats.maxHp, player.hp + 1);
  }
  if (e.eliteTrait && e.eliteTrait.id === 'armored') {
    dmg = Math.max(1, Math.ceil(dmg * 0.75));
  }
  if (e.shieldOn && !opts.ignoreShield) {
    dmg = Math.max(1, Math.ceil(dmg * 0.4));
    power *= 0.25;
  }
  if (isBossType(e.type)) {
    const maxHit = Math.max(12, Math.ceil(e.maxHp * 0.07));
    if (dmg > maxHit) dmg = maxHit + Math.ceil((dmg - maxHit) * 0.2);
  }
  totalDamageDealt += dmg;
  e.hp -= dmg;
  if (isBossType(e.type) && !e.enragedTriggered && e.hp > 0 && e.hp <= e.maxHp * 0.5) {
    e.enragedTriggered = true;
    SFX.bossAwake();
    shake = Math.max(shake, 8);
    fxRings.push({ kind: 'nova', x: e.x, y: e.y - 20, r: 20, maxR: 220, life: 0.45, max: 0.45, col: '#ff3040' });
    texts.push({ x: e.x, y: e.y - 95, txt: '🔥 CHEFE ENFURECIDO!', life: 1.8, color: '#ff385c', size: 15 });
  }
  e.hurt = 0.18;
  if (stats.venom > 0 && !opts.isPoison) {
    e.poisonT = 3.2 + stats.venom * 0.5;
    e.poisonDmg = Math.max(e.poisonDmg || 0, stats.venom + Math.floor(stats.dmg * 0.35));
  }
  if (fromX !== undefined) {
    const a = Math.atan2(e.y - fromY, e.x - fromX);
    const res = isBossType(e.type) ? 0.015 : e.type === 'golem' || e.type === 'bigworm' || e.type === 'flower' ? 0.18 : e.big ? 0.4 : 1;
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
  if (!opts.noFreeze) freeze = Math.max(freeze, crit ? 0.03 : 0.015);
  // Não treme a tela em hits comuns contra monstros normais (elimina enjoo e fadiga visual)
  if (opts.heavyImpact || (isBossType(e.type) && crit)) {
    shake = Math.max(shake, 3);
    addTrauma(0.12);
  }
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
  if (p.combo > maxCombo) maxCombo = p.combo;
  bestiaryKills[e.type] = (bestiaryKills[e.type] || 0) + 1;
  localStorage.setItem('gabriel_bestiary', JSON.stringify(bestiaryKills));
  p.ultMeter = Math.min(100, p.ultMeter + (isBossType(e.type) ? 40 : e.elite ? 10 : 3.2));
  const diff = DIFFICULTY_MODES[difficultyIdx] || DIFFICULTY_MODES[0];
  const mult = 1 + Math.floor(p.combo / 10) * 0.25;
  score += Math.round(e.score * mult * diff.scoreMul);

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
    shake = Math.max(shake, 6);
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
  if (e.eliteTrait && e.eliteTrait.id === 'volatile') {
    SFX.explode();
    fxRings.push({ kind: 'nova', x: e.x, y: e.y - 12, r: 12, maxR: 115, life: 0.3, max: 0.3, col: '#ff6420' });
    burst(e.x, e.y - 12, '#ff6420', 20, 240);
    if (player && Math.hypot(player.x - e.x, player.y - e.y) < 115) hurtPlayer(1, e.x, e.y);
  }
  if (isBossType(e.type)) {
    const otherBoss = enemies.find(o => !o.dead && o !== e && isBossType(o.type));
    boss = otherBoss || null;
    SFX.bossDie();
    shake = 10; freeze = 0.2;
    const essGain = 3 + Math.floor(wave / 5) * 2;
    soulEssences += essGain;
    localStorage.setItem('gabriel_essences', soulEssences);
    texts.push({ x: e.x, y: e.y - 115, txt: '+' + essGain + ' ESSÊNCIA ABISSAL!', life: 2.0, color: '#c844ff', size: 13 });
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
    p.xpNext = Math.floor(12 + p.level * 6.5 + Math.pow(p.level, 1.72));
    p.pendingLevels++;
  }
}

function openLevelUp() {
  const avail = UPGRADES.filter(u => !bannedUpgrades.has(u.id) && (ups[u.id] || 0) < u.max);
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
  panelOpenAt = performance.now();
  SFX.level();
}
function getRerollCost() {
  return rerollsUsed === 0 ? 0 : 8 + rerollsUsed * 6;
}
function rerollLevelUp() {
  const cost = getRerollCost();
  if (coins < cost) { SFX.shopNo(); return; }
  const avail = UPGRADES.filter(u => !bannedUpgrades.has(u.id) && (ups[u.id] || 0) < u.max);
  if (avail.length <= 1) return;
  coins -= cost;
  rerollsUsed++;
  const choices = [];
  while (choices.length < 3 && choices.length < avail.length) {
    const u = pick(avail);
    if (!choices.includes(u)) choices.push(u);
  }
  levelChoices = choices; levelSel = 0;
  SFX.shrine();
}
function banishSelectedUpgrade() {
  if (bansLeft <= 0 || !levelChoices || !levelChoices[levelSel]) { SFX.shopNo(); return; }
  const targetU = levelChoices[levelSel];
  bannedUpgrades.add(targetU.id);
  bansLeft--;
  const avail = UPGRADES.filter(u => !bannedUpgrades.has(u.id) && (ups[u.id] || 0) < u.max && !levelChoices.includes(u));
  if (avail.length > 0) levelChoices[levelSel] = pick(avail);
  else levelChoices.splice(levelSel, 1);
  levelSel = Math.min(levelSel, Math.max(0, levelChoices.length - 1));
  SFX.shieldBreak();
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
    // Amxral: Passiva Mira Estelar (a cada 5 tiros, Estrela Gigante)
    p.shotCount = (p.shotCount || 0) + 1;
    const isEmpowered = p.shotCount % 5 === 0;
    SFX.starThrow();
    const starSpeed = (isEmpowered ? 680 : 590) * Math.min(1.5, 0.85 + stats.range * 0.15);
    for (const an of spreadAngles(a, shotCount, 0.16)) {
      pshots.push({
        kind: 'star', x: p.x + Math.cos(an) * 20, y: p.y - 36 + Math.sin(an) * 20,
        vx: Math.cos(an) * starSpeed, vy: Math.sin(an) * starSpeed,
        r: (isEmpowered ? 26 : 16) * stats.range, dmg: (stats.dmg + 1) * (isEmpowered ? 2 : 1),
        pierce: isEmpowered ? 5 : 2, life: 1.25, rot: rand(0, 6),
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
  burst(b.x, b.y - 25, b.kind === 'tnt' ? '#ff5533' : b.kind === 'lucky' ? '#ffe042' : '#8a5a2b', 6, 160);
  if (b.hp <= 0) {
    b.dead = true;
    if (b.kind === 'lucky') {
      SFX.luckyOpen();
      fxRings.push({ kind: 'nova', x: b.x, y: b.y - 16, r: 12, maxR: 130, life: 0.35, max: 0.35, col: '#ffe042' });
      burst(b.x, b.y - 20, '#ffe042', 24, 260);
      const luckRoll = Math.random();
      if (luckRoll < 0.30) {
        for (let i = 0; i < 8; i++) dropItem('coin', b.x, b.y);
        dropItem('ruby', b.x, b.y);
        texts.push({ x: b.x, y: b.y - 45, txt: '🍀 LUCKY: CHUVA DE OURO!', life: 1.5, color: '#ffe042', size: 12 });
      } else if (luckRoll < 0.58) {
        player.ultMeter = 100;
        player.frenzyT = Math.max(player.frenzyT || 0, 7);
        texts.push({ x: b.x, y: b.y - 45, txt: '⚡ LUCKY: PODER DO INFINITO!', life: 1.5, color: '#d66fff', size: 12 });
      } else if (luckRoll < 0.80) {
        spawnTerrariaFallenStar(b.x + rand(-80, 80), b.y + rand(-80, 80));
        dropItem('potion', b.x, b.y);
        texts.push({ x: b.x, y: b.y - 45, txt: '☄ LUCKY: ESTRELA CADENTE!', life: 1.5, color: '#62f6ff', size: 12 });
      } else {
        for (let i = 0; i < 4; i++) spawnEnemy(pick(['slime', 'chaos_imp', 'bat']), { x: clamp(b.x + rand(-70, 70), 60, WORLD.w - 60), y: clamp(b.y + rand(-70, 70), 100, WORLD.h - 40) }, { noElite: true });
        dropItem('chest', b.x, b.y);
        texts.push({ x: b.x, y: b.y - 45, txt: '🎲 LUCKY: EMBOSCADA + BAÚ!', life: 1.6, color: '#ff8a3d', size: 12 });
      }
      score += 35;
      return;
    }
    if (b.kind === 'crystal') {
      SFX.crystalShatter();
      fxRings.push({ kind: 'nova', x: b.x, y: b.y - 14, r: 10, maxR: 165, life: 0.36, max: 0.36, col: '#62f6ff' });
      burst(b.x, b.y - 16, '#8ef5ff', 20, 250);
      for (const e of enemies) {
        if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) < 165 + e.r) {
          e.slow = Math.max(e.slow || 0, 2.5);
          damageEnemy(e, 6 + wave, b.x, b.y, 420, { color: '#62f6ff' });
        }
      }
      texts.push({ x: b.x, y: b.y - 44, txt: 'NOVA CRISTALINA!', life: 1.0, color: '#62f6ff', size: 11 });
      score += 45;
      return;
    }
    if (b.kind === 'totem') {
      SFX.explode();
      fxRings.push({ kind: 'nova', x: b.x, y: b.y - 16, r: 12, maxR: 110, life: 0.3, max: 0.3, col: '#c844ff' });
      for (let i = 0; i < 4; i++) dropItem('coin', b.x, b.y);
      dropItem('ruby', b.x, b.y);
      texts.push({ x: b.x, y: b.y - 45, txt: 'TOTEM DESTRUÍDO!', life: 1.2, color: '#c844ff', size: 11 });
      score += 60;
      return;
    }
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
  if (k.kind === 'coin') { coins += (Math.random() < ((stats.coinMul || 1) - 1) ? 2 : 1); score += 10; SFX.coin(); }
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
    shake = Math.max(shake, 5);
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
    shake = 5;
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
  shake = 7; freeze = 0.06; addTrauma(0.25);
  SFX.hurt();
  gamepadRumble(0.45, 0.75, 230);
  burst(p.x, p.y - 40, '#ff4d4d', 16, 220);
  const a = Math.atan2(p.y - fy, p.x - fx);
  p.x += Math.cos(a) * 28; p.y += Math.sin(a) * 28;
  collideStatic(p, 14);
  texts.push({ x: p.x, y: p.y - 110, txt: '-' + dmg, life: 0.9, color: '#ff5d5d', size: 16 });
  if (p.hp <= 0) {
    if (stats.revivesLeft > 0) {
      stats.revivesLeft--;
      p.hp = Math.max(2, Math.ceil(stats.maxHp * 0.5));
      p.inv = 2.4;
      SFX.bloodRite();
      fxRings.push({ kind: 'nova', x: p.x, y: p.y - 24, r: 20, maxR: 260, life: 0.5, max: 0.5, col: '#ffd23f' });
      for (const e of enemies) {
        if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 260) damageEnemy(e, 25 + stats.dmg * 4, p.x, p.y, 600, { color: '#ffd23f', noFreeze: true });
      }
      texts.push({ x: p.x, y: p.y - 125, txt: '✨ SEGUNDA CHANCE!', life: 2.0, color: '#ffd23f', size: 15 });
      return;
    }
    gameOver();
  }
}


function gameOver() {
  state = 'over';
  time = 0;
  SFX.over();
  music.volume = 0.12;
  if (score > best) { best = score; localStorage.setItem('gabriel_best2', best); }
}

