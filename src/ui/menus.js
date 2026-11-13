function overlay(alpha = 0.6) { ctx.fillStyle = `rgba(8,5,12,${alpha})`; ctx.fillRect(0, 0, W, H); }

let cardRects = [], levelRerollRect = null, levelBanRect = null;
function drawLevelUp() {
  overlay(0.78);
  const t = performance.now() / 1000;
  const isPortrait = H > W;
  const isCompactH = H <= 540;
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);
  cardRects = [];

  const titleY = Math.round(isPortrait ? 28 : (isCompactH ? 20 : 34) * s);
  txt('✦ BÊNÇÃO ANCESTRAL ✦', W / 2, titleY, Math.round(isPortrait ? 15 : 20 * s), MED.goldLight);
  txt(gamepadInfo.connected ? 'Escolha a dádiva sagrada [D-Pad / A / X, Y, B]' : 'Escolha a dádiva dos deuses para fortalecer seu campeão [1, 2, 3]', W / 2, titleY + Math.round(18 * s), Math.round(7.5 * s), MED.parch);

  const gap = Math.round(16 * s);
  const cw = Math.round(clamp((W - 60 - gap * 2) / 3, 200, 270));
  const ch = Math.round(clamp(H - titleY - Math.round(56 * s), 220, 360));
  const x0 = Math.round(W / 2 - (cw * 3 + gap * 2) / 2);
  const y0 = Math.round(titleY + 30 * s);

  levelChoices.forEach((u, i) => {
    let x, y, curW = cw, curH = ch;
    if (isPortrait) {
      curW = Math.round(Math.min(380, W - 28));
      curH = Math.round(clamp((H - y0 - 24) / 3, 90, 115));
      x = Math.round(W / 2 - curW / 2);
      y = Math.round(y0 + i * (curH + gap / 2));
    } else {
      x = Math.round(x0 + i * (cw + gap));
      y = y0;
    }

    if (mouse.moved) {
      const hov = inRect(mouse.x, mouse.y, { x, y, w: curW, h: curH });
      if (hov) levelSel = i;
    }
    const sel = levelSel === i;
    const lift = sel ? -6 : 0;

    // Cartas Arcanas em Pergaminho com Moldura de Ferro Forjado
    medPanel(x, y + lift, curW, curH, sel ? 'parch' : 'wood');

    if (sel) {
      ctx.strokeStyle = MED.goldLight;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + lift, curW, curH);
    }

    const lvl = ups[u.id] || 0;
    const isLegendary = (lvl >= 4 || u.id === 'reforge');
    const isEpic = (lvl >= 2 || ['vortex', 'berserk', 'venom', 'ricochet'].includes(u.id));
    const isRare = (lvl >= 1);
    const rarityName = isLegendary ? '★ LENDÁRIO ★' : isEpic ? '◆ ÉPICO ◆' : isRare ? '▲ RARO ▲' : '● COMUM ●';
    const rarityCol = isLegendary ? MED.goldLight : isEpic ? '#d465ff' : isRare ? '#4fe3ff' : MED.ironLight;

    if (isPortrait) {
      const iconSz = Math.round(curH - 24);
      const iconImg = IMG['i_' + u.icon];
      if (iconImg) ctx.drawImage(iconImg, x + 12, y + lift + 12, iconSz, iconSz);

      const textX = x + iconSz + 24;
      txt(rarityName, textX, y + lift + 18, 6.5, rarityCol, 'left');
      txt(u.name.toUpperCase(), textX, y + lift + 34, 9, sel ? '#ffffff' : MED.goldLight, 'left');
      txt(lvl ? 'NV ' + toRoman(lvl + 1) : '✦ NOVO ✦', x + curW - 14, y + lift + 20, 7.5, lvl ? MED.parch : MED.leaf, 'right');

      const dLines = wrap(u.desc(lvl), curW - iconSz - 36, 6.8);
      dLines.slice(0, 2).forEach((l, j) => {
        txt(l, textX, y + lift + 50 + j * 12, 6.8, MED.parch, 'left');
      });

      txt(sel ? '✓ ESCOLHER' : '[' + (i + 1) + ']', x + curW - 14, y + lift + curH - 10, 7.5, sel ? MED.goldLight : MED.parchDark, 'right');

    } else {
      txt(rarityName, x + curW / 2, y + lift + Math.round(18 * s), Math.round(7.5 * s), rarityCol);
      txt(lvl ? 'NV ' + toRoman(lvl + 1) : '✦ NOVO ✦', x + curW / 2, y + lift + Math.round(32 * s), Math.round(8 * s), lvl ? (sel ? MED.parchInk : MED.parch) : MED.leaf);

      const iconSz = Math.round(clamp(48 * s, 40, 56));
      const iconX = Math.round(x + curW / 2 - iconSz / 2);
      const iconY = Math.round(y + lift + 38 * s);

      ctx.fillStyle = MED.ink;
      ctx.beginPath();
      ctx.ellipse(iconX + iconSz / 2, iconY + iconSz / 2, iconSz * 0.65, iconSz * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = sel ? MED.gold : MED.iron;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const iconImg = IMG['i_' + u.icon];
      if (iconImg) ctx.drawImage(iconImg, iconX, iconY, iconSz, iconSz);

      const nameLines = wrap(u.name.toUpperCase(), curW - 20, Math.round(9.5 * s));
      const nameY = iconY + iconSz + Math.round(16 * s);
      nameLines.forEach((l, j) => {
        if (sel) {
          inkTxt(l, x + curW / 2, nameY + j * Math.round(13 * s), Math.round(9.5 * s), '#8c2d08');
        } else {
          txt(l, x + curW / 2, nameY + j * Math.round(13 * s), Math.round(9.5 * s), MED.goldLight);
        }
      });

      const divY = nameY + nameLines.length * Math.round(13 * s) + 4;
      ctx.fillStyle = sel ? 'rgba(120, 80, 30, 0.3)' : 'rgba(217, 164, 65, 0.2)';
      ctx.fillRect(x + 16, divY, curW - 32, 1);

      const descY = divY + Math.round(12 * s);
      const dLines = wrap(u.desc(lvl), curW - 24, Math.round(7.2 * s));
      dLines.slice(0, 3).forEach((l, j) => {
        if (sel) {
          inkTxt(l, x + curW / 2, descY + j * Math.round(12 * s), Math.round(7.2 * s), MED.parchInk);
        } else {
          txt(l, x + curW / 2, descY + j * Math.round(12 * s), Math.round(7.2 * s), MED.parch);
        }
      });

      const directBtn = i === 0 ? '[X]' : i === 1 ? '[Y]' : '[B]';
      const promptTxt = gamepadInfo.connected ? (sel ? '✓ ESCOLHER [A]' : directBtn) : (sel ? '✓ ESCOLHER' : '[' + (i + 1) + '] SELECIONAR');
      const footerY = y + lift + curH - Math.round(12 * s);
      txt(promptTxt, x + curW / 2, footerY, Math.round(8 * s), sel ? (sel && !isPortrait ? '#8c2d08' : MED.goldLight) : MED.parchDark);
    }

    cardRects.push({ x, y, w: curW, h: curH, index: i });
  });

  const rCost = getRerollCost();
  const rw = Math.round(230 * s), rh = Math.round(32 * s);
  const rx = Math.round(W / 2 - rw / 2), ry = Math.round(y0 + ch + 14 * s);
  if (ry + rh < H - 8) {
    const rHov = inRect(mouse.x, mouse.y, { x: rx, y: ry, w: rw, h: rh });
    const canReroll = coins >= rCost;
    medPanel(rx, ry, rw, rh, rHov && canReroll ? 'parch' : 'leather');
    const rLabel = rCost === 0 ? '🎲 [R] REROLL GRÁTIS' : '🎲 [R] REROLL (' + rCost + ' OURO)';
    txt(rLabel, rx + rw / 2, ry + Math.round(21 * s), Math.round(8.2 * s), canReroll ? (rHov ? MED.parchInk : MED.goldLight) : '#777');
    levelRerollRect = { x: rx, y: ry, w: rw, h: rh };
    if (bansLeft > 0) {
      const bx = rx + rw + Math.round(12 * s), bw = Math.round(165 * s);
      const bHov = inRect(mouse.x, mouse.y, { x: bx, y: ry, w: bw, h: rh });
      medPanel(bx, ry, bw, rh, bHov ? 'wood' : 'leather');
      txt('🚫 [X] BANIR (' + bansLeft + ')', bx + bw / 2, ry + Math.round(21 * s), Math.round(8 * s), '#ff7a9c');
      levelBanRect = { x: bx, y: ry, w: bw, h: rh };
    } else levelBanRect = null;
  } else {
    levelRerollRect = null; levelBanRect = null;
  }
}

