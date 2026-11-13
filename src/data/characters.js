// =====================================================================
//  DEFINIÇÃO E ANIMAÇÃO DOS PERSONAGENS (Âncoras Pixel-Perfect)
// =====================================================================
// 1. MANGUINHA (Garoto Comum)
const ANIM_MANGUINHA = {
  idle: [{x:260, y:11, w:45, h:59, ax:21.5, ay:59}, {x:312, y:11, w:46, h:60, ax:22.5, ay:60}, {x:368, y:11, w:45, h:61, ax:21.0, ay:61}, {x:420, y:11, w:44, h:60, ax:22.6, ay:60}, {x:477, y:11, w:45, h:60, ax:22.1, ay:60}, {x:530, y:11, w:48, h:60, ax:23.2, ay:60}, {x:584, y:11, w:47, h:60, ax:24.0, ay:60}, {x:641, y:11, w:45, h:60, ax:22.1, ay:60}, {x:696, y:11, w:44, h:60, ax:21.8, ay:60}],
  idleSide: [{x:17, y:144, w:41, h:60, ax:18.9, ay:60}],
  idleUp: [{x:17, y:211, w:41, h:61, ax:18.2, ay:61}],
  walkDown: [{x:144, y:78, w:40, h:58, ax:17.9, ay:58}, {x:195, y:78, w:46, h:58, ax:22.1, ay:58}, {x:255, y:78, w:42, h:59, ax:20.1, ay:59}, {x:309, y:79, w:43, h:58, ax:20.4, ay:58}, {x:367, y:79, w:43, h:58, ax:19.5, ay:58}, {x:420, y:79, w:45, h:57, ax:21.2, ay:57}, {x:473, y:78, w:45, h:60, ax:20.9, ay:60}, {x:525, y:78, w:47, h:60, ax:22.1, ay:60}],
  walkSide: [{x:126, y:144, w:41, h:59, ax:20.4, ay:59}, {x:180, y:144, w:39, h:59, ax:18.3, ay:59}, {x:234, y:144, w:40, h:59, ax:17.7, ay:59}, {x:285, y:144, w:38, h:60, ax:18.3, ay:60}, {x:339, y:144, w:40, h:59, ax:19.3, ay:59}, {x:393, y:144, w:40, h:59, ax:17.7, ay:59}, {x:446, y:144, w:40, h:59, ax:18.0, ay:59}, {x:498, y:144, w:40, h:59, ax:18.6, ay:59}, {x:551, y:144, w:39, h:59, ax:18.3, ay:59}, {x:604, y:144, w:39, h:59, ax:18.3, ay:59}, {x:659, y:144, w:39, h:59, ax:18.0, ay:59}, {x:713, y:144, w:41, h:59, ax:19.0, ay:59}, {x:763, y:144, w:41, h:59, ax:20.2, ay:59}, {x:820, y:144, w:41, h:59, ax:18.2, ay:59}],
  walkUp: [{x:65, y:211, w:43, h:61, ax:22.6, ay:61}, {x:122, y:211, w:42, h:60, ax:19.4, ay:60}, {x:174, y:211, w:43, h:61, ax:20.5, ay:61}, {x:228, y:210, w:43, h:62, ax:21.0, ay:62}, {x:280, y:211, w:42, h:61, ax:21.6, ay:61}, {x:336, y:211, w:40, h:60, ax:18.9, ay:60}, {x:387, y:211, w:42, h:59, ax:21.0, ay:59}, {x:440, y:211, w:42, h:60, ax:21.5, ay:60}, {x:492, y:211, w:44, h:61, ax:22.1, ay:61}, {x:546, y:211, w:42, h:61, ax:21.3, ay:61}, {x:602, y:211, w:39, h:61, ax:18.4, ay:61}, {x:653, y:211, w:44, h:59, ax:20.5, ay:59}, {x:707, y:210, w:44, h:61, ax:19.8, ay:61}, {x:758, y:210, w:45, h:62, ax:21.7, ay:62}, {x:814, y:211, w:42, h:61, ax:19.7, ay:61}],
  spin: [{x:230, y:289, w:58, h:63, ax:22.9, ay:58}, {x:299, y:286, w:58, h:66, ax:25.3, ay:61}, {x:370, y:285, w:58, h:67, ax:27.4, ay:62}, {x:441, y:283, w:58, h:69, ax:28.4, ay:64}, {x:508, y:283, w:59, h:69, ax:29.2, ay:64}, {x:574, y:286, w:58, h:66, ax:30.5, ay:61}, {x:642, y:287, w:60, h:66, ax:31.6, ay:61}, {x:714, y:289, w:58, h:64, ax:34.2, ay:59}],
  attack: [{x:157, y:358, w:54, h:84, ax:24.6, ay:84}, {x:739, y:373, w:67, h:69, ax:20.2, ay:69}, {x:871, y:370, w:73, h:72, ax:19.6, ay:72}, {x:157, y:358, w:54, h:84, ax:24.6, ay:84}],
};

