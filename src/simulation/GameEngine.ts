import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { 
  createTheoLuccaModel, 
  TheoLuccaRig, 
  CharacterCustomization, 
  DEFAULT_CHARACTER_CUSTOMIZATION 
} from './TheoLuccaModel';
import { createCityScene, CitySceneObjects, CityCar, CityMoto, CityNPC } from './CityScene';
import { soundManager } from './audio';
import { PhasesManager } from './PhasesManager';
import { cityVoiceManager } from './voiceManager';
import { economyManager } from './EconomyManager';
import { BuildingManager } from './BuildingManager';
import { PlayerWallet, InventoryItem } from '../types/economy';
import { WeatherManager, WeatherType, WeatherStateInfo, DayCycleLighting } from './WeatherManager';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export interface BackpackItem {
  id: string;
  name: string;
  category: 'brinquedo' | 'comida' | 'roupa';
  price: number;
  icon: string;
  description: string;
}

export interface ActiveJob {
  id: string;
  name: string;
  reward: number;
  step: number;
  maxSteps: number;
  stepDesc: string;
  targetPos: THREE.Vector3;
  targetName: string;
  propType: 'none' | 'pizza' | 'wateringCan' | 'newspaper' | 'ball' | 'wrench';
}

export interface MainMission {
  id: number;
  title: string;
  description: string;
  reward: number;
  progress: number;
  total: number;
  completed: boolean;
}

export interface CityHUDState {
  money: number;
  stamina: number;
  isExhausted: boolean;
  coinsCollected: number;
  totalCoins: number;
  backpack: BackpackItem[];
  activeJob: ActiveJob | null;
  currentMission: MainMission;
  nearestLocation: { name: string; category: string; label: string; dist: number } | null;
  nearestNPC: { name: string; role: string; phrase: string; dist: number } | null;
  nearestCar: { name: string; dist: number } | null;
  nearestMoto?: { name: string; dist: number } | null;
  isInCar: boolean;
  isDrivingMoto?: boolean;
  carName: string;
  vehicleSpeed?: number;
  dialogueText: string | null;
  distanceToTarget: number;
  // Fases e Tubo de Luz
  currentPhase: 1 | 2 | 3;
  phaseName: string;
  lightTubeActive: boolean;
  lightTubeDist: number;
  phaseTargetCount: number;
  phaseTargetTotal: number;
  // Expansão Dinâmica da Cidade & Mini-mapa de Navegação GPS
  cityExpansionLevel: number;
  playerX: number;
  playerZ: number;
  playerRotationY: number;
  targetBeaconPos: { x: number; z: number; name?: string } | null;
  allLocations: { id: string; name: string; category: string; x: number; z: number }[];
  allNPCs: { name: string; role: string; gender: 'male' | 'female'; x: number; z: number }[];
  allCars: { x: number; z: number; colorName: string }[];
  allMotos: { x: number; z: number; colorName: string }[];
  expansionAnnouncement?: { name: string; desc: string } | null;
  performanceMode: 'baixo' | 'medio' | 'alto' | 'light' | 'normal';
  graphicQuality: 'baixo' | 'medio' | 'alto';
  isCarDented?: boolean;
  cameraZoom?: number;
  cameraPreset?: 'city' | 'district' | 'street' | 'third_person';
  isCameraPanned?: boolean;
  dayCycleDurationSeconds?: number;
  characterCustomization: CharacterCustomization;
  characterName: string;
  // Sistema Completo de Economia & Construção
  wallet: PlayerWallet;
  isBuildModeActive: boolean;
  buildModeItem: InventoryItem | null;
  isBuildPlacementValid: boolean;
  nearestPlacedBuildingName?: string | null;
  // Sistema de Clima Dinâmico (Ensolarado, Nublado, Chuvoso)
  weather: WeatherStateInfo;
}

export interface GameEngineCallbacks {
  onHUDUpdate: (state: CityHUDState) => void;
  onCoinCollected: (val: number, newTotal: number) => void;
  onJobCompleted: (jobName: string, reward: number) => void;
  onMissionCompleted: (missionTitle: string, reward: number) => void;
  onItemPurchased: (item: BackpackItem) => void;
  onCityExpanded?: (districtName: string, desc: string) => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private callbacks: GameEngineCallbacks;

  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private pmrem!: THREE.PMREMGenerator;

  private cityScene!: CitySceneObjects;
  private player!: TheoLuccaRig;

  // Estados de física e controle
  private playerPos = new THREE.Vector3(-14, 0, -14);
  private playerVelocity = new THREE.Vector3(0, 0, 0);
  private playerRotationY = Math.PI * 0.75;
  private isGrounded = true;

  private currentStamina = 100;
  private maxStamina = 100;
  private isExhausted = false;
  private isRunningInput = false;

  private moveInput = new THREE.Vector2(0, 0);
  private cameraAngles = { yaw: Math.PI * 0.78, pitch: 1.12 };

  // Sistema de Dinheiro & Inventário
  private money = 3.00;
  private coinsCollected = 0;
  private backpack: BackpackItem[] = [];

  // Sistema de Trabalhos
  private activeJob: ActiveJob | null = null;
  private pizzaDeliveriesCount = 0;
  private jobsFinishedCount = 0;

  // 5 Missões Principais da Cidade Aberta
  private missions: MainMission[] = [
    { id: 1, title: 'Missão 1: Fale com o Padre', description: 'Vá até a Igreja Matriz no Centro e fale com o Padre Antônio!', reward: 20, progress: 0, total: 1, completed: false },
    { id: 2, title: 'Missão 2: Fale com o Policial', description: 'Vá à Delegacia de Polícia e converse com o Policial Marcos!', reward: 25, progress: 0, total: 1, completed: false },
    { id: 3, title: 'Missão 3: Compras no Mercado', description: 'Visite o Mercadinho/Supermercado ou compre um item na Loja!', reward: 30, progress: 0, total: 1, completed: false },
    { id: 4, title: 'Missão 4: Passeio no Shopping', description: 'Explore o Shopping Center luminoso no Bairro Novo!', reward: 40, progress: 0, total: 1, completed: false },
    { id: 5, title: 'Missão 5: Explorador da Cidade', description: 'Colete 8 moedinhas douradas pelos bairros!', reward: 60, progress: 0, total: 8, completed: false },
  ];
  private currentMissionIndex = 0;

  // Sistema de Direção de Carros e Motos (GTA Infantil)
  private isInCar = false;
  private currentPassengerCar: CityCar | null = null;
  private currentMotorcycle: CityMoto | null = null;
  private isDrivingMoto = false;
  private vehicleSpeed = 0;
  private engineRevTimer = 0;

  // Sistema de Fases e Tubo de Luz
  private phasesManager!: PhasesManager;
  private currentPhase: 1 | 2 | 3 = 1;
  private collectedDiamonds = 0;
  private totalDiamonds = 8;
  private collectedAvaritia = 0;
  private totalAvaritia = 8;
  private teleportCooldown = 0;

  // Sistema de Construção e Prédios do Jogador
  private buildingManager!: BuildingManager;

  // Sistema de Clima Dinâmico & Ciclo Dia/Noite Gradual
  private weatherManager!: WeatherManager;
  private dayTimeHours = 10.0; // Inicia às 10:00 da manhã
  private targetDayTimeHours: number | null = null;
  private fullDayCycleSeconds = 720; // Ciclo completo de 24h a cada 12 minutos (dia e noite bem mais longos)
  private lastDayPhase: 'dawn' | 'day' | 'sunset' | 'night' = 'day';
  private dayCycleLighting: DayCycleLighting = {
    skyColor: new THREE.Color(0x60a5fa),
    fogColor: new THREE.Color(0x93c5fd),
    fogDensity: 0.0052,
    sunColor: new THREE.Color(0xfff8ea),
    sunIntensity: 2.75,
    skyLightColor: new THREE.Color(0xfffbeb),
    groundLightColor: new THREE.Color(0x0284c7),
    skyLightIntensity: 1.15,
    cloudTint: new THREE.Color(0xffffff),
    isNight: false,
  };
  private dayCycleExposure = 1.15;

  // Sistema de Expansão Dinâmica da Cidade (Todos os 7 Bairros conectados desde o início)
  private cityExpansionLevel = 7;
  private expansionAnnouncement: { name: string; desc: string } | null = null;
  private customGPSDestination: { x: number; z: number; name: string } | null = null;

  // Interação e Acenar
  private waveTimer = 0;
  private dialogueText: string | null = null;
  private dialogueTimer = 0;

  // Personalização do Personagem (Nome, Roupas, Boné, Sapatos, Mochila, Cabelo, etc.)
  private characterCustomization: CharacterCustomization = { ...DEFAULT_CHARACTER_CUSTOMIZATION };

  // Modo de Desempenho (BAIXO 60 FPS / MÉDIO Balanceado / ALTO Ultra Godot/GTA)
  private performanceMode: 'baixo' | 'medio' | 'alto' = 'baixo';

  // Sistema de Câmera Livre & Zoom (Começa bem no alto vendo a Cidade Gigante 3x com 7 Bairros de cima)
  private cameraZoom = 96.0;
  private cameraPreset: 'city' | 'district' | 'street' | 'third_person' = 'city';
  private targetCameraZoom: number | null = null;
  private targetAerialPitch: number | null = null;
  private targetCameraYaw: number | null = null;
  private cameraPanOffset = new THREE.Vector3(14, 0, 14);
  private targetCameraPanOffset: THREE.Vector3 | null = null;
  private cameraShake = 0;
  private touchPinchStartDist = 0;
  private initialPinchZoom = 96.0;
  private touchPinchLastMid: { x: number; y: number } | null = null;

  // Loop & mobile/software GL guard
  private isMobileDevice = false;
  private isSoftwareGl = false;
  private frameId = 0;
  private isDestroyed = false;
  private isPaused = false;
  private lastTime = 0;
  private stepTimer = 0;
  private hudThrottleTimer = 0;
  private resizeObserver: ResizeObserver | null = null;

  private keysPressed: Record<string, boolean> = {};

  constructor(container: HTMLDivElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.init();
  }

  private init() {
    const width = Math.max(1, this.container.clientWidth || window.innerWidth || 1280);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight || 720);

    // Carrega personalização salva do personagem (nome, roupas, boné, sapatos, mochila, cabelo)
    try {
      const savedCustom = safeGetItem('theo_lucca_customization');
      if (savedCustom) {
        this.characterCustomization = { ...DEFAULT_CHARACTER_CUSTOMIZATION, ...JSON.parse(savedCustom) };
      }
    } catch {
      // ignore
    }

    this.isMobileDevice =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|Mobile|wv/i.test(navigator.userAgent || '');

    // Preferência de qualidade gráfica: padrão 'baixo' garante 60 FPS sólido em celulares Android e computadores básicos
    const savedPerf = safeGetItem('theo_lucca_perf_mode');
    if (savedPerf === 'baixo' || savedPerf === 'medio' || savedPerf === 'alto') {
      this.performanceMode = savedPerf;
    } else if (savedPerf === 'light') {
      this.performanceMode = 'baixo';
    } else if (savedPerf === 'normal') {
      this.performanceMode = 'alto';
    } else {
      this.performanceMode = 'baixo';
    }

    const savedCycleSec = Number(safeGetItem('theo_lucca_day_cycle_sec'));
    if (Number.isFinite(savedCycleSec) && savedCycleSec >= 120 && savedCycleSec <= 3600) {
      this.fullDayCycleSeconds = savedCycleSec;
    }

