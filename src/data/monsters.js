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

