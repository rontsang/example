import { Component } from '@angular/core';
import {NgxChartsModule} from "@swimlane/ngx-charts";

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [
    NgxChartsModule
  ],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.css'
})
export class LineChartComponent {
  view: [number, number] = [700, 300];

  // Chart data
  data = [
    {
      "name": "Germany",
      "series": [
        {
          "name": "2010",
          "value": 7300000
        },
        {
          "name": "2011",
          "value": 8940000
        }
      ]
    },
    // ... more data ...
  ];

  // Chart options
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Country';
  showYAxisLabel = true;
  yAxisLabel = 'Population';

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#7aa3e5', '#a8385d', '#aae3f5']
  };

}
