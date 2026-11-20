// =====================================================================
//  RENDERIZADOR WEBGL COM PIXIJS (GPU ACCELERATED BATCHING)
//  Arquitetura Híbrida: WebGL para o Mundo/Entidades + Canvas2D/DOM para HUD
// =====================================================================

let usePixi = false;
let pixiApp = null;
let pixiLayers = null;
const pixiTextures = new Map();

// Pools de Sprites GPU para Zero Garbage Collection
const pixiEnemySprites = new Map();
const pixiStaticSprites = [];

let pixiPlayerSprite = null;
let pixiGroundSprite = null;
let pixiLightingGraphics = null;

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

  try {
    PIXI.utils.skipHello();
    pixiApp = new PIXI.Application({
      view: glCanvas,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1d4220,
      antialias: false,
      autoDensity: true,
      resolution: 1,
      powerPreference: 'high-performance'
    });

    const stage = pixiApp.stage;
    stage.sortableChildren = true;

    // Contêiner Raiz do Mundo (Espaço de Câmera)
    const world = new PIXI.Container();
    world.sortableChildren = true;
    stage.addChild(world);

    // Camadas de renderização ordenadas por Z-index
    const groundLayer = new PIXI.Container(); groundLayer.zIndex = 1;
    const shadowLayer = new PIXI.Container(); shadowLayer.zIndex = 2;
    const entityLayer = new PIXI.Container(); entityLayer.zIndex = 10; entityLayer.sortableChildren = true;
    const projectileLayer = new PIXI.Container(); projectileLayer.zIndex = 20;
    const vfxLayer = new PIXI.Container(); vfxLayer.zIndex = 30;
    const lightingLayer = new PIXI.Graphics(); lightingLayer.zIndex = 40;

    world.addChild(groundLayer, shadowLayer, entityLayer, projectileLayer, vfxLayer, lightingLayer);

    pixiLayers = {
      world,
      groundLayer,
      shadowLayer,
      entityLayer,
      projectileLayer,
      vfxLayer,
      lightingLayer
    };

    usePixi = true;
    console.log('⚡ WebGL PixiJS Renderer ativado com sucesso! (GPU Batching ativado)');
    return true;
  } catch (err) {
    console.warn('Falha ao inicializar PixiJS WebGL:', err);
    usePixi = false;
    return false;
  }
}

// Criação e Cache de Texturas a partir de Imagens recortadas pixel-perfect
function getPixiTexture(imgKey, sx, sy, sw, sh) {
  const cacheKey = `${imgKey}_${Math.round(sx)}_${Math.round(sy)}_${Math.round(sw)}_${Math.round(sh)}`;
  if (pixiTextures.has(cacheKey)) return pixiTextures.get(cacheKey);

  const baseImg = typeof IMG !== 'undefined' ? IMG[imgKey] : null;
  if (!baseImg || !baseImg.complete || baseImg.naturalWidth === 0) return null;

  try {
    const baseTex = PIXI.BaseTexture.from(baseImg, {
      scaleMode: PIXI.SCALE_MODES.NEAREST,
      mipmap: PIXI.MIPMAP_MODES.OFF
    });
    const rect = new PIXI.Rectangle(Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh));
    const tex = new PIXI.Texture(baseTex, rect);
    pixiTextures.set(cacheKey, tex);
    return tex;
  } catch (e) {
    return null;
  }
}

// Inicializa o chão pré-renderizado e props estáticos na GPU
function buildPixiWorld() {
  if (!usePixi || !pixiLayers) return;

  const { groundLayer, entityLayer } = pixiLayers;
  groundLayer.removeChildren();

  // 1. Fundo de Grama Verde Sólida (#1d4220) para evitar transparências pretas
  const bg = new PIXI.Graphics();
  bg.beginFill(0x1d4220);
  bg.drawRect(-2000, -2000, WORLD.w + 4000, WORLD.h + 4000);
  bg.endFill();
  groundLayer.addChild(bg);

  // 2. Textura do Chão Única na GPU (1 Draw Call para todo o terreno)
  if (typeof ground !== 'undefined' && ground) {
    const groundBase = new PIXI.BaseTexture(new PIXI.CanvasResource(ground), {
      scaleMode: PIXI.SCALE_MODES.NEAREST,
      mipmap: PIXI.MIPMAP_MODES.OFF,
      wrapMode: PIXI.WRAP_MODES.CLAMP
    });
    const groundTex = new PIXI.Texture(groundBase);
    pixiGroundSprite = new PIXI.Sprite(groundTex);
    groundLayer.addChild(pixiGroundSprite);
  }

  // 3. Props estáticos (Árvores e Pedras)
  pixiStaticSprites.forEach(s => s.destroy());
  pixiStaticSprites.length = 0;

  if (typeof trees !== 'undefined') {
    for (const t of trees) {
      const c = t.v % 2, r = t.v < 2 ? 0 : 1, tc = r;
      const trunkTex = getPixiTexture('trunk', tc * 96, 0, 96, 96);
      const topTex = getPixiTexture('treetop', c * 96, r * 96, 96, 96);

      const treeCont = new PIXI.Container();
      treeCont.zIndex = t.y;

      if (trunkTex) {
        const trSpr = new PIXI.Sprite(trunkTex);
        trSpr.scale.set(1.5);
        trSpr.position.set(t.x - 48 * 1.5, t.y - 122 * 1.5 + 64 * 1.5);
        treeCont.addChild(trSpr);
      }
      if (topTex) {
        const topSpr = new PIXI.Sprite(topTex);
        topSpr.scale.set(1.5);
        topSpr.position.set(t.x - 48 * 1.5, t.y - 122 * 1.5);
        treeCont.addChild(topSpr);
      }
      entityLayer.addChild(treeCont);
      pixiStaticSprites.push(treeCont);
    }
  }

  if (typeof rocks !== 'undefined') {
    for (const r of rocks) {
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
        pixiStaticSprites.push(spr);
      }
    }
  }
}

