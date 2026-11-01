// Chat de la página de inicio (welcome.html) y del inicio de sesión (index.html).
// El visitante escribe sin crear cuenta. El código de su conversación se guarda
// en el navegador (localStorage) para que, si vuelve, siga viendo sus mensajes.
// Incluye botones rápidos de preguntas frecuentes con 1 clic.

document.body.insertAdjacentHTML('beforeend', `
  <div class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
    <!-- Ventana del chat en tono pastel mate con letras oscuras -->
    <div id="chatVentana" class="hidden h-[32rem] max-h-[80vh] w-[22.5rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-bella-300/70 bg-pastel-crema text-pastel-tinta shadow-2xl shadow-black/70">
      <div class="flex items-center justify-between bg-gradient-to-r from-bella-700 to-bella-500 px-4 py-3 text-white">
        <div>
          <p class="font-semibold">Chat BellaStyle</p>
          <p class="text-xs text-white/85">Asesoría y cotizaciones en línea</p>
        </div>
        <button id="chatCerrar" class="rounded-lg px-2 text-2xl leading-none text-white/90 hover:bg-white/15" aria-label="Cerrar chat">&times;</button>
      </div>

      <!-- Paso 1: datos del visitante (no necesita cuenta) -->
      <form id="chatDatos" class="flex flex-1 flex-col gap-3 p-4">
        <p class="text-xs font-medium text-pastel-subtinta sm:text-sm">Escríbenos sin registrarte. El asistente automático o una asesora te responden al instante.</p>
        <div id="chatAlerta" data-tema="pastel" class="alerta"></div>
        <div>
          <label for="chatNombre" class="etiqueta-oscura">Tu nombre</label>
          <input id="chatNombre" class="campo-pastel" maxlength="60" placeholder="Ej: Valentina" required>
        </div>
        <div>
          <label for="chatContacto" class="etiqueta-oscura">Teléfono o correo (opcional)</label>
          <input id="chatContacto" class="campo-pastel" maxlength="120" placeholder="Ej: 300 000 0000">
        </div>
        <button class="btn-primario mt-auto py-3">Empezar chat &rarr;</button>
      </form>

      <!-- Paso 2: conversación -->
      <div id="chatConversacion" class="hidden flex-1 flex-col overflow-hidden">
        <div id="chatMensajes" class="flex-1 space-y-3 overflow-y-auto p-4"></div>

        <!-- Sugerencias rápidas con 1 clic -->
        <div id="chatSugerencias" class="flex gap-1.5 overflow-x-auto border-t border-bella-300/50 bg-pastel-perla/70 px-3 py-2">
          <button type="button" data-pregunta="¿Cuáles son los precios?" class="whitespace-nowrap rounded-full border border-bella-400/50 bg-pastel-rosa px-2.5 py-1 text-[11px] font-bold text-pastel-tinta transition hover:bg-bella-200">Precios</button>
          <button type="button" data-pregunta="¿Qué servicios hacen?" class="whitespace-nowrap rounded-full border border-bella-400/50 bg-pastel-lavanda px-2.5 py-1 text-[11px] font-bold text-pastel-tinta transition hover:bg-bella-200">Servicios</button>
          <button type="button" data-pregunta="¿En qué horario atienden?" class="whitespace-nowrap rounded-full border border-bella-400/50 bg-pastel-menta px-2.5 py-1 text-[11px] font-bold text-pastel-tinta transition hover:bg-bella-200">Horarios</button>
          <button type="button" data-pregunta="¿Qué productos venden?" class="whitespace-nowrap rounded-full border border-bella-400/50 bg-pastel-durazno px-2.5 py-1 text-[11px] font-bold text-pastel-tinta transition hover:bg-bella-200">Productos</button>
        </div>

        <div id="chatAlertaMensaje" data-tema="pastel" class="alerta mx-4"></div>
        <form id="chatFormMensaje" class="flex gap-2 border-t border-bella-300/60 bg-pastel-perla/90 p-2.5">
          <input id="chatTexto" class="campo-pastel py-2" maxlength="500" placeholder="Escribe tu mensaje..." autocomplete="off">
          <button class="btn-primario px-4 py-2 text-xs">Enviar</button>
        </form>
      </div>
    </div>

    <!-- Burbuja -->
    <button id="chatBurbuja" class="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-bella-600 to-bella-500 py-3 pl-4 pr-5 font-semibold text-white shadow-xl shadow-bella-900/60 transition hover:-translate-y-0.5">
      <svg class="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h8M8 14h5m-9 6 3-3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v13Z"/></svg>
      <span class="text-xs sm:text-sm">¿Asesoría? Escríbenos</span>
      <span id="chatContador" class="absolute -right-1 -top-1 hidden h-6 min-w-6 rounded-full bg-oro px-1.5 text-center text-xs font-bold leading-6 text-noche-950">0</span>
    </button>
  </div>
`);

