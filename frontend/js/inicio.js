// Página principal Landing Page (welcome.html):
// - Catálogo de los 7 servicios y sus 35 especialidades con fotos de ejemplo
// - Galería / Portafolio con 12 ejemplos reales de trabajos hechos en el salón
// - Tienda y Vitrina de Productos con la foto real de cada producto (Shampoo de Argán, Mascarilla, Esmalte Gel, etc.)
// - Reseñas verificadas de clientas

const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
            const el = entrada.target;
            el.classList.add('visible');
            observador.unobserve(el);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.revelar').forEach((el) => observador.observe(el));

function animarNumero(elemento, final) {
    const duracion = 900;
    const inicio = performance.now();
    function paso(ahora) {
        const avance = Math.min((ahora - inicio) / duracion, 1);
        elemento.textContent = Math.round(final * avance);
        if (avance < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
}

// 1. Dibuja la Galería / Portafolio con los 12 ejemplos reales de trabajos hechos
function dibujarGaleria12(filtro = 'todos') {
    const cont = document.getElementById('grillaGaleria12');
    if (!cont || typeof GALERIA_TRABAJOS_12 === 'undefined') return;

    const lista = filtro === 'todos'
        ? GALERIA_TRABAJOS_12
        : GALERIA_TRABAJOS_12.filter((item) => {
            if (filtro === 'peinado') return item.filtro === 'peinado' || item.filtro === 'tratamiento';
            return item.filtro === filtro;
        });

    cont.innerHTML = lista.map((t) => `
        <article class="tarjeta-pastel group flex flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500">
            <div>
                <div class="relative h-52 w-full overflow-hidden bg-pastel-perla">
                    <img src="${escapar(t.imagen)}" alt="${escapar(t.titulo)}" loading="lazy"
                         class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                    <span class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-0.5 text-[11px] font-extrabold text-bella-900 shadow-sm">
                        ${escapar(t.categoria)}
                    </span>
                    <span class="absolute bottom-2.5 right-2.5 rounded-xl bg-bella-700/95 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                        ${pesos(t.precio)}
                    </span>
                </div>
                <div class="p-4 pb-2">
                    <h3 class="font-sans text-base font-bold text-pastel-tinta">${escapar(t.titulo)}</h3>
                    <p class="mt-1 text-xs leading-relaxed text-pastel-subtinta">${escapar(t.detalle)}</p>
                </div>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-bella-300/60 bg-pastel-perla/60 px-4 py-2.5">
                <span class="text-[11px] font-bold text-pastel-subtinta">✂ ${escapar(t.estilista)}</span>
                <button type="button"
                        data-gal-servicio="${escapar(t.servicioBase)}"
                        data-gal-variedad="${escapar(t.variedad)}"
                        class="rounded-xl bg-bella-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                    Ver ejemplo &rarr;
                </button>
            </div>
        </article>`).join('');

    cont.querySelectorAll('button[data-gal-servicio]').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (typeof abrirModalServicio === 'function') {
                abrirModalServicio(btn.dataset.galServicio, {
                    variedadInicial: btn.dataset.galVariedad
                });
            }
        });
    });
}

function prepararFiltrosGaleria12() {
    const barra = document.getElementById('filtrosGaleria12');
    if (!barra) return;
    barra.querySelectorAll('button[data-filtro-gal]').forEach((btn) => {
        btn.addEventListener('click', () => {
            barra.querySelectorAll('button[data-filtro-gal]').forEach((otro) => {
                const activo = otro === btn;
                otro.className = activo
                    ? 'rounded-xl bg-bella-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm'
                    : 'rounded-xl border border-bella-300/80 bg-pastel-crema px-3.5 py-1.5 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa';
            });
            dibujarGaleria12(btn.dataset.filtroGal);
        });
    });
    dibujarGaleria12('todos');
}

