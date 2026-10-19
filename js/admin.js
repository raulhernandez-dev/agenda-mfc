import {
  ref, onValue, push, update, remove, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { CATEGORIAS, configurado } from "./config.js";
import { db, auth, COLECCION, aLista } from "./firebase.js";
import {
  MESES, escapar, aFecha, aISO, hoyISO, sumarDias, fechaLarga, rangoHora, categoria,
  categoriasDe, claveCategoria, nombreCategoria, ordenarEventos, aplicarMarca, aviso,
} from "./comun.js";

const $ = (sel) => document.querySelector(sel);
let eventos = [];
let editandoId = null;
let desuscribir = null;

aplicarMarca();

if (!configurado) {
  $("#verificando").hidden = true;
  $("#sinConfig").hidden = false;
} else {
  onAuthStateChanged(auth, (usuario) => {
    $("#verificando").hidden = true;
    $("#login").hidden = !!usuario;
    $("#panel").hidden = !usuario;
    $("#usuarioBox").hidden = !usuario;
    if (usuario) {
      $("#usuarioEmail").textContent = usuario.email;
      escuchar();
    } else if (desuscribir) {
      desuscribir();
      desuscribir = null;
    }
  });
}

// ---------- Sesión ----------

$("#formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.submitter;
  btn.disabled = true;
  $("#errorLogin").textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#clave").value);
    $("#formLogin").reset();
  } catch (err) {
    $("#errorLogin").textContent = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(err.code)
      ? "Correo o contraseña incorrectos."
      : err.code === "auth/too-many-requests"
        ? "Demasiados intentos. Espera unos minutos."
        : "No se pudo iniciar sesión.";
  } finally {
    btn.disabled = false;
  }
});

$("#salir").addEventListener("click", () => signOut(auth));

// ---------- Datos ----------

function escuchar() {
  if (desuscribir) return;
  desuscribir = onValue(ref(db, COLECCION), (snap) => {
    eventos = ordenarEventos(aLista(snap));
    pintarCategorias();
    pintarTabla();
  }, (err) => {
    console.error(err);
    aviso("No se pudieron cargar los eventos.", "error");
  });
}

function mensajeError(err) {
  return /permission.denied/i.test(`${err.code} ${err.message}`)
    ? "Tu cuenta no tiene permiso para modificar la agenda (revisa las reglas de la base de datos)."
    : "Ocurrió un error al guardar. Inténtalo de nuevo.";
}

// ---------- Formulario ----------

$("#fFecha").value = hoyISO();
pintarCategorias();

$("#fRepetir").addEventListener("change", () => {
  $("#fVeces").disabled = $("#fRepetir").value === "0";
});

function leerFormulario() {
  const hora = $("#fHora").value;
  return {
    titulo: $("#fTitulo").value.trim(),
    fecha: $("#fFecha").value,
    hora,
    horaFin: hora ? $("#fHoraFin").value : "",
    categoria: categoriaEscrita(),
    lugar: $("#fLugar").value.trim(),
    encargados: $("#fEncargados").value.trim(),
    descripcion: $("#fDescripcion").value.trim(),
  };
}

// Si la categoría escrita ya existe (aunque cambien mayúsculas o acentos), se usa
// el mismo nombre para no crear duplicados como "misa" y "Misa".
function categoriaEscrita() {
  const escrita = $("#fCategoria").value.trim().replace(/\s+/g, " ");
  if (!escrita) return "";
  const clave = claveCategoria(escrita);
  return opcionesCategoria().find((n) => claveCategoria(n) === clave) || escrita;
}

function fechasRepetidas(inicio) {
  const frecuencia = $("#fRepetir").value;
  if (frecuencia === "0") return [inicio];
  const veces = Math.min(52, Math.max(2, Number($("#fVeces").value) || 2));
  return Array.from({ length: veces }, (_, i) => {
    if (frecuencia !== "mes") return sumarDias(inicio, i * Number(frecuencia));
    const f = aFecha(inicio);
    const destino = new Date(f.getFullYear(), f.getMonth() + i, 1);
    const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
    destino.setDate(Math.min(f.getDate(), ultimoDia));
    return aISO(destino);
  });
}

