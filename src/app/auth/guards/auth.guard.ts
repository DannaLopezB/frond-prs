import { AuthService } from './../service/auth.services';
import { Injectable } from "@angular/core";
import {
  CanActivate,
  CanMatch,
  Route,
  Router,
  UrlSegment,
  UrlTree,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Observable, map, switchMap, take, of } from "rxjs";
import Swal from 'sweetalert2';

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate, CanMatch {
  constructor(private authService: AuthService, private router: Router) { }

  // 🔒 Para rutas protegidas (uso normal)
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    const isLoginRoute = route.routeConfig?.path === 'login';

    if (isLoginRoute) {
      // ⚠️ Bloqueamos el acceso a /login si ya está autenticado
      return this.canActivateIfNotAuthenticated();
    }

    const expectedRole = route.data?.["role"];
    const isPublicRoute = route.data?.["public"] === true;
    
    return this.checkAccess(expectedRole, isPublicRoute, route);
  }

  // 🔒 Para rutas hijas (lazy modules, canMatch)
  canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> {
    const expectedRole = route.data?.["role"];
    const isPublicRoute = route.data?.["public"] === true;
    
    return this.checkAccess(expectedRole, isPublicRoute);
  }

  // 🔐 Redirige a dashboard si ya estás autenticado e intentas ir a /login
  private canActivateIfNotAuthenticated(): boolean | UrlTree {
    const isLoggedIn = this.authService.hasToken();
    if (isLoggedIn) {
      return this.router.createUrlTree(['/dashboard']);
    }
    return true; // permite acceso a /login si no está logeado
  }

  // ✅ Revisa si está autenticado y si cumple con el rol esperado (si aplica)
  private checkAccess(expectedRole?: string, isPublicRoute: boolean = false, route?: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated().pipe(
      take(1),
      switchMap((isAuthenticated) => {
        // Si es una ruta pública, permitir acceso
        if (isPublicRoute) {
          return of(true);
        }

        // Si no está autenticado, redirigir a login
        if (!isAuthenticated) {
          return of(this.router.createUrlTree(["/login"]));
        }

        // Si no se requiere un rol específico, permitir acceso
        if (!expectedRole) {
          return of(true);
        }

        // Verificar rol del usuario
        const userRole = this.authService.getRole();
        
        if (userRole && this.hasRequiredRole(userRole, expectedRole)) {
          return of(true);
        } else {
          // Mostrar alerta personalizada según el tipo de contenido
          this.showAccessDeniedAlert(route);
          return of(this.router.createUrlTree(["/dashboard"]));
        }
      })
    );
  }

  /**
   * Verifica si el usuario tiene el rol requerido
   * @param userRole - Rol actual del usuario
   * @param requiredRole - Rol requerido para acceder
   * @returns boolean
   */
  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    // ADMIN tiene acceso a todo
    if (userRole === 'ADMIN') {
      return true;
    }
    
    // Para otros roles, debe coincidir exactamente
    return userRole === requiredRole;
  }

  /**
   * Muestra alertas personalizadas según el tipo de contenido al que se está intentando acceder
   */
  private showAccessDeniedAlert(route?: ActivatedRouteSnapshot): void {
    const currentUrl = route ? this.router.createUrlTree([route.routeConfig?.path || '']).toString() : this.router.url;
    const userRole = this.authService.getRole();
    
    // Determinar el tipo de contenido según la URL
    let alertConfig = this.getAlertConfigByUrl(currentUrl);
    
    // Solo mostrar alerta específica si es USER, para otros roles usar genérica
    if (userRole === 'USER') {
      Swal.fire({
        icon: 'warning',
        title: alertConfig.title,
        html: alertConfig.message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        footer: '<small>Si necesitas acceso urgente, contacta al administrador del sistema</small>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          popup: 'swal-custom-popup',
          title: 'swal-custom-title',
          htmlContainer: 'swal-custom-content' // Fixed: changed 'content' to 'htmlContainer'
        }
      });
    } else {
      // Alerta genérica para otros roles
      Swal.fire({
        icon: 'warning',
        title: 'Acceso Denegado',
        text: 'No tienes los privilegios necesarios para acceder a esta sección.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
    }
    
    console.warn(`🚫 Acceso denegado para usuario ${userRole} a: ${currentUrl}`);
  }

  /**
   * Obtiene la configuración de alerta según la URL a la que se intenta acceder
   */
  private getAlertConfigByUrl(url: string): { title: string; message: string } {
    // Información financiera y de costos
    if (url.includes('costo') || url.includes('ventas') || url.includes('finanzas')) {
      return {
        title: '💰 Acceso Restringido - Información Financiera',
        message: `
          <div style="text-align: left; margin: 15px 0;">
            <p><strong>No tienes acceso a esta sección.</strong></p>
            <br>
            <p><strong>👤 Para obtener acceso:</strong></p>
            <p>Contacta al administrador del sistema o solicita permisos específicos.</p>
          </div>
        `
      };
    }
    
    // Kardex e inventarios
    if (url.includes('kardex') || url.includes('inventario')) {
      return {
        title: '📊 Acceso Restringido - Control de Inventarios',
        message: `
          <div style="text-align: left; margin: 15px 0;">
            <p><strong>No tienes acceso a esta sección.</strong></p>
            <br>
            <p><strong>👤 Para obtener acceso:</strong></p>
            <p>Solicita al administrador los permisos necesarios.</p>
          </div>
        `
      };
    }
    
    // Alerta genérica para otras secciones
    return {
      title: '🔒 Acceso Restringido',
      message: `
        <div style="text-align: left; margin: 15px 0;">
          <p><strong>No tienes acceso a esta sección.</strong></p>
          <br>
          <p><strong>👤 Para obtener acceso:</strong></p>
          <p>Contacta al administrador del sistema para solicitar los permisos necesarios.</p>
        </div>
      `
    };
  }
}