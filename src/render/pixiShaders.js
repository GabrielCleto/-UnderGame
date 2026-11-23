// =====================================================================
//  SHADERS GLSL ES 1.00 + ATLAS PROCEDURAL DE VFX (PixiJS v7.4.2)
//  3 Shockwaves, Aberração Cromática, Heatwave, Névoa Volumétrica,
//  Iluminação de Tocha, Aura de Chefão, Combo Fever e Pulso Vida Baixa
// =====================================================================

function createVfxAtlasTextures() {
  if (typeof PIXI === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 128);

  // 1. GLOW (0, 0, 64, 64) — halo suave radial branco
  {
    const rad = g.createRadialGradient(32, 32, 1, 32, 32, 29);
    rad.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    rad.addColorStop(0.28, 'rgba(255,255,255,0.65)');
    rad.addColorStop(0.65, 'rgba(255,255,255,0.18)');
    rad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    g.fillStyle = rad;
    g.fillRect(2, 2, 60, 60);
  }

  // 2. RING (64, 0, 64, 64) — anel luminoso fino com aura
  {
    g.save();
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 3.2;
    g.shadowColor = '#ffffff';
    g.shadowBlur = 5;
    g.beginPath();
    g.arc(96, 32, 22, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }

  // 3. SMOKE (128, 0, 64, 64) — puff macio de fumaça/névoa
  {
    const puffs = [[160, 32, 24, 0.45], [152, 28, 17, 0.35], [168, 35, 16, 0.35]];
    for (const [px, py, pr, pa] of puffs) {
      const rg = g.createRadialGradient(px, py, 2, px, py, pr);
      rg.addColorStop(0, `rgba(255,255,255,${pa})`);
      rg.addColorStop(0.55, `rgba(255,255,255,${pa * 0.45})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg;
      g.beginPath();
      g.arc(px, py, pr, 0, Math.PI * 2);
      g.fill();
    }
  }

  // 4. DIAMOND (192, 0, 64, 64) — estrela cintilante 4 pontas + núcleo
  {
    const cx = 224, cy = 32;
    const dg = g.createRadialGradient(cx, cy, 1, cx, cy, 16);
    dg.addColorStop(0, 'rgba(255,255,255,1)');
    dg.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    dg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = dg;
    g.beginPath();
    g.arc(cx, cy, 16, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(cx, cy - 26); g.lineTo(cx + 4.5, cy - 4.5);
    g.lineTo(cx + 26, cy); g.lineTo(cx + 4.5, cy + 4.5);
    g.lineTo(cx, cy + 26); g.lineTo(cx - 4.5, cy + 4.5);
    g.lineTo(cx - 26, cy); g.lineTo(cx - 4.5, cy - 4.5);
    g.closePath();
    g.fill();
  }

  // 5. SHADOW (0, 64, 64, 32) — elipse de sombra preta suave
  {
    g.save();
    g.translate(32, 80);
    g.scale(1.0, 0.46);
    const sg = g.createRadialGradient(0, 0, 4, 0, 0, 26);
    sg.addColorStop(0, 'rgba(0,0,0,0.92)');
    sg.addColorStop(0.65, 'rgba(0,0,0,0.58)');
    sg.addColorStop(1, 'rgba(0,0,0,0.0)');
    g.fillStyle = sg;
    g.beginPath();
    g.arc(0, 0, 26, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // 6. SPARK (64, 64, 64, 32) — risco direcional para faíscas em movimento
  {
    g.save();
    g.translate(96, 80);
    g.scale(1.0, 0.28);
    const kg = g.createRadialGradient(0, 0, 2, 0, 0, 26);
    kg.addColorStop(0, 'rgba(255,255,255,1.0)');
    kg.addColorStop(0.45, 'rgba(255,255,255,0.75)');
    kg.addColorStop(1, 'rgba(255,255,255,0.0)');
    g.fillStyle = kg;
    g.beginPath();
    g.arc(0, 0, 26, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // 7. PIXEL (128, 64, 32, 32) — bloco retrô com margem anti-bleed
  {
    g.fillStyle = '#ffffff';
    g.fillRect(132, 68, 24, 24);
  }

  const baseTex = new PIXI.BaseTexture(new PIXI.CanvasResource(c), {
    scaleMode: PIXI.SCALE_MODES.LINEAR,
    mipmap: PIXI.MIPMAP_MODES.OFF,
  });

  return {
    baseTex,
    glow: new PIXI.Texture(baseTex, new PIXI.Rectangle(1, 1, 62, 62)),
    ring: new PIXI.Texture(baseTex, new PIXI.Rectangle(65, 1, 62, 62)),
    smoke: new PIXI.Texture(baseTex, new PIXI.Rectangle(129, 1, 62, 62)),
    diamond: new PIXI.Texture(baseTex, new PIXI.Rectangle(193, 1, 62, 62)),
    shadow: new PIXI.Texture(baseTex, new PIXI.Rectangle(2, 65, 60, 30)),
    spark: new PIXI.Texture(baseTex, new PIXI.Rectangle(66, 65, 60, 30)),
    pixel: new PIXI.Texture(baseTex, new PIXI.Rectangle(132, 68, 24, 24)),
  };
}

const UNDERGROUND_POST_FRAG = `
precision highp float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputSize;
uniform vec4 outputFrame;

uniform float uTime;
uniform float uAspect;
uniform vec2 uPlayerUV;
uniform float uLightRadius;
uniform vec2 uBossUV;
uniform float uBossActive;
uniform vec3 uBossColor;
uniform float uBiome;
uniform float uEvent;
uniform float uChroma;
uniform float uFever;
uniform float uLowHp;
uniform float uDarkness;
uniform vec3 uFlashColor;
uniform float uFlashAmt;

uniform vec4 uShock0;
uniform vec4 uShock1;
uniform vec4 uShock2;

vec2 applyShock(vec2 uv, vec4 shock, inout float ringGlow) {
  if (shock.w <= 0.0005) return vec2(0.0);
  vec2 delta = uv - shock.xy;
  vec2 corr = vec2(delta.x * uAspect, delta.y);
  float d = length(corr);
  float distToWave = abs(d - shock.z);
  float band = 1.0 - smoothstep(0.0, 0.075, distToWave);
  if (band <= 0.001) return vec2(0.0);
  float waveSin = sin((d - shock.z) * 58.0);
  vec2 dir = corr / max(d, 0.0005);
  vec2 uvDir = vec2(dir.x / max(uAspect, 0.5), dir.y);
  ringGlow += band * shock.w * 2.4;
  return uvDir * (band * waveSin * shock.w);
}

void main(void) {
  vec2 maxUV = max(outputFrame.zw * inputSize.zw, vec2(0.0001));
  vec2 screenUV = vTextureCoord / maxUV;
  vec2 dispScreenUV = screenUV;

  // 1. Distorcao sutil de calor na Cidadela de Magma / Magma Surge
  if ((uBiome > 0.5 && uBiome < 1.5) || (uEvent > 2.5 && uEvent < 3.5)) {
    float heatMask = smoothstep(0.25, 0.95, screenUV.y);
    float heat = sin(screenUV.y * 46.0 - uTime * 5.2) * cos(screenUV.x * 24.0 + uTime * 2.1);
    dispScreenUV.x += heat * 0.0014 * heatMask;
  }

  // 2. Ate 3 Ondas de Choque radiais simultaneas
  float ringGlow = 0.0;
  dispScreenUV -= applyShock(screenUV, uShock0, ringGlow);
  dispScreenUV -= applyShock(screenUV, uShock1, ringGlow);
  dispScreenUV -= applyShock(screenUV, uShock2, ringGlow);

  vec2 texUV = clamp(dispScreenUV * maxUV, vec2(0.0005), maxUV - vec2(0.0005));

  // 3. Amostragem + Aberracao Cromatica dinamica (1 sample normal, 3 quando uChroma > 0)
  vec4 baseCol = texture2D(uSampler, texUV);
  vec3 col = baseCol.rgb;
  if (uChroma > 0.0004) {
    vec2 radial = normalize(screenUV - vec2(0.5) + vec2(0.0001)) * uChroma;
    vec2 rUV = clamp((dispScreenUV + radial) * maxUV, vec2(0.0005), maxUV - vec2(0.0005));
    vec2 bUV = clamp((dispScreenUV - radial) * maxUV, vec2(0.0005), maxUV - vec2(0.0005));
    col.r = texture2D(uSampler, rUV).r;
    col.b = texture2D(uSampler, bUV).b;
  }

  // Realce sutil na crista da onda de choque
  col += vec3(0.75, 0.9, 1.0) * min(0.28, ringGlow);

  // 4. Atmosfera por Bioma (Nevoa / Magma / Vazio)
  if (uBiome > 0.5 && uBiome < 1.5) {
    // Cidadela de Magma: tom quente e brasa nas bordas
    col += vec3(0.055, 0.015, 0.002);
  } else if (uBiome > 1.5 && uBiome < 2.5) {
    // Abismo do Vazio: leve brilho violeta espacial
    float voidWave = 0.5 + 0.5 * sin(screenUV.x * 8.0 + uTime * 0.9) * cos(screenUV.y * 8.0 - uTime * 0.7);
    col += vec3(0.03, 0.006, 0.065) * (0.5 + 0.5 * voidWave);
  } else if (uBiome > 2.5) {
    // Crepusculo Sombrio: nevoa volumetrica suave nas extremidades
    float edgeMask = smoothstep(0.25, 0.85, distance(screenUV, vec2(0.5)));
    float mist1 = sin(screenUV.x * 7.0 + uTime * 0.35 + sin(screenUV.y * 5.0 - uTime * 0.25));
    float mist2 = cos(screenUV.y * 9.0 - uTime * 0.45 + screenUV.x * 4.0);
    float mist = clamp((mist1 * 0.5 + mist2 * 0.5) * 0.5 + 0.5, 0.0, 1.0);
    col = mix(col, vec3(0.06, 0.14, 0.20), edgeMask * mist * 0.32);
  }

  // 5. Iluminacao Volumetrica de Tocha ao redor do Heroi + Vinheta de Calabouco
  vec2 pDiff = (screenUV - uPlayerUV) * vec2(uAspect, 1.0);
  float pDist = length(pDiff);
  float torchWarm = 1.0 - smoothstep(0.02, max(uLightRadius * 0.55, 0.12), pDist);
  col += vec3(0.06, 0.045, 0.02) * torchWarm;

  float edgeStart = max(uLightRadius * 0.45, 0.18);
  float edgeEnd = max(edgeStart + 0.18, uLightRadius * 1.45);
  float edgeFactor = smoothstep(edgeStart, edgeEnd, pDist);
  vec3 edgeTint = vec3(0.01, 0.02, 0.06);
  if (uBiome > 0.5 && uBiome < 1.5) edgeTint = vec3(0.22, 0.04, 0.01);
  else if (uBiome > 1.5 && uBiome < 2.5) edgeTint = vec3(0.12, 0.02, 0.24);
  else if (uBiome > 2.5) edgeTint = vec3(0.03, 0.09, 0.14);

  // Override de Evento ativo
  float finalDark = uDarkness;
  if (uEvent > 0.5 && uEvent < 1.5) {
    edgeTint = vec3(0.32, 0.01, 0.05); // Lua de Sangue
    finalDark = max(finalDark, 0.65);
  } else if (uEvent > 1.5 && uEvent < 2.5) {
    edgeTint = vec3(0.14, 0.02, 0.28); // Eclipse do Vazio
    finalDark = max(finalDark, 0.68);
  } else if (uEvent > 2.5 && uEvent < 3.5) {
    edgeTint = vec3(0.28, 0.06, 0.01); // Surto de Magma
    finalDark = max(finalDark, 0.62);
  } else if (uEvent > 3.5 && uEvent < 4.5) {
    edgeTint = vec3(0.04, 0.18, 0.24); // Mare Abissal
  } else if (uEvent > 4.5 && uEvent < 5.5) {
    edgeTint = vec3(0.02, 0.02, 0.02); // Noir profundo
    finalDark = max(finalDark, 0.72);
  } else if (uEvent > 5.5 && uEvent < 6.5) {
    edgeTint = vec3(0.05, 0.25, 0.45); // Era Glacial
    finalDark = max(finalDark, 0.64);
  } else if (uEvent > 6.5 && uEvent < 7.5) {
    edgeTint = vec3(0.42, 0.18, 0.02); // Apocalipse Solar
    finalDark = max(finalDark, 0.66);
  }

  col = mix(col, edgeTint, clamp(edgeFactor * finalDark, 0.0, 0.78));

  // 6. Aura Luminosa Dinamica do Chefao Ativo
  if (uBossActive > 0.5) {
    vec2 bDiff = (screenUV - uBossUV) * vec2(uAspect, 1.0);
    float bDist = length(bDiff);
    float bGlow = 1.0 - smoothstep(0.02, 0.26, bDist);
    float bPulse = 0.75 + 0.25 * sin(uTime * 6.5);
    col += uBossColor * (bGlow * 0.22 * bPulse);
  }

  // 7. Combo Fever Borda Energetica
  if (uFever > 0.01) {
    float cDist = distance(screenUV, vec2(0.5));
    float fRim = smoothstep(0.42, 0.78, cDist);
    vec3 fCol = mix(vec3(1.0, 0.65, 0.15), vec3(0.35, 0.92, 1.0), clamp(uFever - 0.5, 0.0, 1.0));
    float fPulse = 0.65 + 0.35 * sin(uTime * 9.0);
    col += fCol * (fRim * uFever * 0.18 * fPulse);
  }

  // 8. Vinheta de Vida Baixa + Dessaturacao sutil nas bordas
  if (uLowHp > 0.01) {
    float lDist = distance(screenUV, vec2(0.5));
    float lMask = smoothstep(0.32, 0.76, lDist);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(luma), lMask * uLowHp * 0.38);
    col = mix(col, vec3(0.75, 0.02, 0.08), lMask * uLowHp * 0.52);
  }

  // 8b. Eventos Megalomaníacos (Grade de Cor Total)
  if (uEvent > 0.5 && uEvent < 1.5) {
    // EVENTO LUA DE SANGUE: Dessatura verdes e transforma tudo em carmesim intenso
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(luma * 1.45, luma * 0.22, luma * 0.24), 0.62);
  } else if (uEvent > 1.5 && uEvent < 2.5) {
    // EVENTO ECLIPSE DO VAZIO: Arena em violeta/índigo cósmico pulsante
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    float cosmic = 0.88 + 0.18 * sin(uTime * 3.0 + screenUV.y * 8.0);
    col = mix(col, vec3(luma * 0.65, luma * 0.25, luma * 1.45) * cosmic, 0.58);
  } else if (uEvent > 4.5 && uEvent < 5.5) {
    // EVENTO NOIR: Monocromático de alto contraste estilo cinema noir
    // Preserva apenas tons de sangue/vermelho brilhante
    float redDominance = max(0.0, col.r - max(col.g, col.b) * 1.3);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    // Contraste s-curve estilo filme analógico
    float contrast = smoothstep(0.08, 0.92, luma);
    vec3 noirCol = vec3(contrast);
    // Linhas sutis de chuva analógica
    float rain = sin(screenUV.x * 240.0 + screenUV.y * 360.0 + uTime * 35.0);
    if (rain > 0.96) noirCol += 0.08;
    // Realça vermelho puro (sangue/olhos de monstros)
    col = mix(noirCol, vec3(col.r * 1.35, 0.05, 0.05), clamp(redDominance * 2.5, 0.0, 1.0));
  } else if (uEvent > 5.5 && uEvent < 6.5) {
    // EVENTO ERA GLACIAL: Gelo e frio extremo
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 iceTint = vec3(0.25, 0.75, 1.0);
    col = mix(col, iceTint * luma * 1.35, 0.55);
    float frostMask = smoothstep(0.35, 0.85, distance(screenUV, vec2(0.5)));
    col = mix(col, vec3(0.85, 0.95, 1.0), frostMask * 0.32);
  } else if (uEvent > 6.5 && uEvent < 7.5) {
    // EVENTO APOCALIPSE SOLAR: Calor extremo e radiação âmbar
    float heatWave = sin(screenUV.y * 60.0 - uTime * 8.0) * 0.02;
    col += vec3(0.28, 0.12, 0.02) + vec3(heatWave * 0.5, heatWave * 0.2, 0.0);
    col = mix(col, vec3(1.0, 0.65, 0.2), 0.25);
  } else if (uEvent > 7.5 && uEvent < 8.5) {
    // EVENTO FEBRE SURREAL / PSICODÉLICO: Rotação contínua de matiz + super saturação
    float ang = uTime * 1.65 + screenUV.x * 1.8;
    vec3 kAxis = vec3(0.57735);
    float cosA = cos(ang), sinA = sin(ang);
    vec3 rotated = col * cosA + cross(kAxis, col) * sinA + kAxis * dot(kAxis, col) * (1.0 - cosA);
    float luma = dot(rotated, vec3(0.299, 0.587, 0.114));
    col = clamp(mix(vec3(luma), rotated, 1.55), 0.0, 1.0);
  }

  // 9. Flash de Impacto (limitado WCAG em CPU)
  if (uFlashAmt > 0.001) {
    col = mix(col, uFlashColor, clamp(uFlashAmt, 0.0, 0.45));
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function createUndergroundPostFilter() {
  if (typeof PIXI === 'undefined' || !PIXI.Filter) return null;
  try {
    const uniforms = {
      uTime: 0.0,
      uAspect: 16 / 9,
      uPlayerUV: new Float32Array([0.5, 0.5]),
      uLightRadius: 0.42,
      uBossUV: new Float32Array([0.5, 0.5]),
      uBossActive: 0.0,
      uBossColor: new Float32Array([1.0, 0.65, 0.2]),
      uBiome: 0.0,
      uEvent: 0.0,
      uChroma: 0.0,
      uFever: 0.0,
      uLowHp: 0.0,
      uDarkness: 0.52,
      uFlashColor: new Float32Array([1.0, 1.0, 1.0]),
      uFlashAmt: 0.0,
      uShock0: new Float32Array([0.5, 0.5, 0.0, 0.0]),
      uShock1: new Float32Array([0.5, 0.5, 0.0, 0.0]),
      uShock2: new Float32Array([0.5, 0.5, 0.0, 0.0]),
    };
    const filter = new PIXI.Filter(null, UNDERGROUND_POST_FRAG, uniforms);
    filter.padding = 0;
    return filter;
  } catch (err) {
    console.warn('Falha ao compilar shader GLSL Underground, continuando sem filtro pós-processamento:', err);
    return null;
  }
}
