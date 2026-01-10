import { Component, signal, inject, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientesService } from '../../../../core/services/clientes.service';
import { ClienteDTO, CreateClienteDTO } from '../../../../core/models/cliente.models';
import { SessionService } from '../../../../core/services/session.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-client-selector-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      (click)="onClose()"
    >
      <div
        class="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 class="text-lg font-bold text-gray-900 tracking-wide">
            {{
              viewMode() === 'list'
                ? 'SELECCIONAR CLIENTE'
                : editingId()
                ? 'EDITAR CLIENTE'
                : 'NUEVO CLIENTE'
            }}
          </h2>
          <button class="text-gray-400 hover:text-black transition-colors" (click)="onClose()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <!-- LIST VIEW -->
          @if (viewMode() === 'list') {
          <!-- Search & Actions -->
          <div class="p-4 border-b border-gray-100 bg-gray-50 flex gap-3">
            <div class="relative flex-1">
              <svg
                class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
              />
            </div>
            <button
              class="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-colors whitespace-nowrap"
              (click)="onNewClient()"
            >
              + NUEVO
            </button>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto p-4">
            @if (isLoading()) {
            <div class="flex justify-center py-8">
              <div
                class="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"
              ></div>
            </div>
            } @else if (clientes().length === 0) {
            <div class="text-center py-12 text-gray-400">
              <p>No se encontraron clientes.</p>
            </div>
            } @else {
            <div class="space-y-2">
              @for (cliente of clientes(); track cliente.id_cliente) {
              <div
                class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-black hover:shadow-sm transition-all group"
              >
                <div class="flex-1 cursor-pointer" (click)="selectCliente.emit(cliente)">
                  <h3 class="font-bold text-gray-900">{{ cliente.nombre_completo }}</h3>
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        ></path>
                      </svg>
                      {{ cliente.celular || 'S/N' }}
                    </span>
                    @if(cliente.lugar_trabajo) {
                    <span class="flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        ></path>
                      </svg>
                      {{ cliente.lugar_trabajo }}
                    </span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 border-l border-gray-100 pl-3 ml-3">
                  <button
                    class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                    (click)="onEditClient(cliente); $event.stopPropagation()"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      ></path>
                    </svg>
                  </button>
                  <button
                    class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                    (click)="onDeleteClient(cliente); $event.stopPropagation()"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
              }
            </div>
            }
          </div>
          }

          <!-- FORM VIEW -->
          @else {
          <div class="flex-1 overflow-y-auto p-6">
            <form class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase"
                  >Nombre Completo *</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.nombre_completo"
                  name="nombre_completo"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black outline-none text-sm"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase"
                  >Celular *</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.celular"
                  name="celular"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black outline-none text-sm"
                  placeholder="Ej. 77712345"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase"
                  >Lugar de Trabajo</label
                >
                <input
                  type="text"
                  [(ngModel)]="formData.lugar_trabajo"
                  name="lugar_trabajo"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black outline-none text-sm"
                  placeholder="Ej. Banco Union"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1 uppercase"
                  >Dirección Casa</label
                >
                <textarea
                  [(ngModel)]="formData.direccion_casa"
                  name="direccion_casa"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black outline-none text-sm resize-none"
                  placeholder="Ej. Av. Principal #123"
                ></textarea>
              </div>
            </form>
          </div>

          <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
              (click)="onCancelForm()"
            >
              CANCELAR
            </button>
            <button
              class="px-6 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
              [disabled]="isSaving()"
              (click)="onSaveClient()"
            >
              {{ isSaving() ? 'GUARDANDO...' : 'GUARDAR' }}
            </button>
          </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ClientSelectorModalComponent {
  private clientesService = inject(ClientesService);
  private sessionService = inject(SessionService);
  private toastService = inject(ToastService);

  // Outputs
  close = output<void>();
  selectCliente = output<ClienteDTO>();

  // State
  viewMode = signal<'list' | 'form'>('list');
  clientes = signal<ClienteDTO[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  searchQuery = signal<string>('');

  // Form State
  editingId = signal<number | null>(null);
  formData: any = {
    nombre_completo: '',
    celular: '',
    lugar_trabajo: '',
    direccion_casa: '',
  };

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        takeUntilDestroyed(),
        debounceTime(300),
        switchMap((query) => {
          this.isLoading.set(true);
          return query.trim()
            ? this.clientesService.searchClientes(query)
            : this.clientesService.getAllClientes();
        })
      )
      .subscribe({
        next: (data) => {
          this.clientes.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
        },
      });

    // Initial Load
    this.refreshList();
  }

  onClose() {
    this.close.emit();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  refreshList() {
    this.searchSubject.next(this.searchQuery());
  }

  onNewClient() {
    this.resetForm();
    this.viewMode.set('form');
  }

  onEditClient(cliente: ClienteDTO) {
    this.editingId.set(cliente.id_cliente);
    this.formData = {
      nombre_completo: cliente.nombre_completo,
      celular: cliente.celular,
      lugar_trabajo: cliente.lugar_trabajo || '',
      direccion_casa: cliente.direccion_casa || '',
    };
    this.viewMode.set('form');
  }

  onDeleteClient(cliente: ClienteDTO) {
    if (confirm(`¿Seguro que desea desactivar al cliente ${cliente.nombre_completo}?`)) {
      this.clientesService.deleteCliente(cliente.id_cliente).subscribe({
        next: () => {
          this.toastService.success('Cliente eliminado correctamente');
          this.refreshList();
        },
        error: (err) => this.toastService.error('Error al eliminar cliente'),
      });
    }
  }

  onCancelForm() {
    this.viewMode.set('list');
    this.resetForm();
  }

  resetForm() {
    this.editingId.set(null);
    this.formData = {
      nombre_completo: '',
      celular: '',
      lugar_trabajo: '',
      direccion_casa: '',
    };
    this.isSaving.set(false);
  }

  onSaveClient() {
    if (!this.formData.nombre_completo || !this.formData.celular) {
      this.toastService.warning('Nombre y Celular son obligatorios');
      return;
    }

    this.isSaving.set(true);
    const payload: CreateClienteDTO = {
      ...this.formData,
      registrado_por: this.sessionService.userId(),
    };

    const request$ = this.editingId()
      ? this.clientesService.updateCliente(this.editingId()!, payload)
      : this.clientesService.createCliente(payload);

    request$.subscribe({
      next: (cliente) => {
        this.toastService.success(this.editingId() ? 'Cliente actualizado' : 'Cliente creado');
        this.isSaving.set(false);

        // If created new, select it automatically? The user said "use that same philosophy" (Catalogue modals usually just creating/editing).
        // Let's go back to list to allow selection, OR select immediately.
        // Typically better to select immediately if created in this context.
        // BUT the requirement says "assignle el cliente...". So if I create it, I probably want to use it.
        // Let's emit selection if created new, or just return to list?
        // Let's return to list and highlight/refresh to be safe. Or better:

        if (!this.editingId()) {
          // New client created
          this.selectCliente.emit(cliente);
          // Close? No, maybe they want to verify. But usually "Create on the fly" means "Create and Select".
          // Let's emit select and close could be handled by parent or just emit.
        } else {
          this.viewMode.set('list');
          this.refreshList();
        }
      },
      error: (err) => {
        this.toastService.error('Error al guardar cliente');
        this.isSaving.set(false);
      },
    });
  }
}
