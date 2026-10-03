import { useMemo, useState } from "react";
import { X, Calculator, AlertTriangle, ChevronDown, ChevronUp, FileSpreadsheet, Download, ShieldCheck, TrendingUp, Layers } from "lucide-react";
import { C } from "../../styles/tokens";
import {
  tablaAmortizacionFrancesa, tablaAmortizacionAlemana,
  teaToTasaMensual, teaToTna, excedeTopeUsura,
  TOPES_USURA_REFERENCIA, MODALIDADES_USURA, totalesTabla,
} from "../../utils/creditoMath";
import TablaAmortizacion from "./TablaAmortizacion";

const fmt = (n) => (n || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const fmtPct = (n) => `${(n || 0).toFixed(2)}%`;

export default function SimuladorCredito({ onClose, embedded = false, theme = "light" }) {
  const isDark = theme === "dark";
  const [monto, setMonto] = useState(15000000);
  const [plazo, setPlazo] = useState(24);
  const [tea, setTea] = useState(23.5);
  const [sistema, setSistema] = useState("frances");
  const [seguroMensual, setSeguroMensual] = useState(15000);
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

  const exportarCSV = () => {
    if (!tabla || tabla.length === 0) return;
    const encabezados = "Cuota #,Fecha Estimada,Saldo Inicial,Valor Cuota,Abono Capital,Interes,Seguro,Saldo Final\n";
    const filasCSV = tabla.map(f => 
      `${f.periodo},"${f.fecha}",${f.saldoInicial},${f.cuota},${f.abonoCapital},${f.interes},${f.seguro},${f.saldoFinal}`
    ).join("\n");

    const blob = new Blob([encabezados + filasCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Tabla_Amortizacion_Interred_${monto}_COP.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerClasses = embedded
    ? `w-full p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all ${
        isDark ? "bg-slate-900/70 border-white/10 text-white" : "bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/50"
      }`
    : `w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all ${
        isDark ? "bg-slate-900/95 border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
      }`;

  const content = (
    <div className={containerClasses}>
      {/* HEADER DEL SIMULADOR */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-500/15">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-500">
              <Calculator size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-orange-400">
                Interred Ltda. · Módulo Contable
              </span>
              <h2 className={`text-xl font-bold font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                Simulador de Créditos y Amortización
              </h2>
            </div>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Tope de usura vigente ({TOPES_USURA_REFERENCIA.vigencia}):{" "}
            <span className="font-semibold text-emerald-400">{fmtPct(topeVigente)}</span>
          </p>
        </div>

        {!embedded && onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition ${
              isDark ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* SELECTOR SISTEMA FRANCÉS / ALEMÁN */}
      <div className="mb-6">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          Sistema de Liquidación de Cuota
        </label>
        <div className="grid grid-cols-2 gap-3">
          {["frances", "aleman"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSistema(s)}
              className={`py-3 px-4 rounded-2xl border text-left transition-all ${
                sistema === s
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500 text-orange-400 shadow-md"
                  : isDark
                    ? "bg-slate-800/40 border-white/5 text-slate-300 hover:bg-slate-800/70"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="font-bold text-sm capitalize flex items-center justify-between">
                <span>Sistema {s}</span>
                {sistema === s && <span className="w-2 h-2 rounded-full bg-orange-400" />}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {s === "frances" ? "Cuotas constantes (Fijas)" : "Amortización de capital fija"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDERS Y CAMPOS FINANCIEROS */}
      <div className="space-y-4 mb-6">
        <SliderField
          label="Monto Requerido (Capital)"
          value={monto}
          onChange={setMonto}
          min={1000000}
          max={120000000}
          step={500000}
          format={fmt}
          isDark={isDark}
        />

        <SliderField
          label="Plazo de Amortización"
          value={plazo}
          onChange={setPlazo}
          min={3}
          max={84}
          step={1}
          format={(v) => `${v} meses (${(v / 12).toFixed(1)} años)`}
          isDark={isDark}
        />

        <div className="grid grid-cols-2 gap-3">
          <InputGroup
            label="Tasa Efectiva Anual (TEA %)"
            value={tea}
            onChange={setTea}
            isDark={isDark}
          />
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              TNA / Tasa Mensual
            </label>
            <div className={`px-3 py-2.5 rounded-xl border text-xs font-mono font-bold ${
              isDark ? "bg-slate-950/60 border-white/10 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"
            }`}>
              {fmtPct(tna)} TNA · {fmtPct(tasaMensual * 100)} EM
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputGroup
            label="Seguro de Vida / Deudores ($/Mes)"
            value={seguroMensual}
            onChange={setSeguroMensual}
            isDark={isDark}
          />

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Modalidad de Tasa (Usura)
            </label>
            <select
              value={modalidadUsura}
              onChange={(e) => setModalidadUsura(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs outline-none transition ${
                isDark
                  ? "bg-slate-950 border-white/10 text-white focus:border-orange-500"
                  : "bg-slate-50 border-slate-300 text-slate-800 focus:border-orange-500"
              }`}
            >
              {MODALIDADES_USURA.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({fmtPct(TOPES_USURA_REFERENCIA[m.key])})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ADVERTENCIA DE TASA DE USURA */}
      {excedeUsura && (
        <div className="flex gap-2.5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-6">
          <AlertTriangle size={18} className="shrink-0 text-rose-400" />
          <p className="leading-relaxed">
            <strong>Límite Legal Excedido:</strong> La tasa ingresada ({fmtPct(tea)}) supera el tope legal de usura de {fmtPct(topeVigente)} estipulado por la Superfinanciera.
          </p>
        </div>
      )}

      {/* RESUMEN DE RESULTADOS EN TARJETAS GLASSMORFISM */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl border bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-orange-500/20 mb-6">
        <Resultado
          label={sistema === "frances" ? "Cuota Mensual" : "1ra Cuota (Máx)"}
          value={fmt(primeraCuota)}
          highlight
          isDark={isDark}
        />
        <Resultado
          label="Total Intereses"
          value={fmt(totales.totalIntereses)}
          isDark={isDark}
        />
        <Resultado
          label="Costo Total Crédito"
          value={fmt(totales.totalPagar)}
          isDark={isDark}
        />
      </div>

      {/* BOTONES DE ACCIÓN PARA TABLA Y REPORTE */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setVerTabla(!verTabla)}
          className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
            verTabla
              ? "bg-orange-500 text-white border-orange-500 shadow-md"
              : isDark
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200"
          }`}
        >
          {verTabla ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{verTabla ? "Ocultar Tabla de Amortización" : "Ver Tabla de Amortización"}</span>
        </button>

        <button
          type="button"
          onClick={exportarCSV}
          className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            isDark ? "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
          title="Descargar proyección en CSV / Excel"
        >
          <Download size={15} />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* TABLA DE AMORTIZACIÓN */}
      {verTabla && (
        <div className="mt-6 pt-4 border-t border-slate-500/15 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Proyección de {plazo} cuotas mensuales
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Saldo Final: $0 COP
            </span>
          </div>
          <TablaAmortizacion filas={tabla} />
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      {content}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format, isDark }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </label>
        <span className="font-mono font-bold text-orange-400">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
    </div>
  );
}

function InputGroup({ label, value, onChange, isDark }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono outline-none transition ${
          isDark
            ? "bg-slate-950 border-white/10 text-white focus:border-orange-500"
            : "bg-slate-50 border-slate-300 text-slate-800 focus:border-orange-500"
        }`}
      />
    </div>
  );
}

function Resultado({ label, value, highlight, isDark }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className={`text-base font-extrabold font-mono mt-0.5 ${
        highlight ? "text-orange-400" : isDark ? "text-white" : "text-slate-900"
      }`}>
        {value}
      </div>
    </div>
  );
}