let shopRects = [], shopExitRect = null;
function drawShop() {
  overlay(0.80);
  const isPortrait = H > W;
  const isCompactH = H <= 540;
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);
  shopRects = [];

  const titleY = Math.round(isPortrait ? 26 : 30 * s);
  txt('✦ BAZAR DO MERCADOR ERRANTE ✦', W / 2, titleY, Math.round(isPortrait ? 15 : 19 * s), MED.goldLight);
  txt(gamepadInfo.connected ? 'Troque seu ouro por relíquias ancestrais [D-Pad / A / START]' : 'Troque seu ouro por relíquias e poções mágicas [Clique ou 1-4]', W / 2, titleY + Math.round(18 * s), Math.round(7.5 * s), MED.parch);
  txt('🪙 SEU TESOURO: ' + coins + ' MOEDAS DE OURO', W / 2, titleY + Math.round(34 * s), Math.round(9 * s), MED.gold);

  const y0 = Math.round(titleY + 46 * s);
  const gap = Math.round(12 * s);
  const cw = Math.round(clamp((W - 50 - gap * (SHOP_ITEMS.length - 1)) / SHOP_ITEMS.length, 140, 220));
  const ch = Math.round(clamp(H - y0 - Math.round(68 * s), 200, 260));
  const x0 = Math.round(W / 2 - (cw * SHOP_ITEMS.length + gap * (SHOP_ITEMS.length - 1)) / 2);

  SHOP_ITEMS.forEach((it, i) => {
    const x = Math.round(x0 + i * (cw + gap));
    if (mouse.moved) {
      const hov = inRect(mouse.x, mouse.y, { x, y: y0, w: cw, h: ch });
      if (hov) shopSel = i;
    }
    const sel = shopSel === i;
    const lift = sel ? -5 : 0;
    const canAfford = coins >= it.cost;

    medPanel(x, y0 + lift, cw, ch, sel ? 'parch' : 'wood');
    if (sel) {
      ctx.strokeStyle = MED.goldLight;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y0 + lift, cw, ch);
    }

    const iconSz = Math.round(clamp(42 * s, 36, 48));
    const iconX = Math.round(x + cw / 2 - iconSz / 2);
    const iconY = Math.round(y0 + lift + 16 * s);

    ctx.fillStyle = MED.ink;
    ctx.beginPath();
    ctx.ellipse(iconX + iconSz / 2, iconY + iconSz / 2, iconSz * 0.65, iconSz * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = canAfford ? MED.gold : MED.iron;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const im = IMG['i_' + it.icon];
    if (im) ctx.drawImage(im, iconX, iconY, iconSz, iconSz);

    const nameLines = wrap(it.name.toUpperCase(), cw - 16, Math.round(8.5 * s));
    const nameY = iconY + iconSz + Math.round(14 * s);
    nameLines.forEach((l, j) => {
      if (sel) inkTxt(l, x + cw / 2, nameY + j * Math.round(12 * s), Math.round(8.5 * s), '#8c2d08');
      else txt(l, x + cw / 2, nameY + j * Math.round(12 * s), Math.round(8.5 * s), MED.goldLight);
    });

    const costY = nameY + nameLines.length * Math.round(12 * s) + Math.round(6 * s);
    const costTxt = '🪙 ' + it.cost + ' OURO';
    if (sel) inkTxt(costTxt, x + cw / 2, costY, Math.round(8 * s), canAfford ? '#1a6b22' : MED.blood);
    else txt(costTxt, x + cw / 2, costY, Math.round(8 * s), canAfford ? MED.leaf : '#ff6b6b');

    const descY = costY + Math.round(12 * s);
    const dLines = wrap(it.desc, cw - 20, Math.round(6.8 * s));
    dLines.slice(0, 2).forEach((l, j) => {
      if (sel) inkTxt(l, x + cw / 2, descY + j * Math.round(11 * s), Math.round(6.8 * s), MED.parchInk);
      else txt(l, x + cw / 2, descY + j * Math.round(11 * s), Math.round(6.8 * s), MED.parch);
    });

    const btnPrompt = canAfford ? (sel ? '✓ COMPRAR' : '[ ' + (i + 1) + ' ] COMPRAR') : 'SEM OURO';
    const footerY = y0 + lift + ch - Math.round(12 * s);
    txt(btnPrompt, x + cw / 2, footerY, Math.round(7.5 * s), canAfford ? (sel ? '#8c2d08' : MED.leaf) : MED.parchDark);

    shopRects.push({ x, y: y0, w: cw, h: ch, index: i });
  });

  const bw = Math.round(clamp(360 * s, 260, 420));
  const bh = Math.round(clamp(40 * s, 34, 46));
  const bx = Math.round(W / 2 - bw / 2);
  const by = Math.min(H - Math.round(52 * s), y0 + ch + Math.round(14 * s));
  const bsel = shopSel === SHOP_ITEMS.length;

  medPanel(bx, by, bw, bh, 'leather');
  if (bsel) {
    ctx.strokeStyle = MED.goldLight;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
  }
  txt(gamepadInfo.connected ? '⚔ CONTINUAR BATALHA [START / B / A] ⚔' : '⚔ CONTINUAR BATALHA [ENTER] ⚔', W / 2, by + Math.round(24 * s), Math.round(9.5 * s), bsel ? '#ffffff' : MED.goldLight);
  shopExitRect = { x: bx, y: by, w: bw, h: bh };
}

