// Modelo de las tablas estilistas y estilista_servicios
const db = require('../config/db');

async function crear(conexion, { idUsuario, nombres, apellidos, especialidad }) {
    const [resultado] = await conexion.query(
        'INSERT INTO estilistas (id_usuario, nombres, apellidos, especialidad) VALUES (?, ?, ?, ?)',
        [idUsuario, nombres, apellidos, especialidad]
    );
    return resultado.insertId;
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

async function listarActivas() {
    const [filas] = await db.query(`${SELECT_ESTILISTAS} WHERE e.estado = 'Activo' GROUP BY e.id_estilista ORDER BY e.nombres`);
    return filas;
}

// Todas, incluso las inactivas (para la administradora)
async function listarTodas() {
    const [filas] = await db.query(`${SELECT_ESTILISTAS} GROUP BY e.id_estilista ORDER BY e.nombres`);
    return filas;
}

// Perfil de la estilista que tiene esa cuenta de usuario
async function buscarPorUsuario(idUsuario) {
    const [filas] = await db.query(`${SELECT_ESTILISTAS} WHERE e.id_usuario = ? GROUP BY e.id_estilista`, [idUsuario]);
    return filas[0] || null;
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

// Reemplaza los servicios de la estilista: borra los anteriores y guarda los nuevos
async function reemplazarServicios(conexion, idEstilista, idsServicios) {
    await conexion.query('DELETE FROM estilista_servicios WHERE id_estilista = ?', [idEstilista]);
    await asignarServicios(conexion, idEstilista, idsServicios);
}

module.exports = {
    crear, asignarServicios, listarActivas, listarTodas, buscarPorUsuario,
    capacitadasPara, cambiarEstado, reemplazarServicios
};
