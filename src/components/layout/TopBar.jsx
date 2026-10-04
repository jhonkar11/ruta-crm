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
      className={`sticky top-0 z-50 w-full border-b backdrop-blur-2xl transition-all duration-200 px-4 sm:px-6 py-3 shadow-2xl ${
        isDark
          ? "bg-slate-950/90 border-slate-800/80 text-white"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-200/50"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* LOGO CORPORATIVO & ROL */}
        <div
          onClick={() => setView("inicio")}
          className="cursor-pointer flex items-center gap-3 shrink-0 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
            I
          </div>
          <div>
            <div className="font-display font-extrabold text-base tracking-tight flex items-center gap-2">
              <span className={`${isDark ? "text-white" : "text-slate-900"} group-hover:text-orange-500 transition-colors`}>
                INTERRED
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm ${
                isDark 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20" 
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}>
                LTDA · SENA
              </span>
            </div>
            <div className={`text-[11px] font-mono truncate max-w-[220px] sm:max-w-xs flex items-center gap-1.5 mt-0.5 ${
              isDark ? "text-slate-300" : "text-slate-600 font-medium"
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>{profile?.nombre || "Usuario"}</span>
              <span className={isDark ? "text-slate-400" : "text-slate-400"}>·</span>
              <span className={`${isDark ? "text-emerald-300" : "text-emerald-700"} font-bold`}>
                {profile?.rol === "admin" ? "Administrador TI" : "Asesor Comercial"}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL DE ESCRITORIO (DEPARTAMENTOS) */}
        <div className={`hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-inner ${
          isDark ? "bg-slate-900/90 border-slate-700/80" : "bg-slate-100 border-slate-300"
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const activo = view === item.id || (item.id === "todos" && ["todos", "mapa", "citas", "buscar", "form"].includes(view));
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activo
                    ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30 border border-orange-400/40"
                    : isDark
                      ? "text-slate-200 hover:text-white hover:bg-white/10"
                      : "text-slate-700 hover:text-slate-950 hover:bg-white shadow-sm border border-transparent hover:border-slate-200"
                }`}
              >
                <Icon size={15} className={activo ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"} />
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
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
              }`}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-700" />}
              <span className="hidden sm:inline">{isDark ? "Claro" : "Oscuro"}</span>
            </button>
          )}

          {/* SIMULADOR RÁPIDO */}
          {onOpenSimulador && (
            <button
              onClick={onOpenSimulador}
              title="Abrir simulador rápido"
              className={`hidden sm:flex px-3 py-1.5 rounded-xl border font-mono text-xs font-bold items-center gap-1.5 transition shadow-sm ${
                isDark
                  ? "border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300"
                  : "border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-800"
              }`}
            >
              <Calculator size={14} className={isDark ? "text-orange-400" : "text-orange-600"} />
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
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
              isDark
                ? "bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-300 shadow-sm"
                : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700"
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