// 2. AMXRAL (Estrela do Bloco)
const ANIM_AMXRAL = {
  idle: [{x:290, y:13, w:50, h:94, ax:24.6, ay:94}, {x:352, y:13, w:44, h:93, ax:19.9, ay:93}, {x:407, y:13, w:45, h:94, ax:21.3, ay:94}, {x:464, y:13, w:44, h:94, ax:22.8, ay:94}, {x:521, y:13, w:45, h:94, ax:20.8, ay:94}, {x:577, y:13, w:45, h:94, ax:20.6, ay:94}, {x:640, y:13, w:47, h:94, ax:21.7, ay:94}],
  idleSide: [{x:122, y:123, w:46, h:90, ax:18.8, ay:90}],
  idleUp: [{x:75, y:339, w:43, h:93, ax:20.9, ay:93}],
  walkDown: [{x:699, y:580, w:48, h:85, ax:19.1, ay:85, sc:1.08}, {x:764, y:582, w:52, h:85, ax:20.7, ay:85, sc:1.08}, {x:834, y:584, w:43, h:87, ax:17.4, ay:87, sc:1.08}, {x:901, y:582, w:51, h:86, ax:20.0, ay:86, sc:1.08}, {x:834, y:584, w:43, h:87, ax:17.4, ay:87, sc:1.08}, {x:764, y:582, w:52, h:85, ax:20.7, ay:85, sc:1.08}],
  walkSide: [{x:119, y:228, w:54, h:89, ax:30.9, ay:89, sc:1.03}, {x:196, y:228, w:56, h:89, ax:30.1, ay:89, sc:1.03}, {x:269, y:227, w:55, h:90, ax:30.6, ay:90, sc:1.03}, {x:343, y:228, w:53, h:91, ax:28.6, ay:91, sc:1.03}, {x:412, y:229, w:57, h:90, ax:30.2, ay:90, sc:1.03}, {x:487, y:228, w:57, h:91, ax:30.4, ay:91, sc:1.03}, {x:559, y:228, w:54, h:91, ax:26.8, ay:91, sc:1.03}, {x:625, y:228, w:51, h:91, ax:26.5, ay:91, sc:1.03}, {x:690, y:228, w:53, h:89, ax:27.6, ay:89, sc:1.03}, {x:760, y:230, w:53, h:88, ax:27.4, ay:88, sc:1.03}, {x:839, y:229, w:54, h:88, ax:29.1, ay:88, sc:1.03}],
  walkUp: [{x:75, y:339, w:43, h:93, ax:20.9, ay:93}, {x:151, y:339, w:39, h:93, ax:18.5, ay:93}, {x:222, y:340, w:42, h:92, ax:19.0, ay:92}, {x:292, y:340, w:42, h:92, ax:19.0, ay:92}],
  spin: [{x:351, y:450, w:53, h:86, ax:26.1, ay:90}, {x:419, y:446, w:57, h:86, ax:26.9, ay:90}, {x:488, y:446, w:55, h:90, ax:25.9, ay:94}, {x:557, y:452, w:51, h:92, ax:23.6, ay:96}],
  attack: [{x:494, y:576, w:50, h:87, ax:19.9, ay:87, sc:1.08}, {x:555, y:574, w:44, h:89, ax:17.3, ay:89, sc:1.08}, {x:608, y:575, w:71, h:91, ax:39.8, ay:91, sc:1.08}, {x:699, y:580, w:48, h:81, ax:19.0, ay:81, sc:1.08}],
};

