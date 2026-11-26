// Controlador visual de la Landing Page (welcome.html) y de las 3 páginas dedicadas:
// 1. welcome.html: Muestra 3 Carruseles interactivos (Servicios, Galería de Trabajos y Tienda de Productos)
//    que al hacer clic transportan a su respectiva página dedicada.
// 2. servicios.html: Página completa "Servicios que hacemos" con texto descriptivo y todos los servicios + ejemplos reales.
// 3. galeria.html: Página completa "Galería y Portafolio de Trabajos" con filtros por categoría y vista detallada.
// 4. tienda.html: Página completa "Tienda Oficial de Productos" con buscador, fotos reales y compra/agendamiento con popup.

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

// Genera partículas luminosas de polvillo mágico en la portada de welcome.html
function iniciarPolvilloMagicoPortada() {
    const panelHero = document.getElementById('heroPanelPolvillo');
    if (!panelHero) return;

    const totalParticulas = 34;
    for (let i = 0; i < totalParticulas; i++) {
        const chispa = document.createElement('span');
        chispa.className = 'particula-polvillo';
        const tamano = (Math.random() * 4.5 + 2.2).toFixed(1);
        const posLeft = (Math.random() * 94 + 3).toFixed(1);
        const posTop = (Math.random() * 88 + 6).toFixed(1);
        const duracion = (Math.random() * 2.2 + 1.9).toFixed(2);
        const retraso = (Math.random() * 1.4).toFixed(2);

        chispa.style.width = `${tamano}px`;
        chispa.style.height = `${tamano}px`;
        chispa.style.left = `${posLeft}%`;
        chispa.style.top = `${posTop}%`;
        chispa.style.setProperty('--dur-polvo', `${duracion}s`);
        chispa.style.setProperty('--delay-polvo', `${retraso}s`);
        panelHero.appendChild(chispa);
    }
}

iniciarPolvilloMagicoPortada();

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

// Conecta los botones de flecha (anterior / siguiente) y desplazamiento suave de cualquier carrusel
function conectarBotonesCarrusel(idPista, idBtnPrev, idBtnNext) {
    const pista = document.getElementById(idPista);
    const btnPrev = document.getElementById(idBtnPrev);
    const btnNext = document.getElementById(idBtnNext);
    if (!pista) return;

    const paso = () => Math.max(280, Math.round(pista.clientWidth * 0.78));

    btnPrev?.addEventListener('click', () => {
        if (pista.scrollLeft <= 10) {
            pista.scrollTo({ left: pista.scrollWidth, behavior: 'smooth' });
        } else {
            pista.scrollBy({ left: -paso(), behavior: 'smooth' });
        }
    });

    btnNext?.addEventListener('click', () => {
        if (pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 15) {
            pista.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            pista.scrollBy({ left: paso(), behavior: 'smooth' });
        }
    });
}

// =========================================================================
// A. CARRUSELES DE LA LANDING PAGE (welcome.html)
// =========================================================================

// 1. Carrusel de Servicios en la portada: muestra cada servicio principal limpio (ej. solo "Corte de Cabello", "Manicure", etc.)
//    y al presionarlo transporta a servicios.html
function dibujarCarruselServiciosLanding(servicios = []) {
    const pista = document.getElementById('carruselServiciosLanding');
    if (!pista) return;

    if (!servicios || servicios.length === 0) {
        pista.innerHTML = '<p class="text-bella-100">No hay servicios disponibles.</p>';
        return;
    }

    pista.innerHTML = servicios.map((s) => {
        const ficha = typeof buscarDetalleServicio === 'function'
            ? buscarDetalleServicio(s, s.precio, s.duracion_min)
            : null;
        const img = s.imagen || (ficha && ficha.imagen) || 'img/servicios/cat-corte.jpg';
        const subtitulo = s.subtitulo || (ficha && ficha.subtitulo) || 'Atención profesional personalizada en nuestro salón.';
        const totalEjemplos = ficha
            ? ficha.grupos.reduce((acc, g) => acc + g.opciones.length, 0)
            : 4;
        const urlDestino = `servicios.html?servicio=${encodeURIComponent(s.nombre)}`;

        return `
            <a href="${urlDestino}"
               class="tarjeta-pastel group flex w-[18.5rem] shrink-0 snap-start flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500 sm:w-[21rem]">
                <div>
                    <div class="relative h-52 w-full overflow-hidden bg-pastel-perla">
                        <img src="${escapar(img)}" alt="${escapar(s.nombre)}" loading="lazy"
                             class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                        <span class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-0.5 text-[11px] font-extrabold text-bella-900 shadow-sm">
                            ${totalEjemplos} estilos y ejemplos
                        </span>
                        <span class="absolute bottom-2.5 right-2.5 rounded-xl bg-bella-700/95 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
                            Desde ${pesos(s.precio)}
                        </span>
                    </div>
                    <div class="p-5 pb-3">
                        <h3 class="font-titulo text-2xl font-bold text-pastel-tinta">${escapar(s.nombre)}</h3>
                        <p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-pastel-subtinta">${escapar(subtitulo)}</p>
                    </div>
                </div>
                <div class="mt-2 flex items-center justify-between border-t border-bella-300/60 bg-pastel-perla/60 px-5 py-3">
                    <span class="text-xs font-bold text-pastel-subtinta">&#9719; ${s.duracion_min} min aprox.</span>
                    <span class="rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-bella-700">
                        Ver servicio &rarr;
                    </span>
                </div>
            </a>`;
    }).join('');

    conectarBotonesCarrusel('carruselServiciosLanding', 'btnPrevServicios', 'btnNextServicios');
}

