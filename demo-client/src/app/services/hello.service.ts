import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';

const API_URL = 'http://localhost:8081/';

@Injectable({
  providedIn: 'root',
})
export class HelloService {
  constructor(private http: HttpClient) {} //we need angular's http client, so we inject it here via constructor
  getServerMessage(): Observable<string> { //return type is Observable
    return this.http.get(API_URL + 'hello', { responseType: 'text' }).pipe(
      tap(data => console.log(data)),
      catchError(this.handleError)
    );
  }

  private handleError (err: HttpErrorResponse){
    console.error("Error Caught")
    let errorMessage = ''
    return throwError(() => errorMessage);
    // return new Error(err.message);
    // return of(BigInt(0));
    // return throwError(() => 'An error occurred: ' + err.message);
  }

}
