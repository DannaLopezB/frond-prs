import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Food, FoodRequest } from '../interfaces/food';
import { MS_FOOD_URL } from '../environments/routessecrets';

@Injectable({
    providedIn: 'root'
})
export class FoodService {
    private apiUrl = MS_FOOD_URL;

    constructor(private http: HttpClient) {}

    getActiveFoods(): Observable<Food[]> {
        return this.http.get<Food[]>(`${this.apiUrl}/actives`);
    }

    getInactiveFoods(): Observable<Food[]> {
        return this.http.get<Food[]>(`${this.apiUrl}/inactives`);
    }

    getFoodsByType(foodType: string): Observable<Food[]> {
        return this.http.get<Food[]>(`${this.apiUrl}/type/${foodType}`);
    }

    addNewFood(food: FoodRequest): Observable<FoodRequest> {
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post<FoodRequest>(this.apiUrl, food, { headers });
    }

    updateFood(idFood: number, food: FoodRequest): Observable<FoodRequest> {
        return this.http.put<FoodRequest>(`${this.apiUrl}/${idFood}`, food);
    }

    deactivateFood(idFood: number): Observable<string> {
        return this.http.put<string>(
        `${this.apiUrl}/delete/${idFood}`,
        {},
        { responseType: 'text' as 'json' }
        );
    }

    reactivateFood(idFood: number): Observable<string> {
        return this.http.put<string>(
        `${this.apiUrl}/restore/${idFood}`,
        {},
        { responseType: 'text' as 'json' }
        );
    }

    deleteFoodPhysically(idFood: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/physical/${idFood}`);
    }
}