$("#formEvento").addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = leerFormulario();
  if (!datos.titulo || !datos.fecha) return;
  if (datos.horaFin && datos.horaFin <= datos.hora) {
    aviso("La hora de fin debe ser después de la hora de inicio.", "error");
    $("#fHoraFin").focus();
    return;
  }
  const btn = $("#btnGuardar");
  btn.disabled = true;
  try {
    if (editandoId) {
      await update(ref(db, `${COLECCION}/${editandoId}`), { ...datos, actualizado: serverTimestamp() });
      aviso("Evento actualizado.");
    } else {
      const fechas = fechasRepetidas(datos.fecha);
      // Una sola escritura multiruta: se crean todos los eventos o ninguno.
      const cambios = {};
      for (const fecha of fechas) {
        const { key } = push(ref(db, COLECCION));
        cambios[`${COLECCION}/${key}`] = { ...datos, fecha, creado: serverTimestamp() };
      }
      await update(ref(db), cambios);
      aviso(fechas.length > 1 ? `Se crearon ${fechas.length} eventos.` : "Evento creado.");
    }
    limpiarFormulario();
  } catch (err) {
    console.error(err);
    aviso(mensajeError(err), "error");
  } finally {
    btn.disabled = false;
  }
});

function limpiarFormulario() {
  editandoId = null;
  $("#formEvento").reset();
  $("#fFecha").value = hoyISO();
  $("#fVeces").disabled = true;
  $("#tituloForm").textContent = "Nuevo evento";
  $("#btnGuardar").textContent = "Guardar evento";
  $("#cancelarEdicion").hidden = true;
  $("#bloqueRepetir").hidden = false;
  pintarTabla();
}

$("#cancelarEdicion").addEventListener("click", limpiarFormulario);

function editar(id) {
  const ev = eventos.find((x) => x.id === id);
  if (!ev) return;
  editandoId = id;
  $("#fTitulo").value = ev.titulo || "";
  $("#fFecha").value = ev.fecha || "";
  $("#fHora").value = ev.hora || "";
  $("#fHoraFin").value = ev.horaFin || "";
  $("#fCategoria").value = ev.categoria ? nombreCategoria(ev.categoria) : "";
  $("#fLugar").value = ev.lugar || "";
  $("#fEncargados").value = ev.encargados || "";
  $("#fDescripcion").value = ev.descripcion || "";
  $("#tituloForm").textContent = "Editar evento";
  $("#btnGuardar").textContent = "Guardar cambios";
  $("#cancelarEdicion").hidden = false;
  $("#bloqueRepetir").hidden = true;
  pintarTabla();
  $(".panel__form").scrollIntoView({ behavior: "smooth", block: "start" });
  $("#fTitulo").focus({ preventScroll: true });
}

function duplicar(id) {
  const ev = eventos.find((x) => x.id === id);
  if (!ev) return;
  limpiarFormulario();
  editar(id);
  editandoId = null;
  $("#fFecha").value = sumarDias(ev.fecha, 7);
  $("#tituloForm").textContent = "Duplicar evento";
  $("#btnGuardar").textContent = "Crear copia";
  $("#bloqueRepetir").hidden = false;
  pintarTabla();
}

async function eliminar(id) {
  const ev = eventos.find((x) => x.id === id);
  if (!ev) return;
  const dialogo = $("#confirmar");
  $("#confirmarTexto").textContent = `“${ev.titulo}” — ${fechaLarga(ev.fecha)}`;
  dialogo.showModal();
  dialogo.addEventListener("close", async () => {
    if (dialogo.returnValue !== "si") return;
    try {
      await remove(ref(db, `${COLECCION}/${id}`));
      if (editandoId === id) limpiarFormulario();
      aviso("Evento eliminado.");
    } catch (err) {
      console.error(err);
      aviso(mensajeError(err), "error");
    }
  }, { once: true });
}

// ---------- Categorías ----------

