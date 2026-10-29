// Controlador de citas: listar, horas libres, crear (con asignación automática),
// reprogramar y cambiar estado
const citaModel = require('../models/citaModel');
const clienteModel = require('../models/clienteModel');
const servicioModel = require('../models/servicioModel');
const estilistaModel = require('../models/estilistaModel');
const horarioModel = require('../models/horarioModel');
const {
    APERTURA, CIERRE, INTERVALO, aMinutos, aHora, seCruzan,
    diaDeLaSemana, ahoraColombia, fechaValida, horaValida
} = require('../utils/agenda');

const ESTADOS = ['Pendiente', 'Confirmada', 'Finalizada', 'Cancelada'];

// Carga de una sola vez lo que se necesita para saber si una estilista
// puede atender un día: su horario, si está ausente y las citas que ya tiene.
// excluirId: al reprogramar, la propia cita no se cuenta.
async function agendaDelDia(idEstilista, fecha, excluirId = 0) {
    const horario = await horarioModel.horarioDelDia(idEstilista, diaDeLaSemana(fecha));
    const ausente = await horarioModel.ausenteEn(idEstilista, fecha);
    const citas = await citaModel.ocupadasDelDia(idEstilista, fecha, excluirId);
    return {
        horario,
        ausente,
        ocupadas: citas.map((c) => ({ inicio: aMinutos(c.hora), fin: aMinutos(c.hora) + c.duracion_min }))
    };
}

// ¿Puede la estilista atender entre inicio y fin?
// Devuelve null si puede, o el motivo por el que no:
// 'ausente', 'no_trabaja', 'fuera_de_horario' u 'ocupada'.
function motivoNoDisponible(agenda, inicio, fin) {
    if (agenda.ausente) return 'ausente';
    if (!agenda.horario) return 'no_trabaja';
    if (inicio < aMinutos(agenda.horario.hora_inicio) || fin > aMinutos(agenda.horario.hora_fin)) {
        return 'fuera_de_horario';
    }
    if (agenda.ocupadas.some((o) => seCruzan(inicio, fin, o.inicio, o.fin))) return 'ocupada';
    return null;
}

const MENSAJES_NO_DISPONIBLE = {
    ausente: 'La estilista no trabaja ese día (está ausente).',
    no_trabaja: 'La estilista no trabaja ese día de la semana.',
    fuera_de_horario: 'Esa hora está fuera del horario de la estilista.',
    ocupada: 'La estilista ya tiene una cita en ese horario.'
};

// Revisa si la clienta ya tiene otra cita que se cruce con ese horario
async function clientaTieneCruce(idClienta, fecha, inicio, fin, excluirId = 0) {
    const citas = await citaModel.ocupadasClientaDelDia(idClienta, fecha, excluirId);
    return citas.some((c) => {
        const otroInicio = aMinutos(c.hora);
        return seCruzan(inicio, fin, otroInicio, otroInicio + c.duracion_min);
    });
}

// Reglas de fecha y hora. Devuelve el mensaje de error, o null si todo está bien.
function validarFechaHora(fecha, hora) {
    if (!horaValida(hora)) {
        return 'La hora no tiene un formato válido.';
    }
    const ahora = ahoraColombia();
    if (!fechaValida(fecha) || fecha < ahora.fecha) {
        return 'La fecha no puede ser anterior a hoy.';
    }
    if (diaDeLaSemana(fecha) === 0) {
        return 'El salón no atiende los domingos.';
    }
    if (fecha === ahora.fecha && aMinutos(hora) <= ahora.minutos) {
        return 'Esa hora ya pasó. Escoge una hora más tarde.';
    }
    return null;
}

// La cita completa debe caber entre 8:00 y 19:00
function fueraDeHorario(inicio, fin) {
    return inicio < APERTURA || fin > CIERRE;
}

// GET /api/citas?rol=Clienta&idUsuario=3
async function listar(req, res) {
    const { rol, idUsuario } = req.query;
    try {
        let citas;
        if (rol === 'Clienta') {
            citas = await citaModel.listarPorClienta(idUsuario);
        } else if (rol === 'Estilista') {
            citas = await citaModel.listarPorEstilista(idUsuario);
        } else {
            citas = await citaModel.listarTodas();
        }
        res.json({ success: true, data: citas });
    } catch (err) {
        console.error('Error al listar citas:', err.message);
        res.status(500).json({ success: false, message: 'Error al consultar las citas.' });
    }
}

