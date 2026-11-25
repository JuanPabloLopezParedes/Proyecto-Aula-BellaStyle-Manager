# 📱 BellaStyle Mobile App — Vue.js 3 + Ionic 9 + Capacitor 8

Aplicación móvil oficial de **BellaStyle Manager**, construida con la arquitectura limpia (**Clean / Hexagonal Architecture**) del repositorio de referencia [`user-admin-vuejs-ionic-app`](https://github.com/arrietajohn/user-admin-vuejs-ionic-app.git) y conectada en tiempo real con el **mismo backend Node.js / Express (`backend/`)**.

---

## 🏗️ Estructura de Arquitectura Limpia (`src/`)

- `src/domain/`: Modelos del dominio (`BellaSession`, `ServicioBella`, `ProductoBella`, `CitaBella`, `CompraProductoBella`, `ItemCarritoBella`), puertos de salida (`SessionStore.ts`) y excepciones (`errors.ts`).
- `src/adapters/`:
  - `http/HttpClient.ts`: Cliente HTTP con soporte automático de token JWT (`Authorization: Bearer <token>`), control de sesión expirada (`401`) y timeout.
  - `storage/BrowserSessionStore.ts`: Persistencia de sesión (`bellaUsuario`) y del carrito de compras (`bellaCarritoClienta`).
- `src/application/services/BellaApplicationService.ts`: Casos de uso conectados a los endpoints reales del backend (`/api/login`, `/api/register`, `/api/servicios`, `/api/estilistas`, `/api/productos`, `/api/citas`, `/api/carrito/comprar`, `/api/compras`, `/api/citas/:id/calificar` y `/api/compras/:id/calificar`).
- `src/bootstrap/`:
  - `container.ts`: Inyección de dependencias que selecciona automáticamente la URL del backend según si corre en Web (`VITE_API_BASE_URL=/api`) o en Android/iOS nativo con Capacitor (`VITE_NATIVE_API_BASE_URL`).
  - `native.ts`: Configuración nativa de barra de estado, teclado y botón atrás de Android.
- `src/entrypoint/gui/`: Componentes visuales Vue 3 + Ionic (`App.vue`, `router.ts`, `styles.css` y las vistas `AuthView.vue`, `HomeView.vue`, `ServiciosView.vue`, `TiendaCarritoView.vue`, `CitasComprasView.vue` y `AccountView.vue`).

---

## 🔌 ¿Cómo se conecta con el MISMO Backend de BellaStyle?

El backend de BellaStyle (`backend/server.js` / `backend/app.js`) ya tiene **CORS habilitado (`app.use(cors())`)** y expone toda la API en `/api/...`.

Tienes **3 formas de conectarlo** dependiendo de dónde abras la app móvil:

### 1. En tu computador (Modo Desarrollo con Vite Proxy)
En [`vite.config.ts`](./vite.config.ts) y [`.env`](./.env) ya está configurado el proxy automático hacia `http://localhost:3000`:
```env
VITE_API_BASE_URL=/api
API_PROXY_TARGET=http://localhost:3000
```
Cada petición que hace Vue.js a `/api/...` se redirige automáticamente a tu backend local en `http://localhost:3000/api/...` sin errores de CORS.

**Pasos para ejecutar ambos al mismo tiempo:**
1. **Terminal 1 (Encender el Backend en puerto 3000):**
   ```bash
   cd backend
   npm start
   ```
2. **Terminal 2 (Encender la App Móvil Vue + Ionic en puerto 5174):**
   ```bash
   cd mobile-app
   npm install
   npm run dev
   ```
3. Abre en el navegador: **`http://localhost:5174`**

---

### 2. En un Emulador Android o Celular Físico en la misma red Wi-Fi
- **Si usas el Emulador de Android Studio:** Android mapea el `localhost` de tu PC a la IP `10.0.2.2`. En [`mobile-app/.env`](./.env) deja:
  ```env
  VITE_NATIVE_API_BASE_URL=http://10.0.2.2:3000/api
  ```
- **Si usas tu teléfono real por Wi-Fi:** Mira la IP local de tu computador (con `ipconfig` en Windows, ej. `192.168.1.25`) y pon en [`mobile-app/.env`](./.env):
  ```env
  VITE_NATIVE_API_BASE_URL=http://192.168.1.25:3000/api
  API_PROXY_TARGET=http://192.168.1.25:3000
  ```

---

### 3. Conectado a tu Backend en la Nube (Vercel) desde cualquier lugar
Para que la APK instalada en cualquier teléfono funcione desde cualquier red (datos móviles o Wi-Fi) compartiendo exactamente los mismos datos que la página web en Vercel, pon la URL de tu despliegue en [`mobile-app/.env`](./.env):
```env
VITE_NATIVE_API_BASE_URL=https://proyecto-aula-bella-style-manager.vercel.app/api
```
Luego compila y sincroniza con Capacitor:
```bash
cd mobile-app
npm run cap:sync
npm run android
```
