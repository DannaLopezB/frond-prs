import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Home } from '../interfaces/home';
import { AuthService } from '../app/auth/service/auth.services';
import { MS_HOME_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private baseUrl = MS_HOME_URL;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getActiveHomes(): Observable<Home[]> {
    return this.http
      .get<Home[]>(`${this.baseUrl}/active`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getInactiveHomes(): Observable<Home[]> {
    return this.http
      .get<Home[]>(`${this.baseUrl}/inactive`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createHome(homeData: Home): Observable<Home> {
    return this.http
      .post<Home>(this.baseUrl, homeData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deactivateHome(id: number): Observable<void> {
    return this.http
      .put<void>(`${this.baseUrl}/${id}/deactivate`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  reactivateHome(id: number): Observable<void> {
    return this.http
      .put<void>(`${this.baseUrl}/${id}/restore`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateHome(id: number, homeData: Home): Observable<Home> {
    return this.http
      .put<Home>(`${this.baseUrl}/${id}`, homeData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  private getAuthHeaders(): { [header: string]: string } {
    const token = this.authService.getCurrentToken();
    const headers: { [header: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handleError(error: any) {
    console.error('Error al hacer la solicitud', error);

    if (error.status === 0) {
      return throwError(() => new Error('No se puede conectar al servidor'));
    } else if (error.status === 401) {
      return throwError(() => new Error('Token de autenticación inválido o expirado'));
    } else if (error.status === 403) {
      return throwError(() => new Error('No tienes permisos para realizar esta acción'));
    } else {
      return throwError(() => new Error(
        error.error?.message || 'Ocurrió un error, por favor intente de nuevo'
      ));
    }
  }
}
