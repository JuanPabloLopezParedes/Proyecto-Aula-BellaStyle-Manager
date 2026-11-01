// Controlador de citas: listar, consultar disponibilidad en vivo, crear (con envío de correo y producto adicional),
// reprogramar, cambiar estado y calificar atención.
const citaModel = require('../models/citaModel');
const clienteModel = require('../models/clienteModel');
const servicioModel = require('../models/servicioModel');
const productoModel = require('../models/productoModel');
const estilistaModel = require('../models/estilistaModel');
const { enviarCorreoConfirmacionCita, obtenerCorreoDeCita } = require('../utils/correo');

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
        return seCruzan(inicio, fin, otroInicio, otroInicio + Number(c.duracion_min || 60));
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
        return seCruzan(inicio, fin, otroInicio, otroInicio + Number(c.duracion_min || 60));
    });
}

// Reglas de fecha y hora
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

// GET /api/citas/disponibilidad?fecha=2026-11-02&idServicio=1&idEstilista=2&idUsuario=5&duracionEspecialidad=60
async function disponibilidad(req, res) {
    const { fecha, idServicio, idEstilista, idUsuario, idClienta, excluirId, duracionEspecialidad } = req.query;
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

        const duracionReal = Number(duracionEspecialidad) >= 15
            ? Number(duracionEspecialidad)
            : Number(servicio.duracion_min || 60);

        const candidatas = idEstilista
            ? [{ id_estilista: Number(idEstilista) }]
            : await estilistaModel.capacitadasPara(idServicio);

        let citasClienta = [];
        let clientaObj = null;
        if (idClienta) {
            clientaObj = await clienteModel.buscarPorId(idClienta);
        } else if (idUsuario) {
            clientaObj = await clienteModel.buscarPorUsuario(idUsuario);
        }
        if (clientaObj) {
            citasClienta = await citaModel.ocupadasClientaDelDia(clientaObj.id_clienta, fecha, Number(excluirId) || 0);
        }

        const mapaCitasEstilista = new Map();
        const mapaTurnoEstilista = new Map();
        for (const est of candidatas) {
            const ocupadas = await citaModel.ocupadasDelDia(est.id_estilista, fecha, Number(excluirId) || 0);
            const turno = await estilistaModel.obtenerTurnoDia(est.id_estilista, diaSemana);
            mapaCitasEstilista.set(est.id_estilista, ocupadas);
            mapaTurnoEstilista.set(est.id_estilista, turno);
        }

        if (idEstilista) {
            const turnoElegida = mapaTurnoEstilista.get(Number(idEstilista));
            if (turnoElegida && !turnoElegida.trabaja) {
                return res.json({
                    success: true,
                    domingo: false,
                    descansoEstilista: true,
                    duracion: duracionReal,
                    data: []
                });
            }
        }

        const horarios = [];
        for (let minutos = 8 * 60; minutos <= 18 * 60 + 30; minutos += 30) {
            const fin = minutos + duracionReal;
            if (fueraDeHorario(minutos, fin)) continue;

            const h = String(Math.floor(minutos / 60)).padStart(2, '0');
            const m = String(minutos % 60).padStart(2, '0');
            const horaTexto = `${h}:${m}`;

            const cruceClienta = citasClienta.some((c) => {
                const otroInicio = aMinutos(c.hora);
                return seCruzan(minutos, fin, otroInicio, otroInicio + Number(c.duracion_min || 60));
            });

            let estilistasLibres = 0;
            for (const est of candidatas) {
                const turno = mapaTurnoEstilista.get(est.id_estilista);
                if (!turno || !turno.trabaja) continue;
                if (minutos < aMinutos(turno.hora_inicio) || fin > aMinutos(turno.hora_fin)) continue;

                const ocupadas = mapaCitasEstilista.get(est.id_estilista) || [];
                const ocupada = ocupadas.some((c) => {
                    const otroInicio = aMinutos(c.hora);
                    return seCruzan(minutos, fin, otroInicio, otroInicio + Number(c.duracion_min || 60));
                });
                if (!ocupada) estilistasLibres++;
            }

            horarios.push({
                hora: horaTexto,
                disponible: !cruceClienta && estilistasLibres > 0,
                estilistasLibres,
                motivo: cruceClienta ? 'La clienta ya tiene cita a esta hora' : (estilistasLibres === 0 ? 'Sin estilista en turno / Ocupado' : 'Disponible')
            });
        }

        res.json({ success: true, domingo: false, descansoEstilista: false, duracion: duracionReal, data: horarios });
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
// Soporta agendamiento por la propia clienta (idUsuario) o por la Administradora en recepción (idClienta),
// precio/duración por especialidad, producto adicional con descuento de stock y envío de correo de confirmación.
async function crear(req, res) {
    const {
        idUsuario,
        idClienta,
        idServicio,
        fecha,
        hora,
        idEstilista,
        idProducto,
        precioEspecialidad,
        duracionEspecialidad,
        observaciones
    } = req.body;

    if ((!idUsuario && !idClienta) || !idServicio || !fecha || !hora) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios de la cita.' });
    }
    const errorFecha = validarFechaHora(fecha, hora);
    if (errorFecha) {
        return res.status(400).json({ success: false, message: errorFecha });
    }

    try {
        const clienta = idClienta
            ? await clienteModel.buscarPorId(idClienta)
            : await clienteModel.buscarPorUsuario(idUsuario);
        if (!clienta) {
            return res.status(404).json({ success: false, message: 'No se encontró el perfil de la clienta.' });
        }

        const servicio = await servicioModel.buscarPorId(idServicio);
        if (!servicio) {
            return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        }

        const duracionMin = Number(duracionEspecialidad) >= 15 && Number(duracionEspecialidad) <= 480
            ? Number(duracionEspecialidad)
            : Number(servicio.duracion_min || 60);

        const precioBaseServicio = Number(precioEspecialidad) > 0
            ? Number(precioEspecialidad)
            : Number(servicio.precio);

        // Regla de horario: la cita completa debe caber entre 8:00 y 19:00
        const inicio = aMinutos(hora);
        const fin = inicio + duracionMin;
        if (fueraDeHorario(inicio, fin)) {
            return res.status(400).json({
                success: false,
                message: `El horario es de 8:00 a 19:00 y esta especialidad dura ${duracionMin} minutos.`
            });
        }

        // La clienta no puede tener dos citas que se crucen
        if (await clientaTieneCruce(clienta.id_clienta, fecha, inicio, fin)) {
            return res.status(409).json({ success: false, message: 'La clienta ya tiene otra cita agendada en ese horario.' });
        }

        // Producto adicional opcional
        let productoNombre = null;
        let precioProducto = 0;
        let productoElegido = null;
        if (idProducto) {
            productoElegido = await productoModel.buscarPorId(idProducto);
            if (!productoElegido || productoElegido.estado !== 'Activo') {
                return res.status(400).json({ success: false, message: 'El producto adicional seleccionado no está disponible.' });
            }
            if (Number(productoElegido.stock) <= 0) {
                return res.status(409).json({ success: false, message: `El producto "${productoElegido.nombre}" está agotado.` });
            }
            productoNombre = productoElegido.nombre;
            precioProducto = Number(productoElegido.precio);
        }

        let elegida = null;
        const capacitadas = await estilistaModel.capacitadasPara(idServicio);

        if (idEstilista) {
            const { libre, motivo } = await revisarDisponibilidad(idEstilista, fecha, inicio, fin);
            if (!libre) {
                return res.status(409).json({ success: false, message: motivo || 'La estilista no está disponible en ese horario.' });
            }
            const infoEst = capacitadas.find((e) => Number(e.id_estilista) === Number(idEstilista));
            elegida = { id_estilista: Number(idEstilista), nombre: infoEst ? infoEst.nombre : 'Tu estilista asignada' };
        } else {
            let menorCarga = Infinity;
            for (const estilista of capacitadas) {
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

        const precioTotal = precioBaseServicio + precioProducto;

        const idCita = await citaModel.crear({
            idClienta: clienta.id_clienta,
            idEstilista: elegida.id_estilista,
            idServicio,
            fecha,
            hora: hora + ':00',
            duracionMin,
            precio: precioTotal,
            productoAdicional: productoNombre,
            precioProducto,
            observaciones
        });

        // Si eligió un producto adicional, descontamos 1 unidad del inventario
        if (productoElegido) {
            await productoModel.descontarStock(productoElegido.id_producto);
        }

        // Enviamos el correo de confirmación detallando la fecha, hora y todo lo que se le realizará
        const clienteNombreCompleto = `${clienta.nombres} ${clienta.apellidos}`.trim();
        const correo = await enviarCorreoConfirmacionCita({
            idCita,
            clienteNombre: clienteNombreCompleto,
            clienteEmail: clienta.email || 'clienta@bellastyle.com',
            estilistaNombre: elegida.nombre || 'Estilista BellaStyle',
            servicioNombre: servicio.nombre,
            fecha,
            hora,
            duracionMin,
            precioServicio: precioBaseServicio,
            productoNombre,
            precioProducto,
            precioTotal,
            observaciones
        });

        const mensaje = `Cita BS-${idCita} agendada para el ${fecha} a las ${hora} con ${elegida.nombre || 'tu estilista'}. Se envió confirmación al correo ${correo.para}.`;
        res.status(201).json({
            success: true,
            message: mensaje,
            id: idCita,
            correo
        });
    } catch (err) {
        console.error('Error al crear cita:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo agendar la cita.' });
    }
}

// GET /api/citas/:id/correo
// Devuelve el correo de confirmación enviado cuando se apartó la cita
async function verCorreoCita(req, res) {
    try {
        const idCita = Number(req.params.id);
        let correo = obtenerCorreoDeCita(idCita);
        if (!correo) {
            const todas = await citaModel.listarTodas();
            const c = todas.find((x) => Number(x.id) === idCita);
            if (!c) {
                return res.status(404).json({ success: false, message: 'La cita no existe.' });
            }
            const precioProd = Number(c.precio_producto || 0);
            const precioSrv = Number(c.precio) - precioProd;
            correo = await enviarCorreoConfirmacionCita({
                idCita: c.id,
                clienteNombre: c.cliente,
                clienteEmail: c.cliente_email || 'clienta@bellastyle.com',
                estilistaNombre: c.estilista,
                servicioNombre: c.servicio,
                fecha: c.fecha,
                hora: c.hora,
                duracionMin: c.duracion_min,
                precioServicio: precioSrv,
                productoNombre: c.producto_adicional,
                precioProducto: precioProd,
                precioTotal: c.precio,
                observaciones: c.observaciones
            });
        }
        res.json({ success: true, data: correo });
    } catch (err) {
        console.error('Error al obtener correo de cita:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo cargar el correo de la cita.' });
    }
}

