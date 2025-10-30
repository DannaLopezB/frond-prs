import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProductService } from '../../../../../service/product.service';
import { Product } from '../../../../../interfaces/Product';
import { SupplierService } from '../../../../../service/supplier.service';
import { Supplier } from '../../../../../interfaces/Supplier';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, FormsModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  // suppliers: Supplier[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalItems: number = 0;
  statusActive: boolean = true; // Por defecto muestra productos activos
  isLoading: boolean = false;
  
  // Tipos de producto para filtrar
  selectedProductType: string = 'ALL'; // Por defecto muestra todos los tipos
  productTypes = [
    { code: 'ALL', description: 'Todos' },
    { code: 'MP', description: 'Materias Primas' },
    { code: 'PP', description: 'Productos en Proceso' },
    { code: 'PT', description: 'Productos Terminados' }
  ];
  
  // Modal properties
  showModal: boolean = false;
  editMode: boolean = false;
  currentProduct: Product = this.getEmptyProduct();

  constructor(
    private productService: ProductService,
    // private supplierService: SupplierService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    //this.loadSuppliers();
  }

  // Cargar todos los productos
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilters(); // Aplicar filtros al cargar datos
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    });
  }

  // Aplicar filtros según el estado y tipo de producto seleccionado
  applyFilters(): void {
    // Filtramos según el estado seleccionado (A = Activo, I = Inactivo)
    this.filteredProducts = this.products.filter(p => {
      // Primero filtramos por estado
      const statusMatch = this.statusActive ? p.status === 'A' : p.status === 'I';
      
      // Luego filtramos por tipo de producto (si no es 'ALL')
      const typeMatch = this.selectedProductType === 'ALL' || p.typeProduct === this.selectedProductType;
      
      // Debe cumplir ambas condiciones
      return statusMatch && typeMatch;
    });
    
    this.totalItems = this.filteredProducts.length;
    this.currentPage = 1; // Reiniciar a la primera página al filtrar
  }

  // Seleccionar un tipo de producto para filtrar
  selectProductType(type: string): void {
    this.selectedProductType = type;
    this.applyFilters();
  }

  // Obtener texto descriptivo del filtro de tipo de producto actual
  getProductTypeFilterText(): string {
    if (this.selectedProductType === 'ALL') return '';
    
    const productType = this.productTypes.find(t => t.code === this.selectedProductType);
    return productType ? `de tipo ${productType.description}` : '';
  }

  // Obtener el texto descriptivo del tipo de producto
  getProductTypeText(code: string): string {
    if (!code) return 'No especificado'; // Manejo para valores undefined o vacíos
    
    switch(code) {
      case 'MP': return 'Materia Prima';
      case 'PP': return 'Producto en Proceso';
      case 'PT': return 'Producto Terminado';
      default: return code;
    }
  }

  // Obtener productos paginados para mostrar en la tabla
  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  // Cambiar de página en el paginador
  cambiarPagina(nuevaPagina: number): void {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      this.currentPage = nuevaPagina;
    }
  }

  // Generar array de páginas para el paginador
  getPages(): number[] {
    if (this.totalItems === 0) return [];
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Si hay muchas páginas, mostrar solo un número limitado
    if (totalPages > 5) {
      const pages = [];
      // Siempre mostrar primera página
      pages.push(1);
      
      // Mostrar páginas alrededor de la actual
      let startPage = Math.max(2, this.currentPage - 1);
      let endPage = Math.min(totalPages - 1, this.currentPage + 1);
      
      // Agregar ellipsis si es necesario
      if (startPage > 2) {
        pages.push(-1); // Usamos -1 como marcador para mostrar "..."
      }
      
      // Agregar páginas intermedias
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Agregar ellipsis si es necesario
      if (endPage < totalPages - 1) {
        pages.push(-2); // Usamos -2 como otro marcador para mostrar "..."
      }
      
      // Siempre mostrar última página
      pages.push(totalPages);
      
      return pages;
    }
    
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Crear un producto vacío para el formulario
  getEmptyProduct(): Product {
    return {
      id: 0, // Este campo se necesita por la interfaz Product pero será ignorado en el backend
      type: '',
      description: '',
      packageWeight: 0,
      pricePerKg: 0,
      stock: 0,
      entryDate: new Date().toISOString().split('T')[0], // Fecha actual formateada para input date
      typeProduct: '', // Vacío por defecto
      status: 'A', // Activo por defecto
    };
  }

  // Abrir modal para agregar un nuevo producto
  addProduct(): void {
    this.editMode = false;
    this.currentProduct = this.getEmptyProduct();
    this.showModal = true;
  }

  // Abrir modal para editar o crear un producto
  openModal(product?: Product): void {
    if (product) {
      // Modo edición
      this.editMode = true;
      // Crear una copia para no modificar directamente el objeto original
      this.currentProduct = { ...product };
      
      // Formatear correctamente la fecha para que sea un Date
      if (this.currentProduct.entryDate && typeof this.currentProduct.entryDate === 'string') {
        const [year, month, day] = this.currentProduct.entryDate.split('-');
        const entry = new Date(Number(year), Number(month) - 1, Number(day));
      }
    } else {
      // Modo creación
      this.editMode = false;
      this.currentProduct = this.getEmptyProduct();
    }
    
    this.showModal = true;
  }

  // Cerrar modal
  closeModal(): void {
    this.showModal = false;
  }

  // Guardar producto (crear nuevo o actualizar existente)
  saveProduct(): void {
    // Validar que todos los campos requeridos estén completos
    if (!this.currentProduct.type || 
        !this.currentProduct.description || 
        !this.currentProduct.packageWeight || 
        this.currentProduct.packageWeight <= 0 ||
        (!this.currentProduct.stock && this.currentProduct.stock !== 0) || 
        !this.currentProduct.typeProduct) {
      
      Swal.fire('Error', 'Por favor complete todos los campos obligatorios', 'error');
      return;
    }
    
    this.isLoading = true;
    
    if (this.editMode) {
      // Actualizar producto existente
      this.productService.update(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.isLoading = false;
          this.closeModal();
          Swal.fire('Éxito', 'Producto actualizado correctamente', 'success');
          this.loadProducts(); // Recargar productos
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.isLoading = false;
          Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
        }
      });
    } else {
      // Crear nuevo producto - usamos la misma estructura pero el backend ignorará el id
      // Opción 1: Omitir el id usando desestructuración
      const { id, ...productWithoutId } = this.currentProduct;
      
      this.productService.create(productWithoutId as any).subscribe({
        next: () => {
          this.isLoading = false;
          this.closeModal();
          Swal.fire('Éxito', 'Producto creado correctamente', 'success');
          this.loadProducts(); // Recargar productos
        },
        error: (err) => {
          console.error('Error creating product:', err);
          this.isLoading = false;
          Swal.fire('Error', 'No se pudo crear el producto', 'error');
        }
      });
    }
  }

  // Eliminación lógica del producto (cambiar estado a Inactivo)
  softDeleteProduct(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El producto será eliminado.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.productService.softDelete(id).subscribe({
          next: () => {
            this.isLoading = false;
            Swal.fire('Eliminado', 'El producto ha sido eliminado.', 'success');
            this.loadProducts(); // Recargar productos
          },
          error: (err) => {
            console.error('Error deleting product:', err);
            this.isLoading = false;
            Swal.fire('Error', 'No se pudo eliminar el producto', 'error');
          }
        });
      }
    });
  }

  // Restaurar producto eliminado lógicamente (cambiar estado a Activo)
  restoreProduct(id: number): void {
    Swal.fire({
      title: '¿Restaurar producto?',
      text: 'El producto volverá a estar disponible.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.productService.restore(id).subscribe({
          next: () => {
            this.isLoading = false;
            Swal.fire('Restaurado', 'El producto ha sido restaurado.', 'success');
            this.loadProducts(); // Recargar productos
          },
          error: (err) => {
            console.error('Error restoring product:', err);
            this.isLoading = false;
            Swal.fire('Error', 'No se pudo restaurar el producto', 'error');
          }
        });
      }
    });
  }

