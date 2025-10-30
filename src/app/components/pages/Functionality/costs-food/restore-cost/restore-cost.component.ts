import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostFoodService } from '../../../../../../service/cost-food.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-restore-cost',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restore-cost.component.html',
  styleUrl: './restore-cost.component.css'
})
export class RestoreCostComponent {

  @Input() costIdToRestore: number | null = null;
  @Input() isModalRestore: boolean = false;
  @Output() costRestored = new EventEmitter<void>();

  constructor(private costService: CostFoodService) { }

  closeModal(): void {
    this.isModalRestore = false;
    this.costIdToRestore = null;
  }

  restoreCost(): void {
    if (this.costIdToRestore !== null) {
      this.costService.reactivateCost(this.costIdToRestore).subscribe({
        next: () => {
          this.costRestored.emit();
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Registro restaurado',
            text: 'El costo de alimento ha sido restaurado con éxito.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error al restaurar el costo de alimento',
            text: 'Ocurrió un error. Inténtalo nuevamente.',
          });
        }
      });
    }
  }
}
