import React from "react";
import {
  Calculator,
  TrendingUp,
  ShieldCheck,
  Building,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import SimuladorCredito from "../simulador/SimuladorCredito";

export default function ModuloContable({ theme = "light" }) {
  const isDark = theme === "dark";

  const lineasCredito = [
    {
      titulo: "Infraestructura & Telecomunicaciones",
      tasa: "TEA 21.5% - 24.0%",
      plazo: "Hasta 60 meses",
      desc: "Financiamiento para adquisición de switches core, routers perimetrales, racks y tendidos de fibra óptica.",
      color: "from-blue-500/20 to-indigo-500/20",
      badge: "Corporativo"
    },
    {
      titulo: "Servidores & Data Center",
      tasa: "TEA 19.8% - 22.5%",
      plazo: "Hasta 48 meses",
      desc: "Línea diseñada para clústeres de cómputo, almacenamiento SAN y sistemas de alimentación ininterrumpida (UPS).",
      color: "from-emerald-500/20 to-teal-500/20",
      badge: "Hardware Crítico"
    },
    {
      titulo: "Microcrédito Productivo Empresarial",
      tasa: "TEA Referencia Usura",
      plazo: "Hasta 36 meses",
      desc: "Apoyo a pequeñas y medianas empresas aliadas con amortización en cuotas fijas o abono constante a capital.",
      color: "from-orange-500/20 to-amber-500/20",
      badge: "PyMEs"
    }
  ];

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-12">
      {/* CABECERA FINANCIERA */}
      <div className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all shadow-2xl ${
        isDark ? "bg-slate-900/70 border-white/10 text-white" : "bg-white/80 border-slate-200 text-slate-900 shadow-slate-200/50"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <Calculator size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Departamento Financiero & Contable
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  SUPERFINANCIERA CO
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
                Módulo Contable & Simulador Financiero · Interred Ltda.
              </h1>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Simulación de créditos de infraestructura tecnológica, tablas de amortización francesa y alemana (SENA GA6-220501106-AA1).
              </p>
            </div>
          </div>
        </div>

        {/* LÍNEAS DE CRÉDITO CORPORATIVO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-500/20">
          {lineasCredito.map((linea, idx) => (
            <div
              key={idx}
              className={`relative p-4 rounded-2xl border backdrop-blur-md overflow-hidden transition-all bg-gradient-to-br ${linea.color} ${
                idx === 0 ? "border-blue-500/30 shadow-blue-900/20" :
                idx === 1 ? "border-emerald-500/30 shadow-emerald-900/20" :
                "border-amber-500/30 shadow-amber-900/20"
              } shadow-lg`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  idx === 0 ? "bg-blue-500/20 text-blue-400" :
                  idx === 1 ? "bg-emerald-500/20 text-emerald-400" :
                  "bg-amber-500/20 text-amber-400"
                }`}>
                  {linea.badge}
                </span>
                <span className={`text-xs font-bold ${
                  idx === 0 ? "text-blue-300" : idx === 1 ? "text-emerald-300" : "text-amber-300"
                }`}>{linea.plazo}</span>
              </div>
              <h3 className="font-bold text-sm mb-1 text-white">
                {linea.titulo}
              </h3>
              <p className="text-xs mb-3 text-slate-300">
                {linea.desc}
              </p>
              <div className={`text-xs font-mono font-semibold ${
                idx === 0 ? "text-blue-400" : idx === 1 ? "text-emerald-400" : "text-amber-400"
              }`}>
                {linea.tasa}
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${
                idx === 0 ? "via-blue-500/60" : idx === 1 ? "via-emerald-500/60" : "via-amber-500/60"
              } to-transparent`} />
            </div>
          ))}
        </div>
      </div>

      {/* SIMULADOR DE CRÉDITO EMBEBIDO */}
      <SimuladorCredito embedded={true} theme={theme} />

      {/* NOTA METODOLÓGICA SENA */}
      <div className={`p-5 rounded-2xl border backdrop-blur-md flex items-center gap-3 ${
        isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
      }`}>
        <ShieldCheck size={22} className="text-emerald-500 shrink-0" />
        <p className="text-xs leading-relaxed">
          <strong>Validación de Algoritmos Financieros (SENA GA6):</strong> Las fórmulas matemáticas aplican la conversión exacta entre Tasa Efectiva Anual (TEA), Tasa Nominal Anual (TNA) y Tasa Efectiva Mensual (TEM), garantizando total concordancia con la circular reglamentaria de la Superintendencia Financiera de Colombia.
        </p>
      </div>
    </div>
  );
}
