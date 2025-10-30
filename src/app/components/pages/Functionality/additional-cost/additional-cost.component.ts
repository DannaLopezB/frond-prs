import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { UtilityDiaryService } from '../../../../../service/utility-diary.service';
import { UtilityDiary } from '../../../../../interfaces/UtilityDiary';
import { AdditionalCostFormModalComponent } from './additional-cost-form-modal/additional-cost-form-modal.component';
import { SaleService } from '../../../../../service/sale.service';
import { Sale } from '../../../../../interfaces/Sale';
import { FoodCost } from '../../../../../interfaces/cost';
import { CostFoodService } from '../../../../../service/cost-food.service';
import { forkJoin, catchError, of, map } from 'rxjs';

@Component({
  selector: 'app-additional-cost',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AdditionalCostFormModalComponent, FormsModule],
  templateUrl: './additional-cost.component.html',
  styleUrl: './additional-cost.component.css'
})
export class AdditionalCostComponent implements OnInit {
  utilityDiaries: UtilityDiary[] = [];
  filteredUtilityDiaries: UtilityDiary[] = [];
  hasError: boolean = false;
  
  // Lookup data
  salesData: Map<number, Sale> = new Map();
  foodCostsData: Map<number, FoodCost> = new Map();
  
  // Modal control variables
  isModalOpen: boolean = false;
  selectedDiary?: UtilityDiary;
  isLoading: boolean = true;

  // Filtros
  filterDate: string = '';
  filterStatus: string = 'A'; // Inicializar con 'A' por defecto
  
  // Paginación
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  
  Math = Math; // Para usar Math en el template

  constructor(
    private utilityDiaryService: UtilityDiaryService,
    private saleService: SaleService,
    private costFoodService: CostFoodService
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Load utility diaries and reference data in parallel
    forkJoin({
      diaries: this.utilityDiaryService.getAll(),
      sales: this.saleService.getAllSales().pipe(catchError(() => of([]))),
      foodCosts: this.costFoodService.getACost().pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.utilityDiaries = results.diaries;
        
        // Create lookup maps for sales and food costs
        // results.sales.forEach(sale => {
        //  this.salesData.set(sale.id, sale);
        // }); 
        
        results.foodCosts.forEach(cost => {
          this.foodCostsData.set(cost.idFoodCosts, cost);
        });
        
        // Inicializar filtro con estado 'A' por defecto
        this.filterStatus = 'A';
        this.applyFilters(); // Aplicar filtros inmediatamente
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data', error);
        this.hasError = true;
        this.isLoading = false;
        this.showErrorMessage('No se pudo conectar con la base de datos');
      }
    });
  }
toggleStatus(): void {
  this.filterStatus = this.filterStatus === 'A' ? 'I' : 'A';
  this.applyFilters();
}

get statusLabel(): string {
  return this.filterStatus === 'A' ? 'Mostrar Inactivos' : 'Mostrar Activos';
}

