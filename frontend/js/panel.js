// Panel principal (panel.html). Muestra una sección distinta según el rol.

const usuario = obtenerSesion();
if (!usuario) window.location.href = 'index.html';

let servicios = [];            // servicios disponibles (para agendar y registrar)
let estilistas = [];           // estilistas activas (para agendar)
let productosDisponibles = []; // productos activos con stock > 0
let citasAdmin = [];
let citasEstilistaLista = [];

// Variables de especialidad seleccionada en el formulario de clienta
let precioEspecialidadSeleccionada = null;
let duracionEspecialidadSeleccionada = null;
let ultimoCorreoAgendado = null;

// ---------------------------------------------------------------
// Utilidades de la página
// ---------------------------------------------------------------

function avisar(mensaje) {
    const aviso = document.getElementById('aviso');
    aviso.textContent = mensaje;
    aviso.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(aviso.temporizador);
    aviso.temporizador = setTimeout(() => aviso.classList.add('opacity-0', 'translate-y-4'), 3500);
}

// Igual que escapar(), pero también protege las comillas (para usar dentro de value="...")
function atributo(texto) {
    return escapar(texto).replace(/"/g, '&quot;');
}

function tarjetaMetrica(titulo, valor, colorPastel = '') {
    if (colorPastel) {
        return `
            <div class="rounded-2xl border border-bella-300/60 ${colorPastel} p-4 text-pastel-tinta shadow-md sm:p-5">
                <p class="text-[11px] font-bold uppercase tracking-wider text-pastel-subtinta">${titulo}</p>
                <p class="mt-1.5 font-titulo text-3xl font-bold text-pastel-tinta sm:text-4xl">${valor}</p>
            </div>`;
    }
    return `
        <div class="tarjeta p-4 sm:p-5">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-bella-200/70">${titulo}</p>
            <p class="mt-1.5 font-titulo text-3xl font-bold text-bella-50 sm:text-4xl">${valor}</p>
        </div>`;
}

function filaVacia(columnas, texto = 'No hay registros') {
    return `<tr><td colspan="${columnas}" class="py-10 text-center text-white/40">${texto}</td></tr>`;
}

function etiquetaEstado(estado) {
    return `<span class="estado estado-${estado}">${estado}</span>`;
}

// Etiqueta para Activo / Disponible (verde) o Inactivo / No disponible (gris)
function etiquetaActivo(estado) {
    const activo = estado === 'Activo' || estado === 'Disponible';
    return `<span class="estado ${activo ? 'estado-Finalizada' : 'bg-white/10 text-white/50'}">${estado}</span>`;
}

function renderizarEstrellas(calificacion, comentario = '') {
    const n = Number(calificacion) || 0;
    if (!n) return '';
    const llenas = '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
    return `
        <div class="mt-1">
            <span class="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                ${llenas} (${n}/5)
            </span>
            ${comentario ? `<span class="mt-0.5 block text-[11px] italic text-bella-100/80">"${escapar(comentario)}"</span>` : ''}
        </div>`;
}

const COLORES = {
    azul: 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25',
    verde: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
    rojo: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
    gris: 'bg-white/10 text-white hover:bg-white/15'
};

// Botón que hace un cambio en la API después de pedir confirmación.
function botonAccion(texto, color, url, cuerpo) {
    return `<button class="btn-mini ${COLORES[color]}" data-url="${url}" data-cuerpo="${atributo(JSON.stringify(cuerpo))}">${texto}</button>`;
}

// Botón que abre una ventana de edición.
function botonEditar(texto, accion, id) {
    return `<button class="btn-mini ${COLORES.gris}" data-editar="${accion}" data-id="${id}">${texto}</button>`;
}

// Activa los botones de una tabla
function activarBotones(tabla, recargar) {
    tabla.querySelectorAll('button[data-url]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const celda = boton.closest('td');
            const original = celda.innerHTML;
            celda.innerHTML = `
                <span class="mr-2 text-xs text-white/70">¿Confirmar?</span>
                <button class="btn-mini bg-bella-500 text-white" data-si>Sí</button>
                <button class="btn-mini bg-white/10 text-white" data-no>No</button>`;
            celda.querySelector('[data-no]').onclick = () => {
                celda.innerHTML = original;
                activarBotones(tabla, recargar);
            };
            celda.querySelector('[data-si]').onclick = async () => {
                const respuesta = await pedir(boton.dataset.url, 'PUT', JSON.parse(boton.dataset.cuerpo));
                avisar(respuesta.message);
                recargar();
            };
        });
    });

    tabla.querySelectorAll('button[data-editar]').forEach((boton) => {
        boton.addEventListener('click', () => EDITORES[boton.dataset.editar](boton.dataset.id));
    });
}

// ---------------------------------------------------------------
// Ventana de edición (en tonos pasteles con letra oscura)
// ---------------------------------------------------------------

let alGuardarVentana = null;

function abrirVentana(titulo, camposHtml, alGuardar, textoGuardar = 'Guardar cambios') {
    document.getElementById('tituloVentana').textContent = titulo;
    document.getElementById('camposVentana').innerHTML = camposHtml;
    ocultarAlerta(document.getElementById('alertaVentana'));
    alGuardarVentana = alGuardar;
    const btnSubmit = document.querySelector('#formVentana button[type="submit"]');
    if (btnSubmit) {
        if (alGuardar === null) {
            btnSubmit.classList.add('hidden');
        } else {
            btnSubmit.classList.remove('hidden');
            btnSubmit.textContent = textoGuardar;
        }
    }
    document.getElementById('ventana').showModal();
}

function cerrarVentana() {
    document.getElementById('ventana').close();
}

document.getElementById('btnCerrarVentana').addEventListener('click', cerrarVentana);
document.getElementById('ventana').addEventListener('click', (e) => {
    if (e.target === document.getElementById('ventana')) cerrarVentana();
});

document.getElementById('formVentana').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!alGuardarVentana) {
        cerrarVentana();
        return;
    }
    const respuesta = await alGuardarVentana();
    if (respuesta && respuesta.success) {
        cerrarVentana();
        if (respuesta.message) avisar(respuesta.message);
    } else if (respuesta) {
        mostrarAlerta(document.getElementById('alertaVentana'), respuesta.message);
    }
});

function campo(id, etiqueta, valor = '', tipo = 'text', extra = '') {
    return `
        <div>
            <label for="${id}" class="etiqueta-oscura">${etiqueta}</label>
            <input id="${id}" type="${tipo}" class="campo-pastel [color-scheme:light]" value="${atributo(valor)}" ${extra}>
        </div>`;
}

function casillasServicios(lista, seleccionados = []) {
    return `
        <div>
            <p class="etiqueta-oscura">Servicios que realiza</p>
            <div class="grid gap-2 sm:grid-cols-2">
                ${lista.map((s) => `
                    <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-bella-300/80 bg-pastel-perla/80 px-3 py-2 text-sm font-semibold text-pastel-tinta transition hover:border-bella-500">
                        <input type="checkbox" name="servicioVentana" value="${s.id_servicio}" class="accent-bella-600 h-4 w-4"
                               ${seleccionados.includes(String(s.id_servicio)) ? 'checked' : ''}>
                        ${escapar(s.nombre)}
                    </label>`).join('')}
            </div>
        </div>`;
}

function valor(id) {
    return document.getElementById(id).value.trim();
}

function serviciosMarcados() {
    return [...document.querySelectorAll('input[name="servicioVentana"]:checked')].map((c) => Number(c.value));
}

function opcionesHora(seleccionada = '') {
    let opciones = '';
    for (let minutos = 8 * 60; minutos <= 18 * 60 + 30; minutos += 30) {
        const h = String(Math.floor(minutos / 60)).padStart(2, '0');
        const m = String(minutos % 60).padStart(2, '0');
        const hora = `${h}:${m}`;
        opciones += `<option value="${hora}" ${hora === seleccionada ? 'selected' : ''}>${hora}</option>`;
    }
    return opciones;
}

// Próximo día hábil (si hoy es domingo, devuelve lunes)
function fechaDeHoy() {
    const hoy = new Date();
    if (hoy.getDay() === 0) hoy.setDate(hoy.getDate() + 1);
    return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const NOMBRES_DIAS = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
};

function obtenerHorariosDe(estilista) {
    if (Array.isArray(estilista?.horarios) && estilista.horarios.length === 6) {
        return estilista.horarios;
    }
    return [1, 2, 3, 4, 5, 6].map((d) => ({
        dia_semana: d,
        trabaja: true,
        hora_inicio: '08:00',
        hora_fin: '19:00'
    }));
}

function resumirDescansos(estilista) {
    const horarios = obtenerHorariosDe(estilista);
    const descansos = horarios.filter((h) => !h.trabaja).map((h) => NOMBRES_DIAS[h.dia_semana]);
    return descansos.length > 0 ? `Descansa: ${descansos.join(', ')}` : 'Lun a Sáb completo';
}

function buscarCitaEnMemoria(idCita) {
    return (
        citasClienta.find((c) => String(c.id) === String(idCita)) ||
        citasEstilistaLista.find((c) => String(c.id) === String(idCita)) ||
        citasAdmin.find((c) => String(c.id) === String(idCita))
    );
}

// ---------------------------------------------------------------
// Comprobante / Ticket imprimible + Vista previa del Correo enviado + Calificación + Ficha técnica
// ---------------------------------------------------------------

