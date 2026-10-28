// Modelo de la tabla clientas
const db = require('../config/db');

async function crear(conexion, { idUsuario, nombres, apellidos, telefono, email }) {
    const [resultado] = await conexion.query(
        'INSERT INTO clientas (id_usuario, nombres, apellidos, telefono, email) VALUES (?, ?, ?, ?, ?)',
        [idUsuario, nombres, apellidos, telefono || null, email || null]
    );
    return resultado.insertId;
}

async function buscarPorUsuario(idUsuario) {
    const [filas] = await db.query('SELECT * FROM clientas WHERE id_usuario = ?', [idUsuario]);
    return filas[0] || null;
}

async function listar() {
    const [filas] = await db.query('SELECT * FROM clientas ORDER BY nombres');
    return filas;
}

async function actualizar(idClienta, { nombres, apellidos, telefono, email }) {
    const [resultado] = await db.query(
        'UPDATE clientas SET nombres = ?, apellidos = ?, telefono = ?, email = ? WHERE id_clienta = ?',
        [nombres, apellidos, telefono || null, email || null, idClienta]
    );
    return resultado.affectedRows > 0;
}

module.exports = { crear, buscarPorUsuario, listar, actualizar };
