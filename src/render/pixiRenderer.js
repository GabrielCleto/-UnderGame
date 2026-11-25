// =====================================================================
//  RENDERIZADOR WEBGL PIXIJS v7.4.2 — ZERO-GC GPU ENGINE
//  Dual-Layer: WebGL (Mundo, Batching GPU, Shaders, Bloom, Partículas)
//            + Canvas 2D (Tipografia nítida, HP bars, HUD & Mira Tática)
// =====================================================================

let usePixi = false;
let pixiApp = null;
let pixiLayers = null;
let pixiVfxAtlas = null;
let pixiPostFilter = null;
let pixiBloomFilter = null;

const pixiBaseTextures = new Map();
const pixiTextures = new Map();
const pixiHexCache = new Map();

let pixiTrees = [];
let pixiRocks = [];
let pixiGroundSprite = null;
let pixiGroundBaseTex = null;
let pixiPlayerSprite = null;
let pixiPlayerFlashSprite = null;

// Pools reutilizáveis (Zero alocações / Zero .destroy() por frame)
let pixiPools = null;

function cssColorToInt(col) {
  if (typeof col === 'number') return col;
  if (!col) return 0xffffff;
  const cached = pixiHexCache.get(col);
  if (cached !== undefined) return cached;

  let res = 0xffffff;
  if (col[0] === '#') {
    if (col.length === 4) {
      const r = col[1], g = col[2], b = col[3];
      res = parseInt(r + r + g + g + b + b, 16) || 0xffffff;
    } else if (col.length >= 7) {
      res = parseInt(col.slice(1, 7), 16) || 0xffffff;
    }
  } else if (col.startsWith('rgb')) {
    const m = col.match(/\d+/g);
    if (m && m.length >= 3) {
      const r = Math.min(255, +m[0] | 0);
      const g = Math.min(255, +m[1] | 0);
      const b = Math.min(255, +m[2] | 0);
      res = (r << 16) | (g << 8) | b;
    }
  }
  if (pixiHexCache.size < 256) pixiHexCache.set(col, res);
  return res;
}

class SpritePool {
  constructor(container, prewarm = 0, blendMode = 0) {
    this.container = container;
    this.blendMode = blendMode;
    this.items = [];
    this.used = 0;
    this.prevUsed = 0;
    for (let i = 0; i < prewarm; i++) {
      const s = new PIXI.Sprite(PIXI.Texture.EMPTY);
      s.visible = false;
      s.blendMode = blendMode;
      container.addChild(s);
      this.items.push(s);
    }
  }

  beginFrame() {
    this.used = 0;
  }

  acquire(tex) {
    let s;
    if (this.used < this.items.length) {
      s = this.items[this.used];
    } else {
      s = new PIXI.Sprite(tex || PIXI.Texture.EMPTY);
      s.blendMode = this.blendMode;
      this.container.addChild(s);
      this.items.push(s);
    }
    this.used++;
    if (tex) s.texture = tex;
    s.visible = true;
    s.alpha = 1;
    s.tint = 0xffffff;
    s.rotation = 0;
    s.zIndex = 0;
    s.anchor.set(0.5, 0.5);
    s.scale.set(1, 1);
    s.blendMode = this.blendMode;
    return s;
  }

  endFrame() {
    for (let i = this.used; i < this.prevUsed; i++) {
      this.items[i].visible = false;
    }
    this.prevUsed = this.used;
  }
}

class ParticlePool {
  constructor(particleContainer, maxSize, defaultTex) {
    this.container = particleContainer;
    this.maxSize = maxSize;
    this.defaultTex = defaultTex;
    this.items = [];
    this.used = 0;
    this.prevUsed = 0;
  }

  beginFrame() {
    this.used = 0;
  }

  acquire(tex) {
    if (this.used >= this.maxSize) return null;
    let s;
    if (this.used < this.items.length) {
      s = this.items[this.used];
    } else {
      s = new PIXI.Sprite(tex || this.defaultTex);
      s.anchor.set(0.5, 0.5);
      this.container.addChild(s);
      this.items.push(s);
    }
    this.used++;
    if (tex) s.texture = tex;
    s.alpha = 1;
    s.tint = 0xffffff;
    s.rotation = 0;
    s.scale.set(1, 1);
    return s;
  }

  endFrame() {
    // Em ParticleContainer v7, alpha=0 + scale=0 descarta os vértices sem precisar destruir
    for (let i = this.used; i < this.prevUsed; i++) {
      const s = this.items[i];
      s.alpha = 0;
      s.scale.set(0, 0);
    }
    this.prevUsed = this.used;
  }
}

function getBaseTextureForKey(imgKey) {
  const existing = pixiBaseTextures.get(imgKey);
  if (existing) return existing;

  let src = null;
  if (imgKey.startsWith('w_')) {
    const k = imgKey.slice(2);
    src = typeof WHITE !== 'undefined' ? WHITE[k] : null;
  } else {
    src = typeof IMG !== 'undefined' ? IMG[imgKey] : null;
  }
  if (!src) return null;
  if (src instanceof HTMLImageElement && (!src.complete || src.naturalWidth === 0)) return null;
  if (src instanceof HTMLCanvasElement && src.width === 0) return null;

  try {
    const res = src instanceof HTMLCanvasElement ? new PIXI.CanvasResource(src) : src;
    const baseTex = src instanceof HTMLCanvasElement
      ? new PIXI.BaseTexture(res, { scaleMode: PIXI.SCALE_MODES.NEAREST, mipmap: PIXI.MIPMAP_MODES.OFF })
      : PIXI.BaseTexture.from(src, { scaleMode: PIXI.SCALE_MODES.NEAREST, mipmap: PIXI.MIPMAP_MODES.OFF });
    pixiBaseTextures.set(imgKey, baseTex);
    return baseTex;
  } catch (e) {
    return null;
  }
}

function getPixiTexture(imgKey, sx, sy, sw, sh) {
  const baseTex = getBaseTextureForKey(imgKey);
  if (!baseTex) return null;

  if (sx === undefined || sw === undefined) {
    const fullKey = `${imgKey}_FULL`;
    let tex = pixiTextures.get(fullKey);
    if (!tex) {
      tex = new PIXI.Texture(baseTex);
      pixiTextures.set(fullKey, tex);
    }
    return tex;
  }

  const rx = Math.round(sx), ry = Math.round(sy), rw = Math.round(sw), rh = Math.round(sh);
  if (rw <= 0 || rh <= 0) return null;
  const cacheKey = `${imgKey}_${rx}_${ry}_${rw}_${rh}`;
  let tex = pixiTextures.get(cacheKey);
  if (tex) return tex;

  try {
    // Clampa ao tamanho da textura para nunca falhar em frames nas bordas
    const maxW = Math.max(1, baseTex.realWidth || baseTex.width || (rx + rw));
    const maxH = Math.max(1, baseTex.realHeight || baseTex.height || (ry + rh));
    const cw = Math.min(rw, Math.max(1, maxW - rx));
    const ch = Math.min(rh, Math.max(1, maxH - ry));
    tex = new PIXI.Texture(baseTex, new PIXI.Rectangle(rx, ry, cw, ch));
    pixiTextures.set(cacheKey, tex);
    return tex;
  } catch (e) {
    return null;
  }
}

function applyPixiQuality() {
  if (!pixiApp || !pixiLayers) return;
  const budget = typeof getGfxBudget === 'function'
    ? getGfxBudget()
    : { useShader: true, useBloomBlur: true, dprCap: 1.5 };

  const targetRes = Math.min(window.devicePixelRatio || 1, budget.dprCap);
  if (Math.abs(pixiApp.renderer.resolution - targetRes) > 0.01) {
    pixiApp.renderer.resolution = targetRes;
    pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
  }

  if (pixiPostFilter && budget.useShader) {
    pixiApp.stage.filters = [pixiPostFilter];
    pixiApp.stage.filterArea = pixiApp.screen;
  } else {
    pixiApp.stage.filters = null;
  }

  if (pixiLayers.bloomGlowLayer) {
    pixiLayers.bloomGlowLayer.filters = (budget.useBloomBlur && pixiBloomFilter) ? [pixiBloomFilter] : null;
  }
}

