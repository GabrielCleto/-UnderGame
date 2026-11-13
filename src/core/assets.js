// =====================================================================
//  ASSETS & IMAGENS (Carregador Otimizado)
// =====================================================================
const IMG = {}, WHITE = {};
const IMAGE_LIST = {
  // Personagens & Retratos
  player_manguinha: 'assets/sprites/characters/personagem_transparente.png',
  player_amxral: 'assets/sprites/characters/amxral_transparente.png',
  player_tuiuba: 'assets/sprites/characters/tuiuba_transparente.png',
  portrait_manguinha: 'assets/sprites/characters/manguinha_portrait.png',
  portrait_amxral: 'assets/sprites/characters/amxral_portrait.png',
  portrait_tuiuba: 'assets/sprites/characters/tuiuba_portrait.png',
  manguinha_atk: 'assets/sprites/characters/manguinha_attack_strip.png',

  // Projéteis Especiais
  terraria_star: 'assets/icons/terraria_star.png',
  orange_ball: 'assets/icons/orange_pure.png',
  orange_splash: 'assets/icons/orange_splash.png',

  // Mundo & Cenário
  grass: 'assets/sprites/world/grass.png',
  grassalt: 'assets/sprites/world/grassalt.png',
  dirt: 'assets/sprites/world/dirt.png',
  water: 'assets/sprites/world/water.png',
  treetop: 'assets/sprites/world/treetop.png',
  trunk: 'assets/sprites/world/trunk.png',
  rock: 'assets/sprites/world/rock.png',
  barrel: 'assets/sprites/world/barrel.png',
};

const MONSTER_SPRITES = [
  'slime', 'bat', 'bee', 'snake', 'small_worm', 'eyeball', 'ghost',
  'big_worm', 'man_eater_flower', 'pumpking',
  'chaos_imp', 'void_spider', 'boss_void_overlord', 'boss_magma_colossus'
];
MONSTER_SPRITES.forEach(m => {
  IMAGE_LIST['m_' + m] = `assets/sprites/monsters/${m}.png`;
});

[
  'I_GoldCoin', 'I_Sapphire', 'I_Ruby', 'P_Red01', 'P_Red02', 'A_Shoes03', 'Ac_Ring01', 'I_Clock', 'I_Clover', 'S_Buff04',
  'S_Buff08', 'S_Fire01', 'S_Fire02', 'S_Ice01', 'S_Holy01', 'S_Light01', 'S_Light02', 'S_Light03', 'S_Light04', 'S_Magic02',
  'I_Chest01', 'A_Armour01', 'I_Diamond', 'heart_full', 'heart_empty', 'S_Dagger03', 'S_Earth01', 'S_Axe03', 'I_Book',
  'Ac_Medal01', 'S_Buff01', 'S_Buff03', 'S_Magic03', 'S_Magic04', 'P_Medicine01'
].forEach(i => (IMAGE_LIST['i_' + i] = `assets/icons/${i}.png`));

function makeWhite(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

let loaded = 0, total = Object.keys(IMAGE_LIST).length, ready = false;
const loadPromises = Object.entries(IMAGE_LIST).map(([k, src]) => new Promise(res => {
  const im = new Image();
  im.onload = () => { IMG[k] = im; loaded++; res(); };
  im.onerror = () => { console.warn('Falha ao carregar imagem:', src); loaded++; res(); };
  im.src = src;
}));
Promise.all([...loadPromises, document.fonts ? document.fonts.load('16px "Press Start 2P"').catch(() => { }) : null]).then(() => {
  for (const k in IMG) {
    if (k.startsWith('player_') || k.startsWith('m_')) {
      WHITE[k] = makeWhite(IMG[k]);
    }
  }
  // Alias sem prefixo m_ para compatibilidade direta e zero duplicação de memória
  MONSTER_SPRITES.forEach(m => {
    IMG[m] = IMG['m_' + m];
    WHITE[m] = WHITE['m_' + m];
  });
  buildWorld();
  ready = true;
});
