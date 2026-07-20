import React, { useState } from 'react';
import { AppState, AVAILABLE_CURRENCIES, UserSession, UserPreferences } from '../types';
import { supabase } from '../hooks/useFinanceState';
import { 
  User, 
  Mail, 
  Lock, 
  Coins, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Layers,
  TrendingUp,
  Wallet,
  Calendar,
  Eye,
  EyeOff,
  Fingerprint,
  Shield,
  ShieldCheck,
  Trash2,
  Copy,
  Plus,
  KeyRound,
  RefreshCw
} from 'lucide-react';

interface UserProfileProps {
  state: AppState | null;
  session: UserSession | null;
  registerUser: (name: string, email: string, password: string, baseCurrency: string) => Promise<{ success: boolean; error?: string }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithSupabase?: (email: string, name?: string, supabaseUid?: string, supabaseProvider?: string, baseCurrency?: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updatePreferences?: (prefs: Partial<UserPreferences>) => void;
}

export default function UserProfile({
  state,
  session,
  registerUser,
  loginUser,
  loginWithSupabase,
  logoutUser,
  updatePassword,
  updatePreferences
}: UserProfileProps) {
  // Navigation within auth
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form Fields - Login/Register
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('BRL');

  // Form Fields - Update Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Security and PIX Settings States
  const [pinInput, setPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [pixKeyValue, setPixKeyValue] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Clear messages on toggle modes
  const toggleAuthMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setName('');
    setEmail('');
    setPassword('');
  };



  // Submit Login/Registration
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    if (isRegisterMode) {
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome.');
        setIsLoading(false);
        return;
      }
      const res = await registerUser(name, email, password, baseCurrency);
      if (res.success) {
        setSuccessMessage('Conta criada com sucesso!');
      } else {
        setErrorMessage(res.error || 'Não foi possível registrar.');
      }
    } else {
      const res = await loginUser(email, password);
      if (res.success) {
        setSuccessMessage('Login efetuado com sucesso!');
      } else {
        setErrorMessage(res.error || 'Credenciais inválidas.');
      }
    }
    setIsLoading(false);
  };

  // Submit Update Password
  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setErrorMessage('Todos os campos de senha são obrigatórios.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('As novas senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);
    const res = await updatePassword(currentPassword, newPassword);
    if (res.success) {
      setSuccessMessage('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setErrorMessage(res.error || 'Erro ao atualizar a senha.');
    }
    setIsLoading(false);
  };

  // Security Preference & PIX Key Handlers
  const handleToggleBiometrics = (val: boolean) => {
    if (!updatePreferences) return;
    updatePreferences({ appLockBiometrics: val });
    setSecurityMessage(`Biometria simulada ${val ? 'ativada' : 'desativada'}.`);
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  const handleToggleShuffle = (val: boolean) => {
    if (!updatePreferences) return;
    updatePreferences({ appLockShuffle: val });
    setSecurityMessage(`Teclado embaralhado ${val ? 'ativado' : 'desativado'}.`);
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityMessage(null);

    if (!pinInput || pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
      setSecurityError('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    if (updatePreferences) {
      updatePreferences({ appLockPin: pinInput });
      setPinInput('');
      setShowPinInput(false);
      setSecurityMessage('PIN de segurança atualizado com sucesso!');
      setTimeout(() => setSecurityMessage(null), 3000);
    }
  };

  const handleRemovePin = () => {
    setSecurityError(null);
    setSecurityMessage(null);
    if (!updatePreferences) return;

    updatePreferences({ appLockPin: undefined });
    setSecurityMessage('PIN de segurança removido.');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  const handleAddPixKey = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityMessage(null);

    if (!pixKeyValue.trim() || !updatePreferences || !state) return;

    const currentKeys = state.preferences.pixKeys || [];
    if (currentKeys.some(k => k.key.trim().toLowerCase() === pixKeyValue.trim().toLowerCase())) {
      setSecurityError('Esta chave PIX já está cadastrada.');
      return;
    }

    const newKey = { type: pixKeyType, key: pixKeyValue.trim() };
    updatePreferences({
      pixKeys: [...currentKeys, newKey]
    });
    setPixKeyValue('');
    setSecurityMessage('Chave PIX cadastrada com sucesso!');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  const handleRemovePixKey = (keyToRemove: string) => {
    setSecurityError(null);
    setSecurityMessage(null);
    if (!updatePreferences || !state) return;

    const currentKeys = state.preferences.pixKeys || [];
    updatePreferences({
      pixKeys: currentKeys.filter(k => k.key !== keyToRemove)
    });
    setSecurityMessage('Chave PIX removida com sucesso.');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  const handleCopyKey = (keyVal: string) => {
    navigator.clipboard.writeText(keyVal);
    setCopiedKeyId(keyVal);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Format creation date
  const memberSince = session?.user.createdAt 
    ? new Date(session.user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Julho de 2026';

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4" id="user-profile-tab">
      {/* If USER is logged in */}
      {session ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card corrigido com flex-wrap para evitar estouro */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-lg border border-indigo-950 flex flex-wrap justify-between items-center gap-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-0 bottom-0 opacity-10 font-mono text-9xl translate-x-12 translate-y-12 select-none">
              💰
            </div>
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

            <div className="flex items-center gap-4 md:gap-5 z-10">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-linear-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl font-extrabold border-2 border-white/20 shadow-md">
                {session.user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight">{session.user.name}</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded text-[9px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" /> Premium
                  </span>
                </div>
                <p className="text-xs md:text-sm text-blue-200 font-mono flex items-center gap-1.5 opacity-90">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{session.user.email}</span>
                </p>
                <p className="text-[10px] md:text-xs text-blue-300 font-sans flex items-center gap-1 mt-1 opacity-75">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Membro desde {memberSince}</span>
                </p>
              </div>
            </div>

            <button
              onClick={logoutUser}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm z-10 cursor-pointer self-stretch md:self-auto justify-center"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>

          {session.user.isSupabase && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-6 shadow-xs space-y-4 animate-fade-in select-none">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-600">
                    <span className="font-bold text-lg select-none">⚡</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-950 font-sans tracking-tight">Supabase Authentication Ativo</h3>
                    <p className="text-[10px] text-emerald-700 font-mono mt-0.5">Sessão segura autenticada via Supabase SDK</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 rounded-full text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                <div className="p-3 bg-white border border-emerald-500/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Provedor</span>
                  <span className="text-gray-800 font-bold font-mono text-[11px] capitalize">
                    {session.user.supabaseProvider || 'Supabase'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-emerald-500/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Supabase User UID</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-gray-800 font-mono font-bold text-[10px] truncate max-w-[120px]">
                      {session.user.supabaseUid}
                    </span>
                    <button
                      onClick={() => handleCopyKey(session.user.supabaseUid || '')}
                      className="text-gray-400 hover:text-emerald-600 cursor-pointer p-0.5"
                      title="Copiar UID"
                    >
                      {copiedKeyId === session.user.supabaseUid ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white border border-emerald-500/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Projeto ID</span>
                  <span className="text-gray-800 font-mono font-bold text-[10px] truncate">
                    xkkdzlpjlvinfujtmlec
                  </span>
                </div>

                <div className="p-3 bg-white border border-emerald-500/10 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Sincronismo Cloud</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[10px]">
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                    Supabase DB Ativo
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grid: Financial Stats & Password Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Stats Panel */}
            <div className="w-full bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-gray-950 font-sans tracking-tight border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <span>Estatísticas da Conta</span>
              </h3>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-gray-150 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Moeda Base</p>
                    <p className="text-xs text-gray-800 font-bold mt-0.5">
                      {AVAILABLE_CURRENCIES.find((c) => c.code === session.user.baseCurrency)?.name || session.user.baseCurrency}
                    </p>
                  </div>
                  <Coins className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="p-3 bg-slate-50 border border-gray-150 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Código de Sincronização</p>
                    <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                      {session.user.syncCode}
                    </p>
                  </div>
                  <Layers className="w-5 h-5 text-indigo-500" />
                </div>

                <div className="p-3 bg-slate-50 border border-gray-150 rounded-xl space-y-2">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block border-b border-gray-100 pb-1">
                    Ativos Cadastrados
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Contas/Bancos:</span>
                      <strong className="text-gray-800 ml-1">{(state?.banks || []).filter(b => b.connected).length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Cartões:</span>
                      <strong className="text-gray-800 ml-1">{(state?.creditCards || []).length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Transações:</span>
                      <strong className="text-gray-800 ml-1">{(state?.transactions || []).length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Investimentos:</span>
                      <strong className="text-gray-800 ml-1">{(state?.investments || []).length}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Panel */}
            <div className="w-full bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-950 font-sans tracking-tight border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Alterar Senha de Acesso</span>
              </h3>

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {session?.user?.supabaseProvider !== 'google.com' ? (
                <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Senha Atual</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Sua senha atual"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? 'Atualizando...' : 'Alterar Senha'}
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 border border-indigo-100">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800">Conta Google</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                    Gerencie sua senha e segurança diretamente nas configurações da sua conta Google.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* If USER is not logged in - LOGIN / REGISTER GATEWAY */
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-gray-150 shadow-md p-6 sm:p-8 space-y-6 animate-fade-in select-none">
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              {isRegisterMode ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 font-sans tracking-tight">
                {isRegisterMode ? 'Criar Nova Conta' : 'Acesse seu Perfil Financeiro'}
              </h2>
              <p className="text-xs text-gray-500 font-sans max-w-sm mx-auto mt-0.5">
                {isRegisterMode 
                  ? 'Cadastre-se para sincronizar seus cartões, orçamentos, investimentos e contas bancárias com segurança.' 
                  : 'Entre para recuperar e sincronizar seus lançamentos em tempo real de qualquer dispositivo.'
                }
              </p>
            </div>
          </div>

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Unified Supabase Email/Password Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Como devemos te chamar?</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou apelido"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@dominio.com"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 transition font-sans"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha de segurança"
                  className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 transition font-mono"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Moeda Principal do Aplicativo</label>
                <div className="relative">
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  >
                    {AVAILABLE_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <Coins className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 mt-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                isRegisterMode ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />
              )}
              <span>{isLoading ? (isRegisterMode ? 'Cadastrando...' : 'Conectando...') : (isRegisterMode ? 'Cadastrar e Conectar' : 'Entrar na Conta')}</span>
            </button>
          </form>

          {/* Social Sign-in Methods */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-150"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-300 uppercase font-extrabold tracking-wider">ou continue com</span>
            <div className="flex-grow border-t border-gray-150"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Google OAuth */}
            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                  if (error) throw error;
                } catch (err: any) {
                  alert(err.message || 'Erro ao autenticar com o Google');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-200 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.61 0 3.06.55 4.19 1.63l3.12-3.12C17.43 1.83 14.93 1 12 1 7.37 1 3.4 3.66 1.48 7.56l3.69 2.86C6.04 7.23 8.78 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.5z" />
                <path fill="#FBBC05" d="M5.17 10.42c-.24-.72-.37-1.49-.37-2.29s.13-1.57.37-2.29L1.48 4.98C.54 6.88 0 9.03 0 11.29s.54 4.41 1.48 6.31l3.69-2.86c-.24-.72-.37-1.49-.37-2.29z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.53 1.19-4.3 1.19-3.22 0-5.96-2.19-6.93-5.18l-3.69 2.86C3.4 20.34 7.37 23 12 23z" />
              </svg>
              <span>Google</span>
            </button>

            {/* Anonymous Login */}
            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  let data, error;
                  if (typeof (supabase.auth as any).signInAnonymously === 'function') {
                    const res = await (supabase.auth as any).signInAnonymously();
                    data = res.data;
                    error = res.error;
                  } else {
                    throw new Error('signInAnonymously is not a function');
                  }
                  if (error) throw error;
                  if (data?.user) {
                    if (loginWithSupabase) {
                      await loginWithSupabase(
                        data.user.email || 'anon.user@supabase.com',
                        'Visitante Anônimo',
                        data.user.id,
                        'supabase'
                      );
                    }
                  }
                } catch (err: any) {
                  if (loginWithSupabase) {
                    const mockUid = 'sb_anon_' + Math.random().toString(36).substring(2, 12).toUpperCase();
                    await loginWithSupabase('anon.user@supabase.com', 'Visitante Anônimo', mockUid, 'supabase');
                  } else {
                    alert(err.message || 'Erro no acesso anônimo');
                  }
                } finally {
                  setIsLoading(false);
                }
              }}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" /> : <User className="w-3.5 h-3.5" />}
              <span>Anônimo</span>
            </button>
          </div>

          {/* Switch Auth Mode & Continue as Guest options */}
          <div className="space-y-3.5 pt-3 border-t border-gray-100 text-center text-xs">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold transition cursor-pointer block mx-auto"
            >
              {isRegisterMode ? 'Já tem uma conta? Faça Login' : 'Ainda não tem conta? Cadastre-se'}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-3 text-[10px] text-gray-300 uppercase font-bold tracking-widest">ou</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <p className="text-[11px] text-gray-400">
              Quer testar o app offline sem salvar? Você pode usar como visitante.
            </p>
          </div>
        </div>
      )}

      {/* Central de Segurança Avançada & Chaves PIX - Available only when logged in */}
      {session && (
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950 font-sans tracking-tight">Central de Segurança Avançada & PIX</h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5">Configure biometria simulada, proteção contra olhares curiosos e chaves de recebimento.</p>
            </div>
          </div>
          {/* Quick status badge */}
          <div className="flex items-center gap-1.5 self-start sm:self-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Módulo Ativo</span>
          </div>
        </div>

        {/* Global Security Alerts */}
        {securityMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{securityMessage}</span>
          </div>
        )}
        {securityError && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{securityError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Column A: Security Locks & Controls */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Controle de Bloqueio & PIN
            </h4>

            {/* PIN Configuration */}
            <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-gray-950">Bloqueio por PIN</h5>
                  <p className="text-[10px] text-gray-500">Exige um código de 4 dígitos para acessar o app.</p>
                </div>
                {state?.preferences.appLockPin ? (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Desativar PIN
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPinInput(!showPinInput)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Ativar PIN
                  </button>
                )}
              </div>

              {/* Active status indicator */}
              {state?.preferences.appLockPin && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded-lg px-2.5 py-1 w-max">
                  <Lock className="w-3.5 h-3.5" />
                  <span>PIN Ativo: ****</span>
                </div>
              )}

              {(showPinInput || !state?.preferences.appLockPin) && (
                <form onSubmit={handleUpdatePin} className="space-y-2 pt-2 border-t border-gray-200/50">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase">Definir Novo PIN (4 dígitos)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      pattern="\d{4}"
                      placeholder="Ex: 1234"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-24 px-3 py-1.5 text-center text-xs font-mono font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Salvar PIN
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Extra Security Toggles */}
            <div className="space-y-4">
              {/* Simulated Biometrics Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-gray-150 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shrink-0 animate-pulse">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-950">Biometria (Face ID / Touch ID)</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">Ativa atalho de leitura biométrica rápida na tela de bloqueio.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!state?.preferences.appLockPin}
                  onClick={() => handleToggleBiometrics(!state?.preferences.appLockBiometrics)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                    state?.preferences.appLockBiometrics ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    state?.preferences.appLockBiometrics ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Shuffle Keypad Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-gray-150 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-600 shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-950">Teclado Embaralhado</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">Sempre embaralha o teclado numérico para proteção contra olhares.</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!state?.preferences.appLockPin}
                  onClick={() => handleToggleShuffle(!state?.preferences.appLockShuffle)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                    state?.preferences.appLockShuffle ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    state?.preferences.appLockShuffle ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Column B: PIX Keys Registry */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-1.5">
              <Coins className="w-3.5 h-3.5" /> Cadastro de Chaves PIX
            </h4>

            {/* Pix Key Insertion Form */}
            <form onSubmit={handleAddPixKey} className="p-4 bg-slate-50 border border-gray-150 rounded-2xl space-y-4">
              <h5 className="text-xs font-bold text-gray-950">Adicionar Nova Chave</h5>
              
              <div className="grid grid-cols-4 gap-1.5">
                {(['cpf', 'email', 'phone', 'random'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPixKeyType(type)}
                    className={`py-1.5 text-[10px] font-bold border rounded-lg transition uppercase ${
                      pixKeyType === type
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-500 border-gray-250 hover:bg-gray-50'
                    }`}
                  >
                    {type === 'phone' ? 'Fone' : type === 'random' ? 'Chave' : type}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Valor da Chave PIX</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={
                      pixKeyType === 'cpf' ? '000.000.000-00' :
                      pixKeyType === 'email' ? 'exemplo@email.com' :
                      pixKeyType === 'phone' ? '+55 (11) 99999-9999' : 'Chave aleatória'
                    }
                    value={pixKeyValue}
                    onChange={(e) => setPixKeyValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar
                  </button>
                </div>
              </div>
            </form>

            {/* List of current keys */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Suas Chaves Cadastradas</h5>
              
              {(!state?.preferences?.pixKeys || state.preferences.pixKeys.length === 0) ? (
                <div className="py-6 text-center border border-dashed border-gray-150 rounded-2xl">
                  <p className="text-xs text-gray-400">Nenhuma chave PIX cadastrada.</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Cadastre suas chaves para gerar cobranças rápidas.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {state.preferences.pixKeys.map((k) => (
                    <div key={k.key} className="p-2.5 bg-white border border-gray-150 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase tracking-wider">
                            {k.type === 'phone' ? 'Celular' : k.type === 'random' ? 'Aleatória' : k.type}
                          </span>
                          <span className="font-mono font-bold text-gray-800 text-xs truncate block">{k.key}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyKey(k.key)}
                          className="p-1.5 hover:bg-gray-50 border border-gray-150 text-gray-500 hover:text-gray-800 rounded-lg transition cursor-pointer"
                          title="Copiar Chave PIX"
                        >
                          {copiedKeyId === k.key ? (
                            <span className="text-[10px] text-emerald-600 font-bold px-1">Copiado!</span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePixKey(k.key)}
                          className="p-1.5 hover:bg-rose-50 border border-rose-150 text-rose-500 hover:text-rose-700 rounded-lg transition cursor-pointer"
                          title="Remover Chave PIX"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
