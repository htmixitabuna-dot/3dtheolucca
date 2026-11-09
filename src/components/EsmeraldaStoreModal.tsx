import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Gift, 
  Settings, 
  Star, 
  User, 
  Shirt, 
  Building2, 
  Car, 
  TreePine, 
  Crown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  RotateCw,
} from 'lucide-react';
import { StoreCategory, StoreProduct, CurrencyType, PlayerWallet } from '../types/economy';
import { CharacterCustomization, DEFAULT_CHARACTER_CUSTOMIZATION } from '../simulation/TheoLuccaModel';
import { economyManager } from '../simulation/EconomyManager';
import { soundManager } from '../simulation/audio';
import { Store3DStage } from './Store3DStage';

export interface EsmeraldaStoreModalProps {
  isOpen: boolean;
  wallet: PlayerWallet;
  currentLevel: number;
  onClose: () => void;
  onItemPurchased?: (product: StoreProduct) => void;
  playerName?: string;
  characterCustomization?: CharacterCustomization;
  onEquipCustomization?: (customizationData: any) => void;
}

// 7 Categorias oficiais no estilo Free Fire
const STORE_CATEGORIES: { id: StoreCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'destaques', label: 'Destaques', icon: Star },
  { id: 'personagem', label: 'Personagens', icon: User },
  { id: 'roupas', label: 'Roupas', icon: Shirt },
  { id: 'construcao', label: 'Construção', icon: Building2 },
  { id: 'garagem', label: 'Garagem', icon: Car },
  { id: 'decoracao', label: 'Decoração', icon: TreePine },
  { id: 'exclusivos', label: 'Exclusivos', icon: Crown },
];

