import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/Product';
import { MS_PRODUCT_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = MS_PRODUCT_URL;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/logic/${id}`, {});
  }

  restore(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/restore/${id}`, {});
  }


  updateStock(productId: number, newStock: number, newStatus: string): Observable<any> {
    const url = `${this.baseUrl}/${productId}/stock`; // Sin /products/ duplicado
    const body = { stock: newStock, status: newStatus };
    
    console.log('URL:', url, 'Body:', body);
    return this.http.patch(url, body); // PATCH en lugar de PUT para coincidir con tu backend
  }

  reduceStock(productId: number, quantity: number): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/reduce-stock/${productId}?quantity=${quantity}`,
      {}
    );
  }

  increaseStock(productId: number, quantity: number): Observable<Product> {
    return this.http.put<Product>(
      `${this.baseUrl}/increase-stock/${productId}?quantity=${quantity}`,
      {}
    );
  }

  adjustStock(productId: number, quantityChange: number): Observable<Product> {
    return this.http.put<Product>(
      `${this.baseUrl}/adjust-stock/${productId}?quantityChange=${quantityChange}`,
      {}
    );
  }
}
