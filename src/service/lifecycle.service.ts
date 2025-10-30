import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CicloVida } from '../interfaces/Lifecycle';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { MS_CICLOVIDA_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root',
})
export class CicloVidaService {
  // URL base del servicio Ciclo de Vida
  private urlEndPoint = MS_CICLOVIDA_URL;

  constructor(private http: HttpClient) {}

  // Obtener ciclos por tipo (Vacunas, Alimentos, etc.)
  getCiclosByTypeIto(typeIto: string): Observable<CicloVida[]> {
    const url = `${this.urlEndPoint}/type/${typeIto}`;
    return this.http.get<CicloVida[]>(url).pipe(catchError(this.handleError));
  }

  // Actualizar un ciclo de vida
  update(cicloVida: CicloVida): Observable<CicloVida> {
    const url = `${this.urlEndPoint}/update/${cicloVida.id}`;
    return this.http.put<CicloVida>(url, cicloVida).pipe(catchError(this.handleError));
  }

  // Obtener todos los ciclos activos
  getCycles(): Observable<CicloVida[]> {
    return this.http.get<CicloVida[]>(this.urlEndPoint).pipe(catchError(this.handleError));
  }

  // Obtener ciclos inactivos
  getInactiveCycles(): Observable<CicloVida[]> {
    const url = `${this.urlEndPoint}/inactivos`;
    return this.http.get<CicloVida[]>(url).pipe(catchError(this.handleError));
  }

  // Crear un nuevo ciclo
  create(cicloVida: CicloVida): Observable<CicloVida> {
    return this.http.post<CicloVida>(`${this.urlEndPoint}`, cicloVida).pipe(catchError(this.handleError));
  }

  // Obtener un ciclo por ID
  getCycle(id: number): Observable<CicloVida> {
    return this.http.get<CicloVida>(`${this.urlEndPoint}/${id}`).pipe(catchError(this.handleError));
  }

  // Activar un ciclo inactivo
  activate(id: number): Observable<CicloVida> {
    const url = `${this.urlEndPoint}/activar/${id}`;
    return this.http.put<CicloVida>(url, {}).pipe(catchError(this.handleError));
  }

  // Inactivar un ciclo (estado lógico)
  delete(id: number | null): Observable<void> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    const data = { status: 'I' };
    return this.http.put<void>(`${this.urlEndPoint}/inactivar/${id}`, data).pipe(catchError(this.handleError));
  }

  // Eliminar físicamente un ciclo
  deletePhysically(id: number | null): Observable<CicloVida> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    return this.http.delete<CicloVida>(`${this.urlEndPoint}/${id}`).pipe(catchError(this.handleError));
  }

  // Manejo de errores
  private handleError(error: any) {
    console.error('Error al hacer la solicitud', error);
    if (error.status === 0) {
      return throwError('No se puede conectar al servidor');
    } else {
      return throwError(error.error?.message || 'Ocurrió un error, por favor intente de nuevo');
    }
  }
}