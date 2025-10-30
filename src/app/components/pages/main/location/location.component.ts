import { Component, OnInit } from '@angular/core';
import { UbigeoService } from '../../../../../service/ubigeo.service';
import { Ubigeo } from '../../../../../interfaces/Ubigeo';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css'],
})
export class LocationComponent implements OnInit {
  ubicaciones: Ubigeo[] = [];
  paginatedUbicaciones: Ubigeo[] = [];
  page: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  statusFilter: 'A' | 'I' = 'A';
  statusActive: boolean = true;
  isModalOpen = false;
  editMode = false;
  ubigeoForm: FormGroup;

  constructor(private ubigeoService: UbigeoService, private fb: FormBuilder) {
    this.ubigeoForm = this.fb.group({
      id: [null],
      country: ['', Validators.required],
      department: [''],
      province: [''],
      district: [''],
      status: ['A'],
    });
  }

  ngOnInit(): void {
    this.listarUbicaciones();
    this.adjustItemsPerPage();
    // Escuchar cambios de tamaño de pantalla
    window.addEventListener('resize', () => {
      this.adjustItemsPerPage();
    });
  }

  // Ajustar elementos por página según tamaño de pantalla
  adjustItemsPerPage(): void {
    if (window.innerWidth < 768) { // Móvil
      this.itemsPerPage = 4;
    } else {
      this.itemsPerPage = 6;
    }
    this.page = 1; // Reiniciar a la primera página
    if (this.ubicaciones.length > 0) {
      this.filtrarUbicaciones();
    }
  }

  listarUbicaciones(): void {
    this.ubigeoService.listarTodos().subscribe({
      next: (data) => {
        this.ubicaciones = data;
        this.filtrarUbicaciones();
      },
      error: (err) => {
        console.error('Error al listar ubicaciones:', err);
        this.mostrarError('Error al cargar las ubicaciones');
      },
    });
  }

  filtrarUbicaciones(): void {
    const ubicacionesFiltradas = this.ubicaciones.filter((u) => u.status === this.statusFilter);
    this.totalPages = Math.ceil(ubicacionesFiltradas.length / this.itemsPerPage);
    this.paginatedUbicaciones = ubicacionesFiltradas.slice(
      (this.page - 1) * this.itemsPerPage, 
      this.page * this.itemsPerPage
    );
    
    // Asegurar que la página actual sea válida
    if (this.page > this.totalPages && this.totalPages > 0) {
      this.page = this.totalPages;
      this.filtrarUbicaciones();
    }
  }

  abrirModal(): void {
    this.editMode = false;
    this.ubigeoForm.reset({ status: 'A' });
    this.isModalOpen = true;
  }

  editarUbicacion(ubicacion: Ubigeo): void {
    this.editMode = true;
    this.ubigeoForm.patchValue(ubicacion);
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
  }

