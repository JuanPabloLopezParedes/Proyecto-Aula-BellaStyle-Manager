// Validaciones que se usan en varios controladores
const RE_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,100}$/;
const RE_USUARIO = /^[a-zA-Z0-9_.]{3,50}$/;

function nombreValido(valor) {
    return typeof valor === 'string' && RE_NOMBRE.test(valor.trim());
}

function usuarioValido(valor) {
    return typeof valor === 'string' && RE_USUARIO.test(valor.trim());
}

function passwordValida(valor) {
    return typeof valor === 'string' && valor.length >= 6;
}

// Teléfono: solo números, espacios y "+", de 7 a 20 caracteres. Ej: "300 111 2233"
function telefonoValido(valor) {
    return typeof valor === 'string' && /^[0-9 +]{7,20}$/.test(valor.trim());
}

// Correo con forma texto@dominio.ext
function emailValido(valor) {
    return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

// "Ana María López" -> { nombres: "Ana", apellidos: "María López" }
function separarNombre(nombreCompleto) {
    const partes = nombreCompleto.trim().split(/\s+/);
    const nombres = partes.shift();
    const apellidos = partes.join(' ') || '-';
    return { nombres, apellidos };
}

module.exports = { nombreValido, usuarioValido, passwordValida, telefonoValido, emailValido, separarNombre };
