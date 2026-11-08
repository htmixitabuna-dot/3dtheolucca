import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator
 * Zero external image dependencies - Generates crystal-clear CanvasTextures
 * with sRGBColorSpace, LinearMipmapLinearFilter and anisotropy for razor-sharp visual clarity.
 */
function finalizeTexture(tex: THREE.CanvasTexture): THREE.CanvasTexture {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

// 1. Textura de Asfalto Realista com Grãos, Desgaste e Faixas
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base de asfalto escuro
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(0, 0, 256, 256);

  // Ruído de agregados e pedriscos
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Marcas sutis de desgaste de pneus
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, 'rgba(15, 20, 25, 0.4)');
  grad.addColorStop(0.2, 'rgba(35, 42, 55, 0.1)');
  grad.addColorStop(0.5, 'rgba(15, 20, 25, 0.3)');
  grad.addColorStop(0.8, 'rgba(35, 42, 55, 0.1)');
  grad.addColorStop(1, 'rgba(15, 20, 25, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}

// 2. Textura de Calçada com Placas de Concreto e Juntas
export function createSidewalkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Concreto cinza claro
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 256, 256);

  // Textura granular de cimento
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Grade de lajotas quadradas com rejunte chanfrado
  const tileSize = 64;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  for (let x = 0; x <= 256; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Borda de chanfro suave
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  for (let x = 1; x <= 256; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}

// 3. Textura de Grama Verde Orgânica Natural
export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base verde gramado
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 0, 256, 256);

  // Variação multi-tom de folhagem e terra
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const shift = (Math.random() - 0.5) * 40;
    data[i] = Math.min(255, Math.max(20, 34 + shift * 0.4));
    data[i + 1] = Math.min(255, Math.max(70, 197 + shift));
    data[i + 2] = Math.min(255, Math.max(20, 94 + shift * 0.5));
  }
  ctx.putImageData(imgData, 0, 0);

  // Lâminas de grama desenhadas suavemente
  ctx.strokeStyle = 'rgba(21, 128, 61, 0.4)';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 250; k++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 5, y - Math.random() * 7);
    ctx.stroke();
  }

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}

// 4. Textura de Areia Granular Dourada da Praia
export function createSandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fde047';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, 253 + noise * 0.5));
    data[i + 1] = Math.min(255, Math.max(0, 224 + noise));
    data[i + 2] = Math.min(255, Math.max(0, 100 + noise * 1.2));
  }
  ctx.putImageData(imgData, 0, 0);

  // Ondulações sutis de vento
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
  ctx.lineWidth = 2.5;
  for (let y = 15; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(64, y + 8, 192, y - 8, 256, y);
    ctx.stroke();
  }

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}

// 5. Textura de Tijolos Cerâmicos para Edifícios
export function createBrickTexture(brickColor: string = '#b91c1c', mortarColor: string = '#cbd5e1'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = mortarColor;
  ctx.fillRect(0, 0, 256, 256);

  const brickH = 24;
  const brickW = 48;

  ctx.fillStyle = brickColor;
  for (let row = 0; row < 12; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 7; col++) {
      const bx = col * (brickW + 3) + offset;
      const by = row * (brickH + 3);

      ctx.fillRect(bx, by, brickW, brickH);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
      ctx.fillStyle = brickColor;
    }
  }

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}

// 6. Textura de Piso Cerâmico Quadriculado (Pizzaria & Lojas)
export function createCheckeredFloorTexture(c1: string = '#ffffff', c2: string = '#b91c1c'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const tileSize = 48;
  for (let x = 0; x < 256; x += tileSize) {
    for (let y = 0; y < 256; y += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? c1 : c2;
      ctx.fillRect(x, y, tileSize, tileSize);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}

// 7. Textura de Piso de Madeira Nobre (Padaria & Lojas)
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 256, 256);

  const plankH = 32;
  for (let y = 0; y < 256; y += plankH) {
    const tone = (Math.random() - 0.5) * 30;
    ctx.fillStyle = `rgb(${180 + tone}, ${83 + tone * 0.6}, ${9 + tone * 0.2})`;
    ctx.fillRect(0, y, 256, plankH - 2);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, y + plankH - 2, 256, 2);

    ctx.strokeStyle = 'rgba(69, 26, 3, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 4 + i * 8);
      ctx.bezierCurveTo(64, y + 3 + i * 8, 192, y + 7 + i * 8, 256, y + 5 + i * 8);
      ctx.stroke();
    }
  }

  return finalizeTexture(new THREE.CanvasTexture(canvas));
}
