import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { configurado } from "./config.js";
import { db, COLECCION, aLista } from "./firebase.js";
import {
  MESES, DIAS, DIAS_CORTOS, escapar, capitalizar, aFecha, aISO, hoyISO, diasHasta,
  fechaLarga, rangoHora, categoria, categoriasDe, ordenarEventos, aplicarMarca, eventosDemo,
} from "./comun.js";

const estado = {
  eventos: [],
  filtro: "todas",
  vista: "lista",
  mes: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  diaSeleccionado: hoyISO(),
};

const $ = (sel) => document.querySelector(sel);

function conectar() {
  if (!configurado) {
    $("#avisoDemo").hidden = false;
    recibir(eventosDemo());
    return;
  }
  const sinConexion = () => {
    $("#lista").innerHTML = `<p class="vacio">No se pudo cargar la agenda. Intenta de nuevo más tarde.</p>`;
  };
  // Firebase reintenta en silencio si no hay conexión; avisamos si tarda demasiado.
  const espera = setTimeout(sinConexion, 12000);
  onValue(
    ref(db, COLECCION),
    (snap) => {
      clearTimeout(espera);
      recibir(aLista(snap));
    },
    (err) => {
      console.error(err);
      clearTimeout(espera);
      sinConexion();
    },
  );
}

function recibir(eventos) {
  estado.eventos = ordenarEventos(eventos.filter((e) => e.fecha));
  pintarFiltros();
  pintar();
}

const visibles = () => estado.eventos.filter((e) =>
  estado.filtro === "todas" || categoria(e.categoria).clave === estado.filtro);

function pintar() {
  pintarDestacado();
  if (estado.vista === "lista") pintarLista();
  else pintarCalendario();
}

// ---------- Filtros y vistas ----------

// Los filtros salen de las categorías que tienen los eventos guardados.
function pintarFiltros() {
  const cats = categoriasDe(estado.eventos);
  if (!cats.some((c) => c.clave === estado.filtro)) estado.filtro = "todas";
  const chips = [["todas", "Todas", null], ...cats.map((c) => [c.clave, c.nombre, c.color])];
  $("#filtros").innerHTML = chips.map(([clave, nombre, color]) => `
    <button class="chip ${clave === estado.filtro ? "activo" : ""}" data-filtro="${clave}"
      ${color ? `style="--cat:${color}"` : ""} aria-pressed="${clave === estado.filtro}">
      ${color ? '<span class="chip__punto"></span>' : ""}${escapar(nombre)}
    </button>`).join("");
}

$("#filtros").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filtro]");
  if (!btn) return;
  estado.filtro = btn.dataset.filtro;
  pintarFiltros();
  pintar();
});

document.querySelectorAll("[data-vista]").forEach((btn) => btn.addEventListener("click", () => {
  estado.vista = btn.dataset.vista;
  document.querySelectorAll("[data-vista]").forEach((b) => {
    const activo = b === btn;
    b.classList.toggle("activo", activo);
    b.setAttribute("aria-selected", activo);
  });
  $("#vistaLista").hidden = estado.vista !== "lista";
  $("#vistaCalendario").hidden = estado.vista !== "calendario";
  pintar();
}));

$("#verPasados").addEventListener("change", pintarLista);

// ---------- Próximo evento ----------

function pintarDestacado() {
  const hoy = hoyISO();
  const prox = estado.eventos.find((e) => e.fecha >= hoy);
  const caja = $("#destacado");
  if (!prox) { caja.hidden = true; return; }
  const n = diasHasta(prox.fecha);
  const cuando = n === 0 ? "Hoy" : n === 1 ? "Mañana" : `En ${n} días`;
  const cat = categoria(prox.categoria);
  caja.hidden = false;
  caja.style.setProperty("--cat", cat.color);
  caja.innerHTML = `
    <div class="destacado__cuando">
      <span class="destacado__etiqueta">Próximo evento</span>
      <span class="destacado__cuenta">${cuando}</span>
    </div>
    <div class="destacado__info">
      <span class="badge">${escapar(cat.nombre)}</span>
      <h2>${escapar(prox.titulo)}</h2>
      <p class="meta">
        <span>${fechaLarga(prox.fecha)}</span>
        ${prox.hora ? `<span>· ${rangoHora(prox)}</span>` : ""}
        ${prox.lugar ? `<span>· ${escapar(prox.lugar)}</span>` : ""}
      </p>
      ${prox.encargados ? `<p class="meta meta--encargados">${iconoEncargados}Encargados: ${escapar(prox.encargados)}</p>` : ""}
    </div>`;
}

// ---------- Lista ----------

