import React, { useState } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  Sparkles, 
  User, 
  Shirt, 
  Footprints, 
  Package, 
  Headphones, 
  Glasses, 
  Palette,
  Smile,
  Zap,
  Flame,
  Heart,
  Diamond,
  Skull,
  Star
} from 'lucide-react';
import { CharacterCustomization, DEFAULT_CHARACTER_CUSTOMIZATION } from '../simulation/TheoLuccaModel';
import { soundManager } from '../simulation/audio';

export interface CharacterCustomizerModalProps {
  isOpen: boolean;
  customization?: CharacterCustomization;
  onClose: () => void;
  onSave: (customization: CharacterCustomization) => void;
  onLiveChange?: (customization: CharacterCustomization) => void;
}

// Paleta de tons de pele naturais e inclusivos
const SKIN_TONES = [
  { name: 'Morena Clara (Theo)', color: '#c68652' },
  { name: 'Bege Clara', color: '#e0a97a' },
  { name: 'Bronzeada Solar', color: '#b27341' },
  { name: 'Morena Média', color: '#965a2d' },
  { name: 'Negra Retinta', color: '#5a3418' },
];

// Paleta de cores de cabelo
const HAIR_COLORS = [
  { name: 'Castanho Escuro', color: '#22130b' },
  { name: 'Preto Ônix', color: '#09090b' },
  { name: 'Castanho Claro', color: '#633c1f' },
  { name: 'Loiro Dourado', color: '#d4a34b' },
  { name: 'Ruivo Fogo', color: '#a63e1b' },
  { name: 'Azul Neon', color: '#0284c7' },
  { name: 'Verde Turbo', color: '#16a34a' },
  { name: 'Platinado / Branco', color: '#e2e8f0' },
];

// Paleta de cores dos olhos
const EYE_COLORS = [
  { name: 'Castanho Avelã', color: '#3b2110' },
  { name: 'Verde Esmeralda', color: '#15803d' },
  { name: 'Azul Celeste', color: '#0284c7' },
  { name: 'Mel / Âmbar', color: '#b45309' },
  { name: 'Preto Profundo', color: '#09090b' },
];

// Paleta de cores do boné
const CAP_COLORS = [
  { name: 'Azul Royal (Theo)', color: '#1d4ed8' },
  { name: 'Vermelho Corrida', color: '#dc2626' },
  { name: 'Preto Tático', color: '#0f172a' },
  { name: 'Dourado Campeão', color: '#f59e0b' },
  { name: 'Verde Esmeralda', color: '#16a34a' },
  { name: 'Roxo Galáxia', color: '#7c3aed' },
  { name: 'Branco Neve', color: '#f8fafc' },
  { name: 'Laranja Elétrico', color: '#ea580c' },
];

// Paleta de cores da camiseta
const SHIRT_COLORS = [
  { name: 'Azul Algodão (Theo)', color: '#2563eb' },
  { name: 'Vermelho Esportivo', color: '#ef4444' },
  { name: 'Preto Streetwear', color: '#0f172a' },
  { name: 'Amarelo Sol', color: '#facc15' },
  { name: 'Verde Selva', color: '#22c55e' },
  { name: 'Roxo Místico', color: '#8b5cf6' },
  { name: 'Laranja Veloz', color: '#f97316' },
  { name: 'Branco Puro', color: '#f8fafc' },
];

// Estampas no peito
const SHIRT_DECALS = [
  { id: 'star', name: 'Estrela Dourada', icon: Star, color: '#fbbf24' },
  { id: 'lightning', name: 'Raio Elétrico', icon: Zap, color: '#facc15' },
  { id: 'fire', name: 'Fogo Flame', icon: Flame, color: '#f97316' },
  { id: 'diamond', name: 'Diamante', icon: Diamond, color: '#38bdf8' },
  { id: 'heart', name: 'Coração', icon: Heart, color: '#f43f5e' },
  { id: 'skull', name: 'Caveira Radical', icon: Skull, color: '#e2e8f0' },
  { id: 'none', name: 'Sem Estampa', icon: X, color: '#94a3b8' },
];

// Paleta de cores da bermuda
const SHORTS_COLORS = [
  { name: 'Jeans Escuro', color: '#1e293b' },
  { name: 'Jeans Claro', color: '#38bdf8' },
  { name: 'Preto Moletom', color: '#09090b' },
  { name: 'Cáqui Aventura', color: '#785434' },
  { name: 'Vermelho Sport', color: '#b91c1c' },
  { name: 'Branco Verão', color: '#f1f5f9' },
];

