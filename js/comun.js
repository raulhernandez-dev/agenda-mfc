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

export function categoria(clave) {
  return CATEGORIAS[clave] || CATEGORIAS.otro;
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
    { titulo: "Culto dominical", hora: "10:00", lugar: "Templo principal", categoria: "culto",
      descripcion: "Alabanza, adoración y predicación de la Palabra. ¡Toda la familia es bienvenida!" },
    { titulo: "Noche de oración", hora: "19:30", lugar: "Salón de oración", categoria: "oracion",
      descripcion: "Un tiempo para interceder unos por otros." },
    { titulo: "Estudio bíblico: Evangelio de Juan", hora: "19:00", lugar: "Aula 2", categoria: "estudio",
      descripcion: "Trae tu Biblia y un cuaderno." },
    { titulo: "Reunión de jóvenes", hora: "18:00", lugar: "Salón juvenil", categoria: "jovenes",
      descripcion: "Juegos, alabanza y una palabra para nuestra generación." },
    { titulo: "Escuela dominical infantil", hora: "10:00", lugar: "Aulas infantiles", categoria: "ninos", descripcion: "" },
    { titulo: "Concierto de alabanza", hora: "18:30", lugar: "Templo principal", categoria: "especial",
      descripcion: "Una tarde especial de música y gratitud. Entrada libre." },
  ];
  const desfases = [0, 3, 4, 6, 7, 13];
  return base.map((e, i) => ({ id: `demo-${i}`, fecha: sumarDias(proximoDomingo, desfases[i]), ...e }));
}