// 2. Carrusel de Galería en la portada: muestra los trabajos realizados y al presionar cualquiera transporta a galeria.html
function dibujarCarruselGaleriaLanding() {
    const pista = document.getElementById('carruselGaleriaLanding');
    if (!pista || typeof GALERIA_TRABAJOS_12 === 'undefined') return;

    const lista = typeof window.obtenerTrabajosGaleriaCompleta === 'function'
        ? window.obtenerTrabajosGaleriaCompleta()
        : GALERIA_TRABAJOS_12;

    pista.innerHTML = lista.map((t) => {
        const urlDestino = `galeria.html?filtro=${encodeURIComponent(t.filtro)}&trabajo=${encodeURIComponent(t.id)}`;
        return `
            <a href="${urlDestino}"
               class="tarjeta-pastel group flex w-[18.5rem] shrink-0 snap-start flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500 sm:w-[20.5rem]">
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
                        <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-pastel-subtinta">${escapar(t.detalle)}</p>
                    </div>
                </div>
                <div class="mt-3 flex items-center justify-between border-t border-bella-300/60 bg-pastel-perla/60 px-4 py-2.5">
                    <span class="text-[11px] font-bold text-pastel-subtinta">✂ ${escapar(t.estilista)}</span>
                    <span class="rounded-xl bg-bella-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-bella-700">
                        Ver en galería &rarr;
                    </span>
                </div>
            </a>`;
    }).join('');

    conectarBotonesCarrusel('carruselGaleriaLanding', 'btnPrevGaleria', 'btnNextGaleria');
}

// 3. Carrusel de Tienda en la portada: muestra los productos con foto y al presionar cualquiera transporta a tienda.html
function dibujarCarruselTiendaLanding(productos = []) {
    const pista = document.getElementById('carruselTiendaLanding');
    if (!pista) return;

    if (!productos || productos.length === 0) {
        pista.innerHTML = '<p class="text-bella-100">No hay productos disponibles en este momento.</p>';
        return;
    }

    pista.innerHTML = productos.map((p) => {
        const info = typeof obtenerFichaProducto === 'function'
            ? obtenerFichaProducto(p)
            : { imagen: p.imagen || 'img/productos/shampoo-argan.jpg', categoria: p.categoria || 'Cuidado Capilar', descripcion: p.descripcion || 'Producto profesional de salón.' };
        const disponible = Number(p.stock) > 0;
        const urlDestino = `tienda.html?producto=${encodeURIComponent(p.id_producto)}`;

        return `
            <a href="${urlDestino}"
               class="tarjeta-pastel group flex w-[18.5rem] shrink-0 snap-start flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500 sm:w-[20.5rem]">
                <div>
                    <div class="relative h-52 w-full overflow-hidden bg-white">
                        <img src="${escapar(info.imagen)}" alt="${escapar(p.nombre)}" loading="lazy"
                             class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                        <span class="absolute left-3 top-3 rounded-full bg-pastel-menta px-3 py-0.5 text-[11px] font-extrabold text-emerald-950 shadow-sm">
                            ${escapar(info.categoria)}
                        </span>
                        <span data-stock-badge="${p.id_producto}" class="absolute right-3 top-3 rounded-full ${disponible ? 'bg-emerald-700 text-white' : 'bg-stone-500 text-white'} px-2.5 py-0.5 text-[11px] font-bold shadow-sm">
                            ${disponible ? `${p.stock} disp.` : 'Agotado'}
                        </span>
                    </div>
                    <div class="p-5 pb-3">
                        <div class="flex items-start justify-between gap-2">
                            <h3 class="font-sans text-lg font-bold text-pastel-tinta">${escapar(p.nombre)}</h3>
                            <span class="shrink-0 font-titulo text-2xl font-bold text-bella-800">${pesos(p.precio)}</span>
                        </div>
                        <p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-pastel-subtinta">${escapar(info.descripcion)}</p>
                    </div>
                </div>
                <div class="mt-2 flex items-center justify-between border-t border-bella-300/60 bg-pastel-perla/60 px-5 py-3">
                    <span class="text-[11px] font-bold text-pastel-subtinta">🧴 Tienda BellaStyle</span>
                    <span class="rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition group-hover:bg-bella-700">
                        Ver en tienda &rarr;
                    </span>
                </div>
            </a>`;
    }).join('');

    conectarBotonesCarrusel('carruselTiendaLanding', 'btnPrevTienda', 'btnNextTienda');
}

// =========================================================================
// B. PÁGINAS DEDICADAS (servicios.html, galeria.html y tienda.html)
// =========================================================================

