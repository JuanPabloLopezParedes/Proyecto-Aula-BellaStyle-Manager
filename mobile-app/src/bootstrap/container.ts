import { Capacitor } from '@capacitor/core';
import { BrowserSessionStore } from '../adapters/storage/BrowserSessionStore';
import { HttpClient } from '../adapters/http/HttpClient';
import { BellaApplicationService } from '../application/services/BellaApplicationService';

// Backend principal en Render + respaldo automático en Vercel
export const RENDER_API_URL =
  import.meta.env.VITE_RENDER_API_BASE_URL ||
  'https://proyecto-aula-bellastyle-manager.onrender.com/api';

export const VERCEL_FALLBACK_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://proyecto-aula-bella-style-manager.vercel.app/api';

const store = new BrowserSessionStore(localStorage);

const baseUrl = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_NATIVE_API_BASE_URL || RENDER_API_URL
  : RENDER_API_URL;

export const useCases = new BellaApplicationService(
  new HttpClient(
    baseUrl,
    store,
    () => window.dispatchEvent(new Event('session-expired')),
    VERCEL_FALLBACK_API_URL
  ),
  store
);
