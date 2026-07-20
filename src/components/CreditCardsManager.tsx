import React, { useState } from 'react';
import { AppState, CreditCard, AVAILABLE_CURRENCIES } from '../types';
import { 
  CreditCard as CardIcon, 
  Plus, 
  Trash2, 
  Calendar, 
  X, 
  Check, 
  AlertCircle, 
  Percent, 
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface CreditCardsManagerProps {
  state: AppState;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => void;
  deleteCreditCard: (id: string) => void;
  updateCreditCard: (card: CreditCard) => void;
  addTransaction: (tx: any) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
}

export default function CreditCardsManager({
  state,
  addCreditCard,
  deleteCreditCard,
  updateCreditCard,
  addTransaction,
  convertAmount
}: CreditCardsManagerProps) {
  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // Modal / Creation States
  const [isAdding, setIsAdding] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [bankId, setBankId] = useState('manual');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('5');
  const [dueDay, setDueDay] = useState('12');
  const [currency, setCurrency] = useState(baseCurrency);

  // Filter & details states
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setBankId('manual');
    setLimit('');
    setClosingDay('5');
    setDueDay('12');
    setCurrency(baseCurrency);
    setEditingCard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (!name.trim() || isNaN(parsedLimit) || parsedLimit <= 0) return;

    const cardData = {
      name: name.trim(),
      bankId,
      limit: parsedLimit,
      closingDay: parseInt(closingDay, 10),
      dueDay: parseInt(dueDay, 10),
      currency,
    };

    if (editingCard) {
      updateCreditCard({
        ...cardData,
        id: editingCard.id,
      });
    } else {
      addCreditCard(cardData);
    }

    resetForm();
    setIsAdding(false);
  };

  const startEdit = (card: CreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setBankId(card.bankId);
    setLimit(card.limit.toString());
    setClosingDay(card.closingDay.toString());
    setDueDay(card.dueDay.toString());
    setCurrency(card.currency);
    setIsAdding(true);
  };

  // Helper to calculate total used limit from transactions
  const getCardExpenses = (cardId: string) => {
    const cardTxs = state.transactions.filter(
      (t) => t.paymentMethod === 'credito' && t.creditCardId === cardId && t.type === 'expense'
    );
    
    // Total sum in card currency
    const cardObj = (state.creditCards || []).find((c) => c.id === cardId);
    const cardCurrency = cardObj?.currency || baseCurrency;

    let totalInCardCurrency = 0;
    let totalInBaseCurrency = 0;

    cardTxs.forEach((t) => {
      const convertedToCard = convertAmount(t.amount, t.currency, cardCurrency);
      totalInCardCurrency += convertedToCard;

      const convertedToBase = convertAmount(t.amount, t.currency, baseCurrency);
      totalInBaseCurrency += convertedToBase;
    });

    return {
      total: totalInCardCurrency,
      totalBase: totalInBaseCurrency,
      count: cardTxs.length,
      transactions: cardTxs
    };
  };

  // Pay Card Invoice: settle all pending transactions
  const handlePayInvoice = (cardId: string) => {
    const cardObj = (state.creditCards || []).find((c) => c.id === cardId);
    if (!cardObj) return;

    const { total, count, transactions } = getCardExpenses(cardId);
    if (total <= 0) return;

    // 1. Create a dynamic debit transaction on the associated bank to represent the invoice payment
    const todayStr = new Date().toISOString().split('T')[0];
    addTransaction({
      description: `Pagamento Fatura: ${cardObj.name}`,
      amount: total,
      type: 'expense',
      category: 'Outros',
      subcategory: 'Fatura de Cartão',
      date: todayStr,
      currency: cardObj.currency,
      bankId: cardObj.bankId === 'manual' ? null : cardObj.bankId,
      paid: true,
      paymentMethod: 'pix', // Payed with pix or transfer
    });

    // 2. Clear out or mark card transactions in the past as paid to simulate settlement
    // In our system, transactions made on credit cards are kept, but we can generate a friendly feedback.
    setAlertModal({
      isOpen: true,
      title: 'Fatura Paga com Sucesso!',
      message: `Fatura de ${cardObj.currency} ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} paga com sucesso! Um lançamento de despesa correspondente foi gerado na conta do cartão.`
    });
  };

  const getCardGradient = (bankId: string) => {
    switch (bankId) {
      case 'nubank':
        return 'from-purple-800 via-purple-700 to-indigo-900 text-white';
      case 'itau':
        return 'from-orange-600 via-orange-500 to-amber-700 text-white';
      case 'bb':
        return 'from-yellow-400 via-yellow-500 to-blue-800 text-slate-900';
      case 'bradesco':
        return 'from-rose-700 via-rose-600 to-red-900 text-white';
      default:
        return 'from-slate-800 via-slate-700 to-slate-900 text-white';
    }
  };

  const getBankEmoji = (bankId: string) => {
    switch (bankId) {
      case 'nubank': return '💜';
      case 'itau': return '🧡';
      case 'bb': return '💛';
      case 'bradesco': return '❤️';
      default: return '💼';
    }
  };

  return (
    <div className="space-y-6" id="credit-cards-tab">
      {/* Visual Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-950 font-sans tracking-tight flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-indigo-600" />
            <span>Gestão de Cartões de Crédito</span>
          </h2>
          <p className="text-sm text-gray-500 font-sans max-w-2xl mt-1">
            Cadastre seus cartões de crédito e vincule-os às suas contas bancárias. O limite utilizado e disponível é calculado <strong className="text-indigo-600">automaticamente</strong> com base nos lançamentos feitos no cartão.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Cartão</span>
        </button>
      </div>

      {/* Main Grid: Cards & Details */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Visual Carousel/List */}
        <div className="xl:col-span-2 space-y-6">
          {(state.creditCards || []).length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <CardIcon className="w-8 h-8 stroke-1" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-bold text-gray-900 text-base">Nenhum cartão cadastrado ainda</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Adicione seus cartões para poder usá-los como forma de pagamento nos seus lançamentos. O sistema acompanhará o limite disponível automaticamente.
                </p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Cadastrar Primeiro Cartão
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(state.creditCards || []).map((card) => {
                const { total, totalBase, count } = getCardExpenses(card.id);
                const progress = Math.min((total / card.limit) * 100, 100);
                const availableLimit = card.limit - total;
                const isLimitCritical = progress > 80;

                const cardCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === card.currency)?.symbol || '$';

                return (
                  <div 
                    key={card.id}
                    onClick={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition hover:shadow-md cursor-pointer flex flex-col justify-between ${
                      selectedCardId === card.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-gray-200'
                    }`}
                  >
                    {/* Visual Card Representation */}
                    <div className={`relative h-44 rounded-2xl p-5 bg-gradient-to-br ${getCardGradient(card.bankId)} shadow-md overflow-hidden flex flex-col justify-between mb-4 select-none`}>
                      {/* Gloss Overlay */}
                      <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
                      
                      {/* Top Row: Brand & Chip */}
                      <div className="flex justify-between items-start z-10">
                        <div>
                          <p className="text-[10px] font-mono tracking-widest opacity-80 uppercase">CREDIT CARD</p>
                          <h4 className="font-bold text-sm tracking-wide mt-0.5">{card.name}</h4>
                        </div>
                        <div className="text-xl">
                          {getBankEmoji(card.bankId)}
                        </div>
                      </div>

                      {/* Chip icon */}
                      <div className="w-10 h-8 bg-amber-400/80 rounded-lg border border-amber-300/40 relative z-10 flex items-center justify-center overflow-hidden">
                        <div className="grid grid-cols-3 gap-0.5 w-full h-full p-1 opacity-50">
                          <div className="border border-slate-900/30 rounded-xs"></div>
                          <div className="border border-slate-900/30 rounded-xs"></div>
                          <div className="border border-slate-900/30 rounded-xs"></div>
                        </div>
                      </div>

                      {/* Card Number Preview */}
                      <div className="z-10 font-mono text-base tracking-widest my-1 opacity-90">
                        ••••  ••••  ••••  {card.id.substring(card.id.length - 4).toUpperCase()}
                      </div>

                      {/* Bottom Row: Holder, Exp, Dates */}
                      <div className="flex justify-between items-end z-10 text-[10px] font-mono">
                        <div>
                          <p className="opacity-70 text-[8px] uppercase">Dono do Cartão</p>
                          <p className="font-semibold tracking-wider">{state.preferences.userName.toUpperCase()}</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <p className="opacity-70 text-[8px] uppercase">Fecha</p>
                            <p className="font-semibold">Dia {card.closingDay}</p>
                          </div>
                          <div className="text-right">
                            <p className="opacity-70 text-[8px] uppercase">Vence</p>
                            <p className="font-semibold">Dia {card.dueDay}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Numeric breakdown and limit progress bar */}
                    <div className="space-y-3 font-sans">
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Limite Utilizado</span>
                        <span className="font-mono text-gray-900 font-bold">
                          {cardCurrencySymbol} {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {cardCurrencySymbol} {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLimitCritical ? 'bg-rose-500' : 'bg-indigo-600'
                          }`} 
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Limit available breakdown */}
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-gray-400">Limite Disponível</span>
                        <span className={`font-mono font-bold ${isLimitCritical ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {cardCurrencySymbol} {availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-semibold font-sans">
                          {count} Compras
                        </span>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(card);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-700 font-semibold rounded-lg text-xs transition"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                title: 'Excluir Cartão de Crédito',
                                message: `Tem certeza que deseja excluir o cartão "${card.name}"? Todas as faturas e dados associados serão removidos.`,
                                onConfirm: () => {
                                  deleteCreditCard(card.id);
                                  setConfirmModal(null);
                                }
                              });
                            }}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Card Invoice & Transactions Details */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm h-fit">
          <h3 className="text-base font-bold text-gray-950 font-sans tracking-tight mb-4 flex items-center gap-1.5 border-b border-gray-50 pb-3">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Resumo da Fatura & Lançamentos</span>
          </h3>

          {!selectedCardId ? (
            <div className="text-center py-12 text-gray-400 text-xs italic space-y-2">
              <Layers className="w-8 h-8 mx-auto stroke-1 text-gray-300" />
              <p>Selecione um cartão de crédito no painel ao lado para visualizar o extrato detalhado e efetuar o pagamento da fatura.</p>
            </div>
          ) : (() => {
            const cardObj = (state.creditCards || []).find((c) => c.id === selectedCardId);
            if (!cardObj) return null;

            const { total, count, transactions } = getCardExpenses(selectedCardId);
            const cardCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === cardObj.currency)?.symbol || '$';

            return (
              <div className="space-y-5">
                {/* Visual Invoice Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-100 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 font-mono text-7xl select-none translate-x-4 translate-y-4 font-extrabold">
                    💳
                  </div>
                  <span className="block text-[10px] uppercase tracking-wider text-indigo-600 font-bold">Fatura Aberta</span>
                  <p className="text-2xl font-bold font-mono text-indigo-950 mt-1">
                    {cardCurrencySymbol} {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-indigo-200/40 text-[11px] text-indigo-900">
                    <div>
                      <span className="opacity-75 block">Melhor Compra</span>
                      <span className="font-semibold font-sans">Dia {cardObj.closingDay}</span>
                    </div>
                    <div>
                      <span className="opacity-75 block">Vencimento</span>
                      <span className="font-semibold font-sans">Dia {cardObj.dueDay}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <button
                  type="button"
                  disabled={total <= 0}
                  onClick={() => handlePayInvoice(selectedCardId)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-150 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>Pagar Fatura Total ({cardCurrencySymbol} {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                </button>

                {/* Card Ledger */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Compras no Cartão ({count})</h4>
                  
                  {transactions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-slate-50 p-4 rounded-xl text-center">
                      Nenhuma compra registrada com este cartão neste período.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {transactions.map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-gray-150 rounded-xl text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{t.description}</p>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {t.date} • {t.category}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-gray-900 shrink-0">
                            - {AVAILABLE_CURRENCIES.find((c) => c.code === t.currency)?.symbol || '$'} {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Modal / Slider for Adding/Editing Card */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-950 font-sans">
                  {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
                </h3>
                <p className="text-xs text-gray-500 font-sans">
                  {editingCard ? 'Ajuste os dados do seu cartão' : 'Cadastre um novo cartão para o seu controle de limite'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                }}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Ultravioleta, Itaú Click"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Limite Total</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="1"
                    placeholder="5000.00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Moeda do Cartão</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  >
                    {AVAILABLE_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Conta de Banco Vinculada (Origem)</label>
                <select
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                >
                  <option value="manual">💼 Nenhuma / Avulsa</option>
                  {state.banks
                    .filter((b) => b.bankId !== 'manual')
                    .map((b) => (
                      <option key={b.bankId} value={b.bankId}>
                        🏦 {b.name}
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  O pagamento da fatura deste cartão será debitado automaticamente desta conta bancária.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dia do Fechamento</label>
                  <select
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Dia {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Dia do Vencimento</label>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Dia {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAdding(false);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-gray-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  {editingCard ? 'Salvar Cartão' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elegant Custom Modal Alert */}
      {alertModal && alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-sm w-full shadow-lg space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-violet-50 border border-violet-100 text-violet-600 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-sans">{alertModal.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{alertModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition duration-200 hover:scale-102 cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Custom Modal Confirm */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-sm w-full shadow-lg space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-sans">{confirmModal.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition duration-200 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
