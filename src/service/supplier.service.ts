import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../interfaces/Supplier';
import { MS_SUPPLIER_URL } from '../environments/routessecrets'; // Ajusta la ruta si es necesario

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private baseUrl = MS_SUPPLIER_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.baseUrl);
  }

  getById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/${id}`);
  }

  create(supplier: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(this.baseUrl, supplier);
  }

  update(id: number, supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/${id}`, supplier);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<Supplier> {
    return this.http.delete<Supplier>(`${this.baseUrl}/${id}/logico`);
  }

  restore(id: number): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/${id}/restaurar`, {});
  }
}
