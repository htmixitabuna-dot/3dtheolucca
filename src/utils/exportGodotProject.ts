import JSZip from 'jszip';

// Conteúdos dos arquivos do projeto Godot 4 prontos para exportação
const GODOT_PROJECT_FILE = `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; but it can also be edited by hand.

config_version=5

[application]

config/name="Theo Lucca - Cidade Real 3D"
config/description="Jogo 3D completo em mundo aberto com sistema de economia (Ouro, Diamantes e Esmeraldas), Esmeralda Store estilo Free Fire, Inventario, Construcao e Personalizacao."
run/main_scene="res://scenes/main.tscn"
config/features=PackedStringArray("4.3", "Forward Plus", "Mobile")
boot_splash/bg_color=Color(0.06, 0.09, 0.16, 1)
config/icon="res://icon.svg"

[display]

window/size/viewport_width=1280
window/size/viewport_height=720
window/size/mode=0
window/stretch/mode="canvas_items"
window/stretch/aspect="expand"
window/handheld/orientation=6

[input]

move_forward={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194320,"physical_keycode":87,"key_label":0,"unicode":119,"echo":false,"script":null)
]
}
move_backward={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194322,"physical_keycode":83,"key_label":0,"unicode":115,"echo":false,"script":null)
]
}
move_left={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194319,"physical_keycode":65,"key_label":0,"unicode":97,"echo":false,"script":null)
]
}
move_right={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194321,"physical_keycode":68,"key_label":0,"unicode":100,"echo":false,"script":null)
]
}
jump={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":32,"physical_keycode":32,"key_label":0,"unicode":32,"echo":false,"script":null)
]
}
sprint={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":4194325,"physical_keycode":4194325,"key_label":0,"unicode":0,"echo":false,"script":null)
]
}
interact={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":0,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":69,"physical_keycode":69,"key_label":0,"unicode":101,"echo":false,"script":null)
]
}

[rendering]

renderer/rendering_method="forward_plus"
renderer/rendering_method.mobile="mobile"
textures/vram_compression/import_etc2_astc=true
anti_aliasing/quality/msaa_3d=2
`;

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#0f172a"/>
  <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="#10b981" stroke-width="4"/>
  <polygon points="64,18 102,46 88,102 40,102 26,46" fill="#10b981" stroke="#34d399" stroke-width="3"/>
  <polygon points="64,28 92,48 80,92 48,92 36,48" fill="#059669"/>
  <polygon points="46,60 52,78 64,65 76,78 82,60 76,86 52,86" fill="#facc15"/>
  <circle cx="46" cy="58" r="3" fill="#fef08a"/>
  <circle cx="64" cy="54" r="3.5" fill="#fef08a"/>
  <circle cx="82" cy="58" r="3" fill="#fef08a"/>
</svg>`;

const SCRIPT_ECONOMY_MANAGER = `extends Node
class_name EconomyManager

signal wallet_updated(gold: float, diamonds: int, emeralds: int)
signal item_purchased(product_id: String)
signal inventory_updated()

var gold: float = 12850.0
var diamonds: int = 450
var emeralds: int = 120

var inventory: Array[Dictionary] = []
var transactions: Array[Dictionary] = []
var placed_buildings: Array[Dictionary] = []

const SAVE_PATH = "user://economy_data.json"

func _ready() -> void:
	load_data()

func get_wallet() -> Dictionary:
	return { "gold": gold, "diamonds": diamonds, "emeralds": emeralds }

func add_currency(type: String, amount: float, description: String = "Ganho no jogo") -> void:
	match type:
		"gold": gold += amount
		"diamonds": diamonds += int(amount)
		"emeralds": emeralds += int(amount)
	_record_transaction("earn", type, amount, description)
	save_data()
	wallet_updated.emit(gold, diamonds, emeralds)

func spend_currency(type: String, amount: float, description: String = "Compra na loja") -> bool:
	var can_afford: bool = false
	match type:
		"gold":
			can_afford = gold >= amount
			if can_afford: gold -= amount
		"diamonds":
			can_afford = diamonds >= int(amount)
			if can_afford: diamonds -= int(amount)
		"emeralds":
			can_afford = emeralds >= int(amount)
			if can_afford: emeralds -= int(amount)
	
	if can_afford:
		_record_transaction("spend", type, amount, description)
		save_data()
		wallet_updated.emit(gold, diamonds, emeralds)
		return true
	return false

