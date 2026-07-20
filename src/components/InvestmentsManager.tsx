import React, { useState } from 'react';
import { AppState, Investment, AVAILABLE_CURRENCIES } from '../types';
import { saveInvestmentYields } from '../services/financeService';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Percent, 
  Building2, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  LineChart, 
  CheckCircle2, 
  AlertCircle,
  PiggyBank,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface InvestmentsManagerProps {
  state: AppState;
  addInvestment: (investment: Omit<Investment, 'id'> & { id?: string }) => void;
  deleteInvestment: (id: string) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
}

export default function InvestmentsManager({
  state,
  addInvestment,
  deleteInvestment,
  convertAmount
}: InvestmentsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankId, setBankId] = useState('');
  const [notes, setNotes] = useState('');

  // Supabase database saving status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  const investments = state.investments || [];

  // Calculate stats
  const totalInvested = investments.reduce((sum, inv) => {
    return sum + convertAmount(inv.amount, inv.currency, baseCurrency);
  }, 0);

  const monthlyEstimatedReturn = investments.reduce((sum, inv) => {
    const rate = inv.interestRate / 100;
    const monthlyRate = inv.interestType === 'monthly' ? rate : Math.pow(1 + rate, 1/12) - 1;
    const invAmountInBase = convertAmount(inv.amount, inv.currency, baseCurrency);
    return sum + (invAmountInBase * monthlyRate);
  }, 0);

  // Growth projection data (next 12 months)
  const projectionData = Array.from({ length: 12 }, (_, index) => {
    const monthIndex = index + 1;
    const date = new Date();
    date.setMonth(date.getMonth() + monthIndex);
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

    let projectedTotal = 0;
    investments.forEach((inv) => {
      const rate = inv.interestRate / 100;
      const monthlyRate = inv.interestType === 'monthly' ? rate : Math.pow(1 + rate, 1/12) - 1;
      const invAmountInBase = convertAmount(inv.amount, inv.currency, baseCurrency);
      
      // Compound interest formula: A = P(1 + r)^t
      const futureVal = invAmountInBase * Math.pow(1 + monthlyRate, monthIndex);
      projectedTotal += futureVal;
    });

    return {
      name: label,
      'Valor Projetado': parseFloat(projectedTotal.toFixed(2)),
      'Aporte Inicial': parseFloat(totalInvested.toFixed(2)),
      'Rendimento Acumulado': parseFloat(Math.max(0, projectedTotal - totalInvested).toFixed(2)),
    };
  });

  const totalProjected12M = projectionData[11]?.['Valor Projetado'] || totalInvested;
  const accumulatedYield12M = totalProjected12M - totalInvested;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !institution || !amount || !interestRate || !bankId) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const generatedId = 'inv_' + Math.random().toString(36).substr(2, 9);
      const newInvestment: Investment = {
        id: generatedId,
        name,
        institution,
        amount: parseFloat(amount),
        currency,
        interestRate: parseFloat(interestRate),
        interestType,
        startDate,
        bankId,
        notes: notes.trim() || undefined
      };

      // 1. Sincroniza localmente
      addInvestment(newInvestment);

      // 2. Persiste Rendimentos no Firestore via financeService (Real ou Simulado)
      await saveInvestmentYields(newInvestment);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Reset Form
      setName('');
      setInstitution('');
      setAmount('');
      setCurrency('BRL');
      setInterestRate('');
      setInterestType('monthly');
      setStartDate(new Date().toISOString().split('T')[0]);
      setBankId('');
      setNotes('');
      setIsAdding(false);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Erro de conexão com o Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8" id="investments-manager">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Dinheiros Aplicados & Investimentos</h2>
          <p className="text-sm text-gray-500 font-sans">Acompanhe sua carteira de investimentos e simule projeções automáticas de juros compostos.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer"
        >
          {isAdding ? 'Ver Minha Carteira' : 'Aplicar Novo Dinheiro'}
          {!isAdding && <Plus className="w-4 h-4" />}
        </button>
      </div>

      {isAdding ? (
        /* FORM CARD */
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <PiggyBank className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-950 font-sans">Registrar Nova Aplicação</h3>
          </div>

          {saveError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex gap-2 items-start animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Não foi possível persistir no Firestore:</span>
                <p className="mt-0.5 opacity-90">{saveError}</p>
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex gap-2 items-center animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Aplicação e rendimentos salvos com sucesso no Firestore!</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Ativo / Aplicação</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  placeholder="Ex: CDB 110% CDI, Tesouro Selic 2029"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Instituição / Corretora</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  placeholder="Ex: Nubank, XP, Rico, Itaú"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Aplicado</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={isSaving}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Moeda</label>
                <select
                  disabled={isSaving}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                >
                  {AVAILABLE_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Conta Bancária Origem</label>
                <select
                  required
                  disabled={isSaving}
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                >
                  <option value="">Selecione uma conta...</option>
                  {state.banks.map((b) => (
                    <option key={b.bankId} value={b.bankId}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa de Rendimento (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={isSaving}
                    placeholder="Ex: 1.15"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 text-xs font-semibold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Período de Rendimento</label>
                <select
                  disabled={isSaving}
                  value={interestType}
                  onChange={(e) => setInterestType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                >
                  <option value="monthly">Ao Mês (a.m.)</option>
                  <option value="yearly">Ao Ano (a.a.)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Aplicação</label>
                <input
                  type="date"
                  required
                  disabled={isSaving}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notas / Observações (Opcional)</label>
              <textarea
                disabled={isSaving}
                placeholder="Ex: Liquidez diária, resgate apenas no vencimento, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition resize-none disabled:opacity-60"
              />
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Geração Futura Inteligente:</strong> Ao salvar, o sistema irá criar automaticamente 12 meses de previsões de rendimento mensais na aba de Transações, permitindo projetar seu caixa futuro em tempo real!
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 text-gray-600 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition disabled:opacity-80 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando Rendimentos...</span>
                  </>
                ) : (
                  <span>Efetivar Aplicação</span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* PORTFOLIO VIEWER */
        <div className="space-y-6">
          {/* Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-sans font-semibold uppercase tracking-wider">Total Aplicado</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {baseCurrencySymbol} {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-sans font-semibold uppercase tracking-wider">Rendimento Mensal Médio</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {baseCurrencySymbol} {monthlyEstimatedReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-sans font-semibold uppercase tracking-wider">Previsão Juros (12m)</p>
                <p className="text-2xl font-bold text-indigo-600 mt-0.5 flex items-center gap-1">
                  <span>+{baseCurrencySymbol} {accumulatedYield12M.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs text-green-600 font-sans font-semibold flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-full">
                    <ArrowUpRight className="w-3 h-3" />
                    {totalInvested > 0 ? ((accumulatedYield12M / totalInvested) * 100).toFixed(1) : 0}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {investments.length === 0 ? (
            /* EMPTY STATE */
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Nenhum dinheiro aplicado</h3>
                <p className="text-sm text-gray-400 max-w-sm mt-1 mx-auto">
                  Registre seus fundos imobiliários, CDBs, ações ou poupança para acompanhar a rentabilidade e juros automáticos.
                </p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Aplicar Primeiro Valor
              </button>
            </div>
          ) : (
            /* PORTFOLIO GRID & GRAPH */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Investments List Column (left/center) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm font-sans">Minhas Aplicações Ativas ({investments.length})</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {investments.map((inv) => {
                      const associatedBank = state.banks.find((b) => b.bankId === inv.bankId)?.name || 'Conta Externa';
                      return (
                        <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50/50 transition">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-950 text-sm truncate leading-tight">{inv.name}</h4>
                              <p className="text-[11px] text-gray-400 font-sans mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-medium text-gray-600">{inv.institution}</span>
                                <span>•</span>
                                <span>Conta: {associatedBank}</span>
                                <span>•</span>
                                <span>Desde: {inv.startDate}</span>
                              </p>
                              {inv.notes && (
                                <p className="text-[10px] text-gray-400 italic font-sans mt-1">Obs: {inv.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900 font-mono">
                                {inv.currency} {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full mt-0.5">
                                <Percent className="w-2.5 h-2.5" />
                                {inv.interestRate}% a.{inv.interestType === 'monthly' ? 'm.' : 'a.'}
                              </span>
                            </div>

                            <button
                              onClick={() => deleteInvestment(inv.id)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                              title="Excluir Aplicação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Growth Chart Panel */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-950 text-sm font-sans flex items-center gap-1.5">
                      <LineChart className="w-4 h-4 text-blue-600" />
                      <span>Projeção Futura do Portfólio (12 Meses)</span>
                    </h3>
                    <p className="text-xs text-gray-400 font-sans">Visualização simulada do crescimento patrimonial considerando os juros incidentes.</p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={projectionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `${baseCurrencySymbol}${val.toLocaleString('pt-BR', { notation: 'compact' })}`}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${baseCurrencySymbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]}
                          contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc', fontSize: '11px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Valor Projetado" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorProjected)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Projections Feed Column (right) */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-950 text-sm font-sans">Rendimentos Provisionados</h3>
                    <p className="text-xs text-gray-400 font-sans">
                      Lista dos juros futuros que serão incorporados à sua carteira. Marque como Pago quando forem depositados.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {state.transactions
                      .filter((t) => t.category === 'Investimentos' && t.subcategory === 'Rendimentos')
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 8)
                      .map((tx) => {
                        const associatedBank = state.banks.find((b) => b.bankId === tx.bankId)?.name || 'Conta';
                        return (
                          <div 
                            key={tx.id} 
                            className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-xs transition ${
                              tx.paid 
                                ? 'bg-green-50/50 border-green-100 text-green-900' 
                                : 'bg-gray-50/80 border-gray-150 text-gray-800'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold truncate max-w-[160px]">{tx.description}</p>
                                <span className="text-[10px] text-gray-400 font-sans block mt-0.5">
                                  Previsão: {tx.date} • {associatedBank}
                                </span>
                              </div>
                              <span className="font-bold font-mono text-green-600">
                                +{tx.currency} {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-gray-100">
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-sans uppercase tracking-wider ${
                                tx.paid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {tx.paid ? 'Efetivado' : 'Pendente (Previsto)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
