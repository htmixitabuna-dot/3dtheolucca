import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Package, 
  Coins, 
  History, 
  UserCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { StoreProduct, StoreCategory, CurrencyType, AdminPackage, PlayerWallet } from '../types/economy';
import { economyManager } from '../simulation/EconomyManager';
import { soundManager } from '../simulation/audio';

export interface AdminPanelModalProps {
  isOpen: boolean;
  wallet: PlayerWallet;
  onClose: () => void;
  onWalletUpdated?: (newWallet: PlayerWallet) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  wallet,
  onClose,
  onWalletUpdated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'packages' | 'history' | 'wallet'>('products');
  const [productsList, setProductsList] = useState<StoreProduct[]>(() => economyManager.getProducts());
  const [packagesList, setPackagesList] = useState<AdminPackage[]>(() => economyManager.getPackages());
  const [transactionsList, setTransactionsList] = useState(() => economyManager.getTransactions());

  // Estado para cadastro/edição de produto
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Estado para ajuste de carteira
  const [goldGrant, setGoldGrant] = useState(100);
  const [diamondGrant, setDiamondGrant] = useState(10);
  const [emeraldGrant, setEmeraldGrant] = useState(25);
  const [grantFeedback, setGrantFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN padrão administrativo seguro
    if (pinInput === '1234' || pinInput === 'admin') {
      setIsAuthenticated(true);
      setPinError(false);
      soundManager.playStarCollect();
    } else {
      setPinError(true);
    }
  };

