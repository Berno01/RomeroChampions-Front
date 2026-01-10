import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreatePagoDTO, PagoCreditoDTO, UpdatePagoDTO } from '../models/credito.models';
import { DeudorDTO, DeudaVentaDTO } from '../models/deuda.models';
import { SessionService } from '../../../core/services/session.service';

@Injectable({
  providedIn: 'root',
})
export class CreditosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/credito`;
  private sessionService = inject(SessionService);

  getHistorialPagos(
    idSucursal?: number,
    fecha?: string,
    fechaFin?: string
  ): Observable<PagoCreditoDTO[]> {
    let params = new HttpParams().set('idUsuario', this.sessionService.userId().toString());

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal.toString());
    }
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    if (fechaFin) {
      params = params.set('fecha_fin', fechaFin);
    }

    return this.http.get<PagoCreditoDTO[]>(this.apiUrl, { params });
  }

  getDeudores(): Observable<DeudorDTO[]> {
    const headers = { 'X-Usuario-Id': this.sessionService.userId().toString() };
    return this.http.get<DeudorDTO[]>(`${this.apiUrl}/deudores`, { headers });
  }

  getDeudasCliente(idCliente: number): Observable<DeudaVentaDTO[]> {
    const headers = { 'X-Usuario-Id': this.sessionService.userId().toString() };
    return this.http.get<DeudaVentaDTO[]>(
      `${this.apiUrl}/deudas/cliente/${idCliente}`,
      { headers }
    );
  }

  createPago(data: CreatePagoDTO): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Se implementará más adelante según el orden, pero dejo la estructura base pedida para "Acciones"
  updatePago(idPago: number, data: UpdatePagoDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${idPago}`, data);
  }

  deletePago(idPago: number): Observable<any> {
    // DELETE /api/credito/{idPago}?idUsuario=<id_usuario_logueado>
    const params = new HttpParams().set('idUsuario', this.sessionService.userId().toString());
    return this.http.delete(`${this.apiUrl}/${idPago}`, { params });
  }
}
