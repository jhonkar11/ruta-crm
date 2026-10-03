import { useEffect, useState } from "react";
import {
  LogOut,
  Bell,
  BellOff,
  Calculator,
  Wrench,
  Sun,
  Moon,
  Network,
  Users,
  Home,
  Layers,
  ChevronDown
} from "lucide-react";
import { C } from "../../styles/tokens";
import { IconBtn } from "../ui/UIKit";
import { pushSoportado, notificacionesActivas, activarNotificaciones } from "../../services/pushService";
import { isSoporteAuthorized } from "../../utils/rbac";

export default function TopBar({
  profile,
  userId,
  user,
  view,
  setView,
  onLogout,
  onOpenSimulador,
  theme = "light",
  toggleTheme
}) {
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
      alert("Las notificaciones push requieren llaves VAPID configuradas.");
    } finally {
      setCargando(false);
    }
  };

  const navItems = [
    { id: "inicio", label: "Inicio", icon: Home },
    { id: "redes", label: "Redes & Sedes", icon: Network },
    { id: "soporte", label: "Sistemas & Soporte", icon: Wrench },
    { id: "contable", label: "Financiero", icon: Calculator },
    { id: "visitantes", label: "Visitantes", icon: Users },
    { id: "todos", label: "CRM Clientes", icon: Layers }
  ];

  return (
    <div
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-2xl transition-all duration-200 px-4 sm:px-6 py-3 shadow-md ${
        isDark
          ? "bg-slate-900/85 border-white/10 text-white"
          : "bg-white/90 border-slate-200/80 text-slate-900 shadow-slate-200/50"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* LOGO CORPORATIVO & ROL */}
        <div
          onClick={() => setView("inicio")}
          className="cursor-pointer flex items-center gap-3 shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/25">
            I
          </div>
          <div>
            <div className="font-display font-extrabold text-base tracking-tight flex items-center gap-1.5">
              <span>INTERRED</span>
              <span className="text-orange-500 text-xs px-1.5 py-0.2 rounded bg-orange-500/10 border border-orange-500/20">
                LTDA
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {profile?.nombre || "Usuario"} · {profile?.rol === "admin" ? "Administrador" : "Asesor"}
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL DE ESCRITORIO (DEPARTAMENTOS) */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-500/10 p-1 rounded-2xl border border-slate-500/15">
          {navItems.map((item) => {
            const Icon = item.icon;
            const activo = view === item.id || (item.id === "todos" && ["todos", "mapa", "citas", "buscar", "form"].includes(view));
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activo
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                    : isDark
                      ? "text-slate-300 hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* HERRAMIENTAS Y ACCIONES DEL TOPBAR */}
        <div className="flex items-center gap-2 shrink-0">
          {/* INTERRUPTOR TEMA CLARO / OSCURO */}
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/15 text-amber-300"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
              }`}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
              <span className="hidden sm:inline">{isDark ? "Claro" : "Oscuro"}</span>
            </button>
          )}

          {/* SIMULADOR RÁPIDO */}
          {onOpenSimulador && (
            <button
              onClick={onOpenSimulador}
              title="Abrir simulador rápido"
              className="hidden sm:flex px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-mono text-xs font-semibold items-center gap-1.5 transition"
            >
              <Calculator size={14} className="text-orange-500" />
              <span>Simulador</span>
            </button>
          )}

          {/* BOTÓN CERRAR SESIÓN */}
          <button
            onClick={() => {
              if (confirm("¿Seguro que deseas cerrar la sesión de Interred Ltda.?")) {
                onLogout();
              }
            }}
            title="Cerrar sesión"
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-1.5 transition ${
              isDark
                ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300"
                : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
            }`}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}