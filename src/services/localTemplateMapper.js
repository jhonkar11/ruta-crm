/**
 * Motor de Respaldo Local por Mapeo Estructural de Plantilla (Anti-Caídas de IA)
 * ENTER Ltda. / Comercia POS
 *
 * Funcionalidad:
 * 1. Opera de forma 100% síncrona, autónoma y local (sin llamadas de red ni cuota de Gemini).
 * 2. Analiza la estructura de la 'Plantilla Institucional en Blanco' y los datos crudos
 *    del 'Detalle del Servicio' (notas de WhatsApp, requerimientos, transcripciones de voz).
 * 3. Empareja lógicamente cada campo y genera:
 *    a) Objeto estructurado para el formulario "Datos de Servicio Requerido" (listo para liquidación en Excel).
 *    b) Texto espejo formateado de la "Plantilla Corporativa Oficial" respetando 100% el diseño original.
 */

// Heurísticas de tarifas estándar según mesa, cliente y tipo de caso
export function calcularTarifaSoporte({ mesa = "", cliente = "", numeroCaso = "" }) {
  const m = String(mesa || "").toLowerCase();
  const c = String(cliente || "").toLowerCase();
  const caso = String(numeroCaso || "").toUpperCase();

  // Casos dobles (ej: RT94898-RE26014286)
  if (/(?:RT.*RE|RE.*RT)/.test(caso) || (caso.includes("RT") && caso.includes("RE"))) {
    return 120000;
  }
  // Mesa IBM / Lexmark
  if (m.includes("ibm") || m.includes("lexmark")) {
    return 100000;
  }
  // Banco de Bogotá o Soporte en Sitio
  if (c.includes("bogot") || m.includes("sitio") || m.includes("campo")) {
    return 70000;
  }
  // Tarifa base estándar (Mesa 2, Davivienda, AV Villas, etc.)
  return 60000;
}

/**
 * Normaliza cualquier formato de fecha a DD/MM/AAAA
 */
export function normalizarFechaLocal(texto) {
  if (!texto) return "";
  const t = String(texto).trim();

  // YYYY-MM-DD
  const iso = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (iso) {
    const [, anio, mes, dia] = iso;
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
  }

  // DD/MM/YYYY o DD/MM/YY
  const dmy = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if (dmy) {
    let [, dia, mes, anio] = dmy;
    if (anio.length === 2) anio = "20" + anio;
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
  }

  return t;
}

/**
 * Obtiene la fecha de hoy en formato DD/MM/AAAA
 */
function fechaHoy() {
  const ahora = new Date();
  const d = String(ahora.getDate()).padStart(2, "0");
  const m = String(ahora.getMonth() + 1).padStart(2, "0");
  const a = ahora.getFullYear();
  return `${d}/${m}/${a}`;
}

/**
 * Limpia y recorta valores capturados para evitar ruido de etiquetas adyacentes
 */
