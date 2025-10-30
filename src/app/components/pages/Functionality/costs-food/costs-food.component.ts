import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
//Models
import { Food } from '../../../../../interfaces/food';
import { FoodCost, RequestCost } from '../../../../../interfaces/cost';
import { CicloVida } from "../../../../../interfaces/Lifecycle";
import { Shed } from '../../../../../interfaces/Shed';
import { Hen } from "../../../../../interfaces/Hen";
//Services
import { FoodService } from '../../../../../service/food.service';
import { CostFoodService } from '../../../../../service/cost-food.service';
import { CicloVidaService } from "../../../../../service/lifecycle.service";
import { ShedService } from '../../../../../service/shed.service';
import { HenService } from "../../../../../service/hen.service";
//Export Data
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
//Components
import { CreateCostComponent } from './create-cost/create-cost.component';
import { EditCostComponent } from './edit-cost/edit-cost.component';
import { DeactivateCostComponent } from './deactivate-cost/deactivate-cost.component';
import { RestoreCostComponent } from './restore-cost/restore-cost.component';
import { DeleteCostComponent } from './delete-cost/delete-cost.component';

@Component({
  selector: 'app-costs-food',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    CreateCostComponent,
    EditCostComponent,
    DeactivateCostComponent,
    RestoreCostComponent,
    DeleteCostComponent],
  templateUrl: './costs-food.component.html',
})
export class CostsFoodComponent implements OnInit {

  @ViewChild(CreateCostComponent) createCostComponent!: CreateCostComponent;
  @ViewChild(EditCostComponent) editCostComponent!: EditCostComponent;

