// Controlador de calificaciones: la clienta califica la atención de una cita finalizada
const citaModel = require('../models/citaModel');
const calificacionModel = require('../models/calificacionModel');

function errorServidor(res, err) {
    console.error('Error en calificaciones:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo guardar la calificación.' });
}

// POST /api/citas/:id/calificacion   Recibe: { idUsuario, estrellas (1 a 5), comentario (opcional) }
async function calificar(req, res) {
    const estrellas = Number(req.body.estrellas);
    const comentario = typeof req.body.comentario === 'string' ? req.body.comentario.trim() : '';

    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
        return res.status(400).json({ success: false, message: 'Escoge de 1 a 5 estrellas.' });
    }
    if (comentario.length > 300) {
        return res.status(400).json({ success: false, message: 'El comentario puede tener máximo 300 caracteres.' });
    }

    try {
        const cita = await citaModel.buscarParticipantes(req.params.id);
        if (!cita) {
            return res.status(404).json({ success: false, message: 'La cita no existe.' });
        }
        // Solo la clienta de la cita puede calificarla
        if (String(cita.id_usuario_clienta) !== String(req.body.idUsuario)) {
            return res.status(403).json({ success: false, message: 'Solo la clienta de la cita puede calificarla.' });
        }
        if (cita.estado !== 'Finalizada') {
            return res.status(400).json({ success: false, message: 'Solo se pueden calificar citas finalizadas.' });
        }
        if (await calificacionModel.buscarPorCita(cita.id_cita)) {
            return res.status(409).json({ success: false, message: 'Ya calificaste esta cita.' });
        }

        await calificacionModel.crear({ idCita: cita.id_cita, estrellas, comentario });
        res.status(201).json({ success: true, message: '¡Gracias por calificar la atención!' });
    } catch (err) { errorServidor(res, err); }
}

// GET /api/estilistas/:id/calificaciones   Opiniones que ha recibido una estilista
async function deEstilista(req, res) {
    try {
        res.json({ success: true, data: await calificacionModel.listarPorEstilista(req.params.id) });
    } catch (err) {
        console.error('Error en calificaciones:', err.message);
        res.status(500).json({ success: false, message: 'Error al consultar las calificaciones.' });
    }
}

module.exports = { calificar, deEstilista };