export const EsmeraldaStoreModal: React.FC<EsmeraldaStoreModalProps> = ({
  isOpen,
  wallet,
  currentLevel,
  onClose,
  onItemPurchased,
  playerName = 'Theo Lucca',
  characterCustomization = DEFAULT_CHARACTER_CUSTOMIZATION,
  onEquipCustomization,
}) => {
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('destaques');
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_conjunto_esportivo');
  const [selectedCurrencyMap, setSelectedCurrencyMap] = useState<Record<string, CurrencyType>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [actionPose, setActionPose] = useState<'idle' | 'wave' | 'heroic' | 'dance'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [purchasedModal, setPurchasedModal] = useState<StoreProduct | null>(null);
  const [showCurrencyHelp, setShowCurrencyHelp] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Produtos filtrados pela categoria ativa
  const products = economyManager.getProducts(activeCategory);

  // Produto selecionado
  const selectedProduct = 
    products.find((p) => p.id === selectedProductId) || 
    products[0] || 
    economyManager.getProductById('prod_conjunto_esportivo') || 
    economyManager.getProducts()[0];

  // Garante que haja um produto selecionado se a categoria mudar
  useEffect(() => {
    if (products.length > 0 && !products.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(products[0].id);
      setRotationAngle(0);
    }
  }, [activeCategory, products, selectedProductId]);

  // Rotação suave contínua quando o auto-giro estiver ativo
  useEffect(() => {
    if (!isOpen || !isAutoRotating) return;
    let animId: number;
    const tick = () => {
      setRotationAngle((prev) => (prev + 0.3) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, isAutoRotating]);

  if (!isOpen) return null;

  // Moeda selecionada para o produto atual
  const chosenCurrency: CurrencyType = 
    selectedCurrencyMap[selectedProduct.id] || 
    selectedProduct.allowedCurrencies[0] || 
    'gold';

  const currentPrice = selectedProduct.prices[chosenCurrency] ?? 0;
  const hasEnoughFunds = wallet[chosenCurrency] >= currentPrice;
  const meetsMinLevel = currentLevel >= (selectedProduct.minLevel || 1);

  // Executa compra e equipa automaticamente se for roupa/skin
  const handleBuy = () => {
    const result = economyManager.purchaseProduct(selectedProduct.id, chosenCurrency, currentLevel);

    if (result.success) {
      soundManager.playPurchase();
      setPurchasedModal(selectedProduct);
      onItemPurchased?.(selectedProduct);

      // Se tiver dados de customização, auto-equipa no avatar do jogo
      if (selectedProduct.customizationData && onEquipCustomization) {
        onEquipCustomization(selectedProduct.customizationData);
      }
    } else {
      setFeedbackMessage({ text: result.message, isError: true });
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  // Navegação horizontal do carrossel
  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 220;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Configurações de raridade
  const getRarityBadge = (rarity: string = 'epico') => {
    switch (rarity) {
      case 'lendario':
        return {
          label: 'Lendário',
          badgeClass: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black',
          borderClass: 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
        };
      case 'raro':
        return {
          label: 'Raro',
          badgeClass: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold',
          borderClass: 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
        };
      case 'epico':
      default:
        return {
          label: 'Épico',
          badgeClass: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-black',
          borderClass: 'border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.6)]'
        };
    }
  };

  const rarityInfo = getRarityBadge(selectedProduct.rarity);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 select-none overflow-hidden font-sans">
      
      {/* CENÁRIO DA CIDADE DO JOGO E VIGNETTE DE ILUMINAÇÃO */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-slate-950/70 to-slate-950/95 pointer-events-none" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER (PERFIL, SALDOS DE 3 MOEDAS, AÇÕES E FECHAR)    */}
      {/* ============================================================== */}
      <header className="relative z-20 w-full px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 border-b border-indigo-900/40 bg-slate-950/75 backdrop-blur-md">
        
        {/* CARD DO JOGADOR (AVATAR, NOME, NÍVEL E BARRA DE XP) */}
        <div className="flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-blue-950/90 via-slate-900/90 to-indigo-950/80 border-2 border-cyan-400/80 rounded-xl px-2 sm:px-3 py-1 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-cyan-300 bg-slate-900 flex items-center justify-center relative flex-shrink-0">
            <span className="text-xl sm:text-2xl">👦</span>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white italic tracking-wide truncate font-['Rajdhani'] drop-shadow">
                {playerName}
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300">
                Lv. {currentLevel > 1 ? currentLevel : 1}
              </span>
            </div>
            {/* Barra de XP Dourada */}
            <div className="w-20 sm:w-28 h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-amber-500/40">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]"
                style={{ width: '75%' }}
              />
            </div>
          </div>
        </div>

        {/* SALDOS DAS 3 MOEDAS COM BOTÃO DE + */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center">
          
          {/* 🪙 OURO */}
          <div 
            onClick={() => setShowCurrencyHelp('ouro')}
            className="group cursor-pointer bg-slate-950/90 border border-amber-500/60 rounded-full pl-2 sm:pl-3 pr-1 py-0.5 sm:py-1 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:border-amber-400 transition"
            title="Saldo de Ouro - Clique para detalhes"
          >
            <span className="text-base sm:text-lg drop-shadow">🪙</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono tracking-tight">
              {wallet.gold.toLocaleString('pt-BR')}
            </span>
            <button 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-black text-xs sm:text-sm shadow ml-0.5 active:scale-90 transition"
              aria-label="Adicionar Ouro"
            >
              +
            </button>
          </div>

          {/* 💎 DIAMANTES */}
          <div 
            onClick={() => setShowCurrencyHelp('diamantes')}
            className="group cursor-pointer bg-slate-950/90 border border-sky-400/70 rounded-full pl-2 sm:pl-3 pr-1 py-0.5 sm:py-1 flex items-center gap-1.5 shadow-[0_0_12px_rgba(56,189,248,0.35)] hover:border-sky-300 transition"
            title="Saldo de Diamantes - Clique para detalhes"
          >
            <span className="text-base sm:text-lg drop-shadow">💎</span>
            <span className="text-xs sm:text-sm font-black text-sky-300 font-mono tracking-tight">
              {wallet.diamonds.toLocaleString('pt-BR')}
            </span>
            <button 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-black text-xs sm:text-sm shadow ml-0.5 active:scale-90 transition"
              aria-label="Adicionar Diamantes"
            >
              +
            </button>
          </div>

          {/* ❇️ ESMERALDAS */}
          <div 
            onClick={() => setShowCurrencyHelp('esmeraldas')}
            className="group cursor-pointer bg-slate-950/90 border border-emerald-400/80 rounded-full pl-2 sm:pl-3 pr-1 py-0.5 sm:py-1 flex items-center gap-1.5 shadow-[0_0_14px_rgba(16,185,129,0.4)] hover:border-emerald-300 transition"
            title="Saldo de Esmeraldas - Clique para detalhes"
          >
            <span className="text-base sm:text-lg drop-shadow">❇️</span>
            <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono tracking-tight">
              {wallet.emeralds.toLocaleString('pt-BR')}
            </span>
            <button 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center font-black text-xs sm:text-sm shadow ml-0.5 active:scale-90 transition"
              aria-label="Adicionar Esmeraldas"
            >
              +
            </button>
          </div>

        </div>

        {/* BOTÕES DE UTILIDADE E BOTÃO FECHAR VERMELHO */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 border border-amber-500/50 hover:border-amber-400 text-amber-400 flex items-center justify-center shadow transition active:scale-95"
            title="Carrinho de Compras"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 border border-yellow-500/50 hover:border-yellow-400 text-yellow-300 flex items-center justify-center shadow transition active:scale-95"
            title="Pacotes e Recompensas"
          >
            <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center shadow transition active:scale-95"
            title="Configurações da Loja"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* BOTÃO FECHAR VERMELHO COM BRILHO NEON */}
          <button 
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-b from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border-2 border-red-400 text-white flex items-center justify-center shadow-[0_0_18px_rgba(239,68,68,0.7)] transition active:scale-90 ml-1"
            title="Fechar Loja"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </button>

        </div>

      </header>

      {/* FEEDBACK DE COMPRA OU ERRO */}
      {feedbackMessage && (
        <div className={`relative z-40 px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg animate-fade-in ${
          feedbackMessage.isError 
            ? 'bg-rose-950/95 border-b border-rose-500 text-rose-200 shadow-rose-900/50' 
            : 'bg-emerald-950/95 border-b border-emerald-500 text-emerald-200 shadow-emerald-900/50'
        }`}>
          {feedbackMessage.isError ? <span>⚠️</span> : <Check className="w-4 h-4 text-emerald-400" />}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CORPO PRINCIPAL: LOGO + ABAS + PALCO 3D COM AVATAR + CARD   */}
      {/* ============================================================== */}
      <main className="relative z-10 flex-1 w-full flex flex-col md:flex-row items-stretch justify-between p-2 sm:p-4 gap-2 sm:gap-4 overflow-hidden">
        
        {/* COLUNA ESQUERDA: LOGO POLÍGONO + ABAS VERTICAIS INCLINADAS */}
        <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0 z-20">
          
          {/* BANNER ESMERALDA STORE */}
          <div className="transform -skew-x-12 bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 border-2 border-cyan-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 sm:gap-3 w-fit">
            <div className="transform skew-x-12 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="transform skew-x-12 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-black italic tracking-wider text-white font-['Rajdhani'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ESMERALDA
              </span>
              <span className="text-lg sm:text-2xl font-black italic tracking-wider text-emerald-400 font-['Rajdhani'] drop-shadow-[0_0_12px_rgba(52,211,153,0.85)]">
                STORE
              </span>
            </div>
          </div>

          {/* ABAS VERTICAIS INCLINADAS */}
          <div className="flex md:flex-col gap-1.5 sm:gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0">
            {STORE_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`transform -skew-x-12 group px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg flex items-center gap-2 sm:gap-2.5 whitespace-nowrap transition-all duration-150 active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-yellow-300 text-slate-950 font-black border-2 border-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.75)]'
                      : 'bg-gradient-to-r from-purple-950/85 via-slate-950/85 to-indigo-950/85 hover:from-purple-900/90 hover:to-indigo-900/90 text-slate-200 border border-purple-500/40 hover:border-purple-400 shadow-sm'
                  }`}
                >
                  <div className={`transform skew-x-12 flex items-center justify-center ${isActive ? 'text-slate-950' : 'text-white group-hover:text-amber-300'}`}>
                    <IconComp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                  </div>
                  <span className={`transform skew-x-12 text-xs sm:text-sm tracking-wide font-['Rajdhani'] uppercase ${
                    isActive ? 'font-black text-slate-950' : 'font-bold text-slate-200 group-hover:text-white'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* CENTRO: PALCO 3D COM O CENÁRIO REAL DO JOGO E O AVATAR EM MOVIMENTO */}
        <div className="flex-1 relative flex flex-col items-center justify-center min-h-[280px] md:min-h-[420px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/50 backdrop-blur-sm shadow-[0_0_35px_rgba(6,182,212,0.25)]">
          
          {/* VIEWPORT 3D DO THEO LUCCA COM O ITEM SELECIONADO E O CENÁRIO REAL */}
          <Store3DStage
            selectedProduct={selectedProduct}
            baseCustomization={characterCustomization}
            rotationAngle={rotationAngle}
            onRotationChange={(angle) => setRotationAngle(angle)}
            actionPose={actionPose}
          />

          {/* CONTROLES DE MOVIMENTO DO AVATAR (ACENAR, POSE, DANÇA, AUTO-GIRO) */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 sm:gap-1.5 bg-slate-950/85 border border-purple-500/60 rounded-xl p-1 shadow-lg backdrop-blur-md">
            <button
              onClick={() => {
                setActionPose('wave');
                setTimeout(() => setActionPose('idle'), 2400);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-mono transition flex items-center gap-1 ${
                actionPose === 'wave' 
                  ? 'bg-amber-400 text-slate-950 font-black shadow' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Fazer avatar acenar"
            >
              <span>👋</span>
              <span className="hidden sm:inline">Acenar</span>
            </button>
            <button
              onClick={() => {
                setActionPose('heroic');
                setTimeout(() => setActionPose('idle'), 2600);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-mono transition flex items-center gap-1 ${
                actionPose === 'heroic' 
                  ? 'bg-cyan-400 text-slate-950 font-black shadow' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Pose Heroica de Campeão"
            >
              <span>🦸‍♂️</span>
              <span className="hidden sm:inline">Pose</span>
            </button>
            <button
              onClick={() => {
                setActionPose('dance');
                setTimeout(() => setActionPose('idle'), 2800);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-mono transition flex items-center gap-1 ${
                actionPose === 'dance' 
                  ? 'bg-fuchsia-400 text-slate-950 font-black shadow' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Dancinha de Vitória"
            >
              <span>🕺</span>
              <span className="hidden sm:inline">Dançar</span>
            </button>
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-mono transition flex items-center gap-1 ${
                isAutoRotating 
                  ? 'bg-emerald-500 text-slate-950 font-black' 
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
              title="Giro automático 360°"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* DICA DE INTERAÇÃO FLUTUANTE INFERIOR */}
          <div className="absolute bottom-2 z-20 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400/70 text-[10px] sm:text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] pointer-events-none">
            <RotateCw className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>Arraste para girar 360° ({Math.round(rotationAngle)}°)</span>
          </div>

        </div>

        {/* COLUNA DIREITA: CARD DO PRODUTO SELECIONADO (ESTILO FREE FIRE ROXO/MAGENTA) */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col justify-between z-20">
          
          <div className="transform -skew-x-2 md:-skew-x-4 bg-gradient-to-b from-purple-950/95 via-indigo-950/95 to-slate-950/95 border-2 border-fuchsia-500/80 rounded-2xl p-3 sm:p-4 shadow-[0_0_35px_rgba(217,70,239,0.45)] backdrop-blur-md flex flex-col gap-3">
            
            {/* TÍTULO DO PRODUTO */}
            <div className="transform skew-x-2 md:skew-x-4">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white font-['Rajdhani'] tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {selectedProduct.name}
              </h2>
            </div>

            {/* BADGE DE RARIDADE (ÉPICO / LENDÁRIO / RARO) COM LISTRAS DIAGONAIS */}
            <div className="transform skew-x-2 md:skew-x-4 flex items-center gap-2">
              <div className={`px-3 py-0.5 rounded-md text-xs sm:text-sm uppercase tracking-wider border flex items-center gap-2 ${rarityInfo.badgeClass} ${rarityInfo.borderClass}`}>
                <span>{rarityInfo.label}</span>
                <span className="font-mono text-xs opacity-75 font-normal">///</span>
              </div>
              {selectedProduct.minLevel > 1 && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  Nível {selectedProduct.minLevel}+
                </span>
              )}
            </div>

            {/* DESCRIÇÃO */}
            <p className="transform skew-x-2 md:skew-x-4 text-xs sm:text-sm text-slate-300 italic font-medium leading-relaxed drop-shadow">
              "{selectedProduct.description}"
            </p>

            {/* ITENS INCLUSOS / COMPONENTES DO CONJUNTO (3 MINI-CARDS) */}
            <div className="transform skew-x-2 md:skew-x-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block mb-1.5">
                Componentes do Pacote:
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(selectedProduct.subItems || [
                  { name: 'Item Principal', icon: selectedProduct.icon, part: 'Geral' },
                  { name: 'Acessório Exclusivo', icon: '✨', part: 'Efeito' },
                  { name: 'Certificado Real', icon: '📜', part: 'Item' },
                ]).map((sub, idx) => (
                  <div 
                    key={idx}
                    className="bg-slate-950/80 border border-fuchsia-500/50 hover:border-cyan-400 rounded-xl p-1.5 sm:p-2 flex flex-col items-center text-center shadow-inner group transition"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-b from-purple-900/60 to-slate-900 flex items-center justify-center text-xl sm:text-2xl shadow group-hover:scale-110 transition-transform">
                      {sub.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-black text-white truncate w-full mt-1 font-['Rajdhani']">
                      {sub.name}
                    </span>
                    <span className="text-[8.5px] font-mono text-cyan-300 truncate w-full">
                      {sub.part}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* LINHA DE PREÇO / SELETOR DE MOEDAS PERMITIDAS */}
            <div className="transform skew-x-2 md:skew-x-4 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 block mb-1">
                Selecione a Moeda para Pagamento:
              </span>
              <div className="flex items-center gap-2">
                {selectedProduct.allowedCurrencies.map((curr) => {
                  const price = selectedProduct.prices[curr];
                  if (price === undefined) return null;
                  const isSelected = chosenCurrency === curr;
                  const canAfford = wallet[curr] >= price;

                  const currIcon = curr === 'gold' ? '🪙' : curr === 'diamonds' ? '💎' : '❇️';
                  const textColor = curr === 'gold' ? 'text-amber-400' : curr === 'diamonds' ? 'text-sky-300' : 'text-emerald-400';
                  const activeBorder = curr === 'gold' 
                    ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                    : curr === 'diamonds' 
                      ? 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.6)]' 
                      : 'border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]';

                  return (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrencyMap((prev) => ({ ...prev, [selectedProduct.id]: curr }))}
                      className={`flex-1 py-1.5 px-2 rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        isSelected 
                          ? `bg-slate-950 ${activeBorder} border-2 font-black` 
                          : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-base">{currIcon}</span>
                      <span className={`text-sm sm:text-base font-black font-mono ${textColor}`}>
                        {price}
                      </span>
                      {!canAfford && (
                        <span className="text-[9px] text-rose-400 font-mono" title="Saldo insuficiente">⚠️</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTÃO ADQUIRIR DOURADO BRILHANTE (1:1 COM O FREE FIRE) */}
            <div className="transform skew-x-2 md:skew-x-4 pt-1">
              <button
                onClick={handleBuy}
                disabled={!hasEnoughFunds || !meetsMinLevel}
                className={`w-full py-2.5 sm:py-3.5 px-6 rounded-xl font-['Rajdhani'] font-black text-base sm:text-xl uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-150 active:scale-95 shadow-xl ${
                  !meetsMinLevel
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : hasEnoughFunds
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 hover:from-yellow-300 hover:to-amber-300 text-slate-950 border-2 border-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.85)] cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-rose-500/50 cursor-pointer'
                }`}
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                <span>Adquirir</span>
              </button>

              {!hasEnoughFunds && (
                <p className="text-[10px] text-center text-rose-400 mt-1 font-mono">
                  Saldo insuficiente para comprar com {chosenCurrency === 'gold' ? 'Ouro' : chosenCurrency === 'diamonds' ? 'Diamantes' : 'Esmeraldas'}.
                </p>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* ============================================================== */}
      {/* 3. CARROSSEL HORIZONTAL DE ITENS (SHELF INFERIOR ESTILO FREE FIRE) */}
      {/* ============================================================== */}
      <footer className="relative z-20 w-full px-2 sm:px-4 py-2 sm:py-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent border-t border-indigo-900/40 flex items-center gap-2">
        
        {/* Seta Esquerda */}
        <button
          onClick={() => handleScrollCarousel('left')}
          className="w-8 h-16 sm:w-10 sm:h-20 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-yellow-400 text-slate-200 hover:text-white flex items-center justify-center shadow-lg transition active:scale-90 flex-shrink-0"
          title="Ver produtos anteriores"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Lista Horizontal de Cards Inclinados */}
        <div 
          ref={carouselRef}
          className="flex-1 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1"
        >
          {products.map((prod) => {
            const isSelected = selectedProduct.id === prod.id;

            return (
              <div
                key={prod.id}
                onClick={() => {
                  setSelectedProductId(prod.id);
                  setRotationAngle(0);
                }}
                className={`transform -skew-x-6 cursor-pointer flex-shrink-0 w-28 sm:w-36 h-20 sm:h-24 rounded-xl p-1 flex flex-col justify-between transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-b from-purple-900 via-indigo-950 to-slate-950 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.9)] scale-105'
                    : 'bg-slate-950/80 border border-indigo-600/50 hover:border-cyan-400/80 shadow-md'
                }`}
              >
                {/* Ícone ou Ilustração no Centro */}
                <div className="transform skew-x-6 flex-1 flex items-center justify-center">
                  <div className="text-2xl sm:text-3xl filter drop-shadow">
                    {prod.icon}
                  </div>
                </div>

                {/* Nome do Produto com Tarja */}
                <div className={`transform skew-x-6 w-full py-0.5 px-1 rounded-md text-center truncate ${
                  isSelected 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black' 
                    : 'bg-slate-900/80 text-white font-bold'
                }`}>
                  <span className="text-[10px] sm:text-xs font-['Rajdhani'] uppercase truncate block">
                    {prod.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seta Direita */}
        <button
          onClick={() => handleScrollCarousel('right')}
          className="w-8 h-16 sm:w-10 sm:h-20 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-yellow-400 text-slate-200 hover:text-white flex items-center justify-center shadow-lg transition active:scale-90 flex-shrink-0"
          title="Ver próximos produtos"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>

      </footer>

      {/* ============================================================== */}
      {/* 4. MODAL DE VITÓRIA / AQUISIÇÃO DE SUCESSO (ESTILO FREE FIRE)   */}
      {/* ============================================================== */}
      {purchasedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="transform -skew-x-2 bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 border-2 border-yellow-400 rounded-2xl max-w-sm w-full p-6 text-center shadow-[0_0_60px_rgba(250,204,21,0.6)] flex flex-col items-center gap-4">
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center text-4xl shadow-xl animate-bounce-slight">
              {purchasedModal.icon}
            </div>

            <div className="transform skew-x-2">
              <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-xs font-mono font-bold uppercase tracking-wider">
                🎉 Item Adquirido!
              </span>
              <h3 className="text-2xl font-black italic uppercase text-white font-['Rajdhani'] mt-2">
                {purchasedModal.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                O item foi salvo com sucesso no seu <strong>Inventário</strong> e vestido no avatar!
              </p>
            </div>

            <div className="transform skew-x-2 w-full flex gap-2 pt-2">
              <button
                onClick={() => setPurchasedModal(null)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-['Rajdhani'] font-black text-base uppercase tracking-wider shadow-lg active:scale-95 transition"
              >
                Continuar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL DE AJUDA DAS MOEDAS AO CLICAR NO "+"                 */}
      {/* ============================================================== */}
      {showCurrencyHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-cyan-400/80 rounded-2xl max-w-sm w-full p-5 text-center shadow-[0_0_40px_rgba(6,182,212,0.5)] flex flex-col items-center gap-3">
            <div className="text-4xl">
              {showCurrencyHelp === 'ouro' ? '🪙' : showCurrencyHelp === 'diamantes' ? '💎' : '❇️'}
            </div>
            <h3 className="text-lg font-black uppercase text-white font-['Rajdhani']">
              Como Obter {showCurrencyHelp === 'ouro' ? 'Ouro' : showCurrencyHelp === 'diamantes' ? 'Diamantes' : 'Esmeraldas'}?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {showCurrencyHelp === 'ouro' && 'Ganhe Ouro trabalhando nas oficinas, completando missões e recolhendo moedas espalhadas pela Cidade Real!'}
              {showCurrencyHelp === 'diamantes' && 'Encontre Diamantes em locais secretos pela cidade, como no topo de edifícios, praças ocultas e ao cumprir marcos de expansão!'}
              {showCurrencyHelp === 'esmeraldas' && 'Esmeraldas são a moeda premium! Conquiste-as em missões lendárias raras ou por meio de pacotes gerenciados no Painel Administrativo.'}
            </p>
            <button
              onClick={() => setShowCurrencyHelp(null)}
              className="mt-2 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
