import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditosService } from '../services/creditos.service';
import { PagoCreditoDTO, UpdatePagoDTO } from '../models/credito.models';
import { SessionService } from '../../../core/services/session.service';
import { EditPagoModalComponent } from '../components/edit-pago-modal/edit-pago-modal.component';
import { NuevoPagoModalComponent } from '../components/nuevo-pago-modal/nuevo-pago-modal.component';

@Component({
  selector: 'app-creditos-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, EditPagoModalComponent, NuevoPagoModalComponent],
  template: `
    <div class="h-full flex flex-col bg-gray-50">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 px-4 py-4 md:px-6 md:py-5">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Título y Filtros -->
          <div class="space-y-4 md:space-y-0 md:flex md:items-center md:gap-6 flex-1">
            <h1 class="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
              Historial de Pagos
            </h1>

            <!-- Filtros Control Group -->
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Selector de Rango -->
              <div class="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                  [class.bg-white]="!dateRangeMode()"
                  [class.shadow-sm]="!dateRangeMode()"
                  [class.text-gray-900]="!dateRangeMode()"
                  [class.text-gray-500]="dateRangeMode()"
                  (click)="toggleDateMode(false)"
                >
                  Día
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all"
                  [class.bg-white]="dateRangeMode()"
                  [class.shadow-sm]="dateRangeMode()"
                  [class.text-gray-900]="dateRangeMode()"
                  [class.text-gray-500]="!dateRangeMode()"
                  (click)="toggleDateMode(true)"
                >
                  Rango
                </button>
              </div>

              <!-- Inputs de Fecha -->
              <div class="flex items-center gap-2">
                <input
                  type="date"
                  [ngModel]="dateStart()"
                  (ngModelChange)="onDateChange($event, 'start')"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                @if (dateRangeMode()) {
                <span class="text-gray-400">-</span>
                <input
                  type="date"
                  [ngModel]="dateEnd()"
                  (ngModelChange)="onDateChange($event, 'end')"
                  class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                />
                }
              </div>

              <!-- Filtro Sucursal (Por defecto todas) -->
              <select
                [ngModel]="selectedBranch()"
                (ngModelChange)="onBranchChange($event)"
                class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option [value]="null">Todas las Sucursales</option>
                <option [value]="1">Sucursal Central</option>
                <option [value]="2">Sucursal 2</option>
                <!-- Idealmente esto vendría de un servicio de sucursales -->
              </select>
            </div>
          </div>

          <!-- Botón Nuevo Pago -->
          <button
            type="button"
            class="flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 transition-colors px-4 py-2 rounded-lg font-semibold text-sm shadow-sm"
            (click)="onNewPayment()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Registro de Pago</span>
          </button>
        </div>
      </div>

      <!-- Tabla Content -->
      <div class="flex-1 overflow-auto p-4 md:p-6">
        <!-- Desktop Table -->
        <div
          class="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider"
              >
                <th class="px-6 py-3 font-semibold">Fecha y Venta</th>
                <th class="px-6 py-3 font-semibold">Cliente / Sucursal</th>
                <th class="px-6 py-3 font-semibold">Método</th>
                <th class="px-6 py-3 font-semibold text-right">Monto</th>
                <th class="px-6 py-3 font-semibold text-right">Saldo Restante</th>
                <th class="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (pago of pagos(); track pago.id_pago) {
              <tr class="hover:bg-gray-50 transition-colors group text-sm">
                <!-- Fecha y Venta -->
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">
                      {{ pago.fecha_pago | date : 'dd/MM/yyyy HH:mm' }}
                    </span>
                    <span class="text-xs text-gray-500"> Venta #{{ pago.id_venta }} </span>
                  </div>
                </td>

                <!-- Cliente / Sucursal -->
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900">{{ pago.nombre_cliente }}</span>
                    <span class="text-xs text-gray-500">{{ pago.nombre_sucursal }}</span>
                  </div>
                </td>

                <!-- Método -->
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                  >
                    {{ pago.metodo_pago || 'EFECTIVO' }}
                  </span>
                  @if (pago.observacion) {
                  <div
                    class="mt-1 text-xs text-gray-500 max-w-[150px] truncate"
                    title="{{ pago.observacion }}"
                  >
                    {{ pago.observacion }}
                  </div>
                  }
                </td>

                <!-- Monto -->
                <td class="px-6 py-4 text-right font-medium text-gray-900">
                  Bs. {{ pago.monto_pago | number : '1.2-2' }}
                </td>

                <!-- Saldo Restante -->
                <td class="px-6 py-4 text-right">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class.bg-red-50]="pago.saldo_actual_venta > 0"
                    [class.text-red-700]="pago.saldo_actual_venta > 0"
                    [class.bg-green-50]="pago.saldo_actual_venta <= 0"
                    [class.text-green-700]="pago.saldo_actual_venta <= 0"
                  >
                    {{
                      pago.saldo_actual_venta > 0
                        ? 'Pend. Bs. ' + (pago.saldo_actual_venta | number : '1.2-2')
                        : 'Pagado'
                    }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 text-right">
                  <div
                    class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      class="text-gray-400 hover:text-black p-1 rounded hover:bg-gray-100"
                      title="Editar Pago"
                      (click)="onEdit(pago)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      class="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                      title="Eliminar Pago"
                      (click)="onDelete(pago)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              } @empty {
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                  <div class="flex flex-col items-center">
                    <svg
                      class="w-12 h-12 text-gray-300 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p>No se encontraron pagos en este rango de fechas.</p>
                  </div>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden space-y-3">
          @for (pago of pagos(); track pago.id_pago) {
          <div
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
            (click)="onEdit(pago)"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                <span class="text-sm font-semibold text-gray-900">
                  {{ pago.fecha_pago | date : 'dd/MM/yyyy HH:mm' }}
                </span>
              </div>
              <span class="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                Venta #{{ pago.id_venta }}
              </span>
            </div>

            <!-- Cliente -->
            <div class="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <svg
                class="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <span class="text-sm text-gray-700 font-medium">{{ pago.nombre_cliente }}</span>
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div>
                <span class="text-gray-500 uppercase tracking-wide text-[10px]">Sucursal</span>
                <p class="text-gray-900 font-medium mt-0.5">{{ pago.nombre_sucursal }}</p>
              </div>
              <div>
                <span class="text-gray-500 uppercase tracking-wide text-[10px]">Método</span>
                <p class="mt-0.5">
                  <span
                    class="px-2 py-0.5 bg-gray-100 rounded text-gray-800 font-medium border border-gray-200"
                  >
                    {{ pago.metodo_pago || 'EFECTIVO' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Footer info -->
            <div class="bg-gray-50 rounded p-3 text-xs space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-gray-600 font-medium uppercase tracking-wide">Monto Pagado</span>
                <span class="text-base font-bold text-gray-900"
                  >Bs. {{ pago.monto_pago | number : '1.2-2' }}</span
                >
              </div>

              <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                <span class="text-gray-500">Saldo Restante Venta</span>
                <span
                  class="px-2 py-0.5 rounded-full font-bold"
                  [class.text-red-600]="pago.saldo_actual_venta > 0"
                  [class.bg-red-50]="pago.saldo_actual_venta > 0"
                  [class.text-green-600]="pago.saldo_actual_venta <= 0"
                  [class.bg-green-50]="pago.saldo_actual_venta <= 0"
                >
                  {{
                    pago.saldo_actual_venta > 0
                      ? 'Bs. ' + (pago.saldo_actual_venta | number : '1.2-2')
                      : 'CUBIERTO'
                  }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3 mt-3 pt-2 border-t border-gray-100">
              <button
                class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-black py-1 px-2"
                (click)="onEdit(pago); $event.stopPropagation()"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Editar
              </button>
              <button
                class="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 py-1 px-2"
                (click)="onDelete(pago); $event.stopPropagation()"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Eliminar
              </button>
            </div>
          </div>
          } @empty {
          <div class="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
            <p class="text-gray-500 text-sm">No hay pagos registrados.</p>
          </div>
          }
        </div>
      </div>
    </div>

    <!-- Modal Editar Pago -->
    @if (editingPago()) {
    <app-edit-pago-modal
      [pagoData]="editingPago()"
      (close)="editingPago.set(null)"
      (save)="onSaveEdit($event)"
    ></app-edit-pago-modal>
    }

    <!-- Modal Nuevo Pago (Wizard) -->
    @if (showNewPagoModal()) {
    <app-nuevo-pago-modal
      (close)="showNewPagoModal.set(false)"
      (pagoCreated)="onPagoCreated()"
    ></app-nuevo-pago-modal>
    }
  `,
})
export class CreditosLayoutComponent implements OnInit {
  private creditosService = inject(CreditosService);
  private sessionService = inject(SessionService);

