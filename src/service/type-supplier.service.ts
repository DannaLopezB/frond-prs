import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TypeSupplier } from '../interfaces/TypeSupplier';
import { MS_TYPE_SUPPLIER_URL } from '../environments/routessecrets'; // Ajusta la ruta según tu estructura

@Injectable({
  providedIn: 'root',
})
export class TypeSupplierService {
  private baseUrl = MS_TYPE_SUPPLIER_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TypeSupplier[]> {
    return this.http.get<TypeSupplier[]>(this.baseUrl);
  }

  getById(id: number): Observable<TypeSupplier> {
    return this.http.get<TypeSupplier>(`${this.baseUrl}/${id}`);
  }

  create(typeSupplier: TypeSupplier): Observable<TypeSupplier> {
    return this.http.post<TypeSupplier>(this.baseUrl, typeSupplier);
  }

  update(id: number, typeSupplier: TypeSupplier): Observable<TypeSupplier> {
    return this.http.put<TypeSupplier>(`${this.baseUrl}/${id}`, typeSupplier);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<TypeSupplier> {
    return this.http.put<TypeSupplier>(`${this.baseUrl}/logico/${id}`, {});
  }

  restore(id: number): Observable<TypeSupplier> {
    return this.http.put<TypeSupplier>(`${this.baseUrl}/restaurar/${id}`, {});
  }
}
