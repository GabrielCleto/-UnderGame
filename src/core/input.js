// =====================================================================
//  INPUT (Teclado, Mouse e Toque Mobile)
// =====================================================================
const keys = {}, pressed = {};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (!keys[k]) pressed[k] = true;
  keys[k] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault();
  touch.active = false; // voltou pro teclado: esconde os botões touch
  startMusic();
});
addEventListener('keyup', e => (keys[e.key.toLowerCase()] = false));

const mouse = { x: 0, y: 0, down: false, click: false, rclick: false, moved: false };
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) { mouse.down = true; mouse.click = true; }
  if (e.button === 2) mouse.rclick = true;
  startMusic();
});
addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.moved = true; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// =====================================================================
//  CONTROLES TOUCH / MOBILE RESPONSIVO & MULTITOUCH ERGONÔMICO
// =====================================================================
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const touch = {
  active: false,
  isMobile: isTouchDevice,

  // Joystick Virtual (Analógico Dinâmico na Esquerda)
  joyId: null,
  joyBaseX: 95,
  joyBaseY: 0,
  joyCurrX: 95,
  joyCurrY: 0,
  joyX: 0,
  joyY: 0,
  joyDist: 0,
  joyAngle: 0,
  joyBaseRadius: 62,
  joyStickRadius: 26,

  // Botões de Ação na Direita
  atkId: null,
  dashId: null,
  ultId: null,
  isAtkDown: false,
  justAtk: false,
  justDash: false,
  justUlt: false,

  // Retângulos e Círculos Dinâmicos
  atkBtn: { x: 0, y: 0, r: 44 },
  dashBtn: { x: 0, y: 0, r: 32 },
  ultBtn: { x: 0, y: 0, r: 34 },
  pauseBtn: { x: 0, y: 0, w: 42, h: 42 },
  fullBtn: { x: 0, y: 0, w: 42, h: 42 },
};

function updateTouchLayout() {
  const minDim = Math.min(W, H);
  const isPortrait = H > W;
  const isLandscapeMobile = H <= 460 && W > H;

  // Joystick Base (mais compacto e nos cantos no celular paisagem)
  const jR = isLandscapeMobile ? 46 : clamp(minDim * 0.12, 52, 70);
  touch.joyBaseRadius = jR;
  touch.joyStickRadius = clamp(jR * 0.44, 20, 28);
  const defJoyX = isLandscapeMobile ? 66 : clamp(W * 0.13, jR + 18, 120);
  const defJoyY = isLandscapeMobile ? H - 66 : H - clamp(H * 0.18, jR + 24, 130);
  if (touch.joyId === null) {
    touch.joyBaseX = defJoyX;
    touch.joyBaseY = defJoyY;
    touch.joyCurrX = defJoyX;
    touch.joyCurrY = defJoyY;
  }

  // Botão Atacar (Grande, bem no canto inferior direito)
  const atkR = isLandscapeMobile ? 36 : clamp(minDim * 0.105, 38, 52);
  const atkX = W - atkR - (isLandscapeMobile ? 18 : clamp(W * 0.05, 18, 38));
  const atkY = H - atkR - (isLandscapeMobile ? 14 : clamp(H * 0.09, 20, 44));
  touch.atkBtn = { x: atkX, y: atkY, r: atkR };

  // Botão Giro / Esquiva (À esquerda do ataque)
  const dashR = isLandscapeMobile ? 27 : clamp(atkR * 0.74, 28, 36);
  const dashX = atkX - atkR - dashR - (isLandscapeMobile ? 10 : 14);
  const dashY = atkY + (isPortrait ? -6 : (isLandscapeMobile ? 6 : 10));
  touch.dashBtn = { x: dashX, y: dashY, r: dashR };

  // Botão Ultimate (Acima do ataque)
  const ultR = isLandscapeMobile ? 28 : clamp(atkR * 0.78, 30, 38);
  const ultX = atkX - (isPortrait ? 8 : (isLandscapeMobile ? 8 : 18));
  const ultY = atkY - atkR - ultR - (isLandscapeMobile ? 10 : 16);
  touch.ultBtn = { x: ultX, y: ultY, r: ultR };

  // Botões de Topo: Pausa e Tela Cheia
  const topSize = isLandscapeMobile ? 32 : clamp(minDim * 0.075, 36, 42);
  touch.pauseBtn = { x: W - topSize - 10, y: 10, w: topSize, h: topSize };
  touch.fullBtn = { x: W - topSize * 2 - 18, y: 10, w: topSize, h: topSize };
}
window.__touchReady = true;
updateTouchLayout();

