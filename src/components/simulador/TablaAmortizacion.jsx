const cell = { padding: "7px 10px", textAlign: "right", color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" };
const fmt = (n) => (n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 });

export default function TablaAmortizacion({ filas = [] }) {
  if (!filas.length) return null;
  return (
    <div style={{ marginTop: 14, maxHeight: 300, overflow: "auto", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
        <thead style={{ position: "sticky", top: 0, background: "rgba(15,23,42,0.95)", zIndex: 1 }}>
          <tr>
            {["#", "Fecha", "Saldo inicial", "Cuota", "Abono capital", "Interés", "Seguro", "Saldo final"].map((h) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "right", color: "rgba(255,255,255,0.6)", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.periodo} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <td style={cell}>{f.periodo}</td>
              <td style={cell}>{f.fecha}</td>
              <td style={cell}>{fmt(f.saldoInicial)}</td>
              <td style={{ ...cell, color: "#fff", fontWeight: 700 }}>{fmt(f.cuota)}</td>
              <td style={cell}>{fmt(f.abonoCapital)}</td>
              <td style={cell}>{fmt(f.interes)}</td>
              <td style={cell}>{fmt(f.seguro)}</td>
              <td style={cell}>{fmt(f.saldoFinal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
