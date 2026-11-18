// Catálogo detallado de sub-servicios y especialidades + ventana emergente interactiva con pestañas rápidas.
// Funciona en:
//  - index.html (galería de servicios e ítems de precios)
//  - welcome.html (tarjetas de la sección "Nuestros servicios")
//  - panel.html (al seleccionar o explorar un servicio al agendar cita)

const CATALOGO_DETALLES = [
    {
        claves: ['corte'],
        etiquetaCorta: '✂ Corte (Mujer/Hombre)',
        titulo: 'Corte de Cabello',
        subtitulo: 'Cortes personalizados para dama y caballero según tu tipo de rostro',
        colorPastel: 'bg-pastel-rosa',
        grupos: [
            {
                categoria: 'Corte para Mujer',
                icono: '♀',
                opciones: [
                    { nombre: 'Corte Bob / Long Bob (Lob)', detalle: 'Líneas elegantes a la altura del mentón o clavícula, ideal para dar movimiento.', precio: 40000, duracion: 50 },
                    { nombre: 'Corte en Capas Largas o Mariposa', detalle: 'Aporta volumen, ligereza y caída natural sin perder el largo.', precio: 38000, duracion: 45 },
                    { nombre: 'Corte Recto / Despuntado Saludable', detalle: 'Sanea puntas abiertas manteniendo una línea simétrica y pulida.', precio: 35000, duracion: 40 },
                    { nombre: 'Corte Pixie / Flequillo Curtain Bangs', detalle: 'Diseño moderno con estilizado de contorno facial.', precio: 42000, duracion: 50 }
                ]
            },
            {
                categoria: 'Corte para Hombre',
                icono: '♂',
                opciones: [
                    { nombre: 'Corte Clásico Ejecutivo (Tijera y Máquina)', detalle: 'Acabado limpio, formal y perfilado de contornos.', precio: 28000, duracion: 35 },
                    { nombre: 'Degradado / Fade (Low, Mid o High Fade)', detalle: 'Desvanecido milimétrico con transición suave y diseño superior.', precio: 32000, duracion: 45 },
                    { nombre: 'Corte Texturizado / Crop o Mullet Moderno', detalle: 'Trabajo de tijera en la zona superior para dar textura natural.', precio: 35000, duracion: 45 },
                    { nombre: 'Corte + Perfilado y Arreglo de Barba', detalle: 'Servicio completo con toalla tibia y definición de barba.', precio: 42000, duracion: 55 }
                ]
            }
        ]
    },
    {
        claves: ['manicure', 'una', 'uñas', 'unas'],
        etiquetaCorta: '✦ Uñas y Manicure',
        titulo: 'Manicure y Diseño de Uñas',
        subtitulo: 'Cuidado integral de manos y sistemas profesionales de uñas',
        colorPastel: 'bg-pastel-menta',
        grupos: [
            {
                categoria: 'Tipos de Uñas y Sistemas',
                icono: '✦',
                opciones: [
                    { nombre: 'Uñas Acrílicas Esculpidas', detalle: 'Extensión resistente con molde o tip, largo a elección y esmaltado en gel.', precio: 85000, duracion: 120 },
                    { nombre: 'Uñas en Polygel / TechGel', detalle: 'Sistema ligero, flexible y de aspecto ultra natural con alta durabilidad.', precio: 90000, duracion: 120 },
                    { nombre: 'Uñas Press-On / Soft Gel', detalle: 'Extensión rápida de cobertura completa sin maltratar la uña natural.', precio: 70000, duracion: 90 },
                    { nombre: 'Esmaltado Semipermanente', detalle: 'Brillo intacto hasta por 21 días sobre uña natural con limpieza rusa.', precio: 45000, duracion: 60 },
                    { nombre: 'Forrado en Base Rubber / Nivelación', detalle: 'Refuerzo ideal para uñas frágiles o quebradizas con acabado liso.', precio: 55000, duracion: 75 },
                    { nombre: 'Manicure Tradicional + Nail Art', detalle: 'Limpieza profunda, hidratación, esmaltado clásico o francés.', precio: 25000, duracion: 45 }
                ]
            }
        ]
    },
    {
        claves: ['pedicure', 'pies'],
        etiquetaCorta: '❀ Pedicure y Spa',
        titulo: 'Pedicure y Spa de Pies',
        subtitulo: 'Descanso, suavidad y estética impecable para tus pies',
        colorPastel: 'bg-pastel-menta',
        grupos: [
            {
                categoria: 'Tipos de Pedicure',
                icono: '❀',
                opciones: [
                    { nombre: 'Pedicure Tradicional Completo', detalle: 'Limpieza de cutícula, limado anatómico, exfoliación suave y esmaltado.', precio: 30000, duracion: 60 },
                    { nombre: 'Pedicure Semipermanente', detalle: 'Esmaltado en gel de larga duración con secado inmediato en lámpara LED.', precio: 48000, duracion: 70 },
                    { nombre: 'PediSpa Detox & Hidratación Profunda', detalle: 'Sales relajantes, remoción de callosidades, mascarilla térmica y masaje.', precio: 60000, duracion: 80 },
                    { nombre: 'Reconstrucción Estética en Acrílico / Gel', detalle: 'Corrección visual y embellecimiento de uñas en pies.', precio: 65000, duracion: 75 }
                ]
            }
        ]
    },
    {
        claves: ['tinte', 'color'],
        etiquetaCorta: '◈ Tinte y Color',
        titulo: 'Tinte y Coloración Profesional',
        subtitulo: 'Fórmulas de cuidado capilar con pigmentos vibrantes y duraderos',
        colorPastel: 'bg-pastel-lavanda',
        grupos: [
            {
                categoria: 'Opciones de Coloración',
                icono: '◈',
                opciones: [
                    { nombre: 'Tinte Global (Tono Entero)', detalle: 'Aplicación uniforme de raíz a puntas con brillo espejo y sellado de color.', precio: 120000, duracion: 120 },
                    { nombre: 'Retoque de Raíz y Cubrimiento de Canas', detalle: 'Cobertura total del crecimiento (hasta 2 cm) e igualación de tono.', precio: 85000, duracion: 90 },
                    { nombre: 'Baño de Color / Gloss Sin Amoniaco', detalle: 'Reaviva el tono, matiza reflejos no deseados y aporta máxima suavidad.', precio: 95000, duracion: 75 },
                    { nombre: 'Coloración Fantasía o Tonos Cobrizos', detalle: 'Diseño de tonos intensos con protección de la fibra capilar.', precio: 150000, duracion: 140 }
                ]
            }
        ]
    },
    {
        claves: ['mechas', 'balayage'],
        etiquetaCorta: '✨ Mechas y Balayage',
        titulo: 'Mechas, Balayage e Iluminación',
        subtitulo: 'Técnicas avanzadas de aclaración con efecto degradado natural',
        colorPastel: 'bg-pastel-lavanda',
        grupos: [
            {
                categoria: 'Técnicas de Diseño de Color',
                icono: '✨',
                opciones: [
                    { nombre: 'Balayage Hand-Painted', detalle: 'Degradado luminoso de medios a puntas con transición suave sin marcas.', precio: 180000, duracion: 150 },
                    { nombre: 'Babylights / Micro-Mechas', detalle: 'Hilos finos de luz desde la raíz para un rubio delicado y multidimensional.', precio: 195000, duracion: 165 },
                    { nombre: 'Contorno / Money Piece + Iluminaciones', detalle: 'Enmarca e ilumina el rostro con mechones frontales estratégicos.', precio: 145000, duracion: 120 },
                    { nombre: 'Morena Iluminada (Caramelo / Avellana)', detalle: 'Reflejos cálidos sin decoloración agresiva, ideal para bases oscuras.', precio: 165000, duracion: 135 }
                ]
            }
        ]
    },
    {
        claves: ['peinado', 'evento', 'cepilla'],
        etiquetaCorta: '♛ Peinados',
        titulo: 'Peinados y Estilizado para Eventos',
        subtitulo: 'Looks duraderos para grados, bodas, quinceañeras y ocasiones especiales',
        colorPastel: 'bg-pastel-durazno',
        grupos: [
            {
                categoria: 'Estilos de Peinado',
                icono: '♛',
                opciones: [
                    { nombre: 'Ondas Glamour / Ondas al Agua o Sirena', detalle: 'Ondas definidas de alta fijación con preparación térmica protectora.', precio: 60000, duracion: 60 },
                    { nombre: 'Recogido Elegante (Novias, Grados y Gala)', detalle: 'Moño alto, bajo o trenzado estructurado con fijación de larga duración.', precio: 85000, duracion: 75 },
                    { nombre: 'Semirecogido Romántico con Trenzas', detalle: 'Combinación de ondas sueltas y detalles trenzados artesanales.', precio: 65000, duracion: 60 },
                    { nombre: 'Cepillado Profesional + Planchado Seda', detalle: 'Blower con volumen o liso extremo y sellado antifrizz de puntas.', precio: 40000, duracion: 45 }
                ]
            }
        ]
    },
    {
        claves: ['tratamiento', 'capilar', 'keratina', 'hidratacion'],
        etiquetaCorta: '❖ Tratamientos',
        titulo: 'Tratamientos y Recuperación Capilar',
        subtitulo: 'Nutrición profunda, control de frizz y reconstrucción de la hebra',
        colorPastel: 'bg-pastel-rosa',
        grupos: [
            {
                categoria: 'Terapias Capilares',
                icono: '❖',
                opciones: [
                    { nombre: 'Hidratación Profunda & Bomba Nutritiva', detalle: 'Mascarilla intensiva con óleos naturales y vaporización para cabello seco.', precio: 55000, duracion: 60 },
                    { nombre: 'Cauterización / Reconstrucción con Queratina', detalle: 'Repone proteínas perdidas por tintes o decoloraciones y sella la cutícula.', precio: 95000, duracion: 90 },
                    { nombre: 'Bótox Capilar Antifrizz', detalle: 'Rejuvenecimiento capilar que reduce el encrespamiento y devuelve el brillo.', precio: 120000, duracion: 105 },
                    { nombre: 'Alisado Orgánico / Aminoácidos', detalle: 'Reducción de volumen y ondas sin formol, dejando el cabello sedoso.', precio: 180000, duracion: 150 },
                    { nombre: 'Detox de Cuero Cabelludo', detalle: 'Exfoliación suave, oxigenación folicular y masaje estimulante.', precio: 65000, duracion: 60 }
                ]
            }
        ]
    }
];

