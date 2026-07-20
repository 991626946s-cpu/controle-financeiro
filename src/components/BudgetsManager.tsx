import React, { useState } from 'react';
import { AppState, AVAILABLE_CURRENCIES, CATEGORIES } from '../types';
import { Percent, ArrowUpRight, AlertTriangle, CheckCircle2, Sliders, DollarSign, Pencil, Trash2 } from 'lucide-react';

interface BudgetsManagerProps {
  state: AppState;
  updateBudget: (category: string, limit: number) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
}

export default function BudgetsManager({ state, updateBudget, convertAmount }: BudgetsManagerProps) {
  const baseCurrency = state.preferences.baseCurrency;
  const baseCurrencySymbol = AVAILABLE_CURRENCIES.find((c) => c.code === baseCurrency)?.symbol || '$';

  // Edit State
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [limitInput, setLimitInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });

  // Handle saving budget
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitInput || parseFloat(limitInput) < 0) return;
    updateBudget(selectedCategory, parseFloat(limitInput));
    setLimitInput('');
    setIsEditing(false);
  };

  const handleEditClick = (category: string, currentLimit: number) => {
    setSelectedCategory(category);
    setLimitInput(currentLimit.toString());
    setIsEditing(true);
    // Scroll smoothly to form
    const formElement = document.getElementById('budget-form-container');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRemoveBudget = (category: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Remoção de Orçamento',
      message: `Deseja realmente remover o limite de orçamento para a categoria "${category}"?`,
      onConfirm: () => {
        updateBudget(category, 0);
        if (selectedCategory === category) {
          setLimitInput('');
          setIsEditing(false);
        }
        setConfirmModal(null);
      }
    });
  };

  // Pre-calculate spent amounts per category for the SELECTED MONTH
  const expensesByCategory: { [cat: string]: number } = {};
  state.transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(selectedMonth))
    .forEach((t) => {
      const amtInBase = convertAmount(t.amount, t.currency, baseCurrency);
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amtInBase;
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="budgets-tab">
      {/* Edit/Configure Budget Card */}
      <div id="budget-form-container" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-900 font-sans tracking-tight mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600" />
          <span>{isEditing ? 'Editar Limite' : 'Configurar Limites'}</span>
        </h3>

        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Escolha a Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const activeB = state.budgets.find(b => b.category === e.target.value);
                if (activeB && activeB.limit > 0) {
                  setLimitInput(activeB.limit.toString());
                  setIsEditing(true);
                } else {
                  setLimitInput('');
                  setIsEditing(false);
                }
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition"
            >
              {CATEGORIES.filter(c => c.id !== 'Salário').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Limite Mensal ({baseCurrencySymbol})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm font-semibold pointer-events-none">
                {baseCurrencySymbol}
              </span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Ex: 500.00"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setLimitInput('');
                  setIsEditing(false);
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition cursor-pointer"
            >
              {isEditing ? 'Atualizar Limite' : 'Salvar Limite'}
            </button>
          </div>
        </form>
      </div>

      {/* Budgets List with Progress bars */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100/60">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 font-sans tracking-tight">
              Metas & Orçamentos Mensais
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              Clique em qualquer categoria ou use os botões para editar ou remover limites.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 bg-slate-50 px-3 py-1.5 border border-gray-200 rounded-xl">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Período:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-blue-700 bg-transparent border-none p-0 focus:outline-none cursor-pointer focus:ring-0"
            />
          </div>
        </div>

        <div className="space-y-4">
          {CATEGORIES.filter(c => c.id !== 'Salário').map((cat) => {
            const budget = state.budgets.find((b) => b.category === cat.id);
            const spent = expensesByCategory[cat.id] || 0;
            const limit = budget ? budget.limit : 0;

            if (limit === 0) {
              return (
                <div 
                  key={cat.id} 
                  onClick={() => handleEditClick(cat.id, 0)}
                  className="p-4 border border-dashed border-gray-200 rounded-2xl flex justify-between items-center bg-gray-50/50 hover:bg-slate-50 hover:border-blue-300 transition cursor-pointer group"
                  title="Clique para definir um limite"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition">{cat.label}</span>
                  </div>
                  <span className="text-xs text-gray-400 italic group-hover:text-blue-500 transition flex items-center gap-1">
                    <span>Nenhum limite definido</span>
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                  </span>
                </div>
              );
            }

            const percentage = Math.min((spent / limit) * 100, 100);
            const isExceeded = spent > limit;
            const isNearLimit = !isExceeded && spent >= limit * 0.8;

            return (
              <div 
                key={cat.id} 
                className="space-y-2 border border-gray-100 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-100 transition relative group"
              >
                <div className="flex justify-between items-center">
                  <div 
                    onClick={() => handleEditClick(cat.id, limit)}
                    className="flex items-center gap-2 cursor-pointer select-none"
                    title="Clique para editar"
                  >
                    <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                      <span>{cat.label}</span>
                      <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {isExceeded ? (
                      <span className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Estourou</span>
                      </span>
                    ) : isNearLimit ? (
                      <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        <Percent className="w-3.5 h-3.5 animate-pulse" />
                        <span>No Limite</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Controlado</span>
                      </span>
                    )}

                    <div className="flex items-center gap-0.5 ml-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(cat.id, limit)}
                        className="p-1.5 hover:bg-slate-100 text-gray-500 hover:text-blue-600 rounded-lg transition cursor-pointer"
                        title="Editar Limite"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBudget(cat.id)}
                        className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="Remover Limite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div 
                  onClick={() => handleEditClick(cat.id, limit)}
                  className="w-full h-3 bg-gray-100 rounded-full overflow-hidden cursor-pointer"
                  title="Clique para editar"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded ? 'bg-rose-500 animate-pulse' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Values labels */}
                <div 
                  onClick={() => handleEditClick(cat.id, limit)}
                  className="flex justify-between items-center text-xs text-gray-500 cursor-pointer"
                  title="Clique para editar"
                >
                  <span>
                    Gasto: <strong className="text-gray-900 font-mono">{baseCurrencySymbol} {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                  <span>
                    Teto: <strong className="text-gray-950 font-mono">{baseCurrencySymbol} {limit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              </div>
            );
          })}
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
