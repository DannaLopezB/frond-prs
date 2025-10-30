import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FoodService } from '../../../../../../service/food.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restore-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restore-modal.component.html',
  styleUrl: './restore-modal.component.css'
})
export class RestoreModalComponent {

  @Input() foodIdToRestore: number | null = null;
  @Input() isModalRestore: boolean = false;
  @Output() foodRestored = new EventEmitter<void>();

  constructor(private foodService: FoodService) { }

  closeModal(): void {
    this.isModalRestore = false;
    this.foodIdToRestore = null;
  }

  restoreFood(): void {
    if (this.foodIdToRestore !== null) {
      this.foodService.reactivateFood(this.foodIdToRestore).subscribe({
        next: () => {
          this.foodRestored.emit();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Registro restaurado',
            text: 'El alimento ha sido restaurado con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al restaurar alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
  }
}
