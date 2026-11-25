export type BellaRole = 'Clienta' | 'Estilista' | 'Administradora';

export interface BellaSession {
  id: number;
  nombre: string;
  username: string;
  rol: BellaRole;
  foto: string;
  token: string;
  puedeCrearAdmins?: boolean;
}

export interface ServicioBella {
  id_servicio: number;
  nombre: string;
  precio: number;
  duracion_min: number;
  estado: string;
  imagen?: string;
  subtitulo?: string;
}

export interface EstilistaBella {
  id_estilista: number;
  nombres: string;
  apellidos: string;
  especialidad: string;
  estado: string;
  servicios?: string;
  promedio_calificacion?: string;
}

export interface ProductoBella {
  id_producto: number;
  nombre: string;
  precio: number;
  stock: number;
  estado: string;
  imagen?: string;
  categoria?: string;
  descripcion?: string;
}

export interface CitaBella {
  id: number;
  id_cliente: number;
  cliente: string;
  id_estilista: number;
  estilista: string;
  id_servicio: number;
  servicio: string;
  precio: number;
  duracion_min: number;
  fecha: string;
  hora: string;
  estado: 'Pendiente' | 'Confirmada' | 'Finalizada' | 'Cancelada';
  observaciones?: string;
  estado_pago?: string;
  metodo_pago?: string;
  calificacion?: number | null;
  comentario_calificacion?: string | null;
}

export interface CompraProductoBella {
  id_compra: number;
  id_usuario: number;
  cliente_nombre: string;
  id_producto: number;
  producto_nombre: string;
  imagen?: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  metodo_pago: string;
  referencia_pago: string;
  fecha: string;
  hora: string;
  calificacion?: number | null;
  comentario_calificacion?: string | null;
}

export interface ItemCarritoBella {
  id_producto: number;
  cantidad: number;
}
