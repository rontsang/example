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
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { LocalOptimizerService } from '../services/local-optimizer.service';

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
    MatIcon,
    BarChartComponent
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {

  currentView: string = 'graph';
  data: ChartData[] = [];
  strategies: WithdrawalStrategy[] = [];
  summaries: Summary[] = [];
  tooHighIncome: boolean = false;
  warning: boolean = false; //duplicate
  totalWithdrawal: number = 0;
  postTaxTotal: number = 0;
  isObsolete: boolean = true;
  rawData: RawDataItem[] = [];
  inputData: any = null;
  hoveredYearData: any = null;

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private localOptimizerService: LocalOptimizerService
  ) {}

  calculateDifference(): number {
    return this.totalWithdrawal - this.postTaxTotal;
  }

  ngOnInit(): void {
    this.sharedDataService.currentInputData$.subscribe(input => {
      this.inputData = input;
    });

    this.sharedService.userInputChanged$.subscribe(warning => {
      this.warning = warning;
      console.log("warning changed to ", this.warning);
    });

    this.sharedService.chartUpdateNeeded$.subscribe(updateNeeded => {
      this.isObsolete = updateNeeded;
      if (updateNeeded) {
        this.greyOutChart();
      } else {
        this.restoreChart();
      }
    });

    this.sharedDataService.chartData$.subscribe(data => {
      console.log("Received new data from the shared data service:", data);
      if (data == null) {
        this.sharedService.notifyUserUpdateNeeded(true);

        //redo calculations with higher income value
        if (this.chart) {
          this.chart.data.datasets = [];
          this.chart.update();
        }
        this.tooHighIncome = true;
      } else {
        this.rawData = data;
        this.isObsolete = false;
        this.postTaxTotal = data[0].accountState.postTaxAmountNeededPerYear;
        console.log("Post Tax Total: ", this.postTaxTotal);
        this.data = this.transformDataForChart(data);
        this.sharedService.notifyUserUpdateNeeded(false);
        this.tooHighIncome = false;
        this.hoveredYearData = this.getYearData(0);
        if (this.chart == null) {
          this.createChart(this.data);
        } else {
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

  getSuggestedSpend(): number {
    if (!this.inputData) return 75000;
    const tfsa = Number(this.inputData.tfsaAmount || 0);
    const rrsp = Number(this.inputData.rrspAmount || 0);
    const margPrincipal = Number(this.inputData.margAmountPrincipal || 0);
    const margCapitalGain = Number(this.inputData.margAmountCapitalGain || 0);
    const margTotal = Math.max(0, margPrincipal - margCapitalGain) + margCapitalGain;
    const total = tfsa + rrsp + margTotal;
    const rate = Number(this.inputData.interestRate || 4.0) / 100;
    const income = Number(this.inputData.income || 0);
    const currentSpend = Number(this.inputData.amountPerYear || 0);

    const growth = total * rate;
    const formulaSuggest = Math.round(growth * 1.35 + income);
    const minSuggest = Math.max(75000, Math.round(currentSpend * 1.15));
    return Math.max(minSuggest, formulaSuggest);
  }

  updateHoveredYear(year: number) {
    const data = this.getYearData(year);
    if (data) {
      this.hoveredYearData = data;
    }
  }

  getYearData(year: number): any {
    if (!this.rawData || this.rawData.length === 0) return null;
    let closestItem = this.rawData[0];
    let minDiff = Math.abs(this.rawData[0].year - year);
    for (const item of this.rawData) {
      const diff = Math.abs(item.year - year);
      if (diff < minDiff) {
        minDiff = diff;
        closestItem = item;
      }
    }
    return closestItem;
  }

  getHoveredDetails() {
    if (!this.hoveredYearData) return null;

    const data = this.hoveredYearData;
    const accounts = data.accountState.accounts;
    const accountsList = data.accountState.accountsList;

    const tfsaIdx = accountsList.indexOf('TFSA');
    const rrspIdx = accountsList.indexOf('RRSP');
    const margIdx = accountsList.indexOf('MARG') !== -1 ? accountsList.indexOf('MARG') : accountsList.indexOf('NON-REG');

    const tfsaAcc = accounts.find((a: any) => a.accountName === 'TFSA');
    const rrspAcc = accounts.find((a: any) => a.accountName === 'RRSP');
    const margAcc = accounts.find((a: any) => a.accountName === 'MARG' || a.accountName === 'NON-REG');

    const tfsaBalance = tfsaAcc ? tfsaAcc.totalValue : 0;
    const rrspBalance = rrspAcc ? rrspAcc.totalValue : 0;
    const margBalance = margAcc ? margAcc.totalValue : 0;

    const tfsaWithdrawn = tfsaIdx !== -1 ? data.preTaxAmounts[tfsaIdx] : 0;
    const rrspWithdrawn = rrspIdx !== -1 ? data.preTaxAmounts[rrspIdx] : 0;
    const margWithdrawn = margIdx !== -1 ? data.preTaxAmounts[margIdx] : 0;

    const tfsaTaxable = tfsaIdx !== -1 ? data.taxableAmount[tfsaIdx] : 0;
    const rrspTaxable = rrspIdx !== -1 ? data.taxableAmount[rrspIdx] : 0;
    const margTaxable = margIdx !== -1 ? data.taxableAmount[margIdx] : 0;

    const income = data.accountState.income || 0;
    const dividends = data.dividends || 0;
    const dividendTaxable = data.dividendTaxable || 0;
    const totalWithdrawn = tfsaWithdrawn + rrspWithdrawn + margWithdrawn;
    const effectiveIncome = totalWithdrawn + income + dividends;

    const totalTaxable = income + rrspTaxable + margTaxable + dividendTaxable;
    const provinceName = data.accountState.province || "Ontario";
    const taxesOwed = this.localOptimizerService.calculateTaxesOwed(totalTaxable, provinceName, dividendTaxable);
    const totalAfterTax = effectiveIncome - taxesOwed;

    // Calculation details for margin (Non-Reg)
    const margTotalValue = margAcc ? (margAcc.principalAmount + margAcc.capitalGainsAmount) : 0;
    const margCapitalGains = margAcc ? margAcc.capitalGainsAmount : 0;
    const capGainsPct = margTotalValue > 0 ? (margCapitalGains / margTotalValue) * 100 : 0;

    const provincialDividendCreditPct = this.localOptimizerService.getProvincialDividendCreditRate(provinceName) * 100;

    return {
      year: data.year,
      provinceName,
      provincialDividendCreditPct,
      balances: {
        tfsa: tfsaBalance,
        rrsp: rrspBalance,
        nonReg: margBalance
      },
      withdrawals: {
        tfsa: tfsaWithdrawn,
        rrsp: rrspWithdrawn,
        nonReg: margWithdrawn
      },
      effectiveIncome,
      taxesOwed,
      totalAfterTax,
      calculation: {
        income,
        rrspTaxable,
        margWithdrawn,
        capGainsPct,
        margTaxable,
        dividendActual: dividends,
        dividendTaxable,
        totalTaxable
      }
    };
  }

  getTooltipContent(strategy: Summary): string {
    // Total tax is: income + tfsa + rrsp + nonReg
    return strategy.withdrawals
      .map(detail => `${(detail?.taxableAmount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} is taxable`)
      .join('\n'); // Assuming line breaks work for your tooltip; otherwise, adjust as needed
  }

  updateChart(data: any[]): void {
    if (this.chart) {
      this.rawData = data;
      this.data = this.transformDataForChart(data);
      console.log("updating chart with new data", this.data);
      
      let maxYear = 0;
      data.forEach(item => {
        if (item.year > maxYear) {
          maxYear = item.year;
        }
      });
      maxYear = Math.ceil(maxYear || 20);

      if (this.chart.options.plugins && this.chart.options.plugins.zoom) {
        this.chart.options.plugins.zoom.limits = {
          x: {
            min: 0,
            max: maxYear,
            minRange: 1
          }
        };
      }

      this.chart.data.datasets = this.data.map((dataset: ChartData) => ({
        label: dataset.name,
        data: dataset.series.map((seriesItem: SeriesItem) => ({
          x: Number(seriesItem.name),
          y: seriesItem.value
        })),
        fill: false
      }));

      if (this.chart.resetZoom) {
        this.chart.resetZoom();
      }
      this.chart.update();
      this.getWithdrawalStrategy(data);
    }
  }

  private transformDataForChart(rawData: RawDataItem[]): any[] {
    const chartData: ChartData[] = [];
    rawData.forEach(result => {
      result.accountState.accounts.forEach(account => {
        let accountName = account.accountName;
        if (accountName === 'MARG') {
          accountName = 'NON-REG';
        }
        let accountData = chartData.find(d => d.name === accountName);
        if (!accountData) {
          accountData = { name: accountName, series: [] };
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
    let maxYear = 0;
    chartData.forEach(dataset => {
      dataset.series.forEach((s: any) => {
        const y = Number(s.name);
        if (y > maxYear) {
          maxYear = y;
        }
      });
    });
    maxYear = Math.ceil(maxYear || 20);

    const options = getChartOptions(
      (year) => {
        if (!this.rawData || this.rawData.length === 0) return null;
        const item = this.rawData.find(d => Math.round(d.year * 100) === Math.round(year * 100)) 
                  || this.rawData.find(d => Math.abs(d.year - year) < 0.05);
        if (!item) return null;

        const income = item.accountState.income || 0;
        const totalWithdrawn = item.preTaxAmounts ? item.preTaxAmounts.reduce((sum, val) => sum + val, 0) : 0;
        const taxableWithdrawals = item.taxableAmount ? item.taxableAmount.reduce((sum, val) => sum + val, 0) : 0;
        const totalTaxable = income + taxableWithdrawals;
        const provinceName = item.accountState.province || "Ontario";
        const taxesOwed = this.localOptimizerService.calculateTaxesOwed(totalTaxable, provinceName);
        const totalAfterTax = totalWithdrawn + income - taxesOwed;

        return {
          effectiveIncome: totalWithdrawn + income,
          taxesOwed: taxesOwed,
          totalWithdrawn: totalWithdrawn,
          totalAfterTax: totalAfterTax
        };
      },
      (year) => {
        this.updateHoveredYear(year);
      }
    );
    if (options.plugins && options.plugins.zoom) {
      options.plugins.zoom.limits = {
        x: {
          min: 0,
          max: maxYear,
          minRange: 1
        }
      };
    }

    this.chart = new Chart("MyChart", {
      type: 'line',
      data: {
        datasets: chartData.map((dataset:ChartData) => ({
          label: dataset.name,
          data: dataset.series.map((seriesItem: SeriesItem) => ({
            x: Number(seriesItem.name),
            y: seriesItem.value
          }))
        }))
      },
      options: options,
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
            withdrawals: lastPreTaxAmounts.map((amount, index) => {
              let accountName = lastAccounts ? lastAccounts[index] : 'Unknown';
              if (accountName === 'MARG') {
                accountName = 'NON-REG';
              }
              return {
                amount: amount,
                accountName: accountName,
                taxableAmount: lastTaxableAmount ? lastTaxableAmount[index] : 0,
                preTaxAmounts: 0
              };
            }),
            accNames: item.accountState.accounts.map(acc => {
              let name = acc.accountName;
              if (name === 'MARG') name = 'NON-REG';
              return name;
            }),
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
          withdrawals: lastPreTaxAmounts.map((amount, index) => {
            let accountName = item.accountState.accountsList[index];
            if (accountName === 'MARG') {
              accountName = 'NON-REG';
            }
            return {
              amount: amount,
              accountName: accountName,
              taxableAmount: item.taxableAmount[index],
              preTaxAmounts: item.preTaxAmounts[index]
            };
          }),
          accNames: item.accountState.accounts.map(acc => {
            let name = acc.accountName;
            if (name === 'MARG') name = 'NON-REG';
            return name;
          }),
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
  province?: string;
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