function toggleFullscreen() {
  const doc = document;
  const el = doc.documentElement;
  try {
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    }
  } catch (e) {}
}

function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
    startMusic();
  } catch (e) {}
}

function getTouchPos(t) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (t.clientX - rect.left) * (canvas.width / rect.width),
    y: (t.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function inCircle(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) <= r;
}

canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchmove', onTouchMove, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });
canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

function onTouchStart(e) {
  e.preventDefault();
  touch.active = true;
  unlockAudio();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const { x, y } = getTouchPos(t);
    const id = t.identifier;

    // Se estiver em menus ou escolha de poderes, repassa o toque como clique direto
    if (state !== 'play') {
      mouse.x = x; mouse.y = y; mouse.click = true; mouse.down = false; mouse.moved = true;
      continue;
    }

    // 1. Pausa no topo
    if (inRect(x, y, touch.pauseBtn)) {
      state = 'pause'; SFX.select();
      continue;
    }

    // 2. Tela Cheia no topo
    if (inRect(x, y, touch.fullBtn)) {
      toggleFullscreen();
      continue;
    }

    // 3. Botão ATACAR
    if (inCircle(x, y, touch.atkBtn.x, touch.atkBtn.y, touch.atkBtn.r + 12)) {
      touch.atkId = id;
      touch.isAtkDown = true;
      touch.justAtk = true;
      continue;
    }

    // 4. Botão GIRO / ESQUIVA
    if (inCircle(x, y, touch.dashBtn.x, touch.dashBtn.y, touch.dashBtn.r + 10)) {
      touch.dashId = id;
      touch.justDash = true;
      continue;
    }

    // 5. Botão ULTIMATE
    if (inCircle(x, y, touch.ultBtn.x, touch.ultBtn.y, touch.ultBtn.r + 10)) {
      touch.ultId = id;
      touch.justUlt = true;
      continue;
    }

    // 6. Joystick Virtual na metade esquerda (Floating)
    if (x < W * 0.52 && touch.joyId === null) {
      touch.joyId = id;
      touch.joyBaseX = x;
      touch.joyBaseY = y;
      touch.joyCurrX = x;
      touch.joyCurrY = y;
      touch.joyDist = 0;
      touch.joyX = 0;
      touch.joyY = 0;
      continue;
    }

    // Toques livres na metade direita disparam ataque
    if (x >= W * 0.52 && touch.atkId === null) {
      touch.atkId = id;
      touch.isAtkDown = true;
      touch.justAtk = true;
    }
  }
}

function onTouchMove(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const { x, y } = getTouchPos(t);
    const id = t.identifier;

    if (id === touch.joyId) {
      touch.joyCurrX = x;
      touch.joyCurrY = y;
      const dx = x - touch.joyBaseX, dy = y - touch.joyBaseY;
      const d = Math.hypot(dx, dy);
      touch.joyAngle = Math.atan2(dy, dx);
      touch.joyDist = Math.min(1, d / touch.joyBaseRadius);
      touch.joyX = Math.cos(touch.joyAngle) * touch.joyDist;
      touch.joyY = Math.sin(touch.joyAngle) * touch.joyDist;
    }
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  if (!e.touches || e.touches.length === 0) mouse.down = false;
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    const id = t.identifier;

    if (id === touch.joyId) {
      touch.joyId = null;
      touch.joyDist = 0;
      touch.joyX = 0;
      touch.joyY = 0;
      const minDim = Math.min(W, H);
      touch.joyBaseX = clamp(W * 0.13, touch.joyBaseRadius + 18, 120);
      touch.joyBaseY = H - clamp(H * 0.18, touch.joyBaseRadius + 24, 130);
      touch.joyCurrX = touch.joyBaseX;
      touch.joyCurrY = touch.joyBaseY;
    }
    if (id === touch.atkId) {
      touch.atkId = null;
      touch.isAtkDown = false;
    }
    if (id === touch.dashId) {
      touch.dashId = null;
    }
    if (id === touch.ultId) {
      touch.ultId = null;
    }
  }
}
const anyPressed = (...ks) => ks.some(k => pressed[k]);

