import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestCost } from '../../../../../../interfaces/cost';
import { CostFoodService } from '../../../../../../service/cost-food.service';
import Swal from 'sweetalert2';
import { Food } from '../../../../../../interfaces/food';
import { Hen } from '../../../../../../interfaces/Hen';
import { CicloVida } from '../../../../../../interfaces/Lifecycle';
import { Shed } from '../../../../../../interfaces/Shed';

@Component({
  selector: 'app-create-cost',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,],
  templateUrl: './create-cost.component.html',
  styleUrl: './create-cost.component.css'
})
export class CreateCostComponent {
  @Input() activeFoods: Food[] = [];
  @Input() hens: Hen[] = [];
  @Input() filteredWeeks: string[] = [];
  @Input() selectedFeedType: string = '';
  @Input() selectedHen: Hen | null = null;
  @Input() selectedFood: Food | null = null;
  @Input() cycles: CicloVida[] = [];
  @Input() sheds: Shed[] = [];
  @Output() costAdded = new EventEmitter<void>();

  isModalOpen = false;
  newCostFood: RequestCost = {} as RequestCost;

  constructor(private costService: CostFoodService) { }

  openModal(): void {
    this.isModalOpen = true;
  }

  //Handles hen selection and updates the new cost food entry.
  // Además, filtra los ciclos de vida para actualizar el selector de semanas
  onHenSelected = (hen: Hen): void => {
    if (hen) {
      this.newCostFood.hensId = hen.id!;
      this.newCostFood.quantity = hen.quantity;
      const shedNameFromService = this.getShedName(hen.shedId);
      this.newCostFood.shedName = shedNameFromService;
      console.log(`Gallina seleccionada - ID: ${hen.id}, Cantidad: ${hen.quantity}, Galpón: ${this.newCostFood.shedName}`);

      // Filtramos los ciclos para el hen seleccionado y extraemos solo las semanas
      const cyclesForHen = this.cycles.filter(cycle => cycle.henId === hen.id);
      this.filteredWeeks = cyclesForHen
        .map(cycle => cycle.timesInWeeks)
        .sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));

      console.log("Semanas filtradas para este hen:", this.filteredWeeks);
    } else {
      this.filteredWeeks = [];
    }
  };

  //Handles food selection and sets related values.
  onFoodSelected = (food: Food): void => {
    if (food) {
      this.newCostFood.foodId = food.idFood;
      this.newCostFood.foodType = food.foodType;
      console.log(`Alimento seleccionado - ID: ${food.idFood}, FoodType: ${food.foodType}`);
    }
  };

  //Sets the selected week and updates the selected feed type.
  onWeekSelected = (week: string): void => {
    console.log('Semana seleccionada:', week);

    const selectedCycle = this.cycles.find(cycle => cycle.timesInWeeks === week);

    if (selectedCycle) {
      this.selectedFeedType = selectedCycle.nameIto;
      console.log('Tipo de alimento seleccionado:', this.selectedFeedType);
    } else {
      console.warn('No se encontró ciclo para la semana seleccionada:', week);
      this.selectedFeedType = '';
    }
  };

  getShedName = (shedId: number): string => {
    const foundShed = this.sheds.find(shed => shed.id === shedId);
    return foundShed ? foundShed.name : '';
  };

  closeModal(): void {
    this.isModalOpen = false;
    this.newCostFood = {} as RequestCost;
    this.selectedHen = null;
    this.selectedFood = null;
    this.filteredWeeks = [];
    this.selectedFeedType = '';
  }

  addCost(): void {
    this.costService.addNewCost(this.newCostFood).subscribe({
      next: () => {
        this.costAdded.emit();
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: 'Costo de alimento agregado',
          text: 'El costo de alimento ha sido agregado con éxito.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error al agregar costo de alimento',
          text: 'Ocurrió un error. Inténtalo nuevamente.',
        });
      }
    });
  }

  validateGrGallina(gramsPerChicken: string): boolean {
    const regex = /^\d+$/;
    return regex.test(gramsPerChicken);
  }

  validateUnitPrice(unitPrice: string): boolean {
    const regex = /^\d+(\.\d+)?$/;
    return regex.test(unitPrice);
  }
}