  guardarUbicacion(): void {
    if (this.ubigeoForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.ubigeoForm.controls).forEach(key => {
        this.ubigeoForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Mostrar indicador de carga
    Swal.fire({
      title: 'Procesando',
      text: 'Guardando información...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    if (this.editMode) {
      this.ubigeoService.editar(this.ubigeoForm.value.id, this.ubigeoForm.value).subscribe({
        next: (updatedUbicacion) => {
          Swal.fire({
            icon: 'success',
            title: 'Ubicación actualizada',
            text: `La ubicación ${updatedUbicacion.province || ''} ha sido actualizada con éxito.`,
            timer: 2000,
            showConfirmButton: false
          });
          this.listarUbicaciones();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al actualizar ubicación:', err);
          this.mostrarError('Error al actualizar la ubicación');
        },
      });
    } else {
      this.ubigeoService.crear(this.ubigeoForm.value).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Ubicación agregada',
            text: 'La ubicación ha sido creada con éxito.',
            timer: 2000,
            showConfirmButton: false
          });
          this.listarUbicaciones();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al agregar ubicación:', err);
          this.mostrarError('Error al agregar la ubicación');
        },
      });
    }
  }

  eliminarUbicacion(id: number): void {
    // Configurar SweetAlert2 para ser más responsive en móviles
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-danger mx-2 text-sm',
        cancelButton: 'btn btn-secondary mx-2 text-sm'
      },
      buttonsStyling: true
    });

    swalWithBootstrapButtons.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desactivará la ubicación',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubigeoService.eliminarLogico(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Ubicación eliminada',
              text: `La ubicación ha sido desactivada correctamente.`,
              timer: 2000,
              showConfirmButton: false
            });
            this.listarUbicaciones();
          },
          error: (err) => {
            console.error('Error al eliminar ubicación:', err);
            this.mostrarError('Error al desactivar la ubicación');
          },
        });
      }
    });
  }

  restaurarUbicacion(id: number): void {
    // Configurar SweetAlert2 para ser más responsive en móviles
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success mx-2 text-sm',
        cancelButton: 'btn btn-danger mx-2 text-sm'
      },
      buttonsStyling: true
    });

    swalWithBootstrapButtons.fire({
      title: '¿Restaurar ubicación?',
      text: 'Esta acción activará nuevamente la ubicación',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubigeoService.restaurar(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Ubicación restaurada',
              text: 'La ubicación ha sido activada nuevamente.',
              timer: 2000,
              showConfirmButton: false
            });
            this.listarUbicaciones();
          },
          error: (error) => {
            console.error('Error al restaurar la ubicación:', error);
            this.mostrarError('Error al restaurar la ubicación');
          },
        });
      }
    });
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filtrarUbicaciones();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filtrarUbicaciones();
    }
  }

  toggleStatus(): void {
    this.statusFilter = this.statusActive ? 'A' : 'I';
    this.page = 1; // Resetear a la primera página
    this.filtrarUbicaciones();
  }

  // Método auxiliar para mostrar errores
  private mostrarError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      timer: 3000,
      showConfirmButton: false
    });
  }
  /**
 * Exportar datos a PDF
 */
    exportToPDF(): void {
      try {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Generando PDF',
          text: 'Por favor espere...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Obtener datos filtrados según el estado actual
        const ubicacionesParaExportar = this.ubicaciones.filter(u => u.status === this.statusFilter);

        // Crear nuevo documento PDF
        const doc = new jsPDF();
        
        // Configurar título
        const titulo = `Lista de Ubicaciones - ${this.statusActive ? 'Activas' : 'Inactivas'}`;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(titulo, 14, 20);

        // Agregar fecha de generación
        const fechaActual = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generado el: ${fechaActual}`, 14, 30);

        // Configurar datos para la tabla
        const headers = [['País', 'Departamento', 'Provincia', 'Distrito', 'Estado']];
        const data = ubicacionesParaExportar.map(ubicacion => [
          ubicacion.country || '',
          ubicacion.department || '',
          ubicacion.province || '',
          ubicacion.district || '',
          ubicacion.status === 'A' ? 'Activo' : 'Inactivo'
        ]);

        // Generar tabla con autoTable
        autoTable(doc, {
          head: headers,
          body: data,
          startY: 40,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [59, 130, 246], // Color azul
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251], // Color gris claro
          },
          columnStyles: {
            0: { cellWidth: 35 }, // País
            1: { cellWidth: 40 }, // Departamento
            2: { cellWidth: 40 }, // Provincia
            3: { cellWidth: 40 }, // Distrito
            4: { cellWidth: 25 }, // Estado
          },
          margin: { top: 40, left: 14, right: 14 },
        });

        // Agregar pie de página
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }

        // Generar nombre del archivo
        const nombreArchivo = `ubicaciones_${this.statusActive ? 'activas' : 'inactivas'}_${new Date().toISOString().split('T')[0]}.pdf`;

        // Guardar el PDF
        doc.save(nombreArchivo);

        // Cerrar indicador de carga y mostrar éxito
        Swal.fire({
          icon: 'success',
          title: 'PDF generado',
          text: `Se ha descargado el archivo: ${nombreArchivo}`,
          timer: 3000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error('Error al generar PDF:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el archivo PDF',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }

    /**
     * Exportar datos a Excel
     */
    async exportToExcel(): Promise<void> {
      try {
        // Mostrar indicador de carga
        Swal.fire({
          title: 'Generando Excel',
          text: 'Por favor espere...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Obtener datos filtrados según el estado actual
        const ubicacionesParaExportar = this.ubicaciones.filter(u => u.status === this.statusFilter);

        // Crear nuevo workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Ubicaciones ${this.statusActive ? 'Activas' : 'Inactivas'}`);

        // Configurar propiedades del documento
        workbook.creator = 'Sistema de Ubicaciones';
        workbook.lastModifiedBy = 'Sistema de Ubicaciones';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Agregar título
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Lista de Ubicaciones - ${this.statusActive ? 'Activas' : 'Inactivas'}`;
        titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E40AF' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' }
        };

        // Agregar fecha de generación
        worksheet.mergeCells('A2:E2');
        const dateCell = worksheet.getCell('A2');
        const fechaActual = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        dateCell.value = `Generado el: ${fechaActual}`;
        dateCell.font = { size: 10, italic: true };
        dateCell.alignment = { horizontal: 'center' };

        // Configurar encabezados
        const headers = ['País', 'Departamento', 'Provincia', 'Distrito', 'Estado'];
        const headerRow = worksheet.getRow(4);
        
        headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = header;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3B82F6' }
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
        ubicacionesParaExportar.forEach((ubicacion, index) => {
          const row = worksheet.getRow(index + 5);
          const rowData = [
            ubicacion.country || '',
            ubicacion.department || '',
            ubicacion.province || '',
            ubicacion.district || '',
            ubicacion.status === 'A' ? 'Activo' : 'Inactivo'
          ];

          rowData.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            cell.value = value;
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
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
                fgColor: { argb: 'FFF9FAFB' }
              };
            }

            // Estilo especial para el estado
            if (colIndex === 4) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              if (ubicacion.status === 'A') {
                cell.font = { bold: true, color: { argb: 'FF059669' } };
              } else {
                cell.font = { bold: true, color: { argb: 'FFDC2626' } };
              }
            }
          });
        });

        // Ajustar ancho de columnas
        worksheet.columns = [
          { width: 20 }, // País
          { width: 25 }, // Departamento
          { width: 25 }, // Provincia
          { width: 25 }, // Distrito
          { width: 15 }, // Estado
        ];

        // Ajustar altura de filas
        worksheet.getRow(1).height = 25;
        worksheet.getRow(2).height = 20;
        worksheet.getRow(4).height = 20;

        // Agregar filtros automáticos
        worksheet.autoFilter = {
          from: 'A4',
          to: `E${ubicacionesParaExportar.length + 4}`
        };

        // Agregar estadísticas al final
        const statsRow = worksheet.getRow(ubicacionesParaExportar.length + 6);
        statsRow.getCell(1).value = 'Total de registros:';
        statsRow.getCell(1).font = { bold: true };
        statsRow.getCell(2).value = ubicacionesParaExportar.length;
        statsRow.getCell(2).font = { bold: true, color: { argb: 'FF3B82F6' } };

        // Generar nombre del archivo
        const nombreArchivo = `ubicaciones_${this.statusActive ? 'activas' : 'inactivas'}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Generar buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        link.click();
        
        // Limpiar URL
        window.URL.revokeObjectURL(url);

        // Cerrar indicador de carga y mostrar éxito
        Swal.fire({
          icon: 'success',
          title: 'Excel generado',
          text: `Se ha descargado el archivo: ${nombreArchivo}`,
          timer: 3000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error('Error al generar Excel:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el archivo Excel',
          timer: 3000,
          showConfirmButton: false
        });
      }
    }

}