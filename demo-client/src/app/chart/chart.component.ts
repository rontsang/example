import { Component } from '@angular/core';
import {Chart} from "chart.js";
import {AccountService} from "../services/AccountService";
import {SharedDataService} from "../services/SharedDataService";
import {WithdrawalStrategy} from "../optimal-strategy-widget/optimal-strategy-widget.component";
import {CurrencyPipe, DecimalPipe, NgForOf, CommonModule} from "@angular/common";
import {SharedService} from "../services/SharedService";

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgForOf,
    CommonModule
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {

  data: ChartData[] = [];
  strategies: WithdrawalStrategy[] = [];
  summaries: Summary[] = [];
  tooHighIncome: boolean = false;
  warning: boolean = false; //duplicate
  totalTaxableIncome: number = 0;

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService
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

    this.sharedService.userInputChanged$.subscribe(warning => {
      this.warning = warning;
      console.log("warning changed to ", this.warning);
    });

    this.sharedService.chartUpdateNeeded$.subscribe(updateNeeded => {
      if (updateNeeded) {
        this.greyOutChart();
      } else {
        this.restoreChart();
      }
    });

    this.sharedDataService.chartData$.subscribe(data => {
      console.log("Received new data from the shared data service:", data);
      if(this.chart == null) {
        this.data = this.transformDataForChart(data);
        this.createChart(this.data);
      } else {
        if (data == null) {
          this.sharedService.notifyUserUpdateNeeded(true);

          //redo calculations with higher income value
          if (this.chart) {
            this.chart.data.datasets = [];
            this.chart.update();
          }
          this.tooHighIncome = true;
        } else {
          this.sharedService.notifyUserUpdateNeeded(false);
          this.tooHighIncome = false;
          this.updateChart(data);
        }
      }
    });

    this.strategies = [
      {
        "startYear": 0,
        "endYear": 38.28350747910805,
        "withdrawals": [
          8500,
          18899.371268656716,
          43630.578136105185
        ]
      }
    ];
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
    let lastAccounts: string[] = [];
    let lastTaxableAmount: number[] = [];
    let startYear = 0;
    console.log("Best strategy 1")
    console.log(rawData);
    console.log(this.summaries);
    rawData.forEach((item, index) => {
      // Check if preTaxAmounts have changed
      if (!lastPreTaxAmounts || !this.arraysEqual(lastPreTaxAmounts, item.preTaxAmounts)) {
        console.log("lastPreTaxAmounts", lastPreTaxAmounts);
        if (lastPreTaxAmounts) {
          // Record the summary for the previous segment
          console.log("item", item);
          console.log("item", item.accountState);
          console.log("item", item.accountState.accountsList);
          const summary = {
            startYear: startYear,
            endYear: item.year,
            income: item.accountState.income,
            withdrawals: lastPreTaxAmounts.map((amount, index) => ({
              amount: amount,
              accountName: lastAccounts ? lastAccounts[index] : 'Unknown',
              taxableAmount: lastTaxableAmount ? lastTaxableAmount[index] : 0
            })),
            accNames: item.accountState.accounts.map(acc => acc.accountName)
          };
          summaries.push(summary);
        }
        // Update for the next segment
        startYear = item.year;
        lastAccounts = item.accountState.accountsList;
        lastTaxableAmount = item.taxableAmount;
        lastPreTaxAmounts = item.preTaxAmounts;
      }

      // Handle the last item
      if (index === rawData.length - 1) {
        const summary = {
          startYear: startYear,
          endYear: item.year,
          income: item.accountState.income,
          withdrawals: lastPreTaxAmounts.map((amount, index) => ({
            amount: amount,
            accountName: item.accountState.accountsList[index],
            taxableAmount: item.taxableAmount[index]
          })),
          accNames: item.accountState.accounts.map(acc => acc.accountName)
        };
        summaries.push(summary);
      }
    });
    console.log("Best strategy ")
    console.log(summaries);
    this.summaries = summaries;
    this.totalTaxableIncome = summaries.reduce((total, summary) => total + summary.withdrawals.reduce((acc, withdrawal) => acc + withdrawal.taxableAmount, 0), 0);
    console.log(this.totalTaxableIncome);
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

