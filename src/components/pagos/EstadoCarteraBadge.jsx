import { Wallet } from "lucide-react";
import { estadoCartera, ESTADO_CARTERA_STYLE } from "../../utils/pagosCredito";

/**
 * Insignia de salud de la cartera de un cliente (Al día / Abono Parcial /
 * Mora / Pagado en su totalidad). Recibe `pagos` ya filtrados para ESE
 * cliente (App.jsx los agrupa una sola vez con un Map, ver pagosPorCliente)
 * — así ninguna tarjeta dispara una consulta nueva a Supabase.
 */
export default function EstadoCarteraBadge({ cliente, pagos = [], size = "md" }) {
  const cartera = estadoCartera(cliente, pagos);
  if (!cartera.activo) return null;

  const s = ESTADO_CARTERA_STYLE[cartera.estado] || ESTADO_CARTERA_STYLE["Al día"];
  const pulsa = cartera.estado === "Mora";
  const pad = size === "sm" ? "3px 9px" : "4px 11px";
  const font = size === "sm" ? 10.5 : 11.5;

  const etiqueta = cartera.estado === "Mora"
    ? `Mora: ${cartera.diasMora} día${cartera.diasMora === 1 ? "" : "s"}`
    : cartera.estado;

  return (
    <div
      title={`Saldo pendiente: ${Math.round(cartera.saldoPendiente).toLocaleString("es-CO")}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: s.bg, border: `1px solid ${s.border}`,
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        color: s.fg, padding: pad, borderRadius: 20, fontSize: font, fontWeight: 700,
        width: "fit-content",
      }}
    >
      <span className={pulsa ? "semaforo-dot semaforo-dot-pulsa" : "semaforo-dot"} style={{ background: s.dot }} />
      <Wallet size={12} />
      <span>{etiqueta}</span>
    </div>
  );
}
