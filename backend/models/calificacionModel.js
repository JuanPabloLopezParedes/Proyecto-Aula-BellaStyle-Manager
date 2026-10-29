// Modelo de la tabla calificaciones (estrellas que deja la clienta después de su cita)
const db = require('../config/db');

async function crear({ idCita, estrellas, comentario }) {
    const [resultado] = await db.query(
        'INSERT INTO calificaciones (id_cita, estrellas, comentario) VALUES (?, ?, ?)',
        [idCita, estrellas, comentario || null]
    );
    return resultado.insertId;
}

async function buscarPorCita(idCita) {
    const [filas] = await db.query('SELECT * FROM calificaciones WHERE id_cita = ?', [idCita]);
    return filas[0] || null;
}

// Opiniones que ha recibido una estilista, la más reciente primero
async function listarPorEstilista(idEstilista) {
    const [filas] = await db.query(`
        SELECT cal.estrellas, cal.comentario,
               DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
               s.nombre AS servicio,
               CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente
        FROM calificaciones cal
        JOIN citas c ON c.id_cita = cal.id_cita
        JOIN servicios s ON s.id_servicio = c.id_servicio
        JOIN clientas cl ON cl.id_clienta = c.id_cliente
        WHERE c.id_estilista = ?
        ORDER BY cal.creado_en DESC`, [idEstilista]);
    return filas;
}

module.exports = { crear, buscarPorCita, listarPorEstilista };
