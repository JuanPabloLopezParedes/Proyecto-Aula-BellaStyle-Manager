<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { House, Scissors, ShoppingBag, ReceiptText, CircleUserRound } from 'lucide-vue-next';
import { useApplication } from './context';

const app = useApplication();
const route = useRoute();
const scope = ref(0);
const cartCount = ref(0);

function syncCartBadge() {
  cartCount.value = app.obtenerCarrito().reduce((acc, it) => acc + Number(it.cantidad || 1), 0);
}

function reset() {
  scope.value++;
  syncCartBadge();
}

onMounted(() => {
  syncCartBadge();
  window.addEventListener('session-changed', reset);
  window.addEventListener('cart-changed', syncCartBadge);
});

onUnmounted(() => {
  window.removeEventListener('session-changed', reset);
  window.removeEventListener('cart-changed', syncCartBadge);
});

const publicPage = computed(() => !!route.meta.public);
</script>

<template>
  <IonApp>
    <IonRouterOutlet :key="scope" :class="{ 'with-tabs': !publicPage }" />
    <nav v-if="!publicPage" class="tabbar" aria-label="Navegación móvil BellaStyle">
      <RouterLink to="/" :aria-current="route.path === '/' ? 'page' : undefined">
        <House :size="21" />
        <span>Inicio</span>
      </RouterLink>
      <RouterLink to="/servicios" :aria-current="route.path.startsWith('/servicios') ? 'page' : undefined">
        <Scissors :size="21" />
        <span>Servicios</span>
      </RouterLink>
      <RouterLink to="/tienda" class="tab-cart" :aria-current="route.path.startsWith('/tienda') ? 'page' : undefined">
        <ShoppingBag :size="21" />
        <span>Tienda</span>
        <b v-if="cartCount > 0" class="cart-pill">{{ cartCount }}</b>
      </RouterLink>
      <RouterLink to="/historial" :aria-current="route.path.startsWith('/historial') ? 'page' : undefined">
        <ReceiptText :size="21" />
        <span>Mis Compras</span>
      </RouterLink>
      <RouterLink to="/cuenta" :aria-current="route.path === '/cuenta' ? 'page' : undefined">
        <CircleUserRound :size="21" />
        <span>Cuenta</span>
      </RouterLink>
    </nav>
  </IonApp>
</template>
