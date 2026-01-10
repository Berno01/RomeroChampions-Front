import { Component, EventEmitter, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditosService } from '../../services/creditos.service';
import { DeudorDTO, DeudaVentaDTO } from '../../models/deuda.models';
import { CreatePagoDTO } from '../../models/credito.models';
import { SessionService } from '../../../../core/services/session.service';

type WizardStep = 'SELECT_DEUDOR' | 'SELECT_DEUDA' | 'CONFIRM_PAGO';

@Component({
  selector: 'app-nuevo-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        class="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Registrar Nuevo Pago</h2>
            <p class="text-sm text-gray-500">
              @if (currentStep() === 'SELECT_DEUDOR') { Paso 1: Seleccionar Cliente } @else if
              (currentStep() === 'SELECT_DEUDA') { Paso 2: Seleccionar Deuda } @else { Paso 3:
              Confirmar Pago }
            </p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-auto bg-gray-50 p-6">
          <!-- STEP 1: SELECT DEUDOR -->
          @if (currentStep() === 'SELECT_DEUDOR') {
          <div class="space-y-4">
            <!-- Search -->
            <input
              type="text"
              placeholder="Buscar cliente por nombre..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-black focus:border-black"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
            />

            <!-- List -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (deudor of filteredDeudores(); track deudor.id_cliente) {
              <div
                class="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer hover:border-black hover:shadow-md transition-all group"
                (click)="selectDeudor(deudor)"
              >
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-bold text-gray-900 group-hover:text-black">
                    {{ deudor.nombre_completo }}
                  </h3>
                  <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                    {{ deudor.cantidad_ventas_pendientes }} ventas
                  </span>
                </div>

                <div class="pt-3 border-t border-gray-100 flex justify-between items-end">
                  <span class="text-xs text-gray-500">Deuda Total:</span>
                  <span class="text-lg font-bold text-red-600"
                    >Bs. {{ deudor.total_deuda | number : '1.2-2' }}</span
                  >
                </div>
              </div>
              } @empty {
              <div class="col-span-full py-10 text-center text-gray-500">
                No se encontraron deudores con ese criterio.
              </div>
              }
            </div>
          </div>
          }

          <!-- STEP 2: SELECT DEUDA -->
          @if (currentStep() === 'SELECT_DEUDA') {
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <button
                (click)="goBack()"
                class="text-sm text-gray-500 hover:text-black hover:underline flex items-center gap-1"
              >
                ← Volver a clientes
              </button>
              <span class="text-gray-300">|</span>
              <span class="font-bold text-gray-900">{{ selectedDeudor()?.nombre_completo }}</span>
            </div>

            <div class="grid grid-cols-1 gap-3">
              @for (venta of deudasCliente(); track venta.id_venta) {
              <div
                class="bg-white p-4 rounded-lg border border-gray-200 hover:border-black cursor-pointer shadow-sm transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                (click)="selectVenta(venta)"
              >
                <div>
                  <h4 class="font-bold text-gray-900">Venta #{{ venta.id_venta }}</h4>
                  <p class="text-xs text-gray-500">
                    Fecha: {{ venta.fecha_venta | date : 'dd/MM/yyyy HH:mm' }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Total Original:
                    <span class="font-medium"
                      >Bs. {{ venta.total_original | number : '1.2-2' }}</span
                    >
                    • Items: {{ venta.cantidad_items }}
                  </p>
                </div>

                <div class="text-right">
                  <span class="block text-xs text-gray-500 uppercase font-bold tracking-wider"
                    >Saldo Pendiente</span
                  >
                  <span class="text-xl font-bold text-red-600"
                    >Bs. {{ venta.saldo_pendiente | number : '1.2-2' }}</span
                  >
                </div>
              </div>
              } @empty {
              <div
                class="py-10 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300"
              >
                Cargando deudas o el cliente no tiene saldos pendientes.
              </div>
              }
            </div>
          </div>
          }

          <!-- STEP 3: CONFIRM PAGO -->
          @if (currentStep() === 'CONFIRM_PAGO') {
          <div class="max-w-md mx-auto space-y-6">
            <div class="text-center">
              <h3 class="text-lg font-bold text-gray-900">Confirmar Pago</h3>
              <p class="text-sm text-gray-500">
                Venta #{{ selectedVenta()?.id_venta }} • Cliente:
                {{ selectedDeudor()?.nombre_completo }}
              </p>
            </div>

            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
              <div
                class="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100"
              >
                <span class="text-sm font-medium text-red-800">Saldo Pendiente Actual</span>
                <span class="text-lg font-bold text-red-800"
                  >Bs. {{ selectedVenta()?.saldo_pendiente | number : '1.2-2' }}</span
                >
              </div>

              <!-- Form -->
              <div class="space-y-4">
                <!-- Monto -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
                    >Monto a Pagar (Bs)</label
                  >
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold"
                      >Bs.</span
                    >
                    <input
                      type="number"
                      [ngModel]="montoPagar()"
                      (ngModelChange)="montoPagar.set($event)"
                      class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="0.00"
                    />
                  </div>
                  @if (montoError()) {
                  <p class="text-xs text-red-600 mt-1 font-medium">{{ montoError() }}</p>
                  }
                </div>

                <!-- Metodo -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
                    >Método de Pago</label
                  >
                  <select
                    [ngModel]="metodoPago()"
                    (ngModelChange)="metodoPago.set($event)"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  >
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="QR">QR</option>
                    <option value="TARJETA">TARJETA</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  </select>
                </div>

                <!-- Observacion -->
                <div>
                  <label class="block text-xs font-bold text-gray-500 uppercase mb-1"
                    >Observación (Opcional)</label
                  >
                  <textarea
                    [ngModel]="observacion()"
                    (ngModelChange)="observacion.set($event)"
                    rows="2"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none text-sm"
                    placeholder="Nota sobre el pago..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                (click)="goBack()"
              >
                Atrás
              </button>
              <button
                type="button"
                class="flex-1 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="!!montoError() || montoPagar() <= 0 || processing()"
                (click)="confirmarPago()"
              >
                @if(processing()) { Procesando... } @else { Confirmar Pago }
              </button>
            </div>
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class NuevoPagoModalComponent {
  private creditosService = inject(CreditosService);
  private sessionService = inject(SessionService);

  @Output() close = new EventEmitter<void>();
  @Output() pagoCreated = new EventEmitter<void>();

  // State
  currentStep = signal<WizardStep>('SELECT_DEUDOR');
  searchTerm = signal<string>('');
  processing = signal<boolean>(false);

  // Data
  deudores = signal<DeudorDTO[]>([]);
  deudasCliente = signal<DeudaVentaDTO[]>([]);

  // Selection
  selectedDeudor = signal<DeudorDTO | null>(null);
  selectedVenta = signal<DeudaVentaDTO | null>(null);

  // Form
  montoPagar = signal<number>(0);
  metodoPago = signal<string>('EFECTIVO');
  observacion = signal<string>('');

  // Computed
  filteredDeudores = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.deudores();
    return this.deudores().filter((d) => d.nombre_completo.toLowerCase().includes(term));
  });

  montoError = computed(() => {
    const monto = this.montoPagar();
    const venta = this.selectedVenta();
    if (!venta) return '';
    if (monto <= 0) return 'El monto debe ser mayor a 0.';
    if (monto > venta.saldo_pendiente)
      return `El monto excede el saldo pendiente (Bs. ${venta.saldo_pendiente}).`;
    return '';
  });

  constructor() {
    this.loadDeudores();
  }

  loadDeudores() {
    this.creditosService.getDeudores().subscribe({
      next: (data) => this.deudores.set(data),
      error: (err) => console.error('Error cargando deudores', err),
    });
  }

  selectDeudor(deudor: DeudorDTO) {
    this.selectedDeudor.set(deudor);
    this.currentStep.set('SELECT_DEUDA');

    // Load deudas
    this.creditosService.getDeudasCliente(deudor.id_cliente).subscribe({
      next: (data) => this.deudasCliente.set(data),
      error: (err) => console.error('Error cargando deudas', err),
    });
  }

  selectVenta(venta: DeudaVentaDTO) {
    this.selectedVenta.set(venta);
    this.montoPagar.set(venta.saldo_pendiente); // Pre-fill con saldo pendiente (opcional, pero buena UX)
    this.currentStep.set('CONFIRM_PAGO');
  }

  goBack() {
    if (this.currentStep() === 'CONFIRM_PAGO') {
      this.currentStep.set('SELECT_DEUDA');
      this.montoPagar.set(0);
    } else if (this.currentStep() === 'SELECT_DEUDA') {
      this.currentStep.set('SELECT_DEUDOR');
      this.selectedDeudor.set(null);
      this.deudasCliente.set([]);
    }
  }

  confirmarPago() {
    if (this.montoError()) return;

    this.processing.set(true);

    const payload: CreatePagoDTO = {
      id_venta: this.selectedVenta()!.id_venta,
      monto_pago: this.montoPagar(),
      metodo_pago: this.metodoPago(),
      observacion: this.observacion(),
      id_usuario: this.sessionService.userId(),
    };

    this.creditosService.createPago(payload).subscribe({
      next: () => {
        this.processing.set(false);
        this.pagoCreated.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creando pago', err);
        this.processing.set(false);
      },
    });
  }
}
