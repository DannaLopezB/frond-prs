import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { VaccineApplications } from '../interfaces/VaccineAplications';
import { CicloVida } from '../interfaces/Lifecycle';
import { MS_VACCINE_APPLICATIONS_URL } from '../environments/routessecrets'; // importa la constante

@Injectable({
  providedIn: 'root',
})
export class VaccineApplicationsService {
  private baseUrl = MS_VACCINE_APPLICATIONS_URL;
  private vaccineApplicationsSubject = new BehaviorSubject<VaccineApplications[]>([]);
  vaccineApplications$ = this.vaccineApplicationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.getAllVaccineApplications(); // Cargar vacunas al iniciar el servicio
  }

  createVaccineApplications(vaccineApplications: VaccineApplications): Observable<VaccineApplications> {
    return this.http.post<VaccineApplications>(`${this.baseUrl}/vaccine-applications/create`, vaccineApplications).pipe(
      tap(() => this.getAllVaccineApplications()) // Actualiza la lista después de crear
    );
  }

  updateVaccineApplications(applicationId: number, vaccineApplications: VaccineApplications): Observable<VaccineApplications> {
    return this.http.put<VaccineApplications>(`${this.baseUrl}/vaccine-applications/${applicationId}`, vaccineApplications).pipe(
      tap(() => this.getAllVaccineApplications()) // Actualiza la lista después de actualizar
    );
  }

  getVaccineApplicationsById(applicationId: number): Observable<VaccineApplications> {
    return this.http.get<VaccineApplications>(`${this.baseUrl}/vaccine-applications/${applicationId}`);
  }

  getAllVaccineApplications(): void {
    this.http.get<VaccineApplications[]>(`${this.baseUrl}/vaccine-applications`).subscribe(vaccineApplications => {
      this.vaccineApplicationsSubject.next(vaccineApplications); // Emitir nuevos valores
    });
  }

  inactivateVaccineApplications(applicationId: number): Observable<VaccineApplications> {
    return this.http.delete<VaccineApplications>(`${this.baseUrl}/vaccine-applications/${applicationId}`).pipe(
      tap(() => this.getAllVaccineApplications()) // Actualiza la lista después de actualizar
    );
  }

  activateVaccineApplications(applicationId: number): Observable<VaccineApplications> {
    return this.http.put<VaccineApplications>(`${this.baseUrl}/vaccine-applications/activate/${applicationId}`, null).pipe(
      tap(() => this.getAllVaccineApplications()) // Actualiza la lista después de actualizar
    );
  }

  getAllSheds(): void {
    this.http.get<VaccineApplications[]>(`${this.baseUrl}/sheds`).subscribe(vaccineApplications => {
      this.vaccineApplicationsSubject.next(vaccineApplications); // Emitir nuevos valores
    });
  }

  getNameIto(cycleLifeId: number): Observable<string> {
    return this.http.get<CicloVida>(`${this.baseUrl}${cycleLifeId}`).pipe(
      map(response => response.nameIto) // Asumiendo que 'nameIto' es una propiedad en tu modelo CicloVida
    );
  }
}