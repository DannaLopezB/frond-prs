import { AuthGuard } from './auth/guards/auth.guard';
import { Routes } from "@angular/router"
import { ProfileComponent } from "./auth/profile/profile.component"
import { ConfigurationComponent } from "./auth/configuration/configuration.component"

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar Sesión',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [AuthGuard],
    data: { public: true },
  },
  {
    path: '',
    canMatch: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard General',
        loadComponent: () => import('./components/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: "usuarios",
        canMatch: [AuthGuard],
        data: { role: "ADMIN" },
        title: "Gestión de Usuarios",
        loadComponent: () =>
          import("./components/pages/users/users.component").then(
            (m) => m.UsersComponent
          ),
      },

      // ✅ MÓDULO GALPÓN - Reorganizado por secciones con control de acceso
      {
        path: 'modulo-galpon',
        children: [
          // 🏗️ SECCIÓN: CONFIGURACIÓN BÁSICA (Acceso: ADMIN y USER)
          {
            path: 'configuracion-basica',
            children: [
              {
                path: 'casa',
                title: 'Gestión de Casas',
                loadComponent: () => import('./components/pages/main/home/home.component').then(m => m.HomeComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'ubicaciones',
                title: 'Gestión de Ubicaciones',
                loadComponent: () => import('./components/pages/main/location/location.component').then(m => m.LocationComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'galpon',
                title: 'Gestión de Galpones',
                loadComponent: () => import('./components/pages/main/shed/shed.component').then(m => m.ShedComponent),
                canActivate: [AuthGuard]
              },
              { path: '', redirectTo: 'casa', pathMatch: 'full' }
            ]
          },

          // 🐔 SECCIÓN: GESTIÓN DE ANIMALES (Acceso: ADMIN y USER)
          {
            path: 'gestion-animales',
            children: [
              {
                path: 'gallinas',
                title: 'Registro de Gallinas',
                loadComponent: () => import('./components/pages/main/hen/hen.component').then(m => m.HenComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'produccion-huevos',
                title: 'Producción de Huevos',
                loadComponent: () => import('./components/pages/main/egg-production/egg-production.component').then(m => m.EggProductionComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'ciclo-vida',
                title: 'Ciclo de Vida',
                loadComponent: () => import('./components/pages/Functionality/lifecycle/lifecycle.component').then(m => m.LifecycleComponent),
                canActivate: [AuthGuard]
              },
              { path: '', redirectTo: 'gallinas', pathMatch: 'full' }
            ]
          },

          // 💉 SECCIÓN: SALUD Y VACUNACIÓN (Acceso: ADMIN y USER)
          {
            path: 'salud-vacunacion',
            children: [
              {
                path: 'vacunas',
                title: 'Registro de Vacunas',
                loadComponent: () => import('./components/pages/main/vaccine/vaccine.component').then(m => m.VaccineComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'aplicacion-vacunas',
                title: 'Aplicación de Vacunas',
                loadComponent: () => import('./components/pages/Functionality/vaccineAplications/vaccine-aplications.component').then(m => m.VaccineApplicationsComponent),
                canActivate: [AuthGuard]
              },
              { path: '', redirectTo: 'vacunas', pathMatch: 'full' }
            ]
          },

          // 🥬 SECCIÓN: ALIMENTACIÓN (Acceso: ADMIN y USER - Costos solo ADMIN)
          {
            path: 'alimentacion',
            children: [
              {
                path: 'alimentos',
                title: 'Registro de Alimentos',
                loadComponent: () => import('./components/pages/main/food/food.component').then(m => m.FoodComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'consumo-interno',
                title: 'Consumo Interno',
                loadComponent: () => import('./components/pages/Functionality/consumption-internal/consumption-internal.component').then(m => m.ConsumptionInternalComponent),
                canActivate: [AuthGuard]
              },
              // 🔒 SOLO ADMIN - Datos sensibles de costos
              {
                path: 'costo-alimento',
                title: 'Costo de Alimento',
                loadComponent: () => import('./components/pages/Functionality/costs-food/costs-food.component').then(m => m.CostsFoodComponent),
                canActivate: [AuthGuard],
                data: { role: 'ADMIN' }
              },
              { path: '', redirectTo: 'alimentos', pathMatch: 'full' }
            ]
          },

          // 🚚 SECCIÓN: PROVEEDORES Y COMPRAS (Acceso: ADMIN y USER - Costos solo ADMIN)
          {
            path: 'proveedores-compras',
            children: [
              {
                path: 'proveedores',
                title: 'Registro de Proveedores',
                loadComponent: () => import('./components/pages/main/proveedor/proveedor.component').then(m => m.ProveedorComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'tipo-proveedores',
                title: 'Tipos de Proveedores',
                loadComponent: () => import('./components/pages/main/type-supplier/type-supplier.component').then(m => m.TypeSupplierComponent),
                canActivate: [AuthGuard]
              },
              {
                path: 'productos',
                title: 'Catálogo de Productos',
                loadComponent: () => import('./components/pages/main/product/product.component').then(m => m.ProductComponent),
                canActivate: [AuthGuard]
              },
              // 🔒 SOLO ADMIN - Datos sensibles de costos
              {
                path: 'costos-adicionales',
                title: 'Costos Adicionales',
                loadComponent: () => import('./components/pages/Functionality/additional-cost/additional-cost.component').then(m => m.AdditionalCostComponent),
                canActivate: [AuthGuard],
                data: { role: 'ADMIN' }
              },
              { path: '', redirectTo: 'proveedores', pathMatch: 'full' }
            ]
          },

          // 💰 SECCIÓN: VENTAS Y FINANZAS (🔒 SOLO ADMIN - Datos muy sensibles)
          {
            path: 'ventas-finanzas',
            canActivate: [AuthGuard],
            data: { role: 'ADMIN' },
            children: [
              {
                path: 'ventas',
                title: 'Registro de Ventas',
                loadComponent: () => import('./components/pages/Functionality/sale/sale.component').then(m => m.SaleComponent),
                canActivate: [AuthGuard],
                data: { role: 'ADMIN' }
              },
              { path: '', redirectTo: 'ventas', pathMatch: 'full' }
            ]
          },

          // 📊 SECCIÓN: CONTROL DE INVENTARIOS (🔒 SOLO ADMIN - Datos sensibles)
          {
            path: 'control-inventarios',
            canActivate: [AuthGuard],
            data: { role: 'ADMIN' },
            children: [
              {
                path: 'kardex-huevos',
                title: 'Kardex de Huevos',
                loadComponent: () => import('./components/pages/Functionality/kardex-egg/kardex-egg.component').then(m => m.KardexEggComponent),
                canActivate: [AuthGuard],
                data: { role: 'ADMIN' }
              },
              {
                path: 'kardex-procesos',
                title: 'Kardex de Procesos',
                loadComponent: () => import('./components/pages/Functionality/kardex-process/kardex-process.component').then(m => m.KardexProcessComponent),
                canActivate: [AuthGuard],
                data: { role: 'ADMIN' }
              },
              {
                path: 'kardex-materias-primas',
                title: 'Kardex Materias Primas',
                loadComponent: () => import('./components/pages/Functionality/kardex-primal/kardex-primal.component').then(m => m.KardexPrimalComponent),
                canActivate: [AuthGuard],
                data: { role: 'ADMIN' }
              },
              { path: '', redirectTo: 'kardex-huevos', pathMatch: 'full' }
            ]
          },

          // Ruta por defecto para el módulo
          { path: '', redirectTo: 'configuracion-basica', pathMatch: 'full' }
        ]
      },

      {
        path: 'modulo-bienestar-comun',
        children: [
          {
            path: 'masters',
            title: 'Maestros Bienestar',
            loadComponent: () => import('./components/pages/main/masters.component').then(m => m.MastersComponent)
          },
          { path: '', redirectTo: 'masters', pathMatch: 'full' }
        ]
      },

      {
        path: 'modulo-psicologia',
        children: [
          {
            path: 'masters',
            title: 'Maestros Psicología',
            loadComponent: () => import('./components/pages/main/food/food.component').then(m => m.FoodComponent)
          },
          { path: '', redirectTo: 'masters', pathMatch: 'full' }
        ]
      },

      // Módulo de perfil
      {
        path: 'perfil',
        component: ProfileComponent,
        canActivate: [AuthGuard]
      },

      // Módulo de configuración
      {
        path: 'configuracion',
        component: ConfigurationComponent,
        canActivate: [AuthGuard]
      }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];