import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    if (typeof window !== "undefined" && window.favoronLogError) {
      window.favoronLogError(error, {
        componentStack: errorInfo.componentStack,
        severity: "fatal",
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
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
            Algo salió mal
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem", maxWidth: "400px" }}>
            Ocurrió un error inesperado. Por favor recarga la página para continuar.
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
