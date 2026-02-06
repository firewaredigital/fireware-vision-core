import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * ErrorBoundary Global — Captura erros em qualquer componente filho.
 * 
 * Features:
 * - UI de fallback com opção de "Tentar novamente" e "Reportar erro"
 * - Log automático do erro no console.error com stack trace
 * - Reset automático ao detectar mudança em resetKeys (e.g. pathname)
 * - Proteção contra loops infinitos de erro (max 3 tentativas)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private prevResetKeys: unknown[];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
    this.prevResetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log com stack trace completo
    console.error('[ErrorBoundary] Erro capturado:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Callback opcional para integração com serviços de monitoramento
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset automático quando resetKeys mudam (e.g. navegação para outra rota)
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== this.prevResetKeys[index]
      );

      if (hasChanged) {
        this.prevResetKeys = this.props.resetKeys;
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRetry = () => {
    if (this.state.errorCount >= 3) {
      // Proteção contra loop infinito — recarregar a página
      window.location.reload();
      return;
    }
    this.resetError();
  };

  handleReport = () => {
    const { error, errorInfo } = this.state;
    const reportData = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    
    // Copiar detalhes do erro para o clipboard
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2))
      .then(() => {
        alert('Detalhes do erro copiados para a área de transferência. Cole-os em um email para o suporte.');
      })
      .catch(() => {
        console.error('Falha ao copiar dados do erro:', reportData);
      });
  };

  render() {
    if (this.state.hasError) {
      // Fallback personalizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorCount } = this.state;
      const isTooManyErrors = errorCount >= 3;

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-lg text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                {isTooManyErrors
                  ? 'Este erro persistiu após múltiplas tentativas. Tente recarregar a página.'
                  : 'Ocorreu um erro inesperado. Tente novamente ou reporte o problema.'}
              </p>
            </div>

            {/* Error details (collapsed) */}
            {error && (
              <details className="text-left rounded-lg border border-border bg-muted/50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Detalhes técnicos
                </summary>
                <pre className="mt-3 overflow-auto text-xs text-destructive max-h-40 whitespace-pre-wrap break-words">
                  {error.message}
                  {error.stack && '\n\n' + error.stack.split('\n').slice(1, 6).join('\n')}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                {isTooManyErrors ? 'Recarregar Página' : 'Tentar Novamente'}
              </button>
              <button
                onClick={this.handleReport}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
              >
                <Bug className="h-4 w-4" />
                Reportar Erro
              </button>
            </div>

            {/* Back to Dashboard link */}
            <div>
              <a
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Voltar ao Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
