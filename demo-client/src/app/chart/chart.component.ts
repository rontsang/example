import { Component } from '@angular/core';
import {Chart} from "chart.js";
import {AccountService} from "../services/AccountService";
import {SharedDataService} from "../services/SharedDataService";
import {WithdrawalStrategy} from "../optimal-strategy-widget/optimal-strategy-widget.component";
import {CurrencyPipe, DecimalPipe, NgForOf, CommonModule} from "@angular/common";
import {SharedService} from "../services/SharedService";
import { getChartOptions } from '../chart/chart-options';
import { RoundToTenPipe} from "../round-to-ten.pipe";
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    NgForOf,
    CommonModule,
    RoundToTenPipe,
    MatTooltipModule,
    MatIcon
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
  totalWithdrawal: number = 0;
  postTaxTotal: number = 0;

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService
  ) {}

  calculateDifference(): number {
    return this.totalWithdrawal - this.postTaxTotal;
  }

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
          this.postTaxTotal = data[0].accountState.postTaxAmountNeededPerYear;
          console.log("Post Tax Total: ", this.postTaxTotal);
          this.data = this.transformDataForChart(data);
          this.sharedService.notifyUserUpdateNeeded(false);
          this.tooHighIncome = false;
          this.updateChart(data);
        }
      }
    });

    // this.strategies = [
    //   {
    //     "startYear": 0,
    //     "endYear": 38.28350747910805,
    //     "withdrawals": [
    //       8500,
    //       18899.371268656716,
    //       43630.578136105185
    //     ]
    //   }
    // ];
  }

  getTooltipContent(strategy: Summary): string {
    // Total tax is: income + tfsa + rrsp + nonReg
    return strategy.withdrawals
      .map(detail => `${(detail?.taxableAmount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} is taxable`)
      .join('\n'); // Assuming line breaks work for your tooltip; otherwise, adjust as needed
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

  createChart(chartData: any[]): void {
    console.log(chartData);
    this.chart = new Chart("MyChart", {
      type: 'line',
      data: {
        datasets: chartData.map((dataset:ChartData) => ({
          label: dataset.name,
          data: dataset.series.map((seriesItem: SeriesItem) => ({
            x: seriesItem.name,
            y: seriesItem.value
          }))
        }))
      },
      options: getChartOptions(),
    });
  }

  getWithdrawalStrategy(rawData: RawDataItem[]){
    let summaries: Summary[] = [];
    let lastPreTaxAmounts: number[] | null = null;
    let lastAccounts: string[] = [];
    let lastTaxableAmount: number[] = [];
    let lastPreTaxAmount: number[] = [];
    let startYear = 0;
    console.log("Best strategy 1")
    console.log(rawData);
    console.log(this.summaries);
    let stage = 1;
    rawData.forEach((item, index) => {
      // Check if preTaxAmounts have changed
      if (!lastPreTaxAmounts || !this.arraysEqual(lastPreTaxAmounts, item.preTaxAmounts)) {
        console.log("lastPreTaxAmounts", lastPreTaxAmounts);
        if (lastPreTaxAmounts) {
          console.log("STAGE", stage);
          stage++;
          // Record the summary for the previous segment
          console.log("item", item);
          console.log("item", item.accountState);
          console.log("item", item.accountState.accountsList);
          let taxableAmount2 = lastTaxableAmount.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
          taxableAmount2 += item.accountState.income
          console.log("taxable amount sum", taxableAmount2);
          const summary = {
            startYear: startYear,
            endYear: item.year,
            income: item.accountState.income,
            withdrawals: lastPreTaxAmounts.map((amount, index) => ({
              amount: amount,
              accountName: lastAccounts ? lastAccounts[index] : 'Unknown',
              taxableAmount: lastTaxableAmount ? lastTaxableAmount[index] : 0,
              preTaxAmounts: 0
            })),
            accNames: item.accountState.accounts.map(acc => acc.accountName),
            taxableAmount: taxableAmount2,
            totalWithdrawal: lastPreTaxAmounts.reduce((acc, withdrawal) => acc + withdrawal, 0),
            taxesOwed: 0
          };
          summary.taxesOwed = summary.income + summary.totalWithdrawal - this.postTaxTotal;
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
            taxableAmount: item.taxableAmount[index],
            preTaxAmounts: item.preTaxAmounts[index]
          })),
          accNames: item.accountState.accounts.map(acc => acc.accountName),
          taxableAmount: 0,
          totalWithdrawal: item.preTaxAmounts.reduce((acc, withdrawal) => acc + withdrawal, 0),
          taxesOwed: 0
        };
        summary.taxesOwed = summary.totalWithdrawal - this.postTaxTotal + item.accountState.income;
        const calculatedTaxableAmount = lastTaxableAmount.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        console.log(typeof calculatedTaxableAmount); // Should log 'number'
        summary.taxableAmount = summary.income + calculatedTaxableAmount;
        console.log("Taxable amount: ", summary.taxableAmount);
        summaries.push(summary);
      }
    });
    console.log("Best strategy ")
    console.log(summaries);
    this.summaries = summaries;
    this.totalWithdrawal = summaries.reduce((total, summary) => total + summary.withdrawals.reduce((acc, withdrawal) => acc + withdrawal.preTaxAmounts, 0), 0);
    console.log(this.totalWithdrawal);
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
  preTaxAmounts: number;
}

interface Summary {
  startYear: number;
  endYear: number;
  income: number;
  withdrawals: WithdrawalDetail[];
  accNames: string[];
  taxableAmount: number;
  totalWithdrawal: number;
  taxesOwed: number;
}

