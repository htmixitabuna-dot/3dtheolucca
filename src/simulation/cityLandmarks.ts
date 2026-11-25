import * as THREE from 'three';
import {
  createConcreteTexture,
  createRoofTileTexture,
  createSkyscraperFacadeTexture,
  createStreetSignTexture,
  createTowerFacadeBundle,
} from './textures';
import type { BoxCollider, CircleCollider, InteractiveLocation } from './CityScene';

let cachedConcreteTex: THREE.CanvasTexture | null = null;
let cachedGlassTex: THREE.CanvasTexture | null = null;
let cachedRoofTileTex: THREE.CanvasTexture | null = null;
let cachedBrickBundle: { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } | null = null;
let cachedConcreteBundle: { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } | null = null;

function getSharedConcreteTex() {
  if (!cachedConcreteTex) cachedConcreteTex = createConcreteTexture('#e2e8f0');
  return cachedConcreteTex;
}
function getSharedGlassTex() {
  if (!cachedGlassTex) {
    cachedGlassTex = createSkyscraperFacadeTexture('#1e293b');
    cachedGlassTex.repeat.set(2, 3);
  }
  return cachedGlassTex;
}
function getSharedRoofTileTex() {
  if (!cachedRoofTileTex) cachedRoofTileTex = createRoofTileTexture();
  return cachedRoofTileTex;
}
function getSharedFacadeBundle(style: 'brick' | 'concrete') {
  if (style === 'brick') {
    if (!cachedBrickBundle) cachedBrickBundle = createTowerFacadeBundle('brick');
    return cachedBrickBundle;
  }
  if (!cachedConcreteBundle) cachedConcreteBundle = createTowerFacadeBundle('concrete');
  return cachedConcreteBundle;
}

export interface CityLandmarkContext {
  scene: THREE.Scene;
  detailGroup: THREE.Group;
  boxColliders: BoxCollider[];
  circleColliders: CircleCollider[];
  locations: InteractiveLocation[];
  nightWindowMaterials: THREE.MeshStandardMaterial[];
  emissiveSignMaterials: THREE.MeshStandardMaterial[];
  customerHouses: THREE.Vector3[];
  mailboxes: THREE.Vector3[];
}

