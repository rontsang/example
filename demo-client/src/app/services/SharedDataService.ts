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

  updateChartData(data: any[]): void {
    this.chartDataSubject.next(data);
  }
}
