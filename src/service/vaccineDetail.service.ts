import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Details } from '../interfaces/VaccineDetail';
import { MS_VACCINE_DETAIL_URL } from '../environments/routessecrets'; 

@Injectable({
  providedIn: 'root',
})
export class VaccineDetailService {
  private baseUrl = MS_VACCINE_DETAIL_URL;
  private detailsSubject = new BehaviorSubject<Details[]>([]);
  details$ = this.detailsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.getDetails(); // Cargar detalles al iniciar el servicio
  }

  createDetail(detail: Details): Observable<Details> {
    return this.http.post<Details>(`${this.baseUrl}/vaccines/details/create`, detail).pipe(
      tap(() => this.getDetails()) // Actualiza la lista después de crear
    );
  }

  updateDetail(vaccine_id: number, detail: Details): Observable<Details> {
    return this.http.put<Details>(`${this.baseUrl}/vaccines/details/${vaccine_id}`, detail).pipe(
      tap(() => this.getDetails()) // Actualiza la lista después de actualizar
    );
  }

  deleteDetail(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/details/${id}`).pipe(
      tap(() => this.getDetails()) // Actualiza la lista después de eliminar
    );
  }

  getDetailById(id: number): Observable<Details> {
    return this.http.get<Details>(`${this.baseUrl}/details/${id}`);
  }

  getDetails(): void {
    this.http.get<Details[]>(`${this.baseUrl}/vaccines/details`).subscribe(details => {
      this.detailsSubject.next(details); // Emitir nuevos valores
    });
  }
}
