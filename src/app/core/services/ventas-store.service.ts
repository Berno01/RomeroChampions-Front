import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem, VentaDTO } from '../models/venta.models';
import { SessionService } from './session.service';
import { VentasService } from './ventas.service';
import { ToastService } from './toast.service';
import { ColorDTO, DetallePrendaDTO, TallaDTO } from '../models/catalogo.models';
import { CatalogService } from '../../features/ventas/services/catalog.service';

@Injectable({
  providedIn: 'root',
})
export class VentasStoreService {
  private sessionService = inject(SessionService);
  private ventasService = inject(VentasService);
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // --- Estado (Signals Writable) ---
  readonly cartItems = signal<CartItem[]>([]);
  readonly sucursalId = signal<number>(this.sessionService.sucursalId());
  readonly paymentAmounts = signal<{
    efectivo: number;
    qr: number;
    tarjeta: number;
  }>({
    efectivo: 0,
    qr: 0,
    tarjeta: 0,
  });
  readonly splitActive = signal<boolean>(false);
  readonly selectedPaymentMethod = signal<'EFECTIVO' | 'QR' | 'TARJETA' | ''>(
    'EFECTIVO'
  );
  readonly descuento = signal<number>(0);
  readonly tipoDescuento = signal<'SIN DESCUENTO' | 'PROMOCION' | 'DESCUENTO'>('SIN DESCUENTO');
  readonly tipoVenta = signal<'CONTADO' | 'CREDITO'>('CONTADO');
  readonly fechaLimite = signal<string | null>(null);
  readonly editingSaleId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly processing = signal<boolean>(false); // Estado de procesamiento de venta

  // Persistencia de filtros del listado
  private listFilters = signal<{
    dateStart: string;
    dateEnd: string;
    dateRangeMode: boolean;
    branch: number | null;
  } | null>(null);

