import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { EggProductionService } from '../../../../../service/egg-production.service';
import { EggProduction } from '../../../../../interfaces/EggProduction';
import { EggProductionFormComponent } from './egg-production-form/egg-production-form.component';
import Swal from 'sweetalert2';

// Importaciones para exportación
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-egg-production',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    RouterModule,
    EggProductionFormComponent
  ],
  templateUrl: './egg-production.component.html',
  styleUrl: './egg-production.component.css'
})
export class EggProductionComponent implements OnInit {
  eggProductions: EggProduction[] = [];
  filteredProductions: EggProduction[] = [];
  loading: boolean = false;
  showModal = false;
  showSummaryModal = false;
  selectedProduction: EggProduction | null = null;
  Math = Math; // Para usar Math en el template
  
  // Filtros
  filterDate: string = '';
  filterStatus: string = 'A'; // Inicializar con 'A' por defecto
  
  // Paginación (ahora desde 5 elementos)
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  
  // Resumen de producción
  productionSummary = {
    totalEggs: 0,
    totalWeight: 0,
    totalValue: 0
  };
  
  constructor(private eggProductionService: EggProductionService) {}
  
  ngOnInit(): void {
    this.loadEggProductions();
  }
  
  loadEggProductions(): void {
    this.loading = true;
    this.eggProductionService.getAll().subscribe({
      next: (data) => {
        this.eggProductions = data;
        // Inicializar filtro con estado 'A' por defecto
        this.filterStatus = 'A';
        this.applyFilters(); // Aplicar filtros inmediatamente
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading egg productions:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error!',
          text: 'No se pudieron cargar los datos de producción de huevos',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }
  
  applyFilters(): void {
    this.filteredProductions = [...this.eggProductions];
    
    // Filtrar por fecha
    if (this.filterDate) {
      const searchDate = new Date(this.filterDate);
      searchDate.setHours(0, 0, 0, 0);
      
      this.filteredProductions = this.filteredProductions.filter(item => {
        const itemDate = new Date(item.registrationDate);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === searchDate.getTime();
      });
    }
    
    // Filtrar por estado - MODIFICADO
    if (this.filterStatus) {
      this.filteredProductions = this.filteredProductions.filter(item => {
        return item.estado === this.filterStatus;
      });
    }
    
    this.calculateTotalPages();
    this.currentPage = 1; // Reset to first page after applying filters
  }
  
  resetFilters(): void {
    this.filterDate = '';
    this.filterStatus = 'A'; // Resetear a 'A' en lugar de vacío
    this.applyFilters(); // Aplicar filtros después de resetear
  }
  
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredProductions.length / this.itemsPerPage);
  }
  
  get paginatedItems(): EggProduction[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProductions.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  getPaginationRange(): (number | string)[] {
    const range: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if there are few pages
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      // Adjust range to ensure we show the right number of pages
      if (start === 2) {
        end = Math.min(this.totalPages - 1, start + 2);
      }
      if (end === this.totalPages - 1) {
        start = Math.max(2, end - 2);
      }
      
      // Add ellipsis if necessary
      if (start > 2) {
        range.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      
      // Add ellipsis if necessary
      if (end < this.totalPages - 1) {
        range.push('...');
      }
      
      // Always show last page
      range.push(this.totalPages);
    }
    
    return range;
  }
  
  openModal(production?: EggProduction): void {
    this.selectedProduction = production || null;
    this.showModal = true;
  }
  
  closeModal(): void {
    this.showModal = false;
    this.selectedProduction = null;
  }
  
  onFormSubmitSuccess(): void {
    this.closeModal();
    this.loadEggProductions();
  }
  
  deleteEggProduction(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eggProductionService.delete(id).subscribe({
          next: () => {
            this.loadEggProductions(); // Recargar datos después de eliminar
            Swal.fire(
              '¡Eliminado!',
              'El registro ha sido eliminado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error deleting egg production:', error);
            Swal.fire({
              title: 'Error!',
              text: 'No se pudo eliminar el registro',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }
  
  inactivateEggProduction(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El registro será inactivado',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, inactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eggProductionService.inactivate(id).subscribe({
          next: () => {
            this.loadEggProductions(); // Recargar datos después de inactivar
            Swal.fire(
              '¡Inactivado!',
              'El registro ha sido inactivado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error inactivating egg production:', error);
            Swal.fire({
              title: 'Error!',
              text: 'No se pudo inactivar el registro',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }
  
  activateEggProduction(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El registro será activado',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eggProductionService.activate(id).subscribe({
          next: () => {
            this.loadEggProductions(); // Recargar datos después de activar
            Swal.fire(
              '¡Activado!',
              'El registro ha sido activado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error activating egg production:', error);
            Swal.fire({
              title: 'Error!',
              text: 'No se pudo activar el registro',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  viewProductionSummary(item: EggProduction): void {
    // Calcular resumen solo para este registro específico
    this.productionSummary = {
      totalEggs: item.quantityEggs,
      totalWeight: item.eggsKilo,
      totalValue: item.priceKilo * item.eggsKilo
    };
    
    this.showSummaryModal = true;
  }
  
  closeSummaryModal(): void {
    this.showSummaryModal = false;
  }

  // ==================== FUNCIONES DE EXPORTACIÓN ====================
  
  /**
   * Exporta los datos filtrados a PDF
   */
  downloadPDF(): void {
    if (this.filteredProductions.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay datos para exportar',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      
      // Configurar fuente y título
      doc.setFontSize(18);
      doc.text('Reporte de Producción de Huevos', 14, 22);
      
      // Fecha de generación
      doc.setFontSize(12);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-PE')}`, 14, 32);
      
      // Preparar datos para la tabla
      const tableData = this.filteredProductions.map(item => [
        item.id.toString(),
        item.quantityEggs.toString(),
        item.eggsKilo.toString(),
        `S/ ${item.priceKilo.toFixed(2)}`,
        `S/ ${(item.eggsKilo * item.priceKilo).toFixed(2)}`,
        this.formatDate(item.registrationDate),
        item.estado
      ]);

      // Configurar la tabla
      autoTable(doc, {
        head: [['ID', 'Cantidad', 'Peso (kg)', 'Precio/kg', 'Total', 'Fecha', 'Estado']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Color azul
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245] // Color gris claro alternado
        },
        margin: { top: 40 },
      });

      // Calcular totales
      const totals = this.calculateTotals();
      
      // Agregar resumen de totales
      const finalY = (doc as any).lastAutoTable.finalY || 40;
      doc.setFontSize(12);
      doc.text('RESUMEN TOTAL:', 14, finalY + 20);
      doc.text(`Total de Huevos: ${totals.totalEggs}`, 14, finalY + 30);
      doc.text(`Peso Total: ${totals.totalWeight.toFixed(2)} kg`, 14, finalY + 40);
      doc.text(`Valor Total: S/ ${totals.totalValue.toFixed(2)}`, 14, finalY + 50);
      
      // Generar nombre del archivo
      const fileName = `produccion-huevos-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Descargar el archivo
      doc.save(fileName);
      
      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'El archivo PDF se ha descargado correctamente',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        title: 'Error!',
        text: 'No se pudo generar el archivo PDF',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  /**
   * Exporta los datos filtrados a Excel
   */
  async downloadExcel(): Promise<void> {
    if (this.filteredProductions.length === 0) {
      Swal.fire({
        title: 'Sin datos',
        text: 'No hay datos para exportar',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      // Crear un nuevo libro de trabajo
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Producción de Huevos');

      // Configurar información del libro
      workbook.creator = 'Sistema de Producción';
      workbook.lastModifiedBy = 'Sistema de Producción';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Agregar título
      worksheet.mergeCells('A1:G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'REPORTE DE PRODUCCIÓN DE HUEVOS';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '3B82F6' }
      };

      // Agregar fecha de generación
      worksheet.mergeCells('A2:G2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Fecha de generación: ${new Date().toLocaleDateString('es-PE')}`;
      dateCell.font = { italic: true };
      dateCell.alignment = { horizontal: 'center' };

      // Configurar encabezados
      const headers = ['ID', 'Cantidad', 'Peso (kg)', 'Precio/kg (S/)', 'Total (S/)', 'Fecha', 'Estado'];
      const headerRow = worksheet.getRow(4);
      
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F2937' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Agregar datos
      this.filteredProductions.forEach((item, index) => {
        const row = worksheet.getRow(index + 5);
        const rowData = [
          item.id,
          item.quantityEggs,
          item.eggsKilo,
          item.priceKilo,
          item.eggsKilo * item.priceKilo,
          this.formatDate(item.registrationDate),
          item.estado
        ];

        rowData.forEach((data, colIndex) => {
          const cell = row.getCell(colIndex + 1);
          cell.value = data;
          
          // Aplicar formato de moneda a las columnas de precio y total
          if (colIndex === 3 || colIndex === 4) {
            cell.numFmt = '"S/ "#,##0.00';
          }
          
          // Aplicar bordes
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // Alternar colores de fila
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F9FAFB' }
            };
          }
        });
      });

      // Calcular totales
      const totals = this.calculateTotals();
      const totalRowIndex = this.filteredProductions.length + 6;

      // Agregar fila de totales
      worksheet.mergeCells(`A${totalRowIndex}:C${totalRowIndex}`);
      const totalLabelCell = worksheet.getCell(`A${totalRowIndex}`);
      totalLabelCell.value = 'TOTALES:';
      totalLabelCell.font = { bold: true };
      totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

      // Total de huevos
      const totalEggsCell = worksheet.getCell(`B${totalRowIndex}`);
      totalEggsCell.value = totals.totalEggs;
      totalEggsCell.font = { bold: true };

      // Peso total
      const totalWeightCell = worksheet.getCell(`C${totalRowIndex}`);
      totalWeightCell.value = totals.totalWeight;
      totalWeightCell.font = { bold: true };

      // Valor total
      const totalValueCell = worksheet.getCell(`E${totalRowIndex}`);
      totalValueCell.value = totals.totalValue;
      totalValueCell.font = { bold: true };
      totalValueCell.numFmt = '"S/ "#,##0.00';

      // Aplicar bordes a la fila de totales
      for (let col = 1; col <= 7; col++) {
        const cell = worksheet.getCell(`${String.fromCharCode(64 + col)}${totalRowIndex}`);
        cell.border = {
          top: { style: 'thick' },
          left: { style: 'thin' },
          bottom: { style: 'thick' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E5E7EB' }
        };
      }

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 8 },   // ID
        { width: 12 },  // Cantidad
        { width: 12 },  // Peso
        { width: 15 },  // Precio
        { width: 15 },  // Total
        { width: 15 },  // Fecha
        { width: 12 }   // Estado
      ];

      // Ajustar altura de filas
      worksheet.getRow(1).height = 25;
      worksheet.getRow(4).height = 20;

      // Generar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `produccion-huevos-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Crear blob y descargar
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'El archivo Excel se ha descargado correctamente',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      Swal.fire({
        title: 'Error!',
        text: 'No se pudo generar el archivo Excel',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  /**
   * Calcula los totales de la producción filtrada
   */
  private calculateTotals() {
    return this.filteredProductions.reduce((totals, item) => {
      totals.totalEggs += item.quantityEggs;
      totals.totalWeight += item.eggsKilo;
      totals.totalValue += (item.eggsKilo * item.priceKilo);
      return totals;
    }, {
      totalEggs: 0,
      totalWeight: 0,
      totalValue: 0
    });
  }
}