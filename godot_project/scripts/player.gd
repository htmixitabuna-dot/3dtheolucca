extends CharacterBody3D
class_name TheoLuccaPlayer

## Script de Movimentacao, Animacoes e Customizacao do Personagem (Godot 4)
## Altura proporcional: 1.05m com controle de camera terceira pessoa e animacoes procedurais

@export var walk_speed: float = 4.2
@export var sprint_speed: float = 7.5
@export var jump_velocity: float = 6.2
@export var rotation_speed: float = 12.0

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

# Rigs e nos visuais
@onready var visual_root: Node3D = $VisualRoot
@onready var body_mesh: MeshInstance3D = $VisualRoot/Torso
@onready var head_node: Node3D = $VisualRoot/Torso/Head
@onready var left_arm: Node3D = $VisualRoot/Torso/LeftArm
@onready var right_arm: Node3D = $VisualRoot/Torso/RightArm
@onready var left_leg: Node3D = $VisualRoot/LeftLeg
@onready var right_leg: Node3D = $VisualRoot/RightLeg
@onready var cap_mesh: MeshInstance3D = $VisualRoot/Torso/Head/Cap
@onready var glasses_mesh: MeshInstance3D = $VisualRoot/Torso/Head/Glasses
@onready var backpack_mesh: MeshInstance3D = $VisualRoot/Torso/Backpack

@onready var camera_pivot: Node3D = $CameraPivot
@onready var spring_arm: SpringArm3D = $CameraPivot/SpringArm3D
@onready var camera: Camera3D = $CameraPivot/SpringArm3D/Camera3D

var anim_time: float = 0.0
var is_waving: bool = false
var wave_timer: float = 0.0

var customization: Dictionary = {
	"shirt_color": Color(0.15, 0.39, 0.92),
	"shorts_color": Color(0.12, 0.16, 0.23),
	"shoe_color": Color(0.86, 0.15, 0.15),
	"cap_color": Color(0.11, 0.31, 0.85),
	"has_cap": true,
	"has_glasses": false,
	"glasses_color": Color(0.06, 0.09, 0.16),
	"has_backpack": true,
	"backpack_color": Color(0.47, 0.21, 0.06)
}

func _ready() -> void:
	apply_customization(customization)

func _physics_process(delta: float) -> void:
	# 1. Gravidade
	if not is_on_floor():
		velocity.y -= gravity * delta

	# 2. Pulo
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity

	# 3. Direcao de entrada do teclado ou joystick virtual
	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var is_sprinting: bool = Input.is_action_pressed("sprint")
	var current_speed: float = sprint_speed if is_sprinting else walk_speed

	# Converte entrada no espaco de orientacao da camera
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

		# Rotaciona visual suavemente em direcao ao movimento
		var target_rot: float = atan2(-move_direction.x, -move_direction.z)
		visual_root.rotation.y = lerp_angle(visual_root.rotation.y, target_rot, rotation_speed * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, current_speed * 8.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, current_speed * 8.0 * delta)

	move_and_slide()

	# 4. Atualiza animacoes procedurais
	var horizontal_speed: float = Vector2(velocity.x, velocity.z).length()
	_update_procedural_animations(delta, horizontal_speed, is_on_floor(), is_sprinting)

func _update_procedural_animations(delta: float, speed: float, on_ground: bool, running: bool) -> void:
	anim_time += delta

	if wave_timer > 0.0:
		wave_timer -= delta
		is_waving = wave_timer > 0.0

	if not on_ground:
		# Pulo: bracos abertos e pernas fletidas
		left_arm.rotation.x = -1.1
		right_arm.rotation.x = -1.1
		left_leg.rotation.x = 0.45
		right_leg.rotation.x = -0.3
		return

	if speed > 0.1:
		# Andando ou Correndo
		var freq: float = 16.0 if running else 9.5
		var arm_swing: float = 1.05 if running else 0.65
		var leg_swing: float = 0.95 if running else 0.55
		var cycle: float = sin(anim_time * freq)

		left_arm.rotation.x = cycle * arm_swing
		if is_waving:
			right_arm.rotation.x = -2.2
			right_arm.rotation.z = 0.3 + sin(anim_time * 12.0) * 0.25
		else:
			right_arm.rotation.x = -cycle * arm_swing
			right_arm.rotation.z = 0.0

		left_leg.rotation.x = -cycle * leg_swing
		right_leg.rotation.x = cycle * leg_swing
	else:
		# Parado (Idle vivo com respiracao infantil e olhadas ao redor)
		var breath: float = sin(anim_time * 2.8)
		var head_look: float = sin(anim_time * 0.9) * 0.14
		
		head_node.rotation.x = breath * 0.03
		head_node.rotation.y = head_look

		left_arm.rotation.x = sin(anim_time * 1.4) * 0.05
		left_leg.rotation.x = 0.0
		right_leg.rotation.x = 0.0

		if is_waving:
			right_arm.rotation.x = -2.1
			right_arm.rotation.z = 0.35 + sin(anim_time * 12.0) * 0.3
		else:
			right_arm.rotation.x = -sin(anim_time * 1.4) * 0.05
			right_arm.rotation.z = 0.0

func wave() -> void:
	is_waving = true
	wave_timer = 2.5

func apply_customization(data: Dictionary) -> void:
	for key in data:
		customization[key] = data[key]

	if cap_mesh:
		cap_mesh.visible = customization.get("has_cap", true)
		if customization.has("cap_color"):
			_set_mesh_color(cap_mesh, customization["cap_color"])

	if glasses_mesh:
		glasses_mesh.visible = customization.get("has_glasses", false)
		if customization.has("glasses_color"):
			_set_mesh_color(glasses_mesh, customization["glasses_color"])

	if backpack_mesh:
		backpack_mesh.visible = customization.get("has_backpack", true)
		if customization.has("backpack_color"):
			_set_mesh_color(backpack_mesh, customization["backpack_color"])

	if body_mesh and customization.has("shirt_color"):
		_set_mesh_color(body_mesh, customization["shirt_color"])

func _set_mesh_color(mesh: MeshInstance3D, color_val) -> void:
	var col: Color = color_val if color_val is Color else Color.from_string(str(color_val), Color.WHITE)
	var mat: StandardMaterial3D = mesh.get_active_material(0)
	if mat:
		var new_mat: StandardMaterial3D = mat.duplicate()
		new_mat.albedo_color = col
		mesh.set_surface_override_material(0, new_mat)
