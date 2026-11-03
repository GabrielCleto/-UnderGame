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

## 📂 Estrutura do Projeto

```
-UnderGame/
├── assets/
│   ├── audio/           # Trilha sonora e efeitos sonoros
│   ├── fonts/           # Fonte retrô Press Start 2P
│   ├── icons/           # Ícones de habilidades, armas e itens
│   ├── lpc/             # Spritesheets de monstros, terrenos e mapa
│   └── *.png            # Spritesheets e retratos dos personagens jogáveis
├── CREDITOS.txt         # Atribuição das licenças de áudio e arte
├── game.js              # Motor completo do jogo, física, combate e controles
├── index.html           # Ponto de entrada do jogo
├── style.css            # Estilização do canvas e tela cheia
├── .gitignore           # Filtros de arquivos do repositório
└── README.md            # Documentação do projeto
```

---

## 📜 Créditos & Licenças

Consulte o arquivo [`CREDITOS.txt`](CREDITOS.txt) para detalhes de cada recurso artístico de terceiros utilizado:
- **LPC Base Assets**: CC-BY-SA 3.0 / GPL 3.0 (Redshrike, Sharm, CharlesGabriel, etc.)
- **496 Pixel Art Icons**: CC0 Domínio Público por Henrique Lazarini (7Soul1)
- **Battle Theme A**: CC0 Domínio Público por Cynicmusic
- **RPG Sound Pack**: CC0 Domínio Público por artisticdude
- **Fonte Press Start 2P**: SIL Open Font License por CodeMan38
