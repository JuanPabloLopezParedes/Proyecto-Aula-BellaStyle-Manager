// Controlador de autenticación: login (con token firmado HMAC-SHA256), registro y recuperar contraseña
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const config = require('../config/config');
const usuarioModel = require('../models/usuarioModel');
const clienteModel = require('../models/clienteModel');
const estilistaModel = require('../models/estilistaModel');
const { firmarToken, verificarToken } = require('../utils/token');
const { nombreValido, usuarioValido, passwordValida, telefonoValido, emailValido, separarNombre } = require('../utils/validators');

// Nombre del rol en el frontend -> nombre del rol en la base de datos
const ROLES = {
    cliente: 'Clienta',
    estilista: 'Estilista',
    admin: 'Administradora'
};

const FOTOS = {
    Clienta: 'img/login_cliente.webp',
    Estilista: 'img/login_estilicista.webp',
    Administradora: 'img/login_admin.jpg'
};

// POST /api/login
// Recibe: { username, password, rol }
async function login(req, res) {
    const { username, password, rol } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Escribe tu usuario y contraseña.' });
    }

    try {
        const usuario = await usuarioModel.buscarPorUsername(username.trim().toLowerCase());

        // Se usa el mismo mensaje para no revelar si el usuario existe
        if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
            return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
        }

        // Una clienta no puede entrar por el portal de administradora, etc.
        if (rol && ROLES[rol] !== usuario.rol) {
            return res.status(403).json({ success: false, message: 'Esta cuenta no pertenece a este portal.' });
        }

        const token = firmarToken(usuario);

        return res.json({
            success: true,
            user: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                username: usuario.username,
                rol: usuario.rol,
                foto: usuario.foto,
                puedeCrearAdmins: Boolean(Number(usuario.puede_crear_admins)) || usuario.username === 'admin',
                token
            }
        });
    } catch (err) {
        console.error('Error en login:', err.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
}

// POST /api/register
// Registro público: SOLO permite crear cuentas de Clienta.
// Estilistas y Administradoras únicamente pueden ser creadas por una Administradora autenticada
// (y para crear otra Administradora se requiere el permiso "puede_crear_admins").
// Recibe: { rol, nombre, username, password, telefono, email, servicios, permisoAdmin }
async function registrar(req, res) {
    const { rol, nombre, password, telefono, email } = req.body;
    const username = (req.body.username || '').trim().toLowerCase();
    const servicios = Array.isArray(req.body.servicios) ? req.body.servicios : [];
    const rolBD = ROLES[rol];

    // 1. Validaciones
    if (!rolBD) {
        return res.status(400).json({ success: false, message: 'Rol no válido.' });
    }

    // 1.1 Control de quién puede crear cada tipo de cuenta
    let puedeCrearAdmins = false;
    if (rolBD !== 'Clienta') {
        const auth = req.headers.authorization || '';
        const datosToken = auth.startsWith('Bearer ') ? verificarToken(auth.slice(7).trim()) : null;
        if (!datosToken) {
            return res.status(403).json({
                success: false,
                message: 'Las cuentas de estilista y administradora solo pueden ser creadas por una administradora del salón.'
            });
        }
        const creador = await usuarioModel.buscarPorId(datosToken.id);
        if (!creador || creador.rol !== 'Administradora') {
            return res.status(403).json({ success: false, message: 'Solo una administradora puede crear cuentas de estilista o administradora.' });
        }
        if (rolBD === 'Administradora') {
            const tieneSuperposicion = Boolean(Number(creador.puede_crear_admins)) || creador.username === 'admin';
            if (!tieneSuperposicion) {
                return res.status(403).json({
                    success: false,
                    message: 'Tu cuenta de administradora no tiene superposición (permiso para crear otros administradores). Solo puedes crear todo lo demás (clientas, estilistas, servicios, productos y citas).'
                });
            }
            // Superposición / Permiso total (puede crear otras administradoras) o limitado (todo menos administradoras)
            puedeCrearAdmins = req.body.permisoAdmin === 'total' || req.body.permisoAdmin === 'superposicion';
        }
    }

    if (!nombreValido(nombre)) {
        return res.status(400).json({ success: false, message: 'El nombre solo puede tener letras y espacios.' });
    }
    if (!usuarioValido(username)) {
        return res.status(400).json({ success: false, message: 'El usuario debe tener de 3 a 50 caracteres (letras, números, punto o guion bajo).' });
    }
    if (!passwordValida(password)) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (telefono && !telefonoValido(telefono)) {
        return res.status(400).json({ success: false, message: 'El teléfono solo puede tener números y espacios (7 a 20).' });
    }
    if (email && !emailValido(email)) {
        return res.status(400).json({ success: false, message: 'El correo no es válido.' });
    }
    if (rolBD === 'Estilista' && servicios.length === 0) {
        return res.status(400).json({ success: false, message: 'Selecciona al menos un servicio que sepa realizar.' });
    }

    // 2. El usuario no puede estar repetido
    let existe;
    try {
        existe = await usuarioModel.buscarPorUsername(username);
    } catch (err) {
        console.error('Error en registro:', err.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
    if (existe) {
        return res.status(409).json({ success: false, message: 'Ese nombre de usuario ya está en uso.' });
    }

    // 3. Se guarda todo en una transacción
    const conexion = await db.getConnection();
    try {
        await conexion.beginTransaction();

        const idUsuario = await usuarioModel.crear(conexion, {
            nombre: nombre.trim(),
            username,
            passwordHash: bcrypt.hashSync(password, 10),
            rol: rolBD,
            foto: FOTOS[rolBD],
            puedeCrearAdmins
        });

        const { nombres, apellidos } = separarNombre(nombre);

        if (rolBD === 'Clienta') {
            await clienteModel.crear(conexion, { idUsuario, nombres, apellidos, telefono, email });
        }

        if (rolBD === 'Estilista') {
            const idEstilista = await estilistaModel.crear(conexion, {
                idUsuario, nombres, apellidos, especialidad: 'Estilista Profesional'
            });
            await estilistaModel.asignarServicios(conexion, idEstilista, servicios);
        }

        await conexion.commit();
        const mensajeOk = rolBD === 'Clienta'
            ? 'Cuenta creada. Ya puedes iniciar sesión.'
            : `Cuenta de ${rolBD.toLowerCase()} creada correctamente.${rolBD === 'Administradora' ? (puedeCrearAdmins ? ' Nivel asignado: Superposición / Permiso Total (puede crear otros administradores y gestionar todo).' : ' Nivel asignado: Estándar / Sin superposición (puede crear y gestionar todo menos otros administradores).') : ''}`;
        return res.status(201).json({ success: true, message: mensajeOk });
    } catch (err) {
        await conexion.rollback();
        console.error('Error en registro:', err.message);
        return res.status(500).json({ success: false, message: 'No se pudo crear la cuenta.' });
    } finally {
        conexion.release();
    }
}

// Almacén en memoria de códigos temporales OTP de 6 dígitos para recuperación segura (expiran en 5 min, máx 3 intentos)
const codigosRecuperacionOTP = new Map();

function limpiarTelefono(tel) {
    return String(tel || '').replace(/\D+/g, '');
}

// POST /api/recuperar-password/solicitar-codigo
// Paso 1: Verifica que coincidan EXACTAMENTE los 3 datos (Usuario + Correo electrónico + Teléfono)
// y solo permite auto-recuperación para cuentas de Clienta (Administradoras y Estilistas están protegidas).
async function solicitarCodigoRecuperacion(req, res) {
    const { username, email, telefono } = req.body;

    if (!usuarioValido(username) || !email || !telefono) {
        return res.status(400).json({
            success: false,
            message: 'Debes ingresar tu usuario, correo electrónico registrado y teléfono registrado.'
        });
    }

    const userKey = username.trim().toLowerCase();
    const emailLimpio = String(email).trim().toLowerCase();
    const telLimpio = limpiarTelefono(telefono);

    // Verificar si está bloqueado temporalmente por exceso de intentos fallidos
    const registroPrevio = codigosRecuperacionOTP.get(userKey);
    if (registroPrevio && registroPrevio.bloqueadoHasta && Date.now() < registroPrevio.bloqueadoHasta) {
        const segRestantes = Math.ceil((registroPrevio.bloqueadoHasta - Date.now()) / 1000);
        return res.status(429).json({
            success: false,
            message: `Cuenta protegida temporalmente por intentos fallidos. Intenta de nuevo en ${segRestantes} segundos.`
        });
    }

    try {
        const usuario = await usuarioModel.buscarPorUsername(userKey);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Los datos de verificación (usuario, correo o teléfono) no coinciden con ninguna cuenta registrada.'
            });
        }

        // Protección de cuentas privilegiadas: Administradoras y Estilistas no pueden ser restablecidas desde el formulario público
        if (usuario.rol !== 'Clienta') {
            return res.status(403).json({
                success: false,
                message: `Por seguridad del salón, las cuentas de ${usuario.rol} están blindadas y solo pueden ser restablecidas por la Administradora Principal desde el panel interno.`
            });
        }

        const fichaClienta = await clienteModel.buscarPorUsuario(usuario.id_usuario);
        const emailRegistrado = fichaClienta && fichaClienta.email ? String(fichaClienta.email).trim().toLowerCase() : '';
        const telRegistrado = fichaClienta && fichaClienta.telefono ? limpiarTelefono(fichaClienta.telefono) : '';

        if (!fichaClienta || !emailRegistrado || !telRegistrado || emailRegistrado !== emailLimpio || telRegistrado !== telLimpio) {
            const intentos = (registroPrevio ? registroPrevio.intentosIdentidad || 0 : 0) + 1;
            const bloqueadoHasta = intentos >= 3 ? Date.now() + 2 * 60 * 1000 : null;
            codigosRecuperacionOTP.set(userKey, {
                ...(registroPrevio || {}),
                intentosIdentidad: intentos >= 3 ? 0 : intentos,
                bloqueadoHasta
            });
            return res.status(401).json({
                success: false,
                message: bloqueadoHasta
                    ? 'Se superaron los 3 intentos de verificación. Por seguridad se bloqueó temporalmente la solicitud durante 2 minutos.'
                    : `Los 3 datos (usuario, correo y teléfono) no coinciden exactamente con los registrados en la cuenta. Intento ${intentos} de 3.`
            });
        }

        // Generar código OTP aleatorio de 6 dígitos con validez de 5 minutos
        const codigoOTP = String(Math.floor(100000 + Math.random() * 900000));
        const expiraEn = Date.now() + 5 * 60 * 1000;

        codigosRecuperacionOTP.set(userKey, {
            codigo: codigoOTP,
            expiraEn,
            intentosCodigo: 0,
            intentosIdentidad: 0,
            bloqueadoHasta: null
        });

        // Enmascarar correo para el mensaje informativo
        const [parteLocal, dominio] = emailRegistrado.split('@');
        const correoMascara = `${parteLocal.slice(0, 2)}***@${dominio || 'correo.com'}`;

        return res.json({
            success: true,
            message: `✓ Triple verificación exitosa para ${correoMascara}. Ingresa el código de seguridad de 6 dígitos (válido por 5 minutos).`,
            codigoSimulado: codigoOTP,
            expiraSegundos: 300
        });
    } catch (err) {
        console.error('Error al solicitar código OTP:', err.message);
        return res.status(500).json({ success: false, message: 'Error interno al verificar la identidad.' });
    }
}

