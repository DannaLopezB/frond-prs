import { environment } from './../environments/environments';
import { inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  from,
  Observable,
  switchMap,
  of,
  tap,
  throwError,
  finalize,
  BehaviorSubject,
} from 'rxjs';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  user,
  AuthErrorCodes,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { UserInterface } from '../interfaces/user.interface';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

// Interfaces para las respuestas del backend
interface AuthResponse {
  success: boolean;
  message?: string;
  expiresIn?: number;
  token?: string;
  [key: string]: any;
}

interface TokenInfo {
  token: string;
  expiresAt: number;
  refreshedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null>(null);

  // Señales para control de estado
  isLoadingAuth = signal<boolean>(true);
  isAuthInitialized = signal<boolean>(false);
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();

  // URL del API desde environment
  private apiUrl =
    environment.firebaseConfig ||
    'https://8081-vallegrande-microservic-3aq4p4nrcyl.ws-us118.gitpod.io/api';

  private authInProgress = signal<boolean>(false);
  private backendAvailable = signal<boolean>(false);

  // Nuevo: Signal para el token actual
  currentToken = signal<string | null>(null);

  constructor() {
    if (this.isBrowser) {
      this.initAuthListener();
      this.checkBackendAvailability();
      this.loadStoredToken();
    }
  }

  // Nuevo: Cargar token almacenado al inicializar
  private loadStoredToken(): void {
    const storedToken = this.getLocalStorageItem('token');
    if (storedToken && !this.isTokenExpired()) {
      this.currentToken.set(storedToken);
    } else if (storedToken) {
      // Token expirado, limpiarlo
      this.removeLocalStorageItem('token');
      this.removeLocalStorageItem('sessionExpiry');
    }
  }

