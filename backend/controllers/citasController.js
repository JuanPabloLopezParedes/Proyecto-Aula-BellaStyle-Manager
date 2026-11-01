// Controlador de citas: listar, consultar disponibilidad en vivo (respetando turnos y descansos), crear, reprogramar y cambiar estado
const citaModel = require('../models/citaModel');
const clienteModel = require('../models/clienteModel');
const servicioModel = require('../models/servicioModel');
const estilistaModel = require('../models/estilistaModel');

const APERTURA = 8 * 60;  // 8:00 a.m. en minutos
const CIERRE = 19 * 60;   // 7:00 p.m. en minutos
const ESTADOS = ['Pendiente', 'Confirmada', 'Finalizada', 'Cancelada'];

// "14:30" -> 870 minutos
function aMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

// Dos rangos se cruzan si uno empieza antes de que el otro termine
function seCruzan(inicioA, finA, inicioB, finB) {
    return inicioA < finB && inicioB < finA;
}

// Revisa si la estilista trabaja ese día dentro de su turno y si está libre entre inicio y fin.
// Devuelve también cuántas citas tiene ese día (sirve para repartir el trabajo).
// excluirId: al reprogramar, la propia cita no se cuenta.
async function revisarDisponibilidad(idEstilista, fecha, inicio, fin, excluirId = 0) {
    const diaSemana = new Date(fecha + 'T12:00:00').getDay();
    const turno = await estilistaModel.obtenerTurnoDia(idEstilista, diaSemana);

    if (!turno.trabaja) {
        return {
            libre: false,
            carga: 999,
            motivo: 'La estilista tiene día de descanso en esa fecha. Por favor elige otro día u otra estilista.'
        };
    }

    const inicioTurno = aMinutos(turno.hora_inicio);
    const finTurno = aMinutos(turno.hora_fin);
    if (inicio < inicioTurno || fin > finTurno) {
        return {
            libre: false,
            carga: 999,
            motivo: `La estilista atiende ese día de ${turno.hora_inicio} a ${turno.hora_fin}.`
        };
    }

    const citas = await citaModel.ocupadasDelDia(idEstilista, fecha, excluirId);
    const ocupada = citas.some((c) => {
        const otroInicio = aMinutos(c.hora);
        return seCruzan(inicio, fin, otroInicio, otroInicio + c.duracion_min);
    });
    return {
        libre: !ocupada,
        carga: citas.length,
        motivo: ocupada ? 'La estilista ya tiene una cita en ese horario.' : null
    };
}

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
    if (!/^\d{2}:\d{2}$/.test(hora || '')) {
        return 'La hora no tiene un formato válido.';
    }
    const dia = new Date(fecha + 'T12:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (isNaN(dia) || dia < hoy) {
        return 'La fecha no puede ser anterior a hoy.';
    }
    if (dia.getDay() === 0) {
        return 'El salón no atiende los domingos.';
    }
    return null;
}

// La cita completa debe caber entre 8:00 y 19:00
function fueraDeHorario(inicio, fin) {
    return inicio < APERTURA || fin > CIERRE;
}

