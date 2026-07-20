import React, { useState } from 'react';
import { AppState } from '../types';
import { Sparkles, Brain, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIInsightsProps {
  state: AppState;
}

export default function AIInsights({ state }: AIInsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: state.transactions,
          budgets: state.budgets,
          preferences: state.preferences,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro inesperado ao gerar a análise.');
      }

      setInsight(data.insight);
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 'Houve um erro ao se conectar com o consultor financeiro do Gemini.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-insights-tab">
      {/* Intro card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-950 font-sans tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span>Consultoria de Gastos IA (Gemini)</span>
          </h2>
          <p className="text-sm text-gray-500 font-sans max-w-2xl mt-1">
            Receba análises estratégicas do seu comportamento financeiro de forma inteligente. O Gemini examinará suas receitas, despesas e categorias de orçamentos para fornecer recomendações e alertas acionáveis em tempo real.
          </p>
        </div>
      </div>

      {/* Main interface area */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 min-h-[300px] flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center max-w-sm space-y-2">
              <h4 className="font-bold text-gray-900 font-sans">Analisando sua vida financeira...</h4>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                O Gemini está calculando médias diárias, cruzando dados de orçamentos por categorias e gerando dicas estratégicas personalizadas para você.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 max-w-xl mx-auto space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600">
              <AlertCircle className="w-10 h-10 stroke-1" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-bold text-gray-900 font-sans">Falha na Conexão com a Inteligência Artificial</h4>
              <p className="text-xs text-gray-500 font-sans">
                {error}
              </p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-600 space-y-2 w-full">
              <p className="font-semibold flex items-center gap-1 text-gray-700">
                <HelpCircle className="w-4 h-4 text-gray-500" />
                <span>Como configurar a Chave de API (Gemini)?</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>Abra o menu de <strong>Configurações / Secrets</strong> na barra superior do AI Studio.</li>
                <li>Adicione uma chave chamada <code className="font-mono bg-white px-1.5 py-0.5 rounded border">GEMINI_API_KEY</code>.</li>
                <li>Cole sua chave gerada no Google AI Studio e salve.</li>
              </ol>
            </div>
            <button
              onClick={generateReport}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        ) : insight ? (
          <div className="space-y-6">
            {/* Header of analysis */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Relatório Consolidado Gerado</span>
              </span>
              <button
                onClick={generateReport}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalcular Relatório</span>
              </button>
            </div>

            {/* Markdown rendered area */}
            <div className="markdown-body text-gray-800 text-sm leading-relaxed space-y-4">
              <Markdown>{insight}</Markdown>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-5">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shadow-xs">
              <Brain className="w-12 h-12 stroke-1" />
            </div>
            <div className="text-center max-w-sm space-y-1.5">
              <h4 className="font-bold text-gray-900 font-sans">Gerar Diagnóstico Mensal de Finanças</h4>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                Clique no botão abaixo para permitir que a Inteligência Artificial do Google Gemini estude suas tendências de consumo e gere conselhos práticos para sua economia.
              </p>
            </div>
            <button
              onClick={generateReport}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Solicitar Análise Inteligente</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
