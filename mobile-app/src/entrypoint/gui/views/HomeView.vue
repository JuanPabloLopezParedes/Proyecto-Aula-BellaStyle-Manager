<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import { useApplication, errorMessage, pesos } from '../context';
import type { ServicioBella, ProductoBella, CitaBella, CompraProductoBella } from '../../../domain/model/BellaModels';

const app = useApplication();
const session = computed(() => app.currentSession());
const servicios = ref<ServicioBella[]>([]);
const productos = ref<ProductoBella[]>([]);
const citas = ref<CitaBella[]>([]);
const compras = ref<CompraProductoBella[]>([]);
const error = ref('');
const busy = ref(false);
let timerRealtime: ReturnType<typeof setInterval> | null = null;

async function load(silencioso = false) {
  if (!silencioso) busy.value = true;
  error.value = '';
  try {
    const [s, p, c, cp] = await Promise.all([
      app.listarServicios(),
      app.listarProductos(),
      app.listarCitas(),
      app.listarMisCompras(),
    ]);
    servicios.value = s;
    productos.value = p;
    citas.value = c;
    compras.value = cp;
  } catch (e) {
    if (!silencioso) error.value = errorMessage(e);
  } finally {
    if (!silencioso) busy.value = false;
  }
}

onIonViewWillEnter(() => {
  void load(false);
  if (timerRealtime) clearInterval(timerRealtime);
  timerRealtime = setInterval(() => void load(true), 4000);
});

onIonViewWillLeave(() => {
  if (timerRealtime) {
    clearInterval(timerRealtime);
    timerRealtime = null;
  }
});
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>BellaStyle Mobile · {{ session?.rol }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <main class="page-content">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <p class="eyebrow">SALÓN DE BELLEZA · CARTAGENA</p>
          <span class="badge ok">🟢 En vivo: Vercel Backend</span>
        </div>
        <h1>Hola, {{ session?.nombre }}</h1>
        <p class="muted">Sincronizado en tiempo real cada 4s con <b>proyecto-aula-bella-style-manager.vercel.app</b>.</p>

        <section class="welcome">
          <span class="pill">✨ MISMO BACKEND EN VERCEL</span>
          <h2>Tu estilo, a un toque desde tu celular.</h2>
          <p>Todo lo que compres, agendes o califiques aquí se actualiza en tiempo real en la página web desplegada en Vercel y viceversa.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <RouterLink to="/servicios" class="button mint">✂ Agendar Cita</RouterLink>
            <RouterLink to="/tienda" class="button secondary">🛍️ Comprar Producto</RouterLink>
            <RouterLink to="/historial" class="button secondary">🧾 Mis Compras</RouterLink>
          </div>
        </section>

        <div v-if="error" class="error" role="alert">
          {{ error }}
          <button class="button secondary" style="margin-top:8px;" @click="load(false)">Reintentar</button>
        </div>

        <section class="stats">
          <article class="panel">
            <small class="muted">Servicios disponibles</small>
            <strong style="display:block;font-size:24px;margin-top:6px;">{{ busy ? '…' : servicios.length }}</strong>
          </article>
          <article class="panel">
            <small class="muted">Productos en tienda</small>
            <strong style="display:block;font-size:24px;margin-top:6px;">{{ busy ? '…' : productos.length }}</strong>
          </article>
          <article class="panel">
            <small class="muted">Mis citas registradas</small>
            <strong style="display:block;font-size:24px;margin-top:6px;">{{ busy ? '…' : citas.length }}</strong>
          </article>
          <article class="panel">
            <small class="muted">Historial Mis Compras</small>
            <strong style="display:block;font-size:24px;margin-top:6px;">{{ busy ? '…' : compras.length }}</strong>
          </article>
        </section>

        <h2 style="margin-top:18px;">Servicios destacados</h2>
        <div class="card-grid">
          <article v-for="srv in servicios.slice(0, 3)" :key="srv.id_servicio" class="panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <strong>{{ srv.nombre }}</strong>
              <span class="badge ok">{{ pesos(srv.precio) }}</span>
            </div>
            <p class="muted" style="margin:6px 0 12px;">{{ srv.subtitulo || 'Atención profesional personalizada.' }} · {{ srv.duracion_min }} min</p>
            <RouterLink to="/servicios" class="button primary full">Elegir y agendar →</RouterLink>
          </article>
        </div>
      </main>
    </IonContent>
  </IonPage>
</template>
