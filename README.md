# ⚔️ Underground Game

> **Jogo de sobrevivência em arena 2D Roguelite / Hack & Slash em Pixel Art.**  
> Desenvolvido com HTML5 Canvas e JavaScript puro (Vanilla JS), com suporte total a controles de videogame (Plug & Play), múltiplos personagens jogáveis, sistema de upgrades, loja de itens e ondas crescentes de inimigos.

---

## 🎮 Visão Geral

Em **UnderGame**, você entra na arena enfrentando hordas de monstros, acumulando moedas e subindo de nível. A cada nível superado, selecione poderes para aprimorar seu guerreiro e visite o Mercado da Arena entre as ondas para adquirir relíquias e itens consumíveis lendários.

---

## 👥 Personagens Jogáveis

| Personagem | Título | Arma Principal | Habilidade Especial (Ultimate) | Estilo de Jogo |
| :--- | :--- | :--- | :--- | :--- |
| **Manguinha** | *Garoto Comum* | Sabre de Luz (Corte & Rebate de Tiros) | Fúria do Sabre (Giro Tempestuoso) | Equilibrado, combate corpo-a-corpo e defesa precisa |
| **Amxral** | *Estrela do Bloco* | Estrela Cintilante Perfurante | Chuva Estelar Dourada | Combate à distância, projéteis perfurantes e precisão |
| **Tuiuba** | *Orange Jui* | Laranjas Cítricas Explosivas | Explosão Cítrica em Área | Alta velocidade, dano em área explosivo e agilidade |

---

## ✨ Principais Funcionalidades

- **⚔️ Combate Dinâmico:** Golpes fluidos, animações direcionais em 8 direções, esquiva com invencibilidade (Dash/Giro) e acerto crítico.
- **✨ Sistema de Level Up:** Escolha entre mais de 10 habilidades passivas e ativas a cada subida de nível.
- **🛒 Mercado da Arena:** Loja entre ondas com itens exclusivos (Coração Dourado, Botas de Mercúrio, Amuleto de Vampirismo, Poções de Fúria).
- **🎮 Suporte Plug & Play a Controles:**
  - Compatível nativamente com controles de **Xbox**, **PlayStation (PS4/PS5)** e **Genéricos / Switch Pro**.
  - Mira 360° com o analógico direito.
  - Gatilhos traseiros (**RT/RB**) configurados para ataque.
  - Navegação fluida em menus com D-pad, botões de ação e suporte a vibração háptica (*Rumble*).
- **📱 Suporte a Telas Sensíveis ao Toque (Mobile / Touchscreen):** Joysticks virtuais e botões touch automáticos.
- **🗺️ Minimapa / Radar:** Radar no canto superior direito para localização de inimigos, chefes e baús.
- **🎵 Trilha Sonora & SFX Retrô:** Sintetizador procedural em Web Audio API + trilha sonora original.

---

## 🕹️ Comandos & Controles

### 📱 No Celular / Tablet (Touchscreen)
| Ação | Botão / Gesto |
| :--- | :--- |
| **Movimentação** | **Joystick Virtual Dinâmico** (lado esquerdo da tela) |
| **Atacar (com Mira Automática)** | Botão **⚔️ ATACAR** (ou toque na metade direita) |
| **Giro / Esquiva com Invencibilidade** | Botão **💨 GIRO** (com anel de recarga) |
| **Especial (Ultimate)** | Botão **⚡ FÚRIA / ULT** (com anel de carga e pulso) |
| **Pausar / Retomar** | Botão **⏸** no topo direito (ou toque na tela) |
| **Tela Cheia** | Botão **⛶** no topo direito |
| **Navegação nos Menus** | Toque direto nas cartas e botões |

### 🎮 No Controle (Gamepad)
| Ação | Botão |
| :--- | :--- |
| **Movimentação** | Analógico Esquerdo / D-Pad |
| **Mira em 360°** | Analógico Direito |
| **Atacar** | Gatilhos Traseiros (**RT** / **RB**) |
| **Giro / Esquiva com Invencibilidade** | **LT**, **LB** ou Botão **B** |
| **Especial (Ultimate)** | Botão **Y** ou **X** |
| **Confirmar / Comprar nos Menus** | Botão **A** |
| **Voltar / Continuar nos Menus** | Botão **B** ou **Start** |
| **Pausar / Continuar** | Botão **Start** |
| **Menu de Seleção de Personagem** | Botão **Select / Back** |
| **Radar / Minimapa** | Botão **R3** (Pressionar analógico direito) |