function limpiarTextoCatalogo(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Busca la ficha detallada según el nombre del servicio o categoría.
function buscarDetalleServicio(nombreServicio, precioBase = null, duracionBase = null) {
    const limpio = limpiarTextoCatalogo(nombreServicio);
    for (const item of CATALOGO_DETALLES) {
        if (item.claves.some((c) => limpio.includes(c))) {
            return item;
        }
    }
    return {
        claves: [],
        etiquetaCorta: nombreServicio || 'Servicio',
        titulo: nombreServicio || 'Servicio BellaStyle',
        subtitulo: 'Atención personalizada con productos profesionales de salón',
        colorPastel: 'bg-pastel-rosa',
        grupos: [
            {
                categoria: 'Opciones incluidas en este servicio',
                icono: '✦',
                opciones: [
                    {
                        nombre: `${nombreServicio} — Sesión Estándar`,
                        detalle: 'Incluye diagnóstico previo con la estilista, aplicación con productos profesionales y acabado final.',
                        precio: precioBase || 45000,
                        duracion: duracionBase || 60
                    },
                    {
                        nombre: `${nombreServicio} — Sesión Premium + Hidratación`,
                        detalle: 'Servicio completo acompañado de sellado protector de brillo y asesoría de cuidado en casa.',
                        precio: precioBase ? Number(precioBase) + 20000 : 65000,
                        duracion: duracionBase ? Number(duracionBase) + 20 : 80
                    }
                ]
            }
        ]
    };
}

// Inserta la ventana emergente (modal) en el documento una sola vez
function asegurarModalCatalogo() {
    if (document.getElementById('modalCatalogoServicio')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <dialog id="modalCatalogoServicio" class="w-[calc(100%-1rem)] max-w-3xl rounded-3xl border border-bella-300/70 bg-pastel-crema p-0 text-pastel-tinta shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm sm:w-[calc(100%-2rem)]">
        <div class="flex max-h-[88vh] flex-col overflow-hidden">
          <!-- Cabecera en tono pastel + barra rápida para cambiar de categoría sin cerrar -->
          <div class="border-b border-bella-300/60 bg-pastel-perla/90 px-4 py-4 sm:px-6 sm:py-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-bella-600/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-bella-800">
                  &#10022; Catálogo interactivo de especialidades
                </span>
                <h2 id="modalCatTitulo" class="mt-1 font-titulo text-2xl font-bold text-pastel-tinta sm:text-4xl"></h2>
                <p id="modalCatSubtitulo" class="mt-0.5 text-xs font-medium text-pastel-subtinta sm:text-sm"></p>
              </div>
              <button type="button" id="modalCatCerrar" class="rounded-xl border border-bella-300/80 bg-pastel-crema px-3 py-1.5 text-xl font-bold leading-none text-pastel-tinta transition hover:bg-bella-200" aria-label="Cerrar ventana">&times;</button>
            </div>
            <!-- Pestañas rápidas para explorar otros servicios ahí mismo + buscador rápido -->
            <div id="modalCatNav" class="mt-3.5 flex gap-1.5 overflow-x-auto pb-1"></div>
            <div class="mt-2.5">
              <input id="buscadorEspecialidadModal" type="search" placeholder="🔎 Filtrar especialidad por nombre o acabado (ej. Balayage, Fade, Acrílicas, Bob...)"
                     class="campo-pastel py-1.5 text-xs">
            </div>
          </div>

          <!-- Cuerpo con las tarjetas de cada variedad -->
          <div id="modalCatCuerpo" class="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"></div>

          <!-- Pie del modal -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-bella-300/60 bg-pastel-perla/90 px-4 py-3.5 sm:px-6 sm:py-4">
            <p id="modalCatPieTexto" class="text-xs font-semibold text-pastel-subtinta">
              Presiona el botón de la especialidad que prefieras para elegirla al instante.
            </p>
            <div class="flex items-center gap-2">
              <button type="button" id="modalCatBtnCerrar2" class="rounded-xl border border-bella-400/60 bg-pastel-crema px-4 py-2 text-xs font-bold text-pastel-tinta transition hover:bg-bella-200/70">Cerrar</button>
              <a id="modalCatBtnAgendar" href="index.html?rol=cliente" class="btn-primario px-4 py-2 text-xs">Ir a agendar cita &rarr;</a>
            </div>
          </div>
        </div>
      </dialog>
    `);

    const dialog = document.getElementById('modalCatalogoServicio');
    document.getElementById('modalCatCerrar').addEventListener('click', () => dialog.close());
    document.getElementById('modalCatBtnCerrar2').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });
}

// Abre la pantalla emergente mostrando todos los tipos/variedades del servicio seleccionado.
function abrirModalServicio(nombreServicio, opciones = {}) {
    asegurarModalCatalogo();

    const detalle = buscarDetalleServicio(nombreServicio, opciones.precio, opciones.duracion);
    const dialog = document.getElementById('modalCatalogoServicio');
    document.getElementById('modalCatTitulo').textContent = detalle.titulo;
    document.getElementById('modalCatSubtitulo').textContent = detalle.subtitulo;

    // Dibuja la barra superior de pestañas para saltar entre Corte, Uñas, Color, Peinados, etc. sin cerrar el modal
    const nav = document.getElementById('modalCatNav');
    nav.innerHTML = CATALOGO_DETALLES.map((item) => {
        const activo = item.titulo === detalle.titulo;
        return `<button type="button" data-cambiar-cat="${escapar(item.titulo)}"
                        class="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            activo
                                ? 'bg-bella-600 text-white shadow-sm'
                                : 'border border-bella-300/70 bg-pastel-crema text-pastel-tinta hover:bg-bella-200/70'
                        }">
                  ${escapar(item.etiquetaCorta)}
                </button>`;
    }).join('');

    nav.querySelectorAll('button[data-cambiar-cat]').forEach((btn) => {
        btn.addEventListener('click', () => {
            abrirModalServicio(btn.dataset.cambiarCat, {});
        });
    });

    const enPanelClienta = Boolean(document.getElementById('formCita') && !document.querySelector('[data-rol="Clienta"]')?.classList.contains('hidden'));
    const btnAgendar = document.getElementById('modalCatBtnAgendar');
    if (enPanelClienta) {
        btnAgendar.classList.add('hidden');
        document.getElementById('modalCatPieTexto').textContent = 'Selecciona una especialidad de la lista para cargarla directamente en tu formulario de cita.';
    } else {
        btnAgendar.classList.remove('hidden');
        const sesion = typeof obtenerSesion === 'function' ? obtenerSesion() : null;
        btnAgendar.href = sesion ? 'panel.html' : 'index.html?rol=cliente';
        btnAgendar.textContent = sesion ? 'Ir a mi panel para agendar →' : 'Iniciar sesión para agendar →';
    }

    const cuerpo = document.getElementById('modalCatCuerpo');
    cuerpo.innerHTML = detalle.grupos.map((grupo) => `
      <div>
        <div class="mb-3 flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg ${detalle.colorPastel} text-sm font-bold text-bella-900 shadow-sm">${grupo.icono}</span>
          <h3 class="font-sans text-sm font-bold uppercase tracking-wider text-pastel-tinta">${escapar(grupo.categoria)}</h3>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          ${grupo.opciones.map((op, idx) => {
            const insignia = idx === 0
                ? '<span class="inline-block rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-extrabold text-amber-950">🔥 Más pedido</span>'
                : (idx === 1 ? '<span class="inline-block rounded-full bg-bella-500/15 px-2 py-0.5 text-[10px] font-extrabold text-bella-900">✨ Tendencia</span>' : '');
            return `
            <div data-tarjeta-especialidad="${escapar((op.nombre + ' ' + op.detalle).toLowerCase())}"
                 class="flex flex-col justify-between rounded-2xl border border-bella-300/80 bg-pastel-perla/75 p-4 transition hover:border-bella-500 hover:bg-bella-50 shadow-sm">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    ${insignia}
                    <h4 class="mt-0.5 font-sans text-sm font-bold text-pastel-tinta sm:text-base">${escapar(op.nombre)}</h4>
                  </div>
                  <span class="shrink-0 rounded-lg bg-bella-600/15 px-2.5 py-0.5 text-xs font-extrabold text-bella-900">${pesos(op.precio)}</span>
                </div>
                <p class="mt-1.5 text-xs leading-relaxed text-pastel-subtinta">${escapar(op.detalle)}</p>
              </div>
              <div class="mt-3 flex items-center justify-between border-t border-bella-300/50 pt-2.5">
                <span class="text-[11px] font-semibold text-pastel-subtinta">&#9719; Duración aprox: ${op.duracion} min</span>
                <button type="button"
                        data-elegir-variedad="${escapar(op.nombre)}"
                        data-elegir-categoria="${escapar(grupo.categoria)}"
                        data-elegir-precio="${op.precio}"
                        data-elegir-duracion="${op.duracion}"
                        data-elegir-detalle="${escapar(op.detalle)}"
                        class="rounded-lg bg-bella-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                  ${enPanelClienta ? 'Elegir este tipo' : 'Quiero este'}
                </button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `).join('');

    cuerpo.querySelectorAll('button[data-elegir-variedad]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const variedad = boton.dataset.elegirVariedad;
            const categoria = boton.dataset.elegirCategoria;
            const precio = Number(boton.dataset.elegirPrecio) || 0;
            const duracion = Number(boton.dataset.elegirDuracion) || 60;
            const detalleTexto = boton.dataset.elegirDetalle || '';

            if (typeof opciones.alSeleccionarVariedad === 'function') {
                opciones.alSeleccionarVariedad({ variedad, categoria, precio, duracion, detalle: detalleTexto, nombreServicio: detalle.titulo, idServicio: opciones.idServicio });
                dialog.close();
                return;
            }

            if (enPanelClienta) {
                const selectServicio = document.getElementById('servicio');
                if (selectServicio) {
                    if (opciones.idServicio) {
                        selectServicio.value = String(opciones.idServicio);
                    } else {
                        const primeraClave = detalle.claves[0] || limpiarTextoCatalogo(detalle.titulo).split(' ')[0];
                        for (const opt of selectServicio.options) {
                            if (limpiarTextoCatalogo(opt.textContent).includes(primeraClave)) {
                                selectServicio.value = opt.value;
                                break;
                            }
                        }
                    }
                    selectServicio.dispatchEvent(new Event('change'));
                }
                if (typeof window.aplicarEspecialidadEnFormulario === 'function') {
                    window.aplicarEspecialidadEnFormulario({ variedad, categoria, precio, duracion, detalle: detalleTexto });
                } else {
                    const obs = document.getElementById('observaciones');
                    if (obs) {
                        obs.value = `Especialidad elegida: ${variedad} (${categoria}) — ${detalleTexto}`;
                    }
                    const etiquetaVar = document.getElementById('variedadSeleccionada');
                    if (etiquetaVar) {
                        etiquetaVar.textContent = `✓ Especialidad: ${variedad} · ${pesos(precio)} · ${duracion} min`;
                        etiquetaVar.classList.remove('hidden');
                    }
                }
                dialog.close();
                document.getElementById('fecha')?.focus();
            } else {
                // Guarda la especialidad elegida con su precio y duración y lleva al cliente a iniciar sesión
                sessionStorage.setItem('bellaVariedadPreferida', JSON.stringify({
                    servicio: detalle.titulo,
                    variedad,
                    categoria,
                    precio,
                    duracion,
                    detalle: detalleTexto
                }));
                dialog.close();
                window.location.href = 'index.html?rol=cliente';
            }
        });
    });

    const buscadorModal = document.getElementById('buscadorEspecialidadModal');
    if (buscadorModal) {
        buscadorModal.value = '';
        buscadorModal.oninput = () => {
            const q = buscadorModal.value.trim().toLowerCase();
            cuerpo.querySelectorAll('[data-tarjeta-especialidad]').forEach((card) => {
                const coincide = !q || card.dataset.tarjetaEspecialidad.includes(q);
                card.classList.toggle('hidden', !coincide);
            });
        };
    }

    if (!dialog.open) dialog.showModal();
}