func purchase_product(product: Dictionary, currency_type: String) -> bool:
	var price: float = product.get("prices", {}).get(currency_type, 0.0)
	if price <= 0: return false
	if spend_currency(currency_type, price, "Compra: " + product.get("name", "Item")):
		add_to_inventory(product)
		item_purchased.emit(product.get("id", ""))
		return true
	return false

func add_to_inventory(product: Dictionary) -> void:
	inventory.append({
		"id": "inv_" + str(Time.get_unix_time_from_system()) + "_" + str(randi() % 1000),
		"product_id": product.get("id"),
		"name": product.get("name"),
		"category": product.get("category"),
		"quantity": 1,
		"customization": product.get("customization_data", {}),
		"acquired_at": Time.get_unix_time_from_system()
	})
	save_data()
	inventory_updated.emit()

func _record_transaction(type: String, currency: String, amount: float, desc: String) -> void:
	transactions.append({
		"id": "tx_" + str(Time.get_unix_time_from_system()),
		"timestamp": Time.get_unix_time_from_system(),
		"type": type,
		"currency": currency,
		"amount": amount,
		"description": desc
	})

func save_data() -> void:
	var data = {
		"gold": gold,
		"diamonds": diamonds,
		"emeralds": emeralds,
		"inventory": inventory,
		"transactions": transactions,
		"placed_buildings": placed_buildings
	}
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\\t"))
		file.close()

func load_data() -> void:
	if not FileAccess.file_exists(SAVE_PATH): return
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var content = file.get_as_text()
		file.close()
		var json = JSON.new()
		if json.parse(content) == OK:
			var data = json.get_data()
			if data is Dictionary:
				gold = data.get("gold", gold)
				diamonds = data.get("diamonds", diamonds)
				emeralds = data.get("emeralds", emeralds)
				inventory = data.get("inventory", [])
				transactions = data.get("transactions", [])
				placed_buildings = data.get("placed_buildings", [])
				wallet_updated.emit(gold, diamonds, emeralds)
`;

const SCRIPT_PLAYER = `extends CharacterBody3D
class_name TheoLuccaPlayer

@export var walk_speed: float = 4.2
@export var sprint_speed: float = 7.5
@export var jump_velocity: float = 6.2
@export var rotation_speed: float = 12.0

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

@onready var visual_root: Node3D = $VisualRoot
@onready var head_node: Node3D = $VisualRoot/Torso/Head
@onready var left_arm: Node3D = $VisualRoot/Torso/LeftArm
@onready var right_arm: Node3D = $VisualRoot/Torso/RightArm
@onready var left_leg: Node3D = $VisualRoot/LeftLeg
@onready var right_leg: Node3D = $VisualRoot/RightLeg

@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera: Camera3D = $CameraPivot/SpringArm3D/Camera3D

var anim_time: float = 0.0
var is_waving: bool = false
var wave_timer: float = 0.0

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y -= gravity * delta

	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity

	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var is_sprinting: bool = Input.is_action_pressed("sprint")
	var current_speed: float = sprint_speed if is_sprinting else walk_speed

	var cam_forward: Vector3 = -camera.global_transform.basis.z
	var cam_right: Vector3 = camera.global_transform.basis.x
	cam_forward.y = 0.0
	cam_right.y = 0.0
	cam_forward = cam_forward.normalized()
	cam_right = cam_right.normalized()

	var move_direction: Vector3 = (cam_right * input_dir.x + cam_forward * input_dir.y).normalized()

	if move_direction != Vector3.ZERO:
		velocity.x = move_direction.x * current_speed
		velocity.z = move_direction.z * current_speed
		var target_rot: float = atan2(-move_direction.x, -move_direction.z)
		visual_root.rotation.y = lerp_angle(visual_root.rotation.y, target_rot, rotation_speed * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, current_speed * 8.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, current_speed * 8.0 * delta)

	move_and_slide()
	_update_procedural_animations(delta, Vector2(velocity.x, velocity.z).length(), is_on_floor(), is_sprinting)

