export interface DashboardKPIs {
  totalVentas: number;
  cantidadVentas: number;
  gananciaDevengada: number;
  gananciaCobrada: number;
  gananciaPendiente: number;
  unidadesVendidas: number;
}

export interface ApiDashboardKPIs {
  totalVentas?: number;
  total_ventas?: number;
  cantidadVentas?: number;
  cantidad_ventas?: number;
  gananciaDevengada?: number;
  ganancia_devengada?: number;
  gananciaCobrada?: number;
  ganancia_cobrada?: number;
  gananciaPendiente?: number;
  ganancia_pendiente?: number;
  unidadesVendidas?: number;
  unidades_vendidas?: number;
}

export interface GananciaSerieItem {
  fecha: string;
  gananciaDevengada: number;
  gananciaCobrada: number;
  gananciaPendiente: number;
}

export interface ApiGananciaSerieItem {
  fecha?: string;
  gananciaDevengada?: number;
  ganancia_devengada?: number;
  gananciaCobrada?: number;
  ganancia_cobrada?: number;
  gananciaPendiente?: number;
  ganancia_pendiente?: number;
}

export interface VentasPorHora {
  hora: number;
  cantidad: number;
}

export interface VentasPorCategoria {
  categoria: string;
  cantidad: number;
}

export interface MetodoPago {
  metodo: string;
  cantidad: number;
  porcentaje?: number; // Agregado para UI
}

export interface DistribucionTalla {
  talla: string;
  cantidad: number;
}

export interface StockCategoria {
  id_categoria: number;
  nombre_categoria: string;
  stock_total: number;
}

export interface TopProducto {
  nombre_modelo: string;
  subtitulo: string;
  cantidad_vendida: number;
  stock_actual: number;
  foto_url: string;
}

export interface DashboardFilters {
  idSucursal?: number;
  fechaInicio?: string;
  fechaFin?: string;
}
