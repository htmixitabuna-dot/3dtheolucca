import React, { useRef, useState } from 'react';
import { 
  Flame, 
  ArrowUp, 
  Briefcase, 
  ShoppingBag, 
  MessageSquare, 
  Car, 
  Volume2, 
  VolumeX, 
  Coins, 
  MapPin, 
  Package, 
  X, 
  CheckCircle2, 
  BellRing,
  RotateCw,
  Sparkles,
  Settings
} from 'lucide-react';
import { CityHUDState, BackpackItem } from '../simulation/GameEngine';
import { soundManager } from '../simulation/audio';
import { NavigationMiniMap } from './NavigationMiniMap';
import { CircularMiniMap } from './CircularMiniMap';

export interface GtaKidHUDProps {
  hudState: CityHUDState;
  isRunning: boolean;
  onJoystickMove: (x: number, y: number) => void;
  onToggleRun: () => void;
  onJump: () => void;
  onWork: () => void;
  onOpenShop: (shopCategory?: string) => void;
  onSpeak: () => void;
  onToggleCarRide: () => void;
  onHonk: () => void;
  onCameraRotate: (dx: number, dy: number) => void;
  onTurnLeft: () => void;
  onTurnRight: () => void;
  onOpenUnityCode: () => void;
  onOpenBackpack: () => void;
  onOpenJobsModal: () => void;
  onSwitchPhase?: (phase: 1 | 2 | 3) => void;
  onActivateLightTube?: () => void;
  onSetGPSDestination?: (x: number, z: number, name: string) => void;
  onTogglePerformanceMode?: () => void;
}

