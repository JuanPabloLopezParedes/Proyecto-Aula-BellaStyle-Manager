<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter } from '@ionic/vue';
import { useApplication, errorMessage, pesos } from '../context';
import type { ServicioBella, EstilistaBella } from '../../../domain/model/BellaModels';

const app = useApplication();
const servicios = ref<ServicioBella[]>([]);
const estilistas = ref<EstilistaBella[]>([]);
const idServicio = ref<number>(0);
const idEstilista = ref<number>(0);
const fecha = ref(new Date().toISOString().slice(0, 10));
const hora = ref('10:00');
const metodoPago = ref('Nequi / Daviplata');
const observaciones = ref('');
const busy = ref(false);
const error = ref('');
const success = ref('');

async function load() {
  busy.value = true;
  error.value = '';
  try {
    const [s, e] = await Promise.all([app.listarServicios(), app.listarEstilistas()]);
    servicios.value = s;
    estilistas.value = e;
    if (s.length && !idServicio.value) idServicio.value = s[0]!.id_servicio;
    if (e.length && !idEstilista.value) idEstilista.value = e[0]!.id_estilista;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}

onIonViewWillEnter(load);

function elegirServicio(srv: ServicioBella) {
  idServicio.value = srv.id_servicio;
  document.getElementById('formAgendarMobile')?.scrollIntoView({ behavior: 'smooth' });
}

async function agendar() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    const msg = await app.crearCita({
      idServicio: Number(idServicio.value),
      idEstilista: Number(idEstilista.value),
      fecha: fecha.value,
      hora: hora.value,
      observaciones: observaciones.value.trim() || 'Agendada desde BellaStyle Mobile App',
      metodoPago: metodoPago.value,
    });
    success.value = msg;
    observaciones.value = '';
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
        <IonTitle>Servicios y Agendar Cita</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <main class="page-content">
        <p class="eyebrow">CATÁLOGO UNIFORME DE ESPECIALIDADES</p>
        <h1>Servicios que hacemos</h1>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <!-- Formulario para apartar cita -->
        <section id="formAgendarMobile" class="panel" style="background:#fdf4f7;">
          <h2>📅 Apartar nueva cita</h2>
          <form @submit.prevent="agendar" style="display:grid;gap:10px;">
            <div>
              <label class="eyebrow">Servicio</label>
              <select v-model="idServicio" style="width:100%;padding:10px;border-radius:12px;border:1px solid #ebb0c8;margin-top:4px;">
                <option v-for="s in servicios" :key="s.id_servicio" :value="s.id_servicio">
                  {{ s.nombre }} — {{ pesos(s.precio) }} ({{ s.duracion_min }} min)
                </option>
              </select>
            </div>
            <div>
              <label class="eyebrow">Estilista</label>
              <select v-model="idEstilista" style="width:100%;padding:10px;border-radius:12px;border:1px solid #ebb0c8;margin-top:4px;">
                <option v-for="e in estilistas" :key="e.id_estilista" :value="e.id_estilista">
                  {{ e.nombres }} {{ e.apellidos }} — {{ e.especialidad }}
                </option>
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label class="eyebrow">Fecha</label>
                <input v-model="fecha" type="date" style="width:100%;padding:10px;border-radius:12px;border:1px solid #ebb0c8;margin-top:4px;" required />
              </div>
              <div>
                <label class="eyebrow">Hora</label>
                <input v-model="hora" type="time" min="08:00" max="18:30" style="width:100%;padding:10px;border-radius:12px;border:1px solid #ebb0c8;margin-top:4px;" required />
              </div>
            </div>
            <div>
              <label class="eyebrow">Método de pago</label>
              <select v-model="metodoPago" style="width:100%;padding:10px;border-radius:12px;border:1px solid #ebb0c8;margin-top:4px;">
                <option value="Nequi / Daviplata">📲 Nequi / Daviplata</option>
                <option value="Tarjeta / PSE">💳 Tarjeta / PSE</option>
                <option value="Efectivo en Salón">💵 Efectivo en Salón</option>
              </select>
            </div>
            <input v-model="observaciones" type="text" placeholder="Estilo deseado u observación (opcional)" style="width:100%;padding:10px;border-radius:12px;border:1px solid #ebb0c8;" />
            <button type="submit" class="button primary full" :disabled="busy">
              {{ busy ? 'Agendando…' : 'Confirmar cita ahora' }}
            </button>
          </form>
        </section>

        <!-- Cuadrícula uniforme de servicios -->
        <div class="card-grid">
          <article v-for="s in servicios" :key="s.id_servicio" class="panel" style="display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <h2>{{ s.nombre }}</h2>
                <span class="badge ok">Desde {{ pesos(s.precio) }}</span>
              </div>
              <p class="muted">{{ s.subtitulo || 'Procedimiento profesional con diagnóstico capilar incluido.' }}</p>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid #fbe8ef;">
              <span class="pill">◷ {{ s.duracion_min }} min</span>
              <button type="button" class="button primary" @click="elegirServicio(s)">📅 Elegir servicio</button>
            </div>
          </article>
        </div>
      </main>
    </IonContent>
  </IonPage>
</template>
