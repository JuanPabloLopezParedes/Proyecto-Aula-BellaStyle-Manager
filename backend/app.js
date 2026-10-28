// Servidor principal de BellaStyle Manager
const express = require('express');
const path = require('path');
const config = require('./config/config');
const db = require('./config/db');
const rutas = require('./routes/rutas');

const app = express();

// Permite leer JSON en el cuerpo de las peticiones
app.use(express.json());

// La dirección principal (http://localhost:3000) abre el inicio de sesión
app.get('/', (req, res) => res.redirect('/index.html'));

// Sirve las páginas del frontend (index.html, panel.html, etc.)
app.use(express.static(path.join(__dirname, '../frontend')));

// Todas las rutas de la API empiezan por /api
app.use('/api', rutas);

// Revisa que la base de datos sea la versión actual (contraseñas cifradas).
// Si es la versión vieja, el login no funcionaría.
async function revisarBaseDeDatos() {
    const [columnas] = await db.query("SHOW COLUMNS FROM citas LIKE 'precio'");
    const [chat] = await db.query("SHOW TABLES LIKE 'mensajes'");
    const [usuarios] = await db.query('SELECT password FROM usuarios LIMIT 1');
    const cifradas = usuarios.length === 0 || usuarios[0].password.startsWith('$2');
    if (columnas.length === 0 || chat.length === 0 || !cifradas) {
        console.error('ATENCION: la base de datos es la version vieja.');
        console.error('Ejecuta INSTALAR_BASE_DE_DATOS.bat y vuelve a iniciar el servidor.');
    }
}

// Antes de arrancar, se comprueba que MySQL responda
db.query('SELECT 1')
    .then(revisarBaseDeDatos)
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
