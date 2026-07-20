import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro de renderização:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-2xl mx-auto my-12" id="error-boundary-screen">
          <div className="bg-white rounded-3xl border border-red-100 p-8 shadow-md text-center space-y-6">
            
            {/* Warning Icon Banner */}
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto animate-pulse">
              <AlertTriangle className="w-8 h-8 stroke-[1.8]" />
            </div>

            {/* Title & Friendly Explanation */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                Ops! Algo deu errado ao carregar esta seção
              </h3>
              <p className="text-sm text-slate-500 font-sans leading-relaxed max-w-md mx-auto">
                Não se preocupe, seus dados estão totalmente seguros na nuvem sincronizada. Isso pode ter sido causado por alguma inconsistência temporária de dados.
              </p>
            </div>

            {/* Restoration Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Home className="w-4 h-4" />
                <span>Voltar ao Painel Geral</span>
              </button>
              
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Aplicativo</span>
              </button>
            </div>

            {/* Technical Details Accordion */}
            {this.state.error && (
              <div className="border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="mx-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <span>Detalhes Técnicos do Erro</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 text-left bg-rose-50 border border-rose-100/50 rounded-xl p-4 font-mono text-[11px] text-rose-700 overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed select-all">
                    <p className="font-bold mb-1">Erro: {this.state.error.message}</p>
                    <p className="opacity-80 text-[10px]">{this.state.error.stack}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
