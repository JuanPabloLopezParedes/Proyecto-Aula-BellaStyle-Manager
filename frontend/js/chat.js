// Chat de la página de inicio (welcome.html) y del inicio de sesión (index.html).
// El visitante escribe sin crear cuenta. El código de su conversación se guarda
// en el navegador (localStorage) para que, si vuelve, siga viendo sus mensajes.
// Cada pocos segundos se pregunta al servidor si hay mensajes nuevos (polling).

// 1. Se dibuja la burbuja y la ventana del chat al final de la página.
//    Así el mismo archivo sirve para cualquier página que lo incluya.
document.body.insertAdjacentHTML('beforeend', `
  <div class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
    <!-- Ventana del chat -->
    <div id="chatVentana" class="hidden h-[32rem] max-h-[75vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-tinta/10 bg-noche-900/45 shadow-2xl shadow-tinta/20 backdrop-blur-md">
      <div class="flex items-center justify-between bg-gradient-to-r from-bella-200 to-lavanda-200 px-4 py-3">
        <div>
          <p class="font-semibold">Chat BellaStyle</p>
          <p class="text-xs text-tinta/80">Asesoría y cotizaciones</p>
        </div>
        <button id="chatCerrar" class="rounded-lg px-2 text-2xl leading-none text-tinta/80 hover:bg-tinta/10" aria-label="Cerrar chat">&times;</button>
      </div>

      <!-- Paso 1: datos del visitante (no necesita cuenta) -->
      <form id="chatDatos" class="flex flex-1 flex-col gap-3 p-4">
        <p class="text-sm text-tinta/75">Escríbenos sin registrarte. Te respondemos por aquí.</p>
        <div id="chatAlerta" class="alerta"></div>
        <div>
          <label for="chatNombre" class="etiqueta">Tu nombre</label>
          <input id="chatNombre" class="campo" maxlength="60" required>
        </div>
        <div>
          <label for="chatContacto" class="etiqueta">Teléfono o correo (opcional)</label>
          <input id="chatContacto" class="campo" maxlength="120">
        </div>
        <button class="btn-primario mt-auto py-3">Empezar chat</button>
      </form>

      <!-- Paso 2: conversación -->
      <div id="chatConversacion" class="hidden flex-1 flex-col overflow-hidden">
        <div id="chatMensajes" class="flex-1 space-y-3 overflow-y-auto p-4"></div>
        <div id="chatAlertaMensaje" class="alerta mx-4"></div>
        <form id="chatFormMensaje" class="flex gap-2 border-t border-tinta/10 p-3">
          <input id="chatTexto" class="campo py-2" maxlength="500" placeholder="Escribe tu mensaje..." autocomplete="off">
          <button class="btn-primario px-4 py-2">Enviar</button>
        </form>
      </div>
    </div>

    <!-- Burbuja -->
    <button id="chatBurbuja" class="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-bella-200 to-lavanda-200 py-3 pl-4 pr-5 font-semibold shadow-xl shadow-bella-200/70 transition hover:-translate-y-0.5">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 6 3-3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v13Z"/></svg>
      <span class="hidden text-sm sm:inline">¿Asesoría o cotización? Escríbenos</span>
      <span id="chatContador" class="absolute -right-1 -top-1 hidden h-6 min-w-6 rounded-full bg-bella-700 px-1.5 text-center text-xs font-bold leading-6 text-white">0</span>
    </button>
  </div>
`);

const chat = {
    codigo: localStorage.getItem('bellaChat'),
    ultimoId: 0,          // id del último mensaje mostrado
    sinLeer: 0,           // respuestas que llegaron con el chat cerrado
    abierto: false,
    temporizador: null
};
const tituloOriginal = document.title;

const burbuja = document.getElementById('chatBurbuja');
const ventanaChat = document.getElementById('chatVentana');
const listaMensajes = document.getElementById('chatMensajes');
const contador = document.getElementById('chatContador');

// --- Mostrar mensajes ---

function dibujarMensaje(m) {
    const propio = m.autor === 'Visitante';
    const quien = m.autor === 'Salon' ? 'Asesora BellaStyle' : m.autor === 'Asistente' ? 'Asistente' : 'Tú';
    const burbujaTexto = propio
        ? 'ml-auto bg-bella-200 text-tinta rounded-br-sm'
        : m.autor === 'Salon'
            ? 'bg-oro/15 text-tinta rounded-bl-sm border border-oro/30'
            : 'bg-white/70 text-tinta rounded-bl-sm border border-tinta/10';
    listaMensajes.insertAdjacentHTML('beforeend', `
        <div class="max-w-[85%] ${propio ? 'ml-auto text-right' : ''}">
            <p class="mb-1 text-[11px] text-tinta/80">${quien} · ${m.hora}</p>
            <p class="inline-block whitespace-pre-line rounded-2xl px-3 py-2 text-left text-sm ${burbujaTexto}">${escapar(m.texto)}</p>
        </div>`);
}

