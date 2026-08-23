import { Clock } from "lucide-react";
import { calcularUrgencia, SEMAFORO_STYLE } from "../../utils/semaforo";

/**
 * Indicador de urgencia de seguimiento. Estilo "cristal" (fondo translúcido +
 * blur + borde sutil) consistente con el glassmorphism del resto de la app,
 * adaptado a tarjetas claras: en vez del cristal oscuro de los modales, usa
 * el mismo color de la urgencia a baja opacidad, con blur y borde suave.
 *
 * - variant="pill" (default): punto + texto, para ClientCard y tarjetas grandes.
 * - variant="dot": solo el punto de color con tooltip, para filas compactas
 *   de listado (MapaView).
 */
export default function SemaforoBadge({ fechaSeguimiento, estado, variant = "pill", size = "md" }) {
  const urgencia = calcularUrgencia(fechaSeguimiento, estado);
  if (!urgencia) return null;
  const s = SEMAFORO_STYLE[urgencia.nivel];
  const pulsa = urgencia.nivel === "rojo";

  const dot = (
    <span
      className={pulsa ? "semaforo-dot semaforo-dot-pulsa" : "semaforo-dot"}
      style={{ background: s.dot }}
    />
  );

  if (variant === "dot") {
    return <span title={urgencia.etiqueta} style={{ display: "inline-flex" }}>{dot}</span>;
  }

  const pad = size === "sm" ? "3px 9px" : "4px 11px";
  const font = size === "sm" ? 10.5 : 11.5;

  return (
    <div
      title={urgencia.etiqueta}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        border: `1px solid ${s.border}`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        color: s.fg,
        padding: pad,
        borderRadius: 20,
        fontSize: font,
        fontWeight: 700,
        width: "fit-content",
      }}
    >
      {dot}
      <Clock size={12} />
      <span>{urgencia.etiqueta}</span>
    </div>
  );
}
