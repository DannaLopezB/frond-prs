import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CicloVida } from '../../../../../interfaces/Lifecycle';
import { CicloVidaService } from '../../../../../service/lifecycle.service';
import { HenService } from '../../../../../service/hen.service';
import { Vaccine } from '../../../../../interfaces/Vaccine';
import { VaccineService } from '../../../../../service/vaccine.service';
import { FoodService } from '../../../../../service/food.service';
import { Food } from '../../../../../interfaces/food';
import { Subscription } from 'rxjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ModalLifecycleComponent } from './modal-lifecycle/modal-lifecycle.component';

@Component({
  selector: 'app-lifecycle',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalLifecycleComponent],
  templateUrl: './lifecycle.component.html',
})
export class LifecycleComponent implements OnInit {
  ciclos: CicloVida[] = [];
  paginaCiclos: CicloVida[] = [];
  cicloSeleccionado: CicloVida | null = null;
  mostrarModalDetalle: boolean = false;
  cicloDetalle: any = null;
  page: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  nuevoCiclo: CicloVida = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' };
  mostrarModalCrear: boolean = false;
  mostrarModalEdicion: boolean = false;
  tipoBusqueda: string = '';
  hens: any[] = [];
  vacunas: Vaccine[] = [];
  alimentos: Food[] = [];
  isSaving: boolean = false;
  validationErrors: { [key: string]: string } = {};
  validFields: { [key: string]: boolean } = {};
  showExportDropdown: boolean = false;

  private vaccineSub: Subscription | undefined;
  private foodSub: Subscription | undefined;

  constructor(
    private cicloVidaService: CicloVidaService,
    private henService: HenService,
    private vacunaService: VaccineService,
    private foodService: FoodService
  ) { }

  ngOnInit(): void {
    this.listarCiclos();
    this.getHens();
  }

  ngOnDestroy(): void {
    this.vaccineSub?.unsubscribe();
    this.foodSub?.unsubscribe();
  }

  getHens() {
    this.henService.getHens().subscribe(data => {
      this.hens = data;
    });
  }

  onTipoItoChange() {
    if (this.nuevoCiclo.typeIto === 'Vacunas') {
      this.cargarVacunas();
      this.alimentos = [];
    } else if (this.nuevoCiclo.typeIto === 'Alimentación') {
      this.cargarAlimentos();
      this.vacunas = [];
    } else {
      this.vacunas = [];
      this.alimentos = [];
    }
  }

  onTipoItoChangeEdicion() {
    if (this.cicloSeleccionado && this.cicloSeleccionado.typeIto === 'Vacunas') {
      this.cargarVacunas();
      this.alimentos = [];
    } else if (this.cicloSeleccionado && this.cicloSeleccionado.typeIto === 'Alimentación') {
      this.cargarAlimentos();
      this.vacunas = [];
    } else {
      this.vacunas = [];
      this.alimentos = [];
    }
  }

  cargarVacunas() {
    this.vacunaService.getAllVaccines();
    if (this.vaccineSub) {
      this.vaccineSub.unsubscribe();
    }
    this.vaccineSub = this.vacunaService.vaccines$.subscribe(
      data => this.vacunas = data.filter(v => v.active === 'A'),
      error => console.error('Error al recibir vacunas', error)
    );
  }

  cargarAlimentos() {
    if (this.foodSub) {
      this.foodSub.unsubscribe();
    }
    this.foodSub = this.foodService.getActiveFoods().subscribe(
      data => {
        this.alimentos = data;
        console.log('Alimentos cargados:', this.alimentos);
      },
      error => console.error('Error al recibir alimentos', error)
    );
  }

  abrirModalCrear(): void {
    this.mostrarModalCrear = true;
    this.onTipoItoChange();
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear = false;
    this.nuevoCiclo = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' };
  }

  crearCiclo(): void {
    if (this.isSaving) return;

    if (!this.validarFormularioCreacion()) {
      return;
    }

    this.isSaving = true;

    this.cicloVidaService.create(this.nuevoCiclo).subscribe({
      next: () => {
        this.listarCiclos();
        this.cerrarModalCrear();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error al crear ciclo', err);
        this.isSaving = false;
      }
    });
  }

  listarCiclos(): void {
    this.cicloVidaService.getCycles().subscribe({
      next: (data) => {
        this.ciclos = data;
        this.filtrarCiclos();
      },
      error: (err) => console.error('Error al listar ciclos', err),
    });
  }

  filtrarCiclos(): void {
    const filtradas = this.ciclos.filter(ciclo => ciclo.status === this.statusFilter);
    this.totalPages = Math.ceil(filtradas.length / this.itemsPerPage);
    this.updatePaginatedData(filtradas);
  }

  updatePaginatedData(filtradas: CicloVida[]): void {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginaCiclos = filtradas.slice(startIndex, endIndex);
  }

