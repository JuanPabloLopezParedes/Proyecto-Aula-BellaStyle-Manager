import type { SessionStore } from '../../domain/ports/out/SessionStore';
import { ApiError, UnauthorizedError } from '../../domain/exceptions/errors';

// Cliente HTTP unificado basado en user-admin-vuejs-ionic-app
// Se conecta directamente al mismo backend Node.js/Express de BellaStyle Manager
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly sessions: SessionStore,
    private readonly onUnauthorized: () => void
  ) {}

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async request<T>(path: string, method = 'GET', body?: unknown, authenticated = true): Promise<T> {
    const session = authenticated ? this.sessions.get() : null;
    const token = session?.token;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const payload = await response.json().catch(() => null);

      if (response.status === 401 && authenticated) {
        if (this.sessions.get()?.token === token) {
          this.sessions.clear();
          this.onUnauthorized();
        }
        throw new UnauthorizedError(payload?.message || 'Sesión expirada.');
      }

      if (!response.ok || (payload && payload.success === false)) {
        throw new ApiError(
          payload?.message || 'No se pudo completar la solicitud con el servidor BellaStyle.',
          response.status || 400
        );
      }

      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted) {
        throw new ApiError('El servidor tardó demasiado en responder.', 0);
      }
      throw new ApiError(
        'No se pudo conectar con el backend de BellaStyle. Verifica que el backend esté encendido en el puerto 3000.',
        0
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