// Paleta de cores dos tênis
const SHOE_COLORS = [
  { name: 'Vermelho Turbo (Theo)', color: '#dc2626' },
  { name: 'Azul Elétrico', color: '#2563eb' },
  { name: 'Preto Ninja', color: '#09090b' },
  { name: 'Branco Neve', color: '#f8fafc' },
  { name: 'Dourado Campeão', color: '#f59e0b' },
  { name: 'Verde Neon', color: '#22c55e' },
  { name: 'Laranja Veloz', color: '#ea580c' },
];

// Paleta de cores da mochila
const BACKPACK_COLORS = [
  { name: 'Couro Marrom (Theo)', color: '#78350f' },
  { name: 'Preta Tática', color: '#0f172a' },
  { name: 'Azul Galáxia', color: '#1d4ed8' },
  { name: 'Vermelha Radical', color: '#dc2626' },
  { name: 'Verde Exército', color: '#166534' },
  { name: 'Dourada Reluzente', color: '#b45309' },
];

// Looks Rápidos / Presets
const PRESET_LOOKS: Array<{ name: string; desc: string; icon: string; data: Partial<CharacterCustomization> }> = [
  {
    name: 'Theo Lucca Clássico',
    desc: 'O herói de 4 anos com boné azul e mochila de aventureiro!',
    icon: '⭐',
    data: {
      name: 'Theo Lucca',
      skinColor: '#c68652',
      hairColor: '#22130b',
      eyeColor: '#3b2110',
      hasCap: true,
      capColor: '#1d4ed8',
      capStyle: 'forward',
      shirtColor: '#2563eb',
      shirtDecal: 'star',
      shortsColor: '#1e293b',
      shoeColor: '#dc2626',
      hasBackpack: true,
      backpackColor: '#78350f',
      hasHeadphones: false,
      hasGlasses: false,
    },
  },
  {
    name: 'Gamer Futurista',
    desc: 'Com fone gamer neon, óculos espelhados e tênis elétrico!',
    icon: '🎮',
    data: {
      name: 'Theo Gamer',
      hasCap: false,
      hasHeadphones: true,
      headphonesColor: '#06b6d4',
      hasGlasses: true,
      glassesColor: '#0284c7',
      shirtColor: '#7c3aed',
      shirtDecal: 'lightning',
      shortsColor: '#09090b',
      shoeColor: '#06b6d4',
      hasBackpack: true,
      backpackColor: '#1e1b4b',
    },
  },
  {
    name: 'Streetwear Radical',
    desc: 'Boné virado para trás, camiseta preta flame e tênis branco!',
    icon: '🛹',
    data: {
      name: 'Theo Radical',
      hasCap: true,
      capColor: '#0f172a',
      capStyle: 'backward',
      hasHeadphones: false,
      hasGlasses: true,
      glassesColor: '#0f172a',
      shirtColor: '#0f172a',
      shirtDecal: 'fire',
      shortsColor: '#38bdf8',
      shoeColor: '#f8fafc',
      hasBackpack: true,
      backpackColor: '#dc2626',
    },
  },
  {
    name: 'Aventureiro da Selva',
    desc: 'Pronto para explorar o parque e os novos bairros da cidade!',
    icon: '🌲',
    data: {
      name: 'Theo Explorador',
      hasCap: true,
      capColor: '#166534',
      capStyle: 'forward',
      hasHeadphones: false,
      hasGlasses: false,
      shirtColor: '#22c55e',
      shirtDecal: 'diamond',
      shortsColor: '#785434',
      shoeColor: '#78350f',
      hasBackpack: true,
      backpackColor: '#166534',
    },
  },
  {
    name: 'Atleta Campeão',
    desc: 'Visual dourado reluzente dos campeões da cidade!',
    icon: '🏆',
    data: {
      name: 'Theo Campeão',
      hasCap: true,
      capColor: '#f59e0b',
      capStyle: 'forward',
      hasHeadphones: true,
      headphonesColor: '#f59e0b',
      hasGlasses: false,
      shirtColor: '#facc15',
      shirtDecal: 'star',
      shortsColor: '#1e293b',
      shoeColor: '#f59e0b',
      hasBackpack: true,
      backpackColor: '#b45309',
    },
  },
];

