import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "280px",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(239, 68, 68, 0.05)",
            border: "1.5px dashed rgba(239, 68, 68, 0.4)",
            borderRadius: "16px",
            margin: "20px auto",
            maxWidth: "600px",
            textAlign: "center",
            fontFamily: "'Inter', system-ui, sans-serif"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ef4444", margin: "0 0 8px 0" }}>
            {this.props.title || "Ocurrió un problema al cargar esta sección"}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0", maxWidth: "440px" }}>
            {this.state.error?.message || "Error inesperado de ejecución en JavaScript."}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} />
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
