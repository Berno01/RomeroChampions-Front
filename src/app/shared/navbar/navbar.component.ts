import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-200 h-20">
      <div class="max-w-full mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        <!-- Logo (Izquierda) -->
        <div class="flex items-center">
          <img
            src="/assets/images/logo.png"
            alt="Logo"
            class="h-10 md:h-14"
            onerror="this.src='/assets/images/logo-dunno.jpg'"
          />
        </div>

        <!-- Botón Hamburguesa (Mobile) -->
        <button
          class="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          (click)="toggleMenu()"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            @if (!menuOpen()) {
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
            } @else {
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
            }
          </svg>
        </button>

        <!-- Navegación (Centro - Desktop) -->
        <div class="hidden md:flex items-center gap-2">
          
          <!-- Grupo: RESUMEN (Dashboards) - Solo Admin -->
          @if (isAdmin()) {
          <div class="relative group">
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100 group-hover:bg-gray-50 focus:outline-none"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <span>RESUMEN</span>
              <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <!-- Dropdown Menu -->
            <div class="absolute left-0 top-full pt-1 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
               <div class="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1">
                 <a routerLink="/dashboard" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                   <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                   DASHBOARD NEGOCIO
                 </a>
                 <a routerLink="/usuarios" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                   DASHBOARD USUARIOS
                 </a>
               </div>
            </div>
          </div>
          }

          <!-- Grupo: VENTAS (Ventas y Creditos) - Todos -->
          <div class="relative group">
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100 group-hover:bg-gray-50 focus:outline-none"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>FINANZAS</span>
              <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <!-- Dropdown Menu -->
            <div class="absolute left-0 top-full pt-1 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
               <div class="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1">
                 <a routerLink="/ventas" routerLinkActive="bg-gray-50 text-black font-semibold" [routerLinkActiveOptions]="{exact: false}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                   <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                   PUNTO DE VENTA
                 </a>
                 <a routerLink="/creditos" routerLinkActive="bg-gray-50 text-black font-semibold" [routerLinkActiveOptions]="{exact: false}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                   GESTIÓN CRÉDITOS
                 </a>
               </div>
            </div>
          </div>

          <!-- Grupo: PRODUCTOS (Catalogo e Inventario) - Solo Admin -->
          @if (isAdmin()) {
          <div class="relative group">
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100 group-hover:bg-gray-50 focus:outline-none"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              <span>PRODUCTOS</span>
              <svg class="w-3 h-3 text-gray-400 group-hover:text-gray-600 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <!-- Dropdown Menu -->
            <div class="absolute left-0 top-full pt-1 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
               <div class="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1">
                 <a routerLink="/inventario" routerLinkActive="bg-gray-50 text-black font-semibold" [routerLinkActiveOptions]="{exact: false}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                   <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                   INVENTARIO
                 </a>
                 <a routerLink="/catalogo" routerLinkActive="bg-gray-50 text-black font-semibold" [routerLinkActiveOptions]="{exact: false}" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                   CATÁLOGO
                 </a>
               </div>
            </div>
          </div>
          }

          <!-- Drops (Solo admins) - Standalone -->
          @if (isAdmin()) {
          <a
            routerLink="/drops"
            routerLinkActive="bg-black text-white"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-colors text-gray-700 hover:bg-gray-100"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path width="24" height="24" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
            </svg>
            <span>DROPS</span>
          </a>
          }

        </div>

        <!-- Info Sucursal y Logout (Derecha - Desktop) -->
        <div class="hidden md:flex items-center gap-4">
          <span class="text-sm font-medium text-gray-700">
            Sucursal: {{ sessionService.sucursalNombre() }}
          </span>
          <button
            (click)="logout()"
            class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            SALIR
          </button>
        </div>
      </div>

      <!-- Menú Mobile (Accordion Style) -->
      @if (menuOpen()) {
      <div
        class="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 overflow-y-auto max-h-[calc(100vh-5rem)]"
      >
        <div class="px-4 py-4 space-y-1">
          
          <!-- RESUMEN - Mobile -->
          @if (isAdmin()) {
          <div class="border-b border-gray-100 pb-2 mb-2">
            <h3 class="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">RESUMEN</h3>
            <a
              routerLink="/dashboard"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
              <span>Dashboard Negocio</span>
            </a>
            <a
              routerLink="/usuarios"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
            >
               <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
               <span>Dashboard Usuarios</span>
            </a>
          </div>
          }

          <!-- FINANZAS - Mobile -->
          <div class="border-b border-gray-100 pb-2 mb-2">
            <h3 class="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">FINANZAS</h3>
            <a
              routerLink="/ventas"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
            >
               <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
               <span>Punto de Venta</span>
            </a>
            <a
              routerLink="/creditos"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
            >
               <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
               <span>Gestión Créditos</span>
            </a>
          </div>

          <!-- PRODUCTOS - Mobile -->
          @if (isAdmin()) {
          <div class="border-b border-gray-100 pb-2 mb-2">
             <h3 class="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">PRODUCTOS</h3>
             <a
              routerLink="/inventario"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
             >
               <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
               <span>Inventario</span>
             </a>
             <a
              routerLink="/catalogo"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
             >
               <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
               <span>Catálogo</span>
             </a>
          </div>
          }

          <!-- DROPS - Mobile -->
          @if(isAdmin()){
          <div class="pb-2 mb-2">
            <a
              routerLink="/drops"
              routerLinkActive="text-black bg-gray-50"
              class="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50"
              (click)="closeMenu()"
            >
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path width="24" height="24" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
              <span class="font-bold">DROPS</span>
            </a>
          </div>
          }

          <!-- Info Sucursal y Logout (Mobile) -->
          <div class="pt-3 mt-2 border-t border-gray-200 flex flex-col gap-2">
            <span class="text-sm font-medium text-gray-700 px-4">
              Sucursal: {{ sessionService.sucursalNombre() }}
            </span>
            <button
              (click)="logout()"
              class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors px-4 text-left"
            >
              SALIR
            </button>
          </div>
        </div>
      </div>
      }
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class NavbarComponent {
  sessionService = inject(SessionService);
  authService = inject(AuthService);
  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }

  isAdmin() {
    return this.sessionService.rol() === 'ADMIN';
  }
}
