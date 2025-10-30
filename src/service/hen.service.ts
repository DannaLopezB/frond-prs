import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Hen } from '../interfaces/Hen';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { MS_HEN_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root',
})
export class HenService {
  // URL base del servicio de gallinas
  private urlEndPoint = MS_HEN_URL;

  constructor(private http: HttpClient) {}

  // Actualizar datos de una gallina
  update(hen: Hen): Observable<Hen> {
    const url = `${this.urlEndPoint}/update/${hen.id}`;
    return this.http.put<Hen>(url, hen).pipe(catchError(this.handleError));
  }

  // Obtener una gallina por su ID (sin manejo de error)
  getHenById(id: number): Observable<any> {
    return this.http.get<any>(`${this.urlEndPoint}/${id}`);
  }

  // Obtener todas las gallinas activas
  getHens(): Observable<Hen[]> {
    return this.http.get<Hen[]>(this.urlEndPoint).pipe(catchError(this.handleError));
  }

  // Obtener gallinas inactivas
  getInactiveHens(): Observable<Hen[]> {
    const url = `${this.urlEndPoint}/inactivos`;
    return this.http.get<Hen[]>(url).pipe(catchError(this.handleError));
  }

  // Crear una nueva gallina
  create(hen: Hen): Observable<Hen> {
    return this.http.post<Hen>(`${this.urlEndPoint}`, hen).pipe(catchError(this.handleError));
  }

  // Buscar gallinas por fecha de llegada
  getHensByDate(arrivalDate: string): Observable<Hen[]> {
    return this.http.get<Hen[]>(`${this.urlEndPoint}/buscar/${arrivalDate}`);
  }

  // Obtener una gallina por ID
  getHen(id: number): Observable<Hen> {
    return this.http.get<Hen>(`${this.urlEndPoint}/${id}`).pipe(catchError(this.handleError));
  }

  // Activar una gallina inactiva
  activate(id: number): Observable<Hen> {
    const url = `${this.urlEndPoint}/activar/${id}`;
    return this.http.put<Hen>(url, {}).pipe(catchError(this.handleError));
  }

  // Inactivar lógicamente una gallina (estado = 'I')
  delete(id: number | null): Observable<void> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    const data = { status: 'I' };
    return this.http.put<void>(`${this.urlEndPoint}/inactivar/${id}`, data).pipe(catchError(this.handleError));
  }

  // Eliminar físicamente una gallina
  deletePhysically(id: number | null): Observable<Hen> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    return this.http.delete<Hen>(`${this.urlEndPoint}/${id}`).pipe(catchError(this.handleError));
  }

  // Manejo de errores de las peticiones HTTP
  private handleError(error: any) {
    console.error('Error al hacer la solicitud', error);
    if (error.status === 0) {
      return throwError('No se puede conectar al servidor');
    } else {
      return throwError(
        error.error?.message || 'Ocurrió un error, por favor intente de nuevo'
      );
    }
  }
}
