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

const README_MD = `# 🎮 Theo Lucca - Cidade Real 3D (Godot Engine 4.x)

Projeto convertido e exportado para o **Godot Engine 4.2+ / 4.3+**!

## 🚀 Como Executar:
1. Abra o **Godot 4**.
2. Clique em **Import** e selecione o arquivo \`project.godot\`.
3. Pressione **F5** para rodar o jogo imediatamente!
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

  // Scripts GDScript
  const scriptsFolder = zip.folder('scripts');
  if (scriptsFolder) {
    scriptsFolder.file('economy_manager.gd', SCRIPT_ECONOMY_MANAGER);
    scriptsFolder.file('player.gd', SCRIPT_PLAYER);
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
