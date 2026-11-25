# 🚀 PROMPT MESTRE DE CONTINUAÇÃO DO JOGO NO GODOT ENGINE 4

> **INSTRUÇÃO PARA O DESENVOLVEDOR OU AGENTE DE IA**:
> Você está assumindo o desenvolvimento contínuo do jogo **"Theo Lucca - Cidade Real 3D"**, originalmente concebido e prototipado em ambiente 3D web e agora migrado oficialmente para o **Godot Engine 4.2+ / 4.3+**.
> Leia atentamente toda a especificação abaixo antes de escrever qualquer código, criar cenas ou modificar scripts.

---

## 1. VISÃO GERAL E IDENTIDADE DO JOGO

- **Nome Oficial**: Theo Lucca - Cidade Real 3D
- **Motor / Engine**: Godot Engine 4 (versão 4.2 ou superior, idealmente 4.3+)
- **Renderizador Alvo**: `Forward+` para PC e `Mobile` (Vulkan Mobile / OpenGL Compatibility) para Android de entrada.
- **Taxa de Quadros Alvo**: 60 FPS estáveis em computadores médios e celulares Android populares.
- **Protagonista**: **Theo Lucca**, um garotinho brasileiro alegre e aventureiro de 4 anos (escala de altura proporcional de 1.05m), com pele morena clara (#c68652), olhos castanhos vivos estilo animação Pixar, cabelos cacheados castanhos escuros, boné aba curva, regata/camiseta azul, bermuda streetwear, tênis esportivos bicolores e mochila de couro para guardar itens encontrados pela cidade.
- **Ambientação**: Cidade brasileira acolhedora, solar e vibrante chamada **Cidade Real**, contendo:
  - Praça Central com chafariz, bancos de madeira/mármore, árvores floridas (Ipês amarelos e cerejeiras) e um pedestal de LED neon ciano futurista no centro.
  - Oficina Mecânica do Theo Lucca com elevadores hidráulicos e ferramentas.
  - Padaria do Seu Manuel, Pizzaria do Luigi e Mini-Mercado de bairro com toldos coloridos.
  - Avenidas com asfalto sinalizado, postes vintage iluminados, trânsito de carros, caminhonetes e motos esportivas.
  - Bairro residencial com casas modernas e terrenos demarcados para construção do próprio jogador.

---

## 2. REGRAS OBRIGATÓRIAS E INVIOLÁVEIS

1. **Preservar a Estrutura Existente**: Nunca apague, renomeie ou quebre scripts e cenas já implementados (`scenes/player/player.tscn`, `scenes/main.tscn`, `scripts/economy_manager.gd`, etc.).
2. **Identidade do Personagem**: Mantenha a proporção infantil de 1.05m e os traços carismáticos do Theo Lucca. A animação deve ser procedural ou esquelética mantendo o peso, respiração e passos saltitantes de uma criança de 4 anos.
3. **Economia Tripla Sem Pagamentos Reais Forçados**:
   - 🪙 **Ouro**: recurso gratuito ganho através de missões, exploração, coleta na rua e trabalhos na oficina/padaria.
   - 💎 **Diamantes**: moeda especial encontrada em locais secretos (telhados, becos ocultos, marcos urbanos).
   - ❇️ **Esmeraldas**: moeda premium obtida em missões lendárias raras ou configurada via painel administrativo.
   - Nunca torne compras reais obrigatórias para progredir no jogo.
4. **Convenções de Código no Godot 4**:
   - Use **GDScript 2.0** com tipagem estática explícita (`var speed: float = 4.2`, `func get_wallet() -> Dictionary:`).
   - Use `@export`, `@onready`, e `@rpc` conforme a sintaxe moderna do Godot 4.
   - Conecte nós e eventos através de sinais (`signals`) desacoplados.
   - Salve os dados de progresso e economia sempre em `user://economy_data.json`.

---

## 3. ARQUITETURA DE ARQUIVOS DO PROJETO GODOT 4

```
res://
├── project.godot                     # Configuração global do projeto (inputs, display, rendering)
├── icon.svg                          # Ícone oficial com a Esmeralda e Coroa Dourada
├── README_GODOT4.md                  # Guia de inicialização rápida
├── scenes/
│   ├── main.tscn                     # Cena principal 3D com WorldEnvironment, iluminação e cidade
│   ├── player/
│   │   └── player.tscn               # Cena do Theo Lucca (CharacterBody3D, colisores, câmera)
│   ├── city/
│   │   ├── building_modern.tscn      # Modelo 3D de residência contemporânea
│   │   ├── sports_car.tscn           # Carro esportivo V12 dirigível/tráfego
│   │   ├── street_lamp.tscn          # Poste de luz funcional
│   │   └── plaza_pedestal.tscn       # Pedestal circular com anel de LED neon ciano
│   └── ui/
│       ├── hud.tscn                  # HUD em tela (carteira, minimapa circular, joystick mobile)
│       └── store_modal.tscn          # Loja Esmeralda Store estilo Free Fire com palco 3D
└── scripts/
    ├── player.gd                     # Controlador 3D, física, pulo, sprint e animações do jogador
    ├── camera_controller.gd          # Câmera orbital terceira pessoa com SpringArm3D (PC e toque mobile)
    ├── economy_manager.gd            # Autoload Singleton para saldo, transações e inventário
    ├── store_modal.gd                # Lógica da loja com 7 categorias e troca em tempo real de roupas
    ├── city_traffic.gd               # Sistema de tráfego autônomo (Path3D / NavigationAgent3D)
    └── building_placer.gd            # Sistema de posicionamento de construções em grade no terreno
```

---

## 4. TAREFAS DE CONTINUAÇÃO PRIORITÁRIAS (ROADMAP)

### TAREFA 1: Sistema de Tráfego Autônomo e Veículos Dirigíveis
- **Objetivo**: Dar vida às avenidas da Cidade Real com carros (Táxi Amarelo, Carro Azul Esportivo, Van Vermelha, Picape e Fusquinha) e motos esportivas.
- **Implementação**:
  - Criar um nó `Path3D` ao longo das faixas de rodagem e usar nós `PathFollow3D` com controle de velocidade, ou nós `CharacterBody3D` utilizando `NavigationAgent3D`.
  - Adicionar detecção de obstáculos na frente com `RayCast3D` para os carros pararem quando o jogador atravessar a rua ou quando o semáforo estiver vermelho.
  - Implementar ação interativa: ao aproximar de um carro estacionado ou na oficina, pressionar **E** (ou tocar no botão mobile `PILOTAR`) para o Theo Lucca entrar como motorista ou passageiro, mudando a câmera para modo veicular.

### TAREFA 2: Sistema de Missões e NPCs com Diálogos
- **Objetivo**: Conectar o mundo 3D com trabalhos divertidos para o Theo Lucca ganhar Ouro e Diamantes.
- **NPCs a Implementar**:
  - **Mecânico Carlos (Oficina)**: Missão de apertar parafusos em carros com a chave inglesa ou buscar peças.
  - **Seu Manuel (Padaria)**: Missão de entrega de pães e bolos no bairro com tempo limite.
  - **Luigi (Pizzaria)**: Missão de entrega de pizza quente nas casas marcadas pelo farol luminoso.
- **Mecânica de Entrega**: Farol/tubo de luz vertical luminoso (`CylinderMesh` translúcido ciano/amarelo com material emissivo) indicando o local de destino e distância em metros.

### TAREFA 3: Sistema de Construção e Urbanismo no Terreno
- **Objetivo**: Permitir que o jogador use os itens comprados na categoria "Construção" e "Decoração" para expandir sua cidade.
- **Implementação**:
  - Modo Construção ativado pela HUD.
  - Pré-visualização holográfica semitransparente verde (posição válida) ou vermelha (sobreposta ou fora do terreno desbloqueado).
  - Teclas para **Girar (R / Q)** e **Confirmar (Enter / Espaço / Botão Confirmar)**.
  - As construções retiradas retornam imediatamente para o inventário sem perda de recursos.
  - Posições salvas automaticamente no `user://economy_data.json`.

### TAREFA 4: Áudio 3D Imersivo e Efeitos Sonoros
- **Implementar nós `AudioStreamPlayer3D`**:
  - Passadas procedurais do Theo Lucca alternando conforme o chão (asfalto, grama, calçada).
  - Sons de buzina, ronco de motor acelerando e freadas.
  - Efeito sonoro característico de moeda colhida (ouro e diamantes).
  - Música de fundo alegre e relaxante estilo desenho animado / mundo aberto infantil.

### TAREFA 5: HUD Mobile e Controles Táteis Otimizados
- Adicionar joystick virtual analógico em nó `Control` com captura de `InputEventScreenTouch` e `InputEventScreenDrag`.
- Botões circulares na tela para celulares: `PULAR`, `CORRER`, `INTERAGIR`, `LOJA` e `MOCHILA`.
- Garantir que a escala da UI use `window/stretch/mode="canvas_items"` e `window/stretch/aspect="expand"` para caber perfeitamente em telas com notch e formatos 19.5:9 ou 20:9.

---

## 5. EXEMPLO PRÁTICO DE CÓDIGO PARA NOVAS FEATURES

Ao implementar novos sistemas, siga rigorosamente a estrutura deste exemplo:

```gdscript
extends CharacterBody3D
class_name VehicleController

@export var max_speed: float = 16.0
@export var acceleration: float = 8.0
@export var steering_speed: float = 2.5

var current_speed: float = 0.0
var driver: TheoLuccaPlayer = null

@onready var engine_sound: AudioStreamPlayer3D = $EngineSound

func enter_vehicle(player: TheoLuccaPlayer) -> void:
	driver = player
	driver.visible = false
	driver.set_physics_process(false)
	if engine_sound: engine_sound.play()

func exit_vehicle() -> void:
	if driver:
		driver.global_position = global_position + global_transform.basis.x * 2.0
		driver.visible = true
		driver.set_physics_process(true)
		driver = null
	if engine_sound: engine_sound.stop()
```

---

> **COMANDO DE INÍCIO**:
> "Você tem em mãos o projeto oficial Godot 4 de **Theo Lucca - Cidade Real 3D**. Proceda com as tarefas acima priorizando código robusto, performático, documentado em português e com foco em diversão, estabilidade a 60 FPS e estética vibrante de alta qualidade!"
