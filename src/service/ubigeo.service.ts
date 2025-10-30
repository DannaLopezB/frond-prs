import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ubigeo } from '../interfaces/Ubigeo';
import { MS_UBIGEO_URL } from '../environments/routessecrets'; // ajusta la ruta según tu estructura

@Injectable({
  providedIn: 'root',
})
export class UbigeoService {
  private baseUrl = MS_UBIGEO_URL;

  constructor(private http: HttpClient) {}

  crear(ubigeo: Ubigeo): Observable<Ubigeo> {
    return this.http.post<Ubigeo>(this.baseUrl, ubigeo);
  }

  listarTodos(): Observable<Ubigeo[]> {
    return this.http.get<Ubigeo[]>(this.baseUrl);
  }

  editar(id: number, ubigeo: Ubigeo): Observable<Ubigeo> {
    return this.http.put<Ubigeo>(`${this.baseUrl}/${id}`, ubigeo);
  }

  eliminarFisicamente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fisico/${id}`);
  }

  eliminarLogico(id: number): Observable<Ubigeo> {
    return this.http.put<Ubigeo>(`${this.baseUrl}/logico/${id}`, {});
  }

  restaurar(id: number): Observable<Ubigeo> {
    return this.http.put<Ubigeo>(`${this.baseUrl}/restaurar/${id}`, {});
  }
}
