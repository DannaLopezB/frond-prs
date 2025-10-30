import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovementKardex } from '../interfaces/MovementKardex';
import { MS_MOVEMENT_KARDEX_URL } from '../environments/routessecrets';
@Injectable({
  providedIn: 'root',
})
export class MovementKardexService {
  private apiUrl = MS_MOVEMENT_KARDEX_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MovementKardex[]> {
    return this.http.get<MovementKardex[]>(this.apiUrl);
  }

  getById(kardexId: number): Observable<MovementKardex> {
    return this.http.get<MovementKardex>(`${this.apiUrl}/${kardexId}`);
  }

  create(movementKardex: MovementKardex): Observable<MovementKardex> {
    return this.http.post<MovementKardex>(this.apiUrl, movementKardex);
  }

  update(kardexId: number, movementKardex: MovementKardex): Observable<MovementKardex> {
    return this.http.put<MovementKardex>(`${this.apiUrl}/${kardexId}`, movementKardex);
  }

  delete(kardexId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${kardexId}`);
  }
}