// 2. Dibuja la Tienda / Vitrina de Productos con la foto real de cada producto
function dibujarTiendaProductos(productos = []) {
    const cont = document.getElementById('listaTiendaProductos');
    if (!cont) return;

    if (!productos || productos.length === 0) {
        cont.innerHTML = '<p class="text-bella-100">No hay productos disponibles en este momento.</p>';
        return;
    }

    cont.innerHTML = productos.map((p) => {
        const info = typeof obtenerFichaProducto === 'function'
            ? obtenerFichaProducto(p.nombre)
            : { imagen: 'img/productos/shampoo-argan.jpg', categoria: 'Cuidado Capilar', descripcion: 'Producto profesional de salón.' };
        const disponible = Number(p.stock) > 0;

        return `
            <article class="tarjeta-pastel group flex flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500">
                <div>
                    <div class="relative h-52 w-full overflow-hidden bg-white">
                        <img src="${escapar(info.imagen)}" alt="${escapar(p.nombre)}" loading="lazy"
                             class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                        <span class="absolute left-3 top-3 rounded-full bg-pastel-menta px-3 py-0.5 text-[11px] font-extrabold text-emerald-950 shadow-sm">
                            ${escapar(info.categoria)}
                        </span>
                        <span class="absolute right-3 top-3 rounded-full ${disponible ? 'bg-emerald-700 text-white' : 'bg-stone-500 text-white'} px-2.5 py-0.5 text-[11px] font-bold shadow-sm">
                            ${disponible ? `${p.stock} disponibles` : 'Agotado'}
                        </span>
                    </div>
                    <div class="p-5 pb-3">
                        <div class="flex items-start justify-between gap-2">
                            <h3 class="font-sans text-lg font-bold text-pastel-tinta">${escapar(p.nombre)}</h3>
                            <span class="shrink-0 font-titulo text-2xl font-bold text-bella-800">${pesos(p.precio)}</span>
                        </div>
                        <p class="mt-1.5 text-xs leading-relaxed text-pastel-subtinta">${escapar(info.descripcion)}</p>
                    </div>
                </div>
                <div class="mt-2 flex items-center justify-between border-t border-bella-300/60 bg-pastel-perla/60 px-5 py-3">
                    <span class="text-[11px] font-bold text-pastel-subtinta">🧴 Garantía oficial BellaStyle</span>
                    <button type="button"
                            data-comprar-prod-id="${p.id_producto}"
                            data-comprar-prod-nombre="${escapar(p.nombre)}"
                            class="rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                        Incluir en mi cita &rarr;
                    </button>
                </div>
            </article>`;
    }).join('');

    cont.querySelectorAll('button[data-comprar-prod-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
            sessionStorage.setItem('bellaProductoPreferido', JSON.stringify({
                id_producto: btn.dataset.comprarProdId,
                nombre: btn.dataset.comprarProdNombre
            }));
            const sesion = typeof obtenerSesion === 'function' ? obtenerSesion() : null;
            window.location.href = sesion ? 'panel.html' : 'index.html?rol=cliente';
        });
    });
}

