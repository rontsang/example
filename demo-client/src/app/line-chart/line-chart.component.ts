import { Component } from '@angular/core';
import {NgxChartsModule} from "@swimlane/ngx-charts";
import {AccountService} from "../services/AccountService";

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

  data: ChartData[] = []; // Chart data

  constructor(private accountService: AccountService) {}


  ngOnInit() {
    this.accountService.getAccountData().subscribe(data => {
      this.data = this.transformDataForChart(data);
      console.log(data);
      console.log("withdraw strategy: ");
    });
  };

  private transformDataForChart(rawData: RawDataItem[]): any[] {
    const chartData: ChartData[] = [];

    // Assuming 'data' is an array of your results
    rawData.forEach(result => {
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


  data2 = [
    {
      "name": "Germany",
      "series": [
        {
          "name": 2010,
          "value": 7300000
        },
        {
          "name": 2011,
          "value": 8940000
        },
        {
          "name": 2020,
          "value": 1894000
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
  yAxisLabel = 'Populatiosn';
  animations = false;

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#7aa3e5', '#a8385d', '#aae3f5']
  };

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

interface Summary {
  startYear: number;
  endYear: number;
  withdrawals: number[];
}
