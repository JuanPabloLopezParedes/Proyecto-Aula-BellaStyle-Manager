// Modelo de la tabla citas
const db = require('../config/db');

// Consulta base: une la cita con clienta, estilista y servicio
const SELECT_CITAS = `
    SELECT c.id_cita AS id,
           CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente,
           CONCAT(e.nombres, ' ', e.apellidos) AS estilista,
           s.nombre AS servicio,
           c.precio,
           DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
           TIME_FORMAT(c.hora, '%H:%i') AS hora,
           c.estado,
           c.observaciones
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

// Datos de una cita con la duración de su servicio (para reprogramar)
async function buscarPorId(idCita) {
    const [filas] = await db.query(`
        SELECT c.id_cita, c.id_cliente, c.id_estilista, c.id_servicio, c.estado,
               cl.id_usuario AS id_usuario_clienta, s.duracion_min
        FROM citas c
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cita = ?`, [idCita]);
    return filas[0] || null;
}

// Citas activas de una estilista en un día, con la duración de cada servicio.
// Sirve para saber si un horario nuevo se cruza con otro.
// excluirId: al reprogramar, la propia cita no cuenta como cruce.
async function ocupadasDelDia(idEstilista, fecha, excluirId = 0) {
    const [filas] = await db.query(`
        SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora, s.duracion_min
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_estilista = ? AND c.fecha = ? AND c.estado <> 'Cancelada' AND c.id_cita <> ?`,
        [idEstilista, fecha, excluirId]);
    return filas;
}

// Citas activas de una clienta en un día (para que no agende dos a la misma hora)
async function ocupadasClientaDelDia(idClienta, fecha, excluirId = 0) {
    const [filas] = await db.query(`
        SELECT TIME_FORMAT(c.hora, '%H:%i') AS hora, s.duracion_min
        FROM citas c
        JOIN servicios s ON s.id_servicio = c.id_servicio
        WHERE c.id_cliente = ? AND c.fecha = ? AND c.estado <> 'Cancelada' AND c.id_cita <> ?`,
        [idClienta, fecha, excluirId]);
    return filas;
}

// Se guarda el precio del momento: si luego cambia el precio del servicio,
// las citas anteriores (ingresos y comisiones) no se alteran.
async function crear({ idClienta, idEstilista, idServicio, fecha, hora, precio, observaciones }) {
    const [resultado] = await db.query(
        `INSERT INTO citas (id_cliente, id_estilista, id_servicio, fecha, hora, precio, observaciones, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')`,
        [idClienta, idEstilista, idServicio, fecha, hora, precio, observaciones || null]
    );
    return resultado.insertId;
}

async function cambiarEstado(idCita, estado) {
    const [resultado] = await db.query('UPDATE citas SET estado = ? WHERE id_cita = ?', [estado, idCita]);
    return resultado.affectedRows > 0;
}

// Cambia fecha y hora. La cita vuelve a Pendiente para que el salón la confirme otra vez.
async function reprogramar(idCita, fecha, hora) {
    await db.query("UPDATE citas SET fecha = ?, hora = ?, estado = 'Pendiente' WHERE id_cita = ?", [fecha, hora, idCita]);
}

module.exports = {
    listarTodas, listarPorEstilista, listarPorClienta, buscarPorId,
    ocupadasDelDia, ocupadasClientaDelDia, crear, cambiarEstado, reprogramar
};
