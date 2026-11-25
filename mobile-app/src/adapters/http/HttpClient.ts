import type { SessionStore } from '../../domain/ports/out/SessionStore';
import { ApiError, UnauthorizedError } from '../../domain/exceptions/errors';

// Cliente HTTP unificado conectado al Backend en Render (https://proyecto-aula-bellastyle-manager.onrender.com/api)
// con respaldo automático al gateway de Vercel si Render está despertando del modo reposo gratuito.
export class HttpClient {
  private activeUrl: string;

  constructor(
    private readonly baseUrl: string,
    private readonly sessions: SessionStore,
    private readonly onUnauthorized: () => void,
    private readonly fallbackUrl?: string
  ) {
    this.activeUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.activeUrl;
  }

  private async fetchFromBase(urlBase: string, path: string, method: string, body?: unknown, token?: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      return await fetch(`${urlBase.replace(/\/$/, '')}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async request<T>(path: string, method = 'GET', body?: unknown, authenticated = true): Promise<T> {
    const session = authenticated ? this.sessions.get() : null;
    const token = session?.token;

    let response: Response;
    try {
      response = await this.fetchFromBase(this.baseUrl, path, method, body, token);
      this.activeUrl = this.baseUrl;
    } catch (primaryErr) {
      if (this.fallbackUrl && this.fallbackUrl !== this.baseUrl) {
        try {
          response = await this.fetchFromBase(this.fallbackUrl, path, method, body, token);
          this.activeUrl = this.fallbackUrl;
        } catch {
          throw new ApiError('No se pudo conectar con el backend en Render ni con Vercel.', 0);
        }
      } else {
        throw new ApiError('No se pudo conectar con el backend de BellaStyle.', 0);
      }
    }

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
  }
}
