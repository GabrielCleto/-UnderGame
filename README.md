# ⚔️ Underground II — Crônicas da Arena Ancestral

> **Roguelite de Ação 2D / Hack & Slash em Pixel Art com estética Medieval Dark Fantasy.**  
> Desenvolvido em HTML5 Canvas e JavaScript puro (Vanilla JS) com arquitetura modular de alto desempenho, suporte nativo *Plug & Play* a controles (Xbox, PlayStation, Switch), controles Touch mobile ergonômicos, Roleta Cilíndrica 3D de Campeões com trilhas sonoras exclusivas e 7 Chefes colossais.

---

## 🎮 Visão Geral

Em **Underground II**, você convoca seu campeão no Santuário Ancestral e adentra a arena para enfrentar ondas implacáveis de criaturas abissais e colossos. Derrote inimigos, colete gemas e moedas de ouro, desperte bênçãos divinas a cada nível, reforje sua arma na Forja Goblin e sobreviva aos eventos cósmicos.

---

## 👥 Campeões Jogáveis & Trilhas Sonoras Exclusivas

Na **Roleta Cilíndrica 3D**, cada campeão possui seu próprio pedestal iluminado, atributos únicos e uma **trilha sonora exclusiva** (`assets/audio/music/`) que toca dinamicamente ao girar o carrossel:

| Campeão | Título | Arma Principal | Fúria (Ultimate) | Trilha Sonora | Estilo de Jogo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Manguinha** | *Garoto Comum* | **Corte de Sabre** (Curta distância & Rebate projéteis) | **Fúria do Sabre** (Giro Tempestuoso) | `Manguinha.mp3` | Equilibrado, letal a curta distância e defesa com deflexão precisa |
| **Amxral** | *Estrela do Bloco* | **Estrela Cintilante** (Projéteis perfurantes) | **Chuva Estelar** (Tempestade cósmica) | `amxral.mp3` | Mestre do ataque à distância, alta cadência e perfuração |
| **Tuiuba** | *Orange Jui* | **Tiro de Laranja** (Arremesso explosivo) | **Explosão Cítrica** (Detonação em área) | `tuiuba.mp3` | Alta mobilidade, explosões cítricas em área (AoE) e controle de grupo |

---

## ✨ Principais Funcionalidades (Versão 2.1)

- **🎠 Roleta Cilíndrica 3D de Seleção:** Carrossel em perspectiva orbital com profundidade (*z-order*), iluminação de santuário, ficha de atributos em pergaminho e troca instantânea da música-tema do personagem.
- **🛡️ HUD & UI Medieval Dark Fantasy:**
  - **Brasão do Campeão:** Retrato em moldura de ferro forjado e ouro, barras de Vida e Experiência com efeito *ghost trail* e selo de nível em algarismos romanos.
  - **Barra de Habilidades:** Slots de Ataque, Esquiva/Giro e Fúria com varredura radial de recarga (*cooldown sweep*) e atalhos adaptativos (Teclado, Controle ou Touch).
  - **Minimapa & Radar Tático:** Localização em tempo real de inimigos, chefes, altares, barris e baús de tesouro.
  - **Indicadores de Ameaça Fora de Tela:** Setas táticas nas bordas da tela alertando sobre chefes e projéteis fora do campo de visão.
- **👹 Bestiário Expandido & 7 Chefes Épicos:**
  - **Monstros da Arena:** Slime, Verme, Morcego, Abelha, Serpente, Víbora, Olho Flutuante, Sniper Astral, Fantasma, Necromante, Verme Gigante, Planta Carnívora, Golem, Goblin do Tesouro, **Imp do Caos** e **Aranha do Vazio**.
  - **Chefes Colossais:**
    1. **Rei Abóbora** (*Pumpking*)
    2. **Leviatã Abissal**
    3. **Soberano do Vazio** (*Void Overlord*)
    4. **Colosso de Magma** (*Magma Colossus*)
    5. **Soberano Necromante**
    6. **Imperatriz Carnívora** (*Hydra Boss*)
    7. **Olho Astral Supremo** (*Beholder Boss*)
