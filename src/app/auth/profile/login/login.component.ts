import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, HostListener, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../service/auth.services';
import { take, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);
  
  // Track screen width for responsive adjustments - initialized safely in ngOnInit
  screenWidth: number = 0;
  
  // Helper to check if we're in a browser
  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showPassword = false;
  rememberMe = false;
  errorMessage: string | null = null;
  isLoading = false;
  returnUrl: string = '/Modulo-Galpon/Dashboard';

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.isBrowser()) {
      this.screenWidth = window.innerWidth;
      this.fixMobileViewport(); // Re-apply viewport fixes on resize
    }
  }

  ngOnInit(): void {
    // Safely initialize browser-only variables using isPlatformBrowser check
    this.initBrowserFeatures();
    
    // Obtener la URL de retorno desde los parámetros de consulta si existe
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
    
    if (this.isBrowser()) {
      // Debug info
      console.log('LoginComponent inicializado', {
        authLoading: this.authService.isLoadingAuth(),
        isAuth: this.authService.isAuthenticated(),
        hasToken: !!localStorage.getItem('token'),
        tokenExpired: this.authService.isTokenExpired ? this.authService.isTokenExpired() : 'método no disponible',
        verificationInProgress: !!sessionStorage.getItem('verificationInProgress'),
        redirectedFlag: !!sessionStorage.getItem('redirectedFromAuthGuard'),
        authErrorFlag: !!sessionStorage.getItem('authErrorRedirect')
      });
      
      // Limpiar indicadores de redirección para evitar bucles
      const wasRedirectedFromGuard = sessionStorage.getItem('redirectedFromAuthGuard') === 'true';
      const hadAuthError = sessionStorage.getItem('authErrorRedirect') === 'true';
      
      // Limpiar flags para evitar problemas en futuros intentos
      sessionStorage.removeItem('redirectedFromAuthGuard');
      sessionStorage.removeItem('verificationInProgress');
      
      // Solo verificar auto-login si no fuimos redirigidos por error de autenticación
      if (!hadAuthError) {
        console.log('Procediendo con verificación normal del estado de autenticación');
        
        // Observar el estado de autenticación
        this.authService.authState$.pipe(
          take(1) // Solo necesitamos verificar una vez al inicializar
        ).subscribe(isAuthenticated => {
          // Solo proceder una vez que la inicialización de la autenticación haya terminado
          if (!this.authService.isLoadingAuth()) {
            if (isAuthenticated) {
              console.log('Usuario ya autenticado, redirigiendo a:', this.returnUrl);
              this.router.navigateByUrl(this.returnUrl);
            } else {
              // Verificar si hay tokens en localStorage que podrían seguir siendo válidos
              // Solo verificar si no hubo un error de autenticación previo
              const token = localStorage.getItem('token');
              if (token && !this.authService.isTokenExpired()) {
                console.log('Existe un token potencialmente válido, verificando con backend');
                this.isLoading = true;
                
                this.authService.verifyTokenWithBackend().pipe(
                  finalize(() => {
                    this.isLoading = false;
                  })
                ).subscribe({
                  next: (response) => {
                    if (response.success) {
                      console.log('Token verificado con éxito, redirigiendo a:', this.returnUrl);
                      this.router.navigateByUrl(this.returnUrl);
                    } else {
                      console.log('La verificación del token no fue exitosa:', response);
                    }
                  },
                  error: (err) => {
                    console.log('Error al verificar token, permaneciendo en login:', err);
                    // Limpiar tokens inválidos
                    localStorage.removeItem('token');
                    localStorage.removeItem('sessionExpiry');
                  }
                });
              } else {
                console.log('No hay token o el token está expirado, mostrando formulario de login');
              }
            }
          } else {
            console.log('AuthService aún inicializando, esperando...');
          }
        });
      } else {
        console.log('Detectado error de autenticación previo, omitiendo verificación automática');
        // Limpiar el flag de error de autenticación para futuros intentos
        sessionStorage.removeItem('authErrorRedirect');
      }
    }
  }
  
  // Safely initialize browser features
  private initBrowserFeatures(): void {
    // Check if we're in a browser environment using Angular's isPlatformBrowser
    if (this.isBrowser()) {
      console.log('Inicializando características específicas del navegador');
      
      // Initialize screen width
      this.screenWidth = window.innerWidth;
      
      // Fix for mobile viewport issues
      this.fixMobileViewport();
      
      // Cargar credenciales guardadas si "Recordarme" estaba activado
      try {
        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPassword = localStorage.getItem('rememberedPassword');
        const rememberedStatus = localStorage.getItem('rememberMe');
        
        if (savedEmail && savedPassword && rememberedStatus === 'true') {
          console.log('Encontradas credenciales guardadas, completando formulario');
          this.form.patchValue({
            email: savedEmail,
            password: savedPassword
          });
          this.rememberMe = true;
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
  }
  
  // Fix for mobile viewport issues
  fixMobileViewport(): void {
    // Verify we're in a browser environment using Angular's isPlatformBrowser
    if (!this.isBrowser()) {
      return; // Skip if we're not in a browser (SSR)
    }
    
    try {
      // Apply CSS fixes for mobile
      if (this.screenWidth <= 640) {
        console.log('Aplicando ajustes para viewport móvil');
        // Fix for iOS Safari and other mobile browsers
        this.renderer.setStyle(document.body, 'height', '100%');
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
        this.renderer.setStyle(document.documentElement, 'height', '100%');
        this.renderer.setStyle(document.documentElement, 'overflow', 'hidden');
        
        // Fix viewport height (addresses iOS Safari issues)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    } catch (error) {
      console.error('Error applying mobile viewport fixes:', error);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.log('Formulario inválido, marcando campos');
      return;
    }
    
    const rawForm = this.form.getRawValue();
    this.errorMessage = null;
    this.isLoading = true;
    
    console.log('Iniciando proceso de login');
    
    // Limpiar cualquier token anterior para asegurar un inicio de sesión limpio
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionExpiry');
      sessionStorage.removeItem('tokenVerifiedRecently');
      // Limpiar flags de redirección
      sessionStorage.removeItem('redirectedFromAuthGuard');
      sessionStorage.removeItem('authErrorRedirect');
    }
    
    // Guardar credenciales si "Recordarme" está activado (solo en navegador)
    if (this.isBrowser() && this.rememberMe) {
      try {
        console.log('Guardando credenciales para "Recordarme"');
        localStorage.setItem('rememberedEmail', rawForm.email);
        localStorage.setItem('rememberedPassword', rawForm.password);
        localStorage.setItem('rememberMe', 'true');
      } catch (error) {
        console.error('Error storing credentials in localStorage:', error);
      }
    } else if (this.isBrowser() && !this.rememberMe) {
      // Eliminar credenciales guardadas si "Recordarme" está desactivado
      try {
        console.log('Eliminando credenciales "Recordarme" anteriores');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
      } catch (error) {
        console.error('Error removing credentials from localStorage:', error);
      }
    }
    
    this.authService.login(rawForm.email, rawForm.password)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          // Login exitoso
          console.log('Login exitoso, redirigiendo a:', this.returnUrl);
          
          // Marcar que el token fue verificado recientemente
          if (this.isBrowser()) {
            sessionStorage.setItem('tokenVerifiedRecently', 'true');
          }
          // Navegar a la URL de retorno o a la ruta predeterminada
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          // Manejar diferentes tipos de errores de autenticación
          console.error('Error en login:', err);
          
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            this.errorMessage = 'Email o contraseña incorrectos. Por favor, inténtelo de nuevo.';
          } else if (err.code === 'auth/too-many-requests') {
            this.errorMessage = 'Demasiados intentos fallidos. Por favor, intente más tarde o restablezca su contraseña.';
          } else {
            this.errorMessage = err.error?.message || err.error || 'Ha ocurrido un error en el inicio de sesión';
          }
        },
      });
  }
  
  logout(): void {
    console.log('Cerrando sesión');
    this.authService.logout();
  }
}