// Funciones compartidas por todas las páginas (API con Token de seguridad + Modo Claro/Oscuro)

const API = '/api';

// Aplica el tema guardado apenas carga el script para evitar parpadeos
(function aplicarTemaInicial() {
    const temaGuardado = localStorage.getItem('bellaTema');
    if (temaGuardado === 'claro') {
        document.documentElement.classList.add('tema-claro');
    } else {
        document.documentElement.classList.remove('tema-claro');
    }
})();

function esTemaClaro() {
    return document.documentElement.classList.contains('tema-claro');
}

function actualizarTextoBotonesTema() {
    const claro = esTemaClaro();
    document.querySelectorAll('[data-toggle-tema]').forEach((btn) => {
        btn.innerHTML = claro
            ? `<span aria-hidden="true">&#127769;</span> <span>Oscuro</span>`
            : `<span aria-hidden="true">&#9728;&#65039;</span> <span>Claro</span>`;
        btn.title = claro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro pastel';
    });
}

function alternarTemaClaroOscuro() {
    const html = document.documentElement;
    const ahoraClaro = html.classList.toggle('tema-claro');
    localStorage.setItem('bellaTema', ahoraClaro ? 'claro' : 'oscuro');
    actualizarTextoBotonesTema();
}

function inicializarBotonTema() {
    // Si la página ya tiene botones con [data-toggle-tema], los conectamos
    const existentes = document.querySelectorAll('[data-toggle-tema]');
    if (existentes.length > 0) {
        existentes.forEach((btn) => {
            if (!btn.dataset.temaListo) {
                btn.dataset.temaListo = '1';
                btn.addEventListener('click', alternarTemaClaroOscuro);
            }
        });
        actualizarTextoBotonesTema();
        return;
    }

    // Si la página no tiene un botón en su cabecera (ej. login, registro, recuperar), creamos uno flotante arriba a la derecha
    const flotante = document.createElement('button');
    flotante.type = 'button';
    flotante.setAttribute('data-toggle-tema', '1');
    flotante.dataset.temaListo = '1';
    flotante.className = 'fixed right-4 top-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-bella-300/60 bg-pastel-crema px-3.5 py-1.5 text-xs font-bold text-pastel-tinta shadow-lg transition hover:bg-pastel-rosa';
    flotante.addEventListener('click', alternarTemaClaroOscuro);
    document.body.appendChild(flotante);
    actualizarTextoBotonesTema();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarBotonTema);
} else {
    inicializarBotonTema();
}

// Sesión: se guarda el usuario (incluyendo su token firmado) en sessionStorage
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

// Hace una petición a la API enviando automáticamente el Token de seguridad en la cabecera Authorization
async function pedir(ruta, metodo = 'GET', datos = null) {
    const sesion = obtenerSesion();
    const opciones = { method: metodo, headers: {} };
    if (sesion && sesion.token) {
        opciones.headers['Authorization'] = `Bearer ${sesion.token}`;
    }
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

// Muestra un mensaje en una caja de alerta (tipo: 'error' u 'ok')
function mostrarAlerta(caja, mensaje, tipo = 'error') {
    const esPastel = caja.dataset.tema === 'pastel';
    caja.textContent = mensaje;
    caja.classList.remove('hidden', 'alerta-error', 'alerta-ok', 'alerta-pastel-error', 'alerta-pastel-ok');
    if (esPastel) {
        caja.classList.add('block', tipo === 'ok' ? 'alerta-pastel-ok' : 'alerta-pastel-error');
    } else {
        caja.classList.add('block', tipo === 'ok' ? 'alerta-ok' : 'alerta-error');
    }
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
