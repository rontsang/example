import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private chartUpdateNeededSource = new BehaviorSubject<boolean>(false);
  chartUpdateNeeded$ = this.chartUpdateNeededSource.asObservable();

  notifyChartUpdateNeeded(isNeeded: boolean) {
    this.chartUpdateNeededSource.next(isNeeded);
  }
}
