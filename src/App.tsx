import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Menu,
  X,
  FileText,
  LogOut
} from 'lucide-react';
import { supabase } from './supabaseClient';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'cards' | 'investments'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Geral');

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newAmount) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            title: newTitle,
            amount: parseFloat(newAmount),
            type: newType,
            category: newCategory,
            date: new Date().toISOString().split('T')[0]
          }
        ])
        .select();

      if (error) throw error;

      if (data) {
        setTransactions([data[0], ...transactions]);
        setNewTitle('');
        setNewAmount('');
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error.message);
      alert('Erro ao salvar transação no banco de dados: ' + error.message);
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const currentBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Wallet size={22} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">FinancesPro</h2>
              <p className="text-xs text-slate-400">Controle Definitivo</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'transactions', label: 'Transações', icon: Wallet },
              { id: 'cards', label: 'Cartões', icon: CreditCard },
              { id: 'investments', label: 'Investimentos', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-600 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={() => alert('Sistema online')}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm text-slate-600 hover:bg-slate-50 transition-all"
          >
            <LogOut size={18} />
            Conectado
          </button>
        </div>
      </aside>

      {/* Conteúdo Central */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Wallet size={18} />
            </div>
            <h2 className="font-bold text-slate-800">FinancesPro</h2>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 sticky top-[73px] z-10 shadow-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'transactions', label: 'Transações', icon: Wallet },
              { id: 'cards', label: 'Cartões', icon: CreditCard },
              { id: 'investments', label: 'Investimentos', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm ${
                    isActive ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
                  <p className="text-slate-500 text-sm mt-1">Acompanhe suas finanças e fluxo de caixa em tempo real.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-emerald-600/20"
                >
                  <Plus size={18} /> Nova Transação
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Saldo Total</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-2">
                        R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Wallet size={22} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Receitas</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-2">
                        R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <ArrowDownRight size={22} className="rotate-45" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Despesas</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-2">
                        R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                      <ArrowUpRight size={22} className="rotate-45" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Transações Recentes</h3>
                {loading ? (
                  <p className="text-slate-400 text-sm py-4">Carregando dados do banco...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4">Nenhuma transação cadastrada ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                            {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-sm">{tx.title}</h4>
                            <p className="text-xs text-slate-400">{tx.category} • {tx.date}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.type === 'income' ? '+ ' : '- '} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Transações</h1>
                  <p className="text-slate-500 text-sm mt-1">Histórico completo salvo no banco de dados.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-all"
                >
                  <Plus size={18} /> Adicionar Transação
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-slate-600">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3.5 border-b border-slate-50 hover:bg-slate-50 rounded-xl">
                        <div>
                          <h4 className="font-semibold text-slate-800">{tx.title}</h4>
                          <p className="text-xs text-slate-400">{tx.category} • {tx.date}</p>
                        </div>
                        <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.type === 'income' ? '+ ' : '- '} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-slate-800">Cartões de Crédito</h1>
              <p className="text-slate-500 text-sm">Gerenciamento de cartões.</p>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-slate-800">Investimentos</h1>
              <p className="text-slate-500 text-sm">Acompanhamento de ativos.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal para Adicionar Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Título</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="Ex: Salário, Supermercado..." 
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={newAmount} 
                  onChange={e => setNewAmount(e.target.value)} 
                  placeholder="0.00" 
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo</label>
                  <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Categoria</label>
                  <input 
                    type="text" 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 mt-2"
              >
                Salvar Definitivamente
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}