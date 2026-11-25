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

async function descontarStock(idProducto, cantidad = 1) {
    const cant = Math.max(1, Number(cantidad) || 1);
    const [resultado] = await db.query(
        'UPDATE productos SET stock = GREATEST(0, stock - ?) WHERE id_producto = ? AND stock >= ?',
        [cant, idProducto, cant]
    );
    return resultado.affectedRows > 0;
}

async function cambiarEstado(idProducto, estado) {
    const [resultado] = await db.query('UPDATE productos SET estado = ? WHERE id_producto = ?', [estado, idProducto]);
    return resultado.affectedRows > 0;
}

async function registrarCompra({ idUsuario, clienteNombre, idProducto, productoNombre, imagen, cantidad, precioUnitario, total, metodoPago, referenciaPago, fecha }) {
    const [resultado] = await db.query(
        'INSERT INTO compras_productos (id_usuario, cliente_nombre, id_producto, producto_nombre, imagen, cantidad, precio_unitario, total, metodo_pago, referencia_pago, fecha, hora) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TIME_FORMAT(NOW(), "%H:%i"))',
        [idUsuario || null, clienteNombre || 'Clienta BellaStyle', idProducto, productoNombre, imagen || null, cantidad, precioUnitario, total, metodoPago, referenciaPago, fecha]
    );
    return resultado.insertId;
}

async function listarComprasPorUsuario(idUsuario) {
    const [filas] = await db.query('SELECT * FROM compras_productos WHERE id_usuario = ? ORDER BY id_compra DESC', [idUsuario]);
    return filas;
}

async function listarTodasLasCompras() {
    const [filas] = await db.query('SELECT * FROM compras_productos ORDER BY id_compra DESC');
    return filas;
}

async function calificarCompra(idCompra, calificacion, comentario) {
    const [resultado] = await db.query(
        'UPDATE compras_productos SET calificacion = ?, comentario_calificacion = ?, fecha_calificacion = ? WHERE id_compra = ?',
        [calificacion, comentario || null, Date.now(), idCompra]
    );
    return resultado.affectedRows > 0;
}

module.exports = {
    listarActivos, listarTodos, buscarPorId, crear, actualizar, descontarStock, cambiarEstado,
    registrarCompra, listarComprasPorUsuario, listarTodasLasCompras, calificarCompra
};
