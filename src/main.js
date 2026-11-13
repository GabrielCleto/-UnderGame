let last = performance.now();
function loop(now) {
  try {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

  updateGamepadState(dt);

  if (anyPressed('m')) {
    musicOn = !musicOn;
    if (!musicOn) {
      if (activeCharMusic) activeCharMusic.pause();
    } else {
      if (state === 'select_char') {
        const cur = CHARACTERS[selectedCharIndex];
        if (cur) playCharacterMusic(cur.id);
      }
    }
    SFX.select();
  }
  if (anyPressed('n')) { minimapOn = !minimapOn; SFX.select(); }
  if (anyPressed('c')) {
    saberColorIndex = (saberColorIndex + 1) % SABER_COLORS.length;
    localStorage.setItem('gabriel_saber_color', saberColorIndex);
    SFX.slash();
  }

  if (!ready) {
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);
    txt('Carregando... ' + Math.floor(loaded / total * 100) + '%', W / 2, H / 2, 16);
  } else {
    if (state === 'loading') { reset(); state = 'menu'; }
    if (state === 'menu') {
      time += dt;
      cam.x = WORLD.w / 2 + Math.cos(time * 0.15) * 500; cam.y = WORLD.h / 2 + Math.sin(time * 0.15) * 350;
      clampCam();
      if (anyPressed('tab', 'p')) { enterCharacterSelect(); }
      else if (anyPressed('enter', ' ')) {
        startWithSelectedCharacter();
      } else if (mouse.click) {
        if (inRect(mouse.x, mouse.y, menuCharRect) || Math.hypot(mouse.x - W / 2, mouse.y - H * 0.36) < 75) {
          enterCharacterSelect();
        } else if (inRect(mouse.x, mouse.y, menuPlayRect)) {
          startWithSelectedCharacter();
        }
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
        if (gpState.justPressed[4] || gpState.justPressed[14]) {
          selectedCharIndex = (selectedCharIndex + CHARACTERS.length - 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
        }
        if (gpState.justPressed[5] || gpState.justPressed[15]) {
          selectedCharIndex = (selectedCharIndex + 1) % CHARACTERS.length;
          selectCharacter(selectedCharIndex);
        }
        if (gpState.justPressed[0] || gpState.justPressed[9]) {
          startWithSelectedCharacter();
        }
        if (gpState.justPressed[1]) {
          stopCharacterMusic(); state = 'menu'; SFX.select();
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
      else if (freeze > 0) { freeze -= dt; shake = Math.max(0, shake - dt * 50); trauma = Math.max(0, trauma - dt * 2.5); }
      else update(dt);
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
        if (anyPressed('enter', ' ') || gpConfirm) {
          chooseUpgrade(levelSel);
        }
        if (mouse.click) {
          cardRects.forEach((r, i) => {
            if (mouse.x > r.x && mouse.x < r.x + r.w && mouse.y > r.y - 10 && mouse.y < r.y + r.h) chooseUpgrade(i);
          });
        }
        mouse.down = false;
      }
    } else if (state === 'shop') {
      for (const k of ['1', '2', '3', '4']) if (pressed[k]) buyShopItem(+k - 1);
      const totalOptions = SHOP_ITEMS.length + 1; // 0..3 itens, 4 = Continuar
      if (anyPressed('arrowleft', 'a')) {
        shopSel = (shopSel + totalOptions - 1) % totalOptions;
        SFX.select();
      }
      if (anyPressed('arrowright', 'd')) {
        shopSel = (shopSel + 1) % totalOptions;
        SFX.select();
      }
      if (anyPressed('arrowup', 'w')) {
        if (shopSel === SHOP_ITEMS.length) shopSel = 0;
        SFX.select();
      }
      if (anyPressed('arrowdown', 's')) {
        shopSel = SHOP_ITEMS.length;
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
        mouse.click = false; mouse.down = false;
      }
    } else if (state === 'over') {
      time += dt;
      for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
      particles = particles.filter(q => q.life > 0);
      if (time > 1 && (anyPressed('enter') || mouse.click)) { enterCharacterSelect(); mouse.down = false; }
    }

    ctx.clearRect(0, 0, W, H);
    drawWorld();
    if (state === 'menu') drawMenu();
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
  } finally {
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);
