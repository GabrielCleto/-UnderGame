// =====================================================================
//  UPDATE
// =====================================================================
const _splashQueryBuf = [];
function update(dt) {
  time += dt; playTime += dt;
  const p = player;

  // ---------- ONDAS & EVENTOS ----------
  if (toSpawn === 0 && enemies.length === 0) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      if (wave >= 3 && wave % 3 === 0 && shopVisitedWave !== wave && state === 'play') {
        shopVisitedWave = wave;
        openShop();
        waveTimer = 1.2;
        return;
      }
      if (typeof applyEventMapMutation === 'function') {
        try { applyEventMapMutation(null); } catch (_) {}
      }
      if (typeof stopEventMusic === 'function') {
        try { stopEventMusic(); } catch (_) {}
      }
      wave++;
      waveEvent = null;
      p._megaMagnetDropped = false;
      p.midWaveCataclysmT = rand(14, 24);
      const nextBiome = Math.floor((wave - 1) / 5) % BIOMES.length;
      if (wave > 1 && nextBiome !== currentBiome) {
        currentBiome = nextBiome;
        SFX.shrine();
        if (SFX.portal) SFX.portal();
        if (typeof GPU_FX !== 'undefined') GPU_FX.shockwave(p.x, p.y - 24, 340, 0.045, 0.5);
        texts.push({ x: p.x, y: p.y - 130, txt: '🌀 PORTAL: ' + BIOMES[currentBiome].name + '!', life: 2.6, color: '#62f6ff', size: 15 });
      }
      const isBoss = wave % 5 === 0;
      toSpawn = isBoss ? 15 + Math.floor(wave * 2.5) : 16 + Math.floor(wave * 4.8);
      if (!isBoss) toSpawn = Math.round(toSpawn * (1 + ((DIFFICULTY_MODES[difficultyIdx] || DIFFICULTY_MODES[0]).spawnMul - 1) * 0.5));
      spawnTimer = 0.25;
      if (!isBoss && wave >= 2) {
        // ROTAÇÃO ALEATÓRIA DURANTE AS ONDAS (~65% de chance de evento na onda)
        const roll = Math.random();
        if (roll < 0.65) {
          const possibleEvents = [];
          // Eventos Megalomaníacos
          possibleEvents.push('noir');
          if (wave >= 2) possibleEvents.push('glacial');
          if (wave >= 3) possibleEvents.push('bloodmoon', 'psychedelic');
          if (wave >= 4) possibleEvents.push('solar', 'void_eclipse');
          // Variações de Horda
          if (wave >= 2) possibleEvents.push('swarm');
          if (wave >= 3) possibleEvents.push('mega_horde', 'golden', 'ambush');
          if (wave >= 4) possibleEvents.push('bounty');
          if (wave >= 5) possibleEvents.push('magma_surge');

          waveEvent = pick(possibleEvents);
        }

        if (waveEvent === 'solar' || waveEvent === 'meteors') meteorTimer = 1.1;
        if (waveEvent === 'mega_horde') toSpawn = Math.round(toSpawn * 1.85);
        else if (waveEvent === 'swarm') toSpawn = Math.round(toSpawn * 1.35);

        // Aplica Mutações de Mapa & Shaders dos Eventos Megalomaníacos
        if (typeof applyEventMapMutation === 'function') {
          try { applyEventMapMutation(waveEvent); } catch (_) {}
        }
        // Ativa Trilha Sonora Procedural do Evento
        if (typeof playEventMusic === 'function') {
          if (['noir', 'bloodmoon', 'void_eclipse', 'glacial', 'solar', 'psychedelic', 'magma_surge'].includes(waveEvent)) {
            playEventMusic(waveEvent);
          } else if (typeof stopEventMusic === 'function') {
            stopEventMusic();
          }
        }
      }
      if (stats.nukeNext) {
        stats.nukeNext = false;
        toSpawn = Math.floor(toSpawn * 0.4);
        texts.push({ x: p.x, y: p.y - 140, txt: 'PERGAMINHO ATIVADO!', life: 2, color: '#ffd23f', size: 14 });
      }
      if (isBoss) {
        const bossCycle = ['boss', 'leviathan', 'twilight_lich', 'boss_void_overlord', 'aether_slider', 'boss_magma_colossus', 'necro_boss', 'hydra_boss', 'beholder_boss'];
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
        if (typeof playBossMusic === 'function') playBossMusic();
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
        const evSub = waveEvent === 'noir' ? '🎷 CIDADE NOIR: PRETO & BRANCO + JAZZ CLÁSSICO!'
          : waveEvent === 'glacial' ? '❄ ERA GLACIAL: CONGELAMENTO ABSOLUTO & ESPÍCULAS DE GELO!'
          : waveEvent === 'solar' ? '☀️ APOCALIPSE SOLAR: CALOR EXTREMO & METEOROS INCANDESCENTES!'
          : waveEvent === 'psychedelic' ? '🌀 FEBRE SURREAL: DIMENSÃO ARCO-ÍRIS & FUNK CÓSMICO!'
          : waveEvent === 'meteors' ? '☄ EVENTO: CHUVA DE METEOROS!'
          : waveEvent === 'golden' ? '✦ EVENTO: INVASÃO DOURADA!'
          : waveEvent === 'mega_horde' ? '🌊 MARÉ ABISSAL: ENXAME MASSIVO + 2x XP & ÍMÃ!'
          : waveEvent === 'swarm' ? '⚡ EVENTO: ENXAME FRENÉTICO!'
          : waveEvent === 'bloodmoon' ? '🩸 LUA DE SANGUE: INIMIGOS FEROZES + DOBRO DE RECOMPENSAS!'
          : waveEvent === 'ambush' ? '⚔ CERCO RELÂMPAGO: QUEBRE O CÍRCULO INIMIGO!'
          : waveEvent === 'bounty' ? '🎯 CAÇADA AO COMANDANTE: DERROTE O ALVO P/ +1 NÍVEL!'
          : waveEvent === 'void_eclipse' ? '⚡ ECLIPSE DO VAZIO: TEMPESTADE CÓSMICA & FENDAS ASTRAIS!'
          : waveEvent === 'magma_surge' ? '🌋 SURTO DE MAGMA: O CHÃO É LAVA & GIGANTES DE FOGO!'
          : (wave === 1 ? 'Sobreviva!' : 'Prepare-se!');
        banner = { txt: 'ONDA ' + wave, sub: evSub, life: 2.8, max: 2.8, boss: waveEvent === 'meteors' || waveEvent === 'bloodmoon' || waveEvent === 'solar' };
        SFX.wave();
      }
      if (wave > 1) p.hp = Math.min(stats.maxHp, p.hp + 1);
      if (wave >= 2 && (wave % 2 === 0 || shrines.length === 0)) spawnShrine();
      refillBarrels(15);
      if (wave >= 1) {
        const crystalsNow = props.filter(pr => pr.kind === 'crystal').length;
        for (let c = crystalsNow; c < 3; c++) {
          const cx = clamp(p.x + rand(-380, 380), 90, WORLD.w - 90);
          const cy = clamp(p.y + rand(-300, 300), 120, WORLD.h - 60);
          if (!blocked(cx, cy, 28)) props.push({ kind: 'crystal', x: cx, y: cy, r: 16, hp: 2, hurt: 0 });
        }
      }
      if (wave >= 4) {
        const totemsNow = props.filter(pr => pr.kind === 'totem').length;
        if (totemsNow < 2) {
          const tx = clamp(p.x + rand(-340, 340), 90, WORLD.w - 90);
          const ty = clamp(p.y + rand(-280, 280), 120, WORLD.h - 60);
          if (!blocked(tx, ty, 30)) props.push({ kind: 'totem', x: tx, y: ty, r: 18, hp: 3 + Math.floor(wave / 4), hurt: 0, healT: 2.0 });
        }
      }
      waveTimer = 2.4;
    }
  }
  if (toSpawn > 0) {
    spawnTimer -= dt;
    const maxCap = typeof getGfxBudget === 'function' ? getGfxBudget().maxEnemies : 220;
    const cap = Math.min(maxCap, (waveEvent === 'mega_horde' ? 180 : waveEvent === 'swarm' ? 130 : 85) + wave * 8);
    if (spawnTimer <= 0 && enemies.length < cap) {
      const groupSize = waveEvent === 'mega_horde'
        ? randi(4, 7)
        : (wave >= 2 && (waveEvent === 'swarm' || Math.random() < 0.48)) ? randi(3, 6) : randi(1, 2);
      const kind = wavePool();
      if (groupSize > 1 && kind !== 'flower' && kind !== 'bigworm' && kind !== 'golem' && kind !== 'necromancer') {
        const c = spawnPos(Math.max(W, H) * 0.52, Math.max(W, H) * 0.68, 30);
        for (let i = 0; i < groupSize && toSpawn > 0; i++) { spawnEnemy(kind, { x: c.x + rand(-45, 45), y: c.y + rand(-45, 45) }); toSpawn--; }
      } else { spawnEnemy(kind); toSpawn--; }
      const baseRate = Math.max(0.08, 0.54 - wave * 0.042);
      spawnTimer = waveEvent === 'mega_horde' ? baseRate * 0.42 : (waveEvent === 'swarm' ? baseRate * 0.6 : baseRate);
      if (waveEvent === 'mega_horde' && !p._megaMagnetDropped && toSpawn <= 14) {
        p._megaMagnetDropped = true;
        dropItem('magnet_orb', clamp(p.x + rand(-180, 180), 80, WORLD.w - 80), clamp(p.y + rand(-140, 140), 100, WORLD.h - 60));
        texts.push({ x: p.x, y: p.y - 110, txt: '🧲 ORBE DE ÍMÃ SURGIU NA MARÉ!', life: 1.6, color: '#62f6ff', size: 11 });
      }
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

  // ---------- CATACLISMO SÚBITO (Evento Megalomaníaco no Meio da Onda) ----------
  if (wave >= 2 && (wave % 5 !== 0) && !waveEvent && (toSpawn > 0 || enemies.length > 5)) {
    p.midWaveCataclysmT = (p.midWaveCataclysmT || rand(14, 22)) - dt;
    if (p.midWaveCataclysmT <= 0) {
      p.midWaveCataclysmT = 9999; // Apenas um cataclismo surpresa por onda
      if (Math.random() < 0.45) {
        const cataclysms = ['noir', 'bloodmoon', 'void_eclipse', 'glacial', 'solar', 'psychedelic'];
        waveEvent = pick(cataclysms);
        if (waveEvent === 'solar') meteorTimer = 1.1;
        if (typeof applyEventMapMutation === 'function') {
          try { applyEventMapMutation(waveEvent); } catch (_) {}
        }
        if (typeof playEventMusic === 'function') {
          playEventMusic(waveEvent);
        }
        if (typeof addTrauma === 'function') addTrauma(0.65);
        shake = Math.max(shake, 16);
        if (SFX.bossRoar) SFX.bossRoar();
        const titles = {
          noir: 'CIDADE NOIR', bloodmoon: 'LUA DE SANGUE',
          void_eclipse: 'ECLIPSE DO VAZIO', glacial: 'ERA GLACIAL',
          solar: 'APOCALIPSE SOLAR', psychedelic: 'FEBRE SURREAL'
        };
        banner = {
          txt: '⚡ CATACLISMO SÚBITO!',
          sub: (titles[waveEvent] || waveEvent.toUpperCase()) + ' ECLODIU NA ARENA!',
          life: 3.4,
          max: 3.4,
          boss: true
        };
      }
    }
  }

  // ---------- CHUVA DE METEOROS (EVENTO DE ONDA OU APOCALIPSE SOLAR) ----------
  if ((waveEvent === 'meteors' || waveEvent === 'solar') && (toSpawn > 0 || enemies.length > 0)) {
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
        shake = Math.max(shake, 6);
        if (typeof addTrauma === 'function') addTrauma(0.35);
        if (typeof GPU_FX !== 'undefined') GPU_FX.shockwave(h.targetX, h.targetY, 210, 0.036, 0.36);
        SFX.explode();
        fxRings.push({ kind: 'nova', x: h.targetX, y: h.targetY, r: 10, maxR: 125, life: 0.35, max: 0.35, col: '#62f6ff' });
        burst(h.targetX, h.targetY, '#ffe042', 25, 240, 'spark');
        burst(h.targetX, h.targetY, '#7bf5ff', 25, 260, 'diamond');
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
      if (h.kind === 'boss_nova') {
        SFX.explode();
        shake = Math.max(shake, 6);
        if (typeof GPU_FX !== 'undefined') GPU_FX.shockwave(h.x, h.y, h.r * 1.8, 0.034, 0.34);
        fxRings.push({ kind: 'nova', x: h.x, y: h.y, r: 12, maxR: h.r, life: 0.34, max: 0.34, col: '#c844ff' });
        burst(h.x, h.y, '#e08aff', 18, 220, 'spark');
        if (Math.hypot(player.x - h.x, player.y - h.y) < h.r) hurtPlayer(2, h.x, h.y, 'Nova Rúnica');
      } else {
        triggerExplosion(h.x, h.y, h.r, 7 + wave, false);
      }
    }
  }
  hazards = hazards.filter(h => !h.dead);

  // ---------- SANTUÁRIOS MÍSTICOS ----------
  for (const sh of shrines) {
    sh.t += dt;
    const inside = Math.hypot(p.x - sh.x, p.y - sh.y) < sh.r + 14;
    if (inside) {
      sh.prog = Math.min(1, sh.prog + dt / 1.65);
      if (Math.random() < 0.5) particles.push({ x: sh.x + rand(-sh.r, sh.r), y: sh.y + rand(-20, 15), vx: 0, vy: -55, life: 0.45, max: 0.45, color: sh.col, size: 4, kind: 'diamond', add: true });
      if (sh.prog >= 1) {
        sh.dead = true;
        SFX.shrine();
        shake = Math.max(shake, 10);
        if (typeof addTrauma === 'function') addTrauma(0.35);
        if (typeof GPU_FX !== 'undefined') { GPU_FX.shockwave(sh.x, sh.y, 280, 0.045, 0.45); GPU_FX.zoomPunch(0.035); }
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
          p.ultMeter = Math.min(100, p.ultMeter + 45 * (stats.furyMul || 1));
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
            shake = Math.max(shake, 7);
            burst(p.x, p.y - 36, '#ff2a55', 24, 240, 'spark');
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

  // ---------- RECONSTRUÇÃO DO SPATIAL GRID O(N) ----------
  if (typeof enemyGrid !== 'undefined') {
    enemyGrid.clear();
    for (let i = 0; i < enemies.length; i++) if (!enemies[i].dead) enemyGrid.insert(enemies[i]);
  }

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

  // Entrada de Mira: Stick Direito (360° twin-stick) tem prioridade,
  // senão Mira de Alta Precisão com o Mouse (se em PC e mouse ativo),
  // senão direção do movimento (se puro teclado ou mobile)
  if (gpState && gpState.hasAim) {
    p.aim = gpState.aimAngle;
  } else if (!touch.active && (mouse.active || mouse.moved || mouse.x > 0 || mouse.y > 0)) {
    const z = typeof getActiveCamZoom === 'function' ? getActiveCamZoom() : ((cam && cam.zoom) || 1);
    const wx = (mouse.x - W / 2) / z + (cam ? cam.x : 0);
    const wy = (mouse.y - H / 2) / z + (cam ? cam.y : 0);
    mouse.wx = wx;
    mouse.wy = wy;
    p.aim = Math.atan2(wy - (p.y - 32), wx - p.x);
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
  if (p.comboT <= 0) { p.combo = 0; p.bestStreakMilestone = 0; p.feverTier = 0; }
  if (p.multiKillT > 0) {
    p.multiKillT -= dt;
    if (p.multiKillT <= 0) p.multiKillCnt = 0;
  }

  if (p.frenzyT > 0 && Math.random() < 0.45) {
    particles.push({ x: p.x + rand(-14, 14), y: p.y - rand(5, 55), vx: rand(-20, 20), vy: -50, life: 0.32, max: 0.32, color: pick(['#ffd23f', '#ff6438', '#ffffff']), size: rand(3, 5), kind: 'diamond', add: true });
  }

  // Ultimate (Teclado E/L/Q, Gatilho/Botão Y/X no Controle, ou Botão Touch ULT) + Action Buffer
  const trigUlt = anyPressed('e', 'l', 'q') || (gpState && gpState.ultJust) || touch.justUlt;
  if (trigUlt) actionBuffer.press('ult', time);
  if (p.ultMeter >= 100 && !p.ult && actionBuffer.consume('ult', time)) {
    p.ult = { t: 0, dur: 2.6, tick: 0 };
    p.ultMeter = 0; p.attack = null; p.dash = null;
    SFX.ult();
    gamepadRumble(0.6, 0.8, 320);
    shake = 8; addTrauma(0.45);
    if (typeof GPU_FX !== 'undefined') {
      GPU_FX.shockwave(p.x, p.y - 30, 360, 0.055, 0.55);
      GPU_FX.zoomPunch(0.055);
      GPU_FX.chroma(0.015);
    }
    banner = { txt: p.char.ultName + '!', life: 1.4, max: 1.4, small: true };
  }

  // Ataque (Teclado Espaço/J, Mouse Clique, Gatilhos RT / RB no Controle, ou Botão Touch ATACAR) + Action Buffer
  const gpAtkHold = gpState ? gpState.attackHold : false;
  const gpAtkJust = gpState ? gpState.attackJust : false;
  const holdAttack = keys[' '] || keys['j'] || mouse.down || gpAtkHold || touch.isAtkDown;
  if (anyPressed(' ', 'j') || mouse.click || gpAtkJust || touch.justAtk) {
    actionBuffer.press('attack', time);
  }
  if (!p.attack && !p.dash && !p.ult && p.attackCd <= 0 && (holdAttack || actionBuffer.consume('attack', time))) {
    actionBuffer.consume('attack', time);
    startAttack(mouse.down || mouse.click, touch.isAtkDown || touch.justAtk);
  }

  // Giro / Esquiva (Teclado Shift/K, Botão Dir do Mouse, Gatilho LT / LB / B no Controle, ou Botão Touch GIRO) + Action Buffer
  const gpDash = gpState ? gpState.dashJust : false;
  if (anyPressed('shift', 'k') || mouse.rclick || gpDash || touch.justDash) {
    actionBuffer.press('dash', time);
  }
  if (!p.dash && !p.ult && p.dashCd <= 0 && actionBuffer.consume('dash', time)) {
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

  const fBonus = typeof getFeverBonus === 'function' ? getFeverBonus(p) : { spdBonus: 0, magBonus: 0 };
  const crisisBoost = p.hp <= 2 ? 1.14 : 1;
  const slowMulP = (p.slow || 0) > 0 ? 0.72 : 1;
  if ((p.slow || 0) > 0) p.slow = Math.max(0, p.slow - dt);
  const inCitrus = p.char.weaponType === 'orange' && puddles.some(pd => !pd.kind && Math.hypot(pd.x - p.x, pd.y - p.y) < pd.r + 16);
  let speed = stats.speed * (1 + fBonus.spdBonus) * (p.frenzyT > 0 ? 1.3 : 1) * crisisBoost * slowMulP * (inCitrus ? 1.24 : 1);
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
          p.ultMeter = Math.min(100, p.ultMeter + 15 * (stats.furyMul || 1));
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
    if (Math.abs(mx) > Math.abs(my) + 0.05) p.dir = mx > 0 ? 'right' : 'left';
    else p.dir = my > 0 ? 'down' : 'up';
    if (!p.attack) {
      if (!touch.active && (mouse.active || mouse.moved || (gpState && gpState.hasAim))) {
        p.flip = Math.cos(p.aim) < 0;
      } else if (Math.abs(mx) > 0.05) {
        p.flip = mx < 0;
      } else if (p.dir === 'left' || p.dir === 'right') {
        p.flip = p.dir === 'left';
      }
    }
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = 0.18;
      if (SFX.footstep) SFX.footstep();
      particles.push({ x: p.x + rand(-8, 8), y: p.y, vx: rand(-20, 20), vy: -10, life: 0.4, max: 0.4, color: 'rgba(200,180,140,0.6)', size: 4 });
    }
  } else {
    p.idleT += dt;
    if (!p.attack && !touch.active && (mouse.active || mouse.moved || (gpState && gpState.hasAim))) {
      p.flip = Math.cos(p.aim) < 0;
    }
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
          if (p.char.weaponType === 'saber') { p.ultMeter = Math.min(100, p.ultMeter + 10 * (stats.furyMul || 1)); p.dashCd = Math.max(0, p.dashCd - 0.35); }
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
      SFX.hit();
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
    const fReachMax = 38 + (isAwakened ? 22 : 16);
    for (let i = 0; i < n; i++) {
      const a = p.fireAng + i * Math.PI * 2 / n;
      const fx = p.x + Math.cos(a) * R, fy = p.y - 35 + Math.sin(a) * R * 0.8;
      if (Math.random() < 0.5) particles.push({ x: fx, y: fy, vx: rand(-20, 20), vy: rand(-50, -10), life: 0.3, max: 0.3, color: pick(['#ffb02e', '#ff5a1f', '#ffe36b']), size: rand(3, 6), kind: 'diamond', add: true });
      const nearF = typeof enemyGrid !== 'undefined' ? enemyGrid.query(fx, fy, fReachMax, _gridQueryBuf) : enemies;
      for (let j = 0; j < nearF.length; j++) {
        const e = nearF[j];
        if (e.dead || e.fireHit > time) continue;
        const reach = e.r + (isAwakened ? 22 : 16);
        const edx = e.x - fx;
        if (edx >= reach || edx <= -reach) continue;
        const edy = e.y - e.r - fy;
        if (edy >= reach || edy <= -reach) continue;
        if (edx * edx + edy * edy < reach * reach) {
          e.fireHit = time + (isAwakened ? 0.35 : 0.45);
          const thermalSynergy = stats.fire >= 5 && stats.ice >= 4;
          if (thermalSynergy) e.slow = Math.max(e.slow, 2.2);
          damageEnemy(e, 1 + Math.floor(stats.fire / 2) + (isAwakened ? 1 : 0) + (thermalSynergy ? 3 : 0), fx, fy, 200, { color: thermalSynergy ? '#c844ff' : '#ff8a2e', noFreeze: true, silent: true });
        }
      }
    }
    // Sinergia: TEMPESTADE SOLAR (Bolas de Fogo disparam Raios em Cadeia)
    if (p.synergies && p.synergies.has('solar_storm') && enemies.length > 0) {
      p.solarBoltT = (p.solarBoltT || 0.85) - dt;
      if (p.solarBoltT <= 0) {
        p.solarBoltT = 0.85;
        const sxF = p.x + Math.cos(p.fireAng) * R, syF = p.y - 35 + Math.sin(p.fireAng) * R * 0.8;
        const nearB = typeof enemyGrid !== 'undefined' ? enemyGrid.query(sxF, syF, 260, _gridQueryBuf) : enemies;
        let bestE = null, bestD = 260;
        for (let ci = 0; ci < nearB.length; ci++) {
          const ce = nearB[ci];
          if (ce.dead || ce.spawn > 0) continue;
          const cd = Math.hypot(ce.x - sxF, ce.y - syF);
          if (cd < bestD) { bestD = cd; bestE = ce; }
        }
        if (bestE) {
          bolts.push({ pts: [sxF, syF, bestE.x, bestE.y - bestE.r], life: 0.22 });
          damageEnemy(bestE, 3 + stats.dmg + stats.bolt, sxF, syF, 160, { color: '#ffb830', noFreeze: true, silent: true });
          burst(bestE.x, bestE.y - bestE.r, '#ffb830', 6, 180, 'spark');
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
        if (stats.bolt >= 5 && stats.infTime >= 1) target.freezeT = Math.max(target.freezeT || 0, 1.1);
        damageEnemy(target, 2 + Math.floor(stats.bolt / 2) + (isAwakened ? 2 : 0), target.x, target.y - 10, 100, { color: '#fff36b', noFreeze: true, silent: true });
        from = target; target = null; let nd = 210;
        for (const e of enemies) { if (e.dead || hitSet.has(e) || e.spawn > 0 || ((e.type === 'ghost' || e.type === 'necro_boss') && e.faded)) continue; const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < nd) { nd = d; target = e; } }
      }
      if (hitSet.size) { beep(900, 0.12, 'sawtooth', 0.04, -700); }
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
      const isGrav = p.synergies && p.synergies.has('gravity_crush');
      shake = Math.max(shake, 3);
      beep(120, 0.3, 'sawtooth', 0.08, -80);
      if (SFX.rockSlam) SFX.rockSlam();
      if (typeof GPU_FX !== 'undefined') GPU_FX.shockwave(p.x, p.y, isGrav ? eR * 1.6 : eR * 1.15, isGrav ? 0.04 : 0.024, 0.38);
      fxRings.push({ kind: 'nova', x: p.x, y: p.y, r: 20, maxR: eR, life: 0.32, max: 0.32, col: isGrav ? '#ffd23f' : '#d49a62' });
      burst(p.x, p.y, isGrav ? '#ffd23f' : '#99734e', 24, 280, 'spark');
      const pullR = isGrav ? eR * 1.4 : eR + 40;
      const nearEarth = typeof enemyGrid !== 'undefined' ? enemyGrid.query(p.x, p.y, pullR, _gridQueryBuf) : enemies;
      for (let i = 0; i < nearEarth.length; i++) {
        const e = nearEarth[i];
        if (e.dead || e.spawn > 0) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (isGrav && !isBossType(e.type) && d < pullR && d > 28) {
          e.x += ((p.x - e.x) / d) * Math.min(75, d * 0.48);
          e.y += ((p.y - e.y) / d) * Math.min(75, d * 0.48);
        }
        if (d < eR + e.r) {
          damageEnemy(e, (isGrav ? 4 : 2) + stats.earth, p.x, p.y, isGrav ? 260 : 400, { color: isGrav ? '#ffd23f' : '#c79867' });
          e.slow = Math.max(e.slow, 0.9);
        }
      }
      texts.push({ x: p.x, y: p.y - 60, txt: isGrav ? 'COLAPSO!' : 'TREMOR!', life: 0.8, color: isGrav ? '#ffd23f' : '#e0a96d', size: 12 });
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
  for (const pr of props) {
    if (pr.kind === 'totem') {
      pr.healT = (pr.healT || 2.0) - dt;
      if (pr.healT <= 0) {
        pr.healT = 2.6;
        fxRings.push({ kind: 'nova', x: pr.x, y: pr.y - 16, r: 10, maxR: 180, life: 0.35, max: 0.35, col: '#c844ff' });
        for (const e of enemies) {
          if (!e.dead && !isBossType(e.type) && Math.hypot(e.x - pr.x, e.y - pr.y) < 180) {
            e.hp = Math.min(e.maxHp, e.hp + Math.max(2, Math.ceil(e.maxHp * 0.15)));
          }
        }
      }
    }
  }
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
      // Sinergia: VÓRTICE SANGUINÁRIO (Explode em Nova Tóxica ao encerrar)
      if (pd.life <= 0 && p.synergies && p.synergies.has('blood_vortex')) {
        fxRings.push({ kind: 'nova', x: pd.x, y: pd.y, r: 16, maxR: pd.r * 1.45, life: 0.36, max: 0.36, col: '#5dff6b' });
        fxRings.push({ kind: 'nova', x: pd.x, y: pd.y, r: 10, maxR: pd.r * 1.15, life: 0.30, max: 0.30, col: '#c844ff' });
        if (typeof GPU_FX !== 'undefined') GPU_FX.shockwave(pd.x, pd.y, pd.r * 1.8, 0.036, 0.36);
        burst(pd.x, pd.y, '#c844ff', 14, 240, 'spark');
        burst(pd.x, pd.y, '#5dff6b', 12, 220, 'diamond');
        const nearV = typeof enemyGrid !== 'undefined' ? enemyGrid.query(pd.x, pd.y, pd.r * 1.5 + 36, _gridQueryBuf) : enemies;
        for (let ci = 0; ci < nearV.length; ci++) {
          const o = nearV[ci];
          if (!o.dead && Math.hypot(o.x - pd.x, o.y - pd.y) < pd.r * 1.45 + o.r) {
            o.poisonT = Math.max(o.poisonT || 0, 4.0);
            o.poisonDmg = Math.max(o.poisonDmg || 0, 2 + (stats.venom || 1));
            damageEnemy(o, 4 + (stats.venom || 1) * 2, pd.x, pd.y, 260, { color: '#c844ff', noFreeze: true, silent: true, isNova: true });
          }
        }
      }
    } else if (pd.kind === 'acid') {
      if (Math.hypot(p.x - pd.x, p.y - pd.y) < pd.r + 10) {
        hurtPlayer(1, pd.x, pd.y, 'Poça de Ácido');
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

  // Re-indexa SpatialGrid com posições atualizadas para colisões precisas de projéteis
  if (typeof enemyGrid !== 'undefined') {
    enemyGrid.clear();
    for (let i = 0; i < enemies.length; i++) enemyGrid.insert(enemies[i]);
  }

  if (stats.gauntletSnap && enemies.length >= 6) {
    stats.gauntletSnap = false;
    let snapped = 0;
    for (const e of enemies) {
      if (!e.dead && !isBossType(e.type) && snapped++ % 2 === 0) damageEnemy(e, 999, p.x, p.y, 120, { color: '#ffd23f', noFreeze: true });
    }
    fxRings.push({ kind: 'nova', x: p.x, y: p.y - 20, r: 20, maxR: 420, life: 0.5, max: 0.5, col: '#ffd23f' });
  }
  // ---------- PROJÉTEIS & DISPAROS ----------
  for (const b of ebullets) {
    const timeSlow = (stats.infTime && Math.hypot(b.x - p.x, b.y - p.y) < 170) ? Math.max(0.45, 1 - 0.18 * stats.infTime) : 1;
    b.x += b.vx * dt * timeSlow; b.y += b.vy * dt * timeSlow; b.life -= dt;
    if (b.life <= 0 || b.x < 0 || b.y < 0 || b.x > WORLD.w || b.y > WORLD.h) b.dead = true;
    if (!b.dead && Math.hypot(b.x - p.x, b.y - (p.y - 35)) < b.r + 16) { b.dead = true; hurtPlayer(1, b.x, b.y, 'Projétil Inimigo'); }
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
        if (s.age > 0.52 && !s.resetHit) {
          s.resetHit = true; s.hit.clear();
          // Sinergia: LÂMINAS DO INFINITO (Machados invocam 2 adagas fantasma no retorno)
          if (p.synergies && p.synergies.has('infinity_blades') && enemies.length > 0) {
            const nearAx = typeof enemyGrid !== 'undefined' ? enemyGrid.query(s.x, s.y, 460, _gridQueryBuf) : enemies;
            let spawned = 0;
            for (let ci = 0; ci < nearAx.length && spawned < 2; ci++) {
              const tgt = nearAx[ci];
              if (tgt && !tgt.dead && tgt.spawn <= 0) {
                const ang = Math.atan2(tgt.y - s.y, tgt.x - s.x);
                pshots.push({
                  kind: 'dagger', x: s.x, y: s.y, vx: Math.cos(ang) * 480, vy: Math.sin(ang) * 480,
                  r: 10, dmg: stats.dmg + 2, pierce: 1, life: 1.5, target: tgt, hit: new Set(),
                });
                spawned++;
              }
            }
          }
        }
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
        particles.push({ x: s.x, y: s.y, vx: rand(-15, 15), vy: rand(-15, 15), life: 0.25, max: 0.25, color: '#ffe769', size: 3, kind: 'diamond', add: true });
      }
    }
    if (s.kind === 'orange') {
      s.rot += dt * 18;
      if (Math.random() < 0.5) {
        particles.push({ x: s.x, y: s.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, color: pick(['#ff9214', '#ffa834', '#ff7000', '#ffd65c']), size: rand(3, 5), kind: 'spark', add: true });
      }
    }
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0) s.dead = true;
    const hitCand = typeof enemyGrid !== 'undefined' ? enemyGrid.query(s.x, s.y, s.r + 48, _gridQueryBuf) : enemies;
    for (let j = 0; j < hitCand.length; j++) {
      const e = hitCand[j];
      if (s.dead || e.dead || s.hit.has(e)) continue;
      const reach = e.r + s.r;
      const sdx = e.x - s.x;
      if (sdx >= reach || sdx <= -reach) continue;
      const sdy = e.y - e.r - s.y;
      if (sdy >= reach || sdy <= -reach) continue;
      if (sdx * sdx + sdy * sdy < reach * reach) {
        s.hit.add(e);
        if (s.kind === 'orange') {
          SFX.orangePop();
          burst(s.x, s.y, '#ff8a14', 16, 260, 'spark');
          burst(s.x, s.y, '#ffd242', 10, 200, 'diamond');
          fxRings.push({ kind: 'orange_splash', x: s.x, y: s.y, r: 22, maxR: 70 * stats.range, life: 0.28, max: 0.28, col: '#ff8a14' });
          if (puddles.length < 18) puddles.push({ x: s.x, y: e.y, r: 42 * stats.range, life: 2.0, max: 2.0, tick: 0.35 });
          const splashR = 72 * stats.range;
          const splList = typeof enemyGrid !== 'undefined' ? enemyGrid.query(s.x, s.y, splashR + 36, _splashQueryBuf) : enemies;
          for (let k = 0; k < splList.length; k++) {
            const o = splList[k];
            if (!o.dead && o !== e) {
              const odx = o.x - s.x;
              if (odx >= splashR || odx <= -splashR) continue;
              const ody = o.y - s.y;
              if (ody >= splashR || ody <= -splashR) continue;
              if (odx * odx + ody * ody < splashR * splashR) {
                damageEnemy(o, Math.max(1, Math.round(s.dmg * 0.6)), s.x, s.y, 180, { color: '#ff8a14', noFreeze: true, silent: true });
              }
            }
          }
        }
        // Sinergia: ZERO CÓSMICO (Ondas Cósmicas estilhaçam inimigos congelados/lentos)
        if (s.kind === 'wave' && !s.shatterCd && p.synergies && p.synergies.has('cosmic_zero') && (e.slow > 0 || e.freezeT > 0)) {
          s.shatterCd = true;
          fxRings.push({ kind: 'nova', x: e.x, y: e.y - 12, r: 10, maxR: 110, life: 0.28, max: 0.28, col: '#62f6ff' });
          burst(e.x, e.y - e.r, '#9beeff', 12, 240, 'diamond');
          const czList = typeof enemyGrid !== 'undefined' ? enemyGrid.query(e.x, e.y, 125, _splashQueryBuf) : enemies;
          for (let ci = 0; ci < czList.length; ci++) {
            const o = czList[ci];
            if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 110 + o.r) {
              o.freezeT = Math.max(o.freezeT || 0, 1.2);
              damageEnemy(o, 3 + stats.dmg, e.x, e.y, 200, { color: '#62f6ff', noFreeze: true, silent: true, isNova: true });
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
  const dragK = Math.pow(0.95, dt * 60);
  const magBase = stats.magnet + fBonus.magBonus;
  for (const k of pickups) {
    k.t += dt;
    k.vz -= 700 * dt; k.z += k.vz * dt;
    if (k.z < 0) { k.z = 0; k.vz = -k.vz * 0.4; k.vx *= 0.5; k.vy *= 0.5; }
    k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= dragK; k.vy *= dragK;
    const d = Math.hypot(p.x - k.x, p.y - 20 - k.y);
    const mag = k.kind === 'chest' ? 0 : magBase;
    if (k.t > 0.35 && (d < mag || k.pull)) {
      k.pull = true;
      const sp = 360 + k.t * 250;
      k.x += (p.x - k.x) / Math.max(1, d) * sp * dt; k.y += (p.y - 20 - k.y) / Math.max(1, d) * sp * dt;
    }
    if (d < 28 && k.t > 0.22) collect(k);
    if (k.t > 28 && k.kind !== 'chest') k.dead = true;
  }
  pickups = pickups.filter(k => !k.dead);

  // ---------- PARTÍCULAS, ANÉIS, RASTROS & TEXTOS (BUDGET DINÂMICO 60/120/144Hz) ----------
  const dragP = Math.pow(0.92, dt * 60);
  for (let i = 0; i < particles.length; i++) { const q = particles[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= dragP; q.vy *= dragP; q.life -= dt; }
  particles = particles.filter(q => q.life > 0);
  const maxP = typeof getGfxBudget === 'function' ? getGfxBudget().maxParticles : 750;
  if (particles.length > maxP) particles.splice(0, particles.length - maxP);
  for (let i = 0; i < fxRings.length; i++) fxRings[i].life -= dt;
  fxRings = fxRings.filter(r => r.life > 0);
  if (fxRings.length > 24) fxRings.splice(0, fxRings.length - 24);
  for (let i = 0; i < afterimages.length; i++) afterimages[i].life -= dt;
  afterimages = afterimages.filter(g => g.life > 0);
  if (afterimages.length > 16) afterimages.splice(0, afterimages.length - 16);
  for (let i = 0; i < texts.length; i++) { const t = texts[i]; t.y -= 40 * dt; t.life -= dt; }
  texts = texts.filter(t => t.life > 0);
  if (texts.length > 26) texts.splice(0, texts.length - 26);
  for (const s of slashes) s.life -= dt;
  slashes = slashes.filter(s => s.life > 0);
  for (const b of bolts) b.life -= dt;
  bolts = bolts.filter(b => b.life > 0);
  for (const b of props) b.hurt = Math.max(0, b.hurt - dt);
  if (banner) { banner.life -= dt; if (banner.life <= 0) banner = null; }

  if (p.pendingLevels > 0 && !p.ult && state === 'play') openLevelUp();

  // ---------- CÂMERA (camera-systems skill: 1 - exp(-rate*dt) + Look-Ahead + Zoom Tático) ----------
  const targetDynZoom = ((boss && !boss.dead) || enemies.length > 45) ? 0.93 : 1.0;
  cam.zoomDyn = (cam.zoomDyn || 1.0) + (targetDynZoom - (cam.zoomDyn || 1.0)) * (1 - Math.exp(-2.8 * dt));

  const lookDist = p.moving ? 42 : 16;
  const targetLookX = Math.cos(p.aim) * lookDist;
  const targetLookY = Math.sin(p.aim) * lookDist * 0.75;
  const lookRate = 1 - Math.exp(-6.5 * dt);
  cam.lookX = (cam.lookX || 0) + (targetLookX - (cam.lookX || 0)) * lookRate;
  cam.lookY = (cam.lookY || 0) + (targetLookY - (cam.lookY || 0)) * lookRate;

  const camRate = 1 - Math.exp(-9.0 * dt);
  cam.x += (p.x + cam.lookX - cam.x) * camRate;
  cam.y += (p.y - 40 + cam.lookY - cam.y) * camRate;
  clampCam();
  shake = Math.max(0, shake - dt * 65);
  updateAmbientAtmosphere(dt);
}


