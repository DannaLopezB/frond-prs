import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Tarjetas completas organizadas por categorías logísticas
  dashboardCategories = [
    {
      category: 'Producción',
      icon: 'industry',
      cards: [
        {
          title: 'Gallinas',
          description: 'Gestión y seguimiento de gallinas',
          icon: 'feather',
          route: '/Modulo-Galpon/Gallinas',
          color: 'from-amber-500 to-yellow-400'
        },
        {
          title: 'Producción de huevos',
          description: 'Control de producción diaria',
          icon: 'egg',
          route: '/Modulo-Galpon/Producción de huevos',
          color: 'from-cyan-500 to-blue-400'
        },
        {
          title: 'Ciclo de vida',
          description: 'Control del ciclo productivo',
          icon: 'sync',
          route: '/Modulo-Galpon/Ciclo de vida',
          color: 'from-teal-500 to-cyan-400'
        },
      ]
    },
    {
      category: 'Infraestructura',
      icon: 'warehouse',
      cards: [
        {
          title: 'Galpón',
          description: 'Administración de espacios',
          icon: 'home',
          route: '/Modulo-Galpon/Galpon',
          color: 'from-red-500 to-orange-400'
        },
        {
          title: 'Ubicaciones',
          description: 'Gestión de ubicaciones',
          icon: 'map-pin',
          route: '/Modulo-Galpon/Ubicaciones',
          color: 'from-rose-500 to-pink-400'
        },
      ]
    },
    {
      category: 'Insumos y Salud',
      icon: 'heartbeat',
      cards: [
        {
          title: 'Alimento',
          description: 'Control de alimentación',
          icon: 'drumstick-bite',
          route: '/Modulo-Galpon/Alimento',
          color: 'from-green-500 to-emerald-400'
        },
        {
          title: 'Vacunas',
          description: 'Calendario y registro de vacunación',
          icon: 'syringe',
          route: '/Modulo-Galpon/Vacunas',
          color: 'from-purple-500 to-violet-400'
        },
        {
          title: 'Aplicación Vacunas',
          description: 'Registro de aplicación de vacunas',
          icon: 'clipboard-check',
          route: '/Modulo-Galpon/VaccineApliocations',
          color: 'from-fuchsia-500 to-purple-400'
        },
      ]
    },
    {
      category: 'Inventario y Costos',
      icon: 'boxes',
      cards: [
        {
          title: 'Kardex Producto Terminados',
          description: 'Movimientos de inventario en ventas',
          icon: 'clipboard-list',
          route: '/Modulo-Galpon/Kardex',
          color: 'from-indigo-500 to-blue-400'
        },
        {
          title: 'Kardex de Procesos',
          description: 'Control de procesos productivos',
          icon: 'tasks',
          route: '/Modulo-Galpon/Kardex de Procesos',
          color: 'from-blue-500 to-indigo-400'
        },
        {
          title: 'Kardex Materias Primas',
          description: 'Gestión de inventario de insumos',
          icon: 'boxes',
          route: '/Modulo-Galpon/Kardex Materias Primas',
          color: 'from-emerald-500 to-green-400'
        },
        {
          title: 'Costo de alimento',
          description: 'Control de costos de alimentación',
          icon: 'receipt',
          route: '/Modulo-Galpon/Costo de alimento',
          color: 'from-green-500 to-teal-400'
        },
        {
          title: 'Costo Adicional',
          description: 'Registro de costos adicionales',
          icon: 'file-invoice-dollar',
          route: '/Modulo-Galpon/COSTO ADICIONAL',
          color: 'from-amber-500 to-yellow-400'
        },
      ]
    },
    {
      category: 'Comercial',
      icon: 'shopping-cart',
      cards: [
        {
          title: 'Ventas',
          description: 'Registro y control de ventas',
          icon: 'shopping-cart',
          route: '/Modulo-Galpon/Ventas',
          color: 'from-pink-500 to-rose-400'
        },
        {
          title: 'Proveedores',
          description: 'Gestión de proveedores',
          icon: 'truck',
          route: '/Modulo-Galpon/Proveedor',
          color: 'from-blue-500 to-indigo-400'
        },
        {
          title: 'Tipo Proveedores',
          description: 'Categorías de proveedores',
          icon: 'tags',
          route: '/Modulo-Galpon/Tipo-Proveedores',
          color: 'from-yellow-500 to-amber-400'
        },
        {
          title: 'Productos',
          description: 'Gestión de productos',
          icon: 'box',
          route: '/Modulo-Galpon/Productos',
          color: 'from-teal-500 to-cyan-400'
        },
      ]
    }
  ];

  // Lista plana de todas las tarjetas para compatibilidad con código existente
  get dashboardCards() {
    return this.dashboardCategories.flatMap(category => category.cards);
  }

  // Stats para el panel superior
  stats = [
    { title: 'Total Gallinas', value: '5,240', trend: '+3.2%', icon: 'feather', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    { title: 'Producción Diaria', value: '4,827', trend: '+2.7%', icon: 'egg', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' },
    { title: 'Galpones Activos', value: '12', trend: '0%', icon: 'home', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    { title: 'Eficiencia', value: '92%', trend: '+1.2%', icon: 'chart-line', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' }
  ];

  // Datos simulados para el panel de alertas
  alerts = [
    { title: 'Vacunación pendiente', message: 'Galpón #3 requiere vacunación programada', severity: 'high', date: '2025-05-05', icon: 'exclamation-triangle' },
    { title: 'Stock bajo de alimento', message: 'El alimento tipo A está por debajo del nivel mínimo', severity: 'medium', date: '2025-05-04', icon: 'exclamation-circle' },
    { title: 'Producción reducida', message: 'Galpón #5 reporta reducción del 5% en producción', severity: 'medium', date: '2025-05-03', icon: 'chart-line-down' }
  ];

  // Para controles de filtro rápido
  selectedPeriod = 'week';
  
  // Para control de visualización de categorías
  expandedCategories: { [key: string]: boolean } = {};
  
  // Datos simulados para gráfico
  chartData = [
    { day: 'Lun', production: 4810 },
    { day: 'Mar', production: 4920 },
    { day: 'Mié', production: 4780 },
    { day: 'Jue', production: 4850 },
    { day: 'Vie', production: 4827 },
    { day: 'Sáb', production: 4790 },
    { day: 'Dom', production: 4760 }
  ];

  constructor() {}

  ngOnInit(): void {
    // Inicializar todas las categorías como expandidas
    this.dashboardCategories.forEach(category => {
      this.expandedCategories[category.category] = true;
    });
  }

  toggleCategory(category: string): void {
    this.expandedCategories[category] = !this.expandedCategories[category];
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories[category];
  }

  changeTimePeriod(period: string) {
    this.selectedPeriod = period;
    // Aquí se implementaría la lógica para actualizar datos según el período
  }

  getIconClass(icon: string): string {
    // Mapea nuestros nombres de iconos a clases de Fontawesome
    return `fa-${icon}`;
  }
}