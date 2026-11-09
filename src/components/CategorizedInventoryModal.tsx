import React, { useState } from 'react';
import { 
  X, 
  Package, 
  User, 
  Building2, 
  Car, 
  Wrench, 
  TreePine, 
  Check, 
  Sparkles,
  ArrowRight,
  Hammer
} from 'lucide-react';
import { InventoryCategory, InventoryItem } from '../types/economy';
import { economyManager } from '../simulation/EconomyManager';
import { soundManager } from '../simulation/audio';

export interface CategorizedInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipCustomization?: (customizationData: any) => void;
  onStartBuildingPlacement?: (item: InventoryItem) => void;
  onConsumeItem?: (item: InventoryItem) => void;
}

const CATEGORIES: { id: InventoryCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'personagem', label: 'Personagem & Roupas', icon: User },
  { id: 'construcao', label: 'Construções', icon: Building2 },
  { id: 'garagem', label: 'Veículos & Garagem', icon: Car },
  { id: 'utilitarios', label: 'Ferramentas & Consumíveis', icon: Wrench },
  { id: 'decoracao', label: 'Decorações Urbanas', icon: TreePine },
];

export const CategorizedInventoryModal: React.FC<CategorizedInventoryModalProps> = ({
  isOpen,
  onClose,
  onEquipCustomization,
  onStartBuildingPlacement,
  onConsumeItem,
}) => {
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('personagem');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const items = economyManager.getInventory(activeCategory);

  const handleEquip = (item: InventoryItem) => {
    if (item.customizationData && onEquipCustomization) {
      onEquipCustomization(item.customizationData);
      soundManager.playStarCollect();
      setFeedback(`Visual "${item.name}" equipado com sucesso!`);
      setTimeout(() => setFeedback(null), 2800);
    }
  };

  const handlePlace = (item: InventoryItem) => {
    onClose();
    if (onStartBuildingPlacement) {
      onStartBuildingPlacement(item);
    }
  };

  const handleUse = (item: InventoryItem) => {
    const res = economyManager.consumeItem(item.id);
    if (res.success) {
      soundManager.playStarCollect();
      setFeedback(res.message);
      onConsumeItem?.(item);
      setTimeout(() => setFeedback(null), 2800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 pointer-events-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden">
        
        {/* CABEÇALHO */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md">
              <Package className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                  Inventário Geral
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                  {economyManager.getInventory().length} ITENS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gerencie roupas, construções do terreno, veículos e consumíveis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            title="Fechar Inventário"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FEEDBACK TEMPORÁRIO */}
        {feedback && (
          <div className="px-4 py-2 bg-emerald-950 border-b border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* NAVEGAÇÃO DAS 5 ABAS */}
        <div className="px-2 pt-2 pb-1 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const isActive = activeCategory === cat.id;
            const count = economyManager.getInventory(cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1 rounded-full ${isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* LISTAGEM DE ITENS */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[62vh] space-y-2.5">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm font-semibold">Nenhum item nesta categoria ainda.</p>
              <p className="text-xs text-slate-500">Visite a Esmeralda Store para adquirir novos itens!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {items.map((item) => {
                const isBuildingOrDeco = item.category === 'construcao' || item.category === 'decoracao';
                const isConsumable = item.category === 'utilitarios' && !item.modelType;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-amber-400/60 rounded-xl p-3 flex flex-col justify-between gap-2.5 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-xs sm:text-sm font-black text-white truncate font-['Rajdhani'] uppercase">
                            {item.name}
                          </h3>
                          {item.quantity > 1 && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                          {item.description}
                        </p>

                        {item.isPlaced && (
                          <span className="inline-block mt-1 px-1.5 py-0.2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded text-[9px] font-bold">
                            ✓ Colocada na Cidade
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AÇÕES DE ACORDO COM O TIPO */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-end gap-2">
                      {item.category === 'personagem' && item.customizationData && (
                        <button
                          onClick={() => handleEquip(item)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition flex items-center gap-1 shadow"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Equipar</span>
                        </button>
                      )}

                      {isBuildingOrDeco && (
                        <button
                          onClick={() => handlePlace(item)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition flex items-center gap-1 shadow"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          <span>{item.isPlaced ? 'Mover no Mapa' : 'Colocar no Terreno'}</span>
                        </button>
                      )}

                      {isConsumable && (
                        <button
                          onClick={() => handleUse(item)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition flex items-center gap-1 shadow"
                        >
                          <span>Usar / Comer</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>Construções retiradas da cidade voltam para cá sem nenhum custo.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
