// Convertidor de números a palabras en español para Cuentas de Cobro

function unidades(num) {
  switch (num) {
    case 1: return "Un";
    case 2: return "Dos";
    case 3: return "Tres";
    case 4: return "Cuatro";
    case 5: return "Cinco";
    case 6: return "Seis";
    case 7: return "Siete";
    case 8: return "Ocho";
    case 9: return "Nueve";
    default: return "";
  }
}

function decenasY(strSin, numUnidades) {
  if (numUnidades > 0) return `${strSin} y ${unidades(numUnidades)}`;
  return strSin;
}

function decenas(num) {
  const diez = Math.floor(num / 10);
  const unidad = num - (diez * 10);

  switch (diez) {
    case 1:
      switch (unidad) {
        case 0: return "Diez";
        case 1: return "Once";
        case 2: return "Doce";
        case 3: return "Trece";
        case 4: return "Catorce";
        case 5: return "Quince";
        default: return `Dieci${unidades(unidad).toLowerCase()}`;
      }
    case 2:
      if (unidad === 0) return "Veinte";
      return `Veinti${unidades(unidad).toLowerCase()}`;
    case 3: return decenasY("Treinta", unidad);
    case 4: return decenasY("Cuarenta", unidad);
    case 5: return decenasY("Cincuenta", unidad);
    case 6: return decenasY("Sesenta", unidad);
    case 7: return decenasY("Setenta", unidad);
    case 8: return decenasY("Ochenta", unidad);
    case 9: return decenasY("Noventa", unidad);
    case 0: return unidades(unidad);
    default: return "";
  }
}

function centenas(num) {
  const cien = Math.floor(num / 100);
  const decena = num - (cien * 100);

  switch (cien) {
    case 1:
      if (decena > 0) return `Ciento ${decenas(decena)}`;
      return "Cien";
    case 2: return `Doscientos ${decenas(decena)}`;
    case 3: return `Trescientos ${decenas(decena)}`;
    case 4: return `Cuatrocientos ${decenas(decena)}`;
    case 5: return `Quinientos ${decenas(decena)}`;
    case 6: return `Seiscientos ${decenas(decena)}`;
    case 7: return `Setecientos ${decenas(decena)}`;
    case 8: return `Ochocientos ${decenas(decena)}`;
    case 9: return `Novecientos ${decenas(decena)}`;
    default: return decenas(decena);
  }
}

function seccion(num, divisor, strSingular, strPlural) {
  const cientos = Math.floor(num / divisor);
  const resto = num - (cientos * divisor);
  let letras = "";

  if (cientos > 0) {
    if (cientos > 1) {
      letras = `${centenas(cientos)} ${strPlural}`;
    } else {
      letras = strSingular;
    }
  }

  if (resto > 0) {
    letras = letras ? `${letras} ` : "";
  }
  return { letras, resto };
}

export function numeroALetras(monto) {
  const entero = Math.floor(Math.abs(Number(monto) || 0));
  if (entero === 0) return "Cero Pesos";

  let data = seccion(entero, 1000000, "Un Millón", "Millones");
  let resultado = data.letras;

  data = seccion(data.resto, 1000, "Mil", "mil");
  if (data.letras) {
    resultado = resultado ? `${resultado} ${data.letras}` : data.letras;
  }

  if (data.resto > 0) {
    const dec = centenas(data.resto);
    resultado = resultado ? `${resultado} ${dec}` : dec;
  }

  // Normalizar mayúsculas y espacios
  resultado = resultado.replace(/\s+/g, " ").trim();
  return `${resultado} Pesos`;
}

export function formatearMonedaCOP(monto) {
  const val = Number(monto) || 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(val).replace("COP", "$").trim();
}
