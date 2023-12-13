import { Component } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'app-money-time-chart',
  templateUrl: './money-time-chart.component.html',
  styleUrls: ['./money-time-chart.component.css']
})
export class MoneyTimeChartComponent {
  public lineChartData: ChartDataSets[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Money over Time' }
  ];
  public lineChartLabels: Label[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

  public lineChartOptions: (ChartOptions & { annotation: any }) = {
    responsive: true,
    // Additional options can be set here
  };

  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  // Add any additional functions or lifecycle hooks if needed
}