// Función para generar el reporte PDF - VERSIÓN FILTRADA
generatePDFReport(): void {
  const doc = new jsPDF();
  
  // Configurar colores usando tuplas para evitar error de TypeScript
  const primaryColor: [number, number, number] = [37, 99, 235]; // Azul
  const secondaryColor: [number, number, number] = [59, 130, 246]; // Azul claro
  const accentColor: [number, number, number] = [16, 185, 129]; // Verde
  
  // Título principal con estilo
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE PRODUCTOS', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Subtítulo dinámico basado en los filtros activos
  let subtitle = 'Sistema de Gestión de Inventario';
  if (this.selectedProductType !== 'ALL') {
    const productType = this.productTypes.find(t => t.code === this.selectedProductType);
    subtitle += ` - ${productType?.description || this.selectedProductType}`;
  }
  if (!this.statusActive) {
    subtitle += ' (Productos Inactivos)';
  }
  
  doc.text(subtitle, 105, 28, { align: 'center' });
  
  // Información del reporte
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha de generación: ${currentDate}`, 20, 45);
  
  // Información del filtro aplicado
  let filterInfo = `Estado: ${this.statusActive ? 'Activos' : 'Inactivos'}`;
  if (this.selectedProductType !== 'ALL') {
    const productType = this.productTypes.find(t => t.code === this.selectedProductType);
    filterInfo += ` | Tipo: ${productType?.description || this.selectedProductType}`;
  }
  doc.text(`Filtros aplicados: ${filterInfo}`, 20, 50);
  
  // Estadísticas basadas en productos filtrados
  const filteredActiveProducts = this.filteredProducts.filter(p => p.status === 'A').length;
  const filteredInactiveProducts = this.filteredProducts.filter(p => p.status === 'I').length;
  const totalFilteredProducts = this.filteredProducts.length;
  
  // Estadísticas por tipo (solo de los productos filtrados)
  const mpCount = this.filteredProducts.filter(p => p.typeProduct === 'MP').length;
  const ppCount = this.filteredProducts.filter(p => p.typeProduct === 'PP').length;
  const ptCount = this.filteredProducts.filter(p => p.typeProduct === 'PT').length;
  
  // Cuadro de estadísticas
  doc.setFillColor(240, 248, 255);
  doc.rect(15, 60, 180, 35, 'F');
  doc.setDrawColor(...primaryColor);
  doc.rect(15, 60, 180, 35, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN', 105, 72, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  // Primera fila de estadísticas
  doc.text(`Total Mostrado: ${totalFilteredProducts}`, 25, 82);
  if (this.statusActive) {
    doc.text(`Productos Activos: ${filteredActiveProducts}`, 105, 82);
  } else {
    doc.text(`Productos Inactivos: ${filteredInactiveProducts}`, 105, 82);
  }
  
  // Segunda fila - por tipo (solo si no se está filtrando por un tipo específico)
  if (this.selectedProductType === 'ALL') {
    doc.text(`MP: ${mpCount} | PP: ${ppCount} | PT: ${ptCount}`, 25, 89);
  } else {
    // Si se está filtrando por tipo específico, mostrar solo ese tipo
    const currentTypeCount = this.filteredProducts.length;
    const currentTypeName = this.productTypes.find(t => t.code === this.selectedProductType)?.description;
    doc.text(`${currentTypeName}: ${currentTypeCount}`, 25, 89);
  }
  
  // Calcular stock total de productos filtrados
  const totalStock = this.filteredProducts
    .reduce((sum, p) => sum + (p.stock || 0), 0);
  
  // Calcular peso total de productos filtrados
  const totalWeight = this.filteredProducts
    .reduce((sum, p) => sum + (p.packageWeight || 0), 0);
  
  // Preparar datos para la tabla usando SOLO los productos filtrados
  const tableData = this.filteredProducts.map(product => [
    product.type || '',
    product.description || '',
    `${product.packageWeight || 0} kg`,
    (product.stock || 0).toString(),
    this.formatDate(product.entryDate),
    this.getProductTypeText(product.typeProduct || ''),
    product.status === 'A' ? 'Activo' : 'Inactivo'
  ]);
  
  // Verificar si hay datos para mostrar
  if (tableData.length === 0) {
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(14);
    doc.text('No hay productos para mostrar con los filtros aplicados', 105, 120, { align: 'center' });
    
    // Descargar el PDF aunque esté vacío
    const fileName = `reporte_productos_${this.getFilterFileName()}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    Swal.fire({
      title: 'Reporte Generado',
      text: 'El reporte PDF se ha generado, pero no hay productos para mostrar con los filtros actuales.',
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
    return;
  }
  
  // Configurar y generar la tabla
  autoTable(doc, {
    startY: 105,
    head: [['Tipo', 'Descripción', 'Peso', 'Stock', 'Fecha Ingreso', 'Tipo Producto', 'Estado']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 40, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 15, right: 15 }
  });
  
  // Agregar información adicional al final
  const finalY = (doc as any).lastAutoTable.finalY || 200;
  
  // Cuadro de totales
  doc.setFillColor(240, 253, 244);
  doc.rect(15, finalY + 10, 180, 25, 'F');
  doc.setDrawColor(...accentColor);
  doc.rect(15, finalY + 10, 180, 25, 'S');
  
  doc.setTextColor(...accentColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Total', 105, finalY + 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Stock Total: ${totalStock} unidades`, 25, finalY + 30);
  doc.text(`Peso Total: ${totalWeight.toFixed(2)} kg`, 120, finalY + 30);
  
  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generado por Sistema de Gestión de Inventario', 105, pageHeight - 15, { align: 'center' });
  doc.text(`Página 1 de 1 - ${currentDate}`, 105, pageHeight - 10, { align: 'center' });
  
  // Descargar el PDF con nombre descriptivo
  const fileName = `reporte_productos_${this.getFilterFileName()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  // Mostrar notificación de éxito
  Swal.fire({
    title: '¡Reporte Generado!',
    text: `El reporte PDF de ${this.getFilterDescription()} se ha descargado correctamente.`,
    icon: 'success',
    confirmButtonText: 'Entendido'
  });
}

// Función auxiliar para formatear fechas - MÉTODO FALTANTE
private formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return 'N/A';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error en fecha';
  }
}

// Función auxiliar para obtener el nombre del archivo basado en filtros
private getFilterFileName(): string {
  let fileName = this.statusActive ? 'activos' : 'inactivos';
  
  if (this.selectedProductType !== 'ALL') {
    fileName += `_${this.selectedProductType.toLowerCase()}`;
  } else {
    fileName += '_todos';
  }
  
  return fileName;
}

// Función auxiliar para obtener descripción del filtro para el mensaje
private getFilterDescription(): string {
  let description = this.statusActive ? 'productos activos' : 'productos inactivos';
  
  if (this.selectedProductType !== 'ALL') {
    const productType = this.productTypes.find(t => t.code === this.selectedProductType);
    description += ` de tipo ${productType?.description || this.selectedProductType}`;
  }
  
  return description;
}

// Agrega estos métodos a tu clase ProductComponent

// Método para calcular el stock total de todos los productos (sin filtros)
getTotalStock(): number {
  return this.products.reduce((total, product) => total + (product.stock || 0), 0);
}

// Método para calcular el stock total de productos filtrados (los que se muestran actualmente)
getFilteredTotalStock(): number {
  return this.filteredProducts.reduce((total, product) => total + (product.stock || 0), 0);
}

// Método para obtener estadísticas detalladas de stock
getStockStatistics() {
  const totalStock = this.getTotalStock();
  const filteredStock = this.getFilteredTotalStock();
  
  // Stock por estado
  const activeStock = this.products
    .filter(p => p.status === 'A')
    .reduce((total, product) => total + (product.stock || 0), 0);
    
  const inactiveStock = this.products
    .filter(p => p.status === 'I')
    .reduce((total, product) => total + (product.stock || 0), 0);

  // Stock por tipo de producto
  const mpStock = this.products
    .filter(p => p.typeProduct === 'MP')
    .reduce((total, product) => total + (product.stock || 0), 0);
    
  const ppStock = this.products
    .filter(p => p.typeProduct === 'PP')
    .reduce((total, product) => total + (product.stock || 0), 0);
    
  const ptStock = this.products
    .filter(p => p.typeProduct === 'PT')
    .reduce((total, product) => total + (product.stock || 0), 0);

  return {
    total: totalStock,
    filtered: filteredStock,
    byStatus: {
      active: activeStock,
      inactive: inactiveStock
    },
    byType: {
      materiasPrimas: mpStock,
      productosEnProceso: ppStock,
      productosTerminados: ptStock
    }
  };
}

// Método para mostrar un modal con el resumen de stock
showStockSummary(): void {
  const stats = this.getStockStatistics();
  
  const htmlContent = `
    <div style="text-align: left;">
      <h4 style="color: #2563eb; margin-bottom: 15px;">📊 Resumen Total de Stock</h4>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <strong>Stock General:</strong><br>
        • Total de productos: <span style="color: #059669; font-weight: bold;">${stats.total.toLocaleString()} unidades</span><br>
        • Stock mostrado (filtrado): <span style="color: #0891b2; font-weight: bold;">${stats.filtered.toLocaleString()} unidades</span>
      </div>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <strong>Por Estado:</strong><br>
        • Productos Activos: <span style="color: #059669;">${stats.byStatus.active.toLocaleString()} unidades</span><br>
        • Productos Inactivos: <span style="color: #dc2626;">${stats.byStatus.inactive.toLocaleString()} unidades</span>
      </div>
      
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">
        <strong>Por Tipo de Producto:</strong><br>
        • Materias Primas (MP): <span style="color: #7c3aed;">${stats.byType.materiasPrimas.toLocaleString()} unidades</span><br>
        • Productos en Proceso (PP): <span style="color: #ea580c;">${stats.byType.productosEnProceso.toLocaleString()} unidades</span><br>
        • Productos Terminados (PT): <span style="color: #059669;">${stats.byType.productosTerminados.toLocaleString()} unidades</span>
      </div>
    </div>
  `;

  Swal.fire({
    title: 'Resumen de Stock',
    html: htmlContent,
    icon: 'info',
    confirmButtonText: 'Cerrar',
    width: '600px',
    confirmButtonColor: '#2563eb'
  });
}

// Método para obtener productos con stock bajo (opcional)
getLowStockProducts(threshold: number = 10): Product[] {
  return this.products.filter(p => p.status === 'A' && (p.stock || 0) <= threshold);
}

// Propiedades para el filtro de fechas
dateFilterEnabled: boolean = false;
startDate: string = '';
endDate: string = '';

// Método principal de filtrado (renombrado para evitar conflictos)
filterProducts(): void {
  this.filteredProducts = this.products.filter(p => {
    const statusMatch = this.statusActive ? p.status === 'A' : p.status === 'I';
    const typeMatch = this.selectedProductType === 'ALL' || p.typeProduct === this.selectedProductType;
    
    let dateMatch = true;
    if (this.dateFilterEnabled && (this.startDate || this.endDate)) {
      dateMatch = this.checkProductDateRange(p);
    }
    
    return statusMatch && typeMatch && dateMatch;
  });
  
  this.totalItems = this.filteredProducts.length;
  this.currentPage = 1;
}

// Verificar si producto está en rango de fechas
private checkProductDateRange(product: Product): boolean {
  if (!product.entryDate) return false;
  
  let productDate: Date;
  if (typeof product.entryDate === 'string') {
    productDate = new Date(product.entryDate);
  } else {
    productDate = product.entryDate;
  }
  
  if (isNaN(productDate.getTime())) return false;
  
  let withinRange = true;
  
  if (this.startDate) {
    const startDateObj = new Date(this.startDate);
    withinRange = withinRange && productDate >= startDateObj;
  }
  
  if (this.endDate) {
    const endDateObj = new Date(this.endDate);
    endDateObj.setHours(23, 59, 59, 999);
    withinRange = withinRange && productDate <= endDateObj;
  }
  
  return withinRange;
}

switchDateFilter(): void {
  this.dateFilterEnabled = !this.dateFilterEnabled;

  if (!this.dateFilterEnabled) {
    this.startDate = '';
    this.endDate = '';
  }

  this.filterProducts();
}



// Limpiar filtro de fechas
resetDateFilter(): void {
  this.startDate = '';
  this.endDate = '';
  this.dateFilterEnabled = false;
  this.filterProducts();
}

// Ejecutar filtro cuando cambian fechas
handleDateChange(): void {
  if (this.dateFilterEnabled) {
    this.filterProducts();
  }
}

// Obtener texto descriptivo del filtro
getDateRangeText(): string {
  if (!this.dateFilterEnabled || (!this.startDate && !this.endDate)) {
    return '';
  }
  
  let text = '';
  
  if (this.startDate && this.endDate) {
    const startFormatted = this.displayFormattedDate(this.startDate);
    const endFormatted = this.displayFormattedDate(this.endDate);
    text = `desde ${startFormatted} hasta ${endFormatted}`;
  } else if (this.startDate) {
    const startFormatted = this.displayFormattedDate(this.startDate);
    text = `desde ${startFormatted}`;
  } else if (this.endDate) {
    const endFormatted = this.displayFormattedDate(this.endDate);
    text = `hasta ${endFormatted}`;
  }
  
  return text;
}

// Formatear fecha para mostrar
private displayFormattedDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Establecer rangos predefinidos
setDateRangePreset(preset: string): void {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  switch (preset) {
    case 'today':
      this.startDate = today.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
      break;
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      this.startDate = yesterday.toISOString().split('T')[0];
      this.endDate = yesterday.toISOString().split('T')[0];
      break;
      
    case 'thisWeek':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      this.startDate = startOfWeek.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
      break;
      
    case 'thisMonth':
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      this.startDate = startOfMonth.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
      break;
      
    case 'lastMonth':
      const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfLastMonth = new Date(currentYear, currentMonth, 0);
      this.startDate = startOfLastMonth.toISOString().split('T')[0];
      this.endDate = endOfLastMonth.toISOString().split('T')[0];
      break;
      
    case 'last30Days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
      break;
      
    case 'last90Days':
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 90);
      this.startDate = ninetyDaysAgo.toISOString().split('T')[0];
      this.endDate = today.toISOString().split('T')[0];
      break;
      
    default:
      return;
  }
  
  this.dateFilterEnabled = true;
  this.filterProducts();
}

// Validar rango de fechas
checkDateRangeValid(): boolean {
  if (!this.startDate || !this.endDate) return true;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (start > end) {
    Swal.fire({
      title: 'Error en fechas',
      text: 'La fecha de inicio no puede ser mayor que la fecha de fin',
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
    return false;
  }
  
  return true;
}

// Obtener estadísticas por fecha
getDateFilterStatistics() {
  if (!this.dateFilterEnabled) return null;
  
  const filteredByDate = this.products.filter(p => this.checkProductDateRange(p));
  const totalInRange = filteredByDate.length;
  const activeInRange = filteredByDate.filter(p => p.status === 'A').length;
  const stockInRange = filteredByDate.reduce((sum, p) => sum + (p.stock || 0), 0);
  
  return {
    total: totalInRange,
    active: activeInRange,
    inactive: totalInRange - activeInRange,
    stock: stockInRange
  };
}

}