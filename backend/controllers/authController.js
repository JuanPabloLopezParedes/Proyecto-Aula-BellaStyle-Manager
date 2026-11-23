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

// POST /api/recuperar-password
async function recuperarPassword(req, res) {
    const { username, nuevaPassword } = req.body;

    if (!usuarioValido(username) || !passwordValida(nuevaPassword)) {
        return res.status(400).json({ success: false, message: 'Revisa el usuario y que la contraseña tenga al menos 6 caracteres.' });
    }

    try {
        const usuario = await usuarioModel.buscarPorUsername(username.trim().toLowerCase());
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'No existe una cuenta con ese usuario.' });
        }
        await usuarioModel.actualizarPassword(usuario.username, bcrypt.hashSync(nuevaPassword, 10));
        return res.json({ success: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
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

module.exports = { login, registrar, recuperarPassword, listarAdministradoras, cambiarPermisoAdministradora };
