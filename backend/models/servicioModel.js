// Modelo de la tabla servicios (con foto principal y lista de ejemplos con sus fotos)
const db = require('../config/db');

function normalizarFilaServicio(fila) {
    if (!fila) return null;
    let ejemplos = fila.ejemplos;
    if (typeof ejemplos === 'string' && ejemplos.trim()) {
        try {
            ejemplos = JSON.parse(ejemplos);
        } catch (_) {
            ejemplos = null;
        }
    }
    return {
        ...fila,
        ejemplos: Array.isArray(ejemplos) ? ejemplos : null
    };
}

async function listarDisponibles() {
    const [filas] = await db.query("SELECT * FROM servicios WHERE estado = 'Disponible' ORDER BY nombre");
    return filas.map(normalizarFilaServicio);
}

// Todos, incluso los no disponibles (para la administradora)
async function listarTodos() {
    const [filas] = await db.query('SELECT * FROM servicios ORDER BY nombre');
    return filas.map(normalizarFilaServicio);
}

async function buscarPorId(idServicio) {
    const [filas] = await db.query('SELECT * FROM servicios WHERE id_servicio = ?', [idServicio]);
    return normalizarFilaServicio(filas[0] || null);
}

async function crear({ nombre, precio, duracion, imagen, subtitulo, ejemplos }) {
    const ejemplosJson = Array.isArray(ejemplos) ? JSON.stringify(ejemplos) : (ejemplos || null);
    const [resultado] = await db.query(
        'INSERT INTO servicios (nombre, precio, duracion_min, imagen, subtitulo, ejemplos) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, precio, duracion, imagen || null, subtitulo || null, ejemplosJson]
    );
    return resultado.insertId;
}

async function actualizar(idServicio, { nombre, precio, duracion, imagen, subtitulo, ejemplos }) {
    const ejemplosJson = Array.isArray(ejemplos) ? JSON.stringify(ejemplos) : (ejemplos || null);
    const [resultado] = await db.query(
        'UPDATE servicios SET nombre = ?, precio = ?, duracion_min = ?, imagen = ?, subtitulo = ?, ejemplos = ? WHERE id_servicio = ?',
        [nombre, precio, duracion, imagen || null, subtitulo || null, ejemplosJson, idServicio]
    );
    return resultado.affectedRows > 0;
}

async function cambiarEstado(idServicio, estado) {
    const [resultado] = await db.query('UPDATE servicios SET estado = ? WHERE id_servicio = ?', [estado, idServicio]);
    return resultado.affectedRows > 0;
}

module.exports = { listarDisponibles, listarTodos, buscarPorId, crear, actualizar, cambiarEstado };
