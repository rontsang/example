import { Component } from '@angular/core';
import { NgxChartsModule }from '@swimlane/ngx-charts';
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [
    NgxChartsModule
  ],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css'
})
export class BarChartComponent {
  title = 'barchartApp';
  dataset = [
    { name: "X", value: 1 },
    { name: "Y", value: 2 }
  ];
}
