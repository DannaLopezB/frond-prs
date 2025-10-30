import { HttpClient } from "@angular/common/http";
import { Component, inject, type OnInit, HostListener, Renderer2, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../service/auth.services";
import { finalize } from "rxjs";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, FormsModule],
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  screenWidth = 0;
  showPassword = false;
  rememberMe = false;
  errorMessage: string | null = null;
  isLoading = false;
  returnUrl = "/dashboard";

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  @HostListener("window:resize", ["$event"])
  onResize() {
    if (this.isBrowser()) {
      this.screenWidth = window.innerWidth;
      this.fixMobileViewport();
    }
  }

  ngOnInit(): void {
    this.initBrowserFeatures();

    this.route.queryParams.subscribe((params) => {
      if (params["returnUrl"]) {
        this.returnUrl = params["returnUrl"];
      }
    });

    if (this.isBrowser()) {
      console.log("LoginComponent inicializado", {
        hasToken: this.authService.hasToken(),
        role: this.authService.getRole(),
      });

      const hadAuthError = sessionStorage.getItem("authErrorRedirect") === "true";

      sessionStorage.removeItem("redirectedFromAuthGuard");
      sessionStorage.removeItem("verificationInProgress");

      if (!hadAuthError && this.authService.hasToken()) {
        console.log("Token encontrado, redirigiendo automáticamente");
        this.router.navigateByUrl(this.returnUrl);
      } else {
        console.log("No hay token válido o redirección por error");
        sessionStorage.removeItem("authErrorRedirect");
      }
    }
  }

  private initBrowserFeatures(): void {
    if (this.isBrowser()) {
      this.screenWidth = window.innerWidth;
      this.fixMobileViewport();

      try {
        const savedEmail = localStorage.getItem("rememberedEmail");
        const savedPassword = localStorage.getItem("rememberedPassword");
        const rememberedStatus = localStorage.getItem("rememberMe");

        if (savedEmail && savedPassword && rememberedStatus === "true") {
          this.form.patchValue({
            email: savedEmail,
            password: savedPassword,
          });
          this.rememberMe = true;
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      }
    }
  }

  fixMobileViewport(): void {
    if (!this.isBrowser()) return;

    try {
      if (this.screenWidth <= 640) {
        this.renderer.setStyle(document.body, "height", "100%");
        this.renderer.setStyle(document.body, "overflow", "hidden");
        this.renderer.setStyle(document.documentElement, "height", "100%");
        this.renderer.setStyle(document.documentElement, "overflow", "hidden");

        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      }
    } catch (error) {
      console.error("Error applying mobile viewport fixes:", error);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.log("Formulario inválido, marcando campos");
      return;
    }

    const rawForm = this.form.getRawValue();
    this.errorMessage = null;
    this.isLoading = true;

    console.log("Iniciando proceso de login");

    if (this.isBrowser()) {
      localStorage.removeItem("token");
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("userData");
      sessionStorage.removeItem("tokenVerifiedRecently");
      sessionStorage.removeItem("redirectedFromAuthGuard");
      sessionStorage.removeItem("authErrorRedirect");
    }

    if (this.isBrowser() && this.rememberMe) {
      try {
        console.log('Guardando credenciales para "Recordarme"');
        localStorage.setItem("rememberedEmail", rawForm.email);
        localStorage.setItem("rememberedPassword", rawForm.password);
        localStorage.setItem("rememberMe", "true");
      } catch (error) {
        console.error("Error storing credentials in localStorage:", error);
      }
    } else if (this.isBrowser() && !this.rememberMe) {
      try {
        console.log('Eliminando credenciales "Recordarme" anteriores');
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
        localStorage.removeItem("rememberMe");
      } catch (error) {
        console.error("Error removing credentials from localStorage:", error);
      }
    }

    this.authService
      .login(rawForm.email, rawForm.password)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log("Login exitoso:", response);
          console.log("Datos del usuario obtenidos:", response?.user);
          if (this.isBrowser()) {
            sessionStorage.setItem("tokenVerifiedRecently", "true");
          }
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          console.error("Error en login:", err);

          if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
            this.errorMessage = "Email o contraseña incorrectos. Por favor, inténtelo de nuevo.";
          } else if (err.code === "auth/too-many-requests") {
            this.errorMessage = "Demasiados intentos fallidos. Por favor, intente más tarde.";
          } else {
            this.errorMessage =
              err.error?.message || err.error || err.message || "Ha ocurrido un error en el inicio de sesión.";
          }
        },
      });
  }

  logout(): void {
    console.log("Cerrando sesión");
    this.authService.logout();
  }

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