// POST /api/recuperar-password
// Paso 2: Valida el código OTP de 6 dígitos (máx 3 intentos, expira en 5 min) y actualiza la contraseña
async function recuperarPassword(req, res) {
    const { username, codigoOtp, nuevaPassword } = req.body;

    if (!usuarioValido(username) || !passwordValida(nuevaPassword)) {
        return res.status(400).json({ success: false, message: 'Revisa el usuario y que la contraseña tenga al menos 6 caracteres.' });
    }

    if (!codigoOtp || !/^\d{6}$/.test(String(codigoOtp).trim())) {
        return res.status(400).json({
            success: false,
            message: 'Debes ingresar el código de seguridad OTP de 6 dígitos generado en el Paso 1.'
        });
    }

    const userKey = username.trim().toLowerCase();
    const registroOTP = codigosRecuperacionOTP.get(userKey);

    if (!registroOTP || !registroOTP.codigo) {
        return res.status(400).json({
            success: false,
            message: 'Primero debes completar la triple verificación (Usuario + Correo + Teléfono) para generar tu código de 6 dígitos.'
        });
    }

    if (registroOTP.bloqueadoHasta && Date.now() < registroOTP.bloqueadoHasta) {
        const segRestantes = Math.ceil((registroOTP.bloqueadoHasta - Date.now()) / 1000);
        return res.status(429).json({
            success: false,
            message: `Demasiados intentos fallidos. Espera ${segRestantes} segundos y solicita un nuevo código.`
        });
    }

    if (Date.now() > registroOTP.expiraEn) {
        codigosRecuperacionOTP.delete(userKey);
        return res.status(410).json({
            success: false,
            message: 'El código de seguridad de 6 dígitos expiró (límite de 5 minutos). Solicita uno nuevo.'
        });
    }

    if (String(codigoOtp).trim() !== registroOTP.codigo) {
        registroOTP.intentosCodigo = (registroOTP.intentosCodigo || 0) + 1;
        if (registroOTP.intentosCodigo >= 3) {
            codigosRecuperacionOTP.set(userKey, {
                codigo: null,
                bloqueadoHasta: Date.now() + 2 * 60 * 1000
            });
            return res.status(401).json({
                success: false,
                message: 'Código incorrecto 3 veces seguidas. El código fue anulado por seguridad.'
            });
        }
        return res.status(401).json({
            success: false,
            message: `Código de 6 dígitos incorrecto. Te quedan ${3 - registroOTP.intentosCodigo} intento(s).`
        });
    }

    try {
        const usuario = await usuarioModel.buscarPorUsername(userKey);
        if (!usuario || usuario.rol !== 'Clienta') {
            return res.status(404).json({ success: false, message: 'No se pudo validar la cuenta.' });
        }
        await usuarioModel.actualizarPassword(usuario.username, bcrypt.hashSync(nuevaPassword, 10));
        codigosRecuperacionOTP.delete(userKey);
        return res.json({
            success: true,
            message: '🔒 Contraseña actualizada con verificación de doble paso (OTP). Ya puedes iniciar sesión.'
        });
    } catch (err) {
        console.error('Error al recuperar contraseña:', err.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
}

// GET /api/administradoras (lista las cuentas de administradora y su nivel de superposición)
async function listarAdministradoras(req, res) {
    try {
        const lista = await usuarioModel.listarAdministradoras();
        return res.json({ success: true, data: lista });
    } catch (err) {
        console.error('Error al listar administradoras:', err.message);
        return res.status(500).json({ success: false, message: 'No se pudo cargar la lista de administradoras.' });
    }
}

// PUT /api/administradoras/:id/permiso (cambia si una administradora tiene superposición o permiso estándar)
async function cambiarPermisoAdministradora(req, res) {
    try {
        const auth = req.headers.authorization || '';
        const datosToken = auth.startsWith('Bearer ') ? verificarToken(auth.slice(7).trim()) : null;
        if (!datosToken) {
            return res.status(401).json({ success: false, message: 'Debes iniciar sesión.' });
        }
        const creador = await usuarioModel.buscarPorId(datosToken.id);
        const tieneSuperposicion = creador && creador.rol === 'Administradora' && (Boolean(Number(creador.puede_crear_admins)) || creador.username === 'admin');
        if (!tieneSuperposicion) {
            return res.status(403).json({
                success: false,
                message: 'Solo un administrador con superposición puede cambiar el nivel de otros administradores.'
            });
        }

        const objetivo = await usuarioModel.buscarPorId(req.params.id);
        if (!objetivo || objetivo.rol !== 'Administradora') {
            return res.status(404).json({ success: false, message: 'La cuenta de administradora no existe.' });
        }
        if (objetivo.username === 'admin') {
            return res.status(400).json({ success: false, message: 'La cuenta principal (admin) siempre conserva la superposición principal.' });
        }

        const nuevoPermiso = Boolean(req.body.puedeCrearAdmins);
        await usuarioModel.cambiarPermisoAdmin(req.params.id, nuevoPermiso);
        return res.json({
            success: true,
            message: nuevoPermiso
                ? `Se otorgó Superposición a ${objetivo.nombre}: ahora también puede crear otros administradores.`
                : `Se cambió ${objetivo.nombre} a Administrador Estándar: puede gestionar y crear todo menos otros administradores.`
        });
    } catch (err) {
        console.error('Error al cambiar permiso de administradora:', err.message);
        return res.status(500).json({ success: false, message: 'No se pudo actualizar el permiso.' });
    }
}

module.exports = { login, registrar, solicitarCodigoRecuperacion, recuperarPassword, listarAdministradoras, cambiarPermisoAdministradora };
