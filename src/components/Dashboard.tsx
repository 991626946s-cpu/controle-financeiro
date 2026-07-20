import React, { useState } from 'react';
import { AppState, AVAILABLE_CURRENCIES, CATEGORIES, Transaction, getTransactionPaymentDate } from '../types';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, FileText, FileSpreadsheet, Sparkles, Landmark, Check, Clock, Trash2, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardProps {
  state: AppState;
  convertAmount: (amount: number, from: string, to: string) => number;
  onNavigate: (tab: string) => void;
  exportToCSV: () => void;
  updateTransaction?: (tx: Transaction) => void;
  deleteTransaction?: (id: string) => void;
}

export default function Dashboard({ state, convertAmount, onNavigate, exportToCSV, updateTransaction, deleteTransaction }: DashboardProps) {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // Calculate totals in Base Currency (Paid vs Pending)
  let totalIncome = 0;
  let totalExpense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;

  const todayStr = new Date().toISOString().split('T')[0];

  state.transactions.forEach((tx) => {
    const valueInBase = convertAmount(tx.amount, tx.currency, baseCurrency);
    
    // Se for cartão de crédito, o pagamento ocorre no vencimento/fechamento
    const isCreditCard = tx.paymentMethod === 'credito' && tx.creditCardId;
    const paymentDate = isCreditCard 
      ? getTransactionPaymentDate(tx, state.creditCards || [])
      : tx.date;

    // Considera pago/debitado se tx.paid !== false
    // E, se for cartão de crédito, se a data do pagamento já passou ou é hoje.
    // Do contrário, o débito do saldo real ainda é pendente.
    const isPaid = tx.paid !== false && (!isCreditCard || paymentDate <= todayStr);

    if (isPaid) {
      if (tx.type === 'income') {
        totalIncome += valueInBase;
      } else {
        totalExpense += valueInBase;
      }
    } else {
      if (tx.type === 'income') {
        pendingIncome += valueInBase;
      } else {
        pendingExpense += valueInBase;
      }
    }
  });

  const currentBalance = totalIncome - totalExpense;
  const projectedBalance = (totalIncome + pendingIncome) - (totalExpense + pendingExpense);

  const pendingTransactions = state.transactions
    .filter((tx) => tx.paid === false)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Pre-calculate bank metrics for dashboard cards
  const bankForecasts = state.banks.map((bank) => {
    const isManual = bank.bankId === 'manual';
    
    // Filter transactions for this bank
    const txs = state.transactions.filter((t) => {
      const tBankId = t.bankId || 'manual';
      return tBankId === bank.bankId;
    });

    let pIncome = 0;
    let pExpense = 0;
    let nextUpcomingTx: typeof state.transactions[0] | null = null;

    txs.forEach((t) => {
      if (t.paid === false) {
        const val = convertAmount(t.amount, t.currency, baseCurrency);
        if (t.type === 'income') {
          pIncome += val;
        } else {
          pExpense += val;
        }
        
        if (!nextUpcomingTx) {
          nextUpcomingTx = t;
        } else if (t.date < nextUpcomingTx.date) {
          nextUpcomingTx = t;
        }
      }
    });

    return {
      ...bank,
      pendingIncome: pIncome,
      pendingExpense: pExpense,
      projectedBalance: bank.balance + pIncome - pExpense,
      nextUpcomingTx,
    };
  });

  // Pie Chart: Expenses by Category in Base Currency
  const expenseByCategory: { [cat: string]: number } = {};
  state.transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const val = convertAmount(tx.amount, tx.currency, baseCurrency);
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + val;
    });

  const pieData = Object.entries(expenseByCategory).map(([category, amount]) => {
    const catConfig = CATEGORIES.find((c) => c.id === category) || { color: '#9ca3af' };
    return {
      name: category,
      value: Math.round(amount * 100) / 100,
      color: catConfig.color,
    };
  });

  // Bar Chart: Daily or Monthly Trend (Group transactions by date)
  const last7DaysData: { [date: string]: { income: number; expense: number } } = {};
  
  // Let's sort transaction to get recent days
  const sortedTxs = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  
  sortedTxs.forEach((tx) => {
    const isCreditCard = tx.paymentMethod === 'credito' && tx.creditCardId;
    const paymentDate = isCreditCard 
      ? getTransactionPaymentDate(tx, state.creditCards || [])
      : tx.date;
    const dateStr = paymentDate.substring(5); // MM-DD format (baseado na data de pagamento/vencimento)
    const amountInBase = convertAmount(tx.amount, tx.currency, baseCurrency);
    if (!last7DaysData[dateStr]) {
      last7DaysData[dateStr] = { income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      last7DaysData[dateStr].income += amountInBase;
    } else {
      last7DaysData[dateStr].expense += amountInBase;
    }
  });

  const barData = Object.entries(last7DaysData)
    .slice(-7) // take last 7 active days
    .map(([date, data]) => ({
      date,
      Receita: Math.round(data.income * 100) / 100,
      Despesa: Math.round(data.expense * 100) / 100,
    }));

  const formatCurrency = (val: number) => {
    return `${baseCurrencySymbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Upper Panel / Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 font-sans tracking-tight">
            Olá, {state.preferences.userName}! 👋
          </h2>
          <p className="text-sm text-gray-500 font-sans">
            Sua conta está sincronizada no código <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{state.syncCode}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            id="btn-export-csv"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            id="btn-export-pdf"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-md relative overflow-hidden" id="card-balance">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-slate-300 font-sans">Saldo Consolidado</span>
            <div className="p-1.5 bg-slate-800/80 rounded-lg border border-slate-700/50">
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans tracking-tight mb-1">
            {formatCurrency(currentBalance)}
          </div>
          {(pendingIncome !== 0 || pendingExpense !== 0) ? (
            <p className="text-xs text-blue-300 font-sans mb-1.5 font-medium">
              Projetado (com pendentes): {formatCurrency(projectedBalance)}
            </p>
          ) : (
            <div className="h-1.5" />
          )}
          <p className="text-xs text-slate-400 font-sans flex items-center gap-1">
            <span>Moeda padrão: </span>
            <span className="font-semibold text-white">{baseCurrency}</span>
          </p>
        </div>

        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden" id="card-income">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-500 font-sans">Receitas Efetivadas</span>
            <div className="p-1.5 bg-green-50 rounded-lg border border-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans tracking-tight text-gray-900 mb-1">
            {formatCurrency(totalIncome)}
          </div>
          {pendingIncome > 0 ? (
            <p className="text-xs text-amber-600 font-sans mb-1.5 font-medium">
              Pendente: {formatCurrency(pendingIncome)}
            </p>
          ) : (
            <div className="h-1.5" />
          )}
          <p className="text-xs text-green-600 font-sans flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" />
            <span>Entradas pagas registradas</span>
          </p>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden" id="card-expense">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-500 font-sans">Despesas Efetivadas</span>
            <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-100">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans tracking-tight text-gray-900 mb-1">
            {formatCurrency(totalExpense)}
          </div>
          {pendingExpense > 0 ? (
            <p className="text-xs text-amber-600 font-sans mb-1.5 font-medium">
              Pendente: {formatCurrency(pendingExpense)}
            </p>
          ) : (
            <div className="h-1.5" />
          )}
          <p className="text-xs text-rose-600 font-sans flex items-center gap-1">
            <ArrowDownRight className="w-4 h-4" />
            <span>Saídas pagas registradas</span>
          </p>
        </div>
      </div>

      {/* Saldos & Previsões por Conta */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div>
            <h3 className="text-md font-semibold text-gray-900 font-sans tracking-tight flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-600" />
              <span>Saldos de Contas & Previsões</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Acompanhamento de fluxo de caixa projetado e saldo real de cada conta ou carteira de gastos.
            </p>
          </div>
          <button
            onClick={() => onNavigate('bank')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            Gerenciar Contas &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {bankForecasts.map((bf) => {
            const isManual = bf.bankId === 'manual';
            const showDetails = isManual || bf.connected;
            const cardBg = isManual ? 'bg-slate-50/50 border-slate-200' : 
                           bf.bankId === 'nubank' ? 'bg-purple-50/10 border-purple-200/40' : 
                           bf.bankId === 'itau' ? 'bg-orange-50/10 border-orange-200/40' : 
                           bf.bankId === 'bb' ? 'bg-yellow-50/10 border-yellow-200/40' : 'bg-rose-50/10 border-rose-200/40';

            return (
              <div 
                key={bf.bankId} 
                className={`p-4 rounded-xl border flex flex-col justify-between transition hover:shadow-xs ${cardBg} ${
                  showDetails ? '' : 'opacity-65'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5">
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="text-base">
                        {isManual ? '💼' : 
                         bf.bankId === 'nubank' ? '🟣' : 
                         bf.bankId === 'itau' ? '🟠' : 
                         bf.bankId === 'bb' ? '🟡' : '🔴'}
                      </span>
                      <span className="truncate">{bf.name}</span>
                    </span>
                    {!showDetails && (
                      <span className="text-[9px] bg-gray-100 text-gray-400 font-semibold px-1.5 py-0.5 rounded uppercase">
                        Offline
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase font-medium tracking-wider block">Saldo Real</span>
                      <span className="text-sm font-bold font-mono text-gray-900">
                        {showDetails ? formatCurrency(bf.balance) : '— —'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-blue-500 uppercase font-semibold tracking-wider block">Projetado</span>
                      <span className={`text-sm font-bold font-mono ${showDetails ? 'text-blue-800' : 'text-gray-400'}`}>
                        {showDetails ? formatCurrency(bf.projectedBalance) : '— —'}
                      </span>
                    </div>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-3.5 pt-2.5 border-t border-gray-150/50 text-[10px]">
                    {bf.nextUpcomingTx ? (
                      <div className="text-gray-600 font-sans">
                        <span className="text-gray-400 block font-medium">Próxima previsão:</span>
                        <div className="flex justify-between items-center font-medium mt-0.5">
                          <span className="truncate max-w-[70px] text-gray-700">{bf.nextUpcomingTx.description}</span>
                          <span className={bf.nextUpcomingTx.type === 'income' ? 'text-green-600 font-semibold' : 'text-rose-600 font-semibold'}>
                            {bf.nextUpcomingTx.type === 'income' ? '+' : '-'} {formatCurrency(convertAmount(bf.nextUpcomingTx.amount, bf.nextUpcomingTx.currency, baseCurrency))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium block italic">Estável (Sem pendências)</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics / Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-900 font-sans">Evolução Diária de Transações</h3>
            <span className="text-xs text-gray-400 font-sans">Últimos 7 dias ativos</span>
          </div>
          <div className="h-72 w-full">
            {barData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-sm">Nenhuma transação registrada para exibir no gráfico de tendência.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-semibold text-gray-900 font-sans">Distribuição de Despesas</h3>
            <span className="text-xs text-gray-400 font-sans">Por categoria</span>
          </div>
          <div className="h-72 w-full flex flex-col sm:flex-row items-center gap-4">
            {pieData.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-sm">Nenhuma despesa para exibir na distribuição.</span>
              </div>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                        formatter={(value) => [`${baseCurrencySymbol} ${value}`, 'Total']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700 font-medium">
                          {CATEGORIES.find(c => c.id === item.name)?.emoji || '📦'} {item.name}
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold font-mono">
                        {baseCurrencySymbol} {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Quick Actions & AI Advisor Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-sm">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-900 font-sans">Precisa de conselhos financeiros?</h4>
            <p className="text-sm text-gray-600 font-sans">
              Nossa Inteligência Artificial integrada ao Gemini analisa sua saúde financeira em tempo real.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('insights')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          <span>Gerar Análise IA</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Grid: Pending Transactions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Transactions Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
            <h3 className="text-md font-semibold text-gray-900 font-sans flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span>Lançamentos Pendentes</span>
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50" title="A Receber">
                Rec.: {formatCurrency(pendingIncome)}
              </span>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100/50" title="A Pagar">
                Desp.: {formatCurrency(pendingExpense)}
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto pr-1 flex-1">
            {pendingTransactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm font-sans flex flex-col items-center justify-center space-y-2 h-full">
                <span className="text-2xl">🎉</span>
                <p className="font-semibold text-emerald-600">Nenhum lançamento pendente!</p>
                <p className="text-xs text-gray-400">Suas contas a pagar e receber estão 100% liquidadas.</p>
              </div>
            ) : (
              pendingTransactions
                .slice(0, 5)
                .map((tx) => {
                  const symbol = AVAILABLE_CURRENCIES.find((c) => c.code === tx.currency)?.symbol || '$';
                  const isIncome = tx.type === 'income';
                  return (
                    <div key={tx.id} className="py-3 flex justify-between items-center gap-2 hover:bg-slate-50/40 px-1 rounded-xl transition">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (updateTransaction) {
                              updateTransaction({
                                ...tx,
                                paid: true
                              });
                            }
                          }}
                          className={`p-2 rounded-xl shrink-0 border hover:scale-105 active:scale-95 transition cursor-pointer ${
                            isIncome 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50 hover:bg-emerald-100' 
                              : 'bg-rose-50/70 text-rose-700 border-rose-100/50 hover:bg-rose-100'
                          }`}
                          title={isIncome ? "Clique para marcar como Recebido" : "Clique para marcar como Pago"}
                        >
                          {isIncome ? <TrendingUp className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4 animate-pulse" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{tx.description}</p>
                          <p className="text-xs text-gray-500 font-sans flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-gray-600">{tx.date}</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] border border-gray-100/60">
                              {CATEGORIES.find(c => c.id === tx.category)?.emoji || '📦'} {tx.category}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (updateTransaction) {
                                  updateTransaction({
                                    ...tx,
                                    paid: true
                                  });
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer hover:opacity-80 ${
                                isIncome 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100/30' 
                                  : 'bg-rose-50 text-rose-600 border-rose-100/30'
                              }`}
                              title={isIncome ? "Clique para Marcar como Recebido" : "Clique para Marcar como Pago"}
                            >
                              {isIncome ? 'Receita (Pendente)' : 'Despesa (Pendente)'}
                            </button>
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`text-sm font-bold font-mono ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'} {symbol} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {tx.currency !== baseCurrency && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              ≈ {baseCurrencySymbol} {convertAmount(tx.amount, tx.currency, baseCurrency).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {updateTransaction && (
                            <button
                              onClick={() => {
                                updateTransaction({
                                  ...tx,
                                  paid: true
                                });
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200/50 transition cursor-pointer"
                              title={isIncome ? "Confirmar Recebimento" : "Confirmar Pagamento"}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {deleteTransaction && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Confirmar Exclusão',
                                  message: `Deseja realmente excluir "${tx.description}"? Esta ação não pode ser desfeita.`,
                                  onConfirm: () => {
                                    deleteTransaction(tx.id);
                                    setConfirmModal(null);
                                  }
                                });
                              }}
                              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer"
                              title="Excluir Lançamento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Short list of recent transactions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
            <h3 className="text-md font-semibold text-gray-900 font-sans">Lançamentos Recentes</h3>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              Ver Todas &rarr;
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1 flex-1">
            {state.transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm font-sans flex flex-col items-center justify-center space-y-2 h-full">
                <span>📁</span>
                <p>Nenhuma transação cadastrada ainda.</p>
              </div>
            ) : (
              state.transactions.slice(0, 5).map((tx) => {
                const symbol = AVAILABLE_CURRENCIES.find((c) => c.code === tx.currency)?.symbol || '$';
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="py-3 flex justify-between items-center hover:bg-slate-50/40 px-1 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (updateTransaction) {
                            updateTransaction({
                              ...tx,
                              paid: !(tx.paid !== false)
                            });
                          }
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold hover:scale-105 active:scale-95 transition cursor-pointer border ${
                          isIncome 
                            ? 'bg-green-50 text-green-700 border-green-100/50 hover:bg-green-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100/50 hover:bg-rose-100'
                        }`}
                        title="Clique para alternar Recebido / Pago / Pendente"
                      >
                        {isIncome ? 'Receita' : 'Despesa'}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500 font-sans flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-gray-600">{tx.date}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] border border-gray-100/60 flex items-center gap-0.5">
                            <span>{CATEGORIES.find(c => c.id === tx.category)?.emoji || '📦'}</span>
                            <span>{tx.category}</span>
                          </span>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (updateTransaction) {
                                  updateTransaction({
                                    ...tx,
                                    paid: !(tx.paid !== false)
                                  });
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer hover:opacity-85 ${
                              tx.paid !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                                : 'bg-amber-50 text-amber-700 border-amber-100/50'
                            }`}
                            title="Clique para alternar o status"
                          >
                            {tx.paid !== false ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
                          </button>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-bold font-mono ${
                          isIncome ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {isIncome ? '+' : '-'} {symbol} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {tx.currency !== baseCurrency && (
                          <p className="text-[10px] text-gray-400 font-mono">
                            ≈ {baseCurrencySymbol} {convertAmount(tx.amount, tx.currency, baseCurrency).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>

                      {deleteTransaction && (
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Confirmar Exclusão',
                              message: `Deseja realmente excluir "${tx.description}"? Esta ação não pode ser desfeita.`,
                              onConfirm: () => {
                                deleteTransaction(tx.id);
                                setConfirmModal(null);
                              }
                            });
                          }}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer shrink-0 ml-1"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Elegant Custom Modal Confirm */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-sm w-full shadow-lg space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
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
