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
    if (!isBossType(e.type) && e.type !== 'flower' && e.type !== 'goblin' && d < 210 && d > 55) {
    e.lungeCd = (e.lungeCd || rand(1.2, 3.0)) - dt;
    if (e.lungeCd <= 0) {
      e.lungeCd = rand(2.2, 4.2);
      const side = Math.random() < 0.35 ? rand(-0.6, 0.6) : 0;
      const la = Math.atan2(p.y - e.y, p.x - e.x) + side;
      e.kx += Math.cos(la) * 320; e.ky += Math.sin(la) * 320;
    }
  }
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
      if (d < 200) { sx = -sx; sy = -sy; } else if (d < 330) { const dir = (e.t % 6 < 3 ? 1 : -1); sx = -uy * e.speed * dir; sy = ux * e.speed * dir; }
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
    case 'chaos_imp':
      sx += Math.cos(e.t * 5) * 45; sy += Math.sin(e.t * 5) * 45;
      e.act -= dt;
      if (e.act <= 0 && d < 550) {
        e.act = rand(2.2, 3.4);
        const a = Math.atan2(p.y - 35 - (e.y - e.r), dx);
        enemyShoot(e, a, 230, 7, 'orange');
        beep(400, 0.08, 'sawtooth', 0.03, -120);
      }
      break;
    case 'void_spider':
      e.act -= dt;
      if (e.act <= 0) {
        e.act = rand(1.8, 2.8);
        e.mode = 'leap';
        e.leapT = 0.45;
        e.ca = Math.atan2(p.y - e.y, p.x - e.x);
      }
      if (e.mode === 'leap') {
        e.leapT -= dt;
        sx = Math.cos(e.ca) * e.speed * 1.8;
        sy = Math.sin(e.ca) * e.speed * 1.8;
        if (e.leapT <= 0) e.mode = 'move';
      }
      break;
    case 'boss':
      bossAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'boss_void_overlord':
      bossVoidOverlordAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'boss_magma_colossus':
      bossMagmaColossusAI(e, dt, ux, uy, d);
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
    case 'carminite_ghast': {
      const keep = 210;
      const str = Math.sin(e.t * 2.2) * 48;
      if (d > keep + 40) { sx = ux * e.speed; sy = uy * e.speed; }
      else if (d < keep - 40) { sx = -ux * e.speed * 0.85; sy = -uy * e.speed * 0.85; }
      else { sx = -uy * str; sy = ux * str; }
      e.act -= dt;
      if (e.act <= 0) {
        e.act = 2.1;
        const baseA = Math.atan2(p.y - e.y, p.x - e.x);
        for (const off of [-0.16, 0, 0.16]) enemyShoot(e, baseA + off, 235, 7, 'orange');
      }
      break;
    }
    case 'twilight_lich':
      twilightLichAI(e, dt, ux, uy, d);
      sx = e.vx; sy = e.vy;
      break;
    case 'aether_slider':
      aetherSliderAI(e, dt, ux, uy, d);
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
  if (e.eliteTrait) {
    if (e.eliteTrait.id === 'teleporter' && d > 210) {
      e.tpCd = (e.tpCd || rand(2.5, 4.5)) - dt;
      if (e.tpCd <= 0) {
        e.tpCd = rand(4.0, 6.0);
        const ta = rand(0, Math.PI * 2);
        e.x = clamp(p.x + Math.cos(ta) * 130, 60, WORLD.w - 60);
        e.y = clamp(p.y + Math.sin(ta) * 130, 100, WORLD.h - 40);
        fxRings.push({ kind: 'nova', x: e.x, y: e.y - 14, r: 8, maxR: 48, life: 0.22, max: 0.22, col: '#c844ff' });
      }
    } else if (e.eliteTrait.id === 'frost' && d < 280) {
      e.frostCd = (e.frostCd || rand(1.8, 3.2)) - dt;
      if (e.frostCd <= 0) {
        e.frostCd = 3.2;
        enemyShoot(e, Math.atan2(p.y - e.y, p.x - e.x), 210, 7, 'cyan');
      }
    }
  }
  if (isBossType(e.type)) {
    const isFury = e.hp < e.maxHp * 0.5;
    e.novaCd = (e.novaCd || rand(3.5, 5.5)) - dt;
    if (e.novaCd <= 0) {
      e.novaCd = isFury ? rand(3.8, 5.2) : rand(6.2, 8.0);
      SFX.bossTelegraph();
      hazards.push({ kind: 'boss_nova', x: p.x, y: p.y, r: 95, t: 0, dur: 0.9 });
      texts.push({ x: e.x, y: e.y - e.r - 24, txt: 'NOVA RÚNICA!', life: 0.9, color: '#e08aff', size: 10 });
    }
  }
  if (!((e.type === 'ghost' || e.type === 'necro_boss') && e.faded) && e.type !== 'goblin' && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 14) {
    hurtPlayer(e.dmg, e.x, e.y);
    if (e.eliteTrait && e.eliteTrait.id === 'vampiric') e.hp = Math.min(e.maxHp, e.hp + Math.max(2, Math.ceil(e.maxHp * 0.1)));
    if (e.eliteTrait && e.eliteTrait.id === 'frost') p.slow = Math.max(p.slow || 0, 1.4);
  }
}

function bossAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.55 : 1.25); e.vy = uy * e.speed * (enraged ? 1.55 : 1.25);
    if (e.pt <= 0) {
      const phases = ['burst', 'charge', 'bombs', 'summon', 'blink_slam'];
      e.phase = pick(phases);
      e.pt = e.phase === 'burst' ? 0.25 : e.phase === 'charge' ? 0.55 : e.phase === 'bombs' ? 0.35 : 0.40;
      e.shots = enraged ? 7 : 5;
      if (e.phase === 'charge') { e.ca = Math.atan2(p.y - e.y, p.x - e.x); play('giant1', 0.5, 0.2); }
      if (e.phase === 'blink_slam') {
        const ang = rand(0, Math.PI * 2);
        e.x = clamp(p.x + Math.cos(ang) * 165, 80, WORLD.w - 80);
        e.y = clamp(p.y + Math.sin(ang) * 165, 110, WORLD.h - 60);
        fxRings.push({ kind: 'nova', x: e.x, y: e.y - 20, r: 16, maxR: 130, life: 0.3, max: 0.3, col: '#ff8a14' });
        for (let i = 0; i < 12; i++) enemyShoot(e, (i * Math.PI * 2) / 12, 260, 8, 'orange');
        e.phase = 'chase'; e.pt = enraged ? 0.9 : 1.25;
      }
    }
  } else if (e.phase === 'burst') {
    if (e.pt <= 0) {
      const n = enraged ? 20 : 16, off = e.shots * 0.25;
      for (let i = 0; i < n; i++) enemyShoot(e, off + i * Math.PI * 2 / n, 265, 9, 'orange');
      beep(220, 0.15, 'square', 0.04, -80);
      e.shots--; e.pt = enraged ? 0.28 : 0.36;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = enraged ? 0.95 : 1.3; }
    }
  } else if (e.phase === 'charge') {
    if (e.pt > 0) { e.ca = e.pt > 0.3 ? Math.atan2(p.y - e.y, p.x - e.x) : e.ca; }
    else {
      e.vx = Math.cos(e.ca) * (enraged ? 860 : 760);
      e.vy = Math.sin(e.ca) * (enraged ? 860 : 760);
      if (Math.random() < 0.35 && puddles.length < 24) {
        puddles.push({ kind: 'acid', x: e.x, y: e.y, r: 32, life: 3.0, max: 3.0, tick: 0.35 });
      }
      if (Math.random() < 0.6) particles.push({ x: e.x + rand(-20, 20), y: e.y, vx: 0, vy: -30, life: 0.45, max: 0.45, color: 'rgba(255,140,40,0.8)', size: 7 });
      if (e.pt < -0.6) { e.phase = 'chase'; e.pt = 1.8; shake = Math.max(shake, 6); }
    }
  } else if (e.phase === 'bombs') {
    if (e.pt <= 0) {
      const bCount = enraged ? 4 : 3;
      for (let i = 0; i < bCount; i++) {
        const bx = clamp(p.x + rand(-160, 160), 90, WORLD.w - 90);
        const by = clamp(p.y + rand(-140, 140), 120, WORLD.h - 60);
        hazards.push({ kind: 'meteor', x: bx, y: by, r: 70, t: 0, dur: 1.2 });
      }
      play('giant3', 0.5, 0.1);
      e.phase = 'chase'; e.pt = 2.2;
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const n = enraged ? 4 : 2;
      for (let i = 0; i < n; i++) spawnEnemy(pick(['bomber', 'bat', 'chaos_imp']), { x: e.x + rand(-80, 80), y: e.y + rand(-80, 80) }, { noElite: true });
      burst(e.x, e.y - 60, '#ff8a14', 32, 280);
      e.phase = 'chase'; e.pt = 2.4;
    }
  }
}

function leviathanAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (e.phase === 'chase') {
    const waveSway = Math.sin(e.t * 5.5) * 80;
    const spd = e.speed * (enraged ? 1.38 : 1.12);
    e.vx = ux * spd - uy * waveSway;
    e.vy = uy * spd + ux * waveSway;
    if (e.pt <= 0) {
      e.phase = ['spiral', 'burrow', 'charge', 'meteors', 'summon'][e.cycle++ % 5];
      e.pt = e.phase === 'burrow' ? 1.3 : e.phase === 'charge' ? 0.9 : 0.45;
      e.shots = enraged ? 8 : 5;
      e.spinA = rand(0, Math.PI * 2);
      if (e.phase === 'charge') { e.ca = Math.atan2(p.y - e.y, p.x - e.x); play('giant1', 0.5, 0.15); }
    }
  } else if (e.phase === 'burrow') {
    e.burrowed = true;
    e.invul = true;
    e.vx = ux * e.speed * 1.45;
    e.vy = uy * e.speed * 1.45;
    if (Math.random() < 0.7) {
      particles.push({ x: e.x + rand(-20, 20), y: e.y + rand(-10, 10), vx: rand(-20, 20), vy: rand(-30, -10), life: 0.35, max: 0.35, color: '#3d6836', size: 6 });
    }
    if (e.pt <= 0) {
      e.burrowed = false;
      e.invul = false;
      fxRings.push({ kind: 'nova', x: e.x, y: e.y, r: 16, maxR: 160, life: 0.4, max: 0.4, col: '#5bff75' });
      burst(e.x, e.y, '#5bff75', 28, 280);
      play('giant3', 0.6, 0.1);
      shake = Math.max(shake, 7);
      for (let i = 0; i < 12; i++) {
        enemyShoot(e, i * Math.PI * 2 / 12, 230, 9, 'green');
      }
      if (Math.hypot(e.x - p.x, e.y - p.y) < 140) {
        hurtPlayer(2, e.x, e.y);
      }
      e.phase = 'chase'; e.pt = 2.0;
    }
  } else if (e.phase === 'spiral') {
    if (e.pt <= 0) {
      e.spinA += 0.42;
      const cnt = enraged ? 8 : 6;
      for (let i = 0; i < cnt; i++) enemyShoot(e, e.spinA + i * Math.PI * 2 / cnt, 225, 8, 'green');
      e.shots--; e.pt = enraged ? 0.18 : 0.24;
      beep(360, 0.1, 'triangle', 0.04, -120);
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.0; }
    }
  } else if (e.phase === 'charge') {
    if (e.pt > 0) { e.ca = e.pt > 0.28 ? Math.atan2(p.y - e.y, p.x - e.x) : e.ca; }
    else {
      e.vx = Math.cos(e.ca) * (enraged ? 840 : 760);
      e.vy = Math.sin(e.ca) * (enraged ? 840 : 760);
      if (Math.random() < 0.4 && puddles.length < 24) {
        puddles.push({ kind: 'acid', x: e.x, y: e.y, r: 36, life: 3.5, max: 3.5, tick: 0.35 });
      }
      if (Math.random() < 0.7) particles.push({ x: e.x + rand(-22, 22), y: e.y, vx: 0, vy: -35, life: 0.45, max: 0.45, color: 'rgba(140,255,100,0.75)', size: 7 });
      if (e.pt < -0.6) { e.phase = 'chase'; e.pt = 1.6; shake = Math.max(shake, 6); }
    }
  } else if (e.phase === 'meteors') {
    if (e.pt <= 0) {
      const cnt = enraged ? 5 : 4;
      for (let i = 0; i < cnt; i++) {
        const mx = clamp(p.x + rand(-180, 180), 90, WORLD.w - 90);
        const my = clamp(p.y + rand(-150, 150), 120, WORLD.h - 60);
        hazards.push({ kind: 'meteor', x: mx, y: my, r: 76, t: 0, dur: 1.2 });
        if (puddles.length < 24) puddles.push({ kind: 'acid', x: mx, y: my, r: 36, life: 3.5, max: 3.5, tick: 0.4 });
      }
      e.phase = 'chase'; e.pt = 2.2;
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const n = enraged ? 5 : 3;
      for (let i = 0; i < n; i++) spawnEnemy(pick(['snake', 'small_worm', 'void_spider']), { x: e.x + rand(-100, 100), y: e.y + rand(-100, 100) }, { noElite: true });
      burst(e.x, e.y - 50, '#7dff6b', 30, 260);
      e.phase = 'chase'; e.pt = 2.4;
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

function bossVoidOverlordAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (!e.phase) { e.phase = 'chase'; e.pt = 2.0; e.cycle = 0; }
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.35 : 1);
    e.vy = uy * e.speed * (enraged ? 1.35 : 1);
    if (e.pt <= 0) {
      e.phase = ['void_orbs', 'void_charge', 'void_rift', 'summon'][e.cycle++ % 4];
      e.pt = e.phase === 'void_charge' ? 0.8 : 0.45;
      e.shots = enraged ? 6 : 4;
      if (e.phase === 'void_charge') { e.ca = Math.atan2(p.y - e.y, p.x - e.x); play('giant1', 0.5, 0.2); }
    }
  } else if (e.phase === 'void_orbs') {
    if (e.pt <= 0) {
      const n = enraged ? 14 : 10;
      for (let i = 0; i < n; i++) enemyShoot(e, (i * Math.PI * 2) / n + (e.shots * 0.2), 195, 8, 'purple');
      beep(520, 0.12, 'sine', 0.04, -200);
      e.shots--; e.pt = 0.38;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.0; }
    }
  } else if (e.phase === 'void_charge') {
    if (e.pt > 0) { e.ca = e.pt > 0.25 ? Math.atan2(p.y - e.y, p.x - e.x) : e.ca; }
    else {
      e.vx = Math.cos(e.ca) * 760; e.vy = Math.sin(e.ca) * 760;
      if (Math.random() < 0.6) particles.push({ x: e.x + rand(-20, 20), y: e.y, vx: 0, vy: -30, life: 0.45, max: 0.45, color: '#b042ff', size: 6 });
      if (e.pt < -0.55) { e.phase = 'chase'; e.pt = 1.8; shake = 8; }
    }
  } else if (e.phase === 'void_rift') {
    if (e.pt <= 0) {
      for (let i = 0; i < (enraged ? 4 : 3); i++) {
        const rx = clamp(p.x + rand(-180, 180), 90, WORLD.w - 90);
        const ry = clamp(p.y + rand(-150, 150), 120, WORLD.h - 60);
        hazards.push({ kind: 'meteor', x: rx, y: ry, r: 68, t: 0, dur: 1.2 });
        fxRings.push({ kind: 'nova', x: rx, y: ry, r: 10, maxR: 70, life: 0.4, max: 0.4, col: '#8b2be2' });
      }
      beep(320, 0.15, 'triangle', 0.05, 180);
      e.phase = 'chase'; e.pt = 2.2;
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const cnt = enraged ? 4 : 2;
      for (let i = 0; i < cnt; i++) spawnEnemy(pick(['void_spider', 'chaos_imp']), { x: e.x + rand(-90, 90), y: e.y + rand(-90, 90) }, { noElite: true });
      burst(e.x, e.y - 40, '#a832e8', 25, 240);
      e.phase = 'chase'; e.pt = 2.5;
    }
  }
}