// =====================================================================
//  MENU DE SELEÇÃO DE PERSONAGENS
// =====================================================================
let charCardRects = [], charPlayRect = null, charBackRect = null;
let charPrevRect = null, charNextRect = null, charTabRects = [];
let charCarouselAngle = 0;
let charCarouselInited = false;
let charCarouselPop = 0;
let charLastTime = 0;

function drawPedestal3D(x, y, rx, ry, h, depth, isSelected, themeColor, now) {
  ctx.save();
  const sc = 0.70 + depth * 0.55;
  const erx = rx * sc, ery = ry * sc, eh = h * sc;

  // 1. Sombra projetada do pedestal no solo do templo
  ctx.fillStyle = 'rgba(6, 4, 3, 0.65)';
  ctx.beginPath();
  ctx.ellipse(x, y + eh + 6, erx * 1.2, ery * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Coluna / Cilindro de pedra entalhada
  const colGrad = ctx.createLinearGradient(x - erx, y, x + erx, y);
  colGrad.addColorStop(0, '#100a07');
  colGrad.addColorStop(0.3, isSelected ? '#2a1a11' : '#1d120c');
  colGrad.addColorStop(0.7, isSelected ? '#3a2418' : '#271910');
  colGrad.addColorStop(1, '#0e0906');
  ctx.fillStyle = colGrad;
  ctx.beginPath();
  ctx.ellipse(x, y + eh, erx, ery, 0, 0, Math.PI);
  ctx.lineTo(x - erx, y);
  ctx.ellipse(x, y, erx, ery, 0, Math.PI, 0, true);
  ctx.lineTo(x + erx, y + eh);
  ctx.closePath();
  ctx.fill();

  // Ranhuras rúnicas verticais na pedra
  ctx.strokeStyle = isSelected ? 'rgba(217, 164, 65, 0.4)' : 'rgba(30, 20, 15, 0.7)';
  ctx.lineWidth = 1;
  [-0.6, -0.25, 0.25, 0.6].forEach(offset => {
    ctx.beginPath();
    ctx.moveTo(x + erx * offset, y + ery * 0.8);
    ctx.lineTo(x + erx * offset, y + eh - ery * 0.3);
    ctx.stroke();
  });

  // Contorno da coluna
  ctx.strokeStyle = MED.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. Topo do Pedestal (Elipse de Pedra Rúnica)
  ctx.fillStyle = isSelected ? '#3a2214' : '#22150e';
  ctx.beginPath();
  ctx.ellipse(x, y, erx, ery, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isSelected ? MED.gold : MED.iron;
  ctx.lineWidth = isSelected ? 2 : 1.2;
  ctx.stroke();

  // 4. Círculo Mágico Rúnico Gravado no Topo
  const tSec = now / 1000;
  ctx.strokeStyle = isSelected ? themeColor : 'rgba(154, 160, 168, 0.35)';
  ctx.lineWidth = isSelected ? 1.8 : 1;
  ctx.beginPath();
  ctx.ellipse(x, y, erx * 0.72, ery * 0.72, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Marcadores dos 4 pontos cardeais rúnicos (estrelas de 4 pontas)
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
    const rot = isSelected ? a + tSec * 0.5 : a;
    const rpx = x + Math.cos(rot) * (erx * 0.72);
    const rpy = y + Math.sin(rot) * (ery * 0.72);
    ctx.fillStyle = isSelected ? MED.goldLight : MED.ironLight;
    ctx.fillRect(rpx - 1.5, rpy - 1.5, 3, 3);
  }

  // 5. Se selecionado, desenha feixe de luz mística e partículas ascendentes
  if (isSelected) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bGrad = ctx.createLinearGradient(x, y, x, y - 120 * sc);
    const auraCol = themeColor === '#ffd23f' ? 'rgba(255, 210, 63,' : (themeColor === '#4fe3ff' ? 'rgba(79, 227, 255,' : 'rgba(255, 122, 41,');
    bGrad.addColorStop(0, auraCol + ' 0.28)');
    bGrad.addColorStop(0.5, auraCol + ' 0.12)');
    bGrad.addColorStop(1, auraCol + ' 0)');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.moveTo(x - erx * 0.85, y);
    ctx.lineTo(x + erx * 0.85, y);
    ctx.lineTo(x + erx * 0.50, y - 120 * sc);
    ctx.lineTo(x - erx * 0.50, y - 120 * sc);
    ctx.closePath();
    ctx.fill();

    // Partículas místicas flutuantes saindo do altar
    for (let p = 0; p < 5; p++) {
      const pSeed = (tSec * 0.7 + p * 1.3) % 1;
      const px = x + Math.sin(tSec * 2 + p * 2.1) * (erx * 0.5);
      const py = y - pSeed * 100 * sc;
      const pAlpha = Math.sin(pSeed * Math.PI) * 0.7;
      ctx.fillStyle = auraCol + ` ${pAlpha})`;
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawCharacterSelect() {
  overlay(0.85);
  const now = performance.now();
  const t = now / 1000;
  const dt = charLastTime ? clamp((now - charLastTime) / 1000, 0, 0.05) : 0.016;
  charLastTime = now;

  const isPortrait = H > W;
  const isCompactH = H <= 540;
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);

  // Inicialização suave da roleta
  if (!charCarouselInited) {
    charCarouselAngle = selectedCharIndex * (Math.PI * 2 / CHARACTERS.length);
    charCarouselInited = true;
  }

  // Interpolação angular fluida da Roleta 3D
  const targetAngle = selectedCharIndex * (Math.PI * 2 / CHARACTERS.length);
  let dAngle = targetAngle - charCarouselAngle;
  while (dAngle < -Math.PI) dAngle += Math.PI * 2;
  while (dAngle > Math.PI) dAngle -= Math.PI * 2;
  charCarouselAngle += dAngle * Math.min(1, dt * 11);

  charCardRects = [];
  charTabRects = [];
  charPrevRect = null;
  charNextRect = null;

  // 1. TÍTULO HEROICO & ILUMINAÇÃO DE SANTUÁRIO
  const titleY = Math.round(isPortrait ? 28 : (isCompactH ? 20 : 34) * s);
  txt('⚔ ESCOLHA SEU CAMPEÃO ⚔', W / 2, titleY, Math.round(isPortrait ? 15 : 19 * s), MED.goldLight);
  const curChTrack = CHARACTERS[selectedCharIndex];
  const isPlayingMusic = activeCharMusic && !activeCharMusic.paused && activeCharId === curChTrack.id;
  const musicSymbol = isPlayingMusic ? (Math.floor(time * 3) % 2 === 0 ? '♫' : '♪') : '♫';
  const trackLabel = curChTrack ? `${musicSymbol} Trilha: ${curChTrack.name}.mp3` : '';
  txt('Gire a roleta ancestral  •  ' + trackLabel, W / 2, titleY + Math.round(18 * s), Math.round(7.5 * s), isPlayingMusic ? MED.goldLight : MED.parch);

  // 2. PARÂMETROS DA ÓRBITA CILÍNDRICA 3D (ROLETA)
  const centerY = isPortrait ? H * 0.28 : (isCompactH ? H * 0.33 : H * 0.34);
  const radiusX = isPortrait ? clamp(W * 0.34, 110, 160) : clamp(W * 0.28, 180, 320);
  const radiusY = radiusX * 0.26;

  // Ordenação Z (profundidade) para desenhar os de trás primeiro
  const renderList = CHARACTERS.map((chData, i) => {
    let relAngle = (i * (Math.PI * 2 / CHARACTERS.length)) - charCarouselAngle;
    while (relAngle < -Math.PI) relAngle += Math.PI * 2;
    while (relAngle > Math.PI) relAngle -= Math.PI * 2;

    const px = W / 2 + Math.sin(relAngle) * radiusX;
    const py = centerY + Math.cos(relAngle) * radiusY;
    const depth = (Math.cos(relAngle) + 1) / 2; // 0 no fundo, 1 na frente
    const isSelected = selectedCharIndex === i;
    const themeColor = chData.weaponType === 'saber' ? '#ffd23f' : (chData.weaponType === 'star' ? '#4fe3ff' : '#ff7a29');

    return { index: i, chData, px, py, depth, isSelected, themeColor };
  });

  renderList.sort((a, b) => a.depth - b.depth);

  // 3. RENDERIZAÇÃO DOS PEDESTAIS E PERSONAGENS NA ROLETA 3D
  renderList.forEach(item => {
    const { index, chData, px, py, depth, isSelected, themeColor } = item;
    const sc = 0.70 + depth * 0.55;
    const alpha = 0.42 + depth * 0.58;

    // Pedestal de Pedra 3D
    drawPedestal3D(px, py, 42 * s, 18 * s, 16 * s, depth, isSelected, themeColor, now);

    // Sprite do Personagem
    const previewWalk = isSelected && (Math.floor(t / 2.2) % 2 === 1);
    const animArr = previewWalk ? chData.anim.walkDown : chData.anim.idle;
    const fr = animArr[Math.floor(t * (previewWalk ? 11 : 7)) % animArr.length];

    ctx.save();
    // Efeito de levitação suave para o herói em foco
    const bob = isSelected ? Math.sin(t * 4) * 3 * s : 0;
    ctx.translate(px, py - 4 * sc + bob);
    ctx.scale(sc, sc);

    // Sombra do personagem sobre o pedestal
    shadow(0, 0, 18, 6, 0.45 * alpha);

    // Desenha o personagem
    drawCharacterFrame(chData, fr, 0, 0, false, 0, { alpha });
    ctx.restore();

    // Nome sob os pedestais secundários (o selecionado tem destaque no pergaminho abaixo)
    if (!isSelected) {
      const nameY = py + Math.round(26 * sc * s);
      const fs = Math.round(7.5 * sc * s);
      txt(chData.name.toUpperCase(), px, nameY, fs, MED.parchDark);
    }

    // Registro de clique no pedestal / personagem lateral para trocar
    const hitW = 90 * sc, hitH = 110 * sc;
    charCardRects.push({
      x: px - hitW / 2,
      y: py - hitH + 20,
      w: hitW,
      h: hitH,
      index
    });
  });

  // 4. BOTÕES LATERAIS DE NAVEGAÇÃO DA ROLETA [ ◀ ] e [ ▶ ]
  const arrowSz = Math.round(clamp(46 * s, 38, 54));
  const arrowY = centerY - arrowSz / 2;
  const leftX = Math.round(clamp(W / 2 - radiusX - arrowSz - 28 * s, 14, W * 0.16));
  const rightX = Math.round(clamp(W / 2 + radiusX + 28 * s, W - arrowSz - 14, W * 0.84 - arrowSz));

  const prevHov = inRect(mouse.x, mouse.y, { x: leftX, y: arrowY, w: arrowSz, h: arrowSz });
  medPanel(leftX, arrowY, arrowSz, arrowSz, prevHov ? 'parch' : 'thin');
  txt('◀', leftX + arrowSz / 2, arrowY + arrowSz / 2 + Math.round(5 * s), Math.round(15 * s), prevHov ? MED.parchInk : MED.goldLight);
  txt(gamepadInfo.connected ? 'LB' : 'A', leftX + arrowSz / 2, arrowY + arrowSz + Math.round(11 * s), Math.round(6.5 * s), MED.parchDark);
  charPrevRect = { x: leftX, y: arrowY, w: arrowSz, h: arrowSz };

  const nextHov = inRect(mouse.x, mouse.y, { x: rightX, y: arrowY, w: arrowSz, h: arrowSz });
  medPanel(rightX, arrowY, arrowSz, arrowSz, nextHov ? 'parch' : 'thin');
  txt('▶', rightX + arrowSz / 2, arrowY + arrowSz / 2 + Math.round(5 * s), Math.round(15 * s), nextHov ? MED.parchInk : MED.goldLight);
  txt(gamepadInfo.connected ? 'RB' : 'D', rightX + arrowSz / 2, arrowY + arrowSz + Math.round(11 * s), Math.round(6.5 * s), MED.parchDark);
  charNextRect = { x: rightX, y: arrowY, w: arrowSz, h: arrowSz };

  // 5. PERGAMINHO DE ATRIBUTOS DO LUTADOR EM FOCO
  const curCh = CHARACTERS[selectedCharIndex];
  const scrollW = Math.round(clamp(isPortrait ? W - 32 : (isCompactH ? 440 * s : 510 * s), 280, 560));
  const scrollH = Math.round(clamp(isPortrait ? H * 0.36 : (isCompactH ? 120 * s : 148 * s), 110, 165));
  const scrollX = Math.round(W / 2 - scrollW / 2);
  const scrollY = Math.round(isPortrait ? centerY + radiusY + 40 : (isCompactH ? centerY + radiusY + 28 : centerY + radiusY + 48));

  medPanel(scrollX, scrollY, scrollW, scrollH, 'parch');

  // Cabeçalho do Lutador no Pergaminho (contraste aperfeiçoado)
  const padS = Math.round(14 * s);
  const titleColor = curCh.weaponType === 'saber' ? '#8c2d08' : (curCh.weaponType === 'star' ? '#18548c' : '#a34200');
  inkTxt('✦ ' + curCh.name.toUpperCase() + ' ✦', scrollX + scrollW / 2, scrollY + Math.round(19 * s), Math.round(12.5 * s), titleColor);
  inkTxt('« ' + curCh.title + ' »', scrollX + scrollW / 2, scrollY + Math.round(31 * s), Math.round(7.5 * s), '#5c3d1e');

  // Linha divisória de tinta
  ctx.fillStyle = 'rgba(120, 80, 30, 0.35)';
  ctx.fillRect(scrollX + padS, scrollY + Math.round(36 * s), scrollW - padS * 2, 1);

  // Ícones de Armas e Habilidades
  const iconSz = Math.round(26 * s);
  const infoY = scrollY + Math.round(44 * s);
  let wIcon = hudImg('i_S_Dagger03');
  if (curCh.weaponType === 'star') wIcon = hudImg('terraria_star') || hudImg('i_S_Light04');
  else if (curCh.weaponType === 'orange') wIcon = hudImg('orange_ball') || hudImg('i_P_Red01');

  if (wIcon) ctx.drawImage(wIcon, scrollX + padS + 4, infoY, iconSz, iconSz);

  inkTxt('GOLPE: ' + curCh.attackName, scrollX + padS + iconSz + 10, infoY + Math.round(10 * s), Math.round(8 * s), MED.parchInk, 'left');
  inkTxt('FÚRIA: ' + curCh.ultName, scrollX + padS + iconSz + 10, infoY + Math.round(22 * s), Math.round(7.5 * s), MED.blood, 'left');

  // Barras de Atributos Rúnicas (Dano, Velocidade, Sobrevivência)
  const statX = Math.round(scrollX + scrollW * 0.52);
  const statW = Math.round(scrollW * 0.40);
  const statH = Math.max(5, Math.round(6 * s));

  // 1. Dano
  inkTxt('DANO', statX, infoY + Math.round(7 * s), Math.round(6.5 * s), '#4a2c16', 'left');
  medBar(statX + 40, infoY + 2, statW - 40, statH, curCh.dmgMod, 1.5, { col: MED.bloodLight, back: '#d2b47e' });

  // 2. Velocidade
  inkTxt('AGIL.', statX, infoY + Math.round(17 * s), Math.round(6.5 * s), '#4a2c16', 'left');
  medBar(statX + 40, infoY + 12, statW - 40, statH, curCh.speedMod, 1.3, { col: MED.gold, back: '#d2b47e' });

  // 3. Defesa
  inkTxt('VIDA', statX, infoY + Math.round(27 * s), Math.round(6.5 * s), '#4a2c16', 'left');
  medBar(statX + 40, infoY + 22, statW - 40, statH, curCh.hpMod, 8, { col: MED.leaf, back: '#d2b47e' });

  // Descrição do Campeão escrita a tinta
  const descY = infoY + Math.round(38 * s);
  const dLines = wrap(curCh.desc, scrollW - padS * 2 - 12, Math.round(7.2 * s));
  dLines.slice(0, 2).forEach((l, j) => {
    inkTxt(l, scrollX + scrollW / 2, descY + j * Math.round(12 * s), Math.round(7.2 * s), MED.parchInk);
  });

  // 6. BOTÕES DO RODAPÉ: [ ← MENU ] e [ ⚔ ENTRAR NA ARENA ⚔ ]
  const btnY = Math.min(H - Math.round(48 * s), scrollY + scrollH + Math.round(14 * s));
  const btnH = Math.round(clamp(40 * s, 34, 46));

  // Botão Voltar ao Menu
  const backW = Math.round(clamp(115 * s, 95, 135));
  const backX = Math.round(scrollX);
  const backHov = inRect(mouse.x, mouse.y, { x: backX, y: btnY, w: backW, h: btnH });
  medPanel(backX, btnY, backW, btnH, backHov ? 'parch' : 'thin');
  txt('← MENU', backX + backW / 2, btnY + btnH / 2 + Math.round(4 * s), Math.round(8.5 * s), backHov ? MED.parchInk : MED.parch);
  txt('[ESC]', backX + backW / 2, btnY + btnH + Math.round(10 * s), Math.round(6 * s), MED.parchDark);
  charBackRect = { x: backX, y: btnY, w: backW, h: btnH };

  // Botão Entrar na Arena
  const playW = Math.round(scrollW - backW - 14 * s);
  const playX = Math.round(backX + backW + 14 * s);
  const playHov = inRect(mouse.x, mouse.y, { x: playX, y: btnY, w: playW, h: btnH });

  medPanel(playX, btnY, playW, btnH, 'leather');
  if (playHov) {
    ctx.strokeStyle = MED.goldLight;
    ctx.lineWidth = 2;
    ctx.strokeRect(playX, btnY, playW, btnH);
  }

  const playText = '⚔ ENTRAR NA ARENA ⚔';
  txt(playText, playX + playW / 2, btnY + btnH / 2 + Math.round(5 * s), Math.round(10.5 * s), playHov ? '#ffffff' : MED.goldLight);
  txt(gamepadInfo.connected ? '[A / RT CONFIRMAR]' : '[ENTER / ESPAÇO]', playX + playW / 2, btnY + btnH + Math.round(10 * s), Math.round(6 * s), MED.gold);
  charPlayRect = { x: playX, y: btnY, w: playW, h: btnH };
}

function selectCharacter(index) {
  selectedCharIndex = index;
  localStorage.setItem('gabriel_char_index', selectedCharIndex);
  SFX.select();
  const cur = CHARACTERS[selectedCharIndex];
  if (cur) playCharacterMusic(cur.id);
}

function startWithSelectedCharacter() {
  stopCharacterMusic();
  reset();
  state = 'play';
  play('unsheathe', 0.5, 0);
  startMusic();
  music.volume = 0.3;
}

// =====================================================================
//  MENU PRINCIPAL
// =====================================================================
let menuPlayRect = null, menuCharRect = null, menuSoulRect = null, menuBestiaryRect = null;
let bestiaryBackRect = null;
function drawBestiary() {
  overlay(0.86);
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);
  txt('📖 BESTIÁRIO DA ARENA ANCESTRAL 📖', W / 2, Math.round(38 * s), Math.round(16 * s), MED.goldLight);
  const entries = Object.entries(MON).filter(([, d]) => d.bossName || !['goblin'].includes(d.img));
  const cols = 4, cw = Math.round(230 * s), ch = Math.round(64 * s), gap = Math.round(12 * s);
  const x0 = Math.round(W / 2 - (cols * cw + (cols - 1) * gap) / 2);
  const y0 = Math.round(66 * s);
  entries.slice(0, 24).forEach(([k, d], i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = x0 + col * (cw + gap), y = y0 + row * (ch + gap);
    const killsCount = bestiaryKills[k] || 0;
    medPanel(x, y, cw, ch, d.isBoss ? 'wood' : 'leather');
    const title = d.bossName ? d.bossName : k.toUpperCase();
    txt(title.slice(0, 18), x + 12, y + Math.round(24 * s), Math.round(7.5 * s), d.isBoss ? '#ffd23f' : (killsCount > 0 ? MED.parch : '#666'), 'left');
    txt('ABATES: ' + killsCount, x + 12, y + Math.round(46 * s), Math.round(7 * s), killsCount > 0 ? '#7aff61' : '#555', 'left');
  });
  const bw = Math.round(200 * s), bh = Math.round(36 * s);
  const bx = Math.round(W / 2 - bw / 2), by = H - Math.round(52 * s);
  const bHov = inRect(mouse.x, mouse.y, { x: bx, y: by, w: bw, h: bh });
  medPanel(bx, by, bw, bh, bHov ? 'parch' : 'wood');
  txt('← VOLTAR [ESC]', bx + bw / 2, by + Math.round(23 * s), Math.round(8.5 * s), bHov ? MED.parchInk : MED.goldLight);
  bestiaryBackRect = { x: bx, y: by, w: bw, h: bh };
}
let soulRects = [], soulBackRect = null;
const SOUL_DEFS = [
  { id: 'vigor', name: 'Vigor Ancestral', max: 3, cost: l => 4 + l * 4, desc: l => '+2 HP inicial por nível (Atual: +' + (l * 2) + ' HP)' },
  { id: 'fury', name: 'Fúria Eterna', max: 3, cost: l => 4 + l * 4, desc: l => '+15% Fúria e +10% Moedas por nível' },
  { id: 'revive', name: 'Segunda Chance', max: 1, cost: () => 12, desc: () => 'Ressuscita 1x por partida com 50% HP e choque' },
];
function buySoulUpgrade(id) {
  const def = SOUL_DEFS.find(d => d.id === id);
  if (!def) return;
  const cur = soulUps[id] || 0;
  if (cur >= def.max) { SFX.shopNo(); return; }
  const c = def.cost(cur);
  if (soulEssences < c) { SFX.shopNo(); return; }
  soulEssences -= c;
  soulUps[id] = cur + 1;
  localStorage.setItem('gabriel_essences', soulEssences);
  localStorage.setItem('gabriel_soul_ups', JSON.stringify(soulUps));
  SFX.bloodRite();
}
function drawSoulShrine() {
  overlay(0.84);
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);
  soulRects = [];
  txt('✦ SANTUÁRIO DAS ALMAS ✦', W / 2, Math.round(44 * s), Math.round(18 * s), '#c844ff');
  txt('Essências Abissais disponíveis: ' + soulEssences + ' (Chefes dropam Essências)', W / 2, Math.round(68 * s), Math.round(8.5 * s), MED.goldLight);

  const cw = Math.round(240 * s), ch = Math.round(210 * s), gap = Math.round(18 * s);
  const x0 = Math.round(W / 2 - (cw * 3 + gap * 2) / 2);
  const y0 = Math.round(H / 2 - ch / 2);
  SOUL_DEFS.forEach((d, i) => {
    const x = x0 + i * (cw + gap), y = y0;
    const cur = soulUps[d.id] || 0;
    const maxed = cur >= d.max;
    const cost = d.cost(cur);
    const hov = inRect(mouse.x, mouse.y, { x, y, w: cw, h: ch });
    medPanel(x, y, cw, ch, hov && !maxed ? 'wood' : 'leather');
    txt(d.name.toUpperCase(), x + cw / 2, y + Math.round(30 * s), Math.round(9.5 * s), MED.goldLight);
    txt('NÍVEL ' + cur + ' / ' + d.max, x + cw / 2, y + Math.round(52 * s), Math.round(8 * s), '#c844ff');
    const lines = wrap(d.desc(cur), cw - 28, Math.round(7.5 * s));
    lines.forEach((l, j) => txt(l, x + cw / 2, y + Math.round(86 * s) + j * Math.round(14 * s), Math.round(7.5 * s), MED.parch));
    const btnTxt = maxed ? '✓ MÁXIMO' : (soulEssences >= cost ? 'DESPERTAR (' + cost + ' ESS.)' : 'FALTA (' + cost + ' ESS.)');
    txt(btnTxt, x + cw / 2, y + ch - Math.round(22 * s), Math.round(8 * s), maxed ? '#7aff61' : (soulEssences >= cost ? '#ffe08a' : '#888'));
    soulRects.push({ x, y, w: cw, h: ch, id: d.id });
  });
  const bw = Math.round(200 * s), bh = Math.round(38 * s);
  const bx = Math.round(W / 2 - bw / 2), by = Math.round(y0 + ch + 26 * s);
  const bHov = inRect(mouse.x, mouse.y, { x: bx, y: by, w: bw, h: bh });
  medPanel(bx, by, bw, bh, bHov ? 'parch' : 'wood');
  txt('← VOLTAR [ESC]', bx + bw / 2, by + Math.round(24 * s), Math.round(8.5 * s), bHov ? MED.parchInk : MED.goldLight);
  soulBackRect = { x: bx, y: by, w: bw, h: bh };
}
function drawMenu() {
  overlay(0.72);
  const now = performance.now();
  const t = now / 1000;
  const isCompactH = H <= 540;
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);
  const gp = gamepadInfo.connected;
  const curChar = CHARACTERS[selectedCharIndex];
  const themeColor = curChar.weaponType === 'saber' ? '#ffd23f' : (curChar.weaponType === 'star' ? '#4fe3ff' : '#ff7a29');

  // Limpa textos flutuantes remanescentes
  if (texts.length > 0) texts = [];

  // Motes de brasas místicas flutuando no ambiente
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const px = ((Math.sin(i * 127.1 + t * 0.3) * 0.5 + 0.5) * W);
    const py = ((i * 41.3 - t * 18) % H + H) % H;
    const sz = 1.5 + (i % 3);
    const alpha = 0.2 + 0.25 * Math.sin(t * 3 + i);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 210, 63, ' + alpha + ')' : 'rgba(255, 120, 40, ' + alpha + ')';
    ctx.fillRect(px, py, sz, sz);
  }
  ctx.restore();

  // 1. TÍTULO MEDIEVAL MAJESTOSO (Placa de Carvalho & Ferro)
  const titleY = Math.round(isCompactH ? 22 : 36 * s);
  const bannerW = Math.round(clamp(480 * s, 320, 560));
  const bannerH = Math.round(clamp(62 * s, 46, 74));
  const bannerX = Math.round(W / 2 - bannerW / 2);

  medPanel(bannerX, titleY - Math.round(16 * s), bannerW, bannerH, 'wood');
  txt('⚔ UNDERGROUND II ⚔', W / 2, titleY + Math.round(8 * s), Math.round(clamp(19 * s, 15, 25)), MED.goldLight);
  txt('« CRÔNICAS DA ARENA ANCESTRAL »', W / 2, titleY + Math.round(27 * s), Math.round(clamp(7.2 * s, 6.2, 8.5)), MED.parch);

  // 2. PEDESTAL RÚNICO DO HERÓI NO CENTRO
  const charY = Math.round(isCompactH ? H * 0.36 : H * 0.37);
  drawPedestal3D(W / 2, charY, 44 * s, 18 * s, 16 * s, 0.95, true, themeColor, now);

  // Sprite do herói com suave levitação
  const fr = curChar.anim.idle;
  const bob = Math.sin(t * 4) * 3 * s;
  ctx.save();
  ctx.translate(W / 2, charY - 4 * s + bob);
  ctx.scale(1.2 * s, 1.2 * s);
  shadow(0, 0, 20, 7, 0.45);
  drawCharacterFrame(curChar, fr[Math.floor(t * 7) % fr.length], 0, 0, false);
  ctx.restore();

  // 3. PLACA DE BRASÃO DO CAMPEÃO (Abaixo do Pedestal)
  const badgeW = Math.round(clamp(390 * s, 270, 460));
  const badgeH = Math.round(clamp(52 * s, 44, 60));
  const badgeX = Math.round(W / 2 - badgeW / 2);
  const badgeY = Math.round(charY + 30 * s);

  medPanel(badgeX, badgeY, badgeW, badgeH, 'parch');
  const weaponLabel = curChar.weaponType === 'orange' ? 'Laranjas Místicas' : (curChar.weaponType === 'star' ? 'Estrelas Cadentes' : 'Sabre de Luz');
  inkTxt('✦ ' + curChar.name.toUpperCase() + ' ✦  « ' + curChar.title + ' »', W / 2, badgeY + Math.round(19 * s), Math.round(9.2 * s), themeColor === '#ffd23f' ? '#8c2d08' : (themeColor === '#4fe3ff' ? '#18548c' : '#a34200'));
  inkTxt('ARMA: ' + weaponLabel + '   •   VIDA: ' + (curChar.hpMod || 6) + ' HP   •   AGIL.: ' + Math.round((curChar.speedMod || 1) * 100) + '%', W / 2, badgeY + Math.round(36 * s), Math.round(7.2 * s), '#4a2c16');

  // 4. BOTÕES PRINCIPAIS DE AÇÃO
  const btnY = Math.round(badgeY + badgeH + 16 * s);
  const btnW = Math.round(clamp(235 * s, 175, 270));
  const btnH = Math.round(clamp(42 * s, 36, 48));
  const gap = Math.round(14 * s);

  const pRect = { x: Math.round(W / 2 - btnW - gap / 2), y: btnY, w: btnW, h: btnH };
  const cRect = { x: Math.round(W / 2 + gap / 2), y: btnY, w: btnW, h: btnH };

  const pHov = inRect(mouse.x, mouse.y, pRect);
  const cHov = inRect(mouse.x, mouse.y, cRect);

  // Botão 1: Entrar na Arena (Couro & Ouro)
  medPanel(pRect.x, pRect.y, pRect.w, pRect.h, 'leather');
  if (pHov) {
    ctx.strokeStyle = MED.goldLight;
    ctx.lineWidth = 2;
    ctx.strokeRect(pRect.x, pRect.y, pRect.w, pRect.h);
  }
  txt('⚔ ENTRAR NA ARENA ⚔', pRect.x + pRect.w / 2, pRect.y + Math.round(21 * s), Math.round(9.5 * s), pHov ? '#ffffff' : MED.goldLight);
  txt(gp ? '[A / START]' : '[ENTER / ESPAÇO]', pRect.x + pRect.w / 2, pRect.y + Math.round(34 * s), Math.round(6.5 * s), MED.gold);

  // Botão 2: Escolher Campeão (Madeira & Fita Nobre)
  medPanel(cRect.x, cRect.y, cRect.w, cRect.h, cHov ? 'parch' : 'wood');
  txt('✦ ESCOLHER CAMPEÃO ✦', cRect.x + cRect.w / 2, cRect.y + Math.round(21 * s), Math.round(9.5 * s), cHov ? MED.parchInk : MED.goldLight);
  txt(gp ? '[SELECT / X]' : '[TAB / ROLETA 3D]', cRect.x + cRect.w / 2, cRect.y + Math.round(34 * s), Math.round(6.5 * s), cHov ? MED.parchDark : MED.parch);

  menuPlayRect = pRect;
  menuCharRect = cRect;
  const sw = Math.round(clamp(250 * s, 195, 285)), sh = Math.round(30 * s);
  const sx = Math.round(W / 2 - sw - 6 * s), sy = Math.round(btnY + btnH + 10 * s);
  const sHov = inRect(mouse.x, mouse.y, { x: sx, y: sy, w: sw, h: sh });
  medPanel(sx, sy, sw, sh, sHov ? 'wood' : 'leather');
  txt('✦ [S] ALMAS (' + soulEssences + ' ESS.)', sx + sw / 2, sy + Math.round(20 * s), Math.round(7.2 * s), '#d66fff');
  menuSoulRect = { x: sx, y: sy, w: sw, h: sh };
  const bx2 = Math.round(W / 2 + 6 * s), bw2 = Math.round(clamp(185 * s, 145, 220));
  const bHov2 = inRect(mouse.x, mouse.y, { x: bx2, y: sy, w: bw2, h: sh });
  medPanel(bx2, sy, bw2, sh, bHov2 ? 'wood' : 'leather');
  txt('📖 [B] BESTIÁRIO', bx2 + bw2 / 2, sy + Math.round(20 * s), Math.round(7.2 * s), MED.goldLight);
  menuBestiaryRect = { x: bx2, y: sy, w: bw2, h: sh };

  // 5. SELO DO RECORDE ANCESTRAL
  if (best > 0) {
    const recY = Math.min(H - Math.round(44 * s), btnY + btnH + Math.round(54 * s));
    txt('🏆 RECORDE ANCESTRAL: ' + best + ' PONTOS', W / 2, recY, Math.round(8.5 * s), MED.goldLight);
  }

  // 6. FAIXA DE COMANDOS RÚNICOS (RODAPÉ ELEGANTE)
  const ribW = Math.round(clamp(W - 40, 320, 680));
  const ribH = Math.round(22 * s);
  const ribX = Math.round(W / 2 - ribW / 2);
  const ribY = Math.round(H - ribH - 8);

  medPanel(ribX, ribY, ribW, ribH, 'thin');
  const cmdText = gp
    ? '🕹 D-PAD/STICK: Mover  •  RT: Atacar  •  LT/B: Esquiva  •  Y/X: Fúria  •  START: Pausa'
    : '⚔ [WASD] Mover  •  [CLIQUE/ESPAÇO] Atacar  •  [SHIFT] Esquiva  •  [E/Q] Fúria  •  [P] Pausa';
  txt(cmdText, W / 2, ribY + Math.round(14 * s), Math.round(6.5 * s), MED.parch);
}

