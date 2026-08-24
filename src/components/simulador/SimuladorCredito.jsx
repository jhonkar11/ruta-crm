import { useMemo, useState } from "react";
import { X, Calculator, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { C, glass } from "../../styles/tokens";
import {
  tablaAmortizacionFrancesa, tablaAmortizacionAlemana,
  teaToTasaMensual, teaToTna, excedeTopeUsura,
  TOPES_USURA_REFERENCIA, MODALIDADES_USURA, totalesTabla,
} from "../../utils/creditoMath";
import TablaAmortizacion from "./TablaAmortizacion";

const fmt = (n) => (n || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const fmtPct = (n) => `${(n || 0).toFixed(2)}%`;

export default function SimuladorCredito({ onClose }) {
  const [monto, setMonto] = useState(10000000);
  const [plazo, setPlazo] = useState(24);
  const [tea, setTea] = useState(24);
  const [sistema, setSistema] = useState("frances");
  const [seguroMensual, setSeguroMensual] = useState(0);
  const [modalidadUsura, setModalidadUsura] = useState("consumo_ordinario");
  const [verTabla, setVerTabla] = useState(false);

  const tasaMensual = useMemo(() => teaToTasaMensual(tea), [tea]);
  const tna = useMemo(() => teaToTna(tea), [tea]);

  const tabla = useMemo(() => {
    return sistema === "frances"
      ? tablaAmortizacionFrancesa(monto, tasaMensual, plazo, seguroMensual)
      : tablaAmortizacionAlemana(monto, tasaMensual, plazo, seguroMensual);
  }, [monto, tasaMensual, plazo, seguroMensual, sistema]);

  const totales = useMemo(() => totalesTabla(tabla), [tabla]);
  const primeraCuota = tabla[0]?.cuota || 0;
  const ultimaCuota = tabla[tabla.length - 1]?.cuota || 0;
  const excedeUsura = excedeTopeUsura(tea, modalidadUsura);
  const topeVigente = TOPES_USURA_REFERENCIA[modalidadUsura];

  return (
    <div style={{ ...glass.overlay, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...glass.panel, borderRadius: 24, width: "100%", maxWidth: 560, padding: "clamp(18px, 5vw, 28px)", maxHeight: "92vh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={18} color={C.coral} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>Simulador de crédito</span>
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
              Tope de usura de referencia: {TOPES_USURA_REFERENCIA.vigencia}
            </div>
          </div>
          <button onClick={onClose} style={{ ...glass.pill, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => setSistema("frances")} style={{
            flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", color: "#fff", textAlign: "left",
            border: `1.5px solid ${sistema === "frances" ? C.coral : "rgba(255,255,255,0.2)"}`,
            background: sistema === "frances" ? "rgba(225,78,42,0.18)" : "rgba(255,255,255,0.05)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>Sistema Francés</div>
            <div style={{ fontWeight: 400, fontSize: 10.5, opacity: 0.75, marginTop: 2 }}>Cuota fija</div>
          </button>
          <button onClick={() => setSistema("aleman")} style={{
            flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", color: "#fff", textAlign: "left",
            border: `1.5px solid ${sistema === "aleman" ? C.coral : "rgba(255,255,255,0.2)"}`,
            background: sistema === "aleman" ? "rgba(225,78,42,0.18)" : "rgba(255,255,255,0.05)",
          }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>Sistema Alemán</div>
            <div style={{ fontWeight: 400, fontSize: 10.5, opacity: 0.75, marginTop: 2 }}>Capital fijo</div>
          </button>
        </div>

        <SliderField label="Monto solicitado" value={monto} onChange={setMonto} min={500000} max={100000000} step={100000} format={fmt} />
        <SliderField label="Plazo" value={plazo} onChange={setPlazo} min={3} max={84} step={1} format={(v) => `${v} meses`} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 14 }}>
          <div>
            <FieldLabel>Tasa Efectiva Anual (TEA)</FieldLabel>
            <input type="number" step="0.01" value={tea} onChange={(e) => setTea(Number(e.target.value) || 0)}
              style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <FieldLabel>TNA equivalente (m.v.)</FieldLabel>
            <div style={{ ...glass.input, padding: "9px 10px", borderRadius: 9, fontSize: 13, opacity: 0.9 }}>{fmtPct(tna)}</div>
          </div>
          <div>
            <FieldLabel>Seguro de vida / mes</FieldLabel>
            <input type="number" step="1000" value={seguroMensual} onChange={(e) => setSeguroMensual(Number(e.target.value) || 0)}
              style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 13, boxSizing: "border-box" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Modalidad (tope de usura)</FieldLabel>
          <select value={modalidadUsura} onChange={(e) => setModalidadUsura(e.target.value)}
            style={{ ...glass.input, width: "100%", padding: "9px 10px", borderRadius: 9, fontSize: 12.5, boxSizing: "border-box" }}>
            {MODALIDADES_USURA.map((m) => <option key={m.key} value={m.key}>{m.label} — tope {fmtPct(TOPES_USURA_REFERENCIA[m.key])}</option>)}
          </select>
        </div>

        {excedeUsura && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#fca5a5" }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>La TEA ingresada ({fmtPct(tea)}) supera el tope de usura de referencia para esta modalidad ({fmtPct(topeVigente)}, {TOPES_USURA_REFERENCIA.vigencia}). Verifica el tope oficial vigente antes de ofrecer este crédito.</span>
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
            <Resultado label={sistema === "frances" ? "Cuota mensual" : "Primera cuota"} value={fmt(primeraCuota)} destacado />
            {sistema === "aleman" && <Resultado label="Última cuota" value={fmt(ultimaCuota)} />}
            <Resultado label="Total intereses" value={fmt(totales.totalIntereses)} />
            <Resultado label="Total a pagar" value={fmt(totales.totalCuotas)} />
          </div>
        </div>

        <button onClick={() => setVerTabla((v) => !v)} style={{
          width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600, fontSize: 12.5, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {verTabla ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {verTabla ? "Ocultar tabla de amortización" : "Ver tabla de amortización completa"}
        </button>

        {verTabla && <TablaAmortizacion filas={tabla} />}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>
      {children}
    </div>
  );
}

function Resultado({ label, value, destacado }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: destacado ? 20 : 15, fontWeight: 700, color: destacado ? C.coral : "#fff" }}>{value}</div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.coral }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.coral }} />
    </div>
  );
}
