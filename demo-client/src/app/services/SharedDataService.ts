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

  private chartDataSubject2 = new BehaviorSubject<any[]>([]);
  chartData2$ = this.chartDataSubject2.asObservable();

  private chartStage = new BehaviorSubject<number>(0);
  chartStage$ = this.chartStage.asObservable();

  chartUpdateNeeded2$: boolean = false;

  private inputDataSource = new BehaviorSubject<any>(null); // Use a BehaviorSubject to hold the data
  currentInputData$ = this.inputDataSource.asObservable(); // Expose the data as an observable

  private inputDataSource2 = new BehaviorSubject<any>(null); // Use a BehaviorSubject to hold the data
  currentInputData2$ = this.inputDataSource2.asObservable(); // Expose the data as an observable

  // We changed input form data
  updateInputData(data: any) {
    console.log("SharedDataService.updateInputData: ", data);
    this.inputDataSource.next(data); // Update the data
  }

  updateInputData2(data: any) {
    console.log("SharedDataService.updateInputData2: ", data);
    this.inputDataSource2.next(data); // Update the data
  }

  // Backend returned data
  updateChartData(data: any[]): void {
    this.chartDataSubject.next(data);
  }

  // Backend returned data
  updateChartData2(data: any[], stage: number): void {
    this.chartDataSubject2.next(data);
    this.chartStage.next(stage);
  }
}