// =====================================================================
//  MENU DE PAUSA (v.2 — Game UI/UX Design System)
// =====================================================================
let pauseResumeRect = null, pauseCharRect = null, pauseRestartRect = null;
function drawPauseMenu() {
  overlay(0.75);
  const isCompactH = H <= 520;
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);
  const p = player;
  const pw = Math.round(clamp(480 * s, 320, 520));
  const ph = Math.round(clamp(340 * s, 260, 380));
  const px = Math.round(W / 2 - pw / 2);
  const py = Math.round(H / 2 - ph / 2);

  medPanel(px, py, pw, ph, 'leather');

  const titleY = py + Math.round(26 * s);
  txt('⚔ JORNADA EM SUSPENSO ⚔', W / 2, titleY, Math.round(13 * s), MED.goldLight);

  const statsY = titleY + Math.round(24 * s);
  const curPrefix = p && p.prefix ? '[' + p.prefix.name + '] ' : '';
  const weaponLabel = p && p.char.weaponType === 'orange' ? 'Laranjas' : (p && p.char.weaponType === 'star' ? 'Estrelas' : 'Sabre');
  txt((p ? p.char.name.toUpperCase() : '') + ' • ' + curPrefix + weaponLabel, W / 2, statsY, Math.round(8.5 * s), MED.parch);

  const infoY = statsY + Math.round(20 * s);
  txt('ONDA: ' + toRoman(wave) + '   •   ABATES: ' + kills + '   •   OURO: ' + coins + '   •   PTS: ' + score, W / 2, infoY, Math.round(7.5 * s), MED.gold);

  // Linha divisória de ferro
  ctx.fillStyle = 'rgba(217, 164, 65, 0.3)';
  ctx.fillRect(px + 24, infoY + Math.round(14 * s), pw - 48, 1);

  // Botões de Ação
  const btnW = Math.round(pw - 56);
  const btnH = Math.round(clamp(36 * s, 32, 42));
  const btnGap = Math.round(10 * s);
  const b0Y = infoY + Math.round(24 * s);

  const r0 = { x: Math.round(W / 2 - btnW / 2), y: b0Y, w: btnW, h: btnH };
  const r1 = { x: Math.round(W / 2 - btnW / 2), y: b0Y + btnH + btnGap, w: btnW, h: btnH };
  const r2 = { x: Math.round(W / 2 - btnW / 2), y: b0Y + (btnH + btnGap) * 2, w: btnW, h: btnH };

  const hov0 = inRect(mouse.x, mouse.y, r0);
  const hov1 = inRect(mouse.x, mouse.y, r1);
  const hov2 = inRect(mouse.x, mouse.y, r2);

  medPanel(r0.x, r0.y, r0.w, r0.h, hov0 ? 'parch' : 'wood');
  txt(gamepadInfo.connected ? '▶ RETOMAR BATALHA [START / A]' : '▶ RETOMAR BATALHA [ESC / ENTER]', W / 2, r0.y + Math.round(22 * s), Math.round(8.5 * s), hov0 ? MED.parchInk : MED.goldLight);

  medPanel(r1.x, r1.y, r1.w, r1.h, hov1 ? 'parch' : 'wood');
  txt(gamepadInfo.connected ? '✦ ESCOLHER CAMPEÃO [SELECT]' : '✦ ESCOLHER CAMPEÃO [TAB]', W / 2, r1.y + Math.round(22 * s), Math.round(8.5 * s), hov1 ? MED.parchInk : MED.parch);

  medPanel(r2.x, r2.y, r2.w, r2.h, hov2 ? 'parch' : 'wood');
  txt('↺ REINICIAR JORNADA [R]', W / 2, r2.y + Math.round(22 * s), Math.round(8.5 * s), hov2 ? MED.blood : '#c8b49e');

  pauseResumeRect = r0;
  pauseCharRect = r1;
  pauseRestartRect = r2;
}