### ⌨️🖱️ No Teclado e Mouse
| Ação | Tecla / Botão |
| :--- | :--- |
| **Movimentação** | **W, A, S, D** ou **Setas** |
| **Mirar** | Cursor do Mouse |
| **Atacar** | **Clique Esquerdo** ou **Espaço** |
| **Giro / Esquiva** | **Shift** ou **Clique Direito** |
| **Especial (Ultimate)** | Tecla **E**, **Q** ou **L** |
| **Trocar Personagem** | Tecla **TAB** |
| **Menu / Loja** | Números **1, 2, 3, 4** ou **Enter** |
| **Pausar** | Tecla **P** ou **ESC** |
| **Minimapa On/Off** | Tecla **N** |
| **Música On/Off** | Tecla **M** |
| **Cor do Sabre (Manguinha)** | Tecla **C** |

---

## 🚀 Como Executar o Jogo

Não é necessário instalar nenhuma dependência ou biblioteca externa!

1. Clone o repositório:
   ```bash
   git clone git@github.com:GabrielCleto/-UnderGame.git
   ```
2. Abra a pasta do projeto.
3. Abra o arquivo `index.html` em qualquer navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Opera, etc.), ou execute através de um servidor local leve como:
   ```bash
   # Com VS Code: Extensão "Live Server"
   # Ou com Python 3:
   python -m http.server 8000
   ```
4. Conecte seu controle ou use o teclado e divirta-se!

---

## 📂 Estrutura do Projeto (Arquitetura Modular v2.1)

```text
-UnderGame/
├── index.html                  # Ponto de entrada HTML5
├── css/
│   └── style.css               # Estilização responsiva e canvas pixel-art
├── src/                        # Código-fonte modularizado por responsabilidade
│   ├── core/
│   │   ├── config.js           # Configuração de canvas, câmera, zoom e utilitários matemáticos
│   │   ├── assets.js           # Carregador otimizado de sprites, fontes e máscaras de hit
│   │   ├── audio.js            # Motor de efeitos sonoros (WebAudio/WAV) e trilhas por personagem
│   │   └── input.js            # Teclado, Mouse, Joystick Touch Mobile e Gamepad Plug & Play
│   ├── data/
│   │   ├── characters.js       # Definições, atributos e tabelas de animação dos campeões
│   │   ├── monsters.js         # Bestiário de inimigos, chefes e pools de ondas
│   │   └── items.js            # Bênçãos de Level Up, Prefixos de Reforja e Itens da Loja
│   ├── world/
│   │   └── world.js            # Geração procedural da arena, colisões estáticas, altares e explosões
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
│   │   └── sfx/                # Efeitos sonoros de combate e interface (.wav)
│   ├── fonts/                  # Fonte retrô Press Start 2P (.ttf)
│   ├── icons/                  # Ícones de habilidades, relíquias e projéteis (.png)
│   └── sprites/
│       ├── characters/         # Spritesheets, retratos e tiras de ataque dos heróis
│       ├── monsters/           # Spritesheets animados de todos os monstros e chefes
│       └── world/              # Tiles de terreno, árvores, rochas, água e barris
├── docs/
│   ├── CREDITOS.txt            # Atribuição das licenças de áudio e arte
│   ├── CREDITS-LPC.TXT         # Créditos detalhados Liberated Pixel Cup
│   └── GUIA_DAS_ATUALIZACOES.md # Guia de novidades e balanceamento da versão 2.0+
├── .gitignore                  # Filtros de arquivos do repositório
└── README.md                   # Documentação principal do projeto
```

---

## 📜 Créditos & Licenças

Consulte o arquivo [`docs/CREDITOS.txt`](docs/CREDITOS.txt) para detalhes de cada recurso artístico de terceiros utilizado:
- **LPC Base Assets**: CC-BY-SA 3.0 / GPL 3.0 (Redshrike, Sharm, CharlesGabriel, etc.)
- **496 Pixel Art Icons**: CC0 Domínio Público por Henrique Lazarini (7Soul1)
- **Battle Theme A**: CC0 Domínio Público por Cynicmusic
- **RPG Sound Pack**: CC0 Domínio Público por artisticdude
- **Fonte Press Start 2P**: SIL Open Font License por CodeMan38