- **🔨 Sistema de Reforja Lendária & Mercado da Arena:**
  - Entre as ondas, visite o **Mercador da Arena** para comprar Frascos de Vida, Pele de Ferro, Poção de Espinhos, Orbes de Escudo, Tomo do Destino, Medalha de Honra ou usar a **Forja Goblin** para encantar sua arma com prefixos lendários (*Lendário*, *Divino*, *Demoníaco*, *Irreal*, *Mítico*, *Titânico*, *Implacável*, *Mortal*).
- **☄️ Eventos Dinâmicos & Altares Ancestrais:**
  - Eventos especiais de onda (*Lua de Sangue*, *Enxame*, *Eclipse do Vazio*, *Surto de Magma*, *Onda Dourada*), queda de **Estrelas Cadentes** e Altares de Bênção espalhados pelo mapa.

---

## 🕹️ Comandos & Controles

### ⌨️🖱️ Teclado e Mouse
| Ação | Tecla / Botão |
| :--- | :--- |
| **Movimentação** | `W`, `A`, `S`, `D` ou `Setas` |
| **Mirar** | Cursor do Mouse |
| **Atacar** | `Clique Esquerdo` ou `Espaço` |
| **Giro / Esquiva Invencível** | `Shift` ou `Clique Direito` |
| **Especial (Fúria / Ultimate)** | `E`, `Q` ou `L` |
| **Roleta de Personagens** | `TAB` |
| **Selecionar nos Menus / Loja** | `1`, `2`, `3`, `4`, `Setas` ou `Enter` |
| **Pausar Jogo** | `P` ou `ESC` |
| **Minimapa On/Off** | `N` |
| **Música On/Off** | `M` |
| **Trocar Cor do Sabre (Manguinha)** | `C` |

### 🎮 Controle / Gamepad (Plug & Play)
| Ação | Botão |
| :--- | :--- |
| **Movimentação** | Analógico Esquerdo / D-Pad |
| **Mira em 360°** | Analógico Direito |
| **Atacar** | Gatilhos Traseiros (`RT` / `RB`) |
| **Giro / Esquiva Invencível** | `LT`, `LB` ou Botão `B` |
| **Especial (Fúria / Ultimate)** | Botão `Y` ou `X` |
| **Confirmar / Comprar nos Menus** | Botão `A` |
| **Voltar / Sair nos Menus** | Botão `B` ou `Start` |
| **Trocar Campeão na Roleta** | `LB` / `RB` ou `D-Pad Esquerda/Direita` |
| **Pausar / Continuar** | Botão `Start` |
| **Radar / Minimapa** | Botão `R3` (Pressionar analógico direito) |

### 📱 Celular / Tablet (Touchscreen)
| Ação | Botão / Gesto |
| :--- | :--- |
| **Movimentação** | **Joystick Virtual Dinâmico** (metade esquerda da tela) |
| **Atacar (Mira Automática)** | Botão **⚔️ ATACAR** |
| **Giro / Esquiva Invencível** | Botão **💨 GIRO** |
| **Especial (Fúria / Ultimate)** | Botão **⚡ FÚRIA / ULT** |
| **Pausar / Tela Cheia** | Botões **⏸** e **⛶** no topo direito |

---

## 📂 Estrutura do Projeto (Arquitetura Modular v2.1)

O código-fonte e os recursos foram organizados em módulos independentes de responsabilidade única para máximo desempenho e facilidade de manutenção:

