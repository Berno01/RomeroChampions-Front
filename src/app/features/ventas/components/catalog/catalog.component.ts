import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  effect,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../services/catalog.service';
import { SessionService } from '../../../../core/services/session.service';
import { ResumenPrendaDTO } from '../../../../core/models/catalogo.models';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, ProductDetailModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-full bg-white">
      <!-- Header: Filtros y Buscador -->
      <header class="sticky top-0 z-10 bg-white px-3 md:px-8 py-3 md:py-6 border-b border-gray-100">
        <div class="flex flex-col gap-3">
          <!-- Buscador (Prioridad en mobile) -->
          <div
            class="flex items-center gap-2 w-full border-b border-gray-200 focus-within:border-black transition-colors pb-1"
          >
            <svg
              class="w-4 h-4 text-gray-400 flex-shrink-0"
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
              placeholder="Buscar modelo..."
              class="w-full text-xs md:text-sm outline-none placeholder-gray-300 font-medium"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
            />
          </div>

          <!-- Filtros -->
          <div class="flex items-center gap-3 md:gap-6">
            <!-- Dropdown Categoría -->
            <div class="relative group">
              <button
                class="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors"
                (click)="toggleCategoryMenu()"
              >
                <span class="hidden sm:inline">{{ selectedCategory() || 'CATEGORÍA' }}</span>
                <span class="sm:hidden">{{ selectedCategory() || 'CAT.' }}</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              <!-- Dropdown Menu Simulado -->
              @if (showCategoryMenu()) {
                <div
                  class="absolute top-full left-0 mt-2 w-40 md:w-48 bg-white shadow-xl border border-gray-100 py-2 rounded-sm z-20"
                >
                  <button
                    class="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-gray-50"
                    (click)="selectCategory(null)"
                  >
                    Todas
                  </button>
                  @for (cat of uniqueCategories(); track cat) {
                    <button
                      class="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-gray-50"
                      [class.font-bold]="selectedCategory() === cat"
                      (click)="selectCategory(cat)"
                    >
                      {{ cat }}
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Dropdown Tallas -->
            <div class="relative group">
              <button
                class="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider transition-colors"
                (click)="toggleTallaMenu()"
              >
                <span class="hidden sm:inline">{{ selectedTalla() || 'TALLAS' }}</span>
                <span class="sm:hidden">{{ selectedTalla() || 'TALL.' }}</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              <!-- Dropdown Menu -->
              @if (showTallaMenu()) {
                <div
                  class="absolute top-full left-0 mt-2 w-40 md:w-48 bg-white shadow-xl border border-gray-100 py-2 rounded-sm z-20 max-h-60 overflow-y-auto"
                >
                  <button
                    class="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-gray-50"
                    (click)="selectTalla(null)"
                  >
                    Todas
                  </button>
                  @for (talla of uniqueTallas(); track talla) {
                    <button
                      class="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm hover:bg-gray-50"
                      [class.font-bold]="selectedTalla() === talla"
                      (click)="selectTalla(talla)"
                    >
                      {{ talla }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Grid de Productos -->
      <div class="flex-1 overflow-y-auto p-3 md:p-8">
        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <span class="text-gray-400 text-xs md:text-sm tracking-wider">CARGANDO...</span>
          </div>
        } @else if (filteredProducts().length === 0) {
          <div class="flex flex-col items-center justify-center h-64 text-gray-400">
            <span class="text-xs md:text-sm tracking-wider">NO HAY PRODUCTOS</span>
            <button (click)="clearFilters()" class="mt-4 text-xs underline hover:text-black">
              Limpiar filtros
            </button>
          </div>
        } @else {
          <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-6 md:gap-y-10"
          >
            @for (product of filteredProducts(); track product.idModelo) {
              <app-product-card
                [product]="product"
                (cardClick)="onProductClick($event)"
              ></app-product-card>
            }
          </div>
        }
      </div>
    </div>

    @if (detailModalOpen() && activeProductId() !== null) {
      <app-product-detail-modal
        [idModelo]="activeProductId()!"
        [sucursalId]="sessionService.sucursalId()"
        (closed)="closeProductDetail()"
      ></app-product-detail-modal>
    }
  `,
})
export class CatalogComponent {
  private catalogService = inject(CatalogService);
  protected sessionService = inject(SessionService);
  private platformId = inject(PLATFORM_ID);

  // Signals de Estado
  products = signal<ResumenPrendaDTO[]>([]);
  loading = signal<boolean>(true);
  detailModalOpen = signal<boolean>(false);
  activeProductId = signal<number | null>(null);

  // Signals de Filtros
  searchQuery = signal<string>('');
  selectedCategory = signal<string | null>(null);
  showCategoryMenu = signal<boolean>(false);
  selectedTalla = signal<string | null>(null);
  showTallaMenu = signal<boolean>(false);

  constructor() {
    // Recargar catálogo automáticamente cuando cambie la sucursal
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const sucursalId = this.sessionService.sucursalId();
        this.loadCatalog(sucursalId);
      }
    });
  }

  // Computed Signals
  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const talla = this.selectedTalla();

    return this.products().filter((p) => {
      const matchesSearch =
        !query ||
        p.nombreModelo.toLowerCase().includes(query) ||
        p.nombreMarca.toLowerCase().includes(query) ||
        p.codigos.some((codigo) => codigo.toLowerCase().includes(query));

      const matchesCategory = !category || p.nombreCategoria === category;

      const matchesTalla = !talla || p.tallas.includes(talla);

      return matchesSearch && matchesCategory && matchesTalla;
    });
  });

  uniqueCategories = computed(() => {
    const categories = new Set(this.products().map((p) => p.nombreCategoria));
    return Array.from(categories).sort();
  });

  uniqueTallas = computed(() => {
    const tallas = new Set<string>();
    this.products().forEach((p) => p.tallas.forEach((t) => tallas.add(t)));
    // Ordenar tallas: primero letras (S, M, L, XL), luego números
    return Array.from(tallas).sort((a, b) => {
      const ordenTallas = ['S', 'M', 'L', 'XL', '36', '38', '40', '42', '44', '46', '48'];
      const indexA = ordenTallas.indexOf(a);
      const indexB = ordenTallas.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return a.localeCompare(b, undefined, { numeric: true });
    });
  });

  ngOnInit() {
    // El effect en el constructor ya maneja la carga inicial
  }

  loadCatalog(sucursalId: number) {
    this.loading.set(true);
    this.catalogService
      .getCatalog(sucursalId)
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          this.products.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando catálogo', err);
          // Mock data fallback para visualización si falla API
          this.products.set(MOCK_PRODUCTS);
          this.loading.set(false);
        },
      });
  }

  toggleCategoryMenu() {
    this.showCategoryMenu.update((v) => !v);
  }

  selectCategory(category: string | null) {
    this.selectedCategory.set(category);
    this.showCategoryMenu.set(false);
  }

  toggleTallaMenu() {
    this.showTallaMenu.update((v) => !v);
  }

  selectTalla(talla: string | null) {
    this.selectedTalla.set(talla);
    this.showTallaMenu.set(false);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
    this.selectedTalla.set(null);
  }

  onProductClick(product: ResumenPrendaDTO) {
    this.openProductDetail(product.idModelo);
  }

  private openProductDetail(productId: number) {
    this.activeProductId.set(productId);
    this.detailModalOpen.set(true);
  }

  closeProductDetail() {
    this.detailModalOpen.set(false);
    this.activeProductId.set(null);
  }
}

// Datos Mock para probar visualmente sin backend
const MOCK_PRODUCTS: ResumenPrendaDTO[] = [
  {
    idModelo: 1,
    nombreModelo: 'Oversized Heavy Hoodie',
    nombreMarca: 'Essentials',
    nombreCategoria: 'HOODIE',
    fotoPortada:
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=500',
    precio: 250.0,
    stockTotal: 15,
    pocasUnidades: false,
    codigos: ['HOOD-001', 'HOOD-001-BLK'],
    tallas: ['S', 'M', 'L', 'XL'],
  },
  {
    idModelo: 2,
    nombreModelo: 'Essential Boxy Tee',
    nombreMarca: 'Nike',
    nombreCategoria: 'POLERA',
    fotoPortada:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500',
    precio: 120.0,
    stockTotal: 5,
    pocasUnidades: true,
    codigos: ['TEE-002', 'TEE-002-WHT'],
    tallas: ['M', 'L'],
  },
  {
    idModelo: 3,
    nombreModelo: 'Wide Leg Cargo Pants',
    nombreMarca: 'Adidas',
    nombreCategoria: 'PANTALÓN',
    fotoPortada:
      'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&q=80&w=500',
    precio: 350.0,
    stockTotal: 0,
    pocasUnidades: false,
    codigos: ['PANT-003'],
    tallas: ['38', '40', '42'],
  },
  {
    idModelo: 4,
    nombreModelo: 'Signature Cap',
    nombreMarca: 'New Era',
    nombreCategoria: 'ACCESORIO',
    fotoPortada:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=500',
    precio: 80.0,
    stockTotal: 20,
    pocasUnidades: false,
    codigos: ['CAP-004'],
    tallas: ['Única'],
  },
  {
    idModelo: 5,
    nombreModelo: 'Zip-Up Polar Fleece',
    nombreMarca: 'North Face',
    nombreCategoria: 'CHAQUETA',
    fotoPortada: '', // Test placeholder
    precio: 450.0,
    stockTotal: 8,
    pocasUnidades: false,
    codigos: ['FLEECE-005'],
    tallas: ['S', 'M', 'L'],
  },
];
