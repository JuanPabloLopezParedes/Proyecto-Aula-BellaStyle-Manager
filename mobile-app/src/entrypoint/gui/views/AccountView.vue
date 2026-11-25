<script setup lang="ts">
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { useApplication } from '../context';

const app = useApplication();
const router = useRouter();
const session = app.currentSession();
const backendConectado = app.apiBaseUrl();

function logout() {
  app.logout();
  window.dispatchEvent(new Event('session-changed'));
  void router.replace('/login');
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Mi Cuenta</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <main class="page-content">
        <p class="eyebrow">PERFIL SINCRONIZADO EN TIEMPO REAL</p>
        <h1>{{ session?.nombre }}</h1>

        <section class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>Usuario: @{{ session?.username }}</strong>
            <span class="badge ok">{{ session?.rol }}</span>
          </div>
          <p class="muted" style="margin-top:8px;">
            🟢 <strong>Backend en vivo:</strong> <code>{{ backendConectado }}</code>
          </p>
          <p class="muted" style="margin-top:4px;">
            Esta aplicación móvil Vue.js + Ionic está conectada directamente a tu servidor en Vercel (<b>proyecto-aula-bella-style-manager.vercel.app</b>) y se sincroniza cada 4 segundos.
          </p>
        </section>

        <div style="display:grid;gap:10px;margin:16px 0;">
          <RouterLink to="/servicios" class="button secondary full">✂ Explorar Servicios y Agendar Cita</RouterLink>
          <RouterLink to="/tienda" class="button secondary full">🛍️ Ir a Tienda y Carrito de Compras</RouterLink>
          <RouterLink to="/historial" class="button secondary full">🧾 Ver Historial de Mis Compras y Citas</RouterLink>
        </div>

        <button type="button" class="button danger full" @click="logout">
          Cerrar sesión
        </button>
      </main>
    </IonContent>
  </IonPage>
</template>
