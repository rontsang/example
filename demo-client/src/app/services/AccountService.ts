import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'http://localhost:8081/results'; // Adjust URL as needed

  constructor(private http: HttpClient) { }

  getAccountData(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
