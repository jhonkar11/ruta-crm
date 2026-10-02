import { useMemo, useState } from "react";
import { X, Calculator, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { C } from "../../styles/tokens";
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
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-xl">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-orange-500" />
              <h2 className="text-lg font-bold text-white">Simulador de crédito</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Tope de usura: {TOPES_USURA_REFERENCIA.vigencia}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {["frances", "aleman"].map((s) => (
            <button key={s} onClick={() => setSistema(s)} className={`flex-1 py-3 px-4 rounded-xl border transition ${sistema === s ? 'bg-orange-500/20 border-orange-500/50' : 'bg-slate-800/50 border-white/5'}`}>
              <div className="font-bold text-sm text-white capitalize">{s}</div>
              <div className="text-xs text-slate-400">{s === 'frances' ? 'Cuota fija' : 'Capital fijo'}</div>
            </button>
          ))}
        </div>

        <SliderField label="Monto solicitado" value={monto} onChange={setMonto} min={500000} max={100000000} step={100000} format={fmt} />
        <SliderField label="Plazo" value={plazo} onChange={setPlazo} min={3} max={84} step={1} format={(v) => `${v} meses`} />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputGroup label="TEA (%)" value={tea} onChange={setTea} />
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">TNA equivalente</label>
            <div className="px-3 py-2.5 rounded-lg bg-slate-950/50 border border-white/5 text-sm text-slate-300">{fmtPct(tna)}</div>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Modalidad (Usura)</label>
          <select value={modalidadUsura} onChange={(e) => setModalidadUsura(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-slate-950/50 border border-white/5 text-sm text-white outline-none focus:border-orange-500/50">
            {MODALIDADES_USURA.map((m) => <option key={m.key} value={m.key}>{m.label} ({fmtPct(TOPES_USURA_REFERENCIA[m.key])})</option>)}
          </select>
        </div>

        {excedeUsura && (
          <div className="flex gap-2 p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200 text-xs mb-6">
            <AlertTriangle size={16} className="shrink-0" />
            <p>La TEA ({fmtPct(tea)}) supera el tope de usura ({fmtPct(topeVigente)}). Verifique la tasa.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <Resultado label={sistema === "frances" ? "Cuota" : "1ra cuota"} value={fmt(primeraCuota)} highlight />
          <Resultado label="Total Intereses" value={fmt(totales.totalIntereses)} />
        </div>

        <button onClick={() => setVerTabla(!verTabla)} className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white uppercase tracking-wider hover:bg-white/10 transition">
          {verTabla ? "Ocultar tabla" : "Ver tabla de amortización"}
        </button>

        {verTabla && <div className="mt-4"><TablaAmortizacion filas={tabla} /></div>}
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-slate-400">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-lg bg-slate-950/50 border border-white/5 text-sm text-white outline-none focus:border-orange-500/50" />
    </div>
  );
}

function Resultado({ label, value, highlight }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-orange-400' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2">
        <label className="text-[10px] font-bold uppercase text-slate-400">{label}</label>
        <span className="text-xs font-bold text-orange-400">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
    </div>
  );
}
