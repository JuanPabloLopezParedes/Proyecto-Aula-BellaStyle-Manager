// Crea la base de datos ejecutando init_db.sql con los datos de config/config.js.
// No necesita tener "mysql" en el PATH de Windows.
// Uso:  node instalar_bd.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config/config');

async function instalar() {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'init_db.sql'), 'utf8');

    // Se conecta sin elegir base, porque el script la crea
    const conexion = await mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl,
        multipleStatements: true
    });

    await conexion.query(sql);
    const [usuarios] = await conexion.query('SELECT username, rol FROM bellastylemanager.usuarios');
    await conexion.end();

    console.log('Base de datos creada correctamente. Usuarios de prueba:');
    usuarios.forEach((u) => console.log(`  - ${u.username} (${u.rol})`));
}

instalar().catch((err) => {
    console.error('No se pudo crear la base de datos:', err.message);
    console.error('Revisa usuario y contraseña de MySQL en backend/config/config.js');
    process.exit(1);
});