  // Filtros Signals
  dateRangeMode = signal<boolean>(false);
  dateStart = signal<string>(new Date().toISOString().substring(0, 10));
  dateEnd = signal<string>(new Date().toISOString().substring(0, 10));
  selectedBranch = signal<number | null>(null);

  // Data Signals
  pagos = signal<PagoCreditoDTO[]>([]);
  editingPago = signal<PagoCreditoDTO | null>(null);
  showNewPagoModal = signal<boolean>(false);

  ngOnInit() {
    this.refreshData();
  }

  toggleDateMode(range: boolean) {
    this.dateRangeMode.set(range);
    // Si cambia a modo single, igualamos end a start para consistencia visual
    if (!range) {
      this.dateEnd.set(this.dateStart());
    }
    this.refreshData();
  }

  onDateChange(value: string, type: 'start' | 'end') {
    if (type === 'start') {
      this.dateStart.set(value);
      // Si no es rango, end se mueve con start
      if (!this.dateRangeMode()) {
        this.dateEnd.set(value);
      }
    } else {
      this.dateEnd.set(value);
    }
    this.refreshData();
  }

  onBranchChange(value: number | null) {
    // Select devuelve string si viene del DOM, asegurar number o null
    const val = value ? Number(value) : null;
    this.selectedBranch.set(val);
    this.refreshData();
  }