// Sugerencias: las de config.js más las que ya usan los eventos.
function opcionesCategoria() {
  const nombres = [...Object.keys(CATEGORIAS), ...categoriasDe(eventos).map((c) => c.nombre)];
  const vistos = new Set();
  return nombres.filter((n) => {
    const clave = claveCategoria(n);
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

function pintarCategorias() {
  $("#listaCategorias").innerHTML = opcionesCategoria()
    .map((n) => `<option value="${escapar(n)}"></option>`).join("");
  const cats = categoriasDe(eventos);
  $("#categoriasAdmin").innerHTML = cats.length ? `
    <span class="categorias-admin__titulo">Categorías <small>(toca una para renombrarla)</small></span>
    <div class="filtros">
      ${cats.map((c) => `
        <button class="chip" style="--cat:${c.color}" data-renombrar="${escapar(c.clave)}" title="Renombrar en todos sus eventos">
          <span class="chip__punto"></span>${escapar(c.nombre)} <span class="chip__total">${c.total}</span>
        </button>`).join("")}
    </div>` : "";
}

$("#categoriasAdmin").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-renombrar]");
  if (btn) renombrarCategoria(btn.dataset.renombrar);
});

function renombrarCategoria(clave) {
  const afectados = eventos.filter((ev) => categoria(ev.categoria).clave === clave);
  if (!afectados.length) return;
  const actual = categoria(afectados[0].categoria).nombre;
  const dialogo = $("#renombrar");
  $("#renombrarTexto").textContent = `“${actual}” se cambiará en ${afectados.length} evento(s).`;
  $("#nuevoNombre").value = actual;
  dialogo.showModal();
  $("#nuevoNombre").select();
  dialogo.addEventListener("close", async () => {
    const nuevo = $("#nuevoNombre").value.trim().replace(/\s+/g, " ");
    if (dialogo.returnValue !== "si" || !nuevo || nuevo === actual) return;
    const cambios = {};
    for (const ev of afectados) cambios[`${COLECCION}/${ev.id}/categoria`] = nuevo;
    try {
      await update(ref(db), cambios);
      aviso(`Categoría renombrada a “${nuevo}”.`);
    } catch (err) {
      console.error(err);
      aviso(mensajeError(err), "error");
    }
  }, { once: true });
}

// ---------- Tabla ----------

$("#buscar").addEventListener("input", pintarTabla);
$("#adminPasados").addEventListener("change", pintarTabla);

$("#tablaEventos").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const { accion, id } = btn.dataset;
  if (accion === "editar") editar(id);
  if (accion === "duplicar") duplicar(id);
  if (accion === "eliminar") eliminar(id);
});

function pintarTabla() {
  const texto = $("#buscar").value.trim().toLowerCase();
  const verPasados = $("#adminPasados").checked;
  const hoy = hoyISO();
  const lista = eventos.filter((ev) =>
    (verPasados || ev.fecha >= hoy) &&
    (!texto || `${ev.titulo} ${ev.lugar} ${ev.encargados} ${ev.descripcion} ${categoria(ev.categoria).nombre}`
      .toLowerCase().includes(texto)));

  $("#contador").textContent = lista.length;
  if (!lista.length) {
    $("#tablaEventos").innerHTML = `<p class="vacio">${eventos.length ? "Ningún evento coincide." : "Aún no hay eventos. ¡Crea el primero!"}</p>`;
    return;
  }
  $("#tablaEventos").innerHTML = lista.map((ev) => {
    const cat = categoria(ev.categoria);
    const f = aFecha(ev.fecha);
    return `
      <div class="fila ${ev.id === editandoId ? "fila--editando" : ""} ${ev.fecha < hoy ? "fila--pasada" : ""}" style="--cat:${cat.color}">
        <div class="fila__fecha">
          <strong>${f.getDate()}</strong>
          <span>${MESES[f.getMonth()].slice(0, 3)}</span>
        </div>
        <div class="fila__info">
          <strong>${escapar(ev.titulo)}</strong>
          <span class="sutil">${fechaLarga(ev.fecha)}${ev.hora ? ` · ${rangoHora(ev)}` : ""}${ev.lugar ? ` · ${escapar(ev.lugar)}` : ""}</span>
          ${ev.encargados ? `<span class="sutil">Encargados: ${escapar(ev.encargados)}</span>` : ""}
          <span class="badge">${escapar(cat.nombre)}</span>
        </div>
        <div class="fila__acciones">
          <button class="btn btn--fantasma btn--chico" data-accion="editar" data-id="${ev.id}">Editar</button>
          <button class="btn btn--fantasma btn--chico" data-accion="duplicar" data-id="${ev.id}" title="Crear una copia una semana después">Duplicar</button>
          <button class="btn btn--peligro-suave btn--chico" data-accion="eliminar" data-id="${ev.id}">Eliminar</button>
        </div>
      </div>`;
  }).join("");
}