// 1. Página dedicada servicios.html: muestra todos los servicios con sus ejemplos detallados
function dibujarPaginaServiciosCompleta(servicios = []) {
    const lista = document.getElementById('listaServicios');
    if (!lista) return;

    if (!servicios || servicios.length === 0) {
        lista.innerHTML = '<p class="text-bella-100">Enciende el servidor para ver los servicios.</p>';
        return;
    }

    const barraRapida = document.getElementById('filtrosRapidosServicios');
    if (barraRapida) {
        barraRapida.innerHTML =
            `<button type="button" data-filtrar-srv="todos" class="inline-flex items-center gap-2 rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition">
                Todos los servicios (${servicios.length})
            </button>` +
            servicios.map((s) => {
                const ficha = typeof buscarDetalleServicio === 'function' ? buscarDetalleServicio(s) : null;
                const img = s.imagen || (ficha && ficha.imagen) || 'img/servicios/cat-corte.jpg';
                return `
                    <button type="button"
                            data-filtrar-srv="${escapar(s.nombre)}"
                            class="inline-flex items-center gap-2 rounded-xl border border-bella-300/80 bg-pastel-crema px-3 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:border-bella-600 hover:bg-pastel-rosa">
                        <img src="${escapar(img)}" alt="" class="h-6 w-6 rounded-md object-cover">
                        <span>${escapar(s.nombre)}</span>
                    </button>`;
            }).join('');
    }

    const renderizarTarjetasServicios = (filtroNombre = 'todos') => {
        const filtrados = filtroNombre === 'todos'
            ? servicios
            : servicios.filter((s) => s.nombre.toLowerCase() === filtroNombre.toLowerCase());

        const esVistaIndividual = filtroNombre !== 'todos' && filtrados.length === 1;

        lista.innerHTML = filtrados.map((s) => {
            const ficha = typeof buscarDetalleServicio === 'function'
                ? buscarDetalleServicio(s, s.precio, s.duracion_min)
                : null;

            const todasLasOpciones = ficha && Array.isArray(ficha.grupos)
                ? ficha.grupos.flatMap((g) => (g.opciones || []).map((op) => ({ ...op, categoriaGrupo: g.categoria, iconoGrupo: g.icono })))
                : [];

            const totalVariedades = todasLasOpciones.length || 2;
            const imgCategoria = s.imagen || (ficha && ficha.imagen) || 'img/servicios/cat-corte.jpg';
            const subtituloLimpio = (s.subtitulo || (ficha && ficha.subtitulo) || 'Procedimiento profesional personalizado con diagnóstico incluido.');

            // Tomamos máximo 3 estilos destacados para mostrar como vista previa limpia y uniforme sin saturar la tarjeta
            const previewOpciones = todasLasOpciones.slice(0, 3);
            const restantes = Math.max(0, totalVariedades - previewOpciones.length);

            const htmlPreviewCompacta = previewOpciones.length > 0
                ? `
                    <div class="mt-4 rounded-2xl border border-bella-300/60 bg-white/85 p-3 shadow-inner">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-[11px] font-extrabold uppercase tracking-wider text-bella-900">✨ Estilos destacados</span>
                            <button type="button"
                                    data-abrir-principal="${escapar(s.nombre)}"
                                    data-abrir-precio="${s.precio}"
                                    data-abrir-duracion="${s.duracion_min}"
                                    class="text-[11px] font-extrabold text-bella-700 underline-offset-2 hover:underline">
                                Ver los ${totalVariedades} ejemplos &rarr;
                            </button>
                        </div>
                        <div class="mt-2.5 grid grid-cols-3 gap-2">
                            ${previewOpciones.map((op) => `
                                <button type="button"
                                        data-ver-subservicio="${escapar(s.nombre)}"
                                        data-ver-variedad="${escapar(op.nombre)}"
                                        data-ver-precio="${s.precio}"
                                        data-ver-duracion="${s.duracion_min}"
                                        class="group/item flex flex-col items-center rounded-xl border border-bella-200/80 bg-pastel-crema/60 p-1.5 text-center transition hover:border-bella-500 hover:bg-pastel-rosa/70">
                                    <div class="h-14 w-full overflow-hidden rounded-lg bg-white">
                                        <img src="${escapar(op.imagen || imgCategoria)}"
                                             alt="${escapar(op.nombre)}"
                                             loading="lazy"
                                             class="h-full w-full object-cover transition duration-300 group-hover/item:scale-110">
                                    </div>
                                    <span class="mt-1.5 line-clamp-1 w-full text-[11px] font-bold text-pastel-tinta">${escapar(op.nombre)}</span>
                                    <span class="text-[10px] font-extrabold text-bella-800">${pesos(op.precio)}</span>
                                </button>
                            `).join('')}
                        </div>
                        ${restantes > 0 ? `
                            <button type="button"
                                    data-abrir-principal="${escapar(s.nombre)}"
                                    data-abrir-precio="${s.precio}"
                                    data-abrir-duracion="${s.duracion_min}"
                                    class="mt-2 w-full rounded-xl bg-pastel-lavanda/75 py-1.5 text-center text-[11px] font-extrabold text-bella-900 transition hover:bg-pastel-rosa">
                                + ${restantes} estilos adicionales disponibles en este servicio
                            </button>
                        ` : ''}
                    </div>`
                : '';

            return `
                <article class="tarjeta-pastel group flex h-full flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500 ${esVistaIndividual ? 'sm:col-span-2 lg:col-span-3' : ''}">
                    <div>
                        <!-- Cabecera fotográfica uniforme (misma altura en todas las tarjetas) -->
                        <div data-abrir-principal="${escapar(s.nombre)}"
                             data-abrir-precio="${s.precio}"
                             data-abrir-duracion="${s.duracion_min}"
                             class="relative h-56 w-full cursor-pointer overflow-hidden bg-pastel-perla">
                            <img src="${escapar(imgCategoria)}" alt="${escapar(s.nombre)}" loading="lazy"
                                 class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"></div>
                            <span class="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-bella-900 shadow-md">
                                &#10022; ${totalVariedades} estilos con foto
                            </span>
                            <span class="absolute right-3.5 top-3.5 rounded-full bg-noche-950/80 px-2.5 py-1 text-[11px] font-bold text-bella-100 backdrop-blur-sm">
                                &#9719; ${s.duracion_min} min
                            </span>
                            <div class="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 text-white">
                                <div>
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-bella-200">Especialidad BellaStyle</p>
                                    <h3 class="font-titulo text-2xl font-bold leading-tight text-white drop-shadow sm:text-3xl">${escapar(s.nombre)}</h3>
                                </div>
                                <div class="shrink-0 rounded-xl bg-white/95 px-3 py-1 text-right text-pastel-tinta shadow-md">
                                    <span class="block text-[9px] font-extrabold uppercase tracking-wider text-pastel-subtinta">Desde</span>
                                    <span class="font-titulo text-xl font-bold leading-none text-bella-800">${pesos(s.precio)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Cuerpo limpio y simétrico -->
                        <div class="p-5 pb-4">
                            <p class="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-relaxed text-pastel-subtinta">
                                ${escapar(subtituloLimpio)}
                            </p>
                            ${htmlPreviewCompacta}
                        </div>
                    </div>

                    <!-- Pie de tarjeta alineado al fondo con 2 acciones claras -->
                    <div class="mt-auto flex items-center justify-between gap-2 border-t border-bella-300/60 bg-pastel-perla/55 px-5 py-3.5">
                        <button type="button"
                                data-abrir-principal="${escapar(s.nombre)}"
                                data-abrir-precio="${s.precio}"
                                data-abrir-duracion="${s.duracion_min}"
                                class="rounded-xl border border-bella-400/80 bg-white px-3.5 py-2 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-pastel-rosa">
                            🔍 Ver catálogo (${totalVariedades})
                        </button>
                        <button type="button"
                                data-agendar-directo-srv="${escapar(s.nombre)}"
                                data-agendar-directo-precio="${s.precio}"
                                data-agendar-directo-duracion="${s.duracion_min}"
                                class="inline-flex items-center gap-1 rounded-xl bg-bella-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                            📅 Quiero este servicio &rarr;
                        </button>
                    </div>
                </article>
                ${esVistaIndividual && todasLasOpciones.length > 0 ? `
                    <div class="sm:col-span-2 lg:col-span-3 mt-2">
                        <div class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/15 bg-noche-900/75 px-5 py-3.5 backdrop-blur-md">
                            <div>
                                <h4 class="text-lg font-bold text-bella-50">Catálogo completo de estilos · ${escapar(s.nombre)}</h4>
                                <p class="text-xs text-bella-100">Selecciona cualquiera de los ${todasLasOpciones.length} estilos disponibles para ver su ficha o apartar tu cita.</p>
                            </div>
                            <button type="button" id="btnVolverTodosServicios" class="rounded-xl bg-pastel-crema px-3.5 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm hover:bg-pastel-rosa">
                                Ver todas las categorías
                            </button>
                        </div>
                        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            ${todasLasOpciones.map((op) => `
                                <div class="tarjeta-pastel flex flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-bella-500">
                                    <div>
                                        <div class="relative h-48 w-full overflow-hidden bg-pastel-perla">
                                            <img src="${escapar(op.imagen || imgCategoria)}" alt="${escapar(op.nombre)}" class="h-full w-full object-cover">
                                            <span class="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-extrabold text-bella-900 shadow-sm">
                                                ${op.iconoGrupo || '✦'} ${escapar(op.categoriaGrupo || s.nombre)}
                                            </span>
                                            <span class="absolute right-3 top-3 rounded-full bg-noche-950/80 px-2.5 py-0.5 text-[11px] font-bold text-white">
                                                ${op.duracion || s.duracion_min} min
                                            </span>
                                        </div>
                                        <div class="p-4">
                                            <div class="flex items-start justify-between gap-2">
                                                <h5 class="font-sans text-base font-bold text-pastel-tinta">${escapar(op.nombre)}</h5>
                                                <span class="font-titulo text-2xl font-bold text-bella-800">${pesos(op.precio)}</span>
                                            </div>
                                            <p class="mt-1 line-clamp-2 text-xs text-pastel-subtinta">${escapar(op.descripcion || subtituloLimpio)}</p>
                                        </div>
                                    </div>
                                    <div class="border-t border-bella-300/60 bg-pastel-perla/50 px-4 py-3 text-right">
                                        <button type="button"
                                                data-ver-subservicio="${escapar(s.nombre)}"
                                                data-ver-variedad="${escapar(op.nombre)}"
                                                data-ver-precio="${s.precio}"
                                                data-ver-duracion="${s.duracion_min}"
                                                class="w-full rounded-xl bg-bella-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                                            📅 Elegir este estilo &rarr;
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}`;
        }).join('');

        document.getElementById('btnVolverTodosServicios')?.addEventListener('click', () => {
            const btnTodos = barraRapida?.querySelector('button[data-filtrar-srv="todos"]');
            if (btnTodos) btnTodos.click();
            else renderizarTarjetasServicios('todos');
        });

        lista.querySelectorAll('[data-abrir-principal]').forEach((el) => {
            el.addEventListener('click', () => {
                abrirModalServicio(el.dataset.abrirPrincipal, {
                    precio: Number(el.dataset.abrirPrecio),
                    duracion: Number(el.dataset.abrirDuracion)
                });
            });
        });

        lista.querySelectorAll('button[data-agendar-directo-srv]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof window.seleccionarYAgendarServicio === 'function') {
                    window.seleccionarYAgendarServicio({
                        servicioPrincipal: btn.dataset.agendarDirectoSrv,
                        variedad: 'Servicio estándar',
                        precio: Number(btn.dataset.agendarDirectoPrecio),
                        duracion: Number(btn.dataset.agendarDirectoDuracion)
                    });
                } else {
                    abrirModalServicio(btn.dataset.agendarDirectoSrv, {
                        precio: Number(btn.dataset.agendarDirectoPrecio),
                        duracion: Number(btn.dataset.agendarDirectoDuracion)
                    });
                }
            });
        });

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
    };

    if (barraRapida) {
        barraRapida.querySelectorAll('button[data-filtrar-srv]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const elegido = btn.dataset.filtrarSrv;
                barraRapida.querySelectorAll('button[data-filtrar-srv]').forEach((b) => {
                    const activo = b.dataset.filtrarSrv === elegido;
                    b.className = activo
                        ? 'inline-flex items-center gap-2 rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition'
                        : 'inline-flex items-center gap-2 rounded-xl border border-bella-300/80 bg-pastel-crema px-3 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:border-bella-600 hover:bg-pastel-rosa';
                });
                renderizarTarjetasServicios(elegido);
            });
        });
    }

    // Si llegó desde el carrusel de la portada con ?servicio=Corte de Cabello, resaltamos o abrimos ese servicio
    const params = new URLSearchParams(window.location.search);
    const srvParam = params.get('servicio');
    renderizarTarjetasServicios('todos');

    if (srvParam) {
        const encontrado = servicios.find((s) => s.nombre.toLowerCase() === srvParam.toLowerCase());
        if (encontrado && typeof abrirModalServicio === 'function') {
            setTimeout(() => {
                abrirModalServicio(encontrado.nombre, {
                    precio: Number(encontrado.precio),
                    duracion: Number(encontrado.duracion_min)
                });
            }, 250);
        }
    }
}

