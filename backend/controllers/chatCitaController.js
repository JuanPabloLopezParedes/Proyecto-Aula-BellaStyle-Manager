// Controlador del chat de una cita: la clienta y su estilista se escriben.
// Se puede escribir mientras la cita esté Pendiente o Confirmada;
// cuando se finaliza o se cancela, el chat queda solo para leer.
const citaModel = require('../models/citaModel');
const mensajeCitaModel = require('../models/mensajeCitaModel');

const MAX_TEXTO = 500;
const ROLES_CHAT = ['Clienta', 'Estilista'];

function errorServidor(res, err) {
    console.error('Error en el chat de la cita:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo procesar el mensaje.' });
}

function chatAbierto(estado) {
    return estado === 'Pendiente' || estado === 'Confirmada';
}

// Busca la cita y comprueba que quien pide sea su clienta o su estilista.
// Si algo falla responde el error y devuelve null.
async function citaDelParticipante(req, res, rol, idUsuario) {
    if (!ROLES_CHAT.includes(rol) || !idUsuario) {
        res.status(400).json({ success: false, message: 'Faltan los datos de quien escribe.' });
        return null;
    }
    const cita = await citaModel.buscarParticipantes(req.params.id);
    if (!cita) {
        res.status(404).json({ success: false, message: 'La cita no existe.' });
        return null;
    }
    const idDelParticipante = rol === 'Clienta' ? cita.id_usuario_clienta : cita.id_usuario_estilista;
    if (String(idDelParticipante) !== String(idUsuario)) {
        res.status(403).json({ success: false, message: 'Este chat no te pertenece.' });
        return null;
    }
    return cita;
}

// GET /api/citas/:id/mensajes?rol=Clienta&idUsuario=5&desde=10
// Devuelve los datos de la cita y los mensajes nuevos. Al abrirlo,
// los mensajes de la otra persona quedan leídos.
async function verMensajes(req, res) {
    const { rol, idUsuario } = req.query;
    try {
        const cita = await citaDelParticipante(req, res, rol, idUsuario);
        if (!cita) return;
        await mensajeCitaModel.marcarLeidos(cita.id_cita, rol === 'Clienta' ? 'Estilista' : 'Clienta');
        const mensajes = await mensajeCitaModel.mensajesDesde(cita.id_cita, Number(req.query.desde) || 0);
        res.json({
            success: true,
            data: {
                cita: {
                    id: cita.id_cita, servicio: cita.servicio, fecha: cita.fecha, hora: cita.hora,
                    estado: cita.estado, cliente: cita.cliente, estilista: cita.estilista,
                    abierto: chatAbierto(cita.estado)
                },
                mensajes
            }
        });
    } catch (err) { errorServidor(res, err); }
}

// POST /api/citas/:id/mensajes   Recibe: { rol, idUsuario, texto }
async function enviar(req, res) {
    const { rol, idUsuario } = req.body;
    const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';
    if (texto === '') return res.status(400).json({ success: false, message: 'Escribe un mensaje.' });
    if (texto.length > MAX_TEXTO) {
        return res.status(400).json({ success: false, message: `El mensaje puede tener máximo ${MAX_TEXTO} caracteres.` });
    }
    try {
        const cita = await citaDelParticipante(req, res, rol, idUsuario);
        if (!cita) return;
        if (!chatAbierto(cita.estado)) {
            return res.status(409).json({ success: false, message: `El chat está cerrado porque la cita quedó ${cita.estado.toLowerCase()}.` });
        }
        await mensajeCitaModel.agregar(cita.id_cita, rol, texto);
        res.status(201).json({ success: true });
    } catch (err) { errorServidor(res, err); }
}

module.exports = { verMensajes, enviar };
