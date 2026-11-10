extends Control
class_name EsmeraldaStoreUI

## Interface Oficial da Esmeralda Store Estilo Free Fire (Godot 4)
## Com 7 categorias, seletor de 3 moedas, pedestal 3D e pre-visualizacao no avatar

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

@onready var pedestal_stage: Node3D = $SubViewportContainer/SubViewport/Stage3D
@onready var preview_player: TheoLuccaPlayer = $SubViewportContainer/SubViewport/Stage3D/PreviewPlayer

var current_category: String = "destaques"
var selected_product: Dictionary = {}
var chosen_currency: String = "gold"
var is_dragging_pedestal: bool = false
var last_touch_x: float = 0.0

var products: Array[Dictionary] = [
	{
		"id": "prod_conjunto_esportivo",
		"name": "Conjunto Esportivo",
		"description": "Estilo e atitude para voce dominar a cidade! Inclui regata hoodie com coroa, bermuda street e tenis esportivo bicolor.",
		"category": "destaques",
		"rarity": "epico",
		"prices": { "gold": 250, "diamonds": 50, "emeralds": 60 },
		"customization_data": {
			"shirt_color": Color(0.09, 0.09, 0.11),
			"shorts_color": Color(0.09, 0.09, 0.11),
			"shoe_color": Color(0.04, 0.04, 0.04),
			"has_cap": false,
			"has_glasses": true,
			"glasses_color": Color(0.04, 0.04, 0.04)
		}
	},
	{
		"id": "prod_jaqueta_urbana",
		"name": "Jaqueta Urbana",
		"description": "Jaqueta esportiva streetstyle vermelha e preta de alta qualidade com acabamento de corrida.",
		"category": "roupas",
		"rarity": "lendario",
		"prices": { "gold": 350, "diamonds": 80, "emeralds": 75 },
		"customization_data": {
			"shirt_color": Color(0.86, 0.15, 0.15),
			"shorts_color": Color(0.12, 0.16, 0.23),
			"shoe_color": Color(0.97, 0.98, 0.99),
			"has_glasses": false
		}
	},
	{
		"id": "prod_bone_premium",
		"name": "Bone Premium",
		"description": "Bone preto com bordado de coroa da realeza urbana e aba curva anatomica.",
		"category": "roupas",
		"rarity": "epico",
		"prices": { "gold": 120, "diamonds": 25, "emeralds": 20 },
		"customization_data": {
			"has_cap": true,
			"cap_color": Color(0.09, 0.09, 0.11)
		}
	},
	{
		"id": "prod_oculos_style",
		"name": "Oculos Style",
		"description": "Armacao moderna escura para curtir o sol na cidade com maxima presenca.",
		"category": "roupas",
		"rarity": "raro",
		"prices": { "gold": 80, "diamonds": 15, "emeralds": 12 },
		"customization_data": {
			"has_glasses": true,
			"glasses_color": Color(0.04, 0.04, 0.04)
		}
	},
	{
		"id": "prod_carro_esportivo_red",
		"name": "Carro Esportivo V12",
		"description": "Supercarro esportivo vermelho com motor V12 turbo e suspensao aerodinamica rebaixada.",
		"category": "garagem",
		"rarity": "lendario",
		"prices": { "gold": 600, "diamonds": 120, "emeralds": 100 }
	},
	{
		"id": "prod_moto_street_super",
		"name": "Moto Street 1000cc",
		"description": "Supermoto esportiva vermelha para acelerar e rasgar o asfalto das avenidas.",
		"category": "garagem",
		"rarity": "lendario",
		"prices": { "gold": 520, "diamonds": 100, "emeralds": 85 }
	},
	{
		"id": "prod_casa_moderna_luxo",
		"name": "Casa Moderna",
		"description": "Residencia contemporanea com sacada, area gourmet e jardim privativo.",
		"category": "construcao",
		"rarity": "epico",
		"prices": { "gold": 450, "diamonds": 90, "emeralds": 80 }
	}
]

func _ready() -> void:
	update_wallet_display()
	select_product(products[0])

func _process(delta: float) -> void:
	if pedestal_stage:
		pedestal_stage.rotation.y += delta * 0.35

func select_product(product: Dictionary) -> void:
	selected_product = product
	product_title.text = product.get("name", "")
	description_label.text = product.get("description", "")
	
	var rarity = product.get("rarity", "epico")
	rarity_badge.text = rarity.to_upper() + " ///"

	# Aplica customizacao no avatar 3D do palco em tempo real
	if preview_player and product.has("customization_data"):
		preview_player.apply_customization(product["customization_data"])

func purchase_current_item() -> void:
	if selected_product.is_empty():
		return
	
	var economy = get_node_or_null("/root/EconomyManager")
	if economy:
		if economy.purchase_product(selected_product, chosen_currency):
			# Se o jogador estiver no jogo, aplica a roupa nele
			if player_node and selected_product.has("customization_data"):
				player_node.apply_customization(selected_product["customization_data"])
			update_wallet_display()
			item_bought.emit(selected_product)

func update_wallet_display() -> void:
	var economy = get_node_or_null("/root/EconomyManager")
	if economy:
		gold_label.text = str(int(economy.gold))
		diamonds_label.text = str(economy.diamonds)
		emeralds_label.text = str(economy.emeralds)

func close_store() -> void:
	visible = false
	closed.emit()
