import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
//Model
import { Food, FoodRequest } from '../../../../../interfaces/food';
//Srvice
import { FoodService } from '../../../../../service/food.service';
//Export Data
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
//Components
import { CreateModalComponent } from './create-modal/create-modal.component';
import { EditModalComponent } from './edit-modal/edit-modal.component';
import { DeactivateModalComponent } from './deactivate-modal/deactivate-modal.component';
import { RestoreModalComponent } from './restore-modal/restore-modal.component';
import { DeleteModalComponent } from './delete-modal/delete-modal.component';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    CreateModalComponent,
    EditModalComponent,
    DeactivateModalComponent,
    RestoreModalComponent,
    DeleteModalComponent],
  templateUrl: './food.component.html',
  styleUrls: ['./food.component.css']
})
export class FoodComponent implements OnInit {

  @ViewChild(CreateModalComponent) createModalComponent!: CreateModalComponent;
  @ViewChild(EditModalComponent) editModalComponent!: EditModalComponent;

  //Modales
  isModalEdit = false;
  isModalDeactivate = false;
  isModalRestore = false;
  isModalDelete = false;
  showInactive: boolean = false;
  downloadOpen: boolean = false;
  //Food storage starters
  foodActive: Food[] = [];
  foodInactive: Food[] = [];
  filteredFoods: Food[] = [];
  //Initializers for insert and update
  foodToEdit: FoodRequest = {} as FoodRequest;
  //Initializers with null
  foodIdToDelete: number | null = null;
  foodIdToDeactivate: number | null = null;
  foodIdToRestore: number | null = null;
  //Paginator
  foodTypeFilter: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  isLoading: boolean = false;


  constructor(
    private foodService: FoodService) { }

  //1.- initialization and data loading  
  ngOnInit(): void {
    //Load the food list
    this.loadActiveFoods();
  }

  loadActiveFoods(): void {
    this.isLoading = true;
    this.foodService.getActiveFoods().subscribe({
      next: (data: Food[]) => {
        this.foodActive = data;
        this.filteredFoods = [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar alimentos activos:', err);
        this.isLoading = false;
      },
    });
  }

  loadInactiveFoods(): void {
    this.isLoading = true;
    this.foodService.getInactiveFoods().subscribe({
      next: (data: Food[]) => {
        this.foodInactive = data;
        this.filteredFoods = [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar alimentos inactivos:', err);
        this.isLoading = false;
      },
    });
  }

  refreshCurrentFoodList(): void {
    this.filteredFoods = [];
    this.foodTypeFilter = '';
    this.currentPage = 1;

    // Solo refrescar la lista visible actual
    if (this.showInactive) {
      this.loadInactiveFoods();
    } else {
      this.loadActiveFoods();
    }
  }


  //2.- Filtering, pagination, and table data 
  //Returns a list of foods by their state
  getCurrentFoodList(): Food[] {
    return this.filteredFoods.length > 0
      ? this.filteredFoods
      : (this.showInactive ? this.foodInactive : this.foodActive);
  }

  //Displays a paginated table of foods
  getTableData(): Food[] {
    let baseList = this.getCurrentFoodList();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return baseList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  //Implementing page navigation
  getPages(): number[] {
    const baseList = this.getCurrentFoodList();

    const totalPages = Math.ceil(baseList.length / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  //Turn the page
  changePage(page: number): void {
    this.currentPage = page;
  }

  //3.- Managing the user interface and events  
  //Switch between different food views
  toggleFoodList(): void {
    this.showInactive = !this.showInactive;
    this.filteredFoods = [];
    this.currentPage = 1;

    // Siempre recarga la lista al cambiar el estado
    if (this.showInactive) {
      this.loadInactiveFoods();
    } else {
      this.loadActiveFoods();
    }
  }

  //Filter by food type
  filterByType(): void {
    if (this.foodTypeFilter.trim()) {
      this.foodService.getFoodsByType(this.foodTypeFilter).subscribe({
        next: (data: Food[]) => {
          this.filteredFoods = data;
          this.currentPage = 1;
        },
        error: (err) => {
          this.filteredFoods = [];
        },
      });
    } else {
      this.filteredFoods = [];
      this.currentPage = 1;
    }
  }

  //download modal
  toggleDownload(): void {
    this.downloadOpen = !this.downloadOpen;
  }

  //4.- Managing manners
  openCreateModal(): void {
    this.createModalComponent.openModal();
  }

  editFoodData(food: Food): void {
    this.foodToEdit = {} as FoodRequest;
    this.isModalEdit = false;
    setTimeout(() => {
      this.foodToEdit = {
        idFood: food.idFood,
        foodType: food.foodType,
        foodBrand: food.foodBrand,
        amount: food.amount,
        packaging: food.packaging,
        unitMeasure: food.unitMeasure
      };
      this.isModalEdit = true;
    }, 0);
  }

  openModalDeactivate(idFood: number): void {
    this.foodIdToDeactivate = null;
    this.isModalDeactivate = false;

    setTimeout(() => {
      this.foodIdToDeactivate = idFood;
      this.isModalDeactivate = true;
    }, 0);
  }

  openModalRestore(idFood: number): void {
    this.foodIdToRestore = null;
    this.isModalRestore = false;

    setTimeout(() => {
      this.foodIdToRestore = idFood;
      this.isModalRestore = true;
    }, 0);
  }

  openModalDelete(idFood: number): void {
    this.foodIdToDelete = null;
    this.isModalDelete = false;

    setTimeout(() => {
      this.foodIdToDelete = idFood;
      this.isModalDelete = true;
    }, 0);
  }

  //5.- Export to Excel and PDF
  private getExportData(): any[] {
    return this.getCurrentFoodList().map(food => ({
      foodType: food.foodType,
      foodBrand: food.foodBrand,
      amount: food.amount,
      packaging: food.packaging,
      unitMeasure: food.unitMeasure,
      entryDate: food.entryDate ? new Date(food.entryDate).toLocaleDateString() : '',
      status: food.status,
    }));
  }

  //Export the food list to .xls
  exportToExcel(): void {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Alimentos');

    // Define columns
    worksheet.columns = [
      { header: 'Tipo de Alimento', key: 'foodType', width: 20 },
      { header: 'Marca', key: 'foodBrand', width: 20 },
      { header: 'Cantidad', key: 'amount', width: 15 },
      { header: 'Empaque', key: 'packaging', width: 15 },
      { header: 'Unidad de Medida', key: 'unitMeasure', width: 20 },
      { header: 'Fecha de Registro', key: 'entryDate', width: 20 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light gray background
    };

    // Add data rows
    const data = this.getExportData();
    data.forEach(food => {
      worksheet.addRow(food);
    });

    // Auto-filter the header row
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 }
    };

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Alimentos.xlsx');
    });
  }

  //Export the food list to PDF
  exportToPDF(): void {
    const doc = new jsPDF();

    doc.text('Lista de Alimentos', 10, 10);

    const data = this.getExportData();

    const tableData = data.map(food => [
      food.foodType,
      food.foodBrand,
      food.amount,
      food.packaging,
      food.unitMeasure,
      food.entryDate,
      food.status
    ]);

    autoTable(doc, {
      head: [['Tipo de Alimento', 'Marca', 'Cantidad', 'Empaque', 'Unidad de Medida', 'Fecha de Registro', 'Estado']],
      body: tableData,
      startY: 20
    });

    // Genera el archivo PDF
    doc.save('Alimentos.pdf');
  }
}