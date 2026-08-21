import { useCallback, useEffect, useState } from "react";
import * as clientesApi from "../services/clientesService";
import * as citasApi from "../services/citasService";

export function useClientes() {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientesApi.fetchClientes();
      setRecords(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveCliente = async (record, isNew, currentUserId) => {
    const saved = await clientesApi.upsertCliente(record, isNew);
    const savedId = saved?.id || saved?.cedula;

    setRecords((prev) => {
      if (!prev) return [saved];
      if (isNew) return [saved, ...prev];
      return prev.map((r) => ((r.id === savedId || r.cedula === savedId) ? saved : r));
    });

    // Deja histórico en "visitas" cuando hay foto o cambio de estado a Visitado/Cliente
    if (saved?.foto_url || ["Visitado", "Cliente"].includes(saved?.estado)) {
      if (savedId) {
        try {
          await clientesApi.registrarVisita({
            clienteId: savedId,
            asesorId: currentUserId,
            observaciones: saved.observaciones,
            fotoUrl: saved.foto_url,
            estadoResultante: saved.estado,
          });
        } catch (e) {
          console.error("No se pudo registrar la visita en el histórico:", e.message);
        }
      }
    }

    // Si quedó una fecha de próximo seguimiento, agenda automáticamente la cita
    if (saved?.fecha_seguimiento && savedId) {
      try {
        await citasApi.crearCita({
          clienteId: savedId,
          asesorId: currentUserId,
          fechaHora: `${saved.fecha_seguimiento}T09:00:00`,
          notas: "Agendada automáticamente desde la ficha del cliente.",
        });
      } catch (e) {
        console.error("No se pudo agendar la cita de seguimiento:", e.message);
      }
    }

    return saved;
  };

  const archivar = async (id) => {
    await clientesApi.archivarCliente(id);
    setRecords((prev) => (prev ? prev.map((r) => ((r.id === id || r.cedula === id) ? { ...r, estado: "Archivado" } : r)) : []));
  };

  const eliminar = async (id) => {
    await clientesApi.eliminarCliente(id);
    setRecords((prev) => (prev ? prev.filter((r) => r.id !== id && r.cedula !== id) : []));
  };

  return { records, loading, error, reload, saveCliente, archivar, eliminar };
}