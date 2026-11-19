// Modelo de la tabla usuarios (cuentas para iniciar sesión)
const db = require('../config/db');

async function buscarPorUsername(username) {
    const [filas] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);
    return filas[0] || null;
}

async function buscarPorId(idUsuario) {
    const [filas] = await db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [idUsuario]);
    return filas[0] || null;
}

// conexion: se recibe para poder usarlo dentro de una transacción
// puedeCrearAdmins: solo aplica a Administradoras (permiso total o limitado)
async function crear(conexion, { nombre, username, passwordHash, rol, foto, puedeCrearAdmins = false }) {
    const [resultado] = await conexion.query(
        'INSERT INTO usuarios (nombre, username, password, rol, foto, puede_crear_admins) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, username, passwordHash, rol, foto, puedeCrearAdmins ? 1 : 0]
    );
    return resultado.insertId;
}

async function actualizarPassword(username, passwordHash) {
    await db.query('UPDATE usuarios SET password = ? WHERE username = ?', [passwordHash, username]);
}

module.exports = { buscarPorUsername, buscarPorId, crear, actualizarPassword };
