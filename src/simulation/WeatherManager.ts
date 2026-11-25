import * as THREE from 'three';
import { soundManager } from './audio';

export type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'night';

export interface WeatherPreset {
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  skyLightColor: THREE.Color;
  groundLightColor: THREE.Color;
  skyLightIntensity: number;
  cloudColor: THREE.Color;
  cloudOpacity: number;
  rainIntensity: number;
}

export interface WeatherStateInfo {
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  autoCycle: boolean;
  timeUntilNextCycle?: number;
  timeOfDay?: number;
  formattedTime?: string;
  dayPhase?: 'dawn' | 'day' | 'sunset' | 'night';
  dayPhaseLabel?: string;
  isNight?: boolean;
}

export interface DayCycleLighting {
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  skyLightColor: THREE.Color;
  groundLightColor: THREE.Color;
  skyLightIntensity: number;
  cloudTint: THREE.Color;
  isNight: boolean;
}

export class WeatherManager {
  private scene: THREE.Scene;
  private sunLight: THREE.DirectionalLight;
  private skyLight: THREE.HemisphereLight;

  private currentWeather: WeatherType = 'sunny';
  private targetWeather: WeatherType = 'sunny';
  private weatherPhase: 'sunny' | 'clouding_over' | 'raining' | 'clearing_up' | 'night' = 'sunny';
  private autoCycle: boolean = true;
  private cycleTimer: number = 420; // Inicia ensolarado por ~7 minutos para acompanhar o ciclo longo de dia e noite
  private wasNight: boolean = false;
  private onNightStateChanged?: (isNight: boolean) => void;

  // Presets detalhados para cada condição climática
  private presets: Record<WeatherType, WeatherPreset> = {
    sunny: {
      type: 'sunny',
      name: 'Ensolarado',
      icon: '☀️',
      description: 'Dia radiante com sol dourado e céu azul límpido na Cidade Real',
      skyColor: new THREE.Color(0x60a5fa), // Azul vivo diurno
      fogColor: new THREE.Color(0x93c5fd), // Névoa suave de horizonte
      fogDensity: 0.0052,
      sunColor: new THREE.Color(0xfff8ea), // Sol dourado quente
      sunIntensity: 2.75,
      skyLightColor: new THREE.Color(0xfffbeb),
      groundLightColor: new THREE.Color(0x0284c7),
      skyLightIntensity: 1.15,
      cloudColor: new THREE.Color(0xffffff),
      cloudOpacity: 0.55,
      rainIntensity: 0.0,
    },
    cloudy: {
      type: 'cloudy',
      name: 'Nublado',
      icon: '☁️',
      description: 'Céu acinzentado com densa camada de nuvens e iluminação difusa',
      skyColor: new THREE.Color(0x768798), // Cinza azulado
      fogColor: new THREE.Color(0x8a9cae),
      fogDensity: 0.0095,
      sunColor: new THREE.Color(0xd1d5db), // Sol prateado difuso
      sunIntensity: 1.15,
      skyLightColor: new THREE.Color(0xdbeafe),
      groundLightColor: new THREE.Color(0x475569),
      skyLightIntensity: 0.85,
      cloudColor: new THREE.Color(0xcad5e2),
      cloudOpacity: 0.92,
      rainIntensity: 0.0,
    },
    rainy: {
      type: 'rainy',
      name: 'Chuvoso',
      icon: '🌧️',
      description: 'Chuva refrescante com trovões, gotas reflexivas e clima úmido',
      skyColor: new THREE.Color(0x2d3748), // Escuro tempestuoso
      fogColor: new THREE.Color(0x3f4b59),
      fogDensity: 0.0175,
      sunColor: new THREE.Color(0x64748b), // Luz muito atenuada
      sunIntensity: 0.55,
      skyLightColor: new THREE.Color(0x4b5563),
      groundLightColor: new THREE.Color(0x1e293b),
      skyLightIntensity: 0.58,
      cloudColor: new THREE.Color(0x475569),
      cloudOpacity: 0.98,
      rainIntensity: 1.0,
    },
    night: {
      type: 'night',
      name: 'Noite Estrelada',
      icon: '🌙',
      description: 'Noite com luar sereno, estrelas e iluminação urbana de postes e faróis',
      skyColor: new THREE.Color(0x080f1e), // Azul marinho escuro noturno
      fogColor: new THREE.Color(0x0b1528),
      fogDensity: 0.0065,
      sunColor: new THREE.Color(0x93c5fd), // Luar prateado
      sunIntensity: 0.35,
      skyLightColor: new THREE.Color(0x1e293b),
      groundLightColor: new THREE.Color(0x090f1d),
      skyLightIntensity: 0.45,
      cloudColor: new THREE.Color(0x1e293b),
      cloudOpacity: 0.3,
      rainIntensity: 0.0,
    },
  };

