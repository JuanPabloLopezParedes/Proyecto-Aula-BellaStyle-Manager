// Controlador de gestión: crear y editar servicios, productos, estilistas (incluyendo horarios) y clientas
const db = require('../config/db');
const servicioModel = require('../models/servicioModel');
const productoModel = require('../models/productoModel');
const estilistaModel = require('../models/estilistaModel');
const clienteModel = require('../models/clienteModel');
const { nombreValido } = require('../utils/validators');

// Revisa que un número sea entero y no negativo (precio, stock, duración)
function numeroValido(valor) {
    return Number.isInteger(Number(valor)) && Number(valor) >= 0;
}

function textoValido(valor) {
    return typeof valor === 'string' && valor.trim().length >= 2 && valor.trim().length <= 100;
}

function errorServidor(res, err) {
    console.error('Error en gestión:', err.message);
    res.status(500).json({ success: false, message: 'No se pudo guardar el cambio.' });
}

// ---------------------------------------------------------------
// SERVICIOS
// ---------------------------------------------------------------

function validarServicio(body) {
    if (!textoValido(body.nombre)) return 'El nombre debe tener entre 2 y 100 caracteres.';
    if (!numeroValido(body.precio) || Number(body.precio) === 0) return 'El precio debe ser un número mayor que cero.';
    if (!numeroValido(body.duracion) || Number(body.duracion) < 15 || Number(body.duracion) > 480) {
        return 'La duración debe estar entre 15 y 480 minutos.';
    }
    return null;
}

