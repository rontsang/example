import { Component, OnInit } from '@angular/core';
import { HelloService } from './services/HelloService';
import { DataService } from './data.service';
import { LineChartComponent } from './line-chart/line-chart.component';
import { ChartComponent} from "./chart/chart.component";
import {Subscription} from "rxjs";
import { SharedService } from './services/SharedService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class AppComponent implements OnInit {

  content?: string;
  errorMessage?: string;
  sub?: Subscription;
  currentValue = 50;


  activeMobileView: 'input' | 'output' = 'input';

  constructor(
    private helloService: HelloService,
    private sharedService: SharedService
  ) { }

  switchToInputView() {
    this.activeMobileView = 'input';
  }

  ngOnInit(): void {
    console.log("got here")
    this.sub = this.helloService.getServerMessage().subscribe({
      next: data => {
        this.content = data;
        console.log(data);
      },
      error: err => {
        this.errorMessage = err;
        if (err.error) {
          try {
            const res = JSON.parse(err.error);
            this.content = res.message;
          } catch {
            this.content = `Error with status: ${err.status} - ${err.statusText}`;
          }
        } else {
          this.content = `Error with status: ${err.status}`;
        }
      }
    });

    this.sharedService.calculateTriggered$.subscribe(triggered => {
      if (triggered) {
        this.activeMobileView = 'output';
      }
    });
  }



  ngOnDestroy(): void {
    if (this.sub instanceof Subscription) {
      this.sub.unsubscribe();
    }
  }
}