function tarjeta(e) {
  const f = aFecha(e.fecha);
  const cat = categoria(e.categoria);
  const pasado = e.fecha < hoyISO();
  return `
    <article class="evento ${pasado ? "evento--pasado" : ""}" style="--cat:${cat.color}">
      <div class="evento__fecha">
        <span class="evento__dia-sem">${DIAS[f.getDay()].slice(0, 3)}</span>
        <span class="evento__dia">${f.getDate()}</span>
        <span class="evento__mes">${MESES[f.getMonth()].slice(0, 3)}</span>
      </div>
      <div class="evento__cuerpo">
        <div class="evento__arriba">
          <span class="badge">${escapar(cat.nombre)}</span>
          ${e.hora ? `<span class="evento__hora">${rangoHora(e)}</span>` : ""}
        </div>
        <h3>${escapar(e.titulo)}</h3>
        ${e.lugar ? `<p class="evento__lugar">${iconoLugar}${escapar(e.lugar)}</p>` : ""}
        ${e.encargados ? `<p class="evento__lugar">${iconoEncargados}<span><strong>Encargados:</strong> ${escapar(e.encargados)}</span></p>` : ""}
        ${e.descripcion ? `<p class="evento__desc">${escapar(e.descripcion)}</p>` : ""}
      </div>
    </article>`;
}

const iconoEncargados = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7.5 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM9 13c-4 0-7 2-7 4.5V20h14v-2.5C16 15 13 13 9 13zm7.5 0c-.6 0-1.2.1-1.7.2 1.4 1 2.2 2.4 2.2 4.3V20H22v-2.5c0-2.5-2.5-4.5-5.5-4.5z" fill="currentColor"/></svg>`;
const iconoLugar = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>`;

function pintarLista() {
  const verPasados = $("#verPasados").checked;
  const hoy = hoyISO();
  const eventos = visibles().filter((e) => verPasados || e.fecha >= hoy);
  if (!eventos.length) {
    $("#lista").innerHTML = `<p class="vacio">No hay eventos ${verPasados ? "" : "próximos "}en esta categoría.</p>`;
    return;
  }
  const grupos = new Map();
  for (const e of eventos) {
    const clave = e.fecha.slice(0, 7);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(e);
  }
  $("#lista").innerHTML = [...grupos].map(([clave, evs]) => {
    const [a, m] = clave.split("-").map(Number);
    return `
      <section class="mes">
        <h2 class="mes__titulo">${capitalizar(MESES[m - 1])} <span>${a}</span></h2>
        <div class="mes__eventos">${evs.map(tarjeta).join("")}</div>
      </section>`;
  }).join("");
}

// ---------- Calendario ----------

$("#mesAnterior").addEventListener("click", () => moverMes(-1));
$("#mesSiguiente").addEventListener("click", () => moverMes(1));

function moverMes(delta) {
  estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + delta, 1);
  pintarCalendario();
}

$("#gridCalendario").addEventListener("click", (e) => {
  const celda = e.target.closest("[data-dia]");
  if (!celda) return;
  estado.diaSeleccionado = celda.dataset.dia;
  pintarCalendario();
});

function pintarCalendario() {
  const { mes } = estado;
  $("#tituloMes").textContent = `${capitalizar(MESES[mes.getMonth()])} ${mes.getFullYear()}`;

  const porDia = new Map();
  for (const e of visibles()) {
    if (!porDia.has(e.fecha)) porDia.set(e.fecha, []);
    porDia.get(e.fecha).push(e);
  }

  const desfase = (mes.getDay() + 6) % 7; // semana empieza en lunes
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const hoy = hoyISO();
  let html = DIAS_CORTOS.map((d) => `<div class="calendario__sem">${d}</div>`).join("");
  html += `<div class="calendario__vacio"></div>`.repeat(desfase);

  for (let d = 1; d <= diasMes; d++) {
    const iso = aISO(new Date(mes.getFullYear(), mes.getMonth(), d));
    const evs = porDia.get(iso) || [];
    const clases = ["calendario__dia",
      iso === hoy && "es-hoy",
      iso === estado.diaSeleccionado && "seleccionado",
      evs.length && "con-eventos"].filter(Boolean).join(" ");
    html += `
      <button class="${clases}" data-dia="${iso}" aria-label="${fechaLarga(iso)}, ${evs.length} evento(s)">
        <span class="calendario__num">${d}</span>
        <span class="calendario__marcas">
          ${evs.slice(0, 3).map((e) => `<span class="calendario__titulo" style="--cat:${categoria(e.categoria).color}">${escapar(e.titulo)}</span>`).join("")}
          ${evs.length > 3 ? `<span class="calendario__mas">+${evs.length - 3}</span>` : ""}
        </span>
      </button>`;
  }
  $("#gridCalendario").innerHTML = html;

  const delDia = porDia.get(estado.diaSeleccionado) || [];
  $("#detalleDia").innerHTML = `
    <h3 class="detalle-dia__titulo">${fechaLarga(estado.diaSeleccionado)}</h3>
    ${delDia.length ? `<div class="mes__eventos">${delDia.map(tarjeta).join("")}</div>`
      : `<p class="vacio">No hay eventos este día.</p>`}`;
}

// ---------- Arranque ----------

aplicarMarca();
$("#anio").textContent = new Date().getFullYear();
pintarFiltros();
conectar();
