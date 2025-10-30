import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostFoodService } from '../../../../../../service/cost-food.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-cost',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-cost.component.html',
  styleUrl: './delete-cost.component.css'
})
export class DeleteCostComponent {

  @Input() costIdToDelete: number | null = null;
  @Input() isModalDelete: boolean = false;
  @Output() costDeleted = new EventEmitter<void>();

  constructor(private costService: CostFoodService) { }

  closeModal(): void {
    this.isModalDelete = false;
    this.costIdToDelete = null;
  }

  deleteCost(): void {
    if (this.costIdToDelete !== null) {
      this.costService.deleteCostPhysically(this.costIdToDelete).subscribe({
        next: () => {
          this.costDeleted.emit();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Registro eliminado',
            text: 'El costo de alimento ha sido eliminado permanentemente.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar el costo de alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
  }
}
