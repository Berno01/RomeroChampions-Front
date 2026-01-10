export interface DeudorDTO {
  id_cliente: number;
  nombre_completo: string;
  cantidad_ventas_pendientes: number;
  total_deuda: number;
  proximo_vencimiento: string;
}

export interface DeudaVentaDTO {
  id_venta: number;
  fecha_venta: string;
  fecha_limite: string;
  saldo_pendiente: number;
  cantidad_items: number;
  total_original: number;
}