function initPixiRenderer() {
  if (typeof PIXI === 'undefined') {
    console.warn('PixiJS não detectado, usando renderizador Canvas2D.');
    usePixi = false;
    return false;
  }

  const glCanvas = document.getElementById('webgl-canvas');
  if (!glCanvas) {
    console.warn('#webgl-canvas não encontrado no DOM.');
    usePixi = false;
    return false;
  }

  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
    glCanvas.style.display = 'none';
    usePixi = false;
    console.info('Modo arquivo local (file://): usando motor Canvas 2D Cinematográfico com filtros nativos.');
    return false;
  }

  if (pixiApp) {
    usePixi = true;
    applyPixiQuality();
    return true;
  }

  try {
    PIXI.utils.skipHello();
    const budget = typeof getGfxBudget === 'function' ? getGfxBudget() : { dprCap: 1.5 };
    pixiApp = new PIXI.Application({
      view: glCanvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1d4220,
      antialias: false,
      autoDensity: true,
      autoStart: false, // Loop único controlado por main.js (zero double-render)
      resolution: Math.min(window.devicePixelRatio || 1, budget.dprCap),
      powerPreference: 'high-performance',
    });

    glCanvas.addEventListener('webglcontextlost', (ev) => {
      ev.preventDefault();
      glCanvas.style.display = 'none';
      console.warn('Contexto WebGL perdido, revertendo com segurança para Canvas 2D.');
      usePixi = false;
    });

    const stage = pixiApp.stage;
    stage.sortableChildren = true;

    pixiVfxAtlas = typeof createVfxAtlasTextures === 'function' ? createVfxAtlasTextures() : null;
    pixiPostFilter = typeof createUndergroundPostFilter === 'function' ? createUndergroundPostFilter() : null;
    if (PIXI.BlurFilter) {
      pixiBloomFilter = new PIXI.BlurFilter(3.2, 1, 0.5);
    }

    const world = new PIXI.Container();
    world.sortableChildren = true;
    stage.addChild(world);

    const groundLayer = new PIXI.Container(); groundLayer.zIndex = 0;
    const pondShimmerGfx = new PIXI.Graphics();
    const floorFxLayer = new PIXI.Container(); floorFxLayer.zIndex = 5;
    const floorGraphics = new PIXI.Graphics();
    floorFxLayer.addChild(floorGraphics);

    const shadowPC = new PIXI.ParticleContainer(800, { scale: true, position: true, alpha: true });
    shadowPC.zIndex = 8;

    const pickupLayer = new PIXI.Container(); pickupLayer.zIndex = 12;
    const afterimageLayer = new PIXI.Container(); afterimageLayer.zIndex = 14;
    const entityLayer = new PIXI.Container(); entityLayer.zIndex = 20; entityLayer.sortableChildren = true;
    const propGfx = new PIXI.Graphics(); propGfx.zIndex = 0.1;

    const vfxAddLayer = new PIXI.Container(); vfxAddLayer.zIndex = 30;
    const bloomGlowLayer = new PIXI.Container();
    const slashGraphics = new PIXI.Graphics();
    slashGraphics.blendMode = PIXI.BLEND_MODES.ADD;
    const vfxGlowContainer = new PIXI.Container();
    const shotContainer = new PIXI.Container();
    const ebulletContainer = new PIXI.Container();
    vfxAddLayer.addChild(bloomGlowLayer, vfxGlowContainer, slashGraphics, shotContainer, ebulletContainer);

    const particleNormalPC = new PIXI.ParticleContainer(1200, { scale: true, position: true, rotation: true, uvs: true, tint: true, alpha: true });
    particleNormalPC.zIndex = 34;

    const particleAddPC = new PIXI.ParticleContainer(1200, { scale: true, position: true, rotation: true, uvs: true, tint: true, alpha: true });
    particleAddPC.zIndex = 35;
    particleAddPC.blendMode = PIXI.BLEND_MODES.ADD;

    world.addChild(
      groundLayer,
      floorFxLayer,
      shadowPC,
      pickupLayer,
      afterimageLayer,
      entityLayer,
      vfxAddLayer,
      particleNormalPC,
      particleAddPC
    );

    const defTex = pixiVfxAtlas ? pixiVfxAtlas.pixel : PIXI.Texture.WHITE;
    const glowTex = pixiVfxAtlas ? pixiVfxAtlas.glow : PIXI.Texture.WHITE;
    const shTex = pixiVfxAtlas ? pixiVfxAtlas.shadow : PIXI.Texture.WHITE;

    pixiPools = {
      shadows: new ParticlePool(shadowPC, 800, shTex),
      particlesNorm: new ParticlePool(particleNormalPC, 1200, defTex),
      particlesAdd: new ParticlePool(particleAddPC, 1200, glowTex),
      pickups: new SpritePool(pickupLayer, 64, PIXI.BLEND_MODES.NORMAL),
      pickupGlows: new SpritePool(pickupLayer, 24, PIXI.BLEND_MODES.ADD),
      afterimages: new SpritePool(afterimageLayer, 16, PIXI.BLEND_MODES.ADD),
      props: new SpritePool(entityLayer, 32, PIXI.BLEND_MODES.NORMAL),
      shrines: new SpritePool(entityLayer, 8, PIXI.BLEND_MODES.NORMAL),
      enemies: new SpritePool(entityLayer, 128, PIXI.BLEND_MODES.NORMAL),
      enemyFlash: new SpritePool(entityLayer, 32, PIXI.BLEND_MODES.NORMAL),
      fireballs: new SpritePool(entityLayer, 8, PIXI.BLEND_MODES.NORMAL),
      vfxGlows: new SpritePool(vfxGlowContainer, 96, PIXI.BLEND_MODES.ADD),
      bloomGlows: new SpritePool(bloomGlowLayer, 48, PIXI.BLEND_MODES.ADD),
      shots: new SpritePool(shotContainer, 48, PIXI.BLEND_MODES.NORMAL),
      ebullets: new SpritePool(ebulletContainer, 64, PIXI.BLEND_MODES.NORMAL),
    };

    pixiLayers = {
      world,
      groundLayer,
      pondShimmerGfx,
      floorFxLayer,
      floorGraphics,
      shadowPC,
      pickupLayer,
      afterimageLayer,
      entityLayer,
      propGfx,
      vfxAddLayer,
      bloomGlowLayer,
      slashGraphics,
      vfxGlowContainer,
      shotContainer,
      ebulletContainer,
      particleNormalPC,
      particleAddPC,
    };

    usePixi = true;
    applyPixiQuality();
    console.log('⚡ WebGL PixiJS Engine v2 ativado! (GPU Pools + GLSL Shaders + ParticleContainer)');
    return true;
  } catch (err) {
    console.warn('Falha ao inicializar PixiJS WebGL:', err);
    usePixi = false;
    return false;
  }
}

function buildPixiWorld() {
  if (!usePixi || !pixiLayers) return;

  try {
    const { groundLayer, pondShimmerGfx, entityLayer } = pixiLayers;
    groundLayer.removeChildren();

    if (pixiGroundSprite) {
      try { pixiGroundSprite.destroy({ texture: true, baseTexture: false }); } catch (_) {}
      pixiGroundSprite = null;
    }
    if (pixiGroundBaseTex) {
      try { pixiGroundBaseTex.destroy(); } catch (_) {}
      pixiGroundBaseTex = null;
    }

    const wW = typeof WORLD !== 'undefined' ? WORLD.w : 2400;
    const wH = typeof WORLD !== 'undefined' ? WORLD.h : 1824;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1d4220);
    bg.drawRect(-2000, -2000, wW + 4000, wH + 4000);
    bg.endFill();
    groundLayer.addChild(bg);

    if (typeof ground !== 'undefined' && ground && ground.width > 0) {
      try {
        pixiGroundBaseTex = new PIXI.BaseTexture(new PIXI.CanvasResource(ground), {
          scaleMode: PIXI.SCALE_MODES.NEAREST,
          mipmap: PIXI.MIPMAP_MODES.OFF,
          wrapMode: PIXI.WRAP_MODES.CLAMP,
        });
        pixiGroundSprite = new PIXI.Sprite(new PIXI.Texture(pixiGroundBaseTex));
        groundLayer.addChild(pixiGroundSprite);
      } catch (errGround) {
        console.warn('Textura WebGL do chão não pôde ser criada (modo seguro):', errGround);
      }
    }

    groundLayer.addChild(pondShimmerGfx);

    // Limpa árvores e rochas antigas de restarts anteriores sem destruir pools compartilhados
    for (let i = 0; i < pixiTrees.length; i++) {
      try { pixiTrees[i].cont.destroy({ children: true }); } catch (_) {}
    }
    pixiTrees.length = 0;

    for (let i = 0; i < pixiRocks.length; i++) {
      try { pixiRocks[i].destroy(); } catch (_) {}
    }
    pixiRocks.length = 0;

    if (typeof trees !== 'undefined' && Array.isArray(trees)) {
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const c = t.v % 2, r = t.v < 2 ? 0 : 1, tc = r;
        const trunkTex = getPixiTexture('trunk', tc * 96, 0, 96, 96);
        const topTex = getPixiTexture('treetop', c * 96, r * 96, 96, 96);

        const treeCont = new PIXI.Container();
        treeCont.zIndex = t.y;
        const ox = t.x - 48 * 1.5;
        const oy = t.y - 122 * 1.5;

        if (trunkTex) {
          const trSpr = new PIXI.Sprite(trunkTex);
          trSpr.scale.set(1.5);
          trSpr.position.set(ox, oy + 64 * 1.5);
          treeCont.addChild(trSpr);
        }
        let topSpr = null;
        if (topTex) {
          topSpr = new PIXI.Sprite(topTex);
          topSpr.scale.set(1.5);
          topSpr.position.set(ox, oy);
          treeCont.addChild(topSpr);
        }
        entityLayer.addChild(treeCont);
        pixiTrees.push({ cont: treeCont, topSpr, x: t.x, y: t.y, oy });
      }
    }

    if (typeof rocks !== 'undefined' && Array.isArray(rocks)) {
      for (let i = 0; i < rocks.length; i++) {
        const r = rocks[i];
        const rockTex = r.stack ? getPixiTexture('barrel', 64, 2, 48, 61) : getPixiTexture('rock', 0, 0, 32, 32);
        if (rockTex) {
          const spr = new PIXI.Sprite(rockTex);
          spr.zIndex = r.y;
          if (r.stack) {
            spr.position.set(r.x - 36, r.y - 80);
            spr.width = 72; spr.height = 92;
          } else {
            spr.position.set(r.x - 24, r.y - 40);
            spr.width = 48; spr.height = 48;
          }
          entityLayer.addChild(spr);
          pixiRocks.push(spr);
        }
      }
    }
  } catch (err) {
    console.warn('Falha geral em buildPixiWorld, revertendo para Canvas 2D:', err);
    usePixi = false;
  }
}

function rebuildPixiWorld() {
  buildPixiWorld();
}

function getActiveCamZoom() {
  const baseZ = (typeof cam !== 'undefined' && cam && cam.zoom) || (typeof getCamZoom === 'function' ? getCamZoom() : 1);
  const punch = typeof GPU_FX !== 'undefined' ? GPU_FX.zoomPunchVal : 0;
  const dyn = (typeof cam !== 'undefined' && cam && cam.zoomDyn) || 1;
  return baseZ * (1 + punch) * dyn;
}

