import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Transaction, BankConnection, Budget, AVAILABLE_CURRENCIES, CustomCategory, Subcategory, Investment, CreditCard, UserSession, UserPreferences } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xkkdzlpjlvinfujtmlec.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra2R6bHBqbHZpbmZ1anRtbGVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTYwMjcsImV4cCI6MjEwMDEzMjAyN30.2MMszf76REOPc3aO6l3Lv_bNQ4Vj65c-sw92G5Ct-Jc';

const cleanSupabaseUrl = (url: string): string => {
  if (!url) return supabaseUrl;
  const match = url.match(/(https?:\/\/[^\s\)\"\'\]\}]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return supabaseUrl;
};

const cleanSupabaseKey = (key: string): string => {
  if (!key) return supabaseKey;
  return key.replace(/[\[\]\(\)\'\"\s]/g, '').trim();
};

const activeSupabaseUrl = cleanSupabaseUrl((import.meta as any).env?.VITE_SUPABASE_URL);
const activeSupabaseKey = cleanSupabaseKey((import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(activeSupabaseUrl, activeSupabaseKey);

export const registerUser = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Usuário não retornado pelo Supabase.");

  const { error: dbError } = await supabase
    .from('users')
    .insert([{ id: data.user.id, email, full_name: fullName }]);

  if (dbError) throw dbError;
  
  return data.user;
};

const LOCAL_STORAGE_CODE_KEY = 'finance_sync_code';

export const generateInvestmentYields = (investment: Investment): Transaction[] => {
  const yields: Transaction[] = [];
  const start = new Date(investment.startDate);
  const rate = investment.interestRate / 100;
  const isMonthly = investment.interestType === 'monthly';
  const monthlyRate = isMonthly ? rate : Math.pow(1 + rate, 1/12) - 1;

  let currentVal = investment.amount;
  
  for (let i = 1; i <= 12; i++) {
    const yieldDate = new Date(start);
    yieldDate.setMonth(start.getMonth() + i);
    const dateStr = yieldDate.toISOString().split('T')[0];
    const yieldAmount = currentVal * monthlyRate;
    currentVal += yieldAmount;

    yields.push({
      id: `yield_${investment.id}_month_${i}`,
      description: `Rendimento: ${investment.name} (${i}º mês)`,
      amount: parseFloat(yieldAmount.toFixed(2)),
      type: 'income',
      category: 'Investimentos',
      subcategory: 'Rendimentos',
      date: dateStr,
      currency: investment.currency,
      bankId: investment.bankId,
      paid: yieldDate <= new Date(),
    });
  }
  return yields;
};

function generateSyncCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SYNC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useFinanceState() {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('finance_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const lastUpdatedRef = useRef<number>(0);

  const getOrCreateSyncCode = useCallback(() => {
    let code = localStorage.getItem(LOCAL_STORAGE_CODE_KEY);
    if (!code) {
      code = generateSyncCode();
      localStorage.setItem(LOCAL_STORAGE_CODE_KEY, code);
    }
    return code;
  }, []);

  const activeSyncCode = session ? session.user.syncCode : getOrCreateSyncCode();

  const fetchState = useCallback(async (code: string) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: dbTransactions, error: txError } = await supabase
          .from('transacoes')
          .select('*')
          .eq('user_id', user.id);

        if (txError) throw txError;

        const initialState: AppState = {
          syncCode: code,
          lastUpdated: Date.now(),
          transactions: (dbTransactions || []) as Transaction[],
          budgets: [],
          banks: [
            { bankId: 'nubank', name: 'Nubank', connected: false, balance: 0, currency: 'BRL', lastSync: null },
            { bankId: 'itau', name: 'Itaú', connected: false, balance: 0, currency: 'BRL', lastSync: null },
            { bankId: 'bb', name: 'Banco do Brasil', connected: false, balance: 0, currency: 'BRL', lastSync: null },
            { bankId: 'bradesco', name: 'Bradesco', connected: false, balance: 0, currency: 'BRL', lastSync: null }
          ],
          customCategories: [],
          investments: [],
          creditCards: [],
          preferences: {
            baseCurrency: 'BRL',
            userName: user.email?.split('@')[0] || 'Samuel',
            appLockPin: undefined,
            appLockBiometrics: false,
            appLockShuffle: false,
            aiInsightsEnabled: true,
            theme: 'light'
          }
        };

        setState(initialState);
      } else {
        setState({
          syncCode: code,
          lastUpdated: Date.now(),
          transactions: [],
          budgets: [],
          banks: [],
          customCategories: [],
          investments: [],
          creditCards: [],
          preferences: { baseCurrency: 'BRL', userName: 'Samuel', theme: 'light' }
        });
      }
      
      setError(null);
    } catch (err: any) {
      console.warn("Aviso ao buscar estado:", err);
      setState({
        syncCode: code,
        lastUpdated: Date.now(),
        transactions: [],
        budgets: [],
        banks: [],
        customCategories: [],
        investments: [],
        creditCards: [],
        preferences: { baseCurrency: 'BRL', userName: 'Samuel', theme: 'light' }
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const pushState = useCallback(async (updatedState: AppState) => {
    if (!updatedState.syncCode) return;
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        lastUpdatedRef.current = updatedState.lastUpdated;
      }
    } catch (err) {
      console.error('Erro de sincronização em segundo plano:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchState(activeSyncCode);
  }, [activeSyncCode, fetchState]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return null;
      const safePrev: AppState = {
        ...prev,
        customCategories: prev.customCategories || [],
        investments: prev.investments || [],
        creditCards: prev.creditCards || [],
      };
      const updated = updater(safePrev);
      const finalState = {
        ...updated,
        lastUpdated: Date.now(),
      };
      pushState(finalState);
      return finalState;
    });
  }, [pushState]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
    };
    updateState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
  }, [updateState]);

  const deleteTransaction = useCallback((id: string) => {
    updateState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, [updateState]);

  const updateTransaction = useCallback((updatedTx: Transaction) => {
    updateState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
    }));
  }, [updateState]);

  const setTransactions = useCallback((transactions: Transaction[]) => {
    setState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        transactions,
      };
    });
  }, []);

  const updateBudget = useCallback((category: string, limit: number) => {
    updateState((prev) => {
      const exists = prev.budgets.some((b) => b.category === category);
      const updatedBudgets = exists
        ? prev.budgets.map((b) => (b.category === category ? { ...b, limit } : b))
        : [...prev.budgets, { category, limit, currency: prev.preferences.baseCurrency }];
      return { ...prev, budgets: updatedBudgets };
    });
  }, [updateState]);

  const connectBank = useCallback((bankId: 'nubank' | 'itau' | 'bb' | 'bradesco', balance: number, mockFeeds: Omit<Transaction, 'id' | 'bankId'>[]) => {
    updateState((prev) => {
      const newTransactions: Transaction[] = mockFeeds.map((tx) => ({
        ...tx,
        id: 'tx_bank_' + Math.random().toString(36).substr(2, 9),
        bankId,
      }));

      const updatedBanks = prev.banks.map((bank) =>
        bank.bankId === bankId
          ? { ...bank, connected: true, balance, lastSync: new Date().toISOString() }
          : bank
      );

      return {
        ...prev,
        banks: updatedBanks,
        transactions: [...newTransactions, ...prev.transactions],
      };
    });
  }, [updateState]);

  const disconnectBank = useCallback((bankId: 'nubank' | 'itau' | 'bb' | 'bradesco') => {
    updateState((prev) => {
      const updatedBanks = prev.banks.map((bank) =>
        bank.bankId === bankId
          ? { ...bank, connected: false, balance: 0, lastSync: null }
          : bank
      );

      const updatedTransactions = prev.transactions.filter((t) => t.bankId !== bankId);

      return {
        ...prev,
        banks: updatedBanks,
        transactions: updatedTransactions,
      };
    });
  }, [updateState]);

  const updateBankBalance = useCallback((bankId: string, balance: number) => {
    updateState((prev) => {
      const updatedBanks = prev.banks.map((bank) =>
        bank.bankId === bankId
          ? { ...bank, balance, lastSync: new Date().toISOString() }
          : bank
      );
      return {
        ...prev,
        banks: updatedBanks,
      };
    });
  }, [updateState]);

  const addCustomCategory = useCallback((label: string, color: string, emoji: string) => {
    updateState((prev) => {
      const customCategories = prev.customCategories || [];
      const newCat: CustomCategory = {
        id: label,
        label,
        color,
        icon: 'Layers',
        emoji,
        subcategories: [],
      };
      return {
        ...prev,
        customCategories: [...customCategories, newCat],
      };
    });
  }, [updateState]);

  const addSubcategory = useCallback((categoryId: string, label: string) => {
    updateState((prev) => {
      const customCategories = prev.customCategories || [];
      let updatedCats = [...customCategories];
      
      const existsInCustom = customCategories.some((cat) => cat.id === categoryId);
      
      if (!existsInCustom) {
        const systemCat = CATEGORIES.find((c) => c.id === categoryId);
        if (systemCat) {
          const newCat: CustomCategory = {
            id: systemCat.id,
            label: systemCat.label,
            color: systemCat.color,
            icon: systemCat.icon || 'Layers',
            emoji: systemCat.emoji || '📦',
            subcategories: [],
          };
          updatedCats.push(newCat);
        }
      }
      
      updatedCats = updatedCats.map((cat) => {
        if (cat.id === categoryId) {
          const subs = cat.subcategories || [];
          if (subs.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
            return cat;
          }
          const newSub: Subcategory = {
            id: label,
            label,
          };
          return {
            ...cat,
            subcategories: [...subs, newSub],
          };
        }
        return cat;
      });
      
      return {
        ...prev,
        customCategories: updatedCats,
      };
    });
  }, [updateState]);

  const editCategory = useCallback((categoryId: string, newLabel: string, newColor: string, newEmoji: string) => {
    updateState((prev) => {
      const customCategories = prev.customCategories || [];
      const systemCat = CATEGORIES.find((c) => c.id === categoryId);
      
      let baseCat = customCategories.find((c) => c.id === categoryId);
      if (!baseCat && systemCat) {
        baseCat = {
          id: systemCat.id,
          label: systemCat.label,
          color: systemCat.color,
          icon: systemCat.icon || 'Layers',
          emoji: systemCat.emoji || '📦',
          subcategories: [],
        };
      }
      
      if (!baseCat) return prev;
      
      const oldId = baseCat.id;
      const newId = newLabel.trim();
      
      const updatedCat: CustomCategory = {
        ...baseCat,
        id: newId,
        label: newLabel.trim(),
        color: newColor,
        emoji: newEmoji,
      };
      
      let updatedCats = customCategories.filter((c) => c.id !== oldId);
      updatedCats.push(updatedCat);
      
      let updatedTransactions = prev.transactions;
      if (oldId !== newId) {
        updatedTransactions = prev.transactions.map((t) => {
          if (t.category === oldId) {
            return { ...t, category: newId };
          }
          return t;
        });
      }
      
      let updatedBudgets = prev.budgets;
      if (oldId !== newId) {
        updatedBudgets = prev.budgets.map((b) => {
          if (b.category === oldId) {
            return { ...b, category: newId };
          }
          return b;
        });
      }
      
      return {
        ...prev,
        customCategories: updatedCats,
        transactions: updatedTransactions,
        budgets: updatedBudgets,
      };
    });
  }, [updateState]);

  const deleteCategory = useCallback((categoryId: string) => {
    updateState((prev) => {
      const customCategories = prev.customCategories || [];
      const updatedCats = customCategories.filter((c) => c.id !== categoryId);
      
      const updatedTransactions = prev.transactions.map((t) => {
        if (t.category === categoryId) {
          return { ...t, category: 'Outros' };
        }
        return t;
      });
      
      const updatedBudgets = prev.budgets.filter((b) => b.category !== categoryId);
      
      return {
        ...prev,
        customCategories: updatedCats,
        transactions: updatedTransactions,
        budgets: updatedBudgets,
      };
    });
  }, [updateState]);

  const editSubcategory = useCallback((categoryId: string, oldSubId: string, newSubLabel: string) => {
    updateState((prev) => {
      const customCategories = prev.customCategories || [];
      const systemCat = CATEGORIES.find((c) => c.id === categoryId);
      
      let baseCat = customCategories.find((c) => c.id === categoryId);
      if (!baseCat && systemCat) {
        baseCat = {
          id: systemCat.id,
          label: systemCat.label,
          color: systemCat.color,
          icon: systemCat.icon || 'Layers',
          emoji: systemCat.emoji || '📦',
          subcategories: [],
        };
      }
      
      if (!baseCat) return prev;
      
      const updatedSubs = (baseCat.subcategories || []).map((sub) => {
        if (sub.id === oldSubId) {
          return {
            id: newSubLabel.trim(),
            label: newSubLabel.trim(),
          };
        }
        return sub;
      });
      
      const updatedCats = [
        ...customCategories.filter((c) => c.id !== categoryId),
        { ...baseCat, subcategories: updatedSubs }
      ];
      
      const updatedTransactions = prev.transactions.map((t) => {
        if (t.category === categoryId && t.subcategory === oldSubId) {
          return { ...t, subcategory: newSubLabel.trim() };
        }
        return t;
      });
      
      return {
        ...prev,
        customCategories: updatedCats,
        transactions: updatedTransactions,
      };
    });
  }, [updateState]);

  const deleteSubcategory = useCallback((categoryId: string, subId: string) => {
    updateState((prev) => {
      const customCategories = prev.customCategories || [];
      const baseCat = customCategories.find((c) => c.id === categoryId);
      if (!baseCat) return prev;
      
      const updatedSubs = (baseCat.subcategories || []).filter((sub) => sub.id !== subId);
      
      const updatedCats = customCategories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, subcategories: updatedSubs };
        }
        return c;
      });
      
      const updatedTransactions = prev.transactions.map((t) => {
        if (t.category === categoryId && t.subcategory === subId) {
          const { subcategory: _, ...rest } = t;
          return rest;
        }
        return t;
      });
      
      return {
        ...prev,
        customCategories: updatedCats,
        transactions: updatedTransactions,
      };
    });
  }, [updateState]);

  const addCustomBank = useCallback((name: string, balance: number, currency: string) => {
    updateState((prev) => {
      const newBank: BankConnection = {
        bankId: 'bank_' + Math.random().toString(36).substr(2, 9),
        name,
        connected: true,
        balance,
        currency,
        lastSync: new Date().toISOString(),
      };
      return {
        ...prev,
        banks: [...prev.banks, newBank],
      };
    });
  }, [updateState]);

  const addInvestment = useCallback((inv: Omit<Investment, 'id'> & { id?: string }) => {
    updateState((prev) => {
      const id = inv.id || 'inv_' + Math.random().toString(36).substr(2, 9);
      const newInv: Investment = { ...inv, id };
      const yields = generateInvestmentYields(newInv);
      const currentInvestments = prev.investments || [];
      return {
        ...prev,
        investments: [...currentInvestments, newInv],
        transactions: [...yields, ...prev.transactions],
      };
    });
  }, [updateState]);

  const deleteInvestment = useCallback((id: string) => {
    updateState((prev) => {
      const currentInvestments = prev.investments || [];
      const updatedTransactions = prev.transactions.filter(
        (t) => !t.id.startsWith(`yield_${id}_`)
      );
      return {
        ...prev,
        investments: currentInvestments.filter((i) => i.id !== id),
        transactions: updatedTransactions,
      };
    });
  }, [updateState]);

  const updateInvestment = useCallback((updated: Investment) => {
    updateState((prev) => {
      const currentInvestments = prev.investments || [];
      const filteredTransactions = prev.transactions.filter(
        (t) => !t.id.startsWith(`yield_${updated.id}_`)
      );
      const yields = generateInvestmentYields(updated);
      return {
        ...prev,
        investments: currentInvestments.map((i) => (i.id === updated.id ? updated : i)),
        transactions: [...yields, ...filteredTransactions],
      };
    });
  }, [updateState]);

  const setBaseCurrency = useCallback((currency: string) => {
    updateState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, baseCurrency: currency },
    }));
  }, [updateState]);

  const setUserName = useCallback((userName: string) => {
    updateState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, userName },
    }));
  }, [updateState]);

  const setAppLockPin = useCallback((pin?: string) => {
    updateState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, appLockPin: pin || undefined },
    }));
  }, [updateState]);

  const updatePreferences = useCallback((updatedPrefs: Partial<UserPreferences>) => {
    updateState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updatedPrefs },
    }));
  }, [updateState]);

  const syncWithCode = useCallback(async (newCode: string) => {
    const code = newCode.trim().toUpperCase();
    if (!code) return false;
    try {
      setLoading(true);
      localStorage.setItem(LOCAL_STORAGE_CODE_KEY, code);
      setError(null);
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError('Falha ao sincronizar com o código fornecido.');
      setLoading(false);
      return false;
    }
  }, []);

  const convertAmount = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = AVAILABLE_CURRENCIES.find((c) => c.code === fromCurrency)?.rateToUSD || 1;
    const toRate = AVAILABLE_CURRENCIES.find((c) => c.code === toCurrency)?.rateToUSD || 1;
    const amountInUSD = amount * fromRate;
    return amountInUSD / toRate;
  }, []);

  const addCreditCard = useCallback((card: Omit<CreditCard, 'id'>) => {
    updateState((prev) => {
      const id = 'card_' + Math.random().toString(36).substr(2, 9);
      const newCard: CreditCard = { ...card, id };
      const currentCards = prev.creditCards || [];
      return {
        ...prev,
        creditCards: [...currentCards, newCard],
      };
    });
  }, [updateState]);

  const deleteCreditCard = useCallback((id: string) => {
    updateState((prev) => {
      const currentCards = prev.creditCards || [];
      return {
        ...prev,
        creditCards: currentCards.filter((c) => c.id !== id),
      };
    });
  }, [updateState]);

  const updateCreditCard = useCallback((updatedCard: CreditCard) => {
    updateState((prev) => {
      const currentCards = prev.creditCards || [];
      return {
        ...prev,
        creditCards: currentCards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
      };
    });
  }, [updateState]);

  const registerUserInternal = useCallback(async (nameOrEmail: string, emailOrName: string, password: string, baseCurrency: string = 'BRL') => {
    try {
      let email = emailOrName;
      let name = nameOrEmail;
      if (nameOrEmail.includes('@') && !emailOrName.includes('@')) {
        email = nameOrEmail;
        name = emailOrName;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Usuário não retornado pelo Supabase.");

      try {
        const { error: dbError } = await supabase
          .from('users')
          .insert([{ id: data.user.id, email: email.trim(), full_name: name.trim() }]);
        if (dbError) {
          console.warn("Database insert warning (table might not exist yet):", dbError.message);
        }
      } catch (dbErr: any) {
        console.warn("Database insert error:", dbErr.message);
      }

      const mockSessionData = {
        success: true,
        user: {
          id: data.user.id,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          supabaseUid: data.user.id,
          syncCode: activeSyncCode,
        }
      };

      localStorage.setItem('finance_user_session', JSON.stringify(mockSessionData));
      setSession(mockSessionData);
      return { success: true };
    } catch (err: any) {
      console.error('Erro de Registro Supabase:', err);
      return { success: false, error: err.message || 'Erro ao registrar usuário com Supabase.' };
    }
  }, [activeSyncCode]);

  const loginUser = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Login falhou.");

      const mockSessionData = {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || email.trim().toLowerCase(),
          name: email.trim().split('@')[0],
          supabaseUid: data.user.id,
          syncCode: activeSyncCode,
        }
      };

      localStorage.setItem('finance_user_session', JSON.stringify(mockSessionData));
      setSession(mockSessionData);
      return { success: true };
    } catch (err: any) {
      console.error('Erro de Login Supabase:', err);
      return { success: false, error: err.message || 'E-mail ou senha incorretos.' };
    }
  }, [activeSyncCode]);

  const loginWithSupabase = useCallback(async (email: string, name?: string, supabaseUid?: string, supabaseProvider?: string, baseCurrency?: string) => {
    try {
      const mockSessionData = {
        success: true,
        user: {
          id: supabaseUid || 'anon_id',
          email,
          name: name || email.split('@')[0],
          supabaseUid: supabaseUid || 'anon_id',
          syncCode: activeSyncCode,
        }
      };
      localStorage.setItem('finance_user_session', JSON.stringify(mockSessionData));
      setSession(mockSessionData);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [activeSyncCode]);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('finance_user_session');
    setSession(null);
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!session) return { success: false, error: 'Sessão encerrada' };
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [session]);

  const exportToCSV = useCallback(() => {
    if (!state) return;
    const headers = ['Data', 'Descrição', 'Valor', 'Moeda', 'Tipo', 'Categoria', 'Banco Integrado'];
    const rows = state.transactions.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.currency,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      t.bankId ? state.banks.find((b) => b.bankId === t.bankId)?.name || t.bankId : 'Manual',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${state.syncCode}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state]);

  return {
    state,
    loading,
    error,
    isSyncing,
    session,
    registerUser: registerUserInternal,
    loginUser,
    loginWithSupabase,
    logoutUser,
    updatePassword,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    setTransactions,
    updateBudget,
    connectBank,
    disconnectBank,
    updateBankBalance,
    addCustomCategory,
    addSubcategory,
    editCategory,
    deleteCategory,
    editSubcategory,
    deleteSubcategory,
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
    forceFetch: () => state && fetchState(state.syncCode),
  };
}
