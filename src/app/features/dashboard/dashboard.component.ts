import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import { DashboardService } from './services/dashboard.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardFilters,
  DashboardKPIs,
  GananciaSerieItem,
  VentasPorHora,
  VentasPorCategoria,
  MetodoPago,
  DistribucionTalla,
  TopProducto,
  StockCategoria,
} from './models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public sessionService = inject(SessionService);
  public authService = inject(AuthService);

  isLoading = signal<boolean>(true);
  loadFailed = signal<boolean>(false);

  kpis = signal<DashboardKPIs | null>(null);
  gananciaSerie = signal<GananciaSerieItem[]>([]);
  ventasPorHora = signal<VentasPorHora[]>([]);
  ventasPorCategoria = signal<VentasPorCategoria[]>([]);
  metodosPago = signal<MetodoPago[]>([]);
  topProductos = signal<TopProducto[]>([]);
  distribucionTallas = signal<DistribucionTalla[]>([]);
  stockPorCategoria = signal<StockCategoria[]>([]);

  selectedRange = signal<string>('hoy');
  selectedSucursal = signal<number | null>(null);

  showDatePicker = signal(false);
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  dateLabel = signal<string>('Hoy');

  financialTrendOptions: any = {};
  cobranzaDonutOptions: any = {};
  salesByHourOptions: any = {};
  salesByCategoryOptions: any = {};
  stockByCategoryOptions: any = {};

  ngOnInit() {
    if (this.authService.getUser()?.rol === 'ADMIN') {
      this.selectedSucursal.set(null);
    } else {
      this.selectedSucursal.set(this.sessionService.sucursalId());
    }

    const hoy = this.dashboardService.getRangoHoy();
    this.customStartDate.set(hoy.fechaInicio);
    this.customEndDate.set(hoy.fechaFin);

    this.loadData();
  }

  toggleDatePicker() {
    this.showDatePicker.update((v) => !v);
  }

  selectQuickRange(range: string) {
    this.selectedRange.set(range);
    let dateRange;

    switch (range) {
      case 'hoy':
        dateRange = this.dashboardService.getRangoHoy();
        this.dateLabel.set('Hoy');
        break;
      case 'mes':
        dateRange = this.dashboardService.getRangoEsteMes();
        this.dateLabel.set('Este Mes');
        break;
      case '7dias':
        dateRange = this.dashboardService.getRangoUltimos7Dias();
        this.dateLabel.set('Ultimos 7 dias');
        break;
      default:
        dateRange = this.dashboardService.getRangoHoy();
        this.dateLabel.set('Hoy');
    }

    this.customStartDate.set(dateRange.fechaInicio);
    this.customEndDate.set(dateRange.fechaFin);
    this.showDatePicker.set(false);
    this.loadData();
  }

  applyCustomDate() {
    if (!this.customStartDate() || !this.customEndDate()) return;

    this.selectedRange.set('custom');
    this.dateLabel.set(`${this.customStartDate()} - ${this.customEndDate()}`);
    this.showDatePicker.set(false);
    this.loadData();
  }

  onSucursalChange(sucursalId: number | null) {
    this.selectedSucursal.set(sucursalId);
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.loadFailed.set(false);

    const filters: DashboardFilters = {
      fechaInicio: this.customStartDate(),
      fechaFin: this.customEndDate(),
    };

    if (this.selectedSucursal() !== null) {
      filters.idSucursal = this.selectedSucursal()!;
    }

    forkJoin({
      kpis: this.dashboardService.getKPIs(filters),
      serie: this.dashboardService.getGananciaSerie(filters),
      ventasHora: this.dashboardService.getVentasPorHora(filters),
      ventasCat: this.dashboardService.getVentasPorCategoria(filters),
      metodos: this.dashboardService.getMetodosPago(filters),
      tallas: this.dashboardService.getDistribucionTallas(filters),
      top: this.dashboardService.getTopProductos(filters),
      stock: this.dashboardService.getStockPorCategoria(this.selectedSucursal() ?? undefined),
    }).subscribe({
      next: ({ kpis, serie, ventasHora, ventasCat, metodos, tallas, top, stock }) => {
        this.kpis.set(kpis);
        this.gananciaSerie.set(serie);
        this.ventasPorHora.set(ventasHora ?? []);
        this.ventasPorCategoria.set(ventasCat ?? []);

        const totalMetodos = (metodos ?? []).reduce(
          (acc, current) => acc + this.safeNumber(current.cantidad),
          0,
        );
        this.metodosPago.set(
          (metodos ?? []).map((item) => ({
            ...item,
            porcentaje:
              totalMetodos > 0
                ? Math.round((this.safeNumber(item.cantidad) / totalMetodos) * 100)
                : 0,
          })),
        );

        this.distribucionTallas.set(tallas ?? []);
        this.topProductos.set(top ?? []);
        this.stockPorCategoria.set(stock ?? []);

        this.initFinancialCharts();
        this.initOperationalCharts();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.kpis.set(this.emptyKPIs());
        this.gananciaSerie.set([]);
        this.ventasPorHora.set([]);
        this.ventasPorCategoria.set([]);
        this.metodosPago.set([]);
        this.distribucionTallas.set([]);
        this.topProductos.set([]);
        this.stockPorCategoria.set([]);
        this.initFinancialCharts();
        this.initOperationalCharts();
        this.loadFailed.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private emptyKPIs(): DashboardKPIs {
    return {
      totalVentas: 0,
      cantidadVentas: 0,
      gananciaDevengada: 0,
      gananciaCobrada: 0,
      gananciaPendiente: 0,
      unidadesVendidas: 0,
    };
  }

  private initFinancialCharts() {
    const series = this.getSerieNormalizada();
    const categorias = series.map((item) => item.label);

    this.financialTrendOptions = {
      series: [
        {
          name: 'Ganancia Cobrada',
          type: 'column',
          data: series.map((item) => item.cobrada),
        },
        {
          name: 'Ganancia Pendiente',
          type: 'column',
          data: series.map((item) => item.pendiente),
        },
        {
          name: 'Ganancia Devengada',
          type: 'line',
          data: series.map((item) => item.devengada),
        },
      ],
      chart: {
        height: 360,
        type: 'line',
        stacked: true,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      stroke: {
        width: [0, 0, 3],
        curve: 'smooth',
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '45%',
        },
      },
      xaxis: {
        categories: categorias,
      },
      yaxis: {
        labels: {
          formatter: (value: number) => this.shortCurrency(value),
        },
      },
      dataLabels: {
        enabled: false,
      },
      grid: {
        strokeDashArray: 4,
        borderColor: '#e5e7eb',
      },
      colors: ['#169c57', '#d97706', '#2563eb'],
      legend: {
        position: 'top',
      },
      tooltip: {
        y: {
          formatter: (value: number) => this.formatCurrency(value),
        },
      },
    };

    const k = this.kpis() || this.emptyKPIs();

    this.cobranzaDonutOptions = {
      series: [this.safeNumber(k.gananciaCobrada), this.safeNumber(k.gananciaPendiente)],
      chart: {
        type: 'donut',
        height: 320,
      },
      labels: ['Cobrada', 'Pendiente'],
      colors: ['#169c57', '#d97706'],
      legend: {
        position: 'bottom',
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => `${value.toFixed(0)}%`,
      },
      tooltip: {
        y: {
          formatter: (value: number) => this.formatCurrency(value),
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: {
                show: true,
                offsetY: -8,
              },
              value: {
                show: true,
                offsetY: 8,
                formatter: () => `${this.cobranzaRate().toFixed(0)}%`,
              },
              total: {
                show: true,
                label: 'Cobranza de ganancia',
                formatter: () => `${this.cobranzaRate().toFixed(0)}%`,
              },
            },
          },
        },
      },
    };
  }

  private initOperationalCharts() {
    const fullHours = Array.from({ length: 24 }, (_, i) => i);
    const salesMap = new Map(
      this.ventasPorHora().map((item) => [item.hora, this.safeNumber(item.cantidad)]),
    );

    this.salesByHourOptions = {
      series: [
        {
          name: 'Ventas',
          data: fullHours.map((hour) => salesMap.get(hour) || 0),
        },
      ],
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#CD0001'],
      },
      xaxis: {
        categories: fullHours.map((hour) => `${hour}:00`),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: true,
        labels: {
          formatter: (value: number) => value.toFixed(0),
        },
      },
      grid: {
        strokeDashArray: 4,
        borderColor: '#f1f1f1',
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: '#CD0001',
              opacity: 0.1,
            },
            {
              offset: 100,
              color: '#CD0001',
              opacity: 0,
            },
          ],
        },
      },
      tooltip: {
        theme: 'dark',
      },
    };

    this.salesByCategoryOptions = {
      series: [
        {
          name: 'Unidades',
          data: this.ventasPorCategoria().map((item) => this.safeNumber(item.cantidad)),
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '50%',
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: this.ventasPorCategoria().map((item) => item.categoria),
      },
      colors: ['#CD0001'],
      grid: {
        show: false,
      },
    };

    this.stockByCategoryOptions = {
      series: this.stockPorCategoria().map((item) => this.safeNumber(item.stock_total)),
      chart: {
        type: 'donut',
        height: 350,
        fontFamily: 'inherit',
      },
      labels: this.stockPorCategoria().map((item) => item.nombre_categoria),
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Stock Total',
                color: '#373d3f',
                formatter: (w: any) =>
                  w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: 'bottom',
      },
      colors: [
        '#CD0001',
        '#E63946',
        '#F1FAEE',
        '#A8DADC',
        '#457B9D',
        '#1D3557',
        '#2A9D8F',
        '#264653',
        '#E9C46A',
        '#F4A261',
      ],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 280,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };
  }

  private getSerieNormalizada(): Array<{
    label: string;
    devengada: number;
    cobrada: number;
    pendiente: number;
  }> {
    const kpis = this.kpis() || this.emptyKPIs();
    const source = this.gananciaSerie().filter((item) => !!item.fecha);

    if (source.length === 0) {
      return [
        {
          label: 'Periodo',
          devengada: this.safeNumber(kpis.gananciaDevengada),
          cobrada: this.safeNumber(kpis.gananciaCobrada),
          pendiente: this.safeNumber(kpis.gananciaPendiente),
        },
      ];
    }

    const useWeekly = this.daysInRange() > 35;

    if (!useWeekly) {
      return source.map((item) => ({
        label: this.formatDateLabel(item.fecha),
        devengada: this.safeNumber(item.gananciaDevengada),
        cobrada: this.safeNumber(item.gananciaCobrada),
        pendiente: this.safeNumber(item.gananciaPendiente),
      }));
    }

    const grouped = new Map<
      string,
      { label: string; devengada: number; cobrada: number; pendiente: number }
    >();

    source.forEach((item) => {
      const date = new Date(`${item.fecha}T00:00:00`);
      if (Number.isNaN(date.getTime())) return;

      const weekKey = this.getWeekKey(date);
      const weekLabel = this.getWeekLabel(date);
      const current = grouped.get(weekKey) || {
        label: weekLabel,
        devengada: 0,
        cobrada: 0,
        pendiente: 0,
      };

      current.devengada += this.safeNumber(item.gananciaDevengada);
      current.cobrada += this.safeNumber(item.gananciaCobrada);
      current.pendiente += this.safeNumber(item.gananciaPendiente);
      grouped.set(weekKey, current);
    });

    return Array.from(grouped.values());
  }

  private getWeekKey(date: Date): string {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.getTime() - firstThursday.getTime();
    const week = 1 + Math.round(diff / 604800000);
    return `${target.getFullYear()}-W${week}`;
  }

  private getWeekLabel(date: Date): string {
    const month = date.toLocaleDateString('es-BO', { month: 'short' });
    const day = date.getDate().toString().padStart(2, '0');
    return `Sem ${this.getWeekNumber(date)} (${day} ${month})`;
  }

  private getWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = new Date(target.getFullYear(), 0, 4);
    const diff = target.getTime() - firstThursday.getTime();
    return 1 + Math.round(diff / 604800000);
  }

  daysInRange(): number {
    const start = new Date(`${this.customStartDate()}T00:00:00`);
    const end = new Date(`${this.customEndDate()}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 1;
    }
    const diff = Math.max(0, end.getTime() - start.getTime());
    return Math.floor(diff / 86400000) + 1;
  }

  cobranzaRate(): number {
    const k = this.kpis() || this.emptyKPIs();
    const devengada = this.safeNumber(k.gananciaDevengada);
    if (devengada <= 0) return 0;
    return (this.safeNumber(k.gananciaCobrada) / devengada) * 100;
  }

  hasAnyData(): boolean {
    const k = this.kpis() || this.emptyKPIs();
    return (
      this.safeNumber(k.totalVentas) > 0 ||
      this.safeNumber(k.cantidadVentas) > 0 ||
      this.safeNumber(k.gananciaDevengada) > 0 ||
      this.safeNumber(k.gananciaCobrada) > 0 ||
      this.safeNumber(k.gananciaPendiente) > 0 ||
      this.safeNumber(k.unidadesVendidas) > 0 ||
      this.gananciaSerie().length > 0 ||
      this.ventasPorHora().length > 0 ||
      this.ventasPorCategoria().length > 0 ||
      this.topProductos().length > 0 ||
      this.distribucionTallas().length > 0 ||
      this.stockPorCategoria().length > 0 ||
      this.metodosPago().length > 0
    );
  }

  getSafeImage(url: string): string {
    if (!url || !url.trim()) {
      return '/assets/images/placeholder-product.svg';
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    const sanitizedPath = url.replace(/^\/+/, '');
    return `/assets/images/${sanitizedPath}`;
  }

  kpiHint(type: 'devengada' | 'cobrada' | 'pendiente'): string {
    if (type === 'devengada') return 'Ganancia generada por ventas activas.';
    if (type === 'cobrada') return 'Ganancia efectivamente cobrada.';
    return 'Ganancia pendiente de cobro en ventas a credito.';
  }

  safeNumber(value: number | null | undefined): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.safeNumber(value));
  }

  shortCurrency(value: number): string {
    const safe = this.safeNumber(value);
    if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`;
    if (safe >= 1_000) return `${(safe / 1_000).toFixed(1)}K`;
    return safe.toFixed(0);
  }

  formatDateLabel(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('es-BO', {
      month: 'short',
      day: '2-digit',
    });
  }
}
