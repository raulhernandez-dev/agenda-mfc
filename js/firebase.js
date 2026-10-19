import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, configurado } from "./config.js";

const app = configurado ? initializeApp(firebaseConfig) : null;

export const db = app ? getDatabase(app) : null;
export const auth = app ? getAuth(app) : null;
export const COLECCION = "eventos";

// Realtime Database entrega un objeto { id: datos }; lo pasamos a lista.
export function aLista(snap) {
  return Object.entries(snap.val() || {}).map(([id, datos]) => ({ id, ...datos }));
}