  // Valores interpolados dinâmicos
  private currentSkyColor = new THREE.Color(0x60a5fa);
  private currentFogColor = new THREE.Color(0x93c5fd);
  private currentFogDensity = 0.0052;
  private currentSunColor = new THREE.Color(0xfff8ea);
  private currentSunIntensity = 2.75;
  private currentSkyLightColor = new THREE.Color(0xfffbeb);
  private currentGroundLightColor = new THREE.Color(0x0284c7);
  private currentSkyLightIntensity = 1.15;
  private currentCloudColor = new THREE.Color(0xffffff);
  private currentCloudOpacity = 0.55;
  private currentRainIntensity = 0.0;

  // Sistema de Nuvens Procedurais 3D
  private cloudsGroup: THREE.Group = new THREE.Group();
  private clouds: { mesh: THREE.Group; speed: number; rotSpeed: number }[] = [];
  private cloudMaterials: THREE.MeshStandardMaterial[] = [];

  // Sistema de Partículas de Chuva 3D
  private rainLines!: THREE.LineSegments;
  private rainGeometry!: THREE.BufferGeometry;
  private rainMaterial!: THREE.LineBasicMaterial;
  private readonly rainCount = 2600;
  private rainPositions!: Float32Array;
  private rainVelocities!: Float32Array;

  // Sistema de Respingos no Chão (Splashes)
  private splashMesh!: THREE.InstancedMesh;
  private readonly splashCount = 48;
  private splashData: { x: number; z: number; scale: number; life: number; maxLife: number }[] = [];
  private dummyMatrix = new THREE.Matrix4();
  private dummyPos = new THREE.Vector3();
  private dummyScale = new THREE.Vector3();

  // Sistema de Trovão & Relâmpago
  private lightningTimer = 16.0;
  private isLightningActive = false;
  private lightningFlashDuration = 0.0;
  private lightningBurstCount = 0;

  // Callbacks
  private onWeatherChangeCallback?: (info: WeatherStateInfo) => void;

  constructor(
    scene: THREE.Scene,
    sunLight: THREE.DirectionalLight,
    skyLight: THREE.HemisphereLight,
    onWeatherChange?: (info: WeatherStateInfo) => void
  ) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.skyLight = skyLight;
    this.onWeatherChangeCallback = onWeatherChange;

    this.initClouds();
    this.initRainSystem();
    this.initSplashes();

