import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EggProduction } from '../interfaces/EggProduction';
import { MS_EGG_PRODUCTION_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root'
})
export class EggProductionService {
  private readonly apiUrl = MS_EGG_PRODUCTION_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<EggProduction[]> {
    return this.http.get<EggProduction[]>(this.apiUrl);
  }

  getById(id: number): Observable<EggProduction> {
    return this.http.get<EggProduction>(`${this.apiUrl}/${id}`);
  }

  create(data: EggProduction): Observable<EggProduction> {
    return this.http.post<EggProduction>(this.apiUrl, data);
  }

  update(id: number, data: EggProduction): Observable<EggProduction> {
    return this.http.put<EggProduction>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  inactivate(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/inactivate/${id}`, {});
  }

  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/activate/${id}`, {});
  }
}
