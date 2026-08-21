import ProgressBar from "./ProgressBar";
import ChecklistItem from "./ChecklistItem";
import { DOCUMENTOS_CREDITO_DEFAULT, calcularProgreso } from "../../utils/documentosCredito";

/**
 * Checklist de documentos del expediente de crédito. Componente 100% controlado:
 * el padre es dueño del estado (checklist) y decide cómo persistirlo
 * (Supabase, contexto, lo que sea) a través de onChange.
 *
 * Props:
 *  - checklist: { [documentoId]: boolean }         -> estado actual
 *  - documentos: [{ id, label }]                    -> lista de documentos requeridos
 *  - onChange: (nuevoChecklist) => void              -> se llama al marcar/desmarcar
 *  - tone: "light" | "dark"                          -> para usarlo sobre tarjeta blanca o modal oscuro
 */
export default function DocumentChecklist({
  checklist = {},
  documentos = DOCUMENTOS_CREDITO_DEFAULT,
  onChange,
  tone = "light",
}) {
  const progreso = calcularProgreso(checklist, documentos);

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
