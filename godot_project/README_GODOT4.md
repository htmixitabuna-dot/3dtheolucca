# 🎮 Theo Lucca - Cidade Real 3D (Godot Engine 4.x)

Este projeto foi convertido e configurado para o **Godot Engine 4.2+ / 4.3+**, trazendo todos os sistemas do jogo:

- **Personagem Theo Lucca (CharacterBody3D)**: escala real proporcional (1.05m), movimentação suave 3D, corrida, pulo, gravidade, câmera orbital de terceira pessoa com detecção de colisão (SpringArm3D) e animações procedurais de respiração, balanço de membros e aceno.
- **Sistema de Economia Completo (`scripts/economy_manager.gd`)**:
  - 🪙 **Ouro**: moeda de trabalho e exploração.
  - 💎 **Diamantes**: moeda especial de locais secretos.
  - ❇️ **Esmeraldas**: moeda premium.
  - Histórico de até 300 transações persistentes salvas em `user://economy_data.json`.
- **Esmeralda Store Estilo Free Fire (`scripts/store_modal.gd`)**:
  - 7 categorias oficiais: Destaques, Personagens, Roupas, Construção, Garagem, Decoração e Exclusivos.
  - Pedestal circular com luz de LED neon ciano.
  - Pré-visualização do avatar 3D com rotação 360° em tempo real.
  - Aplicação imediata de roupas, bonés, óculos e tênis no personagem.
- **Ambiente 3D da Cidade**: iluminação solar, céu procedural, névoa atmosférica, praça com pedestal e sombras em tempo real.

---

## 🚀 Como abrir no Godot Engine 4:

1. Baixe o **Godot Engine 4.3** (ou superior) em [godotengine.org](https://godotengine.org).
2. Abra o Godot e clique no botão **"Import"** (Importar).
3. Selecione o arquivo `project.godot` dentro desta pasta `godot_project/`.
4. Clique em **"Import & Edit"** (Importar e Editar).
5. Pressione **F5** (ou o botão ▶️ no canto superior direito) para rodar o jogo imediatamente!

## 🕹️ Controles:

- **W, A, S, D**: Mover o personagem
- **Espaço**: Pular
- **Shift**: Correr / Sprint
- **Botão Direito do Mouse (Arrastar)**: Girar a câmera orbital ao redor do personagem
- **Touch / Toque (Android)**: Arrastar para girar a câmera e movimentar
- **E**: Interagir / Abrir loja
