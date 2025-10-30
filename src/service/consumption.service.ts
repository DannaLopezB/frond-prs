import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../app/auth/service/auth.services';
import { MS_CONSUMPTION_URL, MS_HOMES_URL } from '../environments/routessecrets';
import { Consumption } from '../interfaces/consumption';

@Injectable({
  providedIn: 'root',
})
export class ConsumptionService {
  private baseUrl = MS_CONSUMPTION_URL;

  constructor(private http: HttpClient, private authService: AuthService) {}

  listActiveConsumptions(): Observable<Consumption[]> {
    return this.http
      .get<Consumption[]>(`${this.baseUrl}/lista-activos`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  listInactiveConsumptions(): Observable<Consumption[]> {
    return this.http
      .get<Consumption[]>(`${this.baseUrl}/lista-inactivos`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  listConsumptionsByDateRange(startDate: string, endDate: string, activeOnly: boolean = true): Observable<Consumption[]> {
    const url = `${this.baseUrl}/by-date-range?startDate=${startDate}&endDate=${endDate}&activeOnly=${activeOnly}`;
    return this.http
      .get<Consumption[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  exportConsumptionsByDateRange(startDate: string, endDate: string, format: string): Observable<Blob> {
    const url = `${this.baseUrl}/export-by-date-range?startDate=${startDate}&endDate=${endDate}&format=${format}`;
    return this.http
      .get(url, { 
        headers: this.getAuthHeaders(),
        responseType: 'blob' 
      })
      .pipe(catchError(this.handleError));
  }

  registerConsumption(consumptionData: any): Observable<any> {
    return this.http
      .post(this.baseUrl, consumptionData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  inactivateConsumption(id: number): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/${id}/inactivar`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  restoreConsumption(id: number): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/${id}/restore`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateConsumption(id: number, consumption: any): Observable<any> {
    delete consumption.names; // Seguridad
    return this.http
      .put(`${this.baseUrl}/${id}`, consumption, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getHomes(): Observable<any[]> {
    return this.http
      .get<any[]>(MS_HOMES_URL, { headers: this.getAuthHeaders() })
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
    console.error('Error en la solicitud:', error);

    if (error.status === 0) {
      return throwError(() => new Error('No se puede conectar al servidor'));
    } else if (error.status === 401) {
      return throwError(() => new Error('Token de autenticación inválido o expirado'));
    } else if (error.status === 403) {
      return throwError(() => new Error('No tienes permisos para esta acción'));
    } else {
      return throwError(() =>
        new Error(error.error?.message || 'Error inesperado. Intenta de nuevo.')
      );
    }
  }
}
