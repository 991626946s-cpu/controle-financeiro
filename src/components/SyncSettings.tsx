import React, { useState } from 'react';
import { AppState, AVAILABLE_CURRENCIES } from '../types';
import { Share2, User, Coins, Check, Copy, RefreshCw, Smartphone, AlertCircle } from 'lucide-react';

interface SyncSettingsProps {
  state: AppState;
  setBaseCurrency: (currency: string) => void;
  setUserName: (name: string) => void;
  syncWithCode: (code: string) => Promise<boolean>;
  isSyncing: boolean;
  forceFetch: () => void;
}

export default function SyncSettings({
  state,
  setBaseCurrency,
  setUserName,
  syncWithCode,
  isSyncing,
  forceFetch,
}: SyncSettingsProps) {
  // Local state for edits
  const [userNameInput, setUserNameInput] = useState(state.preferences.userName);
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    if (userNameInput.trim()) {
      setUserName(userNameInput.trim());
    }
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    const success = await syncWithCode(codeInput.trim());
    if (success) {
      setSyncStatus('success');
      setCodeInput('');
    } else {
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="sync-tab">
      {/* 1. General Preferences Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-950 font-sans">Perfil e Moeda Padrão</h3>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Seu Nome</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Ex: João Silva"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600">Moeda Base de Relatórios</label>
          <p className="text-[11px] text-gray-400 font-sans">
            Seus lançamentos em outras moedas (USD, EUR, GBP) serão automaticamente convertidos para este teto ao exibir os gráficos do dashboard.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AVAILABLE_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setBaseCurrency(currency.code)}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                  state.preferences.baseCurrency === currency.code
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="text-base font-mono">{currency.symbol}</div>
                <div className="font-sans text-[10px] mt-0.5">{currency.code}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Sync Devices Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-950 font-sans">Sincronização em Tempo Real</h3>
          </div>
          {isSyncing && (
            <span className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold uppercase animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sincronizando...</span>
            </span>
          )}
        </div>

        {/* Sync Code display */}
        <div className="bg-gray-50 border border-gray-150 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">Este Dispositivo</p>
            <p className="text-2xl font-bold font-mono text-gray-900 tracking-wider mt-1">{state.syncCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition cursor-pointer ${
              copied
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            title="Copiar Código de Sincronismo"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Enter Code form */}
        <form onSubmit={handleSyncSubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Conectar a outro dispositivo
            </label>
            <p className="text-[11px] text-gray-400 font-sans mb-2">
              Insira o código de sincronismo do seu outro computador, tablet ou celular para mesclar as transações instantaneamente.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: SYNC-A3F4G8"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Vincular
              </button>
            </div>
          </div>

          {syncStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl text-xs flex gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Conectado com sucesso! Seus dados foram sincronizados em tempo real.</span>
            </div>
          )}

          {syncStatus === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Erro de sincronismo. Verifique se o código está correto ou se a conexão de rede está ativa.</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
