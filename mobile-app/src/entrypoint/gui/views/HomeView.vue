<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter } from '@ionic/vue';
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

async function load() {
  busy.value = true;
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
    error.value = errorMessage(e);
  } finally {
    busy.value = false;
  }
}

onIonViewWillEnter(load);
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
        <p class="eyebrow">SALÓN DE BELLEZA · CARTAGENA</p>
        <h1>Hola, {{ session?.nombre }}</h1>
        <p class="muted">Tu experiencia móvil conectada en tiempo real con el servidor central de BellaStyle.</p>

        <section class="welcome">
          <span class="pill">✨ SINCRONIZACIÓN EN TIEMPO REAL</span>
          <h2>Tu estilo, a un toque desde tu celular.</h2>
          <p>Aparta citas, añade varios productos a tu carrito con descuento de stock real y califica tus experiencias.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <RouterLink to="/servicios" class="button mint">✂ Agendar Cita</RouterLink>
            <RouterLink to="/tienda" class="button secondary">🛍️ Comprar Producto</RouterLink>
            <RouterLink to="/historial" class="button secondary">🧾 Mis Compras</RouterLink>
          </div>
        </section>

        <div v-if="error" class="error" role="alert">
          {{ error }}
          <button class="button secondary" style="margin-top:8px;" @click="load">Reintentar</button>
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
