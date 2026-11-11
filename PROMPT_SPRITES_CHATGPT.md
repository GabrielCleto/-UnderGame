# 🎨 Guia & Prompts para Criação de Sprites no ChatGPT
### Underground Game — Instruções para Animações 100% Fluidas

Este documento contém os **prompts exatos e especificações técnicas** prontos para você copiar e colar no ChatGPT (ou em qualquer IA geradora de imagens/sprites) para gerar spritesheets profissionais, mantendo rigorosamente o **design original dos seus personagens** e garantindo que as animações fiquem **perfeitas, sem tremer e sem bugar**.

---

## 📌 Regra de Ouro antes de enviar ao ChatGPT:
1. Abra o ChatGPT (de preferência GPT-4o).
2. **Anexe a imagem do seu personagem atual** (por exemplo, `personagem.png`, `amxral.png` ou `tuiuba.png`).
3. Copie o prompt abaixo referente ao personagem que você quer criar e cole no chat junto com a imagem anexada.

---

## 🗡️ PROMPT 1: MANGUINHA (Garoto do Sabre)

*(Anexe a imagem `personagem.png` e envie o texto abaixo:)*

```text
Você é um artista profissional de Pixel Art especialista em animação de jogos 2D (top-down / isometric / RPG de ação).
Estou anexando a imagem original do meu personagem protagonista: "Manguinha".

⚠️ REGRA PRINCIPAL:
NÃO ALTERE O DESIGN DO PERSONAGEM. Mantenha rigorosamente o mesmo estilo visual, corte de cabelo, roupas, proporções chibi/pixel art, paleta de cores e o sabre de luz azul/ciano neon. Ele deve ser IDÊNTICO ao personagem da imagem de referência.

Preciso de uma FOLHA DE SPRITES (SPRITESHEET) COMPLETA e PROFISSIONAL com fundo 100% transparente (PNG), organizada em uma GRADE FIXA (GRID UNIFORME) para que as animações fiquem perfeitamente fluidas.

ESPECIFICAÇÕES TÉCNICAS OBRIGATÓRIAS:
1. Tamanho fixo de célula: Cada quadro/frame deve ter exatamente 64x64 pixels (ou 80x80 pixels), com espaço de respiro ao redor para que a espada nunca seja cortada pela borda.
2. Linha de chão fixa (Ancoragem dos Pés): Em todos os quadros, os pés do personagem devem tocar SEMPRE na mesma altura exata Y do chão (por exemplo, na linha Y = 58 da célula). NENHUM quadro pode flutuar ou afundar.
3. Paleta limpa: Sem ruídos ou gradientes desfocados, pixel art limpo com contornos nítidos.

ORGANIZAÇÃO DAS LINHAS (ROWS) DO SPRITESHEET:

• LINHA 1 (Idle - Parado com Respiração):
  - 6 frames: Ciclo suave de respiração (peito subindo e descendo 1 pixel, sabre ligado brilhando).

• LINHA 2 (Walk Down - Andar para Baixo / Frente):
  - 8 frames: Ciclo completo de caminhada olhando para a câmera (contato pé esquerdo, passagem, contato pé direito, passagem). Pés firmes no chão.

• LINHA 3 (Walk Up - Andar para Cima / Costas):
  - 8 frames: Ciclo completo de caminhada de costas para a câmera (mostrando o cabelo e as costas com passadas sincronizadas).

• LINHA 4 (Walk Side - Andar de Lado / Perfil):
  - 8 frames: Ciclo completo de caminhada lateral fluida para a direita (passadas largas naturais, sabre balançando suavemente).

• LINHA 5 (Attack Side - Corte de Sabre para o Lado):
  - 5 frames:
    Frame 1: Preparação rápida (windup - sabre erguido atrás do ombro).
    Frame 2: Avanço de corte rápido.
    Frame 3: Impacto do corte com arco de luz do sabre completo e brilhante.
    Frame 4: Extensão final do golpe.
    Frame 5: Retorno suave para a base.

• LINHA 6 (Attack Down - Corte de Sabre para Baixo / Frente):
  - 5 frames: Corte diagonal descendente virado para a frente, sabre cortando de cima para baixo.

• LINHA 7 (Attack Up - Corte de Sabre para Cima / Costas):
  - 5 frames: Corte ascendente virado de costas, mirando para cima.

• LINHA 8 (Dash / Spin - Giro 360°):
  - 8 frames: Personagem girando em torno de si mesmo em 360 graus com rastro de sabre (para esquiva rápida).

Gere o spritesheet alinhado em grade uniforme com fundo transparente de alta qualidade.
```

---

## ⭐ PROMPT 2: AMXRAL (Estrela do Bloco)

*(Anexe a imagem `amxral.png` e envie o texto abaixo:)*