export function createSignBannerMesh(
  title: string,
  subtitle: string | undefined,
  bgHex: number,
  textHex: string,
  width: number,
  height: number
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = subtitle ? 192 : 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = `#${bgHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (subtitle) {
    ctx.font = '900 54px sans-serif';
    ctx.fillText(title, canvas.width / 2, canvas.height * 0.38);
    ctx.font = '800 32px sans-serif';
    ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.74);
  } else {
    const fSize = title.length > 14 ? 44 : 58;
    ctx.font = `900 ${fSize}px sans-serif`;
    ctx.fillText(title, canvas.width / 2, canvas.height / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.25,
    emissive: bgHex,
    emissiveIntensity: 0.35,
  });

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.24), mat);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Cria prédios residenciais / comerciais realistas de 5 a 10 andares
 * com textura de concreto/tijolo/vidro e janelas que acendem à noite!
 */
export function buildMultiStoryBuilding(
  ctx: CityLandmarkContext,
  opts: {
    x: number;
    z: number;
    w: number;
    d: number;
    floors: number; // 5 a 10
    style: 'glass' | 'brick' | 'concrete';
    wallColor: number;
    accentColor: number;
    rotY?: number;
  }
) {
  const floorH = 2.85;
  const totalH = opts.floors * floorH;
  const group = new THREE.Group();
  group.position.set(opts.x, 0, opts.z);
  if (opts.rotY) group.rotation.y = opts.rotY;

  let wallMat: THREE.MeshStandardMaterial;
  if (opts.style === 'glass') {
    wallMat = new THREE.MeshStandardMaterial({
      map: getSharedGlassTex(),
      color: 0xffffff,
      roughness: 0.16,
      metalness: 0.72,
      emissive: 0xfef08a,
      emissiveMap: getSharedGlassTex(),
      emissiveIntensity: 0.1,
    });
  } else {
    const bundle = getSharedFacadeBundle(opts.style);
    wallMat = new THREE.MeshStandardMaterial({
      map: bundle.map,
      color: opts.wallColor,
      roughness: 0.65,
      metalness: 0.1,
      emissive: 0xfef08a,
      emissiveMap: bundle.emissiveMap,
      emissiveIntensity: 0.1,
    });
  }
  ctx.nightWindowMaterials.push(wallMat);

  // Base do térreo (pódio comercial/portaria)
  const baseMat = new THREE.MeshStandardMaterial({ color: opts.accentColor, roughness: 0.5, metalness: 0.2 });
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(opts.w + 0.5, 3.2, opts.d + 0.5), baseMat);
  baseMesh.position.y = 1.6;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Torre principal
  const body = new THREE.Mesh(new THREE.BoxGeometry(opts.w, totalH, opts.d), wallMat);
  body.position.y = totalH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Platibanda & cobertura no topo
  const roofTrim = new THREE.Mesh(
    new THREE.BoxGeometry(opts.w + 0.6, 0.7, opts.d + 0.6),
    new THREE.MeshStandardMaterial({ color: opts.accentColor, roughness: 0.45, metalness: 0.3 })
  );
  roofTrim.position.y = totalH + 0.35;
  roofTrim.castShadow = true;
  group.add(roofTrim);

  const penthouse = new THREE.Mesh(
    new THREE.BoxGeometry(opts.w * 0.45, 1.8, opts.d * 0.45),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  );
  penthouse.position.y = totalH + 1.5;
  penthouse.castShadow = true;
  group.add(penthouse);

  ctx.scene.add(group);
  const halfW = (opts.rotY ? opts.d : opts.w) / 2 + 0.3;
  const halfD = (opts.rotY ? opts.w : opts.d) / 2 + 0.3;
  ctx.boxColliders.push({
    minX: opts.x - halfW,
    maxX: opts.x + halfW,
    minZ: opts.z - halfD,
    maxZ: opts.z + halfD,
    name: `tower_${opts.x}_${opts.z}`,
  });
}

/**
 * Cria 5 igrejas distintas (Centro, Bairro Alto, Bairro Baixo, Jardim das Flores, Vila Alegre)
 */
export function buildChurchLandmark(
  ctx: CityLandmarkContext,
  opts: {
    id: string;
    name: string;
    x: number;
    z: number;
    variant: 'matriz' | 'bairro_alto' | 'bairro_baixo' | 'jardim_flores' | 'vila_alegre';
    rotY?: number;
  }
) {
  const group = new THREE.Group();
  group.position.set(opts.x, 0, opts.z);
  if (opts.rotY) group.rotation.y = opts.rotY;

  const wallColor =
    opts.variant === 'matriz'
      ? 0xf8fafc
      : opts.variant === 'bairro_alto'
        ? 0xffffff
        : opts.variant === 'jardim_flores'
          ? 0xe0f2fe
          : opts.variant === 'vila_alegre'
            ? 0xffedd5
            : 0xfef3c7;
  const trimColor =
    opts.variant === 'matriz'
      ? 0xd97706
      : opts.variant === 'bairro_alto'
        ? 0x0284c7
        : opts.variant === 'jardim_flores'
          ? 0x2563eb
          : opts.variant === 'vila_alegre'
            ? 0xea580c
            : 0xec4899;
  const roofColor =
    opts.variant === 'matriz'
      ? 0x7c2d12
      : opts.variant === 'bairro_alto'
        ? 0x1e3a8a
        : opts.variant === 'jardim_flores'
          ? 0x0369a1
          : opts.variant === 'vila_alegre'
            ? 0x9a3412
            : 0x0d9488;

  const w =
    opts.variant === 'matriz'
      ? 14
      : opts.variant === 'bairro_alto' || opts.variant === 'jardim_flores'
        ? 12.5
        : opts.variant === 'vila_alegre'
          ? 11
          : 8.5;
  const d =
    opts.variant === 'matriz'
      ? 18
      : opts.variant === 'bairro_alto' || opts.variant === 'jardim_flores'
        ? 15
        : opts.variant === 'vila_alegre'
          ? 14
          : 10.5;
  const h =
    opts.variant === 'matriz'
      ? 7.2
      : opts.variant === 'bairro_alto' || opts.variant === 'jardim_flores'
        ? 6.4
        : opts.variant === 'vila_alegre'
          ? 5.8
          : 4.8;
  const baseY = opts.variant === 'bairro_alto' ? 1.2 : 0; // Escadaria alta no Bairro Alto!

  const wallMat = new THREE.MeshStandardMaterial({
    map: getSharedConcreteTex(),
    color: wallColor,
    roughness: 0.68,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, roughness: 0.45, metalness: 0.25 });
  const roofMat = new THREE.MeshStandardMaterial({
    map: getSharedRoofTileTex(),
    color: roofColor,
    roughness: 0.6,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0xfef08a,
    emissiveIntensity: 0.28,
    roughness: 0.15,
    metalness: 0.6,
  });
  ctx.nightWindowMaterials.push(glassMat);

  // Escadaria frontal (especialmente grande na Igreja do Bairro Alto)
  if (baseY > 0) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, baseY, d + 2.6), trimMat);
    plinth.position.set(0, baseY / 2, 0.8);
    plinth.receiveShadow = true;
    plinth.castShadow = true;
    group.add(plinth);

    for (let s = 0; s < 5; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.24, 0.65),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
      );
      step.position.set(0, 0.12 + s * 0.24, d / 2 + 2.4 - s * 0.45);
      step.receiveShadow = true;
      group.add(step);
    }
  }

  // Nave principal aberta na frente para Theo entrar dentro!
  const doorW = 3.8;
  const sideFrontW = (w - doorW) / 2;

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.45), wallMat);
  backWall.position.set(0, baseY + h / 2, -d / 2 + 0.22);
  backWall.castShadow = true;
  group.add(backWall);

  for (const side of [-1, 1]) {
    const sWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, h, d), wallMat);
    sWall.position.set(side * (w / 2 - 0.22), baseY + h / 2, 0);
    sWall.castShadow = true;
    group.add(sWall);

    const fWall = new THREE.Mesh(new THREE.BoxGeometry(sideFrontW, h, 0.45), wallMat);
    fWall.position.set(side * (w / 2 - sideFrontW / 2), baseY + h / 2, d / 2 - 0.22);
    fWall.castShadow = true;
    group.add(fWall);

    // Vitrais laterais
    for (let v = -1; v <= 1; v++) {
      const stained = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 1.3), glassMat);
      stained.position.set(side * (w / 2 + 0.04), baseY + h * 0.52, v * 3.8);
      group.add(stained);
    }
  }

  // Piso interno + altar + bancos
  const churchFloor = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.5, 0.16, d - 0.5),
    new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 })
  );
  churchFloor.position.set(0, baseY + 0.08, 0);
  churchFloor.receiveShadow = true;
  group.add(churchFloor);

  const altar = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.1, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.45 })
  );
  altar.position.set(0, baseY + 0.65, -d / 2 + 2.2);
  group.add(altar);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, 2.0, 0.45), wallMat);
  lintel.position.set(0, baseY + h - 1.0, d / 2 - 0.22);
  group.add(lintel);

  // Telhado inclinado
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, 2.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  roof.position.set(0, baseY + h + 1.35, 0);
  roof.castShadow = true;
  group.add(roof);

  // Torre do sino (ou torres gêmeas no Jardim das Flores)
  const towerW =
    opts.variant === 'matriz' ? 4.2 : opts.variant === 'bairro_alto' ? 3.4 : opts.variant === 'vila_alegre' ? 3.2 : 2.6;
  const towerH =
    opts.variant === 'matriz'
      ? 11.5
      : opts.variant === 'bairro_alto'
        ? 9.0
        : opts.variant === 'jardim_flores'
          ? 8.8
          : opts.variant === 'vila_alegre'
            ? 7.8
            : 5.6;

  if (opts.variant === 'jardim_flores') {
    for (const side of [-1, 1]) {
      const tx = side * (w / 2 - towerW / 2 - 0.2);
      const tz = d / 2 - towerW / 2 - 0.3;
      const tMesh = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), wallMat);
      tMesh.position.set(tx, baseY + h + towerH / 2 - 0.5, tz);
      tMesh.castShadow = true;
      group.add(tMesh);

      const sp = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.78, 3.2, 4), roofMat);
      sp.rotation.y = Math.PI / 4;
      sp.position.set(tx, baseY + h + towerH + 1.1, tz);
      sp.castShadow = true;
      group.add(sp);
    }
  } else {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), wallMat);
    tower.position.set(0, baseY + h + towerH / 2 - 0.5, d / 2 - towerW / 2 - 0.3);
    tower.castShadow = true;
    group.add(tower);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.78, 3.6, 4), roofMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(0, baseY + h + towerH + 1.2, d / 2 - towerW / 2 - 0.3);
    spire.castShadow = true;
    group.add(spire);
  }

  // Sino Dourado visível na torre
  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.65, 1.0, 12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2, emissive: 0xca8a04, emissiveIntensity: 0.25 })
  );
  bell.position.set(0, baseY + h + towerH - 1.6, d / 2 - towerW / 2 - 0.3);
  group.add(bell);

  // Cruz iluminada no topo da torre
  const crossMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xfacc15,
    emissiveIntensity: 0.85,
    metalness: 0.8,
  });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 0.28), crossMat);
  crossV.position.set(0, baseY + h + towerH + 3.7, d / 2 - towerW / 2 - 0.3);
  group.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.28, 0.28), crossMat);
  crossH.position.set(0, baseY + h + towerH + 4.1, d / 2 - towerW / 2 - 0.3);
  group.add(crossH);

  // Letreiro Igreja
  const signLabel =
    opts.variant === 'matriz'
      ? 'IGREJA MATRIZ'
      : opts.variant === 'bairro_alto'
        ? 'IGREJA BAIRRO ALTO'
        : opts.variant === 'jardim_flores'
          ? 'IGREJA SÃO PEDRO'
          : opts.variant === 'vila_alegre'
            ? 'CAPELA VILA ALEGRE'
            : 'IGREJA BAIRRO BAIXO';
  const sign = createSignBannerMesh(signLabel, undefined, trimColor, '#ffffff', w * 0.65, 1.1);
  sign.position.set(0, baseY + h - 0.4, d / 2 + 0.2);
  group.add(sign);

  ctx.scene.add(group);

  // Colisores das paredes deixando porta da frente aberta
  const cosR = Math.cos(opts.rotY || 0);
  const sinR = Math.sin(opts.rotY || 0);
  const toWorld = (lx: number, lz: number) => ({
    x: opts.x + lx * cosR + lz * sinR,
    z: opts.z - lx * sinR + lz * cosR,
  });

  // Back wall collider
  const b1 = toWorld(-w / 2, -d / 2);
  const b2 = toWorld(w / 2, -d / 2 + 0.6);
  ctx.boxColliders.push({
    minX: Math.min(b1.x, b2.x) - 0.3,
    maxX: Math.max(b1.x, b2.x) + 0.3,
    minZ: Math.min(b1.z, b2.z) - 0.3,
    maxZ: Math.max(b1.z, b2.z) + 0.3,
    name: `${opts.id}_back`,
  });
  // Left & Right wall colliders
  for (const s of [-1, 1]) {
    const p1 = toWorld(s * (w / 2 - 0.3), -d / 2);
    const p2 = toWorld(s * (w / 2 + 0.3), d / 2);
    ctx.boxColliders.push({
      minX: Math.min(p1.x, p2.x) - 0.2,
      maxX: Math.max(p1.x, p2.x) + 0.2,
      minZ: Math.min(p1.z, p2.z) - 0.2,
      maxZ: Math.max(p1.z, p2.z) + 0.2,
      name: `${opts.id}_side_${s}`,
    });
  }

  const doorFront = toWorld(0, d / 2 + 1.8);
  const markerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.6 })
  );
  markerMesh.position.set(doorFront.x, 0.14, doorFront.z);
  ctx.scene.add(markerMesh);

  ctx.locations.push({
    id: opts.id,
    name: opts.name,
    category: 'landmark',
    position: new THREE.Vector3(doorFront.x, 0, doorFront.z),
    markerMesh,
    label: opts.name,
    radius: 4.5,
    isInside: false,
  });
}

/**
 * Cria prédio público/comercial realista com interior acessível ou fachada detalhada
 * (Shopping Center, Delegacia, Hospital, Prefeitura, Escola, Creche, Banco, Farmácia, Lan House, Posto)
 */
export function buildShoppingMall(ctx: CityLandmarkContext, x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const w = 32;
  const d = 22;
  const h = 11.5;

  const wallMat = new THREE.MeshStandardMaterial({
    map: createConcreteTexture('#f1f5f9'),
    color: 0xe0e7ff,
    roughness: 0.45,
    metalness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.75,
    transparent: true,
    opacity: 0.45,
  });

  // Piso do shopping
  const mallFloor = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.2, d),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.15 })
  );
  mallFloor.position.y = 0.1;
  mallFloor.receiveShadow = true;
  group.add(mallFloor);

  // Paredes laterais e traseira
  const backW = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), wallMat);
  backW.position.set(0, h / 2, -d / 2 + 0.25);
  backW.castShadow = true;
  group.add(backW);

  for (const side of [-1, 1]) {
    const sW = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, d), wallMat);
    sW.position.set(side * (w / 2 - 0.25), h / 2, 0);
    sW.castShadow = true;
    group.add(sW);
  }

  // Fachada de vidro ampla com grande entrada aberta no centro
  for (const side of [-1, 1]) {
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(11.5, h - 1.5, 0.22), glassMat);
    frontGlass.position.set(side * 10.2, (h - 1.5) / 2, d / 2 - 0.2);
    group.add(frontGlass);
  }

  // Lojas visíveis DENTRO do Shopping (vitrine luminosa de moda, brinquedos, eletrônicos)
  const storeColors = [0xec4899, 0x8b5cf6, 0x10b981, 0xf59e0b];
  for (let i = 0; i < 4; i++) {
    const sx = -10.5 + i * 7;
    const stall = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 4.2, 4.5),
      new THREE.MeshStandardMaterial({
        color: storeColors[i],
        emissive: storeColors[i],
        emissiveIntensity: 0.22,
        roughness: 0.4,
      })
    );
    stall.position.set(sx, 2.2, -d / 2 + 3.2);
    group.add(stall);
  }

  // Teto com claraboia de vidro
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 1, 0.6, d + 1),
    new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.45 })
  );
  roof.position.y = h + 0.3;
  roof.castShadow = true;
  group.add(roof);

  // Letreiro gigante luminoso SHOPPING
  const sign = createSignBannerMesh('SHOPPING CENTER', 'BAIRRO NOVO • LOJAS & LAZER', 0x312e81, '#facc15', 22, 2.8);
  sign.position.set(0, h + 1.8, d / 2 + 0.2);
  group.add(sign);

  // Estacionamento marcado na frente do Shopping
  const parkLot = new THREE.Mesh(
    new THREE.BoxGeometry(w + 4, 0.06, 11),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
  );
  parkLot.position.set(0, 0.03, d / 2 + 7);
  parkLot.receiveShadow = true;
  group.add(parkLot);

  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  for (let v = -3; v <= 3; v++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 4.6), stripeMat);
    line.position.set(v * 4.2, 0.05, d / 2 + 7);
    group.add(line);
  }

  ctx.scene.add(group);
  ctx.boxColliders.push(
    { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2 - 0.4, maxZ: z - d / 2 + 0.6, name: 'shopping_back' },
    { minX: x - w / 2 - 0.4, maxX: x - w / 2 + 0.6, minZ: z - d / 2, maxZ: z + d / 2, name: 'shopping_left' },
    { minX: x + w / 2 - 0.6, maxX: x + w / 2 + 0.4, minZ: z - d / 2, maxZ: z + d / 2, name: 'shopping_right' }
  );

  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.08, 20),
    new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.65 })
  );
  marker.position.set(x, 0.16, z + 2);
  ctx.scene.add(marker);

  ctx.locations.push({
    id: 'shopping_theo',
    name: 'Shopping Center Bairro Novo',
    category: 'shop',
    position: new THREE.Vector3(x, 0, z + 2),
    markerMesh: marker,
    label: 'Shopping Center',
    radius: 5.5,
    isInside: false,
  });
}

/**
 * Cria viatura da polícia ou ambulância estacionada 3D com giroflex
 */
export function buildEmergencyVehicle(
  ctx: CityLandmarkContext,
  x: number,
  z: number,
  rotY: number,
  type: 'police' | 'ambulance' | 'firetruck'
) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;

  const baseColor = type === 'police' ? 0x1e3a8a : type === 'firetruck' ? 0xdc2626 : 0xf8fafc;
  const accentColor = type === 'police' ? 0xf8fafc : type === 'firetruck' ? 0xf8fafc : 0xdc2626;

  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.85, type === 'firetruck' ? 5.6 : 4.3),
    new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.3, metalness: 0.5 })
  );
  chassis.position.y = 0.68;
  chassis.castShadow = true;
  g.add(chassis);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.85, 0.8, 2.3),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3, metalness: 0.4 })
  );
  cabin.position.set(0, 1.4, -0.2);
  cabin.castShadow = true;
  g.add(cabin);

  // Giroflex azul/vermelho no teto
  const sirenL = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.18, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 })
  );
  sirenL.position.set(-0.3, 1.88, -0.2);
  g.add(sirenL);

  const sirenR = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.18, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 1.5 })
  );
  sirenR.position.set(0.3, 1.88, -0.2);
  g.add(sirenR);

  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
  for (const [wx, wz] of [
    [-1.02, 1.35],
    [1.02, 1.35],
    [-1.02, -1.35],
    [1.02, -1.35],
  ]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, 0.36, wz);
    w.castShadow = true;
    g.add(w);
  }

  ctx.scene.add(g);
  ctx.circleColliders.push({ x, z, radius: 1.9, name: `${type}_parked_${x}_${z}` });
}

/**
 * Cria prédio temático acessível (Delegacia, Hospital, Prefeitura, Escola, Creche, Banco, Farmácia, Lanchonete, Lan House, Posto)
 */
export function buildCivicOrShopBuilding(
  ctx: CityLandmarkContext,
  opts: {
    id: string;
    name: string;
    category: 'shop' | 'job' | 'landmark';
    x: number;
    z: number;
    w: number;
    d: number;
    h: number;
    wallColor: number;
    roofColor: number;
    signTitle: string;
    signSubtitle?: string;
    signBg: number;
    signText?: string;
    rotY?: number;
    hasColumns?: boolean;
    hasRedCross?: boolean;
  }
) {
  const group = new THREE.Group();
  group.position.set(opts.x, 0, opts.z);
  if (opts.rotY) group.rotation.y = opts.rotY;

  const wallMat = new THREE.MeshStandardMaterial({
    map: createConcreteTexture('#f1f5f9'),
    color: opts.wallColor,
    roughness: 0.65,
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: opts.roofColor, roughness: 0.55 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(opts.w, 0.18, opts.d), floorMat);
  floor.position.y = 0.09;
  floor.receiveShadow = true;
  group.add(floor);

  const backW = new THREE.Mesh(new THREE.BoxGeometry(opts.w, opts.h, 0.4), wallMat);
  backW.position.set(0, opts.h / 2, -opts.d / 2 + 0.2);
  backW.castShadow = true;
  group.add(backW);

  const doorW = Math.min(4.2, opts.w * 0.42);
  const fSideW = (opts.w - doorW) / 2;

  for (const s of [-1, 1]) {
    const sW = new THREE.Mesh(new THREE.BoxGeometry(0.4, opts.h, opts.d), wallMat);
    sW.position.set(s * (opts.w / 2 - 0.2), opts.h / 2, 0);
    sW.castShadow = true;
    group.add(sW);

    const fW = new THREE.Mesh(new THREE.BoxGeometry(fSideW, opts.h, 0.4), wallMat);
    fW.position.set(s * (opts.w / 2 - fSideW / 2), opts.h / 2, opts.d / 2 - 0.2);
    fW.castShadow = true;
    group.add(fW);

    // Vitrine / janela luminosa na frente
    const winMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0xfef08a,
      emissiveIntensity: 0.12,
      roughness: 0.15,
      metalness: 0.7,
    });
    ctx.nightWindowMaterials.push(winMat);
    const win = new THREE.Mesh(new THREE.BoxGeometry(fSideW * 0.72, 2.1, 0.14), winMat);
    win.position.set(s * (opts.w / 2 - fSideW / 2), 2.1, opts.d / 2 + 0.02);
    group.add(win);
  }

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, 1.5, 0.4), wallMat);
  lintel.position.set(0, opts.h - 0.75, opts.d / 2 - 0.2);
  group.add(lintel);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(opts.w + 0.7, 0.5, opts.d + 0.7), roofMat);
  roof.position.y = opts.h + 0.25;
  roof.castShadow = true;
  group.add(roof);

  if (opts.hasColumns) {
    const colMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
    for (const cx of [-opts.w * 0.35, -doorW * 0.55, doorW * 0.55, opts.w * 0.35]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, opts.h, 12), colMat);
      col.position.set(cx, opts.h / 2, opts.d / 2 + 0.6);
      col.castShadow = true;
      group.add(col);
    }
  }

  if (opts.hasRedCross) {
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xef4444,
      emissiveIntensity: 0.85,
    });
    const cV = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.2, 0.2), crossMat);
    cV.position.set(0, opts.h + 1.6, opts.d / 2 + 0.1);
    group.add(cV);
    const cH = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.65, 0.2), crossMat);
    cH.position.set(0, opts.h + 1.6, opts.d / 2 + 0.1);
    group.add(cH);
  }

  const sign = createSignBannerMesh(
    opts.signTitle,
    opts.signSubtitle,
    opts.signBg,
    opts.signText || '#ffffff',
    Math.min(opts.w * 0.88, 12),
    1.5
  );
  sign.position.set(0, opts.h - 0.65, opts.d / 2 + 0.24);
  group.add(sign);

  ctx.scene.add(group);

  // Colisores das paredes deixando porta aberta
  const cosR = Math.cos(opts.rotY || 0);
  const sinR = Math.sin(opts.rotY || 0);
  const toWorld = (lx: number, lz: number) => ({
    x: opts.x + lx * cosR + lz * sinR,
    z: opts.z - lx * sinR + lz * cosR,
  });

  const b1 = toWorld(-opts.w / 2, -opts.d / 2);
  const b2 = toWorld(opts.w / 2, -opts.d / 2 + 0.5);
  ctx.boxColliders.push({
    minX: Math.min(b1.x, b2.x) - 0.2,
    maxX: Math.max(b1.x, b2.x) + 0.2,
    minZ: Math.min(b1.z, b2.z) - 0.2,
    maxZ: Math.max(b1.z, b2.z) + 0.2,
    name: `${opts.id}_back`,
  });

  for (const s of [-1, 1]) {
    const p1 = toWorld(s * (opts.w / 2 - 0.3), -opts.d / 2);
    const p2 = toWorld(s * (opts.w / 2 + 0.3), opts.d / 2);
    ctx.boxColliders.push({
      minX: Math.min(p1.x, p2.x) - 0.2,
      maxX: Math.max(p1.x, p2.x) + 0.2,
      minZ: Math.min(p1.z, p2.z) - 0.2,
      maxZ: Math.max(p1.z, p2.z) + 0.2,
      name: `${opts.id}_side_${s}`,
    });
  }

  const doorPos = toWorld(0, opts.d / 2 + 1.4);
  const markerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 0.08, 18),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.55 })
  );
  markerMesh.position.set(doorPos.x, 0.14, doorPos.z);
  ctx.scene.add(markerMesh);

  ctx.locations.push({
    id: opts.id,
    name: opts.name,
    category: opts.category,
    position: new THREE.Vector3(doorPos.x, 0, doorPos.z),
    markerMesh,
    label: opts.signTitle,
    radius: 4.5,
    isInside: false,
  });
}

/**
 * Posto de Gasolina realista com cobertura iluminada e 4 bombas de combustível
 */
export function buildGasStation(ctx: CityLandmarkContext, x: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // Cobertura sustentada por 4 pilares
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.85, 11),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35 })
  );
  canopy.position.set(0, 5.2, 0);
  canopy.castShadow = true;
  g.add(canopy);

  const canopySign = createSignBannerMesh('POSTO DE GASOLINA', 'ABERTA 24H', 0x0f172a, '#facc15', 11, 1.3);
  canopySign.position.set(0, 5.2, 5.65);
  g.add(canopySign);

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.4 });
  for (const [px, pz] of [
    [-6.2, -4],
    [6.2, -4],
    [-6.2, 4],
    [6.2, 4],
  ]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 5.0, 12), pillarMat);
    p.position.set(px, 2.5, pz);
    p.castShadow = true;
    g.add(p);
  }

  // 4 Bombas de Combustível
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
  for (const bx of [-3.5, 3.5]) {
    const island = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.25, 4.5),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 })
    );
    island.position.set(bx, 0.12, 0);
    g.add(island);

    for (const bz of [-1.2, 1.2]) {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.9, 0.75), pumpMat);
      pump.position.set(bx, 1.15, bz);
      pump.castShadow = true;
      g.add(pump);

      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.45, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x38bdf8, emissiveIntensity: 0.8 })
      );
      screen.position.set(bx, 1.5, bz + 0.38);
      g.add(screen);
    }
  }

  ctx.scene.add(g);
  ctx.boxColliders.push(
    { minX: x - 4.7, maxX: x - 2.3, minZ: z - 2.3, maxZ: z + 2.3, name: 'gas_pump_l' },
    { minX: x + 2.3, maxX: x + 4.7, minZ: z - 2.3, maxZ: z + 2.3, name: 'gas_pump_r' }
  );

  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.08, 16),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.6 })
  );
  marker.position.set(x, 0.14, z + 7);
  ctx.scene.add(marker);

  ctx.locations.push({
    id: 'posto_gasolina',
    name: 'Posto de Gasolina Bairro Novo',
    category: 'shop',
    position: new THREE.Vector3(x, 0, z + 7),
    markerMesh: marker,
    label: 'Posto de Gasolina',
    radius: 4.5,
    isInside: false,
  });
}

/**
 * Casas Residenciais Variadas (quintal com cerca, garagem, muro colorido, simples)
 */
export function buildHouseVariant(
  ctx: CityLandmarkContext,
  opts: {
    x: number;
    z: number;
    wallColor: number;
    roofColor: number;
    variant: 'quintal' | 'garagem' | 'muro_colorido' | 'simples';
    fenceColor?: number;
  }
) {
  const g = new THREE.Group();
  g.position.set(opts.x, 0, opts.z);

  const wallMat = new THREE.MeshStandardMaterial({ color: opts.wallColor, roughness: 0.68 });
  const roofMat = new THREE.MeshStandardMaterial({
    map: createRoofTileTexture(),
    color: opts.roofColor,
    roughness: 0.58,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.4, 7.6), wallMat);
  body.position.y = 2.2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2.5, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 5.6;
  roof.castShadow = true;
  g.add(roof);

  // Porta e janelas que acendem à noite
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 2.3, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
  );
  door.position.set(-1.5, 1.15, 3.85);
  g.add(door);

  const winMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0xfef08a,
    emissiveIntensity: 0.15,
    roughness: 0.15,
  });
  ctx.nightWindowMaterials.push(winMat);
  const win = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.3, 0.16), winMat);
  win.position.set(1.8, 2.3, 3.85);
  g.add(win);

  if (opts.variant === 'garagem') {
    const garage = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 3.4, 5.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
    );
    garage.position.set(6.2, 1.7, 0.4);
    garage.castShadow = true;
    g.add(garage);

    const gDoor = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.5, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 })
    );
    gDoor.position.set(6.2, 1.25, 3.05);
    g.add(gDoor);
  }

  if (opts.variant === 'quintal' || opts.variant === 'muro_colorido') {
    const fCol = opts.fenceColor ?? (opts.variant === 'muro_colorido' ? 0xf59e0b : 0xf8fafc);
    const fH = opts.variant === 'muro_colorido' ? 1.35 : 0.9;
    const fenceMat = new THREE.MeshStandardMaterial({ color: fCol, roughness: 0.7 });
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(0.25, fH, 5.5), fenceMat);
    leftF.position.set(-5.2, fH / 2, 6.2);
    g.add(leftF);
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(0.25, fH, 5.5), fenceMat);
    rightF.position.set(5.2, fH / 2, 6.2);
    g.add(rightF);
  }

  ctx.scene.add(g);
  ctx.customerHouses.push(new THREE.Vector3(opts.x, 0, opts.z + 5.5));
  ctx.mailboxes.push(new THREE.Vector3(opts.x - 3.0, 0, opts.z + 5.2));
  ctx.boxColliders.push({
    minX: opts.x - 4.3,
    maxX: opts.x + (opts.variant === 'garagem' ? 8.5 : 4.3),
    minZ: opts.z - 4.0,
    maxZ: opts.z + 4.0,
    name: `house_var_${opts.x}_${opts.z}`,
  });
}

/**
 * Rio atravessando a cidade + Pontes conectando os bairros
 */
export function buildRiverAndBridges(
  ctx: CityLandmarkContext,
  riverZ: number,
  bridgeXPositions: number[],
  riverWidthSpan = 480,
  riverCenterX = -42
) {
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.5,
    transparent: true,
    opacity: 0.85,
  });

  const riverGeo = new THREE.PlaneGeometry(riverWidthSpan, 14);
  riverGeo.rotateX(-Math.PI / 2);
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.position.set(riverCenterX, 0.05, riverZ);
  ctx.scene.add(riverMesh);

  // Margens de pedra do rio
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  for (const side of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(riverWidthSpan, 0.55, 1.4), bankMat);
    bank.position.set(riverCenterX, 0.25, riverZ + side * 7.4);
    bank.receiveShadow = true;
    ctx.scene.add(bank);
  }

  // Pontes rodoviárias e de pedestres ligando os bairros sobre o rio
  const concreteMat = new THREE.MeshStandardMaterial({
    map: getSharedConcreteTex(),
    roughness: 0.75,
  });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.35 });

  bridgeXPositions.forEach((bx) => {
    const bridge = new THREE.Group();
    bridge.position.set(bx, 0, riverZ);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.65, 16.5), concreteMat);
    deck.position.y = 0.35;
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridge.add(deck);

    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.15, 16.5), railMat);
      rail.position.set(side * 5.9, 1.1, 0);
      rail.castShadow = true;
      bridge.add(rail);
    }

    ctx.scene.add(bridge);
  });
}

/**
 * Feira Livre com barracas coloridas
 */
export function buildFeiraLivre(ctx: CityLandmarkContext, x: number, z: number) {
  const colors = [0xef4444, 0xfacc15, 0x22c55e, 0x3b82f6, 0xf97316, 0xa855f7];
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  for (let i = 0; i < 6; i++) {
    const sx = (i % 3 - 1) * 5.2;
    const sz = Math.floor(i / 3) * 5.5 - 2.6;

    const table = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.9, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 })
    );
    table.position.set(sx, 0.45, sz);
    table.castShadow = true;
    g.add(table);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.2, 2.2),
      new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.5 })
    );
    canopy.position.set(sx, 2.6, sz);
    canopy.rotation.x = 0.14;
    canopy.castShadow = true;
    g.add(canopy);
  }

  ctx.scene.add(g);
}

/**
 * Parque com Playground (escorregador, balanço, gangorra), Quadra de Basquete e Lago
 */
export function buildPlaygroundAndCourtPark(ctx: CityLandmarkContext, x: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // Lago ornamental no parque
  const lakeGeo = new THREE.CircleGeometry(7.5, 24);
  lakeGeo.rotateX(-Math.PI / 2);
  const lake = new THREE.Mesh(
    lakeGeo,
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.45 })
  );
  lake.position.set(-8, 0.04, -5);
  g.add(lake);

  // Playground colorido (escorregador + balanço)
  const slideTower = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 3.2, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
  );
  slideTower.position.set(6, 1.6, -6);
  slideTower.castShadow = true;
  g.add(slideTower);

  const slideRamp = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.2, 4.2),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
  );
  slideRamp.position.set(6, 1.35, -3.5);
  slideRamp.rotation.x = 0.55;
  g.add(slideRamp);

  // Balanço
  const swingBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4.8, 10),
    new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.5 })
  );
  swingBar.rotation.z = Math.PI / 2;
  swingBar.position.set(11, 3.1, -6);
  g.add(swingBar);

  // Quadra poliesportiva / basquete do parque
  const court = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.08, 9),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 })
  );
  court.position.set(4, 0.04, 7.5);
  court.receiveShadow = true;
  g.add(court);

  for (const s of [-1, 1]) {
    const hoopPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 3.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    hoopPost.position.set(4 + s * 6.5, 1.8, 7.5);
    g.add(hoopPost);

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 1.2, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    board.position.set(4 + s * 6.1, 3.4, 7.5);
    g.add(board);
  }

  ctx.scene.add(g);
}

/**
 * Placa verde com nome de rua nos cruzamentos
 */
export function buildStreetNameSign(ctx: CityLandmarkContext, x: number, z: number, streetName: string, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 3.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
  );
  pole.position.y = 1.7;
  pole.castShadow = true;
  g.add(pole);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.7, 0.12),
    new THREE.MeshStandardMaterial({ map: createStreetSignTexture(streetName), roughness: 0.35 })
  );
  board.position.y = 3.2;
  board.castShadow = true;
  g.add(board);

  ctx.scene.add(g);
}

/**
 * Mobiliário urbano (Pontos de ônibus, Lixeiras, Carrinhos de Supermercado) no detailGroup (LOD!)
 */
export function buildBusStopAndStreetFurniture(
  ctx: CityLandmarkContext,
  busStops: [number, number, number][],
  trashBins: [number, number][],
  shoppingCarts: [number, number][]
) {
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.55 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const binMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });

  busStops.forEach(([x, z, rotY]) => {
    const bs = new THREE.Group();
    bs.position.set(x, 0.1, z);
    bs.rotation.y = rotY;

    const back = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.3, 0.12), glassMat);
    back.position.set(0, 1.2, -0.8);
    bs.add(back);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.18, 1.9), roofMat);
    roof.position.set(0, 2.45, 0);
    roof.castShadow = true;
    bs.add(roof);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.6), metalMat);
    bench.position.set(0, 0.5, -0.3);
    bs.add(bench);

    ctx.detailGroup.add(bs);
  });

  trashBins.forEach(([x, z]) => {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.85, 10), binMat);
    bin.position.set(x, 0.52, z);
    bin.castShadow = true;
    ctx.detailGroup.add(bin);
  });

  shoppingCarts.forEach(([x, z]) => {
    const cart = new THREE.Group();
    cart.position.set(x, 0.1, z);
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.55, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    basket.position.y = 0.65;
    cart.add(basket);
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x16a34a })
    );
    handle.position.set(0, 0.95, -0.6);
    cart.add(handle);
    ctx.detailGroup.add(cart);
  });
}
