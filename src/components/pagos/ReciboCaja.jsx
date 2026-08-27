import { CheckCircle2, MessageCircle, Printer } from "lucide-react";
import { C } from "../../styles/tokens";

const fmt = (n) => (n || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/**
 * Recibo de caja digital: se muestra justo después de registrar un abono,
 * y también se puede reabrir desde el historial de pagos de un cliente.
 */
export default function ReciboCaja({ pago, cliente, onCerrar }) {
  if (!pago) return null;
  const nombreCliente = `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`.trim();
  const waNumero = String(cliente?.whatsapp || cliente?.telefono || "").replace(/\D/g, "");

  const textoWa = encodeURIComponent(
    `Hola ${cliente?.nombres || ""}, te confirmamos tu abono de ${fmt(pago.monto_pagado)} recibido el ${pago.fecha_pago} ` +
    `(recibo ${pago.numero_recibo}). Nuevo saldo pendiente: ${fmt(pago.saldo_nuevo)}. ¡Gracias por tu pago puntual!`
  );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: "rgba(34,197,94,0.15)",
          border: "1.5px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 10px",
        }}>
          <CheckCircle2 size={26} color="#22C55E" />
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>Abono registrado</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
          Recibo {pago.numero_recibo}
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 18, marginBottom: 14 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", fontWeight: 700 }}>Monto recibido</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.coral, marginTop: 2 }}>{fmt(pago.monto_pagado)}</div>
        </div>

        <FilaRecibo label="Cliente" valor={nombreCliente} />
        <FilaRecibo label="CC / NIT" valor={cliente?.id} />
        <FilaRecibo label="Fecha de pago" valor={pago.fecha_pago} />
        <FilaRecibo label="Cuota N°" valor={pago.cuota_numero} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "10px 0" }} />
        <FilaRecibo label="Abono a capital" valor={fmt(pago.abono_capital)} />
        <FilaRecibo label="Abono a interés" valor={fmt(pago.abono_interes)} />
        <FilaRecibo label="Abono a seguro" valor={fmt(pago.abono_seguro)} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "10px 0" }} />
        <FilaRecibo label="Saldo anterior" valor={fmt(pago.saldo_anterior)} />
        <FilaRecibo label="Saldo nuevo" valor={fmt(pago.saldo_nuevo)} destacado />
        {pago.asesor_nombre && <FilaRecibo label="Recibido por" valor={pago.asesor_nombre} />}
        {pago.observaciones && <FilaRecibo label="Nota" valor={pago.observaciones} />}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a
          href={waNumero ? `https://wa.me/57${waNumero}?text=${textoWa}` : undefined}
          target="_blank" rel="noreferrer"
          style={{
            flex: 1, minWidth: 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: waNumero ? "#25D366" : "#475569", opacity: waNumero ? 1 : 0.5, pointerEvents: waNumero ? "auto" : "none",
            color: "#fff", border: "none", borderRadius: 10, padding: "11px 14px", fontWeight: 700, fontSize: 13, textDecoration: "none",
          }}
        >
          <MessageCircle size={16} /> Enviar recibo por WhatsApp
        </a>
        <button
          onClick={() => window.print()}
          style={{
            flex: 1, minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
            borderRadius: 10, padding: "11px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          <Printer size={16} /> Imprimir
        </button>
      </div>

      <button onClick={onCerrar} style={{
        width: "100%", marginTop: 10, padding: "11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
        background: "transparent", color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 13, cursor: "pointer",
      }}>
        Cerrar
      </button>
    </div>
  );
}

function FilaRecibo({ label, valor, destacado }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", fontSize: 12.5 }}>
      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      <span style={{ color: destacado ? C.coral : "#fff", fontWeight: destacado ? 700 : 500, textAlign: "right" }}>{valor}</span>
    </div>
  );
}
