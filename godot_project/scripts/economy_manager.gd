extends Node
class_name EconomyManager

## Sistema Oficial de Economia, Carteira e Inventario do Jogo (Godot 4)
## Gerencia Ouro, Diamantes, Esmeraldas, Catalogo da Esmeralda Store e Inventario

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
	return {
		"gold": gold,
		"diamonds": diamonds,
		"emeralds": emeralds
	}

func add_currency(type: String, amount: float, description: String = "Ganho no jogo") -> void:
	match type:
		"gold":
			gold += amount
		"diamonds":
			diamonds += int(amount)
		"emeralds":
			emeralds += int(amount)
	
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
	if price <= 0:
		return false
		
	if spend_currency(currency_type, price, "Compra: " + product.get("name", "Item")):
		add_to_inventory(product)
		item_purchased.emit(product.get("id", ""))
		return true
	return false

func add_to_inventory(product: Dictionary) -> void:
	var existing_idx = -1
	for i in range(inventory.size()):
		if inventory[i].get("product_id") == product.get("id"):
			existing_idx = i
			break
			
	if existing_idx != -1 and product.get("is_consumable", false):
		inventory[existing_idx]["quantity"] += 1
	else:
		inventory.append({
			"id": "inv_" + str(Time.get_unix_time_from_system()) + "_" + str(randi() % 1000),
			"product_id": product.get("id"),
			"name": product.get("name"),
			"category": product.get("category"),
			"quantity": 1,
			"is_equipped": false,
			"is_placed": false,
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
	if transactions.size() > 300:
		transactions.pop_front()

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
		file.store_string(JSON.stringify(data, "\t"))
		file.close()

func load_data() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
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