export const CharacterCustomizerModal: React.FC<CharacterCustomizerModalProps> = ({
  isOpen,
  customization,
  onClose,
  onSave,
  onLiveChange,
}) => {
  const [current, setCurrent] = useState<CharacterCustomization>(() => ({
    ...(customization || DEFAULT_CHARACTER_CUSTOMIZATION),
  }));

  const [activeTab, setActiveTab] = useState<'identity' | 'head' | 'hair' | 'clothes' | 'shoes' | 'backpack' | 'presets'>('identity');

  if (!isOpen) return null;

  const updateField = <K extends keyof CharacterCustomization>(key: K, value: CharacterCustomization[K]) => {
    const updated = { ...current, [key]: value };
    setCurrent(updated);
    if (onLiveChange) {
      onLiveChange(updated);
    }
  };

  const handleApplyPreset = (presetData: Partial<CharacterCustomization>) => {
    const updated = { ...current, ...presetData };
    setCurrent(updated);
    soundManager.playStarCollect();
    if (onLiveChange) {
      onLiveChange(updated);
    }
  };

  const handleSave = () => {
    soundManager.playMissionComplete();
    onSave(current);
    onClose();
  };

  const handleReset = () => {
    soundManager.playPurchase();
    const updated = { ...DEFAULT_CHARACTER_CUSTOMIZATION };
    setCurrent(updated);
    if (onLiveChange) {
      onLiveChange(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 pointer-events-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden">
        
        {/* CABEÇALHO COM NOME ATUAL E BOTÃO FECHAR */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                  Personalizar Personagem
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                  3D REAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Altere roupas, nome, boné, sapatos, mochila e cabelo em tempo real!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS RESPONSIVAS COM ÍCONES */}
        <div className="px-2 pt-2 pb-1 border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'identity'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Identidade</span>
          </button>

          <button
            onClick={() => setActiveTab('head')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'head'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>🧢</span>
            <span>Boné & Itens</span>
          </button>

          <button
            onClick={() => setActiveTab('hair')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'hair'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>✂️</span>
            <span>Cabelo</span>
          </button>

          <button
            onClick={() => setActiveTab('clothes')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'clothes'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Roupas</span>
          </button>

          <button
            onClick={() => setActiveTab('shoes')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'shoes'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Tênis</span>
          </button>

          <button
            onClick={() => setActiveTab('backpack')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'backpack'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mochila</span>
          </button>

          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'presets'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Looks Prontos</span>
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO ROLÁVEL */}
        <div className="p-3 sm:p-5 overflow-y-auto max-h-[58vh] space-y-4">
          
          {/* =========================================================================
              ABA 1: IDENTIDADE (NOME, TOM DE PELE, OLHOS)
             ========================================================================= */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-fade-in">
              {/* Campo de Nome */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Nome do Personagem</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={current.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    maxLength={20}
                    placeholder="Ex: Theo Lucca"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                  <button
                    onClick={() => updateField('name', 'Theo Lucca')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700"
                  >
                    Theo Lucca
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  O nome será exibido na HUD, falado pelos pedestres e na carteira!
                </p>
              </div>

              {/* Seletor de Tom de Pele */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Tom de Pele</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SKIN_TONES.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => updateField('skinColor', item.color)}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition active:scale-95 text-left ${
                        current.skinColor.toLowerCase() === item.color.toLowerCase()
                          ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seletor de Cor dos Olhos */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5" />
                  <span>Cor dos Olhos</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EYE_COLORS.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => updateField('eyeColor', item.color)}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition active:scale-95 text-left ${
                        current.eyeColor.toLowerCase() === item.color.toLowerCase()
                          ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 2: BONÉ E ITENS DA CABEÇA (BONÉ, ÓCULOS, FONE GAMER)
             ========================================================================= */}
          {activeTab === 'head' && (
            <div className="space-y-4 animate-fade-in">
              {/* Opções de Boné */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                      Usar Boné
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Mostra o boné com aba ou exibe o cabelo cacheado completo
                    </p>
                  </div>
                  <button
                    onClick={() => updateField('hasCap', !current.hasCap)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      current.hasCap
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {current.hasCap ? 'ATIVADO' : 'SEM BONÉ'}
                  </button>
                </div>

                {current.hasCap && (
                  <>
                    {/* Estilo da Aba do Boné */}
                    <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Posição da Aba:</span>
                      <button
                        onClick={() => updateField('capStyle', 'forward')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
                          current.capStyle === 'forward'
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        Para Frente
                      </button>
                      <button
                        onClick={() => updateField('capStyle', 'backward')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition border ${
                          current.capStyle === 'backward'
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        Para Trás (Radical)
                      </button>
                    </div>

                    {/* Cores do Boné */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">Cores do Boné:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CAP_COLORS.map((item) => (
                          <button
                            key={item.color}
                            onClick={() => updateField('capColor', item.color)}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition active:scale-95 ${
                              current.capColor.toLowerCase() === item.color.toLowerCase()
                                ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                                : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-full shadow border border-white/20 flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[11px] font-bold text-slate-200 truncate">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Fone Gamer (Headset) */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
                        Fone Gamer (Headset)
                      </h3>
                      <p className="text-[10px] text-slate-400">Arco e almofadas nas orelhas estilo gamer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateField('hasHeadphones', !current.hasHeadphones)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      current.hasHeadphones
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {current.hasHeadphones ? 'USANDO' : 'NÃO USAR'}
                  </button>
                </div>
              </div>

              {/* Óculos Escuros / Estilosos */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Glasses className="w-4 h-4 text-sky-400" />
                    <div>
                      <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                        Óculos de Sol
                      </h3>
                      <p className="text-[10px] text-slate-400">Lentes espelhadas para o dia ensolarado</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateField('hasGlasses', !current.hasGlasses)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      current.hasGlasses
                        ? 'bg-sky-600 border-sky-400 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {current.hasGlasses ? 'USANDO' : 'NÃO USAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 3: CABELO (CORES)
             ========================================================================= */}
          {activeTab === 'hair' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>✂️</span>
                  <span>Cores do Cabelo Cacheado</span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Os cachos se adaptam naturalmente com ou sem boné!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {HAIR_COLORS.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => updateField('hairColor', item.color)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition active:scale-95 ${
                        current.hairColor.toLowerCase() === item.color.toLowerCase()
                          ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 4: ROUPAS (CAMISETA, ESTAMPA NO PEITO E BERMUDA)
             ========================================================================= */}
          {activeTab === 'clothes' && (
            <div className="space-y-4 animate-fade-in">
              {/* Cores da Camiseta */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Cor da Camiseta</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SHIRT_COLORS.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => updateField('shirtColor', item.color)}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition active:scale-95 ${
                        current.shirtColor.toLowerCase() === item.color.toLowerCase()
                          ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shadow border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-200 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estampa / Emblema no Peito */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  <span>Estampa no Peito</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SHIRT_DECALS.map((decal) => {
                    const IconComp = decal.icon;
                    return (
                      <button
                        key={decal.id}
                        onClick={() => updateField('shirtDecal', decal.id as any)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition active:scale-95 ${
                          current.shirtDecal === decal.id
                            ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400 text-amber-300'
                            : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <IconComp className="w-4 h-4 flex-shrink-0" style={{ color: decal.color }} />
                        <span className="text-[11px] font-bold truncate">{decal.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bermuda / Calça */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span>👖</span>
                  <span>Bermuda / Calça</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SHORTS_COLORS.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => updateField('shortsColor', item.color)}
                      className={`p-2 rounded-xl border flex items-center gap-2 transition active:scale-95 ${
                        current.shortsColor.toLowerCase() === item.color.toLowerCase()
                          ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shadow border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] font-bold text-slate-200 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 5: TÊNIS / SAPATOS
             ========================================================================= */}
          {activeTab === 'shoes' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Cores do Tênis Esportivo</span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Modelo 3D detalhado com solado de borracha branca, tração e cadarços!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {SHOE_COLORS.map((item) => (
                    <button
                      key={item.color}
                      onClick={() => updateField('shoeColor', item.color)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition active:scale-95 ${
                        current.shoeColor.toLowerCase() === item.color.toLowerCase()
                          ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 6: MOCHILA DE AVENTURA
             ========================================================================= */}
          {activeTab === 'backpack' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                        Usar Mochila nas Costas
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Mochila com fivelas douradas e garrafinha lateral
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateField('hasBackpack', !current.hasBackpack)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      current.hasBackpack
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {current.hasBackpack ? 'USANDO' : 'SEM MOCHILA'}
                  </button>
                </div>

                {current.hasBackpack && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Cores da Mochila:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BACKPACK_COLORS.map((item) => (
                        <button
                          key={item.color}
                          onClick={() => updateField('backpackColor', item.color)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition active:scale-95 ${
                            current.backpackColor.toLowerCase() === item.color.toLowerCase()
                              ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                              : 'bg-slate-900/80 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-full shadow border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              ABA 7: LOOKS PRONTOS (PRESETS RÁPIDOS)
             ========================================================================= */}
          {activeTab === 'presets' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-slate-300">
                Toque em qualquer estilo pronto para transformar o visual do personagem com 1 clique:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_LOOKS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset.data)}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400 text-left transition active:scale-95 flex items-start gap-3 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition">{preset.icon}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {preset.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RODAPÉ DE AÇÃO COM RESTAURAR E CONFIRMAR */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 border border-slate-700"
            title="Restaurar padrão inicial do Theo Lucca"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar Padrão</span>
            <span className="sm:hidden">Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar Visual</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