// =====================================================================
//  SUPORTE TOTAL A CONTROLES (GAMEPAD - Plug & Play Universal)
//  Xbox, PlayStation (DS4/DualSense), Switch Pro, 8BitDo e Genéricos USB/BT
// =====================================================================
const gamepadInfo = {
  connected: false,
  id: '',
  toastTimer: 0,
  toastName: '',
  prevButtons: [],
  stickFlickX: false,
  stickFlickY: false,
};

let gpState = {
  moveX: 0,
  moveY: 0,
  hasAim: false,
  aimAngle: 0,
  justPressed: [],
  curr: []
};

window.addEventListener('gamepadconnected', e => {
  onGamepadDetected(e.gamepad);
});

window.addEventListener('gamepaddisconnected', () => {
  gamepadInfo.connected = false;
  gamepadInfo.toastName = 'CONTROLE DESCONECTADO';
  gamepadInfo.toastTimer = 2.5;
});

function onGamepadDetected(gp) {
  if (!gp) return;
  gamepadInfo.connected = true;
  gamepadInfo.id = gp.id;
  let name = gp.id || 'Controle USB';
  if (/xbox/i.test(name)) name = 'Controle Xbox';
  else if (/dualshock|dualsense|054c|playstation/i.test(name)) name = 'Controle PlayStation';
  else if (/nintendo|switch|joy-con/i.test(name)) name = 'Controle Nintendo Switch';
  else if (/8bitdo/i.test(name)) name = 'Controle 8BitDo';
  else if (name.length > 25) name = name.slice(0, 23) + '...';
  gamepadInfo.toastName = name;
  gamepadInfo.toastTimer = 3.5;
  startMusic();
  try { SFX.select(); } catch (e) {}
}

const GP_DEADZONE = 0.20;
const GP_AIM_DEADZONE = 0.26;
function applyDeadzone(v, dz = GP_DEADZONE) {
  return Math.abs(v) > dz ? (v - Math.sign(v) * dz) / (1 - dz) : 0;
}

function pollGamepad(dt = 0) {
  if (gamepadInfo.toastTimer > 0) gamepadInfo.toastTimer -= dt;
  if (!navigator.getGamepads) return null;
  const gamepads = navigator.getGamepads();
  if (!gamepads) return null;
  let gp = null;
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && gamepads[i].connected) { gp = gamepads[i]; break; }
  }
  if (!gp) {
    if (gamepadInfo.connected) {
      gamepadInfo.connected = false;
      gamepadInfo.toastName = 'CONTROLE DESCONECTADO';
      gamepadInfo.toastTimer = 2.0;
    }
    return null;
  }
  if (!gamepadInfo.connected) {
    onGamepadDetected(gp);
  }
  return gp;
}

