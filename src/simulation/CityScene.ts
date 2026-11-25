import * as THREE from 'three';
import { soundManager } from './audio';
import {
  createAsphaltTexture,
  createSidewalkTexture,
  createGrassTexture,
  createSandTexture,
  createBrickTexture,
  createCheckeredFloorTexture,
  createWoodFloorTexture,
} from './textures';
import {
  buildBusStopAndStreetFurniture,
  buildChurchLandmark,
  buildCivicOrShopBuilding,
  buildEmergencyVehicle,
  buildFeiraLivre,
  buildGasStation,
  buildHouseVariant,
  buildMultiStoryBuilding,
  buildPlaygroundAndCourtPark,
  buildRiverAndBridges,
  buildShoppingMall,
  buildStreetNameSign,
  CityLandmarkContext,
} from './cityLandmarks';

export interface TrafficLight {
  group: THREE.Group;
  position: THREE.Vector3;
  state: 'green' | 'yellow' | 'red';
  timer: number;
  greenMesh: THREE.Mesh;
  yellowMesh: THREE.Mesh;
  redMesh: THREE.Mesh;
}

export interface CityCar {
  group: THREE.Group;
  colorName: string;
  speed: number;
  maxSpeed: number;
  waypoints: THREE.Vector3[];
  currentWpIndex: number;
  rotationY: number;
  wheels: THREE.Mesh[];
  honkCooldown: number;
  stoppedByRedLight: boolean;
  stoppedByPedestrian: boolean;
  hasTheoPassenger: boolean;
  frontBumperMesh?: THREE.Mesh;
  carBodyMesh?: THREE.Mesh;
  headlightBeamL?: THREE.Mesh;
  headlightBeamR?: THREE.Mesh;
  headlightMeshL?: THREE.Mesh;
  headlightMeshR?: THREE.Mesh;
  dentLevel?: number;
  applyDent?: (direction?: 'front' | 'rear' | 'side') => void;
  repair?: () => void;
  setHeadlights?: (on: boolean) => void;
}

export interface CityMoto {
  group: THREE.Group;
  colorName: string;
  speed: number;
  maxSpeed: number;
  waypoints: THREE.Vector3[];
  currentWpIndex: number;
  rotationY: number;
  wheels: THREE.Mesh[];
  frontFork?: THREE.Group;
  driverMesh?: THREE.Group;
  rider?: THREE.Group;
  isParked: boolean;
  hasTheoPassenger: boolean;
}

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name?: string;
}

export interface CircleCollider {
  x: number;
  z: number;
  radius: number;
  name?: string;
}

export interface CityNPC {
  group: THREE.Group;
  name: string;
  role: string;
  phrase: string;
  gender: 'male' | 'female';
  tips: string[];
  position: THREE.Vector3;
  walkTimer: number;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  isWaving: boolean;
  isInsideBuilding?: boolean;
  waypoints: THREE.Vector3[];
  waypointIndex: number;
  walkSpeed: number;
  pauseTimer: number;
}

export interface StreetCoin {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  value: number;
  collected: boolean;
}

export interface InteractiveLocation {
  id: string;
  name: string;
  category: 'shop' | 'job' | 'landmark';
  position: THREE.Vector3;
  markerMesh: THREE.Mesh;
  label: string;
  radius: number;
  isInside: boolean;
}

export interface CitySceneObjects {
  scene: THREE.Scene;
  trafficLights: TrafficLight[];
  cars: CityCar[];
  motos: CityMoto[];
  motorcycles: CityMoto[];
  npcs: CityNPC[];
  coins: StreetCoin[];
  locations: InteractiveLocation[];
  colliders: {
    boxes: BoxCollider[];
    circles: CircleCollider[];
  };
  sunLight: THREE.DirectionalLight;
  skyLight: THREE.HemisphereLight;
  waterMesh: THREE.Mesh;
  flowerBeds: THREE.Vector3[];
  mailboxes: THREE.Vector3[];
  customerHouses: THREE.Vector3[];
  beaconGroup: THREE.Group;
  setBeaconPosition: (pos: THREE.Vector3 | null) => void;
  updateCity: (timeSec: number, delta: number, theoPos: THREE.Vector3) => void;
  // Sistema de Expansão Dinâmica da Cidade
  expansionLevel: number;
  expandCity: (newLevel: number) => { name: string; desc: string; unlockedFeatures: string[] };
  streetLamps: { position: THREE.Vector3; glowMesh: THREE.Mesh; bulbMesh: THREE.Mesh }[];
  setStreetLights: (on: boolean) => void;
  setCameraDistanceLOD: (camDist: number) => void;
}

