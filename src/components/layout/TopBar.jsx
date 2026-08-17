import { useEffect, useState } from "react";
import { LogOut, Bell, BellOff } from "lucide-react";
import { C } from "../../styles/tokens";
import { IconBtn } from "../ui/UIKit";
import { pushSoportado, notificacionesActivas, activarNotificaciones } from "../../services/pushService";

export default function TopBar({ profile, userId, onLogout }) {
  const [activas, setActivas] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (pushSoportado()) notificacionesActivas().then(setActivas);
  }, []);

  const toggleNotificaciones = async () => {
    if (activas || !pushSoportado()) return;
    setCargando(true);
    try {
      await activarNotificaciones(userId);
      setActivas(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ background: C.ink, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>
          RUTA<span style={{ color: C.coral }}>·</span>CRM
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
          {profile?.nombre || "Usuario"} · {profile?.rol === "admin" ? "Administrador" : "Asesor comercial"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {pushSoportado() && (
          <IconBtn
            icon={activas ? Bell : BellOff}
            label={activas ? "Notificaciones activas" : "Activar notificaciones de citas"}
            tone="line"
            disabled={cargando}
            onClick={toggleNotificaciones}
          />
        )}
        <IconBtn icon={LogOut} label="Cerrar sesión" tone="line" onClick={() => { if (confirm("¿Cerrar sesión?")) onLogout(); }} />
      </div>
    </div>
  );
}
