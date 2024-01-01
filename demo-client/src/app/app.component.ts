import { Component, OnInit } from '@angular/core';
// import { HelloService } from './services/hello.service';
import { LineChartComponent } from './line-chart/line-chart.component';
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // providers: [HelloService]
})

export class AppComponent implements OnInit {


  content?: string;
  errorMessage?: string;
  sub?: Subscription; //the question mark is required, otherwise we need to initialize it (or explicitly keep it undefined)

  // constructor(private helloService: HelloService) { }

  ngOnInit(): void {
    console.log("got here")
    // this.sub = this.helloService.getServerMessage().subscribe({
    //   next: data => {
    //     this.content = data;
    //   },
    //   error: err => {
    //     this.errorMessage = err;
        // if (err.error) {
        //   try {
        //     const res = JSON.parse(err.error);
        //     this.content = res.message;
        //   } catch {
        //     this.content = `Error with status: ${err.status} - ${err.statusText}`;
        //   }
        // } else {
        //   this.content = `Error with status: ${err.status}`;
        // }
    //   }
    // });
  }

  // ngOnDestroy(): void {
  //   if (this.sub instanceof Subscription) {
  //     this.sub.unsubscribe();
  //   }
  // }
}
