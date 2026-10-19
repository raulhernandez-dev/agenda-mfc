// ============================================================
//  CONFIGURACIÓN — edita este archivo con los datos del sector
//  y de tu proyecto de Firebase (ver README.md, paso 2).
// ============================================================

export const IGLESIA = {
  nombre: "MFC Sector GH",
  titulo: "Agenda MFC Sector GH",
  movimiento: "Movimiento Familiar Cristiano Católico",
  versiculo: "Yo y mi casa serviremos al Señor.",
  cita: "Josué 24:15",
};

// Pega aquí el objeto que te da Firebase en
// Configuración del proyecto → Tus apps → App web.
export const firebaseConfig = {
  apiKey: "AIzaSyC4kIXWaCO8dj7JUBn78W6g-sVtDwXqItA",
  authDomain: "agendamfc.firebaseapp.com",
  databaseURL: "https://agendamfc-default-rtdb.firebaseio.com",
  projectId: "agendamfc",
  storageBucket: "agendamfc.firebasestorage.app",
  messagingSenderId: "137748487171",
  appId: "1:137748487171:web:9d46fd437098737a214236",
};

// Categorías de eventos: nombre visible y color.
export const CATEGORIAS = {
  culto:    { nombre: "Culto",           color: "#7a2334" },
  oracion:  { nombre: "Oración",         color: "#3c5a8a" },
  estudio:  { nombre: "Estudio bíblico", color: "#2f6b5a" },
  jovenes:  { nombre: "Jóvenes",         color: "#b5651d" },
  ninos:    { nombre: "Niños",           color: "#8a5aa8" },
  especial: { nombre: "Evento especial", color: "#a8822f" },
  otro:     { nombre: "Otro",            color: "#6b6258" },
};

// Mientras no pongas tu configuración real, la vista pública
// muestra eventos de ejemplo para que puedas ver el diseño.
export const configurado = !firebaseConfig.apiKey.startsWith("TU_");
