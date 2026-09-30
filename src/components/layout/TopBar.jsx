import { useEffect, useState } from "react";
import { LogOut, Bell, BellOff, Calculator, Wrench } from "lucide-react";
import { C } from "../../styles/tokens";
import { IconBtn } from "../ui/UIKit";
import { pushSoportado, notificacionesActivas, activarNotificaciones } from "../../services/pushService";
import { isSoporteAuthorized } from "../../utils/rbac";

export default function TopBar({ profile, userId, user, view, setView, onLogout, onOpenSimulador }) {
  const [activas, setActivas] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (pushSoportado()) notificacionesActivas().then(setActivas);
  }, []);

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
      background: "rgba(11, 17, 32, 0.7)", 
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "16px 20px", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      width: "100%", 
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
          RUTA<span style={{ color: C.coral }}>·</span>CRM
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {profile?.nombre || "Usuario"} · {profile?.rol === "admin" ? "Administrador" : "Asesor comercial"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {/* Acceso Rápido Soporte Técnico Exclusivo para Jhonka001@gmail.com */}
        {canAccessSoporte && setView && (
          <button
            onClick={() => setView("soporte")}
            title="Módulo de Soporte Técnico y Cuentas de Cobro"
            style={{
              background: view === "soporte" ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.08)",
              border: view === "soporte" ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.2)",
              color: view === "soporte" ? "#38bdf8" : "#fff",
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
            <Wrench size={14} color="#38bdf8" />
            <span>Soporte IT</span>
          </button>
        )}

        {onOpenSimulador && (
          <button
            onClick={onOpenSimulador}
            title="Simulador de crédito"
            style={{
              background: "rgba(225, 78, 42, 0.18)",
              border: "1px solid rgba(225, 78, 42, 0.5)",
              color: "#fff",
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
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(225, 78, 42, 0.3)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(225, 78, 42, 0.18)"}
          >
            <Calculator size={14} color={C.coral} />
            <span className="topbar-label-oculta-en-movil">Simulador</span>
          </button>
        )}

        {pushSoportado() && (
          <IconBtn
            icon={activas ? Bell : BellOff}
            label={activas ? "Notificaciones activas" : "Activar notificaciones de citas"}
            tone="glass"
            disabled={cargando}
            onClick={toggleNotificaciones}
          />
        )}
        <button
          onClick={() => { if (confirm("¿Seguro que deseas cerrar sesión?")) onLogout(); }}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
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
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
          onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"}
        >
          <LogOut size={14} color={C.coral} />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}