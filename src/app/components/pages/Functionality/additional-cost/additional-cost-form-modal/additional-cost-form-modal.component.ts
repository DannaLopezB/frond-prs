import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UtilityDiaryService } from '../../../../../../service/utility-diary.service';
import { UtilityDiary } from '../../../../../../interfaces/UtilityDiary';
import Swal from 'sweetalert2';
import { SaleService } from '../../../../../../service/sale.service';
import { Sale } from '../../../../../../interfaces/Sale';
import { FoodCost } from '../../../../../../interfaces/cost';
import { CostFoodService } from '../../../../../../service/cost-food.service';

@Component({
  selector: 'app-additional-cost-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './additional-cost-form-modal.component.html',
  styleUrls: ['./additional-cost-form-modal.component.css']
})
export class AdditionalCostFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() diaryToEdit?: UtilityDiary;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<UtilityDiary>();

  diaryForm!: FormGroup;
  isEditing = false;
  formTitle = 'Agregar Costo Adicional';
  submitButtonText = 'Guardar';
  
  // Datos para los selectores
  sales: Sale[] = [];
  foods: FoodCost[] = []; // Changed from Food to FoodCost

  constructor(
    private fb: FormBuilder,
    private utilityDiaryService: UtilityDiaryService,
    private saleService: SaleService,
    private costFoodService: CostFoodService // Changed from foodService to costFoodService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSales();
    this.loadFoods();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.diaryForm) {
      if (this.diaryToEdit) {
        this.isEditing = true;
        this.formTitle = 'Editar Costo Adicional';
        this.submitButtonText = 'Actualizar';
        
        this.diaryForm.patchValue({
          idSale: this.diaryToEdit.idSale,
          idFood: this.diaryToEdit.idFood,
          cuidado: this.diaryToEdit.cuidado,
          costoAdicional: this.diaryToEdit.costoAdicional,
          gananciaDiaria: this.diaryToEdit.gananciaDiaria,
          fecha: this.formatDateForInput(this.diaryToEdit.fecha)
        });
      } else {
        this.isEditing = false;
        this.formTitle = 'Agregar Costo Adicional';
        this.submitButtonText = 'Guardar';
        this.resetForm();
      }
    }
  }

  private formatDateForInput(dateStr: string): string {
    // Convierte la fecha a formato YYYY-MM-DD para el input type="date"
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  private formatDisplayDate(dateStr: string): string {
    // Formatea la fecha para mostrar en el selector
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  // Carga las ventas desde el servicio
  loadSales(): void {
    this.saleService.getAllSales().subscribe({
      next: (data) => {
        this.sales = data;
      },
      error: (error) => {
        console.error('Error al cargar las ventas:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las ventas. Intente nuevamente.',
          icon: 'error'
        });
      }
    });
  }

  // Carga los alimentos desde el servicio
  loadFoods(): void {
    this.costFoodService.getACost().subscribe({ // Changed from foodService.getActiveFoods to costFoodService.getACost
      next: (data) => {
        this.foods = data;
      },
      error: (error) => {
        console.error('Error al cargar los alimentos:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los alimentos. Intente nuevamente.',
          icon: 'error'
        });
      }
    });
  }

  private initForm(): void {
    this.diaryForm = this.fb.group({
      idSale: [0, Validators.required],
      idFood: [0, Validators.required],
      cuidado: [0, [Validators.required, Validators.min(0)]],
      costoAdicional: [0, [Validators.required, Validators.min(0)]],
      gananciaDiaria: [0, [Validators.required, Validators.min(0)]],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  resetForm(): void {
    this.diaryForm.reset({
      idSale: 0,
      idFood: 0,
      cuidado: 0,
      costoAdicional: 0,
      gananciaDiaria: 0,
      fecha: new Date().toISOString().split('T')[0]
    });
  }

  // Genera el texto para mostrar en el selector de ventas
  // getSaleDisplayText(sale: Sale): string {
   // return `${this.formatDisplayDate(sale.saleDate)} - $${sale.totalPrice.toFixed(2)}`;
  // }

  // Genera el texto para mostrar en el selector de alimentos
  getFoodDisplayText(food: FoodCost): string { // Changed from Food to FoodCost
    return food.foodType || 'Sin nombre';
  }

  onSubmit(): void {
    if (this.diaryForm.invalid) {
      this.diaryForm.markAllAsTouched();
      return;
    }

    const diaryData: UtilityDiary = {
      ...this.diaryForm.value,
      id: this.isEditing && this.diaryToEdit ? this.diaryToEdit.id : 0
    };

    // Show loading indicator
    Swal.fire({
      title: 'Procesando...',
      text: this.isEditing ? 'Actualizando registro' : 'Guardando registro',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    if (this.isEditing && this.diaryToEdit) {
      this.utilityDiaryService.update(this.diaryToEdit.id, diaryData).subscribe({
        next: (response) => {
          // Close the loading indicator
          Swal.close();
          
          // Show success message
          Swal.fire({
            title: '¡Éxito!',
            text: 'El registro ha sido actualizado correctamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6'
          });
          
          this.formSubmitted.emit(response);
          this.close();
        },
        error: (error) => {
          console.error('Error al actualizar el costo adicional:', error);
          
          // Show error message
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el registro. Intenta nuevamente.',
            icon: 'error',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } else {
      this.utilityDiaryService.create(diaryData).subscribe({
        next: (response) => {
          // Close the loading indicator
          Swal.close();
          
          // Show success message
          Swal.fire({
            title: '¡Éxito!',
            text: 'El registro ha sido creado correctamente.',
            icon: 'success',
            confirmButtonColor: '#3085d6'
          });
          
          this.formSubmitted.emit(response);
          this.close();
        },
        error: (error) => {
          console.error('Error al crear el costo adicional:', error);
          
          // Show error message
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear el registro. Intenta nuevamente.',
            icon: 'error',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    }
  }

  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }
}