import React from 'react';
import { 
  RotateCw, 
  Check, 
  X, 
  Hammer, 
  Trash2, 
  Move,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { InventoryItem } from '../types/economy';

export interface BuildModeHUDProps {
  activeItem: InventoryItem | null;
  isValid: boolean;
  onRotate: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDismantleNearest?: () => void;
  nearestBuildingName?: string | null;
}

export const BuildModeHUD: React.FC<BuildModeHUDProps> = ({
  activeItem,
  isValid,
  onRotate,
  onConfirm,
  onCancel,
  onDismantleNearest,
  nearestBuildingName,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      
      {/* BANNER SUPERIOR: MODO CONSTRUÇÃO ATIVO */}
      <div className="mx-auto pointer-events-auto max-w-md w-full animate-fade-in">
        <div className="bg-slate-950/95 border-2 border-emerald-400 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center text-slate-950 shadow flex-shrink-0">
              <Hammer className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                  Modo Construção
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                  isValid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {isValid ? 'LOCAL PERMITIDO' : 'LOCAL BLOQUEADO'}
                </span>
              </div>
              <p className="text-[11px] text-amber-300 font-bold truncate">
                {activeItem ? `${activeItem.icon} ${activeItem.name}` : 'Mova o holograma pelo terreno'}
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition flex-shrink-0"
            title="Cancelar Modo Construção"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PAINEL DE CONTROLES INFERIOR COM BOTÕES TÁTEIS GRANDES */}
      <div className="mx-auto pointer-events-auto max-w-lg w-full flex flex-col items-center gap-2 animate-fade-in pb-2">
        
        {/* BOTÃO PARA DESMONTAR CONSTRUÇÃO PRÓXIMA (SE HOUVER) */}
        {nearestBuildingName && onDismantleNearest && (
          <button
            onClick={onDismantleNearest}
            className="px-3 py-1.5 rounded-full bg-slate-900/95 border border-rose-500 text-rose-300 text-xs font-bold shadow-xl flex items-center gap-1.5 hover:bg-rose-950/80 active:scale-95 transition"
            title="Recolher esta construção de volta para o inventário"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Recolher "{nearestBuildingName}" para o Inventário</span>
          </button>
        )}

        {/* BARRA DE AÇÕES: GIRAR, CANCELAR E CONFIRMAR */}
        <div className="bg-slate-950/95 border-2 border-slate-700 rounded-2xl p-2.5 shadow-2xl flex items-center justify-center gap-2 sm:gap-4 w-full">
          {/* Botão Cancelar */}
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>

          {/* Botão Girar 90° */}
          <button
            onClick={onRotate}
            className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-amber-500/40"
            title="Rotacionar construção em 90 graus"
          >
            <RotateCw className="w-4 h-4 text-amber-400" />
            <span>Girar (90°)</span>
          </button>

          {/* Botão Confirmar Posicionamento */}
          <button
            onClick={onConfirm}
            disabled={!isValid}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xl ${
              isValid
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Construir</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-300/80 text-center font-mono bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
          💡 Use o joystick ou toque na tela para posicionar o holograma no chão do terreno
        </p>

      </div>

    </div>
  );
};
