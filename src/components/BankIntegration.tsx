import React, { useState } from 'react';
import { AppState, AVAILABLE_CURRENCIES, CATEGORIES, Transaction } from '../types';
import { 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Pencil, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  DollarSign, 
  Layers,
  Plus
} from 'lucide-react';

interface BankIntegrationProps {
  state: AppState;
  connectBank: (bankId: 'nubank' | 'itau' | 'bb' | 'bradesco', balance: number, mockFeeds: Omit<Transaction, 'id' | 'bankId'>[]) => void;
  disconnectBank: (bankId: 'nubank' | 'itau' | 'bb' | 'bradesco') => void;
  updateBankBalance: (bankId: string, balance: number) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
  addCustomBank: (name: string, balance: number, currency: string) => void;
}

export default function BankIntegration({ 
  state, 
  connectBank, 
  disconnectBank, 
  updateBankBalance,
  convertAmount,
  addCustomBank
}: BankIntegrationProps) {
  const [connectingId, setConnectingId] = useState<'nubank' | 'itau' | 'bb' | 'bradesco' | null>(null);
  
  // Simulated form credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<'form' | 'success'>('form');

  // Custom bank/account state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customBankName, setCustomBankName] = useState('');
  const [customBankBalance, setCustomBankBalance] = useState('');
  const [customBankCurrency, setCustomBankCurrency] = useState('BRL');

  // Inline Balance Adjustment
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState('');

  const handleCreateCustomBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBankName.trim()) return;
    const initialBal = parseFloat(customBankBalance) || 0;
    addCustomBank(customBankName.trim(), initialBal, customBankCurrency);
    setCustomBankName('');
    setCustomBankBalance('');
    setCustomBankCurrency('BRL');
    setIsAddingCustom(false);
  };

  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // Launch Simulated Flow
  const handleStartConnection = (bankId: 'nubank' | 'itau' | 'bb' | 'bradesco') => {
    setConnectingId(bankId);
    setUsername('');
    setPassword('');
    setAuthStep('form');
    setIsAuthenticating(false);
  };

  // Close Simulated Flow
  const handleCancel = () => {
    setConnectingId(null);
  };

  // Execute Simulated Connection
  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsAuthenticating(true);

    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthStep('success');

      // Setup dynamic bank-specific mock values
      let balance = 1500;
      let feed: Omit<Transaction, 'id' | 'bankId'>[] = [];

      const todayStr = new Date().toISOString().split('T')[0];

      if (connectingId === 'nubank') {
        balance = 2450.80;
        feed = [
          { description: 'Pix Recebido - João Silva', amount: 450.00, type: 'income', category: 'Outros', date: todayStr, currency: 'BRL' },
          { description: 'Ifood Delivery Hamburguer', amount: 78.50, type: 'expense', category: 'Alimentação', date: todayStr, currency: 'BRL' },
          { description: 'Spotify Premium Música', amount: 21.90, type: 'expense', category: 'Lazer', date: todayStr, currency: 'BRL' },
          { description: 'Posto Ipiranga Combustível', amount: 150.00, type: 'expense', category: 'Transporte', date: todayStr, currency: 'BRL' },
        ];
      } else if (connectingId === 'itau') {
        balance = 7800.50;
        feed = [
          { description: 'Salário Corporativo Ltda', amount: 7200.00, type: 'income', category: 'Salário', date: todayStr, currency: 'BRL' },
          { description: 'Condomínio Edifício Residencial', amount: 680.00, type: 'expense', category: 'Moradia', date: todayStr, currency: 'BRL' },
          { description: 'Copasa Saneamento Água', amount: 95.00, type: 'expense', category: 'Moradia', date: todayStr, currency: 'BRL' },
        ];
      } else if (connectingId === 'bb') {
        balance = 3400.00;
        feed = [
          { description: 'Restaurante Tempero Verde', amount: 42.00, type: 'expense', category: 'Alimentação', date: todayStr, currency: 'BRL' },
          { description: 'Farmácia Droga Raia Medicamentos', amount: 115.40, type: 'expense', category: 'Saúde', date: todayStr, currency: 'BRL' },
          { description: 'Mensalidade Faculdade Direito', amount: 890.00, type: 'expense', category: 'Educação', date: todayStr, currency: 'BRL' },
        ];
      } else if (connectingId === 'bradesco') {
        balance = 1250.30;
        feed = [
          { description: 'Cinema Cinemark Shopping', amount: 65.00, type: 'expense', category: 'Lazer', date: todayStr, currency: 'BRL' },
          { description: 'Seguro Auto Bradesco', amount: 220.00, type: 'expense', category: 'Transporte', date: todayStr, currency: 'BRL' },
          { description: 'Rendimento Poupança Automática', amount: 18.20, type: 'income', category: 'Outros', date: todayStr, currency: 'BRL' },
        ];
      }

      setTimeout(() => {
        if (connectingId) {
          connectBank(connectingId, balance, feed);
        }
        setConnectingId(null);
      }, 1500);

    }, 2000);
  };

  const handleStartEditing = (bankId: string, currentBalance: number) => {
    setEditingId(bankId);
    setTempBalance(currentBalance.toString());
  };

  const handleSaveBalance = (bankId: string) => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      updateBankBalance(bankId, val);
    }
    setEditingId(null);
  };

  // Calculate detailed forecast and metrics for a specific account
  const getAccountMetrics = (bankId: string) => {
    const isManual = bankId === 'manual';
    const txs = state.transactions.filter((t) => {
      const tBankId = t.bankId || 'manual';
      return tBankId === bankId;
    });

    let pendingIncome = 0;
    let pendingExpense = 0;
    const pendingList: Transaction[] = [];

    txs.forEach((t) => {
      if (t.paid === false) {
        pendingList.push(t);
        const val = convertAmount(t.amount, t.currency, baseCurrency);
        if (t.type === 'income') {
          pendingIncome += val;
        } else {
          pendingExpense += val;
        }
      }
    });

    // Sort upcoming entries by date
    pendingList.sort((a, b) => a.date.localeCompare(b.date));

    return {
      pendingIncome,
      pendingExpense,
      pendingCount: pendingList.length,
      upcoming: pendingList.slice(0, 3), // next 3 entries
    };
  };

  const formatCurrency = (val: number) => {
    return `${baseCurrencySymbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6" id="bank-tab">
      {/* Informative Security Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-950 font-sans tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Gestão de Contas, Saldos & Previsões</span>
          </h2>
          <p className="text-sm text-gray-500 font-sans max-w-2xl mt-1">
            Controle os saldos de suas contas bancárias reais ou manuais. O sistema calcula automaticamente o 
            <strong className="text-gray-800 font-semibold"> saldo projetado </strong> e previsões futuras com base nos seus lançamentos recorrentes e pendências agendadas.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold border border-blue-100 shrink-0">
          <Lock className="w-4 h-4" />
          <span>Simulador Open Finance Integrado</span>
        </div>
      </div>

      {/* Grid of Bank Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.banks.map((bank) => {
          const isManual = bank.bankId === 'manual';
          const { pendingIncome, pendingExpense, pendingCount, upcoming } = getAccountMetrics(bank.bankId);
          
          // Calculate project balance
          const projectedBalance = bank.balance + pendingIncome - pendingExpense;

          return (
            <div 
              key={bank.bankId} 
              className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                bank.connected || isManual ? 'border-gray-200' : 'border-gray-150 opacity-80'
              }`}
            >
              <div>
                {/* Header section of account card */}
                <div className="flex justify-between items-start pb-4 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base ${
                      isManual ? 'bg-slate-700' :
                      bank.bankId === 'nubank' ? 'bg-purple-600' :
                      bank.bankId === 'itau' ? 'bg-orange-500' :
                      bank.bankId === 'bb' ? 'bg-yellow-400 text-blue-900' : 'bg-rose-700'
                    }`}>
                      {isManual ? '💼' :
                       bank.bankId === 'nubank' ? 'Nu' :
                       bank.bankId === 'itau' ? 'IT' :
                       bank.bankId === 'bb' ? 'BB' : 'Br'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-base">{bank.name}</h4>
                      <p className="text-xs text-gray-400 font-sans">
                        {isManual ? 'Controle Físico e Carteira' : 'Open Finance API v2'}
                      </p>
                    </div>
                  </div>

                  {isManual ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
                      <span>Carteira</span>
                    </span>
                  ) : bank.connected ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conectado</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                      Desconectado
                    </span>
                  )}
                </div>

                {/* Balance display section */}
                <div className="my-5 grid grid-cols-2 gap-4">
                  {/* Current Balance */}
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-gray-100 relative group">
                    <p className="text-[10px] text-gray-400 font-sans font-medium uppercase tracking-wider">Saldo Real Atual</p>
                    {editingId === bank.bankId ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-semibold text-gray-500">{baseCurrencySymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={tempBalance}
                          onChange={(e) => setTempBalance(e.target.value)}
                          className="w-full bg-white px-1.5 py-0.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => handleSaveBalance(bank.bankId)}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-bold font-mono text-gray-900">
                          {bank.connected || isManual ? formatCurrency(bank.balance) : 'R$ — —'}
                        </p>
                        {(bank.connected || isManual) && (
                          <button
                            onClick={() => handleStartEditing(bank.bankId, bank.balance)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                            title="Ajustar Saldo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Projected Balance with forecast */}
                  <div className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/50">
                    <p className="text-[10px] text-blue-600 font-sans font-semibold uppercase tracking-wider">Saldo Projetado</p>
                    <p className="text-lg font-bold font-mono text-blue-900 mt-1">
                      {bank.connected || isManual ? formatCurrency(projectedBalance) : 'R$ — —'}
                    </p>
                  </div>
                </div>

                {/* Sub-metrics (Inflows and Outflows scheduled) */}
                {(bank.connected || isManual) && (
                  <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/30">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="block text-[9px] text-emerald-600/70 uppercase font-semibold">Entradas Pendentes</span>
                        <span className="font-bold font-mono">{formatCurrency(pendingIncome)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-rose-700 bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100/30">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <div>
                        <span className="block text-[9px] text-rose-600/70 uppercase font-semibold">Saídas Pendentes</span>
                        <span className="font-bold font-mono">{formatCurrency(pendingExpense)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forecast List (Upcoming future items) */}
                {(bank.connected || isManual) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h5 className="text-xs font-semibold text-gray-700 font-sans mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Previsões & Lançamentos Pendentes ({pendingCount})</span>
                    </h5>

                    {upcoming.length === 0 ? (
                      <p className="text-xs text-gray-400 italic bg-gray-50/50 p-3 rounded-xl text-center">
                        Nenhuma pendência ou previsão de lançamento agendada para esta conta. 👍
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {upcoming.map((tx) => {
                          const catObj = CATEGORIES.find(c => c.id === tx.category);
                          return (
                            <div key={tx.id} className="flex justify-between items-center bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base select-none shrink-0" title={tx.category}>
                                  {catObj?.emoji || '📦'}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 truncate leading-tight">{tx.description}</p>
                                  <span className="text-[10px] text-gray-400 font-sans block mt-0.5">
                                    {tx.date} • {tx.category}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-semibold font-mono ${
                                  tx.type === 'income' ? 'text-green-600' : 'text-rose-600'
                                }`}>
                                  {tx.type === 'income' ? '+' : '-'} {tx.currency} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {pendingCount > 3 && (
                          <p className="text-[10px] text-gray-400 text-center font-sans mt-1">
                            e mais {pendingCount - 3} lançamentos na aba de Transações.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-gray-150">
                {isManual ? (
                  <p className="text-center text-[11px] text-slate-500 font-sans">
                    Você pode adicionar transações associadas a esta carteira manual a qualquer momento.
                  </p>
                ) : bank.connected ? (
                  <div className="flex items-center justify-between gap-4">
                    {bank.lastSync && (
                      <span className="text-[10px] text-gray-400 font-sans block">
                        Sincronizado: {new Date(bank.lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button
                      onClick={() => disconnectBank(bank.bankId as any)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-xl text-xs transition cursor-pointer ml-auto"
                    >
                      Remover Integração
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartConnection(bank.bankId as any)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Conectar Conta Bancária via Open Finance
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Card: Add Custom Bank/Account */}
        <div 
          onClick={() => setIsAddingCustom(true)}
          className="border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 flex flex-col justify-center items-center gap-4 text-center cursor-pointer transition hover:bg-blue-50/20 group min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center text-gray-500 group-hover:text-blue-600 transition">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-base group-hover:text-blue-700 transition">Adicionar Banco ou Carteira</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1 mx-auto">
              Crie contas bancárias adicionais, carteiras de dinheiro físico ou contas de outras fintechs.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Bank/Account */}
      {isAddingCustom && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-950 font-sans">Nova Conta ou Banco</h3>
                <p className="text-xs text-gray-500 font-sans">Cadastre uma nova carteira ou instituição para controle</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome da Conta / Banco</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inter, XP Investimentos, Dinheiro Físico"
                  value={customBankName}
                  onChange={(e) => setCustomBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customBankBalance}
                    onChange={(e) => setCustomBankBalance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Moeda</label>
                  <select
                    value={customBankCurrency}
                    onChange={(e) => setCustomBankCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                  >
                    {AVAILABLE_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-gray-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Adicionar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Auth Modal / Handshake Overlay */}
      {connectingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {authStep === 'form' ? (
              <form onSubmit={handleConnectSubmit} className="space-y-4">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950 font-sans">
                      Conectar ao {state.banks.find((b) => b.bankId === connectingId)?.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-sans">Insira as credenciais do seu simulador Open Finance</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Para fins de demonstração, insira qualquer número de agência/conta e senha. Não coletamos dados reais.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Agência e Conta (Ex: 1234 / 56789-0)</label>
                  <input
                    type="text"
                    required
                    placeholder="0001 / 12345-6"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isAuthenticating}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Senha de 6 dígitos</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••"
                      maxLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isAuthenticating}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isAuthenticating}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition text-gray-600 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    {isAuthenticating && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{isAuthenticating ? 'Autenticando...' : 'Autorizar Sincronismo'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-sans">Sucesso!</h3>
                  <p className="text-sm text-gray-500 font-sans px-4">
                    Conexão Open Finance estabelecida com o {state.banks.find((b) => b.bankId === connectingId)?.name}. Importando lançamentos históricos do extrato...
                  </p>
                </div>
                <div className="text-xs text-blue-600 animate-pulse font-sans">
                  Sincronizando feed de transações...
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
