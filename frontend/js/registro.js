// Página de registro (register.html). Sirve para los tres roles.

let rolActual = new URLSearchParams(window.location.search).get('rol');
if (!ROLES[rolActual]) rolActual = 'cliente';

// Botones para cambiar de rol
function dibujarSelector() {
    const selector = document.getElementById('selectorRol');
    selector.innerHTML = '';
    for (const clave in ROLES) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = ROLES[clave].titulo;
        boton.className = 'pestana ' + (clave === rolActual ? 'pestana-activa' : '');
        boton.addEventListener('click', () => cambiarRol(clave));
        selector.appendChild(boton);
    }
}

function cambiarRol(clave) {
    rolActual = clave;
    document.getElementById('tituloRol').textContent = ROLES[clave].titulo;
    document.getElementById('imagenRol').src = ROLES[clave].imagen;

    // Muestra solo los campos que corresponden al rol
    document.querySelectorAll('[data-solo]').forEach((bloque) => {
        bloque.classList.toggle('hidden', bloque.dataset.solo !== clave);
    });

    ocultarAlerta(document.getElementById('alerta'));
    dibujarSelector();
    history.replaceState(null, '', '?rol=' + clave);
}

// Casillas de servicios (para estilistas)
async function cargarServicios() {
    const contenedor = document.getElementById('listaServicios');
    const respuesta = await pedir('/servicios');
    if (!respuesta.success) {
        contenedor.innerHTML = '<p class="text-sm text-red-700">No se pudieron cargar los servicios.</p>';
        return;
    }
    contenedor.innerHTML = respuesta.data.map((s) => `
        <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-tinta/10 bg-tinta/5 px-3 py-2.5 text-sm transition hover:border-bella-400/50 has-[:checked]:border-bella-400 has-[:checked]:bg-bella-500/10">
            <input type="checkbox" name="servicio" value="${s.id_servicio}" class="accent-bella-500">
            ${escapar(s.nombre)}
        </label>`).join('');
}

document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnRegistrar');
    ocultarAlerta(alerta);

    const datos = {
        rol: rolActual,
        nombre: document.getElementById('nombre').value.trim(),
        username: document.getElementById('usuario').value.trim(),
        password: document.getElementById('password').value
    };

    if (rolActual === 'cliente') {
        datos.telefono = document.getElementById('telefono').value.trim();
        datos.email = document.getElementById('email').value.trim();
    }
    if (rolActual === 'estilista') {
        datos.servicios = [...document.querySelectorAll('input[name="servicio"]:checked')].map((c) => Number(c.value));
    }
    if (rolActual === 'admin') {
        datos.codigoAdmin = document.getElementById('codigo').value;
    }

    boton.disabled = true;
    const respuesta = await pedir('/register', 'POST', datos);

    if (respuesta.success) {
        mostrarAlerta(alerta, respuesta.message + ' Te llevamos al inicio de sesión...', 'ok');
        setTimeout(() => { window.location.href = 'index.html?rol=' + rolActual; }, 1800);
    } else {
        mostrarAlerta(alerta, respuesta.message);
        boton.disabled = false;
    }
});

cambiarRol(rolActual);
cargarServicios();