// 3. Carga servicios, productos, estilistas y reseñas desde la API
async function cargarDatos() {
    prepararFiltrosGaleria12();

    const [servicios, estilistas, resenas, productos] = await Promise.all([
        pedir('/servicios'),
        pedir('/estilistas'),
        pedir('/resenas'),
        pedir('/productos')
    ]);

    if (productos && productos.success) {
        dibujarTiendaProductos(productos.data);
    }

    const contResenas = document.getElementById('listaResenasLanding');
    if (contResenas && resenas && resenas.success && Array.isArray(resenas.data)) {
        const colores = ['bg-pastel-rosa', 'bg-pastel-lavanda', 'bg-pastel-menta', 'bg-pastel-durazno'];
        contResenas.innerHTML = resenas.data.slice(0, 4).map((r, idx) => {
            const estrellas = '★'.repeat(Number(r.calificacion) || 5);
            const bg = colores[idx % colores.length];
            return `
                <article class="tarjeta-pastel flex flex-col justify-between p-4">
                    <div>
                        <div class="flex items-center justify-between gap-2">
                            <span class="rounded-full ${bg} px-2.5 py-0.5 text-xs font-extrabold text-bella-900 shadow-sm">${estrellas} (${r.calificacion}.0)</span>
                            <span class="text-[11px] font-semibold text-pastel-subtinta">${escapar(r.fecha)}</span>
                        </div>
                        <p class="mt-2.5 text-xs font-medium italic leading-relaxed text-pastel-tinta sm:text-sm">"${escapar(r.comentario)}"</p>
                    </div>
                    <div class="mt-3 border-t border-bella-300/60 pt-2.5 text-xs">
                        <p class="font-bold text-pastel-tinta">${escapar(r.cliente)}</p>
                        <p class="font-semibold text-bella-800">${escapar(r.servicio)} · Atendió: ${escapar(r.estilista)}</p>
                    </div>
                </article>`;
        }).join('');
    }

    const totales = {
        servicios: servicios.success ? servicios.data.length : 7,
        estilistas: estilistas.success ? estilistas.data.length : 6
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
        }, { threshold: 0.3 }).observe(cifras);
    }

    const lista = document.getElementById('listaServicios');
    if (!servicios.success) {
        lista.innerHTML = '<p class="text-bella-100">Enciende el servidor para ver los servicios.</p>';
        return;
    }

    // Botones superiores para abrir cualquiera de los 7 servicios con 1 clic
    const barraRapida = document.getElementById('filtrosRapidosServicios');
    if (barraRapida) {
        barraRapida.innerHTML = servicios.data.map((s) => {
            const ficha = typeof buscarDetalleServicio === 'function' ? buscarDetalleServicio(s.nombre) : null;
            const img = (ficha && ficha.imagen) ? ficha.imagen : 'img/servicios/cat-corte.jpg';
            return `
                <button type="button"
                        data-abrir-cat="${escapar(s.nombre)}"
                        data-abrir-precio="${s.precio}"
                        data-abrir-dur="${s.duracion_min}"
                        class="inline-flex items-center gap-2 rounded-xl border border-bella-300/80 bg-pastel-crema px-3 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:border-bella-600 hover:bg-pastel-rosa">
                    <img src="${escapar(img)}" alt="" class="h-6 w-6 rounded-md object-cover">
                    <span>${escapar(s.nombre)}</span>
                </button>`;
        }).join('');
        barraRapida.querySelectorAll('button[data-abrir-cat]').forEach((btn) => {
            btn.addEventListener('click', () => {
                abrirModalServicio(btn.dataset.abrirCat, {
                    precio: Number(btn.dataset.abrirPrecio),
                    duracion: Number(btn.dataset.abrirDur)
                });
            });
        });
    }

    // Dibuja cada uno de los 7 servicios con todos sus sub-servicios e imágenes de ejemplo clicables
    lista.innerHTML = servicios.data.map((s) => {
        const ficha = typeof buscarDetalleServicio === 'function'
            ? buscarDetalleServicio(s.nombre, s.precio, s.duracion_min)
            : null;

        const bloquesOpciones = ficha
            ? ficha.grupos.map((g) => `
                <div class="mt-3">
                  <p class="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-bella-800">
                    <span>${g.icono}</span> ${escapar(g.categoria)}
                  </p>
                  <ul class="mt-1.5 space-y-1.5">
                    ${g.opciones.map((op) => `
                      <li>
                        <button type="button"
                                data-ver-subservicio="${escapar(s.nombre)}"
                                data-ver-variedad="${escapar(op.nombre)}"
                                data-ver-precio="${s.precio}"
                                data-ver-duracion="${s.duracion_min}"
                                class="flex w-full items-center justify-between gap-2 rounded-xl border border-bella-200/80 bg-white/95 p-1.5 pr-2.5 text-left text-xs font-medium text-pastel-tinta shadow-sm transition hover:border-bella-500 hover:bg-pastel-rosa/60">
                          <div class="flex min-w-0 items-center gap-2.5">
                            <img src="${escapar(op.imagen || ficha.imagen || 'img/servicios/cat-corte.jpg')}"
                                 alt="${escapar(op.nombre)}"
                                 loading="lazy"
                                 class="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-bella-300/80">
                            <div class="min-w-0">
                              <span class="block truncate font-bold text-pastel-tinta">${escapar(op.nombre)}</span>
                              <span class="block text-[10px] font-semibold text-bella-800">🔍 Ver ejemplo · ${op.duracion} min</span>
                            </div>
                          </div>
                          <span class="shrink-0 font-extrabold text-bella-900">${pesos(op.precio)}</span>
                        </button>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')
            : '';

        const totalVariedades = ficha
            ? ficha.grupos.reduce((acc, g) => acc + g.opciones.length, 0)
            : 2;

        const imgCategoria = (ficha && ficha.imagen) ? ficha.imagen : 'img/servicios/cat-corte.jpg';

        return `
            <article class="tarjeta-pastel group flex flex-col justify-between p-5 transition duration-300 hover:-translate-y-1 hover:border-bella-500">
                <div>
                    <div data-abrir-principal="${escapar(s.nombre)}"
                         data-abrir-precio="${s.precio}"
                         data-abrir-duracion="${s.duracion_min}"
                         class="relative mb-3.5 h-44 w-full cursor-pointer overflow-hidden rounded-2xl border border-bella-300/70 shadow-sm">
                        <img src="${escapar(imgCategoria)}" alt="${escapar(s.nombre)}" loading="lazy"
                             class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                        <span class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-0.5 text-[11px] font-extrabold text-bella-900 shadow-md">
                            ${totalVariedades} ejemplos con foto
                        </span>
                        <span class="absolute bottom-2.5 right-2.5 rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white">
                            🔍 Explorar ejemplos
                        </span>
                    </div>
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <h3 class="text-2xl font-bold text-pastel-tinta">${escapar(s.nombre)}</h3>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-pastel-subtinta">Desde</p>
                            <p class="font-titulo text-2xl font-bold text-bella-800">${pesos(s.precio)}</p>
                        </div>
                    </div>
                    <p class="mt-1 text-xs font-medium text-pastel-subtinta">
                        ${ficha ? escapar(ficha.subtitulo) : 'Servicio profesional personalizado.'}
                    </p>

                    <!-- Lista clicable de todas las especialidades de este servicio con su foto -->
                    <div class="mt-2.5 border-t border-bella-300/60 pt-1">
                        ${bloquesOpciones}
                    </div>
                </div>

                <div class="mt-4 flex items-center justify-between border-t border-bella-300/60 pt-3.5">
                    <span class="text-xs font-bold text-pastel-subtinta">&#9719; Base: ${s.duracion_min} min</span>
                    <button type="button"
                            data-abrir-principal="${escapar(s.nombre)}"
                            data-abrir-precio="${s.precio}"
                            data-abrir-duracion="${s.duracion_min}"
                            class="inline-flex items-center gap-1 rounded-xl bg-bella-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                        Ver todos los ejemplos &rarr;
                    </button>
                </div>
            </article>`;
    }).join('');

    // Clic en el encabezado o botón principal de la tarjeta -> abre el modal de ese servicio
    lista.querySelectorAll('[data-abrir-principal]').forEach((el) => {
        el.addEventListener('click', () => {
            abrirModalServicio(el.dataset.abrirPrincipal, {
                precio: Number(el.dataset.abrirPrecio),
                duracion: Number(el.dataset.abrirDuracion)
            });
        });
    });

    // Clic en una opción individual (ej. Corte Bob, Fade, Uñas Acrílicas) -> abre el modal con ese ejemplo ampliado
    lista.querySelectorAll('button[data-ver-subservicio]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalServicio(btn.dataset.verSubservicio, {
                precio: Number(btn.dataset.verPrecio),
                duracion: Number(btn.dataset.verDuracion),
                variedadInicial: btn.dataset.verVariedad
            });
        });
    });
}

cargarDatos();