  const handleSaveProduct = (prod: StoreProduct) => {
    economyManager.upsertProduct(prod);
    setProductsList(economyManager.getProducts());
    setEditingProduct(null);
    setIsCreatingNew(false);
    soundManager.playPurchase();
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Deseja realmente excluir este produto da loja?')) {
      economyManager.deleteProduct(id);
      setProductsList(economyManager.getProducts());
    }
  };

  const handleGrantFunds = (currency: CurrencyType, amount: number) => {
    economyManager.adminGrantFunds(currency, amount, 'Painel Administrativo');
    onWalletUpdated?.(economyManager.getWallet());
    setTransactionsList(economyManager.getTransactions());
    soundManager.playMissionComplete();
    setGrantFeedback(`+${amount} ${currency.toUpperCase()} concedido com sucesso!`);
    setTimeout(() => setGrantFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 pointer-events-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(99,102,241,0.35)] overflow-hidden">
        
        {/* CABEÇALHO */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-400 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-['Rajdhani'] uppercase tracking-wider">
                  Painel de Administração
                </h2>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold">
                  GESTÃO & AUDITORIA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Configure preços, produtos, pacotes de Esmeraldas e consulte transações
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            title="Fechar Painel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SE NÃO ESTIVER AUTENTICADO: TELA DE PIN */}
        {!isAuthenticated ? (
          <div className="p-8 text-center max-w-sm mx-auto space-y-4 my-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-xl">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase font-['Rajdhani']">
                Acesso Restrito
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Digite a senha de administrador (PIN padrão: <span className="font-mono text-amber-300 font-bold">1234</span>)
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Digite o PIN (ex: 1234)"
                autoFocus
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 px-4 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-400 transition"
              />

              {pinError && (
                <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  PIN incorreto! Tente 1234.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                Entrar no Painel
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* NAVEGAÇÃO DE ABAS DO PAINEL */}
            <div className="px-2 pt-2 pb-1 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setActiveTab('products'); setEditingProduct(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'products' ? 'bg-indigo-600 text-white shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Produtos da Loja</span>
              </button>

              <button
                onClick={() => { setActiveTab('packages'); setEditingProduct(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'packages' ? 'bg-indigo-600 text-white shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Pacotes de Esmeraldas</span>
              </button>

              <button
                onClick={() => { setActiveTab('history'); setEditingProduct(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Auditoria & Transações</span>
              </button>

              <button
                onClick={() => { setActiveTab('wallet'); setEditingProduct(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Gestão do Jogador</span>
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[62vh] space-y-3">
              
              {/* ABA 1: PRODUTOS DA LOJA */}
              {activeTab === 'products' && (
                <div className="space-y-3 animate-fade-in">
                  {!editingProduct && !isCreatingNew ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-bold">
                          Catálogo Ativo ({productsList.length} itens cadastrados)
                        </span>
                        <button
                          onClick={() => {
                            setIsCreatingNew(true);
                            setEditingProduct({
                              id: `prod_custom_${Date.now()}`,
                              name: 'Novo Produto Customizado',
                              description: 'Descrição do novo item da loja.',
                              category: 'construcao',
                              allowedCurrencies: ['gold'],
                              prices: { gold: 50 },
                              minLevel: 1,
                              isConsumable: false,
                              isPermanent: true,
                              modelType: 'house_modern',
                              icon: '🏛️',
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cadastrar Produto</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {productsList.map((p) => (
                          <div
                            key={p.id}
                            className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-2xl">{p.icon}</span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-white truncate font-['Rajdhani'] text-sm">{p.name}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className="uppercase font-mono text-indigo-300">{p.category}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-mono">
                                    {Object.entries(p.prices).map(([curr, val]) => `${curr.toUpperCase()}: ${val}`).join(' | ')}
                                  </span>
                                  <span>•</span>
                                  <span>Nv. {p.minLevel}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => setEditingProduct({ ...p })}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-rose-900 text-rose-300 transition"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* FORMULÁRIO DE EDIÇÃO / CADASTRO */
                    <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/50 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-sm font-bold text-white uppercase font-['Rajdhani']">
                          {isCreatingNew ? 'Cadastrar Novo Produto' : `Editar: ${editingProduct?.name}`}
                        </h4>
                        <button
                          onClick={() => { setEditingProduct(null); setIsCreatingNew(false); }}
                          className="text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>

                      {editingProduct && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Nome do Produto:</label>
                            <input
                              type="text"
                              value={editingProduct.name}
                              onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1">Descrição:</label>
                            <input
                              type="text"
                              value={editingProduct.description}
                              onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-300 font-bold mb-1">Categoria:</label>
                              <select
                                value={editingProduct.category}
                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as StoreCategory })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                              >
                                <option value="personagem">Personagem</option>
                                <option value="construcao">Construção</option>
                                <option value="garagem">Garagem</option>
                                <option value="utilitarios">Utilitários</option>
                                <option value="decoracao">Decoração</option>
                                <option value="exclusivos">Exclusivos</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-300 font-bold mb-1">Ícone Emoji:</label>
                              <input
                                type="text"
                                value={editingProduct.icon}
                                onChange={(e) => setEditingProduct({ ...editingProduct, icon: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                            <div>
                              <label className="block text-amber-300 font-bold mb-1">Preço em Ouro (🪙):</label>
                              <input
                                type="number"
                                value={editingProduct.prices.gold ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                                  const prices = { ...editingProduct.prices, gold: val };
                                  const allowed = Object.keys(prices).filter((k) => (prices as any)[k] !== undefined) as CurrencyType[];
                                  setEditingProduct({ ...editingProduct, prices, allowedCurrencies: allowed });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                                placeholder="Desativado"
                              />
                            </div>

                            <div>
                              <label className="block text-sky-300 font-bold mb-1">Preço Diamante (💎):</label>
                              <input
                                type="number"
                                value={editingProduct.prices.diamonds ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                                  const prices = { ...editingProduct.prices, diamonds: val };
                                  const allowed = Object.keys(prices).filter((k) => (prices as any)[k] !== undefined) as CurrencyType[];
                                  setEditingProduct({ ...editingProduct, prices, allowedCurrencies: allowed });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                                placeholder="Desativado"
                              />
                            </div>

                            <div>
                              <label className="block text-emerald-300 font-bold mb-1">Preço Esmeralda (❇️):</label>
                              <input
                                type="number"
                                value={editingProduct.prices.emeralds ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                                  const prices = { ...editingProduct.prices, emeralds: val };
                                  const allowed = Object.keys(prices).filter((k) => (prices as any)[k] !== undefined) as CurrencyType[];
                                  setEditingProduct({ ...editingProduct, prices, allowedCurrencies: allowed });
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                                placeholder="Desativado"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => { setEditingProduct(null); setIsCreatingNew(false); }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveProduct(editingProduct)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            >
                              Salvar Produto
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: PACOTES DE ESMERALDAS */}
              {activeTab === 'packages' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  <p className="text-slate-300">
                    Configuração de pacotes da moeda premium (Esmeraldas) e valores de referência em R$:
                  </p>

                  <div className="space-y-2">
                    {packagesList.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">❇️</span>
                          <div>
                            <h4 className="font-bold text-white text-sm font-['Rajdhani']">{pkg.name}</h4>
                            <p className="text-[10px] text-emerald-400 font-mono font-bold">
                              {pkg.emeraldsAmount} Esmeraldas {pkg.bonusEmeralds > 0 && `(+${pkg.bonusEmeralds} BÔNUS)`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-amber-300 text-sm">
                            R$ {pkg.priceBrl.toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                            ATIVO
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 3: AUDITORIA E HISTÓRICO DE TRANSAÇÕES */}
              {activeTab === 'history' && (
                <div className="space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                    <span>Log de Movimentações Financeiras ({transactionsList.length} registradas)</span>
                    <button
                      onClick={() => setTransactionsList(economyManager.getTransactions())}
                      className="text-indigo-400 hover:underline"
                    >
                      Atualizar
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                    {transactionsList.length === 0 ? (
                      <p className="text-center py-8 text-slate-500">Nenhuma movimentação registrada ainda.</p>
                    ) : (
                      transactionsList.map((tx) => (
                        <div
                          key={tx.id}
                          className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 flex items-center justify-between gap-2 font-mono text-[11px]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-slate-200">
                              <span className={`font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} {tx.currency.toUpperCase()}
                              </span>
                              <span>•</span>
                              <span className="text-slate-300 truncate">{tx.description}</span>
                            </div>
                            <span className="text-[9.5px] text-slate-500">
                              {new Date(tx.timestamp).toLocaleTimeString('pt-BR')} • Saldo Após: {tx.balanceAfter}
                            </span>
                          </div>

                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold flex-shrink-0 ${
                            tx.type === 'spend' ? 'bg-rose-950/80 text-rose-300' : 'bg-emerald-950/80 text-emerald-300'
                          }`}>
                            {tx.type}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ABA 4: GESTÃO DO JOGADOR / CARTEIRA */}
              {activeTab === 'wallet' && (
                <div className="space-y-3 animate-fade-in text-xs">
                  {grantFeedback && (
                    <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{grantFeedback}</span>
                    </div>
                  )}

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white uppercase font-['Rajdhani'] text-sm">
                      Saldos Atuais do Jogador
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2 rounded-lg bg-slate-900 border border-amber-500/40">
                        <span className="text-xs text-amber-300 block">OURO</span>
                        <span className="text-base font-black text-amber-400">{wallet.gold.toFixed(0)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-sky-400/40">
                        <span className="text-xs text-sky-300 block">DIAMANTES</span>
                        <span className="text-base font-black text-sky-300">{wallet.diamonds}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-emerald-400/40">
                        <span className="text-xs text-emerald-300 block">ESMERALDAS</span>
                        <span className="text-base font-black text-emerald-400">{wallet.emeralds}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white uppercase font-['Rajdhani'] text-sm">
                      Concessão Rápida para Testes / Administração
                    </h4>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleGrantFunds('gold', goldGrant)}
                        className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold transition text-center"
                      >
                        +100 Ouro 🪙
                      </button>

                      <button
                        onClick={() => handleGrantFunds('diamonds', diamondGrant)}
                        className="p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/60 text-sky-300 font-bold transition text-center"
                      >
                        +10 Diamantes 💎
                      </button>

                      <button
                        onClick={() => handleGrantFunds('emeralds', emeraldGrant)}
                        className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 font-bold transition text-center"
                      >
                        +25 Esmeraldas ❇️
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {/* RODAPÉ */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>Área administrativa restrita protegida por PIN.</span>
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