// 3. TUIUBA (Orange Jui)
const ANIM_TUIUBA = {
  idle: [{x:114, y:20, w:46, h:92, ax:21.9, ay:92, sc:0.92}, {x:169, y:20, w:44, h:92, ax:21.2, ay:92, sc:0.92}, {x:218, y:20, w:40, h:91, ax:18.8, ay:91, sc:0.92}, {x:270, y:20, w:42, h:92, ax:19.6, ay:92, sc:0.92}, {x:321, y:20, w:42, h:91, ax:20.1, ay:91, sc:0.92}, {x:371, y:20, w:41, h:91, ax:20.0, ay:91, sc:0.92}, {x:421, y:20, w:41, h:91, ax:19.5, ay:91, sc:0.92}, {x:470, y:20, w:41, h:90, ax:19.2, ay:90, sc:0.92}],
  idleSide: [{x:582, y:124, w:42, h:85, ax:21.9, ay:85}],
  idleUp: [{x:652, y:119, w:43, h:87, ax:22.7, ay:87}],
  walkDown: [{x:7, y:220, w:44, h:82, ax:21.9, ay:82}, {x:66, y:220, w:50, h:83, ax:25.4, ay:83}, {x:130, y:220, w:47, h:82, ax:23.7, ay:82}, {x:188, y:221, w:49, h:80, ax:27.3, ay:80}, {x:249, y:220, w:51, h:83, ax:28.7, ay:83}, {x:318, y:221, w:46, h:82, ax:24.0, ay:82}, {x:376, y:222, w:50, h:82, ax:27.9, ay:82}, {x:442, y:222, w:48, h:83, ax:25.1, ay:83}, {x:508, y:224, w:50, h:81, ax:26.1, ay:81}, {x:570, y:224, w:53, h:80, ax:28.6, ay:80}, {x:633, y:225, w:49, h:79, ax:27.4, ay:79}, {x:701, y:226, w:45, h:79, ax:23.9, ay:79}],
  walkSide: [{x:10, y:124, w:46, h:84, ax:24.9, ay:84}, {x:68, y:123, w:50, h:85, ax:27.6, ay:85}, {x:124, y:123, w:56, h:84, ax:30.1, ay:84}, {x:189, y:124, w:50, h:84, ax:27.1, ay:84}, {x:246, y:124, w:48, h:84, ax:27.6, ay:84}, {x:302, y:124, w:50, h:84, ax:27.5, ay:84}, {x:360, y:124, w:52, h:82, ax:27.7, ay:82}, {x:427, y:124, w:51, h:86, ax:29.2, ay:86}, {x:501, y:124, w:51, h:84, ax:29.0, ay:84}],
  walkUp: [{x:652, y:119, w:43, h:87, ax:22.7, ay:87}, {x:724, y:119, w:43, h:87, ax:21.5, ay:87}, {x:795, y:119, w:45, h:87, ax:22.4, ay:87}, {x:863, y:119, w:47, h:87, ax:21.9, ay:87}, {x:934, y:120, w:45, h:87, ax:22.3, ay:87}],
  spin: [{x:407, y:517, w:63, h:65, ax:37.6, ay:65, sc:1.05}, {x:495, y:517, w:50, h:69, ax:26.5, ay:69, sc:1.05}, {x:571, y:520, w:63, h:64, ax:35.8, ay:64, sc:1.05}],
  attack: [{x:320, y:321, w:50, h:83, ax:28.2, ay:83}, {x:385, y:322, w:51, h:83, ax:29.3, ay:83}, {x:438, y:325, w:55, h:83, ax:33.8, ay:83}, {x:502, y:328, w:50, h:78, ax:27.5, ay:78}, {x:563, y:332, w:68, h:75, ax:31.9, ay:75}],
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
    scale: 1.6,
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
    scale: 1.1,
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
    scale: 1.18,
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

