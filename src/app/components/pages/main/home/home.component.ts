import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from "sweetalert2";
import { Home } from '../../../../../interfaces/home';
import { HomeService } from "../../../../../service/home.service";
import { FormHomeComponent } from "./form-home/form-home.component";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    FormHomeComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  homes: Home[] = [];
  filteredHomes: Home[] = [];
  showingActive: boolean = true;
  searchTerm: string = '';
  homeToEdit: Home | null = null;
  showDialog: boolean = false;
  showExportDropdown: boolean = false;

  displayedColumns: string[] = [
    "id_home",
    "names", 
    "address",
    "status",
    "actions"
  ];

  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    this.loadHomes();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown-container')) {
      this.closeExportDropdown();
    }
  }

  toggleExportDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;
  }

  closeExportDropdown(): void {
    this.showExportDropdown = false;
  }

  loadHomes(): void {
    const service = this.showingActive
      ? this.homeService.getActiveHomes()
      : this.homeService.getInactiveHomes();

    service.subscribe({
      next: (data: Home[]) => {
        this.homes = data;
        this.filteredHomes = [...data];
      },
      error: (err) => {
        console.error("Error al cargar homes:", err);
        Swal.fire("Error", "No se pudieron cargar los homes.", "error");
      }
    });
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredHomes = [...this.homes];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredHomes = this.homes.filter(h => 
        h.names.toLowerCase().includes(term) || 
        h.address.toLowerCase().includes(term) ||
        h.id_home.toString().includes(term)
      );
    }
  }

  downloadPDF(): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Configuración de colores (corregido para jsPDF)
    const primaryColor: [number, number, number] = [41, 128, 185];
    const secondaryColor: [number, number, number] = [52, 73, 94];
    const accentColor: [number, number, number] = [231, 76, 60];
    const successColor: [number, number, number] = [39, 174, 96];
    
    // Header con gradiente simulado
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 25, 'F');
    
    // Título principal
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE EJECUTIVO DE CASAS', 148.5, 15, { align: 'center' });
    
    // Información del reporte
    doc.setFillColor(248, 249, 250);
    doc.rect(10, 30, 277, 20, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL REPORTE', 15, 38);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 15, 44);
    
    doc.text(`Filtro aplicado: ${this.showingActive ? 'Casas Activos' : 'Casas Inactivos'}`, 15, 48);
    doc.text(`Total de registros: ${this.filteredHomes.length}`, 200, 44);
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 200, 48);

    // Estadísticas rápidas
    const activeCount = this.filteredHomes.filter(h => h.status === 'A').length;
    const inactiveCount = this.filteredHomes.length - activeCount;
    
    doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    doc.rect(15, 55, 60, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVOS', 45, 62, { align: 'center' });
    doc.setFontSize(14);
    doc.text(activeCount.toString(), 45, 67, { align: 'center' });
    
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(85, 55, 60, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('INACTIVOS', 115, 62, { align: 'center' });
    doc.setFontSize(14);
    doc.text(inactiveCount.toString(), 115, 67, { align: 'center' });

    // Tabla mejorada
    autoTable(doc, {
      head: [['ID', 'Nombre de Casa', 'Dirección Completa', 'Estado', 'Fecha Registro']],
      body: this.filteredHomes.map(h => [
        h.id_home.toString(),
        h.names,
        h.address,
        h.status === 'A' ? '✓ Activo' : '✗ Inactivo',
        new Date().toLocaleDateString('es-ES')
      ]),
      startY: 75,
      margin: { left: 15, right: 15 },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: { top: 8, bottom: 8, left: 5, right: 5 }
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
        textColor: [52, 73, 94]
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 100, halign: 'left' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 35, halign: 'center' }
      },
      didDrawPage: (data) => {
        // Footer elegante
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, pageHeight - 15, 297, 15, 'F');
        
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`Página ${data.pageNumber}`, 15, pageHeight - 7);
        doc.text('Sistema de Gestión de Casas', 148.5, pageHeight - 7, { align: 'center' });
        doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 282, pageHeight - 7, { align: 'right' });
      }
    });

    doc.save(`Reporte_de_Casas_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  downloadExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Casas', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        fitToPage: true,
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
      }
    });

    // Configurar propiedades del documento
    workbook.creator = 'Sistema de Gestión de Casas';
    workbook.lastModifiedBy = 'Sistema Automatizado';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Título principal
    worksheet.mergeCells('A1:F3');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE EJECUTIVO DE CASAS';
    titleCell.style = {
      font: { size: 20, bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2980B9' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thick', color: { argb: '1F4E79' } },
        left: { style: 'thick', color: { argb: '1F4E79' } },
        bottom: { style: 'thick', color: { argb: '1F4E79' } },
        right: { style: 'thick', color: { argb: '1F4E79' } }
      }
    };

    // Información del reporte
    worksheet.mergeCells('A5:C5');
    worksheet.getCell('A5').value = 'INFORMACIÓN DEL REPORTE';
    worksheet.getCell('A5').style = {
      font: { size: 14, bold: true, color: { argb: '2C3E50' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECF0F1' } },
      alignment: { horizontal: 'left', vertical: 'middle' }
    };

    worksheet.getCell('A6').value = `Fecha: ${new Date().toLocaleDateString('es-ES')}`;
    worksheet.getCell('A7').value = `Filtro: ${this.showingActive ? 'Casas Activos' : 'Casas Inactivos'}`;
    worksheet.getCell('A8').value = `Total registros: ${this.filteredHomes.length}`;

    // Estadísticas
    worksheet.getCell('E6').value = 'Activos:';
    worksheet.getCell('F6').value = this.filteredHomes.filter(h => h.status === 'A').length;
    worksheet.getCell('E7').value = 'Inactivos:';
    worksheet.getCell('F7').value = this.filteredHomes.filter(h => h.status === 'I').length;

    // Estilo para estadísticas
    ['E6', 'E7'].forEach(cell => {
      worksheet.getCell(cell).style = {
        font: { bold: true, color: { argb: '2C3E50' } },
        alignment: { horizontal: 'right' }
      };
    });

    // Corregido: combinando propiedades de font en un solo objeto
    ['F6', 'F7'].forEach(cell => {
      worksheet.getCell(cell).style = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '27AE60' } },
        alignment: { horizontal: 'center' }
      };
    });

    // Encabezados de tabla
    const headers = ['ID', 'Nombre del Home', 'Dirección Completa', 'Estado', 'Fecha Registro', 'Observaciones'];
    worksheet.getRow(10).values = headers;

    // Estilo de encabezados
    const headerRow = worksheet.getRow(10);
    headerRow.eachCell((cell, colNumber) => {
      cell.style = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '34495E' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'medium', color: { argb: '2C3E50' } },
          left: { style: 'medium', color: { argb: '2C3E50' } },
          bottom: { style: 'medium', color: { argb: '2C3E50' } },
          right: { style: 'medium', color: { argb: '2C3E50' } }
        }
      };
    });

    // Configurar anchos de columna
    worksheet.columns = [
      { width: 8 },   // ID
      { width: 30 },  // Nombre
      { width: 50 },  // Dirección
      { width: 15 },  // Estado
      { width: 18 },  // Fecha
      { width: 25 }   // Observaciones
    ];

    // Agregar datos
    this.filteredHomes.forEach((home, index) => {
      const rowNumber = 11 + index;
      const row = worksheet.getRow(rowNumber);
      
      row.values = [
        home.id_home,
        home.names,
        home.address,
        home.status === 'A' ? 'ACTIVO' : 'INACTIVO',
        new Date().toLocaleDateString('es-ES'),
        home.status === 'A' ? 'Operativo' : 'Requiere atención'
      ];

      // Estilo alternado de filas
      const fillColor = index % 2 === 0 ? 'FFFFFF' : 'F8F9FA';
      
      row.eachCell((cell, colNumber) => {
        cell.style = {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
          border: {
            top: { style: 'thin', color: { argb: 'BDC3C7' } },
            left: { style: 'thin', color: { argb: 'BDC3C7' } },
            bottom: { style: 'thin', color: { argb: 'BDC3C7' } },
            right: { style: 'thin', color: { argb: 'BDC3C7' } }
          },
          alignment: { vertical: 'middle', wrapText: true }
        };

        // Estilo especial para columna de estado
        if (colNumber === 4) {
          const isActive = home.status === 'A';
          cell.style.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: isActive ? '27AE60' : 'E74C3C' } 
          };
          cell.style.font = { bold: true, color: { argb: 'FFFFFF' } };
          cell.style.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // Generar archivo
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `Reporte_Homes_Premium_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }

  downloadCSV(): void {
    // Crear CSV con formato mejorado
    const headers = ['ID', 'Nombre del Home', 'Dirección Completa', 'Estado', 'Fecha Generación', 'Observaciones'];
    let csv = headers.join(';') + '\n';
    
    // Agregar información del reporte
    csv += `# REPORTE DE HOMES - ${new Date().toLocaleDateString('es-ES')}\n`;
    csv += `# Filtro: ${this.showingActive ? 'Homes Activos' : 'Homes Inactivos'}\n`;
    csv += `# Total registros: ${this.filteredHomes.length}\n`;
    csv += `# Generado: ${new Date().toLocaleString('es-ES')}\n`;
    csv += '\n';
    csv += headers.join(';') + '\n';

    this.filteredHomes.forEach(h => {
      const row = [
        h.id_home.toString(),
        `"${h.names.replace(/"/g, '""')}"`,
        `"${h.address.replace(/"/g, '""')}"`,
        h.status === 'A' ? 'ACTIVO' : 'INACTIVO',
        new Date().toLocaleDateString('es-ES'),
        h.status === 'A' ? 'Operativo' : 'Requiere atención'
      ];
      csv += row.join(';') + '\n';
    });

    const blob = new Blob(["\uFEFF" + csv], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Homes_Premium_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  toggleHomes(): void {
    this.showingActive = !this.showingActive;
    this.loadHomes();
  }

  editHome(home: Home): void {
    this.homeToEdit = home;
    this.showDialog = true;
  }

  handleDialogResult(result: boolean): void {
    this.showDialog = false;
    this.homeToEdit = null;
    if (result) {
      this.loadHomes();
      Swal.fire(
        'Éxito', 
        this.homeToEdit ? 'El home ha sido actualizado' : 'El home ha sido registrado', 
        'success'
      );
    }
  }

  toggleHomeState(id: number, names: string, status: string): void {
    const isActive = status === "A";
    const action = isActive ? "deactivateHome" : "reactivateHome";

    Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} home?`,
      text: `¿Estás seguro de querer ${isActive ? 'desactivar' : 'activar'} "${names}"?`,
      icon: isActive ? 'warning' : 'info',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#d33' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${isActive ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.homeService[action](id).subscribe({
          next: () => {
            Swal.fire(
              'Éxito',
              `El home ha sido ${isActive ? 'desactivado' : 'activado'} correctamente`,
              'success'
            );
            this.loadHomes();
          },
          error: (err) => {
            console.error(`Error al ${isActive ? 'desactivar' : 'activar'} el home:`, err);
            Swal.fire(
              'Error',
              `No se pudo ${isActive ? 'desactivar' : 'activar'} el home`,
              'error'
            );
          }
        });
      }
    });
  }

  openFormHome(): void {
    this.homeToEdit = null;
    this.showDialog = true;
  }
}