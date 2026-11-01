// Utilidad de seguridad: generación y verificación de tokens firmados (HMAC-SHA256)
// Protege las rutas del backend sin requerir dependencias externas pesadas.
const crypto = require('crypto');

const SECRETO = process.env.JWT_SECRET || 'BellaStyle_Clave_Secreta_2026_Seguridad';
const DURACION_MS = 12 * 60 * 60 * 1000; // 12 horas

function base64UrlEncode(texto) {
    return Buffer.from(texto, 'utf8')
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(b64) {
    const normalizado = b64.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalizado, 'base64').toString('utf8');
}

function firmarToken(usuario) {
    const payload = {
        id: usuario.id_usuario || usuario.id,
        rol: usuario.rol,
        nombre: usuario.nombre,
        exp: Date.now() + DURACION_MS
    };
    const cuerpo = base64UrlEncode(JSON.stringify(payload));
    const firma = crypto
        .createHmac('sha256', SECRETO)
        .update(cuerpo)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${cuerpo}.${firma}`;
}

function verificarToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [cuerpo, firmaRecibida] = token.split('.');
    const firmaEsperada = crypto
        .createHmac('sha256', SECRETO)
        .update(cuerpo)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    if (firmaRecibida !== firmaEsperada) return null;
    try {
        const datos = JSON.parse(base64UrlDecode(cuerpo));
        if (!datos.exp || Date.now() > datos.exp) return null;
        return datos;
    } catch (_) {
        return null;
    }
}

// Middleware opcional/flexible: si viene cabecera Authorization: Bearer <token>,
// valida que el token sea legítimo y que el rol esté autorizado.
function protegerRuta(rolesPermitidos = []) {
    return (req, res, next) => {
        const auth = req.headers.authorization || '';
        if (auth.startsWith('Bearer ')) {
            const token = auth.slice(7).trim();
            const usuarioToken = verificarToken(token);
            if (!usuarioToken) {
                return res.status(401).json({ success: false, message: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
            }
            if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuarioToken.rol)) {
                return res.status(403).json({ success: false, message: 'No tienes permisos para realizar esta acción.' });
            }
            req.usuario = usuarioToken;
        }
        next();
    };
}

module.exports = { firmarToken, verificarToken, protegerRuta };
