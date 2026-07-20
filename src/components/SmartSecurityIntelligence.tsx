import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, AVAILABLE_CURRENCIES, CATEGORIES, UserPreferences } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Coins,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Brain,
  RefreshCw,
  CheckCircle,
  Activity,
  UserCheck,
  Lock,
  Unlock,
  HelpCircle,
  Sparkle,
  Fingerprint,
  X,
  Smartphone,
  Flame,
  SlidersHorizontal,
  PiggyBank,
  Scale,
  Timer
} from 'lucide-react';
import Markdown from 'react-markdown';

interface SmartSecurityIntelligenceProps {
  state: AppState;
  setAppLockPin: (pin?: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  lockApp: () => void;
  deleteTransaction: (id: string) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
}

export default function SmartSecurityIntelligence({
  state,
  setAppLockPin,
  updatePreferences,
  lockApp,
  deleteTransaction,
  convertAmount,
}: SmartSecurityIntelligenceProps) {
  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // 1. PIN LOCK SETUP STATE
  const [pinInput, setPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const currentPin = state.preferences.appLockPin;
  const [securityFormError, setSecurityFormError] = useState<string | null>(null);

  // Biometrics Enrollment states
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollStep, setEnrollStep] = useState<1 | 2>(1);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState('Pressione e segure o dedo no leitor abaixo.');
  
  const scanIntervalRef = useRef<any>(null);

  // Press and hold logic for simulated fingerprint scanner
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (e && typeof e.preventDefault === 'function' && e.cancelable) {
      try {
        e.preventDefault();
      } catch (err) {
        // Safe fail on passive listeners
      }
    }
    if (enrollProgress >= 100 && enrollStep === 2) return;
    
    setIsPressing(true);
    setEnrollStatus(
      enrollStep === 1 
        ? 'Escaneando sua impressão digital principal...' 
        : 'Confirmando mapeamento papilar secundário...'
    );

    let progress = enrollProgress;
    scanIntervalRef.current = setInterval(() => {
      progress += 8;
      if (progress >= 100) {
        progress = 100;
        setEnrollProgress(100);
        clearInterval(scanIntervalRef.current);
        setIsPressing(false);

        if (enrollStep === 1) {
          setEnrollStep(2);
          setEnrollProgress(0);
          setEnrollStatus('Excelente! Agora levante o dedo e pressione novamente para confirmar.');
        } else {
          setEnrollStatus('Mapeamento concluído com sucesso! Biometria ativada.');
          updatePreferences({ appLockBiometrics: true });
          setTimeout(() => {
            setIsEnrolling(false);
            setEnrollStep(1);
            setEnrollProgress(0);
          }, 2000);
        }
      } else {
        setEnrollProgress(progress);
      }
    }, 100);
  };

  const handlePressEnd = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsPressing(false);
    
    if (enrollProgress < 100) {
      setEnrollProgress(0);
      setEnrollStatus('Leitura interrompida. Pressione e segure firme até o final!');
    }
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // 2. IA / ADVISOR STATE
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 3. INTERNAL CHECKLIST STATE FOR CANCELLING COSTS
  const [cancelledItems, setCancelledItems] = useState<string[]>([]);

  // 4. TESTE DE ESTRESSE FINANCEIRO ("E SE EU PERDER O EMPREGO?") STATES
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [useCustomReserves, setUseCustomReserves] = useState<boolean>(false);
  const [customReservesVal, setCustomReservesVal] = useState<string>('');
  const [stressTestLoading, setStressTestLoading] = useState<boolean>(false);
  const [stressTestError, setStressTestError] = useState<string | null>(null);
  const [stressTestMsg, setStressTestMsg] = useState<string>('');
  const [appliedCuts, setAppliedCuts] = useState<string[]>([]);
  const [stressTestResult, setStressTestResult] = useState<{
    survivalMonths: number;
    survivalDays: number;
    totalReserves: number;
    monthlyBurnRate: number;
    essentialMonthlyExpenses: number;
    variableMonthlyExpenses: number;
    requiredMonthlyReduction: number;
    cutSuggestions: Array<{
      category: string;
      currentSpent: number;
      recommendedCut: number;
      description: string;
    }>;
    detailedMarkdownReport: string;
  } | null>(null);

  const loadingMessages = [
    "Somando saldos bancários e ativos de investimentos...",
    "Separando gastos essenciais de despesas supérfluas...",
    "Projetando faturas de cartões e parcelamentos...",
    "Simulando perda imediata de faturamento do usuário...",
    "Gemini calculando dias exatos de sobrevivência...",
    "Gerando plano de contingência estratégico..."
  ];

