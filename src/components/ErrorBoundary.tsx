import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado ao carregar o jogo.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Theo Lucca ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl space-y-4">
            <h1 className="text-2xl font-black text-amber-400 uppercase font-['Rajdhani']">
              THEO LUCCA: FREE CITY
            </h1>
            <p className="text-sm text-slate-300">
              Ocorreu um problema gráfico ao iniciar a cena 3D neste navegador.
            </p>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded-xl break-words">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base uppercase tracking-wider transition"
            >
              Recarregar Jogo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