// GET /api/citas/disponibilidad?fecha=2026-11-02&idServicio=1&idEstilista=2&idUsuario=5
// Devuelve la lista de bloques horarios del día indicando cuáles están libres y cuántas estilistas hay disponibles
async function disponibilidad(req, res) {
    const { fecha, idServicio, idEstilista, idUsuario, excluirId } = req.query;
    if (!fecha || !idServicio) {
        return res.status(400).json({ success: false, message: 'Falta fecha o servicio.' });
    }

    const dia = new Date(fecha + 'T12:00:00');
    if (isNaN(dia) || dia.getDay() === 0) {
        return res.json({ success: true, domingo: true, data: [] });
    }
    const diaSemana = dia.getDay();

    try {
        const servicio = await servicioModel.buscarPorId(idServicio);
        if (!servicio) {
            return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        }

        const candidatas = idEstilista
            ? [{ id_estilista: Number(idEstilista) }]
            : await estilistaModel.capacitadasPara(idServicio);

        let citasClienta = [];
        if (idUsuario) {
            const clienta = await clienteModel.buscarPorUsuario(idUsuario);
            if (clienta) {
                citasClienta = await citaModel.ocupadasClientaDelDia(clienta.id_clienta, fecha, Number(excluirId) || 0);
            }
        }

        // Consultamos una sola vez las citas del día y el turno laboral de cada estilista candidata
        const mapaCitasEstilista = new Map();
        const mapaTurnoEstilista = new Map();
        for (const est of candidatas) {
            const ocupadas = await citaModel.ocupadasDelDia(est.id_estilista, fecha, Number(excluirId) || 0);
            const turno = await estilistaModel.obtenerTurnoDia(est.id_estilista, diaSemana);
            mapaCitasEstilista.set(est.id_estilista, ocupadas);
            mapaTurnoEstilista.set(est.id_estilista, turno);
        }

        // Si escogió una estilista específica y ese día tiene descanso, informamos directamente
        if (idEstilista) {
            const turnoElegida = mapaTurnoEstilista.get(Number(idEstilista));
            if (turnoElegida && !turnoElegida.trabaja) {
                return res.json({
                    success: true,
                    domingo: false,
                    descansoEstilista: true,
                    duracion: servicio.duracion_min,
                    data: []
                });
            }
        }

        const horarios = [];
        for (let minutos = 8 * 60; minutos <= 18 * 60 + 30; minutos += 30) {
            const fin = minutos + servicio.duracion_min;
            if (fueraDeHorario(minutos, fin)) continue;

            const h = String(Math.floor(minutos / 60)).padStart(2, '0');
            const m = String(minutos % 60).padStart(2, '0');
            const horaTexto = `${h}:${m}`;

            const cruceClienta = citasClienta.some((c) => {
                const otroInicio = aMinutos(c.hora);
                return seCruzan(minutos, fin, otroInicio, otroInicio + c.duracion_min);
            });

            let estilistasLibres = 0;
            for (const est of candidatas) {
                const turno = mapaTurnoEstilista.get(est.id_estilista);
                if (!turno || !turno.trabaja) continue;
                if (minutos < aMinutos(turno.hora_inicio) || fin > aMinutos(turno.hora_fin)) continue;

                const ocupadas = mapaCitasEstilista.get(est.id_estilista) || [];
                const ocupada = ocupadas.some((c) => {
                    const otroInicio = aMinutos(c.hora);
                    return seCruzan(minutos, fin, otroInicio, otroInicio + c.duracion_min);
                });
                if (!ocupada) estilistasLibres++;
            }

            horarios.push({
                hora: horaTexto,
                disponible: !cruceClienta && estilistasLibres > 0,
                estilistasLibres,
                motivo: cruceClienta ? 'Ya tienes cita a esta hora' : (estilistasLibres === 0 ? 'Sin estilista en turno / Ocupado' : 'Disponible')
            });
        }

        res.json({ success: true, domingo: false, descansoEstilista: false, duracion: servicio.duracion_min, data: horarios });
    } catch (err) {
        console.error('Error al consultar disponibilidad:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo consultar la disponibilidad.' });
    }
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
            // La clienta escogió estilista: se revisa que trabaje ese día en ese turno y esté libre
            const { libre, motivo } = await revisarDisponibilidad(idEstilista, fecha, inicio, fin);
            if (!libre) {
                return res.status(409).json({ success: false, message: motivo || 'La estilista no está disponible en ese horario.' });
            }
            elegida = { id_estilista: Number(idEstilista) };
        } else {
            // Asignación automática: de las estilistas que saben hacer el servicio,
            // trabajan ese día y están libres, se escoge la que tenga menos citas ese día.
            const candidatas = await estilistaModel.capacitadasPara(idServicio);
            let menorCarga = Infinity;
            for (const estilista of candidatas) {
                const { libre, carga } = await revisarDisponibilidad(estilista.id_estilista, fecha, inicio, fin);
                if (libre && carga < menorCarga) {
                    elegida = estilista;
                    menorCarga = carga;
                }
            }
            if (!elegida) {
                return res.status(409).json({ success: false, message: 'No hay estilistas en turno o libres para ese servicio a esa hora. Prueba otro horario.' });
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
        res.status(201).json({ success: true, message: mensaje, id: idCita });
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

        const { libre, motivo } = await revisarDisponibilidad(cita.id_estilista, fecha, inicio, fin, cita.id_cita);
        if (!libre) {
            return res.status(409).json({ success: false, message: motivo || 'La estilista ya tiene una cita en ese horario.' });
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
