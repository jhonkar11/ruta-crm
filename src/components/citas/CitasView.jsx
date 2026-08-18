import { useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { C, todayISO } from "../../styles/tokens";
import { ViewHeader, EmptyState, ConfirmModal } from "../ui/UIKit";
import CitaCard from "./CitaCard";
import CitaFormModal from "./CitaFormModal";

export default function CitasView({ citas, clientes, currentUser, onCrear, onPosponer, onCumplida, onCancelar }) {
  const [modal, setModal] = useState(null); 
  const [confirmSimple, setConfirmSimple] = useState(null); 

  const hoy = todayISO();

  const grupos = useMemo(() => {
    const activas = (citas || []).filter((c) => c.estado === "Programada");
    const vencidas = activas.filter((c) => c.fecha_hora.slice(0, 10) < hoy);
    const deHoy = activas.filter((c) => c.fecha_hora.slice(0, 10) === hoy);
    const proximas = activas
      .filter((c) => c.fecha_hora.slice(0, 10) > hoy)
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
    const historial = (citas || [])
      .filter((c) => ["Cumplida", "Cancelada", "Pospuesta"].includes(c.estado))
      .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
      .slice(0, 15);
    return { vencidas, deHoy, proximas, historial };
  }, [citas, hoy]);

  const total = (citas || []).length;

  const abrirPosponer = (cita) => setModal({ mode: "posponer", citaBase: cita });
  const abrirCrear = () => setModal({ mode: "crear" });

  const confirmarModal = async ({ clienteId, fechaHora, notas }) => {
    if (modal.mode === "posponer") {
      await onPosponer(modal.citaBase, fechaHora, notas);
    } else {
      await onCrear({ clienteId, asesorId: currentUser.id, fechaHora, notas });
    }
    setModal(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <ViewHeader title="Citas y visitas" subtitle={`${total} registradas en total`} />
        <button onClick={abrirCrear} className="icon-row" style={{
          background: C.ink, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px",
          cursor: "pointer", fontSize: 12.5, fontWeight: 600, height: "fit-content", marginTop: -12,
        }}>
          <CalendarPlus size={14} /> <span>Agendar</span>
        </button>
      </div>

      {grupos.vencidas.length > 0 && (
        <>
          <div style={{ color: C.coralDark, fontSize: 12.5, fontWeight: 700, margin: "4px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            ⚠ Vencidas sin gestionar ({grupos.vencidas.length})
          </div>
          {grupos.vencidas.map((c) => (
            <CitaCard key={c.id} cita={c} onPosponer={abrirPosponer} profile={currentUser}
              onCumplida={(cita) => setConfirmSimple({ tipo: "cumplida", cita })}
              onCancelar={(cita) => setConfirmSimple({ tipo: "cancelar", cita })} />
          ))}
        </>
      )}

      <div style={{ color: C.ink, fontSize: 12.5, fontWeight: 700, margin: "12px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Hoy ({grupos.deHoy.length})
      </div>
      {grupos.deHoy.length === 0 && <EmptyState text="No tienes citas programadas para hoy." />}
      {grupos.deHoy.map((c) => (
        <CitaCard key={c.id} cita={c} onPosponer={abrirPosponer} profile={currentUser}
          onCumplida={(cita) => setConfirmSimple({ tipo: "cumplida", cita })}
          onCancelar={(cita) => setConfirmSimple({ tipo: "cancelar", cita })} />
      ))}

      <div style={{ color: C.ink, fontSize: 12.5, fontWeight: 700, margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Próximas ({grupos.proximas.length})
      </div>
      {grupos.proximas.length === 0 && <EmptyState text="No hay citas próximas agendadas." />}
      {grupos.proximas.map((c) => (
        <CitaCard key={c.id} cita={c} onPosponer={abrirPosponer} profile={currentUser}
          onCumplida={(cita) => setConfirmSimple({ tipo: "cumplida", cita })}
          onCancelar={(cita) => setConfirmSimple({ tipo: "cancelar", cita })} />
      ))}

      {grupos.historial.length > 0 && (
        <>
          <div style={{ color: C.ink70, fontSize: 12.5, fontWeight: 700, margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Historial reciente
          </div>
          {grupos.historial.map((c) => (
            <CitaCard key={c.id} cita={c} onPosponer={abrirPosponer} profile={currentUser} onCumplida={() => {}} onCancelar={() => {}} />
          ))}
        </>
      )}

      {modal && (
        <CitaFormModal
          mode={modal.mode}
          clientes={clientes}
          citaBase={modal.citaBase}
          onConfirm={confirmarModal}
          onCancel={() => setModal(null)}
        />
      )}

      {confirmSimple && (
        <ConfirmModal
          title={confirmSimple.tipo === "cumplida" ? "Marcar visita como cumplida" : "Cancelar cita"}
          body={confirmSimple.tipo === "cumplida"
            ? "Se registrará esta cita como visita realizada."
            : "Esta cita quedará marcada como cancelada. No se enviarán más recordatorios."}
          confirmLabel={confirmSimple.tipo === "cumplida" ? "Confirmar" : "Sí, cancelar"}
          danger={confirmSimple.tipo === "cancelar"}
          onCancel={() => setConfirmSimple(null)}
          onConfirm={async () => {
            if (confirmSimple.tipo === "cumplida") await onCumplida(confirmSimple.cita.id);
            else await onCancelar(confirmSimple.cita.id);
            setConfirmSimple(null);
          }}
        />
      )}
    </div>
  );
}