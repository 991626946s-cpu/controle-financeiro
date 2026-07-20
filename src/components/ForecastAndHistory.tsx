import React, { useState, useMemo } from 'react';
import { AppState, AVAILABLE_CURRENCIES, CATEGORIES, getTransactionPaymentDate } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  LineChart as LineIcon,
  PiggyBank, 
  ArrowRight,
  Sparkles,
  Info,
  Lightbulb,
  Target,
  Flame,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface CategorySavingConfig {
  flexibility: 'Alta' | 'Média' | 'Baixa';
  flexibilityColor: string;
  factor: number;
  tips: string[];
}

const SAVING_CONFIGS: { [cat: string]: CategorySavingConfig } = {
  'Alimentação': {
    flexibility: 'Alta',
    flexibilityColor: 'text-rose-600 bg-rose-50 border-rose-100',
    factor: 1.2,
    tips: [
      'Reduza jantares fora nos fins de semana.',
      'Planeje compras de supermercado com uma lista rigorosa.',
      'Substitua marcas premium por marcas próprias de supermercado.',
      'Leve marmita para o trabalho de vez em quando.'
    ]
  },
  'Lazer': {
    flexibility: 'Alta',
    flexibilityColor: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    factor: 1.5,
    tips: [
      'Busque eventos culturais gratuitos em sua cidade.',
      'Aproveite promoções de cinema (meia-entrada ou dias mais baratos).',
      'Prefira receber amigos em casa em vez de ir a bares caros.',
      'Monitore e limite os gastos em festas ou shows.'
    ]
  },
  'Compras': {
    flexibility: 'Alta',
    flexibilityColor: 'text-amber-700 bg-amber-50 border-amber-100',
    factor: 1.4,
    tips: [
      'Espere 24 a 48 horas antes de finalizar qualquer compra por impulso.',
      'Use extensões de cupons de desconto antes do checkout online.',
      'Compare preços em pelo menos 3 lojas diferentes.',
      'Crie uma lista de "desejos" e compre apenas em datas promocionais.'
    ]
  },
  'Assinaturas': {
    flexibility: 'Alta',
    flexibilityColor: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    factor: 1.3,
    tips: [
      'Faça um pente fino nas cobranças recorrentes do cartão.',
      'Cancele streamings que você não assiste há mais de 2 semanas.',
      'Compartilhe planos familiares com amigos ou parentes.',
      'Verifique se há planos anuais com desconto vantajoso.'
    ]
  },
  'Viagem': {
    flexibility: 'Alta',
    flexibilityColor: 'text-teal-700 bg-teal-50 border-teal-100',
    factor: 1.2,
    tips: [
      'Reserve passagens com pelo menos 60 dias de antecedência.',
      'Prefira viajar em baixa temporada ou dias de semana.',
      'Use milhas aéreas acumuladas para voos e hotéis.',
      'Considere hospedagens alternativas ou hostels bem avaliados.'
    ]
  },
  'Presentes': {
    flexibility: 'Alta',
    flexibilityColor: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100',
    factor: 1.1,
    tips: [
      'Defina um teto máximo de gasto para presentes de aniversários.',
      'Dê preferência a lembranças feitas à mão ou jantares compartilhados.',
      'Planeje presentes de datas comemorativas com antecedência.',
      'Faça amigo secreto para reduzir o número de presentes no Natal.'
    ]
  },
  'Transporte': {
    flexibility: 'Média',
    flexibilityColor: 'text-blue-700 bg-blue-50 border-blue-100',
    factor: 0.6,
    tips: [
      'Tente intercalar o uso do carro próprio com transporte público.',
      'Considere aplicativos de carona compartilhada.',
      'Utilize bandeiras tarifárias mais baratas ou evite horários de pico.',
      'Verifique se caminhadas rápidas podem substituir trajetos curtos.'
    ]
  },
  'Outros': {
    flexibility: 'Média',
    flexibilityColor: 'text-gray-700 bg-gray-50 border-gray-150',
    factor: 0.8,
    tips: [
      'Revise as despesas diversas e veja se alguma é supérflua.',
      'Tente arredondar para baixo os trocos ou pequenos gastos diários.',
      'Evite pagar tarifas bancárias desnecessárias migrando para contas digitais.',
      'Evite juros e multas pagando todas as contas no vencimento.'
    ]
  },
  'Moradia': {
    flexibility: 'Baixa',
    flexibilityColor: 'text-slate-700 bg-slate-50 border-slate-150',
    factor: 0.1,
    tips: [
      'Reduza o tempo de banho para economizar água e luz.',
      'Substitua lâmpadas comuns por LED de alta eficiência.',
      'Desligue aparelhos em standby nas tomadas quando viajar.',
      'Negocie o aluguel ou condomínio se houver margem comercial.'
    ]
  },
  'Saúde': {
    flexibility: 'Baixa',
    flexibilityColor: 'text-rose-700 bg-rose-50 border-rose-150',
    factor: 0.05,
    tips: [
      'Pesquise preços de medicamentos em farmácias populares.',
      'Optar por medicamentos genéricos sempre que autorizados pelo médico.',
      'Aproveite os programas de fidelidade das redes de farmácias.',
      'Mantenha exames preventivos em dia para evitar tratamentos custosos.'
    ]
  },
  'Educação': {
    flexibility: 'Baixa',
    flexibilityColor: 'text-purple-700 bg-purple-50 border-purple-150',
    factor: 0.1,
    tips: [
      'Busque livros acadêmicos ou apostilas em formato digital ou sebos.',
      'Aproveite cursos online gratuitos para complementar sua formação.',
      'Pesquise bolsas de estudo, descontos por pontualidade ou incentivos.',
      'Compartilhe assinaturas de plataformas de pesquisa se permitido.'
    ]
  },
  'Investimentos': {
    flexibility: 'Baixa',
    flexibilityColor: 'text-cyan-700 bg-cyan-50 border-cyan-150',
    factor: 0.0,
    tips: [
      'Investimento não deve ser cortado, encare como despesa prioritária.',
      'Revise taxas de administração e migre para corretoras taxa zero.',
      'Diversifique para mitigar riscos desnecessários.'
    ]
  }
};

