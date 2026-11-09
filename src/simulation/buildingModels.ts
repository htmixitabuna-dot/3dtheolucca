import * as THREE from 'three';

/**
 * Biblioteca Procedural de Modelos 3D para Construções e Decorações do Jogador.
 * Modelos leves e otimizados para alta taxa de quadros (60 FPS) em Web e Android.
 */

// Criação do material padrão ou holográfico de pré-visualização
function getBuildingMaterial(
  color: THREE.ColorRepresentation,
  isPreview: boolean,
  isValid: boolean,
  roughness = 0.6,
  metalness = 0.1
): THREE.Material {
  if (isPreview) {
    return new THREE.MeshBasicMaterial({
      color: isValid ? 0x22c55e : 0xef4444,
      transparent: true,
      opacity: 0.55,
      wireframe: false,
    });
  }

  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

export function createBuildingMesh(
  modelType: string,
  isPreview = false,
  isValid = true
): THREE.Group {
  const group = new THREE.Group();
  group.name = `PlayerBuilding_${modelType}`;

  switch (modelType) {
    case 'house_modern': {
      // 1. CASA MODERNA (Footprint: 6m x 6m x 4.5m)
      const wallMat = getBuildingMaterial(0xf8fafc, isPreview, isValid, 0.7, 0.05);
      const woodMat = getBuildingMaterial(0x854d0e, isPreview, isValid, 0.5, 0.1);
      const roofMat = getBuildingMaterial(0x1e293b, isPreview, isValid, 0.4, 0.2);
      const glassMat = isPreview
        ? wallMat
        : new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.85, transparent: true, opacity: 0.7 });

      // Corpo principal
      const baseGeo = new THREE.BoxGeometry(5.2, 3.2, 4.8);
      const base = new THREE.Mesh(baseGeo, wallMat);
      base.position.y = 1.6;
      base.castShadow = !isPreview;
      base.receiveShadow = !isPreview;
      group.add(base);

      // Telhado moderno plano com platibanda
      const roofGeo = new THREE.BoxGeometry(5.6, 0.35, 5.2);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 3.35;
      roof.castShadow = !isPreview;
      group.add(roof);

      // Painel decorativo em madeira
      const woodPanelGeo = new THREE.BoxGeometry(1.6, 3.0, 0.15);
      const woodPanel = new THREE.Mesh(woodPanelGeo, woodMat);
      woodPanel.position.set(-1.4, 1.5, 2.45);
      group.add(woodPanel);

      // Porta frontal de madeira
      const doorGeo = new THREE.BoxGeometry(1.1, 2.1, 0.12);
      const door = new THREE.Mesh(doorGeo, woodMat);
      door.position.set(-1.4, 1.05, 2.5);
      group.add(door);

      // Janela panorâmica frontal
      const windowGeo = new THREE.BoxGeometry(2.2, 1.8, 0.1);
      const win = new THREE.Mesh(windowGeo, glassMat);
      win.position.set(1.1, 1.8, 2.45);
      group.add(win);

      // Varandinha frontal com piso escuro
      const porchGeo = new THREE.BoxGeometry(3.5, 0.2, 1.4);
      const porch = new THREE.Mesh(porchGeo, roofMat);
      porch.position.set(0, 0.1, 3.0);
      group.add(porch);
      break;
    }

    case 'shop_market': {
      // 2. MINI-MERCADO / LOJA (Footprint: 6m x 5m x 4m)
      const wallMat = getBuildingMaterial(0xfef08a, isPreview, isValid, 0.8);
      const baseTrimMat = getBuildingMaterial(0xd97706, isPreview, isValid);
      const awningMat = getBuildingMaterial(0xdc2626, isPreview, isValid);
      const glassMat = isPreview
        ? wallMat
        : new THREE.MeshStandardMaterial({ color: 0x67e8f9, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.75 });

      // Corpo da loja
      const bodyGeo = new THREE.BoxGeometry(5.0, 3.4, 4.4);
      const body = new THREE.Mesh(bodyGeo, wallMat);
      body.position.y = 1.7;
      body.castShadow = !isPreview;
      group.add(body);

      // Toldo comercial listrado frontal
      const awningGeo = new THREE.BoxGeometry(4.8, 0.25, 1.2);
      awningGeo.rotateX(0.25);
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.position.set(0, 2.6, 2.6);
      awning.castShadow = !isPreview;
      group.add(awning);

      // Grande vitrine
      const glassGeo = new THREE.BoxGeometry(3.8, 1.9, 0.1);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(0, 1.2, 2.22);
      group.add(glass);

      // Placa superior da loja
      const signGeo = new THREE.BoxGeometry(3.6, 0.6, 0.15);
      const sign = new THREE.Mesh(signGeo, baseTrimMat);
      sign.position.set(0, 3.1, 2.25);
      group.add(sign);
      break;
    }

    case 'building_apartments': {
      // 3. PRÉDIO RESIDENCIAL (Footprint: 7m x 6m x 9m)
      const facadeMat = getBuildingMaterial(0x38bdf8, isPreview, isValid, 0.6);
      const concreteMat = getBuildingMaterial(0x334155, isPreview, isValid, 0.7);
      const glassMat = isPreview
        ? facadeMat
        : new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.15, metalness: 0.9, transparent: true, opacity: 0.8 });

      // Torre do prédio de 3 andares
      const towerGeo = new THREE.BoxGeometry(6.2, 8.4, 5.2);
      const tower = new THREE.Mesh(towerGeo, facadeMat);
      tower.position.y = 4.2;
      tower.castShadow = !isPreview;
      group.add(tower);

      // Base de concreto escuro
      const baseGeo = new THREE.BoxGeometry(6.6, 1.0, 5.6);
      const base = new THREE.Mesh(baseGeo, concreteMat);
      base.position.y = 0.5;
      group.add(base);

      // Sacadas e janelas nos 3 andares
      for (let floor = 0; floor < 3; floor++) {
        const y = 2.2 + floor * 2.3;
        // Sacada esquerda
        const balconyGeo = new THREE.BoxGeometry(2.0, 0.8, 0.6);
        const balcony = new THREE.Mesh(balconyGeo, concreteMat);
        balcony.position.set(-1.6, y, 2.8);
        group.add(balcony);

        // Janela/porta sacada esquerda
        const winL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.08), glassMat);
        winL.position.set(-1.6, y + 0.4, 2.62);
        group.add(winL);

        // Janela direita
        const winR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.08), glassMat);
        winR.position.set(1.6, y + 0.4, 2.62);
        group.add(winR);
      }

      // Caixa d'água no teto
      const tankGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.1, 12);
      const tank = new THREE.Mesh(tankGeo, concreteMat);
      tank.position.set(1.5, 8.8, 0);
      group.add(tank);
      break;
    }

    case 'garage_service': {
      // 4. GARAGEM / OFICINA (Footprint: 6m x 5m x 3.5m)
      const brickMat = getBuildingMaterial(0x991b1b, isPreview, isValid, 0.85);
      const metalMat = getBuildingMaterial(0x64748b, isPreview, isValid, 0.35, 0.7);
      const roofMat = getBuildingMaterial(0x475569, isPreview, isValid, 0.4, 0.5);

      const bodyGeo = new THREE.BoxGeometry(5.4, 3.0, 4.4);
      const body = new THREE.Mesh(bodyGeo, brickMat);
      body.position.y = 1.5;
      body.castShadow = !isPreview;
      group.add(body);

      // Porta basculante industrial de enrolar
      const doorGeo = new THREE.BoxGeometry(3.6, 2.2, 0.12);
      const door = new THREE.Mesh(doorGeo, metalMat);
      door.position.set(0, 1.1, 2.22);
      group.add(door);

      // Telhado industrial metálico
      const roofGeo = new THREE.BoxGeometry(5.8, 0.3, 4.8);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = 3.1;
      group.add(roof);
      break;
    }

    case 'landmark_statue': {
      // 5. MONUMENTO DOURADO COM PEDESTAL (Footprint: 3m x 3m x 5m)
      const marbleMat = getBuildingMaterial(0xe2e8f0, isPreview, isValid, 0.3, 0.1);
      const goldMat = isPreview
        ? marbleMat
        : new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.9,
            roughness: 0.18,
            emissive: 0xd97706,
            emissiveIntensity: 0.25,
          });

      // Pedestal de mármore escalonado
      const base1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.4), marbleMat);
      base1.position.y = 0.25;
      group.add(base1);

      const base2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.8), marbleMat);
      base2.position.y = 1.2;
      group.add(base2);

      // Coluna dourada
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.8, 14), goldMat);
      col.position.y = 2.8;
      group.add(col);

      // Troféu Estelar Dourado no topo
      const starMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 1), goldMat);
      starMesh.position.y = 4.1;
      starMesh.castShadow = !isPreview;
      group.add(starMesh);
      break;
    }

    case 'park_bench': {
      // 6. BANCO DE PRAÇA (Footprint: 2m x 1m x 1m)
      const woodMat = getBuildingMaterial(0x92400e, isPreview, isValid, 0.6);
      const ironMat = getBuildingMaterial(0x0f172a, isPreview, isValid, 0.4, 0.8);

      // Assento
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.55), woodMat);
      seat.position.set(0, 0.45, 0);
      seat.castShadow = !isPreview;
      group.add(seat);

      // Encosto
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.08), woodMat);
      back.position.set(0, 0.72, -0.22);
      back.rotation.x = -0.15;
      group.add(back);

      // Pés de ferro
      for (const side of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), ironMat);
        leg.position.set(side, 0.225, 0);
        group.add(leg);
      }
      break;
    }

    case 'street_lamp': {
      // 7. POSTE DE ILUMINAÇÃO DECORATIVO (Footprint: 1.5m x 1.5m x 4.5m)
      const ironMat = getBuildingMaterial(0x0f172a, isPreview, isValid, 0.35, 0.85);
      const lightMat = isPreview
        ? ironMat
        : new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xfef08a,
            emissiveIntensity: 1.2,
            roughness: 0.1,
          });

      // Haste do poste
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.8, 10), ironMat);
      post.position.y = 1.9;
      post.castShadow = !isPreview;
      group.add(post);

      // Base do poste
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.4, 10), ironMat);
      base.position.y = 0.2;
      group.add(base);

      // Globo de iluminação
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), lightMat);
      globe.position.y = 3.9;
      group.add(globe);

      // Chapéu do globo
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.2, 12), ironMat);
      cap.position.y = 4.2;
      group.add(cap);
      break;
    }

    case 'tree_ornamental': {
      // 8. ÁRVORE ORNAMENTAL FLORIDA (Footprint: 3m x 3m x 4.5m)
      const trunkMat = getBuildingMaterial(0x78350f, isPreview, isValid, 0.9);
      const leavesMat = getBuildingMaterial(0x15803d, isPreview, isValid, 0.8);
      const flowerMat = getBuildingMaterial(0xec4899, isPreview, isValid, 0.6);

      // Tronco
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 2.0, 10), trunkMat);
      trunk.position.y = 1.0;
      trunk.castShadow = !isPreview;
      group.add(trunk);

      // Copa principal estilizada
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 14), leavesMat);
      crown.position.y = 2.8;
      crown.scale.set(1.1, 1.25, 1.1);
      crown.castShadow = !isPreview;
      group.add(crown);

      // Flores cor-de-rosa na copa
      for (let i = 0; i < 6; i++) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), flowerMat);
        const ang = (i / 6) * Math.PI * 2;
        flower.position.set(Math.cos(ang) * 1.05, 2.8 + Math.sin(ang) * 0.4, Math.sin(ang) * 1.05);
        group.add(flower);
      }
      break;
    }

    case 'fountain_small': {
      // 9. CHAFARIZ DECORATIVO (Footprint: 4m x 4m x 2.5m)
      const stoneMat = getBuildingMaterial(0x94a3b8, isPreview, isValid, 0.6, 0.2);
      const waterMat = isPreview
        ? stoneMat
        : new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            roughness: 0.1,
            metalness: 0.2,
            transparent: true,
            opacity: 0.85,
          });

      // Bacia circular
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 0.6, 18), stoneMat);
      basin.position.y = 0.3;
      group.add(basin);

      // Água na bacia
      const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.05, 18), waterMat);
      waterDisc.position.y = 0.55;
      group.add(waterDisc);

      // Pilar central
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.4, 12), stoneMat);
      pillar.position.y = 1.2;
      group.add(pillar);

      // Bacia superior menor
      const topBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 0.35, 14), stoneMat);
      topBasin.position.y = 1.8;
      group.add(topBasin);
      break;
    }

    case 'flower_planter': {
      // 10. JARDINEIRA DE FLORES (Footprint: 2.5m x 1m x 0.8m)
      const concreteMat = getBuildingMaterial(0x64748b, isPreview, isValid, 0.7);
      const earthMat = getBuildingMaterial(0x451a03, isPreview, isValid, 0.95);
      const flowerColors = [0xef4444, 0xfacc15, 0xa855f7, 0x38bdf8];

      // Caixa de concreto
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.8), concreteMat);
      box.position.y = 0.25;
      box.castShadow = !isPreview;
      group.add(box);

      // Terra
      const earth = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.05, 0.65), earthMat);
      earth.position.y = 0.48;
      group.add(earth);

      // Flores variadas
      for (let i = 0; i < 5; i++) {
        const fColor = flowerColors[i % flowerColors.length];
        const fMat = getBuildingMaterial(fColor, isPreview, isValid, 0.5);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), fMat);
        flower.position.set(-0.8 + i * 0.4, 0.62, (i % 2 === 0 ? 0.1 : -0.1));
        group.add(flower);
      }
      break;
    }

    default: {
      // Bloco genérico
      const mat = getBuildingMaterial(0x60a5fa, isPreview, isValid);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
      mesh.position.y = 1;
      group.add(mesh);
      break;
    }
  }

  return group;
}