function verComprobanteCita(idCita) {
    const c = buscarCitaEnMemoria(idCita);
    if (!c) return avisar('No se encontró la cita');

    const duracion = c.duracion_min || 60;
    const precioProd = Number(c.precio_producto || 0);
    const precioTotal = Number(c.precio || 0);
    const precioServicio = Math.max(0, precioTotal - precioProd);

    const htmlTicket = `
        <div id="areaTicketImprimible" class="rounded-2xl border-2 border-dashed border-bella-400 bg-white p-5 text-pastel-tinta shadow-inner">
            <div class="border-b border-bella-200 pb-3 text-center">
                <p class="text-[11px] font-bold uppercase tracking-widest text-bella-700">BellaStyle Studio · Cartagena, Colombia</p>
                <h4 class="mt-0.5 font-titulo text-2xl font-bold text-pastel-tinta">Comprobante de Cita #BS-${c.id}</h4>
                <p class="mt-1 text-xs font-semibold text-pastel-subtinta">Estado actual: <strong>${escapar(c.estado)}</strong></p>
            </div>
            <dl class="mt-3 space-y-2 text-xs">
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Clienta:</dt>
                    <dd class="font-bold text-pastel-tinta text-right">${escapar(c.cliente)}</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Fecha y hora:</dt>
                    <dd class="font-bold text-bella-800 text-right">${escapar(c.fecha)} · ${escapar(c.hora)} (${duracion} min)</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Profesional asignada:</dt>
                    <dd class="font-semibold text-pastel-tinta text-right">${escapar(c.estilista)}</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Servicio principal:</dt>
                    <dd class="font-bold text-pastel-tinta text-right">${escapar(c.servicio)} (${pesos(precioServicio)})</dd>
                </div>
                ${c.observaciones ? `
                <div class="border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Especialidad / Detalle solicitado:</dt>
                    <dd class="mt-0.5 font-medium text-pastel-tinta">${escapar(c.observaciones)}</dd>
                </div>` : ''}
                ${c.producto_adicional ? `
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Producto adicional incluido:</dt>
                    <dd class="font-bold text-emerald-900 text-right">${escapar(c.producto_adicional)} (+${pesos(precioProd)})</dd>
                </div>` : ''}
                <div class="flex items-center justify-between pt-2 text-sm">
                    <dt class="font-bold uppercase tracking-wider text-pastel-tinta">Total a pagar en salón:</dt>
                    <dd class="font-titulo text-2xl font-bold text-bella-800">${pesos(precioTotal)}</dd>
                </div>
            </dl>
            <p class="mt-4 text-center text-[11px] text-pastel-subtinta">
                Presenta este comprobante digital al llegar a tu cita · Atención Lun a Sáb 8:00 a 19:00
            </p>
        </div>
        <div class="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" id="btnImprimirComprobante" class="btn-principal py-2 text-xs">
                🖨️ Imprimir / Guardar PDF
            </button>
        </div>`;

    abrirVentana(`🧾 Comprobante de cita BS-${c.id}`, htmlTicket, null);

    document.getElementById('btnImprimirComprobante')?.addEventListener('click', () => {
        const ventanaImp = window.open('', '_blank', 'width=720,height=680');
        if (!ventanaImp) return window.print();
        ventanaImp.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Comprobante BS-${c.id} · BellaStyle Studio</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #24131c; background: #fff9fb; }
                    .box { max-width: 520px; margin: 0 auto; border: 2px dashed #c94b7c; border-radius: 18px; padding: 24px; background: #fff; }
                    h2 { margin: 6px 0; color: #541d37; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f4dce6; font-size: 14px; }
                    .total { font-size: 20px; font-weight: bold; color: #9c2f5b; padding-top: 14px; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="box">
                    <p style="text-align:center;font-size:11px;font-weight:bold;letter-spacing:2px;color:#9c2f5b;margin:0;">BELLASTYLE STUDIO · CARTAGENA</p>
                    <h2 style="text-align:center;">Comprobante #BS-${c.id}</h2>
                    <p style="text-align:center;font-size:12px;color:#624653;">Estado: ${escapar(c.estado)}</p>
                    <div class="row"><strong>Clienta:</strong> <span>${escapar(c.cliente)}</span></div>
                    <div class="row"><strong>Fecha y hora:</strong> <span>${escapar(c.fecha)} · ${escapar(c.hora)} (${duracion} min)</span></div>
                    <div class="row"><strong>Estilista:</strong> <span>${escapar(c.estilista)}</span></div>
                    <div class="row"><strong>Servicio:</strong> <span>${escapar(c.servicio)} (${pesos(precioServicio)})</span></div>
                    ${c.observaciones ? `<div class="row"><strong>Detalle:</strong> <span>${escapar(c.observaciones)}</span></div>` : ''}
                    ${c.producto_adicional ? `<div class="row"><strong>Producto adicional:</strong> <span>${escapar(c.producto_adicional)} (+${pesos(precioProd)})</span></div>` : ''}
                    <div class="total"><span>Total:</span> <span>${pesos(precioTotal)}</span></div>
                </div>
                <script>window.onload = function(){ window.print(); };<\/script>
            </body>
            </html>`);
        ventanaImp.document.close();
    });
}

function mostrarModalCorreo(correo) {
    if (!correo) return avisar('No hay correo disponible para esta cita');
    const htmlVista = `
        <div class="rounded-2xl border border-emerald-500/40 bg-pastel-menta p-3 text-xs text-pastel-tinta">
            <p><strong>Para:</strong> ${escapar(correo.para)}</p>
            <p class="mt-0.5"><strong>Asunto:</strong> ${escapar(correo.asunto)}</p>
            <p class="mt-0.5 text-[11px] font-semibold text-emerald-950">✓ Notificación generada automáticamente al apartar la cita con el detalle completo del servicio</p>
        </div>
        <div class="max-h-[26rem] overflow-y-auto rounded-2xl border border-bella-300 bg-white p-2 shadow-inner">
            ${correo.html}
        </div>`;

    abrirVentana('✉️ Correo de confirmación enviado a la clienta', htmlVista, null);
}

async function verCorreoCita(idCita) {
    const res = await pedir(`/citas/${idCita}/correo`);
    if (!res.success || !res.data) return avisar(res.message || 'No se pudo cargar el correo');
    mostrarModalCorreo(res.data);
}

function calificarCita(idCita) {
    const c = buscarCitaEnMemoria(idCita);
    if (!c) return;
    const calActual = Number(c.calificacion) || 5;

    const htmlCalificar = `
        <p class="text-xs font-semibold text-pastel-subtinta">
            Cuéntanos cómo fue tu experiencia en <strong>${escapar(c.servicio)}</strong> con <strong>${escapar(c.estilista)}</strong>:
        </p>
        <div>
            <label class="etiqueta-oscura">Calificación (1 a 5 estrellas)</label>
            <div id="selectorEstrellasModal" class="flex gap-2 pt-1">
                ${[1, 2, 3, 4, 5].map((n) => `
                    <button type="button" data-estrella-val="${n}"
                            class="flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                                n <= calActual
                                    ? 'border-amber-500 bg-amber-400/30 text-amber-950 shadow-sm'
                                    : 'border-bella-300 bg-pastel-perla text-pastel-subtinta'
                            }">
                        ${n} ★
                    </button>`).join('')}
            </div>
            <input type="hidden" id="vCalificacion" value="${calActual}">
        </div>
        <div>
            <label for="vComentarioCal" class="etiqueta-oscura">Reseña o comentario (opcional)</label>
            <textarea id="vComentarioCal" rows="3" class="campo-pastel" placeholder="Ej. Me encantó el resultado y la puntualidad...">${escapar(c.comentario_calificacion || '')}</textarea>
        </div>`;

    abrirVentana(`★ Calificar servicio · BS-${c.id}`, htmlCalificar, async () => {
        const respuesta = await pedir(`/citas/${c.id}/calificar`, 'PUT', {
            calificacion: Number(valor('vCalificacion')),
            comentario: valor('vComentarioCal')
        });
        if (respuesta.success) {
            await cargarCitasClienta();
        }
        return respuesta;
    }, 'Enviar calificación');

    document.querySelectorAll('#selectorEstrellasModal button[data-estrella-val]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const elegida = Number(btn.dataset.estrellaVal);
            document.getElementById('vCalificacion').value = elegida;
            document.querySelectorAll('#selectorEstrellasModal button[data-estrella-val]').forEach((b) => {
                const n = Number(b.dataset.estrellaVal);
                b.className = `flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                    n <= elegida
                        ? 'border-amber-500 bg-amber-400/30 text-amber-950 shadow-sm'
                        : 'border-bella-300 bg-pastel-perla text-pastel-subtinta'
                }`;
            });
        });
    });
}

function editarFichaTecnica(idClienta) {
    const clienta = clientasAdmin.find((x) => String(x.id_clienta) === String(idClienta));
    if (!clienta) return;

    abrirVentana(`📋 Ficha técnica capilar y de uñas · ${clienta.nombres} ${clienta.apellidos}`,
        `<p class="text-xs font-semibold text-pastel-subtinta">
            Registra fórmulas de tinte, alergias, sensibilidad en piel/cutícula, tipo de hebra o preferencias de la clienta. Tanto la Administradora como la Estilista pueden consultarla.
        </p>
        <div>
            <label for="vFichaTecnica" class="etiqueta-oscura">Notas técnicas e historial personalizado</label>
            <textarea id="vFichaTecnica" rows="5" class="campo-pastel" placeholder="Ej. Tono base 7.1, prefiere esmalte hipoalergénico, hebra fina...">${escapar(clienta.ficha_tecnica || '')}</textarea>
        </div>`,
        async () => {
            const res = await pedir(`/clientas/${idClienta}/ficha`, 'PUT', {
                ficha_tecnica: valor('vFichaTecnica')
            });
            if (res.success) {
                await cargarClientasAdmin();
            }
            return res;
        });
}

function verFichaClientaDesdeCita(idCita) {
    const c = buscarCitaEnMemoria(idCita);
    if (!c) return;

    abrirVentana(`📋 Ficha técnica · ${c.cliente}`,
        `<div class="rounded-xl border border-bella-300/70 bg-pastel-rosa p-3 text-xs text-pastel-tinta">
            <p><strong>Clienta:</strong> ${escapar(c.cliente)} · <strong>Tel:</strong> ${escapar(c.cliente_telefono || '—')}</p>
            <p class="mt-0.5"><strong>Cita actual:</strong> ${escapar(c.servicio)} (${escapar(c.observaciones || 'Estándar')})</p>
        </div>
        <div>
            <label for="vFichaCita" class="etiqueta-oscura">Fórmula capilar, alergias y preferencias de la clienta</label>
            <textarea id="vFichaCita" rows="5" class="campo-pastel" placeholder="Escribe aquí las notas técnicas de la clienta...">${escapar(c.ficha_tecnica || '')}</textarea>
        </div>`,
        async () => {
            const res = await pedir(`/clientas/${c.id_cliente}/ficha`, 'PUT', {
                ficha_tecnica: valor('vFichaCita')
            });
            if (res.success) {
                if (usuario.rol === 'Estilista') await cargarCitasEstilista();
                if (usuario.rol === 'Administradora') await cargarCitasAdmin();
            }
            return res;
        });
}

// Chat directo dentro de una cita específica (Clienta <-> Estilista / Administradora)
async function abrirChatCita(idCita) {
    const c = buscarCitaEnMemoria(idCita);
    if (!c) return;

    const respuesta = await pedir(`/citas/${c.id}/mensajes`);
    const mensajes = respuesta.data || [];

    const renderizarMensajesCita = (lista) => {
        if (!lista || lista.length === 0) {
            return `<p class="py-6 text-center text-xs text-pastel-subtinta">Aún no hay mensajes en esta cita. Escribe aquí cualquier indicación o aviso (ej. "Voy en camino").</p>`;
        }
        return lista.map((m) => {
            const esMio = m.rol_autor === usuario.rol;
            const bg = m.rol_autor === 'Clienta'
                ? 'bg-pastel-rosa border-bella-300/80'
                : 'bg-pastel-menta border-emerald-400/60';
            return `
                <div class="flex flex-col ${esMio ? 'items-end' : 'items-start'}">
                    <span class="text-[10px] font-bold text-pastel-subtinta">${escapar(m.autor)} (${escapar(m.rol_autor)}) · ${escapar(m.hora)}</span>
                    <div class="mt-0.5 max-w-[85%] rounded-2xl border ${bg} px-3.5 py-2 text-xs font-medium text-pastel-tinta shadow-sm">
                        ${escapar(m.texto)}
                    </div>
                </div>`;
        }).join('');
    };

    const htmlChat = `
        <div class="rounded-xl border border-bella-300/70 bg-pastel-lavanda/75 p-3 text-xs text-pastel-tinta">
            <p><strong>Cita #BS-${c.id}:</strong> ${escapar(c.servicio)} · ${escapar(c.fecha)} a las ${escapar(c.hora)}</p>
            <p class="mt-0.5"><strong>Clienta:</strong> ${escapar(c.cliente)} · <strong>Estilista:</strong> ${escapar(c.estilista)}</p>
        </div>
        <div id="cajaMensajesCitaModal" class="max-h-60 space-y-2.5 overflow-y-auto rounded-2xl border border-bella-300/70 bg-white p-3 shadow-inner">
            ${renderizarMensajesCita(mensajes)}
        </div>
        <div>
            <label for="vTextoMensajeCita" class="etiqueta-oscura">Nuevo mensaje para esta cita</label>
            <input id="vTextoMensajeCita" type="text" class="campo-pastel" placeholder="Escribe un mensaje para la ${usuario.rol === 'Clienta' ? 'estilista' : 'clienta'}..." required>
        </div>`;

    abrirVentana(`💬 Chat directo de la cita BS-${c.id}`, htmlChat, async () => {
        const texto = valor('vTextoMensajeCita');
        const res = await pedir(`/citas/${c.id}/mensajes`, 'POST', {
            autor: usuario.nombre,
            rolAutor: usuario.rol,
            texto
        });
        return res;
    }, 'Enviar mensaje');
}

// Dibuja la línea de tiempo visual por horas (08:00 a 19:00) para una fecha determinada
function dibujarTimelineDia(fecha, listaCitas, idContenedor) {
    const cont = document.getElementById(idContenedor);
    if (!cont) return;

    const delDia = (listaCitas || []).filter((c) => c.fecha === fecha && c.estado !== 'Cancelada');
    const horas = [];
    for (let h = 8; h <= 18; h++) {
        horas.push(`${String(h).padStart(2, '0')}:00`);
        horas.push(`${String(h).padStart(2, '0')}:30`);
    }

    if (delDia.length === 0) {
        cont.innerHTML = `<p class="rounded-xl border border-bella-300/60 bg-pastel-perla p-3 text-xs font-semibold text-pastel-subtinta">No hay citas programadas para el <strong>${escapar(fecha)}</strong>. Todos los bloques de 08:00 a 19:00 están despejados.</p>`;
        return;
    }

    const colores = ['bg-pastel-rosa border-bella-400', 'bg-pastel-lavanda border-purple-400', 'bg-pastel-menta border-emerald-400', 'bg-pastel-durazno border-amber-400'];

    cont.innerHTML = `
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            ${horas.map((horaSlot) => {
                const [sh, sm] = horaSlot.split(':').map(Number);
                const minSlot = sh * 60 + sm;
                const enEsteBloque = delDia.filter((c) => {
                    const [ch, cm] = String(c.hora).split(':').map(Number);
                    const ini = ch * 60 + cm;
                    const fin = ini + Number(c.duracion_min || 60);
                    return minSlot >= ini && minSlot < fin;
                });

                if (enEsteBloque.length === 0) {
                    return `
                        <div class="flex items-center justify-between rounded-xl border border-bella-200/70 bg-white/70 px-3 py-2 text-xs">
                            <span class="font-mono font-bold text-pastel-subtinta">${horaSlot}</span>
                            <span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-900">Libre</span>
                        </div>`;
                }

                return `
                    <div class="rounded-xl border-2 ${colores[sh % colores.length]} p-2.5 text-xs shadow-sm">
                        <div class="flex items-center justify-between">
                            <span class="font-mono font-extrabold text-bella-900">${horaSlot}</span>
                            <span class="rounded-full bg-bella-700 px-2 py-0.5 text-[10px] font-bold text-white">${enEsteBloque.length} en atención</span>
                        </div>
                        <div class="mt-1.5 space-y-1">
                            ${enEsteBloque.map((c) => `
                                <div class="rounded-lg bg-white/85 px-2 py-1 text-[11px] text-pastel-tinta">
                                    <p class="font-bold">${escapar(c.servicio)} <span class="text-bella-800">(#BS-${c.id})</span></p>
                                    <p class="text-pastel-subtinta">👤 ${escapar(c.cliente)} · ✂ ${escapar(c.estilista)} (${c.duracion_min || 60} min)</p>
                                </div>`).join('')}
                        </div>
                    </div>`;
            }).join('')}
        </div>`;
}

// ---------------------------------------------------------------
// Encabezado
// ---------------------------------------------------------------

function prepararEncabezado() {
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol;
    document.getElementById('fotoUsuario').src = usuario.foto;
    document.getElementById('saludo').textContent = usuario.rol === 'Administradora'
        ? 'Bienvenida a tu salón de belleza'
        : 'Hola, ' + usuario.nombre.split(' ')[0];
    document.getElementById('btnSalir').addEventListener('click', cerrarSesion);

    const subtitulos = {
        Clienta: 'Elige tu especialidad favorita, consulta horarios en vivo y administra tus citas.',
        Estilista: 'Revisa tus citas asignadas, fichas técnicas de clientas y tu comisión acumulada.',
        Administradora: 'Control integral de citas, equipo, catálogo, fichas técnicas, inventario y mensajes.'
    };
    document.getElementById('subtitulo').textContent = subtitulos[usuario.rol];

    const seccion = document.querySelector(`[data-rol="${usuario.rol}"]`);
    seccion.classList.remove('hidden');
    if (usuario.rol === 'Clienta') seccion.classList.add('grid');
}

// ---------------------------------------------------------------
// CLIENTA
// ---------------------------------------------------------------

let miPerfilClienta = null;
let citasClienta = [];

function actualizarResumenTotalCita() {
    const selectSrv = document.getElementById('servicio');
    const selectProd = document.getElementById('productoAdicional');
    const inputCupon = document.getElementById('codigoPromocional');
    const cajaResumen = document.getElementById('resumenTotalCita');
    if (!selectSrv || !cajaResumen) return;

    const srv = servicios.find((s) => String(s.id_servicio) === String(selectSrv.value));
    if (!srv) return;

    const precioBase = precioEspecialidadSeleccionada !== null ? Number(precioEspecialidadSeleccionada) : Number(srv.precio);
    const duracionBase = duracionEspecialidadSeleccionada !== null ? Number(duracionEspecialidadSeleccionada) : Number(srv.duracion_min);

    const prod = selectProd && selectProd.value
        ? productosDisponibles.find((p) => String(p.id_producto) === String(selectProd.value))
        : null;
    const precioProd = prod ? Number(prod.precio) : 0;
    const subtotal = precioBase + precioProd;

    const cupon = (inputCupon?.value || '').trim().toUpperCase();
    const finalizadasCount = citasClienta.filter((c) => c.estado === 'Finalizada').length;
    const aplicaDescuento = cupon === 'BELLA15' || cupon === 'VIP15' || finalizadasCount >= 3;
    const descuento = aplicaDescuento ? Math.round(subtotal * 0.15) : 0;
    const total = Math.max(0, subtotal - descuento);

    cajaResumen.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
                <p class="text-[11px] font-bold uppercase tracking-wider text-bella-900">Resumen estimado de tu cita</p>
                <p class="text-xs font-semibold text-pastel-subtinta">
                    Servicio (${duracionBase} min): <strong>${pesos(precioBase)}</strong>
                    ${prod ? ` + ${escapar(prod.nombre)} (<strong>${pesos(precioProd)}</strong>)` : ''}
                </p>
                ${descuento > 0 ? `<p class="mt-0.5 text-xs font-bold text-emerald-900">💎 Beneficio BellaClub / Cupón 15% OFF aplicado: -${pesos(descuento)}</p>` : ''}
            </div>
            <p class="font-titulo text-2xl font-bold text-bella-800">${pesos(total)}</p>
        </div>`;
}

// Llamada desde catalogo-modal.js cuando la clienta elige una especialidad específica
window.aplicarEspecialidadEnFormulario = function ({ variedad, categoria, precio, duracion }) {
    precioEspecialidadSeleccionada = precio ? Number(precio) : null;
    duracionEspecialidadSeleccionada = duracion ? Number(duracion) : null;
    const etiquetaVar = document.getElementById('variedadSeleccionada');
    if (etiquetaVar) {
        etiquetaVar.textContent = `✓ Especialidad: ${variedad} (${categoria}) · ${pesos(precioEspecialidadSeleccionada || 0)} · ${duracionEspecialidadSeleccionada || 60} min`;
        etiquetaVar.classList.remove('hidden');
    }
    actualizarResumenTotalCita();
    actualizarDisponibilidadHoras();
};

function filtrarEstilistas() {
    const idServicio = document.getElementById('servicio').value;
    const capacitadas = estilistas.filter((e) => (e.ids_servicios || '').split(',').includes(idServicio));
    document.getElementById('estilista').innerHTML =
        '<option value="">Asignación automática (Recomendado)</option>' +
        capacitadas.map((e) => {
            const notaDescanso = resumirDescansos(e);
            const cal = e.promedio_calificacion || '5.0';
            return `<option value="${e.id_estilista}">${escapar(e.nombres + ' ' + e.apellidos)} ★${cal} · (${escapar(notaDescanso)})</option>`;
        }).join('');
}

// Consulta la disponibilidad real del día y dibuja los botones de horas (verdes = libres, grises = ocupados)
async function actualizarDisponibilidadHoras() {
    const idServicio = document.getElementById('servicio').value;
    const idEstilista = document.getElementById('estilista').value;
    const fecha = document.getElementById('fecha').value;
    const grilla = document.getElementById('grillaHoras');
    const selectHora = document.getElementById('hora');
    const etiquetaDisp = document.getElementById('estadoDisponibilidad');

    if (!fecha || !idServicio || !grilla) return;

    const params = new URLSearchParams({
        fecha,
        idServicio,
        idUsuario: usuario.id
    });
    if (idEstilista) params.set('idEstilista', idEstilista);
    if (duracionEspecialidadSeleccionada) params.set('duracionEspecialidad', duracionEspecialidadSeleccionada);

    const res = await pedir(`/citas/disponibilidad?${params.toString()}`);
    if (!res.success) return;

    if (res.domingo) {
        etiquetaDisp.textContent = 'Cerrado los domingos';
        grilla.innerHTML = `<p class="col-span-full rounded-xl border border-amber-500/40 bg-amber-100/90 px-3 py-2 text-xs font-bold text-amber-950">El salón descansa los domingos. Por favor elige de lunes a sábado.</p>`;
        selectHora.innerHTML = '';
        return;
    }

    if (res.descansoEstilista) {
        etiquetaDisp.textContent = 'Día de descanso de la estilista';
        grilla.innerHTML = `<p class="col-span-full rounded-xl border border-bella-500/50 bg-pastel-rosa px-3 py-2.5 text-xs font-bold text-bella-900">La estilista seleccionada tiene día de descanso en esta fecha. Elige otro día en el calendario o selecciona "Asignación automática".</p>`;
        selectHora.innerHTML = '';
        return;
    }

    const bloques = res.data || [];
    const libres = bloques.filter((b) => b.disponible);
    etiquetaDisp.textContent = `${libres.length} horarios disponibles`;

    const horaPrevia = selectHora.value;
    const seleccionada = libres.some((b) => b.hora === horaPrevia)
        ? horaPrevia
        : (libres[0] ? libres[0].hora : '');

    selectHora.innerHTML = libres.map((b) =>
        `<option value="${b.hora}" ${b.hora === seleccionada ? 'selected' : ''}>${b.hora}</option>`).join('');

    grilla.innerHTML = bloques.map((b) => {
        if (!b.disponible) {
            return `<button type="button" disabled title="${escapar(b.motivo)}"
                            class="cursor-not-allowed rounded-xl border border-bella-300/40 bg-pastel-perla/40 py-2 text-center text-xs font-medium text-pastel-subtinta/40 line-through">
                        ${b.hora}
                    </button>`;
        }
        const activo = b.hora === seleccionada;
        return `<button type="button" data-hora-slot="${b.hora}"
                        class="rounded-xl border py-2 text-center text-xs font-bold transition ${
                            activo
                                ? 'border-bella-700 bg-bella-600 text-white shadow-sm'
                                : 'border-bella-300/80 bg-pastel-perla/80 text-pastel-tinta hover:border-bella-500 hover:bg-pastel-rosa'
                        }">
                    ${b.hora}
                </button>`;
    }).join('');

    grilla.querySelectorAll('button[data-hora-slot]').forEach((btn) => {
        btn.addEventListener('click', () => {
            selectHora.value = btn.dataset.horaSlot;
            grilla.querySelectorAll('button[data-hora-slot]').forEach((otro) => {
                const esEste = otro.dataset.horaSlot === selectHora.value;
                otro.className = `rounded-xl border py-2 text-center text-xs font-bold transition ${
                    esEste
                        ? 'border-bella-700 bg-bella-600 text-white shadow-sm'
                        : 'border-bella-300/80 bg-pastel-perla/80 text-pastel-tinta hover:border-bella-500 hover:bg-pastel-rosa'
                }`;
            });
        });
    });
}

function poblarSelectProductosClienta() {
    const selectProd = document.getElementById('productoAdicional');
    if (!selectProd) return;
    const conStock = productosDisponibles.filter((p) => Number(p.stock) > 0);
    selectProd.innerHTML =
        '<option value="">Sin producto adicional</option>' +
        conStock.map((p) =>
            `<option value="${p.id_producto}">${escapar(p.nombre)} · +${pesos(p.precio)} (${p.stock} disp.)</option>`
        ).join('');
}

async function iniciarClienta() {
    const conEstilista = servicios.filter((s) =>
        estilistas.some((e) => (e.ids_servicios || '').split(',').includes(String(s.id_servicio))));
    const select = document.getElementById('servicio');
    select.innerHTML = conEstilista.map((s) =>
        `<option value="${s.id_servicio}">${escapar(s.nombre)} · ${pesos(s.precio)} · ${s.duracion_min} min</option>`).join('');

    poblarSelectProductosClienta();

    const inputFecha = document.getElementById('fecha');
    inputFecha.min = fechaDeHoy();
    inputFecha.value = fechaDeHoy();

    select.addEventListener('change', (e) => {
        precioEspecialidadSeleccionada = null;
        duracionEspecialidadSeleccionada = null;
        filtrarEstilistas();
        actualizarResumenTotalCita();
        actualizarDisponibilidadHoras();
        const etiquetaVar = document.getElementById('variedadSeleccionada');
        if (etiquetaVar) etiquetaVar.classList.add('hidden');
        if (e.isTrusted && typeof abrirModalServicio === 'function') {
            const actual = conEstilista.find((s) => String(s.id_servicio) === String(select.value));
            if (actual) {
                abrirModalServicio(actual.nombre, {
                    idServicio: actual.id_servicio,
                    precio: actual.precio,
                    duracion: actual.duracion_min
                });
            }
        }
    });

    document.getElementById('productoAdicional')?.addEventListener('change', actualizarResumenTotalCita);
    document.getElementById('codigoPromocional')?.addEventListener('input', actualizarResumenTotalCita);
    document.getElementById('estilista').addEventListener('change', actualizarDisponibilidadHoras);
    inputFecha.addEventListener('change', actualizarDisponibilidadHoras);

    filtrarEstilistas();

    // Botón "Ver tipos y estilos"
    const btnVerTipos = document.getElementById('btnVerTiposServicio');
    if (btnVerTipos) {
        btnVerTipos.addEventListener('click', () => {
            const actual = conEstilista.find((s) => String(s.id_servicio) === String(select.value)) || conEstilista[0];
            if (actual && typeof abrirModalServicio === 'function') {
                abrirModalServicio(actual.nombre, {
                    idServicio: actual.id_servicio,
                    precio: actual.precio,
                    duracion: actual.duracion_min
                });
            }
        });
    }

    // Píldoras rápidas con todos los servicios disponibles
    const contenedorBotones = document.getElementById('botonesCatalogoClienta');
    if (contenedorBotones) {
        contenedorBotones.innerHTML = conEstilista.map((s) => `
            <button type="button"
                    data-explorar-id="${s.id_servicio}"
                    class="rounded-xl border border-bella-400/50 bg-pastel-crema px-2.5 py-1 text-xs font-bold text-pastel-tinta shadow-sm transition hover:border-bella-600 hover:bg-pastel-rosa">
                ${escapar(s.nombre)}
            </button>`).join('');
        contenedorBotones.querySelectorAll('button[data-explorar-id]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const srv = conEstilista.find((s) => String(s.id_servicio) === String(btn.dataset.explorarId));
                if (srv && typeof abrirModalServicio === 'function') {
                    abrirModalServicio(srv.nombre, {
                        idServicio: srv.id_servicio,
                        precio: srv.precio,
                        duracion: srv.duracion_min
                    });
                }
            });
        });
    }

    // Recuperar preferencia si eligió variedad desde la portada o login
    const prefTexto = sessionStorage.getItem('bellaVariedadPreferida');
    if (prefTexto) {
        try {
            const pref = JSON.parse(prefTexto);
            sessionStorage.removeItem('bellaVariedadPreferida');
            const coincidencia = conEstilista.find((s) =>
                limpiarTextoCatalogo(s.nombre).includes(limpiarTextoCatalogo(pref.servicio).split(' ')[0]));
            if (coincidencia) {
                select.value = String(coincidencia.id_servicio);
                filtrarEstilistas();
            }
            document.getElementById('observaciones').value = `Especialidad elegida: ${pref.variedad} (${pref.categoria})`;
            precioEspecialidadSeleccionada = pref.precio ? Number(pref.precio) : null;
            duracionEspecialidadSeleccionada = pref.duracion ? Number(pref.duracion) : null;
            const etiquetaVar = document.getElementById('variedadSeleccionada');
            if (etiquetaVar) {
                etiquetaVar.textContent = `✓ Especialidad: ${pref.variedad} (${pref.categoria})${precioEspecialidadSeleccionada ? ' · ' + pesos(precioEspecialidadSeleccionada) : ''}`;
                etiquetaVar.classList.remove('hidden');
            }
        } catch (_) {}
    }

    actualizarResumenTotalCita();
    await actualizarDisponibilidadHoras();

    document.getElementById('formCita').addEventListener('submit', agendarCita);
    document.getElementById('btnEditarMisDatos').addEventListener('click', editarMisDatos);
    cargarMisDatos();
    cargarCitasClienta();
}

async function agendarCita(e) {
    e.preventDefault();
    const alerta = document.getElementById('alertaCita');
    const bannerCorreo = document.getElementById('bannerCorreoCita');
    ocultarAlerta(alerta);
    if (bannerCorreo) bannerCorreo.classList.add('hidden');

    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    if (!hora) {
        return mostrarAlerta(alerta, 'Selecciona una hora disponible para tu cita.');
    }

    const idProducto = document.getElementById('productoAdicional')?.value || null;
    const codigoPromo = document.getElementById('codigoPromocional')?.value.trim() || '';
    const finalizadasCount = citasClienta.filter((c) => c.estado === 'Finalizada').length;

    const respuesta = await pedir('/citas', 'POST', {
        idUsuario: usuario.id,
        idServicio: document.getElementById('servicio').value,
        idEstilista: document.getElementById('estilista').value || null,
        fecha,
        hora,
        observaciones: document.getElementById('observaciones').value.trim(),
        idProducto,
        precioEspecialidad: precioEspecialidadSeleccionada,
        duracionEspecialidad: duracionEspecialidadSeleccionada,
        codigoPromo,
        aplicarVip: finalizadasCount >= 3
    });

    if (respuesta.success) {
        mostrarAlerta(alerta, respuesta.message, 'ok');
        avisar(respuesta.message);
        document.getElementById('observaciones').value = '';
        if (document.getElementById('productoAdicional')) {
            document.getElementById('productoAdicional').value = '';
        }
        precioEspecialidadSeleccionada = null;
        duracionEspecialidadSeleccionada = null;
        const etiquetaVar = document.getElementById('variedadSeleccionada');
        if (etiquetaVar) etiquetaVar.classList.add('hidden');

        // Mostrar confirmación del correo enviado con botón para abrirlo
        if (respuesta.correo && bannerCorreo) {
            ultimoCorreoAgendado = respuesta.correo;
            bannerCorreo.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <p class="font-bold text-emerald-950">✉️ Correo enviado a ${escapar(respuesta.correo.para)}</p>
                        <p class="text-[11px] font-medium text-pastel-subtinta">"Tu cita ha sido agendada para la fecha ${escapar(fecha)} a las ${escapar(hora)}..." con toda la descripción de tu servicio.</p>
                    </div>
                    <button type="button" id="btnVerUltimoCorreo" class="rounded-xl bg-bella-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                        ✉️ Ver correo enviado
                    </button>
                </div>`;
            bannerCorreo.classList.remove('hidden');
            document.getElementById('btnVerUltimoCorreo')?.addEventListener('click', () => mostrarModalCorreo(ultimoCorreoAgendado));
        }

        productosDisponibles = (await pedir('/productos')).data || [];
        poblarSelectProductosClienta();
        actualizarResumenTotalCita();
        await cargarCitasClienta();
        await actualizarDisponibilidadHoras();
    } else {
        mostrarAlerta(alerta, respuesta.message);
    }
}

async function cargarMisDatos() {
    miPerfilClienta = (await pedir(`/clientas/usuario/${usuario.id}`)).data;
    if (!miPerfilClienta) return;
    const c = miPerfilClienta;
    document.getElementById('misDatos').innerHTML = `
        <div><dt class="inline font-bold text-pastel-tinta">Nombre:</dt> <dd class="inline">${escapar(c.nombres + ' ' + c.apellidos)}</dd></div>
        <div><dt class="inline font-bold text-pastel-tinta">Teléfono:</dt> <dd class="inline">${escapar(c.telefono || '—')}</dd></div>
        <div><dt class="inline font-bold text-pastel-tinta">Correo:</dt> <dd class="inline">${escapar(c.email || '—')}</dd></div>`;
}

function editarMisDatos() {
    const c = miPerfilClienta;
    abrirVentana('Mis datos de contacto',
        campo('vNombres', 'Nombres', c.nombres, 'text', 'required') +
        campo('vApellidos', 'Apellidos', c.apellidos, 'text', 'required') +
        campo('vTelefono', 'Teléfono', c.telefono || '', 'tel') +
        campo('vEmail', 'Correo', c.email || '', 'email'),
        async () => {
            const respuesta = await pedir(`/clientas/${c.id_clienta}`, 'PUT', {
                nombres: valor('vNombres'), apellidos: valor('vApellidos'),
                telefono: valor('vTelefono'), email: valor('vEmail')
            });
            if (respuesta.success) cargarMisDatos();
            return respuesta;
        });
}

function reprogramarCita(idCita) {
    const cita = citasClienta.find((c) => String(c.id) === String(idCita));
    abrirVentana(`Reprogramar: ${cita.servicio}`,
        `<p class="text-sm font-medium text-pastel-subtinta">Se mantiene la misma estilista (${escapar(cita.estilista)}). La cita vuelve a quedar pendiente.</p>` +
        campo('vFecha', 'Nueva fecha', cita.fecha, 'date', `min="${fechaDeHoy()}" required`) +
        `<div>
            <label for="vHora" class="etiqueta-oscura">Nueva hora</label>
            <select id="vHora" class="campo-pastel">${opcionesHora(cita.hora)}</select>
        </div>`,
        async () => {
            const respuesta = await pedir(`/citas/${idCita}/reprogramar`, 'PUT', { fecha: valor('vFecha'), hora: valor('vHora') });
            if (respuesta.success) {
                cargarCitasClienta();
                actualizarDisponibilidadHoras();
            }
            return respuesta;
        });
}

async function cargarCitasClienta() {
    const tabla = document.getElementById('tablaCitasClienta');
    citasClienta = (await pedir(`/citas?rol=Clienta&idUsuario=${usuario.id}`)).data || [];

    // Actualizar métricas de la clienta
    const activas = citasClienta.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
    const finalizadas = citasClienta.filter((c) => c.estado === 'Finalizada');
    const contMetricas = document.getElementById('metricasClienta');
    if (contMetricas) {
        contMetricas.innerHTML =
            tarjetaMetrica('Citas activas', activas.length, 'bg-pastel-rosa') +
            tarjetaMetrica('Servicios recibidos', finalizadas.length, 'bg-pastel-lavanda') +
            tarjetaMetrica('Total historial', citasClienta.length, 'bg-pastel-menta');
    }

    // Tarjeta de Fidelización VIP BellaClub
    const contClub = document.getElementById('tarjetaBellaClub');
    if (contClub) {
        const sellos = Math.min(3, finalizadas.length);
        const esVip = finalizadas.length >= 3;
        contClub.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span class="inline-flex items-center gap-1 rounded-full bg-bella-600/15 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-bella-900">
                        💎 Programa de Fidelización BellaClub
                    </span>
                    <h3 class="mt-1 text-lg font-bold text-pastel-tinta">
                        ${esVip ? '¡Felicidades! Eres Clienta VIP con 15% de descuento activo' : `Llevas ${sellos} de 3 visitas completadas para tu 15% OFF VIP`}
                    </h3>
                    <p class="text-xs font-medium text-pastel-subtinta">
                        También puedes usar el cupón promocional <strong>BELLA15</strong> en tu próxima reserva para obtener <strong>15% de descuento inmediato</strong>.
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    ${[1, 2, 3].map((n) => `
                        <div class="flex h-11 w-11 items-center justify-center rounded-2xl border-2 text-sm font-extrabold shadow-sm ${
                            n <= sellos
                                ? 'border-bella-600 bg-bella-600 text-white'
                                : 'border-bella-300 bg-pastel-perla text-pastel-subtinta'
                        }">
                            ${n <= sellos ? '★' : n}
                        </div>`).join('')}
                    <button type="button" id="btnActivarCuponBella" class="ml-2 rounded-xl bg-bella-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                        Aplicar 15% OFF
                    </button>
                </div>
            </div>`;
        document.getElementById('btnActivarCuponBella')?.addEventListener('click', () => {
            const inputCupon = document.getElementById('codigoPromocional');
            if (inputCupon) {
                inputCupon.value = 'BELLA15';
                actualizarResumenTotalCita();
                avisar('¡Cupón BELLA15 (15% de descuento) aplicado en tu formulario!');
            }
        });
    }
    actualizarResumenTotalCita();

    tabla.innerHTML = citasClienta.length === 0 ? filaVacia(5, 'Todavía no tienes citas agendadas') : citasClienta.map((c) => {
        const activa = c.estado === 'Pendiente' || c.estado === 'Confirmada';
        let acciones =
            botonEditar('💬 Chat', 'abrirChatCita', c.id) + ' ' +
            botonEditar('🧾 Comprobante', 'verComprobanteCita', c.id) + ' ' +
            botonEditar('✉️ Correo', 'verCorreoCita', c.id) + ' ';
        if (activa) {
            acciones +=
                botonEditar('Reprogramar', 'reprogramarCita', c.id) + ' ' +
                botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        } else if (c.estado === 'Finalizada') {
            acciones += `<button class="btn-mini bg-amber-400/20 font-bold text-amber-300 hover:bg-amber-400/30" data-editar="calificarCita" data-id="${c.id}">★ ${c.calificacion ? 'Editar reseña' : 'Calificar'}</button>`;
        }
        return `
            <tr>
                <td>
                    <span class="font-semibold text-white">${escapar(c.servicio)}</span>
                    <span class="ml-1 text-xs font-bold text-oro">${pesos(c.precio)}</span>
                    ${c.duracion_min ? `<span class="ml-1 text-[11px] text-white/50">(${c.duracion_min} min)</span>` : ''}
                    ${c.observaciones ? `<span class="mt-0.5 block text-xs text-bella-200">${escapar(c.observaciones)}</span>` : ''}
                    ${c.producto_adicional ? `<span class="mt-0.5 block text-xs font-semibold text-emerald-300">🧴 Incluye: ${escapar(c.producto_adicional)} (+${pesos(c.precio_producto)})</span>` : ''}
                    ${renderizarEstrellas(c.calificacion, c.comentario_calificacion)}
                </td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${escapar(c.estilista)}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, async () => {
        await cargarCitasClienta();
        await actualizarDisponibilidadHoras();
    });
}

// ---------------------------------------------------------------
// ESTILISTA
// ---------------------------------------------------------------

let miPerfilEstilista = null;

async function iniciarEstilista() {
    document.getElementById('btnEditarMisServicios').addEventListener('click', () => editarServiciosEstilista(miPerfilEstilista.id_estilista));
    const buscador = document.getElementById('buscarCitaEstilista');
    if (buscador) buscador.addEventListener('input', dibujarCitasEstilista);

    const btnTl = document.getElementById('btnToggleTimelineEstilista');
    const bloqueTl = document.getElementById('bloqueTimelineEstilista');
    const inputFechaTl = document.getElementById('fechaTimelineEstilista');
    if (inputFechaTl) {
        inputFechaTl.value = fechaDeHoy();
        inputFechaTl.addEventListener('change', () => {
            dibujarTimelineDia(inputFechaTl.value, citasEstilistaLista, 'contenedorTimelineEstilista');
        });
    }
    if (btnTl && bloqueTl) {
        btnTl.addEventListener('click', () => {
            bloqueTl.classList.toggle('hidden');
            if (!bloqueTl.classList.contains('hidden')) {
                dibujarTimelineDia(inputFechaTl?.value || fechaDeHoy(), citasEstilistaLista, 'contenedorTimelineEstilista');
            }
        });
    }

    cargarMiPerfilEstilista();
    cargarCitasEstilista();
}

async function cargarMiPerfilEstilista() {
    miPerfilEstilista = (await pedir(`/estilistas/usuario/${usuario.id}`)).data;
    document.getElementById('misServicios').textContent = miPerfilEstilista
        ? (miPerfilEstilista.servicios || 'Aún no tienes servicios asignados.')
        : 'No se encontró tu perfil de estilista.';

    const insigniaEsp = document.getElementById('insigniaEspecialidadEstilista');
    if (insigniaEsp && miPerfilEstilista) {
        const prom = miPerfilEstilista.promedio_calificacion || '5.0';
        const totalCal = miPerfilEstilista.total_calificaciones || 0;
        insigniaEsp.textContent = `✦ Especialización: ${miPerfilEstilista.especialidad || 'Estilista profesional'} · ★ ${prom} (${totalCal} reseñas)`;
    }

    dibujarMiHorarioPersonal();
}

// Dibuja exclusivamente el horario laboral de la estilista que inició sesión
function dibujarMiHorarioPersonal() {
    const contenedor = document.getElementById('miHorarioEstilista');
    const resumen = document.getElementById('resumenMiHorario');
    if (!contenedor || !miPerfilEstilista) return;

    const horarios = obtenerHorariosDe(miPerfilEstilista);
    const diasLaborales = horarios.filter((h) => h.trabaja).length;
    const diasDescanso = horarios.filter((h) => !h.trabaja).map((h) => NOMBRES_DIAS[h.dia_semana]);

    if (resumen) {
        resumen.textContent = diasDescanso.length > 0
            ? `Horario personal de ${miPerfilEstilista.nombres} ${miPerfilEstilista.apellidos}: trabajas ${diasLaborales} días a la semana · Día(s) de descanso: ${diasDescanso.join(', ')}.`
            : `Horario personal de ${miPerfilEstilista.nombres} ${miPerfilEstilista.apellidos}: trabajas de lunes a sábado.`;
    }

    const diaHoy = new Date().getDay();
    contenedor.innerHTML = horarios.map((h) => {
        const nombreDia = NOMBRES_DIAS[h.dia_semana];
        const esHoy = diaHoy === Number(h.dia_semana);
        if (h.trabaja) {
            return `
                <div class="rounded-2xl border ${esHoy ? 'border-bella-600 ring-2 ring-bella-500/40' : 'border-emerald-500/40'} bg-pastel-menta p-3.5 text-pastel-tinta shadow-sm">
                    <div class="flex items-center justify-between gap-1">
                        <p class="text-sm font-bold text-pastel-tinta">${nombreDia}</p>
                        <span class="rounded-full bg-emerald-700/15 px-2 py-0.5 text-[10px] font-bold text-emerald-950">${esHoy ? 'Hoy · Activo' : 'Laboral'}</span>
                    </div>
                    <p class="mt-2 font-titulo text-xl font-bold text-emerald-950">${escapar(h.hora_inicio)} – ${escapar(h.hora_fin)}</p>
                    <p class="mt-0.5 text-[11px] font-semibold text-pastel-subtinta">Turno asignado</p>
                </div>`;
        }
        return `
            <div class="rounded-2xl border ${esHoy ? 'border-bella-600 ring-2 ring-bella-500/40' : 'border-bella-400/50'} bg-pastel-rosa p-3.5 text-pastel-tinta shadow-sm">
                <div class="flex items-center justify-between gap-1">
                    <p class="text-sm font-bold text-pastel-tinta">${nombreDia}</p>
                    <span class="rounded-full bg-bella-700/15 px-2 py-0.5 text-[10px] font-bold text-bella-900">Descanso</span>
                </div>
                <p class="mt-2 font-titulo text-xl font-bold text-bella-900">Día libre</p>
                <p class="mt-0.5 text-[11px] font-semibold text-pastel-subtinta">No recibes citas</p>
            </div>`;
    }).join('');
}

async function cargarCitasEstilista() {
    citasEstilistaLista = (await pedir(`/citas?rol=Estilista&idUsuario=${usuario.id}`)).data || [];

    const finalizadas = citasEstilistaLista.filter((c) => c.estado === 'Finalizada');
    const pendientes = citasEstilistaLista.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
    const ganado = finalizadas.reduce((total, c) => total + Number(c.precio), 0);

    document.getElementById('metricasEstilista').innerHTML =
        tarjetaMetrica('Total de citas', citasEstilistaLista.length, 'bg-pastel-rosa') +
        tarjetaMetrica('Por atender', pendientes.length, 'bg-pastel-durazno') +
        tarjetaMetrica('Finalizadas', finalizadas.length, 'bg-pastel-lavanda') +
        tarjetaMetrica('Mi comisión (40%)', pesos(ganado * 0.4), 'bg-pastel-menta');

    dibujarCitasEstilista();
}

function dibujarCitasEstilista() {
    const q = (document.getElementById('buscarCitaEstilista')?.value || '').trim().toLowerCase();
    const citas = q
        ? citasEstilistaLista.filter((c) =>
            `${c.cliente} ${c.servicio} ${c.observaciones || ''} ${c.fecha}`.toLowerCase().includes(q))
        : citasEstilistaLista;

    const tabla = document.getElementById('tablaCitasEstilista');
    tabla.innerHTML = citas.length === 0 ? filaVacia(6, 'No hay citas que coincidan') : citas.map((c) => {
        let acciones =
            botonEditar('💬 Chat', 'abrirChatCita', c.id) + ' ' +
            botonEditar('📋 Ficha clienta', 'verFichaClientaDesdeCita', c.id) + ' ' +
            botonEditar('🧾 Comprobante', 'verComprobanteCita', c.id) + ' ';
        if (c.estado === 'Pendiente') {
            acciones += botonAccion('Confirmar', 'azul', `/citas/${c.id}/estado`, { estado: 'Confirmada' }) + ' ';
        }
        if (c.estado === 'Pendiente' || c.estado === 'Confirmada') {
            acciones += botonAccion('Finalizar', 'verde', `/citas/${c.id}/estado`, { estado: 'Finalizada' }) + ' ';
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        }
        return `
            <tr>
                <td class="font-mono text-xs text-white/50">BS-${c.id}</td>
                <td>
                    <span class="font-medium text-white">${escapar(c.cliente)}</span>
                    ${c.ficha_tecnica ? `<span class="mt-0.5 block text-[11px] text-bella-200">📋 ${escapar(c.ficha_tecnica)}</span>` : ''}
                </td>
                <td>
                    <span>${escapar(c.servicio)}</span>
                    ${c.observaciones ? `<span class="block text-xs text-bella-200">${escapar(c.observaciones)}</span>` : ''}
                    ${c.producto_adicional ? `<span class="block text-xs font-semibold text-emerald-300">🧴 ${escapar(c.producto_adicional)}</span>` : ''}
                    ${renderizarEstrellas(c.calificacion, c.comentario_calificacion)}
                </td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasEstilista);
}

function editarServiciosEstilista(idEstilista) {
    const estilista = usuario.rol === 'Estilista'
        ? miPerfilEstilista
        : estilistasAdmin.find((e) => String(e.id_estilista) === String(idEstilista));
    const seleccionados = (estilista.ids_servicios || '').split(',');

    abrirVentana(`Servicios y especialización · ${estilista.nombres} ${estilista.apellidos}`,
        campo('vEspecialidadEstilista', 'Especialización principal', estilista.especialidad || '', 'text', 'required') +
        casillasServicios(servicios, seleccionados),
        async () => {
            const respuesta = await pedir(`/estilistas/${idEstilista}/servicios`, 'PUT', {
                especialidad: valor('vEspecialidadEstilista'),
                servicios: serviciosMarcados()
            });
            if (respuesta.success) {
                if (usuario.rol === 'Estilista') cargarMiPerfilEstilista();
                else cargarEstilistasAdmin();
            }
            return respuesta;
        });
}

// ---------------------------------------------------------------
// ADMINISTRADORA
// ---------------------------------------------------------------

let estilistasAdmin = [];
let clientasAdmin = [];
let serviciosAdmin = [];
let productosAdmin = [];

function activarPestanas() {
    document.querySelectorAll('[data-pestana]').forEach((boton) => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('[data-pestana]').forEach((b) => b.classList.remove('pestana-activa'));
            boton.classList.add('pestana-activa');
            document.querySelectorAll('[data-panel]').forEach((panel) => {
                panel.classList.toggle('hidden', panel.dataset.panel !== boton.dataset.pestana);
            });
        });
    });
}

