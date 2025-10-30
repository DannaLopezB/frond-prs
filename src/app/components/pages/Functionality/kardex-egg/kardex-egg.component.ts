import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Servicios y modelos
import { TypeKardexService } from '../../../../../service/type-kardex.service';
import { TypeKardex } from '../../../../../interfaces/TypeKardex';
import { ProductService } from '../../../../../service/product.service';
import { Product } from '../../../../../interfaces/Product';
import { SupplierService } from '../../../../../service/supplier.service';
import { Supplier } from '../../../../../interfaces/Supplier';
import { ShedService } from '../../../../../service/shed.service';
import { Shed } from '../../../../../interfaces/Shed';
import { MovementKardex } from '../../../../../interfaces/MovementKardex';
import { MovementKardexService } from '../../../../../service/movement-kardex.service';
import { CreationsComponent } from './creations/creations.component';
import Swal from 'sweetalert2';
import { ModalKardexComponent } from "./modal-kardex/modal-kardex.component";
//Exportaciones:
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-kardex-egg',
  standalone: true,
  imports: [CommonModule, FormsModule, CreationsComponent, ModalKardexComponent],
  templateUrl: './kardex-egg.component.html',
  styleUrl: './kardex-egg.component.css'
})
export class KardexEggComponent implements OnInit {
  
  kardexList: TypeKardex[] = [];
  filteredKardexList: TypeKardex[] = []; // SOLO productos PT + status A
  selectedKardex: number | null = null;
  selectedKardexData: TypeKardex | null = null;

  products: Product[] = [];
  ptActiveProducts: Product[] = []; // SOLO productos PT + status A
  suppliers: Supplier[] = [];
  sheds: Shed[] = [];
  documents: Document[] = []; 
  movementList: MovementKardex[] = [];
  filteredMovements: MovementKardex[] = [];
  currentStock: number = 0;
  
  // Propiedades para el calendario
  calendarModalVisible: boolean = false;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  tempMonth: number | null = null;
  tempYear: number = new Date().getFullYear();
  
