// Página de registro (register.html). Registro público: SOLO cuentas de Clienta.
// Las cuentas de Estilista y Administradora las crea una administradora desde su panel.

document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('alerta');
    const boton = document.getElementById('btnRegistrar');
    ocultarAlerta(alerta);

    const datos = {
        rol: 'cliente',
        nombre: document.getElementById('nombre').value.trim(),
        username: document.getElementById('usuario').value.trim(),
        password: document.getElementById('password').value,
        telefono: document.getElementById('telefono').value.trim(),
        email: document.getElementById('email').value.trim()
    };

    boton.disabled = true;
    const respuesta = await pedir('/register', 'POST', datos);

    if (respuesta.success) {
        mostrarAlerta(alerta, respuesta.message + ' Te llevamos al inicio de sesión...', 'ok');
        setTimeout(() => { window.location.href = 'index.html?rol=cliente'; }, 1800);
    } else {
        mostrarAlerta(alerta, respuesta.message);
        boton.disabled = false;
    }
});
