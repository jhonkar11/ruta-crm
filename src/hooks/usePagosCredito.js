import { useCallback, useEffect, useState } from "react";
import * as pagosApi from "../services/pagosService";

// Mismo patrón que useClientes: carga todo el libro de pagos una vez y
// lo mantiene en memoria, actualizándolo de forma optimista al registrar
// un abono nuevo.
export function usePagosCredito() {
  const [pagos, setPagos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pagosApi.fetchTodosPagos();
      setPagos(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const registrar = async (payload) => {
    const nuevo = await pagosApi.registrarPago(payload);
    setPagos((prev) => [...(prev || []), nuevo]);
    return nuevo;
  };

  return { pagos, loading, error, reload, registrar };
}
