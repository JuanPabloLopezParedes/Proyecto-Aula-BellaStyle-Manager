// Modelo de la tabla citas
const db = require('../config/db');

// Consulta base: une la cita con clienta, estilista y servicio (incluye ficha técnica, producto adicional y calificación)
const SELECT_CITAS = `
    SELECT c.id_cita AS id,
           c.id_cliente,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
           cl.email AS cliente_email,
           cl.telefono AS cliente_telefono,
           cl.ficha_tecnica,
           CONCAT(e.nombres, ' ', e.apellidos) AS estilista,
           s.nombre AS servicio,
           COALESCE(c.duracion_min, s.duracion_min) AS duracion_min,
           c.precio,
           c.producto_adicional,
           c.precio_producto,
           DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
           TIME_FORMAT(c.hora, '%H:%i') AS hora,
           c.estado,
           c.observaciones,
           c.calificacion,
           c.comentario_calificacion
    FROM citas c
    JOIN clientas cl ON cl.id_clienta = c.id_cliente
    JOIN estilistas e ON e.id_estilista = c.id_estilista
    JOIN servicios s ON s.id_servicio = c.id_servicio`;

const ORDEN = 'ORDER BY c.fecha DESC, c.hora DESC';

async function listarTodas() {
    const [filas] = await db.query(`${SELECT_CITAS} ${ORDEN}`);
    return filas;
}

// Citas de la estilista que tiene esa cuenta de usuario
async function listarPorEstilista(idUsuario) {
    const [filas] = await db.query(`${SELECT_CITAS} WHERE e.id_usuario = ? ${ORDEN}`, [idUsuario]);
    return filas;
}

// Citas de la clienta que tiene esa cuenta de usuario
async function listarPorClienta(idUsuario) {
    const [filas] = await db.query(`${SELECT_CITAS} WHERE cl.id_usuario = ? ${ORDEN}`, [idUsuario]);
    return filas;
}

// Datos de una cita con la duración de su servicio (para reprogramar o calificar)
async function buscarPorId(idCita) {
    const [filas] = await db.query(`
        SELECT c.id_cita, c.id_cliente, c.id_estilista, c.id_servicio, c.estado,
               cl.id_usuario AS id_usuario_clienta,
               COALESCE(c.duracion_min, s.duracion_min) AS duracion_min
        FROM citas c
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cita = ?`, [idCita]);
    return filas[0] || null;
}

// Citas activas de una estilista en un día, con la duración real de cada cita.
async function ocupadasDelDia(idEstilista, fecha, excluirId = 0) {
    const [filas] = await db.query(`
        SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora,
               COALESCE(c.duracion_min, s.duracion_min) AS duracion_min
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado <> 'Cancelada' AND c.id_cita <> ?`,
        [idEstilista, fecha, excluirId]);
    return filas;
}

// Citas activas de una clienta en un día (para que no agende dos a la misma hora)
async function ocupadasClientaDelDia(idClienta, fecha, excluirId = 0) {
    const [filas] = await db.query(`
        SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora,
               COALESCE(c.duracion_min, s.duracion_min) AS duracion_min
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cliente = ? AND c.fecha = ? AND c.estado <> 'Cancelada' AND c.id_cita <> ?`,
        [idClienta, fecha, excluirId]);
    return filas;
}

// Crea una cita guardando duración exacta, precio total y producto adicional (si aplica)
async function crear({ idClienta, idEstilista, idServicio, fecha, hora, duracionMin, precio, productoAdicional, precioProducto, observaciones }) {
    const [resultado] = await db.query(
        `INSERT INTO citas (id_cliente, id_estilista, id_servicio, fecha, hora, duracion_min, precio, producto_adicional, precio_producto, observaciones, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
        [
            idClienta,
            idEstilista,
            idServicio,
            fecha,
            hora,
            duracionMin || 60,
            precio,
            productoAdicional || null,
            precioProducto || 0,
            observaciones || null
        ]
    );
    return resultado.insertId;
}

async function cambiarEstado(idCita, estado) {
    const [resultado] = await db.query('UPDATE citas SET estado = ? WHERE id_cita = ?', [estado, idCita]);
    return resultado.affectedRows > 0;
}

// Guarda la calificación (1 a 5 estrellas) y reseña de una cita finalizada
async function calificar(idCita, calificacion, comentario) {
    const [resultado] = await db.query(
        'UPDATE citas SET calificacion = ?, comentario_calificacion = ? WHERE id_cita = ?',
        [calificacion, comentario || null, idCita]
    );
    return resultado.affectedRows > 0;
}

// Cambia fecha y hora. La cita vuelve a Pendiente para que el salón la confirme otra vez.
async function reprogramar(idCita, fecha, hora) {
    await db.query("UPDATE citas SET fecha = ?, hora = ?, estado = 'Pendiente' WHERE id_cita = ?", [fecha, hora, idCita]);
}

module.exports = {
    listarTodas, listarPorEstilista, listarPorClienta, buscarPorId,
    ocupadasDelDia, ocupadasClientaDelDia, crear, cambiarEstado, calificar, reprogramar
};