// --- Citas ---

async function cargarCitasAdmin() {
    citasAdmin = (await pedir('/citas')).data || [];

    const finalizadas = citasAdmin.filter((c) => c.estado === 'Finalizada');
    const pendientes = citasAdmin.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
    const ingresos = finalizadas.reduce((total, c) => total + Number(c.precio), 0);

    document.getElementById('metricasAdmin').innerHTML =
        tarjetaMetrica('Total de citas', citasAdmin.length, 'bg-pastel-rosa') +
        tarjetaMetrica('Por atender', pendientes.length, 'bg-pastel-durazno') +
        tarjetaMetrica('Finalizadas', finalizadas.length, 'bg-pastel-lavanda') +
        tarjetaMetrica('Ingresos', pesos(ingresos), 'bg-pastel-menta');

    dibujarGraficasAdmin();
    const fechaTl = document.getElementById('fechaTimelineAdmin')?.value || fechaDeHoy();
    dibujarTimelineDia(fechaTl, citasAdmin, 'contenedorTimelineAdmin');
    dibujarCitasAdmin();
}

function dibujarGraficasAdmin() {
    const cont = document.getElementById('graficasAdmin');
    if (!cont) return;

    const noCanceladas = citasAdmin.filter((c) => c.estado !== 'Cancelada');
    // 1. Ingresos por servicio
    const mapaServicios = {};
    noCanceladas.forEach((c) => {
        if (!mapaServicios[c.servicio]) mapaServicios[c.servicio] = { total: 0, cantidad: 0 };
        mapaServicios[c.servicio].total += Number(c.precio || 0);
        mapaServicios[c.servicio].cantidad += 1;
    });
    const rankingSrv = Object.entries(mapaServicios)
        .map(([nombre, v]) => ({ nombre, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    const maxSrv = Math.max(1, ...rankingSrv.map((s) => s.total));

    // 2. Desempeño por estilista
    const mapaEstilistas = {};
    noCanceladas.forEach((c) => {
        if (!mapaEstilistas[c.estilista]) mapaEstilistas[c.estilista] = { total: 0, citas: 0 };
        mapaEstilistas[c.estilista].total += Number(c.precio || 0);
        mapaEstilistas[c.estilista].citas += 1;
    });
    const rankingEst = Object.entries(mapaEstilistas)
        .map(([nombre, v]) => ({ nombre, ...v }))
        .sort((a, b) => b.citas - a.citas)
        .slice(0, 5);
    const maxEst = Math.max(1, ...rankingEst.map((e) => e.citas));

    // 3. Distribución por estados
    const total = Math.max(1, citasAdmin.length);
    const conteoEstados = [
        { label: 'Finalizadas', cant: citasAdmin.filter((c) => c.estado === 'Finalizada').length, barra: 'bg-emerald-600' },
        { label: 'Confirmadas', cant: citasAdmin.filter((c) => c.estado === 'Confirmada').length, barra: 'bg-sky-600' },
        { label: 'Pendientes',  cant: citasAdmin.filter((c) => c.estado === 'Pendiente').length,  barra: 'bg-amber-500' },
        { label: 'Canceladas',  cant: citasAdmin.filter((c) => c.estado === 'Cancelada').length,  barra: 'bg-rose-600' }
    ];

    cont.innerHTML = `
        <div class="tarjeta-pastel p-4 sm:p-5">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-bella-800">📊 Analítica comercial</span>
            <h3 class="mt-0.5 text-lg font-bold text-pastel-tinta">Ingresos por servicio</h3>
            <div class="mt-3 space-y-2.5">
                ${rankingSrv.map((s) => {
                    const pct = Math.max(8, Math.round((s.total / maxSrv) * 100));
                    return `
                        <div>
                            <div class="flex justify-between text-xs font-bold text-pastel-tinta">
                                <span>${escapar(s.nombre)} <span class="text-[11px] font-medium text-pastel-subtinta">(${s.cantidad} citas)</span></span>
                                <span class="text-bella-800">${pesos(s.total)}</span>
                            </div>
                            <div class="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-pastel-perla">
                                <div class="h-full rounded-full bg-bella-600" style="width:${pct}%"></div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>

        <div class="tarjeta-pastel p-4 sm:p-5">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-bella-800">👑 Productividad del equipo</span>
            <h3 class="mt-0.5 text-lg font-bold text-pastel-tinta">Citas y facturación por estilista</h3>
            <div class="mt-3 space-y-2.5">
                ${rankingEst.map((e) => {
                    const pct = Math.max(10, Math.round((e.citas / maxEst) * 100));
                    return `
                        <div>
                            <div class="flex justify-between text-xs font-bold text-pastel-tinta">
                                <span>${escapar(e.nombre)}</span>
                                <span class="text-emerald-950">${e.citas} citas · ${pesos(e.total)}</span>
                            </div>
                            <div class="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-pastel-perla">
                                <div class="h-full rounded-full bg-emerald-600" style="width:${pct}%"></div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>

        <div class="tarjeta-pastel p-4 sm:p-5">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-bella-800">📈 Estado operativo</span>
            <h3 class="mt-0.5 text-lg font-bold text-pastel-tinta">Distribución de estados (${citasAdmin.length} citas)</h3>
            <div class="mt-3 space-y-2.5">
                ${conteoEstados.map((st) => {
                    const pct = Math.round((st.cant / total) * 100);
                    return `
                        <div>
                            <div class="flex justify-between text-xs font-bold text-pastel-tinta">
                                <span>${st.label}</span>
                                <span>${st.cant} (${pct}%)</span>
                            </div>
                            <div class="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-pastel-perla">
                                <div class="h-full rounded-full ${st.barra}" style="width:${Math.max(4, pct)}%"></div>
                            </div>
                        </div>`;
                }).join('')}
            </div>
        </div>`;
}

function obtenerCitasFiltradasAdmin() {
    const filtro = document.getElementById('filtroEstado').value;
    const q = (document.getElementById('buscarCitaAdmin')?.value || '').trim().toLowerCase();
    return citasAdmin.filter((c) => {
        if (filtro && c.estado !== filtro) return false;
        if (q && !`${c.id} ${c.cliente} ${c.servicio} ${c.estilista} ${c.observaciones || ''} ${c.fecha}`.toLowerCase().includes(q)) return false;
        return true;
    });
}

function dibujarCitasAdmin() {
    const citas = obtenerCitasFiltradasAdmin();
    const tabla = document.getElementById('tablaCitasAdmin');

    tabla.innerHTML = citas.length === 0 ? filaVacia(7, 'No se encontraron citas con ese filtro') : citas.map((c) => {
        let acciones =
            botonEditar('💬 Chat', 'abrirChatCita', c.id) + ' ' +
            botonEditar('🧾 Comprobante', 'verComprobanteCita', c.id) + ' ' +
            botonEditar('✉️ Correo', 'verCorreoCita', c.id) + ' ';
        if (c.estado === 'Pendiente') {
            acciones += botonAccion('Confirmar', 'azul', `/citas/${c.id}/estado`, { estado: 'Confirmada' }) + ' ';
        }
        if (c.estado === 'Pendiente' || c.estado === 'Confirmada') {
            acciones += botonAccion('Finalizar', 'verde', `/citas/${c.id}/estado`, { estado: 'Finalizada' }) + ' ';
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        }
        return `
            <tr>
                <td class="font-mono text-xs text-white/50">BS-${c.id}</td>
                <td>
                    <span class="font-medium text-white">${escapar(c.cliente)}</span>
                    ${c.ficha_tecnica ? `<span class="mt-0.5 block text-[11px] text-bella-200">📋 ${escapar(c.ficha_tecnica)}</span>` : ''}
                </td>
                <td>
                    <span>${escapar(c.servicio)}</span>
                    <span class="ml-1 text-xs font-bold text-oro">${pesos(c.precio)}</span>
                    ${c.observaciones ? `<span class="block text-xs text-bella-200">${escapar(c.observaciones)}</span>` : ''}
                    ${c.producto_adicional ? `<span class="block text-xs font-semibold text-emerald-300">🧴 ${escapar(c.producto_adicional)} (+${pesos(c.precio_producto)})</span>` : ''}
                    ${renderizarEstrellas(c.calificacion, c.comentario_calificacion)}
                </td>
                <td>${escapar(c.estilista)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasAdmin);
}

// Agendamiento directo por la Administradora (para atención telefónica o presencial)
function abrirModalNuevaCitaAdmin() {
    if (clientasAdmin.length === 0) {
        return avisar('Primero registra al menos una clienta');
    }
    const serviciosDisp = servicios.filter((s) =>
        estilistas.some((e) => (e.ids_servicios || '').split(',').includes(String(s.id_servicio))));
    const prodsStock = productosAdmin.filter((p) => p.estado === 'Activo' && Number(p.stock) > 0);

    const html = `
        <p class="text-xs font-semibold text-pastel-subtinta">
            Agenda una cita directamente a nombre de una clienta y envíale su correo de confirmación automático.
        </p>
        <div>
            <label for="admClienta" class="etiqueta-oscura">Clienta</label>
            <select id="admClienta" class="campo-pastel" required>
                ${clientasAdmin.map((c) => `<option value="${c.id_clienta}">${escapar(c.nombres + ' ' + c.apellidos)} (${escapar(c.email || c.telefono || 'Sin correo')})</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="admServicio" class="etiqueta-oscura">Servicio</label>
            <select id="admServicio" class="campo-pastel" required>
                ${serviciosDisp.map((s) => `<option value="${s.id_servicio}">${escapar(s.nombre)} · ${pesos(s.precio)} · ${s.duracion_min} min</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="admProducto" class="etiqueta-oscura">Producto adicional (opcional)</label>
            <select id="admProducto" class="campo-pastel">
                <option value="">Sin producto adicional</option>
                ${prodsStock.map((p) => `<option value="${p.id_producto}">${escapar(p.nombre)} · +${pesos(p.precio)} (${p.stock} disp.)</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="admEstilista" class="etiqueta-oscura">Estilista</label>
            <select id="admEstilista" class="campo-pastel">
                <option value="">Asignación automática (Recomendado)</option>
                ${estilistas.map((e) => `<option value="${e.id_estilista}">${escapar(e.nombres + ' ' + e.apellidos)} · (${escapar(resumirDescansos(e))})</option>`).join('')}
            </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
            ${campo('admFecha', 'Fecha', fechaDeHoy(), 'date', `min="${fechaDeHoy()}" required`)}
            <div>
                <label for="admHora" class="etiqueta-oscura">Hora</label>
                <select id="admHora" class="campo-pastel">${opcionesHora('10:00')}</select>
            </div>
        </div>
        ${campo('admObservaciones', 'Especialidad / Observaciones', '', 'text', 'placeholder="Ej. Balayage caramelo, Uñas acrílicas francesas..."')}`;

    abrirVentana('+ Agendar cita directa a clienta', html, async () => {
        const res = await pedir('/citas', 'POST', {
            idClienta: Number(valor('admClienta')),
            idServicio: Number(valor('admServicio')),
            idEstilista: valor('admEstilista') ? Number(valor('admEstilista')) : null,
            idProducto: valor('admProducto') ? Number(valor('admProducto')) : null,
            fecha: valor('admFecha'),
            hora: valor('admHora'),
            observaciones: valor('admObservaciones')
        });
        if (res.success) {
            await cargarCitasAdmin();
            await cargarProductosAdmin();
            if (res.correo) {
                setTimeout(() => mostrarModalCorreo(res.correo), 250);
            }
        }
        return res;
    }, 'Confirmar y enviar correo');
}

// Exporta las citas filtradas a un archivo CSV compatible con Excel
function exportarCitasCSV() {
    const citas = obtenerCitasFiltradasAdmin();
    if (citas.length === 0) return avisar('No hay citas para exportar');

    const encabezados = ['Codigo', 'Clienta', 'Servicio', 'Especialidad_Observaciones', 'Producto_Adicional', 'Estilista', 'Fecha', 'Hora', 'Precio_Total', 'Estado', 'Calificacion'];
    const filas = citas.map((c) => [
        `BS-${c.id}`,
        c.cliente,
        c.servicio,
        c.observaciones || '',
        c.producto_adicional || '',
        c.estilista,
        c.fecha,
        c.hora,
        c.precio,
        c.estado,
        c.calificacion ? `${c.calificacion}/5` : ''
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + [encabezados.join(','), ...filas].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_citas_bellastyle_${fechaDeHoy()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    avisar('Reporte CSV descargado correctamente');
}

// --- Estilistas y asignación de horarios ---

function renderizarResumenHorarioEstilista(e) {
    const horarios = obtenerHorariosDe(e);
    const descansos = horarios.filter((h) => !h.trabaja).map((h) => NOMBRES_DIAS[h.dia_semana]);
    const laborales = horarios.filter((h) => h.trabaja);
    const rangoPrincipal = laborales.length > 0
        ? `${laborales[0].hora_inicio} – ${laborales[0].hora_fin}`
        : 'Sin turnos';

    const pillDescanso = descansos.length > 0
        ? `<span class="inline-block rounded-lg border border-bella-400/50 bg-pastel-rosa px-2 py-0.5 text-[11px] font-bold text-bella-900">Descansa: ${escapar(descansos.join(', '))}</span>`
        : `<span class="inline-block rounded-lg border border-emerald-400/50 bg-pastel-menta px-2 py-0.5 text-[11px] font-bold text-emerald-950">Lun a Sáb activo</span>`;

    return `
        <div class="space-y-1">
            ${pillDescanso}
            <p class="text-xs text-bella-100/80">${laborales.length} días laborales · Turno base ${escapar(rangoPrincipal)}</p>
        </div>`;
}

function dibujarCalendarioDisponibilidadAdmin() {
    const inputFecha = document.getElementById('fechaCalendarioAdmin');
    const selectFiltro = document.getElementById('filtroDisponibilidadDia');
    const resumen = document.getElementById('resumenCalendarioAdmin');
    const contenedor = document.getElementById('tarjetasCalendarioEstilistas');
    if (!inputFecha || !contenedor) return;

    if (!inputFecha.value) inputFecha.value = fechaDeHoy();
    const fecha = inputFecha.value;
    const diaObj = new Date(fecha + 'T12:00:00');
    const diaSemana = diaObj.getDay();

    if (diaSemana === 0) {
        resumen.textContent = `Fecha seleccionada: ${fecha} (Domingo) · El salón permanece cerrado los domingos.`;
        contenedor.innerHTML = `<div class="col-span-full rounded-xl border border-amber-500/40 bg-amber-100/90 p-3 text-xs font-bold text-amber-950">Los domingos son día de descanso general para todo el equipo del salón. Selecciona una fecha de lunes a sábado.</div>`;
        return;
    }

    const nombreDia = NOMBRES_DIAS[diaSemana] || 'Día hábil';
    const filtro = selectFiltro ? selectFiltro.value : 'todas';

    const evaluadas = estilistasAdmin.map((e) => {
        const horarios = obtenerHorariosDe(e);
        const turno = horarios.find((h) => Number(h.dia_semana) === diaSemana) || { trabaja: true, hora_inicio: '08:00', hora_fin: '19:00' };
        const disponibleHoy = e.estado === 'Activo' && Boolean(turno.trabaja);
        return { estilista: e, turno, disponibleHoy };
    });

    const totalDisponibles = evaluadas.filter((x) => x.disponibleHoy).length;
    const totalDescanso = evaluadas.filter((x) => x.estilista.estado === 'Activo' && !x.turno.trabaja).length;
    resumen.textContent = `${nombreDia} (${fecha}): ${totalDisponibles} estilista(s) disponibles para trabajar · ${totalDescanso} en día de descanso.`;

    const filtradas = evaluadas.filter((x) => {
        if (filtro === 'disponibles') return x.disponibleHoy;
        if (filtro === 'descanso') return !x.turno.trabaja;
        return true;
    });

    if (filtradas.length === 0) {
        contenedor.innerHTML = `<p class="col-span-full rounded-xl border border-bella-300/60 bg-pastel-perla p-3 text-xs font-semibold text-pastel-subtinta">No hay estilistas en esa condición para el ${nombreDia}.</p>`;
        return;
    }

    contenedor.innerHTML = filtradas.map(({ estilista: e, turno, disponibleHoy }) => {
        let badge = '';
        let bgClase = 'bg-pastel-perla';
        if (e.estado !== 'Activo') {
            badge = `<span class="rounded-full bg-stone-500/20 px-2.5 py-0.5 text-[10px] font-bold text-stone-800">Cuenta Inactiva</span>`;
        } else if (disponibleHoy) {
            bgClase = 'bg-pastel-menta';
            badge = `<span class="rounded-full bg-emerald-700/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-950">Disponible · ${escapar(turno.hora_inicio)}–${escapar(turno.hora_fin)}</span>`;
        } else {
            bgClase = 'bg-pastel-rosa';
            badge = `<span class="rounded-full bg-bella-700/15 px-2.5 py-0.5 text-[10px] font-bold text-bella-900">Descansa este ${nombreDia}</span>`;
        }

        return `
            <div class="flex flex-col justify-between rounded-2xl border border-bella-300/70 ${bgClase} p-3.5 text-pastel-tinta shadow-sm">
                <div>
                    <div class="flex items-start justify-between gap-2">
                        <p class="font-bold text-pastel-tinta">${escapar(e.nombres + ' ' + e.apellidos)}</p>
                        ${badge}
                    </div>
                    <p class="mt-1 text-xs font-semibold text-bella-900">${escapar(e.especialidad || 'Estilista profesional')} · ★ ${e.promedio_calificacion || '5.0'}</p>
                    <p class="mt-0.5 text-[11px] text-pastel-subtinta">${escapar(e.servicios || 'Sin servicios')}</p>
                </div>
                <div class="mt-3 flex items-center justify-between border-t border-bella-300/50 pt-2">
                    <span class="text-[11px] font-bold text-pastel-subtinta">${escapar(resumirDescansos(e))}</span>
                    <button type="button" data-horario-cal="${e.id_estilista}" class="rounded-lg bg-bella-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-bella-700">
                        Asignar horario
                    </button>
                </div>
            </div>`;
    }).join('');

    contenedor.querySelectorAll('button[data-horario-cal]').forEach((btn) => {
        btn.addEventListener('click', () => editarHorarioEstilista(btn.dataset.horarioCal));
    });
}

async function cargarEstilistasAdmin() {
    estilistasAdmin = (await pedir('/estilistas?todos=1')).data || [];
    estilistas = estilistasAdmin.filter((e) => e.estado === 'Activo');
    const tabla = document.getElementById('tablaEstilistas');

    tabla.innerHTML = estilistasAdmin.length === 0 ? filaVacia(6) : estilistasAdmin.map((e) => {
        const cambio = e.estado === 'Activo'
            ? botonAccion('Desactivar', 'rojo', `/estilistas/${e.id_estilista}/estado`, { estado: 'Inactivo' })
            : botonAccion('Activar', 'verde', `/estilistas/${e.id_estilista}/estado`, { estado: 'Activo' });
        const btnAsignarHorario = `<button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="editarHorarioEstilista" data-id="${e.id_estilista}">Asignar horario</button>`;
        const prom = e.promedio_calificacion || '5.0';
        const totalCal = e.total_calificaciones || 0;
        return `
            <tr>
                <td>
                    <span class="font-semibold text-white">${escapar(e.nombres + ' ' + e.apellidos)}</span>
                    <span class="mt-0.5 block text-xs font-bold text-amber-300">★ ${prom} <span class="font-normal text-white/50">(${totalCal} reseñas)</span></span>
                </td>
                <td>
                    <span class="inline-block rounded-lg bg-bella-500/15 px-2.5 py-1 text-xs font-semibold text-bella-200">
                        ${escapar(e.especialidad || 'Estilista profesional')}
                    </span>
                </td>
                <td class="text-white/80">${escapar(e.servicios || 'Sin servicios')}</td>
                <td>${renderizarResumenHorarioEstilista(e)}</td>
                <td>${etiquetaActivo(e.estado)}</td>
                <td class="whitespace-nowrap text-right">
                    ${botonEditar('Servicios', 'editarServiciosEstilista', e.id_estilista)}
                    ${btnAsignarHorario}
                    ${cambio}
                </td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarEstilistasAdmin);
    dibujarCalendarioDisponibilidadAdmin();
}

function opcionesHoraTurno(seleccionada = '08:00') {
    let html = '';
    for (let h = 8; h <= 19; h++) {
        for (const m of ['00', '30']) {
            if (h === 19 && m === '30') continue;
            const valorHora = `${String(h).padStart(2, '0')}:${m}`;
            html += `<option value="${valorHora}" ${valorHora === seleccionada ? 'selected' : ''}>${valorHora}</option>`;
        }
    }
    return html;
}

function editarHorarioEstilista(idEstilista) {
    const estilista = estilistasAdmin.find((e) => String(e.id_estilista) === String(idEstilista));
    if (!estilista) return;
    const horarios = obtenerHorariosDe(estilista);

    const filasDias = horarios.map((h) => {
        const d = h.dia_semana;
        const nombreDia = NOMBRES_DIAS[d];
        return `
            <div data-fila-dia="${d}" class="rounded-2xl border border-bella-300/80 ${h.trabaja ? 'bg-pastel-perla' : 'bg-pastel-rosa/80'} p-3 transition">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <label class="flex cursor-pointer items-center gap-2 text-sm font-bold text-pastel-tinta">
                        <input type="checkbox" data-trabaja-dia="${d}" class="h-4 w-4 accent-bella-600" ${h.trabaja ? 'checked' : ''}>
                        <span>${nombreDia}</span>
                    </label>
                    <span data-etiqueta-dia="${d}" class="rounded-full px-2.5 py-0.5 text-[11px] font-bold ${h.trabaja ? 'bg-emerald-700/15 text-emerald-950' : 'bg-bella-700/20 text-bella-900'}">
                        ${h.trabaja ? 'Día laboral' : 'Día de descanso'}
                    </span>
                </div>
                <div data-rango-dia="${d}" class="mt-2.5 grid grid-cols-2 gap-2 ${h.trabaja ? '' : 'opacity-40 pointer-events-none'}">
                    <div>
                        <label class="block text-[11px] font-bold text-pastel-subtinta">Entrada</label>
                        <select id="horaInicio_${d}" class="campo-pastel py-1.5 text-xs">${opcionesHoraTurno(h.hora_inicio)}</select>
                    </div>
                    <div>
                        <label class="block text-[11px] font-bold text-pastel-subtinta">Salida</label>
                        <select id="horaFin_${d}" class="campo-pastel py-1.5 text-xs">${opcionesHoraTurno(h.hora_fin)}</select>
                    </div>
                </div>
            </div>`;
    }).join('');

    const htmlModal = `
        <p class="text-xs font-semibold text-pastel-subtinta">
            Marca qué días trabaja <strong>${escapar(estilista.nombres + ' ' + estilista.apellidos)}</strong> y desmarca los días que descansa. Ella verá este horario automáticamente en su panel personal.
        </p>
        <div class="rounded-2xl border border-bella-300/70 bg-pastel-lavanda/70 p-2.5">
            <p class="text-[11px] font-bold uppercase tracking-wider text-pastel-tinta">Atajos rápidos de descanso:</p>
            <div class="mt-1.5 flex flex-wrap gap-1.5">
                <button type="button" data-atajo-descanso="1" class="rounded-lg border border-bella-400/60 bg-white px-2.5 py-1 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa">Descansa Lunes</button>
                <button type="button" data-atajo-descanso="2" class="rounded-lg border border-bella-400/60 bg-white px-2.5 py-1 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa">Descansa Martes</button>
                <button type="button" data-atajo-descanso="3" class="rounded-lg border border-bella-400/60 bg-white px-2.5 py-1 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa">Descansa Miércoles</button>
                <button type="button" data-atajo-descanso="4" class="rounded-lg border border-bella-400/60 bg-white px-2.5 py-1 text-xs font-bold text-pastel-tinta hover:bg-pastel-rosa">Descansa Jueves</button>
                <button type="button" data-atajo-descanso="0" class="rounded-lg border border-emerald-500/60 bg-pastel-menta px-2.5 py-1 text-xs font-bold text-emerald-950 hover:opacity-90">Trabaja Lun a Sáb</button>
            </div>
        </div>
        <div class="grid max-h-[22rem] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            ${filasDias}
        </div>`;

    abrirVentana(`Asignar horario · ${estilista.nombres} ${estilista.apellidos}`, htmlModal, async () => {
        const nuevosHorarios = [1, 2, 3, 4, 5, 6].map((d) => ({
            dia_semana: d,
            trabaja: document.querySelector(`[data-trabaja-dia="${d}"]`).checked,
            hora_inicio: document.getElementById(`horaInicio_${d}`).value,
            hora_fin: document.getElementById(`horaFin_${d}`).value
        }));

        const respuesta = await pedir(`/estilistas/${idEstilista}/horario`, 'PUT', { horarios: nuevosHorarios });
        if (respuesta.success) {
            await cargarEstilistasAdmin();
        }
        return respuesta;
    });

    // Interactividad en vivo para casillas y atajos dentro del modal
    const actualizarVisualDia = (d) => {
        const check = document.querySelector(`[data-trabaja-dia="${d}"]`);
        const fila = document.querySelector(`[data-fila-dia="${d}"]`);
        const etiqueta = document.querySelector(`[data-etiqueta-dia="${d}"]`);
        const rango = document.querySelector(`[data-rango-dia="${d}"]`);
        if (!check || !fila || !etiqueta || !rango) return;
        const activo = check.checked;
        fila.className = `rounded-2xl border border-bella-300/80 ${activo ? 'bg-pastel-perla' : 'bg-pastel-rosa/80'} p-3 transition`;
        etiqueta.className = `rounded-full px-2.5 py-0.5 text-[11px] font-bold ${activo ? 'bg-emerald-700/15 text-emerald-950' : 'bg-bella-700/20 text-bella-900'}`;
        etiqueta.textContent = activo ? 'Día laboral' : 'Día de descanso';
        rango.classList.toggle('opacity-40', !activo);
        rango.classList.toggle('pointer-events-none', !activo);
    };

    document.querySelectorAll('[data-trabaja-dia]').forEach((chk) => {
        chk.addEventListener('change', () => actualizarVisualDia(chk.dataset.trabajaDia));
    });

    document.querySelectorAll('[data-atajo-descanso]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const diaDescanso = Number(btn.dataset.atajoDescanso);
            for (let d = 1; d <= 6; d++) {
                const chk = document.querySelector(`[data-trabaja-dia="${d}"]`);
                if (chk) {
                    chk.checked = d !== diaDescanso;
                    actualizarVisualDia(d);
                }
            }
        });
    });
}

// --- Clientas ---

async function cargarClientasAdmin() {
    clientasAdmin = (await pedir('/clientas')).data || [];
    const tabla = document.getElementById('tablaClientas');

    tabla.innerHTML = clientasAdmin.length === 0 ? filaVacia(6) : clientasAdmin.map((c) => `
        <tr>
            <td class="font-medium text-white">${escapar(c.nombres + ' ' + c.apellidos)}</td>
            <td>${escapar(c.telefono || '—')}</td>
            <td>${escapar(c.email || '—')}</td>
            <td class="max-w-xs text-xs text-bella-100/85">
                ${c.ficha_tecnica ? escapar(c.ficha_tecnica) : '<span class="text-white/40">Sin notas registradas</span>'}
            </td>
            <td>${c.id_usuario ? '<span class="estado estado-Finalizada">Con cuenta</span>' : '<span class="estado bg-white/10 text-white/50">Sin cuenta</span>'}</td>
            <td class="whitespace-nowrap text-right">
                <button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="editarFichaTecnica" data-id="${c.id_clienta}">📋 Ficha técnica</button>
                ${botonEditar('Editar', 'editarClienta', c.id_clienta)}
            </td>
        </tr>`).join('');

    activarBotones(tabla, cargarClientasAdmin);
}

function editarClienta(idClienta) {
    const c = clientasAdmin.find((x) => String(x.id_clienta) === String(idClienta));
    abrirVentana('Editar clienta',
        campo('vNombres', 'Nombres', c.nombres, 'text', 'required') +
        campo('vApellidos', 'Apellidos', c.apellidos, 'text', 'required') +
        campo('vTelefono', 'Teléfono', c.telefono || '', 'tel') +
        campo('vEmail', 'Correo', c.email || '', 'email'),
        async () => {
            const respuesta = await pedir(`/clientas/${idClienta}`, 'PUT', {
                nombres: valor('vNombres'), apellidos: valor('vApellidos'),
                telefono: valor('vTelefono'), email: valor('vEmail')
            });
            if (respuesta.success) cargarClientasAdmin();
            return respuesta;
        });
}

// --- Servicios ---

async function cargarServiciosAdmin() {
    serviciosAdmin = (await pedir('/servicios?todos=1')).data || [];
    servicios = serviciosAdmin.filter((s) => s.estado === 'Disponible');
    const tabla = document.getElementById('tablaServicios');

    tabla.innerHTML = serviciosAdmin.length === 0 ? filaVacia(5) : serviciosAdmin.map((s) => {
        const cambio = s.estado === 'Disponible'
            ? botonAccion('Desactivar', 'rojo', `/servicios/${s.id_servicio}/estado`, { estado: 'No disponible' })
            : botonAccion('Activar', 'verde', `/servicios/${s.id_servicio}/estado`, { estado: 'Disponible' });
        const verTipos = `<button type="button" class="btn-mini bg-pastel-rosa text-bella-900 hover:bg-bella-200" data-ver-tipos="${s.id_servicio}">&#10022; Ver tipos</button>`;
        return `
            <tr>
                <td class="font-medium text-white">${escapar(s.nombre)}</td>
                <td>${pesos(s.precio)}</td>
                <td>${s.duracion_min} min</td>
                <td>${etiquetaActivo(s.estado)}</td>
                <td class="whitespace-nowrap text-right">${verTipos} ${botonEditar('Editar', 'editarServicio', s.id_servicio)} ${cambio}</td>
            </tr>`;
    }).join('');

    tabla.querySelectorAll('button[data-ver-tipos]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const s = serviciosAdmin.find((x) => String(x.id_servicio) === String(btn.dataset.verTipos));
            if (s && typeof abrirModalServicio === 'function') {
                abrirModalServicio(s.nombre, { idServicio: s.id_servicio, precio: s.precio, duracion: s.duracion_min });
            }
        });
    });

    activarBotones(tabla, cargarServiciosAdmin);
    dibujarCasillasNuevo();
}

function editarServicio(idServicio) {
    const s = serviciosAdmin.find((x) => String(x.id_servicio) === String(idServicio)) || { nombre: '', precio: '', duracion_min: 60 };
    abrirVentana(idServicio ? 'Editar servicio' : 'Nuevo servicio',
        campo('vNombre', 'Nombre', s.nombre, 'text', 'required') +
        campo('vPrecio', 'Precio (pesos)', s.precio ? Math.round(s.precio) : '', 'number', 'min="0" step="500" required') +
        campo('vDuracion', 'Duración (minutos)', s.duracion_min, 'number', 'min="15" max="480" step="15" required'),
        async () => {
            const datos = { nombre: valor('vNombre'), precio: Number(valor('vPrecio')), duracion: Number(valor('vDuracion')) };
            const respuesta = idServicio
                ? await pedir(`/servicios/${idServicio}`, 'PUT', datos)
                : await pedir('/servicios', 'POST', datos);
            if (respuesta.success) cargarServiciosAdmin();
            return respuesta;
        });
}

// --- Productos (con botones rápidos -1 / +1 de stock) ---

async function cargarProductosAdmin() {
    productosAdmin = (await pedir('/productos?todos=1')).data || [];
    const tabla = document.getElementById('tablaProductos');

    tabla.innerHTML = productosAdmin.length === 0 ? filaVacia(5) : productosAdmin.map((p) => {
        const cambio = p.estado === 'Activo'
            ? botonAccion('Desactivar', 'rojo', `/productos/${p.id_producto}/estado`, { estado: 'Inactivo' })
            : botonAccion('Activar', 'verde', `/productos/${p.id_producto}/estado`, { estado: 'Activo' });
        return `
            <tr>
                <td class="font-medium text-white">${escapar(p.nombre)}</td>
                <td>${pesos(p.precio)}</td>
                <td>
                    <div class="inline-flex items-center gap-1.5">
                        <button type="button" data-stock-id="${p.id_producto}" data-stock-delta="-1"
                                class="h-6 w-6 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20" title="Restar 1 unidad">&minus;</button>
                        <span class="min-w-[2.5rem] text-center font-semibold ${p.stock < 10 ? 'text-amber-300' : 'text-white'}">${p.stock}</span>
                        <button type="button" data-stock-id="${p.id_producto}" data-stock-delta="1"
                                class="h-6 w-6 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/20" title="Sumar 1 unidad">+</button>
                        ${p.stock < 10 ? `<span class="estado estado-Pendiente ml-1">Bajo</span>` : ''}
                    </div>
                </td>
                <td>${etiquetaActivo(p.estado)}</td>
                <td class="whitespace-nowrap text-right">${botonEditar('Editar', 'editarProducto', p.id_producto)} ${cambio}</td>
            </tr>`;
    }).join('');

    // Ajuste rápido de stock con 1 clic
    tabla.querySelectorAll('button[data-stock-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const p = productosAdmin.find((x) => String(x.id_producto) === String(btn.dataset.stockId));
            if (!p) return;
            const nuevoStock = Math.max(0, Number(p.stock) + Number(btn.dataset.stockDelta));
            const res = await pedir(`/productos/${p.id_producto}`, 'PUT', {
                nombre: p.nombre,
                precio: Math.round(Number(p.precio)),
                stock: nuevoStock
            });
            if (res.success) {
                cargarProductosAdmin();
            } else {
                avisar(res.message);
            }
        });
    });

    activarBotones(tabla, cargarProductosAdmin);
}

function editarProducto(idProducto) {
    const p = productosAdmin.find((x) => String(x.id_producto) === String(idProducto)) || { nombre: '', precio: '', stock: 0 };
    abrirVentana(idProducto ? 'Editar producto' : 'Nuevo producto',
        campo('vNombre', 'Nombre', p.nombre, 'text', 'required') +
        campo('vPrecio', 'Precio (pesos)', p.precio ? Math.round(p.precio) : '', 'number', 'min="0" step="500" required') +
        campo('vStock', 'Stock (unidades)', p.stock, 'number', 'min="0" step="1" required'),
        async () => {
            const datos = { nombre: valor('vNombre'), precio: Number(valor('vPrecio')), stock: Number(valor('vStock')) };
            const respuesta = idProducto
                ? await pedir(`/productos/${idProducto}`, 'PUT', datos)
                : await pedir('/productos', 'POST', datos);
            if (respuesta.success) cargarProductosAdmin();
            return respuesta;
        });
}

// --- Registrar usuario ---

function dibujarCasillasNuevo() {
    document.getElementById('nuevoServicios').innerHTML = servicios.map((s) => `
        <label class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
            <input type="checkbox" name="nuevoServicio" value="${s.id_servicio}" class="accent-bella-500">
            ${escapar(s.nombre)}
        </label>`).join('');
}

function prepararFormNuevo() {
    const selectRol = document.getElementById('nuevoRol');
    const bloquePermiso = document.getElementById('bloquePermisoAdmin');
    const nota = document.getElementById('notaPermisosAdmin');

    // Solo una administradora con permiso total puede crear otras administradoras
    if (usuario.puedeCrearAdmins) {
        selectRol.insertAdjacentHTML('beforeend', '<option value="admin">Administradora</option>');
        if (nota) nota.textContent = 'Tu cuenta tiene permiso total: puedes crear clientas, estilistas y otras administradoras (con permiso total o limitado).';
    } else if (nota) {
        nota.textContent = 'Tu cuenta tiene permiso limitado: puedes crear clientas y estilistas, pero no otras administradoras.';
    }

    const actualizarBloques = () => {
        document.getElementById('bloqueServicios').classList.toggle('hidden', selectRol.value !== 'estilista');
        bloquePermiso.classList.toggle('hidden', selectRol.value !== 'admin');
    };
    selectRol.addEventListener('change', actualizarBloques);
    actualizarBloques();

    document.getElementById('formNuevo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const alerta = document.getElementById('alertaNuevo');
        const datos = {
            rol: selectRol.value,
            nombre: document.getElementById('nuevoNombre').value.trim(),
            username: document.getElementById('nuevoUsuario').value.trim(),
            password: document.getElementById('nuevoPassword').value
        };
        if (datos.rol === 'estilista') {
            datos.servicios = [...document.querySelectorAll('input[name="nuevoServicio"]:checked')].map((c) => Number(c.value));
        }
        if (datos.rol === 'admin') {
            datos.permisoAdmin = document.getElementById('nuevoPermisoAdmin').value;
        }

        const respuesta = await pedir('/register', 'POST', datos);
        if (respuesta.success) {
            mostrarAlerta(alerta, `${respuesta.message} Usuario: ${datos.username} · Contraseña: ${datos.password}`, 'ok');
            e.target.reset();
            actualizarBloques();
            cargarEstilistasAdmin();
            cargarClientasAdmin();
        } else {
            mostrarAlerta(alerta, respuesta.message);
        }
    });
}

// --- Mensajes del chat ---

let conversacionAbierta = null;
let ultimoMensajeAdmin = 0;
let totalSinLeer = 0;
const tituloPanel = document.title;

async function cargarConversaciones() {
    const conversaciones = (await pedir('/conversaciones')).data || [];

    const sinLeer = conversaciones.reduce((total, c) => total + Number(c.sin_leer), 0);
    if (sinLeer > totalSinLeer) avisar('Tienes mensajes nuevos en el chat');
    totalSinLeer = sinLeer;
    const contador = document.getElementById('contadorMensajes');
    contador.textContent = sinLeer;
    contador.classList.toggle('hidden', sinLeer === 0);
    document.title = sinLeer > 0 ? `(${sinLeer}) Mensajes · BellaStyle` : tituloPanel;

    const lista = document.getElementById('listaConversaciones');
    lista.innerHTML = conversaciones.length === 0
        ? '<li class="p-4 text-sm text-white/40">Todavía no hay mensajes.</li>'
        : conversaciones.map((c) => `
            <li>
                <button data-conversacion="${c.id}" class="w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${c.id === conversacionAbierta ? 'bg-white/10' : ''}">
                    <span class="flex items-center justify-between gap-2">
                        <span class="truncate font-semibold text-white">${escapar(c.nombre)}</span>
                        ${Number(c.sin_leer) > 0 ? `<span class="rounded-full bg-oro px-2 text-xs font-bold text-noche-950">${c.sin_leer}</span>` : ''}
                    </span>
                    <span class="mt-1 block truncate text-xs text-white/50">${escapar(c.ultimo)}</span>
                    <span class="mt-1 block text-[11px] ${c.estado === 'Abierta' ? 'text-emerald-300' : 'text-white/30'}">${c.estado}</span>
                </button>
            </li>`).join('');

    lista.querySelectorAll('button[data-conversacion]').forEach((boton) => {
        boton.addEventListener('click', () => abrirConversacion(Number(boton.dataset.conversacion)));
    });
}

async function abrirConversacion(id) {
    conversacionAbierta = id;
    ultimoMensajeAdmin = 0;
    document.getElementById('mensajesAdmin').innerHTML = '';
    document.getElementById('formResponder').classList.remove('hidden');
    document.getElementById('formResponder').classList.add('flex');
    await cargarMensajesAdmin();
    cargarConversaciones();
    document.getElementById('textoRespuesta').focus();
}

function dibujarMensajeAdmin(m) {
    const delSalon = m.autor !== 'Visitante';
    const quien = m.autor === 'Salon' ? 'Tú (salón)' : m.autor === 'Asistente' ? 'Asistente automático' : 'Visitante';
    const color = m.autor === 'Salon' ? 'bg-bella-500 text-white' : m.autor === 'Asistente' ? 'bg-white/5 text-white/60' : 'bg-white/10 text-white';
    document.getElementById('mensajesAdmin').insertAdjacentHTML('beforeend', `
        <div class="max-w-[80%] ${delSalon ? 'ml-auto text-right' : ''}">
            <p class="mb-1 text-[11px] text-white/40">${quien} · ${m.hora}</p>
            <p class="inline-block whitespace-pre-line rounded-2xl px-3 py-2 text-left text-sm ${color}">${escapar(m.texto)}</p>
        </div>`);
}

async function cargarMensajesAdmin() {
    if (!conversacionAbierta) return;
    const respuesta = await pedir(`/conversaciones/${conversacionAbierta}/mensajes?desde=${ultimoMensajeAdmin}`);
    if (!respuesta.success) return;

    const c = respuesta.data.conversacion;
    const nuevoEstado = c.estado === 'Abierta' ? 'Cerrada' : 'Abierta';
    const textoBoton = c.estado === 'Abierta' ? 'Cerrar conversación' : 'Reabrir';
    document.getElementById('cabeceraConversacion').innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="font-semibold text-white">${escapar(c.nombre)}</p>
                <p class="text-xs text-white/50">${c.contacto ? escapar(c.contacto) : 'Sin teléfono ni correo'} · ${c.estado}</p>
            </div>
            <button class="btn-mini ${COLORES.gris}" data-estado="${nuevoEstado}">${textoBoton}</button>
        </div>`;

    const caja = document.getElementById('mensajesAdmin');
    respuesta.data.mensajes.forEach((m) => {
        dibujarMensajeAdmin(m);
        ultimoMensajeAdmin = m.id;
    });
    if (respuesta.data.mensajes.length > 0) caja.scrollTop = caja.scrollHeight;
}

function prepararChatAdmin() {
    document.getElementById('formResponder').addEventListener('submit', async (e) => {
        e.preventDefault();
        const campoTexto = document.getElementById('textoRespuesta');
        const texto = campoTexto.value.trim();
        if (!texto || !conversacionAbierta) return;
        const respuesta = await pedir(`/conversaciones/${conversacionAbierta}/responder`, 'POST', { texto });
        if (!respuesta.success) return avisar(respuesta.message);
        campoTexto.value = '';
        await cargarMensajesAdmin();
        cargarConversaciones();
    });
    document.getElementById('cabeceraConversacion').addEventListener('click', async (e) => {
        const boton = e.target.closest('button[data-estado]');
        if (!boton) return;
        const respuesta = await pedir(`/conversaciones/${conversacionAbierta}/estado`, 'PUT', { estado: boton.dataset.estado });
        avisar(respuesta.message);
        cargarMensajesAdmin();
        cargarConversaciones();
    });
    cargarConversaciones();
    setInterval(() => { cargarConversaciones(); cargarMensajesAdmin(); }, 5000);
}

function iniciarAdmin() {
    activarPestanas();
    document.getElementById('filtroEstado').addEventListener('change', dibujarCitasAdmin);
    document.getElementById('buscarCitaAdmin')?.addEventListener('input', dibujarCitasAdmin);
    document.getElementById('btnExportarCitas')?.addEventListener('click', exportarCitasCSV);
    document.getElementById('btnNuevaCitaAdmin')?.addEventListener('click', abrirModalNuevaCitaAdmin);
    document.getElementById('btnNuevoServicio').addEventListener('click', () => editarServicio(''));
    document.getElementById('btnNuevoProducto').addEventListener('click', () => editarProducto(''));

    const btnTlAdmin = document.getElementById('btnToggleTimelineAdmin');
    const bloqueTlAdmin = document.getElementById('bloqueTimelineAdmin');
    const inputFechaTlAdmin = document.getElementById('fechaTimelineAdmin');
    if (inputFechaTlAdmin) {
        inputFechaTlAdmin.value = fechaDeHoy();
        inputFechaTlAdmin.addEventListener('change', () => {
            dibujarTimelineDia(inputFechaTlAdmin.value, citasAdmin, 'contenedorTimelineAdmin');
        });
    }
    if (btnTlAdmin && bloqueTlAdmin) {
        btnTlAdmin.addEventListener('click', () => {
            bloqueTlAdmin.classList.toggle('hidden');
            if (!bloqueTlAdmin.classList.contains('hidden')) {
                dibujarTimelineDia(inputFechaTlAdmin?.value || fechaDeHoy(), citasAdmin, 'contenedorTimelineAdmin');
            }
        });
    }

    const inputCal = document.getElementById('fechaCalendarioAdmin');
    if (inputCal) {
        inputCal.value = fechaDeHoy();
        inputCal.addEventListener('change', dibujarCalendarioDisponibilidadAdmin);
    }
    document.getElementById('filtroDisponibilidadDia')?.addEventListener('change', dibujarCalendarioDisponibilidadAdmin);

    cargarCitasAdmin();
    cargarEstilistasAdmin();
    cargarClientasAdmin();
    cargarServiciosAdmin();
    cargarProductosAdmin();
    prepararFormNuevo();
    prepararChatAdmin();
}

const EDITORES = {
    reprogramarCita,
    editarServiciosEstilista,
    editarHorarioEstilista,
    editarClienta,
    editarFichaTecnica,
    verFichaClientaDesdeCita,
    abrirChatCita,
    verComprobanteCita,
    verCorreoCita,
    calificarCita,
    editarServicio,
    editarProducto
};

// ---------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------

async function iniciar() {
    prepararEncabezado();

    servicios = (await pedir('/servicios')).data || [];
    estilistas = (await pedir('/estilistas')).data || [];
    productosDisponibles = (await pedir('/productos')).data || [];

    if (usuario.rol === 'Clienta') iniciarClienta();
    if (usuario.rol === 'Estilista') iniciarEstilista();
    if (usuario.rol === 'Administradora') iniciarAdmin();
}

if (usuario) iniciar();
