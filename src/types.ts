export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string; // Optional subcategory name
  date: string; // YYYY-MM-DD
  currency: string;
  bankId: string | null; // 'nubank' | 'itau' | 'bb' | 'bradesco' | 'manual' or custom
  paid?: boolean;
  paymentMethod?: 'dinheiro' | 'pix' | 'credito' | 'debito' | 'transferencia';
  creditCardId?: string; // If paid with credit card, links here
  installmentsTotal?: number; // E.g., 3 if split in 3 installments
  installmentNumber?: number; // E.g., 1, 2, 3 for split transactions
}

export interface CreditCard {
  id: string;
  bankId: string; // The bank connection it is linked to
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currency: string;
}

export interface BankConnection {
  bankId: string; // Dynamic ID, e.g., 'nubank' or 'custom_123'
  name: string;
  connected: boolean;
  balance: number;
  currency: string;
  lastSync: string | null;
}

export interface Budget {
  category: string;
  limit: number;
  currency: string;
}

export interface UserPreferences {
  baseCurrency: string;
  userName: string;
  appLockPin?: string; // App Lock PIN code
  appLockBiometrics?: boolean; // Enable/Disable simulated biometrics
  appLockShuffle?: boolean; // Enable/Disable PIN keypad shuffling
  appLockTimeoutMinutes?: number; // 0 = immediate, 5, 10, 30 etc.
  pixKeys?: { type: 'cpf' | 'email' | 'phone' | 'random'; key: string }[]; // PIX keys registry
}

export interface Subcategory {
  id: string;
  label: string;
}

export interface CustomCategory {
  id: string;
  label: string;
  color: string;
  icon: string;
  emoji: string;
  subcategories?: Subcategory[];
}

export interface Investment {
  id: string;
  name: string; // Nome da aplicação (ex: CDB 120% CDI, Tesouro IPCA+)
  institution: string; // Banco/Corretora (ex: Nubank, Rico, XP)
  amount: number; // Valor aplicado inicial/atual
  currency: string;
  interestRate: number; // Taxa de rendimento (ex: 1.2% ao mês)
  interestType: 'monthly' | 'yearly'; // Mensal ou Anual
  startDate: string; // Data da aplicação (YYYY-MM-DD)
  notes?: string;
  bankId: string; // Conta associada
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  baseCurrency: string;
  syncCode: string;
  createdAt: number;
  isSupabase?: boolean;
  supabaseUid?: string;
  supabaseProvider?: string;
}

export interface UserSession {
  user: Omit<User, 'password'>;
  token: string;
}

export interface AppState {
  syncCode: string;
  transactions: Transaction[];
  banks: BankConnection[];
  budgets: Budget[];
  preferences: UserPreferences;
  lastUpdated: number;
  customCategories?: CustomCategory[];
  investments?: Investment[];
  creditCards?: CreditCard[];
}

export const AVAILABLE_CURRENCIES = [
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileiro', rateToUSD: 0.20 }, // 1 BRL = 0.20 USD
  { code: 'USD', symbol: '$', name: 'Dólar Americano', rateToUSD: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 1.08 },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', rateToUSD: 1.27 },
];

export const CATEGORIES = [
  { id: 'Alimentação', label: 'Alimentação', color: '#f87171', icon: 'Utensils', emoji: '🍔' },
  { id: 'Moradia', label: 'Moradia', color: '#60a5fa', icon: 'Home', emoji: '🏠' },
  { id: 'Transporte', label: 'Transporte', color: '#fbbf24', icon: 'Car', emoji: '🚗' },
  { id: 'Lazer', label: 'Lazer', color: '#34d399', icon: 'Smile', emoji: '🎉' },
  { id: 'Saúde', label: 'Saúde', color: '#f472b6', icon: 'HeartPulse', emoji: '💊' },
  { id: 'Educação', label: 'Educação', color: '#a78bfa', icon: 'GraduationCap', emoji: '📚' },
  { id: 'Salário', label: 'Salário', color: '#10b981', icon: 'DollarSign', emoji: '💰' },
  { id: 'Compras', label: 'Compras', color: '#f59e0b', icon: 'ShoppingBag', emoji: '🛍️' },
  { id: 'Assinaturas', label: 'Assinaturas', color: '#8b5cf6', icon: 'Tv', emoji: '📺' },
  { id: 'Investimentos', label: 'Investimentos', color: '#06b6d4', icon: 'TrendingUp', emoji: '📈' },
  { id: 'Viagem', label: 'Viagem', color: '#14b8a6', icon: 'Plane', emoji: '✈️' },
  { id: 'Presentes', label: 'Presentes', color: '#ec4899', icon: 'Gift', emoji: '🎁' },
  { id: 'Outros', label: 'Outros', color: '#9ca3af', icon: 'Layers', emoji: '📦' },
];

export function getTransactionPaymentDate(tx: Transaction, creditCards: CreditCard[] = []): string {
  if (tx.paymentMethod !== 'credito' || !tx.creditCardId) {
    return tx.date;
  }

  const card = creditCards.find((c) => c.id === tx.creditCardId);
  if (!card) {
    return tx.date;
  }

  const [yearStr, monthStr, dayStr] = tx.date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return tx.date;
  }

  let invoiceYear = year;
  let invoiceMonth = month;

  // Se o dia do lançamento for após o dia de fechamento, cai na fatura do mês seguinte
  if (day > card.closingDay) {
    invoiceMonth += 1;
    if (invoiceMonth > 12) {
      invoiceMonth = 1;
      invoiceYear += 1;
    }
  }

  // O vencimento é no dia devido (dueDay) daquela fatura
  let dueYear = invoiceYear;
  let dueMonth = invoiceMonth;
  
  if (card.dueDay < card.closingDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  const formattedMonth = String(dueMonth).padStart(2, '0');
  const formattedDay = String(card.dueDay).padStart(2, '0');
  
  return `${dueYear}-${formattedMonth}-${formattedDay}`;
}