function pushShadow(x, y, rx, ry, alpha = 0.28) {
  if (!pixiVfxAtlas || !pixiPools) return;
  const s = pixiPools.shadows.acquire(pixiVfxAtlas.shadow);
  if (!s) return;
  s.position.set(x, y);
  s.scale.set((rx * 2) / 56, (ry * 2) / 26);
  s.alpha = alpha;
}

function renderPixiWorld() {
  if (!usePixi || !pixiApp || !pixiLayers || !pixiPools) return;

  const effZoom = getActiveCamZoom();
  const sx = typeof GPU_FX !== 'undefined' ? GPU_FX.shakeX : 0;
  const sy = typeof GPU_FX !== 'undefined' ? GPU_FX.shakeY : 0;
  const roll = typeof GPU_FX !== 'undefined' ? GPU_FX.shakeRoll : 0;

  const { world, pondShimmerGfx, floorGraphics, entityLayer, slashGraphics } = pixiLayers;
  const cx = typeof cam !== 'undefined' && cam ? cam.x : 1200;
  const cy = typeof cam !== 'undefined' && cam ? cam.y : 900;

  // 1. CÂMERA GPU (Zoom Dinâmico + Trauma Shake sem pixel snap jitter em rotação)
  world.position.set(W / 2 + sx, H / 2 + sy);
  world.pivot.set(cx, cy);
  world.scale.set(effZoom);
  world.rotation = roll;

  const halfW = (W / 2) / effZoom;
  const halfH = (H / 2) / effZoom;
  const viewL = cx - halfW - 140, viewR = cx + halfW + 140;
  const viewT = cy - halfH - 120, viewB = cy + halfH + 180;
  const vis = (x, y) => x > viewL && x < viewR && y > viewT && y < viewB;

  const pools = pixiPools;
  pools.shadows.beginFrame();
  pools.particlesNorm.beginFrame();
  pools.particlesAdd.beginFrame();
  pools.pickups.beginFrame();
  pools.pickupGlows.beginFrame();
  pools.afterimages.beginFrame();
  pools.props.beginFrame();
  pools.shrines.beginFrame();
  pools.enemies.beginFrame();
  pools.enemyFlash.beginFrame();
  pools.fireballs.beginFrame();
  pools.vfxGlows.beginFrame();
  pools.bloomGlows.beginFrame();
  pools.shots.beginFrame();
  pools.ebullets.beginFrame();

  const glowTex = pixiVfxAtlas ? pixiVfxAtlas.glow : PIXI.Texture.WHITE;
  const sparkTex = pixiVfxAtlas ? pixiVfxAtlas.spark : PIXI.Texture.WHITE;
  const pixelTex = pixiVfxAtlas ? pixiVfxAtlas.pixel : PIXI.Texture.WHITE;
  const smokeTex = pixiVfxAtlas ? pixiVfxAtlas.smoke : PIXI.Texture.WHITE;
  const diamondTex = pixiVfxAtlas ? pixiVfxAtlas.diamond : PIXI.Texture.WHITE;

  const curTime = typeof time !== 'undefined' ? time : 0;
  const inPlay = typeof state !== 'undefined' && (state !== 'menu' && state !== 'select_char' && state !== 'soul_shrine' && state !== 'bestiary');

  // 2. REFLEXO ANIMADO NAS LAGOAS + TRANSPARÊNCIA DE COPAS DE ÁRVORE
  pondShimmerGfx.clear();
  slashGraphics.clear();
  if (typeof ponds !== 'undefined') {
    for (let i = 0; i < ponds.length; i++) {
      const pd = ponds[i];
      if (pd.x + pd.w < viewL || pd.x > viewR || pd.y + pd.h < viewT || pd.y > viewB) continue;
      pondShimmerGfx.beginFill(0xa8ebff, 0.14 + 0.06 * Math.sin(curTime * 2.5 + i));
      for (let r = 0; r < 3; r++) {
        const rx = pd.x + 24 + ((i * 53 + r * 67 + Math.sin(curTime * 1.4 + r) * 14) % Math.max(20, pd.w - 48));
        const ry = pd.y + 18 + ((i * 31 + r * 37) % Math.max(16, pd.h - 32));
        pondShimmerGfx.drawRoundedRect(rx, ry, 24 + 8 * Math.sin(curTime * 3 + r), 3, 1.5);
      }
      pondShimmerGfx.endFill();
    }
  }

  for (let i = 0; i < pixiTrees.length; i++) {
    const pt = pixiTrees[i];
    if (!vis(pt.x, pt.y)) {
      pt.cont.visible = false;
      continue;
    }
    pt.cont.visible = true;
    if (pt.topSpr) {
      const behind = inPlay && typeof player !== 'undefined' && player &&
        player.y < pt.y - 10 && player.y > pt.oy && Math.abs(player.x - pt.x) < 70;
      pt.topSpr.alpha = behind ? 0.45 : 1.0;
    }
  }

  // 3. CHÃO FX (Poças cítricas, Ácido, Vórtice Abissal, Aura de Gelo, Santuários e Hazards)
  floorGraphics.clear();

  if (typeof puddles !== 'undefined') {
    for (let i = 0; i < puddles.length; i++) {
      const pd = puddles[i];
      if (!vis(pd.x, pd.y)) continue;
      if (pd.kind === 'vortex') {
        const halo = pools.vfxGlows.acquire(glowTex);
        halo.position.set(pd.x, pd.y);
        halo.scale.set((pd.r * 2.5) / 60, (pd.r * 1.7) / 60);
        halo.tint = 0x9b30ff;
        halo.alpha = 0.55;

        floorGraphics.beginFill(0x1e0537, 0.82);
        floorGraphics.drawEllipse(pd.x, pd.y, pd.r * 0.72, pd.r * 0.45);
        floorGraphics.endFill();
        const pulseR = pd.r * (0.45 + 0.3 * Math.sin(curTime * 8));
        floorGraphics.lineStyle(2.5, 0xdc8cff, 0.8);
        floorGraphics.drawEllipse(pd.x, pd.y, pulseR, pulseR * 0.6);
        floorGraphics.lineStyle(0);
      } else if (pd.kind === 'acid') {
        const a = Math.min(0.62, pd.life * 0.42);
        floorGraphics.beginFill(0x38d64a, a);
        floorGraphics.drawEllipse(pd.x, pd.y, pd.r, pd.r * 0.6);
        floorGraphics.beginFill(0x9eff7a, a * 0.85);
        floorGraphics.drawEllipse(pd.x - pd.r * 0.15, pd.y - 2, pd.r * 0.5, pd.r * 0.28);
        floorGraphics.endFill();
      } else {
        const a = Math.min(0.58, pd.life * 0.42);
        floorGraphics.beginFill(0xff8c1a, a);
        floorGraphics.drawEllipse(pd.x, pd.y, pd.r, pd.r * 0.58);
        floorGraphics.beginFill(0xffd24d, a * 0.85);
        floorGraphics.drawEllipse(pd.x - pd.r * 0.15, pd.y - 2, pd.r * 0.55, pd.r * 0.3);
        floorGraphics.endFill();
      }
    }
  }

  // Aura de Gelo do jogador no solo
  if (inPlay && typeof player !== 'undefined' && player && typeof stats !== 'undefined' && stats.ice > 0) {
    const iceR = 85 + stats.ice * 20;
    floorGraphics.beginFill(0x96dcff, 0.12);
    floorGraphics.lineStyle(2, 0xc8f0ff, 0.48);
    floorGraphics.drawEllipse(player.x, player.y, iceR, iceR * 0.6);
    floorGraphics.endFill();
    floorGraphics.lineStyle(0);
  }

  // Santuários Místicos
  if (typeof shrines !== 'undefined') {
    for (let i = 0; i < shrines.length; i++) {
      const sh = shrines[i];
      if (!vis(sh.x, sh.y)) continue;
      const shInt = cssColorToInt(sh.col);
      const pulse = 0.5 + 0.3 * Math.sin(sh.t * 4);
      floorGraphics.beginFill(shInt, 0.13 + sh.prog * 0.25);
      floorGraphics.lineStyle(3, shInt, 0.55 + pulse * 0.3);
      floorGraphics.drawEllipse(sh.x, sh.y, sh.r, sh.r * 0.62);
      floorGraphics.endFill();
      floorGraphics.lineStyle(0);

      pushShadow(sh.x, sh.y, 18, 7, 0.35);

      const bob = Math.sin(sh.t * 4) * 5;
      if (sh.sprite) {
        const stex = getPixiTexture(sh.sprite);
        if (stex) {
          const sSpr = pools.shrines.acquire(stex);
          sSpr.position.set(sh.x, sh.y - 20);
          sSpr.width = 48; sSpr.height = 48;
          sSpr.zIndex = sh.y;
        }
      }
      if (sh.icon) {
        const itex = getPixiTexture(sh.icon);
        if (itex) {
          const iSpr = pools.shrines.acquire(itex);
          iSpr.position.set(sh.x, (sh.sprite ? sh.y - 57 : sh.y - 26) + bob);
          const isz = sh.sprite ? 22 : 36;
          iSpr.width = isz; iSpr.height = isz;
          iSpr.zIndex = sh.y + 1;
        }
      }
      const gl = pools.vfxGlows.acquire(glowTex);
      gl.position.set(sh.x, sh.y - 24);
      gl.scale.set(2.2, 2.2);
      gl.tint = shInt;
      gl.alpha = 0.28 + sh.prog * 0.35;
    }
  }

  // Perigos / Telegraphs (meteor, fallen_star, boss_nova)
  if (typeof hazards !== 'undefined') {
    for (let i = 0; i < hazards.length; i++) {
      const h = hazards[i];
      const k = clamp(h.t / h.dur, 0, 1);
      if (h.kind === 'boss_nova') {
        floorGraphics.beginFill(0xc33cff, 0.14 + k * 0.28);
        floorGraphics.lineStyle(3, 0xe682ff, 0.65 + 0.35 * Math.sin(h.t * 28));
        floorGraphics.drawEllipse(h.x, h.y, h.r, h.r * 0.65);
        floorGraphics.endFill();
        floorGraphics.lineStyle(0);
        floorGraphics.beginFill(0xdc64ff, 0.32);
        floorGraphics.drawEllipse(h.x, h.y, h.r * k, h.r * 0.65 * k);
        floorGraphics.endFill();
      } else if (h.kind === 'fallen_star') {
        floorGraphics.beginFill(0x64f0ff, 0.15 + k * 0.35);
        floorGraphics.lineStyle(2.5, 0x8cfaff, 0.6 + 0.4 * Math.sin(h.t * 26));
        floorGraphics.drawEllipse(h.targetX, h.targetY, 32 * Math.max(0.15, k), 14 * Math.max(0.15, k));
        floorGraphics.endFill();
        floorGraphics.lineStyle(0);

        const stX = h.curX || h.startX, stY = h.curY || h.startY;
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(stX, stY);
        gl.scale.set(1.6, 1.6);
        gl.tint = 0x7ef8ff;
        gl.alpha = 0.85;

        const starTex = getPixiTexture('terraria_star');
        if (starTex) {
          const st = pools.shots.acquire(starTex);
          st.position.set(stX, stY);
          st.width = 40; st.height = 40;
          st.rotation = curTime * 10;
        }
      } else {
        floorGraphics.beginFill(0xff2814, 0.12 + k * 0.25);
        floorGraphics.lineStyle(3, 0xff5028, 0.6 + 0.4 * Math.sin(h.t * 24));
        floorGraphics.drawEllipse(h.x, h.y, h.r, h.r * 0.62);
        floorGraphics.endFill();
        floorGraphics.lineStyle(0);
        floorGraphics.beginFill(0xff7828, 0.35);
        floorGraphics.drawEllipse(h.x, h.y, h.r * k, h.r * 0.62 * k);
        floorGraphics.endFill();

        if (k > 0.55) {
          const fall = (1 - (k - 0.55) / 0.45) * 420;
          const mx = h.x + fall * 0.35, my = h.y - fall;
          const gl = pools.vfxGlows.acquire(glowTex);
          gl.position.set(mx, my);
          gl.scale.set(1.3, 1.3);
          gl.tint = 0xff8a20;
          gl.alpha = 0.9;
        }
      }
    }
  }

  // 4. PICKUPS (Moedas girando, Gemas, Rubis, Poções, Baús, Orbes Raros, Estrelas)
  if (typeof pickups !== 'undefined' && typeof PICK_ICON !== 'undefined') {
    for (let i = 0; i < pickups.length; i++) {
      const k = pickups[i];
      if (!vis(k.x, k.y)) continue;
      if (k.t > 24 && Math.floor(k.t * 8) % 2 === 0) continue;
      const sz = (typeof PICK_SIZE !== 'undefined' && PICK_SIZE[k.kind]) || 24;
      pushShadow(k.x, k.y, sz * 0.35, sz * 0.14, 0.3);

      const bob = k.kind === 'chest' ? 0 : Math.sin(k.t * 5 + k.x) * 2.5;
      const py = k.y - sz * 0.5 - k.z + bob;

      if (k.kind === 'chest' || k.kind === 'magnet_orb' || k.kind === 'frenzy_orb' || k.kind === 'ice_bomb' || k.kind === 'star' || k.kind === 'ruby') {
        const gcol = k.kind === 'chest' ? 0xffd23c
          : k.kind === 'magnet_orb' ? 0x50e1ff
          : k.kind === 'frenzy_orb' ? 0xff6428
          : k.kind === 'star' ? 0xffee55
          : k.kind === 'ruby' ? 0xff3b6e
          : 0x96f0ff;
        const gl = pools.pickupGlows.acquire(glowTex);
        gl.position.set(k.x, py);
        const rad = k.kind === 'chest' ? 1.85 : 0.95;
        gl.scale.set(rad, rad);
        gl.tint = gcol;
        gl.alpha = 0.45 + 0.2 * Math.sin(curTime * 7 + i);
      }

      const icKey = k.kind === 'coin' ? 'i_I_GoldCoin' : PICK_ICON[k.kind];
      const tex = icKey ? getPixiTexture(icKey) : null;
      if (tex) {
        const spr = pools.pickups.acquire(tex);
        spr.position.set(k.x, py);
        if (k.kind === 'coin') {
          const wScale = Math.max(0.15, Math.abs(Math.cos(k.t * 6 + k.x)));
          spr.width = sz * wScale;
          spr.height = sz;
        } else {
          spr.width = sz;
          spr.height = sz;
        }
      }
    }
  }

  // 5. AFTERIMAGES DO JOGADOR (Fantasmas de Dash & Frenesi)
  if (typeof afterimages !== 'undefined') {
    for (let i = 0; i < afterimages.length; i++) {
      const g = afterimages[i];
      if (!vis(g.x, g.y)) continue;
      const f = g.f;
      const tex = getPixiTexture(g.char.imgKey, f.x, f.y, f.w, f.h);
      if (tex) {
        const spr = pools.afterimages.acquire(tex);
        const sc = g.char.scale * (f.sc || 1);
        spr.anchor.set(f.ax / f.w, f.ay / f.h);
        spr.position.set(g.x, g.y);
        spr.scale.set((g.flip ? -1 : 1) * sc, sc);
        spr.alpha = (g.life / g.max) * 0.48;
        spr.tint = g.char.weaponType === 'orange' ? 0xffaa44
          : g.char.weaponType === 'star' ? 0xffe066
          : cssColorToInt(SABER_COLORS[saberColorIndex].hex);
      }
    }
  }

  // 6. BARRIS / CRISTAIS / TOTENS / LUCKY CHESTS / TNT (Ordenados por Y em entityLayer)
  if (typeof props !== 'undefined') {
    for (let i = 0; i < props.length; i++) {
      const b = props[i];
      if (!vis(b.x, b.y)) continue;
      const sxB = b.hurt > 0 ? (Math.random() - 0.5) * 4 : 0;
      pushShadow(b.x, b.y - 4, 17, 6, 0.3);

      if (b.kind === 'crystal') {
        const pulse = 0.42 + 0.25 * Math.sin(curTime * 7);
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 22);
        gl.scale.set(1.15, 1.35);
        gl.tint = 0x62f6ff;
        gl.alpha = pulse;

        const spr = pools.props.acquire(diamondTex);
        spr.position.set(b.x + sxB, b.y - 22);
        spr.scale.set(0.68, 0.95);
        spr.tint = 0x4fe3ff;
        spr.zIndex = b.y;
      } else if (b.kind === 'totem') {
        const pulse = 0.45 + 0.28 * Math.sin(curTime * 6);
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 26);
        gl.scale.set(1.2, 1.55);
        gl.tint = 0xc844ff;
        gl.alpha = pulse;

        const totTex = getPixiTexture('void_totem');
        if (totTex) {
          const spr = pools.props.acquire(totTex);
          spr.anchor.set(0.5, 1.0);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 46; spr.height = 46;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'lucky') {
        const pulse = 0.38 + 0.24 * Math.sin(curTime * 8);
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 22);
        gl.scale.set(1.3, 1.3);
        gl.tint = 0xffdc32;
        gl.alpha = pulse;

        const luckyTex = getPixiTexture('i_I_Chest01');
        if (luckyTex) {
          const spr = pools.props.acquire(luckyTex);
          spr.anchor.set(0.5, 1.0);
          spr.position.set(b.x + sxB, b.y - 2);
          spr.width = 38; spr.height = 38;
          spr.tint = 0xffe566;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'tnt') {
        const pulse = 0.3 + 0.22 * Math.sin(curTime * 10);
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 22);
        gl.scale.set(1.3, 1.35);
        gl.tint = 0xff4614;
        gl.alpha = pulse;

        const bTex = getPixiTexture('barrel', 2, 10, 28, 38);
        if (bTex) {
          const spr = pools.props.acquire(bTex);
          spr.anchor.set(0.5, 52 / 57);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 42; spr.height = 57;
          spr.tint = 0xff8070;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'pillar') {
        const pTex = getPixiTexture('ruin_pillar');
        if (pTex) {
          const spr = pools.props.acquire(pTex);
          spr.anchor.set(0.5, 42 / 48);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 46; spr.height = 69;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'statue') {
        const sTex = getPixiTexture('hero_statue');
        if (sTex) {
          const spr = pools.props.acquire(sTex);
          spr.anchor.set(0.5, 42 / 48);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 48; spr.height = 72;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'geode') {
        const pulse = 0.45 + 0.3 * Math.sin(curTime * 6);
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 18);
        gl.scale.set(1.3, 1.3);
        gl.tint = 0x50d5ff;
        gl.alpha = pulse;

        const gTex = getPixiTexture('crystal_geode');
        if (gTex) {
          const spr = pools.props.acquire(gTex);
          spr.anchor.set(0.5, 26 / 32);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 46; spr.height = 46;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'shroom') {
        const pulse = 0.35 + 0.25 * Math.sin(curTime * 4 + (b.glow || 0) * 6);
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 12);
        gl.scale.set(0.85, 0.85);
        gl.tint = 0xba45ff;
        gl.alpha = pulse;

        const mTex = getPixiTexture('magic_mushroom');
        if (mTex) {
          const spr = pools.props.acquire(mTex);
          spr.anchor.set(0.5, 20 / 24);
          spr.position.set(b.x, b.y);
          spr.width = 30; spr.height = 30;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'noir_lamp') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 54);
        gl.scale.set(1.75, 1.75);
        gl.tint = 0xfff0cc;
        gl.alpha = 0.42 + 0.1 * Math.sin(curTime * 5);

        const nTex = getPixiTexture('noir_lamp');
        if (nTex) {
          const spr = pools.props.acquire(nTex);
          spr.anchor.set(0.5, 43 / 48);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 36; spr.height = 72;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'blood_obelisk') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 32);
        gl.scale.set(1.6, 1.9);
        gl.tint = 0xff2244;
        gl.alpha = 0.45 + 0.22 * Math.sin(curTime * 6);

        const oTex = getPixiTexture('blood_obelisk');
        if (oTex) {
          const spr = pools.props.acquire(oTex);
          spr.anchor.set(0.5, 43 / 48);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 48; spr.height = 72;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'ice_spire') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 28);
        gl.scale.set(1.5, 1.7);
        gl.tint = 0x7ef4ff;
        gl.alpha = 0.45 + 0.2 * Math.sin(curTime * 5);

        const iTex = getPixiTexture('ice_spire');
        if (iTex) {
          const spr = pools.props.acquire(iTex);
          spr.anchor.set(0.5, 43 / 48);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 48; spr.height = 72;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'solar_monolith') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 46);
        gl.scale.set(1.85, 1.85);
        gl.tint = 0xffae28;
        gl.alpha = 0.55 + 0.25 * Math.sin(curTime * 8);

        const soTex = getPixiTexture('solar_monolith');
        if (soTex) {
          const spr = pools.props.acquire(soTex);
          spr.anchor.set(0.5, 43 / 48);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 48; spr.height = 72;
          spr.zIndex = b.y;
        }
      } else if (b.kind === 'void_rift') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(b.x, b.y - 28);
        gl.scale.set(1.8, 2.1);
        gl.tint = 0xc844ff;
        gl.alpha = 0.5 + 0.25 * Math.sin(curTime * 7 + (b.phase || 0));

        const vTex = getPixiTexture('void_rift');
        if (vTex) {
          const spr = pools.props.acquire(vTex);
          spr.anchor.set(0.5, 0.85);
          spr.position.set(b.x, b.y + Math.sin(curTime * 4 + (b.phase || 0)) * 3);
          spr.width = 64; spr.height = 64;
          spr.zIndex = b.y;
        }
      } else {
        const bTex = getPixiTexture('barrel', 2, 10, 28, 38);
        if (bTex) {
          const spr = pools.props.acquire(bTex);
          spr.anchor.set(0.5, 52 / 57);
          spr.position.set(b.x + sxB, b.y);
          spr.width = 42; spr.height = 57;
          spr.zIndex = b.y;
        }
      }
    }
  }

  // 7. JOGADOR (Sprite pixel-perfect + Hit-flash branco + Auras + Escudos + Bolas de Fogo)
  if (inPlay && typeof player !== 'undefined' && player) {
    const p = player;
    pushShadow(p.x, p.y, 20, 7, 0.36);

    const fBonus = typeof getFeverBonus === 'function' ? getFeverBonus(p) : { tier: 0 };
    if (p.frenzyT > 0 || fBonus.tier >= 2) {
      const frenzyColor = fBonus.tier >= 4 ? 0x62f6ff : fBonus.tier >= 3 ? 0xffd23f : 0xff9828;
      const gl = pools.vfxGlows.acquire(glowTex);
      gl.position.set(p.x, p.y - 28);
      const rad = 1.45 + 0.15 * Math.sin(curTime * 10);
      gl.scale.set(rad, rad);
      gl.tint = frenzyColor;
      gl.alpha = 0.36 + 0.14 * Math.sin(curTime * 12);
    }

    if (p.ult) {
      const R = 195 * stats.range;
      const ultCol = p.char.weaponType === 'orange' ? 0xff8c14
        : p.char.weaponType === 'star' ? 0xffdc3c
        : cssColorToInt(SABER_COLORS[saberColorIndex].hex);
      const gl = pools.vfxGlows.acquire(glowTex);
      gl.position.set(p.x, p.y - 30);
      const ur = (R * 2.1) / 60;
      gl.scale.set(ur, ur);
      gl.tint = ultCol;
      gl.alpha = 0.42;

      const bloom = pools.bloomGlows.acquire(glowTex);
      bloom.position.set(p.x, p.y - 30);
      bloom.scale.set(ur * 0.7, ur * 0.7);
      bloom.tint = ultCol;
      bloom.alpha = 0.5;
    }

    const blinkHide = p.inv > 0 && !p.dash && !p.ult && Math.floor(p.inv * 15) % 2 === 0;
    if (!blinkHide) {
      if (!pixiPlayerSprite) {
        pixiPlayerSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        entityLayer.addChild(pixiPlayerSprite);
      }
      const pf = playerFrame();
      const f = pf.f;
      const sc = p.char.scale * (f.sc || 1);
      const pTex = getPixiTexture(p.char.imgKey, f.x, f.y, f.w, f.h);

      let sqX = 1, sqY = 1;
      if (p.dash) { sqX = 1.15; sqY = 0.88; }
      else if (p.attack) {
        const ak = clamp(p.attack.t / p.attack.dur, 0, 1);
        if (ak > 0.15 && ak < 0.55) { sqX = 1.14; sqY = 0.90; }
      }
      else if (typeof stats !== 'undefined' && p.inv > stats.invTime - 0.14) { sqX = 1.16; sqY = 0.84; }

      if (pTex) {
        pixiPlayerSprite.texture = pTex;
        pixiPlayerSprite.visible = true;
        pixiPlayerSprite.anchor.set(f.ax / f.w, f.ay / f.h);
        pixiPlayerSprite.position.set(p.x, p.y + (pf.bobY || 0));
        pixiPlayerSprite.scale.set((pf.flip ? -1 : 1) * sc * sqX, sc * sqY);
        pixiPlayerSprite.rotation = pf.tilt || 0;
        pixiPlayerSprite.alpha = 1;
        pixiPlayerSprite.zIndex = p.y;

        if (typeof stats !== 'undefined' && p.inv > stats.invTime - 0.12) {
          const wTex = getPixiTexture('w_' + p.char.imgKey, f.x, f.y, f.w, f.h);
          if (wTex) {
            if (!pixiPlayerFlashSprite) {
              pixiPlayerFlashSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
              entityLayer.addChild(pixiPlayerFlashSprite);
            }
            pixiPlayerFlashSprite.texture = wTex;
            pixiPlayerFlashSprite.visible = true;
            pixiPlayerFlashSprite.anchor.set(f.ax / f.w, f.ay / f.h);
            pixiPlayerFlashSprite.position.set(p.x, p.y + (pf.bobY || 0));
            pixiPlayerFlashSprite.scale.set((pf.flip ? -1 : 1) * sc * sqX, sc * sqY);
            pixiPlayerFlashSprite.rotation = pf.tilt || 0;
            pixiPlayerFlashSprite.alpha = 0.8;
            pixiPlayerFlashSprite.zIndex = p.y + 0.05;
          }
        } else if (pixiPlayerFlashSprite) {
          pixiPlayerFlashSprite.visible = false;
        }
      }
    } else {
      if (pixiPlayerSprite) pixiPlayerSprite.visible = false;
      if (pixiPlayerFlashSprite) pixiPlayerFlashSprite.visible = false;
    }

    // Escudos Orbitais do Jogador
    if (p.shields > 0) {
      slashGraphics.lineStyle(2, 0x5ae6ff, 0.3);
      slashGraphics.drawEllipse(p.x, p.y - 36, 35, 44);
      slashGraphics.lineStyle(0);
      for (let i = 0; i < p.shields; i++) {
        const a = curTime * 3.2 + (i * Math.PI * 2) / p.shields;
        const shx = p.x + Math.cos(a) * 34, shy = p.y - 36 + Math.sin(a) * 20;
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(shx, shy);
        gl.scale.set(0.45, 0.45);
        gl.tint = 0x5ae6ff;
        gl.alpha = 0.85;
      }
    }

    // Bolas de Fogo Orbitais
    if (typeof stats !== 'undefined' && stats.fire > 0) {
      const n = stats.fire, R = stats.fire >= 5 ? 92 : 80;
      const fTex = getPixiTexture('i_S_Fire01');
      for (let i = 0; i < n; i++) {
        const a = p.fireAng + i * Math.PI * 2 / n;
        const fx = p.x + Math.cos(a) * R, fy = p.y - 35 + Math.sin(a) * R * 0.8;
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(fx, fy);
        gl.scale.set(0.8, 0.8);
        gl.tint = 0xff7820;
        gl.alpha = 0.65;
        if (fTex) {
          const fspr = pools.fireballs.acquire(fTex);
          fspr.position.set(fx, fy);
          fspr.rotation = a + Math.PI / 2;
          fspr.width = 34; fspr.height = 34;
          fspr.zIndex = fy + 25;
        }
      }
    }
  } else {
    if (pixiPlayerSprite) pixiPlayerSprite.visible = false;
    if (pixiPlayerFlashSprite) pixiPlayerFlashSprite.visible = false;
  }

  // 8. INIMIGOS (Todos os 27+ tipos via d.img, com animação, flip, hit-flash, auras, escudos)
  if (typeof enemies !== 'undefined') {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead || !vis(e.x, e.y)) continue;
      const d = MON[e.type];
      if (!d) continue;

      if (e.burrowed) {
        pushShadow(e.x, e.y, e.r * 1.3, e.r * 0.65, 0.4);
        continue;
      }

      if (e.spawn > 0) {
        slashGraphics.lineStyle(2.5, 0xff4646, 0.45 + 0.35 * Math.sin(e.t * 20));
        slashGraphics.drawEllipse(e.x, e.y, e.r * 1.4, e.r * 0.55);
        slashGraphics.lineStyle(0);
      }

      if (d.shadow) {
        pushShadow(e.x, e.y, e.r * 1.05, e.r * 0.4, 0.3);
      }

      const s = e.scale * (e.spawn > 0 ? Math.max(0.05, 1 - e.spawn / 0.7) : 1);
      let row = e.row, col = 0;
      if (d.single) {
        col = 0; row = 0;
      } else if (e.type === 'chaos_imp' || e.type === 'void_spider' || e.type === 'boss_void_overlord' || e.type === 'boss_magma_colossus') {
        const isAtk = (e.mode === 'shoot' || e.act < 0.35 || e.phase === 'charge');
        const animFrames = isAtk ? [4, 5] : [0, 1, 2, 3];
        const fps = isAtk ? 8 : (e.type === 'chaos_imp' ? 12 : 6);
        col = animFrames[Math.floor(e.t * fps) % animFrames.length];
        row = 0;
      } else if (e.type === 'twilight_lich' || e.type === 'aether_slider' || e.type === 'carminite_ghast') {
        col = Math.floor(e.t * 8) % 4;
        row = 0;
      } else {
        col = Math.floor(e.t * (e.type === 'bat' || e.type === 'bee' ? 12 : 7)) % 3;
      }
      if (e.type === 'slime') col = e.z > 6 ? 2 : e.z > 1 ? 1 : 0;
      if (e.type === 'flower') { row = e.mode === 'open' ? 1 + (Math.floor(e.t * 10) % 3) : 0; col = Math.floor(e.t * 5) % 3; }

      const imgKey = 'm_' + d.img;
      const tex = getPixiTexture(imgKey, col * d.fw, row * d.fh, d.fw, d.fh);
      if (!tex) continue;

      let singleYOff = 0;
      if (d.single) {
        if (d.fly || e.type === 'bomber') singleYOff = Math.sin(e.t * 4.5) * 5;
        else if (e.type !== 'hydra_boss') singleYOff = Math.abs(Math.sin(e.t * 8.5)) * 4;
      }

      const w = d.fw * s, h = d.fh * s;
      const pLeft = typeof player !== 'undefined' && player && player.x < e.x;
      const flipH = e.type === 'goblin'
        ? (typeof player !== 'undefined' && player && player.x > e.x)
        : ((d.single || e.type === 'chaos_imp' || e.type === 'void_spider' || e.type === 'boss_void_overlord') && pLeft);

      let scX = s, scY = s, rot = 0;
      if (d.single) {
        if (e.type === 'bomber') {
          const pSc = 1 + Math.sin(e.t * 14) * 0.08;
          scX *= pSc; scY *= pSc;
        } else if (e.type === 'hydra_boss') {
          const hSc = (e.mode === 'open' ? 1.08 : 1.0) + Math.sin(e.t * 4) * 0.05;
          scX *= hSc; scY *= hSc;
        } else if (!d.fly) {
          rot = Math.sin(e.t * 8.5) * 0.06;
        }
      }
      if (e.hurt > 0) {
        const k = e.hurt / 0.18;
        scX *= (1 + k * 0.22);
        scY *= (1 - k * 0.20);
      }

      const drawX = e.x;
      const drawY = e.y - (e.z || 0) - singleYOff;
      const anchorY = 1.0 - 4 / d.fh;
      const alpha = (e.type === 'ghost' || e.type === 'necro_boss') ? (e.faded ? 0.22 : 0.88) : 1;

      // Aura de elite, chefe ou especial
      const specialAura = e.elite || e.bounty || isBossType(e.type) ||
        e.type === 'bomber' || e.type === 'viper' || e.type === 'sniper' ||
        e.type === 'necromancer' || e.type === 'golem' || e.type === 'goblin';
      if (specialAura) {
        let auraCol = 0xffc83c;
        if (e.type === 'leviathan' || e.type === 'viper' || e.type === 'hydra_boss') auraCol = 0x64ff64;
        else if (e.type === 'bomber') auraCol = 0xff4619;
        else if (e.type === 'necromancer' || e.type === 'necro_boss') auraCol = 0xc350ff;
        else if (e.type === 'sniper' || e.type === 'beholder_boss') auraCol = 0x4be1ff;
        else if (e.type === 'golem') auraCol = 0xff9b37;
        else if (e.type === 'goblin' || e.bounty) auraCol = 0xffdc28;
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(e.x, e.y - h * 0.45);
        gl.scale.set((w * 1.1) / 56, (h * 1.1) / 56);
        gl.tint = auraCol;
        gl.alpha = 0.28 + 0.12 * Math.sin(e.t * 8);
      }

      const spr = pools.enemies.acquire(tex);
      spr.anchor.set(0.5, anchorY);
      spr.position.set(drawX, drawY);
      spr.scale.set(flipH ? -scX : scX, scY);
      spr.rotation = rot;
      spr.alpha = alpha;
      spr.zIndex = e.y;
      spr.tint = e.freezeT > 0 ? 0x88e8ff : (e.poisonT > 0 ? 0x7dff7a : (e.slow > 0 ? 0xaad8ff : 0xffffff));

      if (e.hurt > 0) {
        const wTex = getPixiTexture('w_' + imgKey, col * d.fw, row * d.fh, d.fw, d.fh);
        if (wTex) {
          const fspr = pools.enemyFlash.acquire(wTex);
          fspr.anchor.set(0.5, anchorY);
          fspr.position.set(drawX, drawY);
          fspr.scale.set(flipH ? -scX : scX, scY);
          fspr.rotation = rot;
          fspr.alpha = alpha * Math.min(1, e.hurt / 0.1);
          fspr.zIndex = e.y + 0.05;
        }
      }

      if (e.shieldOn) {
        slashGraphics.lineStyle(3, 0x6eebff, 0.82);
        slashGraphics.drawCircle(e.x, e.y - h * 0.45, e.r * 1.25);
        slashGraphics.lineStyle(0);
      }

      if (e.type === 'twilight_lich' && (e.lichShields || 0) > 0) {
        for (let si = 0; si < e.lichShields; si++) {
          const sa = e.t * 2.4 + (si * Math.PI * 2) / e.lichShields;
          const shx = e.x + Math.cos(sa) * (e.r + 18);
          const shy = e.y - 35 + Math.sin(sa) * 20;
          const gl = pools.vfxGlows.acquire(glowTex);
          gl.position.set(shx, shy);
          gl.scale.set(0.42, 0.55);
          gl.tint = 0xffe05a;
          gl.alpha = 0.85;
        }
      }
    }
  }

  entityLayer.sortChildren();

  // 9. CORTES DE SABRE NEON + ONDAS CÓSMICAS + RAIOS + ANÉIS `fxRings` (BLEND_MODES.ADD)
  const saberObj = typeof SABER_COLORS !== 'undefined' ? SABER_COLORS[saberColorIndex] : { hex: '#3aa2ff' };
  const saberHexInt = cssColorToInt(saberObj.hex);

  if (typeof slashes !== 'undefined' && typeof player !== 'undefined' && player) {
    for (let i = 0; i < slashes.length; i++) {
      const s = slashes[i];
      const k = 1 - s.life / s.max;
      const sx0 = player.x, sy0 = player.y - 38;
      const start = s.a - 1.35 + k * 0.5;
      const end = start + 2.7 * Math.min(1, k * 2.8);
      const R = s.r;
      const widths = [20, 10, 3.5];
      const cols = [saberHexInt, saberHexInt, 0xffffff];
      const alphas = [0.42, 0.82, 0.95];
      const mult = (1 - k * 0.58) * (s.big ? 1.3 : 1);
      const stX = sx0 + Math.cos(start) * R, stY = sy0 + Math.sin(start) * R;

      for (let pass = 0; pass < 3; pass++) {
        slashGraphics.lineStyle(widths[pass] * mult, cols[pass], alphas[pass]);
        slashGraphics.moveTo(stX, stY);
        slashGraphics.arc(sx0, sy0, R, start, end);
      }
      slashGraphics.lineStyle(0);

      // Bloom na ponta do sabre
      const tipX = sx0 + Math.cos(end) * R, tipY = sy0 + Math.sin(end) * R;
      const bgl = pools.bloomGlows.acquire(glowTex);
      bgl.position.set(tipX, tipY);
      bgl.scale.set(1.1, 1.1);
      bgl.tint = saberHexInt;
      bgl.alpha = 0.7 * (1 - k);
    }
  }

  // Raios em Cadeia (`bolts`)
  if (typeof bolts !== 'undefined') {
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const [x1, y1, x2, y2] = b.pts;
      const segs = 7;
      for (let pass = 0; pass < 2; pass++) {
        slashGraphics.lineStyle(pass ? 2.2 : 7.5, pass ? 0xffffff : 0xffe650, Math.min(1, b.life * (pass ? 4 : 3)));
        slashGraphics.moveTo(x1, y1);
        for (let si = 1; si < segs; si++) {
          const t = si / segs;
          const jit = 13 * Math.sin((i + 1) * 19.3 + si * 7.1 + curTime * 55);
          slashGraphics.lineTo(x1 + (x2 - x1) * t + jit, y1 + (y2 - y1) * t + jit * 0.7);
        }
        slashGraphics.lineTo(x2, y2);
      }
      slashGraphics.lineStyle(0);
    }
  }

  // Anéis de Choque & Splash Cítrico (`fxRings`)
  if (typeof fxRings !== 'undefined') {
    for (let i = 0; i < fxRings.length; i++) {
      const r = fxRings[i];
      if (!vis(r.x, r.y)) continue;
      const k = r.max > 0 ? clamp(1 - r.life / r.max, 0, 1) : 1;
      const curR = Math.max(1, r.r + (r.maxR - r.r) * k);
      const a = Math.max(0, 1 - k);
      const colInt = cssColorToInt(r.col || '#ffffff');
      slashGraphics.lineStyle(Math.max(1, r.kind === 'explosion' ? 8 * (1 - k * 0.5) : 4 * (1 - k * 0.5)), colInt, a);
      slashGraphics.drawCircle(r.x, r.y, curR);
      slashGraphics.lineStyle(0);

      if (r.kind === 'orange_splash') {
        const spTex = getPixiTexture('orange_splash');
        if (spTex) {
          const sp = pools.vfxGlows.acquire(spTex);
          sp.position.set(r.x, r.y);
          sp.width = curR * 2; sp.height = curR * 2;
          sp.alpha = a;
        }
      } else {
        const rg = pools.vfxGlows.acquire(glowTex);
        rg.position.set(r.x, r.y);
        rg.scale.set((curR * 1.4) / 50, (curR * 1.4) / 50);
        rg.tint = colInt;
        rg.alpha = a * 0.35;
      }
    }
  }

  // 10. PROJÉTEIS DO JOGADOR (`pshots`: orange, star, axe, dagger, wave, orb)
  if (typeof pshots !== 'undefined') {
    for (let i = 0; i < pshots.length; i++) {
      const s = pshots[i];
      if (!vis(s.x, s.y)) continue;
      if (s.kind === 'orange') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(s.x, s.y);
        gl.scale.set((s.r * 2.8) / 58, (s.r * 2.8) / 58);
        gl.tint = 0xff8214;
        gl.alpha = 0.65;
        const oTex = getPixiTexture('orange_ball');
        if (oTex) {
          const spr = pools.shots.acquire(oTex);
          spr.position.set(s.x, s.y);
          spr.rotation = s.rot || 0;
          spr.width = s.r * 2.1; spr.height = s.r * 2.1;
        }
      } else if (s.kind === 'star') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(s.x, s.y);
        gl.scale.set((s.r * 3.0) / 58, (s.r * 3.0) / 58);
        gl.tint = 0xffcd1e;
        gl.alpha = 0.72;
        const stTex = getPixiTexture('terraria_star') || getPixiTexture('i_S_Light04');
        if (stTex) {
          const spr = pools.shots.acquire(stTex);
          spr.position.set(s.x, s.y);
          spr.rotation = s.rot || 0;
          spr.width = s.r * 2.2; spr.height = s.r * 2.2;
        }
      } else if (s.kind === 'axe') {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(s.x, s.y);
        gl.scale.set(0.85, 0.85);
        gl.tint = 0xb4e6ff;
        gl.alpha = 0.45;
        const axTex = getPixiTexture('i_S_Axe03');
        if (axTex) {
          const spr = pools.shots.acquire(axTex);
          spr.position.set(s.x, s.y);
          spr.rotation = s.rot || 0;
          spr.width = 36; spr.height = 36;
        }
      } else if (s.kind === 'dagger') {
        const dgTex = getPixiTexture('i_S_Dagger03');
        if (dgTex) {
          const spr = pools.shots.acquire(dgTex);
          spr.position.set(s.x, s.y);
          spr.rotation = Math.atan2(s.vy, s.vx);
          spr.width = 32; spr.height = 32;
        }
      } else if (s.kind === 'wave') {
        const a = Math.min(1, s.life * 3);
        const cxW = s.x - Math.cos(s.ang) * s.r * 0.6;
        const cyW = s.y - Math.sin(s.ang) * s.r * 0.6;
        const wStart = s.ang - 1.1, wEnd = s.ang + 1.1;
        const wStX = cxW + Math.cos(wStart) * s.r, wStY = cyW + Math.sin(wStart) * s.r;
        slashGraphics.lineStyle(12, saberHexInt, 0.48 * a);
        slashGraphics.moveTo(wStX, wStY);
        slashGraphics.arc(cxW, cyW, s.r, wStart, wEnd);
        slashGraphics.lineStyle(4, 0xffffff, 0.9 * a);
        slashGraphics.moveTo(wStX, wStY);
        slashGraphics.arc(cxW, cyW, s.r, wStart, wEnd);
        slashGraphics.lineStyle(0);
      } else {
        const gl = pools.vfxGlows.acquire(glowTex);
        gl.position.set(s.x, s.y);
        gl.scale.set((s.r * 3.6) / 56, (s.r * 3.6) / 56);
        gl.tint = saberHexInt;
        gl.alpha = 0.85;
      }
    }
  }

  // 11. PROJÉTEIS INIMIGOS (`ebullets`)
  if (typeof ebullets !== 'undefined') {
    for (let i = 0; i < ebullets.length; i++) {
      const b = ebullets[i];
      if (!vis(b.x, b.y)) continue;
      const bCol = b.color === 'green' ? 0x50c828
        : b.color === 'orange' ? 0xff7814
        : b.color === 'red' ? 0xff3232
        : b.color === 'cyan' ? 0x3cdcff
        : b.color === 'yellow' ? 0xffe042
        : 0xbe3cff;
      const gl = pools.vfxGlows.acquire(glowTex);
      gl.position.set(b.x, b.y);
      gl.scale.set((b.r * 3.8) / 58, (b.r * 3.8) / 58);
      gl.tint = bCol;
      gl.alpha = 0.82;

      const core = pools.ebullets.acquire(glowTex);
      core.position.set(b.x, b.y);
      core.scale.set((b.r * 2.0) / 58, (b.r * 2.0) / 58);
      core.tint = 0xffffff;
      core.alpha = 0.95;
    }
  }

  // 12. PARTÍCULAS GPU & ATMOSFERA AMBIENTAL (`ParticleContainer` x2 Draw Calls)
  if (typeof particles !== 'undefined') {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      if (q.x < viewL || q.x > viewR || q.y < viewT || q.y > viewB) continue;
      const a = Math.max(0, q.life / q.max);
      const colInt = cssColorToInt(q.color);
      const isSpark = q.kind === 'spark' || (Math.hypot(q.vx || 0, q.vy || 0) > 170);
      const pPool = q.add === false ? pools.particlesNorm : pools.particlesAdd;
      const tex = q.kind === 'smoke' ? smokeTex : (q.kind === 'diamond' ? diamondTex : (isSpark ? sparkTex : pixelTex));
      const ps = pPool.acquire(tex);
      if (!ps) break;
      ps.position.set(q.x, q.y);
      ps.alpha = a;
      ps.tint = colInt;
      if (isSpark) {
        ps.rotation = Math.atan2(q.vy, q.vx);
        ps.scale.set((q.size * 2.2) / 52, (q.size * 0.9) / 20);
      } else if (q.kind === 'diamond' || q.kind === 'smoke') {
        const sc = (q.size * 2.4) / 52;
        ps.scale.set(sc, sc);
      } else {
        ps.scale.set(q.size / 24, q.size / 24);
      }
    }
  }

  if (typeof ambientDust !== 'undefined') {
    for (let i = 0; i < ambientDust.length; i++) {
      const dP = ambientDust[i];
      if (dP.x < viewL || dP.x > viewR || dP.y < viewT || dP.y > viewB) continue;
      const ps = pools.particlesAdd.acquire(glowTex);
      if (!ps) break;
      ps.position.set(dP.x, dP.y);
      ps.alpha = dP.alpha * (0.6 + 0.4 * Math.sin(dP.t * 3));
      ps.tint = cssColorToInt(dP.col);
      const sc = (dP.size * 2.6) / 58;
      ps.scale.set(sc, sc);
    }
  }

  pools.shadows.endFrame();
  pools.particlesNorm.endFrame();
  pools.particlesAdd.endFrame();
  pools.pickups.endFrame();
  pools.pickupGlows.endFrame();
  pools.afterimages.endFrame();
  pools.props.endFrame();
  pools.shrines.endFrame();
  pools.enemies.endFrame();
  pools.enemyFlash.endFrame();
  pools.fireballs.endFrame();
  pools.vfxGlows.endFrame();
  pools.bloomGlows.endFrame();
  pools.shots.endFrame();
  pools.ebullets.endFrame();

  // 13. ATUALIZAÇÃO DOS UNIFORMS DO SHADER GLSL (PÓS-PROCESSAMENTO)
  if (pixiPostFilter && pixiApp.stage.filters) {
    const u = pixiPostFilter.uniforms;
    u.uTime = curTime % 1000;
    u.uAspect = W / Math.max(1, H);
    u.uBiome = typeof currentBiome !== 'undefined' ? currentBiome : 0;
    u.uEvent = waveEvent === 'bloodmoon' ? 1
      : waveEvent === 'void_eclipse' ? 2
      : waveEvent === 'magma_surge' ? 3
      : waveEvent === 'mega_horde' ? 4
      : waveEvent === 'noir' ? 5
      : waveEvent === 'glacial' ? 6
      : waveEvent === 'solar' ? 7
      : waveEvent === 'psychedelic' ? 8
      : 0;
    u.uChroma = typeof GPU_FX !== 'undefined' ? GPU_FX.chromaVal : 0;
    u.uDarkness = inPlay ? 0.56 : 0.42;

    if (inPlay && typeof player !== 'undefined' && player) {
      const pxScreen = ((player.x - cx) * effZoom + W / 2 + sx) / Math.max(1, W);
      const pyScreen = ((player.y - 30 - cy) * effZoom + H / 2 + sy) / Math.max(1, H);
      u.uPlayerUV[0] = pxScreen;
      u.uPlayerUV[1] = pyScreen;
      u.uLightRadius = 0.40 + 0.02 * Math.sin(curTime * 6);
      const fTier = player.feverTier || 0;
      u.uFever = fTier >= 2 ? Math.min(1.0, (fTier - 1) * 0.35) : 0.0;
      u.uLowHp = (player.hp <= 2 && state === 'play') ? (0.45 + 0.35 * Math.sin(curTime * 8)) : 0.0;
    } else {
      u.uPlayerUV[0] = 0.5;
      u.uPlayerUV[1] = 0.5;
      u.uLightRadius = 0.55;
      u.uFever = 0.0;
      u.uLowHp = 0.0;
    }

    if (inPlay && typeof boss !== 'undefined' && boss && !boss.dead && boss.hp > 0) {
      u.uBossActive = 1.0;
      u.uBossUV[0] = ((boss.x - cx) * effZoom + W / 2 + sx) / Math.max(1, W);
      u.uBossUV[1] = ((boss.y - 40 - cy) * effZoom + H / 2 + sy) / Math.max(1, H);
      if (boss.type === 'boss_void_overlord' || boss.type === 'necro_boss') {
        u.uBossColor[0] = 0.75; u.uBossColor[1] = 0.42; u.uBossColor[2] = 1.0;
      } else if (boss.type === 'boss_magma_colossus') {
        u.uBossColor[0] = 1.0; u.uBossColor[1] = 0.42; u.uBossColor[2] = 0.16;
      } else if (boss.type === 'hydra_boss') {
        u.uBossColor[0] = 0.32; u.uBossColor[1] = 0.94; u.uBossColor[2] = 0.42;
      } else {
        u.uBossColor[0] = 1.0; u.uBossColor[1] = 0.70; u.uBossColor[2] = 0.24;
      }
    } else {
      u.uBossActive = 0.0;
    }

    if (typeof GPU_FX !== 'undefined') {
      u.uFlashAmt = GPU_FX.flashAmt;
      u.uFlashColor[0] = GPU_FX.flashCol[0];
      u.uFlashColor[1] = GPU_FX.flashCol[1];
      u.uFlashColor[2] = GPU_FX.flashCol[2];

      const shockUniforms = [u.uShock0, u.uShock1, u.uShock2];
      for (let i = 0; i < 3; i++) {
        const sw = GPU_FX.shockwaves[i];
        const dst = shockUniforms[i];
        if (sw && sw.active) {
          const k = sw.age / sw.dur;
          dst[0] = ((sw.wx - cx) * effZoom + W / 2 + sx) / Math.max(1, W);
          dst[1] = ((sw.wy - cy) * effZoom + H / 2 + sy) / Math.max(1, H);
          dst[2] = (sw.radius * effZoom) / Math.max(1, H);
          dst[3] = sw.strength * (1 - k);
        } else {
          dst[3] = 0.0;
        }
      }
    }
  }

  pixiApp.render();
}

