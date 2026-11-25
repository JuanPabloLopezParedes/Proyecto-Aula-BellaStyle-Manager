import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import type { BellaApplicationService } from '../../application/services/BellaApplicationService';

const AuthView = () => import('./views/AuthView.vue');
const HomeView = () => import('./views/HomeView.vue');
const ServiciosView = () => import('./views/ServiciosView.vue');
const TiendaCarritoView = () => import('./views/TiendaCarritoView.vue');
const CitasComprasView = () => import('./views/CitasComprasView.vue');
const AccountView = () => import('./views/AccountView.vue');

export function createAppRouter(app: BellaApplicationService) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: AuthView, meta: { public: true } },
      { path: '/', component: HomeView },
      { path: '/servicios', component: ServiciosView },
      { path: '/tienda', component: TiendaCarritoView },
      { path: '/historial', component: CitasComprasView },
      { path: '/cuenta', component: AccountView },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  });

  router.beforeEach((to: RouteLocationNormalized) => {
    if (!to.meta.public && !app.currentSession()) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
  });

  return router;
}
