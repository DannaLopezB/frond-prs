import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sale } from '../interfaces/Sale';
import { MS_SALES_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private apiUrl = MS_SALES_URL;

  constructor(private http: HttpClient) {}

  getAllSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  createSale(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale);
  }

  updateSale(id: number, sale: Sale): Observable<Sale> {
    return this.http.put<Sale>(`${this.apiUrl}/${id}`, sale);
  }

  deleteSale(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  getSalesByRuc(ruc: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.apiUrl}/ruc/${ruc}`);
  }

    // MÉTODO PARA FILTRO POR RANGO DE FECHAS
  getSalesByRange(start: string, end: string): Observable<Sale[]> {
    const url = `${this.apiUrl}/sales/range?start=${start}&end=${end}`; 
    return this.http.get<Sale[]>(url);
  }


}
