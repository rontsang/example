import { Component } from '@angular/core';
import {Chart} from "chart.js";
import {AccountService} from "../services/AccountService";

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {
  // private data: any;

  data: ChartData[] = []; // Chart data

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.accountService.getAccountData().subscribe(data => {
      this.data = this.transformDataForChart(data);
      console.log("our data is:");
      console.log(this.data);
      console.log("our data is not:");
      this.createChart(this.data);
    });
  }

  private transformDataForChart(rawData: RawDataItem[]): any[] {
    const chartData: ChartData[] = [];

    // Assuming 'data' is an array of your results
    rawData.forEach(result => {
      console.log(result);
      result.accountState.accounts.forEach(account => {
        let accountData = chartData.find(d => d.name === account.accountName);
        if (!accountData) {
          accountData = { name: account.accountName, series: [] };
          chartData.push(accountData);
        }
        const roundedYear = Math.round(result.year * 10) / 10;
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
      // data: {
      //   datasets: [{
      //     label: 'Test Data',
      //     data: [{ x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 30 }],
      //     backgroundColor: 'red',
      //     borderColor: 'red',
      //     fill: false
      //   }]
      // },
      //

      // data: {// values on X-Axis
      //   // labels: ['2022-05-10', '2022-05-11', '2022-05-12','2022-05-13',
      //   //   '2022-05-14', '2022-05-15', '2022-05-16','2022-05-17', ],
      //   datasets: [
      //     {
      //       label: "Sales",
      //       data: [
      //         { x: 10, y: 20 },
      //         { x: 15, y: 25 },
      //         { x: 20, y: 30 },
      //         // more data points...
      //       ],
      //       backgroundColor: 'blue'
      //     },
      //     {
      //       label: "Profit",
      //       data: [
      //         { x: 10, y: 15 },
      //         { x: 15, y: 10 },
      //         { x: 20, y: 5 },
      //         // more data points...
      //       ],
      //       backgroundColor: 'limegreen'
      //     }
      //   ]
      // },
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
}

interface ChartData {
  name: string;
  series: { name: string; value: number }[];
}

interface SeriesItem {
  name: string; // Adjust the type if necessary (e.g., number, Date, etc.)
  value: number;
}