function drawOver() {
  overlay(0.85);
  const isCompactH = H <= 520;
  const s = clamp(Math.min(W / 1280, H / 720), 0.75, 1.4);

  const titleY = Math.round(isCompactH ? 26 : 42 * s);
  txt('💀 TOMBOU EM COMBATE 💀', W / 2, titleY, Math.round(isCompactH ? 18 : 26 * s), MED.bloodLight);
  txt('Sua bravura foi gravada nos anais da arena ancestral', W / 2, titleY + Math.round(20 * s), Math.round(7.5 * s), MED.parch);

  const scrollW = Math.round(clamp(440 * s, 300, 480));
  const scrollH = Math.round(clamp(285 * s, 230, 325));
  const scrollX = Math.round(W / 2 - scrollW / 2);
  const scrollY = Math.round(titleY + 34 * s);

  medPanel(scrollX, scrollY, scrollW, scrollH, 'parch');

  const rows = [
    ['CAMPEÃO', player ? player.char.name.toUpperCase() : 'HERÓI'],
    ['GLÓRIA (PONTOS)', score],
    ['ONDA RESISTIDA', toRoman(wave)],
    ['NÍVEL ALCANÇADO', player ? player.level : 1],
    ['INIMIGOS ABATIDOS', kills],
    ['DANO TOTAL CAUSADO', totalDamageDealt],
    ['MAIOR COMBO', maxCombo + 'x'],
    ['ARMA / REFORJA', player && player.prefix ? player.prefix.name.toUpperCase() : 'PADRÃO'],
    ['OURO COLETADO', coins + ' MOEDAS'],
    ['TEMPO DE RESISTÊNCIA', `${Math.floor(playTime / 60)}m ${String(Math.floor(playTime % 60)).padStart(2, '0')}s`],
  ];

  const rowGap = Math.round(clamp(22 * s, 17, 26));
  const startY = scrollY + Math.round(28 * s);
  rows.forEach(([k, v], i) => {
    inkTxt(k, scrollX + 24, startY + i * rowGap, Math.round(7.5 * s), '#5c3d1e', 'left');
    inkTxt('' + v, scrollX + scrollW - 24, startY + i * rowGap, Math.round(8.5 * s), MED.parchInk, 'right');
  });

  const recY = scrollY + scrollH + Math.round(20 * s);
  if (score >= best && score > 0) {
    txt('👑 NOVO RECORDE ANCESTRAL ALCANÇADO! 👑', W / 2, recY, Math.round(10 * s), MED.goldLight);
  } else {
    txt('🏆 RECORDE ANCESTRAL: ' + best + ' PONTOS', W / 2, recY, Math.round(8.5 * s), MED.gold);
  }

  const promptY = Math.min(H - Math.round(20 * s), recY + Math.round(24 * s));
  const pulseCol = Math.floor(time * 3) % 2 === 0 ? MED.goldLight : '#ffffff';
  txt(touch.active ? 'TOQUE NA TELA PARA RENASCER' : '⚔ PRESSIONE ENTER OU CLIQUE PARA RENASCER ⚔', W / 2, promptY, Math.round(9.5 * s), pulseCol);
}

// =====================================================================
//  LOOP PRINCIPAL
// =====================================================================
function inRect(mx, my, r) { return r && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h; }

