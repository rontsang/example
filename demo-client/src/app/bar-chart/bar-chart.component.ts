import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js';
import { SharedDataService } from '../services/SharedDataService';

const distLinePlugin = {
  id: 'distLinePlugin',
  afterDraw(chart: any) {
    const ctx = chart.ctx;
    const xAxis = chart.scales.x;
    const yAxis = chart.scales.y;
    if (!xAxis || !yAxis) return;

    const datasets = chart.data.datasets;
    if (!datasets || datasets.length === 0) return;
    const fullData = datasets[0].data;

    const totalLabels = chart.data.labels.length;
    const isSpike = totalLabels === 5;

    let targetIndices: { idx: number; label: string; color: string }[] = [];
    if (isSpike) {
      targetIndices = [
        { idx: 2, label: 'Average', color: '#e67e22' }
      ];
    } else {
      targetIndices = [
        { idx: 0, label: '-3σ', color: '#55534f' },
        { idx: 25, label: '-2σ', color: '#88857f' },
        { idx: 50, label: '-1σ', color: '#aaa7a0' },
        { idx: 75, label: 'Average', color: '#e67e22' },
        { idx: 100, label: '+1σ', color: '#aaa7a0' },
        { idx: 125, label: '+2σ', color: '#88857f' },
        { idx: 150, label: '+3σ', color: '#55534f' }
      ];
    }

    ctx.save();
    const meta = chart.getDatasetMeta(0);
    targetIndices.forEach(item => {
      const idx = item.idx;
      if (idx < 0 || idx >= totalLabels) return;

      const x = (meta && meta.data && meta.data[idx]) ? meta.data[idx].x : xAxis.getPixelForValue(chart.data.labels[idx]);
      const y = (meta && meta.data && meta.data[idx]) ? meta.data[idx].y : yAxis.getPixelForValue(fullData[idx]);

      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.idx === 75 || isSpike ? 2.0 : 1.0;
      ctx.setLineDash(item.idx === 75 || isSpike ? [] : [3, 3]);
      ctx.moveTo(x, chart.chartArea.bottom);
      ctx.lineTo(x, y);
      ctx.stroke();

      const labelText = chart.data.labels[idx];
      
      ctx.fillStyle = item.color;
      ctx.font = item.idx === 75 || isSpike ? 'bold 10px sans-serif' : '10px sans-serif';
      
      if (item.idx === 0) {
        ctx.textAlign = 'left';
      } else if (item.idx === 150) {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'center';
      }
      
      ctx.fillText(item.label, x, y - 16);
      ctx.fillStyle = item.color;
      ctx.fillText(labelText, x, chart.chartArea.bottom + 14);
    });
    ctx.restore();
  }
};

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css'
})
export class BarChartComponent implements OnInit {
  variance = 10; // Default Standard Deviation of 10% (Balanced)
  simulations = 1000; // Default 1000 simulations
  hasRun = false;
  hasStrategy = false;
  showResults = false;
  
  optimalData: any[] = [];
  inputData: any = null;

  avgYears = 0;
  successRate = 0;
  p10 = 0;
  p50 = 0;
  p90 = 0;
  targetYears = 50;
  simulationResults: number[] = [];

  chart: any = null;
  distChart: any = null;

  // Custom asset mix properties
  isAssetMixExpanded = false;
  mixTotal = 100;
  mix = {
    hisa: 10,
    bonds: 50,
    usEquity: 25,
    intlEquity: 15,
    speculative: 0
  };

  // Range calculator variables
  calcMinReturn = -16;
  calcMaxReturn = 23;
  calcSliderMin = -27;
  calcSliderMax = 35;
  rangeProbability = 0.95;

  // Dragging state for dist chart selection
  private dragStartIdx: number | null = null;
  private isDragging = false;

  get meanReturn(): number {
    return Number(this.inputData?.interestRate || 4.0);
  }

  get maxLoss95(): number {
    return this.meanReturn - 1.96 * Number(this.variance);
  }

  get maxGain95(): number {
    return this.meanReturn + 1.96 * Number(this.variance);
  }

