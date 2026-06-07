import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js';
import { SharedDataService } from '../services/SharedDataService';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css'
})
export class BarChartComponent implements OnInit {
  variance = 12; // Default Standard Deviation of 12%
  simulations = 1000; // Default 1000 simulations
  hasRun = false;
  hasStrategy = false;
  
  optimalData: any[] = [];
  inputData: any = null;

  avgYears = 0;
  successRate = 0;
  p10 = 0;
  p50 = 0;
  p90 = 0;

  chart: any = null;

  // Custom asset mix properties
  isAssetMixExpanded = false;
  mixTotal = 100;
  mix = {
    hisa: 10,
    bonds: 40,
    usEquity: 30,
    intlEquity: 20,
    speculative: 0
  };

  toggleAssetMix() {
    this.isAssetMixExpanded = !this.isAssetMixExpanded;
  }

  onVarianceSliderChange() {
    // If they change the variance slider, update the custom mix to a rough approximation
    const v = Number(this.variance);
    if (v === 0) {
      this.mix = { hisa: 100, bonds: 0, usEquity: 0, intlEquity: 0, speculative: 0 };
    } else if (v <= 5) {
      this.mix = { hisa: 20, bonds: 80, usEquity: 0, intlEquity: 0, speculative: 0 };
    } else if (v <= 12) {
      this.mix = { hisa: 10, bonds: 40, usEquity: 30, intlEquity: 20, speculative: 0 };
    } else if (v <= 20) {
      this.mix = { hisa: 0, bonds: 10, usEquity: 65, intlEquity: 20, speculative: 5 };
    } else if (v <= 28) {
      this.mix = { hisa: 0, bonds: 0, usEquity: 40, intlEquity: 30, speculative: 30 };
    } else {
      this.mix = { hisa: 0, bonds: 0, usEquity: 0, intlEquity: 10, speculative: 90 };
    }
    this.mixTotal = 100;
  }

  setVarianceProfile(value: number) {
    this.variance = value;
    this.onVarianceSliderChange();
  }

  calculateVarianceFromMix() {
    const hisaVal = Number(this.mix.hisa || 0);
    const bondsVal = Number(this.mix.bonds || 0);
    const usVal = Number(this.mix.usEquity || 0);
    const intlVal = Number(this.mix.intlEquity || 0);
    const specVal = Number(this.mix.speculative || 0);

    const total = hisaVal + bondsVal + usVal + intlVal + specVal;
    this.mixTotal = total;

    if (total > 0) {
      // Volatilities: HISA: 0%, Bonds: 5%, US: 15%, Intl: 18%, Spec: 32%
      const weightedSD = (hisaVal * 0 + bondsVal * 5 + usVal * 15 + intlVal * 18 + specVal * 32) / total;
      this.variance = Math.round(weightedSD);
    } else {
      this.variance = 0;
    }
  }

  normalizeMix() {
    const hisaVal = Number(this.mix.hisa || 0);
    const bondsVal = Number(this.mix.bonds || 0);
    const usVal = Number(this.mix.usEquity || 0);
    const intlVal = Number(this.mix.intlEquity || 0);
    const specVal = Number(this.mix.speculative || 0);

    const total = hisaVal + bondsVal + usVal + intlVal + specVal;
    if (total === 0) {
      this.mix = { hisa: 20, bonds: 20, usEquity: 20, intlEquity: 20, speculative: 20 };
    } else {
      const factor = 100 / total;
      this.mix.hisa = Math.round(hisaVal * factor);
      this.mix.bonds = Math.round(bondsVal * factor);
      this.mix.usEquity = Math.round(usVal * factor);
      this.mix.intlEquity = Math.round(intlVal * factor);
      this.mix.speculative = Math.round(specVal * factor);
    }
    this.calculateVarianceFromMix();
  }

  resetMix() {
    this.mix = { hisa: 0, bonds: 0, usEquity: 0, intlEquity: 0, speculative: 0 };
    this.mixTotal = 0;
    this.variance = 0;
  }

  getProfileClass(): string {
    const v = Number(this.variance);
    if (v === 0) return 'profile-fixed';
    if (v <= 6) return 'profile-conservative';
    if (v <= 14) return 'profile-balanced';
    if (v <= 22) return 'profile-aggressive';
    if (v <= 30) return 'profile-risky';
    return 'profile-speculative';
  }