// GET /api/disponibilidad?idServicio=1&fecha=2026-11-03&idEstilista=2&excluirCita=5
// Devuelve las horas (cada 30 minutos) en que se puede agendar ese servicio ese día.
// Con idEstilista: las horas libres de esa estilista.
// Sin idEstilista: las horas en que al menos una estilista que sabe el servicio está libre.
async function disponibilidad(req, res) {
    const { idServicio, fecha, idEstilista } = req.query;
    const excluirCita = Number(req.query.excluirCita) || 0;

    if (!idServicio || !fechaValida(fecha)) {
        return res.status(400).json({ success: false, message: 'Escoge el servicio y una fecha válida.' });
    }
    const ahora = ahoraColombia();
    if (fecha < ahora.fecha || diaDeLaSemana(fecha) === 0) {
        return res.json({ success: true, data: { horas: [] } });
    }

    try {
        const servicio = await servicioModel.buscarPorId(idServicio);
        if (!servicio) {
            return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        }

        const candidatas = idEstilista
            ? [{ id_estilista: Number(idEstilista) }]
            : await estilistaModel.capacitadasPara(idServicio);
        const agendas = [];
        for (const e of candidatas) {
            agendas.push(await agendaDelDia(e.id_estilista, fecha, excluirCita));
        }

        const horas = [];
        for (let inicio = APERTURA; inicio + servicio.duracion_min <= CIERRE; inicio += INTERVALO) {
            if (fecha === ahora.fecha && inicio <= ahora.minutos) continue;   // hoy: solo horas que no han pasado
            const fin = inicio + servicio.duracion_min;
            if (agendas.some((a) => motivoNoDisponible(a, inicio, fin) === null)) {
                horas.push(aHora(inicio));
            }
        }
        res.json({ success: true, data: { horas, duracion: servicio.duracion_min } });
    } catch (err) {
        console.error('Error al calcular la disponibilidad:', err.message);
        res.status(500).json({ success: false, message: 'No se pudieron consultar las horas libres.' });
    }
}

// POST /api/citas
// Recibe: { idUsuario, idServicio, fecha, hora, idEstilista (opcional), observaciones }
async function crear(req, res) {
    const { idUsuario, idServicio, fecha, hora, idEstilista, observaciones } = req.body;

    if (!idUsuario || !idServicio || !fecha || !hora) {
        return res.status(400).json({ success: false, message: 'Faltan datos de la cita.' });
    }
    const errorFecha = validarFechaHora(fecha, hora);
    if (errorFecha) {
        return res.status(400).json({ success: false, message: errorFecha });
    }

    try {
        const clienta = await clienteModel.buscarPorUsuario(idUsuario);
        if (!clienta) {
            return res.status(404).json({ success: false, message: 'Tu cuenta no tiene perfil de clienta.' });
        }

        const servicio = await servicioModel.buscarPorId(idServicio);
        if (!servicio) {
            return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        }

        // Regla de horario: la cita completa debe caber entre 8:00 y 19:00
        const inicio = aMinutos(hora);
        const fin = inicio + servicio.duracion_min;
        if (fueraDeHorario(inicio, fin)) {
            return res.status(400).json({
                success: false,
                message: `El horario es de 8:00 a 19:00 y este servicio dura ${servicio.duracion_min} minutos.`
            });
        }

        // La clienta no puede tener dos citas que se crucen
        if (await clientaTieneCruce(clienta.id_clienta, fecha, inicio, fin)) {
            return res.status(409).json({ success: false, message: 'Ya tienes otra cita en ese horario.' });
        }

        let elegida = null;

        if (idEstilista) {
            // La clienta escogió estilista: se revisa su horario, ausencias y citas
            const agenda = await agendaDelDia(idEstilista, fecha);
            const motivo = motivoNoDisponible(agenda, inicio, fin);
            if (motivo) {
                return res.status(409).json({ success: false, message: MENSAJES_NO_DISPONIBLE[motivo] });
            }
            const estilista = await estilistaModel.buscarPorId(idEstilista);
            elegida = { id_estilista: Number(idEstilista), nombre: estilista ? estilista.nombre : null };
        } else {
            // Asignación automática: de las estilistas que saben hacer el servicio
            // y pueden atender a esa hora, se escoge la que tenga menos citas ese día.
            const candidatas = await estilistaModel.capacitadasPara(idServicio);
            let menorCarga = Infinity;
            for (const estilista of candidatas) {
                const agenda = await agendaDelDia(estilista.id_estilista, fecha);
                if (motivoNoDisponible(agenda, inicio, fin) === null && agenda.ocupadas.length < menorCarga) {
                    elegida = estilista;
                    menorCarga = agenda.ocupadas.length;
                }
            }
            if (!elegida) {
                return res.status(409).json({ success: false, message: 'No hay estilistas libres para ese servicio a esa hora. Prueba otro horario.' });
            }
        }

        const idCita = await citaModel.crear({
            idClienta: clienta.id_clienta,
            idEstilista: elegida.id_estilista,
            idServicio,
            fecha,
            hora: hora + ':00',
            precio: servicio.precio,
            observaciones
        });

        const mensaje = elegida.nombre
            ? `Cita agendada. Te atenderá ${elegida.nombre}.`
            : 'Cita agendada.';
        res.status(201).json({ success: true, message: mensaje, id: idCita, estilista: elegida.nombre });
    } catch (err) {
        console.error('Error al crear cita:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo agendar la cita.' });
    }
}

