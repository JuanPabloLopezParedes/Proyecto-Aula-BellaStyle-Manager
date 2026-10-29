// Modelo de las tablas horarios (días y horas de trabajo) y ausencias (vacaciones, permisos)
const db = require('../config/db');

// --- Horarios ---

// Horario semanal de una estilista, de lunes a sábado
async function obtenerHorario(idEstilista) {
    const [filas] = await db.query(
        `SELECT dia_semana, TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
         FROM horarios WHERE id_estilista = ? ORDER BY dia_semana`,
        [idEstilista]
    );
    return filas;
}

// Horario de un solo día, o null si ese día no trabaja
async function horarioDelDia(idEstilista, diaSemana) {
    const [filas] = await db.query(
        `SELECT TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
         FROM horarios WHERE id_estilista = ? AND dia_semana = ?`,
        [idEstilista, diaSemana]
    );
    return filas[0] || null;
}

// Reemplaza el horario completo (se usa dentro de una transacción).
// dias: [{ dia: 1, inicio: '08:00', fin: '19:00' }, ...]
async function reemplazarHorario(conexion, idEstilista, dias) {
    await conexion.query('DELETE FROM horarios WHERE id_estilista = ?', [idEstilista]);
    for (const d of dias) {
        await conexion.query(
            'INSERT INTO horarios (id_estilista, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)',
            [idEstilista, d.dia, d.inicio, d.fin]
        );
    }
}

// Horario de una estilista nueva: lunes a sábado, de 8:00 a 19:00
async function crearPorDefecto(conexion, idEstilista) {
    const dias = [1, 2, 3, 4, 5, 6].map((dia) => ({ dia, inicio: '08:00', fin: '19:00' }));
    await reemplazarHorario(conexion, idEstilista, dias);
}

// --- Ausencias ---

async function listarAusencias(idEstilista) {
    const [filas] = await db.query(
        `SELECT id_ausencia, DATE_FORMAT(fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
                DATE_FORMAT(fecha_fin, '%Y-%m-%d') AS fecha_fin, motivo
         FROM ausencias WHERE id_estilista = ? ORDER BY fecha_inicio DESC`,
        [idEstilista]
    );
    return filas;
}

// ¿La estilista está ausente ese día?
async function ausenteEn(idEstilista, fecha) {
    const [filas] = await db.query(
        'SELECT COUNT(*) AS total FROM ausencias WHERE id_estilista = ? AND ? BETWEEN fecha_inicio AND fecha_fin',
        [idEstilista, fecha]
    );
    return filas[0].total > 0;
}

async function crearAusencia({ idEstilista, desde, hasta, motivo }) {
    const [resultado] = await db.query(
        'INSERT INTO ausencias (id_estilista, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?)',
        [idEstilista, desde, hasta, motivo || null]
    );
    return resultado.insertId;
}

// Citas activas (pendientes o confirmadas) de la estilista entre dos fechas
async function citasActivasEntre(idEstilista, desde, hasta) {
    const [filas] = await db.query(
        `SELECT COUNT(*) AS total FROM citas
         WHERE id_estilista = ? AND fecha BETWEEN ? AND ? AND estado IN ('Pendiente', 'Confirmada')`,
        [idEstilista, desde, hasta]
    );
    return filas[0].total;
}

async function eliminarAusencia(idAusencia) {
    const [resultado] = await db.query('DELETE FROM ausencias WHERE id_ausencia = ?', [idAusencia]);
    return resultado.affectedRows > 0;
}

module.exports = {
    obtenerHorario, horarioDelDia, reemplazarHorario, crearPorDefecto,
    listarAusencias, ausenteEn, crearAusencia, eliminarAusencia, citasActivasEntre
};