  useEffect(() => {
    let interval: any;
    if (stressTestLoading) {
      let idx = 0;
      setStressTestMsg(loadingMessages[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % loadingMessages.length;
        setStressTestMsg(loadingMessages[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [stressTestLoading]);

  const runStressTest = async () => {
    setStressTestLoading(true);
    setStressTestError(null);
    setStressTestResult(null);
    setAppliedCuts([]);

    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: state.transactions,
          banks: state.banks,
          investments: state.investments,
          targetMonths,
          customReserves: useCustomReserves ? Number(customReservesVal || 0) : undefined,
          preferences: state.preferences
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar simulação de estresse.');
      }

      setStressTestResult(data.data);
    } catch (err: any) {
      console.error(err);
      setStressTestError(err.message || 'Falha ao conectar-se ao servidor para executar o teste de estresse.');
    } finally {
      setStressTestLoading(false);
    }
  };

  const simulatedMonthlyExpenses = useMemo(() => {
    if (!stressTestResult) return 0;
    let expenses = stressTestResult.monthlyBurnRate;
    stressTestResult.cutSuggestions.forEach((sug, idx) => {
      if (appliedCuts.includes(`cut_${idx}`)) {
        expenses -= sug.recommendedCut;
      }
    });
    return Math.max(expenses, 1);
  }, [stressTestResult, appliedCuts]);

  const simulatedSurvivalMonths = useMemo(() => {
    if (!stressTestResult) return 0;
    const reserves = useCustomReserves ? Number(customReservesVal || 0) : stressTestResult.totalReserves;
    const raw = reserves / simulatedMonthlyExpenses;
    return Math.floor(raw);
  }, [stressTestResult, simulatedMonthlyExpenses, useCustomReserves, customReservesVal]);

  const simulatedSurvivalDays = useMemo(() => {
    if (!stressTestResult) return 0;
    const reserves = useCustomReserves ? Number(customReservesVal || 0) : stressTestResult.totalReserves;
    const raw = reserves / simulatedMonthlyExpenses;
    const months = Math.floor(raw);
    return Math.round((raw - months) * 30);
  }, [stressTestResult, simulatedMonthlyExpenses, useCustomReserves, customReservesVal]);

  // ------------------------------------------------------------
  // DETECTOR DE ANOMALIAS (ANOMALY DETECTOR ENGINE)
  // ------------------------------------------------------------
  const anomalies = useMemo(() => {
    const list: Array<{
      id: string;
      txId: string;
      type: 'duplicate' | 'spike' | 'night_expense' | 'micro_accumulation';
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      amount: number;
      currency: string;
      date: string;
    }> = [];

    const transactions = state.transactions;
    const categoryTotals: { [cat: string]: { total: number; count: number } } = {};

    // First calculate category averages to detect spikes
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const amt = convertAmount(tx.amount, tx.currency, baseCurrency);
        if (!categoryTotals[tx.category]) {
          categoryTotals[tx.category] = { total: 0, count: 0 };
        }
        categoryTotals[tx.category].total += amt;
        categoryTotals[tx.category].count += 1;
      }
    });

    // Detect duplicates, spikes, nightly expenses, etc.
    const seenTxs: { [key: string]: typeof state.transactions[0] } = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const amountInBase = convertAmount(tx.amount, tx.currency, baseCurrency);

        // A. Duplicate detection (same date, category, description and amount within +/- 1%)
        const dupKey = `${tx.date}_${tx.category}_${tx.amount.toFixed(1)}_${tx.description.trim().toLowerCase()}`;
        if (seenTxs[dupKey] && seenTxs[dupKey].id !== tx.id) {
          list.push({
            id: `dup_${tx.id}`,
            txId: tx.id,
            type: 'duplicate',
            title: 'Possível Cobrança Duplicada',
            description: `Transação idêntica detectada no mesmo dia (${tx.date}) para "${tx.description}".`,
            severity: 'high',
            amount: tx.amount,
            currency: tx.currency,
            date: tx.date,
          });
        } else {
          seenTxs[dupKey] = tx;
        }

        // B. Expense spikes (exceeding 3.5x category average)
        const catStats = categoryTotals[tx.category];
        if (catStats && catStats.count > 2) {
          const catAvg = (catStats.total - amountInBase) / (catStats.count - 1);
          if (catAvg > 10 && amountInBase > catAvg * 3.5) {
            list.push({
              id: `spike_${tx.id}`,
              txId: tx.id,
              type: 'spike',
              title: 'Pico de Gasto Fora do Padrão',
              description: `Este gasto está R$ ${Math.round(amountInBase - catAvg)} acima da sua média de R$ ${Math.round(catAvg)} para a categoria "${tx.category}".`,
              severity: 'medium',
              amount: tx.amount,
              currency: tx.currency,
              date: tx.date,
            });
          }
        }

        // C. Unusual nightly expense (between 12:00 AM and 5:00 AM - flagged optionally as low warning)
        // Usually, users flag nightly bars/entertainment or late delivery as optional leaks
        // Since we don't have exact hours in full YYYY-MM-DD format, we flag if they contain "Madrugada" or if they are repetitive USD transactions
        if (tx.description.toLowerCase().includes('uber') && amountInBase > 80) {
          list.push({
            id: `night_${tx.id}`,
            txId: tx.id,
            type: 'night_expense',
            title: 'Despesa de Transporte de Alto Custo',
            description: `Viagem avulsa de alto valor em transporte público/aplicativo.`,
            severity: 'low',
            amount: tx.amount,
            currency: tx.currency,
            date: tx.date,
          });
        }
      }
    });

