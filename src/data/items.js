// =====================================================================
//  MELHORIAS (Level Up & Sinergias Despertas)
// =====================================================================
const UPGRADES = [
  { id: 'dmg', name: 'Poder Puro', icon: 'S_Buff08', max: 5, desc: l => '+1 de dano no ataque principal', apply: s => (s.dmg += 1) },
  { id: 'rate', name: 'Mãos Rápidas', icon: 'I_Clock', max: 5, desc: l => 'Ataques +14% mais rápidos', apply: s => (s.atkRate *= 1.14) },
  { id: 'multi', name: 'Ataque Múltiplo', icon: 'S_Light04', max: 3, desc: l => '+1 projétil em leque ou corte extra de sabre', apply: s => (s.multi = (s.multi || 0) + 1) },
  { id: 'speed', name: 'Tênis Turbo', icon: 'A_Shoes03', max: 5, desc: l => 'Anda +10% mais rápido', apply: s => (s.speed *= 1.10) },
  { id: 'hp', name: 'Coração Extra', icon: 'S_Holy01', max: 5, desc: l => '+1 coração máximo e cura 3 de vida', apply: (s, p) => { s.maxHp += 2; p.hp = Math.min(s.maxHp, p.hp + 6); } },
  { id: 'range', name: 'Alcance Ampliado', icon: 'S_Light01', max: 4, desc: l => 'Alcance do golpe/projéteis +16%', apply: s => (s.range *= 1.16) },
  { id: 'wave', name: 'Onda Cósmica', icon: 'S_Magic02', max: 5, desc: l => ['Cada ataque dispara uma onda cósmica', 'Ondas atravessam mais inimigos', '3 ondas em leque', 'Ondas maiores e com dano elevado', '★ DESPERTAR: Supernova Cósmica 360°!'][l], apply: s => (s.wave += 1) },
  { id: 'fire', name: 'Bolas de Fogo', icon: 'S_Fire02', max: 5, desc: l => l === 4 ? '★ DESPERTAR: Sol Solar Supremo que queima tudo!' : (l === 0 ? 'Uma bola de fogo te orbita' : '+1 bola de fogo orbitando'), apply: s => (s.fire += 1) },
  { id: 'bolt', name: 'Raio em Cadeia', icon: 'S_Light02', max: 5, desc: l => l === 4 ? '★ DESPERTAR: Tempestade de Thor (raios duplos e paralisia)!' : (l === 0 ? 'Raios caem nos inimigos' : 'Raios mais frequentes e saltam +1'), apply: s => (s.bolt += 1) },
  { id: 'axe', name: 'Machado Bumerangue', icon: 'S_Axe03', max: 4, desc: l => l === 3 ? '★ DESPERTAR: Guilhotina Espiral Gigante!' : (l === 0 ? 'Lança machados giratórios que voltam até você' : '+1 machado bumerangue e mais dano'), apply: s => (s.axe = (s.axe || 0) + 1) },
  { id: 'ice', name: 'Aura de Gelo', icon: 'S_Ice01', max: 4, desc: l => l === 3 ? '★ DESPERTAR: Zero Absoluto (congela inimigos na aura)!' : (l === 0 ? 'Desacelera e fere quem chega perto' : 'Aura maior e mais gelada'), apply: s => (s.ice += 1) },
  { id: 'earth', name: 'Tremor Sísmico', icon: 'S_Earth01', max: 4, desc: l => (l === 0 ? 'A cada 4.5s um choque atordoa e fere em área' : 'Choque sísmico com maior raio e força'), apply: s => (s.earth = (s.earth || 0) + 1) },
  { id: 'phantom', name: 'Lâminas Fantasmas', icon: 'S_Dagger03', max: 4, desc: l => l === 3 ? '★ DESPERTAR: Exército Espectral Perfurante!' : (l === 0 ? 'Adagas de luz perseguem o inimigo mais próximo' : '+1 adaga automática e mais veloz'), apply: s => (s.phantom = (s.phantom || 0) + 1) },
  { id: 'vortex', name: 'Vórtice Abissal', icon: 'S_Magic04', max: 4, desc: l => (l === 0 ? 'Cria buracos negros que puxam e esmagam inimigos' : 'Vórtice maior, mais forte e mais frequente'), apply: s => (s.vortex = (s.vortex || 0) + 1) },
  { id: 'venom', name: 'Peçonha Letal', icon: 'P_Medicine01', max: 4, desc: l => (l === 0 ? 'Ataques envenenam inimigos e explodem ao morrer' : 'Veneno mais letal e explosão tóxica maior'), apply: s => (s.venom = (s.venom || 0) + 1) },
  { id: 'berserk', name: 'Sangue Berserker', icon: 'S_Fire01', max: 4, desc: l => 'Ganha até +45% velocidade de ataque conforme seu Combo ou vida baixa', apply: s => (s.berserk = (s.berserk || 0) + 1) },
  { id: 'ricochet', name: 'Cristal de Eco', icon: 'I_Diamond', max: 3, desc: l => 'Ataques têm 25% de chance por nível de disparar um raio de eco em outro alvo', apply: s => (s.ricochet = (s.ricochet || 0) + 1) },
  { id: 'aegis', name: 'Égide Divina', icon: 'S_Buff03', max: 3, desc: l => (l === 0 ? 'Gera 1 escudo protetor a cada 16s' : 'Escudo recarrega mais rápido e explode forte'), apply: (s, p) => { s.aegis = (s.aegis || 0) + 1; p.shields = Math.min(3, (p.shields || 0) + 1); } },
  { id: 'critNova', name: 'Impacto Arcano', icon: 'S_Magic03', max: 3, desc: l => 'Acertos críticos explodem causando dano em área', apply: s => (s.critNova = (s.critNova || 0) + 1) },
  { id: 'luck', name: 'Trevo da Sorte', icon: 'I_Clover', max: 4, desc: l => '+7% crítico e mais drops raros', apply: s => { s.crit += 0.07; s.luck += 1; } },
  { id: 'magnet', name: 'Anel Ímã', icon: 'Ac_Ring01', max: 3, desc: l => 'Puxa itens de mais longe (+85 alcance)', apply: s => (s.magnet += 85) },
  { id: 'vamp', name: 'Rubi Vampiro', icon: 'I_Ruby', max: 3, desc: l => 'Chance de curar 1 de vida ao derrotar inimigos', apply: s => (s.vamp += 1) },
  { id: 'dash', name: 'Giro Cortante', icon: 'S_Buff04', max: 4, desc: l => 'Giro recarrega 16% mais rápido e causa +2 de dano', apply: s => { s.dashCd *= 0.84; s.dashDmg += 2; } },
  { id: 'armor', name: 'Jaqueta Blindada', icon: 'A_Armour01', max: 3, desc: l => 'Mais tempo invencível após dano e reduz dano pesado em ondas altas', apply: s => { s.invTime += 0.3; s.armor = (s.armor || 0) + 1; } },
  { id: 'bloodOrb', name: 'Orbe de Sangue', icon: 'mod_blood_orb', max: 3, desc: l => 'Blood Magic: +20% dano com vida baixa e cura 1 HP a cada 12 acertos de combo', apply: s => { s.bloodOrb = (s.bloodOrb || 0) + 1; SFX.bloodRite(); } },
  { id: 'infPower', name: 'Joia do Poder', icon: 'mod_gem_power', max: 3, desc: l => 'Joia do Infinito: +25% de dano total e onda cósmica roxa em críticos', apply: s => { s.infPower = (s.infPower || 0) + 1; SFX.bloodRite(); } },
  { id: 'infTime', name: 'Joia do Tempo', icon: 'mod_gem_time', max: 3, desc: l => 'Joia do Infinito: ataques +16% velozes e desacelera projéteis inimigos próximos', apply: s => { s.infTime = (s.infTime || 0) + 1; s.atkRate *= 1.16; s.dashCd *= 0.90; SFX.bloodRite(); } },
];

