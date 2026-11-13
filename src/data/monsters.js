// =====================================================================
//  MONSTROS
// =====================================================================
const MON = {
  slime: { img: 'slime', fw: 32, fh: 32, hp: 3, speed: 75, r: 15, dmg: 1, xp: 1, score: 10, scale: 1.6, shadow: true },
  worm: { img: 'small_worm', fw: 32, fh: 32, hp: 2, speed: 85, r: 12, dmg: 1, xp: 1, score: 8, scale: 1.5, shadow: true },
  bat: { img: 'bat', fw: 32, fh: 32, hp: 1, speed: 150, r: 12, dmg: 1, xp: 1, score: 12, scale: 1.5, fly: true },
  bee: { img: 'bee', fw: 32, fh: 32, hp: 2, speed: 110, r: 12, dmg: 1, xp: 2, score: 15, scale: 1.5, fly: true },
  snake: { img: 'snake', fw: 32, fh: 32, hp: 3, speed: 110, r: 14, dmg: 1, xp: 2, score: 15, scale: 1.6, shadow: true },
  eyeball: { img: 'eyeball', fw: 32, fh: 38, hp: 3, speed: 85, r: 14, dmg: 1, xp: 2, score: 20, scale: 1.5, fly: true },
  ghost: { img: 'ghost', fw: 40, fh: 46, hp: 5, speed: 95, r: 16, dmg: 1, xp: 3, score: 25, scale: 1.4, fly: true },
  bigworm: { img: 'big_worm', fw: 35, fh: 50, hp: 15, speed: 48, r: 22, dmg: 2, xp: 6, score: 60, scale: 1.7, shadow: true },
  flower: { img: 'man_eater_flower', fw: 60, fh: 76, hp: 14, speed: 0, r: 24, dmg: 1, xp: 6, score: 60, scale: 1.3, shadow: true },
  bomber: { img: 'slime', fw: 32, fh: 32, hp: 4, speed: 138, r: 15, dmg: 2, xp: 3, score: 30, scale: 1.55, shadow: true },
  viper: { img: 'snake', fw: 32, fh: 32, hp: 5, speed: 132, r: 14, dmg: 1, xp: 3, score: 32, scale: 1.7, shadow: true },
  sniper: { img: 'eyeball', fw: 32, fh: 38, hp: 5, speed: 75, r: 15, dmg: 2, xp: 4, score: 40, scale: 1.65, fly: true },
  necromancer: { img: 'ghost', fw: 40, fh: 46, hp: 9, speed: 72, r: 18, dmg: 1, xp: 5, score: 55, scale: 1.65, fly: true },
  golem: { img: 'pumpking', fw: 46, fh: 46, hp: 45, speed: 58, r: 24, dmg: 2, xp: 12, score: 120, scale: 1.85, shadow: true },
  goblin: { img: 'small_worm', fw: 32, fh: 32, hp: 28, speed: 172, r: 16, dmg: 0, xp: 15, score: 350, scale: 1.9, shadow: true },
  boss: { img: 'pumpking', fw: 46, fh: 46, hp: 480, speed: 88, r: 42, dmg: 2, xp: 50, score: 850, scale: 3.2, shadow: true, bossName: 'REI ABÓBORA', isBoss: true },
  leviathan: { img: 'big_worm', fw: 35, fh: 50, hp: 620, speed: 100, r: 44, dmg: 3, xp: 65, score: 1100, scale: 3.1, shadow: true, bossName: 'LEVIATÃ ABISSAL', isBoss: true },
  chaos_imp: { img: 'chaos_imp', fw: 32, fh: 32, hp: 8, speed: 125, r: 14, dmg: 2, xp: 3, score: 35, scale: 1.5, fly: true },
  void_spider: { img: 'void_spider', fw: 40, fh: 32, hp: 12, speed: 140, r: 16, dmg: 2, xp: 4, score: 40, scale: 1.4, shadow: true },
  boss_void_overlord: { img: 'boss_void_overlord', fw: 64, fh: 64, hp: 550, speed: 72, r: 40, dmg: 3, xp: 70, score: 1200, scale: 2.3, isBoss: true, bossName: 'SOBERANO DO VAZIO', shadow: true },
  boss_magma_colossus: { img: 'boss_magma_colossus', fw: 64, fh: 64, hp: 720, speed: 56, r: 44, dmg: 4, xp: 85, score: 1400, scale: 2.4, isBoss: true, bossName: 'COLOSSO DE MAGMA', shadow: true },
  necro_boss: { img: 'ghost', fw: 40, fh: 46, hp: 580, speed: 88, r: 38, dmg: 2, xp: 75, score: 1100, scale: 2.8, fly: true, shadow: true, bossName: 'SOBERANO NECROMANTE', isBoss: true },
  hydra_boss: { img: 'man_eater_flower', fw: 60, fh: 76, hp: 680, speed: 54, r: 44, dmg: 3, xp: 85, score: 1300, scale: 2.35, shadow: true, bossName: 'IMPERATRIZ CARNÍVORA', isBoss: true },
  beholder_boss: { img: 'eyeball', fw: 32, fh: 38, hp: 780, speed: 84, r: 42, dmg: 3, xp: 95, score: 1500, scale: 3.3, fly: true, shadow: true, bossName: 'OLHO ASTRAL SUPREMO', isBoss: true },
  carminite_ghast: { img: 'carminite_ghast', fw: 32, fh: 32, hp: 10, speed: 112, r: 15, dmg: 2, xp: 4, score: 42, scale: 1.55, fly: true },
  twilight_lich: { img: 'twilight_lich', fw: 64, fh: 64, hp: 640, speed: 78, r: 40, dmg: 3, xp: 85, score: 1350, scale: 2.3, fly: true, shadow: true, bossName: 'LICH DO CREPÚSCULO', isBoss: true },
  aether_slider: { img: 'aether_slider', fw: 64, fh: 64, hp: 760, speed: 68, r: 42, dmg: 4, xp: 90, score: 1450, scale: 2.2, shadow: true, bossName: 'COLOSSO RÚNICO (SLIDER)', isBoss: true },
};