    // Aplica o clima inicial ensolarado
    this.applyWeatherInstant('sunny');
  }

  /**
   * Cria nuvens procedurais estilizadas no céu
   */
  private initClouds() {
    this.cloudsGroup.name = 'WeatherClouds';
    const puffGeo = new THREE.DodecahedronGeometry(1.0, 1);

    const cloudCount = 18;
    for (let i = 0; i < cloudCount; i++) {
      const cloudObj = new THREE.Group();
      const puffsInCloud = 4 + Math.floor(Math.random() * 4);

      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      this.cloudMaterials.push(mat);

      for (let p = 0; p < puffsInCloud; p++) {
        const puff = new THREE.Mesh(puffGeo, mat);
        const scale = 2.2 + Math.random() * 2.8;
        puff.scale.set(scale * 1.3, scale * 0.7, scale * 1.1);
        puff.position.set(
          (p - puffsInCloud / 2) * 2.2 + (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 2.5
        );
        cloudObj.add(puff);
      }

      // Distribui as nuvens em uma grande área no céu
      const angle = (i / cloudCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const radius = 25 + Math.random() * 75;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 30 + (i % 4) * 4 + Math.random() * 3;

      cloudObj.position.set(x, y, z);
      this.cloudsGroup.add(cloudObj);

      this.clouds.push({
        mesh: cloudObj,
        speed: 0.8 + Math.random() * 1.4,
        rotSpeed: (Math.random() - 0.5) * 0.015,
      });
    }

    this.scene.add(this.cloudsGroup);
  }

  /**
   * Cria o sistema de chuva 3D com milhares de estrias translúcidas
   */
  private initRainSystem() {
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 6); // 2 vértices (x,y,z) por estria
    this.rainVelocities = new Float32Array(this.rainCount);

    const halfBox = 36;
    for (let i = 0; i < this.rainCount; i++) {
      const idx = i * 6;
      const x = (Math.random() - 0.5) * halfBox * 2;
      const y = Math.random() * 26 + 1;
      const z = (Math.random() - 0.5) * halfBox * 2;
      const len = 0.55 + Math.random() * 0.25;

      // Ponto superior da gota
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;

      // Ponto inferior da gota (inclinado com o vento)
      this.rainPositions[idx + 3] = x - 0.06;
      this.rainPositions[idx + 4] = y - len;
      this.rainPositions[idx + 5] = z + 0.02;

      this.rainVelocities[i] = 24.0 + Math.random() * 8.0;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMaterial = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    this.rainLines = new THREE.LineSegments(this.rainGeometry, this.rainMaterial);
    this.rainLines.frustumCulled = false;
    this.scene.add(this.rainLines);
  }

  /**
   * Cria anéis concêntricos de respingos no chão durante a chuva
   */
  private initSplashes() {
    const ringGeo = new THREE.RingGeometry(0.08, 0.28, 12);
    ringGeo.rotateX(-Math.PI / 2); // Alinha com o plano horizontal do chão

    const splashMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.splashMesh = new THREE.InstancedMesh(ringGeo, splashMat, this.splashCount);
    this.splashMesh.frustumCulled = false;

    for (let i = 0; i < this.splashCount; i++) {
      this.splashData.push({
        x: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
        scale: Math.random(),
        life: Math.random(),
        maxLife: 0.35 + Math.random() * 0.25,
      });

      this.dummyPos.set(0, -999, 0);
      this.dummyMatrix.makeTranslation(this.dummyPos.x, this.dummyPos.y, this.dummyPos.z);
      this.splashMesh.setMatrixAt(i, this.dummyMatrix);
    }

    this.splashMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.splashMesh);
  }

  /**
   * Aplica um clima instantaneamente (usado na inicialização)
   */
  private applyWeatherInstant(type: WeatherType) {
    this.currentWeather = type;
    this.targetWeather = type;
    const preset = this.presets[type];

    this.currentSkyColor.copy(preset.skyColor);
    this.currentFogColor.copy(preset.fogColor);
    this.currentFogDensity = preset.fogDensity;
    this.currentSunColor.copy(preset.sunColor);
    this.currentSunIntensity = preset.sunIntensity;
    this.currentSkyLightColor.copy(preset.skyLightColor);
    this.currentGroundLightColor.copy(preset.groundLightColor);
    this.currentSkyLightIntensity = preset.skyLightIntensity;
    this.currentCloudColor.copy(preset.cloudColor);
    this.currentCloudOpacity = preset.cloudOpacity;
    this.currentRainIntensity = preset.rainIntensity;

    this.scene.background = this.currentSkyColor.clone();
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.density = this.currentFogDensity;
    }

    this.sunLight.color.copy(this.currentSunColor);
    this.sunLight.intensity = this.currentSunIntensity;
    this.skyLight.color.copy(this.currentSkyLightColor);
    this.skyLight.groundColor.copy(this.currentGroundLightColor);
    this.skyLight.intensity = this.currentSkyLightIntensity;

    this.rainMaterial.opacity = this.currentRainIntensity * 0.65;
    for (const mat of this.cloudMaterials) {
      mat.color.copy(this.currentCloudColor);
      mat.opacity = this.currentCloudOpacity;
    }
  }

  /**
   * Alterna para um clima específico suavemente
   */
  public setWeather(type: WeatherType, announce: boolean = true) {
    if (this.targetWeather === type) return;
    this.targetWeather = type;

    if (type === 'rainy') {
      soundManager.startRainAmbient();
    } else {
      soundManager.stopRainAmbient();
    }

    if (announce && this.onWeatherChangeCallback) {
      this.onWeatherChangeCallback(this.getWeatherInfo());
    }
  }

  /**
   * Ciclo meteorológico 100% natural e automático (como na vida real)
   */
  public advanceNaturalWeather(excludeNightState: boolean = false): WeatherType {
    switch (this.weatherPhase) {
      case 'sunny':
        // Nuvens começam a se formar no céu (sol abranda, vento surge)
        this.weatherPhase = 'clouding_over';
        this.setWeather('cloudy');
        this.cycleTimer = 55 + Math.random() * 35;
        break;
      case 'clouding_over':
        // A chuva começa a cair
        this.weatherPhase = 'raining';
        this.setWeather('rainy');
        this.cycleTimer = 70 + Math.random() * 45;
        break;
      case 'raining':
        // A chuva para gradualmente
        this.weatherPhase = 'clearing_up';
        this.setWeather('cloudy');
        this.cycleTimer = 30 + Math.random() * 20;
        break;
      case 'clearing_up':
        if (excludeNightState) {
          this.weatherPhase = 'sunny';
          this.setWeather('sunny');
          this.cycleTimer = 140 + Math.random() * 60;
        } else {
          this.weatherPhase = 'night';
          this.setWeather('night');
          this.cycleTimer = 110 + Math.random() * 60;
        }
        break;
      case 'night':
      default:
        // O sol abre de novo radiante e dourado
        this.weatherPhase = 'sunny';
        this.setWeather('sunny');
        this.cycleTimer = 160 + Math.random() * 60;
        break;
    }
    return this.targetWeather;
  }

  /**
   * Cicla para o próximo clima
   */
  public toggleWeather(): WeatherType {
    return this.advanceNaturalWeather();
  }

  /**
   * Callback quando a noite cai ou amanhece (ativa postes e faróis dos carros)
   */
  public setOnNightStateChanged(cb: (isNight: boolean) => void) {
    this.onNightStateChanged = cb;
    if (this.wasNight) cb(true);
  }

  public isNight(): boolean {
    return this.wasNight;
  }

  /**
   * Ativa ou desativa a alternância automática de clima
   */
  public setAutoCycle(enabled: boolean) {
    this.autoCycle = enabled;
    if (this.onWeatherChangeCallback) {
      this.onWeatherChangeCallback(this.getWeatherInfo());
    }
  }

  public getAutoCycle(): boolean {
    return this.autoCycle;
  }

  public getCurrentWeather(): WeatherType {
    return this.targetWeather;
  }

  public getWeatherInfo(): WeatherStateInfo {
    const preset = this.presets[this.targetWeather];
    return {
      type: this.targetWeather,
      name: preset.name,
      icon: preset.icon,
      description: preset.description,
      autoCycle: this.autoCycle,
      timeUntilNextCycle: Math.max(0, Math.round(this.cycleTimer)),
    };
  }

  /**
   * Atualização contínua a cada quadro (movimentação de nuvens, gotas, interpolação suave + ciclo dia/noite)
   */
  public update(delta: number, playerPos: THREE.Vector3, dayCycleLighting?: DayCycleLighting) {
    const usesExternalDayNight = Boolean(dayCycleLighting);

    // 1. Mudança automática e orgânica do tempo com o passar dos minutos
    if (this.autoCycle) {
      this.cycleTimer -= delta;
      if (this.cycleTimer <= 0) {
        this.advanceNaturalWeather(usesExternalDayNight);
      }
    }

    // Notifica mudança de dia/noite para acendimento de faróis e postes
    const isNowNight = dayCycleLighting
      ? dayCycleLighting.isNight
      : (this.targetWeather === 'night' || this.currentSunIntensity < 1.05);
    if (isNowNight !== this.wasNight) {
      this.wasNight = isNowNight;
      this.onNightStateChanged?.(isNowNight);
    }

    // 2. Interpolação suave e contínua dos parâmetros em direção ao clima/hora alvo
    const effectiveWeather: WeatherType = usesExternalDayNight && this.targetWeather === 'night'
      ? 'sunny'
      : this.targetWeather;
    const targetPreset = this.presets[effectiveWeather];
    const lerpFactor = Math.min(1.0, delta * 0.85);

    if (dayCycleLighting) {
      // Base contínua do ciclo Dia & Noite vinda do GameEngine
      const weatherBlend = effectiveWeather === 'rainy' ? 0.72 : (effectiveWeather === 'cloudy' ? 0.45 : 0.0);
      const nightDim = dayCycleLighting.isNight ? 0.25 : 1.0;

      const targetSky = dayCycleLighting.skyColor.clone();
      const targetFog = dayCycleLighting.fogColor.clone();
      const targetSun = dayCycleLighting.sunColor.clone();
      const targetSkyLight = dayCycleLighting.skyLightColor.clone();
      const targetGroundLight = dayCycleLighting.groundLightColor.clone();
      const targetCloud = dayCycleLighting.cloudTint.clone();

      let targetFogDensity = dayCycleLighting.fogDensity;
      let targetSunIntensity = dayCycleLighting.sunIntensity;
      let targetSkyLightIntensity = dayCycleLighting.skyLightIntensity;

      if (weatherBlend > 0) {
        const overcastSky = targetPreset.skyColor.clone().multiplyScalar(nightDim);
        const overcastFog = targetPreset.fogColor.clone().multiplyScalar(nightDim);
        targetSky.lerp(overcastSky, weatherBlend);
        targetFog.lerp(overcastFog, weatherBlend);
        targetSun.lerp(targetPreset.sunColor, weatherBlend * 0.6);
        targetSkyLight.lerp(targetPreset.skyLightColor, weatherBlend * 0.55);
        targetGroundLight.lerp(targetPreset.groundLightColor, weatherBlend * 0.55);
        targetCloud.lerp(targetPreset.cloudColor.clone().multiplyScalar(Math.max(0.35, nightDim)), weatherBlend);
        targetFogDensity = THREE.MathUtils.lerp(dayCycleLighting.fogDensity, targetPreset.fogDensity, weatherBlend);
        targetSunIntensity = THREE.MathUtils.lerp(dayCycleLighting.sunIntensity, targetPreset.sunIntensity * nightDim, weatherBlend);
        targetSkyLightIntensity = THREE.MathUtils.lerp(dayCycleLighting.skyLightIntensity, targetPreset.skyLightIntensity * Math.max(0.55, nightDim), weatherBlend);
      }

      const dayLerp = Math.min(1.0, delta * 3.5);
      this.currentSkyColor.lerp(targetSky, dayLerp);
      this.currentFogColor.lerp(targetFog, dayLerp);
      this.currentFogDensity = THREE.MathUtils.lerp(this.currentFogDensity, targetFogDensity, dayLerp);
      this.currentSunColor.lerp(targetSun, dayLerp);
      this.currentSunIntensity = THREE.MathUtils.lerp(this.currentSunIntensity, targetSunIntensity, dayLerp);
      this.currentSkyLightColor.lerp(targetSkyLight, dayLerp);
      this.currentGroundLightColor.lerp(targetGroundLight, dayLerp);
      this.currentSkyLightIntensity = THREE.MathUtils.lerp(this.currentSkyLightIntensity, targetSkyLightIntensity, dayLerp);
      this.currentCloudColor.lerp(targetCloud, dayLerp);
      this.currentCloudOpacity = THREE.MathUtils.lerp(this.currentCloudOpacity, dayCycleLighting.isNight ? Math.max(0.28, targetPreset.cloudOpacity * 0.55) : targetPreset.cloudOpacity, lerpFactor);
      this.currentRainIntensity = THREE.MathUtils.lerp(this.currentRainIntensity, targetPreset.rainIntensity, lerpFactor);
    } else {
      this.currentSkyColor.lerp(targetPreset.skyColor, lerpFactor);
      this.currentFogColor.lerp(targetPreset.fogColor, lerpFactor);
      this.currentFogDensity = THREE.MathUtils.lerp(this.currentFogDensity, targetPreset.fogDensity, lerpFactor);
      this.currentSunColor.lerp(targetPreset.sunColor, lerpFactor);
      this.currentSunIntensity = THREE.MathUtils.lerp(this.currentSunIntensity, targetPreset.sunIntensity, lerpFactor);
      this.currentSkyLightColor.lerp(targetPreset.skyLightColor, lerpFactor);
      this.currentGroundLightColor.lerp(targetPreset.groundLightColor, lerpFactor);
      this.currentSkyLightIntensity = THREE.MathUtils.lerp(this.currentSkyLightIntensity, targetPreset.skyLightIntensity, lerpFactor);
      this.currentCloudColor.lerp(targetPreset.cloudColor, lerpFactor);
      this.currentCloudOpacity = THREE.MathUtils.lerp(this.currentCloudOpacity, targetPreset.cloudOpacity, lerpFactor);
      this.currentRainIntensity = THREE.MathUtils.lerp(this.currentRainIntensity, targetPreset.rainIntensity, lerpFactor);
    }

    // Aplica no Three.js
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this.currentSkyColor);
    } else {
      this.scene.background = this.currentSkyColor.clone();
    }
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.density = this.currentFogDensity;
    }

    // Se houver relâmpago ativo, aumenta temporariamente a luz
    let finalSunIntensity = this.currentSunIntensity;
    if (this.isLightningActive) {
      finalSunIntensity = Math.max(finalSunIntensity, 3.4);
      this.sunLight.color.setHex(0xffffff);
    } else {
      this.sunLight.color.copy(this.currentSunColor);
    }

    this.sunLight.intensity = finalSunIntensity;
    this.skyLight.color.copy(this.currentSkyLightColor);
    this.skyLight.groundColor.copy(this.currentGroundLightColor);
    this.skyLight.intensity = this.currentSkyLightIntensity;

    // Atualiza materiais de nuvens
    for (const mat of this.cloudMaterials) {
      mat.color.copy(this.currentCloudColor);
      mat.opacity = this.currentCloudOpacity;
    }

    // 3. Movimento das Nuvens no Céu
    const windSpeedFactor = this.targetWeather === 'rainy' ? 2.2 : (this.targetWeather === 'cloudy' ? 1.4 : 1.0);
    for (const cloud of this.clouds) {
      cloud.mesh.position.x += cloud.speed * windSpeedFactor * delta;
      cloud.mesh.position.z += cloud.speed * 0.25 * windSpeedFactor * delta;
      cloud.mesh.rotation.y += cloud.rotSpeed * delta;

      // Wrap espacial para as nuvens continuarem navegando infinitamente pelo céu
      if (cloud.mesh.position.x > 140) {
        cloud.mesh.position.x = -140;
      }
      if (cloud.mesh.position.z > 140) {
        cloud.mesh.position.z = -140;
      }
    }

    // 4. Atualização das Gotas de Chuva
    if (this.currentRainIntensity > 0.01) {
      this.rainLines.visible = true;
      this.rainMaterial.opacity = this.currentRainIntensity * 0.72;

      const posAttr = this.rainGeometry.attributes.position as THREE.BufferAttribute;
      const positions = this.rainPositions;
      const boxSize = 65;
      const windX = -2.6 * delta;
      const windZ = 0.8 * delta;

      for (let i = 0; i < this.rainCount; i++) {
        const idx = i * 6;
        const fall = this.rainVelocities[i] * delta;

        // Move a gota
        positions[idx + 1] -= fall;
        positions[idx + 4] -= fall;
        positions[idx] += windX;
        positions[idx + 3] += windX;
        positions[idx + 2] += windZ;
        positions[idx + 5] += windZ;

        // Se a ponta inferior tocar o chão (ou passar de y = 0.1)
        if (positions[idx + 4] <= 0.1) {
          const newX = playerPos.x + (Math.random() - 0.5) * boxSize;
          const newZ = playerPos.z + (Math.random() - 0.5) * boxSize;
          const newY = 22 + Math.random() * 5.0;
          const len = 0.55 + Math.random() * 0.25;

          positions[idx] = newX;
          positions[idx + 1] = newY;
          positions[idx + 2] = newZ;

          positions[idx + 3] = newX - 0.06;
          positions[idx + 4] = newY - len;
          positions[idx + 5] = newZ + 0.02;
        }

        // Mantém a caixa de chuva centralizada em volta do jogador
        const dx = positions[idx] - playerPos.x;
        const dz = positions[idx + 2] - playerPos.z;
        if (Math.abs(dx) > boxSize * 0.55) {
          positions[idx] = playerPos.x - Math.sign(dx) * (boxSize * 0.45);
          positions[idx + 3] = positions[idx] - 0.06;
        }
        if (Math.abs(dz) > boxSize * 0.55) {
          positions[idx + 2] = playerPos.z - Math.sign(dz) * (boxSize * 0.45);
          positions[idx + 5] = positions[idx + 2] + 0.02;
        }
      }

      posAttr.needsUpdate = true;

      // 5. Atualização dos Respingos no Chão (Splashes)
      this.updateSplashes(delta, playerPos);

      // 6. Ciclo de Trovões & Relâmpagos (quando chovendo)
      this.updateLightning(delta);
    } else {
      this.rainLines.visible = false;
      this.splashMesh.visible = false;
    }
  }

  /**
   * Anima pequenos círculos de respingo de água no asfalto e calçada
   */
  private updateSplashes(delta: number, playerPos: THREE.Vector3) {
    this.splashMesh.visible = true;
    let needsUpdate = false;

    for (let i = 0; i < this.splashCount; i++) {
      const sp = this.splashData[i];
      sp.life += delta;

      if (sp.life >= sp.maxLife) {
        // Renasce o respingo em uma nova posição aleatória perto do jogador
        sp.life = 0;
        sp.maxLife = 0.22 + Math.random() * 0.18;
        sp.x = playerPos.x + (Math.random() - 0.5) * 36;
        sp.z = playerPos.z + (Math.random() - 0.5) * 36;
      }

      const progress = sp.life / sp.maxLife;
      const currentScale = (0.2 + progress * 0.85) * this.currentRainIntensity;
      const alpha = (1.0 - progress) * 0.45 * this.currentRainIntensity;

      this.dummyPos.set(sp.x, 0.02, sp.z);
      this.dummyScale.set(currentScale, currentScale, currentScale);
      this.dummyMatrix.makeScale(this.dummyScale.x, this.dummyScale.y, this.dummyScale.z);
      this.dummyMatrix.setPosition(this.dummyPos);

      this.splashMesh.setMatrixAt(i, this.dummyMatrix);
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.splashMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Dispara relâmpagos ocasionais e trovão distante durante a chuva
   */
  private updateLightning(delta: number) {
    if (this.targetWeather !== 'rainy') {
      this.isLightningActive = false;
      return;
    }

    if (!this.isLightningActive) {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        // Dispara o relâmpago
        this.isLightningActive = true;
        this.lightningFlashDuration = 0.09;
        this.lightningBurstCount = 1;
        this.lightningTimer = 14.0 + Math.random() * 16.0; // Próximo relâmpago em 14-30s
        soundManager.playThunder();
      }
    } else {
      this.lightningFlashDuration -= delta;
      if (this.lightningFlashDuration <= 0) {
        if (this.lightningBurstCount > 0) {
          // Segundo clarão breve característico de relâmpago natural
          this.lightningBurstCount--;
          this.lightningFlashDuration = 0.06;
        } else {
          this.isLightningActive = false;
        }
      }
    }
  }

  /**
   * Destrói geometrias e materiais ao desmontar o jogo
   */
  public dispose() {
    soundManager.stopRainAmbient();

    if (this.rainGeometry) this.rainGeometry.dispose();
    if (this.rainMaterial) this.rainMaterial.dispose();
    if (this.rainLines && this.rainLines.parent) {
      this.rainLines.parent.remove(this.rainLines);
    }

    if (this.splashMesh && this.splashMesh.parent) {
      this.splashMesh.geometry.dispose();
      if (Array.isArray(this.splashMesh.material)) {
        this.splashMesh.material.forEach((m) => m.dispose());
      } else {
        this.splashMesh.material.dispose();
      }
      this.splashMesh.parent.remove(this.splashMesh);
    }

    for (const mat of this.cloudMaterials) {
      mat.dispose();
    }
    if (this.cloudsGroup.parent) {
      this.cloudsGroup.parent.remove(this.cloudsGroup);
    }
  }
}