  // Mejorado: Método para obtener token con mejor manejo de errores
  async getFirebaseToken(forceRefresh = false): Promise<string | null> {
    try {
      if (!this.firebaseAuth.currentUser) {
        console.warn('No hay usuario autenticado en Firebase');
        return null;
      }

      const token = await this.firebaseAuth.currentUser.getIdToken(
        forceRefresh
      );

      if (token) {
        // Actualizar el signal del token
        this.currentToken.set(token);

        // Guardar en localStorage con información adicional
        this.saveTokenInfo(token);

        console.log('Token de Firebase obtenido exitosamente');
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener token de Firebase:', error);
      return null;
    }
  }

  // Nuevo: Guardar información completa del token
  private saveTokenInfo(token: string): void {
    if (!this.isBrowser) return;

    const tokenInfo: TokenInfo = {
      token: token,
      expiresAt: new Date().getTime() + 3600 * 1000, // 1 hora por defecto
      refreshedAt: new Date().getTime(),
    };

    this.setLocalStorageItem('token', token);
    this.setLocalStorageItem('tokenInfo', JSON.stringify(tokenInfo));
    this.setLocalStorageItem('sessionExpiry', tokenInfo.expiresAt.toString());
  }

  // Mejorado: Método de login con mejor manejo de tokens
  login(email: string, password: string): Observable<any> {
    if (this.authInProgress()) {
      return throwError(
        () => new Error('Hay una operación de autenticación en progreso')
      );
    }

    this.authInProgress.set(true);

    return from(
      signInWithEmailAndPassword(this.firebaseAuth, email, password)
    ).pipe(
      // Obtener el token inmediatamente después del login
      switchMap((userCredential) => {
        console.log(
          'Usuario autenticado en Firebase:',
          userCredential.user.email
        );
        return from(this.getFirebaseToken(true)); // Forzar refresh del token
      }),
      // Verificar que el token se obtuvo correctamente
      tap((token) => {
        if (token) {
          console.log('Token guardado exitosamente');
          this.authStateSubject.next(true);
        } else {
          throw new Error('No se pudo obtener el token de Firebase');
        }
      }),
      // Comunicarse con el backend si está disponible
      switchMap((token) => {
        if (this.backendAvailable() && token) {
          return this.http
            .post<AuthResponse>(
              `${this.apiUrl}/auth/login`,
              {
                email: email,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            .pipe(
              tap((response) => {
                console.log('Respuesta del backend:', response);
                // Actualizar tiempo de expiración si el backend lo proporciona
                if (response && response.expiresIn) {
                  const expiryTime =
                    new Date().getTime() + response.expiresIn * 1000;
                  this.setLocalStorageItem(
                    'sessionExpiry',
                    expiryTime.toString()
                  );
                }
              }),
              catchError((error) => {
                console.error('Error al verificar login con backend:', error);
                return of({
                  success: true,
                  message: 'Login exitoso en Firebase, error en backend',
                });
              })
            );
        } else {
          return of({
            success: true,
            message: 'Login exitoso en Firebase',
            token: token,
          });
        }
      }),
      catchError((error: any) => {
        console.error('Error en login:', error);

        if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
          return throwError(() => ({
            code: 'auth/invalid-credential',
            message: 'Credenciales inválidas',
          }));
        }

        throw error;
      }),
      finalize(() => {
        this.authInProgress.set(false);
      })
    );
  }

  // Mejorado: Método de registro con mejor manejo de tokens
  register(email: string, username: string, password: string): Observable<any> {
    if (this.authInProgress()) {
      return throwError(
        () => new Error('Hay una operación de autenticación en progreso')
      );
    }

    this.authInProgress.set(true);

    return from(
      createUserWithEmailAndPassword(this.firebaseAuth, email, password)
    ).pipe(
      switchMap((userCredential) => {
        const user = userCredential.user;
        console.log('Usuario creado en Firebase:', user.email);
        return from(updateProfile(user, { displayName: username }));
      }),
      // Obtener token después de actualizar el perfil
      switchMap(() => from(this.getFirebaseToken(true))),
      tap((token) => {
        if (token) {
          console.log('Token obtenido después del registro');
        } else {
          throw new Error('No se pudo obtener el token después del registro');
        }
      }),
      switchMap((token) => {
        if (token && this.backendAvailable()) {
          return this.http
            .post<AuthResponse>(
              `${this.apiUrl}/auth/register`,
              {
                email: email,
                username: username,
                displayName: username,
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            )
            .pipe(
              catchError((error) => {
                console.error('Error al registrar en el backend:', error);
                return of({
                  success: true,
                  message: 'Usuario registrado en Firebase, error en backend',
                  token: token,
                });
              })
            );
        } else {
          return of({
            success: true,
            message: 'Usuario registrado en Firebase',
            token: token,
          });
        }
      }),
      catchError((error: any) => {
        console.error('Error en el registro:', error);
        throw error;
      }),
      finalize(() => {
        this.authInProgress.set(false);
      })
    );
  }

  // Nuevo: Método para obtener el token actual
  getCurrentToken(): string | null {
    return this.currentToken();
  }

  // Nuevo: Método para verificar si tenemos un token válido
  hasValidToken(): boolean {
    const token = this.getCurrentToken();
    return token !== null && !this.isTokenExpired();
  }

  // Mejorado: Método para refrescar token
  refreshTokenIfNeeded(): Observable<string | null> {
    if (!this.firebaseAuth.currentUser) {
      return of(null);
    }

    // Si el token no está próximo a expirar, devolver el actual
    if (!this.isTokenAboutToExpire()) {
      return of(this.getCurrentToken());
    }

    console.log('Refrescando token de Firebase...');
    return from(this.getFirebaseToken(true)).pipe(
      tap((token) => {
        if (token) {
          console.log('Token refrescado exitosamente');
        }
      }),
      catchError((error) => {
        console.error('Error al refrescar token:', error);
        return of(null);
      })
    );
  }

  // Resto de métodos existentes...
  private initAuthListener(): void {
    this.isLoadingAuth.set(true);

    onAuthStateChanged(
      this.firebaseAuth,
      async (firebaseUser) => {
        if (firebaseUser) {
          this.currentUserSig.set({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: firebaseUser.displayName || '',
            displayName: firebaseUser.displayName || '',
          });

          // Obtener token al detectar usuario autenticado
          const token = await this.getFirebaseToken();
          if (token) {
            this.authStateSubject.next(true);
          }
        } else {
          this.currentUserSig.set(null);
          this.currentToken.set(null);
          this.authStateSubject.next(false);
          this.clearStoredTokens();
        }

        this.isLoadingAuth.set(false);
        this.isAuthInitialized.set(true);
      },
      (error) => {
        console.error('Error en el listener de autenticación:', error);
        this.isLoadingAuth.set(false);
        this.isAuthInitialized.set(true);
      }
    );
  }

  private clearStoredTokens(): void {
    this.removeLocalStorageItem('token');
    this.removeLocalStorageItem('tokenInfo');
    this.removeLocalStorageItem('sessionExpiry');
  }

  logout(): Observable<void> {
    this.clearStoredTokens();
    this.currentToken.set(null);
    this.authStateSubject.next(false);

    return from(signOut(this.firebaseAuth)).pipe(
      tap(() => {
        console.log('Sesión cerrada exitosamente');
        this.router.navigateByUrl('/Login');
      }),
      catchError((error) => {
        console.error('Error al cerrar sesión:', error);
        this.router.navigateByUrl('/Login');
        return throwError(() => error);
      })
    );
  }

  // Métodos de localStorage existentes...
  private getLocalStorageItem(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error al acceder a localStorage:', e);
      return null;
    }
  }

  private setLocalStorageItem(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error al escribir en localStorage:', e);
    }
  }

  private removeLocalStorageItem(key: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error al eliminar de localStorage:', e);
    }
  }

