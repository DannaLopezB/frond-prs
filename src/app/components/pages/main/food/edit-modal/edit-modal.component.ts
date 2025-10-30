import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FoodRequest } from '../../../../../../interfaces/food';
import { FoodService } from '../../../../../../service/food.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './edit-modal.component.html',
  styleUrl: './edit-modal.component.css'
})
export class EditModalComponent {

  @Input() foodToEdit: FoodRequest = {} as FoodRequest;
  @Input() isModalEdit: boolean = false;
  @Output() foodUpdated = new EventEmitter<void>();

  constructor(private foodService: FoodService) { }

  closeModal(): void {
    this.isModalEdit = false;
    setTimeout(() => { 
      this.foodToEdit = {} as FoodRequest;
    }, 300);
  }

  updateFood(): void {
    if (this.foodToEdit && this.foodToEdit.idFood) {
      this.foodService.updateFood(this.foodToEdit.idFood, this.foodToEdit).subscribe({
        next: () => {
          this.foodUpdated.emit();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Alimento actualizado',
            text: 'El alimento ha sido actualizado con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
  }

  //packaging field validation
  validatePackaging(packaging: string): boolean {
    const regex = /^[a-zA-Z\s]+$/;
    return regex.test(packaging);
  }

  //unite measure field validation
  validateUnitMeasure(unitMeasure: string): boolean {
    const validUnits = ['kg', 'kilogramos', 'g', 'gramos', 'ton', 'toneladas'];
    return validUnits.includes(unitMeasure.toLowerCase());
  }

}
