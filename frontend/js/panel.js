// Panel principal (panel.html). Muestra una sección distinta según el rol.

const usuario = obtenerSesion();
if (!usuario) window.location.href = 'welcome.html?auth=login';

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

function renderizarEtiquetaPago(c) {
    const metodo = c.metodo_pago || 'Efectivo en Salón';
    const estadoPago = c.estado_pago || (c.estado === 'Finalizada' ? 'Pagado en salón' : 'Pendiente en salón');
    const pagado = estadoPago.toLowerCase().includes('pagado');
    const ref = c.referencia_pago ? ` · Ref: ${c.referencia_pago}` : '';
    if (pagado) {
        return `<span class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">✓ ${escapar(estadoPago)} (${escapar(metodo)}${escapar(ref)})</span>`;
    }
    return `<span class="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">⏳ ${escapar(estadoPago)} (${escapar(metodo)})</span>`;
}

function renderizarMiniaturaResultado(c) {
    if (!c.foto_resultado) return '';
    return `
        <div class="mt-1.5 flex items-center gap-2 rounded-xl border border-bella-300/40 bg-white/10 p-1.5">
            <img src="${escapar(c.foto_resultado)}" alt="Resultado final" class="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-bella-300/70">
            <div class="min-w-0">
                <span class="block text-[10px] font-extrabold uppercase tracking-wider text-pastel-rosa">📸 Foto del resultado final</span>
                <span class="block truncate text-[11px] text-white/85">${escapar(c.nota_resultado || 'Trabajo finalizado y publicado en Galería')}</span>
            </div>
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
    const metodoPago = c.metodo_pago || 'Efectivo en Salón';
    const estadoPago = c.estado_pago || (c.estado === 'Finalizada' ? 'Pagado en salón' : 'Pendiente en salón');
    const refPago = c.referencia_pago || '—';

    const htmlTicket = `
        <div id="areaTicketImprimible" class="rounded-2xl border-2 border-dashed border-bella-400 bg-white p-5 text-pastel-tinta shadow-inner">
            <div class="border-b border-bella-200 pb-3 text-center">
                <p class="text-[11px] font-bold uppercase tracking-widest text-bella-700">BellaStyle Studio · Cartagena, Colombia</p>
                <h4 class="mt-0.5 font-titulo text-2xl font-bold text-pastel-tinta">Comprobante de Cita #BS-${c.id}</h4>
                <p class="mt-1 text-xs font-semibold text-pastel-subtinta">Estado actual: <strong>${escapar(c.estado)}</strong> · Pago: <strong>${escapar(estadoPago)}</strong></p>
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
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Método y estado de pago:</dt>
                    <dd class="font-bold text-pastel-tinta text-right">${escapar(metodoPago)} · ${escapar(estadoPago)}${c.referencia_pago ? ` (Ref: ${escapar(refPago)})` : ''}</dd>
                </div>
                <div class="flex items-center justify-between pt-2 text-sm">
                    <dt class="font-bold uppercase tracking-wider text-pastel-tinta">${estadoPago.toLowerCase().includes('pagado') ? 'Total pagado:' : 'Total a pagar en salón:'}</dt>
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
                    <p style="text-align:center;font-size:12px;color:#624653;">Estado: ${escapar(c.estado)} · ${escapar(estadoPago)}</p>
                    <div class="row"><strong>Clienta:</strong> <span>${escapar(c.cliente)}</span></div>
                    <div class="row"><strong>Fecha y hora:</strong> <span>${escapar(c.fecha)} · ${escapar(c.hora)} (${duracion} min)</span></div>
                    <div class="row"><strong>Estilista:</strong> <span>${escapar(c.estilista)}</span></div>
                    <div class="row"><strong>Servicio:</strong> <span>${escapar(c.servicio)} (${pesos(precioServicio)})</span></div>
                    ${c.observaciones ? `<div class="row"><strong>Detalle:</strong> <span>${escapar(c.observaciones)}</span></div>` : ''}
                    ${c.producto_adicional ? `<div class="row"><strong>Producto adicional:</strong> <span>${escapar(c.producto_adicional)} (+${pesos(precioProd)})</span></div>` : ''}
                    <div class="row"><strong>Método de pago:</strong> <span>${escapar(metodoPago)} (${escapar(estadoPago)})</span></div>
                    ${c.referencia_pago ? `<div class="row"><strong>Referencia de pago:</strong> <span>${escapar(refPago)}</span></div>` : ''}
                    <div class="total"><span>Total:</span> <span>${pesos(precioTotal)}</span></div>
                </div>
                <script>window.onload = function(){ window.print(); };<\/script>
            </body>
            </html>`);
        ventanaImp.document.close();
    });
}

// Modal de Pasarela de Pago interactiva para pagar una cita pendiente en línea (Clienta) o registrar su cobro (Administradora)
function pagarCitaModal(idCita) {
    const c = buscarCitaEnMemoria(idCita);
    if (!c) return avisar('No se encontró la cita');

    const htmlPago = `
        <div class="rounded-2xl border border-bella-300 bg-pastel-rosa/70 p-3.5 text-xs text-pastel-tinta">
            <div class="flex items-center justify-between">
                <span class="font-extrabold text-bella-900">Cita #BS-${c.id} · ${escapar(c.servicio)}</span>
                <span class="font-titulo text-2xl font-bold text-bella-800">${pesos(c.precio)}</span>
            </div>
            <p class="mt-1 text-pastel-subtinta">Clienta: <strong>${escapar(c.cliente)}</strong> · Estilista: <strong>${escapar(c.estilista)}</strong></p>
        </div>

        <div>
            <label for="vMetodoPagoModal" class="etiqueta-oscura">Selecciona el medio de pago</label>
            <select id="vMetodoPagoModal" class="campo-pastel">
                <option value="Nequi / Daviplata">📲 Nequi / Daviplata (Aprobación inmediata QR)</option>
                <option value="Tarjeta / PSE">💳 Tarjeta Débito/Crédito o PSE Bancario</option>
                <option value="Efectivo en Salón">💵 Efectivo en Recepción del Salón</option>
            </select>
        </div>

        <div id="vInfoPasarelaModal" class="rounded-2xl border border-bella-300 bg-white p-3.5 text-xs text-pastel-tinta shadow-inner">
            <p class="font-extrabold text-bella-900">📲 Cuenta oficial Nequi / Daviplata BellaStyle: 300 655 0192</p>
            <p class="mt-0.5 text-[11px] text-pastel-subtinta">Ingresa el número celular o comprobante para generar tu referencia aprobada en línea.</p>
        </div>

        <div>
            <label for="vReferenciaPagoModal" class="etiqueta-oscura">Número de referencia / Celular o últimos 4 dígitos (opcional)</label>
            <input id="vReferenciaPagoModal" type="text" class="campo-pastel" placeholder="Si lo dejas vacío se genera código de autorización automático">
        </div>`;

    abrirVentana(`💳 Pasarela de Pago · Cita BS-${c.id}`, htmlPago, async () => {
        const metodoPago = valor('vMetodoPagoModal');
        const refInput = valor('vReferenciaPagoModal');
        const prefijo = metodoPago === 'Nequi / Daviplata' ? 'NEQ' : (metodoPago === 'Tarjeta / PSE' ? 'PSE' : 'CAJA');
        const referenciaPago = refInput
            ? `${prefijo}-${refInput.replace(/\s+/g, '')}`
            : `${prefijo}-${Math.floor(100000 + Math.random() * 900000)}`;

        const res = await pedir(`/citas/${c.id}/pago`, 'PUT', {
            metodoPago,
            referenciaPago
        });
        if (res.success) {
            if (usuario.rol === 'Clienta') await cargarCitasClienta();
            if (usuario.rol === 'Estilista') await cargarCitasEstilista();
            if (usuario.rol === 'Administradora') await cargarCitasAdmin();
        }
        return res;
    }, 'Confirmar y aprobar pago');
}

// Modal de Galería de Resultado Final de la Cita:
// - Si es Clienta: visualiza en grande la foto del trabajo que le realizaron y la nota de su estilista.
// - Si es Estilista o Administradora: permite subir la foto del resultado final (o elegir/pegar una foto),
//   escribir la nota técnica del resultado y finalizar la cita publicándola en el historial de la clienta y en la Galería.
function gestionarResultadoCita(idCita) {
    const c = buscarCitaEnMemoria(idCita);
    if (!c) return avisar('No se encontró la cita');

    const fotoInicial = c.foto_resultado || '';
    const notaInicial = c.nota_resultado || '';

    if (usuario.rol === 'Clienta') {
        if (!fotoInicial) return avisar('Aún no se ha cargado la foto del resultado de esta cita.');
        const htmlVista = `
            <div class="overflow-hidden rounded-2xl border-2 border-bella-400 bg-white shadow-md">
                <img src="${escapar(fotoInicial)}" alt="Resultado de ${escapar(c.servicio)}" class="max-h-96 w-full object-cover">
                <div class="p-4 text-xs text-pastel-tinta">
                    <span class="inline-block rounded-full bg-pastel-rosa px-3 py-0.5 text-[11px] font-extrabold text-bella-900">
                        ✨ Resultado oficial de tu cita #BS-${c.id}
                    </span>
                    <h4 class="mt-1.5 text-lg font-bold text-pastel-tinta">${escapar(c.servicio)} · Atendida por ${escapar(c.estilista)}</h4>
                    <p class="mt-1 text-pastel-subtinta">${escapar(notaInicial || 'Trabajo finalizado con productos profesionales en BellaStyle Studio.')}</p>
                    <p class="mt-2 text-[11px] font-bold text-bella-800">Fecha: ${escapar(c.fecha)} · ${escapar(c.hora)}</p>
                </div>
            </div>`;
        abrirVentana(`📸 Mi resultado final · Cita BS-${c.id}`, htmlVista, null);
        return;
    }

    const aunNoFinalizada = c.estado !== 'Finalizada';
    const htmlSubir = `
        <div class="rounded-2xl border border-bella-300 bg-pastel-rosa/70 p-3 text-xs text-pastel-tinta">
            <p><strong>Cita #BS-${c.id}:</strong> ${escapar(c.servicio)} · Clienta: <strong>${escapar(c.cliente)}</strong></p>
            <p class="mt-0.5 text-pastel-subtinta">Estilista: <strong>${escapar(c.estilista)}</strong> · Estado actual: <strong>${escapar(c.estado)}</strong></p>
        </div>

        <div class="rounded-2xl border-2 border-bella-400/70 bg-pastel-perla p-3.5">
            <div class="flex items-center justify-between gap-2">
                <label class="text-xs font-extrabold uppercase tracking-wider text-bella-900">📸 Foto del resultado final del trabajo *</label>
                <span class="rounded-full bg-bella-600/15 px-2.5 py-0.5 text-[10px] font-bold text-bella-900">Se publica en Historial y Galería</span>
            </div>
            <p class="mt-0.5 text-[11px] font-medium text-pastel-subtinta">Sube la fotografía de cómo quedó el trabajo realizado a la clienta (o pega la ruta/URL de la foto).</p>
            <div class="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="flex h-28 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-bella-300 bg-white shadow-inner">
                    <img id="vResultadoImgPreview" src="${atributo(fotoInicial)}" alt="Resultado" class="${fotoInicial ? '' : 'hidden'} h-full w-full object-cover">
                    <span id="vResultadoImgPlaceholder" class="${fotoInicial ? 'hidden' : ''} px-2 text-center text-[10px] font-bold text-pastel-subtinta">Sin foto</span>
                </div>
                <div class="flex-1 space-y-2">
                    <input id="vResultadoFile" type="file" accept="image/*" class="block w-full text-xs font-semibold text-pastel-tinta file:mr-2.5 file:rounded-xl file:border-0 file:bg-bella-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-bella-700">
                    <input id="vResultadoUrl" type="text" class="campo-pastel py-1.5 text-xs" value="${atributo(fotoInicial.startsWith('data:') ? '' : fotoInicial)}" placeholder="O pega ruta/URL (ej. img/galeria/trabajo-02-balayage.jpg)">
                    <input id="vResultadoHidden" type="hidden" value="${atributo(fotoInicial)}">
                </div>
            </div>
        </div>

        <div>
            <label for="vNotaResultadoCita" class="etiqueta-oscura">Descripción del resultado / Acabado realizado</label>
            <textarea id="vNotaResultadoCita" rows="2" class="campo-pastel" placeholder="Ej. Balayage rubio champagne con matiz perlado y sellado de cutícula con óleo de argán...">${escapar(notaInicial)}</textarea>
        </div>

        ${aunNoFinalizada ? `
        <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-500/50 bg-pastel-menta p-3 text-xs font-bold text-emerald-950">
            <input type="checkbox" id="vMarcarFinalizadaResultado" class="h-4 w-4 accent-emerald-700" checked>
            <span>Marcar automáticamente esta cita como FINALIZADA al guardar la foto del resultado</span>
        </label>` : ''}`;

    abrirVentana(`📸 Foto del resultado final · BS-${c.id}`, htmlSubir, async () => {
        const fotoResultado = valor('vResultadoHidden');
        if (!fotoResultado) {
            return { success: false, message: '⚠️ Debes subir o seleccionar la foto del resultado final antes de guardar.' };
        }
        const finalizarCita = aunNoFinalizada
            ? Boolean(document.getElementById('vMarcarFinalizadaResultado')?.checked)
            : false;

        const res = await pedir(`/citas/${c.id}/resultado`, 'PUT', {
            fotoResultado,
            notaResultado: valor('vNotaResultadoCita'),
            finalizarCita
        });
        if (res.success) {
            if (usuario.rol === 'Estilista') await cargarCitasEstilista();
            if (usuario.rol === 'Administradora') await cargarCitasAdmin();
        }
        return res;
    }, aunNoFinalizada ? 'Guardar foto y finalizar cita' : 'Guardar foto en Galería');

    conectarSelectorImagen({
        idFile: 'vResultadoFile',
        idUrl: 'vResultadoUrl',
        idHidden: 'vResultadoHidden',
        idPreview: 'vResultadoImgPreview',
        idPlaceholder: 'vResultadoImgPlaceholder'
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
        <div class="rounded-2xl border border-bella-300 bg-pastel-rosa/75 p-3 text-xs text-pastel-tinta">
            <p class="font-bold text-bella-900">✂ Servicio: ${escapar(c.servicio)} · Atendió: ${escapar(c.estilista)}</p>
            ${c.producto_adicional ? `<p class="mt-0.5 font-semibold text-emerald-950">🧴 Producto incluido: ${escapar(c.producto_adicional)}</p>` : ''}
            <p class="mt-0.5 text-[11px] text-pastel-subtinta">✨ Tu evaluación y calificación aparecerán inmediatamente en tiempo real en la sección "Experiencias reales de nuestras clientas" de la página de inicio.</p>
        </div>
        <div>
            <label class="etiqueta-oscura">Calificación (1 a 5 estrellas) *</label>
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
            <label for="vComentarioCal" class="etiqueta-oscura">Escribe tu evaluación sobre el servicio ${c.producto_adicional ? 'y el producto' : ''} *</label>
            <textarea id="vComentarioCal" rows="3" class="campo-pastel" placeholder="Ej. Me encantó el corte de cabello y la atención de la estilista, 100% recomendado..." required>${escapar(c.comentario_calificacion || '')}</textarea>
        </div>`;

    abrirVentana(`★ Calificar y Evaluar · Cita BS-${c.id}`, htmlCalificar, async () => {
        const respuesta = await pedir(`/citas/${c.id}/calificar`, 'PUT', {
            calificacion: Number(valor('vCalificacion')),
            comentario: valor('vComentarioCal')
        });
        if (respuesta.success) {
            await cargarCitasClienta();
            if (usuario.rol === 'Administradora') await cargarCitasAdmin();
        }
        return respuesta;
    }, 'Publicar calificación en tiempo real');

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

// ---------------------------------------------------------------
// Carrito de Compras Multi-Producto (Sincronizado con Stock en Tiempo Real)
// ---------------------------------------------------------------

function agregarAlCarritoClienta(idProducto, mostrarMensaje = true) {
    const p = productosDisponibles.find((x) => String(x.id_producto) === String(idProducto));
    if (!p) return avisar('No se encontró el producto.');

    const stockMax = Number(p.stock) || 0;
    if (stockMax <= 0) {
        return avisar(`El producto "${p.nombre}" está agotado.`);
    }

    const existente = carritoClienta.find((item) => String(item.id_producto) === String(p.id_producto));
    if (existente) {
        if (existente.cantidad >= stockMax) {
            return avisar(`Ya tienes en tu carrito el máximo disponible (${stockMax} unidades) de "${p.nombre}".`);
        }
        existente.cantidad += 1;
    } else {
        carritoClienta.push({
            id_producto: p.id_producto,
            cantidad: 1
        });
    }

    guardarCarritoEnStorage();
    dibujarCarritoClienta();
    dibujarTiendaDirectaClienta();

    if (mostrarMensaje) {
        const cantEnCarrito = carritoClienta.find((i) => String(i.id_producto) === String(p.id_producto))?.cantidad || 1;
        avisar(`🛒 "${p.nombre}" añadido al carrito (${cantEnCarrito} unid.). ¡Puedes seguir añadiendo más productos!`);
    }
}

function cambiarCantidadCarritoClienta(idProducto, delta) {
    const idx = carritoClienta.findIndex((item) => String(item.id_producto) === String(idProducto));
    if (idx === -1) return;

    const p = productosDisponibles.find((x) => String(x.id_producto) === String(idProducto));
    const stockMax = p ? Number(p.stock) : 99;
    const nuevaCant = carritoClienta[idx].cantidad + Number(delta);

    if (nuevaCant <= 0) {
        carritoClienta.splice(idx, 1);
    } else if (nuevaCant > stockMax) {
        avisar(`Solo hay ${stockMax} unidades disponibles de este producto.`);
        carritoClienta[idx].cantidad = stockMax;
    } else {
        carritoClienta[idx].cantidad = nuevaCant;
    }

    guardarCarritoEnStorage();
    dibujarCarritoClienta();
    dibujarTiendaDirectaClienta();
}

function quitarDelCarritoClienta(idProducto) {
    carritoClienta = carritoClienta.filter((item) => String(item.id_producto) !== String(idProducto));
    guardarCarritoEnStorage();
    dibujarCarritoClienta();
    dibujarTiendaDirectaClienta();
}

function vaciarCarritoClienta() {
    carritoClienta = [];
    guardarCarritoEnStorage();
    dibujarCarritoClienta();
    dibujarTiendaDirectaClienta();
    avisar('Carrito de compras vaciado.');
}

function dibujarCarritoClienta() {
    const listaCont = document.getElementById('listaItemsCarritoClienta');
    const barraCheckout = document.getElementById('barraCheckoutCarritoClienta');
    const btnVaciar = document.getElementById('btnVaciarCarritoClienta');
    const badgeTop = document.getElementById('badgeCarritoClienta');
    const txtUnidades = document.getElementById('resumenUnidadesCarritoClienta');
    const txtTotal = document.getElementById('resumenTotalCarritoClienta');

    // Filtrar productos que existan y ajustar al stock real actual
    const itemsDetallados = [];
    carritoClienta.forEach((item) => {
        const prod = productosDisponibles.find((p) => String(p.id_producto) === String(item.id_producto));
        if (prod && Number(prod.stock) > 0) {
            if (item.cantidad > Number(prod.stock)) {
                item.cantidad = Number(prod.stock);
            }
            const info = typeof obtenerFichaProducto === 'function'
                ? obtenerFichaProducto(prod)
                : { imagen: prod.imagen || 'img/productos/shampoo-argan.jpg', categoria: 'Tienda BellaStyle' };
            itemsDetallados.push({
                id_producto: prod.id_producto,
                nombre: prod.nombre,
                precio: Number(prod.precio),
                stock: Number(prod.stock),
                cantidad: item.cantidad,
                subtotal: Number(prod.precio) * item.cantidad,
                imagen: info.imagen,
                categoria: info.categoria
            });
        }
    });

    const totalUnidades = itemsDetallados.reduce((acc, i) => acc + i.cantidad, 0);
    const granTotal = itemsDetallados.reduce((acc, i) => acc + i.subtotal, 0);

    if (badgeTop) {
        badgeTop.textContent = `${totalUnidades} en carrito`;
        badgeTop.className = totalUnidades > 0
            ? 'rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-extrabold text-amber-950 shadow-sm'
            : 'rounded-full bg-bella-600/15 px-2.5 py-0.5 text-xs font-extrabold text-bella-900';
    }

    if (!listaCont) return;

    if (itemsDetallados.length === 0) {
        listaCont.innerHTML = `
            <div class="rounded-2xl border border-dashed border-bella-300 bg-white/80 p-5 text-center">
                <p class="text-sm font-bold text-pastel-tinta">🛒 Tu carrito de compras está vacío</p>
                <p class="mt-1 text-xs font-medium text-pastel-subtinta">
                    Presiona el botón <strong>"🛒 Comprar producto"</strong> en cualquiera de los productos de abajo para añadirlo al carrito. Puedes añadir todos los productos que quieras y pagarlos juntos en un solo pedido.
                </p>
            </div>`;
        barraCheckout?.classList.add('hidden');
        btnVaciar?.classList.add('hidden');
        return;
    }

    barraCheckout?.classList.remove('hidden');
    btnVaciar?.classList.remove('hidden');
    if (txtUnidades) txtUnidades.textContent = `Total del pedido (${totalUnidades} unidad${totalUnidades === 1 ? '' : 'es'})`;
    if (txtTotal) txtTotal.textContent = pesos(granTotal);

    listaCont.innerHTML = `
        <div class="space-y-2.5">
            ${itemsDetallados.map((item) => `
                <div class="flex flex-col justify-between gap-3 rounded-2xl border border-bella-300/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                    <div class="flex items-center gap-3">
                        <img src="${escapar(item.imagen)}" alt="${escapar(item.nombre)}" class="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-bella-300">
                        <div>
                            <span class="rounded-full bg-pastel-menta px-2 py-0.5 text-[10px] font-extrabold text-emerald-950">${escapar(item.categoria)}</span>
                            <h4 class="mt-0.5 text-sm font-bold text-pastel-tinta">${escapar(item.nombre)}</h4>
                            <p class="text-xs font-semibold text-pastel-subtinta">${pesos(item.precio)} c/u · <span class="text-emerald-800">${item.stock} disponibles</span></p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between gap-4 border-t border-bella-100 pt-2 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div class="inline-flex items-center gap-1.5 rounded-xl border border-bella-300 bg-pastel-perla p-1">
                            <button type="button" data-cart-delta="-1" data-cart-id="${item.id_producto}" class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-extrabold text-pastel-tinta shadow-sm hover:bg-pastel-rosa">&minus;</button>
                            <span class="min-w-[2rem] text-center text-xs font-extrabold text-pastel-tinta">${item.cantidad}</span>
                            <button type="button" data-cart-delta="1" data-cart-id="${item.id_producto}" class="flex h-7 w-7 items-center justify-center rounded-lg bg-bella-600 text-sm font-extrabold text-white shadow-sm hover:bg-bella-700">+</button>
                        </div>
                        <div class="text-right">
                            <p class="font-titulo text-xl font-bold text-bella-800">${pesos(item.subtotal)}</p>
                            <button type="button" data-cart-remove="${item.id_producto}" class="text-[11px] font-bold text-red-700 hover:underline">Quitar</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>`;

    listaCont.querySelectorAll('button[data-cart-delta]').forEach((btn) => {
        btn.addEventListener('click', () => {
            cambiarCantidadCarritoClienta(btn.dataset.cartId, Number(btn.dataset.cartDelta));
        });
    });

    listaCont.querySelectorAll('button[data-cart-remove]').forEach((btn) => {
        btn.addEventListener('click', () => {
            quitarDelCarritoClienta(btn.dataset.cartRemove);
        });
    });
}

async function procesarCompraCarritoClienta() {
    if (carritoClienta.length === 0) {
        return avisar('Tu carrito está vacío. Añade al menos un producto.');
    }

    const btnPagar = document.getElementById('btnPagarCarritoClienta');
    const metodoPago = document.getElementById('metodoPagoCarritoClienta')?.value || 'Nequi / Daviplata';
    const referenciaInput = document.getElementById('referenciaPagoCarritoClienta')?.value.trim() || '';
    const prefijo = metodoPago === 'Nequi / Daviplata' ? 'NEQ' : (metodoPago === 'Tarjeta / PSE' ? 'PSE' : 'TIENDA');
    const referenciaPago = referenciaInput
        ? `${prefijo}-${referenciaInput.replace(/\s+/g, '')}`
        : `${prefijo}-${Math.floor(100000 + Math.random() * 900000)}`;

    if (btnPagar) {
        btnPagar.disabled = true;
        btnPagar.textContent = 'Procesando pedido...';
    }

    const res = await pedir('/carrito/comprar', 'POST', {
        idUsuario: usuario.id,
        clienteNombre: usuario.nombre,
        metodoPago,
        referenciaPago,
        items: carritoClienta.map((i) => ({
            idProducto: i.id_producto,
            cantidad: i.cantidad
        }))
    });

    if (btnPagar) {
        btnPagar.disabled = false;
        btnPagar.textContent = '✅ Finalizar compra del carrito';
    }

    if (!res.success) {
        return avisar(res.message);
    }

    // Limpiar carrito tras compra exitosa
    carritoClienta = [];
    guardarCarritoEnStorage();
    if (document.getElementById('referenciaPagoCarritoClienta')) {
        document.getElementById('referenciaPagoCarritoClienta').value = '';
    }

    await refrescarProductosTiempoReal();
    await cargarComprasClienta();
    dibujarCarritoClienta();

    avisar(res.message);
    // Llevamos a la clienta a "Mis Compras" para que vea inmediatamente su historial actualizado
    cambiarVistaClienta('compras');
}

// Función para compatibilidad cuando se llama comprarProductoModal(idProducto)
function comprarProductoModal(idProducto) {
    cambiarVistaClienta('tienda');
    agregarAlCarritoClienta(idProducto, true);
    document.getElementById('contenedorCarritoClienta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function verComprobanteCompraProducto(idCompra) {
    const cp = comprasClienta.find((x) => String(x.id_compra) === String(idCompra));
    if (!cp) return avisar('No se encontró el comprobante de compra');

    const htmlRecibo = `
        <div class="rounded-2xl border-2 border-dashed border-bella-400 bg-white p-5 text-pastel-tinta shadow-inner">
            <div class="border-b border-bella-200 pb-3 text-center">
                <p class="text-[11px] font-bold uppercase tracking-widest text-bella-700">BellaStyle Studio · Tienda Oficial</p>
                <h4 class="mt-0.5 font-titulo text-2xl font-bold text-pastel-tinta">Orden de Compra #CP-${cp.id_compra}</h4>
                <p class="mt-1 text-xs font-semibold text-emerald-800">✓ Compra confirmada y descontada del inventario</p>
            </div>
            <dl class="mt-3 space-y-2 text-xs">
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Clienta:</dt>
                    <dd class="font-bold text-pastel-tinta text-right">${escapar(cp.cliente_nombre || usuario.nombre)}</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Fecha y hora:</dt>
                    <dd class="font-bold text-bella-800 text-right">${escapar(cp.fecha)} · ${escapar(cp.hora || '')}</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Producto adquirido:</dt>
                    <dd class="font-bold text-pastel-tinta text-right">${escapar(cp.producto_nombre)}</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Cantidad y valor unitario:</dt>
                    <dd class="font-semibold text-pastel-tinta text-right">${cp.cantidad} unidad(es) × ${pesos(cp.precio_unitario)}</dd>
                </div>
                <div class="flex justify-between gap-2 border-b border-bella-100 pb-1.5">
                    <dt class="font-bold text-pastel-subtinta">Método y referencia de pago:</dt>
                    <dd class="font-bold text-emerald-900 text-right">${escapar(cp.metodo_pago)} (${escapar(cp.referencia_pago || 'Aprobado')})</dd>
                </div>
                <div class="flex items-center justify-between pt-2 text-sm">
                    <dt class="font-bold uppercase tracking-wider text-pastel-tinta">Total pagado:</dt>
                    <dd class="font-titulo text-2xl font-bold text-bella-800">${pesos(cp.total)}</dd>
                </div>
            </dl>
        </div>
        <div class="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" id="btnImprimirReciboProducto" class="btn-primario py-2 text-xs">
                🖨️ Imprimir / Guardar Comprobante PDF
            </button>
        </div>`;

    abrirVentana(`🧾 Comprobante de Compra #CP-${cp.id_compra}`, htmlRecibo, null);

    document.getElementById('btnImprimirReciboProducto')?.addEventListener('click', () => {
        const v = window.open('', '_blank', 'width=700,height=640');
        if (!v) return window.print();
        v.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Orden de Compra #CP-${cp.id_compra} · BellaStyle</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #24131c; background: #fff9fb; }
                    .box { max-width: 500px; margin: 0 auto; border: 2px dashed #c94b7c; border-radius: 18px; padding: 24px; background: #fff; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f4dce6; font-size: 14px; }
                    .total { font-size: 20px; font-weight: bold; color: #9c2f5b; padding-top: 14px; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="box">
                    <p style="text-align:center;font-size:11px;font-weight:bold;letter-spacing:2px;color:#9c2f5b;margin:0;">BELLASTYLE STUDIO · TIENDA OFICIAL</p>
                    <h2 style="text-align:center;margin:6px 0;color:#541d37;">Orden de Compra #CP-${cp.id_compra}</h2>
                    <div class="row"><strong>Clienta:</strong> <span>${escapar(cp.cliente_nombre || usuario.nombre)}</span></div>
                    <div class="row"><strong>Fecha:</strong> <span>${escapar(cp.fecha)} · ${escapar(cp.hora || '')}</span></div>
                    <div class="row"><strong>Producto:</strong> <span>${escapar(cp.producto_nombre)}</span></div>
                    <div class="row"><strong>Cantidad:</strong> <span>${cp.cantidad} × ${pesos(cp.precio_unitario)}</span></div>
                    <div class="row"><strong>Método de pago:</strong> <span>${escapar(cp.metodo_pago)} (${escapar(cp.referencia_pago || '')})</span></div>
                    <div class="total"><span>Total:</span> <span>${pesos(cp.total)}</span></div>
                </div>
                <script>window.onload = function(){ window.print(); };<\/script>
            </body>
            </html>`);
        v.document.close();
    });
}

function calificarCompraProductoModal(idCompra) {
    const cp = comprasClienta.find((x) => String(x.id_compra) === String(idCompra));
    if (!cp) return;
    const calActual = Number(cp.calificacion) || 5;

    const htmlCal = `
        <div class="rounded-2xl border border-bella-300 bg-pastel-menta p-3 text-xs text-pastel-tinta">
            <p class="font-bold text-emerald-950">🧴 Producto adquirido: ${escapar(cp.producto_nombre)} (#CP-${cp.id_compra})</p>
            <p class="mt-0.5 text-[11px] text-pastel-subtinta">✨ Tu evaluación sobre este producto aparecerá inmediatamente en tiempo real en la sección "Experiencias reales de nuestras clientas" de la página de inicio.</p>
        </div>
        <div>
            <label class="etiqueta-oscura">Calificación del producto (1 a 5 estrellas) *</label>
            <div id="selectorEstrellasCompraModal" class="flex gap-2 pt-1">
                ${[1, 2, 3, 4, 5].map((n) => `
                    <button type="button" data-estrella-compra="${n}"
                            class="flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                                n <= calActual
                                    ? 'border-amber-500 bg-amber-400/30 text-amber-950 shadow-sm'
                                    : 'border-bella-300 bg-pastel-perla text-pastel-subtinta'
                            }">
                        ${n} ★
                    </button>`).join('')}
            </div>
            <input type="hidden" id="vCalificacionCompra" value="${calActual}">
        </div>
        <div>
            <label for="vComentarioCompra" class="etiqueta-oscura">Escribe tu opinión sobre el producto *</label>
            <textarea id="vComentarioCompra" rows="3" class="campo-pastel" placeholder="Ej. Excelente producto, dejó mi cabello súper hidratado y con brillo desde el primer uso..." required>${escapar(cp.comentario_calificacion || '')}</textarea>
        </div>`;

    abrirVentana(`★ Calificar producto · ${cp.producto_nombre}`, htmlCal, async () => {
        const res = await pedir(`/compras/${cp.id_compra}/calificar`, 'PUT', {
            calificacion: Number(valor('vCalificacionCompra')),
            comentario: valor('vComentarioCompra')
        });
        if (res.success) {
            await cargarComprasClienta();
        }
        return res;
    }, 'Publicar calificación en tiempo real');

    document.querySelectorAll('#selectorEstrellasCompraModal button[data-estrella-compra]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const elegida = Number(btn.dataset.estrellaCompra);
            document.getElementById('vCalificacionCompra').value = elegida;
            document.querySelectorAll('#selectorEstrellasCompraModal button[data-estrella-compra]').forEach((b) => {
                const n = Number(b.dataset.estrellaCompra);
                b.className = `flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                    n <= elegida
                        ? 'border-amber-500 bg-amber-400/30 text-amber-950 shadow-sm'
                        : 'border-bella-300 bg-pastel-perla text-pastel-subtinta'
                }`;
            });
        });
    });
}

async function cargarComprasClienta() {
    const tabla = document.getElementById('tablaComprasClienta');
    if (!tabla) return;

    const res = await pedir(`/compras?idUsuario=${usuario.id}`);
    comprasClienta = res.data || [];

    const badgeHist = document.getElementById('badgeHistorialComprasClienta');
    if (badgeHist) {
        badgeHist.textContent = `${comprasClienta.length} compra${comprasClienta.length === 1 ? '' : 's'}`;
    }

    const contMetricasCompras = document.getElementById('metricasComprasClienta');
    if (contMetricasCompras) {
        const totalUnidadesCompradas = comprasClienta.reduce((acc, c) => acc + Number(c.cantidad || 1), 0);
        const totalInvertido = comprasClienta.reduce((acc, c) => acc + Number(c.total || 0), 0);
        contMetricasCompras.innerHTML =
            tarjetaMetrica('Órdenes de compra', comprasClienta.length, 'bg-pastel-rosa') +
            tarjetaMetrica('Productos adquiridos', `${totalUnidadesCompradas} unid.`, 'bg-pastel-lavanda') +
            tarjetaMetrica('Total compras tienda', pesos(totalInvertido), 'bg-pastel-menta');
    }

    tabla.innerHTML = comprasClienta.length === 0
        ? filaVacia(6, 'Aún no has comprado productos individuales. Elige cualquier producto arriba para comprarlo.')
        : comprasClienta.map((cp) => {
            const info = typeof obtenerFichaProducto === 'function'
                ? obtenerFichaProducto({ nombre: cp.producto_nombre, imagen: cp.imagen })
                : { imagen: cp.imagen || 'img/productos/shampoo-argan.jpg' };
            return `
                <tr>
                    <td class="font-mono text-xs text-white/60">CP-${cp.id_compra}</td>
                    <td>
                        <div class="flex items-center gap-3">
                            <img src="${escapar(info.imagen)}" alt="${escapar(cp.producto_nombre)}" class="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-bella-300/60">
                            <div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="font-semibold text-white">${escapar(cp.producto_nombre)}</span>
                                    <button type="button" data-editar="calificarCompraProductoModal" data-id="${cp.id_compra}" class="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-300 ring-1 ring-amber-400/40 transition hover:bg-amber-400/35">
                                        ★ ${cp.calificacion ? `Evaluado (${cp.calificacion}/5) · Editar` : 'Calificar producto'}
                                    </button>
                                </div>
                                ${renderizarEstrellas(cp.calificacion, cp.comentario_calificacion)}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="font-bold text-oro">${pesos(cp.total)}</span>
                        <span class="block text-xs text-white/60">${cp.cantidad} unidad(es) × ${pesos(cp.precio_unitario)}</span>
                    </td>
                    <td>
                        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                            ✓ ${escapar(cp.metodo_pago)}
                        </span>
                        ${cp.referencia_pago ? `<span class="mt-0.5 block font-mono text-[11px] text-white/50">Ref: ${escapar(cp.referencia_pago)}</span>` : ''}
                    </td>
                    <td class="whitespace-nowrap text-xs">${escapar(cp.fecha)} · ${escapar(cp.hora || '')}</td>
                    <td class="whitespace-nowrap text-right">
                        ${botonEditar('🧾 Comprobante', 'verComprobanteCompraProducto', cp.id_compra)}
                        <button class="btn-mini bg-amber-400/25 font-extrabold text-amber-200 ring-1 ring-amber-400/50 hover:bg-amber-400/40" data-editar="calificarCompraProductoModal" data-id="${cp.id_compra}">
                            ★ ${cp.calificacion ? 'Editar evaluación' : 'Calificar / Evaluar'}
                        </button>
                    </td>
                </tr>`;
        }).join('');

    activarBotones(tabla, cargarComprasClienta);
}

function dibujarTiendaDirectaClienta() {
    const cont = document.getElementById('tiendaDirectaClienta');
    if (!cont) return;

    if (!productosDisponibles || productosDisponibles.length === 0) {
        cont.innerHTML = '<p class="text-xs text-pastel-subtinta">No hay productos disponibles en este momento.</p>';
        return;
    }

    const q = (document.getElementById('buscadorTiendaPanelClienta')?.value || '').trim().toLowerCase();
    const lista = q
        ? productosDisponibles.filter((p) => `${p.nombre} ${p.categoria || ''} ${p.descripcion || ''}`.toLowerCase().includes(q))
        : productosDisponibles;

    cont.innerHTML = lista.map((p) => {
        const info = typeof obtenerFichaProducto === 'function'
            ? obtenerFichaProducto(p)
            : { imagen: p.imagen || 'img/productos/shampoo-argan.jpg', categoria: 'Tienda BellaStyle', descripcion: 'Producto profesional de salón.' };
        const disponible = Number(p.stock) > 0;
        const itemEnCarrito = carritoClienta.find((i) => String(i.id_producto) === String(p.id_producto));
        const cantEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

        return `
            <div class="flex flex-col justify-between rounded-2xl border ${cantEnCarrito > 0 ? 'border-2 border-bella-600 ring-2 ring-bella-400/30' : 'border-bella-300/80'} bg-white p-4 shadow-sm transition hover:border-bella-500 hover:shadow-md">
                <div>
                    <div class="relative mb-3 h-44 w-full overflow-hidden rounded-xl bg-pastel-perla">
                        <img src="${escapar(info.imagen)}" alt="${escapar(p.nombre)}" class="h-full w-full object-cover transition duration-300 hover:scale-105">
                        <span class="absolute left-2.5 top-2.5 rounded-full bg-pastel-menta px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-950 shadow-sm">
                            ${escapar(info.categoria)}
                        </span>
                        <span class="absolute right-2.5 top-2.5 rounded-full ${disponible ? 'bg-emerald-700 text-white' : 'bg-stone-500 text-white'} px-2.5 py-0.5 text-[11px] font-bold shadow-sm">
                            ${disponible ? `${p.stock} disponibles` : 'Agotado'}
                        </span>
                        ${cantEnCarrito > 0 ? `
                        <span class="absolute bottom-2.5 left-2.5 rounded-xl bg-bella-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md">
                            🛒 En tu carrito: ${cantEnCarrito} unid.
                        </span>` : ''}
                    </div>
                    <div class="flex items-start justify-between gap-2">
                        <h4 class="text-base font-bold text-pastel-tinta">${escapar(p.nombre)}</h4>
                        <p class="shrink-0 font-titulo text-2xl font-bold text-bella-800">${pesos(p.precio)}</p>
                    </div>
                    <p class="mt-1 text-xs leading-relaxed text-pastel-subtinta">${escapar(info.descripcion)}</p>
                </div>
                <div class="mt-3.5 flex items-center justify-between gap-2 border-t border-bella-200/70 pt-3">
                    <button type="button"
                            data-sumar-cita-prod="${p.id_producto}"
                            ${disponible ? '' : 'disabled'}
                            class="rounded-xl border border-bella-400/70 bg-pastel-perla px-2.5 py-1.5 text-[11px] font-bold text-pastel-tinta transition hover:bg-pastel-rosa disabled:opacity-40">
                        + Incluir en cita
                    </button>
                    <button type="button"
                            data-comprar-directo-prod="${p.id_producto}"
                            ${disponible ? '' : 'disabled'}
                            class="rounded-xl bg-bella-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700 disabled:opacity-40">
                        ${cantEnCarrito > 0 ? '🛒 + Añadir otro al carrito' : '🛒 Comprar producto'}
                    </button>
                </div>
            </div>`;
    }).join('');

    cont.querySelectorAll('button[data-sumar-cita-prod]').forEach((btn) => {
        btn.addEventListener('click', () => {
            cambiarVistaClienta('citas');
            const selectProd = document.getElementById('productoAdicional');
            if (selectProd) {
                selectProd.value = String(btn.dataset.sumarCitaProd);
                actualizarResumenTotalCita();
                avisar('Producto agregado al formulario de tu cita.');
                document.getElementById('formCita')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    cont.querySelectorAll('button[data-comprar-directo-prod]').forEach((btn) => {
        btn.addEventListener('click', () => {
            agregarAlCarritoClienta(btn.dataset.comprarDirectoProd, true);
        });
    });
}

async function refrescarProductosTiempoReal() {
    const res = await pedir('/productos');
    if (!res || !res.success) return;
    productosDisponibles = res.data || [];
    if (usuario.rol === 'Clienta') {
        const valorPrevio = document.getElementById('productoAdicional')?.value || '';
        poblarSelectProductosClienta();
        const selectProd = document.getElementById('productoAdicional');
        if (selectProd && valorPrevio) {
            selectProd.value = valorPrevio;
        }
        dibujarCarritoClienta();
        dibujarTiendaDirectaClienta();
        actualizarResumenTotalCita();
    }
    if (usuario.rol === 'Administradora') {
        await cargarProductosAdmin();
    }
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
let comprasClienta = [];
let carritoClienta = [];

function claveStorageCarrito() {
    return `bellaCarrito_${usuario?.id || 'invitado'}`;
}

function cargarCarritoGuardado() {
    try {
        const guardado = localStorage.getItem(claveStorageCarrito());
        if (guardado) {
            const parsed = JSON.parse(guardado);
            if (Array.isArray(parsed)) carritoClienta = parsed;
        }
    } catch (_) {
        carritoClienta = [];
    }
}

function guardarCarritoEnStorage() {
    try {
        localStorage.setItem(claveStorageCarrito(), JSON.stringify(carritoClienta));
    } catch (_) {}
}

function cambiarVistaClienta(vista = 'citas') {
    const divCitas = document.getElementById('vistaClientaCitas');
    const divTienda = document.getElementById('vistaClientaTienda');
    const divCompras = document.getElementById('vistaClientaCompras');

    if (divCitas) {
        divCitas.classList.toggle('hidden', vista !== 'citas');
        divCitas.classList.toggle('grid', vista === 'citas');
    }
    if (divTienda) {
        divTienda.classList.toggle('hidden', vista !== 'tienda');
    }
    if (divCompras) {
        divCompras.classList.toggle('hidden', vista !== 'compras');
    }

    document.querySelectorAll('[data-pestana-clienta]').forEach((btn) => {
        const activo = btn.dataset.pestanaClienta === vista;
        btn.className = activo
            ? 'flex items-center justify-center gap-2 rounded-2xl bg-bella-600 px-4 py-3.5 text-xs font-extrabold text-white shadow-md transition sm:text-sm'
            : 'flex items-center justify-center gap-2 rounded-2xl border border-bella-300/80 bg-white px-4 py-3.5 text-xs font-extrabold text-pastel-tinta shadow-sm transition hover:bg-pastel-rosa sm:text-sm';
    });
}

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

    const infoProd = prod && typeof obtenerFichaProducto === 'function' ? obtenerFichaProducto(prod) : null;

    cajaResumen.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-3">
                ${infoProd ? `<img src="${escapar(infoProd.imagen)}" alt="${escapar(prod.nombre)}" class="h-11 w-11 rounded-xl object-cover ring-1 ring-bella-400/70 shadow-sm">` : ''}
                <div>
                    <p class="text-[11px] font-bold uppercase tracking-wider text-bella-900">Resumen estimado de tu cita</p>
                    <p class="text-xs font-semibold text-pastel-subtinta">
                        Servicio (${duracionBase} min): <strong>${pesos(precioBase)}</strong>
                        ${prod ? ` + ${escapar(prod.nombre)} (<strong>${pesos(precioProd)}</strong>)` : ''}
                    </p>
                    ${descuento > 0 ? `<p class="mt-0.5 text-xs font-bold text-emerald-900">💎 Beneficio BellaClub / Cupón 15% OFF aplicado: -${pesos(descuento)}</p>` : ''}
                </div>
            </div>
            <p class="font-titulo text-2xl font-bold text-bella-800">${pesos(total)}</p>
        </div>`;
}

// Llamada desde catalogo-modal.js cuando la clienta elige una especialidad específica
window.aplicarEspecialidadEnFormulario = function ({ variedad, categoria, precio, duracion }) {
    precioEspecialidadSeleccionada = precio ? Number(precio) : null;
    duracionEspecialidadSeleccionada = duracion ? Number(duracion) : null;
    const obs = document.getElementById('observaciones');
    if (obs) {
        obs.value = `Especialidad elegida: ${variedad} (${categoria})`;
    }
    const etiquetaVar = document.getElementById('variedadSeleccionada');
    if (etiquetaVar) {
        etiquetaVar.textContent = `✓ Especialidad: ${variedad} (${categoria}) · ${pesos(precioEspecialidadSeleccionada || 0)} · ${duracionEspecialidadSeleccionada || 60} min`;
        etiquetaVar.classList.remove('hidden');
    }
    // Recuperar producto preferido si hizo clic en "Incluir en mi cita" desde la Tienda
    const prodPrefTexto = sessionStorage.getItem('bellaProductoPreferida') || sessionStorage.getItem('bellaProductoPreferido');
    if (prodPrefTexto) {
        try {
            const prodPref = JSON.parse(prodPrefTexto);
            sessionStorage.removeItem('bellaProductoPreferido');
            const selectProd = document.getElementById('productoAdicional');
            if (selectProd && prodPref.id_producto) {
                selectProd.value = String(prodPref.id_producto);
            }
        } catch (_) {}
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
        // Recuperar producto preferido si hizo clic en "Incluir en mi cita" desde la Tienda
    const prodPrefTexto = sessionStorage.getItem('bellaProductoPreferida') || sessionStorage.getItem('bellaProductoPreferido');
    if (prodPrefTexto) {
        try {
            const prodPref = JSON.parse(prodPrefTexto);
            sessionStorage.removeItem('bellaProductoPreferido');
            const selectProd = document.getElementById('productoAdicional');
            if (selectProd && prodPref.id_producto) {
                selectProd.value = String(prodPref.id_producto);
            }
        } catch (_) {}
    }

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

    // Selector interactivo de Método de Pago en el formulario de la Clienta
    const inputMetodoPago = document.getElementById('metodoPagoCita');
    const cajaNequi = document.getElementById('cajaPagoNequi');
    const cajaTarjeta = document.getElementById('cajaPagoTarjeta');
    document.querySelectorAll('[data-btn-metodo]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const elegido = btn.dataset.btnMetodo;
            if (inputMetodoPago) inputMetodoPago.value = elegido;
            document.querySelectorAll('[data-btn-metodo]').forEach((b) => {
                const activo = b.dataset.btnMetodo === elegido;
                b.className = activo
                    ? 'rounded-xl border-2 border-bella-600 bg-pastel-rosa px-2 py-2 text-center text-[11px] font-extrabold text-bella-900 shadow-sm transition'
                    : 'rounded-xl border border-bella-300 bg-white px-2 py-2 text-center text-[11px] font-bold text-pastel-tinta transition hover:bg-pastel-rosa/50';
            });
            cajaNequi?.classList.toggle('hidden', elegido !== 'Nequi / Daviplata');
            cajaTarjeta?.classList.toggle('hidden', elegido !== 'Tarjeta / PSE');
        });
    });

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

    // Píldoras rápidas con todos los servicios disponibles y su foto de ejemplo
    const contenedorBotones = document.getElementById('botonesCatalogoClienta');
    if (contenedorBotones) {
        contenedorBotones.innerHTML = conEstilista.map((s) => {
            const ficha = typeof buscarDetalleServicio === 'function' ? buscarDetalleServicio(s) : null;
            const imgSrv = s.imagen || (ficha && ficha.imagen) || 'img/servicios/cat-corte.jpg';
            return `
            <button type="button"
                    data-explorar-id="${s.id_servicio}"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-bella-400/50 bg-pastel-crema px-2.5 py-1 text-xs font-bold text-pastel-tinta shadow-sm transition hover:border-bella-600 hover:bg-pastel-rosa">
                <img src="${escapar(imgSrv)}" alt="" class="h-5 w-5 rounded-md object-cover">
                <span>${escapar(s.nombre)}</span>
            </button>`;
        }).join('');
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

    // Pestañas principales de la Clienta: "Apartar Cita y Mis Citas" | "Comprar Producto" | "Mis Compras"
    document.querySelectorAll('[data-pestana-clienta]').forEach((btn) => {
        btn.addEventListener('click', () => {
            cambiarVistaClienta(btn.dataset.pestanaClienta);
        });
    });
    document.getElementById('btnIrAMisComprasDesdeTienda')?.addEventListener('click', () => cambiarVistaClienta('compras'));
    document.getElementById('btnVolverATiendaDesdeCompras')?.addEventListener('click', () => cambiarVistaClienta('tienda'));
    document.getElementById('btnVaciarCarritoClienta')?.addEventListener('click', vaciarCarritoClienta);
    document.getElementById('btnPagarCarritoClienta')?.addEventListener('click', procesarCompraCarritoClienta);
    document.getElementById('buscadorTiendaPanelClienta')?.addEventListener('input', dibujarTiendaDirectaClienta);

    cargarCarritoGuardado();

    // Recuperar producto preferido si hizo clic en "Quiero este producto" desde la Tienda
    const prodPrefTexto = sessionStorage.getItem('bellaProductoPreferida') || sessionStorage.getItem('bellaProductoPreferido');
    let idProductoAgregarAlCarrito = null;
    if (prodPrefTexto) {
        try {
            const prodPref = JSON.parse(prodPrefTexto);
            sessionStorage.removeItem('bellaProductoPreferido');
            if (prodPref && prodPref.id_producto) {
                idProductoAgregarAlCarrito = prodPref.id_producto;
            }
        } catch (_) {}
    }

    dibujarCarritoClienta();
    dibujarTiendaDirectaClienta();
    cargarComprasClienta();
    actualizarResumenTotalCita();
    await actualizarDisponibilidadHoras();

    if (idProductoAgregarAlCarrito) {
        cambiarVistaClienta('tienda');
        agregarAlCarritoClienta(idProductoAgregarAlCarrito, true);
    }

    // Sincronización automática de stock en tiempo real entre computador y celular (cada 4 segundos)
    setInterval(refrescarProductosTiempoReal, 4000);

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
    const metodoPago = document.getElementById('metodoPagoCita')?.value || 'Efectivo en Salón';

    let referenciaPago = null;
    if (metodoPago === 'Nequi / Daviplata') {
        const cel = document.getElementById('celularNequiCita')?.value.trim() || '';
        referenciaPago = cel ? `NEQ-${cel.replace(/\s+/g, '').slice(-6)}` : `NEQ-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (metodoPago === 'Tarjeta / PSE') {
        const banco = document.getElementById('bancoPseCita')?.value || 'PSE';
        const ult4 = document.getElementById('ultimos4Cita')?.value.trim() || String(Math.floor(1000 + Math.random() * 9000));
        referenciaPago = `${banco.slice(0, 3).toUpperCase()}-${ult4}`;
    }

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
        aplicarVip: finalizadasCount >= 3,
        metodoPago,
        referenciaPago
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
        // Recuperar producto preferido si hizo clic en "Incluir en mi cita" desde la Tienda
    const prodPrefTexto = sessionStorage.getItem('bellaProductoPreferida') || sessionStorage.getItem('bellaProductoPreferido');
    if (prodPrefTexto) {
        try {
            const prodPref = JSON.parse(prodPrefTexto);
            sessionStorage.removeItem('bellaProductoPreferido');
            const selectProd = document.getElementById('productoAdicional');
            if (selectProd && prodPref.id_producto) {
                selectProd.value = String(prodPref.id_producto);
            }
        } catch (_) {}
    }

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
                // Recuperar producto preferido si hizo clic en "Incluir en mi cita" desde la Tienda
    const prodPrefTexto = sessionStorage.getItem('bellaProductoPreferida') || sessionStorage.getItem('bellaProductoPreferido');
    if (prodPrefTexto) {
        try {
            const prodPref = JSON.parse(prodPrefTexto);
            sessionStorage.removeItem('bellaProductoPreferido');
            const selectProd = document.getElementById('productoAdicional');
            if (selectProd && prodPref.id_producto) {
                selectProd.value = String(prodPref.id_producto);
            }
        } catch (_) {}
    }

    actualizarResumenTotalCita();
                avisar('¡Cupón BELLA15 (15% de descuento) aplicado en tu formulario!');
            }
        });
    }
    // Recuperar producto preferido si hizo clic en "Incluir en mi cita" desde la Tienda
    const prodPrefTexto = sessionStorage.getItem('bellaProductoPreferida') || sessionStorage.getItem('bellaProductoPreferido');
    if (prodPrefTexto) {
        try {
            const prodPref = JSON.parse(prodPrefTexto);
            sessionStorage.removeItem('bellaProductoPreferido');
            const selectProd = document.getElementById('productoAdicional');
            if (selectProd && prodPref.id_producto) {
                selectProd.value = String(prodPref.id_producto);
            }
        } catch (_) {}
    }

    actualizarResumenTotalCita();

    tabla.innerHTML = citasClienta.length === 0 ? filaVacia(5, 'Todavía no tienes citas agendadas') : citasClienta.map((c) => {
        const activa = c.estado === 'Pendiente' || c.estado === 'Confirmada';
        const yaPagada = String(c.estado_pago || '').toLowerCase().includes('pagado');
        let acciones =
            botonEditar('💬 Chat', 'abrirChatCita', c.id) + ' ' +
            botonEditar('🧾 Comprobante', 'verComprobanteCita', c.id) + ' ' +
            botonEditar('✉️ Correo', 'verCorreoCita', c.id) + ' ';
        if (activa && !yaPagada) {
            acciones += `<button class="btn-mini bg-emerald-500/20 font-bold text-emerald-300 hover:bg-emerald-500/30" data-editar="pagarCitaModal" data-id="${c.id}">💳 Pagar ahora</button> `;
        }
        if (activa) {
            acciones +=
                botonEditar('Reprogramar', 'reprogramarCita', c.id) + ' ' +
                botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' }) + ' ';
        } else if (c.estado === 'Finalizada' && c.foto_resultado) {
            acciones += `<button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="gestionarResultadoCita" data-id="${c.id}">📸 Ver resultado</button> `;
        }
        if (c.estado !== 'Cancelada') {
            acciones += `<button class="btn-mini bg-amber-400/25 font-extrabold text-amber-200 ring-1 ring-amber-400/50 hover:bg-amber-400/40" data-editar="calificarCita" data-id="${c.id}">★ ${c.calificacion ? 'Editar evaluación' : 'Calificar / Evaluar'}</button>`;
        }
        return `
            <tr>
                <td>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-semibold text-white">${escapar(c.servicio)}</span>
                        <span class="text-xs font-bold text-oro">${pesos(c.precio)}</span>
                        ${c.duracion_min ? `<span class="text-[11px] text-white/50">(${c.duracion_min} min)</span>` : ''}
                        ${c.estado !== 'Cancelada' ? `<button type="button" data-editar="calificarCita" data-id="${c.id}" class="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-300 ring-1 ring-amber-400/40 transition hover:bg-amber-400/35">★ ${c.calificacion ? `Evaluado (${c.calificacion}/5) · Editar` : 'Calificar / Evaluar'}</button>` : ''}
                    </div>
                    ${c.observaciones ? `<span class="mt-0.5 block text-xs text-bella-200">${escapar(c.observaciones)}</span>` : ''}
                    ${c.producto_adicional ? `<span class="mt-0.5 block text-xs font-semibold text-emerald-300">🧴 Incluye: ${escapar(c.producto_adicional)} (+${pesos(c.precio_producto)})</span>` : ''}
                    ${renderizarEtiquetaPago(c)}
                    ${renderizarMiniaturaResultado(c)}
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
            acciones += `<button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="gestionarResultadoCita" data-id="${c.id}">📸 Finalizar con foto</button> `;
            acciones += botonAccion('Finalizar', 'verde', `/citas/${c.id}/estado`, { estado: 'Finalizada' }) + ' ';
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        } else if (c.estado === 'Finalizada') {
            acciones += `<button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="gestionarResultadoCita" data-id="${c.id}">📸 ${c.foto_resultado ? 'Foto resultado' : 'Subir foto'}</button>`;
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
                    ${renderizarEtiquetaPago(c)}
                    ${renderizarMiniaturaResultado(c)}
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
    dibujarNominaAdmin();
    const fechaTl = document.getElementById('fechaTimelineAdmin')?.value || fechaDeHoy();
    dibujarTimelineDia(fechaTl, citasAdmin, 'contenedorTimelineAdmin');
    dibujarCitasAdmin();
}

// --- Nómina y Liquidación de Comisiones (40% Estilista / 60% Salón) ---

function obtenerResumenNomina(filtroMes = 'todos') {
    const finalizadas = citasAdmin.filter((c) => {
        if (c.estado !== 'Finalizada') return false;
        if (filtroMes && filtroMes !== 'todos' && !String(c.fecha).startsWith(filtroMes)) return false;
        return true;
    });

    const listaBase = estilistasAdmin.length > 0
        ? estilistasAdmin
        : [
            { id_estilista: 1, nombres: 'Laura', apellidos: 'Estilista', especialidad: 'Colorimetría y Balayage' },
            { id_estilista: 2, nombres: 'Diana', apellidos: 'Martínez', especialidad: 'Corte y Peinados' },
            { id_estilista: 3, nombres: 'Paula', apellidos: 'Ríos', especialidad: 'Manicure y PediSpa' },
            { id_estilista: 4, nombres: 'Camila', apellidos: 'Torres', especialidad: 'Terapia Capilar y Botox' },
            { id_estilista: 5, nombres: 'Valentina', apellidos: 'Herrera', especialidad: 'Peinados de Gala y Novias' },
            { id_estilista: 6, nombres: 'Natalia', apellidos: 'Mendoza', especialidad: 'Nail Art y Gel' }
        ];

    const filas = listaBase.map((est) => {
        const nombreCompleto = `${est.nombres} ${est.apellidos}`.trim();
        const citasDeEstilista = finalizadas.filter(
            (c) => String(c.id_estilista) === String(est.id_estilista) || c.estilista === nombreCompleto
        );
        const totalProducido = citasDeEstilista.reduce((acc, c) => acc + Number(c.precio || 0), 0);
        const comisionEstilista = Math.round(totalProducido * 0.40);
        const utilidadSalon = totalProducido - comisionEstilista;

        return {
            id_estilista: est.id_estilista,
            nombre: nombreCompleto,
            especialidad: est.especialidad || 'Estilista profesional',
            estado: est.estado || 'Activo',
            cantidadCitas: citasDeEstilista.length,
            totalProducido,
            comisionEstilista,
            utilidadSalon,
            citasDetalle: citasDeEstilista
        };
    }).sort((a, b) => b.totalProducido - a.totalProducido);

    const totalGeneral = filas.reduce((acc, f) => acc + f.totalProducido, 0);
    const totalComisiones = filas.reduce((acc, f) => acc + f.comisionEstilista, 0);
    const totalUtilidadSalon = totalGeneral - totalComisiones;

    return {
        filtroMes,
        totalCitasFinalizadas: finalizadas.length,
        totalGeneral,
        totalComisiones,
        totalUtilidadSalon,
        filas
    };
}

function dibujarNominaAdmin() {
    const tabla = document.getElementById('tablaNominaEstilistas');
    const contMetricas = document.getElementById('metricasNominaAdmin');
    if (!tabla) return;

    const filtroMes = document.getElementById('filtroMesNomina')?.value || 'todos';
    const resumen = obtenerResumenNomina(filtroMes);

    if (contMetricas) {
        contMetricas.innerHTML =
            tarjetaMetrica('Servicios liquidados', resumen.totalCitasFinalizadas, 'bg-pastel-lavanda') +
            tarjetaMetrica('Facturación bruta (100%)', pesos(resumen.totalGeneral), 'bg-pastel-rosa') +
            tarjetaMetrica('Nómina Estilistas (40%)', pesos(resumen.totalComisiones), 'bg-pastel-durazno') +
            tarjetaMetrica('Ganancia Neta Salón (60%)', pesos(resumen.totalUtilidadSalon), 'bg-pastel-menta');
    }

    tabla.innerHTML = resumen.filas.length === 0
        ? filaVacia(7, 'No hay registros de nómina para este periodo')
        : resumen.filas.map((f) => `
            <tr>
                <td class="font-semibold text-white">${escapar(f.nombre)}</td>
                <td>
                    <span class="inline-block rounded-lg bg-bella-500/15 px-2.5 py-1 text-xs font-semibold text-bella-200">
                        ${escapar(f.especialidad)}
                    </span>
                </td>
                <td class="font-bold text-white">${f.cantidadCitas} servicio(s)</td>
                <td class="font-semibold text-bella-100">${pesos(f.totalProducido)}</td>
                <td>
                    <span class="inline-block rounded-xl bg-emerald-500/20 px-3 py-1 font-bold text-emerald-300">
                        ${pesos(f.comisionEstilista)}
                    </span>
                </td>
                <td class="font-bold text-oro">${pesos(f.utilidadSalon)}</td>
                <td class="whitespace-nowrap text-right">
                    <button type="button" class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="verColillaNominaEstilista" data-id="${f.id_estilista}">
                        🧾 Liquidar / PDF
                    </button>
                </td>
            </tr>`).join('');

    activarBotones(tabla, cargarCitasAdmin);
}

function verColillaNominaEstilista(idEstilista) {
    const filtroMes = document.getElementById('filtroMesNomina')?.value || 'todos';
    const resumen = obtenerResumenNomina(filtroMes);
    const fila = resumen.filas.find((f) => String(f.id_estilista) === String(idEstilista));
    if (!fila) return avisar('No se encontró información de la estilista');

    const etiquetaPeriodo = filtroMes === 'todos' ? 'Acumulado General' : `Periodo ${filtroMes}`;

    const htmlColilla = `
        <div class="rounded-2xl border-2 border-dashed border-bella-400 bg-white p-5 text-pastel-tinta shadow-inner">
            <div class="border-b border-bella-200 pb-3 text-center">
                <p class="text-[11px] font-bold uppercase tracking-widest text-bella-700">BellaStyle Studio · Comprobante de Nómina y Comisiones</p>
                <h4 class="mt-0.5 font-titulo text-2xl font-bold text-pastel-tinta">${escapar(fila.nombre)}</h4>
                <p class="mt-0.5 text-xs font-semibold text-pastel-subtinta">${escapar(fila.especialidad)} · ${escapar(etiquetaPeriodo)}</p>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-pastel-perla p-3 text-center text-xs">
                <div>
                    <p class="text-[10px] font-bold uppercase text-pastel-subtinta">Producido (100%)</p>
                    <p class="mt-0.5 font-titulo text-lg font-bold text-pastel-tinta">${pesos(fila.totalProducido)}</p>
                </div>
                <div class="border-x border-bella-300/60">
                    <p class="text-[10px] font-bold uppercase text-emerald-900">Pago Estilista (40%)</p>
                    <p class="mt-0.5 font-titulo text-lg font-bold text-emerald-800">${pesos(fila.comisionEstilista)}</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold uppercase text-bella-900">Retención Salón (60%)</p>
                    <p class="mt-0.5 font-titulo text-lg font-bold text-bella-800">${pesos(fila.utilidadSalon)}</p>
                </div>
            </div>

            <p class="mt-3 text-xs font-extrabold uppercase tracking-wider text-pastel-tinta">Detalle de servicios finalizados (${fila.cantidadCitas}):</p>
            <div class="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-bella-200">
                ${fila.citasDetalle.length === 0
                    ? '<p class="p-3 text-center text-xs text-pastel-subtinta">Sin servicios finalizados en este periodo.</p>'
                    : `<table class="w-full text-left text-xs">
                        <thead class="bg-pastel-rosa/60 text-[11px] font-bold text-bella-900">
                            <tr><th class="p-2">Cita / Fecha</th><th class="p-2">Clienta / Servicio</th><th class="p-2 text-right">Valor</th><th class="p-2 text-right">40% Estilista</th></tr>
                        </thead>
                        <tbody>
                            ${fila.citasDetalle.map((c) => `
                                <tr class="border-t border-bella-100">
                                    <td class="p-2 font-mono text-[11px]">BS-${c.id}<br><span class="text-pastel-subtinta">${escapar(c.fecha)}</span></td>
                                    <td class="p-2"><strong>${escapar(c.cliente)}</strong><br><span class="text-[11px] text-pastel-subtinta">${escapar(c.servicio)}</span></td>
                                    <td class="p-2 text-right font-semibold">${pesos(c.precio)}</td>
                                    <td class="p-2 text-right font-bold text-emerald-800">${pesos(Math.round(Number(c.precio) * 0.4))}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        </div>
        <div class="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" id="btnImprimirColillaNomina" class="btn-primario py-2 text-xs">
                🖨️ Imprimir Colilla de Pago (PDF)
            </button>
        </div>`;

    abrirVentana(`💰 Liquidación de Comisiones · ${fila.nombre}`, htmlColilla, null);

    document.getElementById('btnImprimirColillaNomina')?.addEventListener('click', () => {
        const ventanaImp = window.open('', '_blank', 'width=760,height=700');
        if (!ventanaImp) return window.print();
        ventanaImp.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Colilla de Nómina · ${escapar(fila.nombre)} · BellaStyle</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #24131c; background: #fff9fb; }
                    .box { max-width: 620px; margin: 0 auto; border: 2px dashed #c94b7c; border-radius: 18px; padding: 24px; background: #fff; }
                    h2 { margin: 4px 0; color: #541d37; }
                    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
                    th, td { border-bottom: 1px solid #f4dce6; padding: 8px; text-align: left; }
                    th { background: #fceef5; color: #541d37; }
                    .totales { margin-top: 16px; padding: 12px; background: #f3faf7; border-radius: 12px; display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; color: #065f46; }
                </style>
            </head>
            <body>
                <div class="box">
                    <p style="text-align:center;font-size:11px;font-weight:bold;letter-spacing:2px;color:#9c2f5b;margin:0;">BELLASTYLE STUDIO · LIQUIDACIÓN DE NÓMINA Y COMISIONES</p>
                    <h2 style="text-align:center;">${escapar(fila.nombre)}</h2>
                    <p style="text-align:center;font-size:12px;color:#624653;">${escapar(fila.especialidad)} · ${escapar(etiquetaPeriodo)} · Fecha de emisión: ${fechaDeHoy()}</p>
                    <table>
                        <thead>
                            <tr><th>Código</th><th>Fecha</th><th>Clienta</th><th>Servicio</th><th>Total Cita</th><th>Comisión (40%)</th></tr>
                        </thead>
                        <tbody>
                            ${fila.citasDetalle.map((c) => `
                                <tr>
                                    <td>BS-${c.id}</td>
                                    <td>${escapar(c.fecha)}</td>
                                    <td>${escapar(c.cliente)}</td>
                                    <td>${escapar(c.servicio)}</td>
                                    <td>${pesos(c.precio)}</td>
                                    <td><strong>${pesos(Math.round(Number(c.precio) * 0.4))}</strong></td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="totales">
                        <span>Total producido: ${pesos(fila.totalProducido)}</span>
                        <span>Neto a pagar a Estilista (40%): ${pesos(fila.comisionEstilista)}</span>
                    </div>
                </div>
                <script>window.onload = function(){ window.print(); };<\/script>
            </body>
            </html>`);
        ventanaImp.document.close();
    });
}

function exportarNominaCSV() {
    const filtroMes = document.getElementById('filtroMesNomina')?.value || 'todos';
    const resumen = obtenerResumenNomina(filtroMes);
    const encabezados = ['Estilista', 'Especializacion', 'Servicios_Finalizados', 'Total_Producido_100', 'Comision_Estilista_40', 'Utilidad_Salon_60'];
    const filas = resumen.filas.map((f) => [
        f.nombre,
        f.especialidad,
        f.cantidadCitas,
        f.totalProducido,
        f.comisionEstilista,
        f.utilidadSalon
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + [encabezados.join(','), ...filas].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nomina_comisiones_bellastyle_${fechaDeHoy()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    avisar('Reporte de Nómina y Comisiones descargado en CSV');
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
        const yaPagada = String(c.estado_pago || '').toLowerCase().includes('pagado');
        let acciones =
            botonEditar('💬 Chat', 'abrirChatCita', c.id) + ' ' +
            botonEditar('🧾 Comprobante', 'verComprobanteCita', c.id) + ' ' +
            botonEditar('✉️ Correo', 'verCorreoCita', c.id) + ' ';
        if (c.estado !== 'Cancelada' && !yaPagada) {
            acciones += `<button class="btn-mini bg-emerald-500/20 font-bold text-emerald-300 hover:bg-emerald-500/30" data-editar="pagarCitaModal" data-id="${c.id}">💳 Registrar pago</button> `;
        }
        if (c.estado === 'Pendiente') {
            acciones += botonAccion('Confirmar', 'azul', `/citas/${c.id}/estado`, { estado: 'Confirmada' }) + ' ';
        }
        if (c.estado === 'Pendiente' || c.estado === 'Confirmada') {
            acciones += `<button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="gestionarResultadoCita" data-id="${c.id}">📸 Finalizar con foto</button> `;
            acciones += botonAccion('Finalizar', 'verde', `/citas/${c.id}/estado`, { estado: 'Finalizada' }) + ' ';
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        } else if (c.estado === 'Finalizada') {
            acciones += `<button class="btn-mini bg-pastel-rosa font-bold text-bella-900 hover:bg-bella-200" data-editar="gestionarResultadoCita" data-id="${c.id}">📸 ${c.foto_resultado ? 'Foto resultado' : 'Subir foto'}</button>`;
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
                    ${renderizarEtiquetaPago(c)}
                    ${renderizarMiniaturaResultado(c)}
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
    dibujarNominaAdmin();
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

// --- Utilidad para cargar fotos desde el equipo (comprimidas en DataURL) o por URL ---

function comprimirArchivoImagen(archivo, maxAncho = 720, calidad = 0.82) {
    return new Promise((resolve, reject) => {
        if (!archivo || !archivo.type.startsWith('image/')) {
            return reject(new Error('Selecciona un archivo de imagen válido (JPG, PNG, WEBP).'));
        }
        const lector = new FileReader();
        lector.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
        lector.onload = (ev) => {
            const img = new Image();
            img.onerror = () => resolve(ev.target.result);
            img.onload = () => {
                let ancho = img.width;
                let alto = img.height;
                if (ancho > maxAncho) {
                    alto = Math.round((alto * maxAncho) / ancho);
                    ancho = maxAncho;
                }
                const canvas = document.createElement('canvas');
                canvas.width = ancho;
                canvas.height = alto;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, ancho, alto);
                resolve(canvas.toDataURL('image/jpeg', calidad));
            };
            img.src = ev.target.result;
        };
        lector.readAsDataURL(archivo);
    });
}

function conectarSelectorImagen({ idFile, idUrl, idHidden, idPreview, idPlaceholder }) {
    const inputFile = document.getElementById(idFile);
    const inputUrl = document.getElementById(idUrl);
    const inputHidden = document.getElementById(idHidden);
    const imgPreview = document.getElementById(idPreview);
    const placeholder = document.getElementById(idPlaceholder);

    const actualizarVista = (src) => {
        const limpio = (src || '').trim();
        if (inputHidden) inputHidden.value = limpio;
        if (imgPreview) {
            if (limpio) {
                imgPreview.src = limpio;
                imgPreview.classList.remove('hidden');
                if (placeholder) placeholder.classList.add('hidden');
            } else {
                imgPreview.src = '';
                imgPreview.classList.add('hidden');
                if (placeholder) placeholder.classList.remove('hidden');
            }
        }
    };

    if (inputFile) {
        inputFile.addEventListener('change', async () => {
            const file = inputFile.files?.[0];
            if (!file) return;
            try {
                const dataUrl = await comprimirArchivoImagen(file);
                if (inputUrl) inputUrl.value = '';
                actualizarVista(dataUrl);
            } catch (err) {
                avisar(err.message);
            }
        });
    }

    if (inputUrl) {
        inputUrl.addEventListener('input', () => {
            actualizarVista(inputUrl.value);
        });
    }
}

// --- Servicios ---

async function cargarServiciosAdmin() {
    serviciosAdmin = (await pedir('/servicios?todos=1')).data || [];
    servicios = serviciosAdmin.filter((s) => s.estado === 'Disponible');
    if (typeof window.sincronizarCatalogoConServicios === 'function') {
        window.sincronizarCatalogoConServicios(serviciosAdmin);
    }
    const tabla = document.getElementById('tablaServicios');

    tabla.innerHTML = serviciosAdmin.length === 0 ? filaVacia(5) : serviciosAdmin.map((s) => {
        const cambio = s.estado === 'Disponible'
            ? botonAccion('Desactivar', 'rojo', `/servicios/${s.id_servicio}/estado`, { estado: 'No disponible' })
            : botonAccion('Activar', 'verde', `/servicios/${s.id_servicio}/estado`, { estado: 'Disponible' });
        const ficha = typeof buscarDetalleServicio === 'function' ? buscarDetalleServicio(s) : null;
        const imgSrv = s.imagen || (ficha && ficha.imagen) || 'img/servicios/cat-corte.jpg';
        const cantEjemplos = Array.isArray(s.ejemplos) && s.ejemplos.length > 0
            ? s.ejemplos.length
            : (ficha ? ficha.grupos.reduce((acc, g) => acc + g.opciones.length, 0) : 0);
        const verTipos = `<button type="button" class="btn-mini bg-pastel-rosa text-bella-900 hover:bg-bella-200" data-ver-tipos="${s.id_servicio}">&#10022; Ver ejemplos (${cantEjemplos})</button>`;
        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${escapar(imgSrv)}" alt="${escapar(s.nombre)}" class="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-bella-300/60 shadow-sm">
                        <div>
                            <span class="block font-medium text-white">${escapar(s.nombre)}</span>
                            <span class="block text-[11px] text-bella-200/80">${cantEjemplos} ejemplo(s) con foto en galería</span>
                        </div>
                    </div>
                </td>
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

function obtenerEjemplosInicialesDeServicio(s) {
    if (Array.isArray(s.ejemplos) && s.ejemplos.length > 0) {
        return s.ejemplos;
    }
    if (s.id_servicio && typeof buscarDetalleServicio === 'function') {
        const ficha = buscarDetalleServicio(s);
        if (ficha && Array.isArray(ficha.grupos)) {
            const lista = [];
            ficha.grupos.forEach((g) => {
                (g.opciones || []).forEach((op) => {
                    lista.push({
                        nombre: op.nombre,
                        detalle: op.detalle,
                        precio: op.precio,
                        duracion: op.duracion,
                        imagen: op.imagen || s.imagen || ficha.imagen
                    });
                });
            });
            if (lista.length > 0) return lista;
        }
    }
    return [
        {
            nombre: '',
            detalle: '',
            precio: s.precio ? Math.round(s.precio) : '',
            duracion: s.duracion_min || 60,
            imagen: ''
        }
    ];
}

function editarServicio(idServicio) {
    const s = serviciosAdmin.find((x) => String(x.id_servicio) === String(idServicio)) || {
        nombre: '',
        precio: '',
        duracion_min: 60,
        imagen: '',
        subtitulo: '',
        ejemplos: null
    };
    const fichaActual = s.id_servicio && typeof buscarDetalleServicio === 'function' ? buscarDetalleServicio(s) : null;
    const imagenInicial = s.imagen || (fichaActual && fichaActual.imagen) || '';
    const subtituloInicial = s.subtitulo || (fichaActual && fichaActual.subtitulo) || '';
    const ejemplosIniciales = obtenerEjemplosInicialesDeServicio(s);

    const html = `
        <div class="grid gap-3 sm:grid-cols-3">
            <div class="sm:col-span-1">
                ${campo('vNombre', 'Nombre del servicio *', s.nombre, 'text', 'placeholder="Ej. Maquillaje Profesional" required')}
            </div>
            <div>
                ${campo('vPrecio', 'Precio base (pesos) *', s.precio ? Math.round(s.precio) : '', 'number', 'min="1000" step="500" placeholder="Ej. 75000" required')}
            </div>
            <div>
                ${campo('vDuracion', 'Duración (minutos) *', s.duracion_min, 'number', 'min="15" max="480" step="5" required')}
            </div>
        </div>

        <div>
            ${campo('vSubtitulo', 'Descripción corta del servicio', subtituloInicial, 'text', 'placeholder="Ej. Maquillaje social, novias y eventos especiales con acabado HD"')}
        </div>

        <!-- Foto principal obligatoria del servicio -->
        <div class="rounded-2xl border-2 border-bella-400/70 bg-pastel-perla p-3.5">
            <div class="flex items-center justify-between gap-2">
                <label class="text-xs font-extrabold uppercase tracking-wider text-bella-900">📷 Foto principal del servicio (Obligatoria) *</label>
                <span class="rounded-full bg-bella-600/15 px-2.5 py-0.5 text-[10px] font-bold text-bella-900">Requerida</span>
            </div>
            <p class="mt-0.5 text-[11px] font-medium text-pastel-subtinta">Sube una imagen desde tu computadora o pega la dirección de la foto. No se puede publicar el servicio sin foto.</p>
            <div class="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-bella-300 bg-white shadow-inner">
                    <img id="vServicioImgPreview" src="${atributo(imagenInicial)}" alt="Vista previa" class="${imagenInicial ? '' : 'hidden'} h-full w-full object-cover">
                    <span id="vServicioImgPlaceholder" class="${imagenInicial ? 'hidden' : ''} px-2 text-center text-[10px] font-bold text-pastel-subtinta">Sin foto</span>
                </div>
                <div class="flex-1 space-y-2">
                    <input id="vServicioFile" type="file" accept="image/*" class="block w-full text-xs font-semibold text-pastel-tinta file:mr-2.5 file:rounded-xl file:border-0 file:bg-bella-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-bella-700">
                    <input id="vServicioUrl" type="text" class="campo-pastel py-1.5 text-xs" value="${atributo(imagenInicial.startsWith('data:') ? '' : imagenInicial)}" placeholder="O escribe la ruta/URL de la foto (ej. img/servicios/cat-corte.jpg o https://...)">
                    <input id="vServicioImagenHidden" type="hidden" value="${atributo(imagenInicial)}">
                </div>
            </div>
        </div>

        <!-- Lista dinámica de Ejemplos debajo de la foto para que se vean en el catálogo y en la galería -->
        <div class="rounded-2xl border-2 border-bella-400/70 bg-pastel-rosa/50 p-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 class="text-xs font-extrabold uppercase tracking-wider text-bella-900">✨ Ejemplos de este servicio con foto (Para Catálogo y Galería) *</h3>
                    <p class="text-[11px] font-medium text-pastel-subtinta">Añade debajo varios ejemplos reales con su foto, nombre y precio para que las clientas los vean en la galería normal y al explorar el servicio.</p>
                </div>
                <button type="button" id="btnAgregarEjemploServicio" class="rounded-xl bg-bella-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-bella-700">
                    + Añadir otro ejemplo
                </button>
            </div>
            <div id="listaEjemplosServicioModal" class="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1"></div>
        </div>`;

    abrirVentana(idServicio ? 'Editar servicio, foto y ejemplos' : 'Nuevo servicio con foto y ejemplos', html, async () => {
        const nombre = valor('vNombre');
        const precio = Number(valor('vPrecio'));
        const duracion = Number(valor('vDuracion'));
        const subtitulo = valor('vSubtitulo');
        const imagen = valor('vServicioImagenHidden');

        if (!imagen) {
            return { success: false, message: '⚠️ Debes añadir obligatoriamente la foto principal del servicio antes de guardarlo.' };
        }

        const tarjetasEjemplos = [...document.querySelectorAll('#listaEjemplosServicioModal [data-item-ejemplo]')];
        if (tarjetasEjemplos.length === 0) {
            return { success: false, message: '⚠️ Debes añadir al menos un ejemplo debajo del servicio para mostrar en la galería.' };
        }

        const ejemplos = [];
        for (let i = 0; i < tarjetasEjemplos.length; i++) {
            const card = tarjetasEjemplos[i];
            const ejNombre = card.querySelector('[data-ej-nombre]')?.value.trim() || '';
            const ejDetalle = card.querySelector('[data-ej-detalle]')?.value.trim() || '';
            const ejPrecio = Number(card.querySelector('[data-ej-precio]')?.value) || precio;
            const ejDuracion = Number(card.querySelector('[data-ej-duracion]')?.value) || duracion;
            const ejImagen = card.querySelector('[data-ej-imagen]')?.value.trim() || '';

            if (!ejNombre) {
                return { success: false, message: `⚠️ Escribe el nombre del Ejemplo #${i + 1}.` };
            }
            if (!ejImagen) {
                return { success: false, message: `⚠️ El ejemplo "${ejNombre}" debe tener obligatoriamente una foto.` };
            }

            ejemplos.push({
                nombre: ejNombre,
                detalle: ejDetalle || `Ejemplo real de ${ejNombre} realizado por nuestras especialistas en salón.`,
                precio: ejPrecio,
                duracion: ejDuracion,
                imagen: ejImagen
            });
        }

        const datos = { nombre, precio, duracion, imagen, subtitulo, ejemplos };
        const respuesta = idServicio
            ? await pedir(`/servicios/${idServicio}`, 'PUT', datos)
            : await pedir('/servicios', 'POST', datos);
        if (respuesta.success) await cargarServiciosAdmin();
        return respuesta;
    });

    conectarSelectorImagen({
        idFile: 'vServicioFile',
        idUrl: 'vServicioUrl',
        idHidden: 'vServicioImagenHidden',
        idPreview: 'vServicioImgPreview',
        idPlaceholder: 'vServicioImgPlaceholder'
    });

    const contenedorEjemplos = document.getElementById('listaEjemplosServicioModal');
    let contadorEj = 0;

    const agregarTarjetaEjemplo = (ej = {}) => {
        contadorEj += 1;
        const idx = contadorEj;
        const imgEj = ej.imagen || '';
        const div = document.createElement('div');
        div.setAttribute('data-item-ejemplo', String(idx));
        div.className = 'rounded-2xl border border-bella-300 bg-white p-3 shadow-sm';
        div.innerHTML = `
            <div class="flex items-center justify-between gap-2 border-b border-bella-200/70 pb-2">
                <span class="text-xs font-extrabold text-bella-900">Ejemplo visual #${idx}</span>
                <button type="button" data-quitar-ejemplo class="rounded-lg bg-red-500/15 px-2.5 py-0.5 text-[11px] font-bold text-red-800 hover:bg-red-500/25">
                    Quitar ejemplo
                </button>
            </div>
            <div class="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                <div class="sm:col-span-1">
                    <label class="block text-[11px] font-bold text-pastel-tinta">Nombre del ejemplo *</label>
                    <input type="text" data-ej-nombre class="campo-pastel py-1.5 text-xs" value="${atributo(ej.nombre || '')}" placeholder="Ej. Maquillaje Social Nude" required>
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-pastel-tinta">Precio (pesos) *</label>
                    <input type="number" data-ej-precio min="1000" step="500" class="campo-pastel py-1.5 text-xs" value="${atributo(ej.precio ? Math.round(ej.precio) : (s.precio ? Math.round(s.precio) : ''))}" placeholder="Ej. 80000" required>
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-pastel-tinta">Duración (min) *</label>
                    <input type="number" data-ej-duracion min="15" max="480" step="5" class="campo-pastel py-1.5 text-xs" value="${atributo(ej.duracion || s.duracion_min || 60)}" required>
                </div>
            </div>
            <div class="mt-2">
                <label class="block text-[11px] font-bold text-pastel-tinta">Descripción de lo que incluye este ejemplo</label>
                <input type="text" data-ej-detalle class="campo-pastel py-1.5 text-xs" value="${atributo(ej.detalle || '')}" placeholder="Ej. Preparación de piel, diseño de ojos, pestañas punto a punto y sellado larga duración">
            </div>
            <div class="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div class="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-bella-300 bg-pastel-perla">
                    <img id="ejPreview_${idx}" src="${atributo(imgEj)}" alt="" class="${imgEj ? '' : 'hidden'} h-full w-full object-cover">
                    <span id="ejPlaceholder_${idx}" class="${imgEj ? 'hidden' : ''} text-[10px] font-bold text-pastel-subtinta">Foto *</span>
                </div>
                <div class="flex-1 space-y-1.5">
                    <input id="ejFile_${idx}" type="file" accept="image/*" class="block w-full text-[11px] font-semibold text-pastel-tinta file:mr-2 file:rounded-lg file:border-0 file:bg-bella-600 file:px-2.5 file:py-1 file:text-[11px] file:font-bold file:text-white hover:file:bg-bella-700">
                    <input id="ejUrl_${idx}" type="text" class="campo-pastel py-1 text-xs" value="${atributo(imgEj.startsWith('data:') ? '' : imgEj)}" placeholder="O pega ruta/URL de la foto del ejemplo *">
                    <input id="ejHidden_${idx}" data-ej-imagen type="hidden" value="${atributo(imgEj)}">
                </div>
            </div>`;

        contenedorEjemplos.appendChild(div);

        conectarSelectorImagen({
            idFile: `ejFile_${idx}`,
            idUrl: `ejUrl_${idx}`,
            idHidden: `ejHidden_${idx}`,
            idPreview: `ejPreview_${idx}`,
            idPlaceholder: `ejPlaceholder_${idx}`
        });

        div.querySelector('[data-quitar-ejemplo]')?.addEventListener('click', () => {
            const totalActual = contenedorEjemplos.querySelectorAll('[data-item-ejemplo]').length;
            if (totalActual <= 1) {
                return avisar('El servicio debe tener al menos un ejemplo con foto.');
            }
            div.remove();
        });
    };

    ejemplosIniciales.forEach((ej) => agregarTarjetaEjemplo(ej));
    document.getElementById('btnAgregarEjemploServicio')?.addEventListener('click', () => {
        agregarTarjetaEjemplo({
            nombre: '',
            detalle: '',
            precio: valor('vPrecio') || '',
            duracion: valor('vDuracion') || 60,
            imagen: ''
        });
        contenedorEjemplos.scrollTop = contenedorEjemplos.scrollHeight;
    });
}

// --- Productos (con fotografía obligatoria y botones rápidos -1 / +1 de stock) ---

async function cargarProductosAdmin() {
    productosAdmin = (await pedir('/productos?todos=1')).data || [];
    const tabla = document.getElementById('tablaProductos');

    tabla.innerHTML = productosAdmin.length === 0 ? filaVacia(5) : productosAdmin.map((p) => {
        const cambio = p.estado === 'Activo'
            ? botonAccion('Desactivar', 'rojo', `/productos/${p.id_producto}/estado`, { estado: 'Inactivo' })
            : botonAccion('Activar', 'verde', `/productos/${p.id_producto}/estado`, { estado: 'Activo' });
        const infoProd = typeof obtenerFichaProducto === 'function' ? obtenerFichaProducto(p) : { imagen: p.imagen || 'img/productos/shampoo-argan.jpg', categoria: p.categoria || '' };
        return `
            <tr>
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${escapar(infoProd.imagen)}" alt="${escapar(p.nombre)}" class="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-bella-300/60 shadow-sm">
                        <div>
                            <span class="block font-medium text-white">${escapar(p.nombre)}</span>
                            <span class="block text-[11px] text-bella-200/80">${escapar(infoProd.categoria || 'Producto de salón')}</span>
                        </div>
                    </div>
                </td>
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
            const infoProd = typeof obtenerFichaProducto === 'function' ? obtenerFichaProducto(p) : { imagen: p.imagen };
            const nuevoStock = Math.max(0, Number(p.stock) + Number(btn.dataset.stockDelta));
            const res = await pedir(`/productos/${p.id_producto}`, 'PUT', {
                nombre: p.nombre,
                precio: Math.round(Number(p.precio)),
                stock: nuevoStock,
                imagen: p.imagen || infoProd.imagen,
                categoria: p.categoria || infoProd.categoria,
                descripcion: p.descripcion || infoProd.descripcion
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
    const p = productosAdmin.find((x) => String(x.id_producto) === String(idProducto)) || {
        nombre: '',
        precio: '',
        stock: 10,
        imagen: '',
        categoria: '',
        descripcion: ''
    };
    const infoActual = p.id_producto && typeof obtenerFichaProducto === 'function' ? obtenerFichaProducto(p) : null;
    const imagenInicial = p.imagen || (infoActual && infoActual.imagen) || '';
    const categoriaInicial = p.categoria || (infoActual && infoActual.categoria) || '';
    const descripcionInicial = p.descripcion || (infoActual && infoActual.descripcion) || '';

    const html = `
        <div class="grid gap-3 sm:grid-cols-3">
            <div class="sm:col-span-1">
                ${campo('vNombre', 'Nombre del producto *', p.nombre, 'text', 'placeholder="Ej. Acondicionador de Argán" required')}
            </div>
            <div>
                ${campo('vPrecio', 'Precio (pesos) *', p.precio ? Math.round(p.precio) : '', 'number', 'min="500" step="500" placeholder="Ej. 32000" required')}
            </div>
            <div>
                ${campo('vStock', 'Stock (unidades) *', p.stock, 'number', 'min="0" step="1" required')}
            </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
            <div>
                ${campo('vCategoriaProd', 'Categoría en la tienda', categoriaInicial, 'text', 'placeholder="Ej. Cuidado Capilar · Hidratación"')}
            </div>
            <div>
                ${campo('vDescripcionProd', 'Descripción para la clienta', descripcionInicial, 'text', 'placeholder="Ej. Hidrata y sella la cutícula sin sal"')}
            </div>
        </div>

        <!-- Foto obligatoria del producto -->
        <div class="rounded-2xl border-2 border-bella-400/70 bg-pastel-perla p-3.5">
            <div class="flex items-center justify-between gap-2">
                <label class="text-xs font-extrabold uppercase tracking-wider text-bella-900">📷 Foto del producto (Obligatoria) *</label>
                <span class="rounded-full bg-bella-600/15 px-2.5 py-0.5 text-[10px] font-bold text-bella-900">Requerida</span>
            </div>
            <p class="mt-0.5 text-[11px] font-medium text-pastel-subtinta">Selecciona una foto del producto desde tu PC o pega la URL de la imagen para que la clienta lo vea en la tienda.</p>
            <div class="mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-bella-300 bg-white shadow-inner">
                    <img id="vProdImgPreview" src="${atributo(imagenInicial)}" alt="Vista previa del producto" class="${imagenInicial ? '' : 'hidden'} h-full w-full object-cover">
                    <span id="vProdImgPlaceholder" class="${imagenInicial ? 'hidden' : ''} px-2 text-center text-[10px] font-bold text-pastel-subtinta">Sin foto</span>
                </div>
                <div class="flex-1 space-y-2">
                    <input id="vProdFile" type="file" accept="image/*" class="block w-full text-xs font-semibold text-pastel-tinta file:mr-2.5 file:rounded-xl file:border-0 file:bg-bella-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-bella-700">
                    <input id="vProdUrl" type="text" class="campo-pastel py-1.5 text-xs" value="${atributo(imagenInicial.startsWith('data:') ? '' : imagenInicial)}" placeholder="O pega la ruta/URL de la foto (ej. img/productos/shampoo-argan.jpg o https://...)">
                    <input id="vProdImagenHidden" type="hidden" value="${atributo(imagenInicial)}">
                </div>
            </div>
        </div>`;

    abrirVentana(idProducto ? 'Editar producto y fotografía' : 'Registrar nuevo producto con foto', html, async () => {
        const imagen = valor('vProdImagenHidden');
        if (!imagen) {
            return { success: false, message: '⚠️ Es obligatorio añadir una foto del producto antes de guardarlo.' };
        }
        const datos = {
            nombre: valor('vNombre'),
            precio: Number(valor('vPrecio')),
            stock: Number(valor('vStock')),
            imagen,
            categoria: valor('vCategoriaProd') || 'Producto Profesional de Salón',
            descripcion: valor('vDescripcionProd') || 'Fórmula cosmética profesional recomendada por nuestras especialistas.'
        };
        const respuesta = idProducto
            ? await pedir(`/productos/${idProducto}`, 'PUT', datos)
            : await pedir('/productos', 'POST', datos);
        if (respuesta.success) await cargarProductosAdmin();
        return respuesta;
    });

    conectarSelectorImagen({
        idFile: 'vProdFile',
        idUrl: 'vProdUrl',
        idHidden: 'vProdImagenHidden',
        idPreview: 'vProdImgPreview',
        idPlaceholder: 'vProdImgPlaceholder'
    });
}

// --- Registrar usuario y control de jerarquía de Administradores (Superposición vs Estándar) ---

let administradorasLista = [];

function tieneSuperposicionActual() {
    return Boolean(usuario.puedeCrearAdmins) || usuario.username === 'admin' || Number(usuario.id) === 1;
}

function dibujarCasillasNuevo() {
    document.getElementById('nuevoServicios').innerHTML = servicios.map((s) => `
        <label class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
            <input type="checkbox" name="nuevoServicio" value="${s.id_servicio}" class="accent-bella-500">
            ${escapar(s.nombre)}
        </label>`).join('');
}

async function cargarAdministradorasAdmin() {
    const tabla = document.getElementById('tablaAdministradoras');
    if (!tabla) return;

    const res = await pedir('/administradoras');
    administradorasLista = res.data || [];
    const soySuper = tieneSuperposicionActual();

    tabla.innerHTML = administradorasLista.length === 0
        ? filaVacia(5, 'No hay administradores registrados')
        : administradorasLista.map((adm) => {
            const esPrincipal = adm.username === 'admin';
            const esSuper = Boolean(adm.puede_crear_admins) || esPrincipal;
            const badge = esSuper
                ? `<span class="inline-flex items-center gap-1 rounded-full bg-pastel-rosa px-3 py-0.5 text-xs font-extrabold text-bella-900 shadow-sm">👑 Con Superposición</span>`
                : `<span class="inline-flex items-center gap-1 rounded-full bg-pastel-menta px-3 py-0.5 text-xs font-extrabold text-emerald-950 shadow-sm">🛡️ Estándar (Sin superposición)</span>`;

            const alcance = esSuper
                ? 'Puede crear otros administradores, estilistas, clientas, servicios y productos'
                : 'Puede crear y gestionar todo menos otros administradores';

            let acciones = '<span class="text-xs text-white/40">Cuenta principal</span>';
            if (!esPrincipal) {
                if (soySuper) {
                    acciones = esSuper
                        ? botonAccion('Quitar superposición', 'rojo', `/administradoras/${adm.id_usuario}/permiso`, { puedeCrearAdmins: false })
                        : botonAccion('Dar superposición', 'verde', `/administradoras/${adm.id_usuario}/permiso`, { puedeCrearAdmins: true });
                } else {
                    acciones = '<span class="text-xs text-white/40">Requiere superposición</span>';
                }
            }

            return `
                <tr>
                    <td class="font-semibold text-white">${escapar(adm.nombre)}</td>
                    <td class="font-mono text-xs text-bella-200">${escapar(adm.username)}</td>
                    <td>${badge}</td>
                    <td class="text-xs text-bella-100/85">${alcance}</td>
                    <td class="whitespace-nowrap text-right">${acciones}</td>
                </tr>`;
        }).join('');

    activarBotones(tabla, cargarAdministradorasAdmin);
}

function prepararFormNuevo() {
    const selectRol = document.getElementById('nuevoRol');
    const bloquePermiso = document.getElementById('bloquePermisoAdmin');
    const inputHiddenPermiso = document.getElementById('nuevoPermisoAdmin');
    const nota = document.getElementById('notaPermisosAdmin');
    const insigniaNivel = document.getElementById('insigniaNivelMiAdmin');
    const soySuper = tieneSuperposicionActual();

    // Solo una administradora con superposición puede crear otras administradoras
    if (soySuper) {
        if (!selectRol.querySelector('option[value="admin"]')) {
            selectRol.insertAdjacentHTML('beforeend', '<option value="admin">Administradora (con o sin superposición)</option>');
        }
        if (nota) {
            nota.textContent = 'Tu cuenta tiene Superposición activa: puedes crear clientas, estilistas y también otros administradores (eligiendo si tendrán superposición o si podrán crear todo menos administradores).';
        }
        if (insigniaNivel) {
            insigniaNivel.textContent = '👑 Tu nivel: Administrador con Superposición';
            insigniaNivel.className = 'rounded-full bg-pastel-rosa px-3 py-1 text-xs font-extrabold text-bella-900 shadow-sm';
        }
    } else {
        if (nota) {
            nota.textContent = 'Tu cuenta es de Administrador Estándar (sin superposición): puedes gestionar todo el salón y crear clientas y estilistas, pero no otros administradores.';
        }
        if (insigniaNivel) {
            insigniaNivel.textContent = '🛡️ Tu nivel: Administrador Estándar (Todo menos crear Admins)';
            insigniaNivel.className = 'rounded-full bg-pastel-menta px-3 py-1 text-xs font-extrabold text-emerald-950 shadow-sm';
        }
    }

    // Interacción de las tarjetas de radio (Superposición vs Todo menos administradores)
    const actualizarTarjetasPermiso = (valorElegido) => {
        if (inputHiddenPermiso) inputHiddenPermiso.value = valorElegido;
        document.querySelectorAll('[data-card-permiso]').forEach((card) => {
            const activo = card.dataset.cardPermiso === valorElegido;
            card.className = activo
                ? 'flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-bella-600 bg-pastel-rosa p-3.5 transition shadow-sm'
                : 'flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-bella-300/80 bg-white p-3.5 transition hover:border-bella-500';
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = activo;
        });
    };

    document.querySelectorAll('input[name="radioPermisoAdmin"]').forEach((radio) => {
        radio.addEventListener('change', () => actualizarTarjetasPermiso(radio.value));
    });

    const actualizarBloques = () => {
        document.getElementById('bloqueServicios').classList.toggle('hidden', selectRol.value !== 'estilista');
        bloquePermiso.classList.toggle('hidden', selectRol.value !== 'admin');
    };
    selectRol.addEventListener('change', actualizarBloques);
    actualizarBloques();
    cargarAdministradorasAdmin();

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
            datos.permisoAdmin = inputHiddenPermiso ? inputHiddenPermiso.value : 'limitado';
        }

        const respuesta = await pedir('/register', 'POST', datos);
        if (respuesta.success) {
            mostrarAlerta(alerta, `${respuesta.message} Usuario: ${datos.username} · Contraseña: ${datos.password}`, 'ok');
            e.target.reset();
            actualizarTarjetasPermiso('limitado');
            actualizarBloques();
            cargarEstilistasAdmin();
            cargarClientasAdmin();
            cargarAdministradorasAdmin();
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
    document.getElementById('filtroMesNomina')?.addEventListener('change', dibujarNominaAdmin);
    document.getElementById('btnExportarNominaCSV')?.addEventListener('click', exportarNominaCSV);
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
    pagarCitaModal,
    gestionarResultadoCita,
    verColillaNominaEstilista,
    verCorreoCita,
    calificarCita,
    comprarProductoModal,
    verComprobanteCompraProducto,
    calificarCompraProductoModal,
    editarServicio,
    editarProducto
};

// ---------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------

async function iniciar() {
    prepararEncabezado();

    servicios = (await pedir('/servicios')).data || [];
    if (typeof window.sincronizarCatalogoConServicios === 'function') {
        window.sincronizarCatalogoConServicios(servicios);
    }
    estilistas = (await pedir('/estilistas')).data || [];
    productosDisponibles = (await pedir('/productos')).data || [];

    if (usuario.rol === 'Clienta') iniciarClienta();
    if (usuario.rol === 'Estilista') iniciarEstilista();
    if (usuario.rol === 'Administradora') iniciarAdmin();
}

if (usuario) iniciar();
