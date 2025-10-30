import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostFoodService } from '../../../../../../service/cost-food.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-deactivate-cost',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deactivate-cost.component.html',
  styleUrl: './deactivate-cost.component.css'
})
export class DeactivateCostComponent {

  @Input() costIdToDeactivate: number | null = null;
  @Input() isModalDeactivate: boolean = false;

  @Output() costDeactivated = new EventEmitter<void>();

  constructor(private costService: CostFoodService) { }

   closeModal(): void {
    this.isModalDeactivate = false;
    this.costIdToDeactivate = null;
  }

  deactivateCost(): void {
      if (this.costIdToDeactivate !== null) {
        this.costService.deactivateCost(this.costIdToDeactivate).subscribe({
          next: () => {
            this.costDeactivated.emit();
            this.closeModal();
            Swal.fire({
              icon: 'success',
              title: 'Registro desactivado',
              text: 'El costo de alimento ha sido desactivado con éxito.',
              timer: 2000,
              showConfirmButton: false,
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error al desactivar el costo de alimento',
              text: 'Ocurrió un error. Inténtalo nuevamente.',
            });
          }
        });
      }
    }
}
