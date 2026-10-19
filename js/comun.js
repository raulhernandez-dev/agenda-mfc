import { IGLESIA, CATEGORIAS } from "./config.js";

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function escapar(texto = "") {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Las fechas se guardan como "AAAA-MM-DD" para evitar problemas de zona horaria.
export function aFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function aISO(fecha) {
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${m}-${d}`;
}

export const hoyISO = () => aISO(new Date());

export function sumarDias(iso, dias) {
  const f = aFecha(iso);
  f.setDate(f.getDate() + dias);
  return aISO(f);
}

export function diasHasta(iso) {
  const hoy = aFecha(hoyISO());
  return Math.round((aFecha(iso) - hoy) / 86400000);
}

export function fechaLarga(iso) {
  const f = aFecha(iso);
  return `${capitalizar(DIAS[f.getDay()])} ${f.getDate()} de ${MESES[f.getMonth()]} de ${f.getFullYear()}`;
}

export function horaBonita(hora) {
  if (!hora) return "";
  const [h, m] = hora.split(":").map(Number);
  const sufijo = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

// Eventos guardados antes de las categorías libres usan estas claves.
// "estudio" se muestra como "Pláticas".
const ANTIGUAS = {
  culto: "Culto", oracion: "Oración", estudio: "Pláticas", especial: "Evento especial", otro: "Otro",
};
const COLORES = {
  ...CATEGORIAS,
  "Culto": "#7a2334", "Oración": "#3c5a8a", "Otro": "#6b6258", "General": "#6b6258",
};
const PALETA = ["#7a2334", "#3c5a8a", "#2f6b5a", "#b5651d", "#8a5aa8", "#a8822f",
  "#02594a", "#9c3d6b", "#4f6d2a", "#5b4a8a", "#2d6f8a", "#8a4b2f"];

// "Misa", "misa " y "MISA" son la misma categoría.
export const claveCategoria = (nombre = "") =>
  nombre.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function nombreCategoria(valor) {
  const v = (valor || "").trim();
  return ANTIGUAS[v] || v || "General";
}

export function categoria(valor) {
  const nombre = nombreCategoria(valor);
  const clave = claveCategoria(nombre);
  let color = Object.entries(COLORES).find(([n]) => claveCategoria(n) === clave)?.[1];
  if (!color) {
    let h = 0;
    for (const c of clave) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    color = PALETA[h % PALETA.length];
  }
  return { nombre, clave, color };
}

// Categorías presentes en una lista de eventos, con cuántos eventos tiene cada una.
export function categoriasDe(eventos) {
  const mapa = new Map();
  for (const e of eventos) {
    const cat = categoria(e.categoria);
    if (!mapa.has(cat.clave)) mapa.set(cat.clave, { ...cat, total: 0 });
    mapa.get(cat.clave).total++;
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export function rangoHora(e) {
  if (!e.hora) return "";
  return e.horaFin ? `${horaBonita(e.hora)} – ${horaBonita(e.horaFin)}` : horaBonita(e.hora);
}

export function ordenarEventos(eventos) {
  return eventos.sort((a, b) =>
    a.fecha.localeCompare(b.fecha) || (a.hora || "").localeCompare(b.hora || ""));
}

export function aplicarMarca() {
  document.querySelectorAll("[data-iglesia]").forEach((el) => {
    el.textContent = IGLESIA[el.dataset.iglesia] ?? "";
  });
}

export function aviso(mensaje, tipo = "ok") {
  let caja = document.querySelector(".toast");
  if (!caja) {
    caja = document.createElement("div");
    caja.className = "toast";
    caja.setAttribute("role", "status");
    document.body.append(caja);
  }
  caja.textContent = mensaje;
  caja.dataset.tipo = tipo;
  caja.classList.add("visible");
  clearTimeout(caja._t);
  caja._t = setTimeout(() => caja.classList.remove("visible"), 3200);
}

// Eventos de ejemplo (solo se usan mientras Firebase no está configurado).
export function eventosDemo() {
  const h = hoyISO();
  const proximoDomingo = sumarDias(h, (7 - aFecha(h).getDay()) % 7);
  const base = [
    { titulo: "Misa San Cayetano", hora: "10:00", horaFin: "11:00", lugar: "Parroquia San Cayetano", categoria: "Misa",
      encargados: "Esther y Alfredo", descripcion: "Misa mensual del sector. ¡Toda la familia es bienvenida!" },
    { titulo: "Rosario Misionero", hora: "19:30", lugar: "Casa de la familia Pérez", categoria: "Rosario",
      encargados: "Familia Pérez López", descripcion: "" },
    { titulo: "Pláticas prematrimoniales", hora: "17:00", horaFin: "20:00", lugar: "Salón parroquial", categoria: "Pláticas",
      encargados: "Equipo de Pláticas", descripcion: "Trae tu Biblia y un cuaderno." },
    { titulo: "Hora Santa", hora: "20:00", horaFin: "21:00", lugar: "Capilla", categoria: "Hora Santa", descripcion: "" },
    { titulo: "Reunión de equipo", hora: "18:00", lugar: "Salón parroquial", categoria: "Reunión", descripcion: "" },
    { titulo: "Kerigma", hora: "09:00", horaFin: "18:00", lugar: "Casa de retiros", categoria: "Evento especial",
      encargados: "Coordinación de sector", descripcion: "Retiro de fin de semana. Inscripciones con tu jefe de ciclo." },
  ];
  const desfases = [0, 3, 4, 6, 7, 13];
  return base.map((e, i) => ({ id: `demo-${i}`, fecha: sumarDias(proximoDomingo, desfases[i]), ...e }));
}
