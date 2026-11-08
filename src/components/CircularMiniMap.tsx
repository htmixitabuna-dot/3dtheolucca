import React, { useState } from 'react';
import { 
  Maximize2, 
  Target, 
  X, 
  Navigation,
  Compass,
  MapPin,
  Sparkles
} from 'lucide-react';
import { ActiveJob, MainMission } from '../simulation/GameEngine';
import { CITY_DISTRICTS, CITY_ROADS, MapDistrict } from './NavigationMiniMap';

export interface CircularMiniMapProps {
  playerX: number;
  playerZ: number;
  playerRotation: number;
  targetPos: { x: number; z: number; name?: string } | null;
  activeJob: ActiveJob | null;
  currentMission: MainMission;
  expansionLevel: number;
  locations: { id: string; name: string; category: string; x: number; z: number }[];
  npcs: { name: string; role: string; gender: 'male' | 'female'; x: number; z: number }[];
  cars: { x: number; z: number; colorName: string }[];
  motos: { x: number; z: number; colorName: string }[];
  onSetGPSDestination?: (x: number, z: number, name: string) => void;
}

export const CircularMiniMap: React.FC<CircularMiniMapProps> = ({
  playerX,
  playerZ,
  playerRotation,
  targetPos,
  activeJob,
  currentMission,
  expansionLevel,
  locations,
  npcs,
  cars,
  motos,
  onSetGPSDestination,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'close' | 'far'>('close');
  const [selectedDistrict, setSelectedDistrict] = useState<MapDistrict | null>(null);

  // Determina as coordenadas do objetivo atual da missão
  let targetX = -14;
  let targetZ = -14;
  let targetTitle = 'Missão';

  if (targetPos) {
    targetX = targetPos.x;
    targetZ = targetPos.z;
    targetTitle = targetPos.name || 'Ponto da Missão';
  } else if (activeJob) {
    targetX = activeJob.targetPos.x;
    targetZ = activeJob.targetPos.z;
    targetTitle = activeJob.targetName || activeJob.name;
  } else if (currentMission) {
    targetX = -14;
    targetZ = -14;
    targetTitle = currentMission.title;
  }

  // Raio do radar em metros no mundo (60m no modo perto, 120m no modo aberto)
  const radarRadius = zoomLevel === 'close' ? 60 : 120;

  // Centro do SVG do radar circular (viewBox 0 0 100 100)
  const cx = 50;
  const cy = 50;
  const R = 43; // Raio máximo utilizável dentro do círculo com margem

  // Rastreamento relativo entre o jogador e o objetivo da missão usando playerX e playerZ
  const deltaX = targetX - playerX;
  const deltaZ = targetZ - playerZ;
  const distanceToTarget = Math.hypot(deltaX, deltaZ);

  // Projeção relativa no radar: Theo Lucca fica SEMPRE no centro (cx, cy)
  const relTargetX = (deltaX / radarRadius) * R;
  const relTargetY = (deltaZ / radarRadius) * R;
  const distFromCenter = Math.hypot(relTargetX, relTargetY);

  // Se o objetivo estiver além do radar, fixa na borda do círculo com ponteiro direcional
  const isTargetClamped = distFromCenter > (R - 4);
  const targetAngleRad = Math.atan2(relTargetY, relTargetX);
  const targetAngleDeg = (targetAngleRad * 180) / Math.PI;

  const targetSvgX = isTargetClamped
    ? cx + Math.cos(targetAngleRad) * (R - 3.8)
    : cx + relTargetX;

  const targetSvgY = isTargetClamped
    ? cy + Math.sin(targetAngleRad) * (R - 3.8)
    : cy + relTargetY;

  // Rotação do cone de visão do jogador Theo Lucca
  const playerAngleDeg = (-playerRotation * 180) / Math.PI + 180;

  // Bússola Dinâmica: rotação dos pontos cardeais em torno da borda baseada em playerRotationY
  const compassAngleDeg = ((-playerRotation * 180) / Math.PI + 180) % 360;
  const headingDegrees = Math.round((compassAngleDeg + 360) % 360);

  // Sigla do rumo atual (N, NE, E, SE, S, SW, W, NW)
  const headingCardinal = 
    headingDegrees >= 338 || headingDegrees < 23 ? 'N' :
    headingDegrees >= 23 && headingDegrees < 68 ? 'NE' :
    headingDegrees >= 68 && headingDegrees < 113 ? 'E' :
    headingDegrees >= 113 && headingDegrees < 158 ? 'SE' :
    headingDegrees >= 158 && headingDegrees < 203 ? 'S' :
    headingDegrees >= 203 && headingDegrees < 248 ? 'SW' :
    headingDegrees >= 248 && headingDegrees < 293 ? 'W' : 'NW';

  // Configuração dos 4 pontos cardeais (N, S, E, W) e intermediários orbitando na borda
  const cardinalRadius = 39.5;
  const tickOuterRadius = 43.5;

  const CARDINAL_ITEMS = [
    { label: 'N', offset: 0, isMajor: true, color: '#facc15' },
    { label: 'NE', offset: 45, isMajor: false, color: '#64748b' },
    { label: 'E', offset: 90, isMajor: true, color: '#38bdf8' },
    { label: 'SE', offset: 135, isMajor: false, color: '#64748b' },
    { label: 'S', offset: 180, isMajor: true, color: '#fbbf24' },
    { label: 'SW', offset: 225, isMajor: false, color: '#64748b' },
    { label: 'W', offset: 270, isMajor: true, color: '#38bdf8' },
    { label: 'NW', offset: 315, isMajor: false, color: '#64748b' },
  ];

  // Marcas graduadas na borda a cada 15 graus
  const COMPASS_TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

  // Função utilitária para projetar coordenadas do mundo no radar relativo ao jogador
  const worldToRadar = (wx: number, wz: number) => {
    const rx = ((wx - playerX) / radarRadius) * R;
    const ry = ((wz - playerZ) / radarRadius) * R;
    return {
      x: cx + rx,
      y: cy + ry,
      dist: Math.hypot(rx, ry),
    };
  };

  // Filtra elementos que estão visíveis dentro ou perto do radar
  const visibleRoads = CITY_ROADS.map((road) => {
    const p1 = worldToRadar(road.x1, road.z1);
    const p2 = worldToRadar(road.x2, road.z2);
    return { road, p1, p2 };
  });

  const visibleNPCs = npcs
    .map((npc) => ({ ...npc, ...worldToRadar(npc.x, npc.z) }))
    .filter((n) => n.dist <= R);

  const visibleCars = cars
    .map((car) => ({ ...car, ...worldToRadar(car.x, car.z) }))
    .filter((c) => c.dist <= R);

  const visibleMotos = motos
    .map((moto) => ({ ...moto, ...worldToRadar(moto.x, moto.z) }))
    .filter((m) => m.dist <= R);

  const visibleLocations = locations
    .map((loc) => ({ ...loc, ...worldToRadar(loc.x, loc.z) }))
    .filter((l) => l.dist <= R + 8);

  // Projeção global para o mapa expandido
  const minX = -105;
  const maxX = 105;
  const minZ = -105;
  const maxZ = 65;

  const worldToFullMap = (wx: number, wz: number) => {
    const px = ((wx - minX) / (maxX - minX)) * 90 + 5;
    const pz = ((wz - minZ) / (maxZ - minZ)) * 90 + 5;
    return {
      x: Math.max(3, Math.min(97, px)),
      y: Math.max(3, Math.min(97, pz)),
    };
  };

  return (
    <>
      {/* =========================================================================
          RADAR CIRCULAR GTA NO CANTO SUPERIOR ESQUERDO
         ========================================================================= */}
      <div className="flex flex-col items-center select-none pointer-events-auto">
        
        {/* CONTAINER CIRCULAR COM MOLDURA DOURADA E SOMBRA NEON */}
        <div
          onClick={() => setIsExpanded(true)}
          className="relative w-20 h-20 min-[380px]:w-22 min-[380px]:h-22 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-slate-950/95 border-[3px] sm:border-[3.5px] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center justify-center group overflow-visible"
          title="Toque para abrir o Mapa GPS Completo"
        >
          {/* SVG DO RADAR CIRCULAR */}
          <svg className="w-full h-full rounded-full" viewBox="0 0 100 100">
            <defs>
              {/* Máscara de corte estritamente circular */}
              <clipPath id="circularRadarClip">
                <circle cx="50" cy="50" r="44" />
              </clipPath>

              {/* Brilho neon para a rota GPS e o ponto da missão */}
              <filter id="radarTargetGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Conteúdo cortado dentro do círculo do radar */}
            <g clipPath="url(#circularRadarClip)">
              {/* Fundo escuro do radar */}
              <rect x="0" y="0" width="100" height="100" fill="#020617" />
              
              {/* Grade tática de radar */}
              <circle cx="50" cy="50" r="14" fill="none" stroke="#334155" strokeWidth="0.6" strokeDasharray="1,1" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="#334155" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#475569" strokeWidth="0.8" />

              {/* Mira / Eixos de Coordenadas */}
              <line x1="50" y1="6" x2="50" y2="94" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6" />
              <line x1="6" y1="50" x2="94" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6" />

              {/* Ruas Asfaltadas Deslocando-se em Tempo Real sob Theo Lucca */}
              {visibleRoads.map(({ road, p1, p2 }, idx) => (
                <g key={`r-road-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#475569"
                    strokeWidth={road.isMain ? 4.5 : 3.0}
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  {road.isMain && (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#facc15"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                      opacity="0.9"
                    />
                  )}
                </g>
              ))}

              {/* Lojas e Pontos de Interesse Próximos */}
              {visibleLocations.map((loc) => (
                <circle
                  key={`r-loc-${loc.id}`}
                  cx={loc.x}
                  cy={loc.y}
                  r="2.2"
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="0.6"
                />
              ))}

              {/* Moradores Próximos Andando */}
              {visibleNPCs.map((npc, idx) => (
                <circle
                  key={`r-npc-${idx}`}
                  cx={npc.x}
                  cy={npc.y}
                  r="1.5"
                  fill={npc.gender === 'female' ? '#f43f5e' : '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              ))}

              {/* Veículos em Trânsito Próximos */}
              {visibleCars.map((car, idx) => (
                <rect
                  key={`r-car-${idx}`}
                  x={car.x - 1.4}
                  y={car.y - 1.4}
                  width="2.8"
                  height="2.8"
                  rx="0.5"
                  fill="#f97316"
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              ))}

              {visibleMotos.map((moto, idx) => (
                <circle
                  key={`r-moto-${idx}`}
                  cx={moto.x}
                  cy={moto.y}
                  r="1.4"
                  fill="#eab308"
                  stroke="#ffffff"
                  strokeWidth="0.4"
                />
              ))}

              {/* LINHA DE GUIA GPS EM AMARELO OURO DO THEO ATÉ O ALVO */}
              <line
                x1={cx}
                y1={cy}
                x2={targetSvgX}
                y2={targetSvgY}
                stroke="#facc15"
                strokeWidth="2.2"
                strokeDasharray="2.5,2"
                strokeLinecap="round"
                filter="url(#radarTargetGlow)"
              />

              {/* INDICADOR DO OBJETIVO DA MISSÃO (★) */}
              {isTargetClamped ? (
                // Alvo além do radar: pino e seta direcional na borda do círculo
                <g>
                  {/* Seta direcional apontando na direção do alvo */}
                  <polygon
                    points="0,-3.5 3.5,3.5 0,1.5 -3.5,3.5"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    transform={`translate(${targetSvgX}, ${targetSvgY}) rotate(${targetAngleDeg + 90})`}
                  />
                  {/* Ponto na borda */}
                  <circle
                    cx={targetSvgX}
                    cy={targetSvgY}
                    r="3.4"
                    fill="#eab308"
                    stroke="#ffffff"
                    strokeWidth="1.0"
                    filter="url(#radarTargetGlow)"
                  />
                  <text
                    x={targetSvgX}
                    y={targetSvgY + 1.2}
                    fontSize="3.8"
                    fill="#0f172a"
                    textAnchor="middle"
                    fontWeight="900"
                  >
                    ★
                  </text>
                </g>
              ) : (
                // Alvo visível dentro do círculo do radar
                <g>
                  <circle
                    cx={targetSvgX}
                    cy={targetSvgY}
                    r="7"
                    fill="#f59e0b"
                    fillOpacity="0.4"
                    className="animate-ping"
                  />
                  <circle
                    cx={targetSvgX}
                    cy={targetSvgY}
                    r="4.2"
                    fill="#eab308"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    filter="url(#radarTargetGlow)"
                  />
                  <text
                    x={targetSvgX}
                    y={targetSvgY + 1.4}
                    fontSize="4.6"
                    fill="#0f172a"
                    textAnchor="middle"
                    fontWeight="900"
                  >
                    ★
                  </text>
                </g>
              )}

              {/* THEO LUCCA NO CENTRO EXATO DO RADAR CIRCULAR */}
              <g transform={`translate(${cx}, ${cy})`}>
                {/* Cone de visão dinâmico */}
                <path
                  d="M 0 0 L -6 -16 L 6 -16 Z"
                  fill="#38bdf8"
                  fillOpacity="0.35"
                  transform={`rotate(${playerAngleDeg})`}
                />

                {/* Seta direcional de Theo Lucca */}
                <g transform={`rotate(${playerAngleDeg})`}>
                  <polygon
                    points="0,-5.5 3.8,3.8 0,1.5 -3.8,3.8"
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                </g>

                {/* Ponto central azul neon */}
                <circle cx="0" cy="0" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
              </g>

              {/* Anel de borda interna do radar */}
              <circle cx="50" cy="50" r="43.5" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
            </g>

            {/* ===================================================================
                BÚSSOLA DINÂMICA: PONTOS CARDEAIS (N, S, E, W) GIRANDO NA BORDA
                COM BASE NO playerRotationY DO THEO LUCCA
               =================================================================== */}
            <g className="pointer-events-none select-none">
              {/* Marcas graduadas (ticks) na borda externa girando dinamicamente */}
              {COMPASS_TICKS.map((tickAngle) => {
                const totalRad = ((compassAngleDeg + tickAngle) * Math.PI) / 180;
                const isCardinal = tickAngle % 90 === 0;
                const isSubCardinal = tickAngle % 45 === 0;
                const r1 = isCardinal ? 40.5 : (isSubCardinal ? 41.5 : 42.5);
                const r2 = tickOuterRadius;
                const x1 = cx + r1 * Math.sin(totalRad);
                const y1 = cy - r1 * Math.cos(totalRad);
                const x2 = cx + r2 * Math.sin(totalRad);
                const y2 = cy - r2 * Math.cos(totalRad);

                return (
                  <line
                    key={`tick-${tickAngle}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isCardinal ? '#facc15' : (isSubCardinal ? '#38bdf8' : '#475569')}
                    strokeWidth={isCardinal ? 1.4 : (isSubCardinal ? 0.9 : 0.5)}
                    strokeOpacity={isCardinal ? 1 : 0.65}
                  />
                );
              })}

              {/* Indicadores Cardeais Dinâmicos (N, S, E, W) Orbitando na Borda */}
              {CARDINAL_ITEMS.map((item) => {
                const itemRad = ((compassAngleDeg + item.offset) * Math.PI) / 180;
                const posRadius = item.isMajor ? cardinalRadius : cardinalRadius + 0.5;
                const x = cx + posRadius * Math.sin(itemRad);
                const y = cy - posRadius * Math.cos(itemRad);

                // Destaque para o NORTE (N) com ponteiro especial e ouro neon
                if (item.label === 'N') {
                  const arrowTipX = cx + 43.5 * Math.sin(itemRad);
                  const arrowTipY = cy - 43.5 * Math.cos(itemRad);
                  const arrowDeg = (compassAngleDeg + item.offset);

                  return (
                    <g key={`cardinal-${item.label}`}>
                      {/* Seta direcional do Norte na borda */}
                      <polygon
                        points="0,-3.2 2.4,1.8 -2.4,1.8"
                        fill="#facc15"
                        stroke="#0f172a"
                        strokeWidth="0.5"
                        transform={`translate(${arrowTipX}, ${arrowTipY}) rotate(${arrowDeg})`}
                        filter="url(#radarTargetGlow)"
                      />
                      {/* Círculo de contraste e letra N */}
                      <circle cx={x} cy={y} r="3.2" fill="#020617" fillOpacity="0.88" stroke="#facc15" strokeWidth="0.8" />
                      <text
                        x={x}
                        y={y}
                        fontSize="4.4"
                        fill="#facc15"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontWeight="900"
                        fontFamily="monospace"
                        filter="url(#radarTargetGlow)"
                      >
                        N
                      </text>
                    </g>
                  );
                }

                // Cardinais principais: E, S, W
                if (item.isMajor) {
                  return (
                    <g key={`cardinal-${item.label}`}>
                      <circle cx={x} cy={y} r="2.8" fill="#020617" fillOpacity="0.82" stroke={item.color} strokeWidth="0.6" />
                      <text
                        x={x}
                        y={y}
                        fontSize="3.8"
                        fill={item.color}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontWeight="800"
                        fontFamily="monospace"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                }

                // Subcardinais intermediários (NE, SE, SW, NW)
                return (
                  <text
                    key={`cardinal-${item.label}`}
                    x={x}
                    y={y}
                    fontSize="2.4"
                    fill={item.color}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontWeight="700"
                    fontFamily="monospace"
                    opacity="0.75"
                  >
                    {item.label}
                  </text>
                );
              })}
            </g>
          </svg>

          {/* BADGE DIGITAL DE RUMO (CARDINAL + GRAUS) */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-slate-950/95 border border-amber-400 text-[8px] font-mono font-black text-amber-300 shadow-lg flex items-center gap-1 pointer-events-none z-10 whitespace-nowrap">
            <span className="text-amber-400 font-bold">🧭 {headingCardinal}</span>
            <span className="text-slate-300">•</span>
            <span className="text-white">{headingDegrees}°</span>
          </div>

          {/* BOTÃO ALTERNAR ZOOM (1X / 2X) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel((prev) => (prev === 'close' ? 'far' : 'close'));
            }}
            className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-amber-300 hover:text-white text-[7.5px] font-mono font-bold shadow transition"
            title="Alternar alcance do radar (60m / 120m)"
          >
            {zoomLevel === 'close' ? '1X' : '2X'}
          </button>

          {/* BOTÃO EXPANDIR EM TELA CHEIA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/90 border border-slate-700 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow transition"
            title="Expandir Mapa de Navegação Completo"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* =========================================================================
            BADGE INFORMATIVO DO OBJETIVO DA MISSÃO LOGO ABAIXO DO RADAR
           ========================================================================= */}
        <div 
          onClick={() => setIsExpanded(true)}
          className="mt-1 max-w-[95px] min-[380px]:max-w-[115px] sm:max-w-[130px] w-full bg-slate-950/95 border-2 border-amber-400/90 rounded-xl px-1.5 sm:px-2 py-0.5 sm:py-1 shadow-xl flex items-center justify-between gap-1 cursor-pointer transition hover:scale-105 active:scale-95"
          title="Clique para ver o trajeto no mapa ampliado"
        >
          <div className="flex items-center gap-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
            <span className="text-[9.5px] sm:text-[10px] font-black text-amber-300 font-['Rajdhani'] uppercase truncate">
              {targetTitle}
            </span>
          </div>

          <span className={`text-[8.5px] sm:text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
            distanceToTarget <= 4.0 
              ? 'bg-emerald-500 text-slate-950 animate-bounce' 
              : 'bg-amber-400 text-slate-950'
          }`}>
            {distanceToTarget <= 4.0 ? 'CHEGOU!' : `${distanceToTarget.toFixed(0)}m`}
          </span>
        </div>

      </div>

      {/* =========================================================================
          MODAL EXPANDIDO DO MAPA GPS EM TELA CHEIA
         ========================================================================= */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 pointer-events-auto animate-fade-in font-sans">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400 rounded-3xl max-w-3xl w-full max-h-[95vh] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.5)] overflow-hidden">
            
            {/* CABEÇALHO */}
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                      Mapa de Navegação GPS • Cidade Real 3D
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-mono text-[10px] font-black">
                      {expansionLevel} de 5 Bairros Abertos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Posição de Theo Lucca: ({playerX.toFixed(0)}, {playerZ.toFixed(0)}) • Alvo: {targetTitle} ({distanceToTarget.toFixed(0)}m)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition shadow"
                  title="Fechar Mapa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTEÚDO PRINCIPAL: MAPA VETORIAL */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative aspect-square bg-slate-950 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-35" />

                <svg className="w-full h-full p-2 select-none" viewBox="0 0 100 100">
                  {/* Mar / Oceano Leste */}
                  <rect
                    x={worldToFullMap(78, -105).x}
                    y="0"
                    width="25"
                    height="100"
                    fill="#0284c7"
                    fillOpacity={expansionLevel >= 4 ? 0.35 : 0.15}
                  />

                  {/* Distritos Urbanos */}
                  {CITY_DISTRICTS.map((dist) => {
                    const b = dist.bounds;
                    const p1 = worldToFullMap(b.minX, b.minZ);
                    const p2 = worldToFullMap(b.maxX, b.maxZ);
                    const w = Math.abs(p2.x - p1.x);
                    const h = Math.abs(p2.y - p1.y);
                    const isUnlocked = dist.unlockedAtMission <= expansionLevel;
                    const isSelected = selectedDistrict?.id === dist.id;

                    return (
                      <g
                        key={dist.id}
                        className="cursor-pointer transition-opacity hover:opacity-90"
                        onClick={() => setSelectedDistrict(dist)}
                      >
                        <rect
                          x={Math.min(p1.x, p2.x)}
                          y={Math.min(p1.y, p2.y)}
                          width={w}
                          height={h}
                          rx="4"
                          fill={isUnlocked ? dist.color : '#0f172a'}
                          fillOpacity={isUnlocked ? (isSelected ? 0.38 : 0.22) : 0.85}
                          stroke={isUnlocked ? dist.color : '#475569'}
                          strokeWidth={isSelected ? 2.0 : (isUnlocked ? 1.2 : 0.8)}
                          strokeDasharray={isUnlocked ? 'none' : '3,2'}
                        />
                        <text
                          x={Math.min(p1.x, p2.x) + 3}
                          y={Math.min(p1.y, p2.y) + 7}
                          fontSize="3.4"
                          fill={isUnlocked ? '#ffffff' : '#64748b'}
                          fontWeight="bold"
                        >
                          {dist.shortName}
                        </text>
                      </g>
                    );
                  })}

                  {/* Ruas da Cidade */}
                  {CITY_ROADS.map((road, idx) => {
                    const start = worldToFullMap(road.x1, road.z1);
                    const end = worldToFullMap(road.x2, road.z2);
                    return (
                      <line
                        key={`m-road-${idx}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="#94a3b8"
                        strokeWidth={road.isMain ? 3.0 : 2.0}
                        strokeOpacity="0.45"
                      />
                    );
                  })}

                  {/* Locais de Interesse */}
                  {locations.map((loc) => {
                    const pos = worldToFullMap(loc.x, loc.z);
                    return (
                      <g
                        key={`m-loc-${loc.id}`}
                        className="cursor-pointer"
                        onClick={() => onSetGPSDestination?.(loc.x, loc.z, loc.name)}
                      >
                        <circle cx={pos.x} cy={pos.y} r="2.4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                        <text x={pos.x} y={pos.y - 3} fontSize="2.8" fill="#e2e8f0" textAnchor="middle" fontWeight="600">
                          {loc.name.length > 14 ? loc.name.slice(0, 12) + '...' : loc.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Linha GPS até o Objetivo */}
                  {(() => {
                    const pMap = worldToFullMap(playerX, playerZ);
                    const tMap = worldToFullMap(targetX, targetZ);
                    return (
                      <g>
                        <line
                          x1={pMap.x}
                          y1={pMap.y}
                          x2={tMap.x}
                          y2={tMap.y}
                          stroke="#facc15"
                          strokeWidth="2.0"
                          strokeDasharray="2.5,2"
                          strokeOpacity="0.95"
                        />
                        <circle cx={tMap.x} cy={tMap.y} r="8" fill="#f59e0b" fillOpacity="0.35" className="animate-ping" />
                        <circle cx={tMap.x} cy={tMap.y} r="4.2" fill="#eab308" stroke="#ffffff" strokeWidth="1.2" />
                        <text x={tMap.x} y={tMap.y + 1.4} fontSize="4.6" fill="#0f172a" textAnchor="middle" fontWeight="900">
                          ★
                        </text>
                        <text x={tMap.x} y={tMap.y + 8} fontSize="3.6" fill="#facc15" textAnchor="middle" fontWeight="black">
                          {targetTitle}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Theo Lucca */}
                  {(() => {
                    const pMap = worldToFullMap(playerX, playerZ);
                    return (
                      <g transform={`translate(${pMap.x}, ${pMap.y})`}>
                        <path
                          d="M 0 0 L -6 -14 L 6 -14 Z"
                          fill="#38bdf8"
                          fillOpacity="0.3"
                          transform={`rotate(${playerAngleDeg})`}
                        />
                        <g transform={`rotate(${playerAngleDeg})`}>
                          <polygon points="0,-4.5 3.5,3.5 0,1 -3.5,3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
                        </g>
                        <circle cx="0" cy="0" r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                      </g>
                    );
                  })()}
                </svg>

                <div className="absolute top-2 left-2 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>NORTE</span>
                </div>
              </div>

              {/* PAINEL LATERAL */}
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-amber-400 rounded-2xl p-3 space-y-1.5 shadow-lg">
                  <span className="text-xs font-black font-['Rajdhani'] uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400 animate-spin" />
                    Ponto da Missão Atual
                  </span>

                  <p className="text-sm font-black text-white font-['Rajdhani'] uppercase">
                    {targetTitle}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Distância até o ponto:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      {distanceToTarget <= 4.0 ? 'CHEGOU AO PONTO!' : `${distanceToTarget.toFixed(1)} metros`}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-200/90 leading-tight">
                    Siga o radar circular no canto superior esquerdo ou a linha amarela para chegar ao seu objetivo!
                  </p>
                </div>

                {/* Bairros */}
                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-52 pr-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                    Bairros da Cidade:
                  </span>
                  {CITY_DISTRICTS.map((dist) => {
                    const isUnlocked = dist.unlockedAtMission <= expansionLevel;
                    return (
                      <div
                        key={dist.id}
                        onClick={() => setSelectedDistrict(dist)}
                        className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 text-xs ${
                          isUnlocked
                            ? 'bg-slate-900/90 border-slate-700 hover:border-amber-400 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isUnlocked ? dist.color : '#475569' }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold truncate text-[11px] leading-tight">
                              {dist.name}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate">
                              {dist.description}
                            </p>
                          </div>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap ${
                          isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isUnlocked ? 'ABERTO' : `MISSÃO ${dist.unlockedAtMission}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
