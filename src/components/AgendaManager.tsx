import React, { useState, useMemo } from 'react';
import { AppState, Transaction, AVAILABLE_CURRENCIES, CATEGORIES, CreditCard } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Check, 
  Clock, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  X,
  AlertCircle
} from 'lucide-react';

interface AgendaManagerProps {
  state: AppState;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (tx: Transaction) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
}

export default function AgendaManager({
  state,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  convertAmount
}: AgendaManagerProps) {
  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  const allCategories = useMemo(() => {
    return [
      ...CATEGORIES,
      ...(state.customCategories || [])
    ];
  }, [state.customCategories]);

  // Calendar Year & Month State
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed (0 = Jan, 11 = Dec)
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(today.toISOString().split('T')[0]);

  // Form State for quick add in selected day
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(allCategories[0]?.id || CATEGORIES[0].id);
  const [currency, setCurrency] = useState(baseCurrency);
  const [paid, setPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'credito' | 'debito' | 'transferencia'>('pix');
  const [creditCardId, setCreditCardId] = useState('');
  const [bankId, setBankId] = useState('manual');

  // Month names
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Days in current month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Day of the week of the first day (0 = Sunday, ..., 6 = Saturday)
  const firstDayIndex = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Get date string (YYYY-MM-DD) for a specific day
  const getDateStringForDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${currentYear}-${formattedMonth}-${formattedDay}`;
  };

  // Map transactions of the current month
  const monthTransactions = useMemo(() => {
    const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    
    return state.transactions.filter(tx => tx.date >= startStr && tx.date <= endStr);
  }, [state.transactions, currentYear, currentMonth, daysInMonth]);

  // Group transactions by day
  const transactionsByDay = useMemo(() => {
    const groups: { [day: number]: Transaction[] } = {};
    for (let d = 1; d <= daysInMonth; d++) {
      groups[d] = [];
    }
    
    monthTransactions.forEach(tx => {
      const dayParts = tx.date.split('-');
      const txDay = parseInt(dayParts[2], 10);
      if (groups[txDay]) {
        groups[txDay].push(tx);
      }
    });
    
    return groups;
  }, [monthTransactions, daysInMonth]);

  // Calculate monthly summary for the displayed month
  const monthlyTotals = useMemo(() => {
    let incomePaid = 0;
    let incomePending = 0;
    let expensePaid = 0;
    let expensePending = 0;

    monthTransactions.forEach(tx => {
      const amountInBase = convertAmount(tx.amount, tx.currency, baseCurrency);
      const isPaid = tx.paid !== false;
      if (tx.type === 'income') {
        if (isPaid) incomePaid += amountInBase;
        else incomePending += amountInBase;
      } else {
        if (isPaid) expensePaid += amountInBase;
        else expensePending += amountInBase;
      }
    });

    return {
      incomePaid,
      incomePending,
      expensePaid,
      expensePending,
      totalIncome: incomePaid + incomePending,
      totalExpense: expensePaid + expensePending
    };
  }, [monthTransactions, convertAmount, baseCurrency]);

  // Selected date transactions
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDateStr) return [];
    return state.transactions.filter(tx => tx.date === selectedDateStr);
  }, [state.transactions, selectedDateStr]);

  // Selected day totals
  const selectedDayTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let pendingExpense = 0;

    selectedDayTransactions.forEach(tx => {
      const amountInBase = convertAmount(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        income += amountInBase;
      } else {
        expense += amountInBase;
        if (tx.paid === false) {
          pendingExpense += amountInBase;
        }
      }
    });

    return { income, expense, pendingExpense };
  }, [selectedDayTransactions, convertAmount, baseCurrency]);

  // Submit Quick Add Form
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !selectedDateStr) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addTransaction({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      currency,
      date: selectedDateStr,
      bankId: bankId,
      paid,
      paymentMethod,
      creditCardId: paymentMethod === 'credito' ? creditCardId : undefined,
    });

    // Reset simple form fields
    setDescription('');
    setAmount('');
  };

  // Helper: Format values
  const formatValue = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: baseCurrency });
  };

  // Generate blank cells for days before the first day of the month
  const calendarCells = useMemo(() => {
    const cells = [];
    
    // Previous month filler days
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ isFiller: true, key: `filler-${i}` });
    }
    
    // Current month active days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getDateStringForDay(day);
      const dayTxs = transactionsByDay[day] || [];
      
      let dayIncome = 0;
      let dayExpense = 0;
      let hasPending = false;

      dayTxs.forEach(tx => {
        const valInBase = convertAmount(tx.amount, tx.currency, baseCurrency);
        if (tx.type === 'income') {
          dayIncome += valInBase;
        } else {
          dayExpense += valInBase;
        }
        if (tx.paid === false) {
          hasPending = true;
        }
      });

      cells.push({
        isFiller: false,
        day,
        dateStr,
        transactions: dayTxs,
        dayIncome,
        dayExpense,
        hasPending,
        key: `day-${day}`
      });
    }

    return cells;
  }, [firstDayIndex, daysInMonth, transactionsByDay, convertAmount, baseCurrency, currentMonth, currentYear]);

  return (
    <div className="space-y-6" id="agenda-tab">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span>Agenda & Calendário de Lançamentos</span>
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Visualize entradas e saídas distribuídas pelos dias do mês, acompanhe despesas pendentes e planeje seu orçamento diário.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 bg-white hover:bg-slate-50 text-gray-700 rounded-lg border border-slate-200 transition shadow-xs cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-gray-800 font-mono px-3 select-none min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 bg-white hover:bg-slate-50 text-gray-700 rounded-lg border border-slate-200 transition shadow-xs cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Monthly Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Receitas do Mês</p>
          <p className="text-base font-bold text-green-600 mt-1">{formatValue(monthlyTotals.totalIncome)}</p>
          <p className="text-[9px] text-gray-400 font-medium mt-1">
            Pagas: {formatValue(monthlyTotals.incomePaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Despesas do Mês</p>
          <p className="text-base font-bold text-rose-600 mt-1">{formatValue(monthlyTotals.totalExpense)}</p>
          <p className="text-[9px] text-gray-400 font-medium mt-1">
            Efetivadas: {formatValue(monthlyTotals.expensePaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs bg-amber-50/20 border-amber-100">
          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Despesas Pendentes</span>
          </p>
          <p className="text-base font-bold text-amber-600 mt-1">{formatValue(monthlyTotals.expensePending)}</p>
          <p className="text-[9px] text-amber-500 font-medium mt-1">
            Aguardando pagamento neste mês
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Resultado Projetado</p>
          <p className={`text-base font-bold mt-1 ${
            monthlyTotals.totalIncome - monthlyTotals.totalExpense >= 0 ? 'text-indigo-600' : 'text-rose-600'
          }`}>
            {formatValue(monthlyTotals.totalIncome - monthlyTotals.totalExpense)}
          </p>
          <p className="text-[9px] text-gray-400 font-medium mt-1">
            Considerando todos os lançamentos
          </p>
        </div>
      </div>

      {/* Main Layout: Calendar Grid & Daily Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
          
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell) => {
              if (cell.isFiller) {
                return (
                  <div 
                    key={cell.key} 
                    className="aspect-square bg-slate-50/40 rounded-xl border border-transparent select-none opacity-40" 
                  />
                );
              }

              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = cell.dateStr === today.toISOString().split('T')[0];
              const hasIncomes = cell.dayIncome > 0;
              const hasExpenses = cell.dayExpense > 0;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateStr || null)}
                  className={`aspect-square p-1.5 rounded-xl border flex flex-col justify-between text-left transition duration-150 relative cursor-pointer group ${
                    isSelected 
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-100' 
                      : isToday 
                        ? 'bg-blue-50/30 border-blue-400 hover:bg-slate-50' 
                        : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Top: Day number and today indicator */}
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold font-mono ${
                      isSelected ? 'text-indigo-600 font-extrabold' : isToday ? 'text-blue-600 font-extrabold' : 'text-gray-700'
                    }`}>
                      {cell.day}
                    </span>
                    
                    {/* Pending Expense Warning Badge */}
                    {cell.hasPending && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Há despesas pendentes neste dia" />
                    )}
                  </div>

                  {/* Bottom: Daily Mini Indicator values */}
                  <div className="space-y-0.5 w-full mt-auto text-[8px] sm:text-[9px] font-mono leading-none">
                    {hasIncomes && (
                      <div className="text-green-600 font-bold truncate">
                        +{cell.dayIncome.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </div>
                    )}
                    {hasExpenses && (
                      <div className={`font-bold truncate ${cell.hasPending ? 'text-amber-600' : 'text-rose-500'}`}>
                        -{cell.dayExpense.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Day Ledger & Quick Addition Form */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Section: Day Ledger details */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex flex-col max-h-[420px]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4 shrink-0">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">
                  Lançamentos do Dia
                </h3>
                <p className="text-sm font-bold text-indigo-950 font-mono mt-0.5">
                  {selectedDateStr ? new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Selecione um dia'}
                </p>
              </div>

              {/* Selected Day Mini-Summary */}
              {selectedDateStr && (selectedDayTotals.income > 0 || selectedDayTotals.expense > 0) && (
                <div className="text-right text-[10px] font-mono leading-tight space-y-0.5">
                  {selectedDayTotals.income > 0 && <p className="text-green-600 font-bold">+{formatValue(selectedDayTotals.income)}</p>}
                  {selectedDayTotals.expense > 0 && <p className="text-rose-600 font-bold">-{formatValue(selectedDayTotals.expense)}</p>}
                  {selectedDayTotals.pendingExpense > 0 && <p className="text-amber-600 font-semibold">(pendentes: {formatValue(selectedDayTotals.pendingExpense)})</p>}
                </div>
              )}
            </div>

            {/* List scroll container */}
            <div className="flex-1 overflow-y-auto space-y-3 divide-y divide-gray-50 pr-1">
              {selectedDayTransactions.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2 h-full">
                  <CalendarIcon className="w-8 h-8 text-slate-300 stroke-1" />
                  <p>Nenhum lançamento cadastrado para este dia.</p>
                  <p className="text-[10px] text-gray-400">Use o formulário abaixo para adicionar uma entrada ou saída.</p>
                </div>
              ) : (
                selectedDayTransactions.map((tx, idx) => {
                  const txSymbol = AVAILABLE_CURRENCIES.find((c) => c.code === tx.currency)?.symbol || '$';
                  const cat = allCategories.find(c => c.id === tx.category);

                  return (
                    <div key={tx.id} className={`pt-3 flex justify-between items-start gap-3 text-xs ${idx === 0 ? 'pt-0' : ''}`}>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#9ca3af' }} />
                          <strong className="text-gray-900 truncate font-medium">{tx.description}</strong>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 flex-wrap">
                          <span className="px-1 py-0.5 bg-gray-50 rounded text-gray-500 font-semibold">{cat?.emoji} {tx.category}</span>
                          <span>•</span>
                          
                          {/* Payment status clickable pill */}
                          <button
                            type="button"
                            onClick={() => {
                              updateTransaction({
                                ...tx,
                                paid: !(tx.paid !== false)
                              });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer ${
                              tx.paid !== false 
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100 animate-pulse'
                            }`}
                            title="Alternar Pago / Pendente"
                          >
                            {tx.paid !== false ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            <span>{tx.paid !== false ? 'Pago' : 'Pendente'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Right: Value & Actions */}
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-bold font-mono ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                            {tx.type === 'income' ? '+' : '-'} {txSymbol} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Quick Add Form for selected date */}
          {selectedDateStr && (
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans border-b border-gray-100 pb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Rápido Lançamento no Dia</span>
              </h3>

              <form onSubmit={handleQuickAdd} className="space-y-3">
                
                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Padaria, Almoço, Pix Recebido"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                {/* Amount and Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Tipo</label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          type === 'expense'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Saída
                      </button>
                      <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          type === 'income'
                            ? 'bg-green-500 text-white shadow-xs'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Entrada
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Situação</label>
                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPaid(true)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          paid
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Paga
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaid(false)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          !paid
                            ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title="Marcar como despesa ou receita futura pendente"
                      >
                        Pendente
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer mt-2 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lançar na Agenda</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
