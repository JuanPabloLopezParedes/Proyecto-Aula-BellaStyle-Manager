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

async function listarAdministradoras() {
    const [filas] = await db.query("SELECT id_usuario, nombre, username, rol, foto, puede_crear_admins FROM usuarios WHERE rol = 'Administradora' ORDER BY id_usuario");
    return filas.map((u) => ({
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        username: u.username,
        rol: u.rol,
        foto: u.foto,
        puede_crear_admins: Boolean(Number(u.puede_crear_admins)) || u.username === 'admin'
    }));
}

async function cambiarPermisoAdmin(idUsuario, puedeCrearAdmins) {
    const [resultado] = await db.query(
        "UPDATE usuarios SET puede_crear_admins = ? WHERE id_usuario = ? AND rol = 'Administradora'",
        [puedeCrearAdmins ? 1 : 0, idUsuario]
    );
    return resultado.affectedRows > 0;
}

module.exports = { buscarPorUsername, buscarPorId, crear, actualizarPassword, listarAdministradoras, cambiarPermisoAdmin };
