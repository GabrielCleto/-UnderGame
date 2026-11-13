// =====================================================================
//  RENDERIZAÇÃO
// =====================================================================
function shadow(x, y, rx, ry, a = 0.28) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

const TS15 = 1.5;
function drawTree(t) {
  const c = t.v % 2, r = t.v < 2 ? 0 : 1, tc = r;
  const ox = t.x - 48 * TS15, oy = t.y - 122 * TS15;
  ctx.drawImage(IMG.trunk, tc * 96, 0, 96, 96, ox, oy + 64 * TS15, 96 * TS15, 96 * TS15);
  const p = player;
  const behind = p && p.y < t.y && p.y > oy && Math.abs(p.x - t.x) < 70 && p.y < t.y - 10;
  if (behind) ctx.globalAlpha = 0.5;
  ctx.drawImage(IMG.treetop, c * 96, r * 96, 96, 96, ox, oy, 96 * TS15, 96 * TS15);
  ctx.globalAlpha = 1;
}
function drawRock(o) {
  if (o.stack) { ctx.drawImage(IMG.barrel, 64, 2, 48, 61, o.x - 36, o.y - 80, 72, 92); return; }
  ctx.drawImage(IMG.rock, 0, 0, 32, 32, o.x - 24, o.y - 40, 48, 48);
}
function drawBarrel(b) {
  const sx = b.hurt > 0 ? rand(-2, 2) : 0;
  shadow(b.x, b.y - 4, 17, 6, 0.3);
  if (b.kind === 'lucky') {
    const pulse = 0.35 + 0.25 * Math.sin(time * 8);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,220,50,${pulse})`;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 22, 24, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#4a2c0a'; ctx.fillRect(b.x - 18 + sx, b.y - 40, 36, 36);
    ctx.fillStyle = '#e5a922'; ctx.fillRect(b.x - 16 + sx, b.y - 38, 32, 32);
    ctx.fillStyle = '#ffe566'; ctx.fillRect(b.x - 14 + sx, b.y - 36, 28, 6);
    txt('?', b.x + sx, b.y - 16, 15, '#ffffff');
    return;
  }
  if (b.kind === 'tnt') {
    const pulse = 0.25 + 0.2 * Math.sin(time * 10);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,70,20,${pulse})`;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 22, 24, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.drawImage(IMG.barrel, 2, 10, 28, 38, b.x - 21 + sx, b.y - 52, 42, 57);
    ctx.save();
    ctx.fillStyle = `rgba(220,30,20,${0.38 + pulse * 0.4})`;
    ctx.fillRect(b.x - 16 + sx, b.y - 40, 32, 24);
    ctx.restore();
    txt('TNT', b.x + sx, b.y - 24, 7, '#ffe042');
    return;
  }
  ctx.drawImage(IMG.barrel, 2, 10, 28, 38, b.x - 21 + sx, b.y - 52, 42, 57);
}

function drawShrine(sh) {
  ctx.save();
  const pulse = 0.5 + 0.3 * Math.sin(sh.t * 4);
  ctx.strokeStyle = sh.col;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.55 + pulse * 0.3;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -sh.t * 24;
  ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sh.r, sh.r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = sh.col;
  ctx.globalAlpha = 0.12 + sh.prog * 0.25;
  ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sh.r, sh.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();

  if (sh.prog > 0) {
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, sh.r - 4, (sh.r - 4) * 0.62, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sh.prog);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  shadow(sh.x, sh.y, 18, 7, 0.35);
  const bob = Math.sin(sh.t * 4) * 5;
  if (IMG[sh.icon]) ctx.drawImage(IMG[sh.icon], sh.x - 18, sh.y - 44 + bob, 36, 36);
  txt(sh.name, sh.x, sh.y - 54 + bob, 7, sh.col);
  ctx.restore();
}

