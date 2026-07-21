import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Calendar, 
  Filter, 
  Download, 
  FileText, 
  Building2, 
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';

interface DashboardProps {
  userName?: string;
  syncCode?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  userName = "Samuel", 
  syncCode = "SYNC-D7DBDY" 
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Cabeçalho de Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Olá, {userName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sua conta está sincronizada no código <span className="font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{syncCode}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4 text-gray-500" />
            Exportar CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm">
            <FileText className="w-4 h-4 text-gray-500" />
            Imprimir PDF
          </button>
        </div>
      </div>

      {/* Cards de Resumo Principal com Estilo Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card de Saldo Consolidado (Escuro / Destaque) */}
        <div className="card-saldo-consolidado p-6 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Saldo Consolidado</span>
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Wallet className="w-5 h-5 text-indigo-300" />
            </div>
          </div>
          <div className="my-6">
            <h2 className="text-3xl font-extrabold tracking-tight">R$ 1.200,00</h2>
            <p className="text-xs text-gray-400 mt-1">Moeda padrão: <span className="font-semibold text-gray-300">BRL</span></p>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <Wallet className="w-40 h-40 text-white" />
          </div>
        </div>

        {/* Card de Receitas Efetivadas */}
        <div className="card-metrica-claro p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Receitas Efetivadas</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="my-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">R$ 1.200,00</h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>Entradas pagas registradas</span>
            </div>
          </div>
        </div>

        {/* Card de Despesas Efetivadas */}
        <div className="card-metrica-claro p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Despesas Efetivadas</span>
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="my-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">R$ 0,00</h2>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
              <span>Saídas pagas registradas</span>
            </div>
          </div>
        </div>

      </div>

      {/* Seção de Saldos de Contas & Previsões */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Saldos de Contas & Previsões</h3>
              <p className="text-xs text-gray-500">Acompanhamento de fluxo de caixa projetado e saldo real de cada conta ou carteira de gastos.</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
            Gerenciar Contas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gráficos / Seção Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Evolução Diária */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Evolução Diária de Transações
            </h3>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">Últimos 7 dias ativos</span>
          </div>
          
          <div className="flex items-center justify-center gap-6 my-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Despesa
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Receita
            </div>
          </div>

          <div className="h-64 flex flex-col justify-end relative pt-6">
            {/* Linhas de grade de fundo */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-gray-100 w-full text-xs text-gray-400 text-right pr-2">1200</div>
              <div className="border-b border-gray-100 w-full text-xs text-gray-400 text-right pr-2">900</div>
              <div className="border-b border-gray-100 w-full text-xs text-gray-400 text-right pr-2">600</div>
              <div className="border-b border-gray-100 w-full text-xs text-gray-400 text-right pr-2">300</div>
              <div className="border-b border-gray-200 w-full text-xs text-gray-400 text-right pr-2">0</div>
            </div>

            {/* Barra de Exemplo */}
            <div className="flex justify-center items-end h-full z-10 pb-6 px-12">
              <div className="w-16 bg-emerald-500 rounded-t-xl transition-all duration-500 hover:bg-emerald-600 shadow-sm h-full max-h-[220px] flex items-center justify-center text-white text-xs font-bold"></div>
            </div>

            <div className="text-center text-xs font-medium text-gray-400 border-t border-gray-100 pt-2">
              07-20
            </div>
          </div>
        </div>

        {/* Distribuição de Despesas */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600" />
              Distribuição de Despesas
            </h3>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">Por categoria</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 bg-gray-50 rounded-full text-gray-300 mb-3">
              <PieChartIcon className="w-8 h-8" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Nenhuma despesa para exibir na distribuição.</p>
          </div>
        </div>

      </div>
    </div>
  );
};