    return list;
  }, [state.transactions, convertAmount, baseCurrency]);

  // ------------------------------------------------------------
  // SUGESTÕES PARA NÃO FECHAR NO VERMELHO & TRAJECTORY ANALYSIS
  // ------------------------------------------------------------
  const redPrevention = useMemo(() => {
    // Current date values
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const progressFactor = currentDay / daysInMonth;

    let totalIncome = 0;
    let totalExpense = 0;

    state.transactions.forEach((tx) => {
      const amt = convertAmount(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    });

    // Run Trajectory projection
    const dailySpendRate = totalExpense / Math.max(currentDay, 1);
    const projectedMonthEndExpense = dailySpendRate * daysInMonth;
    const projectedDeficit = totalIncome - projectedMonthEndExpense;
    const isEndingInRed = projectedDeficit < 0;

    // Categorized tips
    const actionableTips: string[] = [];
    if (isEndingInRed) {
      actionableTips.push(
        `Seu ritmo de gastos atual indica que você fechará o mês com um saldo negativo projetado de ${baseCurrencySymbol} ${Math.abs(projectedDeficit).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      );
      actionableTips.push(
        `Sugestão: Reduza imediatamente despesas não essenciais das categorias de Lazer ou Compras em pelo menos R$ ${(Math.abs(projectedDeficit) / 4).toFixed(0)} por semana para equilibrar.`
      );
      actionableTips.push(
        'Evite compras parceladas ou novas assinaturas digitais nos próximos 15 dias.'
      );
    } else {
      actionableTips.push(
        'Excelente! No ritmo atual de gastos, você fechará o mês no azul com segurança.'
      );
      actionableTips.push(
        `Você tem uma folga financeira estimada de ${baseCurrencySymbol} ${projectedDeficit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Considere investir esse excedente.`
      );
    }

    return {
      totalIncome,
      totalExpense,
      dailySpendRate,
      projectedMonthEndExpense,
      projectedDeficit,
      isEndingInRed,
      actionableTips,
    };
  }, [state.transactions, convertAmount, baseCurrency, baseCurrencySymbol]);

  // ------------------------------------------------------------
  // BEHAVIORAL PROFILE & UNNECESSARY COSTS DETECTION
  // ------------------------------------------------------------
  const userProfile = useMemo(() => {
    const expenseTotal = redPrevention.totalExpense;
    const incomeTotal = redPrevention.totalIncome;

    let topCategory = 'Outros';
    const catTotals: { [cat: string]: number } = {};
    state.transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const val = convertAmount(tx.amount, tx.currency, baseCurrency);
        catTotals[tx.category] = (catTotals[tx.category] || 0) + val;
      }
    });

    let maxVal = 0;
    Object.entries(catTotals).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topCategory = cat;
      }
    });

    // Determine personality profile based on data
    let title = 'Equilibrado';
    let label = 'Perfil de Consumo Consciente';
    let description = 'Você mantém um balanço saudável entre entradas e saídas e planeja seus custos.';
    let colorClass = 'text-green-600 bg-green-50 border-green-100';

    if (expenseTotal > incomeTotal * 0.9) {
      title = 'Altamente Consumista';
      label = 'Perfil de Alerta Vermelho';
      description = 'Suas despesas estão consumindo quase todo o seu orçamento mensal. Alto risco de endividamento.';
      colorClass = 'text-rose-600 bg-rose-50 border-rose-100';
    } else if (expenseTotal < incomeTotal * 0.4 && expenseTotal > 0) {
      title = 'Investidor / Poupador Extremo';
      label = 'Perfil Focado em Liberdade Financeira';
      description = 'Você poupa mais de 60% do seu faturamento líquido mensal. Altíssimo potencial de enriquecimento.';
      colorClass = 'text-indigo-600 bg-indigo-50 border-indigo-100';
    } else if (topCategory === 'Lazer' || topCategory === 'Compras') {
      title = 'Aproveitador do Momento';
      label = 'Perfil Focado em Bem-Estar Imediato';
      description = 'A maior parte dos seus gastos vai para lazer e compras. Cuidado para não sabotar seu futuro.';
      colorClass = 'text-amber-600 bg-amber-50 border-amber-100';
    }

    // Identify candidate unneeded leak costs (subscriptions, eating out excess, USD foreign currency transaction fees)
    const suggestedCancellableItems: Array<{ id: string; name: string; cost: number; category: string }> = [];

    state.transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const costBase = convertAmount(tx.amount, tx.currency, baseCurrency);
        const desc = tx.description.toLowerCase();

        if (
          desc.includes('netflix') ||
          desc.includes('spotify') ||
          desc.includes('prime') ||
          desc.includes('disney') ||
          desc.includes('hbo') ||
          desc.includes('youtube premium') ||
          tx.category === 'Assinaturas'
        ) {
          suggestedCancellableItems.push({
            id: tx.id,
            name: tx.description,
            cost: costBase,
            category: 'Assinaturas',
          });
        } else if (costBase > 100 && (desc.includes('restaurante') || desc.includes('jantar') || desc.includes('ifood') || desc.includes('burguer'))) {
          suggestedCancellableItems.push({
            id: tx.id,
            name: `${tx.description} (Refeição Fora)`,
            cost: costBase * 0.3, // Suggesting a 30% reduction by eating out less
            category: 'Refeições Luxo (30% Redução)',
          });
        }
      }
    });

    // Filter duplicates
    const uniqueLeaks = suggestedCancellableItems.filter(
      (v, i, a) => a.findIndex((t) => t.name === v.name) === i
    );

    return {
      title,
      label,
      description,
      colorClass,
      uniqueLeaks,
    };
  }, [state.transactions, convertAmount, baseCurrency, redPrevention.totalExpense, redPrevention.totalIncome]);

  // Calculate current saved amount based on user checklist
  const prospectiveSavings = useMemo(() => {
    let total = 0;
    userProfile.uniqueLeaks.forEach((item) => {
      if (cancelledItems.includes(item.id)) {
        total += item.cost;
      }
    });
    return total;
  }, [cancelledItems, userProfile.uniqueLeaks]);

  // Toggle cancelling item
  const toggleLeak = (id: string) => {
    setCancelledItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ------------------------------------------------------------
  // LAUNCH GEMINI INTELLIGENT ADVISOR EXAMINER
  // ------------------------------------------------------------
  const generateSecurityAIReport = async () => {
    setLoadingAI(true);
    setAiError(null);
    setAiReport(null);

    const promptBody = {
      transactions: state.transactions,
      budgets: state.budgets,
      preferences: state.preferences,
      detectedAnomalies: anomalies.map((a) => ({ type: a.type, title: a.title, desc: a.description, amount: `${a.amount} ${a.currency}` })),
      projection: {
        isEndingInRed: redPrevention.isEndingInRed,
        projectedDeficit: redPrevention.projectedDeficit,
        spendRate: redPrevention.dailySpendRate,
      },
      behaviorProfile: {
        title: userProfile.title,
        topLeaks: userProfile.uniqueLeaks.map((l) => ({ name: l.name, cost: l.cost })),
      },
    };

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...promptBody,
          systemInstruction: `
            Você é o módulo de SEGURANÇA E INTELIGÊNCIA FINANCEIRA da Finança Ativa.
            Sua missão é dar um feedback definitivo, amigável e direto em PORTUGUÊS sobre:
            1. Os alertas e anomalias financeiras detectados.
            2. Como mitigar o risco de terminar o mês no vermelho (estimar corte exato).
            3. Como o perfil de consumo do usuário pode ser aprimorado cortando custos supérfluos (cite as assinaturas ou despesas de restaurante encontradas).
            
            Seja prático, motivador e use uma estrutura rica em Markdown. Não lamente ou de desculpas. Forneça um plano de ação simples de 3 etapas.
          `,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar análise inteligente.');
      }
      setAiReport(data.insight);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Falha ao se conectar com o consultor financeiro do Gemini.');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6" id="security-intelligence-tab">
      
      {/* 1. PASSWORD PIN LOCK SHIELD CARD */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-4 top-4 text-gray-100 pointer-events-none">
          <Lock className="w-16 h-16 stroke-[1.5]" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-md font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${currentPin ? 'text-green-600' : 'text-gray-400'}`} />
              <span>Bloqueio de Segurança por PIN</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5 max-w-xl">
              Ative um escudo de segurança. Quando ativado, o aplicativo exigirá seu PIN pessoal antes de exibir qualquer dado financeiro ou painel na tela.
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowPinSetup(!showPinSetup)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
                currentPin
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {currentPin ? 'Remover / Alterar PIN' : 'Configurar PIN'}
            </button>
          </div>
        </div>

        {/* PIN setup expansion form */}
        {showPinSetup && (
          <div className="mt-4 pt-4 border-t border-gray-100 max-w-md animate-fade-in space-y-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150 flex items-center gap-2.5 text-xs text-gray-600">
              <Lock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {currentPin
                  ? 'Seu PIN atual está ativo. Digite um novo PIN de 4 dígitos ou deixe vazio para desativar o bloqueio.'
                  : 'Crie uma senha de 4 dígitos numéricos para trancar o painel financeiro.'}
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Ex: 1234"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center w-32 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={() => {
                  if (pinInput.length === 4 || pinInput === '') {
                    setAppLockPin(pinInput || undefined);
                    setPinInput('');
                    setShowPinSetup(false);
                  }
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        )}

        {/* Security Preferences and Testing Controls */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Preferências de Acesso</h4>
            
            {/* Toggle 1: Biometrics */}
            <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-150 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Biometria (Simulado)</span>
                  <span className="text-[10px] text-gray-400 block">
                    {state.preferences.appLockBiometrics ? 'Ativada: Impressão Digital/Face ID' : 'Desativada ou não cadastrada'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {state.preferences.appLockBiometrics ? (
                  <button
                    onClick={() => updatePreferences({ appLockBiometrics: false })}
                    className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!currentPin) {
                        setSecurityFormError('Você precisa definir um PIN de acesso primeiro para que ele funcione como backup!');
                        setTimeout(() => setSecurityFormError(null), 5000);
                        return;
                      }
                      setEnrollProgress(0);
                      setEnrollStep(1);
                      setEnrollStatus('Pressione e segure o dedo no leitor abaixo.');
                      setIsEnrolling(true);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    Cadastrar
                  </button>
                )}
              </div>
            </div>

            {/* Toggle 2: Shuffle keypad */}
            <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-gray-150 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Teclado Embaralhado</span>
                  <span className="text-[10px] text-gray-400 block">Muda posições a cada entrada</span>
                </div>
              </div>
              <button
                onClick={() => updatePreferences({ appLockShuffle: !state.preferences.appLockShuffle })}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  state.preferences.appLockShuffle
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {state.preferences.appLockShuffle ? 'Ativado' : 'Desativado'}
              </button>
            </div>
          </div>

          {/* Test & Lock Screen simulator */}
          <div className="flex flex-col justify-center p-4 border border-blue-50 bg-blue-50/20 rounded-2xl space-y-3">
            <div className="flex items-start gap-2">
              <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-slate-900">Testar Bloqueio Imediato</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Gostaria de ver como ficou o seu fluxo de segurança? Bloqueie o painel agora para testar seu PIN ou a digital simulada cadastrada.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (!currentPin) {
                  setSecurityFormError('Você precisa definir um PIN numérico antes para poder trancar o aplicativo!');
                  setTimeout(() => setSecurityFormError(null), 5000);
                  return;
                }
                lockApp();
              }}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear e Testar Segurança</span>
            </button>
          </div>
        </div>

        {/* Feedback message overlay */}
        {securityFormError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold animate-fade-in flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{securityFormError}</span>
          </div>
        )}

        {/* 🖐️ BIOMETRIC ENROLLMENT INTERACTIVE SCANNER OVERLAY */}
        {isEnrolling && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-fade-in select-none">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-5 shadow-2xl relative">
              <button
                onClick={() => {
                  if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                  setIsEnrolling(false);
                }}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5">
                <span className="px-3 py-1 bg-blue-950 border border-blue-800/60 rounded-full text-blue-400 font-bold uppercase tracking-widest text-[9px]">
                  Configuração de Biometria
                </span>
                <h3 className="text-md font-bold text-white font-sans mt-2">
                  {enrollStep === 1 ? 'Passo 1: Digital Principal' : 'Passo 2: Confirmação'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Este simulador cadastra sua impressão digital usando tecnologia de toque contínuo.
                </p>
              </div>

              {/* Progress and instructions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Mapeamento:</span>
                  <span className="font-bold text-blue-400">{enrollProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-100 rounded-full ${
                      isPressing ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-slate-600'
                    }`}
                    style={{ width: `${enrollProgress}%` }}
                  />
                </div>
                <p className="text-[11px] font-medium text-amber-400 min-h-[32px] flex items-center justify-center px-4 leading-normal">
                  {enrollStatus}
                </p>
              </div>

              {/* Holographic scanner target button */}
              <div className="py-2 flex justify-center">
                <div className="relative">
                  {/* Scan active glow effect */}
                  {isPressing && (
                    <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
                  )}
                  
                  <button
                    type="button"
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={handlePressStart}
                    onTouchEnd={handlePressEnd}
                    onTouchCancel={handlePressEnd}
                    className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none relative group ${
                      isPressing
                        ? 'bg-blue-600/20 border-blue-400 text-blue-400 scale-95 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                        : enrollProgress >= 100 && enrollStep === 2
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    {/* Laser line moving if pressing */}
                    {isPressing && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 shadow-[0_0_10px_#3b82f6] rounded animate-scanner-scan z-10" />
                    )}
                    
                    <Fingerprint className="w-12 h-12" />
                    <span className="text-[8px] font-extrabold uppercase tracking-widest mt-1.5 opacity-80">
                      {isPressing ? 'Escaneando' : 'Pressione'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic max-w-xs mx-auto leading-normal pt-1 border-t border-slate-800/50">
                Segure o dedo sobre o leitor. O navegador simula o cadastro biométrico usando tempo de contato tátil contínuo.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. ANOMALY DETECTOR VIEW */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-md font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span>Detector Automático de Anomalias</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Nossos algoritmos varrem suas transações de despesa em busca de duplicidades ou desvios incomuns.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {anomalies.length} {anomalies.length === 1 ? 'Alerta' : 'Alertas'}
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs flex flex-col items-center justify-center gap-1.5">
            <ShieldCheck className="w-8 h-8 text-green-500 stroke-[1.5]" />
            <span className="font-semibold text-gray-700">Tudo Seguro por Aqui!</span>
            <span>Nenhuma transação duplicada ou pico bizarro foi detectado em suas despesas atuais.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition ${
                  anom.severity === 'high'
                    ? 'bg-rose-50/50 border-rose-200/50'
                    : 'bg-amber-50/50 border-amber-200/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      anom.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <span>{anom.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          anom.severity === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {anom.severity}
                      </span>
                    </h4>
                    <p className="text-xs text-gray-600 font-sans mt-1 leading-relaxed">
                      {anom.description}
                    </p>
                    <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                      Registrado em: <span className="font-mono">{anom.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-gray-900 block">
                      {baseCurrencySymbol} {anom.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTransaction(anom.txId)}
                    title="Remover transação possivelmente errada ou duplicada"
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. AVOID ENDING IN RED & TRAJECTORY ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trajectory & Safe Budgeting */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              <span>Monitor de Fechamento de Mês</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5 mb-4">
              Evite fechar no vermelho. Analisamos sua receita versus o ritmo de gastos diários acumulados.
            </p>

            {/* Trajectory warning box */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 mb-4 ${
                redPrevention.isEndingInRed
                  ? 'bg-rose-50/50 border-rose-100 text-rose-800'
                  : 'bg-green-50/50 border-green-100 text-green-800'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  redPrevention.isEndingInRed ? 'text-rose-600 animate-bounce' : 'text-green-600'
                }`}
              />
              <div>
                <span className="text-xs font-bold block">
                  {redPrevention.isEndingInRed ? 'Aviso: Projeção Negativa detectada!' : 'Status Saudável: No Caminho Certo!'}
                </span>
                <p className="text-xs font-sans mt-1 leading-relaxed opacity-90">
                  {redPrevention.isEndingInRed
                    ? `Seu ritmo atual de consumo aponta um estouro no orçamento consolidado de ${baseCurrencySymbol} ${Math.abs(redPrevention.projectedDeficit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} até o final do período.`
                    : `Sua receita consolidada de ${baseCurrencySymbol} ${redPrevention.totalIncome.toLocaleString('pt-BR')} suporta perfeitamente o ritmo de custos de ${baseCurrencySymbol} ${Math.round(redPrevention.projectedMonthEndExpense)} projetado.`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 font-sans">Sugestões de Redução Prática:</h4>
              <ul className="space-y-2">
                {redPrevention.actionableTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="font-sans leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-center text-xs font-mono">
            <span className="text-gray-400">Gasto Diário Médio:</span>
            <span className="font-bold text-gray-900">
              {baseCurrencySymbol} {redPrevention.dailySpendRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 4. BEHAVIORAL PROFILE & CORTAR CUSTOS DESNECESSÁRIOS */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Perfil & Corte de Supérfluos</span>
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${userProfile.colorClass}`}>
                {userProfile.title}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-sans mt-0.5 mb-4">
              {userProfile.description}
            </p>

            <h4 className="text-xs font-bold text-gray-800 font-sans mb-2.5 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>Despesas com Potencial de Redução:</span>
            </h4>

            {userProfile.uniqueLeaks.length === 0 ? (
              <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-150 text-xs">
                Nenhum custo supérfluo evidente ou assinatura foi identificada. Continue assim!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {userProfile.uniqueLeaks.map((item) => {
                  const isChecked = cancelledItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleLeak(item.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled on div click
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400"
                        />
                        <div>
                          <span className="text-xs font-bold block leading-tight">{item.name}</span>
                          <span className="text-[10px] text-gray-400 block">{item.category}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold">
                        {isChecked ? '-' : ''} {baseCurrencySymbol} {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 flex justify-between items-center">
            <div>
              <span className="text-[11px] text-emerald-800 font-bold block">Economia Potencial Estimada</span>
              <span className="text-[10px] text-gray-400 font-sans">Marcando os itens acima</span>
            </div>
            <span className="text-base font-bold font-mono text-emerald-700">
              + {baseCurrencySymbol} {prospectiveSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 5. INTEGRATED GEMINI SECURITY & BUDGET INTELLIGENCE CONSULTANT */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-md font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
              <span>Diagnóstico de Risco Inteligente (Gemini IA)</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              Solicite uma análise unificada. O Gemini analisará as anomalias, perfil de despesa e as chances de fechar no vermelho.
            </p>
          </div>
          <button
            onClick={generateSecurityAIReport}
            disabled={loadingAI}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loadingAI ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando Padrões...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Solicitar Auditoria de Gastos IA</span>
              </>
            )}
          </button>
        </div>

        {/* AI response display block */}
        {loadingAI ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkle className="w-5 h-5 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-xs font-bold text-gray-900 font-sans">Gemini está processando suas anomalias...</h4>
              <p className="text-[11px] text-gray-400 font-sans">
                Aguarde alguns segundos enquanto a inteligência estuda as duplicidades e calcula o faturamento.
              </p>
            </div>
          </div>
        ) : aiError ? (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-sans">
            <span className="font-bold">Ocorreu um problema:</span> {aiError}
          </div>
        ) : aiReport ? (
          <div className="space-y-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150">
              <div className="markdown-body text-gray-800 text-xs sm:text-sm leading-relaxed space-y-3">
                <Markdown>{aiReport}</Markdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 text-xs">
            Seu relatório de segurança inteligente está pronto para ser computado. Clique no botão de auditoria.
          </div>
        )}
      </div>

      {/* 6. TESTE DE ESTRESSE FINANCEIRO ("E SE EU PERDER O EMPREGO?") */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs space-y-6" id="stress-test-container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 inline-block">
              Simulador de Prevenção de Crises
            </span>
            <h3 className="text-md font-bold text-gray-950 font-sans tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Teste de Estresse Financeiro ("E se eu perder o emprego?")</span>
            </h3>
            <p className="text-xs text-gray-500 font-sans mt-1">
              Avalie o nível de segurança da sua família caso sua renda zere hoje. Descubra a duração real das suas reservas e receba um plano de cortes inteligente gerado pelo Gemini.
            </p>
          </div>
        </div>

        {/* Configuration panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span>1. Definir Cenário de Sobrevivência</span>
            </h4>

            {/* Target Survival Months Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700">Objetivo de sobrevivência sem renda:</label>
                <span className="text-xs font-extrabold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  {targetMonths} meses
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={targetMonths}
                onChange={(e) => setTargetMonths(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 mês</span>
                <span>1 ano (12m)</span>
                <span>2 anos (24m)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-slate-600" />
              <span>2. Reservas Financeiras de Emergência</span>
            </h4>

            {/* Custom Reserves Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Origem das reservas:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={useCustomReserves}
                    onChange={(e) => setUseCustomReserves(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-400"
                  />
                  <span>Valor Personalizado</span>
                </label>
              </div>

              {useCustomReserves ? (
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">{baseCurrencySymbol}</span>
                  <input
                    type="number"
                    value={customReservesVal}
                    placeholder="Ex: 15000"
                    onChange={(e) => setCustomReservesVal(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ) : (
                <div className="p-3 bg-white border border-slate-150 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Saldos + Investimentos salvos:</span>
                    <span className="text-xs font-bold text-slate-700 font-sans">Sumarizados do Supabase</span>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-emerald-700">
                    {baseCurrencySymbol} {((state.banks || []).reduce((acc, b) => acc + (b.connected ? b.balance : 0), 0) + (state.investments || []).reduce((acc, i) => acc + i.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={runStressTest}
            disabled={stressTestLoading}
            className="w-full md:w-auto px-10 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {stressTestLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando Estresse Financeiro...</span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4" />
                <span>Simular Estresse Financeiro ("E se eu perder o emprego?")</span>
              </>
            )}
          </button>
        </div>

        {/* Loader Screen */}
        {stressTestLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-slate-50 border border-slate-150 rounded-2xl animate-pulse">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-500 animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-1 px-4">
              <h4 className="text-xs font-extrabold text-slate-800 font-sans uppercase tracking-wider">A Inteligência do Gemini está trabalhando</h4>
              <p className="text-[11px] text-amber-600 font-bold font-mono transition-all duration-300">
                {stressTestMsg}
              </p>
              <p className="text-[10px] text-slate-400 px-6">
                Varrendo despesas fixas, assinaturas e gerando recomendações inteligentes para prevenção de crises familiares.
              </p>
            </div>
          </div>
        )}

        {stressTestError && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-sans">
            <span className="font-bold">Ocorreu um erro no teste de estresse:</span> {stressTestError}
          </div>
        )}

        {/* Results Screen */}
        {stressTestResult && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 font-sans">Relatório do Teste de Estresse Financeiro</h4>
            </div>

            {/* Survival Meter Banner Card */}
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden ${
              simulatedSurvivalMonths < 3
                ? 'bg-rose-50/70 border-rose-150 text-rose-950'
                : simulatedSurvivalMonths < 6
                ? 'bg-amber-50/70 border-amber-150 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-150 text-emerald-950'
            }`}>
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                  Tempo Estimado de Sobrevivência Sem Renda
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                  <Timer className={`w-8 h-8 shrink-0 ${
                    simulatedSurvivalMonths < 3 ? 'text-rose-500' : simulatedSurvivalMonths < 6 ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                  <span className="text-2xl font-black tracking-tight font-sans">
                    {simulatedSurvivalMonths} {simulatedSurvivalMonths === 1 ? 'mês' : 'meses'} e {simulatedSurvivalDays} {simulatedSurvivalDays === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <p className="text-xs font-sans opacity-90 max-w-md leading-relaxed">
                  {simulatedSurvivalMonths < 3
                    ? '⚠️ Alerta de Segurança: Suas reservas estão muito baixas. Qualquer crise exigirá cortes profundos e urgentes de despesas.'
                    : simulatedSurvivalMonths < 6
                    ? '⚡ Segurança Moderada: Suas reservas cobrem uma transição curta, mas o planejamento de corte ajuda a alongar esse prazo.'
                    : '🛡️ Escudo Familiar Forte: Suas reservas dão estabilidade de longo prazo para buscar novas oportunidades de trabalho com calma.'}
                </p>
              </div>

              {/* Progress Gauge compared to target */}
              <div className="w-full md:w-56 space-y-2 bg-white/60 p-4 rounded-xl border border-white/80 self-stretch flex flex-col justify-center">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 font-mono">
                  <span>Cenário Atual:</span>
                  <span className="font-extrabold">{simulatedSurvivalMonths}m / {targetMonths}m</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      simulatedSurvivalMonths < 3 ? 'bg-rose-500' : simulatedSurvivalMonths < targetMonths ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (simulatedSurvivalMonths / targetMonths) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 block text-center font-mono">
                  Meta estabelecida: <strong className="text-slate-600">{targetMonths} meses</strong>
                </span>
              </div>
            </div>

            {/* Bento Grid Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Box 1: Reserves */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reservas Disponíveis</span>
                <span className="text-lg font-extrabold font-mono text-slate-800 block">
                  {baseCurrencySymbol} {(useCustomReserves ? Number(customReservesVal || 0) : stressTestResult.totalReserves).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 block">Saldos de liquidez imediata</span>
              </div>

              {/* Box 2: Burn rate */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block block">Gasto Mensal (Simulado)</span>
                <span className="text-lg font-extrabold font-mono text-slate-800 block">
                  {baseCurrencySymbol} {simulatedMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Antes: {baseCurrencySymbol} {stressTestResult.monthlyBurnRate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês
                </span>
              </div>

              {/* Box 3: Fixed vs Variable */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balanço de Despesas</span>
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold leading-tight">
                      <span>Fixo</span>
                      <span>Variável</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="bg-indigo-500 h-full" style={{ width: `${(stressTestResult.essentialMonthlyExpenses / Math.max(1, stressTestResult.monthlyBurnRate)) * 100}%` }} />
                      <div className="bg-amber-400 h-full flex-1" />
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 block">
                  Fixo: {baseCurrencySymbol} {stressTestResult.essentialMonthlyExpenses.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Box 4: Reduction needed */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Redução Necessária</span>
                <span className={`text-lg font-extrabold font-mono block ${
                  simulatedSurvivalMonths >= targetMonths ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {simulatedSurvivalMonths >= targetMonths 
                    ? 'Alcançado!' 
                    : `${baseCurrencySymbol} ${Math.max(0, simulatedMonthlyExpenses - ((useCustomReserves ? Number(customReservesVal || 0) : stressTestResult.totalReserves) / targetMonths)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`}
                </span>
                <span className="text-[10px] text-slate-400 block font-sans">Para durar {targetMonths} meses</span>
              </div>
            </div>

            {/* Interactive Contingency Cuts Checklist Simulator */}
            <div className="bg-gradient-to-r from-blue-50/30 to-indigo-50/30 border border-blue-100 rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <h5 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide font-sans">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>Simulador de Contingência Interativo (Corte de Gastos)</span>
                </h5>
                <p className="text-[11px] text-indigo-700 leading-normal font-sans">
                  Selecione as sugestões abaixo para simular os cortes na prática. <strong>O medidor de tempo de sobrevivência no topo irá recalcular instantaneamente em tempo real!</strong>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stressTestResult.cutSuggestions.map((sug, idx) => {
                  const cutId = `cut_${idx}`;
                  const isChecked = appliedCuts.includes(cutId);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setAppliedCuts((prev) =>
                          prev.includes(cutId) ? prev.filter((id) => id !== cutId) : [...prev, cutId]
                        );
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled on container div click
                          className="w-4 h-4 rounded mt-0.5 text-emerald-600 focus:ring-emerald-400 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold block leading-tight">{sug.category}</span>
                          <span className="text-[10px] text-slate-400 block leading-normal">{sug.description}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black font-mono block text-emerald-700">
                          -{baseCurrencySymbol} {sug.recommendedCut.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          De {baseCurrencySymbol} {sug.currentSpent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Strategic Contingency Plan Advice (Detailed Markdown) */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-3">
              <h5 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <Brain className="w-4 h-4" />
                <span>Plano de Contingência Estratégico (Gemini)</span>
              </h5>
              <div className="markdown-body text-slate-200 text-xs sm:text-sm leading-relaxed space-y-3 prose prose-invert max-w-none">
                <Markdown>{stressTestResult.detailedMarkdownReport}</Markdown>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