function drawHazard(h) {
  if (h.kind === 'fallen_star') {
    const k = clamp(h.t / h.dur, 0, 1);
    ctx.save();
    ctx.fillStyle = "rgba(100,240,255," + (0.15 + k * 0.35) + ")";
    ctx.beginPath(); ctx.ellipse(h.targetX, h.targetY, 32, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(140,250,255," + (0.6 + 0.4 * Math.sin(h.t * 26)) + ")";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(h.targetX, h.targetY, 32 * k, 14 * k, 0, 0, Math.PI * 2); ctx.stroke();

    const sx = h.curX || h.startX, sy = h.curY || h.startY;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(sx, sy, 3, sx, sy, 36);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, '#7ef8ff');
    g.addColorStop(0.7, '#ffd843');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, 36, 0, Math.PI * 2); ctx.fill();
    if (IMG.terraria_star) ctx.drawImage(IMG.terraria_star, sx - 20, sy - 20, 40, 40);
    ctx.restore();
    return;
  }
  const k = clamp(h.t / h.dur, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(255,40,20,${0.12 + k * 0.25})`;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(255,80,40,${0.6 + 0.4 * Math.sin(h.t * 24)})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,120,40,0.35)';
  ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * k, h.r * 0.62 * k, 0, 0, Math.PI * 2); ctx.fill();

  if (k > 0.55) {
    const fall = (1 - (k - 0.55) / 0.45) * 420;
    const mx = h.x + fall * 0.35, my = h.y - fall;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(mx, my, 4, mx, my, 32);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#ff9a2e'); g.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(mx, my, 32, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(e) {
  const d = MON[e.type];
  if (!d) return;
  if (e.burrowed) {
    shadow(e.x, e.y, e.r * 1.3, e.r * 0.65);
    ctx.fillStyle = 'rgba(35, 75, 30, 0.55)';
    ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.2, e.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    return;
  }
  const img = IMG['m_' + d.img] || IMG[d.img];
  if (!img || !img.complete) return;
  const wimg = WHITE['m_' + d.img] || WHITE[d.img] || img;
  const s = e.scale * (e.spawn > 0 ? Math.max(0.05, 1 - e.spawn / 0.7) : 1);
  let row = e.row, col = 0;
  if (['chaos_imp', 'void_spider', 'boss_void_overlord', 'boss_magma_colossus'].includes(e.type)) {
    const isAtk = (e.mode === 'shoot' || e.act < 0.35 || e.phase === 'charge');
    const animFrames = isAtk ? [4, 5] : [0, 1, 2, 3];
    const fps = isAtk ? 8 : (e.type === 'chaos_imp' ? 12 : 6);
    col = animFrames[Math.floor(e.t * fps) % animFrames.length];
    row = 0;
  } else if (['twilight_lich', 'aether_slider', 'carminite_ghast'].includes(e.type)) {
    col = Math.floor(e.t * 8) % 4;
    row = 0;
  } else {
    col = Math.floor(e.t * (e.type === 'bat' || e.type === 'bee' ? 12 : 7)) % 3;
  }
  if (e.type === 'slime' || e.type === 'bomber') col = e.z > 6 ? 2 : e.z > 1 ? 1 : 0;
  if (e.type === 'flower' || e.type === 'hydra_boss') { row = e.mode === 'open' ? 1 + (Math.floor(e.t * 10) % 3) : 0; col = Math.floor(e.t * 5) % 3; }
  const w = d.fw * s, h = d.fh * s;
  const dx = e.x - w / 2, dy = e.y - h + 4 * s - (e.z || 0);

  if (e.spawn > 0) {
    ctx.strokeStyle = `rgba(255,70,70,${0.4 + 0.4 * Math.sin(e.t * 20)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.4, e.r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
  }
  if (d.shadow) shadow(e.x, e.y, e.r * 1.05, e.r * 0.4);

  // Auras distintas para novos inimigos, elites, comandantes e chefões
  const specialAura = e.elite || e.bounty || isBossType(e.type) || ['bomber', 'viper', 'sniper', 'necromancer', 'golem', 'goblin'].includes(e.type);
  if (specialAura) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let auraCol = `rgba(255,200,60,${0.25 + 0.1 * Math.sin(e.t * 8)})`;
    if (e.type === 'leviathan' || e.type === 'viper' || e.type === 'hydra_boss') auraCol = `rgba(100,255,100,${0.24 + 0.1 * Math.sin(e.t * 7)})`;
    else if (e.type === 'bomber') auraCol = `rgba(255,70,25,${0.32 + 0.2 * Math.sin(e.t * 16)})`;
    else if (e.type === 'necromancer' || e.type === 'necro_boss') auraCol = `rgba(195,80,255,${0.28 + 0.12 * Math.sin(e.t * 8)})`;
    else if (e.type === 'sniper' || e.type === 'beholder_boss') auraCol = `rgba(75,225,255,${0.25 + 0.12 * Math.sin(e.t * 9)})`;
    else if (e.type === 'golem') auraCol = `rgba(255,155,55,${0.24 + 0.1 * Math.sin(e.t * 6)})`;
    else if (e.type === 'goblin' || e.bounty) auraCol = `rgba(255,220,40,${0.38 + 0.16 * Math.sin(e.t * 12)})`;
    ctx.fillStyle = auraCol;
    ctx.beginPath(); ctx.ellipse(e.x, e.y - h * 0.45, w * 0.56, h * 0.56, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  if (e.type === 'twilight_lich' && (e.lichShields || 0) > 0) {
    ctx.save();
    for (let i = 0; i < e.lichShields; i++) {
      const sa = e.t * 2.4 + (i * Math.PI * 2) / e.lichShields;
      const shx = e.x + Math.cos(sa) * (e.r + 18);
      const shy = e.y - 35 + Math.sin(sa) * 20;
      ctx.fillStyle = 'rgba(255, 224, 90, 0.88)';
      ctx.strokeStyle = '#6b4200'; ctx.lineWidth = 2;
      ctx.fillRect(shx - 8, shy - 11, 16, 22); ctx.strokeRect(shx - 8, shy - 11, 16, 22);
    }
    ctx.restore();
  }

  // Laser de Mira do Sniper
  if (e.type === 'sniper' && e.mode === 'lock' && e.aimAng !== undefined) {
    ctx.save();
    ctx.strokeStyle = `rgba(255,55,55,${0.45 + 0.4 * Math.sin(e.t * 32)})`;
    ctx.lineWidth = e.act < 0.22 ? 3.5 : 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - e.r * 1.2);
    ctx.lineTo(e.x + Math.cos(e.aimAng) * 620, e.y - e.r * 1.2 + Math.sin(e.aimAng) * 620);
    ctx.stroke();
    ctx.restore();
  }

  if (isBossType(e.type) && e.phase === 'charge' && e.pt > 0) {
    ctx.strokeStyle = `rgba(255,40,40,${0.3 + 0.3 * Math.sin(e.t * 30)})`; ctx.lineWidth = e.r * 1.2;
    ctx.beginPath(); ctx.moveTo(e.x, e.y - 20); ctx.lineTo(e.x + Math.cos(e.ca) * 600, e.y - 20 + Math.sin(e.ca) * 600); ctx.stroke();
  }
  let alpha = 1;
  if (e.type === 'ghost' || e.type === 'necro_boss') alpha = e.faded ? 0.22 : 0.88;
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(e.x, e.y);
  const flipH = ['chaos_imp', 'void_spider', 'boss_void_overlord'].includes(e.type) && (typeof player !== 'undefined' && player && player.x < e.x);
  if (flipH) {
    ctx.scale(-1, 1);
  }
  if (e.hurt > 0) {
    const k = e.hurt / 0.18;
    ctx.scale(1 + k * 0.22, 1 - k * 0.20);
  }
  ctx.translate(-e.x, -e.y);
  ctx.drawImage(img, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
  if (e.hurt > 0) {
    ctx.globalAlpha = alpha * Math.min(1, e.hurt / 0.1);
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
  } else if (e.freezeT > 0) {
    ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (e.poisonT > 0) {
    ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (e.slow > 0) {
    ctx.globalAlpha = 0.32; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, col * d.fw, row * d.fh, d.fw, d.fh, Math.round(dx), Math.round(dy), w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (e.shieldOn) {
    ctx.save();
    ctx.strokeStyle = 'rgba(110,235,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y - h * 0.45, e.r * 1.25, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (e.type === 'goblin') {
    txt('💰 DUENDE', e.x, dy - 12, 7.5, '#ffd23f');
  } else if (e.bounty) {
    txt('🎯 ALVO (' + Math.ceil(e.bountyT) + 's)', e.x, dy - 12, 7.5, '#ff6438');
  }

  if (e.hp < e.maxHp && !isBossType(e.type) && e.spawn <= 0) {
    const bw = Math.max(28, e.r * 2), by = dy - 8;
    ctx.fillStyle = '#1a0d12'; ctx.fillRect(e.x - bw / 2 - 2, by - 2, bw + 4, 8);
    ctx.fillStyle = '#5a1f2a'; ctx.fillRect(e.x - bw / 2, by, bw, 4);
    ctx.fillStyle = e.type === 'goblin' || e.bounty || e.elite ? '#ffc23d' : (e.poisonT > 0 ? '#5dff6b' : '#ff4d5e');
    ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 4);
  }
}

function playerFrame() {
  const p = player;
  const an = p.char.anim;
  const cid = p.char.id;
  if (p.dash) {
    const fr = an.spin;
    const fps = cid === 'manguinha' ? 28 : 16;
    return {
      f: fr[Math.floor(p.dash.t * fps) % fr.length],
      flip: cid === 'manguinha' ? false : p.flip,
      bobY: cid === 'amxral' ? -5 : 0,
      tilt: 0
    };
  }
  if (p.ult) {
    if (cid === 'manguinha') {
      const fr = an.spin;
      return { f: fr[Math.floor(p.ult.t * 24) % fr.length], flip: false, bobY: 0, tilt: 0 };
    }
    const fr = an.attack;
    return { f: fr[Math.floor(p.ult.t * 18) % fr.length], flip: Math.floor(p.ult.t * 5) % 2 === 1, bobY: -3, tilt: 0 };
  }
  if (p.attack) {
    const fr = an.attack;
    const idx = Math.min(fr.length - 1, Math.floor((p.attack.t / p.attack.dur) * fr.length));
    return { f: fr[idx], flip: p.flip, bobY: 0, tilt: 0 };
  }
  if (!p.moving) {
    if (p.dir === 'down' || p.idleT > 1.2) {
      return { f: an.idle[Math.floor(p.animT * 7) % an.idle.length], flip: false, bobY: 0, tilt: 0 };
    }
    if (p.dir === 'up') {
      return { f: an.idleUp[0], flip: cid === 'amxral' ? false : p.flip, bobY: Math.sin(p.animT * 4) * 1, tilt: 0 };
    }
    return { f: an.idleSide[0], flip: p.dir === 'left', bobY: Math.sin(p.animT * 4) * 1, tilt: 0 };
  }
  const spd = clamp((stats.speed * (p.frenzyT > 0 ? 1.25 : 1)) / 220, 0.85, 1.75);
  if (p.dir === 'down') {
    const fps = cid === 'tuiuba' ? 15 : cid === 'manguinha' ? 13 : 11;
    const bob = cid === 'amxral' ? -Math.abs(Math.sin(p.animT * 11 * spd)) * 1.5 : 0;
    return {
      f: an.walkDown[Math.floor(p.animT * fps * spd) % an.walkDown.length],
      flip: cid === 'amxral' ? false : p.flip,
      bobY: bob,
      tilt: 0
    };
  }
  if (p.dir === 'up') {
    const fps = cid === 'manguinha' ? 17 : cid === 'tuiuba' ? 9 : 8;
    const bob = cid === 'amxral' ? -Math.abs(Math.sin(p.animT * 12 * spd)) * 3 : cid === 'tuiuba' ? -Math.abs(Math.sin(p.animT * 12 * spd)) * 2 : 0;
    const tilt = cid === 'manguinha' ? 0 : Math.sin(p.animT * 12 * spd) * 0.026;
    return {
      f: an.walkUp[Math.floor(p.animT * fps * spd) % an.walkUp.length],
      flip: cid === 'manguinha' ? p.flip : false,
      bobY: bob,
      tilt
    };
  }
  const sideFps = cid === 'manguinha' ? 17 : cid === 'amxral' ? 15 : 14;
  return {
    f: an.walkSide[Math.floor(p.animT * sideFps * spd) % an.walkSide.length],
    flip: p.dir === 'left',
    bobY: 0,
    tilt: 0
  };
}

function drawPlayer() {
  const p = player;
  shadow(p.x, p.y, 20, 7, 0.35);
  if (p.frenzyT > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,170,40,${0.45 + 0.25 * Math.sin(time * 14)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 28, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (p.ult) {
    const R = 195 * stats.range;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p.x, p.y - 30, 10, p.x, p.y - 30, R);
    const colGlow = p.char.weaponType === 'orange' ? 'rgba(255,140,20,' : p.char.weaponType === 'star' ? 'rgba(255,220,60,' : SABER_COLORS[saberColorIndex].glow;
    g.addColorStop(0, colGlow + '0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y - 30, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  if (!(p.inv > 0 && !p.dash && !p.ult && Math.floor(p.inv * 15) % 2 === 0)) {
    const { f, flip, bobY, tilt } = playerFrame();
    let sqX = 1, sqY = 1;
    if (p.dash) { sqX = 1.14; sqY = 0.90; }
    else if (p.inv > stats.invTime - 0.14) { sqX = 1.16; sqY = 0.84; }
    drawCharacterFrame(p.char, f, p.x, p.y, flip, p.inv > stats.invTime - 0.12 ? 0.8 : 0, { bobY, tilt, squashX: sqX, squashY: sqY });
  }
  if (p.shields > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < p.shields; i++) {
      const a = time * 3.2 + (i * Math.PI * 2) / p.shields;
      const sx = p.x + Math.cos(a) * 34, sy = p.y - 36 + Math.sin(a) * 20;
      ctx.fillStyle = 'rgba(90,230,255,0.75)';
      ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(90,230,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y - 36, 35, 44, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function drawFireballs() {
  if (!stats.fire) return;
  const p = player, n = stats.fire, R = 80;
  for (let i = 0; i < n; i++) {
    const a = p.fireAng + i * Math.PI * 2 / n;
    const fx = p.x + Math.cos(a) * R, fy = p.y - 35 + Math.sin(a) * R * 0.8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, 22);
    g.addColorStop(0, 'rgba(255,240,150,0.9)'); g.addColorStop(0.5, 'rgba(255,120,30,0.5)'); g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(a + Math.PI / 2);
    ctx.drawImage(IMG.i_S_Fire01, -17, -17, 34, 34);
    ctx.restore();
  }
}

function drawSlash(s) {
  const p = player;
  const k = 1 - s.life / s.max;
  const colorObj = SABER_COLORS[saberColorIndex];
  ctx.save();
  ctx.translate(p.x, p.y - 38);
  ctx.rotate(s.a);
  ctx.globalCompositeOperation = 'lighter';
  const start = -1.35 + k * 0.5, end = start + 2.7 * Math.min(1, k * 2.8);
  const R = s.r;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = [colorObj.glow + '0.45)', colorObj.glow + '0.8)', '#ffffff'][i];
    ctx.lineWidth = [22, 11, 4][i] * (1 - k * 0.6) * (s.big ? 1.3 : 1);
    ctx.beginPath(); ctx.arc(0, 0, R, start, end); ctx.stroke();
  }
  ctx.restore();
}

function drawBullet(b) {
  const cols = { purple: ['#ff9cff', 'rgba(190,60,255,'], green: ['#d6ff8a', 'rgba(80,200,40,'], orange: ['#fff0a0', 'rgba(255,120,20,'] }[b.color];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.r * 2.2);
  g.addColorStop(0, cols[1] + '0.9)'); g.addColorStop(1, cols[1] + '0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#2a0f2f'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(b.x - b.r * 0.5, b.y - b.r * 0.5, b.r * 0.5, b.r * 0.5);
}

function drawShot(s) {
  ctx.save();
  const colObj = SABER_COLORS[saberColorIndex];
  if (s.kind === 'orange') {
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s.r * 1.6);
    g.addColorStop(0, 'rgba(255, 230, 140, 0.9)');
    g.addColorStop(0.5, 'rgba(255, 130, 20, 0.5)');
    g.addColorStop(1, 'rgba(255, 90, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, s.r * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const sz = s.r * 2.1;
    if (IMG.orange_ball) ctx.drawImage(IMG.orange_ball, -sz / 2, -sz / 2, sz, sz);
    else { ctx.fillStyle = '#ff7b00'; ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI * 2); ctx.fill(); }
  } else if (s.kind === 'star') {
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s.r * 1.8);
    g.addColorStop(0, 'rgba(255, 255, 210, 0.95)');
    g.addColorStop(0.45, 'rgba(255, 205, 30, 0.6)');
    g.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, s.r * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if (IMG.terraria_star) {
      const sz = s.r * 2.2;
      ctx.drawImage(IMG.terraria_star, -sz / 2, -sz / 2, sz, sz);
    } else {
      ctx.drawImage(IMG.i_S_Light04, -s.r, -s.r, s.r * 2, s.r * 2);
    }
  } else if (s.kind === 'axe') {
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(180,230,255,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 1.5); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(IMG.i_S_Axe03, -18, -18, 36, 36);
  } else if (s.kind === 'wave') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(s.x, s.y); ctx.rotate(s.ang);
    const a = Math.min(1, s.life * 3);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = [colObj.glow + `${0.5 * a})`, colObj.glow + `${0.8 * a})`, `rgba(255,255,255,${a})`][i];
      ctx.lineWidth = [14, 7, 3][i];
      ctx.beginPath(); ctx.arc(-s.r * 0.6, 0, s.r, -1.1, 1.1); ctx.stroke();
    }
  } else if (s.kind === 'dagger') {
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.drawImage(IMG.i_S_Dagger03, -16, -16, 32, 32);
  } else {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 2.4);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, colObj.glow + '0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBolt(b) {
  const [x1, y1, x2, y2] = b.pts;
  const segs = 8;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? `rgba(255,255,255,${b.life * 4})` : `rgba(255,230,80,${b.life * 3})`;
    ctx.lineWidth = pass ? 2 : 7;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      ctx.lineTo(x1 + (x2 - x1) * t + rand(-14, 14), y1 + (y2 - y1) * t + rand(-14, 14));
    }
    ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.restore();
}

const PICK_ICON = {
  coin: 'i_I_GoldCoin', gem: 'i_I_Sapphire', ruby: 'i_I_Ruby', potion: 'i_P_Red01', chest: 'i_I_Chest01',
  magnet_orb: 'i_I_Diamond', frenzy_orb: 'i_P_Red02', ice_bomb: 'i_S_Ice01', star: 'terraria_star'
};
const PICK_SIZE = { coin: 20, gem: 16, ruby: 24, potion: 28, chest: 48, magnet_orb: 30, frenzy_orb: 30, ice_bomb: 30, star: 28 };
function drawPickup(k) {
  if (k.t > 24 && Math.floor(k.t * 8) % 2 === 0) return;
  const sz = PICK_SIZE[k.kind] || 24;
  shadow(k.x, k.y, sz * 0.35, sz * 0.14, 0.3);
  const bob = k.kind === 'chest' ? 0 : Math.sin(k.t * 5 + k.x) * 2.5;
  const y = k.y - sz * 0.5 - k.z + bob;
  if (k.kind === 'coin') {
    const w = Math.max(0.15, Math.abs(Math.cos(k.t * 6 + k.x)));
    ctx.drawImage(IMG.i_I_GoldCoin, k.x - sz * w / 2, y - sz / 2, sz * w, sz);
  } else {
    if (k.kind === 'chest' || k.kind === 'magnet_orb' || k.kind === 'frenzy_orb' || k.kind === 'ice_bomb') {
      const gcol = k.kind === 'chest' ? '255,210,60' : k.kind === 'magnet_orb' ? '80,225,255' : k.kind === 'frenzy_orb' ? '255,100,40' : '150,240,255';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(${gcol},${0.25 + 0.15 * Math.sin(time * 7)})`;
      ctx.beginPath(); ctx.arc(k.x, y, k.kind === 'chest' ? 44 : 24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const ic = IMG[PICK_ICON[k.kind]];
    if (ic) ctx.drawImage(ic, k.x - sz / 2, y - sz / 2, sz, sz);
  }
}


// =====================================================================
//  ATMOSFERA & PARTÍCULAS AMBIENTAIS (High Production Polish)
// =====================================================================
let ambientDust = [];
function updateAmbientAtmosphere(dt) {
  if (ambientDust.length < 35) {
    ambientDust.push({
      x: rand(0, WORLD.w), y: rand(0, WORLD.h),
      vx: rand(-12, 12), vy: rand(-18, -6),
      size: rand(1.5, 3.2),
      alpha: rand(0.2, 0.65),
      col: waveEvent === 'bloodmoon' ? '#ff4d60' : (waveEvent === 'void_eclipse' ? '#c06bff' : '#d2f2ff'),
      t: rand(0, 10)
    });
  }
  for (const p of ambientDust) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.t += dt;
    if (p.y < 0) { p.y = WORLD.h; p.x = rand(0, WORLD.w); }
    if (p.x < 0) p.x = WORLD.w;
    if (p.x > WORLD.w) p.x = 0;
  }
}

function drawAmbientAtmosphere() {
  const z = (cam && cam.zoom) || getCamZoom();
  const halfW = (W / 2) / z, halfH = (H / 2) / z;
  const viewL = cam.x - halfW - 40, viewR = cam.x + halfW + 40;
  const viewT = cam.y - halfH - 40, viewB = cam.y + halfH + 40;

  ctx.save();
  for (const p of ambientDust) {
    if (p.x < viewL || p.x > viewR || p.y < viewT || p.y > viewB) continue;
    const a = p.alpha * (0.6 + 0.4 * Math.sin(p.t * 3));
    ctx.fillStyle = p.col;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWorld() {
  const sqTrauma = trauma * trauma;
  const shakeOffset = sqTrauma * 7;
  const sx = shakeOffset > 0.05 ? Math.sin(time * 38) * shakeOffset : (shake ? rand(-shake, shake) * 0.35 : 0);
  const sy = shakeOffset > 0.05 ? Math.cos(time * 32) * shakeOffset * 0.7 : (shake ? rand(-shake, shake) * 0.35 : 0);
  const z = (cam && cam.zoom) || getCamZoom();
  ctx.save();
  ctx.translate(Math.round(W / 2 + sx), Math.round(H / 2 + sy));
  ctx.scale(z, z);
  ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
  ctx.fillStyle = '#1d4220';
  ctx.fillRect(-2000, -2000, WORLD.w + 4000, WORLD.h + 4000);
  ctx.drawImage(ground, 0, 0);

  // Poças cítricas (Tuiuba), Vórtice Abissal & Ácido Tóxico
  for (const pd of puddles) {
    ctx.save();
    if (pd.kind === 'vortex') {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(pd.x, pd.y, 4, pd.x, pd.y, pd.r);
      g.addColorStop(0, 'rgba(30, 5, 55, 0.9)');
      g.addColorStop(0.5, 'rgba(165, 65, 255, 0.55)');
      g.addColorStop(1, 'rgba(90, 20, 180, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(220, 140, 255, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r * (0.4 + 0.3 * Math.sin(time * 8)), pd.r * 0.38, time * 4, 0, Math.PI * 2); ctx.stroke();
    } else if (pd.kind === 'acid') {
      ctx.globalAlpha = Math.min(0.6, pd.life * 0.4);
      ctx.fillStyle = '#38d64a';
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9eff7a';
      ctx.beginPath(); ctx.ellipse(pd.x - pd.r * 0.15, pd.y - 2, pd.r * 0.5, pd.r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.globalAlpha = Math.min(0.55, pd.life * 0.4);
      ctx.fillStyle = '#ff8c1a';
      ctx.beginPath(); ctx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.58, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath(); ctx.ellipse(pd.x - pd.r * 0.15, pd.y - 2, pd.r * 0.55, pd.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Santuários Místicos & Avisos de Meteoro
  for (const sh of shrines) drawShrine(sh);
  for (const h of hazards) drawHazard(h);

  if (player && stats.ice) {
    const R = 85 + stats.ice * 20;
    ctx.save();
    ctx.fillStyle = 'rgba(150,220,255,0.13)'; ctx.strokeStyle = 'rgba(200,240,255,0.5)'; ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]); ctx.lineDashOffset = -time * 20;
    ctx.beginPath(); ctx.ellipse(player.x, player.y, R, R * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  for (const k of pickups) drawPickup(k);

  // Rastros Fantasmas de Dash / Frenesi
  for (const g of afterimages) {
    const a = (g.life / g.max) * 0.48;
    drawCharacterFrame(g.char, g.f, g.x, g.y, g.flip, 0.65, { alpha: a, additive: true });
  }

  const halfW = (W / 2) / z, halfH = (H / 2) / z;
  const viewL = cam.x - halfW - 200, viewR = cam.x + halfW + 200, viewT = cam.y - halfH - 100, viewB = cam.y + halfH + 250;
  const vis = o => o.x > viewL && o.x < viewR && o.y > viewT && o.y < viewB;
  const list = [];
  for (const t of trees) if (vis(t)) list.push({ y: t.y, d: () => drawTree(t) });
  for (const r of rocks) if (vis(r)) list.push({ y: r.y, d: () => drawRock(r) });
  for (const b of props) if (vis(b)) list.push({ y: b.y, d: () => drawBarrel(b) });
  for (const e of enemies) if (vis(e)) list.push({ y: e.y, d: () => drawEnemy(e) });
  if (player && state !== 'menu' && state !== 'select_char') list.push({ y: player.y, d: drawPlayer });
  list.sort((a, b) => a.y - b.y);
  for (const o of list) o.d();

  if (player && state !== 'menu' && state !== 'select_char') drawFireballs();
  drawAmbientAtmosphere();
  for (const s of slashes) drawSlash(s);
  for (const s of pshots) drawShot(s);
  for (const b of ebullets) drawBullet(b);
  for (const b of bolts) drawBolt(b);

  // Anéis de Choque, Explosões & Splash Cítrico
  for (const r of fxRings) {
    const k = 1 - r.life / r.max;
    const curR = r.r + (r.maxR - r.r) * k;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, 1 - k);
    if (r.kind === 'orange_splash' && IMG.orange_splash) {
      ctx.drawImage(IMG.orange_splash, r.x - curR, r.y - curR, curR * 2, curR * 2);
    }
    ctx.strokeStyle = r.col;
    ctx.lineWidth = r.kind === 'explosion' ? 8 * (1 - k * 0.5) : 4 * (1 - k * 0.5);
    ctx.beginPath(); ctx.arc(r.x, r.y, curR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  for (const q of particles) {
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    const maxL = t.maxLife || 0.8;
    const progress = clamp(1 - t.life / maxL, 0, 1);
    const pop = progress < 0.18 ? 1 + (progress / 0.18) * 0.38 : 1.38 - ((progress - 0.18) / 0.82) * 0.38;
    ctx.save();
    ctx.globalAlpha = Math.min(1, t.life * 2.4);
    ctx.translate(t.x, t.y);
    ctx.scale(pop, pop);
    txt(t.txt, 0, 0, t.size, t.color);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // --- ILUMINAÇÃO DINÂMICA V.2 (Luz de Tocha, Sombra de Calabouço & Aura de Bosses) ---
  if (player && (state === 'play' || state === 'pause')) {
    const px = (player.x - cam.x) * z + W / 2;
    const py = (player.y - cam.y) * z + H / 2;
    const lightR = Math.max(160, Math.min(W, H) * 0.38) * (1 + 0.04 * Math.sin(time * 6));
    const maxR = Math.max(W, H) * 0.85;

    const g = ctx.createRadialGradient(px, py, lightR * 0.35, px, py, maxR);
    g.addColorStop(0, 'rgba(255, 235, 175, 0.06)');
    g.addColorStop(0.35, 'rgba(0, 0, 0, 0.08)');
    const darkEdge = waveEvent === 'bloodmoon' ? 'rgba(68, 0, 16, 0.68)'
      : waveEvent === 'void_eclipse' ? 'rgba(28, 4, 55, 0.72)'
      : waveEvent === 'magma_surge' ? 'rgba(62, 16, 2, 0.64)'
      : 'rgba(3, 7, 16, 0.60)';
    g.addColorStop(1, darkEdge);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Aura Luminosa de Chefão Ativo
    if (boss && !boss.dead && boss.hp > 0) {
      const bx = (boss.x - cam.x) * z + W / 2;
      const by = (boss.y - cam.y) * z + H / 2;
      const bPulse = 0.22 + 0.1 * Math.sin(time * 7);
      const bR = Math.max(120, boss.r * z * 2.8);
      const bg = ctx.createRadialGradient(bx, by, bR * 0.2, bx, by, bR);
      const bColor = boss.type === 'boss_void_overlord' ? '192, 107, 255'
        : boss.type === 'boss_magma_colossus' ? '255, 110, 40'
        : boss.type === 'necro_boss' ? '180, 85, 255'
        : boss.type === 'hydra_boss' ? '80, 240, 110'
        : '255, 180, 60';
      bg.addColorStop(0, 'rgba(' + bColor + ', ' + bPulse + ')');
      bg.addColorStop(1, 'rgba(' + bColor + ', 0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(bx, by, bR, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,10,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
    if (player && player.hp <= 2 && state === 'play') {
    // Low HP pulsing vignette
    const pulse = 0.12 + 0.08 * Math.sin(time * 8);
    const lowHpG = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.72);
    lowHpG.addColorStop(0, 'rgba(0,0,0,0)');
    lowHpG.addColorStop(1, "rgba(180,0,20," + pulse + ")");
    ctx.fillStyle = lowHpG;
    ctx.fillRect(0, 0, W, H);
  }
  if (player && player.inv > stats.invTime - 0.3 && !player.dash && !player.ult && player.hp < stats.maxHp && state === 'play') {
    ctx.fillStyle = `rgba(255,0,0,${(player.inv - (stats.invTime - 0.3)) * 0.8})`; ctx.fillRect(0, 0, W, H);
  }
}

