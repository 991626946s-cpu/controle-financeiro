import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Check, 
  AlertCircle, 
  Info, 
  MoreVertical, 
  PlusSquare, 
  Compass, 
  Share2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  WifiOff,
  Sparkles,
  Layout,
  Vibrate
} from 'lucide-react';

export default function AndroidPwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [activeStep, setActiveStep] = useState(1);
  const [isInIframe, setIsInIframe] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);

  useEffect(() => {
    // Detecta se o app está rodando dentro de um iframe (painel do AI Studio)
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

    // Escuta o evento beforeinstallprompt do Chrome no Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se já está rodando em modo standalone (PWA instalado)
    if (
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerNativeInstall = async () => {
    if (!deferredPrompt) {
      setAlertModal({
        isOpen: true,
        title: 'Instalação Não Disponível',
        message: 'O instalador nativo ainda não está pronto no seu navegador atual. Siga as instruções manuais passo-a-passo logo abaixo para instalar este aplicativo de forma simples!'
      });
      return;
    }
    
    try {
      setInstallStatus('installing');
      // Vibra levemente ao clicar (se suportado pelo Android)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallStatus('success');
        setIsInstalled(true);
        setIsInstallable(false);
      } else {
        setInstallStatus('idle');
      }
    } catch (err) {
      console.error('Erro na instalação nativa:', err);
      setInstallStatus('error');
    } finally {
      setDeferredPrompt(null);
    }
  };

  const tryVibrateFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="space-y-6" id="android-pwa-tab">
      
      {/* Aviso de iFrame do AI Studio */}
      {isInIframe && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-900 font-sans">Visualização Restrita (Painel Incorporado)</h4>
              <p className="text-xs text-amber-700 leading-relaxed max-w-xl">
                Navegadores bloqueiam a instalação de aplicativos quando executados dentro de um painel incorporado (iFrame). Para instalar com sucesso no seu celular, você precisa abrir o app diretamente em sua própria aba fora do AI Studio!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.open(window.location.href, '_blank')}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir em Nova Aba</span>
          </button>
        </div>
      )}
      
      {/* Banner Principal */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Texto de Apresentação */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Instalação Oficial do App Android</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-200">
              Transforme este sistema em um Aplicativo Android Nativo
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Chega de usar o navegador! Instale agora o nosso aplicativo oficial para Android no formato <strong className="text-white">PWA (Progressive Web App)</strong>. O app é extremamente leve, atualizado automaticamente e funciona direto no seu aparelho.
            </p>

            {/* Vantagens do App */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 p-2.5 rounded-xl">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200">Desempenho Veloz</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 p-2.5 rounded-xl">
                <WifiOff className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200">Suporte Offline</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-200">Seguro e Leve</span>
              </div>
            </div>

            {/* Botão de Instalação Principal (Nativo ou Fallback) */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg">
                  <Check className="w-5 h-5 animate-bounce" />
                  <span>Você já está usando o App instalado!</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={triggerNativeInstall}
                  className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/20"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Aplicativo Oficial</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('manual-guide');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white px-8 py-3.5 rounded-2xl text-sm font-bold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Ver Guia de Instalação Rápida</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={tryVibrateFeedback}
                className="px-5 py-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl text-xs text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Testar vibração nativa do Android"
              >
                <Vibrate className="w-4 h-4 text-indigo-400" />
                <span>Testar Resposta Tátil</span>
              </button>
            </div>
          </div>

          {/* Celular Mockup no Lado Direito */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-64 aspect-[9/18] bg-slate-950 border-[6px] border-slate-800 rounded-[36px] shadow-2xl relative overflow-hidden flex flex-col ring-8 ring-slate-900/40">
              
              {/* Câmera Notching superior do Android */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-slate-950 rounded-full ml-auto mr-1" />
              </div>
              
              {/* Barra de Status */}
              <div className="bg-indigo-950/80 px-4 pt-1.5 pb-1 flex justify-between text-[8px] font-mono font-bold text-indigo-200 z-20">
                <span>09:41</span>
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-3.5 h-2 bg-indigo-300/80 rounded-xs" />
                </div>
              </div>

              {/* Corpo do App Simulador */}
              <div className="flex-1 bg-slate-900 p-3 flex flex-col justify-between relative z-10">
                <div className="space-y-2 mt-4">
                  {/* Logo do App no celular */}
                  <div className="flex items-center gap-2 bg-indigo-900/30 p-2 rounded-xl border border-indigo-500/20">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/10149/10149455.png" 
                      alt="Logo" 
                      className="w-7 h-7 object-contain"
                    />
                    <div className="leading-tight">
                      <p className="text-[10px] font-bold text-white">Controle Financeiro</p>
                      <p className="text-[7px] text-indigo-300">Aplicativo Oficial</p>
                    </div>
                  </div>

                  {/* Card de Boas-vindas simulado */}
                  <div className="bg-slate-800/80 border border-slate-700/50 p-2.5 rounded-lg space-y-1">
                    <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Saldo Líquido</p>
                    <p className="text-xs font-mono font-bold text-emerald-400">R$ 14.850,00</p>
                    <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[70%]" />
                    </div>
                  </div>

                  {/* Detalhes de metas simuladas */}
                  <div className="bg-slate-800/80 border border-slate-700/50 p-2.5 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-[7px] text-slate-300">
                      <span>Viagem de Férias ✈️</span>
                      <span className="font-bold font-mono">82%</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full w-[82%]" />
                    </div>
                  </div>
                </div>

                {/* Home screen widget ou launcher icon mock */}
                <div className="border-t border-slate-800 pt-2 flex flex-col items-center text-center space-y-1">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md border border-indigo-400/30">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/10149/10149455.png" 
                      alt="Logo" 
                      className="w-5 h-5"
                    />
                  </div>
                  <p className="text-[7px] font-bold text-slate-300">Instalador Seguro</p>
                  <p className="text-[6px] text-slate-400">Pronto para a sua Tela Inicial</p>
                </div>
              </div>

              {/* Botão virtual de navegação do Android */}
              <div className="bg-slate-950 py-1 flex justify-center z-20">
                <div className="w-16 h-1 bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Por que instalar? Seção explicativa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
            <Layout className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Sem Barras de Navegação</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            O aplicativo é aberto em modo tela cheia, ocultando as barras de URL do Chrome, proporcionando 100% de aproveitamento de tela.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Leveza Absoluta</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Consome menos de 1 MB de armazenamento do celular. Sem ocupar memória RAM de forma excessiva como outros aplicativos pesados.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
          <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Acesso Offline Completo</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Abra o app mesmo quando estiver no avião ou sem sinal de internet para consultar o histórico ou rascunhar novos lançamentos.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-2">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Privacidade Garantida</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            O aplicativo roda de forma independente, sem coletar metadados do sistema ou acessar arquivos pessoais sem sua autorização.
          </p>
        </div>

      </div>

      {/* Guia de Instalação Manual (Para quando o prompt automático não disparar) */}
      <div id="manual-guide" className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            <span>Como Instalar Manualmente no Android (Chrome)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Se o seu celular não exibir o pop-up automático para instalar, você pode adicionar o app à tela inicial do Android em menos de 10 segundos!
          </p>
        </div>

        {/* Passos de Instalação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="space-y-3 relative">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold flex items-center justify-center font-mono">1</span>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Abra as Opções do Chrome</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pl-9">
              No navegador Chrome do Android, clique no ícone de <strong className="text-gray-800">Três Pontinhos <MoreVertical className="w-3.5 h-3.5 inline text-gray-500" /></strong> localizado no canto superior direito.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold flex items-center justify-center font-mono">2</span>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Adicionar à Tela Inicial</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pl-9">
              No menu suspenso, procure e clique na opção <strong className="text-gray-800">"Instalar aplicativo"</strong> ou <strong className="text-gray-800">"Adicionar à tela inicial" <PlusSquare className="w-3.5 h-3.5 inline text-gray-500" /></strong>.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold flex items-center justify-center font-mono">3</span>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Confirmar Instalação</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed pl-9">
              Confirme clicando em <strong className="text-indigo-600">Instalar</strong> ou <strong className="text-indigo-600">Adicionar</strong> no pop-up do Android. O app aparecerá junto com seus outros aplicativos!
            </p>
          </div>

        </div>

        {/* Dica para iOS/iPhone */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <strong className="block font-semibold">Dica Extra para iPhone (iOS):</strong>
            <p className="leading-relaxed">
              Você também pode instalar o app no iOS! Abra no navegador Safari, clique no botão de <strong className="font-bold">Compartilhar <Share2 className="w-3.5 h-3.5 inline text-indigo-500" /></strong> no menu inferior e selecione <strong className="font-bold">"Adicionar à Tela de Início"</strong>.
            </p>
          </div>
        </div>

      </div>

      {/* Elegant Custom Modal Alert */}
      {alertModal && alertModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-sm w-full shadow-lg space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 font-sans">{alertModal.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">{alertModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition duration-200 hover:scale-102 cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