function limpiarValorCapturado(val) {
  if (!val) return "";
  let v = String(val).trim();
  // Quitar comillas externas
  v = v.replace(/^["']|["']$/g, "").trim();
  // Si captura un separador o línea ASCII, ignorar
  if (/^[=\-_*#]{3,}$/.test(v)) return "";
  return v;
}

/**
 * Extrae valores con patrones regex prioritarios
 */
function extraerPorPatrones(texto, patrones) {
  if (!texto) return "";
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match && match[1]) {
      const limpio = limpiarValorCapturado(match[1]);
      if (limpio) return limpio;
    }
  }
  return "";
}

/**
 * Motor central de mapeo y emparejamiento estructural
 */
export function ejecutarMapeoEstructuralLocal({
  plantillaInstitucional = "",
  textoNotas = "",
  datosActuales = {},
  nombreTecnico = "Jhon Alexander Vasquez Reveló"
}) {
  const rawPlantilla = String(plantillaInstitucional || "").trim();
  const rawNotas = String(textoNotas || "").trim();
  // El texto combinado permite buscar en ambas fuentes si una carece de ciertos campos
  const textoCombinado = `${rawNotas}\n\n${rawPlantilla}`;

  // 1. NÚMERO DE CASO / TICKET / INCIDENTE / WO
  // Busca primero casos combinados (ej: RE26014844 / RF637620 o RT94898-RE26014286)
  let numeroCaso = extraerPorPatrones(textoCombinado, [
    /(?:RT\s*\d{4,6}\s*[-–/]\s*RE\s*\d{6,10})/i,
    /(?:RE\s*\d{6,10}\s*[\/&–-]\s*RF\s*\d{5,8})/i,
    /(?:n[°o]|nro|número|numero|caso|ticket|inc(?:idente)?|wo|rq|req|ot|ar|re|rt)\s*[:#=\-\s]\s*([A-Za-z0-9\/\-_\s]{4,35})/i,
    /\b(RE\d{7,10})\b/i,
    /\b(INC-?\d{6,10})\b/i,
    /\b(IN\d{7,10})\b/i,
    /\b(RT\d{5,7})\b/i,
    /\b(WO\d{6,10})\b/i
  ]);

  if (numeroCaso) {
    // Si trajo saltos de línea o texto sobrante
    numeroCaso = numeroCaso.split(/\r?\n/)[0].trim();
    // Normalizar espaciados
    numeroCaso = numeroCaso.replace(/\s+/g, " ");
  }

  // 2. FECHAS (Solicitud, Atención, Finalización)
  let fechaSolicitud = extraerPorPatrones(textoCombinado, [
    /(?:fecha\s*(?:de\s*)?solicitud|f\.?\s*solicitud|solicitado)\s*[:=]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  ]);
  let fechaAtencion = extraerPorPatrones(textoCombinado, [
    /(?:fecha\s*(?:de\s*)?atenci[oó]n|f\.?\s*atenci[oó]n|fecha\s*visita|fecha\s*soporte|atendido)\s*[:=]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  ]);
  let fechaFinalizacion = extraerPorPatrones(textoCombinado, [
    /(?:fecha\s*(?:de\s*)?finalizaci[oó]n|f\.?\s*cierre|fecha\s*cierre|finalizado)\s*[:=]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
  ]);

  // Si no se especificó alguna de ellas, buscar la primera fecha genérica encontrada
  const fechaGenerica = extraerPorPatrones(textoCombinado, [
    /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/
  ]);

  const fechaDefault = normalizarFechaLocal(fechaGenerica || fechaHoy());
  fechaSolicitud = normalizarFechaLocal(fechaSolicitud) || fechaDefault;
  fechaAtencion = normalizarFechaLocal(fechaAtencion) || fechaDefault;
  fechaFinalizacion = normalizarFechaLocal(fechaFinalizacion) || fechaAtencion;

  // 3. CLIENTE FINAL / BANCO / ENTIDAD
  let cliente = extraerPorPatrones(textoCombinado, [
    /(?:cliente(?:\s*final)?|banco|entidad\s*cliente|sede)\s*[:=]?\s*([^\n\r,;]+)/i
  ]);
  if (!cliente) {
    // Detección contextual por palabras clave conocidas
    if (/davivienda/i.test(textoCombinado)) cliente = "Davivienda";
    else if (/banco\s*(?:de\s*)?bogot[aá]/i.test(textoCombinado)) cliente = "Banco de Bogotá";
    else if (/av\s*villas/i.test(textoCombinado)) cliente = "Banco AV Villas";
    else if (/popular/i.test(textoCombinado)) cliente = "Banco Popular";
    else if (/bancolombia/i.test(textoCombinado)) cliente = "Bancolombia";
    else if (/agrario/i.test(textoCombinado)) cliente = "Banco Agrario";
    else if (/jumbo/i.test(textoCombinado)) cliente = "Jumbo Popayán";
    else if (/cencosud/i.test(textoCombinado)) cliente = "Cencosud";
    else if (/alkosto/i.test(textoCombinado)) cliente = "Alkosto";
    else if (/éxito|exito/i.test(textoCombinado)) cliente = "Almacenes Éxito";
  }

  // 4. PROVEEDOR / ENTIDAD
  let proveedor = extraerPorPatrones(textoCombinado, [
    /(?:proveedor(?:\s*\/\s*entidad)?|empresa|aliado)\s*[:=]?\s*([^\n\r,;]+)/i
  ]);
  if (!proveedor) {
    if (/r&s|r\s*&\s*s\s*soluciones/i.test(textoCombinado)) proveedor = "R&S Soluciones";
    else if (/enter\s*ltda/i.test(textoCombinado)) proveedor = "ENTER Ltda.";
    else if (/grupo\s*aval/i.test(textoCombinado)) proveedor = "Grupo Aval";
    else if (/ibm/i.test(textoCombinado)) proveedor = "IBM";
    else if (/lexmark/i.test(textoCombinado)) proveedor = "Lexmark";
    else if (/stefanini/i.test(textoCombinado)) proveedor = "Stefanini";
    else proveedor = datosActuales.proveedor || "R&S Soluciones";
  }

  // 5. MESA / TIPO DE SOPORTE
  let mesa = extraerPorPatrones(textoCombinado, [
    /(?:mesa(?:\s*de\s*soporte)?|tipo\s*de\s*soporte)\s*[:=]?\s*([^\n\r,;]+)/i,
    /(?:mesa)\s*[:=]?\s*([^\n\r,;]+)/i
  ]);
  if (!mesa) {
    if (/mesa\s*ibm/i.test(textoCombinado)) mesa = "Mesa IBM";
    else if (/mesa\s*lexmark/i.test(textoCombinado)) mesa = "Mesa Lexmark";
    else if (/mesa\s*2/i.test(textoCombinado)) mesa = "Mesa 2";
    else if (/soporte\s*en\s*sitio/i.test(textoCombinado)) mesa = "Soporte en Sitio";
    else mesa = datosActuales.mesa || "Mesa 2";
  } else {
    // Si viene solo un dígito como "2"
    if (/^2$/i.test(mesa.trim())) mesa = "Mesa 2";
  }

  // 6. COORDINADOR(A)
  let coordinador = extraerPorPatrones(textoCombinado, [
    /(?:coordinador(?:a)?|coord\.?|gestor(?:a)?)\s*[:=]?\s*([^\n\r,;]+)/i
  ]);
  if (!coordinador) {
    if (/valentina\s*tovar/i.test(textoCombinado)) coordinador = "Valentina Tovar";
    else if (/oswaldo/i.test(textoCombinado)) coordinador = "Oswaldo";
    else if (/carolina/i.test(textoCombinado)) coordinador = "Carolina";
    else if (/diana/i.test(textoCombinado)) coordinador = "Diana";
    else coordinador = datosActuales.coordinador || "Valentina Tovar";
  }

  // 7. EQUIPO / SERIAL / HOSTNAME
  let equipo = extraerPorPatrones(textoCombinado, [
    /(?:equipo(?:\s*\/\s*serial)?|serial|hostname|modelo|dispositivo)\s*[:=]?\s*([^\n\r]+)/i,
    /\b([A-Z0-9]{8,15}\s*[-–]\s*[A-Z0-9]{6,12})\b/i
  ]);
  if (!equipo) {
    if (/lenovo/i.test(textoCombinado)) equipo = "PC Lenovo";
    else if (/lexmark/i.test(textoCombinado)) equipo = "Impresora Lexmark";
    else if (/hp/i.test(textoCombinado)) equipo = "Equipo HP";
    else if (/dell/i.test(textoCombinado)) equipo = "Equipo Dell";
    else equipo = datosActuales.equipo || "Equipo en Sitio";
  }

  // 8. FALLA REPORTADA
  let falla = extraerPorPatrones(textoCombinado, [
    /(?:falla(?:\s*reportada)?|problema|inconveniente|requerimiento|s[ií]ntoma|motivo\s*llamada)\s*[:=]?\s*([^\n\r]+)/i
  ]);
  if (!falla) {
    if (/actualizaci[oó]n\s*(?:de\s*)?so/i.test(textoCombinado)) falla = "ACTUALIZACION SO";
    else if (/no\s*(?:da\s*video|enciende)/i.test(textoCombinado)) falla = "EQUIPO NO ENCIENDE / NO DA VIDEO";
    else if (/impres(?:ora|i[oó]n)|atasco/i.test(textoCombinado)) falla = "FALLA DE IMPRESION / ATASCO";
    else if (/pantalla\s*azul|pantallazo/i.test(textoCombinado)) falla = "PANTALLA AZUL / ERROR DE BOOTEO";
    else if (/red|internet|conectividad/i.test(textoCombinado)) falla = "SIN ACCESO A RED / CONECTIVIDAD";
    else if (/disco\s*(?:duro|solido|ssd)/i.test(textoCombinado)) falla = "FALLA EN UNIDAD DE ALMACENAMIENTO";
    else falla = rawNotas ? rawNotas.slice(0, 100) : "SOPORTE TÉCNICO CORRECTIVO EN SITIO";
  }
  falla = falla.toUpperCase();

  // 9. CAUSA / DIAGNÓSTICO
  let causa = extraerPorPatrones(textoCombinado, [
    /(?:diagn[oó]stico(?:\s*\/\s*causa)?|causa(?:\s*ra[ií]z)?|motivo\s*t[eé]cnico)\s*[:=]?\s*([^\n\r]+)/i
  ]);
  if (!causa) {
    causa = `Inconsistencia reportada en operatividad (${falla}).`;
  }

  // 10. SOLUCIÓN TÉCNICA / ACTIVIDADES REALIZADAS
  let solucion = extraerPorPatrones(textoCombinado, [
    /(?:soluci[oó]n(?:\s*t[eé]cnica)?|actividades(?:\s*realizadas)?|trabajo\s*realizado|procedimiento)\s*[:=]?\s*([\s\S]+?)(?=\n\s*(?:pruebas|horario|t[eé]cnico|estado)|$)/i
  ]);
  if (!solucion) {
    if (rawNotas && rawNotas.length > 20) {
      solucion = rawNotas;
    } else {
      solucion = `Se realiza intervención técnica en sitio para atender ${falla}. Se ejecuta diagnóstico físico y lógico, verificación de conectividad y corrección técnica del incidente reportado dejando el servicio en óptimo estado funcional.`;
    }
  }

  // 11. PRUEBAS DE VALIDACIÓN
  let pruebas = extraerPorPatrones(textoCombinado, [
    /(?:pruebas(?:\s*de\s*validaci[oó]n)?|validaci[oó]n|pruebas\s*realizadas)\s*[:=]?\s*([^\n\r]+)/i
  ]);
  if (!pruebas) {
    pruebas = "Se realizan pruebas de encendido, conectividad y operatividad junto al usuario final a entera conformidad.";
  }

  // 12. HORAS (Desplazamiento, Inicio, Fin)
  let horaInicio = extraerPorPatrones(textoCombinado, [
    /(?:hora(?:\s*de)?\s*(?:inicio|llegada))\s*[:=]?\s*([0-9:apmAPM\s]+)/i
  ]);
  let horaFin = extraerPorPatrones(textoCombinado, [
    /(?:hora(?:\s*de)?\s*(?:fin|salida|cierre))\s*[:=]?\s*([0-9:apmAPM\s]+)/i
  ]);
  let horaDesplazamiento = extraerPorPatrones(textoCombinado, [
    /(?:desplazamiento|traslado|viaje)\s*[:=]?\s*([0-9:apmAPM\s]+)/i
  ]);

  // Si viene rango "de 8:00am a 10:30am" o "08:00 AM - 10:30 AM"
  if (!horaInicio || !horaFin) {
    const rangoHoras = textoCombinado.match(/(?:de\s+)?(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*(?:a|hasta|-)\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
    if (rangoHoras) {
      if (!horaInicio) horaInicio = rangoHoras[1].trim();
      if (!horaFin) horaFin = rangoHoras[2].trim();
    }
  }

  const horas = {
    inicio: horaInicio || datosActuales.horas?.inicio || "08:00 AM",
    fin: horaFin || datosActuales.horas?.fin || "10:30 AM",
    desplazamiento: horaDesplazamiento || datosActuales.horas?.desplazamiento || ""
  };

  // 13. TÉCNICO
  let tecnico = extraerPorPatrones(textoCombinado, [
    /(?:t[eé]cnico(?:\s*responsable)?|atendido\s*por|ingeniero)\s*[:=]?\s*([^\n\r]+)/i
  ]);
  if (!tecnico) {
    tecnico = nombreTecnico || datosActuales.tecnico || "Jhon Alexander Vasquez Reveló";
  }

  // 14. MEDIO y SH
  const medio = /remoto/i.test(textoCombinado) ? "REMOTO" : "SITIO";
  const sh = datosActuales.sh || "SOFTWARE - HARDWARE";

  // 15. TARIFA Y VALORES
  const tarifaCalculada = calcularTarifaSoporte({
    mesa,
    cliente,
    numeroCaso: numeroCaso || datosActuales.numero_caso
  });
  const valorServicios = Number(datosActuales.valor_servicios) || tarifaCalculada;
  const valorViaticos = Number(datosActuales.valor_viaticos) || 0;
  const valorMateriales = Number(datosActuales.valor_materiales) || 0;

  // OBJETO LIMPIO PARA EL FORMULARIO
  const datosEstructurados = {
    ...datosActuales,
    numero_caso: numeroCaso || datosActuales.numero_caso || "",
    fecha_solicitud: fechaSolicitud,
    fecha_atencion: fechaAtencion,
    fecha_finalizacion: fechaFinalizacion,
    mesa: mesa,
    proveedor: proveedor,
    cliente: cliente,
    coordinador: coordinador,
    equipo: equipo,
    falla: falla,
    causa: causa,
    solucion: solucion,
    pruebas: pruebas,
    horas: horas,
    tecnico: tecnico,
    medio: medio,
    sh: sh,
    valor_servicios: valorServicios,
    valor_viaticos: valorViaticos,
    valor_materiales: valorMateriales
  };

  // 16. GENERACIÓN DE LA PLANTILLA CORPORATIVA OFICIAL (TIPO ESPEJO ESTRUCTURAL)
  let plantillaCorporativa = "";

  if (rawPlantilla) {
    // Si el usuario proporcionó una plantilla institucional en blanco o requerimiento
    // Actuamos como un motor de mapeo estructural espejo estricto línea por línea
    const lineas = rawPlantilla.split(/\r?\n/);

    const lineasMapeadas = lineas.map((linea) => {
      let l = linea;

      // A. Reemplazo de variables dinámicas $$Variable
      l = l.replace(/\$\$(?:inc|wo|caso|ticket|requerimiento|nro_caso)\b/gi, datosEstructurados.numero_caso);
      l = l.replace(/\$\$(?:proveedor|entidad)\b/gi, datosEstructurados.proveedor);
      l = l.replace(/\$\$(?:cliente|banco|sede)\b/gi, datosEstructurados.cliente);
      l = l.replace(/\$\$(?:mesa|tipo_soporte)\b/gi, datosEstructurados.mesa);
      l = l.replace(/\$\$(?:coordinador|coordinadora|coord)\b/gi, datosEstructurados.coordinador);
      l = l.replace(/\$\$(?:equipo|serial|hostname)\b/gi, datosEstructurados.equipo);
      l = l.replace(/\$\$(?:medio)\b/gi, datosEstructurados.medio);
      l = l.replace(/\$\$(?:sh|tipo_sh)\b/gi, datosEstructurados.sh);
      l = l.replace(/\$\$(?:falla|problema)\b/gi, datosEstructurados.falla);
      l = l.replace(/\$\$(?:causa|diagnostico)\b/gi, datosEstructurados.causa);
      l = l.replace(/\$\$(?:solucion|actividades)\b/gi, datosEstructurados.solucion);
      l = l.replace(/\$\$(?:pruebas|validacion)\b/gi, datosEstructurados.pruebas);
      l = l.replace(/\$\$(?:tecnico|responsable)\b/gi, datosEstructurados.tecnico);
      l = l.replace(/\$\$(?:fecha|fecha_atencion)\b/gi, datosEstructurados.fecha_atencion);
      l = l.replace(/\$\$(?:fecha_solicitud)\b/gi, datosEstructurados.fecha_solicitud);
      l = l.replace(/\$\$(?:fecha_finalizacion)\b/gi, datosEstructurados.fecha_finalizacion);
      l = l.replace(/\$\$(?:horario)\b/gi, `${datosEstructurados.horas.inicio} - ${datosEstructurados.horas.fin}`);
      l = l.replace(/\$\$(?:hora_inicio)\b/gi, datosEstructurados.horas.inicio);
      l = l.replace(/\$\$(?:hora_fin)\b/gi, datosEstructurados.horas.fin);
      l = l.replace(/\$\$(?:hora_desplazamiento)\b/gi, datosEstructurados.horas.desplazamiento || "-");
      l = l.replace(/\$\$(?:estado)\b/gi, "CERRADO Y ENTREGADO A CONFORMIDAD");

      // B. Reemplazo de marcadores entre corchetes o signos (ej: [N° de Caso], <falla>, ___ )
      l = l.replace(/\[(?:n[°o]|numero|número)?\s*(?:de\s*)?caso\]/gi, datosEstructurados.numero_caso);
      l = l.replace(/\[(?:proveedor|entidad)\]/gi, datosEstructurados.proveedor);
      l = l.replace(/\[(?:cliente|banco)\]/gi, datosEstructurados.cliente);
      l = l.replace(/\[(?:mesa)\]/gi, datosEstructurados.mesa);
      l = l.replace(/\[(?:coordinador(?:a)?)\]/gi, datosEstructurados.coordinador);
      l = l.replace(/\[(?:equipo|serial)\]/gi, datosEstructurados.equipo);
      l = l.replace(/\[(?:falla)\]/gi, datosEstructurados.falla);
      l = l.replace(/\[(?:causa|diagnostico)\]/gi, datosEstructurados.causa);
      l = l.replace(/\[(?:solucion|actividades)\]/gi, datosEstructurados.solucion);
      l = l.replace(/\[(?:pruebas)\]/gi, datosEstructurados.pruebas);
      l = l.replace(/\[(?:tecnico)\]/gi, datosEstructurados.tecnico);
      l = l.replace(/\[(?:horario|horas)\]/gi, `${datosEstructurados.horas.inicio} - ${datosEstructurados.horas.fin}`);

      // C. Etiquetas que terminan en dos puntos o signo igual vacías
      if (/(?:n[°o]|numero|número)\s*(?:de\s*)?(?:caso|requerimiento|ticket|inc|wo)\s*[:=]\s*$/i.test(l) && datosEstructurados.numero_caso) {
        return l + " " + datosEstructurados.numero_caso;
      }
      if (/(?:proveedor(?:\s*\/\s*entidad)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.proveedor) {
        return l + " " + datosEstructurados.proveedor;
      }
      if (/(?:cliente(?:\s*final)?|banco)\s*[:=]\s*$/i.test(l) && datosEstructurados.cliente) {
        return l + " " + datosEstructurados.cliente;
      }
      if (/(?:mesa(?:\s*de\s*soporte)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.mesa) {
        return l + " " + datosEstructurados.mesa;
      }
      if (/(?:coordinador(?:a)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.coordinador) {
        return l + " " + datosEstructurados.coordinador;
      }
      if (/(?:equipo(?:\s*\/\s*serial)?|serial|hostname)\s*[:=]\s*$/i.test(l) && datosEstructurados.equipo) {
        return l + " " + datosEstructurados.equipo;
      }
      if (/(?:tipo\s*de\s*medio|medio)\s*[:=]\s*$/i.test(l) && datosEstructurados.medio) {
        return l + " " + datosEstructurados.medio;
      }
      if (/(?:sh\s*\/\s*hw|sh)\s*[:=]\s*$/i.test(l) && datosEstructurados.sh) {
        return l + " " + datosEstructurados.sh;
      }
      if (/(?:falla(?:\s*reportada)?|problema)\s*[:=]\s*$/i.test(l) && datosEstructurados.falla) {
        return l + " " + datosEstructurados.falla;
      }
      if (/(?:diagn[oó]stico|causa(?:\s*ra[ií]z)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.causa) {
        return l + " " + datosEstructurados.causa;
      }
      if (/(?:soluci[oó]n(?:\s*t[eé]cnica)?|actividades(?:\s*realizadas)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.solucion) {
        return l + " " + datosEstructurados.solucion;
      }
      if (/(?:pruebas(?:\s*de\s*validaci[oó]n)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.pruebas) {
        return l + " " + datosEstructurados.pruebas;
      }
      if (/(?:t[eé]cnico(?:\s*responsable)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.tecnico) {
        return l + " " + datosEstructurados.tecnico;
      }
      if (/(?:fecha(?:\s*de\s*atenci[oó]n)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.fecha_atencion) {
        return l + " " + datosEstructurados.fecha_atencion;
      }
      if (/(?:fecha(?:\s*de\s*solicitud)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.fecha_solicitud) {
        return l + " " + datosEstructurados.fecha_solicitud;
      }
      if (/(?:fecha(?:\s*de\s*finalizaci[oó]n)?)\s*[:=]\s*$/i.test(l) && datosEstructurados.fecha_finalizacion) {
        return l + " " + datosEstructurados.fecha_finalizacion;
      }
      if (/(?:horario|horas)\s*[:=]\s*$/i.test(l)) {
        return l + ` ${datosEstructurados.horas.inicio} - ${datosEstructurados.horas.fin}`;
      }
      if (/(?:estado)\s*[:=]\s*$/i.test(l)) {
        return l + " CERRADO Y ENTREGADO A CONFORMIDAD";
      }

      return l;
    });

    plantillaCorporativa = lineasMapeadas.join("\n");
  } else {
    // Si no se proporcionó plantilla institucional en blanco, generar la Corporativa Oficial ENTER Ltda.
    const partes = [
      "*REPORTE DE SOPORTE TÉCNICO EN SITIO*",
      `N° Caso: ${datosEstructurados.numero_caso || "SIN ASIGNAR"}`,
      `Fecha: ${datosEstructurados.fecha_atencion || datosEstructurados.fecha_solicitud}`
    ];

    if (datosEstructurados.proveedor) partes.push(`Proveedor: ${datosEstructurados.proveedor}`);
    if (datosEstructurados.cliente) partes.push(`Cliente: ${datosEstructurados.cliente}`);
    if (datosEstructurados.mesa || datosEstructurados.coordinador) {
      partes.push(`Mesa: ${datosEstructurados.mesa || "-"} | Coordinador: ${datosEstructurados.coordinador || "-"}`);
    }
    if (datosEstructurados.equipo) partes.push(`Equipo / Serial: ${datosEstructurados.equipo}`);
    partes.push(`Medio: ${datosEstructurados.medio} | Tipo: ${datosEstructurados.sh}`);
    if (datosEstructurados.falla) partes.push(`Falla Reportada: ${datosEstructurados.falla}`);
    if (datosEstructurados.causa) partes.push(`Diagnóstico / Causa: ${datosEstructurados.causa}`);
    if (datosEstructurados.solucion) partes.push(`Solución Técnica: ${datosEstructurados.solucion}`);
    if (datosEstructurados.pruebas) partes.push(`Pruebas Realizadas: ${datosEstructurados.pruebas}`);
    partes.push(`Horario: ${datosEstructurados.horas.inicio} - ${datosEstructurados.horas.fin}`);
    partes.push("Estado: CERRADO Y ENTREGADO A CONFORMIDAD");
    partes.push(`Técnico: ${datosEstructurados.tecnico}`);

    plantillaCorporativa = partes.join("\n");
  }

  // Si la plantilla generada o mapeada está incompleta, intentar enriquecerla desde la memoria histórica
  if (!plantillaInstitucional && datosEstructurados.falla) {
    const memoriaEncontrada = consultarMemoriaPlantillaHistorica({
      falla: datosEstructurados.falla,
      cliente: datosEstructurados.cliente,
      proveedor: datosEstructurados.proveedor
    });
    if (memoriaEncontrada && memoriaEncontrada.plantilla) {
      // Si la memoria histórica contiene soluciones o causas técnicas mejor redactadas
      if (!datosEstructurados.solucion && memoriaEncontrada.solucion) {
        datosEstructurados.solucion = memoriaEncontrada.solucion;
      }
      if (!datosEstructurados.causa && memoriaEncontrada.causa) {
        datosEstructurados.causa = memoriaEncontrada.causa;
      }
      if (!datosEstructurados.pruebas && memoriaEncontrada.pruebas) {
        datosEstructurados.pruebas = memoriaEncontrada.pruebas;
      }
    }
  }

  return {
    datos: datosEstructurados,
    plantillaCorporativa: plantillaCorporativa.trim()
  };
}

const LOCAL_STORAGE_MEMORIA_PLANTILLAS = "crm_memoria_plantillas_historicas";

/**
 * Guarda en memoria histórica local el patrón de plantilla y redacción técnica de un servicio.
 */
export function guardarPlantillaEnMemoriaHistorica(servicio) {
  if (!servicio || !servicio.plantilla_completa) return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEMORIA_PLANTILLAS);
    const lista = raw ? JSON.parse(raw) : [];

    const claveFalla = (servicio.falla || "").trim().toLowerCase();
    const claveCliente = (servicio.cliente || "").trim().toLowerCase();
    const claveProveedor = (servicio.proveedor || "").trim().toLowerCase();

    // Buscar si ya existe patrón similar
    const existenteIdx = lista.findIndex(
      (item) => item.claveFalla === claveFalla && item.claveProveedor === claveProveedor
    );

    const entrada = {
      id: `mem-${Date.now()}`,
      claveFalla,
      claveCliente,
      claveProveedor,
      falla: servicio.falla || "",
      causa: servicio.causa || "",
      solucion: servicio.solucion || "",
      pruebas: servicio.pruebas || "",
      equipo: servicio.equipo || "",
      plantilla: servicio.plantilla_completa,
      actualizado_en: new Date().toISOString()
    };

    if (existenteIdx >= 0) {
      lista[existenteIdx] = entrada;
    } else {
      lista.unshift(entrada);
      if (lista.length > 100) lista.pop(); // Mantener top 100 patrones
    }

    localStorage.setItem(LOCAL_STORAGE_MEMORIA_PLANTILLAS, JSON.stringify(lista));
  } catch (e) {
    console.warn("No se pudo guardar en memoria histórica de plantillas:", e);
  }
}

/**
 * Consulta la memoria histórica para encontrar redacción o estructura previa de plantillas similares.
 */
export function consultarMemoriaPlantillaHistorica({ falla = "", cliente = "", proveedor = "" }) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEMORIA_PLANTILLAS);
    if (!raw) return null;
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista) || lista.length === 0) return null;

    const fLimpia = (falla || "").toLowerCase().trim();
    const cLimpia = (cliente || "").toLowerCase().trim();
    const pLimpia = (proveedor || "").toLowerCase().trim();

    // 1. Coincidencia exacta de falla y proveedor
    let match = lista.find(
      (m) => m.claveFalla && fLimpia && m.claveFalla === fLimpia && m.claveProveedor === pLimpia
    );
    if (match) return match;

    // 2. Coincidencia por palabras clave de falla (ej. "formateo", "disco", "impresora", "actualización", "sistema operativo")
    match = lista.find(
      (m) => m.claveFalla && fLimpia && (fLimpia.includes(m.claveFalla) || m.claveFalla.includes(fLimpia))
    );
    if (match) return match;

    // 3. Coincidencia por entidad/cliente
    match = lista.find((m) => m.claveCliente && cLimpia && m.claveCliente === cLimpia);
    return match || null;
  } catch (e) {
    console.warn("Error consultando memoria histórica de plantillas:", e);
    return null;
  }
}

