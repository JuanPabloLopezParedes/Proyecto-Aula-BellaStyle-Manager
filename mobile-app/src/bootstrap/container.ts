import { Capacitor } from '@capacitor/core';
import { BrowserSessionStore } from '../adapters/storage/BrowserSessionStore';
import { HttpClient } from '../adapters/http/HttpClient';
import { BellaApplicationService } from '../application/services/BellaApplicationService';

// URL oficial del backend en Vercel compartido entre la Web y la App Móvil
export const VERCEL_API_URL = 'https://proyecto-aula-bella-style-manager.vercel.app/api';

const store = new BrowserSessionStore(localStorage);

const baseUrl = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_NATIVE_API_BASE_URL || VERCEL_API_URL
  : import.meta.env.VITE_API_BASE_URL || VERCEL_API_URL;

export const useCases = new BellaApplicationService(
  new HttpClient(baseUrl, store, () => window.dispatchEvent(new Event('session-expired'))),
  store
);
