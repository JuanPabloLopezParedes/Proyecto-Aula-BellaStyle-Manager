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

function imagenValida(img) {
    return typeof img === 'string' && img.trim().length >= 5;
}

function normalizarEjemplosServicio(ejemplosRaw, precioBase, duracionBase) {
    if (!Array.isArray(ejemplosRaw)) return [];
    return ejemplosRaw
        .map((ej) => ({
            nombre: typeof ej?.nombre === 'string' ? ej.nombre.trim() : '',
            detalle: typeof ej?.detalle === 'string' && ej.detalle.trim()
                ? ej.detalle.trim()
                : 'Procedimiento profesional personalizado realizado por nuestras especialistas en salón.',
            precio: Number(ej?.precio) > 0 ? Math.round(Number(ej.precio)) : Number(precioBase),
            duracion: Number(ej?.duracion) >= 15 ? Math.round(Number(ej.duracion)) : Number(duracionBase),
            imagen: typeof ej?.imagen === 'string' ? ej.imagen.trim() : ''
        }))
        .filter((ej) => ej.nombre.length >= 2 || ej.imagen.length > 0);
}

function validarServicio(body, exigirEjemplos = false) {
    if (!textoValido(body.nombre)) return 'El nombre del servicio debe tener entre 2 y 100 caracteres.';
    if (!numeroValido(body.precio) || Number(body.precio) === 0) return 'El precio debe ser un número mayor que cero.';
    if (!numeroValido(body.duracion) || Number(body.duracion) < 15 || Number(body.duracion) > 480) {
        return 'La duración debe estar entre 15 y 480 minutos.';
    }
    if (!imagenValida(body.imagen)) {
        return 'Es obligatorio añadir una foto principal para el servicio.';
    }
    const ejemplos = normalizarEjemplosServicio(body.ejemplos, body.precio, body.duracion);
    if (exigirEjemplos && ejemplos.length === 0) {
        return 'Debes añadir al menos un ejemplo con su foto para que se muestre en el catálogo y en la galería.';
    }
    for (let i = 0; i < ejemplos.length; i++) {
        if (ejemplos[i].nombre.length < 2) {
            return `El ejemplo #${i + 1} debe tener un nombre válido.`;
        }
        if (!imagenValida(ejemplos[i].imagen)) {
            return `El ejemplo "${ejemplos[i].nombre}" debe incluir obligatoriamente una foto.`;
        }
    }
    return null;
}