interface ForecastAndHistoryProps {
  state: AppState;
  convertAmount: (amount: number, from: string, to: string) => number;
  updateBudget?: (category: string, limit: number) => void;
}

export default function ForecastAndHistory({ state, convertAmount, updateBudget }: ForecastAndHistoryProps) {
  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // Configuração dos sliders de simulação
  const [incPercent, setIncPercent] = useState<number>(0); // acréscimo de receitas em %
  const [decPercent, setDecPercent] = useState<number>(0); // corte de despesas em %
  const [includeRecurrent, setIncludeRecurrent] = useState<boolean>(true); // incluir médias recorrentes na previsão

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [appliedCategoryBudget, setAppliedCategoryBudget] = useState<string | null>(null);

  // 1. Obter a data atual do sistema (2026-07-17 no nosso caso)
  const currentDate = new Date('2026-07-17');
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (6 para julho)

  // Função auxiliar para gerar rótulos legíveis de meses (ex: "Jul/26")
  const getMonthLabel = (year: number, monthIndex: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[monthIndex]}/${String(year).substring(2)}`;
  };

  // Função para criar chave YYYY-MM
  const getMonthKey = (year: number, monthIndex: number) => {
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  };

  // 2. Processar Histórico e Previsão
  const data = useMemo(() => {
    // Definimos os meses para o histórico (6 meses antes do atual)
    const historyMonths: { year: number; month: number; key: string; label: string; isForecast: boolean }[] = [];
    for (let i = 5; i >= 1; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      historyMonths.push({
        year: y,
        month: m,
        key: getMonthKey(y, m),
        label: getMonthLabel(y, m),
        isForecast: false,
      });
    }

    // Mês atual (Julho/26)
    historyMonths.push({
      year: currentYear,
      month: currentMonth,
      key: getMonthKey(currentYear, currentMonth),
      label: `${getMonthLabel(currentYear, currentMonth)} (Atual)`,
      isForecast: false,
    });

    // Meses de previsão (6 meses seguintes)
    const forecastMonths: { year: number; month: number; key: string; label: string; isForecast: boolean }[] = [];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      forecastMonths.push({
        year: y,
        month: m,
        key: getMonthKey(y, m),
        label: getMonthLabel(y, m),
        isForecast: true,
      });
    }

    // Agrupar transações reais por mês
    const monthlyActuals: { [key: string]: { income: number; expense: number; list: any[] } } = {};
    
    // Inicializar as chaves para todos os meses do histórico e previsão
    const allMonths = [...historyMonths, ...forecastMonths];
    allMonths.forEach(m => {
      monthlyActuals[m.key] = { income: 0, expense: 0, list: [] };
    });

    state.transactions.forEach((tx) => {
      const isCreditCard = tx.paymentMethod === 'credito' && tx.creditCardId;
      const paymentDate = isCreditCard 
        ? getTransactionPaymentDate(tx, state.creditCards || [])
        : tx.date;

      const txDate = new Date(paymentDate);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();
      const key = getMonthKey(txYear, txMonth);
      const val = convertAmount(tx.amount, tx.currency, baseCurrency);

      if (!monthlyActuals[key]) {
        monthlyActuals[key] = { income: 0, expense: 0, list: [] };
      }

      monthlyActuals[key].list.push(tx);
      if (tx.type === 'income') {
        monthlyActuals[key].income += val;
      } else {
        monthlyActuals[key].expense += val;
      }
    });

    // Calcular as médias históricas (excluindo o mês atual para evitar distorções de mês incompleto)
    const completedHistory = historyMonths.slice(0, -1);
    let totalHistIncome = 0;
    let totalHistExpense = 0;
    
    completedHistory.forEach(h => {
      const act = monthlyActuals[h.key] || { income: 0, expense: 0 };
      totalHistIncome += act.income;
      totalHistExpense += act.expense;
    });

    let avgIncome = completedHistory.length > 0 ? totalHistIncome / completedHistory.length : 0;
    let avgExpense = completedHistory.length > 0 ? totalHistExpense / completedHistory.length : 0;

    // Fallback robusto se nenhum histórico de meses anteriores contiver dados
    if (avgIncome === 0 && avgExpense === 0) {
      const activeMonths = Object.keys(monthlyActuals).filter(
        k => monthlyActuals[k].income > 0 || monthlyActuals[k].expense > 0
      );
      if (activeMonths.length > 0) {
        let totalActIncome = 0;
        let totalActExpense = 0;
        activeMonths.forEach(k => {
          totalActIncome += monthlyActuals[k].income;
          totalActExpense += monthlyActuals[k].expense;
        });
        avgIncome = totalActIncome / activeMonths.length;
        avgExpense = totalActExpense / activeMonths.length;
      }
    }

    // Montar os dados finais mesclando histórico real e previsões com simulações
    let runningBalance = 0;

    // Primeiro, vamos calcular o saldo inicial antes do período do histórico para que o saldo acumulado faça sentido
    // Vamos somar todas as transações anteriores ao primeiro mês do histórico
    if (historyMonths.length > 0) {
      const firstHistKey = historyMonths[0].key;
      const firstHistDate = new Date(`${firstHistKey}-01`);
      
      state.transactions.forEach(tx => {
        const isCreditCard = tx.paymentMethod === 'credito' && tx.creditCardId;
        const paymentDate = isCreditCard 
          ? getTransactionPaymentDate(tx, state.creditCards || [])
          : tx.date;
        const txDate = new Date(paymentDate);
        if (txDate < firstHistDate) {
          const val = convertAmount(tx.amount, tx.currency, baseCurrency);
          if (tx.type === 'income') {
            runningBalance += val;
          } else {
            runningBalance -= val;
          }
        }
      });
    }

    const chartPoints = allMonths.map((m) => {
      const act = monthlyActuals[m.key] || { income: 0, expense: 0, list: [] };
      
      let finalIncome = 0;
      let finalExpense = 0;

      if (!m.isForecast) {
        // Histórico real
        finalIncome = act.income;
        finalExpense = act.expense;
      } else {
        // Previsão
        // 1. Inicia com o que já está cadastrado de forma real futura (ex: parcelas futuras!)
        const realFutureIncome = act.income;
        const realFutureExpense = act.expense;

        // Separar despesas futuras em flexíveis (cortáveis) e fixas
        let realFutureFlexibleExpense = 0;
        let realFutureFixedExpense = 0;

        if (act.list && act.list.length > 0) {
          act.list.forEach((tx: any) => {
            if (tx.type === 'expense') {
              const val = convertAmount(tx.amount, tx.currency, baseCurrency);
              if (['Alimentação', 'Lazer', 'Compras', 'Assinaturas', 'Viagem', 'Presentes', 'Outros'].includes(tx.category)) {
                realFutureFlexibleExpense += val;
              } else {
                realFutureFixedExpense += val;
              }
            }
          });
        } else {
          // Fallback se não houver lista: assume 60% flexível e 40% fixo
          realFutureFlexibleExpense = realFutureExpense * 0.6;
          realFutureFixedExpense = realFutureExpense * 0.4;
        }

        // Aplica o corte simulado diretamente nas despesas flexíveis reais futuras
        const cutRealFlexibleExpense = realFutureFlexibleExpense * (1 - decPercent / 100);

        // 2. Se habilitado, soma a média histórica de despesa e receita, aplicando as simulações
        let estimatedIncome = 0;
        let estimatedExpense = 0;

        if (includeRecurrent) {
          // Aplica acréscimo de receita do simulador
          const simulatedAvgIncome = avgIncome * (1 + incPercent / 100);
          estimatedIncome = Math.max(0, simulatedAvgIncome - realFutureIncome);

          // Aplica redução de despesa do simulador
          const simulatedAvgExpense = avgExpense * (1 - decPercent / 100);
          // O gap estimado a ser adicionado se a média simulada for maior do que o que já temos de real futuro cortado
          estimatedExpense = Math.max(0, simulatedAvgExpense - cutRealFlexibleExpense - realFutureFixedExpense);
        }

        finalIncome = realFutureIncome + estimatedIncome;
        finalExpense = realFutureFixedExpense + cutRealFlexibleExpense + estimatedExpense;
      }

      const balance = finalIncome - finalExpense;
      runningBalance += balance;

      return {
        key: m.key,
        name: m.label,
        isForecast: m.isForecast,
        // Valores reais para exibição detalhada
        Receita: Math.round(finalIncome * 100) / 100,
        Despesa: Math.round(finalExpense * 100) / 100,
        Saldo: Math.round(balance * 100) / 100,
        Acumulado: Math.round(runningBalance * 100) / 100,
        realFutureIncome: Math.round((m.isForecast ? act.income : 0) * 100) / 100,
        realFutureExpense: Math.round((m.isForecast ? act.expense : 0) * 100) / 100,
      };
    });

    return {
      points: chartPoints,
      avgIncome: Math.round(avgIncome * 100) / 100,
      avgExpense: Math.round(avgExpense * 100) / 100,
    };
  }, [state.transactions, convertAmount, baseCurrency, incPercent, decPercent, includeRecurrent, currentYear, currentMonth]);

  const categoryAnalysis = useMemo(() => {
    // 1. Get history months
    const historyMonths: string[] = [];
    for (let i = 5; i >= 1; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      historyMonths.push(`${y}-${String(m + 1).padStart(2, '0')}`);
    }

    // 2. Sum expenses per category
    const categoryTotals: { [cat: string]: number } = {};
    
    let hasHistory = false;
    state.transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const txDate = new Date(tx.date);
      const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      if (historyMonths.includes(key)) {
        hasHistory = true;
      }
    });

    const targetMonths = hasHistory ? historyMonths : Array.from(new Set(state.transactions.filter(tx => tx.type === 'expense').map(tx => {
      const txDate = new Date(tx.date);
      return `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    })));

    state.transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const txDate = new Date(tx.date);
      const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      if (targetMonths.includes(key)) {
        const val = convertAmount(tx.amount, tx.currency, baseCurrency);
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + val;
      }
    });

    // 3. Compute averages
    const div = targetMonths.length > 0 ? targetMonths.length : 1;
    const averages: { [cat: string]: number } = {};
    CATEGORIES.forEach((cat) => {
      if (cat.id !== 'Salário') {
        averages[cat.id] = (categoryTotals[cat.id] || 0) / div;
      }
    });

    // 4. Calculate proposed cuts
    const targetSavings = data.avgExpense * (decPercent / 100);
    const suggestedCuts: { [cat: string]: number } = {};
    let allocatedTotal = 0;

    if (targetSavings > 0) {
      // Calculate weights
      const weights: { [cat: string]: number } = {};
      let totalWeight = 0;

      CATEGORIES.forEach((cat) => {
        if (cat.id === 'Salário') return;
        const avg = averages[cat.id] || 0;
        if (avg <= 0) return;

        const config = SAVING_CONFIGS[cat.id] || { factor: 0.5 };
        const w = avg * config.factor;
        weights[cat.id] = w;
        totalWeight += w;
      });

      if (totalWeight > 0) {
        let remainder = targetSavings;
        const activeCats = Object.keys(weights);

        // Run 3 iterations of allocation and capping
        for (let iter = 0; iter < 3 && remainder > 0.1; iter++) {
          let iterWeightSum = 0;
          activeCats.forEach((catId) => {
            const currentCut = suggestedCuts[catId] || 0;
            const avg = averages[catId] || 0;
            const flexibility = SAVING_CONFIGS[catId]?.flexibility || 'Média';
            const maxCutFraction = flexibility === 'Alta' ? 0.85 : flexibility === 'Média' ? 0.50 : 0.15;
            const maxCut = avg * maxCutFraction;

            if (currentCut < maxCut) {
              iterWeightSum += weights[catId];
            }
          });

          if (iterWeightSum === 0) break;

          let allocatedInThisIter = 0;
          activeCats.forEach((catId) => {
            const currentCut = suggestedCuts[catId] || 0;
            const avg = averages[catId] || 0;
            const flexibility = SAVING_CONFIGS[catId]?.flexibility || 'Média';
            const maxCutFraction = flexibility === 'Alta' ? 0.85 : flexibility === 'Média' ? 0.50 : 0.15;
            const maxCut = avg * maxCutFraction;

            if (currentCut < maxCut) {
              const share = remainder * (weights[catId] / iterWeightSum);
              const newCut = Math.min(maxCut, currentCut + share);
              allocatedInThisIter += (newCut - currentCut);
              suggestedCuts[catId] = newCut;
            }
          });

          remainder -= allocatedInThisIter;
          allocatedTotal += allocatedInThisIter;
        }
      }
    }

    return {
      averages,
      suggestedCuts,
      allocatedTotal: Math.round(allocatedTotal * 100) / 100,
      targetSavings: Math.round(targetSavings * 100) / 100
    };
  }, [state.transactions, convertAmount, baseCurrency, decPercent, data.avgExpense, currentYear, currentMonth]);

  const topDiscretionaryExpenses = useMemo(() => {
    return state.transactions
      .filter(tx => tx.type === 'expense' && ['Alimentação', 'Lazer', 'Compras', 'Assinaturas', 'Viagem', 'Presentes', 'Outros'].includes(tx.category))
      .map(tx => ({
        ...tx,
        valBase: convertAmount(tx.amount, tx.currency, baseCurrency)
      }))
      .sort((a, b) => b.valBase - a.valBase)
      .slice(0, 3);
  }, [state.transactions, convertAmount, baseCurrency]);

  const formatValue = (val: number) => {
    return `${baseCurrencySymbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Encontrar o saldo acumulado projetado final
  const finalProjectedAccumulated = data.points[data.points.length - 1]?.Acumulado || 0;
  const currentActualAccumulated = data.points.find(p => p.name.includes('(Atual)'))?.Acumulado || 0;
  const differenceAccumulated = finalProjectedAccumulated - currentActualAccumulated;

  // Filtrar meses de previsão com saldo negativo
  const negativeForecastMonths = data.points.filter(p => p.isForecast && p.Saldo < 0);

  return (
    <div className="space-y-6" id="forecast-tab">
      
      {/* Top Welcome Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Histórico & Previsão Financeira
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            Acompanhe o desempenho dos meses passados e planeje o futuro com base em projeções inteligentes e parcelamentos cadastrados.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <div className="text-xs font-semibold text-blue-900">
            Moeda base: <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{baseCurrency}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulator Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm">Simulador de Metas</h3>
          </div>

          {/* Toggle Recurrent Expense projection */}
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeRecurrent}
                onChange={(e) => setIncludeRecurrent(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-gray-800 block">Projetar Custos Recorrentes</span>
                <span className="text-[10px] text-gray-400 block leading-tight">
                  Preenche os meses futuros usando a média de despesas/receitas passadas.
                </span>
              </div>
            </label>
          </div>

          {includeRecurrent && (
            <div className="space-y-5 pt-3 border-t border-gray-100">
              {/* Media Card */}
              <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Média de Receita:</span>
                  <span className="font-semibold text-emerald-600 font-mono">{formatValue(data.avgIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Média de Despesa:</span>
                  <span className="font-semibold text-rose-600 font-mono">{formatValue(data.avgExpense)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/80 pt-1.5 font-semibold text-[11px]">
                  <span className="text-gray-600">Saldo Médio Real:</span>
                  <span className={`${data.avgIncome - data.avgExpense >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-mono`}>
                    {formatValue(data.avgIncome - data.avgExpense)}
                  </span>
                </div>
              </div>

              {/* Slider 1: Income change */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Meta de Receita
                  </span>
                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                    +{incPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIncPercent(Math.max(0, incPercent - 5))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-250 flex items-center justify-center font-bold text-sm cursor-pointer select-none text-gray-700 shrink-0 active:scale-90 transition-transform"
                    title="Diminuir"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={incPercent}
                    onChange={(e) => setIncPercent(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIncPercent(Math.min(50, incPercent + 5))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-250 flex items-center justify-center font-bold text-sm cursor-pointer select-none text-gray-700 shrink-0 active:scale-90 transition-transform"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
                {/* Touch Presets */}
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {[0, 10, 20, 30, 40, 50].map((p) => (
                    <button
                      key={`inc-p-${p}`}
                      type="button"
                      onClick={() => setIncPercent(p)}
                      className={`px-2 py-1 text-[10px] font-mono rounded-md border cursor-pointer transition ${
                        incPercent === p
                          ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 block leading-normal">
                  Simula um aumento planejado nas fontes de renda ou investimentos para os meses seguintes.
                </span>
              </div>

              {/* Slider 2: Expense cuts */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-700 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    Corte de Despesas
                  </span>
                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-mono">
                    -{decPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDecPercent(Math.max(0, decPercent - 5))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-250 flex items-center justify-center font-bold text-sm cursor-pointer select-none text-gray-700 shrink-0 active:scale-90 transition-transform"
                    title="Diminuir"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={decPercent}
                    onChange={(e) => setDecPercent(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setDecPercent(Math.min(50, decPercent + 5))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-250 flex items-center justify-center font-bold text-sm cursor-pointer select-none text-gray-700 shrink-0 active:scale-90 transition-transform"
                    title="Aumentar"
                  >
                    +
                  </button>
                </div>
                {/* Touch Presets */}
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {[0, 10, 20, 30, 40, 50].map((p) => (
                    <button
                      key={`dec-p-${p}`}
                      type="button"
                      onClick={() => setDecPercent(p)}
                      className={`px-2 py-1 text-[10px] font-mono rounded-md border cursor-pointer transition ${
                        decPercent === p
                          ? 'bg-rose-600 border-rose-600 text-white font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 block leading-normal">
                  Simula um planejamento de redução de gastos desnecessários por meio de orçamento rigoroso.
                </span>

                {decPercent > 0 && (
                  <div className="mt-4 p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-3 animate-fade-in text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block mb-1">
                        Sugestões de Cortes ({decPercent}% de Redução)
                      </span>
                      <p className="text-[10px] text-gray-500 leading-normal mb-2">
                        Com base na sua média histórica de {formatValue(data.avgExpense)}/mês, propomos os seguintes tetos de gastos para economizar <strong className="text-rose-700">{formatValue(categoryAnalysis.targetSavings)}</strong> por mês:
                      </p>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {CATEGORIES.filter(c => c.id !== 'Salário').map((cat) => {
                        const avg = categoryAnalysis.averages[cat.id] || 0;
                        const cut = categoryAnalysis.suggestedCuts[cat.id] || 0;
                        if (cut <= 0) return null;
                        
                        const targetLimit = Math.max(0, avg - cut);
                        const pctOfCat = avg > 0 ? (cut / avg) * 100 : 0;

                        return (
                          <div key={cat.id} className="p-2 bg-white rounded-lg border border-rose-100/50 flex flex-col gap-1 shadow-2xs">
                            <div className="flex items-center justify-between font-medium">
                              <span className="text-gray-700 flex items-center gap-1.5 font-sans">
                                <span className="text-sm select-none">{cat.emoji}</span>
                                <span className="truncate max-w-[100px]">{cat.label}</span>
                              </span>
                              <span className="text-rose-600 font-bold font-mono">
                                -{formatValue(cut)} (-{pctOfCat.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-sans">
                              <span>Média: {formatValue(avg)}</span>
                              <span>Novo Teto: <strong className="text-gray-800 font-mono font-bold">{formatValue(targetLimit)}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-rose-200/50 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-gray-600">
                        <span>Nova Despesa Média:</span>
                        <span className="font-mono font-semibold text-gray-800">
                          {formatValue(Math.max(0, data.avgExpense - categoryAnalysis.targetSavings))}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Novo Saldo Médio:</span>
                        <span className={`font-mono font-bold ${(data.avgIncome - (data.avgExpense - categoryAnalysis.targetSavings)) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatValue(data.avgIncome - (data.avgExpense - categoryAnalysis.targetSavings))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="bg-slate-900 p-4 rounded-xl text-white relative overflow-hidden">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Acumulado Final Projetado</span>
              <span className="text-lg font-bold font-mono tracking-tight block mt-0.5">
                {formatValue(finalProjectedAccumulated)}
              </span>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-300">
                <span className={`font-semibold ${differenceAccumulated >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {differenceAccumulated >= 0 ? '▲ Crescerá' : '▼ Diminuirá'} {formatValue(Math.abs(differenceAccumulated))}
                </span>
                <span>em 6 meses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Central/Right Chart Container */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Projeção Mensal de Caixa</h3>
              <p className="text-xs text-gray-400">Linhas contínuas mostram dados passados, colunas futuras mostram a evolução</p>
            </div>
            {/* Legend Indicators */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-500 rounded-sm" />
                <span className="text-gray-500 font-medium">Saldo do Mês</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 bg-amber-500 rounded-sm inline-block border-t border-dashed" />
                <span className="text-gray-500 font-medium">Acumulado</span>
              </div>
            </div>
          </div>

          {/* Recharts Composed Chart */}
          <div className="h-72 w-full flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.points}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
                  tickFormatter={(v) => `${baseCurrencySymbol}${Math.round(v)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const isFc = props.payload.isForecast;
                    const suffix = isFc ? " (Projeção)" : "";
                    return [formatValue(Number(value)), `${name}${suffix}`];
                  }}
                />
                <Bar 
                  dataKey="Receita" 
                  name="Receita" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.8}
                  maxBarSize={20}
                />
                <Bar 
                  dataKey="Despesa" 
                  name="Despesa" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  opacity={0.8}
                  maxBarSize={20}
                />
                <Line 
                  type="monotone" 
                  dataKey="Saldo" 
                  name="Saldo Líquido" 
                  stroke="#6366f1" 
                  strokeWidth={2.5}
                  dot={{ r: 3, stroke: '#6366f1', strokeWidth: 1, fill: '#ffffff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Acumulado" 
                  name="Evolução Acumulada" 
                  fill="url(#colorAcumulado)" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <defs>
                  <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 💡 Plano de Economia Sugerido baseada no Histórico de Despesas */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950 font-sans tracking-tight">
                Plano de Economia Sugerido (Baseado no seu Histórico)
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                Estudamos suas despesas médias mensais e calculamos onde os cortes selecionados de <span className="font-bold text-rose-600">-{decPercent}%</span> trarão maior impacto prático.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 font-sans">Meta de Economia:</span>
            <span className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold font-mono">
              {formatValue(categoryAnalysis.targetSavings)}/mês
            </span>
          </div>
        </div>

        {decPercent === 0 ? (
          <div className="py-12 px-4 text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 bg-slate-50 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 mx-auto">
              <Sliders className="w-6 h-6 animate-pulse text-blue-500" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">Pronto para criar sua Meta de Economia?</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arraste o slider de <strong>"Corte de Despesas"</strong> no simulador à esquerda para projetar e detalhar automaticamente as oportunidades de corte com base no seu perfil financeiro real.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Allocation summary meter */}
            <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-semibold flex items-center gap-1">
                  <Target className="w-4 h-4 text-blue-600" />
                  Alocação do Planejamento de Gastos
                </span>
                <span className="font-bold text-gray-900 font-mono text-right">
                  {formatValue(categoryAnalysis.allocatedTotal)} sugeridos de {formatValue(categoryAnalysis.targetSavings)} esperados
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (categoryAnalysis.allocatedTotal / (categoryAnalysis.targetSavings || 1)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 leading-normal">
                Nosso assistente priorizou gastos flexíveis (Lazer, Assinaturas, Compras e Alimentação) e blindou categorias essenciais (Moradia, Saúde, Educação) para que sua economia seja perfeitamente realista e viável.
              </p>
            </div>

            {/* List of categories with proposed cuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.filter(c => c.id !== 'Salário').map((cat) => {
                const avg = categoryAnalysis.averages[cat.id] || 0;
                const cut = categoryAnalysis.suggestedCuts[cat.id] || 0;
                
                // Only show categories that have actual historical spending to make recommendations hyper-relevant
                if (avg <= 0) return null;

                const config = SAVING_CONFIGS[cat.id] || { flexibility: 'Média', flexibilityColor: 'bg-gray-150 text-gray-700 border-gray-200', tips: [] };
                const percentageOfCategory = avg > 0 ? (cut / avg) * 100 : 0;
                const targetLimit = Math.max(0, avg - cut);

                // Find a tip based on category name
                const tip = config.tips[Math.floor((cat.id.charCodeAt(0) + (cat.id.charCodeAt(1) || 0)) % config.tips.length)];

                return (
                  <div 
                    key={cat.id}
                    className={`border rounded-2xl transition-all duration-200 ${
                      cut > 0 
                        ? 'bg-white border-blue-100 shadow-xs hover:border-blue-200 hover:shadow-sm' 
                        : 'bg-gray-50/50 border-gray-150 opacity-60'
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl w-10 h-10 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 select-none">
                          {cat.emoji}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-950 truncate flex items-center gap-1.5">
                            <span>{cat.label}</span>
                            <span className={`px-1.5 py-0.2 border rounded text-[8px] font-extrabold uppercase tracking-wider shrink-0 ${config.flexibilityColor}`}>
                              {config.flexibility}
                            </span>
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Média mensal: <span className="font-mono font-bold text-gray-700">{formatValue(avg)}</span>
                          </p>
                        </div>
                      </div>

                      {cut > 0 ? (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-rose-600 font-mono block">
                            -{formatValue(cut)}
                          </span>
                          <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-100/50 px-1.5 py-0.5 rounded-full font-bold">
                            -{percentageOfCategory.toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Sem cortes</span>
                      )}
                    </div>

                    {cut > 0 && (
                      <div className="border-t border-gray-50 px-4 py-3 bg-slate-50/30 rounded-b-2xl space-y-2.5">
                        <div className="flex items-start gap-1.5 text-[11px] text-gray-600 leading-relaxed">
                          <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p>
                            <strong>Ação prática:</strong> {tip}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100/60 pt-2.5">
                          <div className="text-[10px] text-gray-500">
                            Teto sugerido: <span className="font-mono font-bold text-gray-800">{formatValue(targetLimit)}</span>
                          </div>

                          {updateBudget && (
                            <button
                              type="button"
                              onClick={() => {
                                updateBudget(cat.id, Math.round(targetLimit));
                                setAppliedCategoryBudget(cat.id);
                                setTimeout(() => setAppliedCategoryBudget(null), 2500);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
                                appliedCategoryBudget === cat.id
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300'
                              }`}
                            >
                              {appliedCategoryBudget === cat.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Limite Adotado!</span>
                                </>
                              ) : (
                                <>
                                  <Target className="w-3 h-3 text-blue-500 animate-pulse" />
                                  <span>Adotar Orçamento</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom AI High-Impact Transactions Insight box */}
            {topDiscretionaryExpenses.length > 0 && (
              <div className="p-4 bg-indigo-50/30 border border-indigo-100/30 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  Seus 3 maiores lançamentos em categorias flexíveis
                </h4>
                <p className="text-[11px] text-gray-500 -mt-1 leading-normal">
                  Reduzir compras recorrentes ou otimizar a frequência destas despesas específicas trará economia imediata na sua média mensal:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {topDiscretionaryExpenses.map((tx) => (
                    <div key={tx.id} className="p-3 bg-white border border-indigo-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-start gap-1">
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold uppercase tracking-wider">
                          {tx.category}
                        </span>
                        <span className="font-mono font-bold text-rose-600">{formatValue(tx.valBase)}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-800 line-clamp-1" title={tx.description}>
                        "{tx.description}"
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Pago em <span className="font-medium font-mono">{tx.date}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warnings & Insights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Negative month warning & forecast tips */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${negativeForecastMonths.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            Alertas de Fluxo de Caixa Futuro
          </h4>

          {negativeForecastMonths.length > 0 ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 flex items-start gap-2.5 leading-normal">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Atenção para meses deficitários!</span>
                  As projeções indicam que você terá despesas maiores do que receitas nos meses de: <span className="font-semibold">{negativeForecastMonths.map(p => p.name).join(', ')}</span>.
                </div>
              </div>
              <p className="text-gray-500 leading-normal">
                <strong>Sugestão prática:</strong> Considere antecipar receitas, negociar compras parceladas ou reduzir gastos flexíveis (como Lazer e Alimentação fora de casa) para manter seu caixa positivo nesses períodos.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 flex items-start gap-2.5 leading-normal">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Excelente saúde de caixa projetada!</span>
                  Com o padrão de consumo atual, você não possui previsão de meses no vermelho nos próximos 6 meses.
                </div>
              </div>
              <p className="text-gray-500 leading-normal">
                Continue monitorando seus limites orçamentários. Este é um ótimo momento para criar um orçamento para novos investimentos ou acelerar sua reserva de emergência!
              </p>
            </div>
          )}
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col">
          <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Tabela Detalhada (Histórico vs Projeção)
          </h4>

          <div className="overflow-x-auto flex-1 max-h-[220px] scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-medium">
                  <th className="py-2 font-semibold">Mês</th>
                  <th className="py-2 text-right font-semibold">Receitas</th>
                  <th className="py-2 text-right font-semibold">Despesas</th>
                  <th className="py-2 text-right font-semibold">Saldo</th>
                  <th className="py-2 text-right font-semibold">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {data.points.map((p, index) => {
                  const isCurrent = p.name.includes('(Atual)');
                  return (
                    <tr 
                      key={p.key} 
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition ${
                        p.isForecast ? 'text-gray-500 bg-slate-50/20' : 'text-gray-800'
                      } ${isCurrent ? 'bg-blue-50/30 font-semibold text-blue-900' : ''}`}
                    >
                      <td className="py-2 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isForecast ? 'bg-amber-400' : 'bg-green-500'}`} />
                        {p.name}
                      </td>
                      <td className="py-2 text-right text-emerald-600 font-mono">
                        {formatValue(p.Receita)}
                      </td>
                      <td className="py-2 text-right text-rose-600 font-mono">
                        {formatValue(p.Despesa)}
                      </td>
                      <td className={`py-2 text-right font-mono ${p.Saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {p.Saldo >= 0 ? '+' : ''}{formatValue(p.Saldo)}
                      </td>
                      <td className="py-2 text-right font-mono font-medium">
                        {formatValue(p.Acumulado)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
