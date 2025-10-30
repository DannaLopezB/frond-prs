import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilityDiary } from '../interfaces/UtilityDiary';
import { MS_UTILITY_DIARY_URL } from '../environments/routessecrets';

@Injectable({
  providedIn: 'root'
})
export class UtilityDiaryService {

  private baseUrl = MS_UTILITY_DIARY_URL;

  constructor(private http: HttpClient) { }

  getAll(): Observable<UtilityDiary[]> {
    return this.http.get<UtilityDiary[]>(this.baseUrl);
  }

  getById(id: number): Observable<UtilityDiary> {
    return this.http.get<UtilityDiary>(`${this.baseUrl}/${id}`);
  }

  create(diary: UtilityDiary): Observable<UtilityDiary> {
    return this.http.post<UtilityDiary>(this.baseUrl, diary);
  }

  update(id: number, diary: UtilityDiary): Observable<UtilityDiary> {
    return this.http.put<UtilityDiary>(`${this.baseUrl}/${id}`, diary);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
    inactivate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/inactivate/${id}`, {});
  }

  activate(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/activate/${id}`, {});
  }
}