  getProfileIcon(): string {
    const v = Number(this.variance);
    if (v === 0) return '🏦';
    if (v <= 6) return '🛡️';
    if (v <= 14) return '⚖️';
    if (v <= 22) return '📈';
    if (v <= 30) return '🚀';
    return '🎰';
  }

  getProfileTitle(): string {
    const v = Number(this.variance);
    if (v === 0) return 'Safe Haven (Cash & GICs)';
    if (v <= 6) return 'Conservative Income';
    if (v <= 14) return 'Balanced Growth';
    if (v <= 22) return 'Aggressive Equity';
    if (v <= 30) return 'Risky Tech/Growth';
    return 'Speculative / Crypto Mix';
  }

  getProfileDescription(): string {
    const v = Number(this.variance);
    if (v === 0) return 'Guaranteed nominal returns. High security, but zero protection against inflation.';
    if (v <= 6) return 'Mostly government bonds and money market investments. Low volatility but slow wealth accumulation.';
    if (v <= 14) return 'Classic balanced stock-bond portfolio. Moderate volatility with long-term compound growth.';
    if (v <= 22) return 'Dominantly diversified global stocks. Higher fluctuations but strong long-run return potential.';
    if (v <= 30) return 'Concentrated tech, growth equities, and high-beta plays. Significant volatility and drawdowns.';
    return 'Extreme portfolio volatility. High exposure to speculative tech, leverage, or cryptocurrencies. High capital risk.';
  }

  constructor(private sharedDataService: SharedDataService) {}

  ngOnInit(): void {
    // Subscribe to the optimal strategy data
    this.sharedDataService.chartData$.subscribe(data => {
      if (data && data.length > 0) {
        this.optimalData = data;
        this.hasStrategy = true;
      } else {
        this.hasStrategy = false;
        this.hasRun = false;
      }
    });

    // Subscribe to initial input parameters
    this.sharedDataService.currentInputData$.subscribe(data => {
      if (data) {
        this.inputData = data;
      }
    });
  }

  // Box-Muller transform for normal distribution
  private randomNormal(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
  }

