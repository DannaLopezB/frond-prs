import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, throwError, tap } from 'rxjs';
import { Vaccine } from '../interfaces/Vaccine';
import { MS_VACCINE_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root',
})
export class VaccineService {
  private baseUrl = MS_VACCINE_URL;
  private vaccinesSubject = new BehaviorSubject<Vaccine[]>([]);
  vaccines$ = this.vaccinesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.getAllVaccines(); // Cargar vacunas al iniciar el servicio
  }

  createVaccine(vaccine: Vaccine): Observable<Vaccine> {
    return this.http.post<Vaccine>(`${this.baseUrl}/vaccines/create`, vaccine).pipe(
      tap(() => this.getAllVaccines()) // Actualiza la lista después de crear
    );
  }

  updateVaccine(vaccine_id: number, vaccine: Vaccine): Observable<Vaccine> {
    return this.http.put<Vaccine>(`${this.baseUrl}/vaccines/${vaccine_id}`, vaccine).pipe(
      tap(() => this.getAllVaccines()) // Actualiza la lista después de actualizar
    );
  }

  getVaccineById(vaccine_id: number): Observable<Vaccine> {
    return this.http.get<Vaccine>(`${this.baseUrl}/vaccines/${vaccine_id}`);
  }

  getAllVaccines(): void {
    this.http.get<Vaccine[]>(`${this.baseUrl}/vaccines`).subscribe(vaccines => {
      this.vaccinesSubject.next(vaccines); // Emitir nuevos valores
    });
  }

  getSuppliersByActive(active: string): Observable<Vaccine[]> {
    return this.http.get<Vaccine[]>(`${this.baseUrl}/vaccines/active/${active}`);
  }

  inactivateVaccine(vaccineId: number): Observable<Vaccine> {
    return this.http.delete<Vaccine>(`${this.baseUrl}/vaccines/${vaccineId}`).pipe(
      tap(() => this.getAllVaccines()) // Actualiza la lista después de eliminar
    );
  }

  activateVaccine(vaccine_id: number): Observable<Vaccine> {
    return this.http.put<Vaccine>(`${this.baseUrl}/vaccines/activate/${vaccine_id}`, null).pipe(
      tap(() => this.getAllVaccines()) // Actualiza la lista después de activar
    );
  }

  updateVaccineActive(vaccineId: number): Observable<Vaccine> {
    return this.http.put<Vaccine>(`${this.baseUrl}/vaccines/activate/${vaccineId}`, {}).pipe(
      tap(() => this.getAllVaccines()),
      catchError((error) => {
        console.error('Error activating vaccine status:', error);
        return throwError(() => new Error('Error activating vaccine status'));
      })
    );
  }

  getVaccineName(vaccineId: number): Observable<string> {
    return this.http.get<Vaccine>(`${this.baseUrl}/vaccines/${vaccineId}`).pipe(
      map(response => response.nameVaccine) // Asumiendo que 'nameVaccine' es la propiedad correcta
    );
  }
}