  get sliderValue(): number {
    const v = Number(this.variance);
    if (isNaN(v) || v <= 0) return 0;
    if (v >= 25) return 100;
    
    if (v <= 5) {
      return (v / 5) * 25;
    } else if (v <= 10) {
      return 25 + ((v - 5) / 5) * 25;
    } else if (v <= 16) {
      return 50 + ((v - 10) / 6) * 25;
    } else {
      return 75 + ((v - 16) / 9) * 25;
    }
  }

  onSliderValueChange(val: number) {
    let v: number;
    if (val <= 25) {
      v = 0 + (val / 25) * 5;
    } else if (val <= 50) {
      v = 5 + ((val - 25) / 25) * 5;
    } else if (val <= 75) {
      v = 10 + ((val - 50) / 25) * 6;
    } else {
      v = 16 + ((val - 75) / 25) * 9;
    }
    
    this.variance = Math.round(v * 10) / 10;
    this.onVarianceSliderChange();
    
    // Sync with the shared inputs form
    if (this.inputData) {
      const updatedData = { ...this.inputData, variance: this.variance };
      this.sharedDataService.updateInputData(updatedData);
    }
  }

  onVarianceSliderChange() {
    this.updateCalculatorBounds();
    this.createOrUpdateDistChart();
  }

  setVarianceProfile(value: number) {
    this.variance = value;
    this.onVarianceSliderChange();
    if (this.inputData) {
      const updatedData = { ...this.inputData, variance: this.variance };
      this.sharedDataService.updateInputData(updatedData);
    }
  }

  onVarianceInputChange(val: any) {
    let num = Number(val);
    if (isNaN(num)) return;
    if (num < 0) num = 0;
    if (num > 25) num = 25;
    this.variance = num;
    this.onVarianceSliderChange();
    if (this.inputData) {
      const updatedData = { ...this.inputData, variance: this.variance };
      this.sharedDataService.updateInputData(updatedData);
    }
  }

  onTargetYearsChange(val: number) {
    this.targetYears = val;
    if (this.simulationResults && this.simulationResults.length > 0) {
      this.successRate = this.simulationResults.filter(v => v >= this.targetYears).length / this.simulations;
    }
  }

  goBackToConfig() {
    this.showResults = false;
    setTimeout(() => {
      this.createOrUpdateDistChart();
    }, 0);
  }

  getProfileClass(): string {
    const v = Number(this.variance);
    if (v === 0) return 'profile-fixed';
    if (v <= 5) return 'profile-conservative';
    if (v <= 10) return 'profile-balanced';
    if (v <= 16) return 'profile-aggressive';
    return 'profile-speculative';
  }

  getProfileIcon(): string {
    const v = Number(this.variance);
    if (v === 0) return '🏦';
    if (v <= 5) return '🛡️';
    if (v <= 10) return '⚖️';
    if (v <= 16) return '📈';
    return '🚀';
  }

  getProfileTitle(): string {
    const v = Number(this.variance);
    if (v === 0) return 'Safe Haven (Cash & GICs)';
    if (v <= 5) return 'Conservative Income';
    if (v <= 10) return 'Balanced Growth';
    if (v <= 16) return 'Aggressive Equity';
    return 'Highly Volatile / Speculative';
  }

  getProfileDescription(): string {
    const v = Number(this.variance);
    if (v === 0) return 'Guaranteed nominal returns. High security, but zero protection against inflation.';
    if (v <= 5) return 'Mostly government bonds and money market investments. Low volatility but slow wealth accumulation.';
    if (v <= 10) return 'Classic balanced stock-bond portfolio. Moderate volatility with long-term compound growth.';
    if (v <= 16) return 'Dominantly diversified global stocks. Higher fluctuations but strong long-run return potential.';
    return 'Concentrated growth stocks and speculative assets. Significant volatility, subject to large drawdowns.';
  }