  toggleStatus(): void {
    this.statusFilter = this.statusFilter === 'A' ? 'I' : 'A';
    this.statusActive = !this.statusActive;
    this.page = 1;
    this.filtrarCiclos();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarCiclos();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarCiclos();
    }
  }

  eliminarCiclo(id: number): void {
    this.cicloVidaService.delete(id).subscribe({
      next: () => window.location.reload(),
      error: (err) => console.error('Error al eliminar el ciclo', err),
    });
  }

  verCiclo(ciclo: any) {
    console.log("Detalles del ciclo:", ciclo);
  }

  restaurarCiclo(id: number): void {
    this.cicloVidaService.activate(id).subscribe({
      next: () => window.location.reload(),
      error: (err) => console.error('Error al restaurar el ciclo', err),
    });
  }

  abrirModalDetalle(ciclo: any) {
    this.cicloDetalle = ciclo;
    this.mostrarModalDetalle = true;

    if (ciclo.henId) {
      this.henService.getHenById(ciclo.henId).subscribe((hen: any) => {
        this.cicloDetalle.arrivalDate = hen.arrivalDate;
      });
    }
  }

  cerrarModalDetalle() {
    this.mostrarModalDetalle = false;
    this.cicloDetalle = null;
  }

  editarCiclo(ciclo: CicloVida): void {
    this.cicloSeleccionado = { ...ciclo };
    this.mostrarModalEdicion = true;

    if (this.cicloSeleccionado.typeIto === 'Vacunas') {
      this.cargarVacunas();
    } else if (this.cicloSeleccionado.typeIto === 'Alimentación') {
      this.cargarAlimentos();
    }
  }

  cerrarModalEdicion(): void {
    this.mostrarModalEdicion = false;
    this.cicloSeleccionado = null;
  }

  guardarEdicion(): void {
    if (!this.cicloSeleccionado || this.isSaving) return;

    if (!this.validarFormularioEdicion()) {
      return;
    }

    this.isSaving = true;

    this.cicloVidaService.update(this.cicloSeleccionado).subscribe({
      next: () => {
        this.listarCiclos();
        this.cerrarModalEdicion();
        this.isSaving = false;
      },
      error: (err) => {
        console.error('Error al actualizar ciclo', err);
        this.isSaving = false;
      }
    });
  }

  getFieldClass(fieldName: string): string {
    if (this.validFields[fieldName]) {
      return 'border-green-500 focus:ring-green-500 focus:border-green-500';
    } else if (this.validationErrors[fieldName]) {
      return 'border-red-500 focus:ring-red-500 focus:border-red-500';
    }
    return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  }

  buscarCicloPorTipo(): void {
    if (!this.tipoBusqueda) {
      this.listarCiclos();
      return;
    }

    this.cicloVidaService.getCiclosByTypeIto(this.tipoBusqueda).subscribe({
      next: (data: CicloVida[]) => {
        this.ciclos = data;
        this.filtrarCiclos();
      },
      error: (err) => console.error('Error al buscar ciclos por tipo', err)
    });
  }

  toggleCiclo(id: number, status: 'A' | 'I'): void {
    if (status === 'A') {
      this.eliminarCiclo(id);
    } else {
      this.restaurarCiclo(id);
    }
  }

  validarFormularioCreacion(): boolean {
    this.validationErrors = {};
    this.validFields = {};
    let isValid = true;

    if (!this.nuevoCiclo.henId || this.nuevoCiclo.henId === 0) {
      this.validationErrors['henId'] = 'Debe seleccionar un galpón';
      isValid = false;
    } else {
      this.validFields['henId'] = true;
    }

    if (!this.nuevoCiclo.typeIto) {
      this.validationErrors['typeIto'] = 'Debe seleccionar un tipo de hito';
      isValid = false;
    } else {
      this.validFields['typeIto'] = true;
    }

    if (!this.nuevoCiclo.nameIto) {
      this.validationErrors['nameIto'] = 'Debe seleccionar un nombre de hito';
      isValid = false;
    } else {
      this.validFields['nameIto'] = true;
    }

    if (!this.nuevoCiclo.typeTime) {
      this.validationErrors['typeTime'] = 'Debe seleccionar un tipo de tiempo';
      isValid = false;
    } else {
      this.validFields['typeTime'] = true;
    }

    if (this.nuevoCiclo.times <= 0) {
      this.validationErrors['times'] = 'El tiempo debe ser mayor a 0';
      isValid = false;
    } else if (this.nuevoCiclo.typeTime === 'Semana' && this.nuevoCiclo.times > 120) {
      this.validationErrors['times'] = 'Las semanas no pueden ser más de 120';
      isValid = false;
    } else {
      this.validFields['times'] = true;
    }

    return isValid;
  }

  validarFormularioEdicion(): boolean {
    this.validationErrors = {};
    this.validFields = {};
    let isValid = true;

    if (!this.cicloSeleccionado) return false;

    if (!this.cicloSeleccionado.henId || this.cicloSeleccionado.henId === 0) {
      this.validationErrors['henId'] = 'Debe seleccionar un galpón';
      isValid = false;
    } else {
      this.validFields['henId'] = true;
    }

    if (!this.cicloSeleccionado.typeIto) {
      this.validationErrors['typeIto'] = 'Debe seleccionar un tipo de hito';
      isValid = false;
    } else {
      this.validFields['typeIto'] = true;
    }

    if (!this.cicloSeleccionado.nameIto) {
      this.validationErrors['nameIto'] = 'Debe seleccionar un nombre de hito';
      isValid = false;
    } else {
      this.validFields['nameIto'] = true;
    }

    if (!this.cicloSeleccionado.typeTime) {
      this.validationErrors['typeTime'] = 'Debe seleccionar un tipo de tiempo';
      isValid = false;
    } else {
      this.validFields['typeTime'] = true;
    }

    if (this.cicloSeleccionado.times <= 0) {
      this.validationErrors['times'] = 'El tiempo debe ser mayor a 0';
      isValid = false;
    } else if (this.cicloSeleccionado.typeTime === 'Semana' && this.cicloSeleccionado.times > 120) {
      this.validationErrors['times'] = 'Las semanas no pueden ser más de 120';
      isValid = false;
    } else {
      this.validFields['times'] = true;
    }

    return isValid;
  }

  toggleExportDropdown(event: Event): void {
    event.stopPropagation();
    this.showExportDropdown = !this.showExportDropdown;

    if (this.showExportDropdown) {
      setTimeout(() => {
        const closeDropdown = () => {
          this.showExportDropdown = false;
          document.removeEventListener('click', closeDropdown);
        };
        document.addEventListener('click', closeDropdown);
      }, 0);
    }
  }

  downloadPDF(): void {
    const dataToExport = this.ciclos.filter(ciclo => ciclo.status === this.statusFilter);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Lista de Ciclos de Vida', 14, 20);

    doc.setFontSize(11);
    doc.text(`Estado: ${this.statusFilter === 'A' ? 'Activos' : 'Inactivos'}`, 14, 30);

    const today = new Date();
    doc.text(`Generado el: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`, 14, 40);

    const tableColumn = ['Tipo de Hito', 'Nombre', 'Tipo de Tiempo', 'Tiempo', 'Fecha de Aplicación', 'Estado'];
    const tableRows = dataToExport.map(item => [
      item.typeIto || '',
      item.nameIto || '',
      item.typeTime || '',
      item.times?.toString() || '0',
      this.formatDate(item.endDate) || '',
      item.status === 'A' ? 'Activo' : 'Inactivo'
    ]);

    import('jspdf-autotable').then(x => {
      const autoTable = (x as any).default || x;
      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 123, 255] }
      });

      doc.save('ciclos_vida.pdf');
    }).catch(err => {
      console.error('Error al cargar jspdf-autotable', err);
      let y = 50;
      doc.setFontSize(10);

      tableColumn.forEach((header, i) => {
        doc.text(header, 14 + (i * 35), y);
      });

      y += 10;
      tableRows.forEach(row => {
        row.forEach((cell, i) => {
          doc.text(cell, 14 + (i * 35), y);
        });
        y += 7;
      });

      doc.save('ciclos_vida.pdf');
    });
  }

  downloadExcel(): void {
    const dataToExport = this.ciclos.filter(ciclo => ciclo.status === this.statusFilter);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ciclos');

    worksheet.columns = [
      { header: 'Tipo de Hito', key: 'tipoHito', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Tipo de Tiempo', key: 'tipoTiempo', width: 15 },
      { header: 'Tiempo', key: 'tiempo', width: 10 },
      { header: 'Fecha de Aplicación', key: 'fechaAplicacion', width: 20 },
      { header: 'Estado', key: 'estado', width: 12 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' }
    };
    worksheet.getRow(1).font = {
      color: { argb: 'FFFFFF' },
      bold: true
    };

    dataToExport.forEach(item => {
      worksheet.addRow({
        tipoHito: item.typeIto,
        nombre: item.nameIto,
        tipoTiempo: item.typeTime,
        tiempo: item.times,
        fechaAplicacion: this.formatDate(item.endDate),
        estado: item.status === 'A' ? 'Activo' : 'Inactivo'
      });
    });

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'ciclos_vida.xlsx');
    });
  }

  downloadCSV(): void {
    const dataToExport = this.ciclos.filter(ciclo => ciclo.status === this.statusFilter);
    const headers = ['Tipo de Hito', 'Nombre', 'Tipo de Tiempo', 'Tiempo', 'Fecha de Aplicación', 'Estado'];

    const csvData = dataToExport.map(item => {
      return [
        item.typeIto,
        item.nameIto,
        item.typeTime,
        item.times.toString(),
        this.formatDate(item.endDate),
        item.status === 'A' ? 'Activo' : 'Inactivo'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'ciclos_vida.csv');
  }

  private formatDate(date: any): string {
    if (!date) return '';

    try {
      if (typeof date === 'string') {
        const parts = date.split('T')[0].split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        }

        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }

      if (date instanceof Date) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    } catch (error) {
      console.error('Error al formatear fecha', error);
    }

    return '';
  }
}