// 2. Página dedicada galeria.html: muestra todos los trabajos con filtros y botón para agendar ese estilo
let filtroGaleriaActual = 'todos';

function dibujarGaleria12(filtro = filtroGaleriaActual) {
    filtroGaleriaActual = filtro;
    const cont = document.getElementById('grillaGaleria12');
    if (!cont || typeof GALERIA_TRABAJOS_12 === 'undefined') return;

    const fuenteCompleta = typeof window.obtenerTrabajosGaleriaCompleta === 'function'
        ? window.obtenerTrabajosGaleriaCompleta()
        : GALERIA_TRABAJOS_12;

    const lista = filtro === 'todos'
        ? fuenteCompleta
        : fuenteCompleta.filter((item) => {
            if (filtro === 'peinado') return item.filtro === 'peinado' || item.filtro === 'tratamiento';
            return item.filtro === filtro;
        });

    cont.innerHTML = lista.map((t) => `
        <article id="trabajoGal_${t.id}" class="tarjeta-pastel group flex flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500">
            <div>
                <div class="relative h-56 w-full overflow-hidden bg-pastel-perla">
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
                <div class="flex items-center gap-1.5">
                    <button type="button"
                            data-gal-servicio="${escapar(t.servicioBase)}"
                            data-gal-variedad="${escapar(t.variedad)}"
                            class="rounded-xl border border-bella-400/70 bg-white px-2.5 py-1.5 text-xs font-bold text-bella-900 shadow-sm transition hover:bg-pastel-rosa">
                        Ver detalle
                    </button>
                    <button type="button"
                            data-gal-agendar-srv="${escapar(t.servicioBase)}"
                            data-gal-agendar-var="${escapar(t.variedad)}"
                            data-gal-agendar-cat="${escapar(t.categoria)}"
                            data-gal-agendar-precio="${t.precio}"
                            data-gal-agendar-dur="${t.duracion}"
                            class="rounded-xl bg-bella-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                        Quiero este &rarr;
                    </button>
                </div>
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

    cont.querySelectorAll('button[data-gal-agendar-srv]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const servicio = btn.dataset.galAgendarSrv;
            const variedad = btn.dataset.galAgendarVar;
            sessionStorage.setItem('bellaVariedadPreferida', JSON.stringify({
                servicio,
                variedad,
                categoria: btn.dataset.galAgendarCat,
                precio: Number(btn.dataset.galAgendarPrecio) || 45000,
                duracion: Number(btn.dataset.galAgendarDur) || 60
            }));
            const sesion = typeof obtenerSesion === 'function' ? obtenerSesion() : null;
            if (sesion) {
                window.location.href = 'panel.html';
            } else if (typeof window.abrirModalAuth === 'function') {
                window.abrirModalAuth('login', {
                    rol: 'cliente',
                    mensaje: `✓ Elegiste: ${variedad} (${servicio}). Inicia sesión o regístrate para agendar tu cita.`
                });
            }
        });
    });
}

function prepararFiltrosGaleria12() {
    const barra = document.getElementById('filtrosGaleria12');
    if (!barra) return;

    const params = new URLSearchParams(window.location.search);
    const filtroUrl = params.get('filtro');
    if (filtroUrl && ['todos', 'corte', 'color', 'unas', 'peinado'].includes(filtroUrl)) {
        filtroGaleriaActual = filtroUrl;
    }

    barra.querySelectorAll('button[data-filtro-gal]').forEach((btn) => {
        const esActivo = btn.dataset.filtroGal === filtroGaleriaActual;
        btn.className = esActivo
            ? 'rounded-xl bg-bella-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm'
            : 'rounded-xl border border-bella-300/80 bg-pastel-crema px-3.5 py-1.5 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa';

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
    dibujarGaleria12(filtroGaleriaActual);
}

// 3. Página dedicada tienda.html: muestra todos los productos con buscador, compra directa en tiempo real y popup de login
let productosTiendaCache = [];

function abrirModalCompraDirectaEnTienda(idProducto) {
    const p = productosTiendaCache.find((x) => String(x.id_producto) === String(idProducto));
    if (!p) return;

    const stockActual = Number(p.stock) || 0;
    if (stockActual <= 0) {
        alert(`El producto "${p.nombre}" está agotado.`);
        return;
    }

    let dialog = document.getElementById('modalCompraTiendaDirecta');
    if (!dialog) {
        document.body.insertAdjacentHTML('beforeend', `
            <dialog id="modalCompraTiendaDirecta" class="w-[calc(100%-1.5rem)] max-w-md rounded-3xl border border-bella-300/70 bg-pastel-crema p-0 text-pastel-tinta shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md">
                <form id="formCompraTiendaDirecta" class="p-6">
                    <div class="flex items-start justify-between gap-2">
                        <h3 id="tituloCompraTienda" class="font-titulo text-2xl font-bold text-pastel-tinta">Comprar producto</h3>
                        <button type="button" id="cerrarCompraTienda" class="rounded-xl border border-bella-300 bg-pastel-perla px-2.5 py-1 text-lg font-bold text-pastel-tinta hover:bg-bella-200">&times;</button>
                    </div>
                    <div id="alertaCompraTienda" data-tema="pastel" class="alerta mt-3"></div>
                    <div id="cuerpoCompraTienda" class="mt-4 space-y-3.5"></div>
                    <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
                        <button type="button" id="btnAgregarCarritoDesdeTienda" class="rounded-xl border border-emerald-500/80 bg-pastel-menta px-3.5 py-2 text-xs font-extrabold text-emerald-950 shadow-sm transition hover:bg-emerald-200">
                            🛒 Añadir al carrito y ver más
                        </button>
                        <div class="flex gap-2">
                            <button type="button" id="cancelarCompraTienda" class="rounded-xl border border-bella-400/60 bg-pastel-perla px-4 py-2 text-xs font-bold text-pastel-tinta">Cancelar</button>
                            <button type="submit" id="btnConfirmarCompraTienda" class="btn-primario px-5 py-2 text-xs">Confirmar compra ya</button>
                        </div>
                    </div>
                </form>
            </dialog>
        `);
        dialog = document.getElementById('modalCompraTiendaDirecta');
        document.getElementById('cerrarCompraTienda').addEventListener('click', () => dialog.close());
        document.getElementById('cancelarCompraTienda').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    }

    const info = typeof obtenerFichaProducto === 'function'
        ? obtenerFichaProducto(p)
        : { imagen: p.imagen || 'img/productos/shampoo-argan.jpg', categoria: 'Tienda BellaStyle' };

    document.getElementById('tituloCompraTienda').textContent = `🛒 Comprar · ${p.nombre}`;
    ocultarAlerta(document.getElementById('alertaCompraTienda'));
    document.getElementById('cuerpoCompraTienda').innerHTML = `
        <div class="flex items-center gap-3 rounded-2xl border border-bella-300 bg-white p-3">
            <img src="${escapar(info.imagen)}" alt="${escapar(p.nombre)}" class="h-16 w-16 shrink-0 rounded-xl object-cover">
            <div>
                <span class="rounded-full bg-pastel-menta px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-950">${escapar(info.categoria)}</span>
                <p class="mt-1 font-bold text-pastel-tinta">${escapar(p.nombre)}</p>
                <p class="text-xs font-extrabold text-bella-800">${pesos(p.precio)} c/u · <span class="text-emerald-800">${stockActual} disponibles</span></p>
            </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
            <div>
                <label class="etiqueta-oscura">Cantidad (Máx. ${stockActual})</label>
                <input id="cantCompraTienda" type="number" min="1" max="${stockActual}" value="1" class="campo-pastel" required>
            </div>
            <div>
                <label class="etiqueta-oscura">Pasarela / Método de pago</label>
                <select id="metodoCompraTienda" class="campo-pastel">
                    <option value="PayU Latam">🟢 PayU Latam Colombia (PSE / Tarjetas / Nequi)</option>
                    <option value="Nequi / Daviplata">📲 Nequi / Daviplata</option>
                    <option value="Tarjeta / PSE">💳 Tarjeta / PSE</option>
                    <option value="Efectivo en Salón">💵 Efectivo en Salón</option>
                </select>
            </div>
        </div>
        <div id="totalCompraTienda" class="rounded-2xl border border-emerald-500/50 bg-pastel-menta p-3 text-xs font-bold text-emerald-950">
            Total a pagar: ${pesos(p.precio)} · Descuento de stock en tiempo real
        </div>`;

    const inputCant = document.getElementById('cantCompraTienda');
    const divTotal = document.getElementById('totalCompraTienda');
    inputCant?.addEventListener('input', () => {
        const c = Math.max(1, Math.min(stockActual, Number(inputCant.value) || 1));
        divTotal.textContent = `Total a pagar: ${pesos(c * Number(p.precio))} · Se descontarán ${c} unidad(es) en tiempo real`;
    });

    const btnAgregarCarrito = document.getElementById('btnAgregarCarritoDesdeTienda');
    if (btnAgregarCarrito) {
        btnAgregarCarrito.onclick = () => {
            const cantidad = Math.max(1, Math.min(stockActual, Number(inputCant.value) || 1));
            let carrito = [];
            try {
                carrito = JSON.parse(localStorage.getItem('bellaCarritoClienta') || '[]');
                if (!Array.isArray(carrito)) carrito = [];
            } catch {
                carrito = [];
            }
            const existente = carrito.find((item) => Number(item.id_producto) === Number(p.id_producto));
            if (existente) {
                existente.cantidad = Math.min(stockActual, Number(existente.cantidad) + cantidad);
            } else {
                carrito.push({ id_producto: Number(p.id_producto), cantidad });
            }
            localStorage.setItem('bellaCarritoClienta', JSON.stringify(carrito));
            mostrarAlerta(document.getElementById('alertaCompraTienda'), `🛒 ¡Se añadieron ${cantidad} unidad(es) de "${p.nombre}" a tu carrito! Puedes seguir eligiendo más productos o ir a tu Panel para pagar todo junto.`, 'ok');
            setTimeout(() => dialog.close(), 1300);
        };
    }

    const form = document.getElementById('formCompraTiendaDirecta');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const cantidad = Math.max(1, Number(inputCant.value) || 1);
        const metodoPago = document.getElementById('metodoCompraTienda').value;
        const btn = document.getElementById('btnConfirmarCompraTienda');
        btn.disabled = true;
        btn.textContent = 'Procesando...';
        const res = await pedir(`/productos/${p.id_producto}/comprar`, 'POST', { cantidad, metodoPago });
        btn.disabled = false;
        btn.textContent = 'Confirmar compra';

        if (res.success) {
            if (metodoPago === 'PayU Latam') {
                const resPayU = await pedir('/payu/checkout', 'POST', {
                    monto: cantidad * Number(p.precio),
                    descripcion: `Compra Tienda BellaStyle: ${cantidad}x ${p.nombre}`,
                    referencia: `PAYU-TIENDA-${Date.now()}`
                });
                if (resPayU && resPayU.success && resPayU.data) {
                    const f = document.createElement('form');
                    f.method = 'POST';
                    f.action = resPayU.data.actionUrl;
                    f.target = '_blank';
                    f.style.display = 'none';
                    for (const [k, v] of Object.entries(resPayU.data.fields)) {
                        const inp = document.createElement('input');
                        inp.type = 'hidden';
                        inp.name = k;
                        inp.value = String(v ?? '');
                        f.appendChild(inp);
                    }
                    document.body.appendChild(f);
                    f.submit();
                    setTimeout(() => f.remove(), 1500);
                }
            }
            mostrarAlerta(document.getElementById('alertaCompraTienda'), res.message, 'ok');
            await sincronizarTiempoRealLandingYTienda();
            setTimeout(() => dialog.close(), 1400);
        } else {
            mostrarAlerta(document.getElementById('alertaCompraTienda'), res.message);
        }
    };

    dialog.showModal();
}

function dibujarTiendaProductos(productos = []) {
    productosTiendaCache = productos;
    const cont = document.getElementById('listaTiendaProductos');
    if (!cont) return;

    if (!productos || productos.length === 0) {
        cont.innerHTML = '<p class="text-bella-100">No hay productos disponibles en este momento.</p>';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const idDestacado = params.get('producto');

    const renderizarLista = (filtroTexto = '') => {
        const q = filtroTexto.trim().toLowerCase();
        const filtrados = q
            ? productos.filter((p) => `${p.nombre} ${p.categoria || ''} ${p.descripcion || ''}`.toLowerCase().includes(q))
            : productos;

        cont.innerHTML = filtrados.map((p) => {
            const info = typeof obtenerFichaProducto === 'function'
                ? obtenerFichaProducto(p)
                : { imagen: p.imagen || 'img/productos/shampoo-argan.jpg', categoria: p.categoria || 'Cuidado Capilar', descripcion: p.descripcion || 'Producto profesional de salón.' };
            const disponible = Number(p.stock) > 0;
            const esDestacado = idDestacado && String(p.id_producto) === String(idDestacado);

            return `
                <article id="prodTienda_${p.id_producto}" class="tarjeta-pastel group flex flex-col justify-between overflow-hidden p-0 transition duration-300 hover:-translate-y-1.5 hover:border-bella-500 ${esDestacado ? 'ring-4 ring-bella-500' : ''}">
                    <div>
                        <div class="relative h-56 w-full overflow-hidden bg-white">
                            <img src="${escapar(info.imagen)}" alt="${escapar(p.nombre)}" loading="lazy"
                                 class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
                            <span class="absolute left-3 top-3 rounded-full bg-pastel-menta px-3 py-0.5 text-[11px] font-extrabold text-emerald-950 shadow-sm">
                                ${escapar(info.categoria)}
                            </span>
                            <span data-stock-badge="${p.id_producto}" data-stock-largo="1" class="absolute right-3 top-3 rounded-full ${disponible ? 'bg-emerald-700 text-white' : 'bg-stone-500 text-white'} px-2.5 py-0.5 text-[11px] font-bold shadow-sm">
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
                        <span class="text-[11px] font-bold text-pastel-subtinta">🧴 Stock en tiempo real</span>
                        <button type="button"
                                data-btn-comprar-prod="${p.id_producto}"
                                data-comprar-prod-id="${p.id_producto}"
                                data-comprar-prod-nombre="${escapar(p.nombre)}"
                                ${disponible ? '' : 'disabled'}
                                class="rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700 disabled:opacity-40">
                            ${disponible ? '🛒 Comprar / Quiero este &rarr;' : 'Agotado'}
                        </button>
                    </div>
                </article>`;
        }).join('');

        cont.querySelectorAll('button[data-comprar-prod-id]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idProd = btn.dataset.comprarProdId;
                const nombreProd = btn.dataset.comprarProdNombre;
                const sesion = typeof obtenerSesion === 'function' ? obtenerSesion() : null;
                if (sesion) {
                    abrirModalCompraDirectaEnTienda(idProd);
                } else {
                    sessionStorage.setItem('bellaProductoPreferido', JSON.stringify({
                        id_producto: idProd,
                        nombre: nombreProd
                    }));
                    if (typeof window.abrirModalAuth === 'function') {
                        window.abrirModalAuth('login', {
                            rol: 'cliente',
                            mensaje: `✓ Producto elegido: ${nombreProd}. Inicia sesión o regístrate para comprarlo y descontar el stock en tiempo real.`
                        });
                    }
                }
            });
        });
    };

    renderizarLista('');

    const buscadorTienda = document.getElementById('buscadorProductosTienda');
    if (buscadorTienda) {
        buscadorTienda.oninput = () => renderizarLista(buscadorTienda.value);
    }
}

// Dibuja las tarjetas de Experiencias Reales de Clientas en la Landing Page
function dibujarResenasEnLanding(listaResenas = []) {
    const contResenas = document.getElementById('listaResenasLanding');
    if (!contResenas || !Array.isArray(listaResenas)) return;

    const colores = ['bg-pastel-rosa', 'bg-pastel-lavanda', 'bg-pastel-menta', 'bg-pastel-durazno'];
    contResenas.innerHTML = listaResenas.slice(0, 6).map((r, idx) => {
        const estrellas = '★'.repeat(Number(r.calificacion) || 5) + '☆'.repeat(Math.max(0, 5 - (Number(r.calificacion) || 5)));
        const bg = colores[idx % colores.length];
        return `
            <article class="tarjeta-pastel flex flex-col justify-between p-4 transition duration-300">
                <div>
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="rounded-full ${bg} px-2.5 py-0.5 text-xs font-extrabold text-bella-900 shadow-sm">${estrellas} (${r.calificacion}.0)</span>
                        <div class="flex items-center gap-1.5">
                            ${r.reciente ? `<span class="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">✨ En tiempo real</span>` : ''}
                            <span class="text-[11px] font-semibold text-pastel-subtinta">${escapar(r.fecha)}</span>
                        </div>
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

// Sincroniza en tiempo real (cada 4s) las reseñas calificadas y el stock de productos entre PC y celular
async function sincronizarTiempoRealLandingYTienda() {
    const [resenas, productos] = await Promise.all([
        document.getElementById('listaResenasLanding') ? pedir('/resenas') : Promise.resolve(null),
        (document.getElementById('carruselTiendaLanding') || document.getElementById('listaTiendaProductos')) ? pedir('/productos') : Promise.resolve(null)
    ]);

    if (resenas && resenas.success && Array.isArray(resenas.data)) {
        dibujarResenasEnLanding(resenas.data);
    }

    if (productos && productos.success && Array.isArray(productos.data)) {
        productosTiendaCache = productos.data;
        productos.data.forEach((p) => {
            const disponible = Number(p.stock) > 0;
            document.querySelectorAll(`[data-stock-badge="${p.id_producto}"]`).forEach((badge) => {
                const largo = badge.dataset.stockLargo === '1';
                badge.textContent = disponible ? `${p.stock} ${largo ? 'disponibles' : 'disp.'}` : 'Agotado';
                badge.className = `absolute right-3 top-3 rounded-full ${disponible ? 'bg-emerald-700 text-white' : 'bg-stone-500 text-white'} px-2.5 py-0.5 text-[11px] font-bold shadow-sm`;
            });
            document.querySelectorAll(`button[data-btn-comprar-prod="${p.id_producto}"]`).forEach((btn) => {
                btn.disabled = !disponible;
                btn.innerHTML = disponible ? '🛒 Comprar / Quiero este &rarr;' : 'Agotado';
            });
        });
    }
}

// =========================================================================
// C. CARGA INICIAL DE DATOS DESDE LA API
// =========================================================================

async function cargarDatos() {
    prepararFiltrosGaleria12();

    const [servicios, estilistas, resenas, productos, galeriaResultados] = await Promise.all([
        pedir('/servicios'),
        pedir('/estilistas'),
        pedir('/resenas'),
        pedir('/productos'),
        pedir('/galeria-resultados')
    ]);

    if (galeriaResultados && galeriaResultados.success && Array.isArray(galeriaResultados.data)) {
        window.RESULTADOS_CITAS_CACHE = galeriaResultados.data;
    }

    if (servicios && servicios.success && Array.isArray(servicios.data)) {
        if (typeof window.sincronizarCatalogoConServicios === 'function') {
            window.sincronizarCatalogoConServicios(servicios.data);
        }
        dibujarCarruselServiciosLanding(servicios.data);
        dibujarPaginaServiciosCompleta(servicios.data);
    }

    dibujarCarruselGaleriaLanding();
    dibujarGaleria12(filtroGaleriaActual);

    if (productos && productos.success) {
        dibujarCarruselTiendaLanding(productos.data);
        dibujarTiendaProductos(productos.data);
    }

    if (resenas && resenas.success && Array.isArray(resenas.data)) {
        dibujarResenasEnLanding(resenas.data);
    }

    // Activar actualización en tiempo real cada 4 segundos para reseñas y stock de productos entre dispositivos
    setInterval(sincronizarTiempoRealLandingYTienda, 4000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) sincronizarTiempoRealLandingYTienda();
    });

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
}

cargarDatos();
