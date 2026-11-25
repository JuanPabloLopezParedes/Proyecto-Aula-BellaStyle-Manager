<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonContent, IonInput, IonInputPasswordToggle, onIonViewWillEnter } from '@ionic/vue';
import { Sparkles } from 'lucide-vue-next';
import { useApplication, errorMessage } from '../context';

const app = useApplication();
const router = useRouter();
const route = useRoute();

const modo = ref<'login' | 'registro'>('login');
const rol = ref<'cliente' | 'estilista' | 'admin'>('cliente');
const username = ref('');
const password = ref('');
const regNombre = ref('');
const regTelefono = ref('');
const regEmail = ref('');

const busy = ref(false);
const error = ref('');
const okMsg = ref('');

onIonViewWillEnter(() => {
  password.value = '';
  error.value = '';
  okMsg.value = '';
});

async function submitLogin() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  okMsg.value = '';
  try {
    await app.login({ username: username.value.trim(), password: password.value, rol: rol.value });
    password.value = '';
    window.dispatchEvent(new Event('session-changed'));
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/';
    await router.replace(redirect);
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}

async function submitRegistro() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  okMsg.value = '';
  try {
    await app.registrarClienta({
      nombre: regNombre.value.trim(),
      username: username.value.trim(),
      password: password.value,
      telefono: regTelefono.value.trim(),
      email: regEmail.value.trim(),
    });
    rol.value = 'cliente';
    await submitLogin();
  } catch (e) {
    error.value = errorMessage(e);
    busy.value = false;
  }
}

function accesoRapido(r: 'cliente' | 'estilista' | 'admin', u: string, p: string) {
  modo.value = 'login';
  rol.value = r;
  username.value = u;
  password.value = p;
  void submitLogin();
}
</script>

<template>
  <IonPage>
    <IonContent class="auth-content">
      <main class="auth-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <Sparkles :size="28" color="#ab406e" />
          <strong style="font-size:26px;color:#4a182f;">Bella<span style="color:#ab406e;">Style</span> Mobile</strong>
        </div>
        <p class="eyebrow">APP MÓVIL VUE.JS + IONIC</p>
        <h1>{{ modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta de Clienta' }}</h1>
        <p class="muted">Conectada en tiempo real con el mismo backend de BellaStyle Manager.</p>

        <p v-if="route.query.expired" class="notice" role="alert">Tu sesión venció. Inicia sesión nuevamente.</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="okMsg" class="success" role="status">{{ okMsg }}</p>

        <template v-if="modo === 'login'">
          <div class="role-tabs">
            <button type="button" :class="{ active: rol === 'cliente' }" @click="rol = 'cliente'">Clienta</button>
            <button type="button" :class="{ active: rol === 'estilista' }" @click="rol = 'estilista'">Estilista</button>
            <button type="button" :class="{ active: rol === 'admin' }" @click="rol = 'admin'">Admin</button>
          </div>

          <form @submit.prevent="submitLogin" style="display:grid;gap:12px;">
            <IonInput v-model="username" label="Usuario" label-placement="stacked" fill="outline" placeholder="Escribe tu usuario" required />
            <IonInput v-model="password" label="Contraseña" label-placement="stacked" fill="outline" type="password" required>
              <IonInputPasswordToggle slot="end" />
            </IonInput>
            <button class="button primary full" :disabled="busy">
              {{ busy ? 'Verificando…' : 'Entrar a BellaStyle' }}
            </button>
          </form>

          <div class="panel" style="margin-top:16px;padding:12px;background:#fdf4f7;">
            <p class="eyebrow" style="margin-bottom:8px;">⚡ ACCESO RÁPIDO DE PRUEBA (1 CLIC):</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
              <button type="button" class="button secondary" style="font-size:12px;min-height:36px;padding:6px;" @click="accesoRapido('cliente','cliente','cli123')">Clienta</button>
              <button type="button" class="button mint" style="font-size:12px;min-height:36px;padding:6px;" @click="accesoRapido('admin','admin','admin123')">Admin</button>
              <button type="button" class="button secondary" style="font-size:12px;min-height:36px;padding:6px;" @click="accesoRapido('estilista','diana','diana123')">Diana</button>
            </div>
          </div>

          <button type="button" class="button secondary full" style="margin-top:8px;" @click="modo = 'registro'">
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </template>

        <template v-else>
          <form @submit.prevent="submitRegistro" style="display:grid;gap:12px;margin-top:12px;">
            <IonInput v-model="regNombre" label="Nombre completo *" label-placement="stacked" fill="outline" required />
            <IonInput v-model="username" label="Usuario *" label-placement="stacked" fill="outline" required />
            <IonInput v-model="password" label="Contraseña (mín. 6) *" label-placement="stacked" fill="outline" type="password" required />
            <IonInput v-model="regTelefono" label="Teléfono *" label-placement="stacked" fill="outline" type="tel" required />
            <IonInput v-model="regEmail" label="Correo electrónico *" label-placement="stacked" fill="outline" type="email" required />
            <button class="button primary full" :disabled="busy">
              {{ busy ? 'Creando cuenta…' : 'Crear cuenta y entrar' }}
            </button>
            <button type="button" class="button secondary full" @click="modo = 'login'">
              ← Volver a iniciar sesión
            </button>
          </form>
        </template>
      </main>
    </IonContent>
  </IonPage>
</template>
