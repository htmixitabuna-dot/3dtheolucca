import * as THREE from 'three';
import { PlacedBuilding, InventoryItem } from '../types/economy';
import { createBuildingMesh } from './buildingModels';
import { economyManager } from './EconomyManager';
import { BoxCollider } from './CityScene';

export interface BuildingManagerCallbacks {
  onBuildingPlaced?: (building: PlacedBuilding) => void;
  onBuildingRemoved?: (building: PlacedBuilding) => void;
  onStatusMessage?: (message: string, isError?: boolean) => void;
}

export class BuildingManager {
  private scene: THREE.Scene;
  private collidersList: { boxes: BoxCollider[] };
  private callbacks: BuildingManagerCallbacks;

  // Grupo 3D isolado exclusivo para as construções do jogador
  public playerBuildingsGroup: THREE.Group;

  // Prédios colocados atualmente
  private placedBuildings: PlacedBuilding[] = [];
  private buildingMeshMap: Map<string, THREE.Group> = new Map();
  private colliderMap: Map<string, BoxCollider> = new Map();

  // Estado do Modo de Construção Ativo
  private activeItemToPlace: InventoryItem | null = null;
  private previewMesh: THREE.Group | null = null;
  private previewPosition = new THREE.Vector3(0, 0, 0);
  private previewRotationY = 0;
  private isCurrentPlacementValid = false;
  private expansionLevel = 1;

  constructor(
    scene: THREE.Scene,
    collidersList: { boxes: BoxCollider[] },
    callbacks: BuildingManagerCallbacks = {}
  ) {
    this.scene = scene;
    this.collidersList = collidersList;
    this.callbacks = callbacks;

    this.playerBuildingsGroup = new THREE.Group();
    this.playerBuildingsGroup.name = 'PlayerCustomBuildings';
    this.scene.add(this.playerBuildingsGroup);

    this.loadPlacedBuildings();
  }

  public setExpansionLevel(level: number) {
    this.expansionLevel = Math.max(1, Math.min(5, level));
  }

