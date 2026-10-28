# BellaStyle Manager

Sistema web para un salón de belleza: login por roles (Administradora, Estilista, Clienta),
registro de cuentas, agendamiento de citas con asignación automática de estilista, panel
administrativo y chat de asesoría en la página de inicio (sin necesidad de cuenta).

- **Backend:** Node.js + Express + MySQL (contraseñas cifradas con bcrypt)
- **Frontend:** HTML + JavaScript + Tailwind CSS (compilado)

## Cómo ejecutarlo

1. Doble clic en `INSTALAR_BASE_DE_DATOS.bat` (o ejecutar `init_db.sql` en MySQL Workbench).
2. Doble clic en `backend/INICIAR_SERVIDOR.bat`.
3. Abrir `http://localhost:3000`.

Si actualizaste el proyecto, vuelve a ejecutar `INSTALAR_BASE_DE_DATOS.bat`: el chat usa las tablas `conversaciones` y `mensajes`.

Si la clave de MySQL no es `1234`, cambiarla en `backend/config/config.js`.

## Ejecutarlo con Docker

Requiere Docker Desktop abierto. Desde la carpeta `proaula_bella`:

```
docker compose up --build
```

Levanta dos contenedores: `db` (MySQL 8, carga `init_db.sql` la primera vez) y `app` (Node.js).
Abrir `http://localhost:3000`. Para apagar: `Ctrl + C` y luego `docker compose down`.

## Variables de entorno (nube)

`config.js` lee estas variables; si no existen usa los valores de tu PC.

| Variable | Ejemplo |
|---|---|
| `PORT` | 3000 (Render la pone sola) |
| `DB_HOST`, `DB_PORT` | los da el proveedor de MySQL |
| `DB_USER`, `DB_PASSWORD` | usuario y clave de MySQL |
| `DB_NAME` | bellastylemanager |
| `DB_SSL` | true (en la nube) |
| `CODIGO_ADMIN` | código para registrar administradoras |

## Usuarios de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Administradora | admin | admin123 |
| Estilista | estilista / diana / paula | est123 / diana123 / paula123 |
| Clienta | cliente | cli123 |

Código para registrar una administradora: `BELLA2026`.

## Estructura

```
proaula_bella/
├── init_db.sql                  base de datos y datos de prueba
├── INSTALAR_BASE_DE_DATOS.bat
├── backend/
│   ├── app.js                   arranca el servidor
│   ├── config/                  config.js (claves) y db.js (conexión)
│   ├── routes/rutas.js          lista de endpoints
│   ├── controllers/             lógica: auth, citas, catálogo
│   ├── models/                  consultas SQL por tabla
│   └── utils/validators.js
└── frontend/
    ├── welcome.html  index.html  register.html  recuperar.html  panel.html
    ├── js/                      un archivo por página + api.js compartido
    ├── src/estilos.css          fuente de Tailwind
    ├── css/estilos.css          CSS compilado (el que usan las páginas)
    ├── tailwind.config.js
    ├── fonts/  img/
```

## Cambiar estilos

Los estilos se escriben con clases de Tailwind en los HTML. Después de cambiar algo:

```
cd backend
npm run css
```

La documentación completa está en la carpeta `docs/` (Manual de Usuario y Manual Técnico).
