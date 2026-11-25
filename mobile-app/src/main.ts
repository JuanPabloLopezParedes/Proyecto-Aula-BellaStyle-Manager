import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import App from './entrypoint/gui/App.vue';
import { createAppRouter } from './entrypoint/gui/router';
import { USE_CASES } from './entrypoint/gui/context';
import { useCases } from './bootstrap/container';
import { initializeNative } from './bootstrap/native';
import './entrypoint/gui/styles.css';

const router = createAppRouter(useCases);
const changed = () => window.dispatchEvent(new Event('session-changed'));

window.addEventListener('session-expired', () => {
  changed();
  void router.replace({ path: '/login', query: { expired: '1' } });
});

window.addEventListener('storage', () => {
  changed();
  if (!useCases.currentSession()) void router.replace('/login');
});

const app = createApp(App)
  .provide(USE_CASES, useCases)
  .use(IonicVue, { mode: 'md' })
  .use(router);

void router.isReady().then(() => {
  app.mount('#app');
  void initializeNative(router);
});