export function createCityScene(): CitySceneObjects {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x60a5fa); // Céu azul radiante
  scene.fog = new THREE.FogExp2(0x93c5fd, 0.0055); // Névoa atmosférica de horizonte suave

  // --- ILUMINAÇÃO SOLAR & AMBIENTE (SOL MAIS FORTE COM SOMBRAS NÍTIDAS NO CHÃO) ---
  const skyLight = new THREE.HemisphereLight(0xfffbeb, 0x0284c7, 1.15);
  scene.add(skyLight);

  const sunLight = new THREE.DirectionalLight(0xfff8ea, 2.65); // Sol mais forte e dourado
  sunLight.position.set(75, 105, 55);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 260;
  const d = 110;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  // Luz de preenchimento suave
  const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.35);
  fillLight.position.set(-60, 40, -40);
  scene.add(fillLight);

  // --- TEXTURAS PROCEDURAIS PBR DE ALTA DEFINIÇÃO ---
  const asphaltTex = createAsphaltTexture();
  const sidewalkTex = createSidewalkTexture();
  const grassTex = createGrassTexture();
  const sandTex = createSandTexture();

  // Configuração de repetição proporcional para texturas nítidas
  grassTex.repeat.set(24, 24);
  sandTex.repeat.set(14, 14);

  const asphaltMat = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    roughness: 0.85,
    metalness: 0.1,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: sidewalkTex,
    roughness: 0.8,
    metalness: 0.05,
  });

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.7,
  });

  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.9,
    metalness: 0.02,
  });

  const sandMat = new THREE.MeshStandardMaterial({
    map: sandTex,
    roughness: 0.95,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.5,
    transparent: true,
    opacity: 0.82,
  });

  const yellowPaintMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
  const whitePaintMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });

  // 1. TERRENO AMPLO REALISTA (780m x 780m para comportar a Cidade Gigante 3x com 7 Bairros!)
  grassTex.repeat.set(48, 48);
  sandTex.repeat.set(24, 36);

  const terrainGeo = new THREE.PlaneGeometry(780, 780);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrain = new THREE.Mesh(terrainGeo, grassMat);
  terrain.position.set(-20, 0, 0);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Praia ampla no lado leste (+X) com areia dourada e calçadão
  const beachGeo = new THREE.PlaneGeometry(110, 780);
  beachGeo.rotateX(-Math.PI / 2);
  const beach = new THREE.Mesh(beachGeo, sandMat);
  beach.position.set(240, 0.015, 0);
  beach.receiveShadow = true;
  scene.add(beach);

  // Mar com ondas suaves no extremo leste
  const oceanGeo = new THREE.PlaneGeometry(240, 780);
  oceanGeo.rotateX(-Math.PI / 2);
  const waterMesh = new THREE.Mesh(oceanGeo, waterMat);
  waterMesh.position.set(410, 0.03, 0);
  scene.add(waterMesh);

  // Calçadão ladrilhado da Orla
  const boardwalk = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 0.16, 560),
    sidewalkMat
  );
  boardwalk.position.set(191.5, 0.08, 0);
  boardwalk.receiveShadow = true;
  scene.add(boardwalk);

  // Guarda-sóis coloridos e espreguiçadeiras na areia da Praia
  for (let i = 0; i < 14; i++) {
    const umbrellaGroup = new THREE.Group();
    umbrellaGroup.position.set(202 + (i % 2) * 12, 0, -210 + i * 32);

    const poleGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25;
    pole.castShadow = true;
    umbrellaGroup.add(pole);

    const coneGeo = new THREE.ConeGeometry(2.1, 0.75, 14);
    const coneColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0x8b5cf6, 0xec4899];
    const coneMat = new THREE.MeshStandardMaterial({ color: coneColors[i % 6], roughness: 0.5 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 2.45;
    cone.castShadow = true;
    umbrellaGroup.add(cone);

    const chairGeo = new THREE.BoxGeometry(0.8, 0.25, 1.6);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.7 });
    const chair = new THREE.Mesh(chairGeo, chairMat);
    chair.position.set(1.2, 0.12, 0.4);
    chair.rotation.y = 0.2;
    chair.castShadow = true;
    umbrellaGroup.add(chair);

    scene.add(umbrellaGroup);
  }

  // --- MALHA DE AVENIDAS COM ASFALTO TEXTURIZADO E PINTURA PROFISSIONAL ---
  const roadNetwork = new THREE.Group();
  scene.add(roadNetwork);

  const addRoad = (x: number, z: number, width: number, length: number, isVertical: boolean) => {
    const roadGeo = new THREE.PlaneGeometry(width, length);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(x, 0.02, z);
    road.receiveShadow = true;
    roadNetwork.add(road);

    // Linhas brancas contínuas nos bordos da pista
    const edgeOffset = width / 2 - 0.35;
    for (const side of [-1, 1]) {
      const edgeGeo = isVertical
        ? new THREE.PlaneGeometry(0.18, length)
        : new THREE.PlaneGeometry(length, 0.18);
      edgeGeo.rotateX(-Math.PI / 2);
      const edgeLine = new THREE.Mesh(edgeGeo, whitePaintMat);
      if (isVertical) {
        edgeLine.position.set(x + side * edgeOffset, 0.024, z);
      } else {
        edgeLine.position.set(x, 0.024, z + side * edgeOffset);
      }
      roadNetwork.add(edgeLine);
    }

    // Faixa pontilhada amarela central (espaçamento otimizado para vias longas)
    const step = 6.0;
    const stripeCount = Math.floor(length / step);
    for (let s = -stripeCount / 2; s < stripeCount / 2; s++) {
      const stripeGeo = isVertical
        ? new THREE.PlaneGeometry(0.24, 2.8)
        : new THREE.PlaneGeometry(2.8, 0.24);
      stripeGeo.rotateX(-Math.PI / 2);
      const stripe = new THREE.Mesh(stripeGeo, yellowPaintMat);
      if (isVertical) {
        stripe.position.set(x, 0.025, z + s * step + step * 0.5);
      } else {
        stripe.position.set(x + s * step + step * 0.5, 0.025, z);
      }
      roadNetwork.add(stripe);
    }
  };

  // Malha Viária Ampliada 3x: 17 Vias conectando todos os 7 Bairros!
  addRoad(-240, 0, 10.0, 530, true);     // Av. Serra Verde (Oeste)
  addRoad(-180, 0, 10.0, 530, true);     // Av. das Flores (Jardim das Flores)
  addRoad(-120, 0, 10.0, 530, true);     // Av. Bairro Alto
  addRoad(-60, 0, 10.0, 530, true);      // Rua da Igreja
  addRoad(0, 0, 12.0, 530, true);        // Avenida Central (Norte-Sul)
  addRoad(60, 0, 10.0, 530, true);       // Rua do Shopping
  addRoad(120, 0, 10.0, 530, true);      // Av. Zona Leste
  addRoad(180, 0, 10.0, 530, true);      // Rua da Praia / Orla

  addRoad(-30, -240, 450, 10.0, false);  // Av. Horizonte Norte
  addRoad(-30, -180, 450, 10.0, false);  // Av. Independência
  addRoad(-30, -120, 450, 10.0, false);  // Av. dos Condomínios
  addRoad(-30, -60, 450, 10.0, false);   // Av. Bairro Novo
  addRoad(-30, 0, 450, 12.0, false);     // Av. Comercial Central (Leste-Oeste)
  addRoad(-30, 60, 450, 10.0, false);    // Av. do Parque & Beira-Rio
  addRoad(-30, 120, 450, 10.0, false);   // Av. Beira-Rio Sul
  addRoad(-30, 180, 450, 10.0, false);   // Av. Bairro Baixo
  addRoad(-30, 240, 450, 10.0, false);   // Av. Vila Alegre Sul

  // Faixas de pedestres nas esquinas principais (Crosswalks zebradas)
  const addCrosswalk = (x: number, z: number, isVertical: boolean) => {
    for (let i = -4; i <= 4; i++) {
      const barGeo = isVertical
        ? new THREE.PlaneGeometry(0.7, 3.8)
        : new THREE.PlaneGeometry(3.8, 0.7);
      barGeo.rotateX(-Math.PI / 2);
      const bar = new THREE.Mesh(barGeo, whitePaintMat);
      if (isVertical) {
        bar.position.set(x + i * 1.1, 0.028, z);
      } else {
        bar.position.set(x, 0.028, z + i * 1.1);
      }
      roadNetwork.add(bar);
    }
  };

  addCrosswalk(0, -8.5, true);
  addCrosswalk(0, 8.5, true);
  addCrosswalk(-8.5, 0, false);
  addCrosswalk(8.5, 0, false);
  addCrosswalk(0, -52.5, true);
  addCrosswalk(0, -67.5, true);
  addCrosswalk(0, 52.5, true);
  addCrosswalk(0, 67.5, true);
  addCrosswalk(-60, -8.5, true);
  addCrosswalk(-60, 8.5, true);
  addCrosswalk(60, -8.5, true);
  addCrosswalk(60, 8.5, true);
  addCrosswalk(-120, -8.5, true);
  addCrosswalk(120, -8.5, true);
  addCrosswalk(0, -172, true);
  addCrosswalk(0, 172, true);

  // Calçadas de concreto em todos os 49 quarteirões dos 7 bairros
  const addSidewalkBlock = (x: number, z: number, w: number, d: number) => {
    const swGeo = new THREE.BoxGeometry(w, 0.18, d);
    const sw = new THREE.Mesh(swGeo, sidewalkMat);
    sw.position.set(x, 0.09, z);
    sw.receiveShadow = true;
    roadNetwork.add(sw);

    const curbBorderGeo = new THREE.BoxGeometry(w + 0.25, 0.22, d + 0.25);
    const curbBorder = new THREE.Mesh(curbBorderGeo, curbMat);
    curbBorder.position.set(x, 0.07, z);
    curbBorder.receiveShadow = true;
    roadNetwork.add(curbBorder);
  };

  const blockXs = [-210, -150, -90, -30, 30, 90, 150];
  const blockZs = [-210, -150, -90, -30, 30, 150, 210];
  for (const bx of blockXs) {
    for (const bz of blockZs) {
      addSidewalkBlock(bx, bz, 47, 46);
    }
  }

  // Grupo LOD para micro-detalhes de rua (oculta automaticamente quando a câmera está muito longe)
  const detailGroup = new THREE.Group();
  detailGroup.name = 'CityMicroDetailsLOD';
  scene.add(detailGroup);
  const nightWindowMaterials: THREE.MeshStandardMaterial[] = [];
  const emissiveSignMaterials: THREE.MeshStandardMaterial[] = [];

  // --- POSTES DE ILUMINAÇÃO PÚBLICA REALISTAS COM LUMINÁRIAS E ILUMINAÇÃO NOTURNA ---
  const lampPositions = [
    [-7.0, -18], [-7.0, 18], [-7.0, 42], [-7.0, -42], [-7.0, 90], [-7.0, 145], [-7.0, -145], [-7.0, 205], [-7.0, -205],
    [7.0, -18], [7.0, 18], [7.0, 42], [7.0, -42], [7.0, 90], [7.0, 145], [7.0, -145], [7.0, 205], [7.0, -205],
    [-24, -7.0], [24, -7.0], [-24, 7.0], [24, 7.0],
    [53, -25], [53, 25], [-53, -25], [-53, 25],
    [113, -30], [113, 30], [173, -40], [173, 0], [173, 40],
    [-113, -30], [-113, 30], [-173, -90], [-173, -150], [83, 195],
  ];

  const streetLamps: { position: THREE.Vector3; glowMesh: THREE.Mesh; bulbMesh: THREE.Mesh }[] = [];
  let isStreetNightOn = false;

  // Luzes compartilhadas (Pool de luzes para ficar muito abaixo do limite de shaders WebGL)
  const streetPoolLight = new THREE.PointLight(0xfff099, 0, 26, 1.6);
  streetPoolLight.position.set(0, 4.6, 0);
  scene.add(streetPoolLight);

  const interiorPoolLight = new THREE.PointLight(0xfffbeb, 1.5, 22);
  interiorPoolLight.position.set(-20, 5.2, -24);
  scene.add(interiorPoolLight);

  const lampGlowGeo = new THREE.CircleGeometry(4.2, 14);
  lampGlowGeo.rotateX(-Math.PI / 2);

  lampPositions.forEach(([lx, lz]) => {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(lx, 0, lz);

    // Coluna metálica preta curvada
    const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.8, 10);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const post = new THREE.Mesh(postGeo, metalMat);
    post.position.y = 2.4;
    post.castShadow = true;
    lampGroup.add(post);

    // Braço curvado
    const armGeo = new THREE.BoxGeometry(0.9, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(lx > 0 ? -0.4 : 0.4, 4.75, 0);
    lampGroup.add(arm);

    // Globo de luz quente
    const bulbGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    const bulbX = lx > 0 ? -0.8 : 0.8;
    bulb.position.set(bulbX, 4.65, 0);
    lampGroup.add(bulb);

    // Halo de luz no chão à noite (zero custo de uniformes WebGL)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(lampGlowGeo, glowMat);
    glowMesh.position.set(bulbX, 0.04, 0);
    lampGroup.add(glowMesh);

    streetLamps.push({
      position: new THREE.Vector3(lx + bulbX, 4.5, lz),
      glowMesh,
      bulbMesh: bulb,
    });
    scene.add(lampGroup);
  });

  const setStreetLights = (on: boolean) => {
    isStreetNightOn = on;
    streetPoolLight.intensity = on ? 2.2 : 0;
    const bulbEmissive = on ? 2.8 : 0.4;
    const glowOpacity = on ? 0.22 : 0;
    streetLamps.forEach(({ glowMesh, bulbMesh }) => {
      if (glowMesh.material) {
        (glowMesh.material as THREE.MeshBasicMaterial).opacity = glowOpacity;
      }
      if (bulbMesh.material) {
        (bulbMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = bulbEmissive;
      }
    });
    // Acende as janelas dos prédios residenciais de 5 a 10 andares, igrejas e casas à noite!
    nightWindowMaterials.forEach((mat) => {
      mat.emissiveIntensity = on ? 0.95 : 0.1;
    });
  };

  const setCameraDistanceLOD = (camDist: number) => {
    detailGroup.visible = camDist <= 105;
  };

  // --- SEMÁFOROS FUNCIONAIS REALISTAS ---
  const trafficLights: TrafficLight[] = [];

  const createTrafficLight = (pos: THREE.Vector3, rotY: number): TrafficLight => {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotY;

    const poleGeo = new THREE.CylinderGeometry(0.09, 0.11, 4.6, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.3;
    pole.castShadow = true;
    group.add(pole);

    const boxGeo = new THREE.BoxGeometry(0.45, 1.35, 0.38);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(0, 4.2, 0);
    box.castShadow = true;
    group.add(box);

    const lightGeo = new THREE.SphereGeometry(0.13, 12, 12);
    const redMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xef4444, emissiveIntensity: 1.4 });
    const redMesh = new THREE.Mesh(lightGeo, redMat);
    redMesh.position.set(0, 4.65, 0.17);
    group.add(redMesh);

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0x332200, emissive: 0xeab308, emissiveIntensity: 0.2 });
    const yellowMesh = new THREE.Mesh(lightGeo, yellowMat);
    yellowMesh.position.set(0, 4.2, 0.17);
    group.add(yellowMesh);

    const greenMat = new THREE.MeshStandardMaterial({ color: 0x003311, emissive: 0x22c55e, emissiveIntensity: 0.2 });
    const greenMesh = new THREE.Mesh(lightGeo, greenMat);
    greenMesh.position.set(0, 3.75, 0.17);
    group.add(greenMesh);

    scene.add(group);

    return {
      group,
      position: pos,
      state: 'green',
      timer: 0,
      greenMesh,
      yellowMesh,
      redMesh,
    };
  };

  trafficLights.push(createTrafficLight(new THREE.Vector3(6.5, 0, -6.8), Math.PI));
  trafficLights.push(createTrafficLight(new THREE.Vector3(-6.5, 0, 6.8), 0));
  trafficLights.push(createTrafficLight(new THREE.Vector3(-6.8, 0, -6.5), Math.PI / 2));
  trafficLights.push(createTrafficLight(new THREE.Vector3(6.8, 0, 6.5), -Math.PI / 2));
  trafficLights.push(createTrafficLight(new THREE.Vector3(-53.5, 0, -6.5), Math.PI));
  trafficLights.push(createTrafficLight(new THREE.Vector3(64.5, 0, 6.5), 0));

  // =========================================================================
  // --- EDIFÍCIOS REALISTAS COM INTERIORES EXPLORÁVEIS (THEO ENTRA DENTRO!) ---
  // =========================================================================
  const locations: InteractiveLocation[] = [];
  const customerHouses: THREE.Vector3[] = [];
  const flowerBeds: THREE.Vector3[] = [];
  const mailboxes: THREE.Vector3[] = [];
  const boxColliders: BoxCollider[] = [];
  const circleColliders: CircleCollider[] = [];

  const createRealisticShop = (config: {
    id: string;
    name: string;
    category: 'shop' | 'job';
    pos: THREE.Vector3;
    size: THREE.Vector3;
    doorWidth: number;
    wallTexture?: THREE.CanvasTexture;
    wallColor?: number;
    floorTexture: THREE.CanvasTexture;
    roofColor: number;
    signTitle: string;
    signSubtitle?: string;
    signWidth?: number;
    signHeight?: number;
    signBgColor: number;
    signTextColor?: string;
    awningType?: 'solid' | 'striped_red_white' | 'striped_colorful' | 'none';
    awningColor?: number;
    hasGarageDoor?: boolean;
    hasGlassDoor?: boolean;
    customFacade?: (group: THREE.Group, halfW: number, halfD: number, h: number) => void;
    interiorDecor: (interiorGroup: THREE.Group) => void;
    counterPos: THREE.Vector3;
  }) => {
    const buildingGroup = new THREE.Group();
    buildingGroup.position.copy(config.pos);

    const halfW = config.size.x / 2;
    const halfD = config.size.z / 2;
    const h = config.size.y;
    const wallThick = 0.38;

    const wallMat = config.wallTexture 
      ? new THREE.MeshStandardMaterial({ map: config.wallTexture, roughness: 0.75 })
      : new THREE.MeshStandardMaterial({ color: config.wallColor || 0xe2e8f0, roughness: 0.7 });

    const roofMat = new THREE.MeshStandardMaterial({ color: config.roofColor, roughness: 0.55 });
    const floorMat = new THREE.MeshStandardMaterial({ map: config.floorTexture, roughness: 0.45 });

    // 1. Piso Interno Personalizado com Rejunte e Reflexo
    config.floorTexture.repeat.set(Math.floor(config.size.x / 3.5), Math.floor(config.size.z / 3.5));
    const floorGeo = new THREE.BoxGeometry(config.size.x - 0.2, 0.2, config.size.z - 0.2);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = 0.1;
    floorMesh.receiveShadow = true;
    buildingGroup.add(floorMesh);

    // 2. Paredes: Traseira, Esquerda e Direita
    const backGeo = new THREE.BoxGeometry(config.size.x, h, wallThick);
    const backWall = new THREE.Mesh(backGeo, wallMat);
    backWall.position.set(0, h / 2, -halfD + wallThick / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    buildingGroup.add(backWall);

    const sideGeo = new THREE.BoxGeometry(wallThick, h, config.size.z);
    const leftWall = new THREE.Mesh(sideGeo, wallMat);
    leftWall.position.set(-halfW + wallThick / 2, h / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    buildingGroup.add(leftWall);

    const rightWall = new THREE.Mesh(sideGeo, wallMat);
    rightWall.position.set(halfW - wallThick / 2, h / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    buildingGroup.add(rightWall);

    // 3. Parede Frontal com Abertura para Porta Larga (Passagem 100% livre)
    const frontWallWidth = (config.size.x - config.doorWidth) / 2;

    const frontLeftGeo = new THREE.BoxGeometry(frontWallWidth, h, wallThick);
    const frontLeft = new THREE.Mesh(frontLeftGeo, wallMat);
    frontLeft.position.set(-halfW + frontWallWidth / 2, h / 2, halfD - wallThick / 2);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;
    buildingGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(frontLeftGeo, wallMat);
    frontRight.position.set(halfW - frontWallWidth / 2, h / 2, halfD - wallThick / 2);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;
    buildingGroup.add(frontRight);

    // Colisores das paredes sólidas da loja (deixando a porta aberta para Theo entrar e sair!)
    const px = config.pos.x;
    const pz = config.pos.z;
    boxColliders.push(
      // Parede Traseira
      { minX: px - halfW - 0.2, maxX: px + halfW + 0.2, minZ: pz - halfD - 0.4, maxZ: pz - halfD + 0.5, name: `${config.id}_back` },
      // Parede Esquerda
      { minX: px - halfW - 0.4, maxX: px - halfW + 0.5, minZ: pz - halfD - 0.2, maxZ: pz + halfD + 0.2, name: `${config.id}_left` },
      // Parede Direita
      { minX: px + halfW - 0.5, maxX: px + halfW + 0.4, minZ: pz - halfD - 0.2, maxZ: pz + halfD + 0.2, name: `${config.id}_right` },
      // Parede Frontal Esquerda
      { minX: px - halfW - 0.2, maxX: px - (config.doorWidth / 2) + 0.15, minZ: pz + halfD - 0.5, maxZ: pz + halfD + 0.4, name: `${config.id}_front_l` },
      // Parede Frontal Direita
      { minX: px + (config.doorWidth / 2) - 0.15, maxX: px + halfW + 0.2, minZ: pz + halfD - 0.5, maxZ: pz + halfD + 0.4, name: `${config.id}_front_r` }
    );

    // Vitrines de vidro frontal ao lado da porta com molduras metálicas
    for (const side of [-1, 1]) {
      const winGeo = new THREE.BoxGeometry(frontWallWidth * 0.75, 2.4, 0.1);
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.55,
      });
      const win = new THREE.Mesh(winGeo, glassMat);
      win.position.set(side * (halfW - frontWallWidth / 2), 2.2, halfD + 0.05);
      win.castShadow = true;
      buildingGroup.add(win);
    }

    // Porta de garagem cinza escuro para a Oficina
    if (config.hasGarageDoor) {
      const garageGroup = new THREE.Group();
      garageGroup.position.set(0, 0, halfD - wallThick / 2);

      // Guarnição superior e lateral metálica
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 });
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(config.doorWidth + 0.3, 0.25, 0.3), frameMat);
      topFrame.position.set(0, h - 0.7, 0.1);
      topFrame.castShadow = true;
      garageGroup.add(topFrame);

      // Ripas horizontais da porta de enrolar basculante cinza escuro
      const garageDoorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 });
      const slatCount = 7;
      const slatHeight = 0.45;
      for (let s = 0; s < slatCount; s++) {
        const slatGeo = new THREE.BoxGeometry(config.doorWidth - 0.1, slatHeight - 0.04, 0.1);
        const slat = new THREE.Mesh(slatGeo, garageDoorMat);
        slat.position.set(0, h - 1.0 - s * slatHeight, 0.08);
        slat.castShadow = true;
        garageGroup.add(slat);
      }

      // Puxador central e fechadura metálica
      const handleMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.08, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 })
      );
      handleMesh.position.set(0, h - 1.0 - 6 * slatHeight, 0.16);
      garageGroup.add(handleMesh);

      buildingGroup.add(garageGroup);
    } else if (config.hasGlassDoor) {
      // Portas duplas de vidro com puxador vertical
      const doorGlassMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.65,
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });

      for (const ds of [-1, 1]) {
        const doorPanel = new THREE.Group();
        doorPanel.position.set(ds * (config.doorWidth * 0.28), 1.5, halfD - wallThick / 2);

        const glassPane = new THREE.Mesh(new THREE.BoxGeometry(config.doorWidth * 0.45, 2.9, 0.08), doorGlassMat);
        doorPanel.add(glassPane);

        // Moldura da porta
        const topF = new THREE.Mesh(new THREE.BoxGeometry(config.doorWidth * 0.48, 0.1, 0.1), frameMat);
        topF.position.y = 1.45;
        doorPanel.add(topF);

        // Puxador vertical prateado
        const handle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 })
        );
        handle.position.set(ds * -0.3, 0, 0.08);
        doorPanel.add(handle);

        buildingGroup.add(doorPanel);
      }
    }

    // Viga superior sobre a entrada
    const lintelHeight = 1.6;
    const lintelGeo = new THREE.BoxGeometry(config.doorWidth, lintelHeight, wallThick);
    const lintel = new THREE.Mesh(lintelGeo, wallMat);
    lintel.position.set(0, h - lintelHeight / 2, halfD - wallThick / 2);
    lintel.castShadow = true;
    buildingGroup.add(lintel);

    // Letreiro iluminado da loja na fachada com alta resolução
    const signW = config.signWidth || (config.doorWidth * 1.35);
    const signH = config.signHeight || 1.15;
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = config.signSubtitle ? 320 : 256;
    const sCtx = signCanvas.getContext('2d')!;

    // Fundo do letreiro
    const hexColor = `#${config.signBgColor.toString(16).padStart(6, '0')}`;
    sCtx.fillStyle = hexColor;
    sCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);

    // Efeito de gradiente metálico sutil
    const grad = sCtx.createLinearGradient(0, 0, 0, signCanvas.height);
    grad.addColorStop(0, 'rgba(255,255,255,0.22)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);

    // Borda externa resistente
    sCtx.lineWidth = 14;
    sCtx.strokeStyle = config.signTextColor === '#000000' ? '#000000' : '#ffffff';
    sCtx.strokeRect(7, 7, signCanvas.width - 14, signCanvas.height - 14);

    // Borda interna estilizada
    sCtx.lineWidth = 4;
    sCtx.strokeStyle = config.signTextColor === '#000000' ? '#475569' : '#facc15';
    sCtx.strokeRect(22, 22, signCanvas.width - 44, signCanvas.height - 44);

    sCtx.fillStyle = config.signTextColor || '#ffffff';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';

    if (config.signSubtitle) {
      // Linha 1: Nome principal
      sCtx.font = '900 86px sans-serif';
      sCtx.fillText(config.signTitle, signCanvas.width / 2, signCanvas.height * 0.38);

      // Linha 2: Subtítulo
      sCtx.font = '800 52px sans-serif';
      sCtx.fillText(config.signSubtitle, signCanvas.width / 2, signCanvas.height * 0.76);
    } else {
      const fontSize = config.signTitle.length > 20 ? 56 : (config.signTitle.length > 12 ? 72 : 92);
      sCtx.font = `900 ${fontSize}px sans-serif`;
      sCtx.fillText(config.signTitle, signCanvas.width / 2, signCanvas.height / 2);
    }

    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.25,
      emissive: config.signBgColor,
      emissiveIntensity: 0.35,
    });
    const signGeo = new THREE.BoxGeometry(signW, signH, 0.22);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, h - signH / 2 - 0.15, halfD + 0.14);
    sign.castShadow = true;
    buildingGroup.add(sign);

    // Moldura traseira escura do letreiro
    const signFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 });
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(signW + 0.3, signH + 0.3, 0.2), signFrameMat);
    signFrame.position.set(0, h - signH / 2 - 0.15, halfD + 0.06);
    buildingGroup.add(signFrame);

    if (config.customFacade) {
      config.customFacade(buildingGroup, halfW, halfD, h);
    }

    // Toldos sobre as vitrines (conforme especificação da loja)
    const awningType = config.awningType || 'solid';
    const awningColor = config.awningColor !== undefined ? config.awningColor : config.signBgColor;

    if (awningType !== 'none') {
      for (const side of [-1, 1]) {
        const awningContainer = new THREE.Group();
        awningContainer.position.set(side * (halfW - frontWallWidth / 2), 3.6, halfD + 0.65);
        awningContainer.rotation.x = 0.28;

        if (awningType === 'striped_colorful') {
          // Toldo colorido listrado (vermelho, amarelo, azul, verde)
          const colors = [0xef4444, 0xfacc15, 0x3b82f6, 0x10b981];
          const stripeWidth = (frontWallWidth * 0.9) / colors.length;
          colors.forEach((col, idx) => {
            const stripeGeo = new THREE.BoxGeometry(stripeWidth, 0.15, 1.4);
            const stripeMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.x = -((frontWallWidth * 0.9) / 2) + stripeWidth * (idx + 0.5);
            stripe.castShadow = true;
            awningContainer.add(stripe);
          });
        } else if (awningType === 'striped_red_white') {
          // Toldo listrado vermelho e branco (Pizzaria)
          const colors = [0xdc2626, 0xffffff, 0xdc2626, 0xffffff];
          const stripeWidth = (frontWallWidth * 0.9) / colors.length;
          colors.forEach((col, idx) => {
            const stripeGeo = new THREE.BoxGeometry(stripeWidth, 0.15, 1.4);
            const stripeMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.x = -((frontWallWidth * 0.9) / 2) + stripeWidth * (idx + 0.5);
            stripe.castShadow = true;
            awningContainer.add(stripe);
          });
        } else {
          // Toldo de cor sólida vibrante (verde para mercadinho, laranja para padaria)
          const awningGeo = new THREE.BoxGeometry(frontWallWidth * 0.9, 0.15, 1.4);
          const awningMat = new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.55 });
          const awning = new THREE.Mesh(awningGeo, awningMat);
          awning.castShadow = true;
          awningContainer.add(awning);
        }

        buildingGroup.add(awningContainer);
      }
    }

    // Telhado detalhado
    const roofGeo = new THREE.BoxGeometry(config.size.x + 0.8, 0.45, config.size.z + 0.8);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 0.22;
    roof.castShadow = true;
    buildingGroup.add(roof);

    // Iluminação Interna Emissiva no Teto (usa o interiorPoolLight dinâmico da cena)
    const ceilingLamp = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.12, 1.6),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );
    ceilingLamp.position.set(0, h - 0.12, 0);
    buildingGroup.add(ceilingLamp);

    // Decoração e mobiliário especializado
    config.interiorDecor(buildingGroup);

    scene.add(buildingGroup);

    // Marcador de Interação dentro do estabelecimento
    const worldCounterPos = new THREE.Vector3(
      config.pos.x + config.counterPos.x,
      0.18,
      config.pos.z + config.counterPos.z
    );

    const markerGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.06, 20);
    const markerMat = new THREE.MeshStandardMaterial({
      color: config.category === 'job' ? 0xf59e0b : 0xa855f7,
      emissive: config.category === 'job' ? 0xd97706 : 0x7e22ce,
      emissiveIntensity: 0.55,
    });
    const markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.position.copy(worldCounterPos);
    scene.add(markerMesh);

    locations.push({
      id: config.id,
      name: config.name,
      category: config.category,
      position: worldCounterPos,
      markerMesh,
      label: config.signTitle,
      radius: 3.8,
      isInside: true,
    });
  };

  // 1. PIZZARIA DO BAIRRO (Tijolos vermelhos, forno a lenha, mesas com toalhas xadrez, toldo vermelho e branco)
  const brickPizzaTex = createBrickTexture('#b91c1c', '#e2e8f0');
  const pizzaFloorTex = createCheckeredFloorTexture('#ffffff', '#dc2626');

  createRealisticShop({
    id: 'pizzaria_do_bairro',
    name: 'Pizzaria do Bairro',
    category: 'job',
    pos: new THREE.Vector3(-20, 0, -24),
    size: new THREE.Vector3(16, 6.2, 15),
    doorWidth: 3.8,
    wallTexture: brickPizzaTex,
    roofColor: 0x7f1d1d,
    floorTexture: pizzaFloorTex,
    signTitle: 'PIZZARIA DO BAIRRO',
    signBgColor: 0xb91c1c,
    awningType: 'striped_red_white',
    hasGlassDoor: true,
    counterPos: new THREE.Vector3(0, 0, -1.8),
    interiorDecor: (group) => {
      // Balcão de granito escuro com base de madeira
      const counterGeo = new THREE.BoxGeometry(7.0, 1.15, 1.3);
      const counterMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 });
      const counter = new THREE.Mesh(counterGeo, counterMat);
      counter.position.set(0, 0.58, -2.5);
      counter.castShadow = true;
      group.add(counter);

      // Caixa Registradora moderna
      const regGeo = new THREE.BoxGeometry(0.7, 0.45, 0.55);
      const regMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const reg = new THREE.Mesh(regGeo, regMat);
      reg.position.set(1.8, 1.35, -2.5);
      group.add(reg);

      // Pilhas de caixas de pizza vermelhas
      for (let p = 0; p < 5; p++) {
        const boxGeo = new THREE.BoxGeometry(0.85, 0.12, 0.85);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(-1.8, 1.2 + p * 0.13, -2.5);
        box.castShadow = true;
        group.add(box);
      }

      // Forno a lenha de tijolos rústicos com fogo crepitante
      const ovenGeo = new THREE.CylinderGeometry(1.6, 2.0, 3.2, 16);
      const ovenMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.95 });
      const oven = new THREE.Mesh(ovenGeo, ovenMat);
      oven.position.set(5.0, 1.6, -5.5);
      oven.castShadow = true;
      group.add(oven);

      const fireGlow = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 0.9, 10),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      fireGlow.position.set(5.0, 0.75, -4.3);
      group.add(fireGlow);

      // Mesas italianas com cadeiras
      for (let m = -1; m <= 1; m += 2) {
        const tableGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.95, 16);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(m * 4.6, 0.48, 2.8);
        table.castShadow = true;
        group.add(table);
      }
    },
  });

  // 2. PADARIA PÃO QUENTINHO (Toldo laranja, vitrine de doces, pães quentinhos e fachada acolhedora)
  const bakeryFloorTex = createWoodFloorTexture();
  const bakeryStuccoTex = createBrickTexture('#d97706', '#fef3c7');

  createRealisticShop({
    id: 'padaria_pao_quentinho',
    name: 'Padaria Pão Quentinho',
    category: 'job',
    pos: new THREE.Vector3(-42, 0, -24),
    size: new THREE.Vector3(15, 6.0, 15),
    doorWidth: 3.6,
    wallTexture: bakeryStuccoTex,
    wallColor: 0xfef3c7,
    roofColor: 0x78350f,
    floorTexture: bakeryFloorTex,
    signTitle: 'PADARIA PÃO QUENTINHO',
    signBgColor: 0xd97706,
    awningColor: 0xf97316, // TOLDO LARANJA
    awningType: 'solid',
    hasGlassDoor: true, // VITRINE E PORTA DE VIDRO
    counterPos: new THREE.Vector3(0, 0, -1.8),
    interiorDecor: (group) => {
      // Balcão expositor com vitrine de vidro temperado
      const caseGeo = new THREE.BoxGeometry(6.6, 1.2, 1.4);
      const caseMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.4 });
      const vitrine = new THREE.Mesh(caseGeo, caseMat);
      vitrine.position.set(0, 0.6, -2.6);
      vitrine.castShadow = true;
      group.add(vitrine);

      // Cestos com baguettes douradas
      for (let b = -2; b <= 2; b += 2) {
        const basketGeo = new THREE.CylinderGeometry(0.45, 0.38, 0.7, 10);
        const basketMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
        const basket = new THREE.Mesh(basketGeo, basketMat);
        basket.position.set(b * 1.2, 1.45, -2.6);
        basket.castShadow = true;
        group.add(basket);
      }

      // Estufa de salgados iluminada
      const warmerGeo = new THREE.BoxGeometry(1.6, 0.9, 1.1);
      const warmerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
      const warmer = new THREE.Mesh(warmerGeo, warmerMat);
      warmer.position.set(-2.0, 1.5, -2.6);
      warmer.castShadow = true;
      group.add(warmer);
    },
  });

  // 3. MERCADINHO CENTRAL (Toldo verde, porta de vidro, gôndolas e fachada clara verde menta)
  const marketFloorTex = createCheckeredFloorTexture('#f8fafc', '#94a3b8');

  createRealisticShop({
    id: 'supermercado_central',
    name: 'Mercadinho Central',
    category: 'shop',
    pos: new THREE.Vector3(-20, 0, 27),
    size: new THREE.Vector3(19, 6.8, 17),
    doorWidth: 4.4,
    wallColor: 0xd1fae5, // Parede clara verde menta, NÃO azul
    roofColor: 0x064e3b,
    floorTexture: marketFloorTex,
    signTitle: 'MERCADINHO',
    signBgColor: 0x15803d,
    awningColor: 0x16a34a, // TOLDO VERDE
    awningType: 'solid',
    hasGlassDoor: true, // PORTA DE VIDRO
    counterPos: new THREE.Vector3(0, 0, 1.2),
    interiorDecor: (group) => {
      // 3 Corredores com prateleiras e caixas de frutas
      for (let aisle = -1; aisle <= 1; aisle++) {
        const shelfGeo = new THREE.BoxGeometry(1.8, 2.6, 8.5);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(aisle * 5.0, 1.3, -2.2);
        shelf.castShadow = true;
        group.add(shelf);

        // Frutas coloridas (maçãs, laranjas, peras)
        for (let row = 0; row < 3; row++) {
          const fruitGeo = new THREE.SphereGeometry(0.24, 8, 8);
          const fMat = new THREE.MeshStandardMaterial({ color: aisle === -1 ? 0xdc2626 : (aisle === 0 ? 0xf97316 : 0x84cc16) });
          const fruit = new THREE.Mesh(fruitGeo, fMat);
          fruit.position.set(aisle * 5.0 + 0.7, 0.9 + row * 0.7, -4.0 + row * 2.1);
          fruit.castShadow = true;
          group.add(fruit);
        }
      }

      // Checkout com leitor de código de barras
      const checkoutGeo = new THREE.BoxGeometry(5.4, 1.05, 1.3);
      const checkoutMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
      const checkout = new THREE.Mesh(checkoutGeo, checkoutMat);
      checkout.position.set(0, 0.52, 4.2);
      checkout.castShadow = true;
      group.add(checkout);
    },
  });

  // 4. LOJA DE BRINQUEDOS (Toldo colorido listrado, fachada amarela alegre, Urso Gigante e pistas)
  const toyFloorTex = createCheckeredFloorTexture('#fdf4ff', '#e9d5ff');

  createRealisticShop({
    id: 'loja_de_brinquedos_mundo_magico',
    name: 'Loja de Brinquedos',
    category: 'shop',
    pos: new THREE.Vector3(-45, 0, 27),
    size: new THREE.Vector3(17, 6.4, 17),
    doorWidth: 4.0,
    wallColor: 0xfef9c3, // Amarelo claro lúdico, NÃO azul
    roofColor: 0x6b21a8,
    floorTexture: toyFloorTex,
    signTitle: 'BRINQUEDOS',
    signBgColor: 0x7c3aed,
    signTextColor: '#facc15',
    awningType: 'striped_colorful', // TOLDO COLORIDO (vermelho, amarelo, azul, verde)
    hasGlassDoor: true, // PORTA DE VIDRO
    counterPos: new THREE.Vector3(0, 0, 0),
    interiorDecor: (group) => {
      // Pedestal circular central com Urso Gigante
      const pedGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.55, 20);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.set(0, 0.28, 0);
      ped.castShadow = true;
      group.add(ped);

      const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 14), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }));
      bearBody.position.set(0, 1.1, 0);
      bearBody.castShadow = true;
      group.add(bearBody);
      const bearHead = new THREE.Mesh(new THREE.SphereGeometry(0.58, 14, 14), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }));
      bearHead.position.set(0, 1.85, 0);
      bearHead.castShadow = true;
      group.add(bearHead);

      // Mesas com carrinhos esportivos e bolas de futebol
      for (let s = -1; s <= 1; s += 2) {
        const tableGeo = new THREE.BoxGeometry(2.0, 0.95, 4.2);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(s * 5.2, 0.48, -2.2);
        table.castShadow = true;
        group.add(table);

        const miniCar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 1.1), new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 }));
        miniCar.position.set(s * 5.2, 1.15, -2.2);
        miniCar.castShadow = true;
        group.add(miniCar);
      }
    },
  });

  // 5. THEO LUCCA OFICINA MECÂNICA
  // Fachada industrial de alta performance com grande letreiro "THEO LUCCA OFICINA MECÂNICA",
  // 4 luminárias refletoras gooseneck, letreiro de topo em treliça metálica, totem de calçada,
  // faixa zebrada de entrada, elevador hidráulico de 2 postes com carro suspenso,
  // carro prata com capô aberto e motor detalhado, bancada com morsa, carrinho de ferramentas e tambores de óleo!
  const workshopFloorTex = createCheckeredFloorTexture('#334155', '#1e293b');

  createRealisticShop({
    id: 'oficina_mecanica',
    name: 'THEO LUCCA OFICINA MECÂNICA',
    category: 'shop',
    pos: new THREE.Vector3(28, 0, -26),
    size: new THREE.Vector3(18, 6.4, 18),
    doorWidth: 6.8,
    wallColor: 0x334155, // Paredes cinza escuro industrial metálico
    roofColor: 0x0f172a,
    floorTexture: workshopFloorTex,
    signTitle: 'THEO LUCCA',
    signSubtitle: '🔧 OFICINA MECÂNICA ⚙️',
    signWidth: 13.0,
    signHeight: 2.2,
    signBgColor: 0x0f172a, // Placa preta industrial com contraste de alta performance
    signTextColor: '#facc15', // Letras douradas/amarelas automotivas de alto impacto
    awningType: 'none',
    hasGarageDoor: true,
    counterPos: new THREE.Vector3(3.2, 0, 1.5),
    customFacade: (buildingGroup, halfW, halfD, h) => {
      // 1. Quatro luminárias refletoras (gooseneck) sobre o grande letreiro da fachada
      const lampArmMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });
      const lampShadeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      const lampBulbMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfde047,
        emissiveIntensity: 2.2,
      });

      const lampPositionsX = [-4.6, -1.6, 1.6, 4.6];
      lampPositionsX.forEach((lx) => {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(lx, h - 0.15, halfD + 0.15);

        // Haste curva saindo da parede sobre o letreiro
        const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8);
        const arm = new THREE.Mesh(armGeo, lampArmMat);
        arm.rotation.x = Math.PI / 4;
        arm.position.set(0, 0.25, 0.3);
        lampGroup.add(arm);

        // Cúpula da luminária apontando para baixo sobre o letreiro
        const shadeGeo = new THREE.ConeGeometry(0.24, 0.28, 12, 1, true);
        const shade = new THREE.Mesh(shadeGeo, lampShadeMat);
        shade.rotation.x = -Math.PI / 6;
        shade.position.set(0, 0.42, 0.58);
        lampGroup.add(shade);

        // Lâmpada brilhante iluminando a fachada
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), lampBulbMat);
        bulb.position.set(0, 0.36, 0.55);
        lampGroup.add(bulb);

        buildingGroup.add(lampGroup);
      });

      // 2. Letreiro de Topo no Teto da Fachada (Rooftop Marquee em Treliça)
      const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
      const trussGroup = new THREE.Group();
      trussGroup.position.set(0, h, halfD - 0.4);

      // Treliças metálicas de sustentação do letreiro no teto
      for (const tx of [-5.5, -2.5, 2.5, 5.5]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), trussMat);
        post.position.set(tx, 0.8, 0);
        trussGroup.add(post);

        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), trussMat);
        brace.rotation.z = Math.PI / 4;
        brace.position.set(tx, 0.8, -0.4);
        trussGroup.add(brace);
      }

      // Painel do topo da oficina
      const topSignCanvas = document.createElement('canvas');
      topSignCanvas.width = 1024;
      topSignCanvas.height = 160;
      const tCtx = topSignCanvas.getContext('2d')!;
      tCtx.fillStyle = '#facc15'; // Amarelo clássico
      tCtx.fillRect(0, 0, 1024, 160);
      tCtx.lineWidth = 8;
      tCtx.strokeStyle = '#000000';
      tCtx.strokeRect(6, 6, 1012, 148);
      tCtx.fillStyle = '#000000';
      tCtx.font = '900 64px sans-serif';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.fillText('★ THEO LUCCA OFICINA MECÂNICA ★', 512, 80);

      const topSignTex = new THREE.CanvasTexture(topSignCanvas);
      topSignTex.colorSpace = THREE.SRGBColorSpace;
      const topSignMat = new THREE.MeshStandardMaterial({
        map: topSignTex,
        emissive: 0xfacc15,
        emissiveIntensity: 0.35,
        roughness: 0.3,
      });
      const topSignMesh = new THREE.Mesh(new THREE.BoxGeometry(11.8, 1.25, 0.15), topSignMat);
      topSignMesh.position.set(0, 0.95, 0.05);
      topSignMesh.castShadow = true;
      trussGroup.add(topSignMesh);

      buildingGroup.add(trussGroup);

      // 3. Faixa de sinalização zebrada na calçada da entrada
      const stripeCanvas = document.createElement('canvas');
      stripeCanvas.width = 512;
      stripeCanvas.height = 128;
      const stCtx = stripeCanvas.getContext('2d')!;
      stCtx.fillStyle = '#facc15';
      stCtx.fillRect(0, 0, 512, 128);
      stCtx.fillStyle = '#0f172a';
      for (let i = -100; i < 600; i += 60) {
        stCtx.beginPath();
        stCtx.moveTo(i, 0);
        stCtx.lineTo(i + 35, 0);
        stCtx.lineTo(i - 10, 128);
        stCtx.lineTo(i - 45, 128);
        stCtx.fill();
      }
      const stripeTex = new THREE.CanvasTexture(stripeCanvas);
      stripeTex.colorSpace = THREE.SRGBColorSpace;
      const stripeMat = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.8 });
      const entryStripe = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.2), stripeMat);
      entryStripe.rotation.x = -Math.PI / 2;
      entryStripe.position.set(0, 0.03, halfD + 1.1);
      entryStripe.receiveShadow = true;
      buildingGroup.add(entryStripe);

      // 4. Totem Pylon Luminoso da Oficina na calçada da rua
      const totemGroup = new THREE.Group();
      totemGroup.position.set(-halfW - 1.2, 0, halfD + 2.0);

      const totemPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), trussMat);
      totemPost.position.y = 2.1;
      totemPost.castShadow = true;
      totemGroup.add(totemPost);

      const totemCanvas = document.createElement('canvas');
      totemCanvas.width = 256;
      totemCanvas.height = 512;
      const totCtx = totemCanvas.getContext('2d')!;
      totCtx.fillStyle = '#0f172a';
      totCtx.fillRect(0, 0, 256, 512);
      totCtx.lineWidth = 10;
      totCtx.strokeStyle = '#facc15';
      totCtx.strokeRect(6, 6, 244, 500);

      totCtx.fillStyle = '#facc15';
      totCtx.font = '900 38px sans-serif';
      totCtx.textAlign = 'center';
      totCtx.fillText('THEO', 128, 80);
      totCtx.fillText('LUCCA', 128, 130);

      totCtx.fillStyle = '#ffffff';
      totCtx.font = '900 30px sans-serif';
      totCtx.fillText('OFICINA', 128, 210);
      totCtx.fillText('MECÂNICA', 128, 255);

      totCtx.fillStyle = '#38bdf8';
      totCtx.font = 'bold 22px sans-serif';
      totCtx.fillText('🔧 REVISÃO', 128, 340);
      totCtx.fillText('🚗 CARROS', 128, 385);
      totCtx.fillText('🏍️ MOTOS', 128, 430);

      const totemTex = new THREE.CanvasTexture(totemCanvas);
      totemTex.colorSpace = THREE.SRGBColorSpace;
      const totemMat = new THREE.MeshStandardMaterial({
        map: totemTex,
        emissive: 0x0f172a,
        emissiveIntensity: 0.3,
        roughness: 0.3,
      });
      const totemSign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.25), totemMat);
      totemSign.position.y = 2.5;
      totemSign.castShadow = true;
      totemGroup.add(totemSign);

      // Luz sinalizadora no topo do totem
      const beaconLight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 2.0 })
      );
      beaconLight.position.y = 4.2;
      totemGroup.add(beaconLight);

      buildingGroup.add(totemGroup);
    },
    interiorDecor: (group) => {
      const halfW = 9.0;
      const halfD = 9.0;

      // 1. 4 PNEUS DE COMPETIÇÃO EMPILHADOS NA FRENTE DA OFICINA
      for (let t = 0; t < 4; t++) {
        const tireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.24, 16);
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
        const tire = new THREE.Mesh(tireGeo, tireMat);
        tire.position.set(halfW - 1.8, 0.12 + t * 0.25, halfD + 1.3);
        tire.castShadow = true;
        group.add(tire);

        // Furo da roda do pneu com calota esportiva
        const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.25, 12);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.set(halfW - 1.8, 0.12 + t * 0.25, halfD + 1.3);
        group.add(rim);
      }

      // 2. TAMBORES INDUSTRIAIS DE ÓLEO (Vermelho, Amarelo e Azul)
      const drumColors = [0xdc2626, 0xfacc15, 0x2563eb];
      const drumPositions = [
        [halfW - 1.2, 0.55, halfD - 1.5],
        [halfW - 1.2, 0.55, halfD - 2.8],
        [halfW - 2.2, 0.55, halfD - 2.1],
      ];
      drumPositions.forEach(([dx, dy, dz], idx) => {
        const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16);
        const drumMat = new THREE.MeshStandardMaterial({
          color: drumColors[idx % drumColors.length],
          metalness: 0.6,
          roughness: 0.4,
        });
        const drum = new THREE.Mesh(drumGeo, drumMat);
        drum.position.set(dx, dy, dz);
        drum.castShadow = true;
        group.add(drum);

        // Aros de reforço do tambor
        for (const ry of [-0.3, 0.3]) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.43, 0.02, 6, 16),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(dx, dy + ry, dz);
          group.add(ring);
        }
      });

      // 3. ELEVADOR HIDRÁULICO DE DOIS POSTES COM CARRO VERMELHO SUSPENSO NO AR!
      const liftGroup = new THREE.Group();
      liftGroup.position.set(-4.5, 0, 0);

      const liftPostMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.8, roughness: 0.3 });
      const liftArmMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.35 });

      // Colunas verticais do elevador hidráulico
      for (const lx of [-1.8, 1.8]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 0.45), liftPostMat);
        post.position.set(lx, 2.1, 0);
        post.castShadow = true;
        liftGroup.add(post);

        // Pistão hidráulico prateado
        const piston = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.8, 12),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
        );
        piston.position.set(lx, 1.6, 0.15);
        liftGroup.add(piston);
      }

      // Viga superior do elevador
      const liftTopBeam = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 0.3), liftPostMat);
      liftTopBeam.position.set(0, 4.2, 0);
      liftGroup.add(liftTopBeam);

      // Braços de suporte erguidos a 2.1m de altura
      const liftArms = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 2.6), liftArmMat);
      liftArms.position.set(0, 2.05, 0);
      liftArms.castShadow = true;
      liftGroup.add(liftArms);

      // CARRO ESPORTIVO VERMELHO SUSPENSO NO ELEVADOR
      const liftedCar = new THREE.Group();
      liftedCar.position.set(0, 2.14, 0);

      // Chassi do carro vermelho
      const redBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.75, 4.2),
        new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.75, roughness: 0.25 })
      );
      redBody.position.y = 0.58;
      redBody.castShadow = true;
      liftedCar.add(redBody);

      // Cabine aerodinâmica preta
      const redCabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.65, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
      );
      redCabin.position.set(0, 1.25, -0.2);
      redCabin.castShadow = true;
      liftedCar.add(redCabin);

      // Aerofólio traseiro
      const spoilerWing = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.08, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      );
      spoilerWing.position.set(0, 1.2, -1.9);
      liftedCar.add(spoilerWing);

      // Tubo de escape cromado por baixo (visível ao andar por baixo do elevador!)
      const exhaustPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.2 })
      );
      exhaustPipe.rotation.x = Math.PI / 2;
      exhaustPipe.position.set(0.4, 0.12, 0);
      liftedCar.add(exhaustPipe);

      // 4 Rodas esportivas no carro suspenso
      const wheelOffsets = [
        [-1.12, 0.32, 1.25],
        [1.12, 0.32, 1.25],
        [-1.12, 0.32, -1.25],
        [1.12, 0.32, -1.25],
      ];
      wheelOffsets.forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
        );
        w.rotateZ(Math.PI / 2);
        w.position.set(wx, wy, wz);
        liftedCar.add(w);
      });

      liftGroup.add(liftedCar);
      group.add(liftGroup);

      // 4. CARRO PRATA NO CHÃO COM CAPÔ ABERTO PARA REVISÃO DO THEO
      const silverCar = new THREE.Group();
      silverCar.position.set(2.4, 0, -1.2);

      // Chassi prata metálico
      const silverBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.78, 4.2),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.25 })
      );
      silverBody.position.y = 0.68;
      silverBody.castShadow = true;
      silverCar.add(silverBody);

      // Cabine prata
      const silverCabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 0.72, 2.3),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8, roughness: 0.3 })
      );
      silverCabin.position.set(0, 1.4, -0.3);
      silverCabin.castShadow = true;
      silverCar.add(silverCabin);

      // Vidro para-brisa
      const silverGlass = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.58, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1, metalness: 0.9 })
      );
      silverGlass.position.set(0, 1.4, 0.85);
      silverCar.add(silverGlass);

      // Capô aberto inclinado em 45 graus!
      const hoodMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.08, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.85, roughness: 0.25 })
      );
      hoodMesh.position.set(0, 1.55, 1.35);
      hoodMesh.rotation.x = -0.55; // Capô levantado para ver o motor!
      silverCar.add(hoodMesh);

      // Vareta de apoio do capô
      const propRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      propRod.position.set(0.8, 1.35, 1.45);
      propRod.rotation.x = 0.25;
      silverCar.add(propRod);

      // MOTOR DETALHADO NO COFRE DO MOTOR
      const engineBlock = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.52, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
      );
      engineBlock.position.set(0, 0.95, 1.4);
      silverCar.add(engineBlock);

      // Tampa de válvulas cromada com detalhe
      const valveCover = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.18, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
      );
      valveCover.position.set(0, 1.25, 1.4);
      silverCar.add(valveCover);

      // Bateria preta com terminais vermelho e azul
      const battery = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.3, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
      );
      battery.position.set(-0.65, 0.95, 1.6);
      silverCar.add(battery);

      const posTerminal = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      posTerminal.position.set(-0.6, 1.14, 1.6);
      silverCar.add(posTerminal);

      // Filtro de ar esportivo cônico azul
      const airFilter = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.35, 10),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 })
      );
      airFilter.rotation.z = Math.PI / 2;
      airFilter.position.set(0.68, 1.1, 1.35);
      silverCar.add(airFilter);

      // Faróis amarelos
      for (const s of [-0.85, 0.85]) {
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 10, 10),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.5 })
        );
        head.position.set(s, 0.68, 2.12);
        silverCar.add(head);
      }

      // 4 Rodas do carro prata
      const silverWheelOffsets = [
        [-1.1, 0.38, 1.3],
        [1.1, 0.38, 1.3],
        [-1.1, 0.38, -1.3],
        [1.1, 0.38, -1.3],
      ];
      silverWheelOffsets.forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
        );
        w.rotateZ(Math.PI / 2);
        w.position.set(wx, wy, wz);
        w.castShadow = true;

        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.22, 0.29, 10),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 })
        );
        hub.rotateZ(Math.PI / 2);
        w.add(hub);

        silverCar.add(w);
      });

      group.add(silverCar);

      // 5. CARRINHO DE FERRAMENTAS PROFISSIONAL VERMELHO COM 5 GAVETAS (Snap-on style)
      const toolChest = new THREE.Group();
      toolChest.position.set(4.8, 0.6, 1.2);

      const tcBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.1, 0.7),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.65, roughness: 0.3 })
      );
      tcBody.castShadow = true;
      toolChest.add(tcBody);

      // Puxadores cromados das gavetas
      for (let g = 0; g < 5; g++) {
        const handle = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.04, 0.05),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 })
        );
        handle.position.set(0, 0.38 - g * 0.18, 0.37);
        toolChest.add(handle);
      }

      // Rodízios pretos
      for (const cx of [-0.45, 0.45]) {
        for (const cz of [-0.25, 0.25]) {
          const caster = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
          );
          caster.position.set(cx, -0.58, cz);
          toolChest.add(caster);
        }
      }

      group.add(toolChest);

      // 6. CAIXA DE FERRAMENTAS PORTÁTIL VERMELHA NO CHÃO
      const toolbox = new THREE.Group();
      toolbox.position.set(0.6, 0.18, 0.6);
      const tbBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.38, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.5, roughness: 0.4 })
      );
      tbBody.castShadow = true;
      toolbox.add(tbBody);

      const tbHandle = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.02, 6, 12, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      tbHandle.position.y = 0.22;
      toolbox.add(tbHandle);
      group.add(toolbox);

      // 7. MANCHA ESCURA DE ÓLEO NO CHÃO
      const oilGeo = new THREE.CircleGeometry(1.6, 16);
      oilGeo.rotateX(-Math.PI / 2);
      const oilMat = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.18,
        metalness: 0.6,
      });
      const oilMesh = new THREE.Mesh(oilGeo, oilMat);
      oilMesh.position.set(2.4, 0.11, 0.4);
      oilMesh.scale.set(1.4, 1.0, 0.9);
      oilMesh.receiveShadow = true;
      group.add(oilMesh);

      // 8. BANCADA DE OFICINA MECÂNICA COM MORSAS E CHAVES
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 1.1, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.4 })
      );
      bench.position.set(4.8, 0.55, -4.5);
      bench.castShadow = true;
      group.add(bench);

      // Torno mecânico de bancada (Swivel Bench Vise)
      const viseGroup = new THREE.Group();
      viseGroup.position.set(6.4, 1.25, -4.2);
      const viseBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 }));
      viseGroup.add(viseBase);
      const viseJaws = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.35), new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.7 }));
      viseJaws.position.y = 0.16;
      viseGroup.add(viseJaws);
      const viseHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95 }));
      viseHandle.rotation.x = Math.PI / 2;
      viseHandle.position.set(0.18, 0.16, 0);
      viseGroup.add(viseHandle);
      group.add(viseGroup);

      // Painel perfurado de ferramentas na parede
      const toolPegboard = new THREE.Mesh(
        new THREE.BoxGeometry(4.6, 2.0, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
      );
      toolPegboard.position.set(4.8, 2.3, -8.7);
      group.add(toolPegboard);

      // Compilado de chaves e ferramentas penduradas no painel
      for (let k = 0; k < 6; k++) {
        const wrench = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.45 + (k % 3) * 0.15, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
        );
        wrench.position.set(3.0 + k * 0.6, 2.3, -8.62);
        group.add(wrench);
      }

      // 9. COMPRESSOR DE AR INDUSTRIAL AZUL COM RESERVATÓRIO
      const compGroup = new THREE.Group();
      compGroup.position.set(-halfW + 1.5, 0, -halfD + 1.8);

      const compTank = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 1.4, 14),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
      );
      compTank.rotation.z = Math.PI / 2;
      compTank.position.y = 0.55;
      compTank.castShadow = true;
      compGroup.add(compTank);

      const compMotor = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.4, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
      );
      compMotor.position.set(0, 1.1, 0);
      compGroup.add(compMotor);

      const compGauge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.9 })
      );
      compGauge.rotation.x = Math.PI / 2;
      compGauge.position.set(0, 1.35, 0.2);
      compGroup.add(compGauge);

      group.add(compGroup);
    },
  });

  // 6. PRAÇA CENTRAL & GRANDE FONTE D'ÁGUA BORBULHANTE
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(30, 0, 27);

  const basinGeo = new THREE.CylinderGeometry(5.8, 6.4, 0.85, 32);
  const basinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55 });
  const basin = new THREE.Mesh(basinGeo, basinMat);
  basin.position.y = 0.42;
  basin.castShadow = true;
  fountainGroup.add(basin);

  const fWaterGeo = new THREE.CylinderGeometry(5.5, 5.5, 0.25, 32);
  const fWater = new THREE.Mesh(fWaterGeo, waterMat);
  fWater.position.y = 0.76;
  fountainGroup.add(fWater);

  const columnGeo = new THREE.CylinderGeometry(0.7, 0.95, 3.0, 16);
  const column = new THREE.Mesh(columnGeo, basinMat);
  column.position.y = 1.8;
  fountainGroup.add(column);

  scene.add(fountainGroup);
  circleColliders.push({ x: 30, z: 27, radius: 6.4, name: 'fountain_basin' });

  locations.push({
    id: 'parque_jardineiro',
    name: 'Parque & Canteiros de Flores',
    category: 'job',
    position: new THREE.Vector3(30, 0, 17),
    markerMesh: new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.5 })),
    label: 'Jardineiro do Parque (R$ 10)',
    radius: 4.0,
    isInside: false,
  });

  // Canteiros de flores coloridas
  const flowerBedCoords = [
    new THREE.Vector3(22, 0, 18),
    new THREE.Vector3(38, 0, 18),
    new THREE.Vector3(30, 0, 36),
  ];
  flowerBedCoords.forEach((fb) => {
    flowerBeds.push(fb);
    const bedGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.28, 16);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.copy(fb);
    bed.position.y = 0.14;
    scene.add(bed);

    for (let f = 0; f < 7; f++) {
      const flowerGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const fMat = new THREE.MeshStandardMaterial({
        color: f % 2 === 0 ? 0xef4444 : 0xf59e0b,
        emissive: f % 2 === 0 ? 0x991b1b : 0xb45309,
        emissiveIntensity: 0.35,
      });
      const fl = new THREE.Mesh(flowerGeo, fMat);
      fl.position.set(fb.x + Math.sin(f * 1.0) * 0.8, 0.45, fb.z + Math.cos(f * 1.0) * 0.8);
      scene.add(fl);
    }
  });

  // =========================================================================
  // 7. OS 7 BAIRROS COMPLETOS DA CIDADE GIGANTE 3X + RIO + 8 PONTES + 5 IGREJAS
  // =========================================================================
  const landmarkCtx: CityLandmarkContext = {
    scene,
    detailGroup,
    boxColliders,
    circleColliders,
    locations,
    nightWindowMaterials,
    emissiveSignMaterials,
    customerHouses,
    mailboxes,
  };

  // RIO AZUL ATRAVESSANDO A CIDADE + 8 PONTES CONECTANDO TODOS OS 7 BAIRROS
  buildRiverAndBridges(landmarkCtx, 90, [-240, -180, -120, -60, 0, 60, 120, 180], 480, -42);

  // --- BAIRRO 1: CENTRO (Igreja Matriz, Delegacia + Viaturas, Prefeitura, Banco, Farmácia, Lanchonete, Feira, Torres) ---
  buildChurchLandmark(landmarkCtx, {
    id: 'igreja_matriz',
    name: 'Igreja Matriz do Centro',
    x: 13,
    z: 16,
    variant: 'matriz',
    rotY: -Math.PI / 2,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'delegacia_policia',
    name: 'Delegacia de Polícia',
    category: 'landmark',
    x: 45,
    z: 16,
    w: 12,
    d: 13,
    h: 6.4,
    wallColor: 0x1d4ed8,
    roofColor: 0x0f172a,
    signTitle: 'DELEGACIA',
    signSubtitle: 'POLÍCIA DA CIDADE',
    signBg: 0x1e3a8a,
    rotY: Math.PI,
  });
  buildEmergencyVehicle(landmarkCtx, 42, 7.2, 0.15, 'police');
  buildEmergencyVehicle(landmarkCtx, 48, 7.2, -0.15, 'police');

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'prefeitura_centro',
    name: 'Prefeitura Municipal',
    category: 'landmark',
    x: 45,
    z: -24,
    w: 11,
    d: 14,
    h: 8.2,
    wallColor: 0xf8fafc,
    roofColor: 0x334155,
    signTitle: 'PREFEITURA',
    signSubtitle: 'CIDADE REAL 3D',
    signBg: 0x0f172a,
    signText: '#facc15',
    hasColumns: true,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'banco_central',
    name: 'Banco Central',
    category: 'shop',
    x: 13,
    z: -24,
    w: 10,
    d: 12,
    h: 7.4,
    wallColor: 0xe2e8f0,
    roofColor: 0x1e293b,
    signTitle: 'BANCO CENTRAL',
    signBg: 0x047857,
    hasColumns: true,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'farmacia_centro',
    name: 'Farmácia Saúde',
    category: 'shop',
    x: 13,
    z: 40,
    w: 10,
    d: 9,
    h: 5.0,
    wallColor: 0xffffff,
    roofColor: 0xdc2626,
    signTitle: 'FARMÁCIA',
    signBg: 0xdc2626,
    hasRedCross: true,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'lanchonete_sorveteria',
    name: 'Lanchonete & Sorveteria',
    category: 'shop',
    x: 45,
    z: 40,
    w: 10,
    d: 9,
    h: 5.0,
    wallColor: 0xfef3c7,
    roofColor: 0xdb2777,
    signTitle: 'LANCHONETE',
    signSubtitle: '& SORVETERIA',
    signBg: 0xdb2777,
  });

  buildFeiraLivre(landmarkCtx, -35, 11);

  // Prédios altos do Centro (6 a 11 andares)
  buildMultiStoryBuilding(landmarkCtx, { x: -42, z: -42, w: 12, d: 9, floors: 7, style: 'brick', wallColor: 0xfff7ed, accentColor: 0x7c2d12 });
  buildMultiStoryBuilding(landmarkCtx, { x: -20, z: -42, w: 13, d: 9, floors: 10, style: 'glass', wallColor: 0x1e293b, accentColor: 0x0f172a });
  buildMultiStoryBuilding(landmarkCtx, { x: 13, z: -42, w: 11, d: 9, floors: 11, style: 'glass', wallColor: 0x0f172a, accentColor: 0x0284c7 });
  buildMultiStoryBuilding(landmarkCtx, { x: 30, z: -42, w: 12, d: 9, floors: 8, style: 'concrete', wallColor: 0xe2e8f0, accentColor: 0x334155 });
  buildMultiStoryBuilding(landmarkCtx, { x: 45, z: -42, w: 10, d: 9, floors: 6, style: 'brick', wallColor: 0xfef2f2, accentColor: 0x991b1b });

  // --- BAIRRO 2: BAIRRO ALTO (Igreja Branca com Escada, Escola, Creche, Campinho, Basquete, Casas e Torres) ---
  buildChurchLandmark(landmarkCtx, {
    id: 'igreja_bairro_alto',
    name: 'Igreja do Bairro Alto',
    x: -90,
    z: -28,
    variant: 'bairro_alto',
    rotY: Math.PI / 2,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'escola_municipal',
    name: 'Escola Municipal Theo Lucca',
    category: 'landmark',
    x: -90,
    z: -90,
    w: 18,
    d: 14,
    h: 6.2,
    wallColor: 0xfef9c3,
    roofColor: 0x1d4ed8,
    signTitle: 'ESCOLA MUNICIPAL',
    signSubtitle: 'ENSINO & AVENTURA',
    signBg: 0x1d4ed8,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'creche_alegria',
    name: 'Creche Alegria',
    category: 'landmark',
    x: -150,
    z: -90,
    w: 15,
    d: 12,
    h: 4.8,
    wallColor: 0xfce7f3,
    roofColor: 0xec4899,
    signTitle: 'CRECHE ALEGRIA',
    signBg: 0xec4899,
  });

  buildHouseVariant(landmarkCtx, { x: -150, z: -20, wallColor: 0xfef08a, roofColor: 0xb91c1c, variant: 'quintal' });
  buildHouseVariant(landmarkCtx, { x: -150, z: -40, wallColor: 0xbae6fd, roofColor: 0x1e3a8a, variant: 'garagem' });
  buildHouseVariant(landmarkCtx, { x: -90, z: -45, wallColor: 0xdcfce7, roofColor: 0x15803d, variant: 'muro_colorido', fenceColor: 0xf97316 });

  buildMultiStoryBuilding(landmarkCtx, { x: -150, z: -150, w: 15, d: 13, floors: 7, style: 'concrete', wallColor: 0xf1f5f9, accentColor: 0x0284c7 });
  buildMultiStoryBuilding(landmarkCtx, { x: -90, z: -150, w: 15, d: 13, floors: 8, style: 'brick', wallColor: 0xffedd5, accentColor: 0xb45309 });

  // --- BAIRRO 3: BAIRRO BAIXO (Igreja Pequena Colorida, Mercadinho, Lan House, Casas Simples, Prédios) ---
  buildChurchLandmark(landmarkCtx, {
    id: 'igreja_bairro_baixo',
    name: 'Igreja do Bairro Baixo',
    x: -36,
    z: 146,
    variant: 'bairro_baixo',
    rotY: Math.PI,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'mercadinho_bairro_baixo',
    name: 'Mercadinho do Bairro',
    category: 'shop',
    x: -90,
    z: 148,
    w: 14,
    d: 11,
    h: 5.0,
    wallColor: 0xd1fae5,
    roofColor: 0x15803d,
    signTitle: 'MERCADINHO',
    signBg: 0x15803d,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'lan_house',
    name: 'Lan House Cyber Kid',
    category: 'shop',
    x: -16,
    z: 148,
    w: 11,
    d: 10,
    h: 5.0,
    wallColor: 0x1e1b4b,
    roofColor: 0x4f46e5,
    signTitle: 'LAN HOUSE',
    signSubtitle: 'GAMES & INTERNET',
    signBg: 0x4338ca,
    signText: '#38bdf8',
    rotY: Math.PI,
  });

  buildHouseVariant(landmarkCtx, { x: -150, z: 144, wallColor: 0xfde047, roofColor: 0xc2410c, variant: 'simples' });
  buildHouseVariant(landmarkCtx, { x: -150, z: 162, wallColor: 0xfbcfe8, roofColor: 0x9d174d, variant: 'muro_colorido', fenceColor: 0x38bdf8 });
  buildHouseVariant(landmarkCtx, { x: -90, z: 164, wallColor: 0xbae6fd, roofColor: 0x0369a1, variant: 'simples' });
  buildHouseVariant(landmarkCtx, { x: -34, z: 164, wallColor: 0xfed7aa, roofColor: 0x7c2d12, variant: 'quintal' });

  buildMultiStoryBuilding(landmarkCtx, { x: 28, z: 144, w: 15, d: 11, floors: 5, style: 'brick', wallColor: 0xfef3c7, accentColor: 0x9a3412 });
  buildMultiStoryBuilding(landmarkCtx, { x: 28, z: 162, w: 15, d: 11, floors: 6, style: 'concrete', wallColor: 0xe2e8f0, accentColor: 0x475569 });

  // --- BAIRRO 4: PRAIA / ORLA & PARQUE (Playground, Quadra de Basquete, Lago, Hotel Beira-Mar) ---
  buildPlaygroundAndCourtPark(landmarkCtx, 90, 28);

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'hotel_beira_mar',
    name: 'Hotel & Resort Orla Sul',
    category: 'landmark',
    x: 150,
    z: 28,
    w: 18,
    d: 14,
    h: 9.0,
    wallColor: 0xfef9c3,
    roofColor: 0x0284c7,
    signTitle: 'HOTEL ORLA',
    signSubtitle: 'PRAIA & FÉRIAS',
    signBg: 0x0369a1,
    rotY: -Math.PI / 2,
  });

  // --- BAIRRO 5: BAIRRO NOVO (Shopping Grande, Hospital + Ambulância, Posto, Loja de Carros, Bombeiros, Condomínios) ---
  buildShoppingMall(landmarkCtx, 90, -90);

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'hospital_municipal',
    name: 'Hospital Municipal',
    category: 'landmark',
    x: 90,
    z: -30,
    w: 18,
    d: 14,
    h: 8.4,
    wallColor: 0xffffff,
    roofColor: 0x0284c7,
    signTitle: 'HOSPITAL 24H',
    signSubtitle: 'PRONTO-SOCORRO',
    signBg: 0xdc2626,
    hasRedCross: true,
  });
  buildEmergencyVehicle(landmarkCtx, 78, -17, 0.25, 'ambulance');

  buildGasStation(landmarkCtx, 90, 148);

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'loja_de_carros',
    name: 'Concessionária & Loja de Carros',
    category: 'shop',
    x: 30,
    z: -90,
    w: 18,
    d: 12,
    h: 5.6,
    wallColor: 0xf1f5f9,
    roofColor: 0x0f172a,
    signTitle: 'LOJA DE CARROS',
    signSubtitle: 'ESPORTIVOS & MOTOS',
    signBg: 0x0284c7,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'quartel_bombeiros',
    name: 'Corpo de Bombeiros',
    category: 'landmark',
    x: 150,
    z: -30,
    w: 18,
    d: 14,
    h: 6.8,
    wallColor: 0xfee2e2,
    roofColor: 0x991b1b,
    signTitle: 'BOMBEIROS',
    signSubtitle: 'RESGATE 193',
    signBg: 0xdc2626,
  });
  buildEmergencyVehicle(landmarkCtx, 139, -17, -0.2, 'firetruck');

  // Condomínios Residenciais Modernos no Bairro Novo & Leste (6 a 12 andares)
  buildMultiStoryBuilding(landmarkCtx, { x: -30, z: -90, w: 16, d: 13, floors: 8, style: 'glass', wallColor: 0x1e293b, accentColor: 0x38bdf8 });
  buildMultiStoryBuilding(landmarkCtx, { x: -30, z: -150, w: 16, d: 13, floors: 10, style: 'concrete', wallColor: 0xf8fafc, accentColor: 0x1e40af });
  buildMultiStoryBuilding(landmarkCtx, { x: 30, z: -150, w: 16, d: 13, floors: 11, style: 'glass', wallColor: 0x0f172a, accentColor: 0xf59e0b });
  buildMultiStoryBuilding(landmarkCtx, { x: 90, z: -150, w: 16, d: 13, floors: 9, style: 'glass', wallColor: 0x1e293b, accentColor: 0x6366f1 });
  buildMultiStoryBuilding(landmarkCtx, { x: 150, z: -90, w: 16, d: 13, floors: 10, style: 'glass', wallColor: 0x0f172a, accentColor: 0x06b6d4 });
  buildMultiStoryBuilding(landmarkCtx, { x: 150, z: -150, w: 16, d: 13, floors: 8, style: 'concrete', wallColor: 0xf1f5f9, accentColor: 0x0284c7 });
  buildMultiStoryBuilding(landmarkCtx, { x: 90, z: 162, w: 15, d: 11, floors: 6, style: 'concrete', wallColor: 0xe2e8f0, accentColor: 0x0d9488 });
  buildMultiStoryBuilding(landmarkCtx, { x: 150, z: 150, w: 16, d: 12, floors: 7, style: 'brick', wallColor: 0xfff7ed, accentColor: 0xc2410c });

  // --- NOVO BAIRRO 6: JARDIM DAS FLORES (Igreja #4 São Pedro, Biblioteca, Supermercado Oeste, Feira das Flores, Prédios & Casas) ---
  buildChurchLandmark(landmarkCtx, {
    id: 'igreja_jardim_flores',
    name: 'Igreja São Pedro (Jardim das Flores)',
    x: -150,
    z: -150,
    variant: 'jardim_flores',
    rotY: 0,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'biblioteca_municipal',
    name: 'Biblioteca & Centro Cultural',
    category: 'landmark',
    x: -210,
    z: -90,
    w: 18,
    d: 14,
    h: 6.8,
    wallColor: 0xfef3c7,
    roofColor: 0x7c2d12,
    signTitle: 'BIBLIOTECA',
    signSubtitle: 'JARDIM DAS FLORES',
    signBg: 0x78350f,
    hasColumns: true,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'supermercado_oeste',
    name: 'Supermercado Jardim Oeste',
    category: 'shop',
    x: -210,
    z: -150,
    w: 18,
    d: 14,
    h: 6.0,
    wallColor: 0xd1fae5,
    roofColor: 0x065f46,
    signTitle: 'SUPERMERCADO',
    signSubtitle: 'JARDIM OESTE',
    signBg: 0x059669,
  });

  buildFeiraLivre(landmarkCtx, -210, -30);

  buildHouseVariant(landmarkCtx, { x: -210, z: 24, wallColor: 0xfde68a, roofColor: 0x991b1b, variant: 'quintal' });
  buildHouseVariant(landmarkCtx, { x: -210, z: 42, wallColor: 0xe0e7ff, roofColor: 0x3730a3, variant: 'garagem' });
  buildHouseVariant(landmarkCtx, { x: -210, z: -206, wallColor: 0xfce7f3, roofColor: 0xbe185d, variant: 'muro_colorido', fenceColor: 0x10b981 });

  // Torres Residenciais da Zona Norte & Jardim das Flores (6 a 12 andares!)
  buildMultiStoryBuilding(landmarkCtx, { x: -150, z: -210, w: 16, d: 13, floors: 8, style: 'brick', wallColor: 0xffedd5, accentColor: 0x9a3412 });
  buildMultiStoryBuilding(landmarkCtx, { x: -90, z: -210, w: 16, d: 13, floors: 9, style: 'concrete', wallColor: 0xf1f5f9, accentColor: 0x2563eb });
  buildMultiStoryBuilding(landmarkCtx, { x: -30, z: -210, w: 16, d: 13, floors: 11, style: 'glass', wallColor: 0x0f172a, accentColor: 0x0ea5e9 });
  buildMultiStoryBuilding(landmarkCtx, { x: 30, z: -210, w: 16, d: 13, floors: 12, style: 'glass', wallColor: 0x1e293b, accentColor: 0xfacc15 });
  buildMultiStoryBuilding(landmarkCtx, { x: 90, z: -210, w: 16, d: 13, floors: 10, style: 'concrete', wallColor: 0xe2e8f0, accentColor: 0x4f46e5 });
  buildMultiStoryBuilding(landmarkCtx, { x: 150, z: -210, w: 16, d: 13, floors: 9, style: 'glass', wallColor: 0x1e293b, accentColor: 0xec4899 });

  // --- NOVO BAIRRO 7: VILA ALEGRE SUL (Igreja #5 Capela Vila Alegre, Galeria Sul, Estádio Sul, Prédios & Casas) ---
  buildChurchLandmark(landmarkCtx, {
    id: 'igreja_vila_alegre',
    name: 'Capela da Vila Alegre',
    x: 90,
    z: 210,
    variant: 'vila_alegre',
    rotY: Math.PI,
  });

  buildCivicOrShopBuilding(landmarkCtx, {
    id: 'galeria_vila_alegre',
    name: 'Galeria Popular Vila Alegre',
    category: 'shop',
    x: 30,
    z: 210,
    w: 20,
    d: 14,
    h: 6.4,
    wallColor: 0xfef3c7,
    roofColor: 0xb45309,
    signTitle: 'GALERIA SUL',
    signSubtitle: 'VILA ALEGRE • LOJAS',
    signBg: 0xd97706,
  });

  buildPlaygroundAndCourtPark(landmarkCtx, -30, 210);

  buildHouseVariant(landmarkCtx, { x: -210, z: 146, wallColor: 0xbbf7d0, roofColor: 0x166534, variant: 'quintal' });
  buildHouseVariant(landmarkCtx, { x: -210, z: 208, wallColor: 0xfecdd3, roofColor: 0x9f1239, variant: 'garagem' });
  buildHouseVariant(landmarkCtx, { x: -150, z: 208, wallColor: 0xfef08a, roofColor: 0x854d0e, variant: 'muro_colorido', fenceColor: 0x0284c7 });

  // Prédios da Vila Alegre & Zona Sul (5 a 9 andares)
  buildMultiStoryBuilding(landmarkCtx, { x: -90, z: 210, w: 16, d: 13, floors: 7, style: 'brick', wallColor: 0xfef2f2, accentColor: 0x991b1b });
  buildMultiStoryBuilding(landmarkCtx, { x: 150, z: 210, w: 16, d: 13, floors: 8, style: 'glass', wallColor: 0x1e293b, accentColor: 0x10b981 });
  buildMultiStoryBuilding(landmarkCtx, { x: -210, z: -190, w: 14, d: 12, floors: 6, style: 'concrete', wallColor: 0xe2e8f0, accentColor: 0x475569 });
  buildMultiStoryBuilding(landmarkCtx, { x: -168, z: -210, w: 13, d: 12, floors: 7, style: 'brick', wallColor: 0xfff7ed, accentColor: 0xb45309 });

  // Placas 3D com Nomes das Ruas Principais nos Cruzamentos
  buildStreetNameSign(landmarkCtx, -7.2, -9.5, 'Avenida Central', 0);
  buildStreetNameSign(landmarkCtx, -53.2, -9.5, 'Rua da Igreja', 0);
  buildStreetNameSign(landmarkCtx, 53.2, -9.5, 'Rua do Shopping', 0);
  buildStreetNameSign(landmarkCtx, 173.2, -9.5, 'Rua da Praia', 0);
  buildStreetNameSign(landmarkCtx, -173.2, -9.5, 'Av. das Flores', 0);
  buildStreetNameSign(landmarkCtx, 7.2, 52.5, 'Av. do Parque', Math.PI / 2);
  buildStreetNameSign(landmarkCtx, 7.2, -172.5, 'Av. Horizonte Norte', Math.PI / 2);
  buildStreetNameSign(landmarkCtx, 7.2, 172.5, 'Av. Vila Alegre', Math.PI / 2);

  // Mobiliário Urbano no grupo LOD (Pontos de Ônibus, Lixeiras, Carrinhos de Supermercado)
  buildBusStopAndStreetFurniture(
    landmarkCtx,
    [
      [-7.5, 42, Math.PI / 2],
      [7.5, -42, -Math.PI / 2],
      [-53.0, -40, Math.PI / 2],
      [67.0, -72, -Math.PI / 2],
      [173.5, 16, -Math.PI / 2],
      [-173.5, -135, Math.PI / 2],
      [20.0, 187.5, 0],
    ],
    [
      [-7.2, -16], [7.2, -16], [-7.2, 16], [7.2, 16],
      [-26, 16], [36, 20], [74, -64], [-80, -66], [186, 0], [-196, -138], [80, 194],
    ],
    [
      [-25, 17.5], [-23.5, 17.5], [-16, 17.5], [-14.5, 17.5], [-200, -142], [-198.5, -142],
    ]
  );

  // --- ÁRVORES COM CARA DE ÁRVORE (TRONCO MARROM + 2 VOLUMES VERDES DE TAMANHOS DIFERENTES + GALHOS + CANTEIRO) ---
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x543310,
    roughness: 0.9,
    flatShading: true,
  });

  const canopyLowerMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Verde floresta profundo
    roughness: 0.8,
    flatShading: true,
  });

  const canopyUpperMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e, // Verde folha vibrante
    roughness: 0.75,
    flatShading: true,
  });

  const canopyTuftMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a, // Verde médio para tufos
    roughness: 0.8,
    flatShading: true,
  });

  const mulchMat = new THREE.MeshStandardMaterial({ color: 0x2d1808, roughness: 0.95 });
  const appleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });

  const createParkTree = (tx: number, tz: number, hasApples = false) => {
    const tree = new THREE.Group();
    tree.position.set(tx, 0, tz);

    // 1. Canteiro circular de pedra com terra fértil na base (dá cara de praça e parque!)
    const curb = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.12, 16), curbMat);
    curb.position.y = 0.06;
    curb.receiveShadow = true;
    tree.add(curb);

    const mulch = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.13, 16), mulchMat);
    mulch.position.y = 0.065;
    mulch.receiveShadow = true;
    tree.add(mulch);

    // Pequenas florezinhas de enfeite no canteiro da árvore
    const flowerColors = [0xef4444, 0xfacc15, 0xec4899, 0x38bdf8];
    for (let f = 0; f < 4; f++) {
      const fAngle = (f * Math.PI * 2) / 4 + 0.3;
      const flw = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshStandardMaterial({ color: flowerColors[f], roughness: 0.5 })
      );
      flw.position.set(Math.sin(fAngle) * 0.85, 0.15, Math.cos(fAngle) * 0.85);
      tree.add(flw);
    }

    // 2. Tronco de madeira marrom cônico realista
    const trunkGeo = new THREE.CylinderGeometry(0.26, 0.44, 2.7, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.35;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Raízes visíveis de apoio fincadas no chão
    for (let r = 0; r < 4; r++) {
      const rootAngle = (r * Math.PI * 2) / 4;
      const rootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.52), trunkMat);
      rootMesh.position.set(Math.sin(rootAngle) * 0.38, 0.08, Math.cos(rootAngle) * 0.38);
      rootMesh.rotation.y = rootAngle;
      rootMesh.castShadow = true;
      rootMesh.receiveShadow = true;
      tree.add(rootMesh);
    }

    // 3. Galhos grossos no topo que sustentam visivelmente a copa
    const branchConfigs = [
      { angleY: 0.3, angleZ: 0.45, y: 2.3, scale: 0.95 },
      { angleY: 2.3, angleZ: -0.4, y: 2.35, scale: 0.9 },
      { angleY: 4.2, angleZ: 0.42, y: 2.4, scale: 0.85 },
    ];

    branchConfigs.forEach(({ angleY, angleZ, y, scale }) => {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 1.15 * scale, 7), trunkMat);
      branch.position.set(Math.sin(angleY) * 0.28, y, Math.cos(angleY) * 0.28);
      branch.rotation.y = angleY;
      branch.rotation.z = angleZ;
      branch.castShadow = true;
      tree.add(branch);
    });

    // 4. BOLA VERDE MAIOR NA BASE DA COPA (Volume inferior facetado estilo Free Fire / GTA)
    const canopyLowerGeo = new THREE.DodecahedronGeometry(1.85, 1);
    const canopyLower = new THREE.Mesh(canopyLowerGeo, canopyLowerMat);
    canopyLower.position.set(0, 3.25, 0);
    canopyLower.scale.set(1.18, 0.92, 1.14);
    canopyLower.castShadow = true;
    canopyLower.receiveShadow = true;
    tree.add(canopyLower);

    // 5. BOLA VERDE MENOR NO TOPO (Volume superior vibrante coroando a árvore)
    const canopyUpperGeo = new THREE.DodecahedronGeometry(1.28, 1);
    const canopyUpper = new THREE.Mesh(canopyUpperGeo, canopyUpperMat);
    canopyUpper.position.set(0.12, 4.38, 0.1);
    canopyUpper.scale.set(1.05, 0.95, 1.05);
    canopyUpper.castShadow = true;
    canopyUpper.receiveShadow = true;
    tree.add(canopyUpper);

    // 6. Tufos laterais orgânicos que dão volume natural e silhueta de árvore viva
    const tuft1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), canopyTuftMat);
    tuft1.position.set(-0.75, 3.05, -0.45);
    tuft1.castShadow = true;
    tree.add(tuft1);

    const tuft2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), canopyTuftMat);
    tuft2.position.set(0.72, 3.15, 0.4);
    tuft2.castShadow = true;
    tree.add(tuft2);

    // Maçãzinhas vermelhas decorativas no parque
    if (hasApples) {
      const applePositions = [
        [-0.85, 2.7, 0.5],
        [0.8, 2.9, -0.6],
        [-0.3, 3.6, 0.95],
        [0.7, 3.7, 0.6],
        [0.0, 4.6, -0.6],
      ];
      applePositions.forEach(([ax, ay, az]) => {
        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), appleMat);
        apple.position.set(ax, ay, az);
        apple.castShadow = true;
        tree.add(apple);
      });
    }

    scene.add(tree);
    circleColliders.push({ x: tx, z: tz, radius: 0.85, name: 'tree' });
  };

  // Coqueiros Tropicais na Praia (Estilo GTA Vice City / San Andreas infantil)
  const palmMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7, flatShading: true });
  const coconutMat = new THREE.MeshStandardMaterial({ color: 0x3e1f07, roughness: 0.8 });

  const createPalmTree = (px: number, pz: number) => {
    const palm = new THREE.Group();
    palm.position.set(px, 0, pz);

    // Canteiro de areia com pedrinhas
    const basePebble = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.1, 12), curbMat);
    basePebble.position.y = 0.05;
    basePebble.receiveShadow = true;
    palm.add(basePebble);

    // Tronco esbelto segmentado e levemente curvo em direção ao mar
    const numSegments = 6;
    let curY = 0.35;
    let curX = 0;
    for (let s = 0; s < numSegments; s++) {
      const segH = 0.65;
      const bottomR = 0.26 - s * 0.02;
      const topR = 0.24 - s * 0.02;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(topR, bottomR, segH, 8), palmMat);
      seg.position.set(curX, curY, 0);
      seg.rotation.z = -0.06;
      seg.castShadow = true;
      seg.receiveShadow = true;
      palm.add(seg);

      curY += segH * 0.96;
      curX += 0.09;
    }

    // Cacho de 4 cocos marrons no topo
    for (let c = 0; c < 4; c++) {
      const cAngle = (c * Math.PI * 2) / 4;
      const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), coconutMat);
      coconut.position.set(curX + Math.sin(cAngle) * 0.25, curY - 0.1, Math.cos(cAngle) * 0.25);
      coconut.castShadow = true;
      palm.add(coconut);
    }

    // 7 Folhas largas curvadas (Frondes de palmeira)
    for (let f = 0; f < 7; f++) {
      const fAngle = (f * Math.PI * 2) / 7;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(curX, curY + 0.1, 0);
      frondGroup.rotation.y = fAngle;

      // Base da folha subindo
      const part1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 1.4), palmFrondMat);
      part1.position.set(0, 0.25, 0.7);
      part1.rotation.x = 0.35;
      part1.castShadow = true;
      frondGroup.add(part1);

      // Ponta da folha caindo suavemente
      const part2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 1.5), palmFrondMat);
      part2.position.set(0, 0.35, 2.0);
      part2.rotation.x = -0.45;
      part2.castShadow = true;
      frondGroup.add(part2);

      palm.add(frondGroup);
    }

    scene.add(palm);
    circleColliders.push({ x: px, z: pz, radius: 0.75, name: 'palm' });
  };

  // Posicionamento das árvores no Parque, Ruas e 7 Bairros (zero conflito com prédios e avenidas)
  const urbanTreePositions: [number, number, boolean][] = [
    [-7.0, -22, false], [-7.0, 22, false], [-7.0, 44, false],
    [7.0, -22, false], [7.0, 44, false],
    [-52, -7.2, false], [-52, 7.2, false], [52, -7.2, false], [52, 7.2, false],
    [22, 44, false], [38, 44, false],
    [-70, -46, false], [-108, -46, false], [-108, 46, false],
    [68, 46, false], [108, 46, false], [68, 12, false], [108, 12, false],
    [-20, 128, false], [-50, 128, false], [20, 128, false],
    [-12, -32, true], [-32, -12, true], [-32, -34, false], [22, 16, true], [38, 16, false],
    [-190, -14, true], [-228, -44, false], [-190, -130, false], [-132, -196, false],
    [132, -196, false], [132, 132, false], [-16, 196, true], [-46, 224, false], [72, 196, false],
  ];

  urbanTreePositions.forEach(([tx, tz, hasApples]) => {
    createParkTree(tx, tz, hasApples);
  });

  // Coqueiros na Orla da Praia (X = 188)
  const beachPalmPositions: [number, number][] = [
    [188, -220], [188, -176], [188, -132], [188, -88], [188, -44],
    [188, 0], [188, 44], [188, 88], [188, 132], [188, 176], [188, 220],
  ];

  beachPalmPositions.forEach(([px, pz]) => {
    createPalmTree(px, pz);
  });

  // --- BANCOS DE PRAÇA DE MADEIRA COM ESTRUTURA DE FERRO (LOD detailGroup) ---
  const benchPositions = [
    [-12, -8.5, 0],
    [-24, -8.5, 0],
    [12, -8.5, 0],
    [24, -8.5, 0],
    [-12, 8.5, Math.PI],
    [12, 8.5, Math.PI],
    [26, 18, -Math.PI / 2],
    [34, 18, -Math.PI / 2],
    [194, -24, -Math.PI / 2],
    [194, 14, -Math.PI / 2],
  ];

  const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });
  const benchIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });

  benchPositions.forEach(([bx, bz, rotY]) => {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bx, 0.08, bz);
    benchGroup.rotation.y = rotY;

    for (const legX of [-0.9, 0.9]) {
      const legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.45);
      const leg = new THREE.Mesh(legGeo, benchIronMat);
      leg.position.set(legX, 0.22, 0);
      leg.castShadow = true;
      benchGroup.add(leg);
    }

    for (let s = 0; s < 3; s++) {
      const slatGeo = new THREE.BoxGeometry(2.0, 0.04, 0.12);
      const slat = new THREE.Mesh(slatGeo, benchWoodMat);
      slat.position.set(0, 0.45, -0.15 + s * 0.15);
      slat.castShadow = true;
      benchGroup.add(slat);
    }

    for (let b = 0; b < 2; b++) {
      const backSlatGeo = new THREE.BoxGeometry(2.0, 0.12, 0.04);
      const backSlat = new THREE.Mesh(backSlatGeo, benchWoodMat);
      backSlat.position.set(0, 0.65 + b * 0.16, -0.22);
      backSlat.castShadow = true;
      benchGroup.add(backSlat);
    }

    detailGroup.add(benchGroup);
  });

  // --- HIDRANTES DE INCÊNDIO VERMELHOS CLÁSSICOS (LOD detailGroup) ---
  const hydrantPositions = [
    [-7.5, -14],
    [7.5, -14],
    [-7.5, 14],
    [7.5, 14],
    [-52, -7.5],
    [52, -7.5],
  ];

  const hydrantRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.3, roughness: 0.4 });
  const hydrantSilverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

  hydrantPositions.forEach(([hx, hz]) => {
    const hydrant = new THREE.Group();
    hydrant.position.set(hx, 0.08, hz);

    const baseGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.65, 12);
    const base = new THREE.Mesh(baseGeo, hydrantRedMat);
    base.position.y = 0.32;
    base.castShadow = true;
    hydrant.add(base);

    const capGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const cap = new THREE.Mesh(capGeo, hydrantRedMat);
    cap.position.y = 0.65;
    hydrant.add(cap);

    for (const side of [-1, 1]) {
      const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10);
      nozzleGeo.rotateZ(Math.PI / 2);
      const nozzle = new THREE.Mesh(nozzleGeo, hydrantSilverMat);
      nozzle.position.set(side * 0.22, 0.42, 0);
      hydrant.add(nozzle);
    }

    detailGroup.add(hydrant);
  });

  // --- NUVENS 3D FOFAS FLUTUANTES NO CÉU AMPLIADO ---
  const clouds: THREE.Group[] = [];
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9,
  });

  for (let c = 0; c < 14; c++) {
    const cloud = new THREE.Group();
    cloud.position.set(
      -260 + Math.random() * 520,
      58 + Math.random() * 24,
      -240 + Math.random() * 480
    );

    // Aglomerado de 4 esferas volumosas formando uma nuvem
    for (let p = 0; p < 4; p++) {
      const radius = 5.0 + Math.random() * 4.5;
      const puffGeo = new THREE.SphereGeometry(radius, 10, 10);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (p - 1.5) * 5.2 + (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 1.8,
        (Math.random() - 0.5) * 4.0
      );
      cloud.add(puff);
    }

    scene.add(cloud);
    clouds.push(cloud);
  }

  // =========================================================================
  // --- CARROS COLORIDOS REALISTAS CIRCULANDO PELOS 7 BAIRROS ---
  // =========================================================================
  const routeCircuit1: THREE.Vector3[] = [
    new THREE.Vector3(3.4, 0, -230),
    new THREE.Vector3(3.4, 0, 230),
    new THREE.Vector3(60, 0, 230),
    new THREE.Vector3(60, 0, -230),
  ];

  const routeCircuit2: THREE.Vector3[] = [
    new THREE.Vector3(-3.4, 0, 230),
    new THREE.Vector3(-3.4, 0, -230),
    new THREE.Vector3(-60, 0, -230),
    new THREE.Vector3(-60, 0, 230),
  ];

  const routeCircuit3: THREE.Vector3[] = [
    new THREE.Vector3(-230, 0, 3.4),
    new THREE.Vector3(176, 0, 3.4),
    new THREE.Vector3(176, 0, -60),
    new THREE.Vector3(-230, 0, -60),
  ];

  const routeCircuit4: THREE.Vector3[] = [
    new THREE.Vector3(-180, 0, -180),
    new THREE.Vector3(120, 0, -180),
    new THREE.Vector3(120, 0, 180),
    new THREE.Vector3(-180, 0, 180),
  ];

  const carConfigs = [
    { name: 'Táxi Amarelo', body: 0xfacc15, roof: 0x0f172a, route: routeCircuit1, startWp: 0 },
    { name: 'Carro Azul Esportivo', body: 0x2563eb, roof: 0x1e293b, route: routeCircuit2, startWp: 0 },
    { name: 'Van Vermelha', body: 0xdc2626, roof: 0xf8fafc, route: routeCircuit1, startWp: 2 },
    { name: 'Fusquinha Verde', body: 0x16a34a, roof: 0x15803d, route: routeCircuit2, startWp: 2 },
    { name: 'Picape Laranja', body: 0xf97316, roof: 0x431407, route: routeCircuit3, startWp: 0 },
    { name: 'Sedã Prata Executivo', body: 0xcbd5e1, roof: 0x334155, route: routeCircuit4, startWp: 0 },
    { name: 'SUV Roxo Aventura', body: 0x7c3aed, roof: 0x0f172a, route: routeCircuit4, startWp: 2 },
    { name: 'Conversível Turquesa', body: 0x06b6d4, roof: 0xf8fafc, route: routeCircuit3, startWp: 2 },
  ];

  const cars: CityCar[] = [];

  const activeCarSpotTargetL = new THREE.Object3D();
  const activeCarSpotTargetR = new THREE.Object3D();
  scene.add(activeCarSpotTargetL);
  scene.add(activeCarSpotTargetR);

  const activeCarSpotL = new THREE.SpotLight(0xfff8db, 0, 32, Math.PI / 6.5, 0.45, 1.6);
  activeCarSpotL.target = activeCarSpotTargetL;
  scene.add(activeCarSpotL);

  const activeCarSpotR = new THREE.SpotLight(0xfff8db, 0, 32, Math.PI / 6.5, 0.45, 1.6);
  activeCarSpotR.target = activeCarSpotTargetR;
  scene.add(activeCarSpotR);

  const createDetailedCar = (cfg: typeof carConfigs[0]): {
    group: THREE.Group;
    wheels: THREE.Mesh[];
    frontBumper: THREE.Mesh;
    carBody: THREE.Mesh;
    headL: THREE.Mesh;
    headR: THREE.Mesh;
    beamL: THREE.Mesh;
    beamR: THREE.Mesh;
  } => {
    const carGroup = new THREE.Group();

    // Chassi com pintura automotiva metálica brilhante e design aerodinâmico
    const bodyGeo = new THREE.BoxGeometry(2.2, 0.85, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: cfg.body,
      roughness: 0.25,
      metalness: 0.65,
    });
    const carBody = new THREE.Mesh(bodyGeo, bodyMat);
    carBody.position.y = 0.72;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);

    // Parachoque dianteiro preto/cinza escuro
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.28, 0.3), bumperMat);
    frontBumper.position.set(0, 0.42, 2.28);
    frontBumper.castShadow = true;
    carGroup.add(frontBumper);

    // Parachoque traseiro preto
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.28, 0.3), bumperMat);
    rearBumper.position.set(0, 0.42, -2.28);
    rearBumper.castShadow = true;
    carGroup.add(rearBumper);

    // Grade frontal do radiador preta
    const grill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.32, 0.08), new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.8 }));
    grill.position.set(0, 0.68, 2.27);
    carGroup.add(grill);

    // Placa branca na frente
    const plateGeo = new THREE.BoxGeometry(0.7, 0.18, 0.04);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, 0.4, 2.44);
    carGroup.add(frontPlate);

    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, 0.4, -2.44);
    carGroup.add(rearPlate);

    // Cabine com teto aerodinâmico
    const cabinGeo = new THREE.BoxGeometry(1.9, 0.78, 2.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: cfg.roof, roughness: 0.3, metalness: 0.5 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.45, -0.2);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    carGroup.add(cabin);

    // 1. VIDRO PRETO NA FRENTE (Para-brisa preto brilhante aerodinâmico)
    const blackGlassMat = new THREE.MeshStandardMaterial({
      color: 0x090d16, // Vidro preto puro
      roughness: 0.12,
      metalness: 0.85,
    });

    const windshieldGeo = new THREE.BoxGeometry(1.75, 0.65, 0.12);
    windshieldGeo.rotateX(0.24);
    const windshield = new THREE.Mesh(windshieldGeo, blackGlassMat);
    windshield.position.set(0, 1.4, 1.02);
    windshield.castShadow = true;
    carGroup.add(windshield);

    // Vidros laterais pretos fumê
    for (const s of [-1, 1]) {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 1.8), blackGlassMat);
      sideGlass.position.set(s * 0.96, 1.42, -0.2);
      carGroup.add(sideGlass);

      // Maçanetas das portas
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.18), bumperMat);
      handle.position.set(s * 1.12, 0.85, 0.1);
      carGroup.add(handle);
    }

    // Vidro traseiro preto
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.54, 0.08), blackGlassMat);
    rearGlass.position.set(0, 1.42, -1.38);
    carGroup.add(rearGlass);

    // 2. FAROL AMARELO NA FRENTE (Emissivo amarelo dourado vibrante)
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const lightGeo = new THREE.BoxGeometry(0.38, 0.22, 0.12);

    const headL = new THREE.Mesh(lightGeo, headlightMat);
    headL.position.set(-0.82, 0.74, 2.26);
    carGroup.add(headL);

    const headR = new THREE.Mesh(lightGeo, headlightMat);
    headR.position.set(0.82, 0.74, 2.26);
    carGroup.add(headR);

    // 3. FAROL VERMELHO ATRÁS (Lanternas traseiras vermelhas luminosas)
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const tailL = new THREE.Mesh(lightGeo, tailMat);
    tailL.position.set(-0.82, 0.74, -2.26);
    carGroup.add(tailL);

    const tailR = new THREE.Mesh(lightGeo, tailMat);
    tailR.position.set(0.82, 0.74, -2.26);
    carGroup.add(tailR);

    // Retrovisores laterais
    for (const s of [-1, 1]) {
      const mirrorGeo = new THREE.BoxGeometry(0.32, 0.16, 0.2);
      const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
      mirror.position.set(s * 1.15, 1.3, 0.7);
      mirror.castShadow = true;
      carGroup.add(mirror);
    }

    // 4. 4 RODAS PRETAS COM CALOTA CINZA
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.32, 18);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }); // Pneu preto

    // Calota cinza metálica
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Cinza
      metalness: 0.85,
      roughness: 0.3,
    });

    const wheelOffsets = [
      [-1.1, 0.4, 1.4],
      [1.1, 0.4, 1.4],
      [-1.1, 0.4, -1.4],
      [1.1, 0.4, -1.4],
    ];

    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;

      // Calota cinza no centro da roda
      const hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.33, 12);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      wheel.add(hub);

      // Centro do cubo preto
      const centerCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.34, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      centerCap.rotateZ(Math.PI / 2);
      wheel.add(centerCap);

      carGroup.add(wheel);
      wheels.push(wheel);
    });

    // 5. Feixes visuais de farol (cones aditivos leves que acendem à noite)
    const beamGeo = new THREE.ConeGeometry(1.15, 7.5, 10, 1, true);
    beamGeo.translate(0, -3.75, 0);
    beamGeo.rotateX(-Math.PI / 2);

    const beamMatL = new THREE.MeshBasicMaterial({
      color: 0xfff8db,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamL = new THREE.Mesh(beamGeo, beamMatL);
    beamL.position.set(-0.82, 0.7, 2.3);
    carGroup.add(beamL);

    const beamMatR = beamMatL.clone();
    const beamR = new THREE.Mesh(beamGeo, beamMatR);
    beamR.position.set(0.82, 0.7, 2.3);
    carGroup.add(beamR);

    scene.add(carGroup);
    return {
      group: carGroup,
      wheels,
      frontBumper,
      carBody,
      headL,
      headR,
      beamL,
      beamR,
    };
  };

  carConfigs.forEach((cfg) => {
    const carData = createDetailedCar(cfg);
    const startPos = cfg.route[cfg.startWp].clone();
    carData.group.position.copy(startPos);

    const carItem: CityCar = {
      group: carData.group,
      colorName: cfg.name,
      speed: 7.2,
      maxSpeed: 7.8,
      waypoints: cfg.route,
      currentWpIndex: (cfg.startWp + 1) % cfg.route.length,
      rotationY: 0,
      wheels: carData.wheels,
      honkCooldown: 0,
      stoppedByRedLight: false,
      stoppedByPedestrian: false,
      hasTheoPassenger: false,
      frontBumperMesh: carData.frontBumper,
      carBodyMesh: carData.carBody,
      headlightBeamL: carData.beamL,
      headlightBeamR: carData.beamR,
      headlightMeshL: carData.headL,
      headlightMeshR: carData.headR,
      dentLevel: 0,
      applyDent: (_dir = 'front') => {
        carItem.dentLevel = Math.min(3, (carItem.dentLevel || 0) + 1);
        const lvl = carItem.dentLevel;
        if (carData.frontBumper) {
          carData.frontBumper.position.z = 2.28 - lvl * 0.12;
          carData.frontBumper.rotation.x = -0.1 * lvl;
          carData.frontBumper.rotation.y = (Math.random() - 0.5) * 0.14 * lvl;
        }
        if (carData.carBody) {
          carData.carBody.scale.z = 1.0 - lvl * 0.035;
        }
      },
      repair: () => {
        carItem.dentLevel = 0;
        if (carData.frontBumper) {
          carData.frontBumper.position.set(0, 0.42, 2.28);
          carData.frontBumper.rotation.set(0, 0, 0);
        }
        if (carData.carBody) {
          carData.carBody.scale.set(1, 1, 1);
        }
      },
      setHeadlights: (on: boolean) => {
        const beamOpacity = on ? 0.18 : 0;
        if (carData.beamL?.material) (carData.beamL.material as THREE.MeshBasicMaterial).opacity = beamOpacity;
        if (carData.beamR?.material) (carData.beamR.material as THREE.MeshBasicMaterial).opacity = beamOpacity;
        const emissiveIntensity = on ? 3.2 : 0.8;
        if (carData.headL?.material) (carData.headL.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
        if (carData.headR?.material) (carData.headR.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
      },
    };

    cars.push(carItem);
  });

  // =========================================================================
  // --- MOTOS COLORIDAS ESTILOSAS (ESPORTIVAS & SCOOTERS) NO CENÁRIO ---
  // =========================================================================
  const motos: CityMoto[] = [];

  const createDetailedMotorcycle = (cfg: {
    name: string;
    bodyColor: number;
    hasDriver?: boolean;
  }): { group: THREE.Group; wheels: THREE.Mesh[]; frontFork: THREE.Group; rider?: THREE.Group } => {
    const motoGroup = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.bodyColor, metalness: 0.7, roughness: 0.25 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });

    // Chassi central
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 1.2), frameMat);
    chassis.position.y = 0.58;
    chassis.castShadow = true;
    motoGroup.add(chassis);

    // Tanque de combustível aerodinâmico
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.35, 0.7), bodyMat);
    tank.position.set(0, 0.82, 0.15);
    tank.castShadow = true;
    motoGroup.add(tank);

    // Assento preto anatômico
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.75), seatMat);
    seat.position.set(0, 0.76, -0.4);
    seat.castShadow = true;
    motoGroup.add(seat);

    // Escapamento cromado
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8), chromeMat);
    exhaust.rotation.x = Math.PI / 2 - 0.1;
    exhaust.position.set(0.26, 0.36, -0.35);
    exhaust.castShadow = true;
    motoGroup.add(exhaust);

    // Motor
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.42), chromeMat);
    engine.position.set(0, 0.42, 0.05);
    motoGroup.add(engine);

    // Farol dianteiro
    const headlight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 2.2 })
    );
    headlight.rotation.x = Math.PI / 2;
    headlight.position.set(0, 0.9, 0.88);
    motoGroup.add(headlight);

    // Lanterna traseira
    const taillight = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.8 })
    );
    taillight.position.set(0, 0.78, -0.82);
    motoGroup.add(taillight);

    // Garfo dianteiro articulado com guidão
    const frontFork = new THREE.Group();
    frontFork.position.set(0, 0.42, 0.85);

    const forkPoles = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), chromeMat);
    forkPoles.position.set(0, 0.25, 0);
    forkPoles.rotation.x = -0.22;
    frontFork.add(forkPoles);

    // Guidão
    const handlebar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.04), chromeMat);
    handlebar.position.set(0, 0.65, -0.05);
    frontFork.add(handlebar);

    for (const s of [-1, 1]) {
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.06), seatMat);
      grip.position.set(s * 0.36, 0.65, -0.05);
      frontFork.add(grip);
    }

    // Rodas
    const wheels: THREE.Mesh[] = [];
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.16, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const frontWheel = new THREE.Mesh(wheelGeo, tireMat);
    frontWheel.position.set(0, -0.06, 0);
    frontWheel.castShadow = true;
    const fHub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.17, 10), chromeMat);
    fHub.rotateZ(Math.PI / 2);
    frontWheel.add(fHub);
    frontFork.add(frontWheel);
    wheels.push(frontWheel);

    motoGroup.add(frontFork);

    const rearWheel = new THREE.Mesh(wheelGeo, tireMat);
    rearWheel.position.set(0, 0.36, -0.75);
    rearWheel.castShadow = true;
    const rHub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.17, 10), chromeMat);
    rHub.rotateZ(Math.PI / 2);
    rearWheel.add(rHub);
    motoGroup.add(rearWheel);
    wheels.push(rearWheel);

    let riderGroup: THREE.Group | undefined;
    // Piloto NPC na moto em trânsito
    if (cfg.hasDriver) {
      const rider = new THREE.Group();
      rider.position.set(0, 0.75, -0.25);

      const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.3), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
      rBody.position.y = 0.32;
      rBody.rotation.x = 0.25;
      rider.add(rBody);

      // Capacete esportivo com viseira
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), new THREE.MeshStandardMaterial({ color: cfg.bodyColor, metalness: 0.5 }));
      helmet.position.set(0, 0.72, 0.1);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.14), new THREE.MeshStandardMaterial({ color: 0x0a0f1d, metalness: 0.9 }));
      visor.position.set(0, 0.72, 0.22);
      rider.add(helmet);
      rider.add(visor);

      motoGroup.add(rider);
      riderGroup = rider;
    }

    scene.add(motoGroup);
    return { group: motoGroup, wheels, frontFork, rider: riderGroup };
  };

  const motoConfigs = [
    { name: 'Moto Esportiva Vermelha', bodyColor: 0xef4444, route: routeCircuit1, startWp: 1, isParked: false, hasDriver: true },
    { name: 'Scooter Ninja Verde', bodyColor: 0x10b981, route: routeCircuit2, startWp: 3, isParked: false, hasDriver: true },
    { name: 'Moto Esportiva Azul (Oficina)', bodyColor: 0x2563eb, initialPos: new THREE.Vector3(26, 0, -16), initialRot: 0.15, isParked: true, hasDriver: false },
    { name: 'Scooter da Pizza Amarela', bodyColor: 0xfacc15, initialPos: new THREE.Vector3(-18, 0, -16), initialRot: -0.2, isParked: true, hasDriver: false },
  ];

  motoConfigs.forEach((cfg) => {
    const { group, wheels, frontFork, rider } = createDetailedMotorcycle(cfg);
    const startPos = cfg.isParked && cfg.initialPos ? cfg.initialPos.clone() : (cfg.route ? cfg.route[cfg.startWp || 0].clone() : new THREE.Vector3());
    group.position.copy(startPos);
    if (cfg.initialRot) group.rotation.y = cfg.initialRot;

    motos.push({
      group,
      colorName: cfg.name,
      speed: cfg.isParked ? 0 : 8.5,
      maxSpeed: 9.2,
      waypoints: cfg.route || [],
      currentWpIndex: cfg.route ? ((cfg.startWp || 0) + 1) % cfg.route.length : 0,
      rotationY: cfg.initialRot || 0,
      wheels,
      frontFork,
      rider,
      isParked: cfg.isParked,
      hasTheoPassenger: false,
    });
  });

  // =========================================================================
  // --- NPCS REALISTAS ESTILO THEO LUCCA COM VOZES MASCULINAS E FEMININAS ---
  // =========================================================================
  const npcsData: {
    name: string;
    role: string;
    phrase: string;
    gender: 'male' | 'female';
    tips: string[];
    pos: THREE.Vector3;
    skinTone: number;
    shirtColor: number;
    pantsColor: number;
    hairColor: number;
    hairStyle: 'bakerHat' | 'policeCap' | 'shortHair' | 'pigtails' | 'curlyBun' | 'fedora' | 'longWavy';
    isChild?: boolean;
    hasApron?: boolean;
    isInsideBuilding?: boolean;
  }[] = [
    { 
      name: 'Personal Inho', 
      role: 'Educador Físico & Treinador', 
      gender: 'male',
      phrase: 'E aí, campeão Theo Lucca! Dica do seu Personal: continue correndo e pulando para treinar seu fôlego! A cada missão que você cumpre, nossa cidade ganha novos bairros no mapa!', 
      tips: [
        'E aí campeão Theo Lucca! Dica do seu Personal: continue correndo e pulando para treinar seu fôlego! A cada missão cumprida a cidade fica muito maior!',
        'Fala garoto Theo Lucca! Dica de ouro: beba um suco geladinho da sua mochila para recuperar 100% da sua energia na hora!',
        'Grande Theo Lucca! Complete as missões para ver a academia ao ar livre e a quadra esportiva se abrirem no mapa de navegação!'
      ],
      pos: new THREE.Vector3(14, 0, 36),
      skinTone: 0xc68652,
      shirtColor: 0x0284c7, // Camiseta esportiva azul royal do Personal
      pantsColor: 0x0f172a, // Bermuda esportiva preta
      hairColor: 0x1e293b,
      hairStyle: 'shortHair',
    },
    { 
      name: 'Vovó Maria', 
      role: 'Vovó na Praça', 
      gender: 'female',
      phrase: 'Oi Theo Lucca! Que bênção de dia! Como você está crescendo lindo e forte!', 
      tips: [
        'Oi Theo Lucca, meu netinho de ouro! Dica da vovó: pegue as moedinhas douradas pela praça para comprar lanches gostosos na padaria!',
        'Theo Lucca, que menino inteligente! Sabia que a cada missão concluída a cidade cresce e abre novos bairros no mapa?',
        'Theo Lucca, respire fundo! Se você cansar de correr, coma uma frutinha da sua mochila para recarregar o fôlego!'
      ],
      pos: new THREE.Vector3(22, 0, 24),
      skinTone: 0xf6d8ae,
      shirtColor: 0xd8b4fe,
      pantsColor: 0x475569,
      hairColor: 0x94a3b8,
      hairStyle: 'curlyBun',
    },
    { 
      name: 'Mecânico Zeca', 
      role: 'Mecânico Chefe', 
      gender: 'male',
      phrase: 'Fala grande Theo Lucca! Bem-vindo à sua Oficina Mecânica! Dica de mecânico: aperte o botão de dirigir para pilotar os carros e motos velozes!', 
      tips: [
        'Fala grande Theo Lucca! Bem-vindo à sua Oficina Mecânica! Dica de mecânico: aperte o botão de dirigir para acelerar os carros e motos!',
        'Theo Lucca! Na oficina você ganha R$ 25 revisando os motores dos carros! É o trabalho mais legal da cidade!',
        'E aí Theo Lucca! Acelere os carros e motos usando o joystick e faça curvas iradas pelas novas avenidas!'
      ],
      pos: new THREE.Vector3(31.5, 0, -23.5),
      skinTone: 0xc68652,
      shirtColor: 0x1d4ed8, // Macacão azul industrial de mecânico
      pantsColor: 0x1e3a8a,
      hairColor: 0x1e293b,
      hairStyle: 'shortHair',
      isInsideBuilding: true,
    },
    { 
      name: 'Padeiro Seu Zé', 
      role: 'Mestre da Padaria', 
      gender: 'male',
      phrase: 'Bom dia amigão Theo Lucca! Venha ver o pão saindo do forno quentinho e crocante!', 
      tips: [
        'Bom dia amigão Theo Lucca! O pão acabou de sair do forno quentinho! Dica do padeiro: ganhe dinheiro entregando pães para a Vovó Maria!',
        'Theo Lucca! Uma boa alimentação com pão e maçã dá energia infinita para correr e pular pela cidade!',
        'Olha só Theo Lucca! O mapa de navegação mostra exatamente onde estão os trabalhos e as lojas da cidade!'
      ],
      pos: new THREE.Vector3(-42, 0, -20),
      skinTone: 0xc68652,
      shirtColor: 0xf59e0b,
      pantsColor: 0x334155,
      hairColor: 0x22130b,
      hairStyle: 'bakerHat',
      hasApron: true,
    },
    { 
      name: 'Florista Dona Rosa', 
      role: 'Cuidando das Flores', 
      gender: 'female',
      phrase: 'Oi Theo Lucca! Que lindo seu boné azul! As flores da praça adoram o seu carinho!', 
      tips: [
        'Oi Theo Lucca! Que bênção te ver! Dica de ouro: regue os canteiros de flores do parque para ganhar R$ 10!',
        'Theo Lucca, meu anjinho! Repare que as flores e árvores novas brotam sempre que a cidade se expande!',
        'Theo Lucca! Use o botão do mapa para ver todos os novos bairros que você já desbloqueou!'
      ],
      pos: new THREE.Vector3(26, 0, 20),
      skinTone: 0xf6d8ae,
      shirtColor: 0xec4899,
      pantsColor: 0x334155,
      hairColor: 0x64748b,
      hairStyle: 'curlyBun',
    },
    { 
      name: 'Marina', 
      role: 'Passeando na Praia', 
      gender: 'female',
      phrase: 'Olá Theo Lucca! O mar azul está lindo e as conchas douradas estão brilhando na praia!', 
      tips: [
        'Olá Theo Lucca! Que dia maravilhoso aqui na praia! Dica da orla: tem moedas douradas escondidas na areia perto dos quiosques!',
        'Theo Lucca! Quando você cumpre as missões, a praia se expande com píer de barcos e calçadão novo!',
        'Oi Theo Lucca! Você pode pilotar motos e carros velozes direto pela areia da praia!'
      ],
      pos: new THREE.Vector3(190, 0, -18),
      skinTone: 0xc68652,
      shirtColor: 0x06b6d4,
      pantsColor: 0xf8fafc,
      hairColor: 0x3e1f07,
      hairStyle: 'longWavy',
    },
    { 
      name: 'Policial Amigo', 
      role: 'Guarda de Trânsito', 
      gender: 'male',
      phrase: 'Parabéns Theo Lucca! Continue sempre atravessando na faixa e dirigindo com segurança!', 
      tips: [
        'Atenção cidadão Theo Lucca! Dica de trânsito: respeite as faixas de pedestre e dirija com responsabilidade para ser o campeão da cidade!',
        'Theo Lucca! A polícia da cidade informa: todos os 7 bairros da cidade estão protegidos e abertos!',
        'Grande motorista Theo Lucca! Lembre-se que você pode buzinar com a buzina fofa bi-bi nos carros!'
      ],
      pos: new THREE.Vector3(8.5, 0, 8.5),
      skinTone: 0x8d5524,
      shirtColor: 0x1e3a8a,
      pantsColor: 0x0f172a,
      hairColor: 0x1e293b,
      hairStyle: 'policeCap',
    },
    { 
      name: 'Dona Carmen', 
      role: 'Cliente do Mercado', 
      gender: 'female',
      phrase: 'Oi Theo Lucca! As maçãs do mercado estão docinhas e maravilhosas para a sua saúde!', 
      tips: [
        'Oi Theo Lucca! Dica de compras: na loja de brinquedos você pode comprar a bola de futebol para cumprir a Missão 3!',
        'Theo Lucca! O mercado central tem frutas frescas que recuperam todo o seu fôlego!',
        'Querido Theo Lucca! Veja como o minimapa no topo da tela aponta a direção do seu próximo objetivo!'
      ],
      pos: new THREE.Vector3(-20, 0, 22),
      skinTone: 0xe0ac69,
      shirtColor: 0x14b8a6,
      pantsColor: 0x334155,
      hairColor: 0x3e1f07,
      hairStyle: 'curlyBun',
    },
    { 
      name: 'Carteiro Carlos', 
      role: 'Carteiro Amigo', 
      gender: 'male',
      phrase: 'Olá Theo Lucca! As caixas de correio estão prontas para as entregas de jornal!', 
      tips: [
        'Fala Theo Lucca! Dica de entregas: colocar os jornais nas caixas de correio rende R$ 25 rapidinho!',
        'Theo Lucca! A cidade cresceu 3 vezes e agora temos muitas casas novas nos 7 bairros!',
        'E aí Theo Lucca! Pegue o carrinho veloz ou a moto para fazer as entregas voando baixo!'
      ],
      pos: new THREE.Vector3(-44, 0, -59),
      skinTone: 0xc68652,
      shirtColor: 0x0284c7,
      pantsColor: 0x1e293b,
      hairColor: 0x22130b,
      hairStyle: 'shortHair',
    },
    { 
      name: 'Pedrinho', 
      role: 'Criança no Parque', 
      gender: 'male',
      phrase: 'E aí Theo Lucca! Vamos apostar corrida pelos 7 bairros da nossa cidade gigante?', 
      tips: [
        'E aí amigão Theo Lucca! Vamos apostar corrida até o Jardim das Flores ou Vila Alegre?',
        'Theo Lucca! Seu tênis vermelho com solado branco é o mais veloz da cidade!',
        'Uau Theo Lucca! A cidade está 3 vezes maior!'
      ],
      pos: new THREE.Vector3(-24, 0, 52),
      skinTone: 0xc68652,
      shirtColor: 0x22c55e,
      pantsColor: 0x1d4ed8,
      hairColor: 0x3e1f07,
      hairStyle: 'shortHair',
      isChild: true,
    },
    { 
      name: 'Bia', 
      role: 'Amiguinha da Escola', 
      gender: 'female',
      phrase: 'Oi Theo Lucca! Seu boné azul é super estiloso! A cidade tá enorme e linda!', 
      tips: [
        'Oi Theo Lucca! Seu boné azul é super estiloso! Dica: você pode abrir a sua mochila amarela gigante a qualquer hora!',
        'Theo Lucca! Olhe o feixe de luz dourado no céu apontando onde você deve ir!',
        'Eba Theo Lucca! Já visitou todas as 5 igrejas espalhadas pela cidade?'
      ],
      pos: new THREE.Vector3(-34, 0, 52),
      skinTone: 0xf6d8ae,
      shirtColor: 0xf43f5e,
      pantsColor: 0x8b5cf6,
      hairColor: 0x22130b,
      hairStyle: 'pigtails',
      isChild: true,
    },
    { 
      name: 'Sr. João', 
      role: 'Morador do Bairro', 
      gender: 'male',
      phrase: 'Oi amigão Theo Lucca! Muito obrigado pela entrega da pizza quentinha!', 
      tips: [
        'Oi amigão Theo Lucca! Obrigado pela entrega da pizza quentinha!',
        'Theo Lucca! Explore todos os 7 bairros da nossa cidade de carro ou a pé!',
        'Parabéns Theo Lucca! Você é o orgulho do nosso bairro!'
      ],
      pos: new THREE.Vector3(-135, 0, -14),
      skinTone: 0xf6d8ae,
      shirtColor: 0x64748b,
      pantsColor: 0x1e293b,
      hairColor: 0x475569,
      hairStyle: 'fedora',
    },
    {
      name: 'Padre Antônio',
      role: 'Padre da Igreja Matriz',
      gender: 'male',
      phrase: 'A paz esteja com você, pequeno Theo Lucca! Seja sempre bondoso com todos os vizinhos!',
      tips: [
        'Que bênção receber você na Igreja Matriz, Theo Lucca! Que sua aventura pela cidade seja iluminada!',
        'Theo Lucca, você também pode visitar as outras 4 igrejas nos bairros da cidade!',
      ],
      pos: new THREE.Vector3(4.5, 0, 16),
      skinTone: 0xf6d8ae,
      shirtColor: 0x0f172a,
      pantsColor: 0x0f172a,
      hairColor: 0x94a3b8,
      hairStyle: 'shortHair',
    },
    {
      name: 'Padre Lucas',
      role: 'Padre do Jardim das Flores',
      gender: 'male',
      phrase: 'Seja bem-vindo à Igreja São Pedro no Jardim das Flores, Theo Lucca!',
      tips: [
        'Aqui no Jardim das Flores temos lindas torres gêmeas e uma biblioteca pertinho!',
        'Que Deus abençoe seus passeios de bicicleta, moto e carro pela cidade, Theo Lucca!',
      ],
      pos: new THREE.Vector3(-150, 0, -138),
      skinTone: 0xc68652,
      shirtColor: 0x1e293b,
      pantsColor: 0x0f172a,
      hairColor: 0x22130b,
      hairStyle: 'shortHair',
    },
    {
      name: 'Irmã Clara',
      role: 'Capela da Vila Alegre',
      gender: 'female',
      phrase: 'Oi Theo Lucca! Que alegria receber você na Capela da Vila Alegre aqui na Zona Sul!',
      tips: [
        'A Vila Alegre tem quadras, galeria de lojas e muitas casas bonitas!',
        'Espalhe carinho e alegria por todos os 7 bairros da cidade!',
      ],
      pos: new THREE.Vector3(90, 0, 198),
      skinTone: 0xf6d8ae,
      shirtColor: 0x475569,
      pantsColor: 0x1e293b,
      hairColor: 0x3e1f07,
      hairStyle: 'curlyBun',
    },
    {
      name: 'Policial Marcos',
      role: 'Policial da Delegacia',
      gender: 'male',
      phrase: 'Bem-vindo à Delegacia, Theo Lucca! Nossa cidade é segura e pacífica para você explorar!',
      tips: [
        'Excelente trabalho, Theo Lucca! Use sempre a faixa de pedestres e dirija com cuidado!',
        'Aqui na Delegacia cuidamos de todos os 7 bairros com nossas viaturas!',
      ],
      pos: new THREE.Vector3(45, 0, 10),
      skinTone: 0xc68652,
      shirtColor: 0x1e3a8a,
      pantsColor: 0x0f172a,
      hairColor: 0x1e293b,
      hairStyle: 'policeCap',
    },
    {
      name: 'Professora Ana',
      role: 'Professora da Escola',
      gender: 'female',
      phrase: 'Oi Theo Lucca! A Escola Municipal está sempre de portas abertas para você aprender e brincar!',
      tips: [
        'Que alegria ver você na Escola do Bairro Alto, Theo Lucca!',
        'Depois da aula você pode jogar futebol no campinho aqui perto!',
      ],
      pos: new THREE.Vector3(-90, 0, -78),
      skinTone: 0xe0ac69,
      shirtColor: 0x0284c7,
      pantsColor: 0x1e293b,
      hairColor: 0x3e1f07,
      hairStyle: 'longWavy',
    },
    {
      name: 'Dra. Camila',
      role: 'Médica do Hospital',
      gender: 'female',
      phrase: 'Oi Theo Lucca! Aqui no Hospital 24h cuidamos da saúde de toda a cidade!',
      tips: [
        'Beba bastante água e coma frutas do mercado para manter sua energia lá em cima!',
        'Nossa ambulância está pronta para ajudar em qualquer bairro!',
      ],
      pos: new THREE.Vector3(90, 0, -18),
      skinTone: 0xf6d8ae,
      shirtColor: 0xffffff,
      pantsColor: 0x38bdf8,
      hairColor: 0x1e293b,
      hairStyle: 'curlyBun',
    },
    {
      name: 'Bombeiro Rafael',
      role: 'Corpo de Bombeiros',
      gender: 'male',
      phrase: 'Olá campeão Theo Lucca! Aqui no Quartel dos Bombeiros protegemos os 7 bairros com nosso caminhão vermelho!',
      tips: [
        'Segurança em primeiro lugar, Theo Lucca! Explore toda a cidade sem medo!',
      ],
      pos: new THREE.Vector3(150, 0, -18),
      skinTone: 0xc68652,
      shirtColor: 0xdc2626,
      pantsColor: 0x1e293b,
      hairColor: 0x1e293b,
      hairStyle: 'shortHair',
    },
  ];

  const npcs: CityNPC[] = [];

  const createStylizedCitizen = (data: typeof npcsData[0]) => {
    const npcGroup = new THREE.Group();
    npcGroup.position.copy(data.pos);

    const isChild = !!data.isChild;
    const scale = isChild ? 0.72 : 1.0;
    const sGroup = new THREE.Group();
    sGroup.scale.set(scale, scale, scale);
    npcGroup.add(sGroup);

    const skinMat = new THREE.MeshStandardMaterial({ color: data.skinTone, roughness: 0.6 });
    const hairMat = new THREE.MeshStandardMaterial({ color: data.hairColor, roughness: 0.85 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: data.shirtColor, roughness: 0.65 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: data.pantsColor, roughness: 0.8 });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const glintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }); // Solado branco característico
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });

    // 1. Tronco com Camiseta / Uniforme
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.62, 0.26);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    sGroup.add(torso);

    if (data.hasApron) {
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
      apron.position.set(0, 0.9, 0.14);
      sGroup.add(apron);
    }

    // 2. Cabeça com Rosto Estilo Pixar/Theo Lucca
    const head = new THREE.Group();
    head.position.y = 1.48;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Olhos Expressivos
    for (const side of [-1, 1]) {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), eyeWhiteMat);
      eyeWhite.position.set(side * 0.075, 0.04, 0.19);
      head.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), pupilMat);
      pupil.position.set(side * 0.075, 0.04, 0.23);
      head.add(pupil);

      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), glintMat);
      glint.position.set(side * 0.075 + 0.012, 0.055, 0.25);
      head.add(glint);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.02), hairMat);
      brow.position.set(side * 0.075, 0.11, 0.2);
      head.add(brow);
    }

    // Boca com Sorriso Amigável
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.02), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
    mouth.position.set(0, -0.07, 0.2);
    head.add(mouth);

    // Cabelos & Chapéus Característicos
    if (data.hairStyle === 'bakerHat') {
      const toqueGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.35, 16);
      const toque = new THREE.Mesh(toqueGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
      toque.position.y = 0.28;
      toque.castShadow = true;
      head.add(toque);

      const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.04), hairMat);
      mustache.position.set(0, -0.04, 0.22);
      head.add(mustache);
    } else if (data.hairStyle === 'policeCap') {
      const capMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.15, 14), new THREE.MeshStandardMaterial({ color: 0x1e3a8a }));
      capMesh.position.y = 0.18;
      head.add(capMesh);
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9 }));
      badge.position.set(0, 0.18, 0.24);
      head.add(badge);
    } else if (data.hairStyle === 'pigtails') {
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 12), hairMat);
      hairBase.position.y = 0.04;
      head.add(hairBase);
      for (const side of [-1, 1]) {
        const pigtail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.32, 8), hairMat);
        pigtail.position.set(side * 0.25, 0.05, -0.05);
        pigtail.rotation.z = side * 0.5;
        head.add(pigtail);
      }
    } else if (data.hairStyle === 'curlyBun') {
      const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), hairMat);
      hairBase.position.y = 0.03;
      head.add(hairBase);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), hairMat);
      bun.position.set(0, 0.24, -0.1);
      head.add(bun);
    } else if (data.hairStyle === 'fedora') {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x78350f }));
      brim.position.y = 0.15;
      head.add(brim);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.18, 14), new THREE.MeshStandardMaterial({ color: 0x78350f }));
      crown.position.y = 0.24;
      head.add(crown);
    } else {
      const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.235, 14, 14), hairMat);
      hairMesh.position.set(0, 0.04, -0.02);
      head.add(hairMesh);
    }

    sGroup.add(head);

    // 3. Braços com Mãos
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.52, 8);
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.28, 1.2, 0);
    const lMesh = new THREE.Mesh(armGeo, shirtMat);
    lMesh.position.y = -0.26;
    lMesh.castShadow = true;
    leftArm.add(lMesh);
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    lHand.position.y = -0.52;
    leftArm.add(lHand);
    sGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.28, 1.2, 0);
    const rMesh = new THREE.Mesh(armGeo, shirtMat);
    rMesh.position.y = -0.26;
    rMesh.castShadow = true;
    rightArm.add(rMesh);
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    rHand.position.y = -0.52;
    rightArm.add(rHand);
    sGroup.add(rightArm);

    // 4. Pernas com Calça e Tênis com Solado Branco (igual Theo!)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.58, 8);
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.12, 0.62, 0);
    const legLMesh = new THREE.Mesh(legGeo, pantsMat);
    legLMesh.position.y = -0.29;
    legLMesh.castShadow = true;
    leftLeg.add(legLMesh);

    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), shoeMat);
    shoeL.position.set(0, -0.58, 0.04);
    const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.29), soleMat);
    soleL.position.set(0, -0.62, 0.04);
    leftLeg.add(shoeL);
    leftLeg.add(soleL);
    sGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.12, 0.62, 0);
    const legRMesh = new THREE.Mesh(legGeo, pantsMat);
    legRMesh.position.y = -0.29;
    legRMesh.castShadow = true;
    rightLeg.add(legRMesh);

    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.28), shoeMat);
    shoeR.position.set(0, -0.58, 0.04);
    const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.29), soleMat);
    soleR.position.set(0, -0.62, 0.04);
    rightLeg.add(shoeR);
    rightLeg.add(soleR);
    sGroup.add(rightLeg);

    scene.add(npcGroup);

    return { group: npcGroup, head, leftArm, rightArm, leftLeg, rightLeg };
  };

  const npcWaypointsMap: Record<string, { waypoints: THREE.Vector3[]; speed: number }> = {
    'Personal Inho': {
      waypoints: [new THREE.Vector3(14, 0, 36), new THREE.Vector3(26, 0, 36), new THREE.Vector3(26, 0, 18), new THREE.Vector3(14, 0, 18)],
      speed: 2.1,
    },
    'Vovó Maria': {
      waypoints: [new THREE.Vector3(22, 0, 24), new THREE.Vector3(26, 0, 30), new THREE.Vector3(16, 0, 32), new THREE.Vector3(14, 0, 20), new THREE.Vector3(20, 0, 16)],
      speed: 1.15,
    },
    'Mecânico Zeca': {
      waypoints: [new THREE.Vector3(31.5, 0, -23.5), new THREE.Vector3(34.5, 0, -26), new THREE.Vector3(28.5, 0, -26), new THREE.Vector3(28.5, 0, -21)],
      speed: 1.25,
    },
    'Padeiro Seu Zé': {
      waypoints: [new THREE.Vector3(-42, 0, -20), new THREE.Vector3(-42, 0, -32), new THREE.Vector3(-36, 0, -32), new THREE.Vector3(-36, 0, -20)],
      speed: 1.3,
    },
    'Florista Dona Rosa': {
      waypoints: [new THREE.Vector3(26, 0, 20), new THREE.Vector3(34, 0, 26), new THREE.Vector3(34, 0, 14), new THREE.Vector3(24, 0, 12)],
      speed: 1.2,
    },
    'Marina': {
      waypoints: [new THREE.Vector3(190, 0, -18), new THREE.Vector3(190, 0, -68), new THREE.Vector3(190, 0, 35), new THREE.Vector3(190, 0, 80)],
      speed: 1.45,
    },
    'Policial Amigo': {
      waypoints: [new THREE.Vector3(8.5, 0, 8.5), new THREE.Vector3(8.5, 0, 28), new THREE.Vector3(-8.5, 0, 28), new THREE.Vector3(-8.5, 0, 8.5)],
      speed: 1.4,
    },
    'Dona Carmen': {
      waypoints: [new THREE.Vector3(-20, 0, 22), new THREE.Vector3(-20, 0, 38), new THREE.Vector3(-32, 0, 38), new THREE.Vector3(-32, 0, 22)],
      speed: 1.3,
    },
    'Carteiro Carlos': {
      waypoints: [new THREE.Vector3(-44, 0, -59), new THREE.Vector3(-20, 0, -59), new THREE.Vector3(-20, 0, -48), new THREE.Vector3(-44, 0, -48)],
      speed: 1.6,
    },
    'Pedrinho': {
      waypoints: [new THREE.Vector3(-24, 0, 52), new THREE.Vector3(-14, 0, 56), new THREE.Vector3(-10, 0, 44), new THREE.Vector3(-26, 0, 44)],
      speed: 1.85,
    },
    'Bia': {
      waypoints: [new THREE.Vector3(-34, 0, 52), new THREE.Vector3(-28, 0, 54), new THREE.Vector3(-26, 0, 46), new THREE.Vector3(-38, 0, 46)],
      speed: 1.75,
    },
    'Sr. João': {
      waypoints: [new THREE.Vector3(-135, 0, -14), new THREE.Vector3(-110, 0, -14), new THREE.Vector3(-110, 0, -35), new THREE.Vector3(-135, 0, -35)],
      speed: 1.25,
    },
  };

  npcsData.forEach((data) => {
    const { group, head, leftArm, rightArm, leftLeg, rightLeg } = createStylizedCitizen(data);
    const config = npcWaypointsMap[data.name] || {
      waypoints: [
        data.pos.clone(),
        data.pos.clone().add(new THREE.Vector3(7, 0, 0)),
        data.pos.clone().add(new THREE.Vector3(7, 0, 7)),
        data.pos.clone().add(new THREE.Vector3(0, 0, 7)),
      ],
      speed: 1.3,
    };

    npcs.push({
      group,
      name: data.name,
      role: data.role,
      phrase: data.phrase,
      gender: data.gender,
      tips: data.tips,
      position: data.pos.clone(),
      walkTimer: Math.random() * 5,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      isWaving: false,
      isInsideBuilding: data.isInsideBuilding,
      waypoints: config.waypoints,
      waypointIndex: 0,
      walkSpeed: config.speed,
      pauseTimer: Math.random() * 1.5,
    });
  });

  // --- 42 MOEDINHAS DOURADAS BRILHANTES PELOS 7 BAIRROS ---
  const coins: StreetCoin[] = [];
  const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 16);
  coinGeo.rotateZ(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0xd97706,
    emissiveIntensity: 0.45,
  });

  const coinCoords = [
    [0, -18], [0, 18], [0, 38], [0, -38],
    [-14, 0], [14, 0], [-38, 0], [38, 0],
    [-20, -20], [-20, -28],
    [-42, -20], [-42, -28],
    [-20, 30], [-20, 24],
    [-45, 30], [-45, 24],
    [28, -24], [28, -30],
    [30, 24], [34, 30], [26, 32],
    [-38, -60], [-48, -60],
    [90, -72], [90, -110], [150, -60], [150, 0],
    [-90, -22], [-150, -135], [-210, -135], [-210, -30],
    [-90, 140], [-30, 140], [30, 200], [90, 198], [150, 195],
    [192, -60], [192, 0], [192, 60], [0, -180], [0, 180], [120, 0],
  ];

  coinCoords.forEach(([cx, cz], i) => {
    const mesh = new THREE.Mesh(coinGeo, coinMat);
    mesh.position.set(cx, 0.45, cz);
    mesh.castShadow = true;
    scene.add(mesh);

    coins.push({
      mesh,
      position: mesh.position,
      value: i % 3 === 0 ? 2 : 1,
      collected: false,
    });
  });

  // --- BEACON VERTICAL INDICADOR DE OBJETIVO ---
  const beaconGroup = new THREE.Group();
  const beaconCylGeo = new THREE.CylinderGeometry(0.5, 0.5, 50, 16);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.45,
  });
  const beaconCyl = new THREE.Mesh(beaconCylGeo, beaconMat);
  beaconCyl.position.y = 25;
  beaconGroup.add(beaconCyl);
  scene.add(beaconGroup);

  const setBeaconPosition = (pos: THREE.Vector3 | null) => {
    if (!pos) {
      beaconGroup.visible = false;
    } else {
      beaconGroup.visible = true;
      beaconGroup.position.set(pos.x, 0, pos.z);
    }
  };

  // =========================================================================
  // --- TODOS OS 7 BAIRROS ABERTOS DESDE O INÍCIO + MARINA + ESTÁDIO + ARCO ---
  // =========================================================================
  let currentExpansionLevel = 7;

  // Estádio / Campinho de Futebol & Quadra de Basquete no Bairro Alto (-90, 26) & (-150, 26)
  const stadiumGroup = new THREE.Group();
  scene.add(stadiumGroup);

  const pitchGeo = new THREE.PlaneGeometry(34, 22);
  pitchGeo.rotateX(-Math.PI / 2);
  const pitch = new THREE.Mesh(pitchGeo, new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }));
  pitch.position.set(-90, 0.025, 24);
  pitch.receiveShadow = true;
  stadiumGroup.add(pitch);

  const fieldBorder = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.25), whitePaintMat);
  fieldBorder.rotateX(-Math.PI / 2);
  fieldBorder.position.set(-90, 0.032, 14);
  stadiumGroup.add(fieldBorder);
  const fieldBorder2 = fieldBorder.clone();
  fieldBorder2.position.set(-90, 0.032, 34);
  stadiumGroup.add(fieldBorder2);

  for (const side of [-1, 1]) {
    const goalX = -90 + side * 15.5;
    const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5, 8), postMat);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(goalX, 2.2, 24);
    stadiumGroup.add(crossbar);

    for (const postZ of [-2.5, 2.5]) {
      const vPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), postMat);
      vPost.position.set(goalX, 1.1, 24 + postZ);
      stadiumGroup.add(vPost);
    }
  }

  const bleachers = new THREE.Mesh(
    new THREE.BoxGeometry(30, 3.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
  );
  bleachers.position.set(-90, 1.6, 38);
  bleachers.castShadow = true;
  stadiumGroup.add(bleachers);
  boxColliders.push({ minX: -105, maxX: -75, minZ: 35.8, maxZ: 40.2, name: 'Estádio Arquibancada' });

  // Quadra de Basquete ao lado do Campinho no Bairro Alto (-150, 26)
  const bCourt = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.08, 15),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 })
  );
  bCourt.position.set(-150, 0.04, 26);
  bCourt.receiveShadow = true;
  stadiumGroup.add(bCourt);
  for (const s of [-1, 1]) {
    const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.8, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    hp.position.set(-150 + s * 10.5, 1.9, 26);
    stadiumGroup.add(hp);
    const bd = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 2.0), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    bd.position.set(-150 + s * 10.0, 3.6, 26);
    stadiumGroup.add(bd);
  }

  // Orla Marítima Expandida (X = 191..295): Píer de madeira avançando no Mar, Iate & Quiosques de Praia
  const marinaGroup = new THREE.Group();
  scene.add(marinaGroup);

  const pierMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const pier = new THREE.Mesh(new THREE.BoxGeometry(44, 0.6, 9), pierMat);
  pier.position.set(224, 0.45, -24);
  pier.castShadow = true;
  pier.receiveShadow = true;
  marinaGroup.add(pier);

  for (let pil = 0; pil < 7; pil++) {
    const pilX = 206 + pil * 5.8;
    for (const pilZ of [-27.5, -20.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 8), pierMat);
      post.position.set(pilX, -0.6, pilZ);
      marinaGroup.add(post);
    }
  }

  const yachtGroup = new THREE.Group();
  yachtGroup.position.set(248, 0.2, -44);
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(16, 2.0, 6.0),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 })
  );
  hull.position.y = 0.5;
  hull.castShadow = true;
  yachtGroup.add(hull);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 2.4, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.6 })
  );
  cabin.position.set(-1, 2.2, 0);
  yachtGroup.add(cabin);
  marinaGroup.add(yachtGroup);

  for (let k = 0; k < 5; k++) {
    const kZ = -120 + k * 60;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 2.8, 12), new THREE.MeshStandardMaterial({ color: 0xffedd5 }));
    base.position.set(202, 1.4, kZ);
    base.castShadow = true;
    marinaGroup.add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
    roof.position.set(202, 3.4, kZ);
    marinaGroup.add(roof);
  }

  // Grande Arco Dourado Theo Lucca na Av. Central Norte
  const archMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.25 });
  const archLeft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 13, 2.2), archMat);
  archLeft.position.set(-8.5, 6.5, -62);
  scene.add(archLeft);
  const archRight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 13, 2.2), archMat);
  archRight.position.set(8.5, 6.5, -62);
  scene.add(archRight);
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(19.5, 2.6, 2.6), archMat);
  archTop.position.set(0, 13, -62);
  scene.add(archTop);

  // Pontos interativos adicionais nos bairros
  locations.push({
    id: 'estadio_bairro_alto',
    name: 'Campinho & Quadras Bairro Alto',
    category: 'landmark',
    position: new THREE.Vector3(-90, 0, 14),
    markerMesh: new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), yellowPaintMat),
    label: 'Estádio Bairro Alto',
    radius: 4.5,
    isInside: false,
  });

  locations.push({
    id: 'pier_marina',
    name: 'Píer & Orla da Praia',
    category: 'landmark',
    position: new THREE.Vector3(204, 0, -24),
    markerMesh: new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), yellowPaintMat),
    label: 'Píer da Praia',
    radius: 4.5,
    isInside: false,
  });

  const expandCity = (newLevel: number) => {
    currentExpansionLevel = Math.max(currentExpansionLevel, Math.min(7, newLevel));

    const districtNames = [
      '',
      'Centro Histórico & Praça Central',
      'Bairro Alto & Complexo Escolar',
      'Bairro Baixo & Comércio Local',
      'Praia / Orla Marítima & Píer',
      'Bairro Novo, Shopping & Hospital',
      'Jardim das Flores & Igreja São Pedro',
      'Vila Alegre Sul & Cidade Gigante 3x',
    ];

    const districtDescs = [
      '',
      'Centro com Igreja Matriz, Delegacia e Prefeitura!',
      'Bairro Alto com Igreja Branca, Escola, Creche e Estádio!',
      'Bairro Baixo com Igrejinha Colorida, Mercadinho e Lan House!',
      'Praia com Calçadão, Quiosques, Píer e Hotel Beira-Mar!',
      'Bairro Novo com Shopping Center, Hospital, Bombeiros e Torres!',
      'Jardim das Flores com Igreja São Pedro, Biblioteca e Supermercado!',
      'Vila Alegre Sul com Capela, Galeria Sul, Parque e Torres!',
    ];

    return {
      name: districtNames[currentExpansionLevel] || 'Nova Expansão',
      desc: districtDescs[currentExpansionLevel] || 'Novo bairro liberado para explorar!',
      unlockedFeatures: [
        'Novas avenidas liberadas no mapa',
        'Novas moedas douradas espalhadas',
        'Novos veículos e pontos turísticos',
      ],
    };
  };

  // --- ATUALIZAÇÃO DA CIDADE REALISTA ---
  const updateCity = (timeSec: number, delta: number, theoPos: THREE.Vector3) => {
    // 1. Semáforos funcionais
    trafficLights.forEach((tl, i) => {
      tl.timer += delta;
      const offset = (i % 2) * 12;
      const cycleTime = (tl.timer + offset) % 25;

      if (cycleTime < 11) {
        tl.state = 'green';
        (tl.greenMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4;
        (tl.yellowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        (tl.redMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
      } else if (cycleTime < 14) {
        tl.state = 'yellow';
        (tl.greenMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        (tl.yellowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4;
        (tl.redMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
      } else {
        tl.state = 'red';
        (tl.greenMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        (tl.yellowMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        (tl.redMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4;
      }
    });

    // 2. Movimentação dos carros por waypoints contínuos (se Theo estiver dirigindo, o controle é do jogador)
    cars.forEach((car) => {
      if (car.hasTheoPassenger) return; // Theo está dirigindo!

      const targetWp = car.waypoints[car.currentWpIndex];
      const curPos = car.group.position;

      const dx = targetWp.x - curPos.x;
      const dz = targetWp.z - curPos.z;
      const distToWp = Math.hypot(dx, dz);

      if (distToWp < 4.2) {
        car.currentWpIndex = (car.currentWpIndex + 1) % car.waypoints.length;
      }

      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - car.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      car.rotationY += angleDiff * Math.min(1, 3.6 * delta);

      // Verificação de Semáforo
      let mustStopAtLight = false;
      for (const tl of trafficLights) {
        const dLight = Math.hypot(curPos.x - tl.position.x, curPos.z - tl.position.z);
        if (dLight < 9.5 && (tl.state === 'red' || tl.state === 'yellow')) {
          mustStopAtLight = true;
          break;
        }
      }

      // Detecção de Theo Lucca na frente
      const distToTheo = Math.hypot(curPos.x - theoPos.x, curPos.z - theoPos.z);
      const isTheoInFront = distToTheo < 7.2;

      if (isTheoInFront) {
        car.speed = Math.max(0, car.speed - 14 * delta);
        car.stoppedByPedestrian = true;

        car.honkCooldown -= delta;
        if (car.honkCooldown <= 0) {
          soundManager.playCuteHorn();
          car.honkCooldown = 3.5;
        }
      } else if (mustStopAtLight) {
        car.speed = Math.max(0, car.speed - 10 * delta);
        car.stoppedByRedLight = true;
      } else {
        car.speed = Math.min(car.maxSpeed, car.speed + 5 * delta);
        car.stoppedByPedestrian = false;
        car.stoppedByRedLight = false;
      }

      curPos.x += Math.sin(car.rotationY) * car.speed * delta;
      curPos.z += Math.cos(car.rotationY) * car.speed * delta;
      car.group.rotation.y = car.rotationY;

      // LOD: só gira as rodas se o carro estiver próximo da câmera
      if (distToTheo < 45) {
        for (const w of car.wheels) {
          w.rotation.x += car.speed * delta * 2.8;
        }
      }
    });

    // 2.1 Movimentação das Motos em trânsito
    motos.forEach((moto) => {
      if (moto.isParked || moto.hasTheoPassenger) return;

      if (!moto.waypoints || moto.waypoints.length === 0) return;
      const targetWp = moto.waypoints[moto.currentWpIndex];
      const curPos = moto.group.position;

      const dx = targetWp.x - curPos.x;
      const dz = targetWp.z - curPos.z;
      const distToWp = Math.hypot(dx, dz);

      if (distToWp < 3.8) {
        moto.currentWpIndex = (moto.currentWpIndex + 1) % moto.waypoints.length;
      }

      const targetAngle = Math.atan2(dx, dz);
      let angleDiff = targetAngle - moto.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      moto.rotationY += angleDiff * Math.min(1, 4.2 * delta);

      // Semáforo para motos
      let mustStop = false;
      for (const tl of trafficLights) {
        const dLight = Math.hypot(curPos.x - tl.position.x, curPos.z - tl.position.z);
        if (dLight < 9.0 && (tl.state === 'red' || tl.state === 'yellow')) {
          mustStop = true;
          break;
        }
      }

      const distToTheo = Math.hypot(curPos.x - theoPos.x, curPos.z - theoPos.z);
      if (distToTheo < 6.0) {
        moto.speed = Math.max(0, moto.speed - 16 * delta);
      } else if (mustStop) {
        moto.speed = Math.max(0, moto.speed - 12 * delta);
      } else {
        moto.speed = Math.min(moto.maxSpeed, moto.speed + 6 * delta);
      }

      curPos.x += Math.sin(moto.rotationY) * moto.speed * delta;
      curPos.z += Math.cos(moto.rotationY) * moto.speed * delta;
      moto.group.rotation.y = moto.rotationY;

      // LOD: só gira as rodas se a moto estiver próxima da câmera
      if (distToTheo < 45) {
        for (const w of moto.wheels) {
          w.rotation.x += moto.speed * delta * 3.2;
        }
      }
    });

    // 3. Atualização dos NPCs: Caminhada Livre pelas Ruas, Calçadas e Praças da Cidade
    for (const npc of npcs) {
      const curPos = npc.group.position;
      const distToTheo = curPos.distanceTo(theoPos);

      if (distToTheo < 4.8) {
        // PERTO DO THEO LUCCA: Pausa e vira para cumprimentar Theo Lucca com aceno alegre
        npc.isWaving = true;
        const lookDir = Math.atan2(theoPos.x - curPos.x, theoPos.z - curPos.z);
        let angleDiff = lookDir - npc.group.rotation.y;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        npc.group.rotation.y += angleDiff * Math.min(1.0, delta * 5.0);

        npc.rightArm.rotation.x = -2.2;
        npc.rightArm.rotation.z = Math.sin(timeSec * 9) * 0.35;
        npc.leftArm.rotation.x = 0;
        npc.leftLeg.rotation.x = 0;
        npc.rightLeg.rotation.x = 0;
      } else {
        // ANDANDO LIVREMENTE PELA CIDADE
        npc.isWaving = false;

        // Se estiver em pausa breve apreciando a cidade
        if (npc.pauseTimer > 0) {
          npc.pauseTimer -= delta;
          if (distToTheo < 40) {
            npc.leftArm.rotation.x = Math.sin(timeSec * 2) * 0.05;
            npc.rightArm.rotation.x = -Math.sin(timeSec * 2) * 0.05;
            npc.rightArm.rotation.z = 0;
            npc.leftLeg.rotation.x = 0;
            npc.rightLeg.rotation.x = 0;
          }
        } else if (npc.waypoints && npc.waypoints.length > 0) {
          const targetWp = npc.waypoints[npc.waypointIndex];
          const dx = targetWp.x - curPos.x;
          const dz = targetWp.z - curPos.z;
          const distToWp = Math.hypot(dx, dz);

          if (distToWp < 0.9) {
            // Chegou no waypoint! Avança para o próximo ponto
            npc.waypointIndex = (npc.waypointIndex + 1) % npc.waypoints.length;
            // 35% de chance de pausar brevemente olhando ao redor
            if (Math.random() < 0.35) {
              npc.pauseTimer = 1.6 + Math.random() * 2.4;
            }
          } else {
            // Rotação suave na direção do próximo waypoint
            const targetAngle = Math.atan2(dx, dz);
            let angleDiff = targetAngle - npc.group.rotation.y;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            npc.group.rotation.y += angleDiff * Math.min(1.0, delta * 5.5);

            // Deslocamento real do pedestre para frente
            const step = npc.walkSpeed * delta;
            curPos.x += Math.sin(npc.group.rotation.y) * step;
            curPos.z += Math.cos(npc.group.rotation.y) * step;
            npc.position.copy(curPos);

            // LOD: Animação de braços e pernas somente para pedestres visíveis perto da câmera
            if (distToTheo < 40) {
              npc.walkTimer += delta * (npc.walkSpeed * 3.6);
              const walkCycle = Math.sin(npc.walkTimer);
              npc.leftArm.rotation.x = walkCycle * 0.5;
              npc.rightArm.rotation.x = -walkCycle * 0.5;
              npc.rightArm.rotation.z = 0;
              npc.leftLeg.rotation.x = -walkCycle * 0.55;
              npc.rightLeg.rotation.x = walkCycle * 0.55;
            }
          }
        }
      }
    }

    // 4. Animação das Moedas
    for (const c of coins) {
      if (!c.collected) {
        c.mesh.rotation.y += delta * 2.6;
        c.mesh.position.y = 0.45 + Math.sin(timeSec * 4 + c.position.x) * 0.08;
      }
    }

    // 5. Ondas suaves da praia e borbulhar da água
    waterMesh.position.y = 0.03 + Math.sin(timeSec * 1.5) * 0.04;

    // 6. Movimento das nuvens no céu
    for (const cl of clouds) {
      cl.position.x += delta * 1.2;
      if (cl.position.x > 260) {
        cl.position.x = -280;
      }
    }

    // 7. Atualiza luzes dinâmicas compartilhadas (poste + interior + faróis SpotLight do carro ativo)
    if (isStreetNightOn) {
      let nearestLamp = streetLamps[0];
      let minLampDistSq = Infinity;
      for (const lamp of streetLamps) {
        const dx = lamp.position.x - theoPos.x;
        const dz = lamp.position.z - theoPos.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < minLampDistSq) {
          minLampDistSq = dSq;
          nearestLamp = lamp;
        }
      }
      if (nearestLamp) {
        streetPoolLight.position.copy(nearestLamp.position);
      }

      const activeCar = cars.find((c) => c.hasTheoPassenger) || cars[0];
      if (activeCar) {
        const sinY = Math.sin(activeCar.rotationY);
        const cosY = Math.cos(activeCar.rotationY);
        const rightX = cosY;
        const rightZ = -sinY;
        const cp = activeCar.group.position;

        activeCarSpotL.position.set(cp.x + sinY * 2.3 - rightX * 0.82, 0.85, cp.z + cosY * 2.3 - rightZ * 0.82);
        activeCarSpotTargetL.position.set(cp.x + sinY * 18 - rightX * 0.8, 0, cp.z + cosY * 18 - rightZ * 0.8);

        activeCarSpotR.position.set(cp.x + sinY * 2.3 + rightX * 0.82, 0.85, cp.z + cosY * 2.3 + rightZ * 0.82);
        activeCarSpotTargetR.position.set(cp.x + sinY * 18 + rightX * 0.8, 0, cp.z + cosY * 18 + rightZ * 0.8);

        activeCarSpotL.intensity = 3.2;
        activeCarSpotR.intensity = 3.2;
      }
    } else {
      activeCarSpotL.intensity = 0;
      activeCarSpotR.intensity = 0;
    }

    // Luz interior compartilhada segue a loja mais próxima
    let nearestShopPos: THREE.Vector3 | null = null;
    let minShopDistSq = 28 * 28;
    for (const loc of locations) {
      if (loc.category === 'shop' || loc.category === 'job') {
        const dx = loc.position.x - theoPos.x;
        const dz = loc.position.z - theoPos.z;
        const dSq = dx * dx + dz * dz;
        if (dSq < minShopDistSq) {
          minShopDistSq = dSq;
          nearestShopPos = loc.position;
        }
      }
    }
    if (nearestShopPos) {
      interiorPoolLight.position.set(nearestShopPos.x, 5.2, nearestShopPos.z);
      interiorPoolLight.intensity = 1.5;
    } else {
      interiorPoolLight.intensity = 0;
    }
  };

  return {
    scene,
    trafficLights,
    cars,
    motos,
    motorcycles: motos,
    npcs,
    coins,
    locations,
    colliders: {
      boxes: boxColliders,
      circles: circleColliders,
    },
    sunLight,
    skyLight,
    waterMesh,
    flowerBeds,
    mailboxes,
    customerHouses,
    beaconGroup,
    setBeaconPosition,
    updateCity,
    expansionLevel: currentExpansionLevel,
    expandCity,
    streetLamps,
    setStreetLights,
    setCameraDistanceLOD,
  };
}
