import React from "react";

function isChunkLoadError(error: Error): boolean {
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('error loading dynamically imported module')
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
  autoReloading: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false, autoReloading: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
      autoReloading: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);

    // Auto-recover from chunk load errors (one attempt)
    if (isChunkLoadError(error)) {
      const retryKey = 'error-boundary-chunk-retry';
      const hasRetried = sessionStorage.getItem(retryKey);
      if (!hasRetried) {
        sessionStorage.setItem(retryKey, '1');
        this.setState({ autoReloading: true });
        window.location.reload();
        return;
      }
      // Already retried — clear flag and show error UI
      sessionStorage.removeItem(retryKey);
    }

    if (typeof window !== "undefined" && window.favoronLogError) {
      window.favoronLogError(error, {
        componentStack: errorInfo.componentStack,
        severity: "fatal",
      });
    }
  }

  handleReload = () => {
    // Clear all chunk retry flags before manual reload
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('chunk-retry-') || key === 'error-boundary-chunk-retry')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.autoReloading) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          background: "#fafafa",
          color: "#333",
        }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 500 }}>
            La aplicación se actualizó, recargando...
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          background: "#fafafa",
          color: "#333",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            {this.state.isChunkError
              ? "La aplicación se actualizó"
              : "Algo salió mal"}
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem", maxWidth: "400px" }}>
            {this.state.isChunkError
              ? "Hay una nueva versión disponible. Recarga la página para continuar."
              : "Ocurrió un error inesperado. Por favor recarga la página para continuar."}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 500,
              color: "#fff",
              background: "#2563eb",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