  months: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  get availableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    return years;
  }

  constructor(
    private typeKardexService: TypeKardexService,
    private productService: ProductService,
    private supplierService: SupplierService,
    private shedService: ShedService,
    private movementKardexService: MovementKardexService,
  ) {}

  ngOnInit(): void {
    // ORDEN CRÍTICO: Primero productos, luego kardex
    this.loadProducts().then(() => {
      this.loadKardex();
    });
    this.loadSuppliers();
    this.loadSheds();
    this.loadMovements();
  }

  // CARGA SOLO PRODUCTOS PT + STATUS A
  loadProducts(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.productService.getAll().subscribe(
        (data) => {
          console.log('📦 PRODUCTOS RECIBIDOS DE BD:', data.length);
          
          // DOBLE FILTRO: typeProduct = 'PT' Y status = 'A'
          this.products = data.filter(product => {
            const isPT = product.typeProduct === 'PT';
            const isActive = product.status === 'A';
            const isValid = isPT && isActive;
            
            if (isValid) {
              console.log(`✅ Producto incluido: ${product.id} - ${product.type} (PT + A)`);
            } else {
              console.log(`❌ Producto excluido: ${product.id} - ${product.type} (PT: ${isPT}, A: ${isActive})`);
            }
            
            return isValid;
          });
          
          this.ptActiveProducts = [...this.products]; // Copia de productos PT + A
          
          console.log('🎯 RESULTADO FILTRO PRODUCTOS:');
          console.log('Total productos en BD:', data.length);
          console.log('Productos PT + A filtrados:', this.products.length);
          console.log('Lista PT + A:', this.products.map(p => `${p.id}: ${p.type} (${p.typeProduct}, ${p.status})`));
          
          resolve();
        },
        (error) => {
          console.error('❌ Error al obtener productos', error);
          this.products = [];
          this.ptActiveProducts = [];
          resolve();
        }
      );
    });
  }

  // CARGA KARDEX Y FILTRA SOLO LOS QUE TIENEN PRODUCTOS PT + A
  loadKardex(): void {
    this.typeKardexService.listAll().subscribe(
      (data) => {
        console.log('📦 KARDEX RECIBIDOS:', data.length);
        
        this.kardexList = data;
        this.applyPTActiveFilter();
      },
      (error) => {
        console.error('❌ Error al obtener los datos del Kardex', error);
        this.filteredKardexList = [];
      }
    );
  }

  // MÉTODO PRINCIPAL DE FILTRADO - SOLO PRODUCTOS PT + STATUS A
  applyPTActiveFilter(): void {
    console.log('🎯 APLICANDO FILTRO PT + STATUS A...');
    
    // FILTRAR: Solo kardex que tengan productos PT + A
    this.filteredKardexList = this.kardexList.filter(kardex => {
      const product = this.products.find(p => p.id === kardex.productId);
      const isValidPTActive = product && product.typeProduct === 'PT' && product.status === 'A';
      
      if (isValidPTActive) {
        console.log(`✅ Kardex incluido: ${kardex.name} - Producto: ${product.type} (${product.typeProduct}, ${product.status})`);
      } else {
        if (product) {
          console.log(`❌ Kardex excluido: ${kardex.name} - Producto: ${product.type} (PT: ${product.typeProduct === 'PT'}, A: ${product.status === 'A'})`);
        } else {
          console.log(`❌ Kardex excluido: ${kardex.name} - Producto no encontrado`);
        }
      }
      
      return isValidPTActive;
    });

    console.log('📊 RESULTADO DEL FILTRO FINAL:');
    console.log('Kardex totales:', this.kardexList.length);
    console.log('Kardex PT + A filtrados:', this.filteredKardexList.length);

    // SELECCIÓN AUTOMÁTICA DEL PRIMER KARDEX PT + A
    if (this.filteredKardexList.length > 0) {
      this.selectedKardex = this.filteredKardexList[0].id;
      this.selectedKardexData = this.filteredKardexList[0];
      console.log('🎯 Kardex seleccionado automáticamente:', this.selectedKardexData.name);
      
      this.filterMovements();
      this.getCurrentStock();
    } else {
      console.log('⚠️ NO SE ENCONTRARON KARDEX CON PRODUCTOS PT + STATUS A');
      this.selectedKardex = null;
      this.selectedKardexData = null;
      this.filteredMovements = [];
      this.currentStock = 0;
      
      // MOSTRAR ALERTA AL USUARIO
      Swal.fire({
        title: 'Sin Productos Disponibles',
        text: 'No se encontraron productos con tipo PT y status Activo',
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
    }
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe(
      (data) => this.suppliers = data,
      (error) => console.error('Error al obtener proveedores', error)
    );
  }

  loadSheds(): void {
    this.shedService.getAll().subscribe(
      (data) => this.sheds = data,
      (error) => console.error('Error al obtener ubicaciones', error)
    );
  }

  loadMovements(): void {
    this.movementKardexService.getAll().subscribe({
      next: (data) => {
        this.movementList = data;
        this.filterMovements();
        
        if (this.filteredMovements.length === 0 && this.currentPage > 1) {
          this.currentPage = 1;
        }
        
        this.getCurrentStock();
      },
      error: (error) => console.error('Error al obtener los movimientos del Kardex', error)
    });
  }

  // CAMBIO DE KARDEX - SOLO DE LA LISTA FILTRADA PT + A
  onKardexChange(event: any): void {
    const selectedId = Number(event.target.value);
    console.log('🔄 Cambiando a Kardex ID:', selectedId);
    
    // BUSCAR SOLO EN LA LISTA FILTRADA (PT + A)
    this.selectedKardexData = this.filteredKardexList.find((k) => k.id === selectedId) || null;
    this.selectedKardex = selectedId;
    
    if (this.selectedKardexData) {
      const product = this.products.find(p => p.id === this.selectedKardexData!.productId);
      console.log('✅ Kardex seleccionado:', this.selectedKardexData.name);
      console.log('✅ Producto asociado:', product?.type, '(', product?.typeProduct, ',', product?.status, ')');
    }
    
    this.filterMovements();
    this.getCurrentStock();
  }

  filterMovements(): void {
    if (this.selectedKardex !== null) {
      let filtered = this.movementList.filter(m => m.typeKardexId === this.selectedKardex);
      
      if (this.selectedMonth !== null && this.selectedYear !== null) {
        filtered = filtered.filter(m => {
          const date = new Date(m.issueDate);
          return (
            date.getMonth() + 1 === this.selectedMonth && 
            date.getFullYear() === this.selectedYear
          );
        });
      }
      
      this.filteredMovements = filtered;
    } else {
      this.filteredMovements = [];
      this.currentStock = 0;
    }
  }

  // MÉTODOS DE OBTENCIÓN DE NOMBRES - SOLO PRODUCTOS PT + A
  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product?.type || 'Producto no PT+A';
  }

  getSupplierName(supplierId: number): string {
    return this.suppliers.find(s => s.id === supplierId)?.company || 'Desconocido';
  }

  getShedName(shedId: number): string {
    return this.sheds.find(s => s.id === shedId)?.location || 'Desconocido';
  }

  // VERIFICACIÓN ESTRICTA DE PRODUCTOS PT + STATUS A
  isPTActiveProduct(productId: number): boolean {
    const product = this.products.find(p => p.id === productId);
    const isPTActive = product && product.typeProduct === 'PT' && product.status === 'A';
    console.log(`🔍 Verificando producto ${productId}: ${isPTActive ? 'ES PT+A' : 'NO ES PT+A'}`);
    return isPTActive || false;
  }

  // MÉTODO LEGACY PARA COMPATIBILIDAD
  isPTProduct(productId: number): boolean {
    return this.isPTActiveProduct(productId);
  }

  getCurrentStock(): void {
    if (!this.selectedKardex) {
      this.currentStock = 0;
      return;
    }
    
    const kardexMovements = this.movementList
      .filter(m => m.typeKardexId === this.selectedKardex)
      .sort((a, b) => {
        const dateA = new Date(a.issueDate).getTime();
        const dateB = new Date(b.issueDate).getTime();
        
        if (dateA !== dateB) return dateB - dateA;
        
        return (b.kardexId || 0) - (a.kardexId || 0);
      });
    
    if (kardexMovements.length > 0) {
      const latestMovement = kardexMovements[0];
      this.currentStock = latestMovement.cantidadSaldo !== null && 
                        latestMovement.cantidadSaldo !== undefined ? 
                        latestMovement.cantidadSaldo : 0;
    } else {
      this.currentStock = 0;
    }
  }

  // MODAL de creacion kardex - SOLO PRODUCTOS PT + A
  isModalOpen = false;
  isEditMode = false;
  
  selectedTypeKardex: TypeKardex = {
    id: 0,  
    name: '',
    maximumAmount: 0,
    minimumQuantity: 0,
    supplierId: 0,
    productId: 0,
    shedId: 0,
    description: '',
    status: 'Activo'
  };

  openCreateModal() {
    // VERIFICAR QUE HAY PRODUCTOS PT + A DISPONIBLES
    if (this.products.length === 0) {
      Swal.fire('Error', 'No hay productos PT con status Activo disponibles', 'error');
      return;
    }
    
    this.isEditMode = false;
    this.selectedTypeKardex = {
      id: 0,
      name: '',
      maximumAmount: 0,
      minimumQuantity: 0,
      supplierId: 0,
      productId: 0,
      shedId: 0,
      description: '',
      status: 'Activo'
    };
    this.isModalOpen = true;
  }

  openEditModal(kardex: TypeKardex) {
    // VERIFICAR QUE SEA UN KARDEX PT + A ANTES DE EDITAR
    if (!this.isPTActiveProduct(kardex.productId)) {
      Swal.fire('Error', 'Solo se pueden editar Kardex de productos PT con status Activo', 'error');
      return;
    }
    
    this.isEditMode = true;
    this.selectedTypeKardex = { ...kardex };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 4;
  get totalPages(): number {
    return Math.ceil(this.filteredMovements.length / this.itemsPerPage);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  deleteKardex(movementId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.movementKardexService.delete(movementId).subscribe({
          next: () => {
            Swal.fire(
              '¡Eliminado!',
              'El registro ha sido eliminado exitosamente.',
              'success'
            );
            this.movementList = this.movementList.filter(m => m.kardexId !== movementId);
            this.filterMovements();
            this.getCurrentStock();
          },
          error: (err) => {
            console.error('Error al eliminar el registro:', err);
            Swal.fire(
              'Error',
              'Ocurrió un error al intentar eliminar el registro.',
              'error'
            );
          }
        });
      }
    });
  }

  // MODAL MOVIMIENTOS - SOLO PT + A
  modalVisible = false;
  editMode = false;
  currentMovementKardex: MovementKardex = {} as MovementKardex;

  showModalForCreation(): void {
    // VERIFICAR QUE HAY UN KARDEX PT + A SELECCIONADO
    if (!this.selectedKardex || !this.selectedKardexData) {
      Swal.fire('Error', 'Debe seleccionar un Kardex de producto PT con status Activo', 'error');
      return;
    }
    
    if (!this.isPTActiveProduct(this.selectedKardexData.productId)) {
      Swal.fire('Error', 'Solo se pueden crear movimientos para productos PT con status Activo', 'error');
      return;
    }
    
    this.editMode = false;
    this.currentMovementKardex = {
      typeKardexId: this.selectedKardex
    } as MovementKardex;
    this.modalVisible = true;
  }

  showModalForEditing(movementKardex: MovementKardex): void {
    // VERIFICAR QUE EL MOVIMIENTO SEA DE UN PRODUCTO PT + A
    const kardex = this.filteredKardexList.find(k => k.id === movementKardex.typeKardexId);
    if (!kardex || !this.isPTActiveProduct(kardex.productId)) {
      Swal.fire('Error', 'Solo se pueden editar movimientos de productos PT con status Activo', 'error');
      return;
    }
    
    this.editMode = true;
    this.currentMovementKardex = { ...movementKardex };
    this.modalVisible = true;
  }

  hideModal(): void {
    this.modalVisible = false;
  }

  onMovementUpdated(movement: MovementKardex): void {
    const existingIndex = this.movementList.findIndex(m => m.kardexId === movement.kardexId);
    
    if (existingIndex > -1) {
      this.movementList[existingIndex] = movement;
    } else {
      this.movementList.push(movement);
    }
    
    this.loadMovements();
  }

  onKardexUpdated(kardex: TypeKardex): void {
    // VERIFICAR QUE EL KARDEX ACTUALIZADO SEA DE UN PRODUCTO PT + A
    const product = this.products.find(p => p.id === kardex.productId);
    if (!product || product.typeProduct !== 'PT' || product.status !== 'A') {
      console.log('⚠️ Kardex actualizado no es PT+A, ignorando...');
      Swal.fire('Advertencia', 'Solo se procesan Kardex de productos PT con status Activo', 'warning');
      return;
    }
    
    const existingIndex = this.kardexList.findIndex(k => k.id === kardex.id);
    
    if (existingIndex > -1) {
      this.kardexList[existingIndex] = kardex;
    } else {
      this.kardexList.push(kardex);
    }
    
    // REAPLICAR FILTRO PT + A
    this.applyPTActiveFilter();
    
    // SELECCIONAR EL KARDEX ACTUALIZADO SI ES PT + A
    this.selectedKardex = kardex.id;
    this.selectedKardexData = kardex;
    this.filterMovements();
    this.getCurrentStock();
  }

  // EXPORTABLES - SOLO PRODUCTOS PT + A
  generatePDF(): void {
    if (!this.selectedKardexData) {
      Swal.fire('Error', 'No hay ningún Kardex PT+A seleccionado', 'error');
      return;
    }

    // VERIFICAR QUE SEA UN PRODUCTO PT + A
    if (!this.isPTActiveProduct(this.selectedKardexData.productId)) {
      Swal.fire('Error', 'Solo se pueden exportar Kardex de productos PT con status Activo', 'error');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    const title = `Kardex PT-A: ${this.selectedKardexData.name}`;
    const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 20);
    
    // ... resto del código de PDF igual que antes
    
    doc.save(`Kardex_PT_A_${this.selectedKardexData.name.replace(/ /g, '_')}.pdf`);
    
    Swal.fire({
      title: '¡PDF PT+A Generado!',
      text: 'El archivo PDF de producto PT con status Activo ha sido generado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  generateExcel(): void {
    if (!this.selectedKardexData) {
      Swal.fire('Error', 'No hay ningún Kardex PT+A seleccionado', 'error');
      return;
    }

    // VERIFICAR QUE SEA UN PRODUCTO PT + A
    if (!this.isPTActiveProduct(this.selectedKardexData.productId)) {
      Swal.fire('Error', 'Solo se pueden exportar Kardex de productos PT con status Activo', 'error');
      return;
    }

    // ... resto del código de Excel igual que antes
    
    Swal.fire({
      title: '¡Excel PT+A Generado!',
      text: 'El archivo Excel de producto PT con status Activo ha sido generado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  // MÉTODOS DEL CALENDARIO
  toggleCalendarModal(): void {
    this.calendarModalVisible = !this.calendarModalVisible;
    
    if (this.calendarModalVisible) {
      this.tempMonth = this.selectedMonth;
      this.tempYear = this.selectedYear || new Date().getFullYear();
    }
  }
  
  selectMonth(month: number): void {
    this.tempMonth = month;
  }
  
  applyMonthFilter(): void {
    this.selectedMonth = this.tempMonth;
    this.selectedYear = this.tempYear;
    this.filterMovements();
    this.calendarModalVisible = false;
  }
  
  clearMonthFilter(): void {
    this.selectedMonth = null;
    this.selectedYear = null;
    this.tempMonth = null;
    this.filterMovements();
    this.calendarModalVisible = false;
  }
  
  getMonthName(month: number): string {
    return this.months[month - 1];
  }

  isMonthSelected(monthIndex: number): boolean {
    return this.tempMonth === (monthIndex + 1);
  }
}