function bossMagmaColossusAI(e, dt, ux, uy, d) {
  const p = player;
  const enraged = e.hp < e.maxHp / 2;
  e.pt -= dt;
  e.vx = e.vy = 0;
  if (!e.phase) { e.phase = 'chase'; e.pt = 2.0; e.cycle = 0; }
  if (e.phase === 'chase') {
    e.vx = ux * e.speed * (enraged ? 1.3 : 1);
    e.vy = uy * e.speed * (enraged ? 1.3 : 1);
    if (e.pt <= 0) {
      e.phase = ['magma_slam', 'magma_fan', 'meteor_storm', 'summon'][e.cycle++ % 4];
      e.pt = e.phase === 'magma_slam' ? 0.7 : 0.45;
      e.shots = enraged ? 5 : 3;
      if (e.phase === 'magma_slam') { play('giant3', 0.5, 0.15); }
    }
  } else if (e.phase === 'magma_slam') {
    if (e.pt <= 0) {
      shake = Math.max(shake, 12);
      addTrauma(0.4);
      fxRings.push({ kind: 'nova', x: e.x, y: e.y, r: 15, maxR: 150, life: 0.38, max: 0.38, col: '#ff5500' });
      const n = enraged ? 16 : 12;
      for (let i = 0; i < n; i++) enemyShoot(e, (i * Math.PI * 2) / n, 190, 9, 'orange');
      beep(180, 0.25, 'sawtooth', 0.06, -80);
      e.phase = 'chase'; e.pt = 2.0;
    }
  } else if (e.phase === 'magma_fan') {
    if (e.pt <= 0) {
      const base = Math.atan2(p.y - 35 - (e.y - e.r), p.x - e.x);
      for (let i = -3; i <= 3; i++) enemyShoot(e, base + i * 0.18, 240, 8, 'orange');
      beep(290, 0.12, 'square', 0.04, -90);
      e.shots--; e.pt = 0.36;
      if (e.shots <= 0) { e.phase = 'chase'; e.pt = 2.1; }
    }
  } else if (e.phase === 'meteor_storm') {
    if (e.pt <= 0) {
      for (let i = 0; i < (enraged ? 5 : 3); i++) {
        const mx = clamp(p.x + rand(-200, 200), 90, WORLD.w - 90);
        const my = clamp(p.y + rand(-160, 160), 120, WORLD.h - 60);
        hazards.push({ kind: 'meteor', x: mx, y: my, r: 75, t: 0, dur: 1.15 });
        puddles.push({ kind: 'acid', x: mx, y: my, r: 40, life: 3.5, max: 3.5, tick: 0.4 });
      }
      e.phase = 'chase'; e.pt = 2.4;
    }
  } else if (e.phase === 'summon') {
    if (e.pt <= 0) {
      const cnt = enraged ? 4 : 2;
      for (let i = 0; i < cnt; i++) spawnEnemy(pick(['chaos_imp', 'bomber']), { x: e.x + rand(-90, 90), y: e.y + rand(-90, 90) }, { noElite: true });
      burst(e.x, e.y - 40, '#ff4500', 30, 260);
      e.phase = 'chase'; e.pt = 2.5;
    }
  }
}


