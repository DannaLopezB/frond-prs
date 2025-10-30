import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { TypeSupplierService } from '../../../../../service/type-supplier.service';
import { TypeSupplier } from '../../../../../interfaces/TypeSupplier';
import { UbigeoService } from '../../../../../service/ubigeo.service';
import { Ubigeo } from '../../../../../interfaces/Ubigeo';

@Component({
  selector: 'app-type-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './type-supplier.component.html',
  styleUrl: './type-supplier.component.css'
})
export class TypeSupplierComponent implements OnInit {
  typeSuppliers: TypeSupplier[] = [];
  paginatedSuppliers: TypeSupplier[] = [];
  pageSize = 5; // Reducido para mejor visualización en móvil
  currentPage = 1;
  ubigeos: Ubigeo[] = [];

  statusActive = true;
  statusFilter = 'A';
  isModalOpen = false;
  isEdit = false;
  supplier: Partial<TypeSupplier> = { address: '', name: '', status: 'A', ubigeoId: 0 };

  constructor(
    private typeSupplierService: TypeSupplierService,
    private ubigeoService: UbigeoService
  ) {}

  ngOnInit(): void {
    this.loadTypeSuppliers();
    this.loadUbigeos();
    this.adjustPageSizeForScreenSize();
  }

  // Nuevo método para ajustar el tamaño de página según el tamaño de pantalla
  adjustPageSizeForScreenSize(): void {
    const setPageSize = () => {
      // En pantallas pequeñas, mostrar menos elementos por página
      if (window.innerWidth < 768) {
        this.pageSize = 5;
      } else {
        this.pageSize = 10;
      }
      this.applyStatusFilter();
    };

    // Configuramos para el tamaño inicial
    setPageSize();

    // Y también cuando la ventana cambie de tamaño
    window.addEventListener('resize', setPageSize);
  }

