import React, { useState, useEffect } from 'react';
import { useFinanceState } from './hooks/useFinanceState';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import TransactionsList from './components/TransactionsList';
import BankIntegration from './components/BankIntegration';
import BudgetsManager from './components/BudgetsManager';
import AIInsights from './components/AIInsights';
import SyncSettings from './components/SyncSettings';
import ForecastAndHistory from './components/ForecastAndHistory';
import InvestmentsManager from './components/InvestmentsManager';
import SmartSecurityIntelligence from './components/SmartSecurityIntelligence';
import LockScreen from './components/LockScreen';
import CreditCardsManager from './components/CreditCardsManager';
import UserProfile from './components/UserProfile';
import AgendaManager from './components/AgendaManager';
import AndroidPwaInstaller from './components/AndroidPwaInstaller';
import { getUserTransactions } from './services/financeService';
import { supabase } from './hooks/useFinanceState';
import {
  LayoutDashboard,
  Receipt,
  Landmark,
  Sliders,
  Brain,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  LineChart,
  Briefcase,
  CreditCard,
  User,
  Calendar,
  Smartphone,
  Menu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function App() {
  const {
    state,
    loading,
    error,
    isSyncing,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    updateBudget,
    connectBank,
    disconnectBank,
    updateBankBalance,
    addCustomCategory,
    addSubcategory,
    addCustomBank,
    addInvestment,
    deleteInvestment,
    updateInvestment,
    addCreditCard,
    deleteCreditCard,
    updateCreditCard,
    setBaseCurrency,
    setUserName,
    setAppLockPin,
    updatePreferences,
    syncWithCode,
    convertAmount,
    exportToCSV,
    session,
    registerUser,
    loginUser,
    loginWithSupabase,
    logoutUser,
    updatePassword,
    setTransactions,
  } = useFinanceState();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isTxMenuOpen, setIsTxMenuOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  // Supabase auth states
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial load / sync from custom session state
    if (session?.user) {
      if (isMounted) {
        setSupabaseUser({
          uid: session.user.supabaseUid,
          displayName: session.user.name,
          email: session.user.email
        });
        setAuthLoading(false);
      }
    } else {
      if (isMounted) {
        setSupabaseUser(null);
        setAuthLoading(false);
      }
    }

    // 2. Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sbSession) => {
      const user = sbSession?.user || null;
      if (user) {
        if (isMounted) {
          setSupabaseUser({
            uid: user.id,
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário Supabase',
            email: user.email
          });
        }

        // Restore / fetch data for the user if session is missing or doesn't match
        const savedSession = localStorage.getItem('finance_user_session');
        let sessionUid = null;
        if (savedSession) {
          try {
            sessionUid = JSON.parse(savedSession).user?.supabaseUid;
          } catch (e) {
            console.error(e);
          }
        }
        if (!sessionUid || sessionUid !== user.id) {
          if (loginWithSupabase) {
            await loginWithSupabase(
              user.email || 'google.user@gmail.com',
              user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário Supabase',
              user.id,
              'supabase',
              state?.preferences?.baseCurrency || 'BRL'
            );
          }
        }

        // Carregar transações reais do Supabase para o usuário autenticado
        try {
          const dbTransactions = await getUserTransactions();
          if (isMounted && dbTransactions && dbTransactions.length > 0) {
            setTransactions(dbTransactions);
          }
        } catch (err) {
          console.error("Erro ao obter transações do Supabase:", err);
        }

        if (isMounted) {
          setAuthLoading(false);
        }
      } else {
        // Fallback for custom session if Supabase has no active user
        const savedSession = localStorage.getItem('finance_user_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed.user?.supabaseUid && isMounted) {
              setSupabaseUser({
                uid: parsed.user.supabaseUid,
                displayName: parsed.user.name,
                email: parsed.user.email
              });
            }
          } catch (e) {
            console.error(e);
          }

          getUserTransactions()
            .then((dbTransactions) => {
              if (isMounted && dbTransactions && dbTransactions.length > 0) {
                setTransactions(dbTransactions);
              }
            })
            .catch((err) => console.error("Erro ao obter transações em modo simulado:", err));
        } else {
          if (isMounted) {
            setSupabaseUser(null);
            setTransactions([]);
          }
        }
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [session, setTransactions, loginWithSupabase, state?.preferences?.baseCurrency]);

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      // Sign in with Supabase Google OAuth Provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Erro ao autenticar com o Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSupabaseUser(null);
    logoutUser();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-500 font-sans font-medium animate-pulse">
          Carregando suas finanças sincronizadas...
        </p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-150 max-w-md w-full shadow-md text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Erro de Carregamento</h3>
            <p className="text-sm text-gray-500 mt-1">
              {error}. Verifique se o servidor backend está rodando de forma adequada.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition cursor-pointer"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-sans">
         <div className="animate-spin mr-2">◌</div> Sincronizando...
      </div>
    );
  }

  if (!supabaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 antialiased">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl text-white shadow-xs items-center justify-center mb-3">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
              Finança Ativa
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              Controle inteligente de investimentos e orçamento sincronizado na nuvem.
            </p>
          </div>

          <UserProfile
            state={state}
            session={session}
            registerUser={registerUser}
            loginUser={loginUser}
            loginWithSupabase={loginWithSupabase}
            logoutUser={handleLogout}
            updatePassword={updatePassword}
            updatePreferences={updatePreferences}
          />
        </div>
      </div>
    );
  }

  if (state.preferences.appLockPin && !isUnlocked) {
    return (
      <LockScreen
        correctPin={state.preferences.appLockPin}
        onUnlock={() => setIsUnlocked(true)}
        userName={state.preferences.userName}
        biometricsEnabled={state.preferences.appLockBiometrics}
        shuffleKeypad={state.preferences.appLockShuffle}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 1. Header Navigation Bar */}
      <header className="bg-white border-b border-slate-100 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl text-white shadow-xs flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 font-display">
                Finança Ativa
              </span>
            </div>

            {/* Sync status widget */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-2xl border border-slate-150 text-xs text-slate-600 font-medium">
                <div className={`w-2.5 h-2.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span>
                  {isSyncing ? 'Sincronizando...' : 'Nuvem Conectada'}
                </span>
              </div>

              {/* Sync Code Pill */}
              <div className="px-3.5 py-1.5 bg-slate-50 text-slate-700 rounded-2xl text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-150">
                <span className="text-[10px] text-slate-400 font-sans uppercase font-extrabold">Código:</span>
                <span>{state.syncCode}</span>
              </div>

              {/* User Bubble */}
              <button 
                onClick={() => setActiveTab('profile')}
                title="Ver Meu Perfil"
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs select-none uppercase border border-indigo-100 cursor-pointer hover:scale-105 transition duration-200"
              >
                {session ? session.user.name.substring(0, 2).toUpperCase() : state.preferences.userName.charAt(0)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Primary Tabs Switcher Subheader */}
      <nav className="bg-white border-b border-slate-100 shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Left side: Quick actions or current view state */}
            <div className="flex items-center gap-3">
              {/* Home/Dashboard Link */}
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsTxMenuOpen(false);
                  setIsMainMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition duration-200 cursor-pointer border ${
                  activeTab === 'dashboard'
                    ? 'bg-violet-50 text-violet-700 border-violet-150'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-violet-600" />
                <span>Painel</span>
              </button>

              {/* Transactions Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsTxMenuOpen(!isTxMenuOpen);
                    setIsMainMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition duration-200 cursor-pointer border ${
                    ['transactions', 'agenda', 'budgets', 'credit_cards', 'forecast'].includes(activeTab)
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Transações</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTxMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu for Transaction Options */}
                {isTxMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsTxMenuOpen(false)} />
                    <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-gray-150 shadow-lg py-2.5 z-20 animate-fade-in">
                      <div className="px-3.5 pb-2 mb-1 border-b border-gray-100">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-mono">Lançamentos & Planejamento</span>
                      </div>
                      
                      {/* Sub-option: Transações */}
                      <button
                        onClick={() => {
                          setActiveTab('transactions');
                          setIsTxMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                          activeTab === 'transactions'
                            ? 'bg-indigo-50/50 text-indigo-700 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Receipt className="w-4 h-4 text-indigo-500" />
                        <span>Lista de Transações</span>
                      </button>

                      {/* Sub-option: Agenda */}
                      <button
                        onClick={() => {
                          setActiveTab('agenda');
                          setIsTxMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                          activeTab === 'agenda'
                            ? 'bg-indigo-50/50 text-indigo-700 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span>Agenda & Vencimentos</span>
                      </button>

                      {/* Sub-option: Cartões */}
                      <button
                        onClick={() => {
                          setActiveTab('credit_cards');
                          setIsTxMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                          activeTab === 'credit_cards'
                            ? 'bg-indigo-50/50 text-indigo-700 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <span>Faturas de Cartões</span>
                      </button>

                      {/* Sub-option: Orçamentos */}
                      <button
                        onClick={() => {
                          setActiveTab('budgets');
                          setIsTxMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                          activeTab === 'budgets'
                            ? 'bg-indigo-50/50 text-indigo-700 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Sliders className="w-4 h-4 text-indigo-500" />
                        <span>Orçamentos Mensais</span>
                      </button>

                      {/* Sub-option: Previsões */}
                      <button
                        onClick={() => {
                          setActiveTab('forecast');
                          setIsTxMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                          activeTab === 'forecast'
                            ? 'bg-indigo-50/50 text-indigo-700 font-bold'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <LineChart className="w-4 h-4 text-indigo-500" />
                        <span>Previsões & Histórico</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Middle text indicator: Active View Name */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-slate-50 px-3 py-1.5 border border-gray-150 rounded-xl">
              <span className="font-bold text-gray-400">Exibindo:</span>
              <span className="text-gray-800 font-bold uppercase font-sans">
                {activeTab === 'dashboard' && 'Painel Geral'}
                {activeTab === 'transactions' && 'Lista de Transações'}
                {activeTab === 'agenda' && 'Agenda & Calendário'}
                {activeTab === 'bank' && 'Contas & Integração Bancária'}
                {activeTab === 'credit_cards' && 'Cartões de Crédito'}
                {activeTab === 'investments' && 'Investimentos & Ativos'}
                {activeTab === 'budgets' && 'Orçamentos Mensais'}
                {activeTab === 'forecast' && 'Previsões & Gráficos'}
                {activeTab === 'insights' && 'Inteligência & Segurança'}
                {activeTab === 'android' && 'Instalador de Aplicativo'}
                {activeTab === 'settings' && 'Sincronização & Preferências'}
                {activeTab === 'profile' && 'Perfil de Usuário'}
              </span>
            </div>

            {/* Right side: Main Menu Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsMainMenuOpen(!isMainMenuOpen);
                  setIsTxMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition duration-200 cursor-pointer border ${
                  isMainMenuOpen
                    ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMainMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Main Menu Dropdown */}
              {isMainMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsMainMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-150 shadow-md py-2.5 z-20 animate-fade-in max-h-[80vh] overflow-y-auto">
                    <div className="px-3.5 pb-2 mb-1 border-b border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Todas as Opções</span>
                    </div>

                    {/* Option: Painel */}
                    <button
                      onClick={() => {
                        setActiveTab('dashboard');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'dashboard' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-violet-500" />
                      <span>Painel Geral</span>
                    </button>

                    {/* Option: Transações */}
                    <button
                      onClick={() => {
                        setActiveTab('transactions');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'transactions' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Receipt className="w-4 h-4 text-indigo-500" />
                      <span>Transações</span>
                    </button>

                    {/* Option: Agenda */}
                    <button
                      onClick={() => {
                        setActiveTab('agenda');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'agenda' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span>Agenda & Vencimentos</span>
                    </button>

                    {/* Option: Contas & Bancos */}
                    <button
                      onClick={() => {
                        setActiveTab('bank');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'bank' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Landmark className="w-4 h-4 text-violet-500" />
                      <span>Contas & Bancos</span>
                    </button>

                    {/* Option: Cartões */}
                    <button
                      onClick={() => {
                        setActiveTab('credit_cards');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'credit_cards' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                      <span>Cartões de Crédito</span>
                    </button>

                    {/* Option: Investimentos */}
                    <button
                      onClick={() => {
                        setActiveTab('investments');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'investments' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-amber-600" />
                      <span>Investimentos</span>
                    </button>

                    {/* Option: Orçamentos */}
                    <button
                      onClick={() => {
                        setActiveTab('budgets');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'budgets' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Sliders className="w-4 h-4 text-indigo-500" />
                      <span>Orçamentos Mensais</span>
                    </button>

                    {/* Option: Previsões & Histórico */}
                    <button
                      onClick={() => {
                        setActiveTab('forecast');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'forecast' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <LineChart className="w-4 h-4 text-indigo-500" />
                      <span>Previsões & Histórico</span>
                    </button>

                    <div className="border-t border-slate-100 my-1.5" />

                    {/* Option: Inteligência & Segurança */}
                    <button
                      onClick={() => {
                        setActiveTab('insights');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'insights' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Brain className="w-4 h-4 text-violet-500 animate-pulse" />
                      <span>Inteligência & Segurança</span>
                    </button>

                    {/* Option: Android App */}
                    <button
                      onClick={() => {
                        setActiveTab('android');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'android' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span>Instalar no Android</span>
                    </button>

                    {/* Option: Configurações */}
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'settings' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Configurações</span>
                    </button>

                    {/* Option: Perfil */}
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsMainMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold transition duration-200 text-left cursor-pointer ${
                        activeTab === 'profile' ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Minha Conta</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 3. Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        {!state ? (
          <div className="flex justify-center p-10 text-slate-500">Carregando dados...</div>
        ) : (
          <ErrorBoundary key={activeTab} onReset={() => setActiveTab('dashboard')}>
            {activeTab === 'dashboard' && (
              <Dashboard
                state={state}
                convertAmount={convertAmount}
                onNavigate={setActiveTab}
                exportToCSV={exportToCSV}
                updateTransaction={updateTransaction}
                deleteTransaction={deleteTransaction}
              />
            )}

          {activeTab === 'agenda' && (
            <AgendaManager
              state={state}
              addTransaction={addTransaction}
              deleteTransaction={deleteTransaction}
              updateTransaction={updateTransaction}
              convertAmount={convertAmount}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsList
              state={state}
              addTransaction={addTransaction}
              deleteTransaction={deleteTransaction}
              updateTransaction={updateTransaction}
              convertAmount={convertAmount}
              addCustomCategory={addCustomCategory}
              addSubcategory={addSubcategory}
              addCreditCard={addCreditCard}
            />
          )}

          {activeTab === 'bank' && (
            <BankIntegration
              state={state}
              connectBank={connectBank}
              disconnectBank={disconnectBank}
              updateBankBalance={updateBankBalance}
              convertAmount={convertAmount}
              addCustomBank={addCustomBank}
            />
          )}

          {activeTab === 'credit_cards' && (
            <CreditCardsManager
              state={state}
              addCreditCard={addCreditCard}
              deleteCreditCard={deleteCreditCard}
              updateCreditCard={updateCreditCard}
              addTransaction={addTransaction}
              convertAmount={convertAmount}
            />
          )}

          {activeTab === 'investments' && (
            <InvestmentsManager
              state={state}
              addInvestment={addInvestment}
              deleteInvestment={deleteInvestment}
              convertAmount={convertAmount}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsManager
              state={state}
              updateBudget={updateBudget}
              convertAmount={convertAmount}
            />
          )}

          {activeTab === 'forecast' && (
            <ForecastAndHistory
              state={state}
              convertAmount={convertAmount}
              updateBudget={updateBudget}
            />
          )}

          {activeTab === 'insights' && (
            <SmartSecurityIntelligence
              state={state}
              setAppLockPin={setAppLockPin}
              updatePreferences={updatePreferences}
              lockApp={() => setIsUnlocked(false)}
              deleteTransaction={deleteTransaction}
              convertAmount={convertAmount}
            />
          )}

          {activeTab === 'android' && (
            <AndroidPwaInstaller />
          )}

          {activeTab === 'settings' && (
            <SyncSettings
              state={state}
              setBaseCurrency={setBaseCurrency}
              setUserName={setUserName}
              syncWithCode={syncWithCode}
              isSyncing={isSyncing}
              forceFetch={() => {}}
            />
          )}

            {activeTab === 'profile' && (
              <UserProfile
                state={state}
                session={session}
                registerUser={registerUser}
                loginUser={loginUser}
                loginWithSupabase={loginWithSupabase}
                logoutUser={handleLogout}
                updatePassword={updatePassword}
                updatePreferences={updatePreferences}
              />
            )}
          </ErrorBoundary>
        )}
      </main>

      {/* 4. Humble Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 shrink-0 text-center">
        <p className="text-xs text-gray-400 font-sans">
          Finança Ativa © 2026 • Sincronismo Open Finance seguro por criptografia ponta-a-ponta
        </p>
      </footer>
    </div>
  );
}
