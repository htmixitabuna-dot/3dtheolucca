
import React, { useState, useEffect } from 'react';
import { Play, UserPlus, RefreshCw, Check, ArrowLeft, ShieldCheck, Sparkles, X } from 'lucide-react';
import { soundManager } from '../simulation/audio';
import { safeGetItem, safeSetItem } from '../utils/safeStorage';

export interface SavedPlayerProfile {
  name: string;
  capColor: string;
  capColorName: 'azul' | 'vermelho' | 'amarelo';
  lastPlayed?: number;
}

export interface LoginScreenProps {
  isOpen: boolean;
  onStartGame: (profile: SavedPlayerProfile) => void;
  onClose?: () => void;
}

const CAP_OPTIONS = [
  {
    id: 'azul' as const,
    name: 'AZUL',
    colorHex: '#1d4ed8',
    glowColor: 'rgba(29, 78, 216, 0.65)',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-600',
  },
  {
    id: 'vermelho' as const,
    name: 'VERMELHO',
    colorHex: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.65)',
    borderClass: 'border-red-500',
    bgClass: 'bg-red-600',
  },
  {
    id: 'amarelo' as const,
    name: 'AMARELO',
    colorHex: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.65)',
    borderClass: 'border-amber-400',
    bgClass: 'bg-amber-500',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  isOpen,
  onStartGame,
  onClose,
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'newPlayer'>('main');
  const [savedPlayer, setSavedPlayer] = useState<SavedPlayerProfile | null>(null);

  // Estados para Tela 2 - Novo Jogador
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedCap, setSelectedCap] = useState<'azul' | 'vermelho' | 'amarelo'>('azul');
  const [inputError, setInputError] = useState<string | null>(null);

  // Carrega jogador salvo no localStorage
  useEffect(() => {
    try {
      const savedData = safeGetItem('theo_lucca_player_profile');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.name) {
          setSavedPlayer(parsed);
        }
      } else {
        // Tenta recuperar nome da customização se já existia
        const customData = safeGetItem('theo_lucca_customization');
        if (customData) {
          const custom = JSON.parse(customData);
          if (custom && custom.name) {
            let capName: 'azul' | 'vermelho' | 'amarelo' = 'azul';
            if (custom.capColor === '#dc2626') capName = 'vermelho';
            else if (custom.capColor === '#f59e0b') capName = 'amarelo';

            const recovered: SavedPlayerProfile = {
              name: custom.name,
              capColor: custom.capColor || '#1d4ed8',
              capColorName: capName,
            };
            setSavedPlayer(recovered);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Iniciar jogo: se já tiver salvo usa o salvo; se não tiver, cria Theo Lucca padrão e joga imediatamente!
  const handlePlaySavedPlayer = () => {
    soundManager.playStarCollect();
    if (savedPlayer) {
      onStartGame(savedPlayer);
    } else {
      const defaultProfile: SavedPlayerProfile = {
        name: 'Theo Lucca',
        capColor: '#1d4ed8',
        capColorName: 'azul',
        lastPlayed: Date.now(),
      };
      safeSetItem('theo_lucca_player_profile', JSON.stringify(defaultProfile));
      setSavedPlayer(defaultProfile);
      onStartGame(defaultProfile);
    }
  };

  // Confirmar criação do novo jogador
  const handleCreateNewPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) {
      setInputError('Por favor, digite seu primeiro nome!');
      soundManager.playPopClick();
      return;
    }

    // Apenas primeiro nome (sem espaços ou palavras extras)
    const firstName = trimmed.split(' ')[0];
    const capInfo = CAP_OPTIONS.find((c) => c.id === selectedCap) || CAP_OPTIONS[0];

    const newProfile: SavedPlayerProfile = {
      name: firstName,
      capColor: capInfo.colorHex,
      capColorName: selectedCap,
      lastPlayed: Date.now(),
    };

    try {
      safeSetItem('theo_lucca_player_profile', JSON.stringify(newProfile));
      // Sincroniza também com a customização do modelo 3D
      const existingCustom = safeGetItem('theo_lucca_customization');
      const base = existingCustom ? JSON.parse(existingCustom) : {};
      safeSetItem(
        'theo_lucca_customization',
        JSON.stringify({
          ...base,
          name: firstName,
          capColor: capInfo.colorHex,
          hasCap: true,
        })
      );
    } catch {
      // ignore
    }

    soundManager.playStarCollect();
    setSavedPlayer(newProfile);
    onStartGame(newProfile);
  };

  // Trocar de jogador (permite cadastrar outro nome)
  const handleSwitchPlayer = () => {
    soundManager.playPopClick();
    setNewPlayerName('');
    setInputError(null);
    setCurrentView('newPlayer');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden select-none font-sans bg-slate-950 p-3 sm:p-5">
      
      {/* 1. FUNDO COM A IMAGEM DA CAPA AJUSTADA (OS NOMES NUNCA FICAM FORA DA TELA) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center bg-slate-950">
        
        {/* Fundo escuro suave nas bordas sem blur pesado sobre WebGL */}
        <img
          src="/assets/aistudio/IMG-20261111-WA1474_ce1c5b95.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/cover.jpg';
          }}
        />

        {/* IMAGEM DA CAPA COM ENQUADRAMENTO NATURAL COMPLETO (NENHUM NOME CORTADO) */}
        <img
          src="/assets/aistudio/IMG-20261111-WA1474_ce1c5b95.jpg"
          alt="Capa do Jogo Theo Lucca Free City"
          className="relative max-w-full max-h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.9)]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/cover.jpg';
          }}
        />

        {/* Escurecido suave para garantir legibilidade dos textos e botões */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950/85 pointer-events-none" />
      </div>

      {/* BOTÃO DISCRETO FECHAR / ENTRAR DIRETO NO JOGO (NO CANTO SUPERIOR DIREITO) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold shadow-xl"
          title="Fechar tela de início e explorar cidade"
        >
          <span>Explorar Cidade</span>
          <X className="w-3.5 h-3.5 text-amber-400" />
        </button>
      )}

      {/* 2. CONTEÚDO PRINCIPAL CENTRALIZADO */}
      <div className="relative z-10 w-full max-w-md px-3 py-4 my-auto flex flex-col items-center text-center animate-fade-in">
        {/* =========================================================================
            TELA 1: LOGIN / INÍCIO DO JOGO
           ========================================================================= */}
        {currentView === 'main' && (
          <div className="w-full flex flex-col items-center">
            {/* ÍCONE DO JOGO NO CENTRO DO TOPO (LOGO PEQUENA) */}
            <div className="relative mb-2 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950/90 border-2 border-cyan-400/90 p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.7)] flex items-center justify-center transition-transform transform group-hover:scale-105 overflow-hidden">
                <img
                  src="/assets/aistudio/IMG-20261111-WA0966_ea80a585.jpg"
                  alt="Ícone Theo Lucca Free City"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/app_icon.jpg';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[9px] font-black rounded-full shadow border border-white">
                3D
              </span>
            </div>

            {/* TÍTULO GIGANTE NO CENTRO */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-sky-300 font-['Rajdhani'] uppercase drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] leading-tight">
              THEO LUCCA
            </h1>

            {/* SUBTÍTULO MENOR E AMARELO */}
            <div className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-black tracking-wider text-amber-400 uppercase font-['Rajdhani'] drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]">
              FREE CITY - MUNDO ABERTO
            </div>

            {/* SUBTÍTULO EM BRANCO PEQUENO */}
            <div className="mt-1 text-[9px] sm:text-xs font-bold tracking-widest text-slate-200 uppercase font-mono drop-shadow">
              MUNDO ABERTO • OFFLINE • EXPLORAR E JOGAR
            </div>

            {/* MENSAGEM DO JOGADOR SALVO */}
            {savedPlayer && (
              <div className="mt-3 sm:mt-4 w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 text-left">
                  {/* Avatar do Boné Escolhido */}
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border-2 border-white/60 shadow-lg flex-shrink-0"
                    style={{ backgroundColor: savedPlayer.capColor || '#1d4ed8' }}
                  >
                    <span className="text-base sm:text-lg">🧢</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Jogador Atual
                    </div>
                    <div className="text-sm sm:text-base font-black text-amber-300 tracking-wide font-['Rajdhani'] truncate">
                      Olá, {savedPlayer.name}!
                    </div>
                  </div>
                </div>

                {/* BOTÃO PEQUENO NO CANTINHO: TROCAR JOGADOR */}
                <button
                  onClick={handleSwitchPlayer}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow flex-shrink-0"
                  title="Trocar ou cadastrar outro jogador"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trocar</span>
                </button>
              </div>
            )}

            {/* BOTÕES GIGANTES NO MEIO */}
            <div className="mt-4 sm:mt-5 w-full space-y-2.5 sm:space-y-3.5">
              {/* 1. BOTÃO VERDE GIGANTE: ▶ JOGAR */}
              <button
                onClick={handlePlaySavedPlayer}
                className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-lg sm:text-2xl tracking-wider uppercase font-['Rajdhani'] shadow-[0_0_30px_rgba(16,185,129,0.55)] border-2 border-emerald-300 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 hover:brightness-110"
              >
                <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-white flex-shrink-0" />
                <span>{savedPlayer ? '▶ CONTINUAR JOGANDO' : '▶ JOGAR'}</span>
              </button>

              {/* 2. BOTÃO AMARELO GIGANTE: + NOVO JOGADOR */}
              <button
                onClick={() => {
                  soundManager.playPopClick();
                  setCurrentView('newPlayer');
                }}
                className="w-full py-3 sm:py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base sm:text-xl tracking-wider uppercase font-['Rajdhani'] shadow-[0_0_25px_rgba(245,158,11,0.5)] border-2 border-yellow-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 hover:brightness-110"
              >
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 flex-shrink-0" />
                <span>+ NOVO JOGADOR</span>
              </button>
            </div>

            {/* TEXTO EMBAIXO BEM PEQUENO */}
            <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-slate-300 font-mono tracking-wide drop-shadow">
              Jogar sem internet, sem e-mail, sem senha.
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 px-3 py-0.5 bg-slate-950/90 border border-slate-700/60 rounded-full text-[8.5px] sm:text-[9px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>100% OFFLINE • DADOS SALVOS NO SEU DISPOSITIVO</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            TELA 2: NOVO JOGADOR (NOME + ESCOLHA DE BONÉ)
           ========================================================================= */}
        {currentView === 'newPlayer' && (
          <form
            onSubmit={handleCreateNewPlayer}
            className="w-full bg-slate-950/95 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col items-center animate-scale-up"
          >
            {/* CABEÇALHO COM BOTÃO VOLTAR */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundManager.playPopClick();
                  setCurrentView('main');
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <div className="text-sm sm:text-base font-black text-amber-400 font-['Rajdhani'] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>NOVO JOGADOR</span>
              </div>

              <div className="w-12" />
            </div>

            {/* 1. TEXTO: QUAL É O SEU NOME? */}
            <div className="w-full mt-4 text-left">
              <label className="block text-sm sm:text-base font-black text-white uppercase font-['Rajdhani'] tracking-wide">
                QUAL É O SEU NOME?
              </label>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Digite apenas seu primeiro nome para jogar
              </p>

              {/* CAIXA DE TEXTO GRANDE, SÓ PRIMEIRO NOME */}
              <input
                type="text"
                autoFocus
                maxLength={14}
                value={newPlayerName}
                onChange={(e) => {
                  setNewPlayerName(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="Ex: Theo, Lucca, Davi..."
                className="mt-2 w-full px-4 py-3.5 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-amber-400 text-white text-lg sm:text-xl font-bold placeholder-slate-500 outline-none shadow-inner transition font-['Rajdhani'] tracking-wide uppercase"
              />
              {inputError && (
                <p className="text-xs text-rose-400 font-bold mt-1.5">{inputError}</p>
              )}
            </div>

            {/* 2. TEXTO: ESCOLHA SEU BONÉ: */}
            <div className="w-full mt-5 text-left">
              <label className="block text-sm sm:text-base font-black text-white uppercase font-['Rajdhani'] tracking-wide">
                ESCOLHA SEU BONÉ:
              </label>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                Toque na cor que você mais gosta para começar
              </p>

              {/* 3 BOTÕES REDONDOS: AZUL / VERMELHO / AMARELO */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                {CAP_OPTIONS.map((cap) => {
                  const isSelected = selectedCap === cap.id;
                  return (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => {
                        soundManager.playPopClick();
                        setSelectedCap(cap.id);
                      }}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all transform active:scale-95 ${
                        isSelected
                          ? `${cap.borderClass} bg-slate-900 shadow-[0_0_20px_${cap.glowColor}] scale-105`
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Círculo Redondo da Cor do Boné */}
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 border-white/80 shadow-lg relative"
                        style={{ backgroundColor: cap.colorHex }}
                      >
                        <span className="text-2xl sm:text-3xl filter drop-shadow">🧢</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <span
                        className={`mt-2 text-xs sm:text-sm font-black font-['Rajdhani'] tracking-wider uppercase ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {cap.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. BOTÃO VERDE GIGANTE: COMEÇAR A JOGAR */}
            <div className="w-full mt-6">
              <button
                type="submit"
                className="w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xl sm:text-2xl tracking-wider uppercase font-['Rajdhani'] shadow-[0_0_30px_rgba(16,185,129,0.65)] border-2 border-emerald-300 flex items-center justify-center gap-3 transition-all transform active:scale-95 hover:brightness-110"
              >
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white flex-shrink-0" />
                <span>COMEÇAR A JOGAR</span>
              </button>
            </div>

            <div className="mt-3 text-[10px] text-slate-400 font-mono">
              Sem internet • Sem e-mail • Sem senha
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
