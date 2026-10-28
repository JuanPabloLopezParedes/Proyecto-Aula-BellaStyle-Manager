// Funciones compartidas por todas las páginas

// El mismo servidor sirve las páginas y la API, por eso basta con "/api"
const API = '/api';

// Hace una petición a la API y devuelve la respuesta en JSON.
// Si el servidor no responde, devuelve un mensaje de error.
async function pedir(ruta, metodo = 'GET', datos = null) {
    const opciones = { method: metodo, headers: {} };
    if (datos) {
        opciones.headers['Content-Type'] = 'application/json';
        opciones.body = JSON.stringify(datos);
    }
    try {
        const respuesta = await fetch(API + ruta, opciones);
        return await respuesta.json();
    } catch (err) {
        return { success: false, message: 'No hay conexión con el servidor. ¿Está encendido?' };
    }
}

// Sesión: se guarda el usuario en sessionStorage (se borra al cerrar la pestaña)
function guardarSesion(usuario) {
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
}

function obtenerSesion() {
    const texto = sessionStorage.getItem('usuario');
    return texto ? JSON.parse(texto) : null;
}

function cerrarSesion() {
    sessionStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

// Muestra un mensaje en una caja de alerta (tipo: 'error' u 'ok')
function mostrarAlerta(caja, mensaje, tipo = 'error') {
    caja.textContent = mensaje;
    caja.classList.remove('hidden', 'alerta-error', 'alerta-ok');
    caja.classList.add('block', tipo === 'ok' ? 'alerta-ok' : 'alerta-error');
}

function ocultarAlerta(caja) {
    caja.classList.add('hidden');
    caja.classList.remove('block');
}

// Evita que un texto con etiquetas HTML se ejecute al mostrarlo en la tabla
function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

// 35000 -> "$35.000"
function pesos(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

// Datos de cada rol para las pantallas de login y registro
const ROLES = {
    cliente: {
        titulo: 'Clienta',
        pregunta: '¿Eres clienta?',
        descripcion: 'Agenda tus citas y revisa tu historial.',
        imagen: 'img/login_cliente.webp'
    },
    estilista: {
        titulo: 'Estilista',
        pregunta: '¿Eres estilista?',
        descripcion: 'Consulta las citas que te asignaron.',
        imagen: 'img/login_estilicista.webp'
    },
    admin: {
        titulo: 'Administradora',
        pregunta: '¿Eres administradora?',
        descripcion: 'Gestiona el salón, el equipo y las citas.',
        imagen: 'img/login_admin.jpg'
    }
};
