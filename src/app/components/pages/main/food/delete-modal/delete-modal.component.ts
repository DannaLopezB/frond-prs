import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodService } from '../../../../../../service/food.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-modal.component.html',
  styleUrl: './delete-modal.component.css'
})
export class DeleteModalComponent {

  @Input() foodIdToDelete: number | null = null;
  @Input() isModalDelete: boolean = false;
  @Output() foodDeleted = new EventEmitter<void>();

  constructor(private foodService: FoodService) { }

  closeModal(): void {
    this.isModalDelete = false;
    this.foodIdToDelete = null;
  }

  deleteFood(): void {
    if (this.foodIdToDelete !== null) {
      this.foodService.deleteFoodPhysically(this.foodIdToDelete).subscribe({
        next: () => {
          this.foodDeleted.emit(); 
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Registro eliminado',
            text: 'El alimento ha sido eliminado permanentemente.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
  }
}
