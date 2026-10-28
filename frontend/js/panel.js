// Panel principal (panel.html). Muestra una sección distinta según el rol.

const usuario = obtenerSesion();
if (!usuario) window.location.href = 'index.html';

let servicios = [];     // servicios disponibles (para agendar y registrar)
let estilistas = [];    // estilistas activas (para agendar)
let citasAdmin = [];

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

function tarjetaMetrica(titulo, valor) {
    return `
        <div class="tarjeta p-5">
            <p class="text-xs font-semibold uppercase tracking-wider text-white/40">${titulo}</p>
            <p class="mt-2 font-titulo text-4xl font-bold text-white">${valor}</p>
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

const COLORES = {
    azul: 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25',
    verde: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
    rojo: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
    gris: 'bg-white/10 text-white hover:bg-white/15'
};

// Botón que hace un cambio en la API después de pedir confirmación.
// url y cuerpo se guardan en atributos data-* del botón.
function botonAccion(texto, color, url, cuerpo) {
    return `<button class="btn-mini ${COLORES[color]}" data-url="${url}" data-cuerpo="${atributo(JSON.stringify(cuerpo))}">${texto}</button>`;
}

// Botón que abre una ventana de edición. "accion" es el nombre de la función a llamar.
function botonEditar(texto, accion, id) {
    return `<button class="btn-mini ${COLORES.gris}" data-editar="${accion}" data-id="${id}">${texto}</button>`;
}

// Activa los botones de una tabla:
//  - los de data-url piden "¿Seguro?" en la misma celda y luego envían el cambio (PUT)
//  - los de data-editar abren la ventana de edición correspondiente
function activarBotones(tabla, recargar) {
    tabla.querySelectorAll('button[data-url]').forEach((boton) => {
        boton.addEventListener('click', () => {
            const celda = boton.closest('td');
            const original = celda.innerHTML;
            celda.innerHTML = `
                <span class="mr-2 text-xs text-white/60">¿Seguro?</span>
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
// Ventana de edición (un solo <dialog> que se reutiliza para todo)
// ---------------------------------------------------------------

let alGuardarVentana = null;

function abrirVentana(titulo, camposHtml, alGuardar) {
    document.getElementById('tituloVentana').textContent = titulo;
    document.getElementById('camposVentana').innerHTML = camposHtml;
    ocultarAlerta(document.getElementById('alertaVentana'));
    alGuardarVentana = alGuardar;
    document.getElementById('ventana').showModal();
}

function cerrarVentana() {
    document.getElementById('ventana').close();
}

document.getElementById('btnCerrarVentana').addEventListener('click', cerrarVentana);

document.getElementById('formVentana').addEventListener('submit', async (e) => {
    e.preventDefault();
    const respuesta = await alGuardarVentana();
    if (respuesta.success) {
        cerrarVentana();
        avisar(respuesta.message);
    } else {
        mostrarAlerta(document.getElementById('alertaVentana'), respuesta.message);
    }
});

function campo(id, etiqueta, valor = '', tipo = 'text', extra = '') {
    return `
        <div>
            <label for="${id}" class="etiqueta">${etiqueta}</label>
            <input id="${id}" type="${tipo}" class="campo" value="${atributo(valor)}" ${extra}>
        </div>`;
}

function casillasServicios(lista, seleccionados = []) {
    return `
        <div>
            <p class="etiqueta">Servicios que realiza</p>
            <div class="grid gap-2 sm:grid-cols-2">
                ${lista.map((s) => `
                    <label class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
                        <input type="checkbox" name="servicioVentana" value="${s.id_servicio}" class="accent-bella-500"
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

function fechaDeHoy() {
    const hoy = new Date();
    return new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------
// Encabezado
// ---------------------------------------------------------------

function prepararEncabezado() {
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol;
    document.getElementById('fotoUsuario').src = usuario.foto;
    // La administradora ve un saludo general; los demás roles ven su nombre
    document.getElementById('saludo').textContent = usuario.rol === 'Administradora'
        ? 'Bienvenida a tu salón de belleza'
        : 'Hola, ' + usuario.nombre.split(' ')[0];
    document.getElementById('btnSalir').addEventListener('click', cerrarSesion);

    const subtitulos = {
        Clienta: 'Agenda una cita nueva o administra las que ya tienes.',
        Estilista: 'Estas son las citas que te asignaron.',
        Administradora: 'Resumen general del salón.'
    };
    document.getElementById('subtitulo').textContent = subtitulos[usuario.rol];

    // Muestra solo la sección del rol
    const seccion = document.querySelector(`[data-rol="${usuario.rol}"]`);
    seccion.classList.remove('hidden');
    if (usuario.rol === 'Clienta') seccion.classList.add('grid');
}

// ---------------------------------------------------------------
// CLIENTA
// ---------------------------------------------------------------

let miPerfilClienta = null;
let citasClienta = [];

// Al cambiar el servicio, solo se muestran las estilistas que lo realizan
function filtrarEstilistas() {
    const idServicio = document.getElementById('servicio').value;
    const capacitadas = estilistas.filter((e) => (e.ids_servicios || '').split(',').includes(idServicio));
    document.getElementById('estilista').innerHTML =
        '<option value="">Asignación automática</option>' +
        capacitadas.map((e) => `<option value="${e.id_estilista}">${escapar(e.nombres + ' ' + e.apellidos)}</option>`).join('');
}

async function iniciarClienta() {
    // Solo se ofrecen los servicios que al menos una estilista activa sabe hacer
    const conEstilista = servicios.filter((s) =>
        estilistas.some((e) => (e.ids_servicios || '').split(',').includes(String(s.id_servicio))));
    const select = document.getElementById('servicio');
    select.innerHTML = conEstilista.map((s) =>
        `<option value="${s.id_servicio}">${escapar(s.nombre)} · ${pesos(s.precio)} · ${s.duracion_min} min</option>`).join('');
    select.addEventListener('change', filtrarEstilistas);
    filtrarEstilistas();
    document.getElementById('hora').innerHTML = opcionesHora();
    document.getElementById('fecha').min = fechaDeHoy();

    document.getElementById('formCita').addEventListener('submit', agendarCita);
    document.getElementById('btnEditarMisDatos').addEventListener('click', editarMisDatos);
    cargarMisDatos();
    cargarCitasClienta();
}

async function agendarCita(e) {
    e.preventDefault();
    const alerta = document.getElementById('alertaCita');
    ocultarAlerta(alerta);

    const fecha = document.getElementById('fecha').value;
    if (new Date(fecha + 'T12:00:00').getDay() === 0) {
        return mostrarAlerta(alerta, 'El salón no atiende los domingos.');
    }

    const respuesta = await pedir('/citas', 'POST', {
        idUsuario: usuario.id,
        idServicio: document.getElementById('servicio').value,
        idEstilista: document.getElementById('estilista').value || null,
        fecha,
        hora: document.getElementById('hora').value,
        observaciones: document.getElementById('observaciones').value.trim()
    });

    if (respuesta.success) {
        mostrarAlerta(alerta, respuesta.message, 'ok');
        document.getElementById('observaciones').value = '';
        cargarCitasClienta();
    } else {
        mostrarAlerta(alerta, respuesta.message);
    }
}

async function cargarMisDatos() {
    miPerfilClienta = (await pedir(`/clientas/usuario/${usuario.id}`)).data;
    if (!miPerfilClienta) return;
    const c = miPerfilClienta;
    document.getElementById('misDatos').innerHTML = `
        <div><dt class="inline text-white/40">Nombre:</dt> <dd class="inline">${escapar(c.nombres + ' ' + c.apellidos)}</dd></div>
        <div><dt class="inline text-white/40">Teléfono:</dt> <dd class="inline">${escapar(c.telefono || '—')}</dd></div>
        <div><dt class="inline text-white/40">Correo:</dt> <dd class="inline">${escapar(c.email || '—')}</dd></div>`;
}

function editarMisDatos() {
    const c = miPerfilClienta;
    abrirVentana('Mis datos',
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
        `<p class="text-sm text-white/50">Se mantiene la misma estilista (${escapar(cita.estilista)}). La cita vuelve a quedar pendiente.</p>` +
        campo('vFecha', 'Nueva fecha', cita.fecha, 'date', `min="${fechaDeHoy()}" required`) +
        `<div>
            <label for="vHora" class="etiqueta">Nueva hora</label>
            <select id="vHora" class="campo">${opcionesHora(cita.hora)}</select>
        </div>`,
        async () => {
            const respuesta = await pedir(`/citas/${idCita}/reprogramar`, 'PUT', { fecha: valor('vFecha'), hora: valor('vHora') });
            if (respuesta.success) cargarCitasClienta();
            return respuesta;
        });
}

async function cargarCitasClienta() {
    const tabla = document.getElementById('tablaCitasClienta');
    citasClienta = (await pedir(`/citas?rol=Clienta&idUsuario=${usuario.id}`)).data || [];

    tabla.innerHTML = citasClienta.length === 0 ? filaVacia(5, 'Todavía no tienes citas') : citasClienta.map((c) => {
        const activa = c.estado === 'Pendiente' || c.estado === 'Confirmada';
        const acciones = activa
            ? botonEditar('Reprogramar', 'reprogramarCita', c.id) + ' ' +
              botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' })
            : '';
        return `
            <tr>
                <td class="font-medium text-white">${escapar(c.servicio)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${escapar(c.estilista)}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasClienta);
}

// ---------------------------------------------------------------
// ESTILISTA
// ---------------------------------------------------------------

let miPerfilEstilista = null;

async function iniciarEstilista() {
    document.getElementById('btnEditarMisServicios').addEventListener('click', () => editarServiciosEstilista(miPerfilEstilista.id_estilista));
    cargarMiPerfilEstilista();
    cargarCitasEstilista();
}

async function cargarMiPerfilEstilista() {
    miPerfilEstilista = (await pedir(`/estilistas/usuario/${usuario.id}`)).data;
    document.getElementById('misServicios').textContent = miPerfilEstilista
        ? (miPerfilEstilista.servicios || 'Aún no tienes servicios asignados.')
        : 'No se encontró tu perfil de estilista.';
}

async function cargarCitasEstilista() {
    const citas = (await pedir(`/citas?rol=Estilista&idUsuario=${usuario.id}`)).data || [];

    const finalizadas = citas.filter((c) => c.estado === 'Finalizada');
    const pendientes = citas.filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmada');
    const ganado = finalizadas.reduce((total, c) => total + Number(c.precio), 0);

    document.getElementById('metricasEstilista').innerHTML =
        tarjetaMetrica('Total de citas', citas.length) +
        tarjetaMetrica('Por atender', pendientes.length) +
        tarjetaMetrica('Finalizadas', finalizadas.length) +
        tarjetaMetrica('Mi comisión (40%)', pesos(ganado * 0.4));

    const tabla = document.getElementById('tablaCitasEstilista');
    tabla.innerHTML = citas.length === 0 ? filaVacia(6, 'No tienes citas asignadas') : citas.map((c) => {
        let acciones = '';
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
                <td class="font-medium text-white">${escapar(c.cliente)}</td>
                <td>${escapar(c.servicio)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasEstilista);
}

// Ventana para cambiar los servicios de una estilista.
// La usan la estilista (sus propios servicios) y la administradora (cualquier estilista).
function editarServiciosEstilista(idEstilista) {
    const estilista = usuario.rol === 'Estilista'
        ? miPerfilEstilista
        : estilistasAdmin.find((e) => String(e.id_estilista) === String(idEstilista));
    const seleccionados = (estilista.ids_servicios || '').split(',');

    abrirVentana(`Servicios de ${estilista.nombres} ${estilista.apellidos}`,
        casillasServicios(servicios, seleccionados),
        async () => {
            const respuesta = await pedir(`/estilistas/${idEstilista}/servicios`, 'PUT', { servicios: serviciosMarcados() });
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
        tarjetaMetrica('Total de citas', citasAdmin.length) +
        tarjetaMetrica('Por atender', pendientes.length) +
        tarjetaMetrica('Finalizadas', finalizadas.length) +
        tarjetaMetrica('Ingresos', pesos(ingresos));

    dibujarCitasAdmin();
}

function dibujarCitasAdmin() {
    const filtro = document.getElementById('filtroEstado').value;
    const citas = filtro ? citasAdmin.filter((c) => c.estado === filtro) : citasAdmin;
    const tabla = document.getElementById('tablaCitasAdmin');

    tabla.innerHTML = citas.length === 0 ? filaVacia(7) : citas.map((c) => {
        let acciones = '';
        if (c.estado === 'Pendiente') {
            acciones += botonAccion('Confirmar', 'azul', `/citas/${c.id}/estado`, { estado: 'Confirmada' }) + ' ';
        }
        if (c.estado === 'Pendiente' || c.estado === 'Confirmada') {
            acciones += botonAccion('Cancelar', 'rojo', `/citas/${c.id}/estado`, { estado: 'Cancelada' });
        }
        return `
            <tr>
                <td class="font-mono text-xs text-white/50">BS-${c.id}</td>
                <td class="font-medium text-white">${escapar(c.cliente)}</td>
                <td>${escapar(c.servicio)}</td>
                <td>${escapar(c.estilista)}</td>
                <td class="whitespace-nowrap">${c.fecha} · ${c.hora}</td>
                <td>${etiquetaEstado(c.estado)}</td>
                <td class="whitespace-nowrap text-right">${acciones}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarCitasAdmin);
}

// --- Estilistas ---

async function cargarEstilistasAdmin() {
    estilistasAdmin = (await pedir('/estilistas?todos=1')).data || [];
    estilistas = estilistasAdmin.filter((e) => e.estado === 'Activo');
    const tabla = document.getElementById('tablaEstilistas');

    tabla.innerHTML = estilistasAdmin.length === 0 ? filaVacia(4) : estilistasAdmin.map((e) => {
        const cambio = e.estado === 'Activo'
            ? botonAccion('Desactivar', 'rojo', `/estilistas/${e.id_estilista}/estado`, { estado: 'Inactivo' })
            : botonAccion('Activar', 'verde', `/estilistas/${e.id_estilista}/estado`, { estado: 'Activo' });
        return `
            <tr>
                <td class="font-medium text-white">${escapar(e.nombres + ' ' + e.apellidos)}</td>
                <td class="text-white/60">${escapar(e.servicios || 'Sin servicios')}</td>
                <td>${etiquetaActivo(e.estado)}</td>
                <td class="whitespace-nowrap text-right">${botonEditar('Servicios', 'editarServiciosEstilista', e.id_estilista)} ${cambio}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarEstilistasAdmin);
}

// --- Clientas ---

async function cargarClientasAdmin() {
    clientasAdmin = (await pedir('/clientas')).data || [];
    const tabla = document.getElementById('tablaClientas');

    tabla.innerHTML = clientasAdmin.length === 0 ? filaVacia(5) : clientasAdmin.map((c) => `
        <tr>
            <td class="font-medium text-white">${escapar(c.nombres + ' ' + c.apellidos)}</td>
            <td>${escapar(c.telefono || '—')}</td>
            <td>${escapar(c.email || '—')}</td>
            <td>${c.id_usuario ? '<span class="estado estado-Finalizada">Con cuenta</span>' : '<span class="estado bg-white/10 text-white/50">Sin cuenta</span>'}</td>
            <td class="text-right">${botonEditar('Editar', 'editarClienta', c.id_clienta)}</td>
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
        return `
            <tr>
                <td class="font-medium text-white">${escapar(s.nombre)}</td>
                <td>${pesos(s.precio)}</td>
                <td>${s.duracion_min} min</td>
                <td>${etiquetaActivo(s.estado)}</td>
                <td class="whitespace-nowrap text-right">${botonEditar('Editar', 'editarServicio', s.id_servicio)} ${cambio}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarServiciosAdmin);
    dibujarCasillasNuevo();
}

// idServicio vacío = crear uno nuevo
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

// --- Productos ---

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
                <td>${p.stock < 10 ? `<span class="estado estado-Cancelada">${p.stock} · bajo</span>` : p.stock}</td>
                <td>${etiquetaActivo(p.estado)}</td>
                <td class="whitespace-nowrap text-right">${botonEditar('Editar', 'editarProducto', p.id_producto)} ${cambio}</td>
            </tr>`;
    }).join('');

    activarBotones(tabla, cargarProductosAdmin);
}

// idProducto vacío = crear uno nuevo
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
    selectRol.addEventListener('change', () => {
        document.getElementById('bloqueServicios').classList.toggle('hidden', selectRol.value !== 'estilista');
    });

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

        const respuesta = await pedir('/register', 'POST', datos);
        if (respuesta.success) {
            mostrarAlerta(alerta, `Cuenta creada. Usuario: ${datos.username} · Contraseña: ${datos.password}`, 'ok');
            e.target.reset();
            cargarEstilistasAdmin();
            cargarClientasAdmin();
        } else {
            mostrarAlerta(alerta, respuesta.message);
        }
    });
}

// --- Mensajes del chat ---
// Cada 5 segundos se revisa si llegaron mensajes nuevos (polling).

let conversacionAbierta = null;   // id de la conversación que se está leyendo
let ultimoMensajeAdmin = 0;       // id del último mensaje mostrado
let totalSinLeer = 0;
const tituloPanel = document.title;

async function cargarConversaciones() {
    const conversaciones = (await pedir('/conversaciones')).data || [];

    // Notificación: contador en la pestaña, en el título y aviso si llegó algo nuevo
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
    // Botón para cerrar o reabrir (su clic se atiende en prepararChatAdmin)
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
    // Cerrar o reabrir la conversación abierta
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
    document.getElementById('btnNuevoServicio').addEventListener('click', () => editarServicio(''));
    document.getElementById('btnNuevoProducto').addEventListener('click', () => editarProducto(''));
    cargarCitasAdmin();
    cargarEstilistasAdmin();
    cargarClientasAdmin();
    cargarServiciosAdmin();
    cargarProductosAdmin();
    prepararFormNuevo();
    prepararChatAdmin();
}

// Funciones que abren ventanas desde los botones "Editar" de las tablas
const EDITORES = { reprogramarCita, editarServiciosEstilista, editarClienta, editarServicio, editarProducto };

// ---------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------

async function iniciar() {
    prepararEncabezado();

    // Catálogos que usan varias secciones
    servicios = (await pedir('/servicios')).data || [];
    estilistas = (await pedir('/estilistas')).data || [];

    if (usuario.rol === 'Clienta') iniciarClienta();
    if (usuario.rol === 'Estilista') iniciarEstilista();
    if (usuario.rol === 'Administradora') iniciarAdmin();
}

if (usuario) iniciar();
