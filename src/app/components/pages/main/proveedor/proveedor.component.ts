import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { TypeSupplierService } from '../../../../../service/type-supplier.service';
import { TypeSupplier } from '../../../../../interfaces/TypeSupplier';
import { SupplierService } from '../../../../../service/supplier.service';
import { Supplier } from '../../../../../interfaces/Supplier';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import * as XLSX from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor.component.html',
  styleUrl: './proveedor.component.css'
})
export class ProveedorComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  paginatedSuppliers: Supplier[] = [];
  typeSuppliersMap = new Map<number, TypeSupplier>();
  typeSuppliers: TypeSupplier[] = [];
  selectedSupplier?: Supplier;
  formSupplier: Supplier = this.initializeSupplier();
  statusActive: boolean = true;
  statusFilter: string = 'A';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  showModal: boolean = false;
  isMobile: boolean = window.innerWidth < 640;
  isSubmitting: boolean = false; // Control de estado del formulario
  private resizeListener: () => void;

  @ViewChild('supplierForm') supplierForm!: NgForm;

  constructor(
    private supplierService: SupplierService,
    private typeSupplierService: TypeSupplierService
  ) {
    this.resizeListener = () => {
      this.isMobile = window.innerWidth < 640;
    };
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadAllTypeSuppliers();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

  loadSuppliers(): void {
    this.supplierService.getAll().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.filterAndPaginate();
        this.loadTypeSuppliers();
      },
      error: (error) => {
        console.error('Error cargando proveedores:', error);
        this.showErrorAlert('Error al cargar los proveedores');
      }
    });
  }

  loadTypeSuppliers(): void {
    this.suppliers.forEach(supplier => {
      if (supplier.typeSupplierId && !this.typeSuppliersMap.has(supplier.typeSupplierId)) {
        this.typeSupplierService.getById(supplier.typeSupplierId).subscribe({
          next: (typeSupplier) => {
            this.typeSuppliersMap.set(supplier.typeSupplierId, typeSupplier);
          },
          error: (error) => {
            console.error('Error cargando tipo de proveedor:', error);
          }
        });
      }
    });
  }

  loadAllTypeSuppliers(): void {
    this.typeSupplierService.getAll().subscribe({
      next: (data) => {
        this.typeSuppliers = data;
      },
      error: (error) => {
        console.error('Error cargando tipos de proveedores:', error);
        this.showErrorAlert('Error al cargar los tipos de proveedores');
      }
    });
  }

  toggleStatus(event: boolean): void {
    this.statusActive = event;
    this.statusFilter = event ? 'A' : 'I';
    this.currentPage = 1;
    this.filterAndPaginate();
  }

  filterAndPaginate(): void {
    const filteredSuppliers = this.suppliers.filter(s => s.status === this.statusFilter);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPages(): number[] {
    const filteredCount = this.suppliers.filter(s => s.status === this.statusFilter).length;
    const totalPages = Math.ceil(filteredCount / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  getDisplayedPages(): number[] {
    const allPages = this.getPages();
    const totalPages = allPages.length;
    
    if (totalPages <= 5) {
      return allPages;
    }
    
    if (this.currentPage <= 3) {
      return [1, 2, 3, 4, totalPages];
    }
    
    if (this.currentPage >= totalPages - 2) {
      return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, this.currentPage - 1, this.currentPage, this.currentPage + 1, totalPages];
  }

  cambiarPagina(page: number): void {
    this.currentPage = page;
    this.filterAndPaginate();
    
    if (this.isMobile) {
      const tableElement = document.querySelector('.container');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  selectSupplier(id: number | undefined): void {
    if (id === undefined) return;
    
    this.supplierService.getById(id).subscribe({
      next: (data) => {
        this.selectedSupplier = data;
        this.formSupplier = { ...data };
        this.openModal();
      },
      error: (error) => {
        console.error('Error obteniendo el proveedor:', error);
        this.showErrorAlert('Error al obtener los datos del proveedor');
      }
    });
  }

  updateSupplier(id: number | undefined, supplier: Supplier): void {
    if (id !== undefined) {
      this.selectSupplier(id);
    }
  }

  addSupplier(supplier: Supplier): void {
    this.isSubmitting = true;
    this.supplierService.create(supplier).subscribe({
      next: () => {
        this.showSuccessAlert('Proveedor creado', 'El proveedor ha sido registrado exitosamente.');
        this.loadSuppliers();
        this.closeModal();
      },
      error: (error) => {
        this.showErrorAlert('Ocurrió un error al registrar el proveedor.');
        console.error('Error creando el proveedor:', error);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    if (this.formSupplier.id !== undefined) {
      this.isSubmitting = true;
      this.supplierService.update(this.formSupplier.id, this.formSupplier).subscribe({
        next: () => {
          this.showSuccessAlert('Proveedor actualizado', 'El proveedor ha sido actualizado exitosamente.');
          this.loadSuppliers();
          this.closeModal();
        },
        error: (error) => {
          this.showErrorAlert('Ocurrió un error al actualizar el proveedor.');
          console.error('Error actualizando el proveedor:', error);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.addSupplier(this.formSupplier);
    }
  }

  softDeleteSupplier(id: number | undefined): void {
    if (id === undefined) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El proveedor será eliminado lógicamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      width: this.isMobile ? '90%' : '32rem'
    }).then(result => {
      if (result.isConfirmed) {
        this.supplierService.softDelete(id).subscribe({
          next: () => {
            this.showSuccessAlert('Proveedor eliminado', 'El proveedor ha sido eliminado correctamente.');
            this.loadSuppliers();
          },
          error: (error) => {
            this.showErrorAlert('Ocurrió un error al eliminar el proveedor.');
            console.error('Error eliminando el proveedor:', error);
          }
        });
      }
    });
  }

  restoreSupplier(id: number | undefined): void {
    if (id === undefined) return;

    Swal.fire({
      title: '¿Restaurar proveedor?',
      text: 'El proveedor será restaurado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      width: this.isMobile ? '90%' : '32rem'
    }).then(result => {
      if (result.isConfirmed) {
        this.supplierService.restore(id).subscribe({
          next: () => {
            this.showSuccessAlert('Proveedor restaurado', 'El proveedor ha sido restaurado correctamente.');
            this.loadSuppliers();
          },
          error: (error) => {
            this.showErrorAlert('Ocurrió un error al restaurar el proveedor.');
            console.error('Error restaurando el proveedor:', error);
          }
        });
      }
    });
  }

  getTypeSupplierInfo(id: number, field: keyof TypeSupplier): string {
    const typeSupplier = this.typeSuppliersMap.get(id);
    return typeSupplier ? String(typeSupplier[field]) : 'Cargando...';
  }

  openModal(): void {
    if (!this.selectedSupplier) {
      this.formSupplier = this.initializeSupplier();
    }
    this.showModal = true;
    this.isSubmitting = false;
    
    setTimeout(() => {
      const firstInput = document.getElementById('ruc');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedSupplier = undefined;
    this.formSupplier = this.initializeSupplier();
    this.isSubmitting = false;
  }

  initializeSupplier(): Supplier {
    return {
      id: undefined, 
      ruc: '',
      company: '',
      name: '',
      lastname: '',
      email: '',
      cellphone: '',
      notes: '',
      registerDate: new Date().toISOString().split('T')[0],
      status: 'A',
      typeSupplierId: 0
    };
  }

  // Métodos de validación y formateo para el template
  onlyNumbers(event: KeyboardEvent, allowPlus: boolean = false): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (allowPlus && charCode === 43) return true; // Permitir '+'
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // MÉTODOS CORREGIDOS PARA SOLUCIONAR LOS ERRORES DE TYPESCRIPT
  onlyLetters(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const lettersOnly = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (value !== lettersOnly) {
      input.value = lettersOnly;
      // Actualizar el modelo
      if (input.name === 'name') {
        this.formSupplier.name = lettersOnly;
      } else if (input.name === 'lastname') {
        this.formSupplier.lastname = lettersOnly;
      }
    }
  }

  capitalizeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const words = input.value.toLowerCase().split(' ');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    input.value = capitalizedWords.join(' ');
  }

  validateEmailFormat(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toLowerCase();
  }

  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    // Si empieza con 51, agregar el +
    if (value.startsWith('51') && value.length > 2) {
      value = '+' + value;
    }
    
    input.value = value;
    this.formSupplier.cellphone = value;
  }

  getMinDate(): string {
    return '2020-01-01';
  }

  getMaxDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Métodos de utilidad para mostrar alertas
  private showSuccessAlert(title: string, text: string): void {
    Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      timer: 2000,
      showConfirmButton: false,
      width: this.isMobile ? '90%' : '32rem'
    });
  }

  private showErrorAlert(text: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: text,
      width: this.isMobile ? '90%' : '32rem'
    });
  }

  private markAllFieldsAsTouched(): void {
    if (this.supplierForm) {
      Object.keys(this.supplierForm.controls).forEach(key => {
        this.supplierForm.controls[key].markAsTouched();
      });
    }
  }

  /**
 * Exporta la lista de proveedores a PDF
 */
exportToPDF(): void {
  try {
    // Obtener todos los proveedores filtrados por estado
    const dataToExport = this.suppliers.filter(s => s.status === this.statusFilter);
    
    if (dataToExport.length === 0) {
      this.showErrorAlert('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();
    
    // Configuración del documento
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Título del documento
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210); // Color azul
    doc.text('Lista de Proveedores', pageWidth / 2, 20, { align: 'center' });
    
    // Información adicional
    doc.setFontSize(10);
    doc.setTextColor(100);
    const currentDate = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado el: ${currentDate}`, 14, 30);
    doc.text(`Estado: ${this.statusActive ? 'Activos' : 'Inactivos'}`, 14, 35);
    doc.text(`Total de registros: ${dataToExport.length}`, 14, 40);
    
    // Preparar datos de la tabla
    const tableData = dataToExport.map(supplier => [
      supplier.ruc || '',
      supplier.company || '',
      `${supplier.name} ${supplier.lastname}`,
      supplier.email || '',
      supplier.cellphone || '',
      this.getTypeSupplierInfo(supplier.typeSupplierId, 'name'),
      supplier.registerDate ? new Date(supplier.registerDate).toLocaleDateString('es-PE') : '',
      supplier.status === 'A' ? 'Activo' : 'Inactivo'
    ]);
    
    // Configuración de la tabla
    autoTable(doc, {
      head: [['RUC', 'Empresa', 'Contacto', 'Email', 'Teléfono', 'Tipo', 'F. Registro', 'Estado']],
      body: tableData,
      startY: 50,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 118, 210], // Color azul
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 20 }, // RUC
        1: { cellWidth: 35 }, // Empresa
        2: { cellWidth: 30 }, // Contacto
        3: { cellWidth: 35 }, // Email
        4: { cellWidth: 20 }, // Teléfono
        5: { cellWidth: 25 }, // Tipo
        6: { cellWidth: 20 }, // Fecha
        7: { cellWidth: 15 }  // Estado
      },
      margin: { top: 50, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Página ${data.pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });
    
    // Guardar el PDF
    const fileName = `proveedores_${this.statusActive ? 'activos' : 'inactivos'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    this.showSuccessAlert('PDF exportado', 'El archivo PDF se ha descargado correctamente.');
    
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    this.showErrorAlert('Error al generar el archivo PDF. Inténtalo de nuevo.');
  }
}

/**
 * Exporta la lista de proveedores a Excel
 */
  async exportToExcel(): Promise<void> {
    try {
      // Obtener todos los proveedores filtrados por estado
      const dataToExport = this.suppliers.filter(s => s.status === this.statusFilter);
      
      if (dataToExport.length === 0) {
        this.showErrorAlert('No hay datos para exportar');
        return;
      }

      // Crear un nuevo libro de trabajo
      const workbook = new XLSX.Workbook();
      workbook.creator = 'Sistema de Proveedores';
      workbook.created = new Date();
      
      // Crear una hoja de trabajo
      const worksheet = workbook.addWorksheet('Proveedores', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'landscape',
          fitToPage: true
        }
      });
      
      // Configurar el ancho de las columnas
      worksheet.columns = [
        { header: 'RUC', key: 'ruc', width: 15 },
        { header: 'Empresa', key: 'company', width: 30 },
        { header: 'Nombre', key: 'name', width: 20 },
        { header: 'Apellido', key: 'lastname', width: 20 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Teléfono', key: 'cellphone', width: 15 },
        { header: 'Tipo Proveedor', key: 'typeSupplier', width: 25 },
        { header: 'Notas', key: 'notes', width: 40 },
        { header: 'Fecha Registro', key: 'registerDate', width: 15 },
        { header: 'Estado', key: 'status', width: 10 }
      ];
      
      // Agregar título principal
      worksheet.mergeCells('A1:J1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'LISTA DE PROVEEDORES';
      titleCell.font = { 
        size: 16, 
        bold: true, 
        color: { argb: 'FF1976D2' }
      };
      titleCell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      };
      
      // Agregar información adicional
      worksheet.mergeCells('A2:J2');
      const infoCell = worksheet.getCell('A2');
      const currentDate = new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      infoCell.value = `Generado el: ${currentDate} | Estado: ${this.statusActive ? 'Activos' : 'Inactivos'} | Total: ${dataToExport.length} registros`;
      infoCell.font = { 
        size: 10, 
        italic: true 
      };
      infoCell.alignment = { 
        horizontal: 'center' 
      };
      
      // Espacio en blanco
      worksheet.addRow([]);
      
      // Configurar el estilo de los encabezados
      const headerRow = worksheet.getRow(4);
      headerRow.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' }
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      headerRow.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      
      // Agregar los datos
      dataToExport.forEach((supplier, index) => {
        const row = worksheet.addRow({
          ruc: supplier.ruc || '',
          company: supplier.company || '',
          name: supplier.name || '',
          lastname: supplier.lastname || '',
          email: supplier.email || '',
          cellphone: supplier.cellphone || '',
          typeSupplier: this.getTypeSupplierInfo(supplier.typeSupplierId, 'name'),
          notes: supplier.notes || '',
          registerDate: supplier.registerDate ? new Date(supplier.registerDate).toLocaleDateString('es-PE') : '',
          status: supplier.status === 'A' ? 'Activo' : 'Inactivo'
        });
        
        // Alternar colores de filas
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' }
          };
        }
        
        // Alineación
        row.alignment = { 
          vertical: 'middle' 
        };
        
        // Color del estado
        const statusCell = row.getCell('status');
        if (supplier.status === 'A') {
          statusCell.font = { 
            color: { argb: 'FF4CAF50' }, 
            bold: true 
          };
        } else {
          statusCell.font = { 
            color: { argb: 'FFF44336' }, 
            bold: true 
          };
        }
      });
      
      // Agregar bordes a toda la tabla
      const lastRow = worksheet.lastRow?.number || 4;
      for (let row = 4; row <= lastRow; row++) {
        for (let col = 1; col <= 10; col++) {
          const cell = worksheet.getCell(row, col);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        }
      }
      
      // Crear y descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `proveedores_${this.statusActive ? 'activos' : 'inactivos'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      // Limpiar el URL
      window.URL.revokeObjectURL(url);
      
      this.showSuccessAlert('Excel exportado', 'El archivo Excel se ha descargado correctamente.');
      
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.showErrorAlert('Error al generar el archivo Excel. Inténtalo de nuevo.');
    }
  }
}