// Modelo de la tabla productos (incluye foto obligatoria, categoría y descripción)
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

async function buscarPorId(idProducto) {
    const [filas] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [idProducto]);
    return filas[0] || null;
}

async function crear({ nombre, precio, stock, imagen, categoria, descripcion }) {
    const [resultado] = await db.query(
        'INSERT INTO productos (nombre, precio, stock, imagen, categoria, descripcion) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, precio, stock, imagen || null, categoria || null, descripcion || null]
    );
    return resultado.insertId;
}

async function actualizar(idProducto, { nombre, precio, stock, imagen, categoria, descripcion }) {
    const [resultado] = await db.query(
        'UPDATE productos SET nombre = ?, precio = ?, stock = ?, imagen = ?, categoria = ?, descripcion = ? WHERE id_producto = ?',
        [nombre, precio, stock, imagen || null, categoria || null, descripcion || null, idProducto]
    );
    return resultado.affectedRows > 0;
}

async function descontarStock(idProducto) {
    const [resultado] = await db.query('UPDATE productos SET stock = stock - 1 WHERE id_producto = ?', [idProducto]);
    return resultado.affectedRows > 0;
}

async function cambiarEstado(idProducto, estado) {
    const [resultado] = await db.query('UPDATE productos SET estado = ? WHERE id_producto = ?', [estado, idProducto]);
    return resultado.affectedRows > 0;
}

module.exports = { listarActivos, listarTodos, buscarPorId, crear, actualizar, descontarStock, cambiarEstado };