  loadTypeSuppliers(): void {
    this.typeSupplierService.getAll().subscribe(
      (data) => {
        this.typeSuppliers = data;
        this.applyStatusFilter();
      },
      (error) => {
        console.error('Error al cargar los tipos de proveedores:', error);
        // Mostrar SweetAlert adaptado para móvil
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los tipos de proveedores',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          heightAuto: false // Mejor visualización en móvil
        });
      }
    );
  }

  loadUbigeos(): void {
    this.ubigeoService.listarTodos().subscribe(
      (data) => {
        this.ubigeos = data;
      },
      (error) => {
        console.error('Error al cargar los Ubigeos:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los ubigeos',
          icon: 'error',
          confirmButtonText: 'Aceptar',
          heightAuto: false
        });
      }
    );
  }

  getUbigeoName(ubigeoId: number): string {
    const ubigeo = this.ubigeos.find((u) => u.id === ubigeoId);
    return ubigeo ? `${ubigeo.department} - ${ubigeo.district}` : 'Desconocido';
  }

  // Método para obtener proveedores filtrados
  getFilteredSuppliers(): TypeSupplier[] {
    return this.typeSuppliers.filter(supplier => supplier.status === this.statusFilter);
  }

  toggleStatus(status: boolean): void {
    this.statusActive = status;
    this.statusFilter = status ? 'A' : 'I';
    this.currentPage = 1; // Volver a la primera página al cambiar filtro
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    const filteredSuppliers = this.typeSuppliers.filter(
      (supplier) => supplier.status === this.statusFilter
    );

    this.paginatedSuppliers = filteredSuppliers.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  getPages(): number[] {
    const totalPages = Math.ceil(
      this.typeSuppliers.filter((s) => s.status === this.statusFilter).length /
        this.pageSize
    );
    
    // Para pantallas pequeñas, limitar el número de botones de página mostrados
    if (window.innerWidth < 768 && totalPages > 5) {
      const currentPage = this.currentPage;
      const pages = [];
      
      if (currentPage <= 3) {
        // Si estamos cerca del inicio, mostrar las primeras 5 páginas
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Si estamos cerca del final, mostrar las últimas 5 páginas
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Si estamos en el medio, mostrar el actual y 2 a cada lado
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    }
    
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  cambiarPagina(pagina: number): void {
    this.currentPage = pagina;
    this.applyStatusFilter();
  }

  openModal(editSupplier?: TypeSupplier) {
    this.isModalOpen = true;
    this.isEdit = !!editSupplier;
    this.supplier = editSupplier ? { ...editSupplier } : { address: '', name: '', status: 'A', ubigeoId: 0 };
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveSupplier() {
    // Configuración móvil para SweetAlert
    const swalConfig = {
      heightAuto: false,
      width: window.innerWidth < 768 ? '85%' : '32em'
    };

    if (this.isEdit) {
      this.typeSupplierService.update(this.supplier.id!, this.supplier as TypeSupplier).subscribe(
        () => {
          Swal.fire({
            title: 'Éxito',
            text: 'Proveedor actualizado con éxito',
            icon: 'success',
            ...swalConfig
          });
          this.closeModal();
          this.loadTypeSuppliers();
        },
        (error) => {
          console.error('Error al actualizar:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el proveedor',
            icon: 'error',
            ...swalConfig
          });
        }
      );
    } else {
      this.typeSupplierService.create(this.supplier as TypeSupplier).subscribe(
        () => {
          Swal.fire({
            title: 'Éxito',
            text: 'Proveedor creado con éxito',
            icon: 'success',
            ...swalConfig
          });
          this.closeModal();
          this.loadTypeSuppliers();
        },
        (error) => {
          console.error('Error al crear:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear el proveedor',
            icon: 'error',
            ...swalConfig
          });
        }
      );
    }
  }

  softDelete(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará el proveedor.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      heightAuto: false,
      width: window.innerWidth < 768 ? '85%' : '32em'
    }).then((result) => {
      if (result.isConfirmed) {
        this.typeSupplierService.softDelete(id).subscribe(
          () => {
            Swal.fire({
              title: 'Desactivado',
              text: 'El proveedor ha sido desactivado.',
              icon: 'success',
              heightAuto: false
            });
            this.loadTypeSuppliers();
          },
          (error) => {
            console.error('Error al eliminar proveedor:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo desactivar el proveedor',
              icon: 'error',
              heightAuto: false
            });
          }
        );
      }
    });
  }

  restore(id: number): void {
    Swal.fire({
      title: '¿Restaurar?',
      text: 'El proveedor será activado nuevamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
      heightAuto: false,
      width: window.innerWidth < 768 ? '85%' : '32em'
    }).then((result) => {
      if (result.isConfirmed) {
        this.typeSupplierService.restore(id).subscribe(
          () => {
            Swal.fire({
              title: 'Restaurado',
              text: 'El proveedor ha sido restaurado.',
              icon: 'success',
              heightAuto: false
            });
            this.loadTypeSuppliers();
          },
          (error) => {
            console.error('Error al restaurar proveedor:', error);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo restaurar el proveedor',
              icon: 'error',
              heightAuto: false
            });
          }
        );
      }
    });
  }

  // MÉTODO PARA EXPORTAR A PDF
  exportToPDF(): void {
    try {
      const filteredSuppliers = this.getFilteredSuppliers();
      
      if (filteredSuppliers.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay proveedores para exportar',
          icon: 'info',
          heightAuto: false
        });
        return;
      }

      const doc = new jsPDF();
      
      // Configurar fuente
      doc.setFontSize(18);
      doc.text('Reporte de Tipos de Proveedores', 14, 20);
      
      // Información adicional
      doc.setFontSize(12);
      doc.text(`Estado: ${this.statusActive ? 'Activos' : 'Inactivos'}`, 14, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 40);
      doc.text(`Total de registros: ${filteredSuppliers.length}`, 14, 50);
      
      // Preparar datos para la tabla
      const tableData = filteredSuppliers.map(supplier => [
        supplier.name || '',
        supplier.address || '',
        this.getUbigeoName(supplier.ubigeoId),
        supplier.status === 'A' ? 'Activo' : 'Inactivo'
      ]);

      // Configurar tabla usando autoTable
      autoTable(doc, {
        head: [['Nombre', 'Dirección', 'Ubigeo', 'Estado']],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Azul
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 45 }, // Nombre
          1: { cellWidth: 60 }, // Dirección
          2: { cellWidth: 50 }, // Ubigeo
          3: { cellWidth: 25 }  // Estado
        }
      });

      // Guardar archivo
      const fileName = `tipos_proveedores_${this.statusActive ? 'activos' : 'inactivos'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        title: 'Éxito',
        text: 'PDF generado correctamente',
        icon: 'success',
        heightAuto: false
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el PDF',
        icon: 'error',
        heightAuto: false
      });
    }
  }

  // MÉTODO PARA EXPORTAR A EXCEL
  async exportToExcel(): Promise<void> {
    try {
      const filteredSuppliers = this.getFilteredSuppliers();
      
      if (filteredSuppliers.length === 0) {
        Swal.fire({
          title: 'Sin datos',
          text: 'No hay proveedores para exportar',
          icon: 'info',
          heightAuto: false
        });
        return;
      }

      // Crear libro de trabajo
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tipos de Proveedores');

      // Configurar propiedades del libro
      workbook.creator = 'Sistema de Gestión';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Título principal
      worksheet.mergeCells('A1:D1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'REPORTE DE TIPOS DE PROVEEDORES';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '3B82F6' }
      };

      // Información adicional
      worksheet.mergeCells('A3:B3');
      worksheet.getCell('A3').value = `Estado: ${this.statusActive ? 'Activos' : 'Inactivos'}`;
      worksheet.getCell('A3').font = { bold: true };

      worksheet.mergeCells('C3:D3');
      worksheet.getCell('C3').value = `Fecha: ${new Date().toLocaleDateString('es-ES')}`;
      worksheet.getCell('C3').font = { bold: true };

      worksheet.mergeCells('A4:B4');
      worksheet.getCell('A4').value = `Total de registros: ${filteredSuppliers.length}`;
      worksheet.getCell('A4').font = { bold: true };

      // Encabezados de tabla
      const headerRow = worksheet.getRow(6);
      headerRow.values = ['Nombre', 'Dirección', 'Ubigeo', 'Estado'];
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '059669' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Datos de la tabla
      filteredSuppliers.forEach((supplier, index) => {
        const row = worksheet.getRow(7 + index);
        row.values = [
          supplier.name || '',
          supplier.address || '',
          this.getUbigeoName(supplier.ubigeoId),
          supplier.status === 'A' ? 'Activo' : 'Inactivo'
        ];

        // Alternar colores de fila
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F3F4F6' }
          };
        }
      });

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 25 }, // Nombre
        { width: 35 }, // Dirección
        { width: 30 }, // Ubigeo
        { width: 15 }  // Estado
      ];

      // Aplicar bordes a todas las celdas con datos
      const totalRows = 6 + filteredSuppliers.length;
      for (let row = 6; row <= totalRows; row++) {
        for (let col = 1; col <= 4; col++) {
          const cell = worksheet.getCell(row, col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tipos_proveedores_${this.statusActive ? 'activos' : 'inactivos'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: 'Éxito',
        text: 'Excel generado correctamente',
        icon: 'success',
        heightAuto: false
      });

    } catch (error) {
      console.error('Error al generar Excel:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el archivo Excel',
        icon: 'error',
        heightAuto: false
      });
    }
  }
}