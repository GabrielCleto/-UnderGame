// =====================================================================
//  DEFINIÇÃO E ANIMAÇÃO DOS PERSONAGENS (Full-HD Original • Grade Alinhada LibreSprite)
// =====================================================================
function makeGridAnim(cw, ch, ay, counts) {
  const mk = (row, n) => Array.from({ length: n }, (_, i) => ({ x: i * cw, y: row * ch, w: cw, h: ch, ax: cw / 2, ay }));
  const anim = {
    idle:     mk(0, counts.idle),
    idleSide: mk(1, counts.idleSide),
    idleUp:   mk(2, counts.idleUp),
    walkDown: mk(3, counts.walkDown),
    walkSide: mk(4, counts.walkSide),
    walkUp:   mk(5, counts.walkUp),
    spin:     mk(6, counts.spin),
    attack:   mk(7, counts.attack),
  };
  if (counts.ult) {
    anim.ult   = mk(8, counts.ult);
    anim.hurt  = mk(9, counts.hurt);
    anim.death = mk(10, counts.death);
  } else {
    anim.hurt  = mk(8, counts.hurt);
  }
  return anim;
}

// 1. MANGUINHA V2 (Full-HD 128x128 • 11 animações completas: Walk costas, Dash ciano, Combo Sabre, Fúria, Dano & Morte)
const ANIM_MANGUINHA = makeGridAnim(128, 128, 114, { idle: 9, idleSide: 4, idleUp: 4, walkDown: 10, walkSide: 12, walkUp: 6, spin: 6, attack: 6, ult: 3, hurt: 2, death: 3 });

// 2. AMXRAL (Full-HD 96x112 • 9 animações completas)
const ANIM_AMXRAL = makeGridAnim(96, 112, 104, { idle: 7, idleSide: 4, idleUp: 4, walkDown: 6, walkSide: 11, walkUp: 6, spin: 6, attack: 6, hurt: 3 });

// 3. TUIUBA (Full-HD 96x112 • 9 animações completas)
const ANIM_TUIUBA = makeGridAnim(96, 112, 104, { idle: 8, idleSide: 4, idleUp: 4, walkDown: 10, walkSide: 9, walkUp: 6, spin: 7, attack: 8, hurt: 3 });

// 4. NYX (Sombra Arcana — Pixel Art 12-Color Palette / LibreSprite Ready)
const ANIM_NYX = {
  idle: [
    {x:0, y:0, w:64, h:64, ax:32, ay:60},
    {x:64, y:0, w:64, h:64, ax:32, ay:60},
    {x:128, y:0, w:64, h:64, ax:32, ay:60},
    {x:192, y:0, w:64, h:64, ax:32, ay:60},
  ],
  idleSide: [{x:0, y:128, w:64, h:64, ax:32, ay:60}],
  idleUp: [{x:0, y:192, w:64, h:64, ax:32, ay:60}],
  walkDown: [
    {x:0, y:64, w:64, h:64, ax:32, ay:60},
    {x:64, y:64, w:64, h:64, ax:32, ay:60},
    {x:128, y:64, w:64, h:64, ax:32, ay:60},
    {x:192, y:64, w:64, h:64, ax:32, ay:60},
  ],
  walkSide: [
    {x:0, y:128, w:64, h:64, ax:32, ay:60},
    {x:64, y:128, w:64, h:64, ax:32, ay:60},
    {x:128, y:128, w:64, h:64, ax:32, ay:60},
    {x:192, y:128, w:64, h:64, ax:32, ay:60},
  ],
  walkUp: [
    {x:0, y:192, w:64, h:64, ax:32, ay:60},
    {x:64, y:192, w:64, h:64, ax:32, ay:60},
    {x:128, y:192, w:64, h:64, ax:32, ay:60},
    {x:192, y:192, w:64, h:64, ax:32, ay:60},
  ],
  spin: [
    {x:0, y:256, w:64, h:64, ax:32, ay:60},
    {x:64, y:256, w:64, h:64, ax:32, ay:60},
    {x:128, y:256, w:64, h:64, ax:32, ay:60},
    {x:192, y:256, w:64, h:64, ax:32, ay:60},
  ],
  attack: [
    {x:0, y:320, w:64, h:64, ax:32, ay:60},
    {x:64, y:320, w:64, h:64, ax:32, ay:60},
    {x:128, y:320, w:64, h:64, ax:32, ay:60},
    {x:192, y:320, w:64, h:64, ax:32, ay:60},
  ],
};