// =====================================================================
//  TERRARIA REFORGE & PREFIX SYSTEM (Terraria PrefixID.cs)
// =====================================================================
const TERRARIA_PREFIXES = [
  { id: 'legendary', name: 'Lendário', color: '#ffaa2b', dmgMul: 1.25, critAdd: 0.10, speedMul: 1.15, sizeMul: 1.22, kbMul: 1.25, desc: '+25% Dano, +15% Vel., +10% Crítico, +22% Sabre' },
  { id: 'godly',     name: 'Divino',   color: '#ffe855', dmgMul: 1.20, critAdd: 0.08, speedMul: 1.05, sizeMul: 1.15, kbMul: 1.30, desc: '+20% Dano, +8% Crítico, +30% Repulsão' },
  { id: 'demonic',   name: 'Demoníaco',color: '#ff4d6d', dmgMul: 1.22, critAdd: 0.10, speedMul: 1.00, sizeMul: 1.10, kbMul: 1.00, desc: '+22% Dano Bruto, +10% Chance de Crítico' },
  { id: 'unreal',    name: 'Irreal',   color: '#52f6ff', dmgMul: 1.18, critAdd: 0.08, speedMul: 1.20, sizeMul: 1.05, kbMul: 1.15, desc: '+18% Dano, +20% Velocidade de Ataque, +8% Crítico' },
  { id: 'mythical',  name: 'Mítico',   color: '#d66fff', dmgMul: 1.15, critAdd: 0.06, speedMul: 1.12, sizeMul: 1.10, kbMul: 1.10, desc: '+15% Dano, +12% Vel., +6% Crítico, +Regenera Fúria' },
  { id: 'massive',   name: 'Titânico', color: '#7aff61', dmgMul: 1.14, critAdd: 0.04, speedMul: 0.95, sizeMul: 1.35, kbMul: 1.35, desc: '+14% Dano, +35% Alcance Gigantesco do Sabre!' },
  { id: 'ruthless',  name: 'Implacável',color: '#ff7043', dmgMul: 1.28, critAdd: 0.00, speedMul: 1.02, sizeMul: 1.10, kbMul: 0.85, desc: '+28% Dano Destruidor (Poder Absoluto)' },
  { id: 'deadly',    name: 'Mortal',   color: '#ff85b8', dmgMul: 1.16, critAdd: 0.08, speedMul: 1.10, sizeMul: 1.00, kbMul: 1.00, desc: '+16% Dano, +10% Vel., +8% Crítico' },
];