const BESTIARY_LORE = {
  slime: {
    name: 'Slime Ácido',
    title: 'Criatura Gelatinosa',
    desc: 'Salta em direção ao herói em pequenos arcos. Fraco sozinho, mas perigoso em grandes enxames.',
    lore: 'Nascidos da seiva corrompida das raízes da arena, os slimes absorvem restos de batalhas antigas e se multiplicam sem cessar.'
  },
  worm: {
    name: 'Verme das Cavernas',
    title: 'Rastejante Subterrâneo',
    desc: 'Avança rapidamente pelo solo em grupos numerosos para cercar o jogador.',
    lore: 'Escavadores cegos que seguem as vibrações de passos e lâminas, surgindo sempre que o chão treme com sangue.'
  },
  bat: {
    name: 'Morcego Sombrio',
    title: 'Predador Alado',
    desc: 'Voa em alta velocidade com trajetórias erráticas, dificultando ataques lentos.',
    lore: 'Habitantes dos tetos abobadados da masmorra, descem em revoadas famintas atraídos pelo brilho de almas e sabres.'
  },
  bee: {
    name: 'Abelha Ferrão',
    title: 'Enxame Venenoso',
    desc: 'Circula em voo ágil e investe com picadas rápidas em bando.',
    lore: 'Mutadas pelo pólen arcano das flores carnívoras, defendem a arena como se fosse sua colmeia ancestral.'
  },
  snake: {
    name: 'Serpente Rasteira',
    title: 'Caçadora Ágil',
    desc: 'Desliza em zigue-zague rápido buscando flanquear o campeão.',
    lore: 'Répteis de escamas frias criados entre pedras rúnicas; dizem que suas presas guardam o veneno de antigos guardiões.'
  },
  eyeball: {
    name: 'Olho Errante',
    title: 'Sentinela Arcano',
    desc: 'Flutua mantendo distância média e dispara projéteis de energia sombria.',
    lore: 'Órgãos arrancados de titãs adormecidos e reanimados por feitiçaria para vigiar cada movimento dentro da arena.'
  },
  ghost: {
    name: 'Espectro Errante',
    title: 'Alma Penada',
    desc: 'Atravessa o campo flutuando e lança rajadas fantasmagóricas.',
    lore: 'Guerreiros que tombaram sem glória e ficaram presos entre os muros da arena, condenados a enfrentar novos desafiantes.'
  },
  bigworm: {
    name: 'Verme Colossal',
    title: 'Devorador de Pedra',
    desc: 'Enterra-se no chão e emerge de surpresa perto do jogador com alta resistência.',
    lore: 'Tão antigo quanto as fundações do subsolo, suas placas quitinosas já quebraram incontáveis espadas.'
  },
  flower: {
    name: 'Planta Carnívora',
    title: 'Guardiã Imóvel',
    desc: 'Fica enraizada no terreno e cospe projéteis mortais em quem se aproxima.',
    lore: 'Sementes trazidas de pântanos esquecidos que florescem apenas onde a magia do vazio se mistura ao solo fértil.'
  },
  bomber: {
    name: 'Slime Volátil',
    title: 'Bomba Viva',
    desc: 'Corre em disparada e explode violentamente ao morrer ou encostar no herói.',
    lore: 'Slimes que engoliram pólvora alquímica e brasas vivas; seu núcleo instável brilha segundos antes da detonação.'
  },
  viper: {
    name: 'Víbora Abissal',
    title: 'Serpente Tóxica',
    desc: 'Mais rápida e resistente que a serpente comum, ataca sem piedade em grupo.',
    lore: 'Criadas nas fendas mais profundas, seu sangue ácido corrói armaduras e deixa rastros de veneno.'
  },
  sniper: {
    name: 'Olho Atirador',
    title: 'Artilheiro Astral',
    desc: 'Mantém grande distância e dispara projéteis velozes e precisos.',
    lore: 'Uma evolução rara do Olho Errante, dotada de pupila cristalina capaz de enxergar o ponto fraco do alvo a léguas.'
  },
  necromancer: {
    name: 'Necromante',
    title: 'Invocador Sombrio',
    desc: 'Evita combate direto enquanto conjura magias e reforça a horda com mortos-vivos.',
    lore: 'Membros de um culto proibido que barganhou a própria carne por domínio sobre os ecos dos caídos.'
  },
  golem: {
    name: 'Golem Abóbora',
    title: 'Colosso Blindado',
    desc: 'Tanque pesado com vida elevada e golpes devastadores corpo a corpo.',
    lore: 'Armaduras vivas esculpidas com abóboras amaldiçoadas e ferro negro para esmagar invasores imprudentes.'
  },
  goblin: {
    name: 'Goblin Tesoureiro',
    title: 'Saqueador Veloz',
    desc: 'Foge em alta velocidade pela arena! Abata-o antes que escape para ganhar muito ouro.',
    lore: 'Colecionador ganancioso que invade a arena apenas para pilhar moedas e rubis dos campeões distraídos.'
  },
  chaos_imp: {
    name: 'Diabrete do Caos',
    title: 'Demônio Menor',
    desc: 'Voa em alta velocidade e dispara faíscas infernais contra o jogador.',
    lore: 'Espíritos travessos escapados das forjas do Nether; riem enquanto ateiam fogo ao campo de batalha.'
  },
  void_spider: {
    name: 'Aranha do Vazio',
    title: 'Caçadora Dimensional',
    desc: 'Investe com saltos velozes e movimentos imprevisíveis.',
    lore: 'Tecelãs de teias invisíveis oriundas de fendas espaciais, capazes de rastrear o calor de qualquer ser vivo.'
  },
  carminite_ghast: {
    name: 'Ghast de Carminita',
    title: 'Sentinela Carmesim',
    desc: 'Flutua acima dos obstáculos e lança projéteis explosivos de carminita.',
    lore: 'Construtos espectrais alimentados por cristais vermelhos instáveis das torres do crepúsculo.'
  },
  boss: {
    name: 'Rei Abóbora',
    title: 'Soberano da Colheita Maldita',
    desc: 'Alterna investidas brutais, saltos esmagadores e chuvas de projéteis flamejantes.',
    lore: 'Antigo espírito da floresta corrompido por rituais de outono. Sua coroa pulsa com o terror de mil colheitas sombrias.'
  },
  leviathan: {
    name: 'Leviatã Abissal',
    title: 'Serpente das Profundezas',
    desc: 'Escava e cruza a arena em alta velocidade deixando ondas de choque mortais.',
    lore: 'Monarca subterrâneo que devorou cidades inteiras abaixo da superfície antes de despertar na Arena Ancestral.'
  },
  boss_void_overlord: {
    name: 'Soberano do Vazio',
    title: 'Senhor das Fendas',
    desc: 'Dispara padrões arcanos em espiral e invoca servos dimensionais durante a luta.',
    lore: 'Uma entidade sem rosto que observa o mundo pelo lado avesso da realidade, dobrando o espaço ao seu redor.'
  },
  boss_magma_colossus: {
    name: 'Colosso de Magma',
    title: 'Titã da Forja Eterna',
    desc: 'Extremamente resistente; desfere impactos sísmicos e erupções de fogo.',
    lore: 'Forjado no coração de um vulcão primordial, cada passo seu derrete a pedra e transforma a arena em brasa.'
  },
  necro_boss: {
    name: 'Soberano Necromante',
    title: 'Grão-Mestre da Morte',
    desc: 'Conjura rajadas espectrais e ergue legiões de espectros para cercar o campeão.',
    lore: 'O fundador da ordem sombria. Mesmo após séculos sem coração, sua vontade mantém legiões inteiras de pé.'
  },
  hydra_boss: {
    name: 'Imperatriz Carnívora',
    title: 'Rainha das Raízes',
    desc: 'Dispara saraivadas venenosas em leque e envenena o solo ao seu redor.',
    lore: 'A planta-mãe que originou toda a flora hostil da arena; suas raízes bebem diretamente das linhas ley.'
  },
  beholder_boss: {
    name: 'Olho Astral Supremo',
    title: 'Vigia Onisciente',
    desc: 'Dispara feixes e anéis contínuos de energia astral em múltiplas direções.',
    lore: 'O olho central de uma constelação caída, cujo olhar transforma medo em raios arcanos puros.'
  },
  twilight_lich: {
    name: 'Lich do Crepúsculo',
    title: 'Arquimago Imortal',
    desc: 'Teleporta-se pelo campo protegido por escudos enquanto lança magias do crepúsculo.',
    lore: 'Um rei feiticeiro que aprisionou a própria alma em um grimório eterno para governar a noite infinita.'
  },
  aether_slider: {
    name: 'Colosso Rúnico (Slider)',
    title: 'Guardião do Éter',
    desc: 'Desliza em linha reta com força imparável e desencadeia ondas rúnicas ao colidir.',
    lore: 'Bloco monolítico esculpido pelos arquitetos do céu antigo; move-se apenas para esmagar quem ousa profanar o templo.'
  },
};

