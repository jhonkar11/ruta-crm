import React from "react";

const fmt = (n) => (n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

export default function TablaAmortizacion({ filas = [] }) {
  if (!filas.length) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-500/20 shadow-inner">
      <div className="max-h-72 overflow-y-auto overflow-x-auto">
        <table className="w-full border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-slate-900/90 text-slate-300 backdrop-blur-md z-10">
            <tr className="border-b border-white/10 text-right">
              <th className="py-2.5 px-3 text-center font-bold">#</th>
              <th className="py-2.5 px-3 text-left font-bold font-sans">Fecha</th>
              <th className="py-2.5 px-3 font-bold">Saldo Inicial</th>
              <th className="py-2.5 px-3 font-bold text-orange-400">Cuota</th>
              <th className="py-2.5 px-3 font-bold text-emerald-400">Capital</th>
              <th className="py-2.5 px-3 font-bold text-amber-400">Interés</th>
              <th className="py-2.5 px-3 font-bold">Seguro</th>
              <th className="py-2.5 px-3 font-bold">Saldo Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-500/10">
            {filas.map((f) => (
              <tr
                key={f.periodo}
                className="hover:bg-white/5 transition-colors text-right text-slate-200"
              >
                <td className="py-2 px-3 text-center text-slate-400 font-bold">{f.periodo}</td>
                <td className="py-2 px-3 text-left font-sans text-slate-300">{f.fecha}</td>
                <td className="py-2 px-3 text-slate-400">${fmt(f.saldoInicial)}</td>
                <td className="py-2 px-3 font-bold text-orange-300">${fmt(f.cuota)}</td>
                <td className="py-2 px-3 text-emerald-300 font-semibold">${fmt(f.abonoCapital)}</td>
                <td className="py-2 px-3 text-amber-300">${fmt(f.interes)}</td>
                <td className="py-2 px-3 text-slate-400">${fmt(f.seguro)}</td>
                <td className="py-2 px-3 font-semibold text-slate-200">${fmt(f.saldoFinal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
