import { useMemo, useState } from "react";
import { X, Wallet, CreditCard, Receipt, ChevronRight } from "lucide-react";
import { C, glass } from "../../styles/tokens";
import { estadoCartera, calcularAsignacionAbono, tieneCreditoActivo, ESTADO_CARTERA_STYLE } from "../../utils/pagosCredito";
import ReciboCaja from "./ReciboCaja";

const fmt = (n) => (n || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const SISTEMAS = [{ key: "frances", label: "Francés (cuota fija)" }, { key: "aleman", label: "Alemán (capital fijo)" }];

/**
 * Módulo de abonos de un cliente: si el cliente aún no tiene condiciones
 * de crédito configuradas, primero se capturan (monto, TEA, plazo,
 * sistema). Una vez activo, permite registrar un abono con reparto
 * automático interés -> seguro -> capital, muestra el recibo de caja al
 * confirmar, y lista el historial de pagos ya hechos.
 */
export default function RegistrarAbonoModal({
  cliente, pagosCliente = [], asesorNombre, asesorId,
  onGuardarCondiciones, onRegistrarPago, onClose,
}) {
  const [reciboVisible, setReciboVisible] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // ---- formulario de condiciones del crédito (si aún no existen) ----
  const [fMonto, setFMonto] = useState(cliente?.credito_monto || "");
  const [fTasa, setFTasa] = useState(cliente?.credito_tasa_tea || "");
  const [fPlazo, setFPlazo] = useState(cliente?.credito_plazo_meses || "");
  const [fSistema, setFSistema] = useState(cliente?.credito_sistema || "frances");
  const [fSeguro, setFSeguro] = useState(cliente?.credito_seguro_mensual || 0);
  const [fFechaDesembolso, setFFechaDesembolso] = useState(cliente?.credito_fecha_desembolso || new Date().toISOString().slice(0, 10));

  // ---- formulario de abono ----
  const cartera = useMemo(() => estadoCartera(cliente, pagosCliente), [cliente, pagosCliente]);
  const [montoAbono, setMontoAbono] = useState("");
  const [fechaAbono, setFechaAbono] = useState(new Date().toISOString().slice(0, 10));
  const [notaAbono, setNotaAbono] = useState("");

  if (!cliente) return null;
  const nombreCliente = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();

  const guardarCondiciones = async (e) => {
    e.preventDefault();
    if (!fMonto || !fTasa || !fPlazo) { alert("Completa monto, tasa y plazo para activar el crédito."); return; }
    setGuardando(true);
    try {
      await onGuardarCondiciones({
        credito_monto: Number(fMonto),
        credito_tasa_tea: Number(fTasa),
        credito_plazo_meses: Number(fPlazo),
        credito_sistema: fSistema,
        credito_seguro_mensual: Number(fSeguro) || 0,
        credito_fecha_desembolso: fFechaDesembolso,
      });
    } catch (e2) {
      alert("No se pudieron guardar las condiciones del crédito: " + e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const previsualizacion = useMemo(() => {
    if (!cartera.activo || !cartera.cuotaActual || !montoAbono) return null;
    return calcularAsignacionAbono(cartera.cuotaActual, Number(montoAbono));
  }, [cartera, montoAbono]);

  const registrarAbono = async (e) => {
    e.preventDefault();
    const monto = Number(montoAbono);
    if (!monto || monto <= 0) { alert("Ingresa un monto de abono válido."); return; }
    if (!cartera.cuotaActual) { alert("Este crédito ya está pagado en su totalidad."); return; }

    const asignacion = calcularAsignacionAbono(cartera.cuotaActual, monto);
    const saldoAnterior = cartera.saldoPendiente;
    const saldoNuevo = Math.max(0, saldoAnterior - asignacion.abonoCapital);

    setGuardando(true);
    try {
      const pago = await onRegistrarPago({
        clienteId: cliente.id,
        montoPagado: monto,
        abonoCapital: asignacion.abonoCapital,
        abonoInteres: asignacion.abonoInteres,
        abonoSeguro: asignacion.abonoSeguro,
        saldoAnterior,
        saldoNuevo,
        cuotaNumero: cartera.cuotaActual.periodo,
        asesorId,
        asesorNombre,
        observaciones: notaAbono || null,
        fechaPago: fechaAbono,
      });
      setReciboVisible(pago);
      setMontoAbono("");
      setNotaAbono("");
    } catch (e2) {
      alert("No se pudo registrar el abono: " + e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const pagosOrdenados = [...pagosCliente].sort((a, b) => String(b.creado_en || "").localeCompare(String(a.creado_en || "")));

  return (
    <div style={{ ...glass.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...glass.panel, borderRadius: 24, width: "100%", maxWidth: 480, padding: "clamp(18px, 5vw, 26px)", maxHeight: "92vh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Wallet size={18} color={C.coral} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>Abonos y pagos</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
              {nombreCliente} · CC/NIT {cliente.id}
            </div>
          </div>
          <button onClick={onClose} style={{ ...glass.pill, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {reciboVisible ? (
          <ReciboCaja pago={reciboVisible} cliente={cliente} onCerrar={() => setReciboVisible(null)} />
        ) : !tieneCreditoActivo(cliente) ? (
          // ---- Paso 1: sin crédito configurado todavía ----
          <form onSubmit={guardarCondiciones}>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginBottom: 16, lineHeight: 1.5 }}>
              Este cliente todavía no tiene un crédito activo configurado. Define las condiciones para poder
              generar el cronograma y empezar a registrar abonos.
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {SISTEMAS.map((s) => (
                <button key={s.key} type="button" onClick={() => setFSistema(s.key)} style={{
                  flex: 1, padding: "9px", borderRadius: 10, cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${fSistema === s.key ? C.coral : "rgba(255,255,255,0.2)"}`,
                  background: fSistema === s.key ? "rgba(225,78,42,0.18)" : "rgba(255,255,255,0.05)",
                }}>{s.label}</button>
              ))}
            </div>

            <CampoNumero label="Monto del crédito" value={fMonto} onChange={setFMonto} placeholder="10.000.000" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <CampoNumero label="TEA (%)" value={fTasa} onChange={setFTasa} placeholder="24" step="0.01" />
              <CampoNumero label="Plazo (meses)" value={fPlazo} onChange={setFPlazo} placeholder="24" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <CampoNumero label="Seguro mensual" value={fSeguro} onChange={setFSeguro} placeholder="0" />
              <div>
                <Etiqueta>Fecha desembolso</Etiqueta>
                <input type="date" value={fFechaDesembolso} onChange={(e) => setFFechaDesembolso(e.target.value)}
                  style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>

            <button type="submit" disabled={guardando} style={{
              width: "100%", marginTop: 8, padding: "12px", borderRadius: 10, border: "none",
              background: C.coral, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: guardando ? "wait" : "pointer",
              opacity: guardando ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <CreditCard size={15} /> {guardando ? "Guardando…" : "Activar crédito y continuar"}
            </button>
          </form>
        ) : (
          // ---- Paso 2: crédito activo -> registrar abono ----
          <div>
            <ResumenCartera cartera={cartera} />

            {cartera.cuotaActual ? (
              <form onSubmit={registrarAbono} style={{ marginTop: 16 }}>
                <CampoNumero label={`Monto a abonar (falta ${fmt(cartera.cuotaActual.pendienteDeEsta)} de esta cuota)`} value={montoAbono} onChange={setMontoAbono} placeholder="0" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                  <div>
                    <Etiqueta>Fecha de pago</Etiqueta>
                    <input type="date" value={fechaAbono} onChange={(e) => setFechaAbono(e.target.value)}
                      style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <CampoTexto label="Nota (opcional)" value={notaAbono} onChange={setNotaAbono} placeholder="Pago en efectivo..." />
                </div>

                {previsualizacion && (
                  <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12 }}>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", fontSize: 10.5 }}>Se aplicará así</div>
                    <FilaMini label="A interés" valor={fmt(previsualizacion.abonoInteres)} />
                    <FilaMini label="A seguro" valor={fmt(previsualizacion.abonoSeguro)} />
                    <FilaMini label="A capital" valor={fmt(previsualizacion.abonoCapital)} />
                  </div>
                )}

                <button type="submit" disabled={guardando} style={{
                  width: "100%", padding: "12px", borderRadius: 10, border: "none",
                  background: C.coral, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: guardando ? "wait" : "pointer",
                  opacity: guardando ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <Receipt size={15} /> {guardando ? "Registrando…" : "Registrar abono y generar recibo"}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                🎉 Este crédito ya está pagado en su totalidad.
              </div>
            )}

            {pagosOrdenados.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 10 }}>
                  Historial de pagos ({pagosOrdenados.length})
                </div>
                {pagosOrdenados.map((p) => (
                  <button key={p.id} onClick={() => setReciboVisible(p)} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                    padding: "10px 12px", marginBottom: 8, cursor: "pointer", color: "#fff", textAlign: "left",
                  }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700 }}>{fmt(p.monto_pagado)}</div>
                      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)" }}>{p.fecha_pago} · Cuota {p.cuota_numero} · {p.numero_recibo}</div>
                    </div>
                    <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResumenCartera({ cartera }) {
  const s = ESTADO_CARTERA_STYLE[cartera.estado] || ESTADO_CARTERA_STYLE["Al día"];
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase" }}>Estado de cartera</span>
        <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.fg, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
          {cartera.estado}{cartera.diasMora > 0 ? ` (${cartera.diasMora}d)` : ""}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>Saldo pendiente</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.coral }}>{fmt(cartera.saldoPendiente)}</div>
        </div>
        {cartera.cuotaActual && (
          <>
            <div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>Cuota actual</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>N° {cartera.cuotaActual.periodo} · {cartera.cuotaActual.fecha}</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>Valor de la cuota</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt(cartera.cuotaActual.cuota)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Etiqueta({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{children}</div>;
}

function CampoNumero({ label, value, onChange, placeholder, step }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Etiqueta>{label}</Etiqueta>
      <input type="number" step={step || "1"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, boxSizing: "border-box" }} />
    </div>
  );
}

function CampoTexto({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Etiqueta>{label}</Etiqueta>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, boxSizing: "border-box" }} />
    </div>
  );
}

function FilaMini({ label, valor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      <span style={{ color: "#fff", fontWeight: 600 }}>{valor}</span>
    </div>
  );
}
