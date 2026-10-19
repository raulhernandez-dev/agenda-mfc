# Agenda MFC Sector GH

Sitio web con dos partes:

- **`index.html`**: vista pública (solo lectura). Muestra el próximo evento, una lista por mes y un calendario, con filtros por categoría.
- **`admin.html`**: panel de administración protegido con usuario y contraseña. Desde ahí se crean, editan, duplican y eliminan eventos (con hora de inicio y fin, lugar, encargados y categoría libre), se pueden crear eventos repetidos (semanales, quincenales o mensuales) y renombrar categorías.

Los cambios hechos en el admin aparecen **al instante** en la vista pública.

Usa **GitHub Pages** (hosting gratuito) y **Firebase** con el plan gratuito *Spark* (Realtime Database + Authentication). No hace falta tarjeta de crédito.

---

## 1. Crear el proyecto en Firebase

1. Entra en <https://console.firebase.google.com> y pulsa **Agregar proyecto** (puedes desactivar Google Analytics).
2. **Realtime Database**: menú *Compilación → Realtime Database → Crear base de datos*, elige una ubicación y empieza en **modo bloqueado**.
3. **Authentication**: menú *Compilación → Authentication → Comenzar*. En *Método de acceso* activa **Correo electrónico/contraseña**.
4. En *Authentication → Usuarios → Agregar usuario*, crea la cuenta del administrador (correo + contraseña). Repite para cada persona que vaya a administrar.

## 2. Conectar el sitio con Firebase

1. En Firebase: ⚙️ *Configuración del proyecto → General → Tus apps* → icono **`</>`** (Web). Ponle un nombre y regístrala (no marques Hosting).
2. Copia el objeto `firebaseConfig` que te muestra y pégalo en **`js/config.js`**, reemplazando los valores `TU_...`. Asegúrate de que incluya `databaseURL` (la dirección de tu Realtime Database, tipo `https://TU_PROYECTO-default-rtdb.firebaseio.com`).
3. En ese mismo archivo puedes cambiar el nombre, el título y el versículo.

> Estas claves de Firebase **no son secretas**: están hechas para ir en el navegador. La seguridad la dan las reglas del paso 3.

## 3. Reglas de seguridad (importante)

1. Abre **`database.rules.json`**. El correo del administrador está en la línea de `".write"`. Para varios administradores: `"auth != null && (auth.token.email === 'uno@mail.com' || auth.token.email === 'otro@mail.com')"`.
2. En Firebase: *Realtime Database → Reglas*, borra lo que haya, pega el contenido del archivo y pulsa **Publicar**.

Así, cualquiera puede **ver** la agenda, pero solo esos correos pueden **modificarla**.

## 4. Publicar en GitHub Pages

1. Crea un repositorio en GitHub (ej. `agenda-mfc`) y sube todos los archivos de esta carpeta.
   ```bash
   git init
   git add .
   git commit -m "Agenda MFC Sector GH"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/agenda-mfc.git
   git push -u origin main
   ```
2. En el repositorio: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, rama **`main`**, carpeta **`/ (root)`** → *Save*.
3. En uno o dos minutos el sitio estará en `https://TU_USUARIO.github.io/agenda-mfc/`.
4. En Firebase: *Authentication → Configuración → Dominios autorizados → Agregar dominio* → `TU_USUARIO.github.io`.

Listo:
- Agenda pública: `https://TU_USUARIO.github.io/agenda-mfc/`
- Administración: `https://TU_USUARIO.github.io/agenda-mfc/admin.html`

## Probar en tu computadora

Los archivos usan módulos de JavaScript, así que **no funcionan abriendo el HTML con doble clic**. Levanta un servidor local en la carpeta:

```bash
python -m http.server 8000
# o bien: npx serve
```

y abre <http://localhost:8000>. Mientras `js/config.js` no tenga tu configuración real, la página pública muestra eventos de ejemplo.

## Personalizar

| Qué | Dónde |
| --- | --- |
| Nombre, título y versículo | `js/config.js` → `IGLESIA` |
| Categorías sugeridas y sus colores | `js/config.js` → `CATEGORIAS` (en el panel se puede escribir cualquier otra; las nuevas reciben color automático) |
| Colores y tipografías | `css/estilos.css` (variables al inicio) |
| Logo e imagen principal | `img/logo.webp`, `img/sagrada-familia.webp` (originales en `img/originales/`) |
| Icono de la pestaña | `img/icono-32.png`, `img/icono-180.png` |

> Para cambiarle el nombre a una categoría en todos sus eventos (por ejemplo, de “Culto” a “Misa”), tócala en la sección **Categorías** del panel de administración.

## Límites del plan gratuito

Realtime Database en el plan Spark permite **1 GB guardado, 10 GB de descarga al mes y 100 conexiones simultáneas**, de sobra para la agenda del sector.
