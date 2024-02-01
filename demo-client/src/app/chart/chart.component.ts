import { Component } from '@angular/core';
import {Chart} from "chart.js";
import {AccountService} from "../services/AccountService";
import {SharedDataService} from "../services/SharedDataService";

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {

  data: ChartData[] = [];

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService
  ) {}

  ngOnInit(): void {
    this.accountService.getAccountData().subscribe(data => {
      this.data = this.transformDataForChart(data);
      if (this.data.length > 0) {
        const firstDataset = [this.data[0]]; // Create an array with only the first dataset
        console.log("updating chart with first dataset", firstDataset);
        // console.log("our data is now:");
        // console.log(firstDataset);
        this.createChart(firstDataset);
      } else {
        console.log("No data available to create the chart.");
      }
    });

    this.sharedDataService.chartData$.subscribe(data => {
      this.updateChart(data);
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
      this.getWithdrawalStrategy(data);
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

  getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

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


  getWithdrawalStrategy(rawData: RawDataItem[]){
    let summaries: Summary[] = [];
    let lastPreTaxAmounts: number[] | null = null;
    let startYear = 0;

    rawData.forEach((item, index) => {
      // Check if preTaxAmounts have changed
      if (!lastPreTaxAmounts || !this.arraysEqual(lastPreTaxAmounts, item.preTaxAmounts)) {
        if (lastPreTaxAmounts) {
          // Record the summary for the previous segment
          const summary = {
            startYear: startYear,
            endYear: item.year,
            withdrawals: lastPreTaxAmounts
          };
          summaries.push(summary);
        }
        // Update for the next segment
        startYear = item.year;
        lastPreTaxAmounts = item.preTaxAmounts;
      }

      // Handle the last item
      if (index === rawData.length - 1) {
        const summary = {
          startYear: startYear,
          endYear: item.year,
          withdrawals: item.preTaxAmounts
        };
        summaries.push(summary);
      }
    });
    console.log("Best strategy ")
    console.log(summaries);
  }

  arraysEqual(a: number[], b: number[]): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

interface Account {
  accountName: string;
  totalValue: number;
}

interface AccountState {
  accounts: Account[];
}

interface RawDataItem {
  year: number;
  accountState: AccountState;
  preTaxAmounts: number[];
}

interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

interface SeriesItem {
  name: string; // Adjust the type if necessary (e.g., number, Date, etc.)
  value: number;
}

interface Summary {
  startYear: number;
  endYear: number;
  withdrawals: number[];
}
