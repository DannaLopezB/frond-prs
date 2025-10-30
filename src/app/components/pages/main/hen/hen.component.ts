import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hen } from '../../../../../interfaces/Hen';
import { HenService } from '../../../../../service/hen.service';
import { Shed } from '../../../../../interfaces/Shed';
import { ShedService } from '../../../../../service/shed.service';
import { Subscription } from 'rxjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-hen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hen.component.html',
})
export class HenComponent implements OnInit {
  gallinas: Hen[] = [];
  paginaGallinas: Hen[] = [];
  gallinaSeleccionada: Hen | null = null;
  mostrarModal: boolean = false;
  page: number = 1;
  itemsPerPage: number = 50;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  nuevaGallina: Hen = { henType: '', arrivalDate: new Date(), quantity: 0, status: 'A', shedId: 0 };
  mostrarModalAgregar: boolean = false;
  fechaBusqueda: string = '';
  showExportDropdown: boolean = false;

  // Added for shed integration
  sheds: Shed[] = [];
  shedNames: Map<number, string> = new Map();

  constructor(
    private henService: HenService,
    private shedService: ShedService // Add ShedService
  ) { }

  ngOnInit(): void {
    this.loadSheds();
    this.listarGallinas();
  }

  // Load all sheds
  loadSheds(): void {
    this.shedService.getAll().subscribe({
      next: (data) => {
        this.sheds = data.filter(shed => shed.status === 'A'); // Only active sheds
        // Create a map for quick lookup of shed names by ID
        this.sheds.forEach(shed => {
          this.shedNames.set(shed.id, shed.name);
        });
      },
      error: (err) => {
        console.error('Error loading sheds', err);
      }
    });
  }

  // Get shed name by ID
  getShedName(shedId: number): string {
    return this.shedNames.get(shedId) || 'No asignado';
  }

  toggleExportDropdown(event: Event): void {
    event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;

    // Close dropdown when clicking outside
    if (this.showExportDropdown) {
      setTimeout(() => {
        window.addEventListener('click', this.closeDropdown);
      }, 0);
    }
  }

  closeDropdown = (): void => {
    this.showExportDropdown = false;
    window.removeEventListener('click', this.closeDropdown);
  }

