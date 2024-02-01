import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ChartComponent} from "../chart/chart.component";
import {LineChartComponent} from "../line-chart/line-chart.component";
import {BarChartComponent} from "../bar-chart/bar-chart.component";

@Component({
  selector: 'app-displaywindow',
  standalone: true,
  imports: [
    ChartComponent,
    LineChartComponent,
    CommonModule,
    BarChartComponent
  ],
  templateUrl: './displaywindow.component.html',
  styleUrl: './displaywindow.component.css'
})
export class DisplaywindowComponent {
  showComponent: string = 'A'; // Default to showing Component A
}
