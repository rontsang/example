import {Component, Input} from '@angular/core';
import {Chart} from "chart.js";
import {AccountService} from "../services/AccountService";
import {SharedDataService} from "../services/SharedDataService";
import {WithdrawalStrategy} from "../optimal-strategy-widget/optimal-strategy-widget.component";
import {CurrencyPipe, DecimalPipe, NgForOf, CommonModule} from "@angular/common";
import {SharedService} from "../services/SharedService";
import {Subscription} from "rxjs";
import {Usertestinput} from "../userTestInput/usertestinput";
import {FormControl} from "@angular/forms";
import { getChartOptions } from '../chart/chart-options';
import { LocalOptimizerService } from '../services/local-optimizer.service';

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
  stagesData: ChartData[][] = [];
  rawStagesData: any[][] = [];

  strategies: WithdrawalStrategy[] = [];
  summaries: Summary[] = [];
  tooHighIncome: boolean = false;
  warning: boolean = false; //duplicate
  totalTaxableIncome: number = 0;
  subscription?: Subscription;

  @Input() states: State[] = [];
  stage = 1;

  initState: State = {
    income: 0,
    interestRate: 0,
    margAmountCapitalGain: 0,
    margAmountPrincipal: 0,
    province: null,
    tfsaAmount: 0,
    rrspAmount: 0,
    startingYear: 0,
    endingYear: 0
  };

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private localOptimizerService: LocalOptimizerService
  ) {}

  // handleDataFromChild(stage: number) {
  //   console.log('Received data from child:', stage);
  //   this.stage = stage;
  //   // Do something with the data
  // }

  handleDataFromChild(state: State) {
    console.log('Received data from child:', state);
    state.province = this.initState.province;
    state.interestRate = this.initState.interestRate;
    this.states.push(state);
    console.log('Parent State Array: ', this.states);
    this.stage++;
    // Do something with the data
  }

  optimizedYears: number = 0;

  get customYears(): number {
    const flat = this.getAllStagesData();
    if (!flat || flat.length === 0) return 0;
    return flat[flat.length - 1].year;
  }

  isFullyDepleted(): boolean {
    const flat = this.getAllStagesData();
    if (!flat || flat.length === 0) return false;
    const lastEvent = flat[flat.length - 1];
    return lastEvent.accountState.accounts.every((acc: any) => acc.totalValue < 100);
  }

  getAllStagesData(): any[] {
    // Flatten the array of arrays into a single array containing all stage data
    return this.stagesData.flat();
  }

  ngOnInit(): void {
    this.sharedDataService.chartData$.subscribe((data) => {
      if (data && data.length > 0) {
        this.optimizedYears = data[data.length - 1].year;
      }
    });

    this.subscription = this.sharedDataService.currentInputData$.subscribe((data) => {
      console.log("GOT HERE 3: ", this.data);
      this.initState.tfsaAmount = data.tfsaAmount;
      this.initState.rrspAmount = data.rrspAmount;
      this.initState.income = data.income;
      this.initState.margAmountPrincipal = data.margAmountPrincipal;
      this.initState.margAmountCapitalGain = data.margAmountCapitalGain;
      this.initState.interestRate = data.interestRate;
      this.initState.province = data.province;
      console.log("User test data received 3: ", this.data);
      console.log("USER TEST FORM 3: ", this.initState);

      // Reset stages when initial inputs change
      this.states = [this.initState];
      this.stage = 1;
      this.stagesData = [];
      this.rawStagesData = [];
      this.data = [];
      if (this.chart) {
        this.chart.data.datasets = [];
        this.chart.update();
      }
      this.tooHighIncome = false;
    });

    this.subscription  = this.sharedDataService.currentInputData2$.subscribe((data) => {
      this.data = data; // Data received from sibling1
      console.log("User test data received 123: ", data);
    });

    this.sharedDataService.chartStage$.subscribe(data => {
      // CONCAT THE DATA FROM OUR OBJECTS
      // REDRAW THE CHART BASED ON STAGE
    });

    this.sharedDataService.chartData2$.subscribe(data => {
      console.log("Received new data from the shared data service:", data);

      if (data == null) {
        this.sharedService.notifyUserUpdateNeeded(true);

        //redo calculations with higher income value
        if (this.chart) {
          this.chart.data.datasets = [];
          this.chart.update();
        }
        this.tooHighIncome = true;
        return;
      }

      // UPDATE THE CHART DATA ARRAY
      this.rawStagesData.push(data);
      this.stagesData.push(data);
      console.log("STAGES DATA: ", this.stagesData);
      
      const allStages = this.getAllStagesData();
      this.data = this.transformDataForChart(allStages);
      console.log("DATA: ", this.data);

      this.sharedService.notifyUserUpdateNeeded(false);
      this.tooHighIncome = false;

      if(this.chart == null){
        this.createChart(this.data);
      } else {
        this.updateChart(data);
      }
    });
  }

  updateChart(data: any[]): void {
    if (this.chart) {
      const allStages = this.getAllStagesData();
      this.data = this.transformDataForChart(allStages);
      console.log("updating chart with new data", this.data);
      
      let preciseMaxYear = 0;
      allStages.forEach(item => {
        if (item.year > preciseMaxYear) {
          preciseMaxYear = item.year;
        }
      });
      this.chart.lifespan = preciseMaxYear;
      
      let maxYear = Math.ceil(preciseMaxYear || 20);

      if (this.chart.options.plugins && this.chart.options.plugins.zoom) {
        this.chart.options.plugins.zoom.limits = {
          x: {
            min: 0,
            max: maxYear,
            minRange: 1
          }
        };
      }
      if (this.chart.options.scales && this.chart.options.scales['x']) {
        this.chart.options.scales['x'].min = 0;
        this.chart.options.scales['x'].max = maxYear;
      }

      this.chart.data.datasets = this.mapDatasets(this.data);

      this.chart.update();
      if (this.chart.resetZoom) {
        this.chart.resetZoom();
      }
    }
  }

  private transformDataForChart(rawData: any[]): any[] {
    const chartData: ChartData[] = [];
    const filteredData = rawData.filter((result, index) => {
      const isIntegerYear = Math.abs(result.year - Math.round(result.year)) < 1e-6;
      const isLastItem = index === rawData.length - 1;
      return isIntegerYear || isLastItem;
    });

    filteredData.forEach(result => {
      let totalValue = 0;
      result.accountState.accounts.forEach((account: any) => {
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
        totalValue += account.totalValue;
      });

      // Add to TOTAL
      let totalData = chartData.find(d => d.name === 'TOTAL');
      if (!totalData) {
        totalData = { name: 'TOTAL', series: [] };
        chartData.push(totalData);
      }
      const roundedYear = Math.round(result.year * 100) / 100;
      totalData.series.push({ name: `${roundedYear}`, value: totalValue });
    });
    return chartData;
  }

  public chart: any;

  createChart(chartData: any[]): void {
    console.log("dasdsa");
    console.log(chartData);
    console.log("dasdsa");

    let preciseMaxYear = 0;
    chartData.forEach(dataset => {
      dataset.series.forEach((s: any) => {
        const y = Number(s.name);
        if (y > preciseMaxYear) {
          preciseMaxYear = y;
        }
      });
    });
    let maxYear = Math.ceil(preciseMaxYear || 20);

    const options = getChartOptions((year) => {
      const flatData = this.rawStagesData.flat();
      if (!flatData || flatData.length === 0) return null;
      const item = flatData.find(d => Math.round(d.year * 100) === Math.round(year * 100))
                || flatData.find(d => Math.abs(d.year - year) < 0.05);
      if (!item) return null;

      const income = item.accountState.income || 0;
      const totalWithdrawn = item.preTaxAmounts ? item.preTaxAmounts.reduce((sum: number, val: number) => sum + val, 0) : 0;
      const taxableWithdrawals = item.taxableAmount ? item.taxableAmount.reduce((sum: number, val: number) => sum + val, 0) : 0;
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
    });
    if (options.plugins && options.plugins.zoom) {
      options.plugins.zoom.limits = {
        x: {
          min: 0,
          max: maxYear,
          minRange: 1
        }
      };
    }
    if (options.scales && options.scales['x']) {
      options.scales['x'].min = 0;
      options.scales['x'].max = maxYear;
    }

    this.chart = new Chart("SelfTestChart", {
      type: 'line',
      data: {
        datasets: this.mapDatasets(chartData)
      },
      options: options,
    });
    this.chart.lifespan = preciseMaxYear;
  }

  private greyOutChart() {
    if (this.chart) {
      this.chart.data.datasets = [];
      this.chart.update();
    }
  }

  private mapDatasets(chartData: ChartData[]) {
    const mapped = chartData.map((dataset: ChartData) => {
      const name = (dataset.name || '').trim().toUpperCase();
      let color = '#ffffff';
      let isTotal = false;

      if (name === 'TFSA') {
        color = '#ff6384';
      } else if (name === 'RRSP') {
        color = '#36a2eb';
      } else if (name === 'NON-REG' || name === 'MARG') {
        color = '#ffce56';
      } else {
        color = '#2ecc71';
        isTotal = true;
      }

      const ds = {
        label: dataset.name,
        data: dataset.series.map((seriesItem: SeriesItem) => ({
          x: Number(seriesItem.name),
          y: seriesItem.value
        })),
        fill: false,
        borderColor: color,
        backgroundColor: color,
        pointBackgroundColor: color,
        pointHoverBackgroundColor: color,
        pointBorderColor: color,
        pointHoverBorderColor: color,
        borderWidth: isTotal ? 3 : 2,
        pointRadius: 0,
        pointHoverRadius: isTotal ? 9 : 6,
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0
      };

      if (isTotal) {
        console.log('%c[CHART SELF TEST DEBUG] TOTAL Dataset Config:', 'color: #2ecc71; font-weight: bold;', {
          label: ds.label,
          borderColor: ds.borderColor,
          backgroundColor: ds.backgroundColor,
          pointBackgroundColor: ds.pointBackgroundColor,
          pointHoverBackgroundColor: ds.pointHoverBackgroundColor,
          pointBorderColor: ds.pointBorderColor,
          pointHoverBorderColor: ds.pointHoverBorderColor,
          borderWidth: ds.borderWidth,
          pointRadius: ds.pointRadius,
          pointHoverRadius: ds.pointHoverRadius,
          pointBorderWidth: ds.pointBorderWidth,
          pointHoverBorderWidth: ds.pointHoverBorderWidth
        });
      }

      return ds;
    });

    return mapped;
  }

  private restoreChart() {
    if (this.chart) {
      this.chart.data.datasets = this.mapDatasets(this.data);
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
}

interface Summary {
  startYear: number;
  endYear: number;
  income: number;
  withdrawals: WithdrawalDetail[];
  accNames: string[];
}

interface State {
  tfsaAmount?: number;
  rrspAmount?: number;
  income?: number;
  margAmountPrincipal?: number;
  margAmountCapitalGain?: number;
  interestRate?: number;
  province?: string | null;
  startingYear?: number;
  endingYear?: number;
}
