import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestCost } from '../../../../../../interfaces/cost';
import { CostFoodService } from '../../../../../../service/cost-food.service';
import Swal from 'sweetalert2';
import { Food } from '../../../../../../interfaces/food';
import { Hen } from '../../../../../../interfaces/Hen';
import { Shed } from '../../../../../../interfaces/Shed';
import { CicloVida } from '../../../../../../interfaces/Lifecycle';

@Component({
  selector: 'app-edit-cost',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule],
  templateUrl: './edit-cost.component.html',
  styleUrl: './edit-cost.component.css'
})
export class EditCostComponent {
  @Input() activeFoods: Food[] = [];
  @Input() hens: Hen[] = [];
  @Input() filteredWeeks: string[] = [];
  @Input() selectedHen: Hen | null = null;
  @Input() selectedFood: Food | null = null;
  @Input() cycles: CicloVida[] = [];
  @Input() sheds: Shed[] = [];
  @Input() costToEdit: RequestCost = {} as RequestCost;
  @Input() isModalEdit: boolean = false;
  @Output() costUpdated = new EventEmitter<void>();

  constructor(private costService: CostFoodService) { }

  closeModal(): void {
    this.isModalEdit = false;
    this.costToEdit = {} as RequestCost;
    this.selectedHen = null;
    this.selectedFood = null;
    this.filteredWeeks = [];
  }

  getShedName = (shedId: number): string => {
    const foundShed = this.sheds.find(shed => shed.id === shedId);
    return foundShed ? foundShed.name : 'Desconocido';
  };

  onHenSelected = (hen: Hen): void => {
    if (hen) {
      this.selectedHen = hen;
      this.costToEdit.hensId = hen.id!;
      this.costToEdit.quantity = hen.quantity;
      this.costToEdit.shedName = this.getShedName(hen.shedId);

      // Filtrar semanas disponibles
      const cyclesForHen = this.cycles.filter(cycle => cycle.henId === hen.id);
      this.filteredWeeks = cyclesForHen.map(cycle => cycle.timesInWeeks);
    } else {
      this.filteredWeeks = [];
    }
  };

  onFoodSelected = (food: Food): void => {
    if (food) {
      this.selectedFood = food;
      this.costToEdit.foodId = food.idFood;
      this.costToEdit.foodType = food.foodType;
    }
  };

  updateCost(): void {
    if (this.costToEdit) {
      this.costService.updateCost(this.costToEdit.idFoodCosts!, this.costToEdit).subscribe({
        next: () => {
          this.costUpdated.emit();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Costo de alimento actualizado',
            text: 'El costo de alimento ha sido actualizado con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar el costo de alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
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