func _update_procedural_animations(delta: float, speed: float, on_ground: bool, running: bool) -> void:
	anim_time += delta
	if wave_timer > 0.0:
		wave_timer -= delta
		is_waving = wave_timer > 0.0

	if not on_ground:
		left_arm.rotation.x = -1.1
		right_arm.rotation.x = -1.1
		left_leg.rotation.x = 0.45
		right_leg.rotation.x = -0.3
		return

	if speed > 0.1:
		var freq: float = 16.0 if running else 9.5
		var arm_swing: float = 1.05 if running else 0.65
		var leg_swing: float = 0.95 if running else 0.55
		var cycle: float = sin(anim_time * freq)

		left_arm.rotation.x = cycle * arm_swing
		right_arm.rotation.x = -cycle * arm_swing
		left_leg.rotation.x = -cycle * leg_swing
		right_leg.rotation.x = cycle * leg_swing
	else:
		var breath: float = sin(anim_time * 2.8)
		head_node.rotation.x = breath * 0.03
		head_node.rotation.y = sin(anim_time * 0.9) * 0.14
		left_arm.rotation.x = sin(anim_time * 1.4) * 0.05
		right_arm.rotation.x = -sin(anim_time * 1.4) * 0.05
		left_leg.rotation.x = 0.0
		right_leg.rotation.x = 0.0

func wave() -> void:
	is_waving = true
	wave_timer = 2.5
`;

const SCRIPT_CAMERA_CONTROLLER = `extends Node3D
class_name ThirdPersonCameraController

@export var mouse_sensitivity: float = 0.003
@export var touch_sensitivity: float = 0.005
@export var min_pitch: float = -45.0
@export var max_pitch: float = 60.0

@onready var spring_arm: SpringArm3D = $SpringArm3D

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		rotate_camera(event.relative.x * mouse_sensitivity, event.relative.y * mouse_sensitivity)
	elif event is InputEventScreenDrag:
		rotate_camera(event.relative.x * touch_sensitivity, event.relative.y * touch_sensitivity)

func rotate_camera(yaw_delta: float, pitch_delta: float) -> void:
	rotation.y -= yaw_delta
	if spring_arm:
		spring_arm.rotation.x = clamp(
			spring_arm.rotation.x - pitch_delta,
			deg_to_rad(min_pitch),
			deg_to_rad(max_pitch)
		)
`;

const SCRIPT_STORE_MODAL = `extends Control
class_name EsmeraldaStoreUI

signal item_bought(product: Dictionary)
signal closed()

@export var player_node: TheoLuccaPlayer

@onready var gold_label: Label = $TopHeader/WalletContainer/GoldContainer/Label
@onready var diamonds_label: Label = $TopHeader/WalletContainer/DiamondsContainer/Label
@onready var emeralds_label: Label = $TopHeader/WalletContainer/EmeraldsContainer/Label

@onready var product_title: Label = $RightCard/VBox/TitleLabel
@onready var rarity_badge: Label = $RightCard/VBox/RarityBadge
@onready var description_label: Label = $RightCard/VBox/DescLabel
@onready var buy_button: Button = $RightCard/VBox/BuyButton

var current_category: String = "destaques"
var selected_product: Dictionary = {}
var chosen_currency: String = "gold"

func _ready() -> void:
	update_wallet_display()

func update_wallet_display() -> void:
	var economy = get_node_or_null("/root/EconomyManager")
	if economy:
		gold_label.text = str(int(economy.gold))
		diamonds_label.text = str(economy.diamonds)
		emeralds_label.text = str(economy.emeralds)

func close_store() -> void:
	visible = false
	closed.emit()
`;

const README_MD = `# 🎮 Theo Lucca - Cidade Real 3D (Godot Engine 4.x)

Projeto convertido e exportado para o **Godot Engine 4.2+ / 4.3+**!

## 🚀 Como Executar:
1. Abra o **Godot 4**.
2. Clique em **Import** e selecione o arquivo \`project.godot\`.
3. Pressione **F5** para rodar o jogo imediatamente!

## 📄 Prompt Mestre de Continuação:
Consulte o arquivo \`PROMPT_MESTRE_GODOT4.md\` para instruções completas de continuidade com Inteligência Artificial ou equipe de desenvolvimento.
`;

