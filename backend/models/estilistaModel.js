// Modelo de las tablas estilistas, estilista_servicios y horarios_estilista
const db = require('../config/db');

// Horario por defecto si una estilista aún no tiene filas en horarios_estilista
function horarioPorDefecto() {
    return [1, 2, 3, 4, 5, 6].map((dia) => ({
        dia_semana: dia,
        trabaja: true,
        hora_inicio: '08:00',
        hora_fin: '19:00'
    }));
}

async function crear(conexion, { idUsuario, nombres, apellidos, especialidad }) {
    const [resultado] = await conexion.query(
        'INSERT INTO estilistas (id_usuario, nombres, apellidos, especialidad) VALUES (?, ?, ?, ?)',
        [idUsuario, nombres, apellidos, especialidad]
    );
    const idEstilista = resultado.insertId;
    // Crea su horario semanal inicial (Lunes a Sábado 08:00 - 19:00)
    for (let dia = 1; dia <= 6; dia++) {
        await conexion.query(
            'INSERT INTO horarios_estilista (id_estilista, dia_semana, trabaja, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?)',
            [idEstilista, dia, true, '08:00:00', '19:00:00']
        );
    }
    return idEstilista;
}

// Guarda qué servicios sabe hacer la estilista
async function asignarServicios(conexion, idEstilista, idsServicios) {
    for (const idServicio of idsServicios) {
        await conexion.query(
            'INSERT INTO estilista_servicios (id_estilista, id_servicio) VALUES (?, ?)',
            [idEstilista, idServicio]
        );
    }
}

// Consulta base: la estilista con la lista de servicios que realiza
const SELECT_ESTILISTAS = `
    SELECT e.id_estilista, e.id_usuario, e.nombres, e.apellidos, e.especialidad, e.estado,
           GROUP_CONCAT(s.nombre ORDER BY s.nombre SEPARATOR ', ') AS servicios,
           GROUP_CONCAT(s.id_servicio) AS ids_servicios
    FROM estilistas e
    LEFT JOIN estilista_servicios es ON es.id_estilista = e.id_estilista
    LEFT JOIN servicios s ON s.id_servicio = es.id_servicio`;

// Adjunta el arreglo "horarios" a cada estilista consultada
async function adjuntarHorarios(filas) {
    if (!filas || filas.length === 0) return filas;
    const [todosHorarios] = await db.query(
        `SELECT id_estilista, dia_semana, trabaja,
                TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
                TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
         FROM horarios_estilista
         ORDER BY dia_semana`
    );

    const mapa = new Map();
    for (const h of todosHorarios) {
        const id = Number(h.id_estilista);
        if (!mapa.has(id)) mapa.set(id, []);
        mapa.get(id).push({
            dia_semana: Number(h.dia_semana),
            trabaja: Boolean(h.trabaja),
            hora_inicio: String(h.hora_inicio).slice(0, 5),
            hora_fin: String(h.hora_fin).slice(0, 5)
        });
    }

    return filas.map((e) => ({
        ...e,
        horarios: mapa.get(Number(e.id_estilista)) || horarioPorDefecto()
    }));
}

async function listarActivas() {
    const [filas] = await db.query(`${SELECT_ESTILISTAS} WHERE e.estado = 'Activo' GROUP BY e.id_estilista ORDER BY e.nombres`);
    return adjuntarHorarios(filas);
}

// Todas, incluso las inactivas (para la administradora)
async function listarTodas() {
    const [filas] = await db.query(`${SELECT_ESTILISTAS} GROUP BY e.id_estilista ORDER BY e.nombres`);
    return adjuntarHorarios(filas);
}

// Perfil de la estilista que tiene esa cuenta de usuario (con su horario personal)
async function buscarPorUsuario(idUsuario) {
    const [filas] = await db.query(`${SELECT_ESTILISTAS} WHERE e.id_usuario = ? GROUP BY e.id_estilista`, [idUsuario]);
    const conHorarios = await adjuntarHorarios(filas);
    return conHorarios[0] || null;
}

