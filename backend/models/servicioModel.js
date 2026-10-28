// Modelo de la tabla servicios
const db = require('../config/db');

async function listarDisponibles() {
    const [filas] = await db.query("SELECT * FROM servicios WHERE estado = 'Disponible' ORDER BY nombre");
    return filas;
}

// Todos, incluso los no disponibles (para la administradora)
async function listarTodos() {
    const [filas] = await db.query('SELECT * FROM servicios ORDER BY nombre');
    return filas;
}

async function buscarPorId(idServicio) {
    const [filas] = await db.query('SELECT * FROM servicios WHERE id_servicio = ?', [idServicio]);
    return filas[0] || null;
}

async function crear({ nombre, precio, duracion }) {
    const [resultado] = await db.query(
        'INSERT INTO servicios (nombre, precio, duracion_min) VALUES (?, ?, ?)',
        [nombre, precio, duracion]
    );
    return resultado.insertId;
}

async function actualizar(idServicio, { nombre, precio, duracion }) {
    const [resultado] = await db.query(
        'UPDATE servicios SET nombre = ?, precio = ?, duracion_min = ? WHERE id_servicio = ?',
        [nombre, precio, duracion, idServicio]
    );
    return resultado.affectedRows > 0;
}

async function cambiarEstado(idServicio, estado) {
    const [resultado] = await db.query('UPDATE servicios SET estado = ? WHERE id_servicio = ?', [estado, idServicio]);
    return resultado.affectedRows > 0;
}

module.exports = { listarDisponibles, listarTodos, buscarPorId, crear, actualizar, cambiarEstado };