```text
-UnderGame/
├── index.html                  # Ponto de entrada HTML5
├── css/
│   └── style.css               # Estilização responsiva e canvas pixel-art
├── src/                        # Motor do jogo modularizado (14 módulos)
│   ├── core/
│   │   ├── config.js           # Configuração de canvas, câmera, zoom e utilitários matemáticos
│   │   ├── assets.js           # Preloader otimizado de sprites, fontes e máscaras de hit
│   │   ├── audio.js            # Motor de efeitos sonoros (WebAudio/WAV) e trilhas por personagem
│   │   └── input.js            # Teclado, Mouse, Joystick Touch Mobile e Gamepad Plug & Play
│   ├── data/
│   │   ├── characters.js       # Atributos, âncoras pixel-perfect e renderizador dos campeões
│   │   ├── monsters.js         # Bestiário de inimigos, chefes e pools de ondas
│   │   └── items.js            # Bênçãos de Level Up, Prefixos de Reforja e Itens da Loja
│   ├── world/
│   │   └── world.js            # Geração procedural da arena, colisões, altares e explosões
│   ├── systems/
│   │   ├── state.js            # Estado global da partida, trauma de câmera e reset
│   │   ├── combat.js           # Spawns, cálculo de dano, drops, progressão de XP e ataques
│   │   ├── ai.js               # Movimentação de inimigos e máquinas de estado dos 7 Chefes
│   │   └── update.js           # Simulação principal a 60fps (ondas, habilidades, projéteis e física)
│   ├── render/
│   │   └── worldRenderer.js    # Renderização Y-sorted, iluminação dinâmica, partículas e clima
│   ├── ui/
│   │   ├── hud.js              # HUD RPG Medieval (Brasão, Minimapa, Barra de Chefe, Skills, Touch)
│   │   └── menus.js            # Menu Principal, Roleta Cilíndrica 3D, Level Up, Loja, Pausa e Game Over
│   └── main.js                 # Game Loop principal e orquestrador de estados
├── assets/
│   ├── audio/
│   │   ├── music/              # Trilhas sonoras exclusivas de cada personagem (.mp3)
│   │   └── sfx/                # 20 efeitos sonoros de combate e interface (.wav)
│   ├── fonts/                  # Fonte retrô Press Start 2P (.ttf)
│   ├── icons/                  # 38 ícones ativos de habilidades, relíquias e projéteis (.png)
│   └── sprites/
│       ├── characters/         # Spritesheets transparentes, retratos e tiras de ataque dos heróis
│       ├── monsters/           # Todos os 14 spritesheets de monstros e chefes unificados
│       └── world/              # Tiles de terreno, árvores, rochas, água e barris
├── docs/
│   ├── CREDITOS.txt            # Atribuição das licenças de áudio e arte
│   ├── CREDITS-LPC.TXT         # Créditos detalhados Liberated Pixel Cup
│   └── GUIA_DAS_ATUALIZACOES.md # Guia de novidades e balanceamento v2.0+
├── .gitignore                  # Filtros de arquivos do repositório
└── README.md                   # Documentação principal do projeto
```

---

## 🚀 Como Executar o Jogo

Não é necessário instalar nenhuma dependência, *bundler* ou biblioteca externa!

1. Clone o repositório:
   ```bash
   git clone git@github.com:GabrielCleto/-UnderGame.git
   ```
2. Abra o arquivo `index.html` diretamente em qualquer navegador moderno, ou execute um servidor local:
   ```bash
   # Com Python 3:
   python -m http.server 8000
   ```
3. Acesse `http://localhost:8000`, escolha seu campeão na roleta e entre na arena!

---

## 📜 Créditos & Licenças

Consulte [`docs/CREDITOS.txt`](docs/CREDITOS.txt) e [`docs/CREDITS-LPC.TXT`](docs/CREDITS-LPC.TXT) para detalhes de atribuição:
- **LPC Base Assets**: CC-BY-SA 3.0 / GPL 3.0 (Redshrike, Sharm, CharlesGabriel, etc.)
- **496 Pixel Art Icons**: CC0 Domínio Público por Henrique Lazarini (7Soul1)
- **RPG Sound Pack**: CC0 Domínio Público por artisticdude
- **Fonte Press Start 2P**: SIL Open Font License por CodeMan38
