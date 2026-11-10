import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { StoreProduct } from '../types/economy';
import { 
  CharacterCustomization, 
  createTheoLuccaModel, 
  TheoLuccaRig,
  DEFAULT_CHARACTER_CUSTOMIZATION 
} from '../simulation/TheoLuccaModel';
import { createBuildingMesh } from '../simulation/buildingModels';

export interface Store3DStageProps {
  selectedProduct: StoreProduct;
  baseCustomization?: CharacterCustomization;
  rotationAngle: number;
  onRotationChange: (newAngle: number) => void;
  actionPose?: 'idle' | 'wave' | 'heroic' | 'dance';
}

export const Store3DStage: React.FC<Store3DStageProps> = ({
  selectedProduct,
  baseCustomization = DEFAULT_CHARACTER_CUSTOMIZATION,
  rotationAngle,
  onRotationChange,
  actionPose = 'idle',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<TheoLuccaRig | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const stageGroupRef = useRef<THREE.Group | null>(null);
  const extraPropGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(rotationAngle);

  useEffect(() => {
    currentAngleRef.current = rotationAngle;
  }, [rotationAngle]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.018);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 150);
    camera.position.set(0, 1.35, 3.8);
    camera.lookAt(0, 0.72, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 2. Iluminação com característica do jogo (Dia ensolarado na Cidade Real)
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    sunLight.position.set(4, 9, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;
    sunLight.shadow.camera.left = -3;
    sunLight.shadow.camera.right = 3;
    sunLight.shadow.camera.top = 3;
    sunLight.shadow.camera.bottom = -3;
    scene.add(sunLight);

    // Luz ciano no pedestal de baixo para cima (estilo Free Fire)
    const pedestalLight = new THREE.PointLight(0x06b6d4, 1.6, 4.5);
    pedestalLight.position.set(0, 0.35, 0);
    scene.add(pedestalLight);

    // 3. Fundo 3D com características reais do jogo (Prédios, árvores, calçada e postes)
    const backgroundGroup = new THREE.Group();
    backgroundGroup.name = 'CityBackground';

    // Chão da praça com calçamento
    const floorGeo = new THREE.PlaneGeometry(35, 35);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    backgroundGroup.add(floor);

    // Prédios estilizados da cidade ao fundo (cores e tijolos iguais ao jogo)
    const createBackgroundBuilding = (
      x: number, 
      z: number, 
      w: number, 
      h: number, 
      d: number, 
      color: number, 
      roofColor: number
    ) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(x, 0, z);

      // Parede
      const wallMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      wallMesh.position.y = h / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      bGroup.add(wallMesh);

      // Telhado
      const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6 });
      const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.45, d + 0.3), roofMat);
      roofMesh.position.y = h + 0.22;
      bGroup.add(roofMesh);

      // Janelas decorativas
      const windowMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.8 });
      for (let floorIdx = 0; floorIdx < 3; floorIdx++) {
        for (let col = -1; col <= 1; col++) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.08), windowMat);
          win.position.set(col * (w / 3.4), 1.2 + floorIdx * 1.3, d / 2 + 0.04);
          bGroup.add(win);
        }
      }

      return bGroup;
    };

    // Prédio da esquerda (estilo tijolinho/terracota do jogo)
    backgroundGroup.add(createBackgroundBuilding(-4.5, -5.5, 4.2, 5.5, 3.5, 0xd97768, 0x991b1b));
    // Prédio central/direita (estilo comercial azul e bege)
    backgroundGroup.add(createBackgroundBuilding(4.8, -6.0, 4.8, 6.2, 3.8, 0xfde047, 0x1e3a8a));
    // Prédio ao fundo no centro
    backgroundGroup.add(createBackgroundBuilding(0.2, -8.5, 5.5, 7.5, 4.0, 0x38bdf8, 0x0f172a));

    // Árvores ornamentais estilizadas (iguais às da praça da Cidade Real)
    const createStylizedTree = (x: number, z: number, scale = 1) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);

      // Tronco
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 8), trunkMat);
      trunk.position.y = 0.8;
      trunk.castShadow = true;
      tree.add(trunk);

      // Copa verde estilizada em camadas
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
      const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), leafMat);
      foliage1.position.y = 2.0;
      foliage1.scale.set(1.1, 0.95, 1.1);
      foliage1.castShadow = true;
      tree.add(foliage1);

      const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), leafMat);
      foliage2.position.y = 2.65;
      foliage2.castShadow = true;
      tree.add(foliage2);

      return tree;
    };

    backgroundGroup.add(createStylizedTree(-2.8, -3.8, 0.9));
    backgroundGroup.add(createStylizedTree(2.9, -4.0, 0.95));

    // Poste de iluminação preto vintage com globo de luz
    const createStreetLamp = (x: number, z: number) => {
      const lamp = new THREE.Group();
      lamp.position.set(x, 0, z);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.7 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.5, 8), poleMat);
      pole.position.y = 1.25;
      pole.castShadow = true;
      lamp.add(pole);

      // Globo de luz
      const globeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), globeMat);
      globe.position.y = 2.5;
      lamp.add(globe);

      return lamp;
    };

    backgroundGroup.add(createStreetLamp(-2.1, -2.6));
    backgroundGroup.add(createStreetLamp(2.1, -2.6));

    scene.add(backgroundGroup);

    // 4. Grupo Central Giratório (Pedestal de LED + Avatar + Props)
    const stageGroup = new THREE.Group();
    stageGroupRef.current = stageGroup;
    scene.add(stageGroup);

    // Pedestal Circular Metálico com Anel de LED Neon Ciano (1:1 com o Free Fire)
    const pedestalBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.18, 48), pedestalBaseMat);
    pedestalBase.position.y = 0.09;
    pedestalBase.receiveShadow = true;
    pedestalBase.castShadow = true;
    stageGroup.add(pedestalBase);

    // Anel de LED Neon Ciano externo
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ringGeo = new THREE.TorusGeometry(1.28, 0.045, 16, 48);
    const ringMesh = new THREE.Mesh(ringGeo, ledMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.185;
    stageGroup.add(ringMesh);

    // Anel interno sutil
    const innerRingGeo = new THREE.TorusGeometry(0.9, 0.02, 12, 40);
    const innerRingMesh = new THREE.Mesh(innerRingGeo, ledMat);
    innerRingMesh.rotation.x = Math.PI / 2;
    innerRingMesh.position.y = 0.185;
    stageGroup.add(innerRingMesh);

    // 5. Instanciação do Avatar Oficial do Jogo (Theo Lucca 3D Rig)
    const rig = createTheoLuccaModel();
    rigRef.current = rig;
    rig.root.position.set(0, 0.18, 0);
    stageGroup.add(rig.root);

    // 6. Grupo para Veículo ou Construção Adicional ao Lado do Avatar
    const extraPropGroup = new THREE.Group();
    extraPropGroupRef.current = extraPropGroup;
    stageGroup.add(extraPropGroup);

    // Redimensionamento de tela
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Loop de Animação em Tempo Real (60 FPS)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Aplica rotação suave do pedestal
      if (stageGroupRef.current) {
        stageGroupRef.current.rotation.y = (currentAngleRef.current * Math.PI) / 180;
      }

      // Atualiza movimento procedural do avatar do jogo ("avatar em movimento")
      if (rigRef.current) {
        const isWaving = actionPose === 'wave';
        const isWorking = actionPose === 'heroic';

        // Animação viva: respiração infantil, balanço sutil do tronco e cabeça curiosa
        rigRef.current.updateAnimation(
          elapsedTime,
          0, // velocidade zero para idle expressivo
          true,
          false,
          isWaving,
          false,
          isWorking
        );

        // Movimento extra heróico e expressivo de idle
        const breath = Math.sin(elapsedTime * 2.8);
        const sway = Math.sin(elapsedTime * 1.4);
        rigRef.current.head.rotation.y = sway * 0.12;
        rigRef.current.head.rotation.x = breath * 0.035;

        if (actionPose === 'dance') {
          // Pequena dancinha estilosa de comemoração
          rigRef.current.body.position.y = 0.52 + Math.abs(Math.sin(elapsedTime * 6)) * 0.05;
          rigRef.current.leftArm.rotation.x = Math.sin(elapsedTime * 6) * 0.6;
          rigRef.current.rightArm.rotation.x = -Math.sin(elapsedTime * 6) * 0.6;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sincroniza a customização do avatar conforme o produto selecionado
  useEffect(() => {
    if (!rigRef.current) return;
    const rig = rigRef.current;

    // Customização combinada da base do jogador + produto selecionado
    const custom: CharacterCustomization = {
      ...baseCustomization,
    };

    // Aplica alterações visuais específicas do produto selecionado
    if (selectedProduct.customizationData) {
      const data = selectedProduct.customizationData;
      if (data.shirtColor) custom.shirtColor = data.shirtColor;
      if (data.shortsColor || data.pantsColor) custom.shortsColor = data.shortsColor || data.pantsColor;
      if (data.shoeColor) custom.shoeColor = data.shoeColor;
      if (data.shirtDecal) custom.shirtDecal = data.shirtDecal;
      if (data.hasCap !== undefined) custom.hasCap = data.hasCap;
      if (data.capColor) custom.capColor = data.capColor;
      if (data.capStyle) custom.capStyle = data.capStyle;
      if (data.hasGlasses !== undefined) custom.hasGlasses = data.hasGlasses;
      if (data.glassesColor) custom.glassesColor = data.glassesColor;
      if (data.hasBackpack !== undefined) custom.hasBackpack = data.hasBackpack;
      if (data.backpackColor) custom.backpackColor = data.backpackColor;
    }

    // Se for o Conjunto Esportivo oficial: veste o conjunto do Free Fire
    if (selectedProduct.id === 'prod_conjunto_esportivo') {
      custom.shirtColor = '#18181b';
      custom.shortsColor = '#18181b';
      custom.shoeColor = '#09090b';
      custom.hasCap = false;
      custom.hasGlasses = true;
      custom.glassesColor = '#09090b';
      custom.shirtDecal = 'star';
    }

    // Se for a Jaqueta Urbana: jaqueta vermelha esportiva
    if (selectedProduct.id === 'prod_jaqueta_urbana') {
      custom.shirtColor = '#dc2626';
      custom.shortsColor = '#1e293b';
      custom.shoeColor = '#f8fafc';
      custom.shirtDecal = 'fire';
      custom.hasGlasses = false;
    }

    // Se for o Boné Premium: veste boné preto
    if (selectedProduct.id === 'prod_bone_premium') {
      custom.hasCap = true;
      custom.capColor = '#18181b';
      custom.capStyle = 'forward';
    }

    // Se for Óculos Style: coloca óculos escuros
    if (selectedProduct.id === 'prod_oculos_style') {
      custom.hasGlasses = true;
      custom.glassesColor = '#09090b';
    }

    rig.applyCustomization(custom);

    // Ajusta objetos extras na cena conforme o tipo do produto
    if (extraPropGroupRef.current) {
      // Limpa props anteriores
      while (extraPropGroupRef.current.children.length > 0) {
        extraPropGroupRef.current.remove(extraPropGroupRef.current.children[0]);
      }

      // Se for construção: coloca a maquete 3D da casa ao lado do avatar
      if (selectedProduct.category === 'construcao') {
        const bldType = selectedProduct.modelType || 'house_modern';
        const bldMesh = createBuildingMesh(bldType, false, true);
        bldMesh.scale.setScalar(0.22);
        bldMesh.position.set(0.75, 0.18, -0.2);
        bldMesh.rotation.y = -Math.PI / 6;
        extraPropGroupRef.current.add(bldMesh);
        rig.root.position.set(-0.45, 0.18, 0.1);
      } else if (selectedProduct.category === 'decoracao') {
        // Se for decoração: mostra árvore, poste, banco ou chafariz
        const decType = selectedProduct.modelType || 'tree_ornamental';
        const decMesh = createBuildingMesh(decType, false, true);
        decMesh.scale.setScalar(0.32);
        decMesh.position.set(0.65, 0.18, -0.1);
        extraPropGroupRef.current.add(decMesh);
        rig.root.position.set(-0.4, 0.18, 0.1);
      } else if (selectedProduct.category === 'garagem') {
        // Se for veículo (Carro Esportivo, Moto, Picape ou Fusca)
        const carGroup = new THREE.Group();
        const isMoto = selectedProduct.id.includes('moto');
        
        let vehicleColor = 0xdc2626;
        let isGold = false;
        if (selectedProduct.id.includes('blue')) vehicleColor = 0x2563eb;
        else if (selectedProduct.id.includes('black')) vehicleColor = 0x09090b;
        else if (selectedProduct.id.includes('green') || selectedProduct.id.includes('ninja')) vehicleColor = 0x16a34a;
        else if (selectedProduct.id.includes('yellow') || selectedProduct.id.includes('amarelo')) vehicleColor = 0xfacc15;
        else if (selectedProduct.id.includes('orange') || selectedProduct.id.includes('picape')) vehicleColor = 0xf97316;
        else if (selectedProduct.id.includes('gold') || selectedProduct.id.includes('ouro')) {
          vehicleColor = 0xfbbf24;
          isGold = true;
        }

        if (isMoto) {
          // Moto Street / Ninja
          const bodyMat = new THREE.MeshStandardMaterial({ 
            color: vehicleColor, 
            metalness: isGold ? 0.95 : 0.8, 
            roughness: isGold ? 0.15 : 0.25 
          });
          const motoFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 1.1), bodyMat);
          motoFrame.position.y = 0.35;
          carGroup.add(motoFrame);

          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
          const fWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), wheelMat);
          fWheel.rotation.z = Math.PI / 2;
          fWheel.position.set(0, 0.2, 0.45);
          carGroup.add(fWheel);

          const rWheel = fWheel.clone();
          rWheel.position.set(0, 0.2, -0.45);
          carGroup.add(rWheel);
        } else {
          // Carro Esportivo V12 / Picape / Fusca
          const bodyMat = new THREE.MeshStandardMaterial({ 
            color: vehicleColor, 
            metalness: isGold ? 0.95 : 0.75, 
            roughness: isGold ? 0.15 : 0.25 
          });
          const isPicape = selectedProduct.id.includes('picape');
          const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, isPicape ? 0.45 : 0.35, 1.6), bodyMat);
          carBody.position.y = isPicape ? 0.32 : 0.26;
          carGroup.add(carBody);

          const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
          const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, isPicape ? 0.6 : 0.8), cabinMat);
          cabin.position.set(0, isPicape ? 0.58 : 0.48, isPicape ? 0.1 : -0.1);
          carGroup.add(cabin);

          // Rodas esportivas
          const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
          [
            [-0.45, 0.15, 0.45],
            [0.45, 0.15, 0.45],
            [-0.45, 0.15, -0.45],
            [0.45, 0.15, -0.45],
          ].forEach(([wx, wy, wz]) => {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16), wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(wx, wy, wz);
            carGroup.add(wheel);
          });
        }

        carGroup.scale.setScalar(0.7);
        carGroup.position.set(0.65, 0.18, 0);
        carGroup.rotation.y = -Math.PI / 5;
        extraPropGroupRef.current.add(carGroup);
        rig.root.position.set(-0.45, 0.18, 0.1);
      } else {
        // Centraliza o avatar no pedestal se for apenas roupa/acessório
        rig.root.position.set(0, 0.18, 0);
      }

      // Se for ferramenta: coloca a chave na mão
      if (selectedProduct.id.includes('wrench')) {
        rig.setHeldPropType('wrench');
      } else {
        rig.setHeldPropType('none');
      }
    }
  }, [selectedProduct, baseCustomization]);

  // Controles de arrasto para girar 360° com mouse ou toque
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const delta = clientX - startXRef.current;
    const newAngle = (currentAngleRef.current + delta * 0.65) % 360;
    currentAngleRef.current = newAngle;
    onRotationChange(newAngle);
    startXRef.current = clientX;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
    >
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
