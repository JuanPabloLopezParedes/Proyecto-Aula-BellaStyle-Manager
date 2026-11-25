<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage, pesos } from '../context';
import type { CitaBella, CompraProductoBella } from '../../../domain/model/BellaModels';

const app = useApplication();
const tabActiva = ref<'compras' | 'citas'>('compras');
const compras = ref<CompraProductoBella[]>([]);
const citas = ref<CitaBella[]>([]);
const busy = ref(false);
const error = ref('');
const success = ref('');

// Estado para calificar con estrellas que cambian de color vivo al presionar
const itemEvaluando = ref<{ tipo: 'cita' | 'compra'; id: number; titulo: string } | null>(null);
const estrellasElegidas = ref<number>(5);
const comentarioEvaluacion = ref('');

const textosEstrella: Record<number, string> = {
  1: '1 de 5 ★ · Necesita mejorar (Seleccionada)',
  2: '2 de 5 ★★ · Regular (Seleccionada)',
  3: '3 de 5 ★★★ · Bueno / Aceptable (Seleccionada)',
  4: '4 de 5 ★★★★ · ¡Muy buen servicio! (Seleccionada)',
  5: '5 de 5 ★★★★★ · ¡Excelente, me encantó! (Seleccionada)',
};

async function load() {
  busy.value = true;
  error.value = '';
  try {
    const [cp, ct] = await Promise.all([app.listarMisCompras(), app.listarCitas()]);
    compras.value = cp;
    citas.value = ct;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}

onIonViewWillEnter(load);

function abrirEvaluacion(tipo: 'cita' | 'compra', id: number, titulo: string, calActual?: number | null, comActual?: string | null) {
  itemEvaluando.value = { tipo, id, titulo };
  estrellasElegidas.value = Number(calActual) || 5;
  comentarioEvaluacion.value = comActual || '';
}

async function guardarEvaluacion() {
  if (!itemEvaluando.value) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    if (itemEvaluando.value.tipo === 'cita') {
      success.value = await app.calificarCita(itemEvaluando.value.id, estrellasElegidas.value, comentarioEvaluacion.value);
    } else {
      success.value = await app.calificarCompra(itemEvaluando.value.id, estrellasElegidas.value, comentarioEvaluacion.value);
    }
    itemEvaluando.value = null;
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Mis Compras y Mis Citas</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <main class="page-content">
        <div class="role-tabs" style="grid-template-columns:1fr 1fr;">
          <button type="button" :class="{ active: tabActiva === 'compras' }" @click="tabActiva = 'compras'">
            🧾 Mis Compras ({{ compras.length }})
          </button>
          <button type="button" :class="{ active: tabActiva === 'citas' }" @click="tabActiva = 'citas'">
            📅 Mis Citas ({{ citas.length }})
          </button>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <!-- Modal / Panel interactivo de Calificar con estrellas que cambian a color verde vivo -->
        <section v-if="itemEvaluando" class="panel" style="border:2px solid #059669;background:#ecfdf5;">
          <p class="eyebrow" style="color:#065f46;">★ CALIFICAR Y EVALUAR EN TIEMPO REAL</p>
          <h2 style="margin-top:4px;">{{ itemEvaluando.titulo }}</h2>
          <p class="muted">Presiona una estrella del 1 al 5 (cambiará a color verde brillante al seleccionarla):</p>

          <div class="star-row">
            <button
              v-for="n in [1, 2, 3, 4, 5]"
              :key="n"
              type="button"
              class="star-btn"
              :class="{ active: n <= estrellasElegidas }"
              @click="estrellasElegidas = n"
            >
              <div>{{ n <= estrellasElegidas ? '★' : '☆' }}</div>
              <div>{{ n }} {{ n === estrellasElegidas ? '✓' : '' }}</div>
            </button>
          </div>
          <div class="success" style="margin-top:6px;padding:8px 12px;">
            ✨ {{ textosEstrella[estrellasElegidas] }}
          </div>

          <textarea
            v-model="comentarioEvaluacion"
            rows="3"
            placeholder="Escribe tu experiencia (aparecerá en vivo en la Landing Page)..."
            style="width:100%;padding:10px;border-radius:12px;border:1px solid #6ee7b7;margin-top:6px;"
          ></textarea>

          <div style="display:flex;gap:8px;margin-top:10px;">
            <button type="button" class="button secondary" @click="itemEvaluando = null">Cancelar</button>
            <button type="button" class="button primary" :disabled="busy" @click="guardarEvaluacion">
              Publicar calificación en tiempo real
            </button>
          </div>
        </section>

        <!-- HISTORIAL DE MIS COMPRAS -->
        <template v-if="tabActiva === 'compras'">
          <section v-if="!compras.length" class="panel" style="text-align:center;">
            <h2>Aún no tienes compras registradas</h2>
            <p class="muted">Ve a la pestaña Tienda para añadir productos a tu carrito.</p>
            <RouterLink to="/tienda" class="button primary">🛍️ Ir a Comprar Producto</RouterLink>
          </section>
          <div v-else class="card-grid">
            <article v-for="cp in compras" :key="cp.id_compra" class="panel">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="pill">#CP-{{ cp.id_compra }}</span>
                <span class="badge ok">{{ pesos(cp.total) }}</span>
              </div>
              <h2 style="margin-top:8px;">{{ cp.producto_nombre }}</h2>
              <p class="muted">Cantidad: {{ cp.cantidad }} unid. × {{ pesos(cp.precio_unitario) }}</p>
              <p class="muted">Pago: {{ cp.metodo_pago }} · {{ cp.fecha }} {{ cp.hora }}</p>
              <button
                type="button"
                class="button mint full"
                style="margin-top:8px;"
                @click="abrirEvaluacion('compra', cp.id_compra, cp.producto_nombre, cp.calificacion, cp.comentario_calificacion)"
              >
                ★ {{ cp.calificacion ? `Evaluado (${cp.calificacion}/5) · Editar` : 'Calificar / Evaluar producto' }}
              </button>
            </article>
          </div>
        </template>

        <!-- HISTORIAL DE MIS CITAS -->
        <template v-else>
          <section v-if="!citas.length" class="panel" style="text-align:center;">
            <h2>Aún no tienes citas registradas</h2>
            <RouterLink to="/servicios" class="button primary">📅 Agendar mi primera cita</RouterLink>
          </section>
          <div v-else class="card-grid">
            <article v-for="c in citas" :key="c.id" class="panel">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="pill">#BS-{{ c.id }} · {{ c.estado }}</span>
                <span class="badge ok">{{ pesos(c.precio) }}</span>
              </div>
              <h2 style="margin-top:8px;">{{ c.servicio }}</h2>
              <p class="muted">Estilista: {{ c.estilista }} · {{ c.fecha }} a las {{ c.hora }}</p>
              <button
                type="button"
                class="button mint full"
                style="margin-top:8px;"
                @click="abrirEvaluacion('cita', c.id, c.servicio, c.calificacion, c.comentario_calificacion)"
              >
                ★ {{ c.calificacion ? `Evaluado (${c.calificacion}/5) · Editar` : 'Calificar / Evaluar servicio' }}
              </button>
            </article>
          </div>
        </template>
      </main>
    </IonContent>
  </IonPage>
</template>