// POST /api/servicios   Recibe: { nombre, precio, duracion, imagen, subtitulo, ejemplos }
async function crearServicio(req, res) {
    const error = validarServicio(req.body, true);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, duracion, imagen, subtitulo } = req.body;
        const ejemplos = normalizarEjemplosServicio(req.body.ejemplos, precio, duracion);
        await servicioModel.crear({
            nombre: nombre.trim(),
            precio: Number(precio),
            duracion: Number(duracion),
            imagen: imagen.trim(),
            subtitulo: typeof subtitulo === 'string' && subtitulo.trim()
                ? subtitulo.trim()
                : 'Servicio profesional personalizado con ejemplos reales del salón',
            ejemplos
        });
        res.status(201).json({ success: true, message: 'Servicio creado con su foto y ejemplos en catálogo y galería.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/servicios/:id   Recibe: { nombre, precio, duracion, imagen, subtitulo, ejemplos }
async function editarServicio(req, res) {
    const error = validarServicio(req.body, false);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, duracion, imagen, subtitulo } = req.body;
        const ejemplos = Array.isArray(req.body.ejemplos)
            ? normalizarEjemplosServicio(req.body.ejemplos, precio, duracion)
            : null;
        const ok = await servicioModel.actualizar(req.params.id, {
            nombre: nombre.trim(),
            precio: Number(precio),
            duracion: Number(duracion),
            imagen: imagen.trim(),
            subtitulo: typeof subtitulo === 'string' ? subtitulo.trim() : null,
            ejemplos: ejemplos && ejemplos.length > 0 ? ejemplos : null
        });
        if (!ok) return res.status(404).json({ success: false, message: 'El servicio no existe.' });
        res.json({ success: true, message: 'Servicio actualizado con su foto y ejemplos.' });
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

function validarProducto(body, exigirImagen = true) {
    if (!textoValido(body.nombre)) return 'El nombre del producto debe tener entre 2 y 100 caracteres.';
    if (!numeroValido(body.precio) || Number(body.precio) === 0) return 'El precio debe ser un número mayor que cero.';
    if (!numeroValido(body.stock)) return 'El stock debe ser un número entero de 0 en adelante.';
    if (exigirImagen && !imagenValida(body.imagen)) {
        return 'Es obligatorio añadir una foto del producto para que las clientas puedan verlo.';
    }
    return null;
}

// POST /api/productos   Recibe: { nombre, precio, stock, imagen, categoria, descripcion }
async function crearProducto(req, res) {
    const error = validarProducto(req.body, true);
    if (error) return res.status(400).json({ success: false, message: error });
    try {
        const { nombre, precio, stock, imagen, categoria, descripcion } = req.body;
        await productoModel.crear({
            nombre: nombre.trim(),
            precio: Number(precio),
            stock: Number(stock),
            imagen: imagen.trim(),
            categoria: typeof categoria === 'string' && categoria.trim() ? categoria.trim() : 'Producto Profesional de Salón',
            descripcion: typeof descripcion === 'string' && descripcion.trim()
                ? descripcion.trim()
                : 'Fórmula cosmética de grado profesional recomendada por nuestras especialistas para el cuidado en casa.'
        });
        res.status(201).json({ success: true, message: 'Producto registrado con su fotografía en la tienda.' });
    } catch (err) { errorServidor(res, err); }
}

// PUT /api/productos/:id   Recibe: { nombre, precio, stock, imagen, categoria, descripcion }
async function editarProducto(req, res) {
    const existente = await productoModel.buscarPorId(req.params.id);
    if (!existente) return res.status(404).json({ success: false, message: 'El producto no existe.' });

    const imagenFinal = imagenValida(req.body.imagen) ? req.body.imagen.trim() : (existente.imagen || '');
    const error = validarProducto({ ...req.body, imagen: imagenFinal }, Boolean(req.body.imagen !== undefined));
    if (error) return res.status(400).json({ success: false, message: error });

    try {
        const { nombre, precio, stock, categoria, descripcion } = req.body;
        const ok = await productoModel.actualizar(req.params.id, {
            nombre: nombre.trim(),
            precio: Number(precio),
            stock: Number(stock),
            imagen: imagenFinal || null,
            categoria: typeof categoria === 'string' && categoria.trim() ? categoria.trim() : (existente.categoria || null),
            descripcion: typeof descripcion === 'string' && descripcion.trim() ? descripcion.trim() : (existente.descripcion || null)
        });
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

// POST /api/productos/:id/comprar   Recibe: { cantidad, metodoPago, referenciaPago }
// Descuenta el stock de manera real en la base de datos del servidor (sincronizado entre PC y celular)
async function comprarProductoDirecto(req, res) {
    const cantidad = Math.max(1, Math.min(20, Number(req.body.cantidad) || 1));
    const metodoPago = ['Nequi / Daviplata', 'Tarjeta / PSE', 'Efectivo en Salón'].includes(req.body.metodoPago)
        ? req.body.metodoPago
        : 'Nequi / Daviplata';

    try {
        const producto = await productoModel.buscarPorId(req.params.id);
        if (!producto || producto.estado !== 'Activo') {
            return res.status(404).json({ success: false, message: 'El producto no está disponible.' });
        }
        if (Number(producto.stock) < cantidad) {
            return res.status(409).json({
                success: false,
                message: Number(producto.stock) <= 0
                    ? `El producto "${producto.nombre}" ya está agotado.`
                    : `Solo quedan ${producto.stock} unidad(es) disponibles de "${producto.nombre}".`
            });
        }

        const ok = await productoModel.descontarStock(producto.id_producto, cantidad);
        if (!ok) {
            return res.status(409).json({ success: false, message: 'No hay suficiente stock disponible.' });
        }

        const actualizado = await productoModel.buscarPorId(producto.id_producto);
        const totalPagado = Number(producto.precio) * cantidad;
        const prefijo = metodoPago === 'Nequi / Daviplata' ? 'NEQ' : (metodoPago === 'Tarjeta / PSE' ? 'PSE' : 'TIENDA');
        const referencia = req.body.referenciaPago || `${prefijo}-${Math.floor(100000 + Math.random() * 900000)}`;
        const fechaHoy = new Date().toISOString().slice(0, 10);

        const idUsuario = req.usuario?.id || req.body.idUsuario || null;
        const clienteNombre = req.usuario?.nombre || req.body.clienteNombre || 'Clienta BellaStyle';

        const idCompra = await productoModel.registrarCompra({
            idUsuario,
            clienteNombre,
            idProducto: producto.id_producto,
            productoNombre: producto.nombre,
            imagen: producto.imagen || 'img/productos/shampoo-argan.jpg',
            cantidad,
            precioUnitario: Number(producto.precio),
            total: totalPagado,
            metodoPago,
            referenciaPago: referencia,
            fecha: fechaHoy
        });

        res.status(200).json({
            success: true,
            message: `¡Compra #CP-${idCompra} realizada con éxito! (${cantidad}x ${producto.nombre} por $${totalPagado.toLocaleString('es-CO')}). Stock actualizado en tiempo real: quedan ${actualizado.stock} disponibles.`,
            data: {
                id_compra: idCompra,
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                cantidad,
                total: totalPagado,
                metodo_pago: metodoPago,
                referencia,
                fecha: fechaHoy,
                stock_restante: actualizado.stock
            }
        });
    } catch (err) {
        errorServidor(res, err);
    }
}

// POST /api/carrito/comprar   Recibe: { items: [{ idProducto, cantidad }], metodoPago, referenciaPago }
// Procesa el carrito de compras con varios productos a la vez, descontando el stock en tiempo real y registrando las compras en el historial
async function comprarCarritoProductos(req, res) {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
        return res.status(400).json({ success: false, message: 'El carrito de compras está vacío. Añade al menos un producto.' });
    }

    const metodoPago = ['Nequi / Daviplata', 'Tarjeta / PSE', 'Efectivo en Salón'].includes(req.body.metodoPago)
        ? req.body.metodoPago
        : 'Nequi / Daviplata';
    const prefijo = metodoPago === 'Nequi / Daviplata' ? 'NEQ' : (metodoPago === 'Tarjeta / PSE' ? 'PSE' : 'TIENDA');
    const referencia = typeof req.body.referenciaPago === 'string' && req.body.referenciaPago.trim()
        ? req.body.referenciaPago.trim().slice(0, 40)
        : `${prefijo}-${Math.floor(100000 + Math.random() * 900000)}`;
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const idUsuario = req.usuario?.id || req.body.idUsuario || null;
    const clienteNombre = req.usuario?.nombre || req.body.clienteNombre || 'Clienta BellaStyle';

    try {
        // 1. Verificar que todos los productos del carrito tengan stock suficiente antes de descontar
        const validados = [];
        for (const item of items) {
            const cant = Math.max(1, Math.min(50, Number(item.cantidad) || 1));
            const prod = await productoModel.buscarPorId(item.idProducto || item.id_producto);
            if (!prod || prod.estado !== 'Activo') {
                return res.status(404).json({ success: false, message: 'Uno de los productos del carrito ya no está disponible.' });
            }
            if (Number(prod.stock) < cant) {
                return res.status(409).json({
                    success: false,
                    message: Number(prod.stock) <= 0
                        ? `El producto "${prod.nombre}" se agotó.`
                        : `Solo quedan ${prod.stock} unidad(es) disponibles de "${prod.nombre}". Ajusta la cantidad en tu carrito.`
                });
            }
            validados.push({ prod, cant });
        }

        // 2. Descontar stock en tiempo real y registrar cada artículo en el historial de compras de la clienta
        const comprasCreadas = [];
        let granTotal = 0;
        let totalUnidades = 0;

        for (const { prod, cant } of validados) {
            await productoModel.descontarStock(prod.id_producto, cant);
            const subtotal = Number(prod.precio) * cant;
            granTotal += subtotal;
            totalUnidades += cant;

            const idCompra = await productoModel.registrarCompra({
                idUsuario,
                clienteNombre,
                idProducto: prod.id_producto,
                productoNombre: prod.nombre,
                imagen: prod.imagen || 'img/productos/shampoo-argan.jpg',
                cantidad: cant,
                precioUnitario: Number(prod.precio),
                total: subtotal,
                metodoPago,
                referenciaPago: referencia,
                fecha: fechaHoy
            });
            comprasCreadas.push({
                id_compra: idCompra,
                id_producto: prod.id_producto,
                producto_nombre: prod.nombre,
                cantidad: cant,
                precio_unitario: Number(prod.precio),
                total: subtotal
            });
        }

        res.status(200).json({
            success: true,
            message: `¡Pedido de ${totalUnidades} producto(s) procesado con éxito por $${granTotal.toLocaleString('es-CO')} (Ref: ${referencia})! El stock se descontó en tiempo real y ya puedes ver el pedido en "Mis Compras".`,
            data: {
                referencia,
                metodo_pago: metodoPago,
                fecha: fechaHoy,
                total: granTotal,
                total_unidades: totalUnidades,
                compras: comprasCreadas
            }
        });
    } catch (err) {
        errorServidor(res, err);
    }
}

// GET /api/compras?idUsuario=5
async function listarComprasProductos(req, res) {
    try {
        const idUsuario = req.query.idUsuario || (req.usuario?.rol === 'Clienta' ? req.usuario.id : null);
        const compras = idUsuario
            ? await productoModel.listarComprasPorUsuario(idUsuario)
            : await productoModel.listarTodasLasCompras();
        res.json({ success: true, data: compras });
    } catch (err) {
        errorServidor(res, err);
    }
}

// PUT /api/compras/:id/calificar   Recibe: { calificacion: 1..5, comentario }
async function calificarCompraProducto(req, res) {
    const estrellas = Number(req.body.calificacion);
    const comentario = typeof req.body.comentario === 'string' ? req.body.comentario.trim().slice(0, 300) : '';
    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
        return res.status(400).json({ success: false, message: 'Selecciona una calificación de 1 a 5 estrellas.' });
    }
    try {
        const ok = await productoModel.calificarCompra(req.params.id, estrellas, comentario);
        if (!ok) return res.status(404).json({ success: false, message: 'No se encontró la compra.' });
        res.json({
            success: true,
            message: '¡Gracias por calificar tu producto! Tu evaluación ya es visible en tiempo real en la página de inicio.'
        });
    } catch (err) {
        errorServidor(res, err);
    }
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
    comprarProductoDirecto, comprarCarritoProductos, listarComprasProductos, calificarCompraProducto,
    estadoEstilista, serviciosEstilista, horarioEstilista,
    editarClienta, fichaTecnicaClienta
};
