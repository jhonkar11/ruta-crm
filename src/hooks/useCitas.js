import { useCallback, useEffect, useState } from "react";
import * as citasApi from "../services/citasService";

export function useCitas() {
  const [citas, setCitas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await citasApi.fetchCitas();
      setCitas(data);
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

  const crear = async (payload) => {
    const nueva = await citasApi.crearCita(payload);
    await reload();
    return nueva;
  };

  const posponer = async (citaActual, nuevaFechaHora, notas) => {
    await citasApi.posponerCita(citaActual, nuevaFechaHora, notas);
    await reload();
  };

  const marcarCumplida = async (citaId) => {
    await citasApi.marcarCumplida(citaId);
    setCitas((prev) => prev.map((c) => (c.id === citaId ? { ...c, estado: "Cumplida" } : c)));
  };

  const cancelar = async (citaId) => {
    await citasApi.cancelarCita(citaId);
    setCitas((prev) => prev.map((c) => (c.id === citaId ? { ...c, estado: "Cancelada" } : c)));
  };

  return { citas, loading, error, reload, crear, posponer, marcarCumplida, cancelar };
}
