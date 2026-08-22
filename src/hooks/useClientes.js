import { useCallback, useEffect, useState } from "react";
import * as clientesApi from "../services/clientesService";
import * as actividadApi from "../services/actividadService";

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

    setRecords((prev) => {
      if (!prev) return [saved];
      if (isNew) return [saved, ...prev];
      return prev.map((r) => (r.id === saved.id ? saved : r));
    });

    // Deja histórico en "visitas" cuando hay foto o cambio de estado a Visitado/Cliente
    if (saved.foto_url || ["Visitado", "Cliente"].includes(saved.estado)) {
      try {
        await clientesApi.registrarVisita({
          clienteId: saved.id,
          asesorId: currentUserId,
          observaciones: saved.observaciones,
          fotoUrl: saved.foto_url,
          estadoResultante: saved.estado,
        });
      } catch (e) {
        console.error("No se pudo registrar la visita en el histórico:", e.message);
      }
    }

    // Si quedó una fecha de próximo seguimiento, se refleja directamente en la
    // pestaña "Citas" (App.jsx la deriva en vivo desde este mismo registro,
    // no hace falta guardarla en ninguna otra tabla aparte).

    return saved;
  };

  // Actualización parcial "silenciosa" (no dispara registrarVisita ni nada
  // adicional) — pensada para el checklist de documentos y la etapa de
  // crédito, que se guardan sin que eso cuente como una visita nueva.
  const actualizarCampos = async (id, patch) => {
    const saved = await clientesApi.actualizarCamposCliente(id, patch);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...saved } : r)));
    return saved;
  };

  const archivar = async (id) => {
    await clientesApi.archivarCliente(id);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, estado: "Archivado" } : r)));
  };

  const eliminar = async (id) => {
    await clientesApi.eliminarCliente(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Registra una entrada en la bitácora del cliente (llamada, whatsapp, nota,
  // cambio de estado...). Nunca interrumpe el flujo si falla — es un
  // "mejor esfuerzo", igual que registrarVisita más arriba.
  const registrarNovedad = async (clienteId, tipo, descripcion, currentUser) => {
    if (!descripcion) return;
    try {
      await actividadApi.registrarActividad({
        clienteId,
        asesorId: currentUser?.id,
        asesorNombre: currentUser?.nombre,
        tipo,
        descripcion,
      });
    } catch (e) {
      console.error("No se pudo registrar la novedad:", e.message);
    }
  };

  return { records, loading, error, reload, saveCliente, actualizarCampos, archivar, eliminar, registrarNovedad };
}