function rollTerrariaPrefix() {
  if (!player) return null;
  const pref = pick(TERRARIA_PREFIXES);
  player.prefix = pref;
  texts.push({ x: player.x, y: player.y - 110, txt: 'Reforja: [' + pref.name + ']!', life: 1.8, color: pref.color, size: 14 });
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: player.x, y: player.y - 30,
      vx: rand(-140, 140), vy: rand(-140, 140),
      life: rand(0.35, 0.75), max: 0.75, color: pref.color, size: rand(3, 7)
    });
  }
  return pref;
}

// =====================================================================
//  LOJA ENTRE ONDAS (Preços Dinâmicos & Inflação Equilibrada)
// =====================================================================
let shopBuys = {};
function getShopCost(item) {
  const n = shopBuys[item.id] || 0;
  return item.baseCost + n * item.stepCost;
}
const SHOP_ITEMS = [
  { id: 'potion', name: 'Frasco de Vida', icon: 'P_Red01', baseCost: 12, stepCost: 6, get cost() { return getShopCost(this); }, desc: 'Recupera 2 corações cheios', buy: (s, p) => { p.hp = Math.min(s.maxHp, p.hp + 4); SFX.potion(); } },
  { id: 'reforge', name: 'Forja Goblin', icon: 'S_Axe03', baseCost: 15, stepCost: 8, get cost() { return getShopCost(this); }, desc: 'Reforja sua arma com prefixos lendários do Terraria (Lendário, Divino, etc.)', buy: (s, p) => { rollTerrariaPrefix(); SFX.level(); } },
  { id: 'ironskin', name: 'Pele de Ferro', icon: 'A_Armour01', baseCost: 14, stepCost: 6, get cost() { return getShopCost(this); }, desc: 'Concede +4 Armadura e corta dano recebido pela metade por 35s', buy: (s, p) => { p.ironskinT = Math.max(p.ironskinT || 0, 35); texts.push({ x: p.x, y: p.y - 95, txt: '🛡 PELE DE FERRO!', life: 1.4, color: '#ffea60', size: 12 }); SFX.potion(); } },
  { id: 'thorns', name: 'Poção Espinhos', icon: 'S_Buff08', baseCost: 15, stepCost: 6, get cost() { return getShopCost(this); }, desc: 'Devolve 100% do dano aos inimigos atacantes por 30s', buy: (s, p) => { p.thornsT = Math.max(p.thornsT || 0, 30); texts.push({ x: p.x, y: p.y - 95, txt: '🌵 ESPINHOS ATIVOS!', life: 1.4, color: '#7aff61', size: 12 }); SFX.potion(); } },
  { id: 'shield_orb', name: 'Orbe de Escudo', icon: 'S_Buff03', baseCost: 18, stepCost: 10, get cost() { return getShopCost(this); }, desc: 'Concede +2 Escudos Orbitais que bloqueiam dano', buy: (s, p) => { p.shields = Math.min(4, (p.shields || 0) + 2); SFX.shrine(); } },
  { id: 'mystery', name: 'Tomo do Destino', icon: 'I_Book', baseCost: 24, stepCost: 14, get cost() { return getShopCost(this); }, desc: 'Concede +100% Fúria, Ímã Global e +10% Crítico na próxima onda', buy: (s, p) => { p.ultMeter = 100; p.frenzyT = Math.max(p.frenzyT, 8); for (const k of pickups) k.pull = true; SFX.ult(); } },
  { id: 'medal', name: 'Medalha Honra', icon: 'Ac_Medal01', baseCost: 42, stepCost: 28, get cost() { return getShopCost(this); }, desc: 'Aumenta permanentemente o dano principal e de giro em +1', buy: (s, p) => { s.dmg += 1; s.dashDmg += 1; SFX.level(); } },
  { id: 'blood_pact', name: 'Pacto de Sangue', icon: 'mod_blood_orb', baseCost: 10, stepCost: 8, get cost() { return getShopCost(this); }, desc: 'Blood Magic: sacrifica 1 coração (se >1) por +1 Dano permanente e 100% Fúria', buy: (s, p) => { if (p.hp > 2) p.hp -= 2; s.dmg += 1; p.ultMeter = 100; SFX.bloodRite(); texts.push({ x: p.x, y: p.y - 95, txt: '🩸 PACTO DE SANGUE!', life: 1.5, color: '#ff385c', size: 13 }); } },
  { id: 'gauntlet', name: 'Manopla do Infinito', icon: 'mod_gauntlet', baseCost: 55, stepCost: 35, get cost() { return getShopCost(this); }, desc: 'Estalo Cósmico: +2 Dano, +10% Crítico e pulveriza metade dos inimigos ao iniciar onda', buy: (s, p) => { s.dmg += 2; s.crit += 0.10; s.gauntletSnap = true; SFX.bloodRite(); texts.push({ x: p.x, y: p.y - 105, txt: '⚡ ESTALO DO INFINITO!', life: 1.8, color: '#ffd23f', size: 14 }); } },
];
let shopSel = 0;