// POST /api/servicios   Recibe: { nombre, precio, duracion }
async function crearServicio(req, res) {
    const error = validarServicio(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, duracion } = req.body;
        await servicioModel.crear({ nombre: nombre.trim(), precio, duracion });
        res.status(201).json({ success: true, message: 'Servicio creado.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/servicios/:id   Recibe: { nombre, precio, duracion }
async function editarServicio(req, res) {
    const error = validarServicio(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, duracion } = req.body;
        const ok = await servicioModel.actualizar(req.params.id, { nombre: nombre.trim(), precio, duracion });
        if (!ok) return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        res.json({ success: true, message: 'Servicio actualizado.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/servicios/:id/estado   Recibe: { estado: 'Disponible' | 'No disponible' }
async function estadoServicio(req, res) {
    const { estado } = req.body;
    if (!['Disponible', 'No disponible'].includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        const ok = await servicioModel.cambiarEstado(req.params.id, estado);
        if (!ok) return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        res.json({ success: true, message: `Servicio marcado como ${estado.toLowerCase()}.` });
    } catch (err) { errorServidor(res, err); }
}

// ---------------------------------------------------------------
// PRODUCTOS
// ---------------------------------------------------------------

function validarProducto(body) {
    if (!textoValido(body.nombre)) return 'El nombre debe tener entre 2 y 100 caracteres.';
    if (!numeroValido(body.precio) || Number(body.precio) === 0) return 'El precio debe ser un número mayor que cero.';
    if (!numeroValido(body.stock)) return 'El stock debe ser un número entero de 0 en adelante.';
    return null;
}

// POST /api/productos   Recibe: { nombre, precio, stock }
async function crearProducto(req, res) {
    const error = validarProducto(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, stock } = req.body;
        await productoModel.crear({ nombre: nombre.trim(), precio, stock });
        res.status(201).json({ success: true, message: 'Producto creado.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/productos/:id   Recibe: { nombre, precio, stock }
async function editarProducto(req, res) {
    const error = validarProducto(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, stock } = req.body;
        const ok = await productoModel.actualizar(req.params.id, { nombre: nombre.trim(), precio, stock });
        if (!ok) return res.status(404).json({ success: false, message: 'El producto no existe.' });
        res.json({ success: true, message: 'Producto actualizado.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/productos/:id/estado   Recibe: { estado: 'Activo' | 'Inactivo' }
async function estadoProducto(req, res) {
    const { estado } = req.body;
    if (!['Activo', 'Inactivo'].includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        const ok = await productoModel.cambiarEstado(req.params.id, estado);
        if (!ok) return res.status(404).json({ success: false, message: 'El producto no existe.' });
        res.json({ success: true, message: `Producto marcado como ${estado.toLowerCase()}.` });
    } catch (err) { errorServidor(res, err); }
}

// ---------------------------------------------------------------
// ESTILISTAS Y HORARIOS SEMANALES
// ---------------------------------------------------------------

// PUT /api/estilistas/:id/estado   Recibe: { estado: 'Activo' | 'Inactivo' }
// Una estilista inactiva no recibe citas nuevas.
async function estadoEstilista(req, res) {
    const { estado } = req.body;
    if (!['Activo', 'Inactivo'].includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }
    try {
        const ok = await estilistaModel.cambiarEstado(req.params.id, estado);
        if (!ok) return res.status(404).json({ success: false, message: 'La estilista no existe.' });
        res.json({ success: true, message: estado === 'Activo' ? 'Estilista activada.' : 'Estilista desactivada: ya no recibirá citas nuevas.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/estilistas/:id/servicios   Recibe: { servicios: [1, 4, 7], especialidad?: '...' }
async function serviciosEstilista(req, res) {
    const servicios = Array.isArray(req.body.servicios) ? req.body.servicios.map(Number) : [];
    const especialidad = typeof req.body.especialidad === 'string' ? req.body.especialidad.trim() : null;
    if (servicios.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecciona al menos un servicio.' });
    }

    // Transacción: se borran los servicios anteriores y se guardan los nuevos juntos
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        await estilistaModel.reemplazarServicios(conexion, req.params.id, servicios);
        if (especialidad !== null && especialidad.length >= 2) {
            await estilistaModel.cambiarEspecialidad(req.params.id, especialidad);
        }
        await conexion.commit();
        res.json({ success: true, message: 'Especialización y servicios actualizados.' });
    } catch (err) {
        await conexion.rollback();
        errorServidor(res, err);
    } finally {
        conexion.release();
    }
}

function aMinutosHora(hora) {
    if (!/^\d{2}:\d{2}$/.test(hora || '')) return -1;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

// PUT /api/estilistas/:id/horario
// Recibe: { horarios: [{ dia_semana: 1..6, trabaja: true|false, hora_inicio: '08:00', hora_fin: '18:00' }] }
async function horarioEstilista(req, res) {
    const lista = Array.isArray(req.body.horarios) ? req.body.horarios : [];
    if (lista.length !== 6) {
        return res.status(400).json({ success: false, message: 'Debes enviar la programación de lunes a sábado (6 días).' });
    }

    const normalizados = [];
    for (let dia = 1; dia <= 6; dia++) {
        const item = lista.find((x) => Number(x.dia_semana) === dia);
        if (!item) {
            return res.status(400).json({ success: false, message: `Falta configurar el día ${dia}.` });
        }
        const trabaja = Boolean(item.trabaja);
        const inicio = String(item.hora_inicio || '08:00').slice(0, 5);
        const fin = String(item.hora_fin || '19:00').slice(0, 5);
        const minInicio = aMinutosHora(inicio);
        const minFin = aMinutosHora(fin);

        if (minInicio < 8 * 60 || minFin > 19 * 60 || minInicio >= minFin) {
            return res.status(400).json({
                success: false,
                message: 'El horario laboral debe estar entre las 08:00 y las 19:00, y la hora de salida debe ser posterior a la de entrada.'
            });
        }
        normalizados.push({
            dia_semana: dia,
            trabaja,
            hora_inicio: inicio,
            hora_fin: fin
        });
    }

    const diasActivos = normalizados.filter((d) => d.trabaja).length;
    if (diasActivos === 0) {
        return res.status(400).json({ success: false, message: 'La estilista debe tener al menos un día laboral en la semana.' });
    }

    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();
        await estilistaModel.reemplazarHorario(conexion, req.params.id, normalizados);
        await conexion.commit();
        res.json({ success: true, message: 'Horario semanal y días de descanso actualizados.' });
    } catch (err) {
        await conexion.rollback();
        errorServidor(res, err);
    } finally {
        conexion.release();
    }
}

// ---------------------------------------------------------------
// CLIENTAS
// ---------------------------------------------------------------

// PUT /api/clientas/:id   Recibe: { nombres, apellidos, telefono, email }
async function editarClienta(req, res) {
    const { nombres, apellidos, telefono, email } = req.body;
    if (!nombreValido(nombres) || !nombreValido(apellidos)) {
        return res.status(400).json({ success: false, message: 'Nombres y apellidos solo pueden tener letras y espacios.' });
    }
    if (telefono && !/^[0-9 +]{7,20}$/.test(telefono)) {
        return res.status(400).json({ success: false, message: 'El teléfono solo puede tener números y espacios.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'El correo no es válido.' });
    }
    try {
        const ok = await clienteModel.actualizar(req.params.id, {
            nombres: nombres.trim(), apellidos: apellidos.trim(), telefono, email
        });
        if (!ok) return res.status(404).json({ success: false, message: 'La clienta no existe.' });
        res.json({ success: true, message: 'Datos actualizados.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/clientas/:id/ficha   Recibe: { ficha_tecnica }
async function fichaTecnicaClienta(req, res) {
    const ficha = typeof req.body.ficha_tecnica === 'string' ? req.body.ficha_tecnica.trim().slice(0, 800) : '';
    try {
        const ok = await clienteModel.actualizarFichaTecnica(req.params.id, ficha);
        if (!ok) return res.status(404).json({ success: false, message: 'La clienta no existe.' });
        res.json({ success: true, message: 'Ficha técnica capilar y de cuidado guardada.' });
    } catch (err) { errorServidor(res, err); }
}

module.exports = {
    crearServicio, editarServicio, estadoServicio,
    crearProducto, editarProducto, estadoProducto,
    estadoEstilista, serviciosEstilista, horarioEstilista,
    editarClienta, fichaTecnicaClienta
};
