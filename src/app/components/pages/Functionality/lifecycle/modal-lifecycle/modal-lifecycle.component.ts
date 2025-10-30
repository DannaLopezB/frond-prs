import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CicloVida } from '../../../../../../interfaces/Lifecycle';

@Component({
  selector: 'app-modal-lifecycle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-lifecycle.component.html',
  styleUrls: ['./modal-lifecycle.component.css']
})
export class ModalLifecycleComponent {
  @Input() mostrarModalCrear: boolean = false;
  @Input() mostrarModalEdicion: boolean = false;
  @Input() mostrarModalDetalle: boolean = false;
  @Input() cicloSeleccionado: CicloVida | null = null;
  @Input() cicloDetalle: any = null;
  @Input() nuevoCiclo: CicloVida = { henId: 0, typeIto: '', nameIto: '', typeTime: '', timesInWeeks: '', times: 0, status: 'A' };
  @Input() hens: any[] = [];
  @Input() vacunas: any[] = [];
  @Input() alimentos: any[] = [];
  @Input() validationErrors: { [key: string]: string } = {};
  @Input() validFields: { [key: string]: boolean } = {};
  @Input() isSaving: boolean = false;

  @Output() cerrarModalCrear = new EventEmitter<void>();
  @Output() cerrarModalEdicion = new EventEmitter<void>();
  @Output() cerrarModalDetalle = new EventEmitter<void>();
  @Output() onTipoItoChange = new EventEmitter<void>();
  @Output() onTipoItoChangeEdicion = new EventEmitter<void>();
  @Output() crearCiclo = new EventEmitter<void>();
  @Output() guardarEdicion = new EventEmitter<void>();
  getFieldClass(fieldName: string): string {
    if (this.validFields[fieldName]) {
      return 'border-green-500 focus:ring-green-500 focus:border-green-500';
    } else if (this.validationErrors[fieldName]) {
      return 'border-red-500 focus:ring-red-500 focus:border-red-500';
    }
    return 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  }
}