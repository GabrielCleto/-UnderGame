// =====================================================================
//  RENDERIZAÇÃO
// =====================================================================
function shadow(x, y, rx, ry, a = 0.28) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

const TS15 = 1.5;
const depthList = [];
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
function drawSoftHalo(x, y, r, rgb, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 2, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBarrel(b) {
  const sx = b.hurt > 0 ? rand(-2, 2) : 0;
  shadow(b.x, b.y - 4, 17, 6, 0.3);
  if (b.kind === 'crystal') {
    const pulse = 0.38 + 0.25 * Math.sin(time * 7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(98,246,255,${pulse})`;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 22, 18, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#0f3848';
    ctx.beginPath(); ctx.moveTo(b.x + sx, b.y - 44); ctx.lineTo(b.x + 12 + sx, b.y - 20); ctx.lineTo(b.x + 7 + sx, b.y); ctx.lineTo(b.x - 7 + sx, b.y); ctx.lineTo(b.x - 12 + sx, b.y - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4fe3ff';
    ctx.beginPath(); ctx.moveTo(b.x + sx, b.y - 40); ctx.lineTo(b.x + 9 + sx, b.y - 20); ctx.lineTo(b.x + 5 + sx, b.y - 3); ctx.lineTo(b.x - 5 + sx, b.y - 3); ctx.lineTo(b.x - 9 + sx, b.y - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d8ffff';
    ctx.fillRect(b.x - 2 + sx, b.y - 32, 4, 14);
    txt('CRISTAL', b.x + sx, b.y - 49, 6.5, '#8ef5ff');
    return;
  }
  if (b.kind === 'totem') {
    const pulse = 0.4 + 0.3 * Math.sin(time * 6);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(200,68,255,${pulse})`;
    ctx.beginPath(); ctx.ellipse(b.x, b.y - 26, 20, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (IMG.void_totem && IMG.void_totem.complete) {
      ctx.drawImage(IMG.void_totem, b.x - 23 + sx, b.y - 46, 46, 46);
    } else {
      ctx.fillStyle = '#261438'; ctx.fillRect(b.x - 12 + sx, b.y - 52, 24, 52);
      ctx.fillStyle = '#6830a8'; ctx.fillRect(b.x - 10 + sx, b.y - 50, 20, 48);
      ctx.fillStyle = '#e08aff'; ctx.fillRect(b.x - 5 + sx, b.y - 42, 10, 10);
    }
    txt('TOTEM', b.x + sx, b.y - 58, 7, '#e08aff');
    return;
  }
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
  if (b.kind === 'pillar') {
    if (IMG.ruin_pillar && IMG.ruin_pillar.complete) {
      ctx.drawImage(IMG.ruin_pillar, b.x - 23 + sx, b.y - 62, 46, 69);
    } else {
      ctx.fillStyle = '#3a3644'; ctx.fillRect(b.x - 14 + sx, b.y - 56, 28, 56);
      ctx.fillStyle = '#655f75'; ctx.fillRect(b.x - 10 + sx, b.y - 52, 20, 48);
    }
    return;
  }
  if (b.kind === 'statue') {
    if (IMG.hero_statue && IMG.hero_statue.complete) {
      ctx.drawImage(IMG.hero_statue, b.x - 24 + sx, b.y - 65, 48, 72);
    } else {
      ctx.fillStyle = '#484452'; ctx.fillRect(b.x - 16 + sx, b.y - 58, 32, 58);
      ctx.fillStyle = '#8c869e'; ctx.fillRect(b.x - 12 + sx, b.y - 54, 24, 50);
    }
    return;
  }
  if (b.kind === 'geode') {
    const pulse = 0.48 + 0.25 * Math.sin(time * 6);
    drawSoftHalo(b.x, b.y - 18, 28, '80,213,255', pulse);
    if (IMG.crystal_geode && IMG.crystal_geode.complete) {
      ctx.drawImage(IMG.crystal_geode, b.x - 23 + sx, b.y - 40, 46, 46);
    } else {
      ctx.fillStyle = '#1a3045'; ctx.beginPath(); ctx.arc(b.x + sx, b.y - 18, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4fe3ff'; ctx.beginPath(); ctx.arc(b.x + sx, b.y - 18, 12, 0, Math.PI * 2); ctx.fill();
    }
    txt('GEODO', b.x + sx, b.y - 44, 6.5, '#62f6ff');
    return;
  }
  if (b.kind === 'shroom') {
    const pulse = 0.38 + 0.22 * Math.sin(time * 4 + (b.glow || 0) * 6);
    drawSoftHalo(b.x, b.y - 12, 20, '186,69,255', pulse);
    if (IMG.magic_mushroom && IMG.magic_mushroom.complete) {
      ctx.drawImage(IMG.magic_mushroom, b.x - 15, b.y - 25, 30, 30);
    } else {
      ctx.fillStyle = '#b83bfa'; ctx.beginPath(); ctx.arc(b.x, b.y - 15, 12, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#eae2f8'; ctx.fillRect(b.x - 3, b.y - 15, 6, 15);
    }
    return;
  }
  if (b.kind === 'noir_lamp') {
    drawSoftHalo(b.x, b.y - 54, 42, '255,244,210', 0.34);
    if (IMG.noir_lamp && IMG.noir_lamp.complete) {
      ctx.drawImage(IMG.noir_lamp, b.x - 18 + sx, b.y - 66, 36, 72);
    } else {
      ctx.fillStyle = '#2c2e38'; ctx.fillRect(b.x - 3 + sx, b.y - 52, 6, 52);
      ctx.fillStyle = '#fff5d6'; ctx.fillRect(b.x - 7 + sx, b.y - 62, 14, 12);
    }
    return;
  }
  if (b.kind === 'blood_obelisk') {
    const pulse = 0.45 + 0.25 * Math.sin(time * 6);
    drawSoftHalo(b.x, b.y - 30, 34, '255,34,68', pulse);
    if (IMG.blood_obelisk && IMG.blood_obelisk.complete) {
      ctx.drawImage(IMG.blood_obelisk, b.x - 24 + sx, b.y - 65, 48, 72);
    } else {
      ctx.fillStyle = '#2c1824'; ctx.fillRect(b.x - 11 + sx, b.y - 58, 22, 58);
      ctx.fillStyle = '#ff2244'; ctx.fillRect(b.x - 3 + sx, b.y - 46, 6, 26);
    }
    txt('OBELISCO', b.x + sx, b.y - 70, 6.5, '#ff4d6d');
    return;
  }
  if (b.kind === 'ice_spire') {
    const pulse = 0.44 + 0.22 * Math.sin(time * 5);
    drawSoftHalo(b.x, b.y - 28, 32, '126,244,255', pulse);
    if (IMG.ice_spire && IMG.ice_spire.complete) {
      ctx.drawImage(IMG.ice_spire, b.x - 24 + sx, b.y - 65, 48, 72);
    } else {
      ctx.fillStyle = '#70d8ff'; ctx.beginPath(); ctx.moveTo(b.x + sx, b.y - 64); ctx.lineTo(b.x + 14 + sx, b.y); ctx.lineTo(b.x - 14 + sx, b.y); ctx.closePath(); ctx.fill();
    }
    txt('GELO', b.x + sx, b.y - 70, 6.5, '#9beeff');
    return;
  }
  if (b.kind === 'solar_monolith') {
    const pulse = 0.5 + 0.25 * Math.sin(time * 8);
    drawSoftHalo(b.x, b.y - 44, 36, '255,174,40', pulse);
    if (IMG.solar_monolith && IMG.solar_monolith.complete) {
      ctx.drawImage(IMG.solar_monolith, b.x - 24 + sx, b.y - 65, 48, 72);
    } else {
      ctx.fillStyle = '#c88c34'; ctx.fillRect(b.x - 10 + sx, b.y - 48, 20, 48);
      ctx.fillStyle = '#ffb82e'; ctx.beginPath(); ctx.arc(b.x + sx, b.y - 52, 10, 0, Math.PI * 2); ctx.fill();
    }
    txt('SOLAR', b.x + sx, b.y - 70, 6.5, '#ffd34d');
    return;
  }
  if (b.kind === 'void_rift') {
    const bob = Math.sin(time * 4 + (b.phase || 0)) * 3;
    const pulse = 0.5 + 0.25 * Math.sin(time * 7 + (b.phase || 0));
    drawSoftHalo(b.x, b.y - 26, 36, '200,68,255', pulse);
    if (IMG.void_rift && IMG.void_rift.complete) {
      ctx.drawImage(IMG.void_rift, b.x - 32, b.y - 54 + bob, 64, 64);
    } else {
      ctx.fillStyle = '#c844ff'; ctx.beginPath(); ctx.ellipse(b.x, b.y - 28 + bob, 10, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(b.x, b.y - 28 + bob, 4, 18, 0, 0, Math.PI * 2); ctx.fill();
    }
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
  if (sh.sprite && IMG[sh.sprite] && IMG[sh.sprite].complete) {
    ctx.drawImage(IMG[sh.sprite], sh.x - 24, sh.y - 44, 48, 48);
    if (IMG[sh.icon]) ctx.drawImage(IMG[sh.icon], sh.x - 11, sh.y - 68 + bob, 22, 22);
    txt(sh.name, sh.x, sh.y - 74 + bob, 7, sh.col);
  } else {
    if (IMG[sh.icon]) ctx.drawImage(IMG[sh.icon], sh.x - 18, sh.y - 44 + bob, 36, 36);
    txt(sh.name, sh.x, sh.y - 54 + bob, 7, sh.col);
  }
  ctx.restore();
}

function drawHazard(h) {
  if (h.kind === 'boss_nova') {
    const k = clamp(h.t / h.dur, 0, 1);
    ctx.save();
    ctx.fillStyle = `rgba(195,60,255,${0.14 + k * 0.28})`;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.65, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(230,130,255,${0.65 + 0.35 * Math.sin(h.t * 28)})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * 0.65, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(220,100,255,0.34)';
    ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r * k, h.r * 0.65 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
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
  if (d.single) {
    col = 0;
    row = 0;
  } else if (['chaos_imp', 'void_spider', 'boss_void_overlord', 'boss_magma_colossus'].includes(e.type)) {
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
  if (e.type === 'slime') col = e.z > 6 ? 2 : e.z > 1 ? 1 : 0;
  if (e.type === 'flower') { row = e.mode === 'open' ? 1 + (Math.floor(e.t * 10) % 3) : 0; col = Math.floor(e.t * 5) % 3; }
  const w = d.fw * s, h = d.fh * s;
  let singleYOff = 0;
  if (d.single) {
    if (d.fly || e.type === 'bomber') singleYOff = Math.sin(e.t * 4.5) * 5;
    else if (e.type !== 'hydra_boss') singleYOff = Math.abs(Math.sin(e.t * 8.5)) * 4;
  }
  const dx = e.x - w / 2, dy = e.y - h + 4 * s - (e.z || 0) - singleYOff;

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

  if (isBossType(e.type) && ((e.phase === 'charge' && e.pt > 0) || (e.type === 'aether_slider' && e.phase === 'hover' && e.pt < 0.55))) {
    ctx.strokeStyle = `rgba(255,40,40,${0.35 + 0.35 * Math.sin(e.t * 30)})`; ctx.lineWidth = e.r * 1.2;
    ctx.beginPath(); ctx.moveTo(e.x, e.y - 20); ctx.lineTo(e.x + Math.cos(e.ca) * 600, e.y - 20 + Math.sin(e.ca) * 600); ctx.stroke();
  }
  let alpha = 1;
  if (e.type === 'ghost' || e.type === 'necro_boss') alpha = e.faded ? 0.22 : 0.88;
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(e.x, e.y);
  const pLeft = typeof player !== 'undefined' && player && player.x < e.x;
  const flipH = e.type === 'goblin'
    ? (typeof player !== 'undefined' && player && player.x > e.x)
    : ((d.single || ['chaos_imp', 'void_spider', 'boss_void_overlord'].includes(e.type)) && pLeft);
  if (flipH) {
    ctx.scale(-1, 1);
  }
  if (d.single) {
    if (e.type === 'bomber') {
      const pSc = 1 + Math.sin(e.t * 14) * 0.08;
      ctx.scale(pSc, pSc);
    } else if (e.type === 'hydra_boss') {
      const hSc = (e.mode === 'open' ? 1.08 : 1.0) + Math.sin(e.t * 4) * 0.05;
      ctx.scale(hSc, hSc);
    } else if (!d.fly) {
      ctx.rotate(Math.sin(e.t * 8.5) * 0.06);
    }
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

  if ((e.type === 'bee' && e.mode === 'aim') || (e.type === 'sniper' && e.mode === 'lock')) {
    txt('!', e.x, e.y - h - 10, 12, '#ffeb3b');
  }
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
  } else if (e.eliteTrait) {
    txt('[' + e.eliteTrait.label.toUpperCase() + ']', e.x, dy - 14, 7.5, e.eliteTrait.col);
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
      flip: p.flip,
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
      return { f: an.idle[Math.floor(p.animT * 7) % an.idle.length], flip: p.flip, bobY: 0, tilt: 0 };
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
      flip: p.flip,
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
      flip: cid === 'amxral' ? false : p.flip,
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
  const p = player, n = stats.fire, R = stats.fire >= 5 ? 92 : 80;
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
  const cols = ({ purple: ['#ff9cff', 'rgba(190,60,255,'], green: ['#d6ff8a', 'rgba(80,200,40,'], orange: ['#fff0a0', 'rgba(255,120,20,'], red: ['#ff8a8a', 'rgba(255,50,50,'], cyan: ['#9ff7ff', 'rgba(60,220,255,'] }[b.color]) || ['#ff9cff', 'rgba(190,60,255,'];
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
  const targetCnt = (typeof GFX_SETTINGS !== 'undefined' && GFX_SETTINGS.quality === 'low') ? 30 : 70;
  if (ambientDust.length > targetCnt) ambientDust.length = targetCnt;
  if (ambientDust.length < targetCnt) {
    const bio = typeof currentBiome !== 'undefined' ? currentBiome : 0;
    let col = bio === 1 ? pick(['#ff7a29', '#ffb347', '#ffe066'])
      : bio === 2 ? pick(['#c06bff', '#8b4dff', '#e09aff'])
      : bio === 3 ? pick(['#7ee8ff', '#a8f0ff', '#58c0ff'])
      : pick(['#d2ff96', '#ffe76b', '#b8ffcf']);
    if (waveEvent === 'bloodmoon') col = '#ff4d60';
    else if (waveEvent === 'void_eclipse') col = '#c06bff';
    else if (waveEvent === 'magma_surge') col = '#ff6a1a';
    else if (waveEvent === 'mega_horde') col = '#62f6ff';

    const vyBase = bio === 1 || waveEvent === 'magma_surge' ? rand(-42, -18) : rand(-18, -6);
    ambientDust.push({
      x: rand(0, WORLD.w), y: rand(0, WORLD.h),
      vx: rand(-14, 14), vy: vyBase,
      size: rand(1.6, 3.6),
      alpha: rand(0.22, 0.68),
      col,
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

function getEventCanvas2DFilter() {
  if (typeof waveEvent === 'undefined' || !waveEvent) return 'none';
  if (waveEvent === 'noir') return 'grayscale(100%) contrast(145%) brightness(0.92)';
  if (waveEvent === 'bloodmoon') return 'sepia(55%) hue-rotate(-52deg) saturate(225%) contrast(118%) brightness(0.84)';
  if (waveEvent === 'void_eclipse') return 'hue-rotate(235deg) saturate(190%) contrast(125%) brightness(0.82)';
  if (waveEvent === 'glacial') return 'sepia(45%) hue-rotate(155deg) saturate(185%) contrast(112%) brightness(1.08)';
  if (waveEvent === 'solar' || waveEvent === 'magma_surge') return 'sepia(72%) hue-rotate(-14deg) saturate(240%) contrast(124%) brightness(1.10)';
  if (waveEvent === 'psychedelic') return `hue-rotate(${Math.floor((time * 95) % 360)}deg) saturate(240%) contrast(120%)`;
  return 'none';
}

function drawEventCinematicOverlay2D(isWebGL = false) {
  if (typeof waveEvent === 'undefined' || !waveEvent) return;
  const z = (typeof getActiveCamZoom === 'function') ? getActiveCamZoom() : ((cam && cam.zoom) || getCamZoom());
  const cx = cam ? cam.x : WORLD.w / 2;
  const cy = cam ? cam.y : WORLD.h / 2;

  ctx.save();
  try {
    if (waveEvent === 'noir') {
      // 1. Acentos Vermelhos Sin City: olhos brilhantes & respingo carmesim em inimigos
      if (typeof enemies !== 'undefined') {
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead || e.burrowed) continue;
          const sx = (e.x - cx) * z + W / 2;
          const sy = (e.y - cy) * z + H / 2;
          if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
          const eyeY = sy - e.r * 0.9 * z;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(255, 22, 38, 0.85)';
          ctx.beginPath(); ctx.arc(sx - 4 * z, eyeY, 2.4 * z, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx + 4 * z, eyeY, 2.4 * z, 0, Math.PI * 2); ctx.fill();
          if (e.hit > 0) {
            ctx.fillStyle = 'rgba(220, 15, 30, 0.55)';
            ctx.beginPath(); ctx.arc(sx, sy - e.r * 0.4 * z, Math.max(8, e.r * 0.8 * z), 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      }
      // 2. Luz suave dos postes Noir
      if (typeof props !== 'undefined') {
        for (let i = 0; i < props.length; i++) {
          const b = props[i];
          if (b.kind !== 'noir_lamp') continue;
          const lx = (b.x - cx) * z + W / 2;
          const ly = (b.y - 54 - cy) * z + H / 2;
          if (lx < -120 || lx > W + 120 || ly < -120 || ly > H + 120) continue;
          const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, 86 * z);
          lg.addColorStop(0, 'rgba(255, 250, 235, 0.22)');
          lg.addColorStop(0.5, 'rgba(220, 225, 235, 0.08)');
          lg.addColorStop(1, 'rgba(220, 225, 235, 0)');
          ctx.fillStyle = lg;
          ctx.beginPath(); ctx.arc(lx, ly, 86 * z, 0, Math.PI * 2); ctx.fill();
        }
      }
      // 3. Chuva Noir inclinada + respingos
      ctx.strokeStyle = 'rgba(235, 240, 250, 0.24)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let i = 0; i < 130; i++) {
        const rx = ((i * 97.3 + time * 190) % (W + 120)) - 60;
        const ry = ((i * 53.7 + time * 720) % (H + 60)) - 30;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 18);
      }
      ctx.stroke();
      // Respingos no chão
      ctx.strokeStyle = 'rgba(220, 230, 245, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const tSplash = (time * 3 + i * 0.37) % 1;
        if (tSplash < 0.45) {
          const spx = ((i * 211.7 + Math.floor(time * 3 + i * 0.37) * 89) % W);
          const spy = ((i * 157.3 + Math.floor(time * 3 + i * 0.37) * 67) % H);
          ctx.beginPath();
          ctx.ellipse(spx, spy, 3 + tSplash * 14, 1.5 + tSplash * 6, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      // 4. Riscos de película analógica + leve flicker
      if (Math.sin(time * 19) > 0.2) {
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        for (let i = 0; i < 3; i++) {
          const fx = ((Math.sin(Math.floor(time * 12) * 43 + i * 71) * 0.5 + 0.5) * W);
          ctx.fillRect(fx, 0, 1, H);
        }
      }
      // Holofote dramático Noir sobre o jogador
      if (player) {
        const px = (player.x - cx) * z + W / 2;
        const py = (player.y - 22 - cy) * z + H / 2;
        const sg = ctx.createRadialGradient(px, py, Math.min(W, H) * 0.16, px, py, Math.max(W, H) * 0.65);
        sg.addColorStop(0, 'rgba(0,0,0,0)');
        sg.addColorStop(1, 'rgba(0,0,0,0.48)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
      }
      // 5. Barras Cinemascope sutis (14px)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.86)';
      ctx.fillRect(0, 0, W, 14);
      ctx.fillRect(0, H - 14, W, 14);
    } else if (waveEvent === 'bloodmoon') {
      // Lua de Sangue Gigante no canto superior direito
      const mx = W * 0.83, my = H * 0.22;
      const pulse = 1 + 0.05 * Math.sin(time * 4);
      const mg = ctx.createRadialGradient(mx, my, 12, mx, my, 115 * pulse);
      mg.addColorStop(0, 'rgba(255, 65, 85, 0.55)');
      mg.addColorStop(0.45, 'rgba(200, 10, 35, 0.26)');
      mg.addColorStop(1, 'rgba(120, 0, 20, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, 115 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(225, 25, 50, 0.42)';
      ctx.beginPath(); ctx.arc(mx, my, 36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(130, 5, 22, 0.48)';
      ctx.beginPath(); ctx.arc(mx - 8, my - 6, 22, 0, Math.PI * 2); ctx.fill();
      // Brasas e cinzas vermelhas
      ctx.fillStyle = 'rgba(255, 75, 95, 0.55)';
      for (let i = 0; i < 45; i++) {
        const ax = ((i * 83.1 + Math.sin(time * 1.4 + i) * 28) % W + W) % W;
        const ay = ((i * 49.7 + time * 95) % H);
        ctx.fillRect(ax, ay, 2.5, 2.5);
      }
      if (Math.sin(time * 7.3) > 0.96) {
        ctx.fillStyle = 'rgba(255, 30, 55, 0.14)';
        ctx.fillRect(0, 0, W, H);
      }
    } else if (waveEvent === 'void_eclipse') {
      // Anel de Eclipse Sombrio + Estrelas Cósmicas + Arcos Violeta
      const ex = W * 0.5, ey = H * 0.19;
      const eg = ctx.createRadialGradient(ex, ey, 28, ex, ey, 110);
      eg.addColorStop(0, 'rgba(186, 69, 255, 0)');
      eg.addColorStop(0.45, 'rgba(186, 69, 255, 0.34)');
      eg.addColorStop(1, 'rgba(70, 10, 140, 0)');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(ex, ey, 110, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(215, 135, 255, 0.65)';
      for (let i = 0; i < 48; i++) {
        const sx2 = ((i * 113.7 + Math.sin(time * 0.8 + i) * 20) % W + W) % W;
        const sy2 = ((i * 71.3 - time * 35) % H + H) % H;
        const sz2 = 1.5 + (i % 3);
        ctx.fillRect(sx2, sy2, sz2, sz2);
      }
      // Arcos elétricos roxos nas bordas
      ctx.strokeStyle = 'rgba(205, 100, 255, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const bx = i < 2 ? 6 : W - 6;
        const by = (i % 2 === 0) ? H * 0.28 : H * 0.72;
        ctx.beginPath();
        ctx.moveTo(bx, by - 45);
        ctx.lineTo(bx + Math.sin(time * 24 + i) * 18, by);
        ctx.lineTo(bx, by + 45);
        ctx.stroke();
      }
    } else if (waveEvent === 'glacial') {
      // Nevasca em 2 camadas + Borda de Gelo Cristalina
      for (let layer = 0; layer < 2; layer++) {
        const cnt = layer === 0 ? 90 : 60;
        const spdY = layer === 0 ? 130 : 210;
        const spdX = layer === 0 ? 55 : 95;
        ctx.fillStyle = layer === 0 ? 'rgba(220, 245, 255, 0.52)' : 'rgba(255, 255, 255, 0.82)';
        for (let i = 0; i < cnt; i++) {
          const nx = ((i * 73.1 + time * spdX + Math.sin(time * 2 + i) * 16) % (W + 40) + (W + 40)) % (W + 40) - 20;
          const ny = ((i * 41.9 + time * spdY) % (H + 40)) - 20;
          const rad = layer === 0 ? 2 : 3.2;
          ctx.beginPath(); ctx.arc(nx, ny, rad, 0, Math.PI * 2); ctx.fill();
        }
      }
      const fg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.36, W / 2, H / 2, Math.max(W, H) * 0.74);
      fg.addColorStop(0, 'rgba(180, 240, 255, 0)');
      fg.addColorStop(1, 'rgba(190, 242, 255, 0.36)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    } else if (waveEvent === 'solar' || waveEvent === 'magma_surge') {
      // Raios Solares Diagonais (God Rays) + Brasas Incandescentes Subindo
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const sgTop = ctx.createLinearGradient(0, 0, 0, H * 0.35);
      sgTop.addColorStop(0, 'rgba(255, 195, 70, 0.28)');
      sgTop.addColorStop(1, 'rgba(255, 140, 20, 0)');
      ctx.fillStyle = sgTop;
      ctx.fillRect(0, 0, W, H * 0.35);
      for (let i = 0; i < 4; i++) {
        const rx = W * (0.18 + i * 0.22) + Math.sin(time * 0.7 + i) * 28;
        ctx.fillStyle = 'rgba(255, 210, 95, 0.09)';
        ctx.beginPath();
        ctx.moveTo(rx - 35, 0); ctx.lineTo(rx + 45, 0);
        ctx.lineTo(rx - 140, H); ctx.lineTo(rx - 260, H);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 205, 80, 0.68)';
      for (let i = 0; i < 40; i++) {
        const ex = ((i * 91.7 + Math.sin(time * 2.5 + i) * 22) % W + W) % W;
        const ey = ((H - ((i * 57.3 + time * 125) % H)));
        ctx.fillRect(ex, ey, 3, 3);
      }
      ctx.restore();
    } else if (waveEvent === 'psychedelic') {
      // Borda Prismática Rotativa + Partículas Multicoloridas
      const hue = Math.floor((time * 120) % 360);
      const pg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.75);
      pg.addColorStop(0, 'rgba(0,0,0,0)');
      pg.addColorStop(1, `hsla(${hue}, 95%, 58%, 0.35)`);
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 42; i++) {
        const ph = (hue + i * 24) % 360;
        const px2 = ((i * 107.3 + Math.sin(time * 2 + i) * 35) % W + W) % W;
        const py2 = ((i * 63.1 + Math.cos(time * 1.7 + i) * 35) % H + H) % H;
        ctx.fillStyle = `hsla(${ph}, 100%, 65%, 0.75)`;
        ctx.beginPath(); ctx.arc(px2, py2, 2.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    }
  } finally {
    ctx.restore();
  }
}

function drawWorld() {
  const sqTrauma = trauma * trauma;
  const shakeOffset = sqTrauma * 7;
  const sx = shakeOffset > 0.05 ? Math.sin(time * 38) * shakeOffset : (shake ? rand(-shake, shake) * 0.35 : 0);
  const sy = shakeOffset > 0.05 ? Math.cos(time * 32) * shakeOffset * 0.7 : (shake ? rand(-shake, shake) * 0.35 : 0);
  const z = (cam && cam.zoom) || getCamZoom();
  ctx.save();
  try {
  ctx.filter = getEventCanvas2DFilter();
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

  const halfW = (W / 2) / z, halfH = (H / 2) / z;
  const viewL = cam.x - halfW - 120, viewR = cam.x + halfW + 120, viewT = cam.y - halfH - 100, viewB = cam.y + halfH + 160;
  const vis = o => o.x > viewL && o.x < viewR && o.y > viewT && o.y < viewB;

  for (let i = 0; i < pickups.length; i++) {
    const k = pickups[i];
    if (vis(k)) drawPickup(k);
  }

  // Rastros Fantasmas de Dash / Frenesi
  for (let i = 0; i < afterimages.length; i++) {
    const g = afterimages[i];
    if (vis(g)) {
      const a = (g.life / g.max) * 0.48;
      drawCharacterFrame(g.char, g.f, g.x, g.y, g.flip, 0.65, { alpha: a, additive: true });
    }
  }

  // Ordenação por profundidade Y sem alocação de closures (Zero-GC)
  depthList.length = 0;
  for (let i = 0; i < trees.length; i++) { const t = trees[i]; if (vis(t)) depthList.push({ y: t.y, type: 1, obj: t }); }
  for (let i = 0; i < rocks.length; i++) { const r = rocks[i]; if (vis(r)) depthList.push({ y: r.y, type: 2, obj: r }); }
  for (let i = 0; i < props.length; i++) { const b = props[i]; if (vis(b)) depthList.push({ y: b.y, type: 3, obj: b }); }
  for (let i = 0; i < enemies.length; i++) { const e = enemies[i]; if (vis(e)) depthList.push({ y: e.y, type: 4, obj: e }); }
  if (player && state !== 'menu' && state !== 'select_char') depthList.push({ y: player.y, type: 5, obj: player });
  depthList.sort((a, b) => a.y - b.y);

  for (let i = 0; i < depthList.length; i++) {
    const item = depthList[i];
    if (item.type === 4) drawEnemy(item.obj);
    else if (item.type === 1) drawTree(item.obj);
    else if (item.type === 2) drawRock(item.obj);
    else if (item.type === 3) drawBarrel(item.obj);
    else if (item.type === 5) drawPlayer();
  }

  if (player && state !== 'menu' && state !== 'select_char') drawFireballs();
  drawAmbientAtmosphere();
  for (let i = 0; i < slashes.length; i++) drawSlash(slashes[i]);
  for (let i = 0; i < pshots.length; i++) { const s = pshots[i]; if (vis(s)) drawShot(s); }
  for (let i = 0; i < ebullets.length; i++) { const b = ebullets[i]; if (vis(b)) drawBullet(b); }
  for (let i = 0; i < bolts.length; i++) drawBolt(bolts[i]);

  // Anéis de Choque, Explosões & Splash Cítrico (com culling)
  for (let i = 0; i < fxRings.length; i++) {
    const r = fxRings[i];
    if (!vis(r)) continue;
    const k = r.max > 0 ? clamp(1 - r.life / r.max, 0, 1) : 1;
    const curR = Math.max(0.5, r.r + (r.maxR - r.r) * k);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.max(0, 1 - k);
    if (r.kind === 'orange_splash' && IMG.orange_splash) {
      ctx.drawImage(IMG.orange_splash, r.x - curR, r.y - curR, curR * 2, curR * 2);
    }
    ctx.strokeStyle = r.col || '#fff';
    ctx.lineWidth = Math.max(0.5, r.kind === 'explosion' ? 8 * (1 - k * 0.5) : 4 * (1 - k * 0.5));
    ctx.beginPath(); ctx.arc(r.x, r.y, curR, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Partículas com culling de viewport
  for (let i = 0; i < particles.length; i++) {
    const q = particles[i];
    if (q.x < viewL || q.x > viewR || q.y < viewT || q.y > viewB) continue;
    ctx.globalAlpha = Math.max(0, q.life / q.max);
    ctx.fillStyle = q.color;
    ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
  }
  ctx.globalAlpha = 1;

  // Textos de combate com culling de viewport
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    if (t.x < viewL || t.x > viewR || t.y < viewT || t.y > viewB) continue;
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
  } finally { ctx.filter = 'none'; ctx.restore(); }

  // --- ILUMINAÇÃO DINÂMICA V.2 (Luz de Tocha, Sombra de Calabouço & Aura de Bosses) ---
  if (player && (state === 'play' || state === 'pause')) {
    const px = (player.x - cam.x) * z + W / 2;
    const py = (player.y - cam.y) * z + H / 2;
    const lightR = Math.max(160, Math.min(W, H) * 0.38) * (1 + 0.04 * Math.sin(time * 6));
    const maxR = Math.max(W, H) * 0.85;

    const g = ctx.createRadialGradient(px, py, lightR * 0.35, px, py, maxR);
    g.addColorStop(0, 'rgba(255, 235, 175, 0.06)');
    g.addColorStop(0.35, 'rgba(0, 0, 0, 0.08)');
    const bTheme = BIOMES[currentBiome] || BIOMES[0];
    if (bTheme.tint) { ctx.fillStyle = bTheme.tint; ctx.fillRect(0, 0, W, H); }
    const darkEdge = waveEvent === 'bloodmoon' ? 'rgba(68, 0, 16, 0.68)'
      : waveEvent === 'void_eclipse' ? 'rgba(28, 4, 55, 0.72)'
      : waveEvent === 'magma_surge' ? 'rgba(62, 16, 2, 0.64)'
      : waveEvent === 'noir' ? 'rgba(10, 10, 14, 0.78)'
      : waveEvent === 'glacial' ? 'rgba(15, 45, 75, 0.68)'
      : waveEvent === 'solar' ? 'rgba(85, 35, 5, 0.66)'
      : waveEvent === 'psychedelic' ? 'rgba(42, 8, 56, 0.56)'
      : bTheme.edge;
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
  drawEventCinematicOverlay2D(false);
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

