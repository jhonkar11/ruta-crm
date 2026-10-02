import { Filter, Users, Search, Plus, CalendarClock, Wrench, Network } from "lucide-react";
import { C } from "../../styles/tokens";
import { NavTab } from "../ui/UIKit";
import { isSoporteAuthorized } from "../../utils/rbac";

export default function BottomNav({ view, setView, onNew, citasHoyCount, user, profile }) {
  const canAccessSoporte = isSoporteAuthorized(user, profile);

  return (
    <div style={{
      position: "fixed", 
      bottom: 16, 
      left: "50%", 
      transform: "translateX(-50%)", 
      width: "92%", 
      maxWidth: canAccessSoporte ? 600 : 460,
      background: "rgba(15, 23, 42, 0.95)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1.5px solid rgba(255, 255, 255, 0.2)",
      borderRadius: 20,
      display: "flex", 
      alignItems: "center",
      padding: "8px 6px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      zIndex: 1000
    }}>
      <NavTab icon={Filter} label="Filtros" active={view === "mapa"} onClick={() => setView("mapa")} />
      <NavTab icon={CalendarClock} label="Citas" active={view === "citas"} onClick={() => setView("citas")} badge={citasHoyCount} />
      
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <button 
          onClick={onNew}
          title="Nuevo Registro"
          style={{
            background: C.coral,
            border: "2px solid #ffffff",
            borderRadius: "50%",
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 15px rgba(225, 78, 42, 0.6)",
            cursor: "pointer",
            flexShrink: 0
          }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      <NavTab icon={Search} label="Buscar" active={view === "buscar"} onClick={() => setView("buscar")} />
      <NavTab icon={Users} label="Todos" active={view === "todos"} onClick={() => setView("todos")} />

      {/* Exclusivo para Jhonka001@gmail.com */}
      {canAccessSoporte && (
        <NavTab
          icon={Wrench}
          label="Soporte"
          active={view === "soporte"}
          onClick={() => setView("soporte")}
        />
      )}
      {canAccessSoporte && (
        <NavTab
          icon={Network}
          label="Redes"
          active={view === "redes"}
          onClick={() => setView("redes")}
        />
      )}
    </div>
  );
}