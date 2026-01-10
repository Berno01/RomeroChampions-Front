import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpdatePagoDTO, PagoCreditoDTO } from '../../models/credito.models';

@Component({
  selector: 'app-edit-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div class="bg-white w-full max-w-sm rounded-lg shadow-xl overflow-hidden p-6 mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">Editar Pago #{{ pago?.id_pago }}</h3>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Monto -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Monto (Bs.)</label>
            <input
              type="number"
              [(ngModel)]="monto"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
              placeholder="0.00"
            />
            <p class="text-xs text-gray-500 mt-1">
              Saldo antes del pago:
              {{ (pago?.saldo_actual_venta || 0) + (pago?.monto_pago || 0) | number : '1.2-2' }}
            </p>
          </div>

          <!-- Metodo -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
              >Método de Pago</label
            >
            <select
              [(ngModel)]="metodo"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="QR">QR</option>
              <option value="TARJETA">TARJETA</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
            </select>
          </div>

          <!-- Observacion -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Observación</label>
            <textarea
              [(ngModel)]="observacion"
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black text-sm"
              placeholder="Detalle del pago..."
            ></textarea>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              type="button"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
              (click)="close.emit()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 bg-black text-white font-bold rounded hover:opacity-90"
              (click)="onSave()"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EditPagoModalComponent {
  @Input() set pagoData(value: PagoCreditoDTO | null) {
    this.pago = value;
    if (value) {
      this.monto.set(value.monto_pago);
      this.metodo.set(value.metodo_pago || 'EFECTIVO');
      this.observacion.set(value.observacion || '');
    }
  }

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<UpdatePagoDTO>();

  pago: PagoCreditoDTO | null = null;

  monto = signal<number>(0);
  metodo = signal<string>('EFECTIVO');
  observacion = signal<string>('');

  onSave() {
    if (this.monto() <= 0) return;

    // Aquí se podrían agregar validaciones extra contra el saldo si tuviéramos toda la info histórica
    // Por ahora confiamos en el backend o en una validación simple visual

    this.save.emit({
      monto_pago: this.monto(),
      metodo_pago: this.metodo(),
      observacion: this.observacion(),
      id_usuario: 0, // Se setea en el servicio o container
    });
  }
}