  // --- Estado Derivado (Computed Signals) ---
  readonly totalVenta = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.subtotal, 0)
  );

  readonly cantidadTotalArticulos = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.cantidad, 0)
  );

  readonly ventaPayload = computed<VentaDTO>(() => {
    const total = this.totalVenta();
    const payments = this.paymentAmounts();
    const editingId = this.editingSaleId();
    const descuentoValue = this.descuento();
    const tipoDescuentoValue = this.tipoDescuento();
    const finalTotal = total - descuentoValue;
    const totalPaid = payments.efectivo + payments.qr + payments.tarjeta;
    const saldoPendiente = Math.max(0, parseFloat((finalTotal - totalPaid).toFixed(2)));

    // Siempre usar SessionService (que se actualiza tanto al crear como al editar)
    return {
      id_venta: editingId ?? undefined,
      id_sucursal: this.sessionService.sucursalId(),
      id_usuario: this.sessionService.userId(),
      total: finalTotal,
      descuento: descuentoValue,
      tipo_descuento: tipoDescuentoValue,
      monto_efectivo: payments.efectivo,
      monto_qr: payments.qr,
      monto_tarjeta: payments.tarjeta,
      tipo_venta: this.tipoVenta(),
      fecha_limite: this.tipoVenta() === 'CREDITO' ? this.fechaLimite() : null,
      saldo_pendiente: saldoPendiente,
      detalle_venta: this.cartItems().map((item) => ({
        id_variante: item.idVariante,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        total: item.subtotal,
      })),
    };
  });

  constructor() {
    // Sincronizar sucursal si cambia la sesión (opcional, pero buena práctica)
    // effect(() => this.sucursalId.set(this.sessionService.sucursalId()));
  }

  // --- Métodos (Actions) ---

  addItem(producto: DetallePrendaDTO, color: ColorDTO, talla: TallaDTO, precio: number) {
    this.cartItems.update((items) => {
      const existingItemIndex = items.findIndex((i) => i.idVariante === talla.idVariante);

      if (existingItemIndex !== -1) {
        // El item ya existe, actualizamos cantidad
        const existingItem = items[existingItemIndex];
        const nuevaCantidad = existingItem.cantidad + 1;

        if (nuevaCantidad > existingItem.stockMaximo) {
          // Aquí se podría emitir una notificación de error o simplemente no hacer nada
          console.warn('Stock máximo alcanzado para este item');
          return items;
        }

        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * existingItem.precioUnitario,
        };
        return updatedItems;
      } else {
        // Nuevo item
        const newItem: CartItem = {
          idVariante: talla.idVariante,
          idModelo: producto.idModelo,
          nombreModelo: producto.nombreModelo,
          nombreMarca: producto.nombreMarca,
          nombreColor: color.nombreColor,
          nombreTalla: talla.nombreTalla,
          fotoUrl: color.fotoUrl, // Usamos la foto del color
          cantidad: 1,
          precioUnitario: precio,
          subtotal: precio * 1,
          stockMaximo: talla.stock, // El stock viene de la talla específica
        };
        return [...items, newItem];
      }
    });
  }

  removeItem(idVariante: number) {
    this.cartItems.update((items) => items.filter((i) => i.idVariante !== idVariante));
  }

  updateQuantity(idVariante: number, nuevaCantidad: number) {
    this.cartItems.update((items) => {
      return items.map((item) => {
        if (item.idVariante === idVariante) {
          if (nuevaCantidad <= 0) return item; // O eliminarlo? Por ahora mantenemos validación > 0

          // stockMaximo ya está ajustado con la cantidad original en modo edición
          if (nuevaCantidad > item.stockMaximo) {
            console.warn('Stock máximo excedido');
            this.toastService.warning(
              `Stock máximo disponible: ${item.stockMaximo} unidades`,
              3000
            );
            return item;
          }
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario,
          };
        }
        return item;
      });
    });
  }

  updatePrice(idVariante: number, nuevoPrecio: number) {
    this.cartItems.update((items) => {
      return items.map((item) => {
        if (item.idVariante === idVariante) {
          if (nuevoPrecio < 0) return item;
          return {
            ...item,
            precioUnitario: nuevoPrecio,
            subtotal: item.cantidad * nuevoPrecio,
          };
        }
        return item;
      });
    });
  }

  clearCart() {
    this.cartItems.set([]);
    this.resetPayments();
    this.editingSaleId.set(null);
    this.descuento.set(0);
    this.tipoDescuento.set('SIN DESCUENTO');
  }

  resetState() {
    this.cartItems.set([]);
    this.resetPayments();
    this.editingSaleId.set(null);
    this.tipoVenta.set('CONTADO');
    this.splitActive.set(false);
    this.selectedPaymentMethod.set('EFECTIVO');
    this.descuento.set(0);
    this.tipoDescuento.set('SIN DESCUENTO');
    this.fechaLimite.set(null);
  }

  setPayment(type: 'EFECTIVO' | 'QR' | 'TARJETA', amount?: number) {
    const total = this.totalVenta() - this.descuento();
    const currentPayments = this.paymentAmounts();
    const typeKey = type.toLowerCase() as 'efectivo' | 'qr' | 'tarjeta';
    const isCredito = this.tipoVenta() === 'CREDITO';

    // Contar cuántos métodos ya están activos (excluyendo el actual si está siendo reseleccionado)
    const activePayments = [
      currentPayments.efectivo > 0 && typeKey !== 'efectivo' ? 'efectivo' : null,
      currentPayments.qr > 0 && typeKey !== 'qr' ? 'qr' : null,
      currentPayments.tarjeta > 0 && typeKey !== 'tarjeta' ? 'tarjeta' : null,
    ].filter((p) => p !== null);

    // Si es CREDITO, lógica simplificada: actualizar el monto del método sin resetear otros
    if (isCredito) {
      // Si ya hay 2 métodos activos y estamos intentando agregar un tercero (amount > 0), bloquear
      // Si amount es 0 o undefined, asumimos que se quiere poner a 0, lo cual siempre se permite
      if (activePayments.length >= 2 && (!currentPayments[typeKey] || currentPayments[typeKey] === 0) && amount && amount > 0) {
        console.warn('Solo se permiten combinaciones de hasta 2 métodos de pago');
        return;
      }

      const newAmount = amount !== undefined && amount >= 0 ? amount : 0;
      
      // Actualizar solo este método
      this.paymentAmounts.update((prev) => ({
        ...prev,
        [typeKey]: newAmount,
      }));
      
      this.splitActive.set(true);
      return;
    }

    // --- LÓGICA CONTADO (Original) ---

    // Si el tipo seleccionado ya está activo, resetear todo a ese método (Toggle behavior para single payment)
    if (currentPayments[typeKey] > 0 && activePayments.length === 0 && (!amount || amount === total)) {
       // Si era el único pago y se clickea de nuevo sin monto específico, no hacer nada o resetear?
       // El comportamiento original reseteaba a TOTAL. Mantengamos eso para clicks simples.
       // Pero si viene con amount específico (del modal), debemos respetarlo.
    }

    // Si el tipo seleccionado ya está activo y no es split, resetear todo a ese método
    if (currentPayments[typeKey] > 0 && !this.splitActive() && (!amount || amount === total)) {
      this.paymentAmounts.set({
        efectivo: 0,
        qr: 0,
        tarjeta: 0,
        [typeKey]: total,
      });
      this.splitActive.set(false);
      return;
    }

    // Si ya hay 2 métodos activos, no permitir un tercero
    if (activePayments.length >= 2) {
      console.warn('Solo se permiten combinaciones de hasta 2 métodos de pago');
      return;
    }

    // Si no hay monto especificado o es el total completo, usar un solo método
    if ((!amount || amount <= 0 || amount >= total) && activePayments.length === 0) {
      this.paymentAmounts.set({
        efectivo: 0,
        qr: 0,
        tarjeta: 0,
        [typeKey]: total,
      });
      this.splitActive.set(false);
      return;
    }

    // Validar que el monto no exceda el total (ya cubierto arriba)
    if (amount && amount > total) {
      console.warn('El monto no puede exceder el total');
      return;
    }

    const finalAmount = amount || 0;

    // Si no hay ningún método activo todavía (es el primer método que se está seleccionando)
    // resetear todo primero antes de asignar
    if (activePayments.length === 0) {
      this.paymentAmounts.set({
        efectivo: 0,
        qr: 0,
        tarjeta: 0,
        [typeKey]: finalAmount,
      });
    } else {
      // Ya hay un método activo, agregar este como segundo
      const newPayments: { efectivo: number; qr: number; tarjeta: number } = {
        ...currentPayments,
        [typeKey]: finalAmount,
      };
      this.paymentAmounts.set(newPayments);
    }

    this.splitActive.set(true);
  }

  // Nuevo método para establecer el monto restante en un método específico
  setRemainingPayment(type: 'EFECTIVO' | 'QR' | 'TARJETA') {
    const total = this.totalVenta() - this.descuento();
    const currentPayments = this.paymentAmounts();
    const currentTotal =
      currentPayments.efectivo +
      currentPayments.qr +
      currentPayments.tarjeta;
    const remaining = total - currentTotal;

    if (remaining <= 0) {
      console.warn('No hay monto restante para asignar');
      return;
    }

    const typeKey = type.toLowerCase() as 'efectivo' | 'qr' | 'tarjeta';

    // Establecer directamente el restante (no sumar)
    this.paymentAmounts.update((payments) => ({
      ...payments,
      [typeKey]: remaining,
    }));
    this.splitActive.set(true);
  }

  resetPayments() {
    const total = this.totalVenta() - this.descuento();
    if (this.tipoVenta() === 'CREDITO') {
      this.paymentAmounts.set({
        efectivo: 0,
        qr: 0,
        tarjeta: 0,
      });
      // Iniciamos en false para que no aparezca el botón "Resetear" hasta que se agregue un pago
      // Al agregar un pago, setPayment lo pondrá en true
      this.splitActive.set(false);
    } else {
      this.paymentAmounts.set({
        efectivo: total,
        qr: 0,
        tarjeta: 0,
      });
      this.splitActive.set(false);
    }
  }

  setDescuento(descuento: number, tipo: 'PROMOCION' | 'DESCUENTO' = 'DESCUENTO') {
    if (descuento < 0) {
      console.warn('El descuento no puede ser negativo');
      return;
    }
    const total = this.totalVenta();
    if (descuento > total) {
      console.warn('El descuento no puede ser mayor al total');
      return;
    }
    this.descuento.set(descuento);
    this.tipoDescuento.set(descuento === 0 ? 'SIN DESCUENTO' : tipo);
    // Recalcular pagos con el nuevo total
    this.resetPayments();
  }

  setTipoVenta(tipo: 'CONTADO' | 'CREDITO') {
    this.tipoVenta.set(tipo);
    if (tipo === 'CONTADO') {
      this.fechaLimite.set(null);
    }
    this.resetPayments();
  }

  setFechaLimite(fecha: string) {
    this.fechaLimite.set(fecha);
  }

  /**
   * Guarda los filtros del listado
   */
  saveListFilters(filters: {
    dateStart: string;
    dateEnd: string;
    dateRangeMode: boolean;
    branch: number | null;
  }): void {
    this.listFilters.set(filters);
  }

  /**
   * Obtiene los filtros guardados del listado
   */
  getListFilters(): {
    dateStart: string;
    dateEnd: string;
    dateRangeMode: boolean;
    branch: number | null;
  } | null {
    return this.listFilters();
  }

  /**
   * Limpia los filtros guardados
   */
  clearListFilters(): void {
    this.listFilters.set(null);
  }

  private getBranchName(id: number): string {
    const branches: Record<number, string> = {
      1: 'Central',
      2: 'Secundaria',
    };
    return branches[id] || `Sucursal ${id}`;
  }

  /**
   * HIDRATACIÓN DEL CARRITO - Carga una venta existente para edición
   * 1. Obtiene la venta del backend
   * 2. Consulta el catálogo por cada modelo único para obtener datos visuales
   * 3. Reconstruye los CartItems combinando datos de venta + catálogo
   */
  loadSaleForEdit(saleId: number): void {
    this.isLoading.set(true);
    this.editingSaleId.set(saleId);

    this.ventasService.getSaleById(saleId).subscribe({
      next: (venta) => {
        // 1. Establecer datos básicos de la venta
        this.sucursalId.set(venta.id_sucursal);

        // Actualizar SessionService para que toda la app use esta sucursal
        const sucursalNombre = this.getBranchName(venta.id_sucursal);
        this.sessionService.setSucursal(venta.id_sucursal, sucursalNombre);

        this.tipoVenta.set(venta.tipo_venta as 'CONTADO' | 'CREDITO');
        
        // Formatear fecha límite para input datetime-local (YYYY-MM-DDTHH:mm)
        if (venta.fecha_limite) {
          // Si viene formato completo ISO o con segundos, tomamos solo hasta minutos
          const formattedDate = venta.fecha_limite.substring(0, 16);
          this.fechaLimite.set(formattedDate);
        } else {
          this.fechaLimite.set(null);
        }

        this.descuento.set(venta.descuento ?? 0);
        this.tipoDescuento.set(venta.tipo_descuento ?? 'SIN DESCUENTO');
        this.paymentAmounts.set({
          efectivo: venta.monto_efectivo,
          qr: venta.monto_qr,
          tarjeta: venta.monto_tarjeta,
        });

        // Detectar si hay split activo y establecer método de pago
        const activeMethods = [
          venta.monto_efectivo > 0 ? 'EFECTIVO' : null,
          venta.monto_qr > 0 ? 'QR' : null,
          venta.monto_tarjeta > 0 ? 'TARJETA' : null,
        ].filter((m) => m !== null);

        const hasSplit = activeMethods.length > 1;
        this.splitActive.set(hasSplit);

        if (hasSplit && activeMethods.length > 0) {
          // Establecer el primer método activo como el método principal
          this.selectedPaymentMethod.set(activeMethods[0] as any);
        } else if (activeMethods.length === 1) {
          // Pago simple
          this.selectedPaymentMethod.set(activeMethods[0] as any);
        } else {
          this.selectedPaymentMethod.set('EFECTIVO');
        }

        // 2. Agrupar detalles por id_modelo único para evitar consultas duplicadas
        const modelosUnicos = new Set<number>();
        venta.detalle_venta.forEach((detalle) => {
          if (detalle.id_modelo) {
            modelosUnicos.add(detalle.id_modelo);
          }
        });

        // 3. Si no hay id_modelo en los detalles, no podemos hidratar
        if (modelosUnicos.size === 0) {
          console.error('No se encontraron id_modelo en los detalles de la venta');
          this.isLoading.set(false);
          return;
        }

        // 4. Consultar catálogo para cada modelo único (en paralelo)
        const catalogRequests = Array.from(modelosUnicos).map((idModelo) =>
          this.catalogService.getProductDetail(idModelo, venta.id_sucursal).pipe(
            map((detalle) => ({ idModelo, detalle })),
            catchError((err) => {
              console.error(`Error al cargar modelo ${idModelo}:`, err);
              return of(null);
            })
          )
        );

        forkJoin(catalogRequests).subscribe({
          next: (catalogResults) => {
            // 5. Crear mapa idModelo -> DetallePrendaDTO
            const catalogMap = new Map<number, DetallePrendaDTO>();
            catalogResults.forEach((result) => {
              if (result) {
                catalogMap.set(result.idModelo, result.detalle);
              }
            });

            // 6. Construir CartItems hidratados
            const hydrated: CartItem[] = [];

            venta.detalle_venta.forEach((detalleVenta) => {
              if (!detalleVenta.id_modelo) {
                console.warn('Detalle sin id_modelo, omitiendo:', detalleVenta);
                return;
              }

              const productDetail = catalogMap.get(detalleVenta.id_modelo);
              if (!productDetail) {
                console.warn(`No se encontró catálogo para modelo ${detalleVenta.id_modelo}`);
                return;
              }

              // Buscar la variante en el árbol de colores/tallas
              const varianteData = this.findVarianteInCatalog(
                productDetail,
                detalleVenta.id_variante
              );

              if (!varianteData) {
                console.warn(
                  `No se encontró variante ${detalleVenta.id_variante} en el catálogo del modelo ${detalleVenta.id_modelo}`
                );
                return;
              }

              // Construir CartItem completo
              // En modo edición, el stock disponible = stock actual + cantidad original vendida
              const stockDisponibleParaEdicion = varianteData.talla.stock + detalleVenta.cantidad;

              const cartItem: CartItem = {
                idVariante: detalleVenta.id_variante,
                idModelo: detalleVenta.id_modelo,
                nombreModelo: productDetail.nombreModelo,
                nombreMarca: productDetail.nombreMarca,
                nombreColor: varianteData.color.nombreColor,
                nombreTalla: varianteData.talla.nombreTalla,
                fotoUrl: varianteData.color.fotoUrl,
                cantidad: detalleVenta.cantidad,
                precioUnitario: detalleVenta.precio_unitario,
                subtotal: detalleVenta.total,
                stockMaximo: stockDisponibleParaEdicion, // Stock actual + cantidad original
                cantidadOriginal: detalleVenta.cantidad, // Guardamos la cantidad original
              };

              hydrated.push(cartItem);
            });

            // 7. Actualizar estado del carrito
            this.cartItems.set(hydrated);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error al hidratar el carrito:', err);
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error al cargar la venta:', err);
        this.isLoading.set(false);
        this.router.navigate(['/ventas']);
      },
    });
  }

  /**
   * Busca recursivamente en el árbol de colores/tallas una variante específica
   * Retorna el color y la talla que contienen esa variante
   */
  private findVarianteInCatalog(
    producto: DetallePrendaDTO,
    idVariante: number
  ): { color: ColorDTO; talla: TallaDTO } | null {
    for (const color of producto.colores) {
      for (const talla of color.tallas) {
        if (talla.idVariante === idVariante) {
          return { color, talla };
        }
      }
    }
    return null;
  }

  /**
   * Confirmar venta: Crear nueva o actualizar existente
   */
  confirmSale(): void {
    const payload = this.ventaPayload();
    const editingId = this.editingSaleId();

    this.processing.set(true);

    if (editingId) {
      // Modo edición
      this.ventasService.updateSale(editingId, payload).subscribe({
        next: () => {
          this.processing.set(false);
          this.toastService.success(`Venta #${editingId} actualizada correctamente`, 4000);
          this.resetState();
          this.router.navigate(['/ventas']);
        },
        error: (err) => {
          this.processing.set(false);
          console.error('Error al actualizar la venta:', err);
          this.toastService.error('Error al actualizar la venta. Intente nuevamente.', 4000);
        },
      });
    } else {
      // Modo creación
      this.ventasService.createSale(payload).subscribe({
        next: (response) => {
          this.processing.set(false);
          this.toastService.success(`Venta creada exitosamente. ${response.mensaje}`, 4000);
          this.resetState();
          this.router.navigate(['/ventas']);
        },
        error: (err) => {
          this.processing.set(false);
          console.error('Error al crear la venta:', err);
          this.toastService.error('Error al crear la venta. Intente nuevamente.', 4000);
        },
      });
    }
  }
}
