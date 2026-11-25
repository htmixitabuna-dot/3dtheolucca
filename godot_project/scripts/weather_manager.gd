extends Node
class_name WeatherManagerGD

## Sistema de Clima Dinâmico no Godot 4 (Ensolarado, Nublado e Chuvoso)
## Controla iluminação DirectionalLight3D, WorldEnvironment, nuvens, chuva 3D e áudio

signal weather_changed(new_weather: String)

enum WeatherType {
	SUNNY,
	CLOUDY,
	RAINY
}

@export var current_weather: WeatherType = WeatherType.SUNNY
@export var auto_cycle: bool = true
@export var cycle_duration: float = 180.0 ## 3 minutos por clima

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
	apply_weather_instant(current_weather)

func _process(delta: float) -> void:
	# 1. Ciclo automático
	if auto_cycle:
		cycle_timer -= delta
		if cycle_timer <= 0:
			toggle_weather()

	# 2. Interpolação suave de iluminação
	_update_weather_lerp(delta)

	# 3. Trovões e relâmpagos na chuva
	if current_weather == WeatherType.RAINY:
		_update_lightning(delta)

func set_weather(weather: WeatherType) -> void:
	current_weather = weather
	cycle_timer = cycle_duration

	if rain_particles:
		rain_particles.emitting = (weather == WeatherType.RAINY)
	if rain_audio:
		if weather == WeatherType.RAINY:
			if not rain_audio.playing: rain_audio.play()
		else:
			if rain_audio.playing: rain_audio.stop()

	weather_changed.emit(get_weather_name())

func toggle_weather() -> void:
	match current_weather:
		WeatherType.SUNNY:
			set_weather(WeatherType.CLOUDY)
		WeatherType.CLOUDY:
			set_weather(WeatherType.RAINY)
		WeatherType.RAINY:
			set_weather(WeatherType.SUNNY)

func get_weather_name() -> String:
	match current_weather:
		WeatherType.SUNNY: return "Ensolarado"
		WeatherType.CLOUDY: return "Nublado"
		WeatherType.RAINY: return "Chuvoso"
	return "Ensolarado"

func apply_weather_instant(weather: WeatherType) -> void:
	if not sun_light or not world_environment: return
	var env = world_environment.environment

	match weather:
		WeatherType.SUNNY:
			sun_light.light_color = Color(1.0, 0.97, 0.92)
			sun_light.light_energy = 2.75
			if env:
				env.fog_light_color = Color(0.58, 0.77, 0.99)
				env.fog_density = 0.005
		WeatherType.CLOUDY:
			sun_light.light_color = Color(0.82, 0.84, 0.86)
			sun_light.light_energy = 1.15
			if env:
				env.fog_light_color = Color(0.54, 0.61, 0.68)
				env.fog_density = 0.010
		WeatherType.RAINY:
			sun_light.light_color = Color(0.39, 0.45, 0.54)
			sun_light.light_energy = 0.55
			if env:
				env.fog_light_color = Color(0.25, 0.29, 0.35)
				env.fog_density = 0.018

func _update_weather_lerp(delta: float) -> void:
	if not sun_light or not world_environment: return
	var env = world_environment.environment
	var lerp_weight: float = clamp(delta * 1.5, 0.0, 1.0)

	var target_sun_color: Color
	var target_sun_energy: float
	var target_fog_color: Color
	var target_fog_density: float

	match current_weather:
		WeatherType.SUNNY:
			target_sun_color = Color(1.0, 0.97, 0.92)
			target_sun_energy = 2.75
			target_fog_color = Color(0.58, 0.77, 0.99)
			target_fog_density = 0.005
		WeatherType.CLOUDY:
			target_sun_color = Color(0.82, 0.84, 0.86)
			target_sun_energy = 1.15
			target_fog_color = Color(0.54, 0.61, 0.68)
			target_fog_density = 0.010
		WeatherType.RAINY:
			target_sun_color = Color(0.39, 0.45, 0.54)
			target_sun_energy = 0.55
			target_fog_color = Color(0.25, 0.29, 0.35)
			target_fog_density = 0.018

	sun_light.light_color = sun_light.light_color.lerp(target_sun_color, lerp_weight)
	var final_energy = lerpf(sun_light.light_energy, target_sun_energy, lerp_weight)

	if is_flashing:
		final_energy = maxf(final_energy, 3.5)

	sun_light.light_energy = final_energy

	if env:
		env.fog_light_color = env.fog_light_color.lerp(target_fog_color, lerp_weight)
		env.fog_density = lerpf(env.fog_density, target_fog_density, lerp_weight)

func _update_lightning(delta: float) -> void:
	if not is_flashing:
		lightning_timer -= delta
		if lightning_timer <= 0:
			is_flashing = true
			flash_duration = 0.1
			lightning_timer = randf_range(14.0, 26.0)
			if thunder_audio: thunder_audio.play()
	else:
		flash_duration -= delta
		if flash_duration <= 0:
			is_flashing = false