// Sincronização e Renderização do Mundo via WebGL a 60+ FPS
function renderPixiWorld() {
  if (!usePixi || !pixiApp || !pixiLayers) return;

  const z = (typeof cam !== 'undefined' && cam && cam.zoom) || 1;
  const { world, entityLayer, lightingLayer } = pixiLayers;

  // 1. CÂMERA DINÂMICA NA GPU
  world.position.set(-cam.x * z + W / 2, -cam.y * z + H / 2);
  world.scale.set(z);

  const halfW = (W / 2) / z, halfH = (H / 2) / z;
  const viewL = cam.x - halfW - 120, viewR = cam.x + halfW + 120;
  const viewT = cam.y - halfH - 100, viewB = cam.y + halfH + 160;
  const vis = (x, y) => x > viewL && x < viewR && y > viewT && y < viewB;

  // 2. SINCRONIZAÇÃO DO JOGADOR (Pixel-perfect com âncoras da animação)
  if (typeof player !== 'undefined' && player && (state === 'play' || state === 'pause')) {
    if (!pixiPlayerSprite) {
      pixiPlayerSprite = new PIXI.Sprite();
      entityLayer.addChild(pixiPlayerSprite);
    }
    const pf = playerFrame();
    const f = pf.f;
    const cid = player.char.id;
    const imgKey = player.char.imgKey;
    const sc = player.char.scale * (f.sc || 1);
    const pTex = getPixiTexture(imgKey, f.x, f.y, f.w, f.h);

    if (pTex) {
      pixiPlayerSprite.texture = pTex;
      pixiPlayerSprite.visible = true;
      pixiPlayerSprite.anchor.set(f.ax / f.w, f.ay / f.h);
      pixiPlayerSprite.position.set(player.x, player.y + (pf.bobY || 0));
      pixiPlayerSprite.scale.set((pf.flip ? -1 : 1) * sc, sc);
      pixiPlayerSprite.rotation = pf.tilt || 0;
      pixiPlayerSprite.alpha = player.inv > 0 && Math.floor(time * 24) % 2 === 0 ? 0.35 : 1;
      pixiPlayerSprite.zIndex = player.y;
    }
  } else if (pixiPlayerSprite) {
    pixiPlayerSprite.visible = false;
  }

  // 3. SINCRONIZAÇÃO DE INIMIGOS (POOL DE SPRITES GPU)
  const activeEnemies = new Set();
  if (typeof enemies !== 'undefined') {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      activeEnemies.add(e);

      let spr = pixiEnemySprites.get(e);
      if (!spr) {
        spr = new PIXI.Sprite();
        spr.anchor.set(0.5, 0.85);
        entityLayer.addChild(spr);
        pixiEnemySprites.set(e, spr);
      }

      if (vis(e.x, e.y)) {
        spr.visible = true;
        const d = MON[e.type];
        const isSp = !!d.sp;
        const col = isSp ? Math.floor(e.t * 8) % d.fwCount : Math.floor(e.t * 6) % 3;
        const imgKey = 'm_' + (d.sp ? d.sp : e.type);
        const tex = getPixiTexture(imgKey, col * d.fw, e.row * d.fh, d.fw, d.fh);

        if (tex) {
          spr.texture = tex;
          spr.position.set(e.x, e.y);
          const baseScale = d.scale || 1.5;
          spr.scale.set(baseScale, baseScale);
          spr.zIndex = e.y;
          spr.tint = e.hurt > 0 ? 0xff6666 : (e.freezeT > 0 ? 0x88ddff : 0xffffff);
        }
      } else {
        spr.visible = false;
      }
    }
  }

  // Remove sprites de inimigos mortos
  for (const [e, spr] of pixiEnemySprites.entries()) {
    if (!activeEnemies.has(e)) {
      spr.destroy();
      pixiEnemySprites.delete(e);
    }
  }

  // Re-ordena profundidade na GPU
  entityLayer.sortChildren();

  // 4. ILUMINAÇÃO & VIGNETTE WEBGL
  lightingLayer.clear();
  if (player && (state === 'play' || state === 'pause')) {
    // Vinheta suave de borda
    lightingLayer.beginFill(0x00000a, 0.45);
    lightingLayer.drawRect(cam.x - halfW - 200, cam.y - halfH - 200, (halfW + 200) * 2, (halfH + 200) * 2);
    lightingLayer.endFill();
  }

  // Renderiza frame WebGL na GPU
  pixiApp.render();
}

// Redimensionamento de tela
function resizePixiRenderer() {
  if (usePixi && pixiApp) {
    pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
  }
}
window.addEventListener('resize', resizePixiRenderer);
window.addEventListener('orientationchange', () => setTimeout(resizePixiRenderer, 120));
