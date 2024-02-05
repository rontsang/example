import { Component } from '@angular/core';
import {Chart} from "chart.js";
import {AccountService} from "../services/AccountService";
import {SharedDataService} from "../services/SharedDataService";
import {WithdrawalStrategy} from "../optimal-strategy-widget/optimal-strategy-widget.component";
import {CurrencyPipe, DecimalPipe, NgForOf, CommonModule} from "@angular/common";
import {SharedService} from "../services/SharedService";
import {Subscription} from "rxjs";
import {Usertestinput} from "../userTestInput/usertestinput";

@Component({
  selector: 'app-chart-self-test',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgForOf,
    CommonModule,
    Usertestinput
  ],
  templateUrl: './self-test-chart.component.html',
  styleUrl: './self-test-chart.component.css'
})
export class SelfTestChartComponent {

  data: ChartData[] = [];
  strategies: WithdrawalStrategy[] = [];
  summaries: Summary[] = [];
  tooHighIncome: boolean = false;
  warning: boolean = false; //duplicate
  totalTaxableIncome: number = 0;
  subscription?: Subscription;

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.subscription  = this.sharedDataService.currentInputData.subscribe((data) => {
      this.data = data; // Data received from sibling1
      console.log("User test data received: ", this.data);
    });
  }

  updateChart(data: any[]): void {
    if (this.chart) {
      this.data = this.transformDataForChart(data);
      console.log("updating chart with new data", this.data);
      // Assuming the new data is already in the correct format
      // as required by the Chart.js datasets
      this.chart.data.datasets = this.data.map((dataset: ChartData) => ({
        label: dataset.name,
        data: dataset.series.map((seriesItem: SeriesItem) => ({
          x: seriesItem.name, // Assuming 'name' is the x-axis value (like a date or category)
          y: seriesItem.value  // y-axis value
        })), // Or use a fixed color / existing color
        fill: false
      }));

      this.chart.update(); // Redraw the chart with the new data
    } else {
      // If the chart does not exist, create it
      // this.createChart(data);
    }
  }

  private transformDataForChart(rawData: RawDataItem[]): any[] {
    const chartData: ChartData[] = [];

    // Assuming 'data' is an array of your results
    rawData.forEach(result => {
      // console.log(result);
      result.accountState.accounts.forEach(account => {
        let accountData = chartData.find(d => d.name === account.accountName);
        if (!accountData) {
          accountData = { name: account.accountName, series: [] };
          chartData.push(accountData);
        }
        const roundedYear = Math.round(result.year * 100) / 100;
        accountData.series.push({ name: `${roundedYear}`, value: account.totalValue });
      });
    });
    return chartData;
  }

  public chart: any;


  createChart(chartData: any[]): void {
    console.log("dasdsa");
    console.log(chartData);
    console.log("dasdsa");
    this.chart = new Chart("MyChart", {
      type: 'line', //this denotes tha type of chart
      data: {
        datasets: chartData.map((dataset:ChartData) => ({
          label: dataset.name,
          data: dataset.series.map((seriesItem: SeriesItem) => ({
            x: seriesItem.name, // Use the actual value from seriesItem
            y: seriesItem.value  // Use the actual value from seriesItem
          })),
          fill: false
        }))
      },
      options: {
        responsive: true,
        animation: {
          duration: 0, // general animation time
        },
        plugins: {
          tooltip: {
            animation: false,
            mode: 'index',
            intersect: false
          },
        },
        hover: {
          mode: 'nearest',
          intersect: false
        },
        aspectRatio:2.5,
        scales: {
          x: {
            type: 'linear', // Specify the scale type as linear
            position: 'bottom', // Position can be 'left', 'right', 'top', 'bottom'
            grid: {
              display: false // Hide grid lines for x-axis
            }
          },
          y: {
            grid: {
              display: false // Hide grid lines for y-axis
            }
          }
        }
      },

    });
  }

  private greyOutChart() {
    if (this.chart) {
      this.chart.data.datasets = [];
      this.chart.update();
    }
  }

  private restoreChart() {
    if (this.chart) {
      this.chart.data.datasets = this.data.map((dataset: ChartData) => ({
        label: dataset.name,
        data: dataset.series.map((seriesItem: SeriesItem) => ({
          x: seriesItem.name, // Assuming 'name' is the x-axis value (like a date or category)
          y: seriesItem.value  // y-axis value
        })), // Or use a fixed color / existing color
        fill: false
      }));
      this.chart.update();
    }
  }
}

interface Account {
  accountName: string;
  totalValue: number;
}

interface AccountState {
  accountsList: string[];
  income: number;
  accounts: Account[];
}

interface RawDataItem {
  year: number;
  accountState: AccountState;
  taxAmounts: number[];
  preTaxAmounts: number[];
  taxableAmount: number[];
}

interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

interface SeriesItem {
  name: string; // Adjust the type if necessary (e.g., number, Date, etc.)
  value: number;
}

interface WithdrawalDetail {
  amount: number;
  accountName: string;
  taxableAmount: number;
}

interface Summary {
  startYear: number;
  endYear: number;
  income: number;
  withdrawals: WithdrawalDetail[];
  accNames: string[];
}

