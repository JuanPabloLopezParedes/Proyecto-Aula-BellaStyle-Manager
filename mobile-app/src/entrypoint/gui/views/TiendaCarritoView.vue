<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import { useApplication, errorMessage, pesos } from '../context';
import type { ProductoBella, ItemCarritoBella } from '../../../domain/model/BellaModels';

const app = useApplication();
const router = useRouter();
const productos = ref<ProductoBella[]>([]);
const carrito = ref<ItemCarritoBella[]>([]);
const metodoPago = ref('Nequi / Daviplata');
const busy = ref(false);
const error = ref('');
const success = ref('');
let timerStockRealtime: ReturnType<typeof setInterval> | null = null;

function syncCarrito() {
  carrito.value = app.obtenerCarrito();
}

async function load(silencioso = false) {
  if (!silencioso) busy.value = true;
  if (!silencioso) error.value = '';
  try {
    productos.value = await app.listarProductos();
    syncCarrito();
  } catch (err) {
    if (!silencioso) error.value = errorMessage(err);
  } finally {
    if (!silencioso) busy.value = false;
  }
}

onIonViewWillEnter(() => {
  void load(false);
  if (timerStockRealtime) clearInterval(timerStockRealtime);
  // Sincronización en tiempo real cada 4 segundos del stock de productos con Vercel
  timerStockRealtime = setInterval(() => void load(true), 4000);
});

onIonViewWillLeave(() => {
  if (timerStockRealtime) {
    clearInterval(timerStockRealtime);
    timerStockRealtime = null;
  }
});

const itemsDetallados = computed(() =>
  carrito.value
    .map((it) => {
      const prod = productos.value.find((p) => Number(p.id_producto) === Number(it.id_producto));
      if (!prod) return null;
      return {
        producto: prod,
        cantidad: it.cantidad,
        subtotal: Number(prod.precio) * Number(it.cantidad),
      };
    })
    .filter(Boolean) as { producto: ProductoBella; cantidad: number; subtotal: number }[]
);

const granTotal = computed(() => itemsDetallados.value.reduce((acc, it) => acc + it.subtotal, 0));

function cantEnCarrito(idProd: number): number {
  return carrito.value.find((it) => Number(it.id_producto) === Number(idProd))?.cantidad || 0;
}

function agregar(p: ProductoBella) {
  app.agregarAlCarrito(p);
  syncCarrito();
  success.value = `🛒 "${p.nombre}" añadido a tu carrito.`;
}

function cambiarCant(p: ProductoBella, delta: number) {
  app.cambiarCantidadCarrito(p.id_producto, delta, p.stock);
  syncCarrito();
}

function vaciar() {
  app.vaciarCarrito();
  syncCarrito();
}

async function pagarTodo() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    const msg = await app.pagarCarrito(metodoPago.value);
    syncCarrito();
    productos.value = await app.listarProductos();
    success.value = msg;
    setTimeout(() => void router.push('/historial'), 1100);
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
        <IonTitle>Tienda y Carrito de Compras</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      <main class="page-content">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <p class="eyebrow">🟢 STOCK EN TIEMPO REAL CON VERCEL</p>
            <h1>Comprar Producto</h1>
          </div>
          <RouterLink to="/historial" class="button secondary">🧾 Ir a Mis Compras →</RouterLink>
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <!-- Bloque del Carrito de Compras Multiproducto -->
        <section class="panel" style="background:#fdf4f7;border:2px solid #ab406e;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <h2 style="margin:0;">🛒 Mi Carrito ({{ itemsDetallados.length }} productos)</h2>
            <button v-if="itemsDetallados.length" type="button" class="button secondary" style="min-height:32px;padding:4px 10px;font-size:12px;" @click="vaciar">
              Vaciar carrito
            </button>
          </div>

          <p v-if="!itemsDetallados.length" class="muted" style="margin-top:8px;">
            Tu carrito está vacío. Presiona <strong>"🛒 Comprar producto"</strong> en los artículos de abajo para añadir uno o varios productos.
          </p>

          <div v-else style="margin-top:12px;display:grid;gap:10px;">
            <div v-for="item in itemsDetallados" :key="item.producto.id_producto" class="panel" style="margin:0;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;">
              <div>
                <strong>{{ item.producto.nombre }}</strong>
                <p class="muted" style="margin:2px 0;">{{ pesos(item.producto.precio) }} c/u · Subtotal: <b>{{ pesos(item.subtotal) }}</b></p>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <button type="button" class="button secondary" style="min-height:32px;padding:4px 10px;" @click="cambiarCant(item.producto, -1)">−</button>
                <strong>{{ item.cantidad }}</strong>
                <button type="button" class="button primary" style="min-height:32px;padding:4px 10px;" @click="cambiarCant(item.producto, 1)">+</button>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:8px;border-top:1px solid #ebb0c8;">
              <div>
                <small class="muted">Total a pagar del carrito:</small>
                <strong style="display:block;font-size:22px;color:#8d2f58;">{{ pesos(granTotal) }}</strong>
              </div>
              <select v-model="metodoPago" style="padding:10px;border-radius:12px;border:1px solid #ebb0c8;">
                <option value="Nequi / Daviplata">📲 Nequi / Daviplata</option>
                <option value="Tarjeta / PSE">💳 Tarjeta / PSE</option>
                <option value="Efectivo en Salón">💵 Efectivo en Salón</option>
              </select>
              <button type="button" class="button primary" :disabled="busy" @click="pagarTodo">
                {{ busy ? 'Procesando…' : '✅ Confirmar y Pagar Carrito' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Catálogo de Productos -->
        <div class="card-grid">
          <article v-for="p in productos" :key="p.id_producto" class="panel" style="display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <h2>{{ p.nombre }}</h2>
                <span class="badge" :class="{ ok: p.stock > 0 }">{{ p.stock > 0 ? `${p.stock} disp.` : 'Agotado' }}</span>
              </div>
              <strong style="font-size:20px;color:#8d2f58;">{{ pesos(p.precio) }}</strong>
              <p class="muted" style="margin-top:6px;">{{ p.descripcion || 'Producto cosmético profesional de salón.' }}</p>
            </div>
            <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span v-if="cantEnCarrito(p.id_producto) > 0" class="badge ok">🛒 {{ cantEnCarrito(p.id_producto) }} en carrito</span>
              <span v-else class="muted">Stock en tiempo real</span>
              <button type="button" class="button primary" :disabled="p.stock <= 0" @click="agregar(p)">
                🛒 {{ cantEnCarrito(p.id_producto) > 0 ? 'Añadir otro (+1)' : 'Comprar producto' }}
              </button>
            </div>
          </article>
        </div>
      </main>
    </IonContent>
  </IonPage>
</template>
