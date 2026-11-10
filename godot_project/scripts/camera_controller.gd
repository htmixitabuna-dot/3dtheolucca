extends Node3D
class_name ThirdPersonCameraController

## Controlador de Camera Terceira Pessoa Orbital (PC e Android)

@export var mouse_sensitivity: float = 0.003
@export var touch_sensitivity: float = 0.005
@export var min_pitch: float = -45.0
@export var max_pitch: float = 60.0

@onready var spring_arm: SpringArm3D = $SpringArm3D

var is_dragging: bool = false
var touch_start_pos: Vector2 = Vector2.ZERO

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
		rotate_camera(event.relative.x * mouse_sensitivity, event.relative.y * mouse_sensitivity)
	elif event is InputEventScreenDrag:
		rotate_camera(event.relative.x * touch_sensitivity, event.relative.y * touch_sensitivity)

func rotate_camera(yaw_delta: float, pitch_delta: float) -> void:
	# Rotacao horizontal (Yaw)
	rotation.y -= yaw_delta

	# Rotacao vertical (Pitch) no SpringArm
	if spring_arm:
		spring_arm.rotation.x = clamp(
			spring_arm.rotation.x - pitch_delta,
			deg_to_rad(min_pitch),
			deg_to_rad(max_pitch)
		)