function actualizarContador() {
    contador.textContent = chat.sinLeer;
    contador.classList.toggle('hidden', chat.sinLeer === 0);
    document.title = chat.sinLeer > 0 ? `(${chat.sinLeer}) Nuevo mensaje · BellaStyle` : tituloOriginal;
}

// --- Pedir mensajes nuevos al servidor ---

async function buscarMensajes() {
    if (!chat.codigo) return;
    const respuesta = await pedir(`/chat/${chat.codigo}?desde=${chat.ultimoId}`);
    if (!respuesta.success) {
        // La conversación ya no existe (por ejemplo, se reinstaló la base de datos)
        if (respuesta.message === 'La conversación no existe.') reiniciarChat();
        return;
    }
    const nuevos = respuesta.data.mensajes;
    const primeraCarga = chat.ultimoId === 0;   // al abrir la página no se cuentan como nuevos
    nuevos.forEach((m) => {
        dibujarMensaje(m);
        // Notificación: respuestas que llegan con el chat cerrado o la pestaña oculta
        if (m.autor !== 'Visitante' && !primeraCarga && (!chat.abierto || document.hidden)) chat.sinLeer++;
        chat.ultimoId = m.id;
    });
    if (nuevos.length > 0) {
        listaMensajes.scrollTop = listaMensajes.scrollHeight;
        actualizarContador();
    }
}

// Abierto: revisa cada 3 segundos. Cerrado: cada 10 (solo para el contador).
function programarRevision() {
    clearInterval(chat.temporizador);
    if (!chat.codigo) return;
    chat.temporizador = setInterval(buscarMensajes, chat.abierto ? 3000 : 10000);
}

// --- Pantallas del chat: datos del visitante o conversación ---

function mostrarConversacion(visible) {
    document.getElementById('chatDatos').classList.toggle('hidden', visible);
    document.getElementById('chatConversacion').classList.toggle('hidden', !visible);
    document.getElementById('chatConversacion').classList.toggle('flex', visible);
}

function reiniciarChat() {
    localStorage.removeItem('bellaChat');
    chat.codigo = null;
    chat.ultimoId = 0;
    listaMensajes.innerHTML = '';
    mostrarConversacion(false);
    programarRevision();
}

function abrirChat(abrir) {
    chat.abierto = abrir;
    ventanaChat.classList.toggle('hidden', !abrir);
    ventanaChat.classList.toggle('flex', abrir);
    if (abrir) {
        chat.sinLeer = 0;
        actualizarContador();
        listaMensajes.scrollTop = listaMensajes.scrollHeight;
        (chat.codigo ? document.getElementById('chatTexto') : document.getElementById('chatNombre')).focus();
    }
    programarRevision();
}

burbuja.addEventListener('click', () => abrirChat(!chat.abierto));
document.getElementById('chatCerrar').addEventListener('click', () => abrirChat(false));
document.addEventListener('visibilitychange', () => { if (!document.hidden && chat.abierto) { chat.sinLeer = 0; actualizarContador(); } });

// Paso 1: el visitante escribe su nombre (y si quiere, teléfono o correo)
document.getElementById('chatDatos').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alerta = document.getElementById('chatAlerta');
    const respuesta = await pedir('/chat', 'POST', {
        nombre: document.getElementById('chatNombre').value,
        contacto: document.getElementById('chatContacto').value
    });
    if (!respuesta.success) return mostrarAlerta(alerta, respuesta.message);
    ocultarAlerta(alerta);
    chat.codigo = respuesta.data.codigo;
    localStorage.setItem('bellaChat', chat.codigo);
    mostrarConversacion(true);
    await buscarMensajes();
    programarRevision();
    document.getElementById('chatTexto').focus();
});

// Paso 2: enviar mensajes
document.getElementById('chatFormMensaje').addEventListener('submit', async (e) => {
    e.preventDefault();
    const campoTexto = document.getElementById('chatTexto');
    const texto = campoTexto.value.trim();
    if (!texto) return;
    campoTexto.value = '';
    const respuesta = await pedir(`/chat/${chat.codigo}/mensajes`, 'POST', { texto });
    if (!respuesta.success) {
        campoTexto.value = texto;
        return mostrarAlerta(document.getElementById('chatAlertaMensaje'), respuesta.message);
    }
    ocultarAlerta(document.getElementById('chatAlertaMensaje'));
    await buscarMensajes();
});

// Al cargar la página: si el visitante ya tenía conversación, se recupera
if (chat.codigo) {
    mostrarConversacion(true);
    buscarMensajes();
}
programarRevision();
