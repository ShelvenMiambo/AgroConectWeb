import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Captura erros de renderização em qualquer componente filho e mostra um
 * ecrã de recuperação em vez de um ecrã branco total. Evita que uma falha
 * pontual deite a app inteira abaixo.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Registo no console (visível em produção nas ferramentas do browser).
    // Quando integrarmos monitorização (ex.: Sentry), é aqui que se envia.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-bold">Algo correu mal</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado. Já foi registado. Tente recarregar a página.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-2 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }
}