  // PDF Export function
  downloadPDF(): void {
    // Filter to get only the currently visible status
    const data = this.gallinas.filter(gallina => gallina.status === this.statusFilter);

    // Import jspdf with autotable
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then((autoTable) => {
        // Create PDF document
        const doc = new jsPDF.default('p', 'mm', 'a4');

        // Get current date in Spanish format
        const currentDate = new Date().toLocaleDateString('es-ES');

        // Add title
        doc.setFontSize(18);
        doc.text('Reporte de Gallinas', 14, 20);

        // Add metadata
        doc.setFontSize(10);
        doc.text(`Fecha del reporte: ${currentDate}`, 14, 30);
        doc.text(`Estado: ${this.statusFilter === 'A' ? 'Activas' : 'Inactivas'}`, 14, 35);
        doc.text(`Total de registros: ${data.length}`, 14, 40);

        // Use autoTable plugin
        autoTable.default(doc, {
          startY: 45,
          head: [['Fecha de llegada', 'Cantidad', 'Galpón', 'Estado']],
          body: data.map(gallina => {
            // Adjust date to handle timezone issues
            const date = new Date(gallina.arrivalDate);
            // Add one day to fix the date issue
            date.setDate(date.getDate() + 1);

            return [
              date.toLocaleDateString('es-ES'),
              gallina.quantity,
              this.getShedName(gallina.shedId),
              gallina.status === 'A' ? 'Activo' : 'Inactivo'
            ];
          }),
          theme: 'grid',
          headStyles: { fillColor: [66, 133, 244], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // Save PDF
        doc.save(`Reporte_Gallinas_${this.statusFilter === 'A' ? 'Activas' : 'Inactivas'}_${currentDate}.pdf`);
      });
    });
  }
  // Excel Export function
  downloadExcel(): void {
    // Filter to get only the currently visible status
    const data = this.gallinas.filter(gallina => gallina.status === this.statusFilter);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Gallinas');

    // Add header row
    worksheet.addRow(['Fecha de llegada', 'Cantidad', 'Galpón', 'Estado']);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4285F4' },
      bgColor: { argb: '4285F4' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };

    // Add data rows
    data.forEach(gallina => {
      // Adjust date to handle timezone issues
      const date = new Date(gallina.arrivalDate);
      // Add one day to fix the date issue
      date.setDate(date.getDate() + 1);

      worksheet.addRow([
        date.toLocaleDateString('es-ES'),
        gallina.quantity,
        this.getShedName(gallina.shedId),
        gallina.status === 'A' ? 'Activo' : 'Inactivo'
      ]);
    });

    // Column widths
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 15;

    // Generate Excel file and save
    workbook.xlsx.writeBuffer().then(buffer => {
      const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reporte_Gallinas_${this.statusFilter === 'A' ? 'Activas' : 'Inactivas'}_${currentDate}.xlsx`);
    });
  }

  // CSV Export function
  downloadCSV(): void {
    // Filter to get only the currently visible status
    const data = this.gallinas.filter(gallina => gallina.status === this.statusFilter);

    // Create CSV content
    let csvContent = 'Fecha de llegada,Cantidad,Galpón,Estado\n';
    data.forEach(gallina => {
      // Adjust date to handle timezone issues
      const date = new Date(gallina.arrivalDate);
      // Add one day to fix the date issue
      date.setDate(date.getDate() + 1);

      csvContent += `${date.toLocaleDateString('es-ES')},${gallina.quantity},${this.getShedName(gallina.shedId)},${gallina.status === 'A' ? 'Activo' : 'Inactivo'}\n`;
    });

    // Generate file and save
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    saveAs(blob, `Reporte_Gallinas_${this.statusFilter === 'A' ? 'Activas' : 'Inactivas'}_${currentDate}.csv`);
  }

  buscarGallinasPorFecha(): void {
    if (!this.fechaBusqueda) {
      console.warn('Seleccione una fecha válida.');
      this.listarGallinas();
      return;
    }

    this.henService.getHensByDate(this.fechaBusqueda).subscribe({
      next: (data) => {
        this.gallinas = data;
        this.filtrarGallinas();
      },
      error: (err) => {
        console.error('Error al buscar gallinas por fecha', err);
      },
    });
  }

  listarGallinas(): void {
    this.henService.getHens().subscribe({
      next: (data) => {
        this.gallinas = data;
        this.filtrarGallinas();
      },
      error: (err) => {
        console.error('Error al listar gallinas', err);
      },
    });
  }

  filtrarGallinas(): void {
    const filtradas = this.gallinas.filter(
      (gallina) => gallina.status === this.statusFilter
    );
    this.totalPages = Math.ceil(filtradas.length / this.itemsPerPage);
    this.updatePaginatedData(filtradas);
  }

  updatePaginatedData(filtradas: Hen[]): void {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginaGallinas = filtradas.slice(startIndex, endIndex);
  }

  toggleStatus(): void {
    this.statusFilter = this.statusFilter === 'A' ? 'I' : 'A';
    this.statusActive = !this.statusActive;
    this.page = 1;
    this.filtrarGallinas();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarGallinas();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarGallinas();
    }
  }

  abrirModalAgregar(): void {
    // Reset and initialize fields
    this.nuevaGallina = {
      henType: '', 
      arrivalDate: new Date(),
      quantity: 0,
      status: 'A',
      shedId: this.sheds.length > 0 ? this.sheds[0].id : 0
    };
    this.mostrarModalAgregar = true;
  }

  guardarNuevaGallina(): void {
    this.nuevaGallina.status = 'A';
    this.nuevaGallina.arrivalDate = new Date(this.nuevaGallina.arrivalDate);

    this.henService.create(this.nuevaGallina).subscribe(() => {
      this.listarGallinas();
      this.cerrarModalAgregar();
    });
  }

  cerrarModalAgregar(): void {
    this.mostrarModalAgregar = false;
  }

  eliminarGallina(id: number): void {
    this.henService.delete(id).subscribe({
      next: () => {
        this.listarGallinas();
      },
      error: (err) => {
        console.error('Error al eliminar la gallina', err);
      },
    });
  }

  restaurarGallina(id: number): void {
    this.henService.activate(id).subscribe({
      next: () => {
        this.listarGallinas();
      },
      error: (err) => {
        console.error('Error al restaurar la gallina ', err);
      },
    });
  }

  editarGallina(hen: Hen): void {
    this.gallinaSeleccionada = { ...hen };
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.gallinaSeleccionada = null;
  }

  guardarEdicion(): void {
    if (!this.gallinaSeleccionada) return;

    this.henService.update(this.gallinaSeleccionada).subscribe({
      next: () => {
        this.listarGallinas(); // <-- fuerza actualización completa desde el backend
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al actualizar gallina', err);
      },
    });
  }

  toggleGallina(id: number, status: 'A' | 'I'): void {
    if (status === 'A') {
      this.eliminarGallina(id);
    } else {
      this.restaurarGallina(id);
    }
  }
}