// =====================================================================
//  CAMADA HÍBRIDA 2D OVERLAY (Tipografia Pixel Nítida, Barras de HP & Lasers)
// =====================================================================
function drawPixiWorldOverlay2D() {
  const effZoom = getActiveCamZoom();
  const sx = typeof GPU_FX !== 'undefined' ? GPU_FX.shakeX : 0;
  const sy = typeof GPU_FX !== 'undefined' ? GPU_FX.shakeY : 0;
  const roll = typeof GPU_FX !== 'undefined' ? GPU_FX.shakeRoll : 0;
  const cx = typeof cam !== 'undefined' && cam ? cam.x : 1200;
  const cy = typeof cam !== 'undefined' && cam ? cam.y : 900;

  const halfW = (W / 2) / effZoom;
  const halfH = (H / 2) / effZoom;
  const viewL = cx - halfW - 140, viewR = cx + halfW + 140;
  const viewT = cy - halfH - 120, viewB = cy + halfH + 180;
  const vis = (x, y) => x > viewL && x < viewR && y > viewT && y < viewB;

  ctx.save();
  try {
    ctx.translate(W / 2 + sx, H / 2 + sy);
    if (roll) ctx.rotate(roll);
    ctx.scale(effZoom, effZoom);
    ctx.translate(-cx, -cy);

    // 1. Labels de Barris Especiais (Cristal, Totem, TNT, Lucky)
    if (typeof props !== 'undefined') {
      for (let i = 0; i < props.length; i++) {
        const b = props[i];
        if (!vis(b.x, b.y)) continue;
        if (b.kind === 'crystal') txt('CRISTAL', b.x, b.y - 49, 6.5, '#8ef5ff');
        else if (b.kind === 'totem') txt('TOTEM', b.x, b.y - 58, 7, '#e08aff');
        else if (b.kind === 'lucky') txt('?', b.x, b.y - 46, 14, '#ffe566');
        else if (b.kind === 'tnt') txt('TNT', b.x, b.y - 24, 7, '#ffe042');
      }
    }

    // 2. Anel de Progresso + Nome dos Santuários
    if (typeof shrines !== 'undefined') {
      for (let i = 0; i < shrines.length; i++) {
        const sh = shrines[i];
        if (!vis(sh.x, sh.y)) continue;
        if (sh.prog > 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(sh.x, sh.y, sh.r - 4, (sh.r - 4) * 0.62, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sh.prog);
          ctx.stroke();
        }
        const bob = Math.sin(sh.t * 4) * 5;
        txt(sh.name, sh.x, (sh.sprite ? sh.y - 74 : sh.y - 54) + bob, 7, sh.col);
      }
    }

    // 3. Lasers de Sniper, Telegraphs de Boss, Barras de HP e Etiquetas de Inimigos
    if (typeof enemies !== 'undefined') {
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead || !vis(e.x, e.y)) continue;
        const d = MON[e.type];
        if (!d) continue;

        if (e.type === 'sniper' && e.mode === 'lock' && e.aimAng !== undefined) {
          ctx.save();
          ctx.strokeStyle = `rgba(255,55,55,${0.45 + 0.4 * Math.sin(e.t * 32)})`;
          ctx.lineWidth = e.act < 0.22 ? 3.5 : 1.8;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y - e.r * 1.2);
          ctx.lineTo(e.x + Math.cos(e.aimAng) * 620, e.y - e.r * 1.2 + Math.sin(e.aimAng) * 620);
          ctx.stroke();
          ctx.restore();
        }

        if (isBossType(e.type) && ((e.phase === 'charge' && e.pt > 0) || (e.type === 'aether_slider' && e.phase === 'hover' && e.pt < 0.55))) {
          ctx.strokeStyle = `rgba(255,40,40,${0.35 + 0.35 * Math.sin(e.t * 30)})`;
          ctx.lineWidth = e.r * 1.2;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y - 20);
          ctx.lineTo(e.x + Math.cos(e.ca) * 600, e.y - 20 + Math.sin(e.ca) * 600);
          ctx.stroke();
        }

        const s = e.scale * (e.spawn > 0 ? Math.max(0.05, 1 - e.spawn / 0.7) : 1);
        const h = d.fh * s;
        const dy = e.y - h + 4 * s - (e.z || 0);

        if ((e.type === 'bee' && e.mode === 'aim') || (e.type === 'sniper' && e.mode === 'lock')) {
          txt('!', e.x, e.y - h - 10, 12, '#ffeb3b');
        }
        if (e.type === 'goblin') {
          txt('💰 DUENDE', e.x, dy - 12, 7.5, '#ffd23f');
        } else if (e.bounty) {
          txt('🎯 ALVO (' + Math.ceil(e.bountyT) + 's)', e.x, dy - 12, 7.5, '#ff6438');
        } else if (e.eliteTrait) {
          txt('[' + e.eliteTrait.label.toUpperCase() + ']', e.x, dy - 14, 7.5, e.eliteTrait.col);
        }

        if (e.hp < e.maxHp && !isBossType(e.type) && e.spawn <= 0) {
          const bw = Math.max(28, e.r * 2), by = dy - 8;
          ctx.fillStyle = '#1a0d12'; ctx.fillRect(e.x - bw / 2 - 2, by - 2, bw + 4, 8);
          ctx.fillStyle = '#5a1f2a'; ctx.fillRect(e.x - bw / 2, by, bw, 4);
          ctx.fillStyle = e.type === 'goblin' || e.bounty || e.elite ? '#ffc23d' : (e.poisonT > 0 ? '#5dff6b' : '#ff4d5e');
          ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 4);
        }
      }
    }

    // 4. Textos de Dano & Callouts Flutuantes com Pop Elástico
    if (typeof texts !== 'undefined') {
      for (let i = 0; i < texts.length; i++) {
        const t = texts[i];
        if (!vis(t.x, t.y)) continue;
        const maxL = t.maxLife || 0.8;
        const progress = clamp(1 - t.life / maxL, 0, 1);
        const pop = progress < 0.18 ? 1 + (progress / 0.18) * 0.38 : 1.38 - ((progress - 0.18) / 0.82) * 0.38;
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life * 2.4);
        ctx.translate(t.x, t.y);
        ctx.scale(pop, pop);
        txt(t.txt, 0, 0, t.size, t.color);
        ctx.restore();
      }
    }
  } finally {
    ctx.restore();
  }

  // Fallback de filtro visual quando o shader GLSL pós-processamento está desligado (modo LEVE ou falha de shader)
  const budget = typeof getGfxBudget === 'function' ? getGfxBudget() : { useShader: true };
  const hasActiveShader = !!(pixiPostFilter && budget.useShader);
  const glEl = document.getElementById('webgl-canvas');
  if (glEl) {
    const wantedFilter = (!hasActiveShader && typeof getEventCanvas2DFilter === 'function') ? getEventCanvas2DFilter() : 'none';
    if (glEl.style.filter !== wantedFilter) glEl.style.filter = wantedFilter;
  }
  if (!hasActiveShader) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.38, W / 2, H / 2, Math.max(W, H) * 0.82);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, waveEvent === 'bloodmoon' ? 'rgba(68,0,16,0.58)' : 'rgba(0,0,12,0.52)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (typeof drawEventCinematicOverlay2D === 'function') {
    drawEventCinematicOverlay2D(hasActiveShader);
  }
}

function resizePixiRenderer() {
  if (usePixi && pixiApp) {
    pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
    if (pixiPostFilter && pixiApp.stage.filters) {
      pixiApp.stage.filterArea = pixiApp.screen;
    }
  }
}
window.addEventListener('resize', resizePixiRenderer);
window.addEventListener('orientationchange', () => setTimeout(resizePixiRenderer, 120));
