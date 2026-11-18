// Página principal Landing Page (welcome.html): animaciones y catálogo detallado de servicios con sus opciones

// 1. El menú se vuelve opaco cuando se baja en la página
const menu = document.getElementById('menu');
window.addEventListener('scroll', () => {
    const abajo = window.scrollY > 40;
    menu.classList.toggle('bg-noche-950/90', abajo);
    menu.classList.toggle('backdrop-blur-md', abajo);
    menu.classList.toggle('border-white/10', abajo);
});

// 2. Los elementos con clase "revelar" aparecen cuando entran en pantalla.
const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
            const el = entrada.target;
            el.classList.add('visible');
            observador.unobserve(el);
            setTimeout(() => {
                el.style.transitionDelay = '0ms';
                el.style.transitionDuration = '300ms';
            }, 1200);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.revelar').forEach((el) => observador.observe(el));

// 3. Contador animado: sube de 0 hasta el número en un segundo
function animarNumero(elemento, final) {
    const duracion = 1000;
    const inicio = performance.now();
    function paso(ahora) {
        const avance = Math.min((ahora - inicio) / duracion, 1);
        elemento.textContent = Math.round(final * avance);
        if (avance < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
}

// 4. Carga servicios y estilistas desde la base de datos y dibuja cada servicio con sus opciones detalladas
async function cargarDatos() {
    const [servicios, estilistas, resenas] = await Promise.all([
        pedir('/servicios'),
        pedir('/estilistas'),
        pedir('/resenas')
    ]);

    const contResenas = document.getElementById('listaResenasLanding');
    if (contResenas && resenas && resenas.success && Array.isArray(resenas.data)) {
        const colores = ['bg-pastel-rosa', 'bg-pastel-lavanda', 'bg-pastel-menta', 'bg-pastel-durazno'];
        contResenas.innerHTML = resenas.data.map((r, idx) => {
            const estrellas = '★'.repeat(Number(r.calificacion) || 5);
            const bg = colores[idx % colores.length];
            return `
                <article class="tarjeta-pastel flex flex-col justify-between p-5">
                    <div>
                        <div class="flex items-center justify-between gap-2">
                            <span class="rounded-full ${bg} px-3 py-0.5 text-xs font-extrabold text-bella-900 shadow-sm">${estrellas} (${r.calificacion}.0)</span>
                            <span class="text-[11px] font-semibold text-pastel-subtinta">${escapar(r.fecha)}</span>
                        </div>
                        <p class="mt-3 text-sm font-medium italic leading-relaxed text-pastel-tinta">"${escapar(r.comentario)}"</p>
                    </div>
                    <div class="mt-4 border-t border-bella-300/60 pt-3 text-xs">
                        <p class="font-bold text-pastel-tinta">${escapar(r.cliente)}</p>
                        <p class="font-semibold text-bella-800">${escapar(r.servicio)} · Atendió: ${escapar(r.estilista)}</p>
                    </div>
                </article>`;
        }).join('');
    }

    const totales = {
        servicios: servicios.success ? servicios.data.length : 7,
        estilistas: estilistas.success ? estilistas.data.length : 3
    };

    const cifras = document.getElementById('cifras');
    if (cifras) {
        new IntersectionObserver((entradas, obs) => {
            if (!entradas[0].isIntersecting) return;
            cifras.querySelectorAll('[data-contar]').forEach((el) => {
                const clave = el.dataset.contar;
                animarNumero(el, totales[clave] ?? Number(clave));
            });
            obs.disconnect();
        }, { threshold: 0.4 }).observe(cifras);
    }

    const lista = document.getElementById('listaServicios');
    if (!servicios.success) {
        lista.innerHTML = '<p class="text-white/40">Enciende el servidor para ver los servicios.</p>';
        return;
    }

    // Dibuja cada tarjeta en tono pastel con letra oscura mostrando las opciones/sub-servicios que incluye
    lista.innerHTML = servicios.data.map((s, i) => {
        const ficha = typeof buscarDetalleServicio === 'function'
            ? buscarDetalleServicio(s.nombre, s.precio, s.duracion_min)
            : null;

        // Armamos el listado visual de las opciones que ofrece este servicio
        const bloquesOpciones = ficha
            ? ficha.grupos.map((g) => `
                <div class="mt-3">
                  <p class="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-bella-800">
                    <span>${g.icono}</span> ${escapar(g.categoria)}
                  </p>
                  <ul class="mt-1.5 space-y-1">
                    ${g.opciones.map((op) => `
                      <li class="flex items-center justify-between gap-2 rounded-lg bg-pastel-perla/75 px-2.5 py-1 text-xs font-medium text-pastel-tinta">
                        <span class="truncate">· ${escapar(op.nombre)}</span>
                        <span class="shrink-0 font-bold text-bella-800">${pesos(op.precio)}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')
            : '';

        const totalVariedades = ficha
            ? ficha.grupos.reduce((acc, g) => acc + g.opciones.length, 0)
            : 2;

        return `
            <article data-servicio-nombre="${escapar(s.nombre)}"
                     data-servicio-precio="${s.precio}"
                     data-servicio-duracion="${s.duracion_min}"
                     role="button"
                     tabindex="0"
                     class="revelar tarjeta-pastel group flex cursor-pointer flex-col justify-between p-6 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500"
                     style="transition-delay:${i * 60}ms">
                <div>
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <span class="inline-block rounded-full ${ficha ? ficha.colorPastel : 'bg-pastel-rosa'} px-2.5 py-0.5 text-[11px] font-bold text-bella-900 shadow-sm">
                                ${totalVariedades} opciones disponibles
                            </span>
                            <h3 class="mt-2 text-2xl font-bold text-pastel-tinta group-hover:text-bella-800">${escapar(s.nombre)}</h3>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-pastel-subtinta">Desde</p>
                            <p class="font-titulo text-2xl font-bold text-bella-800">${pesos(s.precio)}</p>
                        </div>
                    </div>
                    <p class="mt-1.5 text-xs font-medium text-pastel-subtinta">
                        ${ficha ? escapar(ficha.subtitulo) : 'Servicio profesional personalizado.'}
                    </p>

                    <!-- Lista detallada de opciones que ofrece este servicio -->
                    <div class="mt-2 border-t border-bella-300/60 pt-1">
                        ${bloquesOpciones}
                    </div>
                </div>

                <div class="mt-5 flex items-center justify-between border-t border-bella-300/60 pt-3.5">
                    <span class="text-xs font-semibold text-pastel-subtinta">&#9719; Base: ${s.duracion_min} min</span>
                    <span class="inline-flex items-center gap-1 rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-bella-700">
                        Ver todos los tipos &rarr;
                    </span>
                </div>
            </article>`;
    }).join('');

    lista.querySelectorAll('.revelar').forEach((el) => observador.observe(el));

    lista.querySelectorAll('article[data-servicio-nombre]').forEach((card) => {
        const abrir = () => abrirModalServicio(card.dataset.servicioNombre, {
            precio: Number(card.dataset.servicioPrecio),
            duracion: Number(card.dataset.servicioDuracion)
        });
        card.addEventListener('click', abrir);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrir();
            }
        });
    });
}

cargarDatos();