```text
Você é um artista profissional de Pixel Art especialista em animação de jogos 2D top-down.
Estou anexando a imagem original do meu personagem: "Amxral".

⚠️ REGRA PRINCIPAL:
NÃO ALTERE O DESIGN DO PERSONAGEM. Mantenha rigorosamente o mesmo visual, proporções, roupas, cores e temática mágica estelar da imagem anexada.

Preciso de uma FOLHA DE SPRITES (SPRITESHEET) COMPLETA e PROFISSIONAL com fundo 100% transparente (PNG), organizada em uma GRADE FIXA (GRID UNIFORME).

ESPECIFICAÇÕES TÉCNICAS:
1. Tamanho fixo de célula: 80x80 pixels por quadro, com espaçamento uniforme.
2. Linha de chão fixa: Os pés devem tocar exatamente na mesma linha Y da célula em todos os quadros (sem tremores ou pulos de altura).
3. Pixel art limpo e nítido.

ORGANIZAÇÃO DAS LINHAS:
• LINHA 1 (Idle): 6 frames de respiração mágica flutuante leve.
• LINHA 2 (Walk Down): 8 frames andando para a frente/baixo com passada elegante.
• LINHA 3 (Walk Up): 8 frames andando de costas/cima.
• LINHA 4 (Walk Side): 8 frames correndo de perfil/lado.
• LINHA 5 (Attack Side - Arremesso de Estrela para o Lado): 5 frames (preparar mão -> lançar estrela brilhante -> pose de liberação com faíscas).
• LINHA 6 (Attack Down - Arremesso para Baixo): 5 frames arremessando em direção à câmera.
• LINHA 7 (Attack Up - Arremesso para Cima): 5 frames arremessando para o topo.
• LINHA 8 (Spin / Dash Acrobático): 8 frames de pirueta estelar em 360°.

Gere o spritesheet em grade perfeita e fundo transparente.
```

---

## 🍊 PROMPT 3: TUIUBA (Orange Jui)

*(Anexe a imagem `tuiuba.png` e envie o texto abaixo:)*

```text
Você é um artista profissional de Pixel Art especialista em sprites para jogos de ação 2D.
Estou anexando a imagem original do meu personagem: "Tuiuba".

⚠️ REGRA PRINCIPAL:
NÃO ALTERE O DESIGN DO PERSONAGEM. Mantenha a mesma fisionomia, cores cítricas vibrantes, físico e visual da imagem anexada.

Preciso de uma FOLHA DE SPRITES (SPRITESHEET) COMPLETA e PROFISSIONAL com fundo 100% transparente (PNG), com células em GRADE FIXA (GRID UNIFORME).

ESPECIFICAÇÕES TÉCNICAS:
1. Tamanho fixo de célula: 80x80 pixels por quadro.
2. Ancoragem dos pés: Mesma linha Y do chão em toda a folha.
3. Pixel art expressivo e nítido.

ORGANIZAÇÃO DAS LINHAS:
• LINHA 1 (Idle): 6 frames com pose confiante e quicando levemente uma laranja na mão.
• LINHA 2 (Walk Down): 8 frames de marcha pesada e ritmada para frente.
• LINHA 3 (Walk Up): 8 frames andando de costas.
• LINHA 4 (Walk Side): 8 frames correndo de lado com vigor.
• LINHA 5 (Attack Side - Arremesso de Bomba Cítrica de Lado): 5 frames arremessando a laranja explosiva com respingos de suco.
• LINHA 6 (Attack Down - Arremesso para Baixo): 5 frames atirando a laranja para a frente/baixo.
• LINHA 7 (Attack Up - Arremesso para Cima): 5 frames arremessando para cima.
• LINHA 8 (Roll / Dash): 8 frames de rolamento rápido com efeito cítrico.

Gere a folha em grade regular e fundo transparente.
```

---

## 💡 Dicas de Ouro se o ChatGPT cometer pequenos erros:

Se a imagem gerada pelo ChatGPT vier com algum detalhe fora do lugar, envie estes comandos curtos de correção:

1. **Se a arma ou cabeça foi cortada na borda:**
   > *"Por favor, aumente o tamanho da célula para 96x96 pixels e dê mais espaço de respiro (padding) para que a ponta da arma e a cabeça nunca encostem na borda do quadro."*

2. **Se o boneco estiver pulando ou os pés desalinhados:**
   > *"Mantenha rigorosamente todos os pés alinhados no mesmo eixo horizontal Y da base. Nenhum frame pode ter os pés mais altos ou mais baixos que os outros."*

3. **Se o fundo não vier transparente:**
   > *"Gere a imagem em formato PNG com fundo 100% transparente e sem sombras difusas no chão."*

4. **Se o ChatGPT mudar a cor ou a roupa:**
   > *"Você alterou a roupa/cabelo do personagem. Volte exatamente para o design da imagem de referência que anexei no início, mantendo apenas a animação solicitada."*

---

Assim que você gerar as novas imagens e salvar em `assets/`, o código poderá recortar as células com precisão milimétrica e as animações vão rodar com 100% de fluidez em qualquer direção!
