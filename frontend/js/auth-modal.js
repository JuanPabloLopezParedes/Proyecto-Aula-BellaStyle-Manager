// Ventana emergente unificada de Autenticación (Iniciar sesión, Registrarse y Recuperar contraseña)
// Se muestra directamente sobre la Landing Page con fondo opaco desenfocado, sin salir de la portada.

(function inicializarModalAuthGlobal() {
    let rolActualModal = 'cliente';

    function asegurarModalAuthDOM() {
        if (document.getElementById('modalAuthBella')) return;

        document.body.insertAdjacentHTML('beforeend', `
          <dialog id="modalAuthBella" class="w-[calc(100%-1.5rem)] max-w-md rounded-3xl border border-bella-300/70 bg-transparent p-0 text-pastel-tinta shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md">
            <div class="tarjeta-pastel relative max-h-[92dvh] overflow-y-auto p-6 sm:p-7">
              <!-- Botón cerrar (X) arriba a la derecha -->
              <button type="button" id="btnCerrarModalAuth" class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-bella-300/80 bg-pastel-perla text-xl font-bold leading-none text-pastel-tinta transition hover:bg-bella-200" aria-label="Cerrar ventana">&times;</button>

              <!-- ================= VISTA 1: INICIAR SESIÓN ================= -->
              <div id="vistaAuthLogin">
                <div class="flex items-center gap-3.5 pr-8">
                  <img id="authImagenRol" src="img/login_cliente.webp" alt="Rol" class="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-bella-500/50">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-pastel-subtinta">Iniciar sesión como</p>
                    <h2 id="authTituloRol" class="font-titulo text-3xl font-bold leading-none text-pastel-tinta sm:text-4xl">Clienta</h2>
                  </div>
                </div>

                <!-- Selector de rol: Clienta | Estilista | Administradora -->
                <div id="authListaRoles" class="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-bella-300/60 bg-pastel-perla/90 p-1.5"></div>
                <p id="authDescripcionRol" class="mt-2.5 text-xs font-semibold text-pastel-subtinta">Agenda tus citas y revisa tu historial.</p>

                <div id="authAlertaLogin" data-tema="pastel" class="alerta mt-3.5"></div>

                <form id="authFormLogin" class="mt-4 space-y-4">
                  <div>
                    <label for="authUsuario" class="etiqueta-oscura">Usuario</label>
                    <input id="authUsuario" class="campo-pastel" type="text" placeholder="Escribe tu usuario" autocomplete="username" required>
                  </div>
                  <div>
                    <label for="authPassword" class="etiqueta-oscura">Contraseña</label>
                    <div class="relative">
                      <input id="authPassword" class="campo-pastel pr-20" type="password" placeholder="••••••••" autocomplete="current-password" required>
                      <button type="button" id="authVerPassword" class="absolute inset-y-1.5 right-1.5 rounded-xl bg-pastel-rosa px-3 text-xs font-bold text-bella-900 transition hover:bg-bella-200">Mostrar</button>
                    </div>
                  </div>
                  <button id="authBtnEntrar" type="submit" class="btn-primario w-full py-3 text-base shadow-md">Entrar</button>
                </form>

                <!-- Acceso rápido de prueba (1 clic) -->
                <div class="mt-4 rounded-2xl border border-bella-300/70 bg-pastel-perla/80 p-3">
                  <p class="text-[11px] font-extrabold uppercase tracking-wider text-pastel-subtinta">&#9889; Acceso rápido de prueba (1 clic):</p>
                  <div class="mt-2 grid grid-cols-3 gap-1.5">
                    <button type="button" data-auth-demo-rol="cliente" data-auth-demo-user="cliente" data-auth-demo-pass="cli123"
                            class="rounded-xl border border-bella-400/50 bg-pastel-rosa px-2 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-bella-200">
                      Clienta
                    </button>
                    <button type="button" data-auth-demo-rol="admin" data-auth-demo-user="admin" data-auth-demo-pass="admin123"
                            class="rounded-xl border border-bella-400/50 bg-pastel-menta px-2 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-bella-200">
                      Admin
                    </button>
                    <button type="button" data-auth-demo-rol="estilista" data-auth-demo-user="diana" data-auth-demo-pass="diana123"
                            class="rounded-xl border border-bella-400/50 bg-pastel-lavanda px-2 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-bella-200">
                      Diana (Est.)
                    </button>
                    <button type="button" data-auth-demo-rol="estilista" data-auth-demo-user="estilista" data-auth-demo-pass="est123"
                            class="rounded-xl border border-bella-400/50 bg-pastel-durazno px-2 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-bella-200">
                      Laura (Est.)
                    </button>
                    <button type="button" data-auth-demo-rol="estilista" data-auth-demo-user="paula" data-auth-demo-pass="paula123"
                            class="rounded-xl border border-bella-400/50 bg-pastel-lavanda px-2 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-bella-200">
                      Paula (Est.)
                    </button>
                    <button type="button" data-auth-demo-rol="estilista" data-auth-demo-user="camila" data-auth-demo-pass="est123"
                            class="rounded-xl border border-bella-400/50 bg-pastel-durazno px-2 py-1.5 text-xs font-bold text-pastel-tinta shadow-sm transition hover:bg-bella-200">
                      Camila (Est.)
                    </button>
                  </div>
                </div>

                <div class="mt-4 space-y-2 border-t border-bella-300/50 pt-3.5 text-center text-xs font-bold">
                  <button type="button" id="authIrARecuperar" class="block w-full text-bella-800 underline-offset-4 hover:text-bella-950 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                  <button type="button" id="authIrARegistro" class="block w-full text-bella-800 underline-offset-4 hover:text-bella-950 hover:underline">
                    ¿No tienes cuenta? Regístrate aquí
                  </button>
                </div>
              </div>

              <!-- ================= VISTA 2: REGISTRARSE (CLIENTA) ================= -->
              <div id="vistaAuthRegistro" class="hidden">
                <div class="flex items-center gap-3.5 pr-8">
                  <img src="img/login_cliente.webp" alt="Clienta" class="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-bella-500/50">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-pastel-subtinta">Crear cuenta de</p>
                    <h2 class="font-titulo text-3xl font-bold leading-none text-pastel-tinta sm:text-4xl">Clienta</h2>
                  </div>
                </div>

                <p class="mt-3 rounded-xl border border-bella-300/70 bg-pastel-lavanda/70 px-3 py-2 text-xs font-semibold text-pastel-tinta">
                  Regístrate gratis para agendar tus citas en línea, elegir estilista y recibir beneficios VIP.
                </p>

                <div id="authAlertaRegistro" data-tema="pastel" class="alerta mt-3.5"></div>

                <form id="authFormRegistro" class="mt-4 space-y-3.5">
                  <div>
                    <label for="regNombre" class="etiqueta-oscura">Nombre completo *</label>
                    <input id="regNombre" class="campo-pastel" type="text" placeholder="Ej: Ana María López" required>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label for="regUsuario" class="etiqueta-oscura">Usuario *</label>
                      <input id="regUsuario" class="campo-pastel" type="text" placeholder="Ej: anamaria" required>
                    </div>
                    <div>
                      <label for="regPassword" class="etiqueta-oscura">Contraseña *</label>
                      <input id="regPassword" class="campo-pastel" type="password" minlength="6" placeholder="Mínimo 6 caracteres" required>
                    </div>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label for="regTelefono" class="etiqueta-oscura">Teléfono *</label>
                      <input id="regTelefono" class="campo-pastel" type="tel" placeholder="300 000 0000" required>
                    </div>
                    <div>
                      <label for="regEmail" class="etiqueta-oscura">Correo electrónico *</label>
                      <input id="regEmail" class="campo-pastel" type="email" placeholder="tu@correo.com" required>
                    </div>
                  </div>
                  <button id="authBtnRegistrar" type="submit" class="btn-primario w-full py-3 text-base shadow-md">Crear cuenta</button>
                </form>

                <div class="mt-4 border-t border-bella-300/50 pt-3.5 text-center text-xs font-bold">
                  <button type="button" id="authVolverALoginDesdeReg" class="text-bella-800 underline-offset-4 hover:text-bella-950 hover:underline">
                    &larr; ¿Ya tienes cuenta? Inicia sesión aquí
                  </button>
                </div>
              </div>

              <!-- ================= VISTA 3: RECUPERAR CONTRASEÑA (DOBLE VERIFICACIÓN + OTP 6 DÍGITOS) ================= -->
              <div id="vistaAuthRecuperar" class="hidden">
                <div class="pr-8">
                  <span class="inline-flex items-center gap-1 rounded-full bg-pastel-menta px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-950">
                    🔒 Seguridad de Doble Paso (OTP)
                  </span>
                  <h2 class="mt-1 font-titulo text-3xl font-bold text-pastel-tinta">Recuperar contraseña</h2>
                  <p class="mt-0.5 text-xs font-medium text-pastel-subtinta">
                    Por seguridad, validamos tus <strong>3 datos registrados</strong> antes de emitir tu código temporal de 6 dígitos.
                  </p>
                </div>

                <!-- Indicador visual de Paso 1 y Paso 2 -->
                <div class="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-bella-300/70 bg-pastel-perla/80 p-1.5 text-center text-[11px] font-extrabold">
                  <div id="badgePaso1Rec" class="rounded-xl bg-bella-600 py-1.5 text-white shadow-sm">
                    1. Verificar identidad
                  </div>
                  <div id="badgePaso2Rec" class="rounded-xl py-1.5 text-pastel-subtinta">
                    2. Código OTP (6 dígitos)
                  </div>
                </div>

                <div id="authAlertaRecuperar" data-tema="pastel" class="alerta mt-3.5"></div>

                <!-- PASO 1: TRIPLE VALIDACIÓN (USUARIO + CORREO EXACTO + TELÉFONO EXACTO) -->
                <form id="authFormSolicitarOTP" class="mt-3.5 space-y-3">
                  <div>
                    <label for="recUsuario" class="etiqueta-oscura">1. Tu nombre de usuario *</label>
                    <input id="recUsuario" class="campo-pastel" type="text" placeholder="Ej: cliente" required>
                  </div>
                  <div>
                    <label for="recEmail" class="etiqueta-oscura">2. Correo electrónico registrado *</label>
                    <input id="recEmail" class="campo-pastel" type="email" placeholder="Correo exacto de tu cuenta" required>
                  </div>
                  <div>
                    <label for="recTelefono" class="etiqueta-oscura">3. Teléfono registrado *</label>
                    <input id="recTelefono" class="campo-pastel" type="tel" placeholder="Teléfono exacto de tu cuenta" required>
                  </div>
                  <div class="rounded-xl border border-bella-300/60 bg-white/80 px-3 py-2 text-[11px] text-pastel-subtinta">
                    🛡️ <strong>Protección activa:</strong> Máximo 3 intentos. Las cuentas de <em>Administradora</em> y <em>Estilista</em> están protegidas y solo las restablece el Super Admin.
                  </div>
                  <button type="submit" id="btnSolicitarCodigoOTP" class="btn-primario w-full py-3 text-sm shadow-md">
                    Verificar identidad y generar código OTP &rarr;
                  </button>
                </form>

                <!-- PASO 2: INGRESAR CÓDIGO OTP DE 6 DÍGITOS + NUEVA CONTRASEÑA -->
                <form id="authFormRecuperar" class="mt-3.5 hidden space-y-3">
                  <div id="cajaCodigoSimuladoOTP" class="rounded-2xl border-2 border-emerald-500/80 bg-pastel-menta p-3 text-xs text-emerald-950 shadow-sm">
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-extrabold uppercase tracking-wider">📨 Código OTP de seguridad:</span>
                      <span id="timerExpiracionOTP" class="rounded-full bg-emerald-700 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white">05:00</span>
                    </div>
                    <p class="mt-1 text-[11px] text-pastel-subtinta">Ingresa este código temporal de 6 dígitos para autorizar el cambio:</p>
                    <div class="mt-1.5 flex items-center justify-between rounded-xl bg-white px-3.5 py-2 shadow-inner">
                      <span id="valorCodigoOTPGenerado" class="font-mono text-2xl font-extrabold tracking-[0.25em] text-bella-900">------</span>
                      <button type="button" id="btnCopiarAutocompletarOTP" class="rounded-lg bg-bella-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-bella-700">
                        Usar código
                      </button>
                    </div>
                  </div>

                  <div>
                    <label for="recCodigoOTP" class="etiqueta-oscura">Código de seguridad (6 dígitos) *</label>
                    <input id="recCodigoOTP" class="campo-pastel text-center font-mono text-lg font-extrabold tracking-[0.3em]" type="text" inputmode="numeric" pattern="\\d{6}" maxlength="6" placeholder="000000" required>
                  </div>
                  <div class="grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label for="recNueva" class="etiqueta-oscura">Nueva contraseña *</label>
                      <input id="recNueva" class="campo-pastel" type="password" minlength="6" placeholder="Mínimo 6 caracteres" required>
                    </div>
                    <div>
                      <label for="recConfirmar" class="etiqueta-oscura">Confirmar *</label>
                      <input id="recConfirmar" class="campo-pastel" type="password" minlength="6" placeholder="Repite la clave" required>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button type="button" id="btnVolverPaso1OTP" class="rounded-xl border border-bella-400/70 bg-pastel-perla px-3.5 py-2.5 text-xs font-bold text-pastel-tinta">
                      &larr; Atrás
                    </button>
                    <button type="submit" id="btnConfirmarCambioOTP" class="btn-primario flex-1 py-2.5 text-sm shadow-md">
                      🔒 Confirmar y cambiar contraseña
                    </button>
                  </div>
                </form>

                <div class="mt-4 border-t border-bella-300/50 pt-3.5 text-center text-xs font-bold">
                  <button type="button" id="authVolverALoginDesdeRec" class="text-bella-800 underline-offset-4 hover:text-bella-950 hover:underline">
                    &larr; Volver a iniciar sesión
                  </button>
                </div>
              </div>
            </div>
          </dialog>
        `);

        const dialog = document.getElementById('modalAuthBella');
        document.getElementById('btnCerrarModalAuth').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.close();
        });

        // Mostrar / ocultar contraseña en Login
        document.getElementById('authVerPassword').addEventListener('click', (e) => {
            const campo = document.getElementById('authPassword');
            const oculto = campo.type === 'password';
            campo.type = oculto ? 'text' : 'password';
            e.target.textContent = oculto ? 'Ocultar' : 'Mostrar';
        });

        // Navegación interna entre Login, Registro y Recuperar sin salir del modal
        document.getElementById('authIrARegistro').addEventListener('click', () => cambiarVistaAuth('registro'));
        document.getElementById('authIrARecuperar').addEventListener('click', () => cambiarVistaAuth('recuperar'));
        document.getElementById('authVolverALoginDesdeReg').addEventListener('click', () => cambiarVistaAuth('login'));
        document.getElementById('authVolverALoginDesdeRec').addEventListener('click', () => cambiarVistaAuth('login'));

        // Envío de Login
        document.getElementById('authFormLogin').addEventListener('submit', async (e) => {
            e.preventDefault();
            const alerta = document.getElementById('authAlertaLogin');
            const boton = document.getElementById('authBtnEntrar');
            ocultarAlerta(alerta);

            boton.disabled = true;
            boton.textContent = 'Verificando...';

            const respuesta = await pedir('/login', 'POST', {
                username: document.getElementById('authUsuario').value.trim(),
                password: document.getElementById('authPassword').value,
                rol: rolActualModal
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
        dialog.querySelectorAll('button[data-auth-demo-rol]').forEach((boton) => {
            boton.addEventListener('click', () => {
                seleccionarRolModal(boton.dataset.authDemoRol, false);
                document.getElementById('authUsuario').value = boton.dataset.authDemoUser;
                document.getElementById('authPassword').value = boton.dataset.authDemoPass;
                document.getElementById('authFormLogin').requestSubmit();
            });
        });

        // Envío de Registro de Clienta
        document.getElementById('authFormRegistro').addEventListener('submit', async (e) => {
            e.preventDefault();
            const alerta = document.getElementById('authAlertaRegistro');
            const boton = document.getElementById('authBtnRegistrar');
            ocultarAlerta(alerta);

            const usernameCreado = document.getElementById('regUsuario').value.trim();
            const passwordCreada = document.getElementById('regPassword').value;

            const datos = {
                rol: 'cliente',
                nombre: document.getElementById('regNombre').value.trim(),
                username: usernameCreado,
                password: passwordCreada,
                telefono: document.getElementById('regTelefono').value.trim(),
                email: document.getElementById('regEmail').value.trim()
            };

            boton.disabled = true;
            boton.textContent = 'Creando cuenta...';
            const respuesta = await pedir('/register', 'POST', datos);
            boton.disabled = false;
            boton.textContent = 'Crear cuenta';

            if (respuesta.success) {
                // Iniciar sesión automáticamente o pasar al login con los datos listos
                const loginAuto = await pedir('/login', 'POST', {
                    username: usernameCreado,
                    password: passwordCreada,
                    rol: 'cliente'
                });
                if (loginAuto && loginAuto.success) {
                    guardarSesion(loginAuto.user);
                    window.location.href = 'panel.html';
                    return;
                }
                e.target.reset();
                cambiarVistaAuth('login');
                seleccionarRolModal('cliente', false);
                document.getElementById('authUsuario').value = usernameCreado;
                mostrarAlerta(document.getElementById('authAlertaLogin'), '¡Cuenta creada con éxito! Ya puedes entrar.', 'ok');
            } else {
                mostrarAlerta(alerta, respuesta.message);
            }
        });

        let intervaloOTP = null;

        function iniciarContadorOTP(segundosTotales = 300) {
            if (intervaloOTP) clearInterval(intervaloOTP);
            let restantes = segundosTotales;
            const elTimer = document.getElementById('timerExpiracionOTP');
            const actualizarTexto = () => {
                if (!elTimer) return;
                const min = String(Math.floor(restantes / 60)).padStart(2, '0');
                const seg = String(restantes % 60).padStart(2, '0');
                elTimer.textContent = `${min}:${seg}`;
            };
            actualizarTexto();
            intervaloOTP = setInterval(() => {
                restantes -= 1;
                if (restantes <= 0) {
                    clearInterval(intervaloOTP);
                    if (elTimer) elTimer.textContent = 'Expirado';
                    return;
                }
                actualizarTexto();
            }, 1000);
        }

        function mostrarPasoRecuperacion(paso = 1) {
            const formPaso1 = document.getElementById('authFormSolicitarOTP');
            const formPaso2 = document.getElementById('authFormRecuperar');
            const badge1 = document.getElementById('badgePaso1Rec');
            const badge2 = document.getElementById('badgePaso2Rec');

            if (paso === 1) {
                formPaso1?.classList.remove('hidden');
                formPaso2?.classList.add('hidden');
                if (badge1) badge1.className = 'rounded-xl bg-bella-600 py-1.5 text-white shadow-sm';
                if (badge2) badge2.className = 'rounded-xl py-1.5 text-pastel-subtinta';
            } else {
                formPaso1?.classList.add('hidden');
                formPaso2?.classList.remove('hidden');
                if (badge1) badge1.className = 'rounded-xl bg-emerald-600/20 py-1.5 text-emerald-950';
                if (badge2) badge2.className = 'rounded-xl bg-bella-600 py-1.5 text-white shadow-sm';
            }
        }

        document.getElementById('btnVolverPaso1OTP').addEventListener('click', () => {
            ocultarAlerta(document.getElementById('authAlertaRecuperar'));
            mostrarPasoRecuperacion(1);
        });

        document.getElementById('btnCopiarAutocompletarOTP').addEventListener('click', () => {
            const codigo = document.getElementById('valorCodigoOTPGenerado')?.textContent.trim() || '';
            const inputOtp = document.getElementById('recCodigoOTP');
            if (inputOtp && /^\d{6}$/.test(codigo)) {
                inputOtp.value = codigo;
                document.getElementById('recNueva')?.focus();
            }
        });

        // PASO 1: Solicitar código OTP de 6 dígitos validando Usuario + Correo + Teléfono
        document.getElementById('authFormSolicitarOTP').addEventListener('submit', async (e) => {
            e.preventDefault();
            const alerta = document.getElementById('authAlertaRecuperar');
            const btn = document.getElementById('btnSolicitarCodigoOTP');
            ocultarAlerta(alerta);

            const username = document.getElementById('recUsuario').value.trim();
            const email = document.getElementById('recEmail').value.trim();
            const telefono = document.getElementById('recTelefono').value.trim();

            btn.disabled = true;
            btn.textContent = 'Verificando los 3 datos...';

            const respuesta = await pedir('/recuperar-password/solicitar-codigo', 'POST', {
                username,
                email,
                telefono
            });

            btn.disabled = false;
            btn.textContent = 'Verificar identidad y generar código OTP →';

            if (respuesta && respuesta.success) {
                document.getElementById('valorCodigoOTPGenerado').textContent = respuesta.codigoSimulado || '------';
                document.getElementById('recCodigoOTP').value = '';
                iniciarContadorOTP(respuesta.expiraSegundos || 300);
                mostrarPasoRecuperacion(2);
                mostrarAlerta(alerta, respuesta.message, 'ok');
            } else {
                mostrarAlerta(alerta, (respuesta && respuesta.message) || 'No se pudo verificar la identidad.');
            }
        });

        // PASO 2: Confirmar código OTP de 6 dígitos y guardar nueva contraseña
        document.getElementById('authFormRecuperar').addEventListener('submit', async (e) => {
            e.preventDefault();
            const alerta = document.getElementById('authAlertaRecuperar');
            const btn = document.getElementById('btnConfirmarCambioOTP');
            const nueva = document.getElementById('recNueva').value;
            if (nueva !== document.getElementById('recConfirmar').value) {
                return mostrarAlerta(alerta, 'Las contraseñas no coinciden.');
            }
            const userRec = document.getElementById('recUsuario').value.trim();
            const codigoOtp = document.getElementById('recCodigoOTP').value.trim();

            btn.disabled = true;
            btn.textContent = 'Validando código OTP...';

            const respuesta = await pedir('/recuperar-password', 'POST', {
                username: userRec,
                codigoOtp,
                nuevaPassword: nueva
            });

            btn.disabled = false;
            btn.textContent = '🔒 Confirmar y cambiar contraseña';

            if (respuesta.success) {
                if (intervaloOTP) clearInterval(intervaloOTP);
                document.getElementById('authFormSolicitarOTP').reset();
                e.target.reset();
                mostrarPasoRecuperacion(1);
                cambiarVistaAuth('login');
                document.getElementById('authUsuario').value = userRec;
                mostrarAlerta(document.getElementById('authAlertaLogin'), respuesta.message, 'ok');
            } else {
                mostrarAlerta(alerta, respuesta.message);
            }
        });
    }

    function dibujarRolesModal() {
        const lista = document.getElementById('authListaRoles');
        if (!lista) return;
        lista.innerHTML = '';

        for (const clave in ROLES) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.textContent = ROLES[clave].titulo;
            boton.className = 'rounded-xl px-2 py-2 text-xs font-bold transition '
                + (clave === rolActualModal
                    ? 'bg-bella-600 text-white shadow-sm'
                    : 'text-pastel-tinta/80 hover:bg-bella-200/70 hover:text-pastel-tinta');
            boton.addEventListener('click', () => seleccionarRolModal(clave));
            lista.appendChild(boton);
        }
    }

    function seleccionarRolModal(clave, enfocar = true) {
        if (!ROLES[clave]) clave = 'cliente';
        rolActualModal = clave;
        const titulo = document.getElementById('authTituloRol');
        const desc = document.getElementById('authDescripcionRol');
        const img = document.getElementById('authImagenRol');
        const btnReg = document.getElementById('authIrARegistro');

        if (titulo) titulo.textContent = ROLES[clave].titulo;
        if (desc) desc.textContent = ROLES[clave].descripcion;
        if (img) img.src = ROLES[clave].imagen;
        if (btnReg) btnReg.classList.toggle('hidden', clave !== 'cliente');

        ocultarAlerta(document.getElementById('authAlertaLogin'));
        dibujarRolesModal();
        if (enfocar) document.getElementById('authUsuario')?.focus();
    }

    function cambiarVistaAuth(vista = 'login') {
        document.getElementById('vistaAuthLogin')?.classList.toggle('hidden', vista !== 'login');
        document.getElementById('vistaAuthRegistro')?.classList.toggle('hidden', vista !== 'registro');
        document.getElementById('vistaAuthRecuperar')?.classList.toggle('hidden', vista !== 'recuperar');
        ocultarAlerta(document.getElementById('authAlertaLogin'));
        ocultarAlerta(document.getElementById('authAlertaRegistro'));
        ocultarAlerta(document.getElementById('authAlertaRecuperar'));
    }

    function mostrarMensajeContextualSiExiste(mensajeExplicito = '') {
        const alertaLogin = document.getElementById('authAlertaLogin');
        if (!alertaLogin) return;

        if (mensajeExplicito) {
            mostrarAlerta(alertaLogin, mensajeExplicito, 'ok');
            return;
        }

        const prefVar = sessionStorage.getItem('bellaVariedadPreferida');
        const prefProd = sessionStorage.getItem('bellaProductoPreferido');
        if (prefVar) {
            try {
                const p = JSON.parse(prefVar);
                mostrarAlerta(alertaLogin, `✓ Elegiste: ${p.variedad} (${p.servicio}). Inicia sesión o regístrate para agendar tu cita.`, 'ok');
                return;
            } catch (_) {}
        }
        if (prefProd) {
            try {
                const p = JSON.parse(prefProd);
                mostrarAlerta(alertaLogin, `✓ Producto elegido: ${p.nombre}. Inicia sesión o regístrate para incluirlo en tu cita.`, 'ok');
            } catch (_) {}
        }
    }

    // Función pública para abrir el popup desde cualquier botón de la Landing Page, Tienda o Catálogo
    window.abrirModalAuth = function (vista = 'login', opciones = {}) {
        // Si ya tiene sesión iniciada, lo llevamos directo a su panel
        if (typeof obtenerSesion === 'function' && obtenerSesion() && !opciones.forzarModal) {
            window.location.href = 'panel.html';
            return;
        }

        asegurarModalAuthDOM();

        // Si hay otro modal abierto (como el de ejemplos de catálogo), lo cerramos para que solo quede este popup con fondo opaco
        const modalCat = document.getElementById('modalCatalogoServicio');
        if (modalCat && modalCat.open) {
            modalCat.close();
        }

        const rol = opciones.rol || rolActualModal || 'cliente';
        seleccionarRolModal(rol, false);
        cambiarVistaAuth(vista);
        mostrarMensajeContextualSiExiste(opciones.mensaje || '');

        const dialog = document.getElementById('modalAuthBella');
        if (!dialog.open) {
            dialog.showModal();
        }
    };

    function conectarEnlacesAuthEnPagina() {
        document.querySelectorAll('[data-abrir-auth]').forEach((el) => {
            if (el.dataset.authConectado) return;
            el.dataset.authConectado = '1';
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const vista = el.dataset.abrirAuth || 'login';
                const rol = el.dataset.authRol || 'cliente';
                window.abrirModalAuth(vista, { rol });
            });
        });

        // Si en la página hay parámetros ?auth=login o ?auth=registro, abrimos el modal automáticamente
        const params = new URLSearchParams(window.location.search);
        const authParam = params.get('auth');
        const rolParam = params.get('rol') || 'cliente';
        if (authParam === 'login' || authParam === 'registro' || authParam === 'recuperar') {
            window.abrirModalAuth(authParam, { rol: rolParam });
            // Limpiamos la URL sin recargar para que quede limpia
            if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', conectarEnlacesAuthEnPagina);
    } else {
        conectarEnlacesAuthEnPagina();
    }
})();