  private extractPhases(rawData: any[]): any[] {
    let summaries: any[] = [];
    let lastPreTaxAmounts: number[] | null = null;
    let lastAccounts: string[] = [];
    let startYear = 0;
    
    rawData.forEach((item, index) => {
      if (!lastPreTaxAmounts || !this.arraysEqual(lastPreTaxAmounts, item.preTaxAmounts)) {
        if (lastPreTaxAmounts) {
          const summary = {
            startYear: startYear,
            endYear: item.year,
            withdrawals: lastPreTaxAmounts.map((amount, idx) => {
              let accountName = lastAccounts ? lastAccounts[idx] : 'Unknown';
              return {
                amount: amount,
                accountName: accountName
              };
            })
          };
          summaries.push(summary);
        }
        startYear = item.year;
        lastAccounts = item.accountState.accountsList;
        lastPreTaxAmounts = item.preTaxAmounts;
      }

      if (index === rawData.length - 1) {
        const summary = {
          startYear: startYear,
          endYear: item.year,
          withdrawals: (lastPreTaxAmounts || []).map((amount, idx) => {
            let accountName = lastAccounts ? lastAccounts[idx] : 'Unknown';
            return {
              amount: amount,
              accountName: accountName
            };
          })
        };
        summaries.push(summary);
      }
    });
    return summaries;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  runSimulation(): void {
    if (!this.hasStrategy || !this.inputData) return;

    const initialTfsa = this.inputData.tfsaAmount || 0;
    const initialRrsp = this.inputData.rrspAmount || 0;
    const initialMarg = this.inputData.margAmountPrincipal || 0;
    const meanReturn = (this.inputData.interestRate || 4.0) / 100; // convert % to decimal
    const stdDev = this.variance / 100; // convert % to decimal

    const phases = this.extractPhases(this.optimalData);
    const results: number[] = [];

    // Run simulations
    for (let sim = 0; sim < this.simulations; sim++) {
      let tfsa = initialTfsa;
      let rrsp = initialRrsp;
      let marg = initialMarg;
      let year = 0;
      let p = 0; // start at phase index 0

      while (year < 150) {
        // 1. Grow accounts
        const r = this.randomNormal(meanReturn, stdDev);
        tfsa = tfsa > 0 ? tfsa * (1 + r) : 0;
        rrsp = rrsp > 0 ? rrsp * (1 + r) : 0;
        marg = marg > 0 ? marg * (1 + r) : 0;

        // 2. Check if all accounts are empty
        if (tfsa <= 0.01 && rrsp <= 0.01 && marg <= 0.01) {
          break;
        }

        // 3. Determine if we need to transition to the next phase.
        // We look at the withdrawals for the current phase, and if any account that we need to
        // withdraw from is empty or has a balance less than the required amount, we move to the next phase.
        while (p < phases.length - 1) {
          let needSwitch = false;
          const withdrawals = phases[p].withdrawals;
          for (const w of withdrawals) {
            if (w.amount > 0.01) {
              if (w.accountName === 'TFSA' && tfsa < w.amount) needSwitch = true;
              if (w.accountName === 'RRSP' && rrsp < w.amount) needSwitch = true;
              if ((w.accountName === 'MARG' || w.accountName === 'NON-REG') && marg < w.amount) needSwitch = true;
            }
          }
          if (needSwitch) {
            p++;
          } else {
            break;
          }
        }

        // Get the withdrawals for the active phase
        const activeWithdrawals = phases[p].withdrawals;
        let w_tfsa = 0;
        let w_rrsp = 0;
        let w_marg = 0;

        activeWithdrawals.forEach((w: any) => {
          if (w.accountName === 'TFSA') w_tfsa = w.amount;
          else if (w.accountName === 'RRSP') w_rrsp = w.amount;
          else if (w.accountName === 'MARG' || w.accountName === 'NON-REG') w_marg = w.amount;
        });

        // 4. Perform withdrawals (cap to account balance)
        const tfsaWithdraw = Math.min(tfsa, w_tfsa);
        tfsa -= tfsaWithdraw;

        const rrspWithdraw = Math.min(rrsp, w_rrsp);
        rrsp -= rrspWithdraw;

        const margWithdraw = Math.min(marg, w_marg);
        marg -= margWithdraw;

        // Check if we didn't meet the target withdrawal for the phase (depleted!)
        const targetTotal = w_tfsa + w_rrsp + w_marg;
        const actualTotal = tfsaWithdraw + rrspWithdraw + margWithdraw;
        if (targetTotal > 0.01 && actualTotal < targetTotal - 1.0) {
          break; // Depleted!
        }

        year++;
      }

      results.push(year);
    }

    // Calculate metrics
    results.sort((a, b) => a - b);
    const sum = results.reduce((acc, v) => acc + v, 0);
    this.avgYears = sum / this.simulations;
    this.successRate = results.filter(v => v >= 50).length / this.simulations;

    // Percentiles
    this.p10 = results[Math.floor(this.simulations * 0.10)];
    this.p50 = results[Math.floor(this.simulations * 0.50)];
    this.p90 = results[Math.floor(this.simulations * 0.90)];

    this.hasRun = true;

    // Build frequency distribution for chart dynamically based on max lifespan in results
    const maxLimit = Math.max(1, Math.max(...results));
    const distribution: { [key: number]: number } = {};
    for (let y = 1; y <= maxLimit; y++) {
      distribution[y] = 0;
    }
    results.forEach(year => {
      const rounded = Math.min(maxLimit, Math.max(1, Math.round(year)));
      distribution[rounded]++;
    });

    const chartData = Object.keys(distribution).map(key => ({
      x: Number(key),
      y: distribution[Number(key)]
    }));

    // Draw / update chart
    setTimeout(() => {
      this.createOrUpdateChart(chartData, maxLimit);
    }, 0);
  }

  createOrUpdateChart(chartData: any[], maxLimit: number): void {
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('MonteCarloChart', {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.x === maxLimit && maxLimit === 150 ? '150+ yr' : `${d.x} yr`),
        datasets: [{
          label: 'Number of Runs',
          data: chartData.map(d => d.y),
          backgroundColor: '#e67e22',
          borderColor: '#d56407',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#262421',
            borderColor: '#363532',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#bababa'
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#bababa',
              font: {
                size: 10
              },
              autoSkip: true,
              maxTicksLimit: 20
            },
            title: {
              display: true,
              text: 'Portfolio Lifespan (Years)',
              color: '#bababa'
            }
          },
          y: {
            grid: {
              color: '#363532'
            },
            ticks: {
              color: '#bababa'
            },
            title: {
              display: true,
              text: 'Frequency',
              color: '#bababa'
            }
          }
        }
      }
    });
  }
}
// Triggering rebuild

