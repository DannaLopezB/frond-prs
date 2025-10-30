import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HomeService } from '../../../../../../service/home.service';

@Component({
  selector: 'app-form-home',
  templateUrl: './form-home.component.html',
  styleUrls: ['./form-home.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class FormHomeComponent {
  @Input() homeData: any;
  @Output() onClose = new EventEmitter<boolean>();

  homeForm: FormGroup;
  isEditing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private homeService: HomeService
  ) {
    this.homeForm = this.fb.group({
      id_home: new FormControl(null),
      names: new FormControl('', [
        Validators.required, 
        Validators.pattern('^[a-zA-Z\\s]+$')
      ]),
      address: new FormControl('', [
        Validators.required, 
        Validators.pattern('^[A-Za-z0-9\\s,.-]+$')
      ]),
      status: new FormControl('A', [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.isEditing = !!this.homeData?.id_home;
    if (this.homeData) {
      this.homeForm.patchValue(this.homeData);
    }
  }

  submitForm(): void {
    if (this.homeForm.invalid) {
      this.showValidationMessages();
      return;
    }

    const formData = this.homeForm.value;
    
    const serviceCall = this.isEditing 
      ? this.homeService.updateHome(formData.id_home, formData)
      : this.homeService.createHome(formData);

    serviceCall.subscribe({
      next: () => {
        Swal.fire('Éxito', this.isEditing ? 'Actualizado correctamente' : 'Creado correctamente', 'success');
        this.onClose.emit(true);
      },
      error: (err) => {
        console.error('Error:', err);
        Swal.fire('Error', 'Operación fallida', 'error');
        this.onClose.emit(false);
      }
    });
  }

  showValidationMessages(): void {
    const controls = this.homeForm.controls;
    let errorMessage = '';

    if (controls['names'].errors) {
      if (controls['names'].errors['required']) {
        errorMessage = 'El nombre es obligatorio';
      } else if (controls['names'].errors['pattern']) {
        errorMessage = 'Solo letras y espacios permitidos';
      }
    } else if (controls['address'].errors) {
      if (controls['address'].errors['required']) {
        errorMessage = 'La dirección es obligatoria';
      } else if (controls['address'].errors['pattern']) {
        errorMessage = 'Formato de dirección inválido';
      }
    }

    if (errorMessage) Swal.fire('Error', errorMessage, 'warning');
  }

  cancel(): void {
    this.onClose.emit(false);
  }
}