  refreshData() {
    // Si estamos en modo "Dia", solo mandamos fecha start (el backend filtra ese dia)
    // O mandamos start == end. El servicio soporta fecha y fecha_fin.
    // Si mandamos solo fecha, asumo que el backend filtra >= fecha.
    // Para simplificar: mandaremos siempre fecha (start) y fecha_fin (end) para cubrir el rango completo (00:00 a 23:59 implicitamente en backend o explicito)

    // NOTA: El usuario dijo "filtra por fecha o rango".
    const start = this.dateStart();
    const end = this.dateEnd();
    const branch = this.selectedBranch() ? this.selectedBranch()! : undefined;

    this.creditosService.getHistorialPagos(branch, start, end).subscribe({
      next: (data) => this.pagos.set(data),
      error: (err) => console.error('Error cargando pagos', err),
    });
  }

  onNewPayment() {
    this.showNewPagoModal.set(true);
  }

  onPagoCreated() {
    this.showNewPagoModal.set(false);
    this.refreshData(); // Recargar historial automáticamente
  }

  onEdit(pago: PagoCreditoDTO) {
    this.editingPago.set(pago);
  }

  onSaveEdit(data: UpdatePagoDTO) {
    const current = this.editingPago();
    if (!current) return;

    // Inyectar el ID de usuario desde session
    data.id_usuario = this.sessionService.userId();

    this.creditosService.updatePago(current.id_pago, data).subscribe({
      next: () => {
        // Cerrar modal y refrescar
        this.editingPago.set(null);
        this.refreshData();
      },
      error: (err) => console.error('Error actualizando pago', err),
    });
  }

  onDelete(pago: PagoCreditoDTO) {
    if (
      confirm(
        `¿Está seguro de eliminar el pago de Bs. ${pago.monto_pago}? Esta acción recalculará la deuda.`
      )
    ) {
      this.creditosService.deletePago(pago.id_pago).subscribe({
        next: () => this.refreshData(),
        error: (err) => console.error('Error eliminando pago', err),
      });
    }
  }
}
