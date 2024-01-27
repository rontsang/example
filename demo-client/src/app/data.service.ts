import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) { }

  sendData(formData: any) {
    return this.http.post('http://localhost:8081/submit-form', formData);
  }
}