function updateGamepadState(dt) {
  const gp = pollGamepad(dt);
  if (!gp) {
    gpState = {
      moveX: 0,
      moveY: 0,
      hasAim: false,
      aimAngle: 0,
      attackHold: false,
      attackJust: false,
      dashJust: false,
      ultJust: false,
      justPressed: [],
      curr: []
    };
    return gpState;
  }

  const prev = gamepadInfo.prevButtons;
  function isBtnDown(b, isTrigger = false) {
    if (!b) return false;
    if (typeof b === 'object') {
      if (isTrigger) {
        // Gatilhos analógicos traseiros (RT / LT):
        // Threshold seguro de 0.35 para NUNCA disparar sozinho por ruído/folga
        if (typeof b.value === 'number') return b.value > 0.35;
        return Boolean(b.pressed);
      }
      return Boolean(b.pressed || (typeof b.value === 'number' && b.value > 0.5));
    }
    return typeof b === 'number' && b > (isTrigger ? 0.35 : 0.5);
  }

  const curr = [];
  const justPressed = [];
  const btnCount = Math.max(16, gp.buttons.length);
  for (let i = 0; i < btnCount; i++) {
    const isTrig = (i === 6 || i === 7);
    const down = isBtnDown(gp.buttons[i], isTrig);
    curr[i] = down;
    justPressed[i] = down && !prev[i];
  }
  gamepadInfo.prevButtons = curr;

  // Analógico Esquerdo (Movimento)
  const lx = applyDeadzone(gp.axes[0] || 0);
  const ly = applyDeadzone(gp.axes[1] || 0);

  // Analógico Direito (Mira 360°)
  let rx = 0, ry = 0;
  if (gp.axes.length >= 4) {
    rx = gp.axes[2] || 0;
    ry = gp.axes[3] || 0;
  } else if (gp.axes.length >= 6) {
    rx = gp.axes[4] || 0;
    ry = gp.axes[5] || 0;
  }
  const rDist = Math.hypot(rx, ry);
  let hasAim = false, aimAngle = 0;
  if (rDist > GP_AIM_DEADZONE) {
    hasAim = true;
    aimAngle = Math.atan2(ry, rx);
  }

  // D-Pad / Botões direcionais
  let dpadX = 0, dpadY = 0;
  if (curr[14]) dpadX -= 1; // Left
  if (curr[15]) dpadX += 1; // Right
  if (curr[12]) dpadY -= 1; // Up
  if (curr[13]) dpadY += 1; // Down

  let moveX = Math.abs(lx) > 0.05 ? lx : dpadX;
  let moveY = Math.abs(ly) > 0.05 ? ly : dpadY;
  const mLen = Math.hypot(moveX, moveY);
  if (mLen > 1) { moveX /= mLen; moveY /= mLen; }

  // =========================================================
  //  AÇÕES DO JOGO - GATILHOS TRASEIROS & BOTÕES DEDICADOS
  // =========================================================
  // ATAQUE EXCLUSIVO NOS GATILHOS TRASEIROS:
  // RT / R2 (Gatilho Traseiro Direito, Botão 7) e RB / R1 (Botão Traseiro Superior Direito, Botão 5)
  const attackHold = Boolean(curr[7] || curr[5]);
  const attackJust = Boolean(justPressed[7] || justPressed[5]);

  // GIRO / ESQUIVA:
  // LT / L2 (Gatilho Traseiro Esquerdo, Botão 6), LB / L1 (Botão 4), B (Botão 1) ou L3 (Botão 10)
  const dashJust = Boolean(justPressed[6] || justPressed[4] || justPressed[1] || justPressed[10]);

  // FÚRIA / ESPECIAL (ULTIMATE):
  // Botão Y (Botão 3) ou Botão X (Botão 2)
  const ultJust = Boolean(justPressed[2] || justPressed[3]);

  // NAVEGAÇÃO EM MENUS (SEM DISPARAR ATAQUE):
  // Botão 0 (A / Cross): Apenas Confirmar / Selecionar nos Menus! NÃO ataca!
  if (justPressed[0]) { pressed['enter'] = true; }
  // Botão 1 (B / Círculo): Cancelar / Voltar nos Menus
  if (justPressed[1]) { pressed['escape'] = true; }
  // Botão 11 (R3): Radar Minimapa
  if (justPressed[11]) { pressed['n'] = true; }
  // Botão 8 (Select / Back): Menu de Personagem
  if (justPressed[8]) { pressed['tab'] = true; }
  // Botão 9 (Start / Options): Pause
  if (justPressed[9]) { pressed['p'] = true; pressed['start'] = true; }

  // Navegação em Menus com D-Pad ou Toque no Analógico (com auto-repeat suave)
  const navRawL = Boolean(curr[14] || lx < -0.42);
  const navRawR = Boolean(curr[15] || lx > 0.42);
  const navRawU = Boolean(curr[12] || ly < -0.42);
  const navRawD = Boolean(curr[13] || ly > 0.42);

  if (navRawL) {
    if (!gamepadInfo.holdL) {
      pressed['arrowleft'] = true; pressed['a'] = true;
      gamepadInfo.holdL = true; gamepadInfo.repL = 0.28;
    } else {
      gamepadInfo.repL -= dt;
      if (gamepadInfo.repL <= 0) {
        pressed['arrowleft'] = true; pressed['a'] = true;
        gamepadInfo.repL = 0.16;
      }
    }
  } else {
    gamepadInfo.holdL = false;
  }

  if (navRawR) {
    if (!gamepadInfo.holdR) {
      pressed['arrowright'] = true; pressed['d'] = true;
      gamepadInfo.holdR = true; gamepadInfo.repR = 0.28;
    } else {
      gamepadInfo.repR -= dt;
      if (gamepadInfo.repR <= 0) {
        pressed['arrowright'] = true; pressed['d'] = true;
        gamepadInfo.repR = 0.16;
      }
    }
  } else {
    gamepadInfo.holdR = false;
  }

  if (navRawU) {
    if (!gamepadInfo.holdU) {
      pressed['arrowup'] = true; pressed['w'] = true;
      gamepadInfo.holdU = true; gamepadInfo.repU = 0.28;
    } else {
      gamepadInfo.repU -= dt;
      if (gamepadInfo.repU <= 0) {
        pressed['arrowup'] = true; pressed['w'] = true;
        gamepadInfo.repU = 0.16;
      }
    }
  } else {
    gamepadInfo.holdU = false;
  }

  if (navRawD) {
    if (!gamepadInfo.holdD) {
      pressed['arrowdown'] = true; pressed['s'] = true;
      gamepadInfo.holdD = true; gamepadInfo.repD = 0.28;
    } else {
      gamepadInfo.repD -= dt;
      if (gamepadInfo.repD <= 0) {
        pressed['arrowdown'] = true; pressed['s'] = true;
        gamepadInfo.repD = 0.16;
      }
    }
  } else {
    gamepadInfo.holdD = false;
  }

  // ATENÇÃO: NUNCA definir keys[' '] = true para não travar o ataque do teclado!
  gpState = { moveX, moveY, hasAim, aimAngle, attackHold, attackJust, dashJust, ultJust, justPressed, curr };
  return gpState;
}

