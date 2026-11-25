import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.nexo.users',
  appName: 'BellaStyle Mobile',
  webDir: 'dist',
  plugins: {
    SystemBars: { insetsHandling: 'native', initialViewportFitValueHint: 'cover', style: 'DARK' },
    CapacitorHttp: { enabled: true },
    Keyboard: { resize: KeyboardResize.Body, resizeOnFullScreen: true },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1800,
      backgroundColor: '#4a182f',
      showSpinner: false,
    },
  },
};

export default config;