const PROMPT_MESTRE_MD = `# 🚀 PROMPT MESTRE DE CONTINUAÇÃO DO JOGO NO GODOT ENGINE 4

> **INSTRUÇÃO PARA O DESENVOLVEDOR OU AGENTE DE IA**:
> Você está assumindo o desenvolvimento contínuo do jogo **"Theo Lucca - Cidade Real 3D"**, originalmente concebido e prototipado em ambiente 3D web e agora migrado oficialmente para o **Godot Engine 4.2+ / 4.3+**.
> Leia atentamente toda a especificação abaixo antes de escrever qualquer código, criar cenas ou modificar scripts.

---

## 1. VISÃO GERAL E IDENTIDADE DO JOGO

- **Nome Oficial**: Theo Lucca - Cidade Real 3D
- **Motor / Engine**: Godot Engine 4 (versão 4.2 ou superior, idealmente 4.3+)
- **Renderizador Alvo**: \`Forward+\` para PC e \`Mobile\` (Vulkan Mobile / OpenGL Compatibility) para Android de entrada.
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

1. **Preservar a Estrutura Existente**: Nunca apague, renomeie ou quebre scripts e cenas já implementados (\`scenes/player/player.tscn\`, \`scenes/main.tscn\`, \`scripts/economy_manager.gd\`, etc.).
2. **Identidade do Personagem**: Mantenha a proporção infantil de 1.05m e os traços carismáticos do Theo Lucca. A animação deve ser procedural ou esquelética mantendo o peso, respiração e passos saltitantes de uma criança de 4 anos.
3. **Economia Tripla Sem Pagamentos Reais Forçados**:
   - 🪙 **Ouro**: recurso gratuito ganho através de missões, exploração, coleta na rua e trabalhos na oficina/padaria.
   - 💎 **Diamantes**: moeda especial encontrada em locais secretos (telhados, becos ocultos, marcos urbanos).
   - ❇️ **Esmeraldas**: moeda premium obtida em missões lendárias raras ou configurada via painel administrativo.
   - Nunca torne compras reais obrigatórias para progredir no jogo.
4. **Convenções de Código no Godot 4**:
   - Use **GDScript 2.0** com tipagem estática explícita (\`var speed: float = 4.2\`, \`func get_wallet() -> Dictionary:\`).
   - Use \`@export\`, \`@onready\`, e \`@rpc\` conforme a sintaxe moderna do Godot 4.
   - Conecte nós e eventos através de sinais (\`signals\`) desacoplados.
   - Salve os dados de progresso e economia sempre em \`user://economy_data.json\`.

---

## 3. ARQUITETURA DE ARQUIVOS DO PROJETO GODOT 4

\`\`\`
res://
├── project.godot                     # Configuração global do projeto (inputs, display, rendering)
├── icon.svg                          # Ícone oficial com a Esmeralda e Coroa Dourada
├── README_GODOT4.md                  # Guia de inicialização rápida
├── PROMPT_MESTRE_GODOT4.md           # Prompt mestre de continuidade
├── scenes/
│   ├── main.tscn                     # Cena principal 3D com WorldEnvironment, iluminação e cidade
│   └── player/
│       └── player.tscn               # Cena do Theo Lucca (CharacterBody3D, colisores, câmera)
└── scripts/
    ├── player.gd                     # Controlador 3D, física, pulo, sprint e animações do jogador
    ├── camera_controller.gd          # Câmera orbital terceira pessoa com SpringArm3D (PC e toque mobile)
    ├── economy_manager.gd            # Autoload Singleton para saldo, transações e inventário
    ├── store_modal.gd                # Lógica da loja com 7 categorias e troca em tempo real de roupas
    ├── city_traffic.gd               # Sistema de tráfego autônomo (Path3D / NavigationAgent3D)
    └── building_placer.gd            # Sistema de posicionamento de construções em grade no terreno
\`\`\`

---

## 4. TAREFAS DE CONTINUAÇÃO PRIORITÁRIAS (ROADMAP)

### TAREFA 1: Sistema de Tráfego Autônomo e Veículos Dirigíveis
- **Objetivo**: Dar vida às avenidas da Cidade Real com carros (Táxi Amarelo, Carro Azul Esportivo, Van Vermelha, Picape e Fusquinha) e motos esportivas.
- **Implementação**:
  - Criar nós \`Path3D\` com \`PathFollow3D\` ao longo das faixas de rodagem.
  - Adicionar detecção de obstáculos com \`RayCast3D\` para parar em pedestres ou semáforos.
  - Ao aproximar de um veículo, pressionar **E** (ou botão mobile **PILOTAR**) para entrar e dirigir com física \`VehicleBody3D\` ou \`CharacterBody3D\`.

### TAREFA 2: Sistema de Missões e NPCs com Diálogos
- **Carlos Mecânico**: Missão de apertar parafusos em carros na oficina com chave inglesa.
- **Seu Manuel (Padaria)**: Missão de entrega rápida de pães com cronômetro.
- **Luigi Pizzaria**: Entrega de pizza com farol luminoso (\`CylinderMesh\` emissivo no destino).

### TAREFA 3: Modo Construção no Terreno
- Grid snapping, pré-visualização holográfica verde/vermelha, rotação de estruturas com tecla **R**.
- Construções removidas retornam ao inventário no \`economy_manager.gd\` sem custo extra.

### TAREFA 4: Áudio 3D Imersivo
- Nós \`AudioStreamPlayer3D\` para passos, buzina, motor e moedas colhidas.

### TAREFA 5: HUD Mobile e Controles Táteis
- Joystick analógico virtual (\`Control\`) e botões circulares (\`PULAR\`, \`CORRER\`, \`PILOTAR\`, \`LOJA\`).

---

> **COMANDO DE INÍCIO**:
> "Você tem em mãos o projeto oficial Godot 4 de **Theo Lucca - Cidade Real 3D**. Proceda com as tarefas acima priorizando código robusto, performático, documentado em português e com foco em diversão, estabilidade a 60 FPS e estética vibrante de alta qualidade!"
`;

