import React, { useState } from 'react';
import { AppState, Transaction, AVAILABLE_CURRENCIES, CATEGORIES, CreditCard, getTransactionPaymentDate } from '../types';
import { Search, Plus, Trash2, Calendar, Filter, DollarSign, Wallet, Pencil, X, Check, Clock, AlertCircle } from 'lucide-react';

interface TransactionsListProps {
  state: AppState;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (tx: Transaction) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
  addCustomCategory: (label: string, color: string, emoji: string) => void;
  addSubcategory: (categoryId: string, label: string) => void;
  addCreditCard?: (card: Omit<CreditCard, 'id'>) => void;
}

export default function TransactionsList({ 
  state, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction, 
  convertAmount,
  addCustomCategory,
  addSubcategory,
  addCreditCard
}: TransactionsListProps) {
  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // All available categories (static defaults + user custom ones)
  const allCategories = [
    ...CATEGORIES,
    ...(state.customCategories || [])
  ];

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(allCategories[0]?.id || CATEGORIES[0].id);
  const [subcategory, setSubcategory] = useState('');
  const [currency, setCurrency] = useState(baseCurrency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankId, setBankId] = useState<string>('manual');
  
  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'credito' | 'debito' | 'transferencia'>('pix');
  const [creditCardId, setCreditCardId] = useState<string>('');

  // Auto-select credit card if empty
  React.useEffect(() => {
    if (paymentMethod === 'credito' && !creditCardId && state.creditCards && state.creditCards.length > 0) {
      setCreditCardId(state.creditCards[0].id);
    }
  }, [paymentMethod, creditCardId, state.creditCards]);

  // Custom Category creator state
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  // Custom Subcategory creator state
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubLabel, setNewSubLabel] = useState('');

  // Installments state
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('3');
  const [installmentValueType, setInstallmentValueType] = useState<'total' | 'single'>('total');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<'All' | 'income' | 'expense'>('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'All' | 'paid' | 'pending'>('All');

  // Paid and edit states
  const [paid, setPaid] = useState<boolean>(true);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // PIX simulation states
  const [selectedPixTx, setSelectedPixTx] = useState<Transaction | null>(null);
  const [copiedPixString, setCopiedPixString] = useState(false);
  const [simulatingPixPayment, setSimulatingPixPayment] = useState(false);

  const startEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setDescription(tx.description);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setCategory(tx.category);
    setSubcategory(tx.subcategory || '');
    setCurrency(tx.currency);
    setDate(tx.date);
    setBankId(tx.bankId || 'manual');
    setPaid(tx.paid !== false);
    setPaymentMethod(tx.paymentMethod || 'pix');
    setCreditCardId(tx.creditCardId || '');
  };

  const cancelEdit = () => {
    setEditingTx(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory(allCategories[0]?.id || CATEGORIES[0].id);
    setSubcategory('');
    setCurrency(baseCurrency);
    setDate(new Date().toISOString().split('T')[0]);
    setBankId('manual');
    setPaid(true);
    setIsInstallment(false);
    setPaymentMethod('pix');
    setCreditCardId('');
  };

  // Helper to add months to a YYYY-MM-DD date string safely
  const getNextMonthDate = (dateString: string, monthsToAdd: number): string => {
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    d.setMonth(d.getMonth() + monthsToAdd);

    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, '0');
    const newDay = String(d.getDate()).padStart(2, '0');
    return `${newYear}-${newMonth}-${newDay}`;
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || !amount || parsedAmount <= 0) return;

    const bId = bankId === 'manual' ? null : bankId;

    if (editingTx) {
      updateTransaction({
        id: editingTx.id,
        description: description.trim(),
        amount: parsedAmount,
        type,
        category,
        subcategory: subcategory || undefined,
        currency,
        date,
        bankId: bId,
        paid,
        paymentMethod,
        creditCardId: paymentMethod === 'credito' ? creditCardId : undefined,
      });
      setEditingTx(null);
    } else {
      if (isInstallment) {
        const count = parseInt(installmentCount, 10);
        if (isNaN(count) || count < 2) return;

        const singleAmount = installmentValueType === 'total'
          ? Math.round((parsedAmount / count) * 100) / 100
          : parsedAmount;

        for (let i = 0; i < count; i++) {
          const installmentDate = getNextMonthDate(date, i);
          addTransaction({
            description: `${description.trim()} (${i + 1}/${count})`,
            amount: singleAmount,
            type,
            category,
            subcategory: subcategory || undefined,
            currency,
            date: installmentDate,
            bankId: bId,
            paid: i === 0 ? paid : false,
            paymentMethod,
            creditCardId: paymentMethod === 'credito' ? creditCardId : undefined,
            installmentsTotal: count,
            installmentNumber: i + 1,
          });
        }
      } else {
        addTransaction({
          description: description.trim(),
          amount: parsedAmount,
          type,
          category,
          subcategory: subcategory || undefined,
          currency,
          date,
          bankId: bId,
          paid,
          paymentMethod,
          creditCardId: paymentMethod === 'credito' ? creditCardId : undefined,
        });
      }
    }

    // Reset Form
    setDescription('');
    setAmount('');
    setSubcategory('');
    setIsInstallment(false);
    setPaid(true);
  };

  // Filter Logic
  const filteredTransactions = state.transactions.filter((tx) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      tx.description.toLowerCase().includes(term) ||
      tx.category.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesType = selectedType === 'All' || tx.type === selectedType;
    
    const isTxPaid = tx.paid !== false;
    const matchesPaymentStatus = 
      selectedPaymentStatus === 'All' ||
      (selectedPaymentStatus === 'paid' && isTxPaid) ||
      (selectedPaymentStatus === 'pending' && !isTxPaid);

    return matchesSearch && matchesCategory && matchesType && matchesPaymentStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="transactions-tab">
      {/* 1. Add Transaction Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
        <h3 className="text-lg font-semibold text-gray-900 font-sans tracking-tight mb-4 flex items-center gap-2">
          {editingTx ? (
            <>
              <Pencil className="w-5 h-5 text-amber-500" />
              <span>Editar Transação</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Nova Transação</span>
            </>
          )}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Salário, Uber"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Moeda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
              >
                {AVAILABLE_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    type === 'income'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  Entrada
                </button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-500">Categoria</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCat(true)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer"
                >
                  + Nova Categoria
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory(''); // reset subcategory on change
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
              >
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Select Block */}
            {(() => {
              const currentCatObj = allCategories.find((c) => c.id === category) as any;
              const hasSubs = currentCatObj && currentCatObj.subcategories && currentCatObj.subcategories.length > 0;
              return (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-500">Subcategoria (Opcional)</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingSub(true)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer"
                    >
                      + Nova Sub
                    </button>
                  </div>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
                  >
                    <option value="">Nenhuma</option>
                    {hasSubs && (currentCatObj.subcategories as any[]).map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Origem/Conta</label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
              >
                <option value="manual">💼 Manual (Carteira)</option>
                {state.banks
                  .filter((b) => b.bankId !== 'manual')
                  .map((b) => (
                    <option key={b.bankId} value={b.bankId}>
                      🏦 {b.name} {!b.connected ? '(Não conectado)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-50 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const method = e.target.value as any;
                  setPaymentMethod(method);
                  if (method === 'credito') {
                    const cards = state.creditCards || [];
                    if (cards.length > 0) {
                      setCreditCardId(cards[0].id);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
              >
                <option value="pix">⚡ Pix</option>
                <option value="dinheiro">💵 Dinheiro</option>
                <option value="credito">💳 Cartão de Crédito</option>
                <option value="debito">💳 Cartão de Débito</option>
                <option value="transferencia">💸 Transferência Bancária</option>
              </select>
            </div>

            {paymentMethod === 'credito' && (
              <div className="p-3.5 bg-slate-50 border border-gray-150 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-700">Escolha o Cartão</label>
                </div>
                
                {(state.creditCards || []).length === 0 ? (
                  <div className="text-xs text-gray-500 space-y-2">
                    <p className="italic">Nenhum cartão cadastrado.</p>
                    {addCreditCard && (
                      <div className="space-y-2 border-t border-gray-100 pt-2">
                        <p className="font-semibold text-gray-600 text-[10px]">Criação Rápida de Cartão:</p>
                        <input
                          type="text"
                          placeholder="Ex: Nubank, Itaú Click"
                          id="quick-card-name"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nameInput = document.getElementById('quick-card-name') as HTMLInputElement;
                            if (nameInput && nameInput.value.trim()) {
                              const newCardName = nameInput.value.trim();
                              addCreditCard({
                                name: newCardName,
                                bankId: bankId,
                                limit: 5000,
                                closingDay: 5,
                                dueDay: 12,
                                currency: currency
                              });
                              nameInput.value = '';
                            }
                          }}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                        >
                          + Criar e Associar Cartão
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
                  >
                    <option value="">-- Selecione o Cartão --</option>
                    {(state.creditCards || []).map((card) => {
                      const bankName = state.banks.find(b => b.bankId === card.bankId)?.name || 'Avulso';
                      return (
                        <option key={card.id} value={card.id}>
                          💳 {card.name} ({bankName})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Opção de Efetivação Manual / Status de Pagamento */}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-700">Lançamento Pago / Efetivado</span>
            </label>

            {!editingTx && (
              <>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-gray-700">Lançamento Parcelado</span>
                </label>

                {isInstallment && (
                  <div className="grid grid-cols-2 gap-4 mt-1 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Parcelas</label>
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(e.target.value)}
                        className="w-full px-2 py-1.5 border border-blue-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-blue-900 font-medium"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                          <option key={n} value={n}>
                            {n}x
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Divisão</label>
                      <select
                        value={installmentValueType}
                        onChange={(e) => setInstallmentValueType(e.target.value as any)}
                        className="w-full px-2 py-1.5 border border-blue-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-blue-900 font-medium"
                      >
                        <option value="total">Valor é o Total</option>
                        <option value="single">Valor por Parcela</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {editingTx ? (
            <div className="flex gap-2 mt-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm shadow-sm transition cursor-pointer"
              >
                Salvar Alterações
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition mt-2 cursor-pointer"
            >
              Adicionar Lançamento
            </button>
          )}
        </form>
      </div>

      {/* 2. Interactive Ledger Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col h-[600px]">
        {/* Filters and Search Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 font-sans tracking-tight">
              Histórico de Lançamentos
            </h3>
            <span className="text-xs text-gray-400 font-sans">
              {filteredTransactions.length} transações encontradas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white transition"
            >
              <option value="All">Todas as Categorias</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white transition"
            >
              <option value="All">Todos os Tipos</option>
              <option value="income">Apenas Receitas</option>
              <option value="expense">Apenas Despesas</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white transition"
            >
              <option value="All">Todos os Status</option>
              <option value="paid">Efetivados / Pagos</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>

        {/* Transactions Table/List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-150 pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-12">
              <Filter className="w-8 h-8 mb-2 stroke-1" />
              <span>Nenhuma transação atende aos critérios de filtragem.</span>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const txSymbol = AVAILABLE_CURRENCIES.find((c) => c.code === tx.currency)?.symbol || '$';
              const isBase = tx.currency === baseCurrency;
              const converted = convertAmount(tx.amount, tx.currency, baseCurrency);

              return (
                <div key={tx.id} className={`py-3.5 flex justify-between items-center px-2 rounded-xl transition group ${
                  editingTx?.id === tx.id
                    ? 'bg-amber-50/40 border border-amber-200/50'
                    : 'hover:bg-gray-50/50 border border-transparent'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full`} style={{
                      backgroundColor: allCategories.find(c => c.id === tx.category)?.color || '#9ca3af'
                    }} />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 leading-tight">
                        {tx.description}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-sans flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {tx.date}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 flex items-center gap-1">
                          <span>{allCategories.find(c => c.id === tx.category)?.emoji || '📦'}</span>
                          <span>{tx.category}</span>
                        </span>
                        {tx.subcategory && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">
                            {tx.subcategory}
                          </span>
                        )}
                        {(() => {
                          const txBankId = tx.bankId || 'manual';
                          const bankObj = state.banks.find((b) => b.bankId === txBankId);
                          const isManual = txBankId === 'manual';
                          return (
                            <>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                isManual ? 'bg-slate-50 text-slate-700 border-slate-200/50' :
                                txBankId === 'nubank' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
                                txBankId === 'itau' ? 'bg-orange-50 text-orange-700 border-orange-200/50' :
                                txBankId === 'bb' ? 'bg-yellow-50 text-yellow-800 border-yellow-200/50' :
                                'bg-rose-50 text-rose-700 border-rose-200/50'
                              }`} title="Conta da transação">
                                <span className="text-[9px]">{isManual ? '💼' : '🏦'}</span>
                                <span>{bankObj ? bankObj.name : 'Carteira'}</span>
                              </span>
                            </>
                          );
                        })()}
                        {(() => {
                          const method = tx.paymentMethod || 'pix';
                          let methodText = 'Pix';
                          let methodColor = 'bg-teal-50 text-teal-700 border-teal-200/50';
                          let methodEmoji = '⚡';
                          
                          if (method === 'dinheiro') {
                            methodText = 'Dinheiro';
                            methodColor = 'bg-amber-50 text-amber-700 border-amber-200/50';
                            methodEmoji = '💵';
                          } else if (method === 'credito') {
                            const cardObj = (state.creditCards || []).find(c => c.id === tx.creditCardId);
                            const paymentDate = getTransactionPaymentDate(tx, state.creditCards || []);
                            const [, monthStr, dayStr] = paymentDate.split('-');
                            methodText = cardObj ? `${cardObj.name} (Vence ${dayStr}/${monthStr})` : `Crédito (Vence ${dayStr}/${monthStr})`;
                            methodColor = 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
                            methodEmoji = '💳';
                          } else if (method === 'debito') {
                            methodText = 'Débito';
                            methodColor = 'bg-blue-50 text-blue-700 border-blue-200/50';
                            methodEmoji = '💳';
                          } else if (method === 'transferencia') {
                            methodText = 'Transf.';
                            methodColor = 'bg-slate-50 text-slate-700 border-slate-200/50';
                            methodEmoji = '💸';
                          }
                          
                          if (method === 'pix') {
                            return (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPixTx(tx);
                                    setCopiedPixString(false);
                                    setSimulatingPixPayment(false);
                                  }}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer select-none ${
                                    tx.paid !== false
                                      ? 'bg-teal-50 text-teal-700 border-teal-200/50 hover:bg-teal-150'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
                                  }`}
                                  title={tx.paid !== false ? "Ver Recibo PIX" : "Pagar ou Cobrar via PIX"}
                                >
                                  <span className="text-[9px]">⚡</span>
                                  <span>{tx.paid !== false ? "Pix Efetivado" : "Pagar via Pix"}</span>
                                </button>
                              </>
                            );
                          }

                          return (
                            <>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${methodColor}`} title="Forma de Pagamento">
                                <span className="text-[9px]">{methodEmoji}</span>
                                <span>{methodText}</span>
                              </span>
                            </>
                          );
                        })()}
                        <span>•</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTransaction({
                              ...tx,
                              paid: !(tx.paid !== false)
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer select-none ${
                            tx.paid !== false
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/30'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/30'
                          }`}
                          title="Clique para alternar status (Pago / Pendente)"
                        >
                          {tx.paid !== false ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Pago</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${
                        tx.type === 'income' ? 'text-green-600' : 'text-gray-950'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'} {txSymbol} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {!isBase && (
                        <p className="text-[10px] text-gray-400 font-mono">
                          ≈ {baseCurrencySymbol} {converted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition duration-150">
                      <button
                        onClick={() => startEdit(tx)}
                        className={`p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition cursor-pointer ${
                          editingTx?.id === tx.id ? 'text-amber-600 bg-amber-50 opacity-100' : ''
                        }`}
                        title="Editar Transação"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Excluir Transação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Create Custom Category */}
      {isAddingCat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
              <h3 className="text-base font-bold text-gray-950 font-sans">Nova Categoria</h3>
              <button
                type="button"
                onClick={() => setIsAddingCat(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newCatLabel.trim()) {
                addCustomCategory(newCatLabel.trim(), newCatColor, newCatEmoji);
                setCategory(newCatLabel.trim()); // automatically select newly created category
                setNewCatLabel('');
                setIsAddingCat(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vestuário, Pets, Viagem"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Emoji Representativo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 👕, 🐱, ✈️"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cor Visual</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-10 h-9 p-0 border border-gray-200 rounded-xl overflow-hidden cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-mono text-gray-400 uppercase">{newCatColor}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Cadastrar Categoria
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Custom Subcategory */}
      {isAddingSub && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-4">
              <h3 className="text-base font-bold text-gray-950 font-sans">Nova Subcategoria</h3>
              <button
                type="button"
                onClick={() => setIsAddingSub(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newSubLabel.trim()) {
                addSubcategory(category, newSubLabel.trim());
                setSubcategory(newSubLabel.trim()); // automatically select newly created subcategory
                setNewSubLabel('');
                setIsAddingSub(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria Pai Associada</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs font-semibold text-gray-600">
                  {allCategories.find(c => c.id === category)?.emoji} {allCategories.find(c => c.id === category)?.label}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Subcategoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ração, Vacinas, Banho (para Pets)"
                  value={newSubLabel}
                  onChange={(e) => setNewSubLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Cadastrar Subcategoria
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. PIX Transaction Simulator Modal */}
      {selectedPixTx && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5 animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                  <span className="text-sm font-black">⚡</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-sans tracking-tight">Simulador de Transação PIX</h3>
                  <p className="text-[10px] text-slate-400">Finança Ativa Open Finance Gateway</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPixTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {simulatingPixPayment ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-400">PIX</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">Autorizando com o Banco...</h4>
                  <p className="text-xs text-slate-400">Validando autenticação biométrica e saldo disponível...</p>
                </div>
              </div>
            ) : selectedPixTx.paid !== false ? (
              /* RECEIPT MODE (Pago) */
              <div className="space-y-4">
                <div className="text-center py-2 space-y-2">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Transação Liquidada
                    </span>
                    <h4 className="text-lg font-black mt-2 font-mono">
                      {AVAILABLE_CURRENCIES.find(c => c.code === selectedPixTx.currency)?.symbol || '$'} {selectedPixTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Descrição:</span>
                    <strong className="text-slate-200">{selectedPixTx.description}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Categoria:</span>
                    <span className="text-slate-200 font-bold">{selectedPixTx.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Data de Liquidação:</span>
                    <span className="text-slate-300 font-mono">{selectedPixTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID de Autenticação:</span>
                    <span className="text-slate-300 font-mono text-[10px] uppercase">E{Math.random().toString().substring(2, 11)}PX</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPixTx(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Fechar Comprovante
                </button>
              </div>
            ) : (
              /* PAYMENT / COBRANÇA PENDING MODE */
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-xs text-slate-400">Valor do Lançamento:</p>
                  <h4 className="text-2xl font-black font-mono text-white">
                    {AVAILABLE_CURRENCIES.find(c => c.code === selectedPixTx.currency)?.symbol || '$'} {selectedPixTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h4>
                  <p className="text-xs text-slate-300 font-semibold">{selectedPixTx.description}</p>
                </div>

                {/* QR Code Pure CSS Simulation */}
                <div className="w-40 h-40 bg-white p-3 rounded-2xl mx-auto border border-slate-800 shadow-inner flex flex-col justify-between relative overflow-hidden">
                  <div className="grid grid-cols-12 gap-0.5 w-full h-full">
                    {Array.from({ length: 144 }).map((_, idx) => {
                      // Corner locator squares math
                      const r = Math.floor(idx / 12);
                      const c = idx % 12;
                      const isTopLeft = r < 4 && c < 4;
                      const isTopRight = r < 4 && c >= 8;
                      const isBottomLeft = r >= 8 && c < 4;
                      
                      let isBlack = Math.random() > 0.5;
                      
                      if (isTopLeft) {
                        isBlack = r === 0 || r === 3 || c === 0 || c === 3 || (r === 1 && c === 1) || (r === 2 && c === 2);
                      } else if (isTopRight) {
                        isBlack = r === 0 || r === 3 || c === 8 || c === 11 || (r === 1 && c === 10) || (r === 2 && c === 9);
                      } else if (isBottomLeft) {
                        isBlack = r === 8 || r === 11 || c === 0 || c === 3 || (r === 9 && c === 1) || (r === 10 && c === 2);
                      }

                      return (
                        <div
                          key={idx}
                          className={`w-full h-full transition-all duration-300 ${
                            isBlack ? 'bg-slate-900' : 'bg-slate-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                  {/* Subtle scan bar on top */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-scanner-scan" />
                </div>

                {/* Copia e Cola Area */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">PIX Copia e Cola</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`00020101021126580014br.gov.bcb.pix0114+55119999999995204000053039865405${selectedPixTx.amount.toFixed(2)}5802BR5913Financa Ativa6009Sao Paulo62070503***630472FA`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-300 font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`00020101021126580014br.gov.bcb.pix0114+55119999999995204000053039865405${selectedPixTx.amount.toFixed(2)}5802BR5913Financa Ativa6009Sao Paulo62070503***630472FA`);
                        setCopiedPixString(true);
                        setTimeout(() => setCopiedPixString(false), 2000);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      {copiedPixString ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Simulation Action Trigger */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatingPixPayment(true);
                      setTimeout(() => {
                        setSimulatingPixPayment(false);
                        updateTransaction({
                          ...selectedPixTx,
                          paid: true
                        });
                        setSelectedPixTx({
                          ...selectedPixTx,
                          paid: true
                        });
                      }, 1200);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Simular Liquidação de Pagamento
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2.5 font-sans">
                    Sinaliza instantaneamente o pagamento efetivado na Finança Ativa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