  createOrUpdateDistChart(): void {
    const ctx = document.getElementById('DistributionChart') as HTMLCanvasElement;
    if (!ctx) return;

    const mu = this.meanReturn / 100;
    const sigma = Number(this.variance) / 100;

    const labels: string[] = [];
    const fullData: number[] = [];
    const shadedData: (number | null)[] = [];
    
    const isSpike = (sigma === 0);

    if (isSpike) {
      const muPercent = this.meanReturn;
      // Define a narrow spike centered at muPercent with flat lines on both sides
      labels.push((muPercent - 2.0).toFixed(1) + '%');
      labels.push((muPercent - 0.1).toFixed(1) + '%');
      labels.push(muPercent.toFixed(1) + '%');
      labels.push((muPercent + 0.1).toFixed(1) + '%');
      labels.push((muPercent + 2.0).toFixed(1) + '%');

      fullData.push(0, 0, 10, 0, 0);

      // Shaded spike if muPercent falls inside the custom range
      if (muPercent >= this.calcMinReturn && muPercent <= this.calcMaxReturn) {
        shadedData.push(0, 0, 10, 0, 0);
      } else {
        shadedData.push(null, null, null, null, null);
      }
    } else {
      const step = 6 / 150;
      for (let z = -3; z <= 3 + 1e-6; z += step) {
        const returnPercent = (mu + z * sigma) * 100;
        const density = Math.exp(-Math.pow(z, 2) / 2);
        labels.push(returnPercent.toFixed(1) + '%');
        fullData.push(density);

        if (returnPercent >= this.calcMinReturn && returnPercent <= this.calcMaxReturn) {
          shadedData.push(density);
        } else {
          shadedData.push(null);
        }
      }
    }

    if (this.distChart) {
      this.distChart.destroy();
    }

    this.distChart = new Chart('DistributionChart', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Probability Density (Full)',
            data: fullData,
            borderColor: '#3a3834',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: isSpike ? 0 : 0.4
          },
          {
            label: 'Selected Range',
            data: shadedData,
            borderColor: '#e67e22',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: true,
            backgroundColor: 'rgba(230, 126, 34, 0.15)',
            tension: isSpike ? 0 : 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: {
            top: 25,
            bottom: 20,
            left: 15,
            right: 15
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              display: false
            },
            title: {
              display: true,
              text: 'Return %',
              color: '#bababa',
              font: {
                size: 11
              },
              padding: {
                top: 12
              }
            }
          },
          y: {
            display: false,
            grid: { display: false }
          }
        }
      },
      plugins: [distLinePlugin]
    });
  }

  constructor(private sharedDataService: SharedDataService) {}

  ngOnInit(): void {
    // Subscribe to the optimal strategy data
    this.sharedDataService.chartData$.subscribe(data => {
      if (data && data.length > 0) {
        this.optimalData = data;
        this.hasStrategy = true;
        this.updateCalculatorBounds();
        setTimeout(() => this.createOrUpdateDistChart(), 0);
      } else {
        this.hasStrategy = false;
        this.hasRun = false;
        this.showResults = false;
      }
    });

    // Subscribe to initial input parameters
    this.sharedDataService.currentInputData$.subscribe(data => {
      if (data) {
        this.inputData = data;
        if (data.variance !== undefined) {
          this.variance = Number(data.variance);
        }
        this.updateCalculatorBounds();
        setTimeout(() => this.createOrUpdateDistChart(), 0);
      }
    });
  }

  onChartMouseDown(event: MouseEvent) {
    if (!this.distChart) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    const xAxis = this.distChart.scales.x;
    if (!xAxis) return;

    // Get the index of the clicked category
    const index = Math.round(xAxis.getValueForPixel(x));
    if (index >= 0 && index < this.distChart.data.labels.length) {
      this.dragStartIdx = index;
      this.isDragging = true;
    }
  }

  onChartMouseMove(event: MouseEvent) {
    if (!this.isDragging || this.dragStartIdx === null || !this.distChart) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    const xAxis = this.distChart.scales.x;
    if (!xAxis) return;

    const index = Math.round(xAxis.getValueForPixel(x));
    const totalLabels = this.distChart.data.labels.length;
    const clampedIndex = Math.max(0, Math.min(totalLabels - 1, index));

    const minIdx = Math.min(this.dragStartIdx, clampedIndex);
    const maxIdx = Math.max(this.dragStartIdx, clampedIndex);

    // Parse the return percentages from the labels
    const labels = this.distChart.data.labels as string[];
    const minValStr = labels[minIdx].replace('%', '');
    const maxValStr = labels[maxIdx].replace('%', '');

    this.calcMinReturn = parseFloat(minValStr);
    this.calcMaxReturn = parseFloat(maxValStr);

    this.calculateRangeProbability();
    this.updateShadedDataOnly();
  }

  onChartMouseUp(event: MouseEvent) {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragStartIdx = null;
    }
  }

  onChartMouseLeave(event: MouseEvent) {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragStartIdx = null;
    }
  }

  updateShadedDataOnly(): void {
    if (!this.distChart) return;

    const labels = this.distChart.data.labels as string[];
    const shadedData: (number | null)[] = [];
    const sigma = Number(this.variance) / 100;
    const isSpike = (sigma === 0);

    if (isSpike) {
      const muPercent = this.meanReturn;
      if (muPercent >= this.calcMinReturn && muPercent <= this.calcMaxReturn) {
        shadedData.push(0, 0, 10, 0, 0);
      } else {
        shadedData.push(null, null, null, null, null);
      }
    } else {
      const fullData = this.distChart.data.datasets[0].data as number[];
      for (let i = 0; i < labels.length; i++) {
        const returnPercent = parseFloat(labels[i].replace('%', ''));
        if (returnPercent >= this.calcMinReturn && returnPercent <= this.calcMaxReturn) {
          shadedData.push(fullData[i]);
        } else {
          shadedData.push(null);
        }
      }
    }

    this.distChart.data.datasets[1].data = shadedData;
    this.distChart.update('none');
  }

  calculateRangeProbability() {
    const mu = this.meanReturn / 100;
    const sigma = Number(this.variance) / 100;

    const pMax = this.normalCDF(this.calcMaxReturn / 100, mu, sigma);
    const pMin = this.normalCDF(this.calcMinReturn / 100, mu, sigma);
    
    this.rangeProbability = Math.max(0, Math.min(1, pMax - pMin));
  }

  updateCalculatorBounds() {
    const mu = this.meanReturn;
    const v = Number(this.variance);

    this.calcSliderMin = mu - 3 * Math.max(1, v);
    this.calcSliderMax = mu + 3 * Math.max(1, v);

    // Reset defaults to exactly 95% bounds
    this.rangeProbability = 0.95;
    if (v === 0) {
      this.calcMinReturn = mu;
      this.calcMaxReturn = mu;
    } else {
      const z = this.getZScoreForProbability(0.95);
      this.calcMinReturn = mu - z * v;
      this.calcMaxReturn = mu + z * v;
    }

    this.calculateRangeProbability();
  }

  private getZScoreForProbability(p: number): number {
    const target = (p + 1) / 2;
    let low = 0;
    let high = 5;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      const val = this.stdNormalCDF(mid);
      if (val < target) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }

  getPercentValue(): number {
    return Math.round(this.rangeProbability * 1000) / 10;
  }

  isTickActive(val: number): boolean {
    return Math.abs(Number(this.variance) - val) < 0.25;
  }

  onRangeProbabilityChange(val: any) {
    let num = Number(val);
    if (isNaN(num)) return;
    if (num < 0.1) num = 0.1;
    if (num > 99.9) num = 99.9;
    
    this.rangeProbability = num / 100;
    
    const mu = this.meanReturn;
    const v = Number(this.variance);
    
    if (v === 0) {
      this.calcMinReturn = mu;
      this.calcMaxReturn = mu;
    } else {
      const z = this.getZScoreForProbability(this.rangeProbability);
      this.calcMinReturn = mu - z * v;
      this.calcMaxReturn = mu + z * v;
    }
    this.updateShadedDataOnly();
  }

  private normalCDF(x: number, mean: number, stdDev: number): number {
    if (stdDev === 0) {
      return x >= mean ? 1.0 : 0.0;
    }
    const z = (x - mean) / stdDev;
    return this.stdNormalCDF(z);
  }

  private stdNormalCDF(z: number): number {
    const absZ = Math.abs(z);
    const d1 = 0.0498673470;
    const d2 = 0.0211410061;
    const d3 = 0.0032776263;
    const d4 = 0.0000380036;
    const d5 = 0.0000488906;
    const d6 = 0.0000053830;

    const val = 1.0 + d1 * absZ + d2 * Math.pow(absZ, 2) + d3 * Math.pow(absZ, 3) 
                    + d4 * Math.pow(absZ, 4) + d5 * Math.pow(absZ, 5) + d6 * Math.pow(absZ, 6);
    const cdf = 1.0 - 0.5 * Math.pow(val, -16);
    
    return z >= 0 ? cdf : 1.0 - cdf;
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
 
    this.simulations = 1000;
    this.showResults = true;

    const initialTfsa = this.inputData.tfsaAmount || 0;
    const initialRrsp = this.inputData.rrspAmount || 0;
    const initialMarg = this.inputData.margAmountPrincipal || 0;
    const meanReturn = (this.inputData.interestRate || 4.0) / 100; // convert % to decimal
    const stdDev = this.variance / 100; // convert % to decimal
    const dividendYield = (this.inputData.dividendYield || 0) / 100; // convert % to decimal
    const inflationRate = (this.inputData.inflationRate || 0) / 100;
    const otherIncome = this.inputData.income || 0;
    const amountPerYear = this.inputData.amountPerYear || 60000;

    const results: number[] = [];

    // Run simulations
    for (let sim = 0; sim < this.simulations; sim++) {
      let tfsa = initialTfsa;
      let rrsp = initialRrsp;
      let marg = initialMarg;
      let year = 0;
      let depleted = false;

      // 1. Step through optimalData intervals
      for (let i = 1; i < this.optimalData.length; i++) {
        const prevEvent = this.optimalData[i - 1];
        const currEvent = this.optimalData[i];
        
        const dt = currEvent.year - prevEvent.year;
        if (dt <= 0) {
          continue;
        }

        // Draw a random return r for this step
        const r_drawn = this.randomNormal(meanReturn, stdDev);
        const effGrowth = (r_drawn - dividendYield) * dt;
        const divYield = dividendYield * dt;

        // Grow accounts
        tfsa = tfsa > 0 ? tfsa * (1 + effGrowth) * (1 + divYield) : 0;
        rrsp = rrsp > 0 ? rrsp * (1 + effGrowth) * (1 + divYield) : 0;
        marg = marg > 0 ? marg * (1 + effGrowth) : 0;

        if (tfsa <= 0.01 && rrsp <= 0.01 && marg <= 0.01) {
          results.push(prevEvent.year);
          depleted = true;
          break;
        }

        // Get target withdrawals
        const accountsList = currEvent.accountState.accountsList || [];
        const tfsaIdx = accountsList.indexOf('TFSA');
        const rrspIdx = accountsList.indexOf('RRSP');
        const margIdx = accountsList.indexOf('MARG') !== -1 ? accountsList.indexOf('MARG') : accountsList.indexOf('NON-REG');

        let w_tfsa = 0;
        let w_rrsp = 0;
        let w_marg = 0;

        if (tfsaIdx !== -1) w_tfsa = currEvent.preTaxAmounts[tfsaIdx] || 0;
        if (rrspIdx !== -1) w_rrsp = currEvent.preTaxAmounts[rrspIdx] || 0;
        if (margIdx !== -1) w_marg = currEvent.preTaxAmounts[margIdx] || 0;

        // Withdraw
        let tfsaWithdraw = Math.min(tfsa, w_tfsa * dt);
        tfsa -= tfsaWithdraw;

        let rrspWithdraw = Math.min(rrsp, w_rrsp * dt);
        rrsp -= rrspWithdraw;

        let margWithdraw = Math.min(marg, w_marg * dt);
        marg -= margWithdraw;

        tfsa = Math.round(tfsa * 100) / 100;
        rrsp = Math.round(rrsp * 100) / 100;
        marg = Math.round(marg * 100) / 100;

        const targetTotal = (w_tfsa + w_rrsp + w_marg) * dt;
        let actualTotal = tfsaWithdraw + rrspWithdraw + margWithdraw;

        if (targetTotal > 0.01 && actualTotal < targetTotal - 1.0) {
          // If stdDev > 0, try to cover the shortfall from other accounts
          if (stdDev > 0) {
            let shortfall = targetTotal - actualTotal;
            if (shortfall > 0.01 && marg > 0.01) {
              const extra = Math.min(marg, shortfall);
              marg -= extra;
              actualTotal += extra;
              shortfall -= extra;
            }
            if (shortfall > 0.01 && tfsa > 0.01) {
              const extra = Math.min(tfsa, shortfall);
              tfsa -= extra;
              actualTotal += extra;
              shortfall -= extra;
            }
            if (shortfall > 0.01 && rrsp > 0.01) {
              const extra = Math.min(rrsp, shortfall / 0.8);
              rrsp -= extra;
              actualTotal += extra * 0.8;
              shortfall -= extra * 0.8;
            }

            marg = Math.round(marg * 100) / 100;
            tfsa = Math.round(tfsa * 100) / 100;
            rrsp = Math.round(rrsp * 100) / 100;

            if (actualTotal < targetTotal - 1.0) {
              const fraction = Math.max(0, Math.min(0.99, actualTotal / targetTotal));
              results.push(prevEvent.year + dt * fraction);
              depleted = true;
              break;
            }
          }
        }

        year = currEvent.year;
      }

      if (depleted) {
        continue;
      }

      // 2. Fallback past the end of optimalData
      const maxYears = 150;
      while (year < maxYears) {
        const r_drawn = this.randomNormal(meanReturn, stdDev);
        const effGrowth = r_drawn - dividendYield;

        const dividends = marg > 0 ? marg * dividendYield : 0;
        tfsa = tfsa > 0 ? tfsa * (1 + effGrowth) * (1 + dividendYield) : 0;
        rrsp = rrsp > 0 ? rrsp * (1 + effGrowth) * (1 + dividendYield) : 0;
        marg = marg > 0 ? marg * (1 + effGrowth) : 0;

        if (tfsa <= 0.01 && rrsp <= 0.01 && marg <= 0.01) {
          results.push(year);
          depleted = true;
          break;
        }

        const targetPostTax = amountPerYear * Math.pow(1 + inflationRate, year);
        let netTargetPostTax = Math.max(0, targetPostTax - otherIncome - dividends);

        let w_tfsa = 0;
        let w_rrsp = 0;
        let w_marg = 0;

        if (marg > 0 && netTargetPostTax > 0) {
          const margPostTax = Math.min(marg * 0.9, netTargetPostTax);
          w_marg = margPostTax / 0.9;
          netTargetPostTax -= margPostTax;
        }
        if (tfsa > 0 && netTargetPostTax > 0) {
          w_tfsa = Math.min(tfsa, netTargetPostTax);
          netTargetPostTax -= w_tfsa;
        }
        if (rrsp > 0 && netTargetPostTax > 0) {
          const rrspPostTax = Math.min(rrsp * 0.8, netTargetPostTax);
          w_rrsp = rrspPostTax / 0.8;
          netTargetPostTax -= rrspPostTax;
        }

        let tfsaWithdraw = Math.min(tfsa, w_tfsa);
        tfsa -= tfsaWithdraw;

        let rrspWithdraw = Math.min(rrsp, w_rrsp);
        rrsp -= rrspWithdraw;

        let margWithdraw = Math.min(marg, w_marg);
        marg -= margWithdraw;

        tfsa = Math.round(tfsa * 100) / 100;
        rrsp = Math.round(rrsp * 100) / 100;
        marg = Math.round(marg * 100) / 100;

        const targetTotal = w_tfsa + w_rrsp + w_marg;
        const actualTotal = tfsaWithdraw + rrspWithdraw + margWithdraw;

        if (targetTotal > 0.01 && actualTotal < targetTotal - 1.0) {
          const fraction = Math.max(0, Math.min(0.99, actualTotal / targetTotal));
          results.push(year + fraction);
          depleted = true;
          break;
        }

        year += 1.0;
      }

      if (!depleted) {
        results.push(year);
      }
    }

    // Calculate metrics
    results.sort((a, b) => a - b);
    this.simulationResults = results;
    const sum = results.reduce((acc, v) => acc + v, 0);
    this.avgYears = sum / this.simulations;
    this.successRate = results.filter(v => v >= this.targetYears).length / this.simulations;

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
        interaction: {
          intersect: false,
          mode: 'index',
          axis: 'x'
        },
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

