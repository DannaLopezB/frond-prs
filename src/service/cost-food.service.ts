import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodCost, RequestCost } from '../interfaces/cost';
import { MS_COST_FOOD_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root'
})
export class CostFoodService {
  private apiUrl = MS_COST_FOOD_URL;

  constructor(private http: HttpClient) {}

  getACost(): Observable<FoodCost[]> {
    return this.http.get<FoodCost[]>(`${this.apiUrl}/actives`);
  }

  getICost(): Observable<FoodCost[]> {
    return this.http.get<FoodCost[]>(`${this.apiUrl}/inactives`);
  }

  getFoodCostByWeekNumber(weekNumber: string): Observable<FoodCost[]> {
    return this.http.get<FoodCost[]>(`${this.apiUrl}/search/${weekNumber}`);
  }

  addNewCost(cost: RequestCost): Observable<RequestCost> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<RequestCost>(this.apiUrl, cost, { headers });
  }

  updateCost(idFoodCosts: number, cost: RequestCost): Observable<RequestCost> {
    return this.http.put<RequestCost>(`${this.apiUrl}/${idFoodCosts}`, cost);
  }

  deactivateCost(idFoodCosts: number): Observable<string> {
    return this.http.put<string>(
      `${this.apiUrl}/delete/${idFoodCosts}`,
      {},
      { responseType: 'text' as 'json' }
    );
  }

  reactivateCost(idFoodCosts: number): Observable<string> {
    return this.http.put<string>(
      `${this.apiUrl}/restore/${idFoodCosts}`,
      {},
      { responseType: 'text' as 'json' }
    );
  }

  deleteCostPhysically(idFoodCosts: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/physical/${idFoodCosts}`);
  }
}
