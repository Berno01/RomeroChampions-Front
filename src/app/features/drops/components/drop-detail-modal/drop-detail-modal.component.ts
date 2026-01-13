import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Drop, DetalleDrop } from '../../../../core/models/drops.models';
import { ModeloDetalleDrop } from '../../../../core/models/drops.models';
import { DropsService } from '../../../../core/services/drops.service';
import { catchError, of } from 'rxjs';

interface DetalleDropEnriquecido extends DetalleDrop {
  nombreModelo?: string;
  nombreMarca?: string;
  nombreColor?: string;
  nombreTalla?: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-drop-detail-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      (click)="onClose()"
    >
      <div
        class="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50"
        >
          <div>
            <h2 class="text-lg font-bold text-gray-900">Detalles de Recepción</h2>
            @if (drop()) {
            <p class="text-sm text-gray-500 mt-0.5">
              ID: #{{ drop()!.idRecepcion }} • {{ formatDate(drop()!.fecha) }}
            </p>
            }
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-900 transition-colors"
            (click)="onClose()"
          >
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
        <div class="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div
              class="h-12 w-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin"
            ></div>
          </div>
          } @else if (drop()) {
          <div class="space-y-6">
            <!-- Estado Anulada Banner -->
            @if (drop()!.estado === false) {
            <div class="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <span class="font-bold">RECEPCIÓN ANULADA</span>
              </div>
            </div>
            }

            <!-- Información General -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >Sucursal</label
                >
                <p class="text-sm font-medium text-gray-900 mt-1">
                  {{ getBranchName(drop()!.idSucursal) }}
                </p>
              </div>
              @if (drop()!.marca) {
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >Marca</label
                >
                <p class="text-sm font-medium text-gray-900 mt-1">{{ drop()!.marca }}</p>
              </div>
              } @if (drop()!.categorias && drop()!.categorias!.length > 0) {
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >Categorías</label
                >
                <p class="text-sm font-medium text-gray-900 mt-1">
                  {{ drop()!.categorias!.join(', ') }}
                </p>
              </div>
              }
            </div>

            <!-- Lista de Productos -->
            <div>
              <h3 class="text-sm font-bold text-gray-900 mb-3">Productos Recibidos</h3>
              <div class="space-y-3">
                @for (item of detallesEnriquecidos(); track $index) {
                <div class="flex gap-4 pb-3 border-b border-gray-100">
                  @if (item.fotoUrl) {
                  <img
                    [src]="resolveImageUrl(item.fotoUrl)"
                    [alt]="item.nombreModelo || 'Producto'"
                    class="w-16 h-20 object-cover bg-gray-200 flex-shrink-0"
                    onerror="this.onerror=null; this.src='/assets/images/placeholder-product.svg'"
                  />
                  } @else {
                  <div class="w-16 h-20 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    <svg
                      class="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  }
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-gray-900">
                      {{ item.nombreModelo || 'Cargando...' }}
                    </h4>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ item.nombreMarca || '-' }} / {{ item.nombreColor || '-' }} /
                      {{ item.nombreTalla || '-' }}
                    </p>
                    <div class="flex items-center gap-4 mt-2 text-xs">
                      <span class="text-gray-600">Cantidad: {{ item.cantidad }}</span>
                    </div>
                  </div>
                </div>
                }
              </div>
            </div>

            <!-- Total de Items -->
            <div class="border-t-2 border-gray-200 pt-4">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-gray-900">Total de Items</span>
                <span class="text-2xl font-bold text-gray-900">{{ getTotalItems() }}</span>
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            class="px-6 py-2 bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
            (click)="onClose()"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DropDetailModalComponent {
  private dropsService = inject(DropsService);

  // Inputs/Outputs
  dropId = input.required<number>();
  closed = output<void>();

  // Signals
  loading = signal<boolean>(true);
  drop = signal<Drop | null>(null);
  detallesEnriquecidos = signal<DetalleDropEnriquecido[]>([]);

  // Effect para cargar datos
  constructor() {
    effect(
      () => {
        const id = this.dropId();
        if (id) {
          this.loadDropDetails(id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  private loadDropDetails(id: number): void {
    this.loading.set(true);
    this.dropsService.getDropById(id).subscribe({
      next: (drop) => {
        this.drop.set(drop);
        this.enrichDetails(drop);
      },
      error: (err) => {
        console.error('Error cargando recepción:', err);
        this.loading.set(false);
      },
    });
  }

  private enrichDetails(drop: Drop): void {
    const detalles = drop.detalles || [];

    // 1. Mostrar datos básicos INMEDIATAMENTE
    const detallesBasicos: DetalleDropEnriquecido[] = detalles.map((d) => ({
      ...d,
      nombreModelo: 'Cargando...',
      nombreMarca: '-',
      nombreColor: '-',
      nombreTalla: '-',
      fotoUrl: '',
    }));
    this.detallesEnriquecidos.set(detallesBasicos);
    this.loading.set(false);

    // 2. Obtener modelos únicos
    const modelosUnicos = new Set<number>();
    detalles.forEach((d) => d.idModelo && modelosUnicos.add(d.idModelo));

    // 3. Crear mapa para acumular resultados
    const catalogMap = new Map<number, ModeloDetalleDrop>();

    // 4. IMPORTANTE: forEach (no map), cada subscribe individual
    Array.from(modelosUnicos).forEach((idModelo) => {
      this.dropsService
        .getDetalleModelo(idModelo)
        .pipe(catchError((err) => of(null)))
        .subscribe({
          next: (detalle) => {
            if (detalle) {
              catalogMap.set(idModelo, detalle);

              // Actualizar TODOS los detalles inmediatamente
              const enriquecidos: DetalleDropEnriquecido[] = detalles.map((detalleDrop) => {
                const productDetail = catalogMap.get(detalleDrop.idModelo!);
                if (!productDetail) {
                  return {
                    ...detalleDrop,
                    nombreModelo: 'Cargando...',
                    nombreMarca: '-',
                    nombreColor: '-',
                    nombreTalla: '-',
                    fotoUrl: '',
                  };
                }

                // Buscar variante en árbol de colores/tallas
                const varianteData = this.findVarianteInCatalog(
                  productDetail,
                  detalleDrop.idVariante
                );

                return {
                  ...detalleDrop,
                  nombreModelo: productDetail.nombreModelo,
                  nombreMarca: productDetail.nombreMarca,
                  nombreColor: varianteData?.color.nombreColor || 'N/A',
                  nombreTalla: varianteData?.talla.nombreTalla || 'N/A',
                  fotoUrl: varianteData?.color.fotoUrl || '',
                };
              });

              this.detallesEnriquecidos.set(enriquecidos);
            }
          },
        });
    });
  }

  private findVarianteInCatalog(
    productDetail: ModeloDetalleDrop,
    idVariante: number
  ): { color: any; talla: any } | null {
    for (const color of productDetail.colores) {
      for (const talla of color.tallas) {
        if (talla.idVariante === idVariante) {
          return { color, talla };
        }
      }
    }
    return null;
  }

  getBranchName(idSucursal: number): string {
    const branches: { [key: number]: string } = {
      1: 'Central',
      2: 'Secundaria',
    };
    return branches[idSucursal] || 'Desconocida';
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  resolveImageUrl(fotoUrl: string): string {
    if (!fotoUrl?.trim()) {
      return '/assets/images/placeholder-product.svg';
    }

    if (/^https?:\/\//i.test(fotoUrl)) {
      return fotoUrl;
    }

    const sanitizedPath = fotoUrl.replace(/^\/+/, '');
    return `/assets/images/${sanitizedPath}`;
  }

  getTotalItems(): number {
    return this.detallesEnriquecidos().reduce((sum, item) => sum + item.cantidad, 0);
  }

  onClose(): void {
    this.closed.emit();
  }
}