function twilightLichAI(e, dt, ux, uy, d) {
  const p = player;
  if (e.lichShields === undefined) { e.lichShields = 3; e.lichShieldHits = 0; SFX.bossAwake(); }
  const enraged = e.hp < e.maxHp * 0.5;
  e.pt -= dt;
  const ang = Math.atan2(p.y - e.y, p.x - e.x);
  if (d > 240) { e.vx = ux * e.speed; e.vy = uy * e.speed; }
  else if (d < 150) { e.vx = -ux * e.speed * 0.8; e.vy = -uy * e.speed * 0.8; }
  else { e.vx = -uy * e.speed * 0.9; e.vy = ux * e.speed * 0.9; }
  if (e.pt <= 0) {
    e.pt = enraged ? 1.35 : 1.9;
    const roll = Math.random();
    if (roll < 0.55) {
      const n = enraged ? 5 : 3;
      for (let i = 0; i < n; i++) enemyShoot(e, ang + (i - (n - 1) / 2) * 0.22, 230, 8, 'purple');
    } else if (roll < 0.85) {
      for (let i = 0; i < 8; i++) enemyShoot(e, e.t + (i * Math.PI * 2) / 8, 195, 7, 'yellow');
    } else if (enemies.length < 18) {
      spawnEnemy(pick(['ghost', 'bat']), { x: e.x + rand(-60, 60), y: e.y + rand(-60, 60) }, { noElite: true });
    }
  }
}

function aetherSliderAI(e, dt, ux, uy, d) {
  const p = player;
  if (!e.phase) { e.phase = 'hover'; e.pt = 1.1; SFX.bossAwake(); }
  const enraged = e.hp < e.maxHp * 0.5;
  e.pt -= dt;
  if (e.phase === 'hover') {
    e.vx = ux * e.speed * 0.5; e.vy = uy * e.speed * 0.5;
    const dx = Math.abs(p.x - e.x), dy = Math.abs(p.y - e.y);
    e.ca = dx > dy ? (p.x > e.x ? 0 : Math.PI) : (p.y > e.y ? Math.PI / 2 : -Math.PI / 2);
    if (e.pt <= 0) {
      e.phase = 'charge'; e.pt = enraged ? 0.55 : 0.72;
      SFX.bossAwake();
    }
  } else if (e.phase === 'charge') {
    const spd = enraged ? 480 : 390;
    e.vx = Math.cos(e.ca) * spd; e.vy = Math.sin(e.ca) * spd;
    if (Math.random() < 0.65) particles.push({ x: e.x, y: e.y - 20, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.25, max: 0.25, color: '#62f6ff', size: 4 });
    if (e.pt <= 0) {
      e.phase = 'cooldown'; e.pt = enraged ? 0.65 : 0.95; e.vx = 0; e.vy = 0;
      shake = Math.max(shake, 6); SFX.explode();
      fxRings.push({ kind: 'nova', x: e.x, y: e.y - 16, r: 16, maxR: 135, life: 0.3, max: 0.3, col: '#62f6ff' });
      for (let i = 0; i < (enraged ? 10 : 6); i++) enemyShoot(e, (i * Math.PI * 2) / (enraged ? 10 : 6), 210, 7, 'cyan');
    }
  } else {
    e.vx = 0; e.vy = 0;
    if (e.pt <= 0) { e.phase = 'hover'; e.pt = enraged ? 0.9 : 1.25; }
  }
}
