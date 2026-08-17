import { MapPin, Clock, Users, Search, Plus, CalendarClock } from "lucide-react";
import { C } from "../../styles/tokens";
import { NavTab } from "../ui/UIKit";

export default function BottomNav({ view, setView, onNew, citasHoyCount }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 460,
      background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex", padding: "8px 4px 12px",
      boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
    }}>
      <NavTab icon={MapPin} label="Mapa" active={view === "mapa"} onClick={() => setView("mapa")} />
      <NavTab icon={CalendarClock} label="Citas" active={view === "citas"} onClick={() => setView("citas")} badge={citasHoyCount} />
      <div style={{ flex: 1, display: "flex", justifyContent: "center", marginTop: -22 }}>
        <button onClick={onNew} style={{
          width: 50, height: 50, borderRadius: "50%", background: C.coral, border: "4px solid #fff",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(225,78,42,0.4)",
        }}><Plus size={22} /></button>
      </div>
      <NavTab icon={Users} label="Todos" active={view === "todos"} onClick={() => setView("todos")} />
      <NavTab icon={Search} label="Buscar" active={view === "buscar"} onClick={() => setView("buscar")} />
    </div>
  );
}
