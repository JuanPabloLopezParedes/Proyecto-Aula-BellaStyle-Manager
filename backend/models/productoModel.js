// Modelo de la tabla productos
const db = require('../config/db');

async function listarActivos() {
    const [filas] = await db.query("SELECT * FROM productos WHERE estado = 'Activo' ORDER BY nombre");
    return filas;
}

// Todos, incluso los inactivos (para la administradora)
async function listarTodos() {
    const [filas] = await db.query('SELECT * FROM productos ORDER BY nombre');
    return filas;
}

async function crear({ nombre, precio, stock }) {
    const [resultado] = await db.query(
        'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
        [nombre, precio, stock]
    );
    return resultado.insertId;
}

async function actualizar(idProducto, { nombre, precio, stock }) {
    const [resultado] = await db.query(
        'UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id_producto = ?',
        [nombre, precio, stock, idProducto]
    );
    return resultado.affectedRows > 0;
}

async function cambiarEstado(idProducto, estado) {
    const [resultado] = await db.query('UPDATE productos SET estado = ? WHERE id_producto = ?', [estado, idProducto]);
    return resultado.affectedRows > 0;
}

module.exports = { listarActivos, listarTodos, crear, actualizar, cambiarEstado };
