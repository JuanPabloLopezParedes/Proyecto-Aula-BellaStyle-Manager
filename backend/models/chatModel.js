// Modelo del chat: tablas conversaciones y mensajes
const db = require('../config/db');

// --- Conversaciones ---

async function crearConversacion({ codigo, nombre, contacto }) {
    const [resultado] = await db.query(
        'INSERT INTO conversaciones (codigo, nombre, contacto) VALUES (?, ?, ?)',
        [codigo, nombre, contacto || null]
    );
    return resultado.insertId;
}

async function buscarPorCodigo(codigo) {
    const [filas] = await db.query('SELECT * FROM conversaciones WHERE codigo = ?', [codigo]);
    return filas[0] || null;
}

async function buscarPorId(idConversacion) {
    const [filas] = await db.query('SELECT * FROM conversaciones WHERE id_conversacion = ?', [idConversacion]);
    return filas[0] || null;
}

// Lista para la administradora: la más reciente primero, con el último
// mensaje y cuántos mensajes del visitante no ha leído.
async function listarConversaciones() {
    const [filas] = await db.query(`
        SELECT c.id_conversacion AS id, c.nombre, c.contacto, c.estado, c.actualizado_en,
               (SELECT m.texto FROM mensajes m WHERE m.id_conversacion = c.id_conversacion
                ORDER BY m.id_mensaje DESC LIMIT 1) AS ultimo,
               (SELECT COUNT(*) FROM mensajes m WHERE m.id_conversacion = c.id_conversacion
                AND m.autor = 'Visitante' AND m.leido = FALSE) AS sin_leer
        FROM conversaciones c
        ORDER BY c.actualizado_en DESC, c.id_conversacion DESC`);
    return filas;
}

async function cambiarEstado(idConversacion, estado) {
    const [resultado] = await db.query(
        'UPDATE conversaciones SET estado = ? WHERE id_conversacion = ?', [estado, idConversacion]
    );
    return resultado.affectedRows > 0;
}

// --- Mensajes ---

// Guarda un mensaje y deja la conversación abierta con la hora del último mensaje
async function agregarMensaje(idConversacion, autor, texto) {
    const [resultado] = await db.query(
        'INSERT INTO mensajes (id_conversacion, autor, texto) VALUES (?, ?, ?)',
        [idConversacion, autor, texto]
    );
    await db.query(
        "UPDATE conversaciones SET estado = 'Abierta', actualizado_en = NOW() WHERE id_conversacion = ?",
        [idConversacion]
    );
    return resultado.insertId;
}

// Mensajes con id mayor a "desde". Así el navegador solo pide los nuevos.
async function mensajesDesde(idConversacion, desde = 0) {
    const [filas] = await db.query(
        `SELECT id_mensaje AS id, autor, texto, DATE_FORMAT(creado_en, '%H:%i') AS hora
         FROM mensajes WHERE id_conversacion = ? AND id_mensaje > ? ORDER BY id_mensaje`,
        [idConversacion, desde]
    );
    return filas;
}

// La administradora abrió la conversación: los mensajes del visitante quedan leídos
async function marcarLeidos(idConversacion) {
    await db.query(
        "UPDATE mensajes SET leido = TRUE WHERE id_conversacion = ? AND autor = 'Visitante'",
        [idConversacion]
    );
}

// ¿El salón ya respondió en esta conversación?
async function salonYaRespondio(idConversacion) {
    const [filas] = await db.query(
        "SELECT COUNT(*) AS total FROM mensajes WHERE id_conversacion = ? AND autor = 'Salon'",
        [idConversacion]
    );
    return filas[0].total > 0;
}

// Último mensaje del asistente (para no repetir el mismo aviso dos veces seguidas)
async function ultimoDelAsistente(idConversacion) {
    const [filas] = await db.query(
        "SELECT texto FROM mensajes WHERE id_conversacion = ? AND autor = 'Asistente' ORDER BY id_mensaje DESC LIMIT 1",
        [idConversacion]
    );
    return filas[0] ? filas[0].texto : '';
}

module.exports = {
    crearConversacion, buscarPorCodigo, buscarPorId, listarConversaciones, cambiarEstado,
    agregarMensaje, mensajesDesde, marcarLeidos, salonYaRespondio, ultimoDelAsistente
};
