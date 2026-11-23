// Servidor principal de BellaStyle Manager
const express = require('express');
const path = require('path');
const config = require('./config/config');
const db = require('./config/db');
const rutas = require('./routes/rutas');

const app = express();

// Permite leer JSON en el cuerpo de las peticiones (hasta 15MB para fotos de productos y ejemplos de servicios)
app.use(express.json({ limit: '15mb' }));

// Migración automática de columnas nuevas en MySQL (si usa MySQL real)
async function asegurarColumnasFotos() {
    try {
        const [colProdImg] = await db.query("SHOW COLUMNS FROM productos LIKE 'imagen'");
        if (colProdImg.length === 0) {
            await db.query('ALTER TABLE productos ADD COLUMN imagen MEDIUMTEXT DEFAULT NULL');
            await db.query('ALTER TABLE productos ADD COLUMN categoria VARCHAR(100) DEFAULT NULL');
            await db.query('ALTER TABLE productos ADD COLUMN descripcion TEXT DEFAULT NULL');
        }
        const [colSrvImg] = await db.query("SHOW COLUMNS FROM servicios LIKE 'imagen'");
        if (colSrvImg.length === 0) {
            await db.query('ALTER TABLE servicios ADD COLUMN imagen MEDIUMTEXT DEFAULT NULL');
            await db.query('ALTER TABLE servicios ADD COLUMN subtitulo VARCHAR(255) DEFAULT NULL');
            await db.query('ALTER TABLE servicios ADD COLUMN ejemplos MEDIUMTEXT DEFAULT NULL');
        }
    } catch (_) {}
}

// La dirección principal (http://localhost:3000) abre la Landing Page (welcome.html)
app.get('/', (req, res) => res.redirect('/welcome.html'));

// Sirve las páginas del frontend (welcome.html, index.html, panel.html, etc.)
app.use(express.static(path.join(__dirname, '../frontend')));

// Todas las rutas de la API empiezan por /api
app.use('/api', rutas);

// Revisa que la base de datos sea la versión actual (contraseñas cifradas).
// Si es la versión vieja, el login no funcionaría.
async function revisarBaseDeDatos() {
    // Migración automática: permiso para crear otras administradoras
    const [colPermiso] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'puede_crear_admins'");
    if (colPermiso.length === 0) {
        await db.query('ALTER TABLE usuarios ADD COLUMN puede_crear_admins BOOLEAN NOT NULL DEFAULT FALSE');
        await db.query("UPDATE usuarios SET puede_crear_admins = TRUE WHERE username = 'admin'");
    }

    const [columnas] = await db.query("SHOW COLUMNS FROM citas LIKE 'precio'");
    const [chat] = await db.query("SHOW TABLES LIKE 'mensajes'");
    const [usuarios] = await db.query('SELECT password FROM usuarios LIMIT 1');
    const cifradas = usuarios.length === 0 || usuarios[0].password.startsWith('$2');
    if (columnas.length === 0 || chat.length === 0 || !cifradas) {
        console.error('ATENCION: la base de datos es la version vieja.');
        console.error('Ejecuta INSTALAR_BASE_DE_DATOS.bat y vuelve a iniciar el servidor.');
    }
}

// Antes de arrancar en servidor local/tradicional, se comprueba que MySQL (o memoriaDb) responda
if (!process.env.VERCEL && require.main === module) {
    db.query('SELECT 1')
        .then(revisarBaseDeDatos)
        .then(asegurarColumnasFotos)
        .then(() => {
            app.listen(config.puerto, () => {
                console.log('Conectado a MySQL');
                console.log(`Servidor en http://localhost:${config.puerto}`);
            });
        })
        .catch((err) => {
            console.error('No se pudo conectar a MySQL:', err.message);
            console.error('Revisa usuario y contraseña en backend/config/config.js');
            process.exit(1);
        });
}

module.exports = app;