  isTokenExpired(): boolean {
    if (!this.isBrowser) return true;

    const expiryTimeStr = this.getLocalStorageItem('sessionExpiry');
    if (!expiryTimeStr) return true;

    const expiryTime = Number.parseInt(expiryTimeStr, 10);
    return new Date().getTime() > expiryTime;
  }

  isTokenAboutToExpire(): boolean {
    if (!this.isBrowser) return true;

    const expiryTimeStr = this.getLocalStorageItem('sessionExpiry');
    if (!expiryTimeStr) return true;

    const expiryTime = Number.parseInt(expiryTimeStr, 10);
    const tenMinutesInMs = 10 * 60 * 1000;

    return expiryTime - new Date().getTime() < tenMinutesInMs;
  }

  getCurrentUser(): UserInterface | null {
    return this.currentUserSig();
  }

  isAuthenticated(): boolean {
    if (!this.isAuthInitialized()) {
      return this.hasValidToken();
    }

    const user = this.currentUserSig();
    return user !== null && this.hasValidToken();
  }

  private checkBackendAvailability(): void {
    if (this.isBrowser) {
      this.http
        .get<any>(`${this.apiUrl}/health-check`, { observe: 'response' })
        .pipe(
          catchError((error) => {
            console.log('Backend no disponible:', error);
            this.backendAvailable.set(false);
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response && response.status === 200) {
            this.backendAvailable.set(true);
          } else {
            this.backendAvailable.set(false);
          }
        });
    }
  }

  verifyTokenWithBackend(): Observable<AuthResponse> {
    if (!this.backendAvailable()) {
      return of({
        success: true,
        message: 'Backend no disponible, usando autenticación local',
      });
    }

    const token = this.getCurrentToken();
    if (!token) {
      return from(this.getFirebaseToken(true)).pipe(
        switchMap((newToken) => {
          if (newToken) {
            return this.http.get<AuthResponse>(
              `${this.apiUrl}/auth/verifyToken`,
              {
                headers: { Authorization: `Bearer ${newToken}` },
              }
            );
          }
          return throwError(() => new Error('No se pudo obtener token'));
        })
      );
    }

    return this.http
      .get<AuthResponse>(`${this.apiUrl}/auth/verifyToken`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401) {
            return this.refreshTokenIfNeeded().pipe(
              switchMap((newToken) => {
                if (newToken) {
                  return of({
                    success: true,
                    message: 'Token renovado exitosamente',
                  });
                }
                this.clearStoredTokens();
                this.router.navigateByUrl('/Login');
                return throwError(
                  () => new Error('No se pudo renovar el token')
                );
              })
            );
          }
          return of({
            success: true,
            message:
              'Error al verificar con backend, usando autenticación local',
          });
        })
      );
  }
}
