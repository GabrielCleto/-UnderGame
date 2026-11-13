// =====================================================================
//  ESTADO GLOBAL
// =====================================================================
let state = 'loading'; // loading | menu | select_char | play | levelup | shop | pause | over
let player, stats, ups, enemies, ebullets, pshots, particles, pickups, texts, slashes, bolts;
let shrines = [], hazards = [], fxRings = [], afterimages = [], puddles = [];
let shake, freeze, wave, waveTimer, toSpawn, spawnTimer, score, coins, kills, banner, time, playTime;
let trauma = 0.0;
function addTrauma(amt) { trauma = Math.min(1.0, trauma + amt); shake = Math.max(shake, amt * 8); }
let waveEvent = null, meteorTimer = 0, minimapOn = true;
let levelChoices, levelSel, boss, bossCount;
let best = +localStorage.getItem('gabriel_best2') || 0;
let soulEssences = +localStorage.getItem('gabriel_essences') || 0;
let soulUps = JSON.parse(localStorage.getItem('gabriel_soul_ups') || '{"vigor":0,"fury":0,"revive":0}');
const BIOMES = [
  { name: 'FLORESTA ANCESTRAL', edge: 'rgba(3, 7, 16, 0.60)', tint: null },
  { name: 'CIDADELA DE MAGMA', edge: 'rgba(72, 16, 2, 0.68)', tint: 'rgba(255, 65, 15, 0.08)' },
  { name: 'ABISMO DO VAZIO', edge: 'rgba(32, 4, 62, 0.72)', tint: 'rgba(130, 35, 220, 0.09)' },
  { name: 'CREPÚSCULO SOMBRIO', edge: 'rgba(10, 26, 38, 0.68)', tint: 'rgba(30, 140, 180, 0.07)' },
];
let currentBiome = 0;
let rerollsUsed = 0;
let bansLeft = 1;
let bannedUpgrades = new Set();
let totalDamageDealt = 0;
let maxCombo = 0;
let bestiaryKills = JSON.parse(localStorage.getItem('gabriel_bestiary') || '{}');

function reset() {
  keys[' '] = false;
  buildWorld();
  const curChar = CHARACTERS[selectedCharIndex];
  const vigorBonus = (soulUps.vigor || 0) * 2;
  const furyBonus = (soulUps.fury || 0) * 0.15;
  stats = {
    dmg: curChar.dmgMod, atkRate: 1, speed: 220 * curChar.speedMod, maxHp: curChar.hpMod + vigorBonus, range: 1,
    furyMul: 1 + furyBonus, coinMul: 1 + (soulUps.fury || 0) * 0.1,
    revivesLeft: (soulUps.revive || 0) > 0 ? 1 : 0,
    dashCd: 0.95, dashDmg: 2, crit: 0.08, magnet: 110, wave: 0, fire: 0, bolt: 0, ice: 0,
    earth: 0, phantom: 0, multi: 0, axe: 0, aegis: 0, critNova: 0,
    vortex: 0, venom: 0, berserk: 0, ricochet: 0, armor: 0,
    luck: 0, vamp: 0, invTime: 1.0, nukeNext: false
  };
  ups = {};
  shopBuys = {};
  player = {
    char: curChar,
    x: WORLD.w / 2, y: WORLD.h / 2, dir: 'down', flip: false, moving: false, aim: Math.PI / 2,
    hp: curChar.hpMod + vigorBonus, inv: 0, animT: 0, idleT: 0, attack: null, attackCd: 0, dash: null, dashCd: 0,
    ult: null, ultMeter: 0, combo: 0, comboT: 0, bestStreakMilestone: 0,
    level: 1, xp: 0, xpNext: 6, pendingLevels: 0,
    fireAng: 0, boltT: 2, iceT: 0, earthT: 3, phantomT: 1.5, axeT: 1.4, aegisT: 12, vortexT: 3.5,
    frenzyT: 0, shields: 0, ghostT: 0, stepT: 0, goblinT: 16, prefix: null, ironskinT: 0, thornsT: 0, starTimer: 5.0,
  };
  enemies = []; ebullets = []; pshots = []; particles = []; pickups = []; texts = []; slashes = []; bolts = [];
  shrines = []; hazards = []; fxRings = []; afterimages = []; puddles = [];
  waveEvent = null; meteorTimer = 0;
  cam = { x: player.x, y: player.y, zoom: getCamZoom() }; shake = 0; freeze = 0;
  currentBiome = 0; rerollsUsed = 0; bansLeft = 1; bannedUpgrades = new Set(); totalDamageDealt = 0; maxCombo = 0;
  wave = 0; waveTimer = 1.0; toSpawn = 0; spawnTimer = 0; boss = null; bossCount = 0;
  score = 0; coins = 0; kills = 0; banner = null; time = 0; playTime = 0;
  hudGhostHp = player.hp; hudGhostXp = 0;
  refillBarrels(15);
}

