import type {
  BellaSession,
  ServicioBella,
  EstilistaBella,
  ProductoBella,
  CitaBella,
  CompraProductoBella,
  ItemCarritoBella,
} from '../../domain/model/BellaModels';
import type { SessionStore } from '../../domain/ports/out/SessionStore';
import { HttpClient } from '../../adapters/http/HttpClient';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  user?: BellaSession;
}

// Servicio de Aplicación que orquesta todos los casos de uso de BellaStyle Mobile
// contra los mismos endpoints del backend (/api/login, /api/servicios, /api/citas, /api/carrito/comprar, etc.)
export class BellaApplicationService {
  constructor(
    private readonly http: HttpClient,
    private readonly sessions: SessionStore
  ) {}

  currentSession(): BellaSession | null {
    return this.sessions.get();
  }

  logout(): void {
    this.sessions.clear();
  }

  async login(params: { username: string; password: string; rol: 'cliente' | 'estilista' | 'admin' }): Promise<BellaSession> {
    const res = await this.http.request<ApiEnvelope<never>>('/login', 'POST', params, false);
    if (!res.user) {
      throw new Error(res.message || 'No se pudo iniciar sesión.');
    }
    this.sessions.save(res.user);
    return res.user;
  }

  async registrarClienta(params: {
    nombre: string;
    username: string;
    password: string;
    telefono: string;
    email: string;
  }): Promise<string> {
    const res = await this.http.request<ApiEnvelope<never>>(
      '/register',
      'POST',
      { ...params, rol: 'cliente' },
      false
    );
    return res.message || 'Cuenta creada con éxito.';
  }

  async listarServicios(): Promise<ServicioBella[]> {
    const res = await this.http.request<ApiEnvelope<ServicioBella[]>>('/servicios', 'GET', undefined, false);
    return res.data || [];
  }

  async listarEstilistas(): Promise<EstilistaBella[]> {
    const res = await this.http.request<ApiEnvelope<EstilistaBella[]>>('/estilistas', 'GET', undefined, false);
    return res.data || [];
  }

  async listarProductos(): Promise<ProductoBella[]> {
    const res = await this.http.request<ApiEnvelope<ProductoBella[]>>('/productos', 'GET', undefined, false);
    return res.data || [];
  }

  async listarCitas(): Promise<CitaBella[]> {
    const sesion = this.currentSession();
    if (!sesion) return [];
    const res = await this.http.request<ApiEnvelope<CitaBella[]>>(
      `/citas?rol=${encodeURIComponent(sesion.rol)}&idUsuario=${sesion.id}`
    );
    return res.data || [];
  }

  async crearCita(params: {
    idServicio: number;
    idEstilista: number;
    fecha: string;
    hora: string;
    observaciones?: string;
    metodoPago?: string;
  }): Promise<string> {
    const sesion = this.currentSession();
    if (!sesion) throw new Error('Inicia sesión para agendar tu cita.');
    const res = await this.http.request<ApiEnvelope<never>>('/citas', 'POST', {
      idUsuario: sesion.id,
      ...params,
    });
    return res.message || 'Cita agendada correctamente.';
  }

  async cambiarEstadoCita(idCita: number, estado: string): Promise<string> {
    const res = await this.http.request<ApiEnvelope<never>>(`/citas/${idCita}/estado`, 'PUT', { estado });
    return res.message || 'Estado actualizado.';
  }

  async calificarCita(idCita: number, calificacion: number, comentario: string): Promise<string> {
    const res = await this.http.request<ApiEnvelope<never>>(`/citas/${idCita}/calificar`, 'PUT', {
      calificacion,
      comentario,
    });
    return res.message || 'Calificación publicada en tiempo real.';
  }

  // Carrito de compras multiproducto sincronizado con el inventario en tiempo real
  obtenerCarrito(): ItemCarritoBella[] {
    return this.sessions.getCart();
  }

  guardarCarrito(items: ItemCarritoBella[]): void {
    this.sessions.saveCart(items);
    window.dispatchEvent(new Event('cart-changed'));
  }

  agregarAlCarrito(producto: ProductoBella): void {
    const actual = this.obtenerCarrito();
    const existente = actual.find((it) => Number(it.id_producto) === Number(producto.id_producto));
    if (existente) {
      if (existente.cantidad < producto.stock) {
        existente.cantidad += 1;
      }
    } else if (producto.stock > 0) {
      actual.push({ id_producto: producto.id_producto, cantidad: 1 });
    }
    this.guardarCarrito(actual);
  }

  cambiarCantidadCarrito(idProducto: number, delta: number, stockMaximo = 99): void {
    let actual = this.obtenerCarrito();
    const item = actual.find((it) => Number(it.id_producto) === Number(idProducto));
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
      actual = actual.filter((it) => Number(it.id_producto) !== Number(idProducto));
    } else if (nueva <= stockMaximo) {
      item.cantidad = nueva;
    }
    this.guardarCarrito(actual);
  }

  vaciarCarrito(): void {
    this.guardarCarrito([]);
  }

  async pagarCarrito(metodoPago: string): Promise<string> {
    const sesion = this.currentSession();
    if (!sesion) throw new Error('Inicia sesión para completar tu compra.');
    const items = this.obtenerCarrito();
    if (items.length === 0) throw new Error('Tu carrito está vacío.');

    const res = await this.http.request<ApiEnvelope<never>>('/carrito/comprar', 'POST', {
      idUsuario: sesion.id,
      clienteNombre: sesion.nombre,
      items: items.map((it) => ({ idProducto: it.id_producto, cantidad: it.cantidad })),
      metodoPago,
    });
    this.vaciarCarrito();
    return res.message || 'Compra realizada y descontada del stock en tiempo real.';
  }

  async listarMisCompras(): Promise<CompraProductoBella[]> {
    const sesion = this.currentSession();
    if (!sesion) return [];
    const res = await this.http.request<ApiEnvelope<CompraProductoBella[]>>(`/compras?idUsuario=${sesion.id}`);
    return res.data || [];
  }

  async calificarCompra(idCompra: number, calificacion: number, comentario: string): Promise<string> {
    const res = await this.http.request<ApiEnvelope<never>>(`/compras/${idCompra}/calificar`, 'PUT', {
      calificacion,
      comentario,
    });
    return res.message || 'Evaluación de producto publicada en tiempo real.';
  }
}
