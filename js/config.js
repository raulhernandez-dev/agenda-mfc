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

// Categorías que se sugieren al registrar un evento, con su color.
// En el panel se puede escribir cualquier otra: las nuevas reciben
// un color automático.
export const CATEGORIAS = {
  "Misa":            "#7a2334",
  "Rosario":         "#3c5a8a",
  "Hora Santa":      "#5b4a8a",
  "Vigilia":         "#9c3d6b",
  "Pláticas":        "#2f6b5a",
  "Reunión":         "#02594a",
  "Evento especial": "#a8822f",
};

// Mientras no pongas tu configuración real, la vista pública
// muestra eventos de ejemplo para que puedas ver el diseño.
export const configurado = !firebaseConfig.apiKey.startsWith("TU_");
