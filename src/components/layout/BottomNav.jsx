import {
  Home,
  Network,
  Wrench,
  Users,
  Layers,
  CalendarClock,
  Plus,
  Calculator
} from "lucide-react";
import { C } from "../../styles/tokens";
import { NavTab } from "../ui/UIKit";

export default function BottomNav({ view, setView, onNew, citasHoyCount, user, profile, theme = "light" }) {
  const isDark = theme === "dark";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-xl backdrop-blur-2xl rounded-3xl p-1.5 shadow-2xl flex items-center justify-around z-50 transition-all ${
        isDark 
          ? "bg-slate-950/95 border border-slate-800 text-white shadow-black/80" 
          : "bg-white/95 border border-slate-200 text-slate-800 shadow-slate-300/60"
      }`}
    >
      <NavTab
        icon={Home}
        label="Inicio"
        active={view === "inicio"}
        onClick={() => setView("inicio")}
        isDark={isDark}
      />

      <NavTab
        icon={Network}
        label="Redes"
        active={view === "redes"}
        onClick={() => setView("redes")}
        isDark={isDark}
      />

      <NavTab
        icon={Users}
        label="Visitas"
        active={view === "visitantes"}
        onClick={() => setView("visitantes")}
        isDark={isDark}
      />

      {/* BOTÓN NUEVO REGISTRO / ACCIÓN CENTRAL */}
      <div className="flex justify-center">
        <button
          onClick={onNew}
          title="Nuevo Registro de Cliente"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-orange-500/50 hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      <NavTab
        icon={Wrench}
        label="Soporte"
        active={view === "soporte"}
        onClick={() => setView("soporte")}
        isDark={isDark}
      />

      <NavTab
        icon={Calculator}
        label="Finanzas"
        active={view === "contable"}
        onClick={() => setView("contable")}
        isDark={isDark}
      />

      <NavTab
        icon={Layers}
        label="CRM"
        active={["todos", "mapa", "buscar"].includes(view)}
        onClick={() => setView("todos")}
        isDark={isDark}
      />
    </div>
  );
}