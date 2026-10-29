// Modo claro / oscuro.
// Se carga en el <head> de cada página para aplicar el tema antes de dibujar
// (así la página no "parpadea" en blanco). El tema escogido se guarda en el navegador.

const ICONO_LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICONO_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

function temaGuardado() {
    try { return localStorage.getItem('tema'); } catch (e) { return null; }
}

function aplicarTema(tema) {
    document.documentElement.classList.toggle('oscuro', tema === 'oscuro');
}

// 1) Apenas carga: aplica el tema guardado (por defecto, claro)
aplicarTema(temaGuardado());

// 2) Cuando la página termina de cargar: crea el botón flotante
document.addEventListener('DOMContentLoaded', () => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn-tema';

    function actualizarBoton() {
        const oscuro = document.documentElement.classList.contains('oscuro');
        // Ícono + texto para que se entienda qué hace
        boton.innerHTML = oscuro ? ICONO_SOL + '<span>Modo claro</span>' : ICONO_LUNA + '<span>Modo oscuro</span>';
        boton.title = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        boton.setAttribute('aria-label', boton.title);
    }

    boton.addEventListener('click', () => {
        const nuevo = document.documentElement.classList.contains('oscuro') ? 'claro' : 'oscuro';
        aplicarTema(nuevo);
        try { localStorage.setItem('tema', nuevo); } catch (e) { /* sin guardado, igual cambia */ }
        actualizarBoton();
        pausarVideoSegunTema();
    });

    actualizarBoton();
    document.body.appendChild(boton);
    crearVideoDeFondo();
});

// Videos de fondo: uno para el modo claro y otro para el oscuro (9 s que se repiten sin corte).
// Cada uno va en dos formatos, WebM y MP4: el navegador usa el primero que pueda reproducir.
// muted + playsinline son obligatorios para que el celular los reproduzca solos.
function htmlVideo(clase, nombre) {
    return `<div class="fondo-video ${clase}" aria-hidden="true">
        <video muted loop playsinline preload="none" poster="img/${nombre}.webp">
            <source src="img/${nombre}.webm" type="video/webm">
            <source src="img/${nombre}.mp4" type="video/mp4">
        </video></div>`;
}

function crearVideoDeFondo() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Las páginas con data-sin-video (el panel) usan la imagen quieta: el video distrae al trabajar
    if (document.body.hasAttribute('data-sin-video')) return;
    document.body.insertAdjacentHTML('afterbegin',
        htmlVideo('fondo-video-claro', 'fondo') + htmlVideo('fondo-video-oscuro', 'fondo-oscuro'));
    pausarVideoSegunTema();
}

// Reproduce solo el video del tema actual y pausa el otro (así no se gasta batería ni datos)
function pausarVideoSegunTema() {
    const oscuro = document.documentElement.classList.contains('oscuro');
    const activo = document.querySelector(oscuro ? '.fondo-video-oscuro video' : '.fondo-video-claro video');
    const otro = document.querySelector(oscuro ? '.fondo-video-claro video' : '.fondo-video-oscuro video');
    if (!activo) return;
    if (otro) otro.pause();
    activo.preload = 'auto';
    activo.play().catch(() => { /* el navegador no dejó reproducir: queda la imagen */ });
}
