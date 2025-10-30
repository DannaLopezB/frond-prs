import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodRequest } from '../../../../../../interfaces/food';
import { FoodService } from '../../../../../../service/food.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-create-modal',
  standalone: true,
  imports: [ 
    CommonModule, 
    FormsModule ],
  templateUrl: './create-modal.component.html',
  styleUrl: './create-modal.component.css'
})
export class CreateModalComponent {

  @Output() foodAdded = new EventEmitter<void>();

  isModalOpen = false;
  newFood: FoodRequest = {} as FoodRequest;

  constructor(private foodService: FoodService) { }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.newFood = {} as FoodRequest;
  }

  addFood(): void {
    this.foodService.addNewFood(this.newFood).subscribe({
      next: () => {
        this.foodAdded.emit(); // Notificar al padre `FoodComponent`
        this.closeModal();
        Swal.fire({
          icon: 'success',
          title: 'Alimento agregado',
          text: 'El alimento ha sido agregado con éxito.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error al agregar alimento',
          text: 'Ocurrió un error. Inténtalo nuevamente.',
        });
      }
    });
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