const CHARACTERS = [
  {
    id: 'manguinha',
    name: 'Manguinha',
    title: 'Garoto Comum',
    weaponType: 'saber',
    attackName: 'Corte de Sabre',
    ultName: 'Fúria do Sabre',
    desc: 'Equilibrado e letal a curta distância. Seu sabre de luz corta inimigos e rebate projéteis com precisão!',
    speedMod: 1.0,
    hpMod: 6,
    dmgMod: 1,
    imgKey: 'player_manguinha',
    portraitKey: 'portrait_manguinha',
    anim: ANIM_MANGUINHA,
    scale: 1.50,
  },
  {
    id: 'amxral',
    name: 'Amxral',
    title: 'Estrela do Bloco',
    weaponType: 'star',
    attackName: 'Estrela Cintilante',
    ultName: 'Chuva Estelar',
    desc: 'Mestre do ataque à distância. Arremessa estrelas cadentes amarelas que perfuram os inimigos!',
    speedMod: 1.08,
    hpMod: 6,
    dmgMod: 1,
    imgKey: 'player_amxral',
    portraitKey: 'portrait_amxral',
    anim: ANIM_AMXRAL,
    scale: 0.98,
  },
  {
    id: 'tuiuba',
    name: 'Tuiuba',
    title: 'Orange Jui',
    weaponType: 'orange',
    attackName: 'Tiro de Laranja',
    ultName: 'Explosão Cítrica',
    desc: 'Veloz e explosivo! Arremessa laranjas que detonam em suco cítrico causando dano em área.',
    speedMod: 1.12,
    hpMod: 6,
    dmgMod: 1,
    imgKey: 'player_tuiuba',
    portraitKey: 'portrait_tuiuba',
    anim: ANIM_TUIUBA,
    scale: 1.05,
  },
  {
    id: 'nyx',
    name: 'Nyx',
    title: 'Sombra Arcana',
    weaponType: 'void_blade',
    attackName: 'Lâmina Espectral',
    ultName: 'Tempestade do Vazio',
    desc: 'Assassina arcana ultra-veloz! Dispara lâminas espectrais perfurantes que rasgam hordas inteiras.',
    speedMod: 1.15,
    hpMod: 5,
    dmgMod: 1.25,
    imgKey: 'player_nyx',
    portraitKey: 'portrait_nyx',
    anim: ANIM_NYX,
    scale: 1.55,
  }
];

let selectedCharIndex = +localStorage.getItem('gabriel_char_index') || 0;

function drawCharacterFrame(charObj, f, x, y, flip, white = 0, opts = null) {
  ctx.save();
  const bobY = opts && opts.bobY ? opts.bobY : 0;
  ctx.translate(Math.round(x), Math.round(y + bobY));
  if (opts && opts.tilt) ctx.rotate(opts.tilt);
  if (flip) ctx.scale(-1, 1);
  if (opts && (opts.squashX || opts.squashY)) ctx.scale(opts.squashX || 1, opts.squashY || 1);
  const sc = charObj.scale * (f.sc || 1);
  const dx = Math.round(-f.ax * sc), dy = Math.round(-f.ay * sc);
  const dw = Math.round(f.w * sc), dh = Math.round(f.h * sc);
  const img = IMG[charObj.imgKey];
  const wimg = WHITE[charObj.imgKey];
  if (opts && opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
  if (white > 0 && wimg) {
    ctx.globalAlpha = (opts && opts.alpha !== undefined ? opts.alpha : 1) * white;
    if (opts && opts.additive) ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(wimg, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
  }
  ctx.restore();
}

