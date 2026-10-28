// Asistente del chat: responde solo las preguntas frecuentes.
// Busca palabras clave en el mensaje; si no entiende, avisa que
// una asesora (la administradora) responderá.
const servicioModel = require('../models/servicioModel');
const productoModel = require('../models/productoModel');

const AVISO_ASESORA = 'Gracias por escribirnos. Una asesora del salón te responderá por aquí en breve.';

function pesos(valor) {
    return '$' + Number(valor).toLocaleString('es-CO');
}

// "¿Cuánto CUESTA?" -> "cuanto cuesta" (minúsculas y sin tildes ni signos)
function normalizar(texto) {
    return texto.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9ñ ]/g, ' ');
}

// Cada regla tiene palabras clave y una función que arma la respuesta.
// Se revisan en orden: la primera que coincide responde.
const REGLAS = [
    {
        palabras: ['precio', 'precios', 'cuesta', 'cuestan', 'costo', 'valor', 'vale', 'cuanto', 'cotizacion', 'cotizar'],
        responder: async () => {
            const servicios = await servicioModel.listarDisponibles();
            const lista = servicios.map((s) => `• ${s.nombre}: ${pesos(s.precio)}`).join('\n');
            return `Estos son nuestros precios:\n${lista}\nSi necesitas una cotización especial, una asesora te responderá por aquí.`;
        }
    },
    {
        palabras: ['horario', 'horarios', 'abren', 'abierto', 'cierran', 'atienden'],
        responder: async () => 'Atendemos de lunes a sábado, de 8:00 a. m. a 7:00 p. m. Los domingos no abrimos.'
    },
    {
        palabras: ['cita', 'citas', 'agendar', 'agenda', 'reservar', 'reserva', 'turno', 'apartar'],
        responder: async () => 'Para agendar: crea tu cuenta en "Crear cuenta", entra a tu panel, escoge el servicio, la fecha y la hora y pulsa "Agendar". El sistema te asigna una estilista libre.'
    },
    {
        palabras: ['servicio', 'servicios', 'hacen', 'ofrecen', 'tratamientos'],
        responder: async () => {
            const servicios = await servicioModel.listarDisponibles();
            const lista = servicios.map((s) => `• ${s.nombre} (${s.duracion_min} min)`).join('\n');
            return `Ofrecemos estos servicios:\n${lista}\nSi buscas algo que no está en la lista, una asesora te responderá por aquí.`;
        }
    },
    {
        palabras: ['producto', 'productos', 'venden', 'shampoo', 'esmalte'],
        responder: async () => {
            const productos = await productoModel.listarActivos();
            const lista = productos.map((p) => `• ${p.nombre}: ${pesos(p.precio)}`).join('\n');
            return `Tenemos estos productos:\n${lista}`;
        }
    }
];

// Devuelve el texto de la respuesta, o null si no hay que responder nada.
// ultimoAviso: último mensaje del asistente, para no repetir el aviso.
async function responder(texto, ultimoAviso) {
    const palabras = normalizar(texto).split(/\s+/);
    for (const regla of REGLAS) {
        if (regla.palabras.some((p) => palabras.includes(p))) {
            return await regla.responder();
        }
    }
    // No entendió la pregunta: avisa una sola vez que responderá una persona
    return ultimoAviso === AVISO_ASESORA ? null : AVISO_ASESORA;
}

module.exports = { responder, AVISO_ASESORA };
