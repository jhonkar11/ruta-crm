import { useEffect, useState } from "react";
import { LogOut, Bell, BellOff, Calculator, Wrench, Sun, Moon } from "lucide-react";
import { C } from "../../styles/tokens";
import { IconBtn } from "../ui/UIKit";
import { pushSoportado, notificacionesActivas, activarNotificaciones } from "../../services/pushService";
import { isSoporteAuthorized } from "../../utils/rbac";

export default function TopBar({ profile, userId, user, view, setView, onLogout, onOpenSimulador, theme = "light", toggleTheme }) {
  const [activas, setActivas] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (pushSoportado()) notificacionesActivas().then(setActivas);
  }, []);

  const isDark = theme === "dark";
  const canAccessSoporte = isSoporteAuthorized(user, profile);

  const toggleNotificaciones = async () => {
    if (activas || !pushSoportado()) return;
    setCargando(true);
    try {
      await activarNotificaciones(userId);
      setActivas(true);
      alert("¡Notificaciones de citas activadas correctamente!");
    } catch (e) {
      console.warn("Aviso de notificaciones:", e.message);
      alert("Las notificaciones push requieren configurar las llaves VAPID en el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ 
      background: isDark ? "rgba(11, 17, 32, 0.85)" : "rgba(255, 255, 255, 0.95)", 
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
      padding: "14px 20px", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      width: "100%", 
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.4)" : "0 2px 10px rgba(0, 0, 0, 0.04)",
      transition: "background 0.25s ease, border-color 0.25s ease"
    }}>
      <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: isDark ? "#fff" : "#0F172A" }}>
          RUTA<span style={{ color: C.coral }}>·</span>CRM
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(15, 23, 42, 0.6)", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {profile?.nombre || "Usuario"} · {profile?.rol === "admin" ? "Administrador" : "Asesor comercial"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {/* Interruptor de Tema (Modo Claro / Modo Oscuro) */}
        {toggleTheme && (
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Cambiar a Modo Claro (Light)" : "Cambiar a Modo Oscuro (Dark)"}
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.06)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.12)",
              color: isDark ? "#FCD34D" : "#475569",
              padding: "6px 12px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              transition: "all 0.2s"
            }}
          >
            {isDark ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#475569" />}
            <span className="topbar-label-oculta-en-movil">
              {isDark ? "Claro" : "Oscuro"}
            </span>
          </button>
        )}

        {/* Acceso Rápido Soporte Técnico Exclusivo para Jhonka001@gmail.com */}
        {canAccessSoporte && setView && (
          <button
            onClick={() => setView("soporte")}
            title="Módulo de Soporte Técnico y Cuentas de Cobro"
            style={{
              background: view === "soporte" 
                ? (isDark ? "rgba(56, 189, 248, 0.25)" : "rgba(2, 132, 199, 0.15)")
                : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"),
              border: view === "soporte" 
                ? (isDark ? "1px solid #38bdf8" : "1px solid #0284c7")
                : (isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.1)"),
              color: isDark ? "#38bdf8" : "#0284c7",
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              transition: "all 0.2s"
            }}
          >
            <Wrench size={14} color={isDark ? "#38bdf8" : "#0284c7"} />
            <span>Soporte IT</span>
          </button>
        )}

        {/* Simulador */}
        {onOpenSimulador && (
          <button
            onClick={onOpenSimulador}
            title="Simulador de crédito"
            style={{
              background: isDark ? "rgba(225, 78, 42, 0.18)" : "rgba(225, 78, 42, 0.08)",
              border: isDark ? "1px solid rgba(225, 78, 42, 0.5)" : "1px solid rgba(225, 78, 42, 0.3)",
              color: isDark ? "#fff" : C.coralDark,
              padding: "6px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(225, 78, 42, 0.3)" : "rgba(225, 78, 42, 0.15)"}
            onMouseOut={(e) => e.currentTarget.style.background = isDark ? "rgba(225, 78, 42, 0.18)" : "rgba(225, 78, 42, 0.08)"}
          >
            <Calculator size={14} color={C.coral} />
            <span className="topbar-label-oculta-en-movil">Simulador</span>
          </button>
        )}

        {pushSoportado() && (
          <IconBtn
            icon={activas ? Bell : BellOff}
            label={activas ? "Notificaciones activas" : "Activar notificaciones de citas"}
            tone={isDark ? "glass" : "line"}
            disabled={cargando}
            onClick={toggleNotificaciones}
          />
        )}

        <button
          onClick={() => { if (confirm("¿Seguro que deseas cerrar sesión?")) onLogout(); }}
          style={{
            background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(0, 0, 0, 0.12)",
            color: isDark ? "#fff" : "#0F172A",
            padding: "6px 12px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontFamily: "'IBM Plex Mono', monospace",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.09)"}
          onMouseOut={(e) => e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"}
        >
          <LogOut size={14} color={C.coral} />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}