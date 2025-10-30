export interface Route {
  title: string;
  path: string;
  icon?: string;
  children?: Route[];
  role?: string[];
}

export const MENU_ITEMS: Route[] = [
  {
    title: "Dashboard General",
    path: "/dashboard",
    icon: "chart-bar",
    role: ["ADMIN", "USER"],
  },
  {
    title: "Usuarios",
    path: "/usuarios",
    icon: "users",
    role: ["ADMIN"],
  },
  {
    title: "Módulo Galpón",
    path: "/modulo-galpon",
    icon: "warehouse",
    role: ["ADMIN", "USER"],
    children: [
      // 🏗️ CONFIGURACIÓN BÁSICA
      {
        title: "Configuración Básica",
        path: "/modulo-galpon/configuracion-basica",
        icon: "cogs",
        role: ["ADMIN", "USER"],
        children: [
          { 
            title: "Gestión de Casas", 
            path: "/modulo-galpon/configuracion-basica/casa", 
            icon: "house", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Ubicaciones", 
            path: "/modulo-galpon/configuracion-basica/ubicaciones", 
            icon: "map-marker", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Galpones", 
            path: "/modulo-galpon/configuracion-basica/galpon", 
            icon: "home", 
            role: ["ADMIN", "USER"] 
          },
        ],
      },
      
      // 🐔 GESTIÓN DE ANIMALES
      {
        title: "Gestión de Animales",
        path: "/modulo-galpon/gestion-animales",
        icon: "dove",
        role: ["ADMIN", "USER"],
        children: [
          { 
            title: "Registro de Gallinas", 
            path: "/modulo-galpon/gestion-animales/gallinas", 
            icon: "feather", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Producción de Huevos", 
            path: "/modulo-galpon/gestion-animales/produccion-huevos", 
            icon: "egg", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Ciclo de Vida", 
            path: "/modulo-galpon/gestion-animales/ciclo-vida", 
            icon: "sync", 
            role: ["ADMIN", "USER"] 
          },
        ],
      },

      // 💉 SALUD Y VACUNACIÓN
      {
        title: "Salud y Vacunación",
        path: "/modulo-galpon/salud-vacunacion",
        icon: "heartbeat",
        role: ["ADMIN", "USER"],
        children: [
          { 
            title: "Registro de Vacunas", 
            path: "/modulo-galpon/salud-vacunacion/vacunas", 
            icon: "syringe", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Aplicación de Vacunas", 
            path: "/modulo-galpon/salud-vacunacion/aplicacion-vacunas", 
            icon: "prescription-bottle-alt", 
            role: ["ADMIN", "USER"] 
          },
        ],
      },

      // 🥬 ALIMENTACIÓN
      {
        title: "Alimentación",
        path: "/modulo-galpon/alimentacion",
        icon: "seedling",
        role: ["ADMIN", "USER"],
        children: [
          { 
            title: "Registro de Alimentos", 
            path: "/modulo-galpon/alimentacion/alimentos", 
            icon: "bone", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Consumo Interno", 
            path: "/modulo-galpon/alimentacion/consumo-interno", 
            icon: "utensils", 
            role: ["ADMIN", "USER"] 
          },
          // 🔒 Visible para todos, pero solo ADMIN puede acceder
          { 
            title: "💰 Costo de Alimento", 
            path: "/modulo-galpon/alimentacion/costo-alimento", 
            icon: "dollar-sign", 
            role: ["ADMIN", "USER"] // Visible para ambos, guard controla acceso
          },
        ],
      },

      // 🚚 PROVEEDORES Y COMPRAS
      {
        title: "Proveedores y Compras",
        path: "/modulo-galpon/proveedores-compras",
        icon: "truck",
        role: ["ADMIN", "USER"],
        children: [
          { 
            title: "Registro de Proveedores", 
            path: "/modulo-galpon/proveedores-compras/proveedores", 
            icon: "truck", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Tipos de Proveedores", 
            path: "/modulo-galpon/proveedores-compras/tipo-proveedores", 
            icon: "tags", 
            role: ["ADMIN", "USER"] 
          },
          { 
            title: "Catálogo de Productos", 
            path: "/modulo-galpon/proveedores-compras/productos", 
            icon: "box", 
            role: ["ADMIN", "USER"] 
          },
          // 🔒 Visible para todos, pero solo ADMIN puede acceder
          { 
            title: "💰 Costos Adicionales", 
            path: "/modulo-galpon/proveedores-compras/costos-adicionales", 
            icon: "money-bill", 
            role: ["ADMIN", "USER"] // Visible para ambos, guard controla acceso
          },
        ],
      },

      // 💰 VENTAS Y FINANZAS - Visible para todos, restringido por guard
      {
        title: "💰 Ventas y Finanzas",
        path: "/modulo-galpon/ventas-finanzas",
        icon: "chart-line",
        role: ["ADMIN", "USER"], // Visible para ambos roles
        children: [
          { 
            title: "Registro de Ventas", 
            path: "/modulo-galpon/ventas-finanzas/ventas", 
            icon: "shopping-cart", 
            role: ["ADMIN", "USER"] // Visible para ambos, pero guard controla acceso
          },
        ],
      },

      // 📊 CONTROL DE INVENTARIOS - Visible para todos, restringido por guard
      {
        title: "📊 Control de Inventarios",
        path: "/modulo-galpon/control-inventarios",
        icon: "clipboard-list",
        role: ["ADMIN", "USER"], // Visible para ambos roles
        children: [
          { 
            title: "Kardex de Huevos", 
            path: "/modulo-galpon/control-inventarios/kardex-huevos", 
            icon: "clipboard-list", 
            role: ["ADMIN", "USER"] // Visible para ambos, pero guard controla acceso
          },
          { 
            title: "Kardex de Procesos", 
            path: "/modulo-galpon/control-inventarios/kardex-procesos", 
            icon: "clipboard-check", 
            role: ["ADMIN", "USER"] // Visible para ambos, pero guard controla acceso
          },
          { 
            title: "Kardex Materias Primas", 
            path: "/modulo-galpon/control-inventarios/kardex-materias-primas", 
            icon: "clipboard", 
            role: ["ADMIN", "USER"] // Visible para ambos, pero guard controla acceso
          },
        ],
      },
    ],
  },
  {
    title: "Módulo Bienestar Común",
    path: "/modulo-bienestar-comun",
    icon: "heart",
    role: ["ADMIN", "USER"],
    children: [
      { title: "Maestros", path: "/modulo-bienestar-comun/masters", icon: "folder", role: ["ADMIN", "USER"] },
    ],
  },
  {
    title: "Módulo Psicología",
    path: "/modulo-psicologia",
    icon: "brain",
    role: ["ADMIN", "USER"],
    children: [
      { title: "Maestros", path: "/modulo-psicologia/masters", icon: "folder-open", role: ["ADMIN", "USER"] },
    ],
  },
];