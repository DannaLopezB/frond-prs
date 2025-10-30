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
import { CreationsPrComponent } from './creations-pr/creations-pr.component';
import Swal from 'sweetalert2';
import { ModalKardexPrComponent } from "./modal-kardex-pr/modal-kardex-pr.component";
//Exportaciones:
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Import the UserOptions type for autoTable
import { UserOptions } from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
@Component({
  selector: 'app-kardex-process',
  standalone: true,
  imports: [CommonModule, FormsModule, CreationsPrComponent, ModalKardexPrComponent],
  templateUrl: './kardex-process.component.html',
  styleUrl: './kardex-process.component.css'
})
export class KardexProcessComponent implements OnInit  {

  kardexList: TypeKardex[] = [];
  filteredKardexList: TypeKardex[] = []; // Lista filtrada de Kardex con productos tipo PT
  selectedKardex: number | null = null;
  selectedKardexData: TypeKardex | null = null;

  products: Product[] = [];
  ptProducts: Product[] = []; // Productos con typeProduct = PT
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
  
  // Array de meses para mostrar en el selector
  months: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Años disponibles (últimos 10 años)
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
    // Primero cargar productos para tener disponible la lista de PT
    this.loadProducts().then(() => {
      // Después de cargar los productos, cargamos el kardex
      this.loadKardex();
    });
    this.loadSuppliers();
    this.loadSheds();
    this.loadMovements();
  }

  loadKardex(): void {
    this.typeKardexService.listAll().subscribe(
      (data) => {
        this.kardexList = data;
        // Filtrar los Kardex que tengan productos tipo PT
        this.filterKardexWithPTProducts();
      },
      (error) => console.error('Error al obtener los datos del Kardex', error)
    );
  }

   // Método para filtrar los kardex que contienen productos tipo PT
   filterKardexWithPTProducts(): void {
    // Filtramos la lista de kardex para incluir solo aquellos con productos tipo PT
    this.filteredKardexList = this.kardexList.filter(kardex => {
      // Buscar el producto asociado a este kardex
      const product = this.products.find(p => p.id === kardex.productId);
      // Incluir solo si el tipo de producto es PT
      return product && product.typeProduct === 'PP';
    });

    // Si hay kardex filtrados, seleccionar el primero por defecto
    if (this.filteredKardexList.length > 0) {
      this.selectedKardex = this.filteredKardexList[0].id;
      this.selectedKardexData = this.filteredKardexList[0];
      this.filterMovements();  // Filtrar los movimientos con el kardex seleccionado
      this.getCurrentStock(); // Obtener el stock actual del kardex seleccionado
    } else {
      this.selectedKardex = null;
      this.selectedKardexData = null;
      this.filteredMovements = [];
      this.currentStock = 0;
    }
  }
  
  loadProducts(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.productService.getAll().subscribe(
        (data) => {
          this.products = data;
          // Filtrar productos tipo PT
          this.ptProducts = this.products.filter(p => p.typeProduct === 'PP');
          resolve();
        },
        (error) => {
          console.error('Error al obtener productos', error);
          resolve(); // Resolvemos de todas formas para continuar
        }
      );
    });
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
        this.filterMovements();  // Apply any active filters
        
        // If on the first page but no results, go back to page 1
        if (this.filteredMovements.length === 0 && this.currentPage > 1) {
          this.currentPage = 1;
        }
        
        // Actualizar el stock actual cada vez que se cargan los movimientos
        this.getCurrentStock();
      },
      error: (error) => console.error('Error al obtener los movimientos del Kardex', error)
    });
  }

  onKardexChange(event: any): void {
    const selectedId = Number(event.target.value);
    this.selectedKardexData = this.kardexList.find((k) => k.id === selectedId) || null;
    this.selectedKardex = selectedId;
    this.filterMovements();  // Filtrar los movimientos cuando cambia el selector
    this.getCurrentStock(); // Actualizar el stock cuando cambia el kardex seleccionado
  }

  filterMovements(): void {
    if (this.selectedKardex !== null) {
      // Primero filtramos por el tipo de kardex seleccionado
      let filtered = this.movementList.filter(m => m.typeKardexId === this.selectedKardex);
      
      // Luego aplicamos el filtro por mes si está seleccionado
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
      
      // Actualizar el stock después de filtrar los movimientos
      // Nota: No llamamos getCurrentStock aquí porque el filtrado no afecta el stock real,
      // solo la visualización de los movimientos
    } else {
      this.filteredMovements = [];
      this.currentStock = 0;
    }
  }

  getProductName(productId: number): string {
    return this.products.find(p => p.id === productId)?.type || 'Desconocido';
  }

  getSupplierName(supplierId: number): string {
    return this.suppliers.find(s => s.id === supplierId)?.company || 'Desconocido';
  }

  getShedName(shedId: number): string {
    return this.sheds.find(s => s.id === shedId)?.location || 'Desconocido';
  }

  isPTProduct(productId: number): boolean {
    const product = this.products.find(p => p.id === productId);
    return product ? product.typeProduct === 'PP' : false;
  }

  // Método para obtener el stock actual del producto seleccionado
  getCurrentStock(): void {
    if (!this.selectedKardex) {
      this.currentStock = 0;
      return;
    }
    
    // Usamos directamente this.movementList en lugar de llamar al servicio nuevamente
    // Esto evita tener que hacer una llamada adicional a la API cada vez
    
    // Filtramos por el tipo de kardex seleccionado y ordenamos por fecha (descendente)
    const kardexMovements = this.movementList
      .filter(m => m.typeKardexId === this.selectedKardex)
      .sort((a, b) => {
        // Ordenar primero por fecha
        const dateA = new Date(a.issueDate).getTime();
        const dateB = new Date(b.issueDate).getTime();
        
        if (dateA !== dateB) return dateB - dateA;
        
        // Si las fechas son iguales, ordenar por ID
        return (b.kardexId || 0) - (a.kardexId || 0);
      });
    
    // Si hay movimientos, tomamos el saldo del más reciente
    if (kardexMovements.length > 0) {
      const latestMovement = kardexMovements[0];
      this.currentStock = latestMovement.cantidadSaldo !== null && 
                        latestMovement.cantidadSaldo !== undefined ? 
                        latestMovement.cantidadSaldo : 0;
    } else {
      this.currentStock = 0;
    }
  }

  // MODAL de creacion kardex::
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
    status: 'Activo' // Valor predeterminado para evitar errores
  };

  openCreateModal() {
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
    this.isEditMode = true;
    this.selectedTypeKardex = { ...kardex }; // Clonar el objeto seleccionado
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

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

  //Eliminado fisico movimientos:
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
            // Actualizar la lista de movimientos localmente
            this.movementList = this.movementList.filter(m => m.kardexId !== movementId);
            this.filterMovements(); // Re-filtrar la lista actualizada
            this.getCurrentStock(); // Actualizar el stock después de eliminar
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

  //MODAL MOVIMIENTOS
  modalVisible = false;
  editMode = false;
  currentMovementKardex: MovementKardex = {} as MovementKardex;

  showModalForCreation(): void {
    this.editMode = false;
    this.currentMovementKardex = {
      typeKardexId: this.selectedKardex || 0
    } as MovementKardex; // Inicializar con el kardex seleccionado
    this.modalVisible = true;
  }

  showModalForEditing(movementKardex: MovementKardex): void {
    this.editMode = true;
    this.currentMovementKardex = { ...movementKardex };
    this.modalVisible = true;
  }

  hideModal(): void {
    this.modalVisible = false;
  }

  // Método para manejar las actualizaciones de movimientos desde el componente modal
  onMovementUpdated(movement: MovementKardex): void {
    // Check if the movement exists by kardexId
    const existingIndex = this.movementList.findIndex(m => m.kardexId === movement.kardexId);
    
    if (existingIndex > -1) {
      // Update existing movement
      this.movementList[existingIndex] = movement;
    } else {
      // Add new movement to the list
      this.movementList.push(movement);
    }
    
    // Reload all movements from the server to ensure data consistency
    this.loadMovements();
    
    // No es necesario llamar getCurrentStock aquí porque ya se llama dentro de loadMovements
  }

  // Método para manejar las actualizaciones de kardex desde el componente de creación
  onKardexUpdated(kardex: TypeKardex): void {
    // Buscar si el kardex ya existe en la lista
    const existingIndex = this.kardexList.findIndex(k => k.id === kardex.id);
    
    if (existingIndex > -1) {
      // Actualizar el kardex existente
      this.kardexList[existingIndex] = kardex;
    } else {
      // Añadir el nuevo kardex
      this.kardexList.push(kardex);
    }
    
    // Volver a filtrar la lista de kardex para actualizar filteredKardexList
    this.filterKardexWithPTProducts();
    
    // Si estamos en modo de edición y el kardex actualizado es el que estaba seleccionado
    // o si estamos en modo de creación y es un producto tipo PT, seleccionarlo automáticamente
    const product = this.products.find(p => p.id === kardex.productId);
    if (product && product.typeProduct === 'PT') {
      this.selectedKardex = kardex.id;
      this.selectedKardexData = kardex;
      this.filterMovements();
      this.getCurrentStock();
    }
  }
  
  //EXPORTABLES:
  // Método para generar el PDF
  generatePDF(): void {
    if (!this.selectedKardexData) {
      Swal.fire('Error', 'No hay ningún Kardex seleccionado', 'error');
      return;
    }
  
    // Crear una nueva instancia de jsPDF con orientación horizontal
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título del documento
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    const title = `Kardex: ${this.selectedKardexData.name}`;
    const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize() / doc.internal.scaleFactor;
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 20);
    
    // Información de cabecera
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    // Tabla para la información del Kardex
    const kardexInfo = [
      ['Producto', 'Ubicación', 'Proveedor'],
      [
        this.getProductName(this.selectedKardexData.productId),
        this.getShedName(this.selectedKardexData.shedId),
        this.getSupplierName(this.selectedKardexData.supplierId)
      ],
      ['Cantidad Máxima', 'Cantidad Mínima', 'Descripción'],
      [
        this.selectedKardexData.maximumAmount.toString(),
        this.selectedKardexData.minimumQuantity.toString(),
        this.selectedKardexData.description
      ]
    ];
    
    // Usar un enfoque manual para el posicionamiento
    let yPos = 30;
    
    // Primera tabla - utilizar un enfoque diferente para manejar finalY
    const table1Options: UserOptions = {
      startY: yPos,
      head: [kardexInfo[0]],
      body: [kardexInfo[1]],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { halign: 'center' }
    };
    
    // Ejecutar autoTable y capturar la posición final
    autoTable(doc, table1Options);
    // Obtener la posición Y actual después de dibujar la tabla
    // @ts-ignore - Ignora el error de TypeScript ya que sabemos que lastAutoTable existe
    const finalY1 = doc.lastAutoTable?.finalY || yPos;
    yPos = finalY1 + 5;
    
    // Segunda tabla
    const table2Options: UserOptions = {
      startY: yPos,
      head: [kardexInfo[2]],
      body: [kardexInfo[3]],
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      styles: { halign: 'center' }
    };
    
    // Ejecutar autoTable para la segunda tabla
    autoTable(doc, table2Options);
    // Obtener la posición Y final después de dibujar la segunda tabla
    // @ts-ignore - Ignora el error de TypeScript
    const finalY2 = doc.lastAutoTable?.finalY || yPos;
    yPos = finalY2 + 15;
    
    // ELIMINADO: Ya no mostramos el título "Movimientos de Kardex"
    
    // Preparar datos para la tabla de movimientos con el nuevo formato
    const headMovements = [
      ['#', 'Fecha', 'CONCEPTO', 'Doc', 'Doc N°', 'Entrada', 'Costo Unitario', 'Total', 'Salida', 'Costo Unitario', 'Total', 'Saldo', 'Costo Unitario', 'Total', 'Contexto']
    ];
    
    // Mapear los datos ajustados al nuevo formato de columnas
    const bodyMovements = this.filteredMovements.map((movement, index) => {
      return [
        (index + 1).toString(),
        movement.issueDate,
        movement.concept,
        movement.documentType,
        movement.documentNumber,
        movement.cantidadEntrada.toString(),
        movement.costoUnitarioEntrada ? `$${movement.costoUnitarioEntrada.toFixed(2)}` : '',
        movement.valorTotalEntrada ? `$${movement.valorTotalEntrada.toFixed(2)}` : '',
        movement.cantidadSalida.toString(),
        movement.costoUnitarioSalida ? `$${movement.costoUnitarioSalida.toFixed(2)}` : '',
        movement.valorTotalSalida ? `$${movement.valorTotalSalida.toFixed(2)}` : '',
        movement.cantidadSaldo.toString(),
        movement.costoUnitarioSaldo ? `$${movement.costoUnitarioSaldo.toFixed(2)}` : '',
        movement.valorTotalSaldo ? `$${movement.valorTotalSaldo.toFixed(2)}` : '',
        movement.observation
      ];
    });
    
    // Opciones para la tabla de movimientos con las nuevas columnas - ajustadas para formato horizontal
    const movementsTableOptions: UserOptions = {
      startY: yPos,
      head: headMovements,
      body: bodyMovements,
      theme: 'grid',
      headStyles: { 
        fillColor: [66, 139, 202], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      // Definir estilos personalizados para celdas específicas
      willDrawCell: function(data) {
        // Verificar si estamos en la sección de datos (no en el encabezado)
        if (data.section === 'body') {
          // Para entradas (celdas verdes)
          if (data.column.index === 5 || data.column.index === 6 || data.column.index === 7) {
            // Obtener los datos de la fila actual
            const rowData = bodyMovements[data.row.index];
            // Verificar si hay cantidad de entrada (columna 5, índice 5)
            if (rowData[5] && rowData[5] !== '0') {
              data.cell.styles.fillColor = [220, 255, 220]; // Verde claro
              data.cell.styles.fontStyle = 'bold';
            }
          }
          
          // Para salidas (celdas rojas)
          if (data.column.index === 8 || data.column.index === 9 || data.column.index === 10) {
            // Obtener los datos de la fila actual
            const rowData = bodyMovements[data.row.index];
            // Verificar si hay cantidad de salida (columna 8, índice 8)
            if (rowData[8] && rowData[8] !== '0') {
              data.cell.styles.fillColor = [255, 220, 220]; // Rojo claro
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },     // #
        1: { cellWidth: 20, halign: 'center' },    // Fecha
        2: { cellWidth: 30 },                      // CONCEPTO
        3: { cellWidth: 15, halign: 'center' },    // Doc
        4: { cellWidth: 15, halign: 'center' },    // Doc N°
        5: { cellWidth: 15, halign: 'center' },    // Entrada
        6: { cellWidth: 18, halign: 'right' },     // Costo Unitario (Entrada)
        7: { cellWidth: 18, halign: 'right' },     // Total (Entrada)
        8: { cellWidth: 15, halign: 'center' },    // Salida
        9: { cellWidth: 18, halign: 'right' },     // Costo Unitario (Salida)
        10: { cellWidth: 18, halign: 'right' },    // Total (Salida)
        11: { cellWidth: 15, halign: 'center' },   // Saldo
        12: { cellWidth: 18, halign: 'right' },    // Costo Unitario (Saldo)
        13: { cellWidth: 18, halign: 'right' },    // Total (Saldo)
        14: { cellWidth: 'auto' }                  // Contexto
      },
      styles: { 
        overflow: 'linebreak',
        cellPadding: 2,
        fontSize: 8
      },
      didDrawPage: (data) => {
        // Arreglo para obtener el número de páginas
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(
          `Generado el: ${new Date().toLocaleString()} - Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          pageHeight - 10
        );
      }
    };
    
    // Crear tabla de movimientos
    autoTable(doc, movementsTableOptions);
    
    // Guardar el PDF
    doc.save(`Kardex_${this.selectedKardexData.name.replace(/ /g, '_')}.pdf`);
    
    // Mostrar mensaje de éxito
    Swal.fire({
      title: '¡PDF Generado!',
      text: 'El archivo PDF ha sido generado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  //boton xls:
  generateExcel(): void {
    if (!this.selectedKardexData) {
      Swal.fire('Error', 'No hay ningún Kardex seleccionado', 'error');
      return;
    }
  
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kardex');
  
    // Add title to the worksheet
    worksheet.mergeCells('A1:O1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Kardex: ${this.selectedKardexData.name }`;
    titleCell.font = {
      size: 16,
      bold: true,
      color: { argb: '00335C' }
    };
    titleCell.alignment = { horizontal: 'center' as const };
  
    // Add Kardex Info - First section header
    worksheet.mergeCells('A3:C3');
    worksheet.getCell('A3').value = 'Producto';
    worksheet.getCell('A3').font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('A3').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '428BCA' }
    };
    worksheet.getCell('A3').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('D3:F3');
    worksheet.getCell('D3').value = 'Ubicación';
    worksheet.getCell('D3').font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('D3').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '428BCA' }
    };
    worksheet.getCell('D3').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('G3:I3');
    worksheet.getCell('G3').value = 'Proveedor';
    worksheet.getCell('G3').font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('G3').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '428BCA' }
    };
    worksheet.getCell('G3').alignment = { horizontal: 'center' as const };
  
    // Add Kardex Info - First section values
    worksheet.mergeCells('A4:C4');
    worksheet.getCell('A4').value = this.getProductName(this.selectedKardexData.productId);
    worksheet.getCell('A4').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('D4:F4');
    worksheet.getCell('D4').value = this.getShedName(this.selectedKardexData.shedId);
    worksheet.getCell('D4').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('G4:I4');
    worksheet.getCell('G4').value = this.getSupplierName(this.selectedKardexData.supplierId);
    worksheet.getCell('G4').alignment = { horizontal: 'center' as const };
  
    // Add Kardex Info - Second section header
    worksheet.mergeCells('A6:C6');
    worksheet.getCell('A6').value = 'Cantidad Máxima';
    worksheet.getCell('A6').font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('A6').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '428BCA' }
    };
    worksheet.getCell('A6').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('D6:F6');
    worksheet.getCell('D6').value = 'Cantidad Mínima';
    worksheet.getCell('D6').font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('D6').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '428BCA' }
    };
    worksheet.getCell('D6').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('G6:I6');
    worksheet.getCell('G6').value = 'Descripción';
    worksheet.getCell('G6').font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getCell('G6').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '428BCA' }
    };
    worksheet.getCell('G6').alignment = { horizontal: 'center' as const };
  
    // Add Kardex Info - Second section values
    worksheet.mergeCells('A7:C7');
    worksheet.getCell('A7').value = this.selectedKardexData.maximumAmount;
    worksheet.getCell('A7').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('D7:F7');
    worksheet.getCell('D7').value = this.selectedKardexData.minimumQuantity;
    worksheet.getCell('D7').alignment = { horizontal: 'center' as const };
  
    worksheet.mergeCells('G7:I7');
    worksheet.getCell('G7').value = this.selectedKardexData.description;
    worksheet.getCell('G7').alignment = { horizontal: 'center' as const };
  
    // Add an empty row (row 8) for spacing between tables
    // This is already handled in the current code (rows 8 is empty)
  
    // Add empty row for spacing (row 9)
    worksheet.addRow([]);
  
    // Add Movement table headers in row 10 (moved from row 9)
    const headers = [
      '#', 'Fecha', 'CONCEPTO', 'Doc', 'Doc N°', 
      'Entrada', 'Costo Unitario', 'Total', 
      'Salida', 'Costo Unitario', 'Total', 
      'Saldo', 'Costo Unitario', 'Total', 'Contexto'
    ];
  
    // Define header style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '428BCA' }
      },
      alignment: { 
        horizontal: 'center' as const, 
        vertical: 'middle' as const 
      }
    };
  
    // Add Movement table header row (now row 10)
    const headerRow = worksheet.addRow([]);
    headerRow.height = 25;
    
    // Fill in the header cells
    headers.forEach((header, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.value = header;
      cell.font = headerStyle.font;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '428BCA' }
      };
      cell.alignment = headerStyle.alignment;
    });
  
    // Define column widths
    const columnWidths = [8, 15, 30, 10, 10, 12, 15, 15, 12, 15, 15, 12, 15, 15, 30];
    columnWidths.forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });
  
    // Add movement data
    this.filteredMovements.forEach((movement, index) => {
      const row = worksheet.addRow([
        index + 1,
        movement.issueDate,
        movement.concept,
        movement.documentType,
        movement.documentNumber,
        movement.cantidadEntrada,
        movement.costoUnitarioEntrada,
        movement.valorTotalEntrada,
        movement.cantidadSalida,
        movement.costoUnitarioSalida,
        movement.valorTotalSalida,
        movement.cantidadSaldo,
        movement.costoUnitarioSaldo,
        movement.valorTotalSaldo,
        movement.observation
      ]);
  
      // Format row heights
      row.height = 20;
  
      // Apply styles based on movement type (entrada or salida)
      if (movement.cantidadEntrada > 0) {
        // Color entrada cells (columns 6-8) green
        for (let col = 6; col <= 8; col++) {
          const cell = row.getCell(col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'DCF9DC' } // Light green
          };
          cell.font = { bold: true };
        }
      }
  
      if (movement.cantidadSalida > 0) {
        // Color salida cells (columns 9-11) red
        for (let col = 9; col <= 11; col++) {
          const cell = row.getCell(col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCDC' } // Light red
          };
          cell.font = { bold: true };
        }
      }
  
      // Align number cells to right
      [6, 7, 9, 10, 12, 13].forEach(col => {
        const cell = row.getCell(col);
        cell.alignment = { horizontal: 'right' as const };
        
        // Format currency cells
        if ([7, 8, 10, 11, 13, 14].includes(col) && cell.value) {
          cell.numFmt = '$#,##0.00';
        }
      });
  
      // Center align other cells
      [1, 2, 4, 5, 6, 9, 12].forEach(col => {
        row.getCell(col).alignment = { horizontal: 'center' as const };
      });
    });
  
    // Add borders to all cells in the table
    for (let i = 3; i <= worksheet.rowCount; i++) {
      for (let j = 1; j <= headers.length; j++) {
        const cell = worksheet.getCell(i, j);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
  
    // Footer with generation timestamp
    const footerRow = worksheet.addRow([`Generado el: ${new Date().toLocaleString()}`]);
    footerRow.getCell(1).font = { italic: true, color: { argb: '808080' } };
    worksheet.mergeCells(`A${footerRow.number}:O${footerRow.number}`);
  
    // Generate and save the Excel file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Kardex_${this.selectedKardexData!.name.replace(/ /g, '_')}.xlsx`);
      
      // Show success message
      Swal.fire({
        title: '¡Excel Generado!',
        text: 'El archivo Excel ha sido generado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    });
  } 
  //MODAL FECHA:
  toggleCalendarModal(): void {
    this.calendarModalVisible = !this.calendarModalVisible;
    
    // Al abrir el modal, inicializamos los valores temporales
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
}
