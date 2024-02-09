import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private chartUpdateNeededSource = new BehaviorSubject<boolean>(false);
  chartUpdateNeeded$ = this.chartUpdateNeededSource.asObservable();

  private chartUsedNewData = new BehaviorSubject<boolean>(false);
  userInputChanged$ = this.chartUsedNewData.asObservable();

  private userUpdateNeededSource = new BehaviorSubject<boolean>(false);
  inputUpdateNeeded$ = this.userUpdateNeededSource.asObservable();

  notifyChartUpdateNeeded(isNeeded: boolean) {
    this.chartUpdateNeededSource.next(isNeeded);
  }

  notifyUserUpdateNeeded(isNeeded: boolean) {
    this.userUpdateNeededSource.next(isNeeded);
  }

  notifyUserUpdateNeeded2(isNeeded: boolean) {
    this.userUpdateNeededSource.next(isNeeded);
  }

  notifyChartUsedNewData(isNeeded: boolean) {
    this.chartUsedNewData.next(isNeeded);
  }
}