/**
 * Cria e baixa o projeto completo do Godot 4 em formato .zip
 */
export async function downloadGodot4Project(): Promise<void> {
  const zip = new JSZip();

  // Arquivos raiz
  zip.file('project.godot', GODOT_PROJECT_FILE);
  zip.file('icon.svg', ICON_SVG);
  zip.file('README_GODOT4.md', README_MD);
  zip.file('PROMPT_MESTRE_GODOT4.md', PROMPT_MESTRE_MD);

  // Scripts GDScript
  const scriptsFolder = zip.folder('scripts');
  if (scriptsFolder) {
    scriptsFolder.file('economy_manager.gd', SCRIPT_ECONOMY_MANAGER);
    scriptsFolder.file('player.gd', SCRIPT_PLAYER);
    scriptsFolder.file('camera_controller.gd', SCRIPT_CAMERA_CONTROLLER);
    scriptsFolder.file('store_modal.gd', SCRIPT_STORE_MODAL);
    scriptsFolder.file('weather_manager.gd', `extends Node
class_name WeatherManagerGD

signal weather_changed(new_weather: String)

enum WeatherType { SUNNY, CLOUDY, RAINY }

@export var current_weather: WeatherType = WeatherType.SUNNY
@export var auto_cycle: bool = true
@export var cycle_duration: float = 180.0

@export var sun_light: DirectionalLight3D
@export var world_environment: WorldEnvironment
@export var rain_particles: GPUParticles3D
@export var rain_audio: AudioStreamPlayer
@export var thunder_audio: AudioStreamPlayer3D

var cycle_timer: float = 180.0
var lightning_timer: float = 16.0
var is_flashing: bool = false
var flash_duration: float = 0.0

func _ready() -> void:
	cycle_timer = cycle_duration

func _process(delta: float) -> void:
	if auto_cycle:
		cycle_timer -= delta
		if cycle_timer <= 0:
			toggle_weather()

func toggle_weather() -> void:
	match current_weather:
		WeatherType.SUNNY: current_weather = WeatherType.CLOUDY
		WeatherType.CLOUDY: current_weather = WeatherType.RAINY
		WeatherType.RAINY: current_weather = WeatherType.SUNNY
	weather_changed.emit(str(current_weather))
`);
  }

  // Gera o arquivo ZIP binário e inicia o download no navegador
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TheoLucca_CidadeReal_Godot4_Project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