// PUT /api/citas/:id/estado
// Recibe: { estado }
async function cambiarEstado(req, res) {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        const actualizada = await citaModel.cambiarEstado(req.params.id, estado);
        if (!actualizada) {
            return res.status(404).json({ success: false, message: 'La cita no existe.' });
        }
        res.json({ success: true, message: `La cita quedó ${estado.toLowerCase()}.` });
    } catch (err) {
        console.error('Error al cambiar estado:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo actualizar la cita.' });
    }
}

// PUT /api/citas/:id/reprogramar
// Recibe: { fecha, hora }. Se mantiene la misma estilista y el mismo servicio.
async function reprogramar(req, res) {
    const { fecha, hora } = req.body;

    const errorFecha = validarFechaHora(fecha, hora);
    if (errorFecha) {
        return res.status(400).json({ success: false, message: errorFecha });
    }

    try {
        const cita = await citaModel.buscarPorId(req.params.id);
        if (!cita) {
            return res.status(404).json({ success: false, message: 'La cita no existe.' });
        }
        if (cita.estado !== 'Pendiente' && cita.estado !== 'Confirmada') {
            return res.status(400).json({ success: false, message: 'Solo se pueden reprogramar citas pendientes o confirmadas.' });
        }

        const inicio = aMinutos(hora);
        const fin = inicio + cita.duracion_min;
        if (fueraDeHorario(inicio, fin)) {
            return res.status(400).json({
                success: false,
                message: `El horario es de 8:00 a 19:00 y este servicio dura ${cita.duracion_min} minutos.`
            });
        }

        const agenda = await agendaDelDia(cita.id_estilista, fecha, cita.id_cita);
        const motivo = motivoNoDisponible(agenda, inicio, fin);
        if (motivo) {
            return res.status(409).json({ success: false, message: MENSAJES_NO_DISPONIBLE[motivo] });
        }
        if (await clientaTieneCruce(cita.id_cliente, fecha, inicio, fin, cita.id_cita)) {
            return res.status(409).json({ success: false, message: 'Ya tienes otra cita en ese horario.' });
        }

        await citaModel.reprogramar(cita.id_cita, fecha, hora + ':00');
        res.json({ success: true, message: 'Cita reprogramada. Queda pendiente de confirmación.' });
    } catch (err) {
        console.error('Error al reprogramar:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo reprogramar la cita.' });
    }
}

module.exports = { listar, disponibilidad, crear, reprogramar, cambiarEstado };