const chat = {
    codigo: localStorage.getItem('bellaChat'),
    ultimoId: 0,
    sinLeer: 0,
    abierto: false,
    temporizador: null
};
const tituloOriginal = document.title;

const burbuja = document.getElementById('chatBurbuja');
const ventanaChat = document.getElementById('chatVentana');
const listaMensajes = document.getElementById('chatMensajes');
const contador = document.getElementById('chatContador');

function dibujarMensaje(m) {
    const propio = m.autor === 'Visitante';
    const quien = m.autor === 'Salon' ? 'Asesora BellaStyle' : m.autor === 'Asistente' ? 'Asistente' : 'Tú';
    const burbujaTexto = propio
        ? 'ml-auto bg-bella-600 text-white rounded-br-sm shadow-sm'
        : m.autor === 'Salon'
            ? 'bg-pastel-durazno text-pastel-tinta font-medium rounded-bl-sm border border-bella-400/50 shadow-sm'
            : 'bg-pastel-perla text-pastel-tinta font-medium rounded-bl-sm border border-bella-300/70 shadow-sm';
    listaMensajes.insertAdjacentHTML('beforeend', `
        <div class="max-w-[88%] ${propio ? 'ml-auto text-right' : ''}">
            <p class="mb-1 text-[11px] font-semibold text-pastel-subtinta">${quien} · ${m.hora}</p>
            <p class="inline-block whitespace-pre-line rounded-2xl px-3 py-2 text-left text-xs sm:text-sm ${burbujaTexto}">${escapar(m.texto)}</p>
        </div>`);
}

function actualizarContador() {
    contador.textContent = chat.sinLeer;
    contador.classList.toggle('hidden', chat.sinLeer === 0);
    document.title = chat.sinLeer > 0 ? `(${chat.sinLeer}) Nuevo mensaje · BellaStyle` : tituloOriginal;
}

async function buscarMensajes() {
    if (!chat.codigo) return;
    const respuesta = await pedir(`/chat/${chat.codigo}?desde=${chat.ultimoId}`);
    if (!respuesta.success) {
        if (respuesta.message === 'La conversación no existe.') reiniciarChat();
        return;
    }
    const nuevos = respuesta.data.mensajes;
    const primeraCarga = chat.ultimoId === 0;
    nuevos.forEach((m) => {
        dibujarMensaje(m);
        if (m.autor !== 'Visitante' && !primeraCarga && (!chat.abierto || document.hidden)) chat.sinLeer++;
        chat.ultimoId = m.id;
    });
    if (nuevos.length > 0) {
        listaMensajes.scrollTop = listaMensajes.scrollHeight;
        actualizarContador();
    }
}

function programarRevision() {
    clearInterval(chat.temporizador);
    if (!chat.codigo) return;
    chat.temporizador = setInterval(buscarMensajes, chat.abierto ? 3000 : 10000);
}

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

async function enviarMensajeVisitante(texto) {
    const limpio = String(texto || '').trim();
    if (!limpio || !chat.codigo) return;
    const campoTexto = document.getElementById('chatTexto');
    campoTexto.value = '';
    const respuesta = await pedir(`/chat/${chat.codigo}/mensajes`, 'POST', { texto: limpio });
    if (!respuesta.success) {
        campoTexto.value = limpio;
        return mostrarAlerta(document.getElementById('chatAlertaMensaje'), respuesta.message);
    }
    ocultarAlerta(document.getElementById('chatAlertaMensaje'));
    await buscarMensajes();
}

document.getElementById('chatFormMensaje').addEventListener('submit', async (e) => {
    e.preventDefault();
    await enviarMensajeVisitante(document.getElementById('chatTexto').value);
});

document.querySelectorAll('#chatSugerencias button[data-pregunta]').forEach((btn) => {
    btn.addEventListener('click', () => enviarMensajeVisitante(btn.dataset.pregunta));
});

if (chat.codigo) {
    mostrarConversacion(true);
    buscarMensajes();
}
programarRevision();