export const GtaKidHUD: React.FC<GtaKidHUDProps> = ({
  hudState,
  isRunning,
  onJoystickMove,
  onToggleRun,
  onJump,
  onWork,
  onOpenShop,
  onSpeak,
  onToggleCarRide,
  onHonk,
  onCameraRotate,
  onTurnLeft,
  onTurnRight,
  onOpenUnityCode,
  onOpenBackpack,
  onOpenJobsModal,
  onSwitchPhase,
  onActivateLightTube,
  onSetGPSDestination,
  onTogglePerformanceMode,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [touchSensitivity, setTouchSensitivity] = useState(1.4);
  const [invertTouch, setInvertTouch] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Joystick touch tracking
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);

  // Camera multi-touch rotation
  const cameraTouchRef = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startTime: number;
  }>({ id: null, startX: 0, startY: 0, lastX: 0, lastY: 0, startTime: 0 });

  const isMouseDownRef = useRef(false);
  const mouseLastRef = useRef({ x: 0, y: 0 });

  const handleJoystickStart = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    setJoystickActive(true);
    handleJoystickDrag(clientX, clientY);
  };

  const handleJoystickDrag = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = 45;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setJoystickPos({ x: dx, y: dy });
    const normX = dx / maxRadius;
    const normY = -(dy / maxRadius);
    onJoystickMove(normX, normY);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  // Full-screen screen touch rotation
  const handleScreenTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const inJoystick = touch.clientX < window.innerWidth * 0.4 && touch.clientY > window.innerHeight * 0.6;
      if (!inJoystick && cameraTouchRef.current.id === null) {
        cameraTouchRef.current = {
          id: touch.identifier,
          startX: touch.clientX,
          startY: touch.clientY,
          lastX: touch.clientX,
          lastY: touch.clientY,
          startTime: Date.now(),
        };
        break;
      }
    }
  };

  const handleScreenTouchMove = (e: React.TouchEvent) => {
    if (cameraTouchRef.current.id === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchRef.current.id) {
        let dx = touch.clientX - cameraTouchRef.current.lastX;
        let dy = touch.clientY - cameraTouchRef.current.lastY;
        if (invertTouch) dx = -dx;

        onCameraRotate(dx * touchSensitivity, dy * touchSensitivity);
        cameraTouchRef.current.lastX = touch.clientX;
        cameraTouchRef.current.lastY = touch.clientY;
        break;
      }
    }
  };

  const handleScreenTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchRef.current.id) {
        const totalDist = Math.hypot(
          touch.clientX - cameraTouchRef.current.startX,
          touch.clientY - cameraTouchRef.current.startY
        );
        const duration = Date.now() - cameraTouchRef.current.startTime;

        if (totalDist < 12 && duration < 300) {
          if (touch.clientX > window.innerWidth * 0.5) {
            onTurnRight();
          } else {
            onTurnLeft();
          }
        }
        cameraTouchRef.current.id = null;
        break;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDownRef.current = true;
    mouseLastRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    let dx = e.clientX - mouseLastRef.current.x;
    let dy = e.clientY - mouseLastRef.current.y;
    if (invertTouch) dx = -dx;
    onCameraRotate(dx * touchSensitivity, dy * touchSensitivity);
    mouseLastRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const isNearShop = hudState.nearestLocation?.category === 'shop' && hudState.nearestLocation.dist < 4.5;
  const isNearCar = hudState.nearestCar && hudState.nearestCar.dist < 5.2;
  const isNearMoto = hudState.nearestMoto && hudState.nearestMoto.dist < 5.2;
  const isNearVehicle = isNearCar || isNearMoto;

  return (
    <div className="absolute inset-0 select-none overflow-hidden font-sans">
      
      {/* SUPERFÍCIE DE TOQUE EM TELA CHEIA PARA GIRAR A CÂMERA */}
      <div 
        className="absolute inset-0 z-0 pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleScreenTouchStart}
        onTouchMove={handleScreenTouchMove}
        onTouchEnd={handleScreenTouchEnd}
        onTouchCancel={handleScreenTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* =========================================================================
          TOPO: MINIMAPA CIRCULAR (ESQ) + STATUS + CARTEIRA R$ (CENTRO) + BOTÕES (DIR)
          (Tarja da missão removida para liberar o espaço e manter todos os botões na tela)
         ========================================================================= */}
      {/* 1. CANTO SUPERIOR ESQUERDO: MINIMAPA CIRCULAR GTA + STATUS THEO LUCCA */}
      <div className="absolute top-2 left-2 z-30 pointer-events-auto flex items-start gap-1.5 sm:gap-2">
        {/* Minimapa Circular GTA com Rastreamento em Tempo Real de playerX e playerZ */}
        <CircularMiniMap
          playerX={hudState.playerX ?? -14}
          playerZ={hudState.playerZ ?? -14}
          playerRotation={hudState.playerRotationY ?? 0}
          targetPos={hudState.targetBeaconPos ?? null}
          activeJob={hudState.activeJob}
          currentMission={hudState.currentMission}
          expansionLevel={hudState.cityExpansionLevel ?? 1}
          locations={hudState.allLocations ?? []}
          npcs={hudState.allNPCs ?? []}
          cars={hudState.allCars ?? []}
          motos={hudState.allMotos ?? []}
          onSetGPSDestination={onSetGPSDestination}
        />

        {/* CARD THEO LUCCA (4 ANOS) COM FÔLEGO E BOTÃO DA MOCHILA */}
        <div className="hidden min-[430px]:flex items-center gap-1.5 bg-slate-950/95 border border-slate-700/80 rounded-xl p-1.5 shadow-xl max-w-[125px] sm:max-w-[155px]">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 p-0.5 shadow flex-shrink-0">
            <div className="w-full h-full rounded-md bg-slate-950 flex items-center justify-center overflow-hidden relative">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#c68652] relative flex items-center justify-center shadow">
                <div className="absolute -top-1 w-4 sm:w-5 h-3 bg-blue-600 rounded-t-full border-b border-blue-800" />
                <div className="absolute -top-0.5 right-0.5 w-2 sm:w-2.5 h-1.5 bg-blue-700 rounded-r-full" />
                <div className="flex gap-1 mt-1">
                  <div className="w-1 h-1 rounded-full bg-slate-900" />
                  <div className="w-1 h-1 rounded-full bg-slate-900" />
                </div>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-amber-500 text-slate-950 text-[7.5px] sm:text-[8.5px] font-black rounded shadow">
              4a
            </span>
          </div>

          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9.5px] sm:text-[11px] font-black tracking-tight text-white truncate font-['Rajdhani']">
                THEO LUCCA
              </span>
              <button
                onClick={onOpenBackpack}
                className="px-1 py-0.2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded text-amber-300 text-[8px] sm:text-[8.5px] font-bold flex items-center gap-0.5"
                title="Abrir Mochila"
              >
                <Package className="w-2.5 h-2.5" />
                <span>{hudState.backpack.length}</span>
              </button>
            </div>

            {/* Barra de Fôlego / Energia */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className={`h-full rounded-full transition-all duration-75 ${
                  hudState.isExhausted ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-400 to-blue-500'
                }`}
                style={{ width: `${hudState.stamina}%` }}
              />
            </div>

            <div className="text-[8px] sm:text-[8.5px] font-mono text-slate-300 truncate flex items-center justify-between gap-1">
              <span>{hudState.isInCar ? (hudState.isDrivingMoto ? 'Pilotando' : 'Dirigindo') : 'A pé'}</span>
              {hudState.isInCar && (
                <span className="text-amber-400 font-bold bg-amber-500/20 px-1 rounded">
                  {hudState.vehicleSpeed || 0} km/h
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTRO: CARTEIRA R$ EM DESTAQUE + FASE ATUAL */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center gap-1">
        {/* CARTEIRA R$ EM DESTAQUE COM MOEDAS DOURADAS */}
        <div className="bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-amber-400 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 shadow-2xl flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-inner flex-shrink-0">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 fill-current" />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="hidden sm:inline text-[10px] sm:text-[11px] font-bold text-amber-300 font-mono">CARTEIRA:</span>
            <span className="text-xs sm:text-base font-black text-amber-400 font-mono tracking-wide">
              R$ {hudState.money.toFixed(2)}
            </span>
          </div>

          <div className="border-l border-slate-700 pl-1.5 text-[9px] font-mono text-slate-300 hidden md:block">
            ★ {hudState.coinsCollected}/{hudState.totalCoins} Moedas
          </div>
        </div>

        {/* BADGE DA FASE ATUAL & BOTÃO TUBO DE LUZ */}
        <div className="flex items-center gap-1 max-w-[150px] sm:max-w-none">
          <div className={`px-2 py-0.2 rounded-full border text-[8.5px] sm:text-[9.5px] font-black tracking-wide font-['Rajdhani'] uppercase flex items-center gap-1 shadow-md whitespace-nowrap truncate max-w-[105px] sm:max-w-none ${
            hudState.currentPhase === 1 
              ? 'bg-sky-950/90 border-sky-400 text-sky-200' 
              : (hudState.currentPhase === 2 ? 'bg-indigo-950/90 border-cyan-400 text-cyan-200' : 'bg-amber-950/90 border-amber-400 text-amber-200')
          }`}>
            <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-spin flex-shrink-0" />
            <span className="truncate">{hudState.phaseName}</span>
          </div>

          {onActivateLightTube && (
            <button
              onClick={onActivateLightTube}
              className="px-1.5 sm:px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 border border-white text-slate-950 text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider shadow active:scale-95 transition hover:brightness-110 flex items-center gap-0.5 flex-shrink-0"
              title="Ativar Tubo de Luz para Viajar de Fase"
            >
              <span>TUBO</span>
              <span>🌀</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CANTO SUPERIOR DIREITO: BOTÕES DE CONTROLE RÁPIDO ANCORADOS FIRMEMENTE */}
      <div className="absolute top-2 right-2 z-30 pointer-events-auto flex items-center gap-1 sm:gap-1.5">
        {/* BOTÃO ALTERNAR MODO LEVE (60 FPS NÍTIDO) / MODO NORMAL */}
        {onTogglePerformanceMode && (
          <button
            onClick={onTogglePerformanceMode}
            className={`w-7 h-7 sm:w-auto sm:h-8 sm:px-2 rounded-lg border flex items-center justify-center gap-1 transition shadow font-mono text-[9px] sm:text-[10px] font-black active:scale-95 ${
              hudState.performanceMode === 'light'
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 hover:bg-emerald-900 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-slate-950/85 border-amber-400/80 text-amber-300 hover:bg-slate-900'
            }`}
            title={
              hudState.performanceMode === 'light'
                ? "Modo Leve 60 FPS Nítido Ativo (Alta Resolução + Leve para Celular) - Clique para Modo Normal"
                : "Modo Gráficos Altos Ativo - Clique para Modo Leve 60 FPS"
            }
          >
            <span>⚡</span>
            <span className="hidden sm:inline">{hudState.performanceMode === 'light' ? '60 FPS' : 'ALTA'}</span>
          </button>
        )}

        <button
          onClick={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            soundManager.setMuted(nextMuted);
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition shadow ${
            isMuted 
              ? 'bg-rose-950/90 border-rose-500 text-rose-300' 
              : 'bg-slate-950/85 border-amber-500/80 text-amber-300 hover:bg-slate-900'
          }`}
          title={isMuted ? "Ativar Áudio do Jogo" : "Silenciar Áudio (Mute)"}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-950/85 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-center transition shadow"
          title="Configurações e Arquivos Unity C#"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onOpenJobsModal}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-950/85 border border-emerald-500/80 text-emerald-400 hover:bg-slate-900 flex items-center justify-center transition shadow"
          title="Ver Trabalhos da Cidade"
        >
          <Briefcase className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* NOTIFICAÇÃO DE LOCAL / DENTRO DA LOJA */}
      {hudState.nearestLocation && hudState.nearestLocation.dist < 4.5 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto max-w-sm px-2 animate-fade-in">
          <div className="bg-slate-950/95 border-2 border-purple-500/80 rounded-full px-4 py-1.5 text-[11px] text-purple-200 font-bold shadow-xl flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{hudState.nearestLocation.name}</span>
            <span className="text-[10px] text-amber-300 font-mono font-normal">
              {hudState.nearestLocation.category === 'shop' ? '• [COMPRAR]' : '• [TRABALHAR]'}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          BANNER LUMINOSO DO TUBO DE LUZ ATIVADO (PORTAL PARA A PRÓXIMA FASE)
         ========================================================================= */}
      {hudState.lightTubeActive && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto max-w-sm sm:max-w-md w-full px-3 animate-bounce">
          <div 
            onClick={() => {
              if (onActivateLightTube) onActivateLightTube();
            }}
            className="bg-gradient-to-r from-cyan-400 via-amber-300 to-yellow-400 text-slate-950 border-[2.5px] border-white rounded-2xl p-2.5 sm:p-3 text-center shadow-[0_0_35px_rgba(56,189,248,0.85)] cursor-pointer flex items-center justify-between gap-2 transition hover:scale-105"
          >
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <span className="text-3xl select-none animate-spin">🌀</span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black font-['Rajdhani'] uppercase tracking-wider leading-none text-slate-950 truncate">
                  TUBO DE LUZ ABERTO!
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-900 mt-0.5 truncate">
                  Entre no feixe para ir para a próxima fase! ({hudState.lightTubeDist.toFixed(1)}m)
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-slate-950 text-amber-300 rounded-xl text-[11px] font-black whitespace-nowrap shadow-md uppercase font-mono tracking-wider">
              ENTRAR ➔
            </span>
          </div>
        </div>
      )}


      {/* =========================================================================
          BALÃO DE DIÁLOGO DINÂMICO DOS NPCS ("OI THEO!", CONVERSAS E DICAS)
         ========================================================================= */}
      {hudState.dialogueText && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none max-w-md w-full px-4 animate-bounce-short">
          <div className="bg-slate-950/95 border-2 border-amber-400/90 rounded-2xl px-4 py-2.5 shadow-[0_0_30px_rgba(245,158,11,0.45)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-white flex items-center justify-center flex-shrink-0 text-slate-950 font-black shadow">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-amber-300 font-sans leading-snug">
                {hudState.dialogueText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CANTO INFERIOR ESQUERDO: JOYSTICK ANALÓGICO + BOTÕES DE GIRO RÁPIDO
         ========================================================================= */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 pointer-events-auto flex flex-col items-center gap-1 z-20 origin-bottom-left scale-90 sm:scale-100">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTurnLeft}
            className="px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-700 hover:border-amber-400 active:scale-95 text-slate-200 text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-0.5 shadow transition"
            title="Girar para Esquerda"
          >
            <span>↶ ESQ</span>
          </button>
          <button
            onClick={onTurnRight}
            className="px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-700 hover:border-amber-400 active:scale-95 text-slate-200 text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-0.5 shadow transition"
            title="Girar para Direita"
          >
            <span>DIR ↷</span>
          </button>
        </div>

        <div
          ref={joystickRef}
          onMouseDown={(e) => handleJoystickStart(e.clientX, e.clientY)}
          onMouseMove={(e) => joystickActive && handleJoystickDrag(e.clientX, e.clientY)}
          onMouseUp={handleJoystickEnd}
          onMouseLeave={handleJoystickEnd}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            if (touch) handleJoystickStart(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            if (touch) handleJoystickDrag(touch.clientX, touch.clientY);
          }}
          onTouchEnd={handleJoystickEnd}
          className="relative w-26 h-26 sm:w-30 sm:h-30 rounded-full bg-slate-900/85 border-2 border-slate-600/60 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer active:border-amber-500/80 transition-colors"
        >
          <div className="absolute inset-2 rounded-full border border-dashed border-slate-500/30 pointer-events-none" />

          <div
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border-2 border-amber-400 shadow-xl flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/40 border border-amber-400/80 shadow-[0_0_8px_#f59e0b]" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          CANTO INFERIOR DIREITO: PAINEL DE AÇÕES GTA UNIFICADO E RESPONSIVO
          (Mochila + Todas as Ações em layout compacto sem sobreposição ou corte de tela)
         ========================================================================= */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 pointer-events-auto flex items-end gap-1.5 sm:gap-2 z-20 origin-bottom-right scale-90 sm:scale-100">
        
        {/* Coluna 1: Veículos e Buzina */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* BOTÃO DIRIGIR CARRO OU PILOTAR MOTO */}
          <button
            onClick={onToggleCarRide}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-95 ${
              hudState.isInCar 
                ? 'bg-rose-600 border-white text-white font-black animate-pulse' 
                : (isNearVehicle ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-300 text-slate-950 font-black ring-2 ring-amber-400/50' : 'bg-slate-900/85 border-slate-700 text-slate-300')
            }`}
            title={hudState.isInCar ? 'Descer do Veículo' : (isNearMoto ? 'Pilotar Moto' : 'Dirigir Carro')}
          >
            <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[7px] sm:text-[8px] font-black font-mono leading-tight text-center">
              {hudState.isInCar ? 'DESCER' : (isNearMoto && (!isNearCar || hudState.nearestMoto!.dist < hudState.nearestCar!.dist) ? 'PILOTAR' : (isNearCar ? 'DIRIGIR' : 'VEÍCULO'))}
            </span>
          </button>

          {/* BOTÃO BUZINA FOFA ("BIBI!") */}
          <button
            onClick={onHonk}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/85 border-2 border-slate-700 active:border-amber-400 text-amber-400 flex flex-col items-center justify-center shadow-xl transition active:scale-95"
            title="Buzina Fofa [H]"
          >
            <BellRing className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[7.5px] sm:text-[8px] font-bold font-mono text-slate-200">BUZINA</span>
          </button>
        </div>

        {/* Coluna 2: Mochila no topo + Falar e Comprar */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
          {/* BOTÃO MOCHILA INFANTIL AMARRELA DO THEO */}
          <button
            onClick={() => {
              soundManager.playPopClick();
              onOpenBackpack();
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#eab308] border-[3.5px] border-[#5c2e0b] shadow-[0_4px_0_#3d1a03,0_8px_16px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_1px_0_#3d1a03] flex flex-col items-center justify-center relative cursor-pointer animate-kid-backpack transition-transform"
            title="Abrir Mochila do Theo Lucca"
            aria-label="Abrir Mochila"
          >
            {/* BADGE COM NÚMERO DE ITENS */}
            {hudState.backpack.length > 0 && (
              <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-rose-600 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg animate-bounce select-none">
                {hudState.backpack.length}
              </div>
            )}

            {/* DESENHO DE MOCHILA MARROM */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center pointer-events-none select-none">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 15C24 9 40 9 40 15" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" />
                <rect x="13" y="15" width="38" height="43" rx="10" fill="#854d0e" stroke="#451a03" strokeWidth="4" />
                <path d="M13 25C13 18 51 18 51 25L48 34H16L13 25Z" fill="#a16207" stroke="#451a03" strokeWidth="3" />
                <rect x="19" y="37" width="26" height="17" rx="5" fill="#78350f" stroke="#451a03" strokeWidth="3" />
                <rect x="27" y="38" width="10" height="3" rx="1.5" fill="#facc15" stroke="#451a03" strokeWidth="1" />
                <rect x="20" y="26" width="4.5" height="9" rx="2" fill="#facc15" stroke="#451a03" strokeWidth="1.5" />
                <rect x="39.5" y="26" width="4.5" height="9" rx="2" fill="#facc15" stroke="#451a03" strokeWidth="1.5" />
              </svg>
            </div>

            <span className="text-white font-black text-[9px] sm:text-[10px] tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] -mt-0.5 font-['Rajdhani'] leading-none select-none">
              MOCHILA
            </span>
          </button>

          {/* BOTÃO FALAR / ACENAR */}
          <button
            onClick={onSpeak}
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/90 border-2 border-sky-500/80 active:border-white text-sky-400 flex flex-col items-center justify-center shadow-xl transition active:scale-95"
            title="Acenar e Conversar com Pessoas [F]"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[7.5px] sm:text-[8px] font-bold font-mono text-slate-200">FALAR</span>
          </button>

          {/* BOTÃO COMPRAR (ABRE A LOJA) */}
          <button
            onClick={() => onOpenShop()}
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-95 ${
              isNearShop
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-300 text-white font-black'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
            title="Abrir Loja de Brinquedos, Mercado ou Roupas"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-[7.5px] sm:text-[8px] font-bold font-mono">COMPRAR</span>
          </button>
        </div>

        {/* Coluna 3 de Ações Principais: TRABALHAR, CORRER, PULAR */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* BOTÃO TRABALHAR */}
          <button
            onClick={onWork}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-95 ${
              hudState.activeJob
                ? 'bg-emerald-500 border-white text-slate-950 font-black'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-300 text-slate-950 font-black'
            }`}
            title="Trabalhar para ganhar R$ [E]"
          >
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black font-mono">
              {hudState.activeJob ? 'ENTREGAR' : 'TRABALHAR'}
            </span>
          </button>

          {/* BOTÃO CORRER */}
          <button
            onClick={onToggleRun}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex flex-col items-center justify-center shadow-xl transition active:scale-95 ${
              isRunning
                ? 'bg-amber-500 border-amber-300 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-slate-900/90 border-slate-600 text-slate-200'
            }`}
            title="Correr com Fôlego [Shift]"
          >
            <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${isRunning ? 'text-slate-950 fill-current' : 'text-amber-400'}`} />
            <span className="text-[7.5px] sm:text-[8.5px] font-black font-mono">CORRER</span>
          </button>

          {/* BOTÃO PULAR */}
          <button
            onClick={onJump}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-blue-600 to-indigo-800 border-2 border-blue-400 active:border-white active:scale-95 text-white flex flex-col items-center justify-center shadow-xl transition"
            title="Pular [Espaço]"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="text-[7.5px] sm:text-[8.5px] font-black font-mono">PULAR</span>
          </button>
        </div>

      </div>

      {/* =========================================================================
          MODAL DE CONFIGURAÇÕES & ARQUIVOS UNITY C#
         ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-['Rajdhani'] uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Theo Lucca - Cidade Real 3D
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  onOpenUnityCode();
                }}
                className="w-full p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-between transition shadow-md"
              >
                <span>Arquivos Unity 3D (C# Scripts & Cenas)</span>
                <span className="text-sm font-mono">&rarr;</span>
              </button>

              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  onOpenJobsModal();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-between transition"
              >
                <span>Lista dos 5 Trabalhos da Cidade</span>
                <span className="text-sm font-mono">&rarr;</span>
              </button>

              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  onOpenBackpack();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-between transition"
              >
                <span>Mochila e Inventário do Theo</span>
                <span className="text-sm font-mono">&rarr;</span>
              </button>
            </div>

            {/* OPÇÕES DE DESEMPENHO (PC FRACO E ANDROID) */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-['Rajdhani']">
                  <span>⚡</span>
                  Desempenho & Gráficos
                </span>
                <span className="text-[9px] font-mono text-emerald-400 font-black">
                  {hudState.performanceMode === 'light' ? '60 FPS (LEVE)' : 'ALTA FIDELIDADE'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <button
                  onClick={() => {
                    if (hudState.performanceMode !== 'light') onTogglePerformanceMode?.();
                  }}
                  className={`p-2 rounded-xl border transition flex flex-col items-center gap-0.5 ${
                    hudState.performanceMode === 'light'
                      ? 'bg-emerald-600 text-slate-950 border-white shadow-lg font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-xs font-bold">⚡ Modo Leve (60 FPS)</span>
                  <span className="text-[8.5px] font-normal opacity-90 leading-tight">Para Android e PCs Fracos</span>
                </button>
                <button
                  onClick={() => {
                    if (hudState.performanceMode !== 'normal') onTogglePerformanceMode?.();
                  }}
                  className={`p-2 rounded-xl border transition flex flex-col items-center gap-0.5 ${
                    hudState.performanceMode === 'normal'
                      ? 'bg-amber-500 text-slate-950 border-white shadow-lg font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <span className="text-xs font-bold">✨ Gráficos Altos</span>
                  <span className="text-[8.5px] font-normal opacity-90 leading-tight">Sombras e Resolução Extra</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-amber-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Trocar de Fase (Mundos 3D)
                </span>
                <span className="text-[9px] font-mono text-slate-400">Fase {hudState.currentPhase}/3</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button
                  onClick={() => {
                    onSwitchPhase?.(1);
                    setShowSettingsModal(false);
                  }}
                  className={`p-1.5 rounded-lg border text-[10px] font-black transition ${
                    hudState.currentPhase === 1 
                      ? 'bg-sky-500 text-slate-950 border-white shadow' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-sky-400'
                  }`}
                >
                  1. Cidade
                </button>
                <button
                  onClick={() => {
                    onSwitchPhase?.(2);
                    setShowSettingsModal(false);
                  }}
                  className={`p-1.5 rounded-lg border text-[10px] font-black transition ${
                    hudState.currentPhase === 2 
                      ? 'bg-cyan-500 text-slate-950 border-white shadow' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-400'
                  }`}
                >
                  2. Diamantes
                </button>
                <button
                  onClick={() => {
                    onSwitchPhase?.(3);
                    setShowSettingsModal(false);
                  }}
                  className={`p-1.5 rounded-lg border text-[10px] font-black transition ${
                    hudState.currentPhase === 3 
                      ? 'bg-amber-500 text-slate-950 border-white shadow' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-400'
                  }`}
                >
                  3. Avaritia
                </button>
              </div>

              {onActivateLightTube && (
                <button
                  onClick={() => {
                    onActivateLightTube();
                    setShowSettingsModal(false);
                  }}
                  className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow flex items-center justify-center gap-1.5 mt-1"
                >
                  <span>Ativar Tubo de Luz Aqui</span>
                  <span>🌀</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-xs text-slate-400 hover:text-white font-medium"
              >
                Voltar ao Jogo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
