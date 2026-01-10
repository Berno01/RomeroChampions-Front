export interface PagoCreditoDTO {
  id_pago: number;
  id_venta: number;
  monto_pago: number;
  fecha_pago: string;
  nombre_cliente: string;
  nombre_sucursal: string;
  saldo_actual_venta: number;
  metodo_pago?: string; // Implicit in requirements "corregir método"
  observacion?: string; // Implicit in requirements "corregir observación"
  estado?: boolean; // To handle active status logic if needed
  id_usuario?: number;
}

export interface CreatePagoDTO {
  id_venta: number;
  monto_pago: number;
  metodo_pago: string;
  observacion?: string;
  id_usuario: number;
}

export interface UpdatePagoDTO {
  monto_pago: number;
  metodo_pago: string;
  observacion?: string;
  id_usuario: number;
}