const BESTIARY_ORDER = [
  ...Object.keys(MON).filter(k => !MON[k].isBoss),
  ...Object.keys(MON).filter(k => MON[k].isBoss),
];


// =====================================================================
//  INIMIGOS & SPAWN (Balanceamento Progressivo & Variedade de Arquétipos)
// =====================================================================
function isBossType(t) {
  return Boolean(MON[t] && MON[t].isBoss);
}

function wavePool() {
  if (waveEvent === 'swarm') return pick(['bat', 'slime', 'bee', 'worm', 'viper', 'chaos_imp']);
  if (waveEvent === 'void_eclipse') return pick(['void_spider', 'chaos_imp', 'ghost', 'eyeball']);
  if (waveEvent === 'magma_surge') return pick(['chaos_imp', 'bomber', 'snake', 'golem']);
  const p = [['slime', 5], ['worm', 3]];
  if (wave >= 2) p.push(['bat', 3], ['snake', 2], ['chaos_imp', 3]);
  if (wave >= 3) p.push(['bee', 2], ['bomber', 2], ['void_spider', 3]);
  if (wave >= 4) p.push(['eyeball', 2], ['bigslime', 1], ['viper', 2], ['chaos_imp', 2], ['carminite_ghast', 2]);
  if (wave >= 6) p.push(['ghost', 2], ['flower', 1], ['sniper', 2], ['void_spider', 2]);
  if (wave >= 7) p.push(['bigworm', 2], ['necromancer', 2], ['chaos_imp', 2]);
  if (wave >= 9) p.push(['golem', 2], ['sniper', 2], ['bomber', 3], ['void_spider', 2]);
  if (wave >= 12) p.push(['golem', 3], ['necromancer', 3], ['bigslime', 2], ['chaos_imp', 3]);
  const tot = p.reduce((a, b) => a + b[1], 0);
  let r = Math.random() * tot;
  for (const [t, w] of p) { if ((r -= w) <= 0) return t; }
  return 'slime';
}

