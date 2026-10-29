// Controlador del chat de la página de inicio.
// El visitante escribe sin cuenta; la administradora responde desde su panel.
const crypto = require('crypto');
const chatModel = require('../models/chatModel');
const asistente = require('../utils/asistente');
const { nombreValido, telefonoValido, emailValido } = require('../utils/validators');

const MAX_TEXTO = 500;
const RE_CODIGO = /^[a-f0-9]{32}$/;

// Revisa el texto de un mensaje. Devuelve el error, o null si está bien.
function validarTexto(texto) {
    if (typeof texto !== 'string' || texto.trim() === '') return 'Escribe un mensaje.';
    if (texto.trim().length > MAX_TEXTO) return `El mensaje puede tener máximo ${MAX_TEXTO} caracteres.`;
    return null;
}

function errorServidor(res, err) {
    console.error('Error en el chat:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo procesar el mensaje.' });
}

// Busca la conversación del visitante por su código. Si no existe, responde 404.
async function conversacionDelVisitante(req, res) {
    const { codigo } = req.params;
    const conversacion = RE_CODIGO.test(codigo) ? await chatModel.buscarPorCodigo(codigo) : null;
    if (!conversacion) {
        res.status(404).json({ success: false, message: 'La conversación no existe.' });
    }
    return conversacion;
}

// ---------------------------------------------------------------
// VISITANTE (página de inicio, sin iniciar sesión)
// ---------------------------------------------------------------

// POST /api/chat   Recibe: { nombre, contacto (opcional) }
async function iniciar(req, res) {
    const { nombre, contacto } = req.body;
    if (!nombreValido(nombre) || nombre.trim().length > 60) {
        return res.status(400).json({ success: false, message: 'Escribe tu nombre (solo letras).' });
    }
    // El contacto es opcional; si lo escribe, debe ser un teléfono o un correo válido
    if (contacto && String(contacto).trim() !== '') {
        const texto = String(contacto).trim();
        if (texto.length > 120 || (!telefonoValido(texto) && !emailValido(texto))) {
            return res.status(400).json({ success: false, message: 'Escribe un teléfono (solo números) o un correo válido.' });
        }
    }
    try {
        // Código aleatorio que identifica al visitante sin pedirle cuenta
        const codigo = crypto.randomBytes(16).toString('hex');
        const primerNombre = nombre.trim().split(/\s+/)[0];
        const id = await chatModel.crearConversacion({ codigo, nombre: nombre.trim(), contacto: contacto && String(contacto).trim() });
        await chatModel.agregarMensaje(id, 'Asistente',
            `¡Hola, ${primerNombre}! Soy el asistente de BellaStyle. Puedo darte precios, horarios y explicarte cómo agendar. Si necesitas algo más, una asesora te responde por aquí.`);
        res.status(201).json({ success: true, data: { codigo } });
    } catch (err) {
        errorServidor(res, err);
    }
}

// GET /api/chat/:codigo?desde=10   Devuelve los mensajes nuevos (id mayor a "desde")
async function verMensajes(req, res) {
    try {
        const conversacion = await conversacionDelVisitante(req, res);
        if (!conversacion) return;
        const desde = Number(req.query.desde) || 0;
        const mensajes = await chatModel.mensajesDesde(conversacion.id_conversacion, desde);
        res.json({ success: true, data: { nombre: conversacion.nombre, mensajes } });
    } catch (err) {
        errorServidor(res, err);
    }
}

// POST /api/chat/:codigo/mensajes   Recibe: { texto }
async function enviarVisitante(req, res) {
    const error = validarTexto(req.body.texto);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const conversacion = await conversacionDelVisitante(req, res);
        if (!conversacion) return;
        const id = conversacion.id_conversacion;
        await chatModel.agregarMensaje(id, 'Visitante', req.body.texto.trim());

        // El asistente solo responde mientras el salón no haya entrado a la conversación
        if (!(await chatModel.salonYaRespondio(id))) {
            const respuesta = await asistente.responder(req.body.texto, await chatModel.ultimoDelAsistente(id));
            if (respuesta) await chatModel.agregarMensaje(id, 'Asistente', respuesta);
        }
        res.status(201).json({ success: true });
    } catch (err) {
        errorServidor(res, err);
    }
}

// ---------------------------------------------------------------
// ADMINISTRADORA (pestaña Mensajes del panel)
// ---------------------------------------------------------------

// GET /api/conversaciones
async function listar(req, res) {
    try {
        res.json({ success: true, data: await chatModel.listarConversaciones() });
    } catch (err) {
        errorServidor(res, err);
    }
}

// GET /api/conversaciones/:id/mensajes   Al abrirla, los mensajes quedan leídos
async function abrir(req, res) {
    try {
        const conversacion = await chatModel.buscarPorId(req.params.id);
        if (!conversacion) return res.status(404).json({ success: false, message: 'La conversación no existe.' });
        await chatModel.marcarLeidos(conversacion.id_conversacion);
        const mensajes = await chatModel.mensajesDesde(conversacion.id_conversacion, Number(req.query.desde) || 0);
        res.json({ success: true, data: { conversacion, mensajes } });
    } catch (err) {
        errorServidor(res, err);
    }
}

// POST /api/conversaciones/:id/responder   Recibe: { texto }
async function responder(req, res) {
    const error = validarTexto(req.body.texto);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const conversacion = await chatModel.buscarPorId(req.params.id);
        if (!conversacion) return res.status(404).json({ success: false, message: 'La conversación no existe.' });
        await chatModel.agregarMensaje(conversacion.id_conversacion, 'Salon', req.body.texto.trim());
        res.status(201).json({ success: true, message: 'Respuesta enviada.' });
    } catch (err) {
        errorServidor(res, err);
    }
}

// PUT /api/conversaciones/:id/estado   Recibe: { estado: 'Abierta' | 'Cerrada' }
async function cambiarEstado(req, res) {
    const { estado } = req.body;
    if (!['Abierta', 'Cerrada'].includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        const cambiado = await chatModel.cambiarEstado(req.params.id, estado);
        if (!cambiado) return res.status(404).json({ success: false, message: 'La conversación no existe.' });
        res.json({ success: true, message: `Conversación ${estado.toLowerCase()}.` });
    } catch (err) {
        errorServidor(res, err);
    }
}

module.exports = { iniciar, verMensajes, enviarVisitante, listar, abrir, responder, cambiarEstado };
