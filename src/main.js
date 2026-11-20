let last = performance.now();
function loop(now) {
  try {
    const realDt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    const dt = realDt;
    last = now;

    if (typeof PERF_STATS !== 'undefined') PERF_STATS.recordFrame(realDt);
    if (typeof GPU_FX !== 'undefined') GPU_FX.update(realDt);

  updateGamepadState(dt);

  if (anyPressed('m')) {
    musicOn = !musicOn;
    if (!musicOn) {
      music.pause();
    } else {
      startMusic();
    }
    SFX.select();
  }
  if (anyPressed('n')) { minimapOn = !minimapOn; SFX.select(); }
  if (anyPressed('f') && typeof togglePerfMonitor === 'function') { togglePerfMonitor(); SFX.select(); }
  if (anyPressed('g') && typeof cycleGfxQuality === 'function') { cycleGfxQuality(); SFX.select(); }
  if (anyPressed('c')) {
    saberColorIndex = (saberColorIndex + 1) % SABER_COLORS.length;
    localStorage.setItem('gabriel_saber_color', saberColorIndex);
    SFX.slash();
  }

  if (!ready) {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);
    txt('Carregando... ' + Math.floor(loaded / total * 100) + '%', W / 2, H / 2, 16);
  } else {
    if (state === 'loading') {
      if (typeof buildWorld === 'function' && (typeof ground === 'undefined' || !ground.width || (typeof trees !== 'undefined' && trees.length === 0))) {
        try { buildWorld(); } catch (e) { }
      }
      reset();
      if (typeof location !== 'undefined' && location.search && location.search.includes('play')) {
        startWithSelectedCharacter();
      } else {
        state = 'menu';
      }
    }
    if (state === 'menu') {
      time += dt;
      cam.x = WORLD.w / 2 + Math.cos(time * 0.15) * 500; cam.y = WORLD.h / 2 + Math.sin(time * 0.15) * 350;
      clampCam();
      if (anyPressed('tab', 'p')) { enterCharacterSelect(); }
      else if (anyPressed('1')) { difficultyIdx = 0; localStorage.setItem('gabriel_diff', 0); SFX.select(); }
      else if (anyPressed('2')) { difficultyIdx = 1; localStorage.setItem('gabriel_diff', 1); SFX.select(); }
      else if (anyPressed('3')) { difficultyIdx = 2; localStorage.setItem('gabriel_diff', 2); SFX.select(); }
      else if (anyPressed('s')) { state = 'soul_shrine'; panelOpenAt = performance.now(); SFX.select(); }
      else if (anyPressed('b')) { state = 'bestiary'; panelOpenAt = performance.now(); SFX.bookOpen(); }
      else if (anyPressed('enter', ' ')) {
        startWithSelectedCharacter();
      } else if (mouse.click) {
        let diffClicked = false;
        menuDiffRects.forEach((r, idx) => {
          if (inRect(mouse.x, mouse.y, r)) { difficultyIdx = idx; localStorage.setItem('gabriel_diff', idx); SFX.select(); diffClicked = true; }
        });
        if (diffClicked) { /* handled */ }
        else if (inRect(mouse.x, mouse.y, menuSoulRect)) {
          state = 'soul_shrine'; panelOpenAt = performance.now(); SFX.select();
        } else if (inRect(mouse.x, mouse.y, menuBestiaryRect)) {
          state = 'bestiary'; panelOpenAt = performance.now(); SFX.bookOpen();
        } else if ((menuCharRect && inRect(mouse.x, mouse.y, menuCharRect)) || Math.hypot(mouse.x - W / 2, mouse.y - H * 0.39) < 85) {
          if (canvas) canvas.style.cursor = 'default';
          enterCharacterSelect();
        } else if (inRect(mouse.x, mouse.y, menuPlayRect)) {
          startWithSelectedCharacter();
        }
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'bestiary') {
      if (anyPressed('escape', 'b')) { state = 'menu'; SFX.bookClose(); }
      else if (anyPressed('arrowleft', 'a')) { changeBestiaryPage(-1); }
      else if (anyPressed('arrowright', 'd')) { changeBestiaryPage(1); }
      if (mouse.click) {
        if (inRect(mouse.x, mouse.y, bestiaryPrevRect)) changeBestiaryPage(-1);
        else if (inRect(mouse.x, mouse.y, bestiaryNextRect)) changeBestiaryPage(1);
        else if (inRect(mouse.x, mouse.y, bestiaryBackRect)) { state = 'menu'; SFX.bookClose(); }
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'soul_shrine') {
      if (anyPressed('escape', 's', 'enter')) { state = 'menu'; SFX.select(); }
      if (mouse.click) {
        if (inRect(mouse.x, mouse.y, soulBackRect)) { state = 'menu'; SFX.select(); }
        else soulRects.forEach(r => { if (inRect(mouse.x, mouse.y, r)) buySoulUpgrade(r.id); });
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'select_char') {
      const curSelCh = CHARACTERS[selectedCharIndex];
      if (curSelCh && musicOn && (!activeCharMusic || activeCharMusic.paused || activeCharId !== curSelCh.id)) {
        if (mouse.click || mouse.down || Object.keys(pressed).length > 0) {
          playCharacterMusic(curSelCh.id);
        }
      }
      if (anyPressed('1')) selectCharacter(0);
      if (anyPressed('2')) selectCharacter(1);
      if (anyPressed('3')) selectCharacter(2);
      if (anyPressed('arrowleft', 'a')) { selectedCharIndex = (selectedCharIndex + CHARACTERS.length - 1) % CHARACTERS.length; selectCharacter(selectedCharIndex); }
      if (anyPressed('arrowright', 'd')) { selectedCharIndex = (selectedCharIndex + 1) % CHARACTERS.length; selectCharacter(selectedCharIndex); }
      if (typeof gpState !== 'undefined' && gpState) {
        if (gpState.justPressed[4]) {
          selectedCharIndex = (selectedCharIndex + CHARACTERS.length - 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
        }
        if (gpState.justPressed[5]) {
          selectedCharIndex = (selectedCharIndex + 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
        }
      }
      if (mouse.click) {
        if (charPrevRect && inRect(mouse.x, mouse.y, charPrevRect)) {
          selectedCharIndex = (selectedCharIndex + CHARACTERS.length - 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
          mouse.click = false; mouse.down = false;
        } else if (charNextRect && inRect(mouse.x, mouse.y, charNextRect)) {
          selectedCharIndex = (selectedCharIndex + 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
          mouse.click = false; mouse.down = false;
        } else if (charTabRects && charTabRects.some(r => inRect(mouse.x, mouse.y, r))) {
          const tab = charTabRects.find(r => inRect(mouse.x, mouse.y, r));
          if (tab) selectCharacter(tab.index);
          mouse.click = false; mouse.down = false;
        } else if (inRect(mouse.x, mouse.y, charPlayRect)) {
          startWithSelectedCharacter();
          mouse.click = false; mouse.down = false;
        } else if (inRect(mouse.x, mouse.y, charBackRect)) {
          stopCharacterMusic(); state = 'menu'; SFX.select();
        } else {
          charCardRects.forEach(r => {
            if (inRect(mouse.x, mouse.y, r)) {
              if (selectedCharIndex === r.index) {
                startWithSelectedCharacter();
                mouse.click = false; mouse.down = false;
              } else {
                selectCharacter(r.index);
              }
            }
          });
        }
      }
      if (anyPressed('enter', ' ')) {
        startWithSelectedCharacter();
      }
      if (anyPressed('escape')) { stopCharacterMusic(); state = 'menu'; SFX.select(); }
    } else if (state === 'play') {
      if (anyPressed('p', 'escape')) state = 'pause';
      else if (anyPressed('tab')) { enterCharacterSelect(); }
      else if (freeze > 0) { freeze -= realDt; shake = Math.max(0, shake - realDt * 50); }
      else {
        const simDt = realDt * (typeof GPU_FX !== 'undefined' && GPU_FX.slowMoT > 0 ? GPU_FX.slowMoScale : 1);
        update(simDt);
      }
    } else if (state === 'levelup') {
      // Atalhos diretos: 1, 2, 3 no teclado ou botões X, Y, B no controle
      if (pressed['1'] || (gpState && gpState.justPressed[2])) chooseUpgrade(0);
      else if (pressed['2'] || (gpState && gpState.justPressed[3])) chooseUpgrade(1);
      else if (pressed['3'] || (gpState && gpState.justPressed[1])) chooseUpgrade(2);

      if (state === 'levelup') {
        if (anyPressed('arrowleft', 'a')) {
          levelSel = (levelSel + levelChoices.length - 1) % levelChoices.length;
          SFX.select();
        }
        if (anyPressed('arrowright', 'd')) {
          levelSel = (levelSel + 1) % levelChoices.length;
          SFX.select();
        }
        const gpConfirm = gpState && (gpState.justPressed[0] || gpState.justPressed[7]);
        if (anyPressed('r')) rerollLevelUp();
        if (anyPressed('x')) banishSelectedUpgrade();
        if (anyPressed('enter', ' ') || gpConfirm) {
          chooseUpgrade(levelSel);
        }
        if (mouse.click) {
          if (levelRerollRect && inRect(mouse.x, mouse.y, levelRerollRect)) rerollLevelUp();
          else if (levelBanRect && inRect(mouse.x, mouse.y, levelBanRect)) banishSelectedUpgrade();
          else cardRects.forEach((r, i) => {
            if (mouse.x > r.x && mouse.x < r.x + r.w && mouse.y > r.y - 10 && mouse.y < r.y + r.h) chooseUpgrade(i);
          });
        }
        mouse.down = false;
      }
    } else if (state === 'shop') {
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        if (pressed[k] && +k - 1 < SHOP_ITEMS.length) buyShopItem(+k - 1);
      }
      const totalOptions = SHOP_ITEMS.length + 1; // 0..N-1 itens, N = Continuar
      const shopCols = H > W ? 3 : 5;
      if (anyPressed('arrowleft', 'a')) {
        shopSel = (shopSel + totalOptions - 1) % totalOptions;
        SFX.select();
      }
      if (anyPressed('arrowright', 'd')) {
        shopSel = (shopSel + 1) % totalOptions;
        SFX.select();
      }
      if (anyPressed('arrowup', 'w')) {
        if (shopSel === SHOP_ITEMS.length) shopSel = SHOP_ITEMS.length - 1;
        else if (shopSel >= shopCols) shopSel -= shopCols;
        SFX.select();
      }
      if (anyPressed('arrowdown', 's')) {
        if (shopSel < SHOP_ITEMS.length) {
          if (shopSel + shopCols < SHOP_ITEMS.length) shopSel += shopCols;
          else shopSel = SHOP_ITEMS.length;
        }
        SFX.select();
      }

      // Confirmar compra com Botão A (0), RT (7) ou Enter
      const gpShopConfirm = gpState && (gpState.justPressed[0] || gpState.justPressed[7]);
      if (anyPressed('enter', ' ') || gpShopConfirm) {
        if (shopSel === SHOP_ITEMS.length) {
          state = 'play'; SFX.wave(); player.inv = Math.max(player.inv, 0.8);
        } else {
          buyShopItem(shopSel);
        }
      }

      // Sair da loja com Botão B (1), Start (9) ou Escape
      const gpShopExit = gpState && (gpState.justPressed[1] || gpState.justPressed[9]);
      if (anyPressed('escape', 'start') || gpShopExit) {
        state = 'play';
        SFX.wave();
        player.inv = Math.max(player.inv, 0.8);
      }

      if (mouse.click) {
        if (inRect(mouse.x, mouse.y, shopExitRect)) {
          state = 'play'; SFX.wave(); player.inv = Math.max(player.inv, 0.8);
          mouse.click = false; mouse.down = false;
        } else {
          shopRects.forEach((r, i) => { if (inRect(mouse.x, mouse.y, r)) buyShopItem(i); });
        }
      }
    } else if (state === 'pause') {
      if (anyPressed('p', 'escape', 'enter') || (gpState && (gpState.justPressed[0] || gpState.justPressed[9]))) {
        state = 'play';
        mouse.click = false; mouse.down = false;
      }
      if (anyPressed('tab') || (gpState && gpState.justPressed[8])) { enterCharacterSelect(); }
      if (anyPressed('r')) { reset(); state = 'play'; SFX.wave(); }
      if (mouse.click) {
        if (inRect(mouse.x, mouse.y, pauseResumeRect)) { state = 'play'; }
        else if (inRect(mouse.x, mouse.y, pauseCharRect)) { enterCharacterSelect(); }
        else if (inRect(mouse.x, mouse.y, pauseRestartRect)) { reset(); state = 'play'; SFX.wave(); }
        else if (typeof pauseGfxRect !== 'undefined' && inRect(mouse.x, mouse.y, pauseGfxRect) && typeof cycleGfxQuality === 'function') { cycleGfxQuality(); SFX.select(); }
        else if (typeof pauseShakeRect !== 'undefined' && inRect(mouse.x, mouse.y, pauseShakeRect) && typeof toggleReduceShake === 'function') { toggleReduceShake(); SFX.select(); }
        else if (typeof pausePerfRect !== 'undefined' && inRect(mouse.x, mouse.y, pausePerfRect) && typeof togglePerfMonitor === 'function') { togglePerfMonitor(); SFX.select(); }
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'over') {
      time += dt;
      for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
      particles = particles.filter(q => q.life > 0);
      if (time > 1 && (anyPressed('enter') || mouse.click)) { enterCharacterSelect(); mouse.down = false; }
    }

    ctx.clearRect(0, 0, W, H);
    let pixiRendered = false;
    if (typeof usePixi !== 'undefined' && usePixi && typeof renderPixiWorld === 'function') {
      try {
        renderPixiWorld();
        if (typeof drawPixiWorldOverlay2D === 'function') drawPixiWorldOverlay2D();
        pixiRendered = true;
      } catch (err) {
        console.warn('Erro ao renderizar WebGL, ativando fallback Canvas 2D:', err);
        usePixi = false;
      }
    }
    if (!pixiRendered) {
      drawWorld();
    }
    if (state !== 'play' && canvas && canvas.style.cursor === 'none') canvas.style.cursor = 'default';
    if (state !== 'menu' && typeof syncMenuOverlay === 'function') syncMenuOverlay(false);
    if (state === 'menu') drawMenu();
    else if (state === 'soul_shrine') drawSoulShrine();
    else if (state === 'bestiary') drawBestiary();
    else if (state === 'select_char') drawCharacterSelect();
    else {
      drawHUD();
      if (state === 'levelup') drawLevelUp();
      if (state === 'shop') drawShop();
      if (state === 'pause') {
        drawPauseMenu();
      }
      if (state === 'over') drawOver();
    }
    drawGamepadToast();
  }

  for (const k in pressed) delete pressed[k];
  mouse.click = false; mouse.rclick = false; mouse.moved = false;
  touch.justAtk = false; touch.justDash = false; touch.justUlt = false;
  } catch (loopErr) {
    console.error("Critical caught error in loop:", loopErr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  } finally {
    requestAnimationFrame(loop);
  }
}

// Auto-pause ao perder foco (troca de aba/janela) e flush do save
function autoPause() {
  if (state === 'play') {
    state = 'pause';
    for (const k in keys) keys[k] = false;
    mouse.down = false;
    touch.isAtkDown = false;
  }
}
addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { autoPause(); if (typeof flushProfileSave === 'function') flushProfileSave(); }
});
addEventListener('pagehide', () => { if (typeof flushProfileSave === 'function') flushProfileSave(); });

try {
  Object.defineProperty(window, '__GAME_DEBUG', {
    configurable: true,
    get() {
      return {
        usePixi: typeof usePixi !== 'undefined' ? usePixi : false,
        quality: typeof GFX_SETTINGS !== 'undefined' ? GFX_SETTINGS.quality : 'high',
        fps: typeof PERF_STATS !== 'undefined' ? Math.round(PERF_STATS.fps) : 0,
        frameMs: typeof PERF_STATS !== 'undefined' ? +PERF_STATS.frameMs.toFixed(2) : 0,
        p95Ms: typeof PERF_STATS !== 'undefined' ? +PERF_STATS.p95Ms.toFixed(2) : 0,
        enemies: typeof enemies !== 'undefined' ? enemies.length : 0,
        particles: typeof particles !== 'undefined' ? particles.length : 0,
        pshots: typeof pshots !== 'undefined' ? pshots.length : 0,
        pickups: typeof pickups !== 'undefined' ? pickups.length : 0,
        state: typeof state !== 'undefined' ? state : '',
        wave: typeof wave !== 'undefined' ? wave : 0,
        combo: typeof player !== 'undefined' && player ? player.combo : 0,
        feverTier: typeof player !== 'undefined' && player ? (player.feverTier || 0) : 0,
        synergies: typeof player !== 'undefined' && player && player.synergies ? Array.from(player.synergies) : [],
      };
    }
  });
} catch (_) {}

requestAnimationFrame(loop);