// Estilistas activas que saben hacer un servicio
async function capacitadasPara(idServicio) {
    const [filas] = await db.query(`
        SELECT e.id_estilista, CONCAT(e.nombres, ' ', e.apellidos) AS nombre
        FROM estilistas e
        JOIN estilista_servicios es ON es.id_estilista = e.id_estilista
        WHERE es.id_servicio = ? AND e.estado = 'Activo'`, [idServicio]);
    return filas;
}

async function cambiarEstado(idEstilista, estado) {
    const [resultado] = await db.query('UPDATE estilistas SET estado = ? WHERE id_estilista = ?', [estado, idEstilista]);
    return resultado.affectedRows > 0;
}

async function cambiarEspecialidad(idEstilista, especialidad) {
    const [resultado] = await db.query('UPDATE estilistas SET especialidad = ? WHERE id_estilista = ?', [especialidad, idEstilista]);
    return resultado.affectedRows > 0;
}

// Reemplaza los servicios de la estilista: borra los anteriores y guarda los nuevos
async function reemplazarServicios(conexion, idEstilista, idsServicios) {
    await conexion.query('DELETE FROM estilista_servicios WHERE id_estilista = ?', [idEstilista]);
    await asignarServicios(conexion, idEstilista, idsServicios);
}

// Obtiene el horario semanal de una estilista específica
async function obtenerHorario(idEstilista) {
    const [filas] = await db.query(
        `SELECT dia_semana, trabaja,
                TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
                TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
         FROM horarios_estilista
         WHERE id_estilista = ?
         ORDER BY dia_semana`,
        [idEstilista]
    );
    if (!filas || filas.length === 0) return horarioPorDefecto();
    return filas.map((h) => ({
        dia_semana: Number(h.dia_semana),
        trabaja: Boolean(h.trabaja),
        hora_inicio: String(h.hora_inicio).slice(0, 5),
        hora_fin: String(h.hora_fin).slice(0, 5)
    }));
}

// Obtiene el turno de una estilista en un día concreto (1=Lunes ... 6=Sábado)
async function obtenerTurnoDia(idEstilista, diaSemana) {
    const [filas] = await db.query(
        `SELECT dia_semana, trabaja,
                TIME_FORMAT(hora_inicio, '%H:%i') AS hora_inicio,
                TIME_FORMAT(hora_fin, '%H:%i') AS hora_fin
         FROM horarios_estilista
         WHERE id_estilista = ? AND dia_semana = ?`,
        [idEstilista, diaSemana]
    );
    if (!filas || filas.length === 0) {
        return { dia_semana: diaSemana, trabaja: true, hora_inicio: '08:00', hora_fin: '19:00' };
    }
    const f = filas[0];
    return {
        dia_semana: Number(f.dia_semana),
        trabaja: Boolean(f.trabaja),
        hora_inicio: String(f.hora_inicio).slice(0, 5),
        hora_fin: String(f.hora_fin).slice(0, 5)
    };
}

// Guarda el horario semanal completo (días laborales, descansos y horas) de una estilista
async function reemplazarHorario(conexion, idEstilista, diasHorario) {
    await conexion.query('DELETE FROM horarios_estilista WHERE id_estilista = ?', [idEstilista]);
    for (const d of diasHorario) {
        await conexion.query(
            'INSERT INTO horarios_estilista (id_estilista, dia_semana, trabaja, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?)',
            [idEstilista, Number(d.dia_semana), Boolean(d.trabaja), d.hora_inicio + ':00', d.hora_fin + ':00']
        );
    }
}

module.exports = {
    crear, asignarServicios, listarActivas, listarTodas, buscarPorUsuario,
    capacitadasPara, cambiarEstado, cambiarEspecialidad, reemplazarServicios,
    obtenerHorario, obtenerTurnoDia, reemplazarHorario
};
