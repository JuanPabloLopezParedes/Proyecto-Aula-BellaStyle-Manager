// Controlador de horarios: días y horas de trabajo de cada estilista y sus ausencias.
// Lo usan la estilista (su propio horario) y la administradora (el de cualquiera).
const db = require('../config/db');
const horarioModel = require('../models/horarioModel');
const estilistaModel = require('../models/estilistaModel');
const { APERTURA, CIERRE, DIAS, aMinutos, ahoraColombia, fechaValida, horaValida } = require('../utils/agenda');

function errorServidor(res, err) {
    console.error('Error en horarios:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo guardar el cambio.' });
}

// Busca la estilista de la URL. Si no existe, responde 404 y devuelve null.
async function estilistaDeLaRuta(req, res) {
    const estilista = await estilistaModel.buscarPorId(req.params.id);
    if (!estilista) res.status(404).json({ success: false, message: 'La estilista no existe.' });
    return estilista;
}

// GET /api/estilistas/:id/horario   Devuelve { horario, ausencias }
async function obtener(req, res) {
    try {
        const estilista = await estilistaDeLaRuta(req, res);
        if (!estilista) return;
        res.json({
            success: true,
            data: {
                horario: await horarioModel.obtenerHorario(estilista.id_estilista),
                ausencias: await horarioModel.listarAusencias(estilista.id_estilista)
            }
        });
    } catch (err) { errorServidor(res, err); }
}

// Revisa la lista de días. Devuelve el mensaje de error, o null si está bien.
function validarDias(dias) {
    if (!Array.isArray(dias) || dias.length === 0) return 'Escoge al menos un día de trabajo.';
    const vistos = new Set();
    for (const d of dias) {
        const dia = Number(d.dia);
        if (!Number.isInteger(dia) || dia < 1 || dia > 6 || vistos.has(dia)) return 'Los días deben ser de lunes a sábado, sin repetir.';
        vistos.add(dia);
        if (!horaValida(d.inicio) || !horaValida(d.fin)) return `Revisa las horas del ${DIAS[dia].toLowerCase()}.`;
        const inicio = aMinutos(d.inicio);
        const fin = aMinutos(d.fin);
        if (inicio < APERTURA || fin > CIERRE) return `El ${DIAS[dia].toLowerCase()} debe estar entre 8:00 y 19:00.`;
        if (fin - inicio < 60) return `El ${DIAS[dia].toLowerCase()} debe tener al menos una hora de trabajo.`;
    }
    return null;
}

// PUT /api/estilistas/:id/horario   Recibe: { dias: [{ dia: 1, inicio: '08:00', fin: '19:00' }, ...] }
// Los días que no vienen en la lista son días libres.
async function guardar(req, res) {
    const error = validarDias(req.body.dias);
    if (error) return res.status(400).json({ success: false, message: error });

    let estilista;
    try {
        estilista = await estilistaDeLaRuta(req, res);
        if (!estilista) return;
    } catch (err) { return errorServidor(res, err); }

    // Transacción: se borra el horario anterior y se guarda el nuevo, todo o nada
    const dias = req.body.dias.map((d) => ({ dia: Number(d.dia), inicio: d.inicio, fin: d.fin }));
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        await horarioModel.reemplazarHorario(conexion, estilista.id_estilista, dias);
        await conexion.commit();
        res.json({ success: true, message: 'Horario guardado. Aplica para las citas nuevas.' });
    } catch (err) {
        await conexion.rollback();
        errorServidor(res, err);
    } finally {
        conexion.release();
    }
}

// POST /api/estilistas/:id/ausencias   Recibe: { desde, hasta, motivo }
async function crearAusencia(req, res) {
    const { desde, hasta } = req.body;
    const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim() : '';

    if (!fechaValida(desde) || !fechaValida(hasta)) {
        return res.status(400).json({ success: false, message: 'Escoge la fecha de inicio y la de fin.' });
    }
    if (hasta < desde) {
        return res.status(400).json({ success: false, message: 'La fecha final no puede ser antes de la inicial.' });
    }
    if (hasta < ahoraColombia().fecha) {
        return res.status(400).json({ success: false, message: 'La ausencia ya pasó.' });
    }
    if (motivo.length > 120) {
        return res.status(400).json({ success: false, message: 'El motivo puede tener máximo 120 caracteres.' });
    }

    try {
        const estilista = await estilistaDeLaRuta(req, res);
        if (!estilista) return;
        await horarioModel.crearAusencia({ idEstilista: estilista.id_estilista, desde, hasta, motivo });

        // Aviso si ya tenía citas en esas fechas: hay que reprogramarlas o cancelarlas
        const pendientes = await horarioModel.citasActivasEntre(estilista.id_estilista, desde, hasta);
        const aviso = pendientes > 0
            ? ` Ojo: tiene ${pendientes} cita(s) en esas fechas; reprográmalas o cancélalas.`
            : '';
        res.status(201).json({ success: true, message: 'Ausencia registrada.' + aviso });
    } catch (err) { errorServidor(res, err); }
}

// DELETE /api/ausencias/:id
async function eliminarAusencia(req, res) {
    try {
        const borrada = await horarioModel.eliminarAusencia(req.params.id);
        if (!borrada) return res.status(404).json({ success: false, message: 'La ausencia no existe.' });
        res.json({ success: true, message: 'Ausencia eliminada.' });
    } catch (err) { errorServidor(res, err); }
}

module.exports = { obtener, guardar, crearAusencia, eliminarAusencia };
