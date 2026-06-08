import { Component, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
import { SelfTestChartComponent } from '../self-test-chart/self-test-chart.component';

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
    BarChartComponent,
    SelfTestChartComponent
  ],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent {

  currentView: 'graph' | 'table' | 'monte-carlo' | 'test' = 'graph';
  docsHtml: SafeHtml = '';
  data: ChartData[] = [];
  strategies: WithdrawalStrategy[] = [];
  summaries: Summary[] = [];
  tooHighIncome: boolean = false;
  hasShownTooRichWarning: boolean = false;
  warning: boolean = false; //duplicate
  totalWithdrawal: number = 0;
  postTaxTotal: number = 0;
  isObsolete: boolean = true;
  rawData: RawDataItem[] = [];
  unfilteredRawData: RawDataItem[] = [];
  inputData: any = null;
  hoveredYearData: any = null;

  setView(view: string) {
    this.sharedService.setCurrentView(view);
  }

  isMinYear(): boolean {
    if (!this.rawData || !this.hoveredYearData) return true;
    const idx = this.rawData.findIndex(item => item.year === this.hoveredYearData.year);
    return idx <= 0;
  }

  isMaxYear(): boolean {
    if (!this.rawData || !this.hoveredYearData) return true;
    let preciseMaxYear = 0;
    this.rawData.forEach(item => {
      if (item.year > preciseMaxYear) {
        preciseMaxYear = item.year;
      }
    });
    const maxIntYear = Math.floor(preciseMaxYear);
    return this.hoveredYearData.year >= maxIntYear;
  }

  panYear(direction: number) {
    if (!this.rawData || this.rawData.length === 0 || !this.hoveredYearData) return;

    const currentIndex = this.rawData.findIndex(item => item.year === this.hoveredYearData.year);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < this.rawData.length) {
      const nextItem = this.rawData[nextIndex];
      let preciseMaxYear = 0;
      this.rawData.forEach(item => {
        if (item.year > preciseMaxYear) {
          preciseMaxYear = item.year;
        }
      });
      const maxIntYear = Math.floor(preciseMaxYear);
      if (nextItem.year <= maxIntYear) {
        this.hoveredYearData = nextItem;
        this.updateActiveChartElements();
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.currentView !== 'graph') return;

    if (event.key === 'ArrowLeft' || event.key === '<' || event.key === ',') {
      this.panYear(-1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' || event.key === '>' || event.key === '.') {
      this.panYear(1);
      event.preventDefault();
    }
  }

  constructor(
    private accountService: AccountService,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private localOptimizerService: LocalOptimizerService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  calculateDifference(): number {
    return this.totalWithdrawal - this.postTaxTotal;
  }

  ngOnInit(): void {
    this.sharedService.currentView$.subscribe(view => {
      this.currentView = view as 'graph' | 'table' | 'monte-carlo' | 'test';
      if (view === 'docs' && !this.docsHtml) {
        this.loadDocs();
      }
    });

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
        this.unfilteredRawData = data;
        const filtered = this.filterRawData(data);
        this.rawData = filtered;
        this.isObsolete = false;
        this.postTaxTotal = data[0].accountState.postTaxAmountNeededPerYear;
        console.log("Post Tax Total: ", this.postTaxTotal);
        this.data = this.transformDataForChart(filtered);
        this.sharedService.notifyUserUpdateNeeded(false);

        // CHECK IF PORTFOLIO LASTS >= 100 YEARS (TOO RICH)
        let preciseMaxYear = 0;
        filtered.forEach(item => {
          if (item.year > preciseMaxYear) {
            preciseMaxYear = item.year;
          }
        });

        if (preciseMaxYear >= 100.0) {
          if (!this.hasShownTooRichWarning) {
            this.tooHighIncome = true;
            this.hasShownTooRichWarning = true;
          } else {
            this.tooHighIncome = false;
          }
        } else {
          this.tooHighIncome = false;
        }

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

  updateActiveChartElements() {
    if (!this.chart || !this.hoveredYearData || !this.rawData) return;
    const index = this.rawData.findIndex(item => item.year === this.hoveredYearData.year);
    if (index === -1) return;

    const datasetsCount = this.chart.data.datasets.length;
    const activeElements = [];
    for (let i = 0; i < datasetsCount; i++) {
      activeElements.push({
        datasetIndex: i,
        index: index
      });
    }
    this.chart.setActiveElements(activeElements);
    this.chart.update();
  }

  updateHoveredYear(year: number) {
    const data = this.getYearData(year);
    if (data && (!this.hoveredYearData || this.hoveredYearData.year !== data.year)) {
      this.hoveredYearData = data;
      this.updateActiveChartElements();
    }
  }

  filterRawData(data: any[]): any[] {
    if (!data) return [];
    return data.filter((item, index) => {
      const isIntegerYear = Math.abs(item.year - Math.round(item.year)) < 1e-6;
      const isLastItem = index === data.length - 1;
      return isIntegerYear || isLastItem;
    });
  }

  loadDocs() {
    this.http.get('assets/documentation.md', { responseType: 'text' }).subscribe({
      next: (data) => {
        const rawHtml = this.parseMarkdown(data);
        this.docsHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
      },
      error: (err) => {
        console.error('Failed to load documentation', err);
        this.docsHtml = this.sanitizer.bypassSecurityTrustHtml('<p class="error-msg">Failed to load documentation.</p>');
      }
    });
  }

  parseMarkdown(md: string): string {
    if (!md) return '';
    let html = '';
    const lines = md.split('\n');
    let inList = false;
    let inCode = false;
    let inTable = false;

    lines.forEach(line => {
      let trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith('```')) {
        if (inCode) {
          html += '</pre></div>';
          inCode = false;
        } else {
          const lang = trimmed.substring(3).trim();
          html += `<div class="code-block-container"><pre class="code-block ${lang}">`;
          inCode = true;
        }
        return;
      }
      if (inCode) {
        const escaped = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        html += escaped + '\n';
        return;
      }

      // Horizontal rules
      if (trimmed === '---') {
        html += '<hr class="docs-hr">';
        return;
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        html += `<h1 class="docs-h1">${trimmed.substring(2)}</h1>`;
        return;
      }
      if (trimmed.startsWith('## ')) {
        html += `<h2 class="docs-h2">${trimmed.substring(3)}</h2>`;
        return;
      }
      if (trimmed.startsWith('### ')) {
        html += `<h3 class="docs-h3">${trimmed.substring(4)}</h3>`;
        return;
      }

      // Lists
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="docs-ul">';
          inList = true;
        }
        let content = trimmed.substring(2);
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `<li class="docs-li">${content}</li>`;
        return;
      } else if (inList && !trimmed.startsWith('* ') && !trimmed.startsWith('- ')) {
        html += '</ul>';
        inList = false;
      }

      // Tables
      if (trimmed.startsWith('|')) {
        if (!inTable) {
          html += '<table class="docs-table">';
          inTable = true;
          const cols = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
          html += '<thead><tr>';
          cols.forEach(col => {
            html += `<th>${col}</th>`;
          });
          html += '</tr></thead><tbody>';
          return;
        } else {
          if (trimmed.includes('---')) {
            return;
          }
          const cols = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
          if (cols.length > 0) {
            html += '<tr>';
            cols.forEach(col => {
              let content = col.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              html += `<td>${content}</td>`;
            });
            html += '</tr>';
          }
          return;
        }
      } else if (inTable && !trimmed.startsWith('|')) {
        html += '</tbody></table>';
        inTable = false;
      }

      // Paragraphs
      if (trimmed === '') {
        return;
      }

      let parsedLine = trimmed;
      parsedLine = parsedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      parsedLine = parsedLine.replace(/`([^`]+)`/g, '<code class="docs-code">$1</code>');
      parsedLine = parsedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="docs-link">$1</a>');

      html += `<p class="docs-p">${parsedLine}</p>`;
    });

    if (inList) html += '</ul>';
    if (inCode) html += '</pre></div>';
    if (inTable) html += '</tbody></table>';

    return html;
  }

  getYearData(year: number): any {
    if (!this.rawData || this.rawData.length === 0) return null;
    let preciseMaxYear = 0;
    this.rawData.forEach(item => {
      if (item.year > preciseMaxYear) {
        preciseMaxYear = item.year;
      }
    });
    const maxIntYear = Math.floor(preciseMaxYear);
    const clampedYear = Math.min(year, maxIntYear);

    let closestItem = null;
    let minDiff = Infinity;
    for (let i = 0; i < this.rawData.length; i++) {
      const item = this.rawData[i];
      const isIntegerYear = Math.abs(item.year - Math.round(item.year)) < 1e-6;
      const isLastItem = i === this.rawData.length - 1;
      if (!isIntegerYear && !isLastItem) {
        continue;
      }
      const diff = Math.abs(item.year - clampedYear);
      if (diff < minDiff) {
        minDiff = diff;
        closestItem = item;
      }
    }
    return closestItem || this.rawData[0];
  }

  getHoveredDetails() {
    if (!this.hoveredYearData) return null;

    const data = this.hoveredYearData;
    const accounts = data.accountState.accounts;

    const tfsaAcc = accounts.find((a: any) => a.accountName === 'TFSA');
    const rrspAcc = accounts.find((a: any) => a.accountName === 'RRSP');
    const margAcc = accounts.find((a: any) => a.accountName === 'MARG' || a.accountName === 'NON-REG');

    const tfsaBalance = tfsaAcc ? tfsaAcc.totalValue : 0;
    const rrspBalance = rrspAcc ? rrspAcc.totalValue : 0;
    const margBalance = margAcc ? margAcc.totalValue : 0;

    const actualW = this.calculateYearlyActuals(Math.floor(data.year), data);
    const phaseTransitionNote = this.getPhaseTransitionNote(Math.floor(data.year));

    // Calculation details for margin (Non-Reg)
    const margTotalValue = margAcc ? (margAcc.principalAmount + margAcc.capitalGainsAmount) : 0;
    const margCapitalGains = margAcc ? margAcc.capitalGainsAmount : 0;
    const capGainsPct = margTotalValue > 0 ? (margCapitalGains / margTotalValue) * 100 : 0;

    const provincialDividendCreditPct = this.localOptimizerService.getProvincialDividendCreditRate(actualW.provinceName) * 100;

    // Find ending balances for this year (start of next integer year, or 0 if depleted/last year)
    let tfsaEnd = 0;
    let rrspEnd = 0;
    let nonRegEnd = 0;
    if (this.rawData) {
      const nextEvent = this.rawData.find((item: any) => item.year >= data.year + 1 - 1e-6);
      if (nextEvent) {
        const nextTfsaAcc = nextEvent.accountState.accounts.find((a: any) => a.accountName === 'TFSA');
        const nextRrspAcc = nextEvent.accountState.accounts.find((a: any) => a.accountName === 'RRSP');
        const nextMargAcc = nextEvent.accountState.accounts.find((a: any) => a.accountName === 'MARG' || a.accountName === 'NON-REG');
        
        tfsaEnd = nextTfsaAcc ? nextTfsaAcc.totalValue : 0;
        rrspEnd = nextRrspAcc ? nextRrspAcc.totalValue : 0;
        nonRegEnd = nextMargAcc ? nextMargAcc.totalValue : 0;
      }
    }

    return {
      year: data.year,
      provinceName: actualW.provinceName,
      provincialDividendCreditPct,
      phaseTransitionNote,
      balances: {
        tfsa: tfsaBalance,
        rrsp: rrspBalance,
        nonReg: margBalance
      },
      balancesEnd: {
        tfsa: tfsaEnd,
        rrsp: rrspEnd,
        nonReg: nonRegEnd
      },
      withdrawals: {
        tfsa: actualW.tfsaWithdrawal,
        rrsp: actualW.rrspWithdrawal,
        nonReg: actualW.nonRegWithdrawal
      },
      effectiveIncome: actualW.effectiveIncome,
      taxesOwed: actualW.taxesOwed,
      totalAfterTax: actualW.totalAfterTax,
      calculation: {
        income: actualW.income,
        rrspTaxable: actualW.rrspTaxable,
        margWithdrawn: actualW.nonRegWithdrawal,
        capGainsPct,
        margTaxable: actualW.nonRegTaxable,
        dividendActual: actualW.dividends,
        dividendTaxable: actualW.dividendTaxable,
        totalTaxable: actualW.totalTaxable
      }
    };
  }

  getTooltipContent(strategy: Summary): string {
    // Total tax is: income + tfsa + rrsp + nonReg
    return strategy.withdrawals
      .map(detail => `${(detail?.taxableAmount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })} is taxable`)
      .join('\n'); // Assuming line breaks work for your tooltip; otherwise, adjust as needed
  }

  getTableRows() {
    if (!this.rawData) return [];
    return this.rawData.map(item => {
      const accounts = item.accountState.accounts;
      const tfsaAcc = accounts.find(a => a.accountName === 'TFSA');
      const rrspAcc = accounts.find(a => a.accountName === 'RRSP');
      const margAcc = accounts.find(a => a.accountName === 'MARG' || a.accountName === 'NON-REG');

      const tfsaBalance = tfsaAcc ? tfsaAcc.totalValue : 0;
      const rrspBalance = rrspAcc ? rrspAcc.totalValue : 0;
      const margBalance = margAcc ? margAcc.totalValue : 0;
      const totalBalance = tfsaBalance + rrspBalance + margBalance;

      const actualW = this.calculateYearlyActuals(Math.floor(item.year), item);

      return {
        year: item.year,
        tfsaBalance,
        rrspBalance,
        margBalance,
        totalBalance,
        tfsaWithdraw: actualW.tfsaWithdrawal,
        rrspWithdraw: actualW.rrspWithdrawal,
        margWithdraw: actualW.nonRegWithdrawal,
        totalWithdraw: actualW.totalWithdrawal,
        totalTax: actualW.taxesOwed
      };
    });
  }

  calculateYearlyActuals(year: number, fallbackItem?: any) {
    let tfsaWithdrawalSum = 0;
    let rrspWithdrawalSum = 0;
    let nonRegWithdrawalSum = 0;

    let tfsaTaxableSum = 0;
    let rrspTaxableSum = 0;
    let nonRegTaxableSum = 0;

    let incomeSum = 0;
    let dividendsSum = 0;
    let dividendTaxableSum = 0;

    let provinceName = "Ontario";
    let hasActuals = false;

    if (this.unfilteredRawData && this.unfilteredRawData.length > 0) {
      // Find all events in [year, year + 1]
      const events = this.unfilteredRawData
        .filter((e: any) => e.year >= year - 1e-6 && e.year <= year + 1 + 1e-6)
        .sort((a: any, b: any) => a.year - b.year);

      if (events.length >= 2) {
        hasActuals = true;
        for (let i = 0; i < events.length - 1; i++) {
          const evA = events[i];
          const evB = events[i + 1];
          const dt = evB.year - evA.year;
          if (dt <= 0) continue;

          const interestRate = evA.accountState.interestRate || 0;
          const dividendYield = evA.accountState.dividendYield || 0;
          provinceName = evA.accountState.province || "Ontario";

          const accountsList = evA.accountState.accountsList || [];
          const tfsaIdx = accountsList.indexOf('TFSA');
          const rrspIdx = accountsList.indexOf('RRSP');
          const margIdx = accountsList.indexOf('MARG') !== -1 ? accountsList.indexOf('MARG') : accountsList.indexOf('NON-REG');

          // TFSA
          const tfsaA = evA.accountState.accounts.find((a: any) => a.accountName === 'TFSA');
          const tfsaB = evB.accountState.accounts.find((a: any) => a.accountName === 'TFSA');
          if (tfsaA && tfsaB) {
            const growth = tfsaA.totalValue * interestRate * dt;
            tfsaWithdrawalSum += Math.max(0, tfsaA.totalValue + growth - tfsaB.totalValue);
          }
          if (tfsaIdx !== -1 && evA.taxableAmount) {
            tfsaTaxableSum += (evA.taxableAmount[tfsaIdx] || 0) * dt;
          }

          // RRSP
          const rrspA = evA.accountState.accounts.find((a: any) => a.accountName === 'RRSP');
          const rrspB = evB.accountState.accounts.find((a: any) => a.accountName === 'RRSP');
          if (rrspA && rrspB) {
            const growth = rrspA.totalValue * interestRate * dt;
            rrspWithdrawalSum += Math.max(0, rrspA.totalValue + growth - rrspB.totalValue);
          }
          if (rrspIdx !== -1 && evA.taxableAmount) {
            rrspTaxableSum += (evA.taxableAmount[rrspIdx] || 0) * dt;
          }

          // Non-Reg
          const margA = evA.accountState.accounts.find((a: any) => a.accountName === 'MARG' || a.accountName === 'NON-REG');
          const margB = evB.accountState.accounts.find((a: any) => a.accountName === 'MARG' || a.accountName === 'NON-REG');
          if (margA && margB) {
            const growth = margA.totalValue * (interestRate - dividendYield) * dt;
            nonRegWithdrawalSum += Math.max(0, margA.totalValue + growth - margB.totalValue);
          }
          if (margIdx !== -1 && evA.taxableAmount) {
            nonRegTaxableSum += (evA.taxableAmount[margIdx] || 0) * dt;
          }

          // General
          incomeSum += (evA.accountState.income || 0) * dt;
          dividendsSum += (evA.dividends || 0) * dt;
          dividendTaxableSum += (evA.dividendTaxable || 0) * dt;
        }
      }
    }

    if (!hasActuals && fallbackItem) {
      provinceName = fallbackItem.accountState.province || "Ontario";
      const accountsList = fallbackItem.accountState.accountsList || [];
      const tfsaIdx = accountsList.indexOf('TFSA');
      const rrspIdx = accountsList.indexOf('RRSP');
      const margIdx = accountsList.indexOf('MARG') !== -1 ? accountsList.indexOf('MARG') : accountsList.indexOf('NON-REG');

      tfsaWithdrawalSum = tfsaIdx !== -1 ? fallbackItem.preTaxAmounts[tfsaIdx] : 0;
      rrspWithdrawalSum = rrspIdx !== -1 ? fallbackItem.preTaxAmounts[rrspIdx] : 0;
      nonRegWithdrawalSum = margIdx !== -1 ? fallbackItem.preTaxAmounts[margIdx] : 0;

      tfsaTaxableSum = tfsaIdx !== -1 ? fallbackItem.taxableAmount[tfsaIdx] : 0;
      rrspTaxableSum = rrspIdx !== -1 ? fallbackItem.taxableAmount[rrspIdx] : 0;
      nonRegTaxableSum = margIdx !== -1 ? fallbackItem.taxableAmount[margIdx] : 0;

      incomeSum = fallbackItem.accountState.income || 0;
      dividendsSum = fallbackItem.dividends || 0;
      dividendTaxableSum = fallbackItem.dividendTaxable || 0;
    }

    let startTfsa = 0;
    let startRrsp = 0;
    let startNonReg = 0;

    if (fallbackItem && fallbackItem.accountState && fallbackItem.accountState.accounts) {
      const accounts = fallbackItem.accountState.accounts;
      const tfsaAcc = accounts.find((a: any) => a.accountName === 'TFSA');
      const rrspAcc = accounts.find((a: any) => a.accountName === 'RRSP');
      const margAcc = accounts.find((a: any) => a.accountName === 'MARG' || a.accountName === 'NON-REG');
      startTfsa = tfsaAcc ? tfsaAcc.totalValue : 0;
      startRrsp = rrspAcc ? rrspAcc.totalValue : 0;
      startNonReg = margAcc ? margAcc.totalValue : 0;
    }

    // Cap withdrawal sums at starting balances to prevent withdrawing more than possible (e.g. including interest rate growth in withdrawal display)
    if (fallbackItem) {
      tfsaWithdrawalSum = Math.min(startTfsa, tfsaWithdrawalSum);
      rrspWithdrawalSum = Math.min(startRrsp, rrspWithdrawalSum);
      nonRegWithdrawalSum = Math.min(startNonReg, nonRegWithdrawalSum);
      
      // Also cap taxable sums to match capped withdrawals
      rrspTaxableSum = Math.min(startRrsp, rrspTaxableSum);
      nonRegTaxableSum = Math.min(startNonReg, nonRegTaxableSum);
    }

    const totalTaxable = incomeSum + rrspTaxableSum + nonRegTaxableSum + dividendTaxableSum;
    const taxesOwed = this.localOptimizerService.calculateTaxesOwed(totalTaxable, provinceName, dividendTaxableSum);
    const totalWithdrawal = tfsaWithdrawalSum + rrspWithdrawalSum + nonRegWithdrawalSum;
    const effectiveIncome = totalWithdrawal + incomeSum + dividendsSum;
    const totalAfterTax = effectiveIncome - taxesOwed;

    return {
      tfsaWithdrawal: tfsaWithdrawalSum,
      rrspWithdrawal: rrspWithdrawalSum,
      nonRegWithdrawal: nonRegWithdrawalSum,
      tfsaTaxable: tfsaTaxableSum,
      rrspTaxable: rrspTaxableSum,
      nonRegTaxable: nonRegTaxableSum,
      income: incomeSum,
      dividends: dividendsSum,
      dividendTaxable: dividendTaxableSum,
      totalTaxable,
      taxesOwed,
      totalWithdrawal,
      effectiveIncome,
      totalAfterTax,
      provinceName
    };
  }

  getPhaseTransitionNote(year: number): string | null {
    if (!this.unfilteredRawData) return null;
    
    // Find events in [year, year + 1]
    const events = this.unfilteredRawData
      .filter((e: any) => e.year >= year - 1e-6 && e.year <= year + 1 + 1e-6)
      .sort((a: any, b: any) => a.year - b.year);

    if (events.length <= 2) {
      return null;
    }

    for (let i = 0; i < events.length - 1; i++) {
      const evA = events[i];
      const evB = events[i + 1];
      
      const isIntegerYear = Math.abs(evB.year - Math.round(evB.year)) < 1e-6;
      if (!isIntegerYear) {
        for (const accA of evA.accountState.accounts) {
          const accB = evB.accountState.accounts.find((a: any) => a.accountName === accA.accountName);
          if (accB && accA.totalValue >= 1.0 && accB.totalValue < 1.0) {
            return `A phase transition occurred at year ${evB.year.toFixed(2)}: the ${accA.accountName} account was depleted, and withdrawals shifted to the next account.`;
          }
        }
      }
    }
    return null;
  }

  updateChart(data: any[]): void {
    if (this.chart) {
      this.unfilteredRawData = data;
      const filtered = this.filterRawData(data);
      this.rawData = filtered;
      this.data = this.transformDataForChart(filtered);
      console.log("updating chart with new data", this.data);
      
      let preciseMaxYear = 0;
      filtered.forEach(item => {
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
      this.updateActiveChartElements();
      this.getWithdrawalStrategy(data);
    }
  }

  private transformDataForChart(rawData: RawDataItem[]): any[] {
    const chartData: ChartData[] = [];
    rawData.forEach(result => {
      let totalValue = 0;
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
    console.log(chartData);
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
    if (options.scales && options.scales['x']) {
      options.scales['x'].min = 0;
      options.scales['x'].max = maxYear;
    }

    this.chart = new Chart("MyChart", {
      type: 'line',
      data: {
        datasets: this.mapDatasets(chartData)
      },
      options: options,
    });
    this.chart.lifespan = preciseMaxYear;
    this.updateActiveChartElements();
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
        console.log('%c[CHART DEBUG] TOTAL Dataset Config:', 'color: #2ecc71; font-weight: bold;', {
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
  interestRate?: number;
  dividendYield?: number;
  inflationRate?: number;
}

interface RawDataItem {
  year: number;
  accountState: AccountState;
  taxAmounts?: number[];
  preTaxAmounts: number[];
  taxableAmount: number[];
  dividends?: number;
  dividendTaxable?: number;
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

