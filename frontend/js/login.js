// Página de inicio de sesión (index.html)

let rolActual = 'cliente';

// Si la página se abre como index.html?rol=estilista, se preselecciona ese rol
const rolEnUrl = new URLSearchParams(window.location.search).get('rol');
if (ROLES[rolEnUrl]) rolActual = rolEnUrl;

// Si ya hay sesión abierta, se va directo al panel
if (obtenerSesion()) window.location.href = 'panel.html';

// Dibuja el selector de rol: un botón por cada rol con contraste pastel + letra oscura
function dibujarRoles() {
    const lista = document.getElementById('listaRoles');
    lista.innerHTML = '';

    for (const clave in ROLES) {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = ROLES[clave].titulo;
        boton.className = 'rounded-lg px-2 py-2 text-xs font-bold transition '
            + (clave === rolActual
                ? 'bg-bella-600 text-white shadow-sm'
                : 'text-pastel-tinta/75 hover:bg-bella-200/70 hover:text-pastel-tinta');
        boton.addEventListener('click', () => seleccionarRol(clave));
        lista.appendChild(boton);
    }
}

function seleccionarRol(clave, enfocar = true) {
    rolActual = clave;
    document.getElementById('tituloRol').textContent = ROLES[clave].titulo;
    document.getElementById('descripcionRol').textContent = ROLES[clave].descripcion;
    document.getElementById('imagenRol').src = ROLES[clave].imagen;
    document.getElementById('enlaceRegistro').href = 'register.html?rol=cliente';
    // Solo las clientas pueden registrarse por su cuenta; estilistas y administradoras las crea una administradora
    document.getElementById('enlaceRegistro').classList.toggle('hidden', clave !== 'cliente');
    ocultarAlerta(document.getElementById('alerta'));
    dibujarRoles();
    if (enfocar) document.getElementById('usuario').focus();
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

// Botones de acceso rápido de prueba (1 clic)
document.querySelectorAll('button[data-demo-rol]').forEach((boton) => {
    boton.addEventListener('click', () => {
        seleccionarRol(boton.dataset.demoRol, false);
        document.getElementById('usuario').value = boton.dataset.demoUser;
        document.getElementById('password').value = boton.dataset.demoPass;
        document.getElementById('formLogin').requestSubmit();
    });
});

// Activa los botones de la galería de servicios para abrir la ventana emergente con sus tipos
document.querySelectorAll('[data-abrir-servicio]').forEach((boton) => {
    boton.addEventListener('click', () => {
        abrirModalServicio(boton.dataset.abrirServicio);
    });
});

const btnExplorar = document.getElementById('btnExplorarCatalogo');
if (btnExplorar) {
    btnExplorar.addEventListener('click', () => abrirModalServicio('Corte de Cabello'));
}

// Tarjeta de precios: muestra todos los servicios con su precio real y al hacer clic abre los tipos que ofrece
async function cargarPrecios() {
    const respuesta = await pedir('/servicios');
    const lista = document.getElementById('listaPrecios');
    if (!respuesta.success) {
        lista.innerHTML = '<p class="col-span-2 text-sm text-bella-200/70">Enciende el servidor para ver los precios.</p>';
        return;
    }
    lista.innerHTML = respuesta.data.map((s) => {
        const ficha = typeof buscarDetalleServicio === 'function' ? buscarDetalleServicio(s.nombre) : null;
        const imgSrv = (ficha && ficha.imagen) ? ficha.imagen : 'img/servicios/cat-corte.jpg';
        return `
        <button type="button"
                data-servicio-nombre="${escapar(s.nombre)}"
                data-servicio-precio="${s.precio}"
                data-servicio-duracion="${s.duracion_min}"
                class="group flex items-center gap-2.5 rounded-xl border border-bella-300/80 bg-pastel-perla/90 p-2 text-left transition hover:-translate-y-0.5 hover:border-bella-500 hover:bg-pastel-rosa">
            <img src="${escapar(imgSrv)}" alt="${escapar(s.nombre)}" loading="lazy"
                 class="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-bella-300/70">
            <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-bold text-pastel-tinta">${escapar(s.nombre)}</p>
                <p class="text-[10px] font-semibold text-pastel-subtinta">${s.duracion_min} min · Ver ejemplos &rarr;</p>
                <p class="mt-0.5 text-xs font-extrabold text-bella-800">${pesos(s.precio)}</p>
            </div>
        </button>`;
    }).join('');

    lista.querySelectorAll('button[data-servicio-nombre]').forEach((btn) => {
        btn.addEventListener('click', () => {
            abrirModalServicio(btn.dataset.servicioNombre, {
                precio: Number(btn.dataset.servicioPrecio),
                duracion: Number(btn.dataset.servicioDuracion)
            });
        });
    });
}

seleccionarRol(rolActual, false);
cargarPrecios();

// Si el cliente seleccionó una especialidad en la Landing Page ("Quiero este"), se la mostramos en el login
const prefGuardada = sessionStorage.getItem('bellaVariedadPreferida');
if (prefGuardada) {
    try {
        const pref = JSON.parse(prefGuardada);
        const alerta = document.getElementById('alerta');
        mostrarAlerta(alerta, `✓ Elegiste: ${pref.variedad} (${pref.servicio}). Inicia sesión o regístrate para agendar tu cita.`, 'ok');
    } catch (_) {}
}
