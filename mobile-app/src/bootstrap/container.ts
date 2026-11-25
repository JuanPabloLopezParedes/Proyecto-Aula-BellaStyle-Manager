import { Capacitor } from '@capacitor/core';
import { BrowserSessionStore } from '../adapters/storage/BrowserSessionStore';
import { HttpClient } from '../adapters/http/HttpClient';
import { BellaApplicationService } from '../application/services/BellaApplicationService';

// Contenedor de Inyección de Dependencias idéntico al patrón de user-admin-vuejs-ionic-app:
// - Si corre en Web / Vite dev server: usa VITE_API_BASE_URL (/api -> proxy a http://localhost:3000)
// - Si corre como APK nativa en Android / iOS con Capacitor: usa VITE_NATIVE_API_BASE_URL
const store = new BrowserSessionStore(localStorage);

const baseUrl = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_NATIVE_API_BASE_URL || 'https://proyecto-aula-bella-style-manager.vercel.app/api'
  : import.meta.env.VITE_API_BASE_URL || '/api';

export const useCases = new BellaApplicationService(
  new HttpClient(baseUrl, store, () => window.dispatchEvent(new Event('session-expired'))),
  store
);