// PUT /api/citas/:id/estado
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

// PUT /api/citas/:id/calificar   Recibe: { calificacion: 1..5, comentario }
async function calificar(req, res) {
    const estrellas = Number(req.body.calificacion);
    const comentario = typeof req.body.comentario === 'string' ? req.body.comentario.trim().slice(0, 300) : '';

    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
        return res.status(400).json({ success: false, message: 'Selecciona una calificación de 1 a 5 estrellas.' });
    }

    try {
        const cita = await citaModel.buscarPorId(req.params.id);
        if (!cita) {
            return res.status(404).json({ success: false, message: 'La cita no existe.' });
        }
        if (cita.estado !== 'Finalizada') {
            return res.status(400).json({ success: false, message: 'Solo puedes calificar citas que ya hayan finalizado.' });
        }
        await citaModel.calificar(cita.id_cita, estrellas, comentario);
        res.json({ success: true, message: '¡Gracias por tu calificación! Tu reseña ha sido registrada.' });
    } catch (err) {
        console.error('Error al calificar cita:', err.message);
        res.status(500).json({ success: false, message: 'No se pudo guardar la calificación.' });
    }
}

// PUT /api/citas/:id/reprogramar
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
        const fin = inicio + Number(cita.duracion_min || 60);
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

module.exports = { listar, disponibilidad, crear, verCorreoCita, reprogramar, cambiarEstado, calificar };