function gamepadRumble(weak = 0.3, strong = 0.3, duration = 120) {
  try {
    const gp = pollGamepad(0);
    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
      gp.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: clamp(weak, 0, 1),
        strongMagnitude: clamp(strong, 0, 1),
      }).catch(() => {});
    }
  } catch (e) {}
}

function drawGamepadToast() {
  if (gamepadInfo.toastTimer <= 0) return;
  const a = Math.min(1, gamepadInfo.toastTimer, (3.5 - gamepadInfo.toastTimer) * 4);
  ctx.save();
  ctx.globalAlpha = a;
  const tw = Math.min(460, W - 40), th = 38;
  const tx = W / 2 - tw / 2, ty = 18;
  ctx.fillStyle = 'rgba(12, 16, 26, 0.94)';
  ctx.strokeStyle = gamepadInfo.connected ? '#4fe3ff' : '#ff5d5d';
  ctx.lineWidth = 2;
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 8); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillRect(tx, ty, tw, th); ctx.strokeRect(tx, ty, tw, th);
  }
  ctx.fillStyle = gamepadInfo.connected ? '#7fe8ff' : '#ff8585';
  ctx.font = '9px ' + FONT;
  ctx.textAlign = 'center';
  const prefix = gamepadInfo.connected ? '🎮 CONTROLE CONECTADO: ' : '❌ ';
  ctx.fillText(prefix + gamepadInfo.toastName.toUpperCase(), W / 2, ty + 24);
  ctx.restore();
}

