import ProgressBar from "./ProgressBar";
import ChecklistItem from "./ChecklistItem";
import { DOCUMENTOS_CREDITO_DEFAULT, calcularProgresoCredito } from "../../utils/documentosCredito";

// Componente controlado: el padre es dueño de `checklist` y decide cómo
// persistirlo (en este proyecto, vía useClientes -> Supabase).
export default function DocumentChecklist({
  checklist = {},
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
  onChange,
  tone = "light",
}) {
  const progreso = calcularProgresoCredito(checklist, documentos);

  const toggle = (docId) => {
    if (!onChange) return;
    onChange({ ...checklist, [docId]: !checklist[docId] });
  };

  return (
    <div>
      <ProgressBar value={progreso} tone={tone} />
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 2 }}>
        {documentos.map((doc) => (
          <ChecklistItem
            key={doc.id}
            label={doc.label}
            checked={!!checklist[doc.id]}
            onToggle={() => toggle(doc.id)}
            tone={tone}
          />
        ))}
      </div>
    </div>
  );
}
