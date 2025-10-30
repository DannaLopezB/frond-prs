import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../service/auth.services';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  styleUrls: ['./register.component.css'] // Archivo CSS para animaciones personalizadas
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);

  showPassword = false;
  isSubmitting = false;
  isLoading = false; // Added this property to fix the template errors

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage: string | null = null;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const rawForm = this.form.getRawValue();
    this.errorMessage = null;
    this.isSubmitting = true;
    this.isLoading = true; // Set isLoading to true when submitting
    
    this.authService.register(rawForm.email, rawForm.username, rawForm.password).subscribe({
      next: () => {
        // Mostrar mensaje de éxito antes de redirigir (opcional)
        setTimeout(() => {
          this.router.navigateByUrl('/Login');
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.isLoading = false; // Set isLoading to false on error
        this.errorMessage = this.getErrorMessage(err);
      },
      complete: () => {
        this.isSubmitting = false;
        this.isLoading = false; // Set isLoading to false when complete
      }
    });
  }

  private getErrorMessage(error: any): string {
    // Manejar diferentes tipos de errores que pueden venir de Firebase
    if (error.code === 'auth/email-already-in-use') {
      return 'Este correo electrónico ya está en uso. Por favor, utilice otro.';
    } else if (error.code === 'auth/invalid-email') {
      return 'Formato de correo electrónico inválido.';
    } else if (error.code === 'auth/weak-password') {
      return 'La contraseña es demasiado débil. Utilice al menos 6 caracteres.';
    } else if (error.error) {
      return error.error;
    }
    return 'Ha ocurrido un error en el registro. Por favor, inténtelo de nuevo.';
  }
}