get currentStatus(): string {
  return this.filterStatus === 'A' ? 'ACTIVOS' : 'INACTIVOS';
}

  applyFilters(): void {
    this.filteredUtilityDiaries = [...this.utilityDiaries];
    
    // Filtrar por fecha
    if (this.filterDate) {
      const searchDate = new Date(this.filterDate);
      searchDate.setHours(0, 0, 0, 0);
      
      this.filteredUtilityDiaries = this.filteredUtilityDiaries.filter(item => {
        const itemDate = new Date(item.fecha);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === searchDate.getTime();
      });
    }
    
    // Filtrar por estado
    if (this.filterStatus) {
      this.filteredUtilityDiaries = this.filteredUtilityDiaries.filter(item => {
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
    this.totalPages = Math.ceil(this.filteredUtilityDiaries.length / this.itemsPerPage);
  }

  get paginatedItems(): UtilityDiary[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUtilityDiaries.slice(startIndex, startIndex + this.itemsPerPage);
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

  loadUtilityDiaries(): void {
    this.hasError = false;
    
    this.utilityDiaryService.getAll().subscribe({
      next: (data) => {
        this.utilityDiaries = data;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error fetching utility diaries', error);
        this.hasError = true;
        this.showErrorMessage('No se pudo conectar con la base de datos');
      }
    });
  }

  //getSaleDetails(saleId: number): string {
    //const sale = this.salesData.get(saleId);
    // return sale ? `Fecha: ${sale.saleDate} - Precio: S/. ${sale.totalPrice}` : `ID: ${saleId}`;
  // }
  
  getFoodCostDetails(foodCostId: number): string {
    const foodCost = this.foodCostsData.get(foodCostId);
    return foodCost ? `${foodCost.foodType} - S/. ${foodCost.totalCost}` : `ID: ${foodCostId}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  deleteUtilityDiary(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.utilityDiaryService.delete(id).subscribe({
          next: () => {
            this.loadAllData(); // Recargar datos después de eliminar
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El registro ha sido eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: '#3085d6'
            });
          },
          error: (error) => {
            console.error('Error deleting utility diary', error);
            this.showErrorMessage('Error al eliminar el registro');
          }
        });
      }
    });
  }

  inactivateUtilityDiary(id: number): void {
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
        this.utilityDiaryService.inactivate(id).subscribe({
          next: () => {
            this.loadAllData(); // Recargar datos después de inactivar
            Swal.fire(
              '¡Inactivado!',
              'El registro ha sido inactivado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error inactivating utility diary', error);
            this.showErrorMessage('Error al inactivar el registro');
          }
        });
      }
    });
  }

  activateUtilityDiary(id: number): void {
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
        this.utilityDiaryService.activate(id).subscribe({
          next: () => {
            this.loadAllData(); // Recargar datos después de activar
            Swal.fire(
              '¡Activado!',
              'El registro ha sido activado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error activating utility diary', error);
            this.showErrorMessage('Error al activar el registro');
          }
        });
      }
    });
  }

  editUtilityDiary(id: number): void {
    // Find the diary to edit
    const diaryToEdit = this.utilityDiaries.find(diary => diary.id === id);
    
    if (diaryToEdit) {
      this.selectedDiary = diaryToEdit;
      this.openModal();
    } else {
      this.showErrorMessage('No se encontró el registro a editar');
    }
  }

  addUtilityDiary(): void {
    // Reset selected diary and open modal for adding
    this.selectedDiary = undefined;
    this.openModal();
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    // Reset the selected diary when closing modal
    this.selectedDiary = undefined;
  }

  handleFormSubmitted(diary: UtilityDiary): void {
    // Refresh data after form submission
    this.loadAllData();
    
    // Show success message
    Swal.fire({
      title: '¡Éxito!',
      text: `El registro ha sido ${this.selectedDiary ? 'actualizado' : 'creado'} correctamente.`,
      icon: 'success',
      confirmButtonColor: '#3085d6'
    });
  }

  // Método para exportar a PDF
  exportToPDF(): void {
    try {
      const doc = new jsPDF();
      
      // Configurar título
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text('Registro de Utilidad Diaria', 14, 22);
      
      // Configurar fecha de generación
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-PE')}`, 14, 30);
      
      // Preparar datos para la tabla
      const tableData = this.utilityDiaries.map(diary => [
        diary.id?.toString() || '',
        'N/A', // Ventas (comentado)
        this.getFoodCostDetails(diary.idFood),
        diary.cuidado || '',
        `S/. ${diary.costoAdicional?.toFixed(2) || '0.00'}`,
        `S/. ${diary.gananciaDiaria?.toFixed(2) || '0.00'}`,
        new Date(diary.fecha).toLocaleDateString('es-PE')
      ]);

      // Configurar tabla
      autoTable(doc, {
        head: [['ID', 'Ventas', 'Costo Alimento', 'Cuidado', 'Costo Adicional', 'Ganancia Diaria', 'Fecha']],
        body: tableData,
        startY: 35,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246], // Color azul
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 15 }, // ID
          1: { cellWidth: 25 }, // Ventas
          2: { cellWidth: 35 }, // Costo Alimento
          3: { cellWidth: 25 }, // Cuidado
          4: { cellWidth: 25 }, // Costo Adicional
          5: { cellWidth: 25 }, // Ganancia Diaria
          6: { cellWidth: 25 }  // Fecha
        }
      });

      // Agregar resumen al final
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Calcular totales
      const totalCostoAdicional = this.utilityDiaries.reduce((sum, diary) => sum + (diary.costoAdicional || 0), 0);
      const totalGanancia = this.utilityDiaries.reduce((sum, diary) => sum + (diary.gananciaDiaria || 0), 0);
      
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text('Resumen:', 14, finalY);
      
      doc.setFontSize(10);
      doc.text(`Total de registros: ${this.utilityDiaries.length}`, 14, finalY + 8);
      doc.text(`Total costo adicional: S/. ${totalCostoAdicional.toFixed(2)}`, 14, finalY + 16);
      doc.text(`Total ganancia diaria: S/. ${totalGanancia.toFixed(2)}`, 14, finalY + 24);
      
      // Guardar el archivo
      const fileName = `utilidad-diaria-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'El archivo PDF se ha descargado correctamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.showErrorMessage('Error al generar el archivo PDF');
    }
  }

  // Método para exportar a Excel
  async exportToExcel(): Promise<void> {
    try {
      // Crear un nuevo workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Utilidad Diaria');

      // Configurar información del archivo
      workbook.creator = 'Sistema de Gestión';
      workbook.lastModifiedBy = 'Sistema de Gestión';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Agregar título
      worksheet.mergeCells('A1:G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Registro de Utilidad Diaria';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1f2937' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFe0f2fe' }
      };

      // Agregar fecha de generación
      worksheet.mergeCells('A2:G2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Fecha de generación: ${new Date().toLocaleDateString('es-PE')}`;
      dateCell.font = { size: 11, color: { argb: 'FF6b7280' } };
      dateCell.alignment = { horizontal: 'center' };

      // Configurar encabezados
      const headers = ['ID', 'Ventas', 'Costo Alimento', 'Cuidado', 'Costo Adicional', 'Ganancia Diaria', 'Fecha'];
      const headerRow = worksheet.getRow(4);
      
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3b82f6' }
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
      this.utilityDiaries.forEach((diary, index) => {
        const row = worksheet.getRow(index + 5);
        
        row.getCell(1).value = diary.id || '';
        row.getCell(2).value = 'N/A'; // Ventas (comentado)
        row.getCell(3).value = this.getFoodCostDetails(diary.idFood);
        row.getCell(4).value = diary.cuidado || '';
        row.getCell(5).value = diary.costoAdicional || 0;
        row.getCell(6).value = diary.gananciaDiaria || 0;
        row.getCell(7).value = new Date(diary.fecha);

        // Aplicar estilos a las celdas
        for (let i = 1; i <= 7; i++) {
          const cell = row.getCell(i);
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
              fgColor: { argb: 'FFf8fafc' }
            };
          }
        }

        // Formatear moneda
        row.getCell(5).numFmt = '"S/. "#,##0.00';
        row.getCell(6).numFmt = '"S/. "#,##0.00';
        
        // Formatear fecha
        row.getCell(7).numFmt = 'dd/mm/yyyy';
      });

      // Agregar resumen
      const summaryRowStart = this.utilityDiaries.length + 6;
      
      // Calcular totales
      const totalCostoAdicional = this.utilityDiaries.reduce((sum, diary) => sum + (diary.costoAdicional || 0), 0);
      const totalGanancia = this.utilityDiaries.reduce((sum, diary) => sum + (diary.gananciaDiaria || 0), 0);

      // Título del resumen
      worksheet.mergeCells(`A${summaryRowStart}:G${summaryRowStart}`);
      const summaryTitleCell = worksheet.getCell(`A${summaryRowStart}`);
      summaryTitleCell.value = 'RESUMEN';
      summaryTitleCell.font = { size: 14, bold: true, color: { argb: 'FF1f2937' } };
      summaryTitleCell.alignment = { horizontal: 'center' };

      // Datos del resumen
      const summaryData = [
        ['Total de registros:', this.utilityDiaries.length],
        ['Total costo adicional:', totalCostoAdicional],
        ['Total ganancia diaria:', totalGanancia]
      ];

      summaryData.forEach((data, index) => {
        const row = worksheet.getRow(summaryRowStart + index + 1);
        row.getCell(1).value = data[0];
        row.getCell(2).value = data[1];
        
        row.getCell(1).font = { bold: true };
        if (index > 0) {
          row.getCell(2).numFmt = '"S/. "#,##0.00';
        }
      });

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 10 },  // ID
        { width: 15 },  // Ventas
        { width: 25 },  // Costo Alimento
        { width: 15 },  // Cuidado
        { width: 18 },  // Costo Adicional
        { width: 18 },  // Ganancia Diaria
        { width: 15 }   // Fecha
      ];

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `utilidad-diaria-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Descargar archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mostrar mensaje de éxito
      Swal.fire({
        title: '¡Éxito!',
        text: 'El archivo Excel se ha descargado correctamente.',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });

    } catch (error) {
      console.error('Error generating Excel:', error);
      this.showErrorMessage('Error al generar el archivo Excel');
    }
  }

  private showErrorMessage(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    });
  }
}