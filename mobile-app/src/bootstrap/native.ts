import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import type { Router } from 'vue-router';

export async function initializeNative(router: Router) {
  if (!Capacitor.isNativePlatform()) return;
  const updateStatusBar = (path: string) =>
    SystemBars.setStyle({
      style: path === '/login' ? SystemBarsStyle.Light : SystemBarsStyle.Dark,
      bar: SystemBarType.StatusBar,
    });

  router.afterEach((to) => {
    void updateStatusBar(to.path).catch(() => undefined);
    void Keyboard.hide().catch(() => undefined);
  });

  document.addEventListener('ionBackButton', ((event: CustomEvent) => {
    event.detail.register(-1, () => {
      void App.minimizeApp();
    });
  }) as EventListener);

  await Promise.allSettled([
    updateStatusBar(router.currentRoute.value.path),
    SystemBars.setStyle({ style: SystemBarsStyle.Light, bar: SystemBarType.NavigationBar }),
    Keyboard.addListener('keyboardWillShow', () => document.body.classList.add('keyboard-open')),
    Keyboard.addListener('keyboardWillHide', () => document.body.classList.remove('keyboard-open')),
    SplashScreen.hide(),
  ]);
}
