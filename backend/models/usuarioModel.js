// Modelo de la tabla usuarios (cuentas para iniciar sesión)
const db = require('../config/db');

async function buscarPorUsername(username) {
    const [filas] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    return filas[0] || null;
}

// conexion: se recibe para poder usarlo dentro de una transacción
async function crear(conexion, { nombre, username, passwordHash, rol, foto }) {
    const [resultado] = await conexion.query(
        'INSERT INTO usuarios (nombre, username, password, rol, foto) VALUES (?, ?, ?, ?, ?)',
        [nombre, username, passwordHash, rol, foto]
    );
    return resultado.insertId;
}

async function actualizarPassword(username, passwordHash) {
    await db.query('UPDATE usuarios SET password = ? WHERE username = ?', [passwordHash, username]);
}

module.exports = { buscarPorUsername, crear, actualizarPassword };
