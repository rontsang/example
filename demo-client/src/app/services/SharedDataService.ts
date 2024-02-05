import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private chartDataSubject = new BehaviorSubject<any[]>([]);
  chartData$ = this.chartDataSubject.asObservable();
  chartUpdateNeeded$: boolean = false;

  private inputDataSource = new BehaviorSubject<any>(null); // Use a BehaviorSubject to hold the data
  currentInputData = this.inputDataSource.asObservable(); // Expose the data as an observable

  updateInputData(data: any) {
    console.log("SharedDataService.updateInputData: ", data);
    this.inputDataSource.next(data); // Update the data
  }

  updateChartData(data: any[]): void {
    this.chartDataSubject.next(data);
  }
}