  isModalEdit = false;
  isModalDeactivate = false;
  isModalRestore = false;
  isModalDelete = false;
  downloadOpen: boolean = false;
  showInactive: boolean = false;
  activeFoods: Food[] = [];
  sheds: Shed[] = [];
  hens: Hen[] = [];
  costActive: FoodCost[] = [];
  costInactive: FoodCost[] = [];
  cycles: CicloVida[] = [];
  newCostFood: RequestCost = {} as RequestCost;
  costToEdit: RequestCost = {} as RequestCost;
  costIdToDeactivate: number | null = null;
  costIdToRestore: number | null = null;
  costIdToDelete: number | null = null;
  costWeekNumberFilter: string = '';
  filteredCostFoods: FoodCost[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  filteredWeeks: string[] = [];
  selectedFeedType: string = '';
  selectedShed: string = '';
  selectedHen: Hen | null = null;
  selectedFood: Food | null = null;
  quantityHens: number = 0;
  totalCost: number = 0;
  totalKg: number = 0;
  isLoading: boolean = false;

  constructor(
    private costService: CostFoodService,
    private foodService: FoodService,
    private cicloVidaService: CicloVidaService,
    private shedService: ShedService,
    private henService: HenService,
  ) {
  }

  //1.- Data initialization
  ngOnInit(): void {
    // Called once after the component is initialized
    this.getCostFoods();
    this.getActiveFoods();
    this.loadCycles();
    this.loadSheds();
    this.loadHens();
  }

  //Loads active hens from the service.
  loadHens(): void {
    this.henService.getHens().subscribe({
      next: (data: Hen[]) => {
        this.hens = data.filter(hen => hen.status === 'A');
      },
      error: (error) => {
        console.error('Error al obtener gallinas:', error);
      }
    });
  }

  //Loads active sheds from the service.
  loadSheds(): void {
    this.shedService.getAll().subscribe({
      next: (data: Shed[]) => {
        this.sheds = data.filter(shed => shed.status === 'A');
        if (this.sheds.length > 0) {
          this.selectedShed = this.sheds[0].name;
          this.onShedChange();
        }
      },
      error: (error) => {
        console.error('Error al obtener galpones:', error);
      }
    });
  }

  //Loads feeding-related life cycles.
  loadCycles(): void {
    this.cicloVidaService.getCycles().subscribe(
      (data) => {
        const cyclesFood = data.filter(ciclo => ciclo.typeIto === 'Alimentación');
        // Guardamos todos los ciclos filtrados en la variable cycles
        this.cycles = cyclesFood;
        // Evitamos llenar filteredWeeks hasta que se seleccione un hen
        if (!this.selectedHen) {
          this.filteredWeeks = [];
        }
        console.log('Ciclos de alimentación cargados:', this.cycles);
      },
      (error) => {
        console.error('Error al obtener ciclos:', error);
      }
    );
  }

  //Loads the list of active food items.
  getActiveFoods(): void {
    this.foodService.getActiveFoods().subscribe({
      next: (data: Food[]) => {
        this.activeFoods = data; // Asignar lista de alimentos activos
      },
      error: (err) => {
        console.error('Error al obtener alimentos activos:', err);
      }
    });
  }

  //Loads cost foods based on the active/inactive toggle.
  getCostFoods(): void {
    this.isLoading = true;

    const serviceMethod = this.showInactive ? this.costService.getICost() : this.costService.getACost();

    serviceMethod.subscribe({
      next: (data: FoodCost[]) => {
        if (this.showInactive) {
          this.costInactive = data;
        } else {
          this.costActive = data;
        }
        this.onUpdateCalculations();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener el costo de alimentos:', err);
        this.isLoading = false;
      }
    });
  }

  //2.- Handling UI Changes
  //Resets the pagination when the selected shed changes.
  onShedChange(): void {
    this.currentPage = 1;
    this.onUpdateCalculations();
  }

  onUpdateAfterMetods(): void {
    this.getCostFoods();
    this.onUpdateCalculations();
  }

  onUpdateCalculations(): void {
    this.calculateTotalHens();
    this.calculateTotalCost();
    this.calculateTotalAmountWeek();
  }

  getShedIdByName(name: string): number {
    const shed = this.sheds.find(s => s.name === name);
    return shed ? shed.id : 0;
  }

  calculateTotalHens(): void {
    const foodCosts = this.getCurrentFoodCostList().filter(
      fc => fc.shedName === this.selectedShed
    );

    const uniqueHenIds = [...new Set(foodCosts.map(fc => fc.hensId))];

    this.quantityHens = this.hens
      .filter(hen => hen.shedId === this.getShedIdByName(this.selectedShed) && uniqueHenIds.includes(hen.id!))
      .reduce((sum, hen) => sum + hen.quantity, 0);
  }

  calculateTotalCost(): void {
    const foodCosts = this.getCurrentFoodCostList().filter(
      fc => fc.shedName === this.selectedShed
    );

    this.totalCost = foodCosts.reduce((sum, fc) => {
      const value = typeof fc.totalCost === 'number' ? fc.totalCost : parseFloat(String(fc.totalCost).replace(/[^\d.-]/g, ''));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }

  calculateTotalAmountWeek(): void {
    const foodCosts = this.getCurrentFoodCostList().filter(
      fc => fc.shedName === this.selectedShed
    );

    this.totalKg = foodCosts.reduce((sum, fc) => {
      const value = typeof fc.totalKg === 'number' ? fc.totalKg : parseFloat(String(fc.totalKg).replace(/[^\d.-]/g, ''));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
  }

  //3.- Table management and pagination
  //Returns the current food cost list based on active/inactive state
  getCurrentFoodCostList(): FoodCost[] {
    return this.filteredCostFoods.length > 0
      ? this.filteredCostFoods
      : (this.showInactive ? this.costInactive : this.costActive);
  }

  //Returns the paginated table data for display.
  getTableData(): FoodCost[] {
    let baseList = this.getCurrentFoodCostList();
    baseList = baseList.filter(item => item.shedName === this.selectedShed);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return baseList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  //Returns an array of page numbers based on item count.
  getPages(): number[] {
    const filteredCount = this.getCurrentFoodCostList().length;
    const totalPages = Math.ceil(filteredCount / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  //Changes the current pagination page.
  changePage(page: number): void {
    this.currentPage = page;
  }

  //4.- Managing the user interface and events 
  //Toggles between active and inactive food cost views.
  toggleCostList(): void {
    this.showInactive = !this.showInactive;
    this.getCostFoods();
  }

  //Toggles the Excel download section.
  toggleDownload(): void {
    this.downloadOpen = !this.downloadOpen;
  }

  //Filters cost foods by the selected week number.
  filterByWeekNumber(): void {
    if (this.costWeekNumberFilter.trim()) {
      this.costService.getFoodCostByWeekNumber(this.costWeekNumberFilter).subscribe({
        next: (data: FoodCost[]) => {
          this.filteredCostFoods = data.filter(item => item.shedName === this.selectedShed);
          this.currentPage = 1;
        },
        error: (err) => {
          console.error('Error al filtrar por semana:', err);
          this.filteredCostFoods = [];
        }
      });
    } else {
      this.filteredCostFoods = [];
      this.currentPage = 1;
    }
  }

  //Opens the creation modal.
  openCreateModal(): void {
    if (this.createCostComponent) {
      this.createCostComponent.selectedHen = null;
      this.createCostComponent.selectedFood = null;
      this.createCostComponent.filteredWeeks = [];
      this.createCostComponent.selectedFeedType = '';
      this.createCostComponent.newCostFood = {} as RequestCost;

      this.createCostComponent.openModal();
    } else {
      console.warn("createCostComponent no está inicializado todavía.");
    }
  }

  editFoodCostData(cost: FoodCost): void {
    // Reiniciar el formulario de edición en el padre
    this.costToEdit = {} as RequestCost;
    this.isModalEdit = false;

    setTimeout(() => {
      // Buscar gallina y alimento correspondientes
      const matchedHen = this.hens.find(h => h.id === cost.hensId);
      const matchedFood = this.activeFoods.find(f => f.foodType === cost.foodType);

      // Pasar los valores al hijo
      this.costToEdit = {
        idFoodCosts: cost.idFoodCosts,
        weekNumber: cost.weekNumber,
        foodType: cost.foodType,
        gramsPerChicken: cost.gramsPerChicken,
        unitPrice: '',
        shedName: cost.shedName,
        quantity: matchedHen?.quantity || 0,
        foodId: matchedFood?.idFood || 0,
        hensId: matchedHen?.id || 0
      };

      this.selectedHen = matchedHen || null;
      this.selectedFood = matchedFood || null;
      this.filteredWeeks = matchedHen
        ? this.cycles.filter(cycle => cycle.henId === matchedHen.id).map(cycle => cycle.timesInWeeks)
        : [];

      // Mostrar el modal de edición en el hijo
      this.isModalEdit = true;
    }, 0);
  }

  // Opens the delete confirmation modal.
  openModalDeactivate(idFoodCosts: number): void {
    this.costIdToDeactivate = null;
    this.isModalDeactivate = false;

    setTimeout(() => {
      this.costIdToDeactivate = idFoodCosts;
      this.isModalDeactivate = true;
    }, 0);
  }

  openModalRestore(idFoodCosts: number): void {
    this.costIdToRestore = null;
    this.isModalRestore = false;

    setTimeout(() => {
      this.costIdToRestore = idFoodCosts;
      this.isModalRestore = true;
    }, 0);
  }

  openModalDelete(idFoodCosts: number): void {
    this.costIdToDelete = null;
    this.isModalDelete = false;

    setTimeout(() => {
      this.costIdToDelete = idFoodCosts;
      this.isModalDelete = true;
    }, 0);
  }

  //5.- Export to Excel and PDF
  private getExportData(shedName?: string): any[] {
    let data = this.getCurrentFoodCostList();

    if (shedName) {
      data = data.filter(foodCost => foodCost.shedName === shedName);
    }

    return data.map(foodCost => ({
      weekNumber: foodCost.weekNumber,
      foodType: foodCost.foodType,
      gramsPerChicken: foodCost.gramsPerChicken,
      totalKg: foodCost.totalKg,
      totalCost: foodCost.totalCost,
      startDate: foodCost.startDate ? new Date(foodCost.startDate).toLocaleDateString() : '',
      endDate: foodCost.endDate ? new Date(foodCost.endDate).toLocaleDateString() : '',
      status: foodCost.status
    }));
  }

  //Export the food cost list to .xls
  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Costo de Alimentos');

    // Define columns
    worksheet.columns = [
      { header: 'Semana', key: 'weekNumber', width: 20 },
      { header: 'Tipo', key: 'foodType', width: 20 },
      { header: 'gr/gallina', key: 'gramsPerChicken', width: 15 },
      { header: 'Total (kg)', key: 'totalKg', width: 15 },
      { header: 'Costo Total', key: 'totalCost', width: 15 },
      { header: 'Fecha de Inicio', key: 'startDate', width: 15 },
      { header: 'Fecha Final', key: 'endDate', width: 15 },
      { header: 'Estado', key: 'status', width: 15 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' } // Light gray background
    };

    const data = this.getExportData(this.selectedShed);

    data.forEach(row => worksheet.addRow(row));

    // Auto-filter the header row
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 7 }
    };

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Costo_Alimentos.xlsx');
    });
  }

  //Export the food cost list to PDF
  exportToPDF(): void {
    const doc = new jsPDF();

    doc.text(`Lista de Costo de Alimentos - ${this.selectedShed}`, 10, 10);

    // Reutilizamos el método getExportData filtrando por galpón
    const exportData = this.getExportData(this.selectedShed);

    // Convertimos los objetos a arrays de valores (en el orden correcto)
    const tableData = exportData.map(row => [
      row.weekNumber,
      row.foodType,
      row.gramsPerChicken,
      row.totalKg,
      row.totalCost,
      row.startDate,
      row.endDate,
      row.status
    ]);

    autoTable(doc, {
      head: [['Semana', 'Tipo', 'gr/gallina', 'Total (kg)', 'Costo Total', 'Fecha de Inicio', 'Fecha Final', 'Estado']],
      body: tableData,
      startY: 20 // Para no tapar el título
    });

    doc.save('Costo_Alimentos.pdf');
  }
}