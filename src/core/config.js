// =====================================================================
//  UNDERGROUND GAME  —  Ação Roguelite Top-Down no Navegador
//  Personagens: Manguinha, Amxral e Tuiuba
// =====================================================================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;
var cam = null;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

function getCamZoom() {
  if (H <= 450) {
    // Celular em modo paisagem (ex: 844x390, 896x414): afasta a câmera para abrir bem o campo de visão!
    return clamp(H / 540, 0.65, 0.76);
  }
  if (W <= 480) {
    // Celular em modo retrato (ex: 390x844)
    return clamp(W / 560, 0.70, 0.82);
  }
  if (H <= 620) {
    // Telas médias
    return clamp(H / 660, 0.80, 0.92);
  }
  return 1.0;
}

function resize() {
  W = canvas.width = window.innerWidth || document.documentElement.clientWidth;
  H = canvas.height = window.innerHeight || document.documentElement.clientHeight;
  ctx.imageSmoothingEnabled = false;
  if (typeof cam !== 'undefined' && cam) cam.zoom = getCamZoom();
  if (window.__touchReady) updateTouchLayout();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

const FONT = '"Press Start 2P", monospace';
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];


// =====================================================================
//  SABRE DE LUZ CORES
// =====================================================================
const SABER_COLORS = [
  { name: 'Azul Celeste', hex: '#3aa2ff', glow: 'rgba(60,160,255,', blade: '#bfe8ff' },
  { name: 'Verde Esmeralda', hex: '#3aff75', glow: 'rgba(60,255,120,', blade: '#c2ffd5' },
  { name: 'Roxo Estelar', hex: '#c844ff', glow: 'rgba(200,70,255,', blade: '#f2c8ff' },
  { name: 'Laranja Flamejante', hex: '#ff7728', glow: 'rgba(255,120,40,', blade: '#ffe0b2' },
  { name: 'Rubi Sith', hex: '#ff264a', glow: 'rgba(255,40,70,', blade: '#ffccd4' },
];
let saberColorIndex = +localStorage.getItem('gabriel_saber_color') || 0;