  private loadPlacedBuildings() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('theo_lucca_placed_buildings');
      if (saved) {
        const list: PlacedBuilding[] = JSON.parse(saved);
        list.forEach((b) => this.instantiatePlacedBuilding(b, false));
      }
    } catch {
      // fallback
    }
  }

  private savePlacedBuildings() {
    try {
      localStorage.setItem('theo_lucca_placed_buildings', JSON.stringify(this.placedBuildings));
    } catch {}
  }

  private instantiatePlacedBuilding(building: PlacedBuilding, isNew = true) {
    const mesh = createBuildingMesh(building.modelType, false);
    mesh.position.set(building.position.x, building.position.y, building.position.z);
    mesh.rotation.y = building.rotationY;
    mesh.userData = { buildingId: building.id };

    this.playerBuildingsGroup.add(mesh);
    this.buildingMeshMap.set(building.id, mesh);

    // Registra colisor de colisão na cidade
    const halfW = (building.footprint.width * 0.9) / 2;
    const halfD = (building.footprint.depth * 0.9) / 2;
    const collider: BoxCollider = {
      minX: building.position.x - halfW,
      maxX: building.position.x + halfW,
      minZ: building.position.z - halfD,
      maxZ: building.position.z + halfD,
      name: `player_bld_${building.id}`,
    };

    this.collidersList.boxes.push(collider);
    this.colliderMap.set(building.id, collider);

    if (isNew) {
      this.placedBuildings.push(building);
      this.savePlacedBuildings();
      economyManager.setItemPlacedStatus(building.inventoryItemId, true);
      this.callbacks.onBuildingPlaced?.(building);
    } else {
      this.placedBuildings.push(building);
    }
  }

  /**
   * Inicia o modo de posicionamento de uma construção do inventário
   */
  public startPlacingItem(item: InventoryItem, initialPos: THREE.Vector3) {
    this.cancelPlacing();

    this.activeItemToPlace = item;
    this.previewPosition.copy(initialPos);
    this.previewPosition.y = 0;
    this.previewRotationY = 0;

    const modelType = item.modelType || 'house_modern';
    this.previewMesh = createBuildingMesh(modelType, true, true);
    this.previewMesh.position.copy(this.previewPosition);
    this.previewMesh.rotation.y = this.previewRotationY;
    this.scene.add(this.previewMesh);

    this.validatePlacement();
  }

  public getActiveItem(): InventoryItem | null {
    return this.activeItemToPlace;
  }

  public updatePreviewPosition(pos: THREE.Vector3) {
    if (!this.previewMesh || !this.activeItemToPlace) return;

    // Arredonda para grade de 1 metro para alinhamento urbano perfeito
    const gridX = Math.round(pos.x);
    const gridZ = Math.round(pos.z);

    this.previewPosition.set(gridX, 0, gridZ);
    this.previewMesh.position.copy(this.previewPosition);

    this.validatePlacement();
  }

  public rotatePreview(deltaRadians = Math.PI / 2) {
    if (!this.previewMesh) return;
    this.previewRotationY = (this.previewRotationY + deltaRadians) % (Math.PI * 2);
    this.previewMesh.rotation.y = this.previewRotationY;
    this.validatePlacement();
  }

  private validatePlacement(): boolean {
    if (!this.activeItemToPlace || !this.previewMesh) {
      this.isCurrentPlacementValid = false;
      return false;
    }

    const fp = this.activeItemToPlace.footprint || { width: 4, depth: 4, height: 3 };
    const px = this.previewPosition.x;
    const pz = this.previewPosition.z;

    // 1. Limites do Terreno Desbloqueado conforme Nível de Expansão
    let maxDistX = 42;
    let maxDistZ = 42;
    if (this.expansionLevel === 2) { maxDistX = 72; maxDistZ = 68; }
    else if (this.expansionLevel === 3) { maxDistX = 92; maxDistZ = 85; }
    else if (this.expansionLevel >= 4) { maxDistX = 108; maxDistZ = 95; }

    const isInsideTerritory = Math.abs(px) <= maxDistX && Math.abs(pz) <= maxDistZ;

    // 2. Não permitir construir em cima das avenidas principais asfaltadas
    // Ruas principais cruzam perto de X=0 e Z=0
    const isOnMainRoad = (Math.abs(px) < 3.2 && Math.abs(pz) < 70) || (Math.abs(pz) < 3.2 && Math.abs(px) < 70);

    // 3. Checagem de Colisão com outras construções do jogador
    const halfW = fp.width / 2;
    const halfD = fp.depth / 2;

    let hasOverlapWithPlayerBuildings = false;
    for (const b of this.placedBuildings) {
      const bHalfW = b.footprint.width / 2;
      const bHalfD = b.footprint.depth / 2;

      const overlapX = Math.abs(px - b.position.x) < (halfW + bHalfW) * 0.95;
      const overlapZ = Math.abs(pz - b.position.z) < (halfD + bHalfD) * 0.95;

      if (overlapX && overlapZ) {
        hasOverlapWithPlayerBuildings = true;
        break;
      }
    }

    const isValid = isInsideTerritory && !isOnMainRoad && !hasOverlapWithPlayerBuildings;
    this.isCurrentPlacementValid = isValid;

    // Atualiza cor do holograma (verde se válido, vermelho se bloqueado)
    const color = isValid ? 0x22c55e : 0xef4444;
    this.previewMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.color.set(color);
      }
    });

    return isValid;
  }

  /**
   * Confirma a colocação da construção
   */
  public confirmPlacement(): { success: boolean; message: string; building?: PlacedBuilding } {
    if (!this.activeItemToPlace) {
      return { success: false, message: 'Nenhuma construção selecionada para colocar.' };
    }

    if (!this.isCurrentPlacementValid) {
      return { success: false, message: 'Local inválido! Fica fora do terreno ou sobreposto a uma rua/construção.' };
    }

    const item = this.activeItemToPlace;
    const fp = item.footprint || { width: 4, depth: 4, height: 3 };

    const building: PlacedBuilding = {
      id: `bld_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      inventoryItemId: item.id,
      productId: item.productId,
      name: item.name,
      modelType: item.modelType || 'house_modern',
      position: {
        x: this.previewPosition.x,
        y: this.previewPosition.y,
        z: this.previewPosition.z,
      },
      rotationY: this.previewRotationY,
      footprint: fp,
      placedAt: Date.now(),
    };

    this.instantiatePlacedBuilding(building, true);
    this.cancelPlacing();

    return {
      success: true,
      message: `Construção "${building.name}" colocada com sucesso na cidade!`,
      building,
    };
  }

  /**
   * Cancela o modo de posicionamento
   */
  public cancelPlacing() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry?.dispose();
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
          else c.material?.dispose();
        }
      });
      this.previewMesh = null;
    }
    this.activeItemToPlace = null;
    this.isCurrentPlacementValid = false;
  }

  /**
   * Remove/Desmonta uma construção colocada (ela retorna automaticamente ao inventário!)
   */
  public removeBuilding(buildingId: string): { success: boolean; message: string } {
    const bIndex = this.placedBuildings.findIndex((b) => b.id === buildingId);
    if (bIndex === -1) {
      return { success: false, message: 'Construção não encontrada.' };
    }

    const building = this.placedBuildings[bIndex];

    // Remove mesh 3D
    const mesh = this.buildingMeshMap.get(buildingId);
    if (mesh) {
      this.playerBuildingsGroup.remove(mesh);
      mesh.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          c.geometry?.dispose();
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
          else c.material?.dispose();
        }
      });
      this.buildingMeshMap.delete(buildingId);
    }

    // Remove colisor
    const collider = this.colliderMap.get(buildingId);
    if (collider) {
      const cIdx = this.collidersList.boxes.indexOf(collider);
      if (cIdx >= 0) {
        this.collidersList.boxes.splice(cIdx, 1);
      }
      this.colliderMap.delete(buildingId);
    }

    // Remove da lista
    this.placedBuildings.splice(bIndex, 1);
    this.savePlacedBuildings();

    // Retorna o item ao inventário sem custo
    economyManager.setItemPlacedStatus(building.inventoryItemId, false);
    this.callbacks.onBuildingRemoved?.(building);

    return {
      success: true,
      message: `"${building.name}" foi recolhida e retornou ao seu inventário!`,
    };
  }

  public getPlacedBuildings(): PlacedBuilding[] {
    return [...this.placedBuildings];
  }

  /**
   * Encontra a construção colocada mais próxima de uma coordenada
   */
  public getNearestPlacedBuilding(pos: THREE.Vector3, maxDist = 4.0): PlacedBuilding | null {
    let nearest: PlacedBuilding | null = null;
    let minDist = maxDist;

    for (const b of this.placedBuildings) {
      const d = Math.hypot(pos.x - b.position.x, pos.z - b.position.z);
      if (d < minDist) {
        minDist = d;
        nearest = b;
      }
    }

    return nearest;
  }
}
