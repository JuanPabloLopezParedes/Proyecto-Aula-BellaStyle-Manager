// Página de inicio de sesión (index.html)

let rolActual = 'cliente';

// Si la página se abre como index.html?rol=estilista, se preselecciona ese rol
const rolEnUrl = new URLSearchParams(window.location.search).get('rol');
if (ROLES[rolEnUrl]) rolActual = rolEnUrl;

// Si ya hay sesión abierta, se va directo al panel
if (obtenerSesion()) window.location.href = 'panel.html';

// Dibuja el selector de rol: un botón por cada rol
function dibujarRoles() {
    const lista = document.getElementById('listaRoles');
    lista.innerHTML = '';

    for (const clave in ROLES) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = ROLES[clave].titulo;
        boton.className = 'rounded-lg px-1 py-2.5 text-sm font-semibold transition sm:text-base '
            + (clave === rolActual ? 'bg-bella-700 text-white shadow' : 'text-tinta/75 hover:bg-tinta/10 hover:text-tinta');
        boton.addEventListener('click', () => seleccionarRol(clave));
        lista.appendChild(boton);
    }
}

function seleccionarRol(clave) {
    rolActual = clave;
    document.getElementById('tituloRol').textContent = ROLES[clave].titulo;
    document.getElementById('descripcionRol').textContent = ROLES[clave].descripcion;
    document.getElementById('imagenRol').src = ROLES[clave].imagen;
    document.getElementById('enlaceRegistro').href = 'register.html?rol=' + clave;
    ocultarAlerta(document.getElementById('alerta'));
    dibujarRoles();
    document.getElementById('usuario').focus();
}

// Botón "Mostrar / Ocultar" contraseña
document.getElementById('verPassword').addEventListener('click', (e) => {
    const campo = document.getElementById('password');
    const oculto = campo.type === 'password';
    campo.type = oculto ? 'text' : 'password';
    e.target.textContent = oculto ? 'Ocultar' : 'Mostrar';
});

// Envío del formulario
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnEntrar');
    ocultarAlerta(alerta);

    boton.disabled = true;
    boton.textContent = 'Verificando...';

    const respuesta = await pedir('/login', 'POST', {
        username: document.getElementById('usuario').value,
        password: document.getElementById('password').value,
        rol: rolActual
    });

    if (respuesta.success) {
        guardarSesion(respuesta.user);
        window.location.href = 'panel.html';
    } else {
        mostrarAlerta(alerta, respuesta.message);
        boton.disabled = false;
        boton.textContent = 'Entrar';
    }
});

// Lista corta de precios: cuatro servicios con su precio real
async function cargarPrecios() {
    const respuesta = await pedir('/servicios');
    const lista = document.getElementById('listaPrecios');
    if (!respuesta.success) {
        lista.innerHTML = '<li class="py-3 text-sm text-tinta/80">Enciende el servidor para ver los precios.</li>';
        return;
    }
    lista.innerHTML = respuesta.data.slice(0, 4).map((s) => `
        <li class="flex items-baseline justify-between gap-4 py-3">
            <span class="text-tinta/80">${escapar(s.nombre)} <span class="text-xs text-tinta/45">· ${s.duracion_min} min</span></span>
            <span class="font-semibold text-oro">${pesos(s.precio)}</span>
        </li>`).join('');
}

seleccionarRol(rolActual);
cargarPrecios();
