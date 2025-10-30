import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodService } from '../../../../../../service/food.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deactivate-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deactivate-modal.component.html',
  styleUrl: './deactivate-modal.component.css'
})
export class DeactivateModalComponent {

  @Input() foodIdToDeactivate: number | null = null;
  @Input() isModalDeactivate: boolean = false;
  @Output() foodDeactivated = new EventEmitter<void>();

  constructor(private foodService: FoodService) { }

  closeModal(): void {
    this.isModalDeactivate = false;
    this.foodIdToDeactivate = null;
  }

  deactivateFood(): void {
    if (this.foodIdToDeactivate !== null) {
      this.foodService.deactivateFood(this.foodIdToDeactivate).subscribe({
        next: () => {
          this.foodDeactivated.emit();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Registro desactivado',
            text: 'El alimento ha sido desactivado con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al desactivar alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
  }
}
