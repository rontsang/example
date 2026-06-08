import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private chartUpdateNeededSource = new BehaviorSubject<boolean>(false);
  chartUpdateNeeded$ = this.chartUpdateNeededSource.asObservable();

  private currentViewSource = new BehaviorSubject<string>(this.getInitialView());
  currentView$ = this.currentViewSource.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        const view = this.getInitialView();
        if (this.currentViewSource.value !== view) {
          this.currentViewSource.next(view);
        }
      });
    }
  }

  private getInitialView(): string {
    if (typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname;
      if (path === '/monte-carlo') return 'monte-carlo';
      if (path === '/table') return 'table';
      if (path === '/test') return 'test';
      if (path === '/graph') return 'graph';
    }
    return 'graph';
  }

  setCurrentView(view: string) {
    this.currentViewSource.next(view);
    if (typeof window !== 'undefined' && window.location && window.history) {
      const path = '/' + view;
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    }
  }

  private chartUsedNewData = new BehaviorSubject<boolean>(false);
  userInputChanged$ = this.chartUsedNewData.asObservable();

  private userUpdateNeededSource = new BehaviorSubject<boolean>(false);
  inputUpdateNeeded$ = this.userUpdateNeededSource.asObservable();

  private calculateTriggeredSource = new BehaviorSubject<boolean>(false);
  calculateTriggered$ = this.calculateTriggeredSource.asObservable();

  private inputsCollapsedSource = new BehaviorSubject<boolean>(false);
  inputsCollapsed$ = this.inputsCollapsedSource.asObservable();

  notifyChartIsObsolete(isNeeded: boolean) {
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

  notifyCalculateTriggered() {
    this.calculateTriggeredSource.next(true);
  }

  setInputsCollapsed(collapsed: boolean) {
    this.inputsCollapsedSource.next(collapsed);
  }
}