    // Cria o renderer diretamente (evita criar/perder um 2º contexto WebGL no Android) com fallback seguro
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isMobileDevice,
        powerPreference: this.isMobileDevice ? 'default' : 'high-performance',
        alpha: false,
        stencil: false,
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      this.renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: 'default',
        precision: 'mediump',
        alpha: false,
        stencil: false,
      });
    }

    // Detecta renderização por software diretamente no contexto ativo
    this.isSoftwareGl = (() => {
      try {
        const gl = this.renderer.getContext();
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const maxInitDpr = this.isSoftwareGl ? 1 : (this.isMobileDevice ? 1.25 : 2.0);
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxInitDpr));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Garante que o canvas WebGL preencha 100% do mount container sem colapsar
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored, false);

    // Camera com alcance dinâmico para culling na Cidade Gigante 3x
    this.camera = new THREE.PerspectiveCamera(
      58,
      width / height,
      0.1,
      this.performanceMode === 'baixo' ? 680 : this.performanceMode === 'medio' ? 780 : 900
    );

    this.cityScene = createCityScene();
    if (!this.isMobileDevice && !this.isSoftwareGl) {
      try {
        this.pmrem = new THREE.PMREMGenerator(this.renderer);
        const roomEnv = new RoomEnvironment();
        this.cityScene.scene.environment = this.pmrem.fromScene(roomEnv, 0.04).texture;
        roomEnv.dispose();
      } catch (err) {
        console.warn('PMREM environment fallback:', err);
      }
    }

    this.phasesManager = new PhasesManager(this.cityScene.scene);

    // Inicializa o Gerenciador de Construção da Cidade (Terrenos, Casas, Lojas e Decorações)
    this.buildingManager = new BuildingManager(this.cityScene.scene, this.cityScene.colliders, {
      onBuildingPlaced: (bld) => {
        soundManager.playStarCollect();
        this.dialogueText = `Construção "${bld.name}" posicionada com sucesso!`;
        this.dialogueTimer = 4.0;
      },
      onBuildingRemoved: (bld) => {
        soundManager.playPurchase();
        this.dialogueText = `"${bld.name}" recolhida e retornada ao inventário!`;
        this.dialogueTimer = 4.0;
      },
      onStatusMessage: (msg, isErr) => {
        this.dialogueText = msg;
        this.dialogueTimer = 4.0;
        if (isErr) soundManager.playPopClick();
      },
    });

    // Sincroniza saldo inicial de ouro com a carteira econômica segura
    this.money = economyManager.getWallet().gold;

    // Inicializa o Sistema de Clima Dinâmico (Ensolarado, Nublado, Chuvoso)
    this.weatherManager = new WeatherManager(
      this.cityScene.scene,
      this.cityScene.sunLight,
      this.cityScene.skyLight,
      (weatherInfo) => {
        if (weatherInfo.type === 'rainy') {
          this.dialogueText = '🌧️ Chuva refrescante na Cidade Real! Sinta as gotinhas!';
          cityVoiceManager.speak('Theo Lucca', 'Olha, começou a chover! Que delícia de chuva!', 'male', false);
        } else if (weatherInfo.type === 'cloudy') {
          this.dialogueText = '☁️ O céu ficou nublado! Clima ameno e agradável!';
          cityVoiceManager.speak('Theo Lucca', 'O céu encheu de nuvens! Clima fresquinho!', 'male', false);
        } else if (weatherInfo.type === 'night') {
          this.dialogueText = '🌙 A noite estrelada chegou! Postes e faróis acesos na cidade!';
          cityVoiceManager.speak('Theo Lucca', 'Olha que noite linda! Os faróis e postes da cidade acenderam!', 'male', false);
        } else {
          this.dialogueText = '☀️ O sol radiante voltou a brilhar na Cidade Real!';
          cityVoiceManager.speak('Theo Lucca', 'O sol abriu forte! Que dia lindo!', 'male', false);
        }
        this.dialogueTimer = 4.5;
        this.dispatchHUDData();
      }
    );

    // Sistema de Iluminação Noturna Dinâmica: liga postes de luz e faróis 3D dos carros à noite
    this.weatherManager.setOnNightStateChanged((isNight) => {
      this.cityScene.setStreetLights?.(isNight);
      for (const car of this.cityScene.cars) {
        car.setHeadlights?.(isNight);
      }
    });

    this.player = createTheoLuccaModel();
    this.player.root.position.copy(this.playerPos);
    this.player.root.rotation.y = this.playerRotationY;
    this.player.applyCustomization(this.characterCustomization);
    this.cityScene.scene.add(this.player.root);
    // Sinaliza o primeiro objetivo de missão no mundo 3D (Igreja Matriz no Centro)
    this.cityScene.setBeaconPosition(new THREE.Vector3(4.5, 0, 16));

    // Aplica as diretrizes de desempenho antes do primeiro posicionamento da câmera
    this.applyPerformanceSettings(this.performanceMode);

    // Posiciona a câmera imediatamente na vista aérea completa no primeiro frame
    this.updateCamera(10);

    if (!this.isSoftwareGl && !this.isMobileDevice) {
      try {
        this.renderer.compile(this.cityScene.scene, this.camera);
      } catch (err) {
        console.warn('Pre-compile shader warning:', err);
      }
    }

    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(this.container);
    }

    // Câmera Zoom via scroll do mouse e pinch no touchscreen
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: true });
    this.container.addEventListener('touchend', this.onTouchEnd, { passive: true });

    this.dispatchHUDData();
    this.lastTime = performance.now();
    this.tick();

    const userInteraction = () => {
      soundManager.startFountainAmbient();
      window.removeEventListener('pointerdown', userInteraction);
      window.removeEventListener('keydown', userInteraction);
    };
    window.addEventListener('pointerdown', userInteraction);
    window.addEventListener('keydown', userInteraction);
  }

  // --- CONTROLES E INPUTS ---
  public setJoystickInput(x: number, y: number) {
    this.moveInput.set(x, y);
  }

  public toggleRun(active?: boolean) {
    this.isRunningInput = active !== undefined ? active : !this.isRunningInput;
  }

  public getIsRunning(): boolean {
    return this.isRunningInput;
  }

  public jump() {
    if (this.isInCar || !this.isGrounded) return;
    this.isGrounded = false;
    this.playerVelocity.y = 7.0;
    soundManager.playJump();
  }

  public rotateCamera(deltaX: number, deltaY: number) {
    this.targetAerialPitch = null;
    this.targetCameraYaw = null;
    this.cameraAngles.yaw += deltaX * 0.0055;
    this.cameraAngles.pitch = Math.max(0.08, Math.min(1.52, this.cameraAngles.pitch + deltaY * 0.0045));
  }

  public panCamera(deltaX: number, deltaY: number) {
    // Move o foco da câmera livremente em todas as direções (360°) pelos 7 bairros
    this.targetCameraPanOffset = null;
    const speed = Math.max(0.08, this.cameraZoom * 0.018);
    const yaw = this.cameraAngles.yaw;
    const stepX = (Math.cos(yaw) * deltaX + Math.sin(yaw) * deltaY) * speed;
    const stepZ = (-Math.sin(yaw) * deltaX + Math.cos(yaw) * deltaY) * speed;

    const minWorld = -265;
    const maxWorld = 265;
    const nextWorldX = THREE.MathUtils.clamp(this.playerPos.x + this.cameraPanOffset.x + stepX, minWorld, maxWorld);
    const nextWorldZ = THREE.MathUtils.clamp(this.playerPos.z + this.cameraPanOffset.z + stepZ, minWorld, maxWorld);

    this.cameraPanOffset.x = nextWorldX - this.playerPos.x;
    this.cameraPanOffset.z = nextWorldZ - this.playerPos.z;
  }

  public resetCameraPan() {
    this.targetCameraPanOffset = new THREE.Vector3(0, 0, 0);
    this.dispatchHUDData();
  }

  public resetCameraToNormal() {
    this.cameraPreset = 'third_person';
    this.targetCameraZoom = 1.1;
    this.targetAerialPitch = 0.28;
    this.targetCameraPanOffset = new THREE.Vector3(0, 0, 0);
    const baseYaw =
      this.isInCar && this.currentPassengerCar
        ? this.currentPassengerCar.rotationY
        : this.isDrivingMoto && this.currentMotorcycle
          ? this.currentMotorcycle.rotationY
          : this.playerRotationY;
    this.targetCameraYaw = baseYaw + Math.PI;
    this.dialogueText = '📷 Câmera voltou ao normal seguindo Theo Lucca!';
    this.dialogueTimer = 2.8;
    soundManager.playPopClick();
    this.dispatchHUDData();
  }

  public turnCameraLeft(step: number = 0.22) {
    this.targetCameraYaw = null;
    this.cameraAngles.yaw += step;
  }

  public turnCameraRight(step: number = 0.22) {
    this.targetCameraYaw = null;
    this.cameraAngles.yaw -= step;
  }

  private syncPresetFromZoom() {
    if (this.cameraZoom >= 52) this.cameraPreset = 'city';
    else if (this.cameraZoom >= 14) this.cameraPreset = 'district';
    else if (this.cameraZoom >= 2.6) this.cameraPreset = 'street';
    else this.cameraPreset = 'third_person';
  }

  public zoomIn(step?: number) {
    this.targetCameraZoom = null;
    const deltaStep = step ?? Math.max(0.18, this.cameraZoom * 0.28);
    this.cameraZoom = Math.max(0.45, this.cameraZoom - deltaStep);
    this.syncPresetFromZoom();
    this.dispatchHUDData();
  }

  public zoomOut(step?: number) {
    this.targetCameraZoom = null;
    const deltaStep = step ?? Math.max(0.35, this.cameraZoom * 0.38);
    this.cameraZoom = Math.min(135.0, this.cameraZoom + deltaStep);
    this.syncPresetFromZoom();
    this.dispatchHUDData();
  }

  public setCameraZoom(zoom: number) {
    this.targetCameraZoom = null;
    this.cameraZoom = Math.max(0.45, Math.min(135.0, zoom));
    this.syncPresetFromZoom();
    this.dispatchHUDData();
  }

  public setCameraPreset(preset: 'city' | 'district' | 'street' | 'third_person') {
    this.cameraPreset = preset;
    if (preset === 'city') {
      this.targetCameraZoom = 96.0;
      this.targetAerialPitch = 1.12;
      this.targetCameraPanOffset = new THREE.Vector3(-this.playerPos.x, 0, -this.playerPos.z);
      this.dialogueText = '🗺️ CIDADE GIGANTE 3X: Veja todos os 7 bairros e 5 igrejas de cima! Arraste ou dê zoom!';
    } else if (preset === 'district') {
      this.targetCameraZoom = 24.0;
      this.targetAerialPitch = 0.90;
      this.targetCameraPanOffset = new THREE.Vector3(0, 0, 0);
      this.dialogueText = '🏘️ Visão de BAIRRO ativada!';
    } else if (preset === 'street') {
      this.targetCameraZoom = 4.2;
      this.targetAerialPitch = 0.50;
      this.targetCameraPanOffset = new THREE.Vector3(0, 0, 0);
      this.dialogueText = '🛣️ Visão de RUA ativada!';
    } else {
      this.targetCameraZoom = 1.1;
      this.targetAerialPitch = 0.28;
      this.targetCameraPanOffset = new THREE.Vector3(0, 0, 0);
      this.dialogueText = '🚶 Câmera em 3ª PESSOA seguindo Theo Lucca!';
    }
    this.dialogueTimer = 3.2;
    soundManager.playPopClick();
    this.dispatchHUDData();
  }

  public toggleAerialView() {
    const activeTarget = this.targetCameraZoom ?? this.cameraZoom;
    if (activeTarget >= 14.0) {
      this.setCameraPreset('third_person');
    } else {
      this.setCameraPreset('city');
    }
  }

  public getCameraZoom(): number {
    return this.cameraZoom;
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.targetCameraZoom = null;
    const zoomFactor = 1 + e.deltaY * 0.0014;
    this.cameraZoom = Math.max(0.45, Math.min(135.0, this.cameraZoom * zoomFactor));
    this.syncPresetFromZoom();
    this.dispatchHUDData();
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchPinchStartDist = Math.hypot(dx, dy);
      this.initialPinchZoom = this.cameraZoom;
      this.touchPinchLastMid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) * 0.5,
        y: (e.touches[0].clientY + e.touches[1].clientY) * 0.5,
      };
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && this.touchPinchStartDist > 10) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        this.targetCameraZoom = null;
        const ratio = this.touchPinchStartDist / dist;
        this.cameraZoom = Math.max(0.45, Math.min(135.0, this.initialPinchZoom * ratio));
        this.syncPresetFromZoom();
        this.dispatchHUDData();
      }
      const midX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
      if (this.touchPinchLastMid) {
        this.panCamera(midX - this.touchPinchLastMid.x, midY - this.touchPinchLastMid.y);
      }
      this.touchPinchLastMid = { x: midX, y: midY };
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      this.touchPinchStartDist = 0;
      this.touchPinchLastMid = null;
    }
  };

  public honkHorn() {
    soundManager.playCuteHorn();
  }

  // Acenar / Falar com NPCs com vozes masculinas e femininas reais em PT-BR
  public waveAndSpeak() {
    this.waveTimer = 2.2;
    soundManager.playWaveHello();

    // Encontra o NPC mais próximo (até 8.0 metros)
    let nearest: CityNPC | null = null;
    let minDist = 8.0;

    for (const npc of this.cityScene.npcs) {
      const d = npc.group.position.distanceTo(this.playerPos);
      if (d < minDist) {
        minDist = d;
        nearest = npc;
      }
    }

    if (nearest) {
      const targetNPC: CityNPC = nearest;
      const tipsList = targetNPC.tips && targetNPC.tips.length > 0 ? targetNPC.tips : [targetNPC.phrase];
      const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)];
      this.dialogueText = `${targetNPC.name}: "${randomTip}"`;
      
      // Fala em voz alta em português do Brasil com a voz do personagem (masculina ou feminina)
      cityVoiceManager.speak(targetNPC.name, randomTip, targetNPC.gender || 'male', true);

      if (targetNPC.name.includes('Padre')) {
        this.checkMissionProgress(1, 1);
      } else if (targetNPC.name.includes('Policial')) {
        this.checkMissionProgress(2, 1);
      }
    } else {
      // Personagem falando sozinho animado
      const charName = this.characterCustomization.name || 'Theo Lucca';
      cityVoiceManager.speak(charName, `Oi cidade linda! Eu sou ${charName}! Vamos explorar os 7 bairros!`, 'male', true);
      this.dialogueText = `${charName}: "Oi cidade linda! Vamos explorar os 7 bairros!"`;
    }
    this.dialogueTimer = 6.0;
  }

  // --- SISTEMA DE COLISÃO REALISTA (PAREDES, ÁRVORES, VEÍCULOS) ---
  private resolveCollisions(pos: THREE.Vector3, radius = 0.45, excludeObj?: any): boolean {
    if (!this.cityScene || !this.cityScene.colliders) return false;
    let collided = false;

    // 1. Árvores urbanas, coqueiros da praia e fonte d'água central
    for (const circle of this.cityScene.colliders.circles) {
      const dx = pos.x - circle.x;
      const dz = pos.z - circle.z;
      const distSq = dx * dx + dz * dz;
      const minDist = circle.radius + radius;
      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
        collided = true;
      }
    }

    // 2. Paredes de prédios, lojas e casas residenciais (com portas abertas)
    for (const box of this.cityScene.colliders.boxes) {
      if (
        pos.x >= box.minX - radius &&
        pos.x <= box.maxX + radius &&
        pos.z >= box.minZ - radius &&
        pos.z <= box.maxZ + radius
      ) {
        const distLeft = pos.x - (box.minX - radius);
        const distRight = (box.maxX + radius) - pos.x;
        const distBack = pos.z - (box.minZ - radius);
        const distFront = (box.maxZ + radius) - pos.z;

        const minOverlap = Math.min(distLeft, distRight, distBack, distFront);
        if (minOverlap === distLeft) {
          pos.x = box.minX - radius;
        } else if (minOverlap === distRight) {
          pos.x = box.maxX + radius;
        } else if (minOverlap === distBack) {
          pos.z = box.minZ - radius;
        } else {
          pos.z = box.maxZ + radius;
        }
        collided = true;
      }
    }

    // 3. Colisão com outros carros e motos estacionados ou em trânsito
    for (const car of this.cityScene.cars) {
      if (excludeObj === car) continue;
      const dx = pos.x - car.group.position.x;
      const dz = pos.z - car.group.position.z;
      const distSq = dx * dx + dz * dz;
      const carRadius = 1.35 + radius;
      if (distSq < carRadius * carRadius && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = carRadius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
        collided = true;
      }
    }

    for (const moto of this.cityScene.motorcycles) {
      if (excludeObj === moto) continue;
      const dx = pos.x - moto.group.position.x;
      const dz = pos.z - moto.group.position.z;
      const distSq = dx * dx + dz * dz;
      const motoRadius = 0.85 + radius;
      if (distSq < motoRadius * motoRadius && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = motoRadius - dist;
        pos.x += (dx / dist) * overlap;
        pos.z += (dz / dist) * overlap;
        collided = true;
      }
    }

    return collided;
  }

  // Entrar ou Sair de Veículo (Carro ou Moto)
  public toggleCarRide() {
    // Se Theo já está dirigindo um carro ou pilotando uma moto: descer do veículo
    if (this.isInCar || this.isDrivingMoto) {
      if (this.isInCar && this.currentPassengerCar) {
        const car = this.currentPassengerCar;
        car.hasTheoPassenger = false;
        // Posição lateral segura
        this.playerPos.x = car.group.position.x + Math.cos(car.rotationY) * 2.1;
        this.playerPos.z = car.group.position.z - Math.sin(car.rotationY) * 2.1;
        this.playerPos.y = 0;
        this.resolveCollisions(this.playerPos, 0.45);
        this.currentPassengerCar = null;
        this.isInCar = false;
      } else if (this.isDrivingMoto && this.currentMotorcycle) {
        const moto = this.currentMotorcycle;
        moto.hasTheoPassenger = false;
        if (moto.rider) moto.rider.visible = true;
        this.playerPos.x = moto.group.position.x + Math.cos(moto.rotationY) * 1.5;
        this.playerPos.z = moto.group.position.z - Math.sin(moto.rotationY) * 1.5;
        this.playerPos.y = 0;
        this.resolveCollisions(this.playerPos, 0.45);
        this.currentMotorcycle = null;
        this.isDrivingMoto = false;
      }
      this.vehicleSpeed = 0;
      soundManager.playCarDoor();
      soundManager.playCuteHorn();
      this.dialogueText = 'Theo: "Desci do veículo! Agora posso explorar a pé!"';
      this.dialogueTimer = 3.0;
      return;
    }

    // Procura o veículo mais próximo (carro ou moto dentro de 5.5m)
    let closestCar: CityCar | null = null;
    let minCarDist = 5.5;
    for (const car of this.cityScene.cars) {
      const d = car.group.position.distanceTo(this.playerPos);
      if (d < minCarDist) {
        minCarDist = d;
        closestCar = car;
      }
    }

    let closestMoto: CityMoto | null = null;
    let minMotoDist = 5.5;
    for (const moto of this.cityScene.motorcycles) {
      const d = moto.group.position.distanceTo(this.playerPos);
      if (d < minMotoDist) {
        minMotoDist = d;
        closestMoto = moto;
      }
    }

    // Se estiver mais perto de uma moto
    if (closestMoto && minMotoDist <= minCarDist) {
      this.isDrivingMoto = true;
      this.isInCar = false;
      this.currentMotorcycle = closestMoto;
      closestMoto.hasTheoPassenger = true;
      if (closestMoto.rider) closestMoto.rider.visible = false;
      this.vehicleSpeed = 0;
      soundManager.playCarDoor();
      soundManager.playEngineRev(true);
      this.dialogueText = `Theo subiu na ${closestMoto.colorName}! Use o joystick ou WASD para acelerar, frear e fazer curvas!`;
      this.dialogueTimer = 4.5;
      return;
    }

    // Se estiver mais perto de um carro
    if (closestCar) {
      this.isInCar = true;
      this.isDrivingMoto = false;
      this.currentPassengerCar = closestCar;
      closestCar.hasTheoPassenger = true;
      this.vehicleSpeed = 0;
      soundManager.playCarDoor();
      soundManager.playEngineRev(false);
      this.dialogueText = `Theo assumiu o volante do ${closestCar.colorName}! Use o joystick ou WASD para dirigir e fazer curvas!`;
      this.dialogueTimer = 4.5;
      return;
    }

    this.dialogueText = 'Aproxime-se de um carro ou de uma moto para poder dirigir!';
    this.dialogueTimer = 3.0;
  }

  // --- SISTEMA DE TRABALHOS (5 JOBS GTA INFANTIL) ---
  public startJob(jobId: string) {
    if (jobId === 'pizzaria_do_bairro') {
      this.activeJob = {
        id: 'pizza',
        name: 'Entregador de Pizza',
        reward: 20,
        step: 1,
        maxSteps: 2,
        stepDesc: 'Leve a caixa de pizza até a Casa Residencial!',
        targetPos: this.cityScene.customerHouses[0] || new THREE.Vector3(-36, 0, -37.5),
        targetName: 'Casa Residencial do Vizinho',
        propType: 'pizza',
      };
      this.player.setHeldPropType('pizza');
      this.cityScene.setBeaconPosition(this.activeJob.targetPos);
      this.dialogueText = 'Pizzaiolo: "Aqui está a pizza quentinha! Entregue na casa amarela!"';
      this.dialogueTimer = 4.0;
    } else if (jobId === 'supermercado_central') {
      this.activeJob = {
        id: 'mercado',
        name: 'Ajudante do Mercado',
        reward: 15,
        step: 1,
        maxSteps: 2,
        stepDesc: 'Leve as caixas de frutas até as prateleiras internas!',
        targetPos: new THREE.Vector3(-14, 0, 19),
        targetName: 'Prateleiras do Mercado',
        propType: 'none',
      };
      this.cityScene.setBeaconPosition(this.activeJob.targetPos);
      this.dialogueText = 'Gerente: "Obrigado Theo! Leve estas caixas até as prateleiras!"';
      this.dialogueTimer = 4.0;
    } else if (jobId === 'parque_jardineiro') {
      this.activeJob = {
        id: 'jardim',
        name: 'Jardineiro do Parque',
        reward: 10,
        step: 1,
        maxSteps: 3,
        stepDesc: 'Regue os 3 canteiros de flores do parque com o regador!',
        targetPos: this.cityScene.flowerBeds[0] || new THREE.Vector3(12, 0, 12),
        targetName: 'Canteiro de Flores 1',
        propType: 'wateringCan',
      };
      this.player.setHeldPropType('wateringCan');
      this.cityScene.setBeaconPosition(this.activeJob.targetPos);
      this.dialogueText = 'Florista: "Theo, aqui está o regador! Deixe as flores bem fresquinhas!"';
      this.dialogueTimer = 4.0;
    } else if (jobId === 'padaria_pao_quentinho') {
      this.activeJob = {
        id: 'padaria',
        name: 'Ajudante da Padaria',
        reward: 12,
        step: 1,
        maxSteps: 2,
        stepDesc: 'Leve o pão quentinho para a Vovó Maria na Praça!',
        targetPos: new THREE.Vector3(12, 0, 16),
        targetName: 'Vovó Maria na Praça',
        propType: 'none',
      };
      this.cityScene.setBeaconPosition(this.activeJob.targetPos);
      this.dialogueText = 'Seu Zé: "O pão saiu agora do forno! Entregue para a Vovó Maria!"';
      this.dialogueTimer = 4.0;
    } else if (jobId === 'oficina_mecanica') {
      const workshopTarget = new THREE.Vector3(30.4, 0, -27.2);
      this.activeJob = {
        id: 'oficina',
        name: 'Mecânico na Oficina Theo Lucca',
        reward: 25,
        step: 1,
        maxSteps: 2,
        stepDesc: 'Aperte os parafusos do motor e faça a revisão do carro prata!',
        targetPos: workshopTarget,
        targetName: 'Motor do Carro Prata na Oficina',
        propType: 'wrench',
      };
      this.player.setHeldPropType('wrench');
      this.cityScene.setBeaconPosition(workshopTarget);
      this.dialogueText = 'Mecânico Zeca: "Theo, pegue a chave inglesa e faça a revisão do motor do carro prata!"';
      this.dialogueTimer = 4.0;
    } else {
      // Jornaleiro de bicicleta
      this.activeJob = {
        id: 'jornal',
        name: 'Entregador de Jornal',
        reward: 25,
        step: 1,
        maxSteps: 2,
        stepDesc: 'Coloque os jornais nas caixas de correio vermelhas!',
        targetPos: this.cityScene.mailboxes[0] || new THREE.Vector3(-33.8, 0, -36.5),
        targetName: 'Caixa de Correio 1',
        propType: 'newspaper',
      };
      this.player.setHeldPropType('newspaper');
      this.cityScene.setBeaconPosition(this.activeJob.targetPos);
      this.dialogueText = 'Banca de Jornal: "Entregue as notícias matinais nas caixas de correio!"';
      this.dialogueTimer = 4.0;
    }
  }

  // Tentar interagir ou trabalhar no local
  public tryInteractOrWork() {
    // 1. Se já está em um trabalho e está perto do objetivo
    if (this.activeJob) {
      const dist = this.playerPos.distanceTo(this.activeJob.targetPos);
      if (dist < 4.0) {
        if (this.activeJob.step < this.activeJob.maxSteps) {
          this.activeJob.step++;
          if (this.activeJob.id === 'jardim' && this.cityScene.flowerBeds[this.activeJob.step - 1]) {
            this.activeJob.targetPos = this.cityScene.flowerBeds[this.activeJob.step - 1];
            this.activeJob.targetName = `Canteiro de Flores ${this.activeJob.step}`;
            this.activeJob.stepDesc = `Regue o canteiro ${this.activeJob.step} de 3!`;
          } else if (this.activeJob.id === 'jornal' && this.cityScene.mailboxes[this.activeJob.step - 1]) {
            this.activeJob.targetPos = this.cityScene.mailboxes[this.activeJob.step - 1];
            this.activeJob.targetName = `Caixa de Correio ${this.activeJob.step}`;
            this.activeJob.stepDesc = `Entregue o jornal na caixa ${this.activeJob.step}!`;
          } else if (this.activeJob.id === 'oficina') {
            this.activeJob.targetPos = new THREE.Vector3(23.5, 0, -26.0);
            this.activeJob.targetName = 'Carro Suspenso no Elevador';
            this.activeJob.stepDesc = 'Inspecione a suspensão e escapamento no elevador hidráulico!';
          }
          this.cityScene.setBeaconPosition(this.activeJob.targetPos);
          soundManager.playStarCollect();
          return;
        }

        // Trabalho Concluído com Sucesso!
        const reward = this.activeJob.reward;
        economyManager.addFunds('gold', reward, `Salário do trabalho: ${this.activeJob.name}`);
        this.money = economyManager.getWallet().gold;
        this.jobsFinishedCount++;
        soundManager.playCashEarn();

        if (this.activeJob.id === 'pizza') {
          this.pizzaDeliveriesCount++;
        }
        if (this.activeJob.id === 'mercado') {
          this.checkMissionProgress(3, 1);
        }

        this.callbacks.onJobCompleted(this.activeJob.name, reward);
        this.dialogueText = `PARABÉNS! Você concluiu o trabalho e ganhou R$ ${reward},00!`;
        this.dialogueTimer = 5.0;

        this.activeJob = null;
        this.player.setHeldPropType('none');
        this.cityScene.setBeaconPosition(null);
        return;
      }
    }

    // 2. Se está perto de um local de trabalho, inicia o trabalho
    let nearestLoc = this.getNearestLocation();
    if (nearestLoc && nearestLoc.dist < 5.5) {
      if (nearestLoc.id === 'igreja_matriz' || nearestLoc.id.startsWith('igreja_')) {
        this.checkMissionProgress(1, 1);
      } else if (nearestLoc.id === 'delegacia_policia') {
        this.checkMissionProgress(2, 1);
      } else if (
        nearestLoc.id === 'supermercado_central' ||
        nearestLoc.id === 'mercadinho_bairro_baixo' ||
        nearestLoc.id === 'supermercado_oeste'
      ) {
        this.checkMissionProgress(3, 1);
      } else if (nearestLoc.id === 'shopping_theo') {
        this.checkMissionProgress(4, 1);
      }
      if (nearestLoc.category === 'job') {
        this.startJob(nearestLoc.id);
        return;
      }
    }

    // 3. Falar com pessoas
    this.waveAndSpeak();
  }

  // --- SISTEMA DE COMPRAS NAS LOJAS ---
  public buyItem(item: BackpackItem): boolean {
    const success = economyManager.spendFunds('gold', item.price, `Compra na loja: ${item.name}`);
    if (!success) {
      this.dialogueText = `Dinheiro insuficiente! Você precisa de R$ ${item.price},00. Trabalhe mais para juntar moedas!`;
      this.dialogueTimer = 4.0;
      return false;
    }

    this.money = economyManager.getWallet().gold;
    this.backpack.push(item);
    soundManager.playPurchase();
    this.callbacks.onItemPurchased(item);

    this.dialogueText = `Você comprou ${item.name}! O item foi guardado na sua Mochila!`;
    this.dialogueTimer = 4.0;

    // Checagem de Missões (Compras no Mercado / Lojas)
    this.checkMissionProgress(3, 1);

    return true;
  }

  // Usar item da mochila
  public useBackpackItem(item: BackpackItem) {
    if (item.category === 'comida') {
      this.currentStamina = 100;
      this.isExhausted = false;
      this.dialogueText = `Theo comeu/bebeu ${item.name}! Fôlego 100% restaurado!`;
      this.dialogueTimer = 3.5;
      soundManager.playStarCollect();
    } else if (item.name.toLowerCase().includes('bola')) {
      this.player.setHeldPropType('ball');
      this.dialogueText = 'Theo está brincando com a sua Bola de Futebol!';
      this.dialogueTimer = 3.5;
      soundManager.playJump();
    } else if (item.id === 'tool_wrench' || item.name.toLowerCase().includes('chave')) {
      this.player.setHeldPropType('wrench');
      this.dialogueText = 'Theo pegou a Chave Inglesa da Oficina Mecânica!';
      this.dialogueTimer = 3.5;
      soundManager.playStarCollect();
    } else {
      this.dialogueText = `Theo usou ${item.name} da mochila!`;
      this.dialogueTimer = 3.0;
    }
  }

  private checkMissionProgress(missionId: number, progressVal: number) {
    const mission = this.missions.find((m) => m.id === missionId);
    if (!mission || mission.completed) return;

    mission.progress = Math.min(mission.total, progressVal);
    if (mission.progress >= mission.total) {
      mission.completed = true;
      economyManager.addFunds('gold', mission.reward, `Recompensa: ${mission.title}`);
      this.money = economyManager.getWallet().gold;
      soundManager.playMissionComplete();
      this.callbacks.onMissionCompleted(mission.title, mission.reward);

      cityVoiceManager.speak(
        'Cidade Real',
        `Parabéns Theo Lucca! Você concluiu ${mission.title} e ganhou ${mission.reward} moedas de ouro!`,
        'male',
        true
      );

      if (this.currentMissionIndex < this.missions.length - 1) {
        this.currentMissionIndex++;
        const nextTarget = this.getDefaultMissionTarget();
        this.cityScene.setBeaconPosition(new THREE.Vector3(nextTarget.x, 0, nextTarget.z));
      } else {
        const portalPos = this.phasesManager.activateLightTubeForCurrentPhase();
        this.cityScene.setBeaconPosition(portalPos);
      }
      this.dialogueText = `🎉 ${mission.title} CONCLUÍDA! +R$ ${mission.reward},00! Continue explorando os 7 bairros! ✨`;
      this.dialogueTimer = 8.0;
    }
  }

  public getNearestLocation(): { id: string; name: string; category: string; label: string; dist: number } | null {
    let nearest: { id: string; name: string; category: string; label: string; dist: number } | null = null;
    let minDist = 999;

    for (const loc of this.cityScene.locations) {
      const d = loc.position.distanceTo(this.playerPos);
      if (d < minDist) {
        minDist = d;
        nearest = { id: loc.id, name: loc.name, category: loc.category, label: loc.label, dist: d };
      }
    }

    return nearest;
  }

  // --- GAME LOOP ---
  private tick = () => {
    if (this.isDestroyed || this.isPaused) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.dialogueText = null;
      }
    }

    if (this.waveTimer > 0) {
      this.waveTimer -= delta;
    }

    this.updatePhysicsAndMovement(delta, now * 0.001);
    this.updateCamera(delta);

    if (this.currentPhase === 1) {
      this.cityScene.updateCity(now * 0.001, delta, this.playerPos);
      this.checkCoinPickups();
      this.checkNPCVoiceGreetings();
      this.checkCityMissionProximity();
    }

    this.phasesManager.update(delta, now * 0.001);
    this.checkCourseCollectibles();
    this.checkPhaseMissionsAndTeleport(delta);

    // Atualiza o Ciclo Contínuo Dia & Noite + Clima Dinâmico (sol orbital, iluminação gradual, nuvens, chuva)
    this.updateDayNightCycle(delta);
    if (this.weatherManager) {
      this.weatherManager.update(delta, this.playerPos, this.dayCycleLighting);
    }
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      this.dayCycleExposure,
      Math.min(1.0, delta * 3.0)
    );
    
    this.hudThrottleTimer += delta;
    if (this.hudThrottleTimer >= 0.033) {
      this.hudThrottleTimer = 0;
      this.dispatchHUDData();
    }

    this.renderer.render(this.cityScene.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 60);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
      this.frameId = window.setTimeout(cb, 60);
      return;
    }
    gl.flush();
    const poll = () => {
      if (this.isDestroyed || this.isPaused) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updatePhysicsAndMovement(delta: number, timeSec: number) {
    // ==========================================
    // 1. MODO DIREÇÃO DE CARRO (GTA INFANTIL)
    // ==========================================
    if (this.isInCar && this.currentPassengerCar) {
      const car = this.currentPassengerCar;

      // Inputs de direção e aceleração
      let steerInput = this.moveInput.x;
      let throttleInput = this.moveInput.y;
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) steerInput -= 1;
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) steerInput += 1;
      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) throttleInput += 1;
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) throttleInput -= 1;

      steerInput = THREE.MathUtils.clamp(steerInput, -1, 1);
      throttleInput = THREE.MathUtils.clamp(throttleInput, -1, 1);

      // Aceleração, freio e ré
      const maxForwardSpeed = 13.5;
      const maxReverseSpeed = -5.0;

      if (throttleInput > 0.1) {
        this.vehicleSpeed += 15.0 * throttleInput * delta;
        if (this.vehicleSpeed > maxForwardSpeed) this.vehicleSpeed = maxForwardSpeed;
      } else if (throttleInput < -0.1) {
        if (this.vehicleSpeed > 0.5) {
          // Freando
          this.vehicleSpeed -= 22.0 * delta;
          if (this.vehicleSpeed < 0) this.vehicleSpeed = 0;
        } else {
          // Engatando ré
          this.vehicleSpeed -= 9.0 * Math.abs(throttleInput) * delta;
          if (this.vehicleSpeed < maxReverseSpeed) this.vehicleSpeed = maxReverseSpeed;
        }
      } else {
        // Desaceleração suave / atrito
        if (this.vehicleSpeed > 0) {
          this.vehicleSpeed = Math.max(0, this.vehicleSpeed - 7.5 * delta);
        } else if (this.vehicleSpeed < 0) {
          this.vehicleSpeed = Math.min(0, this.vehicleSpeed + 7.5 * delta);
        }
      }

      // Curvas e esterçamento do carro
      if (Math.abs(this.vehicleSpeed) > 0.2 && Math.abs(steerInput) > 0.05) {
        const turnDirection = this.vehicleSpeed >= 0 ? 1 : -1;
        const turnRate = 2.4 * (Math.abs(this.vehicleSpeed) / 10 + 0.35);
        car.rotationY -= steerInput * turnRate * turnDirection * delta;
        car.group.rotation.y = car.rotationY;
      }

      // Deslocamento para frente na direção do carro
      const forwardX = Math.sin(car.rotationY);
      const forwardZ = Math.cos(car.rotationY);
      const tentativePos = car.group.position.clone();
      tentativePos.x += forwardX * this.vehicleSpeed * delta;
      tentativePos.z += forwardZ * this.vehicleSpeed * delta;

      // Limites da cidade ampliada 3x (7 bairros + orla)
      tentativePos.x = Math.max(-252, Math.min(252, tentativePos.x));
      tentativePos.z = Math.max(-252, Math.min(252, tentativePos.z));

      // Colisão do carro com paredes, árvores e outros veículos (NÃO atravessa nada!)
      const collided = this.resolveCollisions(tentativePos, 1.4, car);
      if (collided) {
        if (Math.abs(this.vehicleSpeed) > 1.8) {
          const intensity = Math.min(1.0, Math.abs(this.vehicleSpeed) / 10);
          soundManager.playCarCrash(intensity);
          car.applyDent?.('front');
          this.cameraShake = 0.5 * intensity;
          this.dialogueText = '💥 Bateu o carro! Parachoque amassado! Vá até a Oficina Mecânica Theo Lucca para desamassar!';
          this.dialogueTimer = 4.0;
        }
        this.vehicleSpeed *= -0.25; // rebate suavemente sem atravessar
      }

      // Oficina Mecânica Theo Lucca: repara carro amassado automaticamente
      const distToOficina = car.group.position.distanceTo(new THREE.Vector3(32, 0, -24));
      if (distToOficina < 7.5 && (car.dentLevel ?? 0) > 0) {
        car.repair?.();
        soundManager.playCarRepair();
        this.dialogueText = '🔧 Oficina Theo Lucca: Parachoque desamassado e polido com sucesso!';
        this.dialogueTimer = 4.5;
      }

      car.group.position.copy(tentativePos);
      car.speed = this.vehicleSpeed;

      // Giro realista das 4 rodas
      for (const wheel of car.wheels) {
        wheel.rotation.x += this.vehicleSpeed * delta * 2.8;
      }

      // Som do motor acelerando
      if (Math.abs(this.vehicleSpeed) > 2.0) {
        this.engineRevTimer += delta;
        if (this.engineRevTimer > 1.6) {
          soundManager.playEngineRev(false);
          this.engineRevTimer = 0;
        }
      }

      // Theo posicionado no banco do motorista
      const driverOffsetX = Math.cos(car.rotationY) * 0.42;
      const driverOffsetZ = -Math.sin(car.rotationY) * 0.42;
      this.playerPos.x = car.group.position.x - driverOffsetX;
      this.playerPos.z = car.group.position.z - driverOffsetZ;
      this.playerPos.y = 0.48;
      this.playerRotationY = car.rotationY;

      this.player.root.position.copy(this.playerPos);
      this.player.root.rotation.y = this.playerRotationY;
      this.player.updateAnimation(timeSec, Math.abs(this.vehicleSpeed) / 10, true, false, false, true, false);
      return;
    }

    // ==========================================
    // 2. MODO PILOTAR MOTO (GTA INFANTIL)
    // ==========================================
    if (this.isDrivingMoto && this.currentMotorcycle) {
      const moto = this.currentMotorcycle;

      let steerInput = this.moveInput.x;
      let throttleInput = this.moveInput.y;
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) steerInput -= 1;
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) steerInput += 1;
      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) throttleInput += 1;
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) throttleInput -= 1;

      steerInput = THREE.MathUtils.clamp(steerInput, -1, 1);
      throttleInput = THREE.MathUtils.clamp(throttleInput, -1, 1);

      const maxForwardSpeed = 16.0;
      const maxReverseSpeed = -4.5;

      if (throttleInput > 0.1) {
        this.vehicleSpeed += 17.5 * throttleInput * delta;
        if (this.vehicleSpeed > maxForwardSpeed) this.vehicleSpeed = maxForwardSpeed;
      } else if (throttleInput < -0.1) {
        if (this.vehicleSpeed > 0.5) {
          this.vehicleSpeed -= 24.0 * delta;
          if (this.vehicleSpeed < 0) this.vehicleSpeed = 0;
        } else {
          this.vehicleSpeed -= 8.5 * Math.abs(throttleInput) * delta;
          if (this.vehicleSpeed < maxReverseSpeed) this.vehicleSpeed = maxReverseSpeed;
        }
      } else {
        if (this.vehicleSpeed > 0) {
          this.vehicleSpeed = Math.max(0, this.vehicleSpeed - 8.0 * delta);
        } else if (this.vehicleSpeed < 0) {
          this.vehicleSpeed = Math.min(0, this.vehicleSpeed + 8.0 * delta);
        }
      }

      // Curvas da moto com inclinação realista
      if (Math.abs(this.vehicleSpeed) > 0.2 && Math.abs(steerInput) > 0.05) {
        const turnDirection = this.vehicleSpeed >= 0 ? 1 : -1;
        const turnRate = 2.9 * (Math.abs(this.vehicleSpeed) / 10 + 0.4);
        moto.rotationY -= steerInput * turnRate * turnDirection * delta;
        moto.group.rotation.y = moto.rotationY;
      }

      // Inclinação suave no eixo Z ao fazer curva
      const leanTarget = -steerInput * (this.vehicleSpeed / maxForwardSpeed) * 0.28;
      moto.group.rotation.z = THREE.MathUtils.damp(moto.group.rotation.z, leanTarget, 8, delta);

      const forwardX = Math.sin(moto.rotationY);
      const forwardZ = Math.cos(moto.rotationY);
      const tentativePos = moto.group.position.clone();
      tentativePos.x += forwardX * this.vehicleSpeed * delta;
      tentativePos.z += forwardZ * this.vehicleSpeed * delta;

      tentativePos.x = Math.max(-252, Math.min(252, tentativePos.x));
      tentativePos.z = Math.max(-252, Math.min(252, tentativePos.z));

      // Colisão da moto com paredes, árvores e carros (NÃO atravessa nada!)
      const collided = this.resolveCollisions(tentativePos, 0.85, moto);
      if (collided) {
        if (Math.abs(this.vehicleSpeed) > 2.2) {
          soundManager.playCarCrash(0.5);
          this.cameraShake = 0.35;
        }
        this.vehicleSpeed *= -0.2;
      }

      moto.group.position.copy(tentativePos);
      moto.speed = this.vehicleSpeed;

      // Giro das rodas da moto
      for (const wheel of moto.wheels) {
        wheel.rotation.x += this.vehicleSpeed * delta * 3.8;
      }

      // Som do acelerador da moto
      if (Math.abs(this.vehicleSpeed) > 2.0) {
        this.engineRevTimer += delta;
        if (this.engineRevTimer > 1.5) {
          soundManager.playEngineRev(true);
          this.engineRevTimer = 0;
        }
      }

      // Theo posicionado no banco segurando o guidão
      this.playerPos.copy(moto.group.position);
      this.playerPos.y = 0.54;
      this.playerRotationY = moto.rotationY;

      this.player.root.position.copy(this.playerPos);
      this.player.root.rotation.y = this.playerRotationY;
      this.player.updateAnimation(timeSec, Math.abs(this.vehicleSpeed) / 10, true, false, false, true, false);
      return;
    }

    // ==========================================
    // 3. MODO A PÉ COM COLISÃO SÓLIDA REALISTA
    // ==========================================
    let inputX = this.moveInput.x;
    let inputY = this.moveInput.y;

    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) inputX -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) inputX += 1;
    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) inputY += 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) inputY -= 1;

    const moveMag = Math.min(1.0, Math.hypot(inputX, inputY));
    const isMoving = moveMag > 0.08;

    let moveDir = new THREE.Vector3(0, 0, 0);
    if (isMoving) {
      const inputAngle = Math.atan2(-inputX, inputY);
      const worldAngle = this.cameraAngles.yaw + inputAngle;
      moveDir.set(Math.sin(worldAngle), 0, Math.cos(worldAngle)).normalize();

      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      let angleDiff = targetRotationY - this.playerRotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.playerRotationY += angleDiff * Math.min(1, 14 * delta);
    }

    const wantsToRun = (this.isRunningInput || this.keysPressed['ShiftLeft']) && !this.isExhausted;
    const moveSpeed = wantsToRun ? 8.2 : 4.5;

    if (isMoving && wantsToRun) {
      this.currentStamina -= 20 * delta;
      if (this.currentStamina <= 0) {
        this.currentStamina = 0;
        this.isExhausted = true;
        this.isRunningInput = false;
      }
    } else {
      this.currentStamina = Math.min(this.maxStamina, this.currentStamina + 18 * delta);
      if (this.isExhausted && this.currentStamina > 30) {
        this.isExhausted = false;
      }
    }

    if (isMoving) {
      this.playerPos.x += moveDir.x * moveSpeed * moveMag * delta;
      this.playerPos.z += moveDir.z * moveSpeed * moveMag * delta;

      // Limites da cidade aberta 3x (7 bairros + orla da praia)
      this.playerPos.x = Math.max(-255, Math.min(255, this.playerPos.x));
      this.playerPos.z = Math.max(-255, Math.min(255, this.playerPos.z));

      // COLISÃO COM PAREDES, ÁRVORES E VEÍCULOS (NÃO ATRAVESSA NADA!)
      this.resolveCollisions(this.playerPos, 0.45);

      if (this.isGrounded) {
        this.stepTimer += delta;
        const stepInterval = wantsToRun ? 0.22 : 0.35;
        if (this.stepTimer >= stepInterval) {
          soundManager.playFootstep(wantsToRun);
          this.stepTimer = 0;
        }
      }
    } else {
      this.stepTimer = 0.25;
    }

    if (!this.isGrounded) {
      this.playerVelocity.y -= 19.5 * delta;
      this.playerPos.y += this.playerVelocity.y * delta;

      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.player.root.position.copy(this.playerPos);
    this.player.root.rotation.y = this.playerRotationY;

    const animSpeed = isMoving ? (wantsToRun ? 1.0 : 0.5) : 0;
    this.player.updateAnimation(
      timeSec,
      animSpeed,
      this.isGrounded,
      wantsToRun,
      this.waveTimer > 0,
      false,
      this.activeJob !== null
    );

    // Se o Modo de Construção estiver ativo, atualiza a posição do holograma na frente do personagem
    if (this.buildingManager && this.buildingManager.getActiveItem()) {
      const frontDist = 4.0;
      const targetX = this.playerPos.x - Math.sin(this.playerRotationY) * frontDist;
      const targetZ = this.playerPos.z - Math.cos(this.playerRotationY) * frontDist;
      this.buildingManager.updatePreviewPosition(new THREE.Vector3(targetX, 0, targetZ));
    }
  }

  private updateCamera(delta: number) {
    if (this.targetCameraZoom !== null) {
      this.cameraZoom = THREE.MathUtils.damp(this.cameraZoom, this.targetCameraZoom, 5.5, delta);
      if (Math.abs(this.cameraZoom - this.targetCameraZoom) < 0.03) {
        this.cameraZoom = this.targetCameraZoom;
        this.targetCameraZoom = null;
      }
    }

    if (this.targetAerialPitch !== null) {
      this.cameraAngles.pitch = THREE.MathUtils.damp(this.cameraAngles.pitch, this.targetAerialPitch, 5.5, delta);
      if (Math.abs(this.cameraAngles.pitch - this.targetAerialPitch) < 0.015) {
        this.cameraAngles.pitch = this.targetAerialPitch;
        this.targetAerialPitch = null;
      }
    }

    if (this.targetCameraYaw !== null) {
      let yawDiff = this.targetCameraYaw - this.cameraAngles.yaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      const step = yawDiff * (1 - Math.exp(-6.5 * delta));
      this.cameraAngles.yaw += step;
      if (Math.abs(yawDiff) < 0.015) {
        this.cameraAngles.yaw = this.targetCameraYaw;
        this.targetCameraYaw = null;
      }
    }

    if (this.targetCameraPanOffset !== null) {
      this.cameraPanOffset.x = THREE.MathUtils.damp(this.cameraPanOffset.x, this.targetCameraPanOffset.x, 7.0, delta);
      this.cameraPanOffset.z = THREE.MathUtils.damp(this.cameraPanOffset.z, this.targetCameraPanOffset.z, 7.0, delta);
      if (this.cameraPanOffset.distanceTo(this.targetCameraPanOffset) < 0.08) {
        this.cameraPanOffset.copy(this.targetCameraPanOffset);
        this.targetCameraPanOffset = null;
      }
    } else if (this.cameraZoom < 1.35 && this.cameraPanOffset.lengthSq() > 0.01 && (this.playerVelocity.lengthSq() > 0.25 || this.isInCar || this.isDrivingMoto)) {
      this.cameraPanOffset.x = THREE.MathUtils.damp(this.cameraPanOffset.x, 0, 5.0, delta);
      this.cameraPanOffset.z = THREE.MathUtils.damp(this.cameraPanOffset.z, 0, 5.0, delta);
    }

    let camDist = 3.8 * this.cameraZoom;

    if (this.isInCar && this.currentPassengerCar) {
      camDist = Math.min(520, (this.cameraZoom >= 12 ? 3.8 : 6.4) * this.cameraZoom);
      if (this.cameraZoom < 2.6 && this.cameraPanOffset.lengthSq() < 0.5) {
        const targetYaw = this.currentPassengerCar.rotationY + Math.PI;
        this.cameraAngles.yaw = THREE.MathUtils.damp(this.cameraAngles.yaw, targetYaw, 3.5, delta);
      }
    } else if (this.isDrivingMoto && this.currentMotorcycle) {
      camDist = Math.min(520, (this.cameraZoom >= 12 ? 3.8 : 5.4) * this.cameraZoom);
      if (this.cameraZoom < 2.6 && this.cameraPanOffset.lengthSq() < 0.5) {
        const targetYaw = this.currentMotorcycle.rotationY + Math.PI;
        this.cameraAngles.yaw = THREE.MathUtils.damp(this.cameraAngles.yaw, targetYaw, 4.2, delta);
      }
    }

    // LOD baseado na distância da câmera: esconde micro detalhes quando longe para manter 60 FPS no celular
    this.cityScene.setCameraDistanceLOD?.(camDist);

    // Expande alcance de renderização quando afastado para ver todos os 7 bairros e o mar de cima sem cortes
    const baseFar = this.performanceMode === 'baixo' ? 280 : this.performanceMode === 'medio' ? 380 : 480;
    const neededFar = Math.max(baseFar, camDist + 650);
    if (Math.abs(this.camera.far - neededFar) > 8) {
      this.camera.far = neededFar;
      this.camera.updateProjectionMatrix();
    }

    const targetLookAt = new THREE.Vector3(
      this.playerPos.x + this.cameraPanOffset.x,
      this.playerPos.y + (this.isInCar || this.isDrivingMoto ? 1.1 : 0.85),
      this.playerPos.z + this.cameraPanOffset.z
    );

    const pitch = this.cameraAngles.pitch;
    const yaw = this.cameraAngles.yaw;

    const desiredCamPos = new THREE.Vector3(
      targetLookAt.x - Math.sin(yaw) * Math.cos(pitch) * camDist,
      targetLookAt.y + Math.sin(pitch) * camDist,
      targetLookAt.z - Math.cos(yaw) * Math.cos(pitch) * camDist
    );

    // Efeito de tremor de câmera ao bater veículo ou pular
    if (this.cameraShake > 0.001) {
      desiredCamPos.x += (Math.random() - 0.5) * this.cameraShake;
      desiredCamPos.y += (Math.random() - 0.5) * this.cameraShake;
      desiredCamPos.z += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 3.0);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredCamPos.x, 14, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desiredCamPos.y, 14, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredCamPos.z, 14, delta);

    this.camera.lookAt(targetLookAt);
  }

  private checkCoinPickups() {
    this.cityScene.coins.forEach((coin) => {
      if (coin.collected) return;
      const d = this.playerPos.distanceTo(coin.position);
      if (d < 1.6) {
        coin.collected = true;
        coin.mesh.visible = false;
        economyManager.addFunds('gold', coin.value, 'Moeda coletada no mapa');
        this.money = economyManager.getWallet().gold;
        this.coinsCollected++;
        soundManager.playCoinCollect();

        this.checkMissionProgress(5, this.coinsCollected);
        this.callbacks.onCoinCollected(coin.value, this.money);
      }
    });
  }

  private checkCityMissionProximity() {
    // Missão 3: Chegou dentro/na frente de qualquer Supermercado / Mercadinho
    if (!this.missions[2].completed) {
      const distMerc1 = Math.hypot(this.playerPos.x - (-20), this.playerPos.z - 22);
      const distMerc2 = Math.hypot(this.playerPos.x - (-90), this.playerPos.z - 148);
      const distMerc3 = Math.hypot(this.playerPos.x - (-210), this.playerPos.z - (-150));
      if (distMerc1 < 8.5 || distMerc2 < 9.5 || distMerc3 < 10.5) {
        this.checkMissionProgress(3, 1);
      }
    }
    // Missão 4: Chegou no Shopping Center no Bairro Novo
    if (!this.missions[3].completed) {
      const distShopping = Math.hypot(this.playerPos.x - 90, this.playerPos.z - (-90));
      if (distShopping < 18.0) {
        this.checkMissionProgress(4, 1);
      }
    }
  }

  // Saudação por voz em português quando Theo Lucca se aproxima das pessoas na cidade
  private checkNPCVoiceGreetings() {
    for (const npc of this.cityScene.npcs) {
      const d = npc.group.position.distanceTo(this.playerPos);
      if (d < 4.5) {
        const tipsList = npc.tips && npc.tips.length > 0 ? npc.tips : [npc.phrase];
        const randomTip = tipsList[Math.floor(Math.random() * tipsList.length)];
        const spoke = cityVoiceManager.speak(npc.name, randomTip, npc.gender || 'male', false);
        if (spoke) {
          this.dialogueText = `${npc.name}: "${randomTip}"`;
          this.dialogueTimer = 5.5;
        }
        if (npc.name.includes('Padre')) {
          this.checkMissionProgress(1, 1);
        } else if (npc.name.includes('Policial')) {
          this.checkMissionProgress(2, 1);
        }
        break;
      }
    }
  }

  // Define destino do GPS quando o jogador clica no mapa
  public setGPSDestination(x: number, z: number, name: string) {
    const dest = new THREE.Vector3(x, 0, z);
    this.customGPSDestination = { x, z, name };
    this.cityScene.setBeaconPosition(dest);
    this.dialogueText = `GPS: Destino marcado para ${name}! Siga o feixe dourado!`;
    this.dialogueTimer = 4.0;
  }

  private checkCourseCollectibles() {
    for (const item of this.phasesManager.courseItems) {
      if (!item.collected && item.phase === this.currentPhase) {
        const d = this.playerPos.distanceTo(item.position);
        if (d < 2.0) {
          item.collected = true;
          item.mesh.visible = false;
          soundManager.playItemPickup();

          const newItem: BackpackItem = {
            id: item.id,
            name: item.name,
            category: item.category,
            price: 0,
            icon: item.icon,
            description: item.description,
          };
          this.backpack.push(newItem);
          this.callbacks.onItemPurchased(newItem);

          this.dialogueText = `🎒 OBA! Guardou ${item.name} na sua Mochila!`;
          this.dialogueTimer = 4.5;
        }
      }
    }
  }

  private checkPhaseMissionsAndTeleport(delta: number) {
    if (this.teleportCooldown > 0) {
      this.teleportCooldown -= delta;
    }

    // FASE 2: Coleta de Diamantes
    if (this.currentPhase === 2) {
      for (const d of this.phasesManager.diamonds) {
        if (!d.collected) {
          const dist = this.playerPos.distanceTo(d.position);
          if (dist < 2.2) {
            d.collected = true;
            d.mesh.visible = false;
            this.collectedDiamonds++;
            soundManager.playDiamondCollect();
            economyManager.addFunds('diamonds', 1, 'Diamante coletado no Mundo dos Diamantes');
            this.callbacks.onCoinCollected(10, this.coinsCollected);

            this.dialogueText = `💎 Diamante Mágico coletado! (${this.collectedDiamonds}/${this.totalDiamonds})`;
            this.dialogueTimer = 3.5;

            if (this.collectedDiamonds >= this.totalDiamonds) {
              soundManager.playMissionComplete();
              economyManager.addFunds('diamonds', 5, 'Bônus de conclusão do Mundo dos Diamantes');
              economyManager.addFunds('emeralds', 2, 'Bônus Premium de Fase Concluída');
              this.callbacks.onMissionCompleted('Mundo dos Diamantes', 100);
              const portalPos = this.phasesManager.activateLightTubeForCurrentPhase();
              this.cityScene.setBeaconPosition(portalPos);
              this.dialogueText = '✨ INCRÍVEL! TODOS OS 8 DIAMANTES COLETADOS! Entre no TUBO DE LUZ para ir para o VALE DE AVARITIA! 🌀';
              this.dialogueTimer = 10.0;
            }
          }
        }
      }
    }

    // FASE 3: Coleta de Avaritia
    if (this.currentPhase === 3) {
      for (const a of this.phasesManager.avaritiaRelics) {
        if (!a.collected) {
          const dist = this.playerPos.distanceTo(a.position);
          if (dist < 2.2) {
            a.collected = true;
            a.mesh.visible = false;
            this.collectedAvaritia++;
            soundManager.playAvaritiaCollect();
            economyManager.addFunds('gold', 15, 'Relíquia de Avaritia coletada');
            this.money = economyManager.getWallet().gold;
            this.callbacks.onCoinCollected(15, this.coinsCollected);

            this.dialogueText = `✨ Relíquia de Avaritia coletada! (${this.collectedAvaritia}/${this.totalAvaritia})`;
            this.dialogueTimer = 3.5;

            if (this.collectedAvaritia >= this.totalAvaritia) {
              soundManager.playMissionComplete();
              economyManager.addFunds('gold', 150, 'Bônus de Vitória em Avaritia');
              economyManager.addFunds('emeralds', 5, 'Bônus Premium Vitória Avaritia');
              this.money = economyManager.getWallet().gold;
              this.callbacks.onMissionCompleted('Vale Dourado de Avaritia', 150);
              const portalPos = this.phasesManager.activateLightTubeForCurrentPhase();
              this.cityScene.setBeaconPosition(portalPos);
              this.dialogueText = '🏆 VITÓRIA TOTAL! VOCÊ CONQUISTOU TODAS AS FASES! Entre no TUBO DE LUZ para celebrar com Theo Lucca! 🌟';
              this.dialogueTimer = 12.0;
            }
          }
        }
      }
    }

    // Checagem de entrada no TUBO DE LUZ
    if (this.phasesManager.lightTube.isActive() && this.teleportCooldown <= 0) {
      const portalPos = this.phasesManager.lightTube.getPosition();
      const dist = this.playerPos.distanceTo(portalPos);
      if (dist < 2.6) {
        // TELETRANSPORTE!
        this.teleportCooldown = 4.0;
        soundManager.playTeleportSound();

        // Se estiver em veículo, sai antes
        if (this.isInCar || this.isDrivingMoto) {
          this.toggleCarRide();
        }

        if (this.currentPhase === 1) {
          // Fase 1 -> Fase 2
          this.currentPhase = 2;
          const spawn = this.phasesManager.switchPhase(2);
          this.playerPos.copy(spawn);
          this.playerVelocity.set(0, 0, 0);
          this.dialogueText = '✨ BEM-VINDO AO MUNDO DOS DIAMANTES! Colete 8 Diamantes e pegue os brinquedos pelo caminho!';
          this.dialogueTimer = 8.0;
          this.cityScene.setBeaconPosition(null);
        } else if (this.currentPhase === 2) {
          // Fase 2 -> Fase 3
          this.currentPhase = 3;
          const spawn = this.phasesManager.switchPhase(3);
          this.playerPos.copy(spawn);
          this.playerVelocity.set(0, 0, 0);
          this.dialogueText = '✨ BEM-VINDO AO VALE DOURADO DE AVARITIA! Colete 8 Relíquias no Templo do Sol!';
          this.dialogueTimer = 8.0;
          this.cityScene.setBeaconPosition(null);
        } else if (this.currentPhase === 3) {
          // Retorna à Cidade Real como Campeão
          this.currentPhase = 1;
          const spawn = this.phasesManager.switchPhase(1);
          this.playerPos.copy(spawn);
          this.playerVelocity.set(0, 0, 0);
          this.dialogueText = '🏆 BEM-VINDO DE VOLTA À CIDADE REAL! Você é o Super Campeão Theo Lucca!';
          this.dialogueTimer = 8.0;
          this.cityScene.setBeaconPosition(null);
        }
      }
    }
  }

  public switchPhase(phase: 1 | 2 | 3) {
    if (this.isInCar || this.isDrivingMoto) {
      this.toggleCarRide();
    }
    this.currentPhase = phase;
    const spawn = this.phasesManager.switchPhase(phase);
    this.playerPos.copy(spawn);
    this.playerVelocity.set(0, 0, 0);
    this.teleportCooldown = 2.0;
    this.cityScene.setBeaconPosition(null);
  }

  public activateLightTube() {
    const portalPos = this.phasesManager.activateLightTubeForCurrentPhase();
    this.cityScene.setBeaconPosition(portalPos);
    this.dialogueText = '🌀 TUBO DE LUZ ATIVADO! Entre no feixe de luz para ir para a próxima fase!';
    this.dialogueTimer = 6.0;
  }

  public getDefaultMissionTarget(): { x: number; z: number; name: string } {
    switch (this.currentMissionIndex) {
      case 0:
        return { x: 4.5, z: 16, name: 'Igreja Matriz (Padre Antônio)' };
      case 1:
        return { x: 45, z: 10, name: 'Delegacia (Policial Marcos)' };
      case 2:
        return { x: -20, z: 22, name: 'Mercadinho Central (Compras)' };
      case 3:
        return { x: 90, z: -90, name: 'Shopping Center (Bairro Novo)' };
      case 4:
      default:
        return { x: 0, z: 0, name: 'Avenida Central (Moedas)' };
    }
  }

  private dispatchHUDData() {
    let nearestLoc = this.getNearestLocation();

    // Carro mais próximo
    let nearestCar: { name: string; dist: number } | null = null;
    let minCarDist = 999;
    for (const car of this.cityScene.cars) {
      const d = car.group.position.distanceTo(this.playerPos);
      if (d < minCarDist) {
        minCarDist = d;
        nearestCar = { name: car.colorName, dist: d };
      }
    }

    // Moto mais próxima
    let nearestMoto: { name: string; dist: number } | null = null;
    let minMotoDist = 999;
    for (const moto of this.cityScene.motorcycles) {
      const d = moto.group.position.distanceTo(this.playerPos);
      if (d < minMotoDist) {
        minMotoDist = d;
        nearestMoto = { name: moto.colorName, dist: d };
      }
    }

    // NPC mais próximo
    let nearestNPC: { name: string; role: string; phrase: string; dist: number } | null = null;
    let minNPCDist = 999;
    for (const npc of this.cityScene.npcs) {
      const d = npc.group.position.distanceTo(this.playerPos);
      if (d < minNPCDist) {
        minNPCDist = d;
        nearestNPC = { name: npc.name, role: npc.role, phrase: npc.phrase, dist: d };
      }
    }

    const isLightTubeActive = this.phasesManager.lightTube.isActive();
    const lightTubeDist = isLightTubeActive
      ? this.playerPos.distanceTo(this.phasesManager.lightTube.getPosition())
      : 999;

    // Alvo do Objetivo / GPS (sempre ativo para guiar o Theo Lucca)
    let targetBeaconPos: { x: number; z: number; name?: string } | null = null;
    if (this.activeJob) {
      targetBeaconPos = { x: this.activeJob.targetPos.x, z: this.activeJob.targetPos.z, name: this.activeJob.targetName };
    } else if (this.customGPSDestination) {
      targetBeaconPos = this.customGPSDestination;
    } else if (isLightTubeActive) {
      const pos = this.phasesManager.lightTube.getPosition();
      targetBeaconPos = { x: pos.x, z: pos.z, name: 'Tubo de Luz (Portal)' };
    } else {
      targetBeaconPos = this.getDefaultMissionTarget();
    }

    const distanceToTarget = targetBeaconPos
      ? Math.hypot(this.playerPos.x - targetBeaconPos.x, this.playerPos.z - targetBeaconPos.z)
      : (nearestLoc ? nearestLoc.dist : 0);

    let phaseName = 'Cidade Gigante 3D (7 Bairros)';
    let currentMission = this.missions[this.currentMissionIndex] || this.missions[0];
    let phaseTargetCount = this.coinsCollected;
    let phaseTargetTotal = this.cityScene.coins.length;

    if (this.currentPhase === 2) {
      phaseName = 'Mundo dos Diamantes Celestes';
      phaseTargetCount = this.collectedDiamonds;
      phaseTargetTotal = this.totalDiamonds;
      currentMission = {
        id: 201,
        title: 'Fase 2: Diamantes Mágicos',
        description: 'Colete 8 Diamantes Celestes flutuantes!',
        reward: 100,
        progress: this.collectedDiamonds,
        total: this.totalDiamonds,
        completed: this.collectedDiamonds >= this.totalDiamonds,
      };
    } else if (this.currentPhase === 3) {
      phaseName = 'Vale Dourado de Avaritia';
      phaseTargetCount = this.collectedAvaritia;
      phaseTargetTotal = this.totalAvaritia;
      currentMission = {
        id: 301,
        title: 'Fase 3: Relíquias de Avaritia',
        description: 'Colete 8 Relíquias de Avaritia no Templo do Sol!',
        reward: 150,
        progress: this.collectedAvaritia,
        total: this.totalAvaritia,
        completed: this.collectedAvaritia >= this.totalAvaritia,
      };
    }

    const activeVehicleName = this.isInCar
      ? (this.currentPassengerCar?.colorName || 'Carro')
      : (this.isDrivingMoto ? (this.currentMotorcycle?.colorName || 'Moto') : '');

    this.callbacks.onHUDUpdate({
      money: this.money,
      stamina: Math.round(this.currentStamina),
      isExhausted: this.isExhausted,
      coinsCollected: this.coinsCollected,
      totalCoins: this.cityScene.coins.length,
      backpack: this.backpack,
      activeJob: this.activeJob,
      currentMission,
      nearestLocation: nearestLoc,
      nearestNPC,
      nearestCar,
      nearestMoto,
      isInCar: this.isInCar || this.isDrivingMoto,
      isDrivingMoto: this.isDrivingMoto,
      carName: activeVehicleName,
      vehicleSpeed: Math.round(Math.abs(this.vehicleSpeed) * 3.6),
      dialogueText: this.dialogueText,
      distanceToTarget,
      currentPhase: this.currentPhase,
      phaseName,
      lightTubeActive: isLightTubeActive,
      lightTubeDist,
      phaseTargetCount,
      phaseTargetTotal,
      // Expansão Dinâmica da Cidade & Mini-mapa de Navegação GPS
      cityExpansionLevel: this.cityExpansionLevel,
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerRotationY: this.playerRotationY,
      targetBeaconPos,
      allLocations: this.cityScene.locations.map((l) => ({
        id: l.id,
        name: l.name,
        category: l.category,
        x: l.position.x,
        z: l.position.z,
      })),
      allNPCs: this.cityScene.npcs.map((n) => ({
        name: n.name,
        role: n.role,
        gender: n.gender || 'male',
        x: n.group.position.x,
        z: n.group.position.z,
      })),
      allCars: this.cityScene.cars.map((c) => ({
        x: c.group.position.x,
        z: c.group.position.z,
        colorName: c.colorName,
      })),
      allMotos: this.cityScene.motorcycles.map((m) => ({
        x: m.group.position.x,
        z: m.group.position.z,
        colorName: m.colorName,
      })),
      expansionAnnouncement: this.expansionAnnouncement,
      performanceMode: this.performanceMode,
      graphicQuality: this.performanceMode,
      isCarDented: this.isInCar && this.currentPassengerCar ? (this.currentPassengerCar.dentLevel || 0) > 0 : false,
      cameraZoom: this.cameraZoom,
      cameraPreset: this.cameraPreset,
      isCameraPanned: this.cameraPanOffset.lengthSq() > 1.5,
      dayCycleDurationSeconds: this.fullDayCycleSeconds,
      characterCustomization: this.characterCustomization,
      characterName: this.characterCustomization.name || 'Theo Lucca',
      // Sistema de Economia & Construção
      wallet: economyManager.getWallet(),
      isBuildModeActive: !!this.buildingManager?.getActiveItem(),
      buildModeItem: this.buildingManager?.getActiveItem() || null,
      isBuildPlacementValid: (this.buildingManager as any)?.isCurrentPlacementValid ?? true,
      nearestPlacedBuildingName: this.buildingManager?.getNearestPlacedBuilding(this.playerPos, 5.0)?.name || null,
      weather: this.getWeatherInfo(),
    });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.jump();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.isRunningInput = true;
    }
    if (e.code === 'KeyE' || e.code === 'KeyF') {
      // Tecla E ou F: Entrar/Sair do carro ou moto se estiver perto, ou interagir/trabalhar
      if (this.isInCar || this.isDrivingMoto) {
        this.toggleCarRide();
      } else {
        let nearVeh = false;
        for (const c of this.cityScene.cars) {
          if (c.group.position.distanceTo(this.playerPos) < 5.5) { nearVeh = true; break; }
        }
        if (!nearVeh) {
          for (const m of this.cityScene.motorcycles) {
            if (m.group.position.distanceTo(this.playerPos) < 5.5) { nearVeh = true; break; }
          }
        }
        if (nearVeh) {
          this.toggleCarRide();
        } else {
          this.tryInteractOrWork();
        }
      }
    }
    if (e.code === 'KeyH') {
      this.honkHorn();
    }
    if (e.code === 'KeyC') {
      this.toggleCarRide();
    }
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      this.zoomIn();
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      this.zoomOut();
    }
    if (e.code === 'KeyT') {
      this.cycleDayNightPeriod();
    }
    if (e.code === 'KeyV') {
      this.toggleAerialView();
    }
    if (e.code === 'KeyR') {
      this.resetCameraToNormal();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.isRunningInput = false;
    }
  };

  public applyPerformanceSettings(mode: 'baixo' | 'medio' | 'alto' | 'light' | 'normal') {
    let normalized: 'baixo' | 'medio' | 'alto' = 'baixo';
    if (mode === 'light' || mode === 'baixo') normalized = 'baixo';
    else if (mode === 'medio') normalized = 'medio';
    else if (mode === 'normal' || mode === 'alto') normalized = 'alto';

    this.performanceMode = normalized;
    safeSetItem('theo_lucca_perf_mode', normalized);

    if (!this.renderer || !this.camera) return;

    const camDist = 3.8 * this.cameraZoom;
    if (normalized === 'baixo') {
      // BAIXO (60 FPS Ultraleve): Sem sombras dinâmicas, renderização rápida para celulares Android
      this.renderer.shadowMap.enabled = false;
      if (this.cityScene?.sunLight) {
        this.cityScene.sunLight.castShadow = false;
      }
      this.camera.far = Math.max(280, camDist + 650);
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, this.isMobileDevice ? 1.15 : 1.25));
    } else if (normalized === 'medio') {
      // MÉDIO (Equilibrado): Sombras dinâmicas PCF 1024x1024 (ou 512x512 no celular)
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      if (this.cityScene?.sunLight) {
        this.cityScene.sunLight.castShadow = !this.isSoftwareGl;
        const mapDim = this.isMobileDevice ? 512 : 1024;
        this.cityScene.sunLight.shadow.mapSize.set(mapDim, mapDim);
      }
      this.camera.far = Math.max(380, camDist + 650);
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, this.isMobileDevice ? 1.35 : 1.5));
    } else {
      // ALTO (Godot / GTA Ultra): Sombras suaves PCFSoftShadowMap 2048x2048 (ou 1024x1024 no celular)
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.cityScene?.sunLight) {
        this.cityScene.sunLight.castShadow = !this.isSoftwareGl;
        const mapDim = this.isMobileDevice ? 1024 : 2048;
        this.cityScene.sunLight.shadow.mapSize.set(mapDim, mapDim);
        this.cityScene.sunLight.shadow.bias = -0.0003;
      }
      this.camera.far = Math.max(480, camDist + 650);
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, this.isMobileDevice ? 1.5 : 2.0));
    }
    this.camera.updateProjectionMatrix();
  }

  public setGraphicQuality(quality: 'baixo' | 'medio' | 'alto') {
    this.applyPerformanceSettings(quality);
    this.dialogueText = quality === 'baixo' 
      ? '⚡ Gráfico BAIXO (60 FPS Rápido) ativado!' 
      : quality === 'medio'
        ? '🎮 Gráfico MÉDIO (Sombras Balanceadas) ativado!'
        : '✨ Gráfico ALTO (Ultra Godot/GTA Realista) ativado!';
    this.dialogueTimer = 4.0;
    this.dispatchHUDData();
  }

  public togglePerformanceMode(): 'baixo' | 'medio' | 'alto' {
    const cycle: Record<'baixo' | 'medio' | 'alto', 'baixo' | 'medio' | 'alto'> = {
      baixo: 'medio',
      medio: 'alto',
      alto: 'baixo',
    };
    const nextMode = cycle[this.performanceMode] || 'baixo';
    this.setGraphicQuality(nextMode);
    return nextMode;
  }

  public getPerformanceMode(): 'baixo' | 'medio' | 'alto' {
    return this.performanceMode;
  }

  public updateCharacterCustomization(newCustom: CharacterCustomization) {
    this.characterCustomization = { ...newCustom };
    try {
      safeSetItem('theo_lucca_customization', JSON.stringify(newCustom));
    } catch {
      // ignore
    }
    this.player.applyCustomization(this.characterCustomization);
    this.dispatchHUDData();
  }

  public getCharacterCustomization(): CharacterCustomization {
    return { ...this.characterCustomization };
  }

  // --- MODO DE CONSTRUÇÃO E GERENCIAMENTO DE PRÉDIOS DO JOGADOR ---
  public startBuildingPlacement(item: InventoryItem) {
    if (!this.buildingManager) return;
    this.buildingManager.setExpansionLevel(this.cityExpansionLevel);
    const frontDist = 4.0;
    const targetX = this.playerPos.x - Math.sin(this.playerRotationY) * frontDist;
    const targetZ = this.playerPos.z - Math.cos(this.playerRotationY) * frontDist;
    this.buildingManager.startPlacingItem(item, new THREE.Vector3(targetX, 0, targetZ));
    this.dispatchHUDData();
  }

  public rotateBuildingPreview() {
    if (!this.buildingManager) return;
    this.buildingManager.rotatePreview();
    soundManager.playPopClick();
    this.dispatchHUDData();
  }

  public confirmBuildingPlacement() {
    if (!this.buildingManager) return { success: false, message: 'Gerenciador indisponível' };
    const res = this.buildingManager.confirmPlacement();
    if (res.success) {
      soundManager.playStarCollect();
      this.dialogueText = res.message;
      this.dialogueTimer = 4.0;
    } else {
      soundManager.playPopClick();
      this.dialogueText = res.message;
      this.dialogueTimer = 3.5;
    }
    this.dispatchHUDData();
    return res;
  }

  public cancelBuildingPlacement() {
    if (!this.buildingManager) return;
    this.buildingManager.cancelPlacing();
    soundManager.playPopClick();
    this.dispatchHUDData();
  }

  public dismantleNearestBuilding() {
    if (!this.buildingManager) return;
    const nearest = this.buildingManager.getNearestPlacedBuilding(this.playerPos, 5.0);
    if (!nearest) {
      this.dialogueText = 'Nenhuma construção própria por perto para recolher.';
      this.dialogueTimer = 3.0;
      return;
    }
    const res = this.buildingManager.removeBuilding(nearest.id);
    if (res.success) {
      soundManager.playPurchase();
      this.dialogueText = res.message;
      this.dialogueTimer = 4.0;
    }
    this.dispatchHUDData();
    return res;
  }

  public getBuildingManager(): BuildingManager {
    return this.buildingManager;
  }

  // --- SISTEMA DE CICLO DIA E NOITE GRADUAL + CLIMA DINÂMICO ---
  private static readonly DAY_NIGHT_KEYFRAMES = [
    { h: 0.0, sky: 0x080f1e, fog: 0x0b1528, fogD: 0.0068, sun: 0x93c5fd, sunI: 0.36, hSky: 0x1e293b, hGnd: 0x090f1d, hI: 0.44, cloud: 0x334155, exp: 0.90 },
    { h: 5.0, sky: 0x1e1b4b, fog: 0x312e81, fogD: 0.0072, sun: 0xfdba74, sunI: 0.55, hSky: 0x475569, hGnd: 0x1e293b, hI: 0.55, cloud: 0x94a3b8, exp: 0.96 },
    { h: 6.5, sky: 0xfb923c, fog: 0xfdba74, fogD: 0.0065, sun: 0xfed7aa, sunI: 1.65, hSky: 0xfef3c7, hGnd: 0x475569, hI: 0.85, cloud: 0xfed7aa, exp: 1.06 },
    { h: 9.0, sky: 0x60a5fa, fog: 0x93c5fd, fogD: 0.0052, sun: 0xfff8ea, sunI: 2.75, hSky: 0xfffbeb, hGnd: 0x0284c7, hI: 1.15, cloud: 0xffffff, exp: 1.15 },
    { h: 15.5, sky: 0x60a5fa, fog: 0x93c5fd, fogD: 0.0052, sun: 0xfff3d6, sunI: 2.55, hSky: 0xfffbeb, hGnd: 0x0284c7, hI: 1.10, cloud: 0xffffff, exp: 1.14 },
    { h: 17.75, sky: 0xea580c, fog: 0xfb923c, fogD: 0.0075, sun: 0xfdba74, sunI: 1.35, hSky: 0xfed7aa, hGnd: 0x334155, hI: 0.80, cloud: 0xfdba74, exp: 1.02 },
    { h: 19.25, sky: 0x1e1b4b, fog: 0x1e293b, fogD: 0.0070, sun: 0x93c5fd, sunI: 0.50, hSky: 0x334155, hGnd: 0x0f172a, hI: 0.50, cloud: 0x475569, exp: 0.92 },
    { h: 21.0, sky: 0x080f1e, fog: 0x0b1528, fogD: 0.0068, sun: 0x93c5fd, sunI: 0.36, hSky: 0x1e293b, hGnd: 0x090f1d, hI: 0.44, cloud: 0x334155, exp: 0.90 },
    { h: 24.0, sky: 0x080f1e, fog: 0x0b1528, fogD: 0.0068, sun: 0x93c5fd, sunI: 0.36, hSky: 0x1e293b, hGnd: 0x090f1d, hI: 0.44, cloud: 0x334155, exp: 0.90 },
  ];

  private scratchColorA = new THREE.Color();
  private scratchColorB = new THREE.Color();

  private getDayPhaseFromHour(h: number): 'dawn' | 'day' | 'sunset' | 'night' {
    if (h >= 5.25 && h < 7.25) return 'dawn';
    if (h >= 7.25 && h < 16.75) return 'day';
    if (h >= 16.75 && h < 19.0) return 'sunset';
    return 'night';
  }

  private formatClockHour(h: number): string {
    const normalized = ((h % 24) + 24) % 24;
    const hrs = Math.floor(normalized);
    const mins = Math.floor((normalized - hrs) * 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  private updateDayNightCycle(delta: number) {
    if (this.targetDayTimeHours !== null) {
      let diff = (this.targetDayTimeHours - this.dayTimeHours + 24) % 24;
      if (diff < 0.08 || diff > 23.92) {
        this.dayTimeHours = this.targetDayTimeHours;
        this.targetDayTimeHours = null;
      } else {
        const step = Math.min(diff, delta * 3.8);
        this.dayTimeHours = (this.dayTimeHours + step) % 24;
      }
    } else {
      const autoEnabled = this.weatherManager ? this.weatherManager.getAutoCycle() : true;
      if (autoEnabled) {
        this.dayTimeHours = (this.dayTimeHours + (24 / this.fullDayCycleSeconds) * delta) % 24;
      }
    }

    const h = this.dayTimeHours;
    const frames = GameEngine.DAY_NIGHT_KEYFRAMES;
    let k0 = frames[0];
    let k1 = frames[1];
    for (let i = 0; i < frames.length - 1; i++) {
      if (h >= frames[i].h && h <= frames[i + 1].h) {
        k0 = frames[i];
        k1 = frames[i + 1];
        break;
      }
    }
    const span = Math.max(0.001, k1.h - k0.h);
    const t = THREE.MathUtils.clamp((h - k0.h) / span, 0, 1);

    const camDist = 3.8 * this.cameraZoom;
    const fogDistScale = camDist > 60 ? Math.max(0.055, 24 / camDist) : 1.0;
    this.dayCycleLighting.skyColor.lerpColors(this.scratchColorA.setHex(k0.sky), this.scratchColorB.setHex(k1.sky), t);
    this.dayCycleLighting.fogColor.lerpColors(this.scratchColorA.setHex(k0.fog), this.scratchColorB.setHex(k1.fog), t);
    this.dayCycleLighting.fogDensity = THREE.MathUtils.lerp(k0.fogD, k1.fogD, t) * fogDistScale;
    this.dayCycleLighting.sunColor.lerpColors(this.scratchColorA.setHex(k0.sun), this.scratchColorB.setHex(k1.sun), t);
    this.dayCycleLighting.sunIntensity = THREE.MathUtils.lerp(k0.sunI, k1.sunI, t);
    this.dayCycleLighting.skyLightColor.lerpColors(this.scratchColorA.setHex(k0.hSky), this.scratchColorB.setHex(k1.hSky), t);
    this.dayCycleLighting.groundLightColor.lerpColors(this.scratchColorA.setHex(k0.hGnd), this.scratchColorB.setHex(k1.hGnd), t);
    this.dayCycleLighting.skyLightIntensity = THREE.MathUtils.lerp(k0.hI, k1.hI, t);
    this.dayCycleLighting.cloudTint.lerpColors(this.scratchColorA.setHex(k0.cloud), this.scratchColorB.setHex(k1.cloud), t);
    this.dayCycleLighting.isNight = h >= 18.6 || h < 5.75;
    this.dayCycleExposure = THREE.MathUtils.lerp(k0.exp, k1.exp, t);

    // Arco orbital gradual do Sol / Lua no céu 3D
    if (this.cityScene?.sunLight) {
      const sunAngle = ((h - 6) / 24) * Math.PI * 2;
      this.cityScene.sunLight.position.set(
        Math.cos(sunAngle) * 56,
        Math.max(10, Math.sin(sunAngle) * 62),
        26 + Math.sin(sunAngle * 0.5) * 14
      );
    }

    const phase = this.getDayPhaseFromHour(h);
    if (phase !== this.lastDayPhase) {
      this.lastDayPhase = phase;
      if (phase === 'sunset') {
        this.dialogueText = '🌇 Entardecer dourado na Cidade Real! O sol está se pondo.';
        this.dialogueTimer = 4.0;
      } else if (phase === 'night') {
        this.dialogueText = '🌙 A noite chegou! Postes e faróis dos carros acesos!';
        this.dialogueTimer = 4.5;
      } else if (phase === 'dawn') {
        this.dialogueText = '🌅 Bom dia! O sol está nascendo na Cidade Real!';
        this.dialogueTimer = 4.0;
      } else {
        this.dialogueText = '☀️ Dia ensolarado! Ótimo momento para explorar a cidade!';
        this.dialogueTimer = 3.5;
      }
      this.dispatchHUDData();
    }
  }

  public cycleDayNightPeriod() {
    const phase = this.getDayPhaseFromHour(this.dayTimeHours);
    if (phase === 'dawn') {
      this.targetDayTimeHours = 11.0;
    } else if (phase === 'day') {
      this.targetDayTimeHours = 17.6;
    } else if (phase === 'sunset') {
      this.targetDayTimeHours = 21.5;
    } else {
      this.targetDayTimeHours = 6.2;
    }
    soundManager.playPopClick();
    this.dispatchHUDData();
  }

  public setTimeOfDay(hours: number, smooth: boolean = true) {
    const target = ((hours % 24) + 24) % 24;
    if (smooth) {
      this.targetDayTimeHours = target;
    } else {
      this.dayTimeHours = target;
      this.targetDayTimeHours = null;
      this.updateDayNightCycle(0);
    }
    this.dispatchHUDData();
  }

  public getDayTimeHours(): number {
    return this.dayTimeHours;
  }

  public setDayCycleDurationSeconds(seconds: number) {
    this.fullDayCycleSeconds = THREE.MathUtils.clamp(Math.round(seconds), 120, 3600);
    safeSetItem('theo_lucca_day_cycle_sec', String(this.fullDayCycleSeconds));
    soundManager.playPopClick();
    this.dispatchHUDData();
  }

  public getDayCycleDurationSeconds(): number {
    return this.fullDayCycleSeconds;
  }

  // --- MÉTODOS DO SISTEMA DE CLIMA DINÂMICO ---
  public setWeather(type: WeatherType) {
    if (this.weatherManager) {
      if (type === 'night') {
        this.targetDayTimeHours = 21.5;
      } else if (type === 'sunny' && (this.dayTimeHours >= 18.5 || this.dayTimeHours < 6.0)) {
        this.targetDayTimeHours = 11.0;
      }
      this.weatherManager.setWeather(type, true);
      this.dispatchHUDData();
    }
  }

  public toggleWeather(): WeatherType {
    if (this.weatherManager) {
      const next = this.weatherManager.toggleWeather();
      this.dispatchHUDData();
      return next;
    }
    return 'sunny';
  }

  public setWeatherAutoCycle(enabled: boolean) {
    if (this.weatherManager) {
      this.weatherManager.setAutoCycle(enabled);
      this.dispatchHUDData();
    }
  }

  public getWeatherInfo(): WeatherStateInfo {
    const base = this.weatherManager ? this.weatherManager.getWeatherInfo() : {
      type: 'sunny' as WeatherType,
      name: 'Ensolarado',
      icon: '☀️',
      description: 'Dia radiante com sol dourado e céu azul límpido',
      autoCycle: true,
    };

    const h = this.dayTimeHours;
    const dayPhase = this.getDayPhaseFromHour(h);
    const isNight = dayPhase === 'night' || h >= 18.6 || h < 5.75;
    const formattedTime = this.formatClockHour(h);

    let icon = base.icon;
    let name = base.name;
    let dayPhaseLabel = 'Dia';

    if (dayPhase === 'dawn') dayPhaseLabel = 'Amanhecer';
    else if (dayPhase === 'day') dayPhaseLabel = 'Dia';
    else if (dayPhase === 'sunset') dayPhaseLabel = 'Entardecer';
    else dayPhaseLabel = 'Noite';

    if (base.type === 'rainy') {
      icon = '🌧️';
      name = isNight ? 'Chuva Noturna' : 'Chuvoso';
    } else if (base.type === 'cloudy') {
      icon = isNight ? '☁️' : '⛅';
      name = isNight ? 'Noite Nublada' : 'Nublado';
    } else if (dayPhase === 'dawn') {
      icon = '🌅';
      name = 'Amanhecer';
    } else if (dayPhase === 'sunset') {
      icon = '🌇';
      name = 'Entardecer';
    } else if (dayPhase === 'night') {
      icon = '🌙';
      name = 'Noite Estrelada';
    } else {
      icon = '☀️';
      name = 'Ensolarado';
    }

    return {
      ...base,
      icon,
      name,
      timeOfDay: h,
      formattedTime,
      dayPhase,
      dayPhaseLabel,
      isNight,
    };
  }

  public getWeatherManager(): WeatherManager {
    return this.weatherManager;
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.pause();
  };

  private onContextRestored = () => {
    this.onWindowResize();
    this.resume();
  };

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    const maxDpr = this.isSoftwareGl
      ? 1
      : this.isMobileDevice
        ? (this.performanceMode === 'baixo' ? 1.15 : this.performanceMode === 'medio' ? 1.35 : 1.5)
        : (this.performanceMode === 'baixo' ? 1.25 : this.performanceMode === 'medio' ? 1.5 : 2.0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  };

  public pause() {
    this.isPaused = true;
    soundManager.pauseAll();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.frameId = 0;
  }

  public resume() {
    if (this.isDestroyed) return;
    this.onWindowResize();
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    soundManager.resumeAll();
    if (!this.frameId) {
      if (this.isSoftwareGl) {
        this.afterDraw(this.tick);
      } else {
        this.frameId = requestAnimationFrame(this.tick);
      }
    }
  }

  public destroy() {
    this.pause();
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    this.container?.removeEventListener('wheel', this.onWheel);
    this.container?.removeEventListener('touchstart', this.onTouchStart);
    this.container?.removeEventListener('touchmove', this.onTouchMove);
    this.container?.removeEventListener('touchend', this.onTouchEnd);

    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
      this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);
    }

    this.pmrem?.dispose();
    this.weatherManager?.dispose();
    this.renderer?.dispose();

    if (this.renderer?.domElement?.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
