<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              style={{ ...inputDarkStyle, width: "100%", cursor: "pointer" }}
            >
              {["Pendiente", "Programado", "Visitado", "Cancelado"].map(opt => (
                <option key={opt} value={opt} style={{ background: "#0f172a", color: "#fff" }}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Próximo Seguimiento</label>
            <div style={{ position: "relative" }}>
              <TextInput
                type="date"
                value={form.fecha_seguimiento || ""}
                onChange={(e) => handleChange("fecha_seguimiento", e.target.value)}
                style={{
                  ...inputDarkStyle,
                  width: "100%",
                  colorScheme: "dark", // Forzar selector nativo en modo oscuro en navegadores compatibles
                  cursor: "pointer"
                }}
              />
            </div>
          </div>
        </div>