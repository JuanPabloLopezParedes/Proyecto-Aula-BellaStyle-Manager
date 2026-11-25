import type { InjectionKey } from 'vue';
import { inject } from 'vue';
import type { BellaApplicationService } from '../../application/services/BellaApplicationService';

export const USE_CASES: InjectionKey<BellaApplicationService> = Symbol('bella-use-cases');

export function useApplication(): BellaApplicationService {
  const app = inject(USE_CASES);
  if (!app) throw new Error('Falta configurar los casos de uso de BellaStyle Mobile.');
  return app;
}

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : 'Ocurrió un error inesperado.';

export const pesos = (valor: number | string): string =>
  '$' + Number(valor || 0).toLocaleString('es-CO');
