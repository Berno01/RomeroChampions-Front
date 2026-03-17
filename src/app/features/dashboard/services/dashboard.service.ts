import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  DashboardKPIs,
  ApiDashboardKPIs,
  GananciaSerieItem,
  ApiGananciaSerieItem,
  VentasPorHora,
  VentasPorCategoria,
  MetodoPago,
  DistribucionTalla,
  TopProducto,
  StockCategoria,
  DashboardFilters,
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor() {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('idUsuario', '1');
  }

  private getParams(filters?: DashboardFilters): HttpParams {
    let params = new HttpParams();
    if (filters) {
      if (filters.idSucursal) params = params.set('idSucursal', filters.idSucursal.toString());
      if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
    }
    return params;
  }

  private toNumber(value: number | null | undefined): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private mapKPIs(payload: ApiDashboardKPIs): DashboardKPIs {
    return {
      totalVentas: this.toNumber(payload.totalVentas ?? payload.total_ventas),
      cantidadVentas: this.toNumber(payload.cantidadVentas ?? payload.cantidad_ventas),
      gananciaDevengada: this.toNumber(payload.gananciaDevengada ?? payload.ganancia_devengada),
      gananciaCobrada: this.toNumber(payload.gananciaCobrada ?? payload.ganancia_cobrada),
      gananciaPendiente: this.toNumber(payload.gananciaPendiente ?? payload.ganancia_pendiente),
      unidadesVendidas: this.toNumber(payload.unidadesVendidas ?? payload.unidades_vendidas),
    };
  }

  private mapGananciaSerie(items: ApiGananciaSerieItem[]): GananciaSerieItem[] {
    return (items ?? []).map((item) => ({
      fecha: item.fecha || '',
      gananciaDevengada: this.toNumber(item.gananciaDevengada ?? item.ganancia_devengada),
      gananciaCobrada: this.toNumber(item.gananciaCobrada ?? item.ganancia_cobrada),
      gananciaPendiente: this.toNumber(item.gananciaPendiente ?? item.ganancia_pendiente),
    }));
  }

  getKPIs(filters?: DashboardFilters): Observable<DashboardKPIs> {
    return this.http
      .get<ApiDashboardKPIs>(`${this.apiUrl}/kpis`, {
        headers: this.getHeaders(),
        params: this.getParams(filters),
      })
      .pipe(map((payload) => this.mapKPIs(payload || {})));
  }

  getGananciaSerie(filters?: DashboardFilters): Observable<GananciaSerieItem[]> {
    const params = this.getParams(filters);

    return this.http
      .get<ApiGananciaSerieItem[]>(`${this.apiUrl}/ganancias-serie`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map((items) => this.mapGananciaSerie(items || [])),
        catchError(() =>
          this.http
            .get<ApiGananciaSerieItem[]>(`${this.apiUrl}/ganancias-por-periodo`, {
              headers: this.getHeaders(),
              params,
            })
            .pipe(
              map((items) => this.mapGananciaSerie(items || [])),
              catchError(() => of([])),
            ),
        ),
      );
  }

  getVentasPorHora(filters?: DashboardFilters): Observable<VentasPorHora[]> {
    return this.http.get<VentasPorHora[]>(`${this.apiUrl}/ventas-por-hora`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getVentasPorCategoria(filters?: DashboardFilters): Observable<VentasPorCategoria[]> {
    return this.http.get<VentasPorCategoria[]>(`${this.apiUrl}/ventas-por-categoria`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getMetodosPago(filters?: DashboardFilters): Observable<MetodoPago[]> {
    return this.http.get<MetodoPago[]>(`${this.apiUrl}/metodos-pago`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getDistribucionTallas(filters?: DashboardFilters): Observable<DistribucionTalla[]> {
    return this.http.get<DistribucionTalla[]>(`${this.apiUrl}/distribucion-tallas`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getTopProductos(filters?: DashboardFilters): Observable<TopProducto[]> {
    return this.http.get<TopProducto[]>(`${this.apiUrl}/top-productos`, {
      headers: this.getHeaders(),
      params: this.getParams(filters),
    });
  }

  getStockPorCategoria(idSucursal?: number): Observable<StockCategoria[]> {
    let params = new HttpParams();
    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }
    return this.http.get<StockCategoria[]>(`${this.apiUrl}/stock/categorias`, {
      headers: this.getHeaders(),
      params: params,
    });
  }

  // Helpers de Fechas
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getRangoHoy(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const fecha = this.formatDate(hoy);
    return { fechaInicio: fecha, fechaFin: fecha };
  }

  getRangoEsteMes(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return {
      fechaInicio: this.formatDate(inicio),
      fechaFin: this.formatDate(hoy),
    };
  }

  getRangoUltimos7Dias(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - 7);
    return {
      fechaInicio: this.formatDate(inicio),
      fechaFin: this.formatDate(hoy),
    };
  }
}
