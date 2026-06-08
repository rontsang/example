import {Component, ElementRef, ViewChild, HostListener, OnInit, OnDestroy} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
// import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";
import { PipeHelperService } from '../services/PipeHelperService';
import { debounceTime } from 'rxjs/operators';
import { LocalOptimizerService } from '../services/local-optimizer.service';
import { FORM_CONFIG } from '../config/form-config';

@Component({
  selector: 'app-userinput',
  templateUrl: './userinput.component.html',
  styleUrls: ['./userinput.component.css']
})
export class UserInputComponent implements OnInit, OnDestroy {
  provinces = [
    'Ontario',
    'Quebec',
    'British Columbia',
    'Alberta',
    'Manitoba',
    'Saskatchewan',
    'Nova Scotia',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Prince Edward Island',
    'Northwest Territories',
    'Yukon',
    'Nunavut'
  ];

  repeat = 0;
  updateNeeded = false;
  isSubmitted = false;
 
  inputValues = [
    { id: 1, value: 50 },
    // You can add more entries here as needed
  ];
 
  // @ViewChild('currencyFormatter') currencyFormatterDirective!: CurrencyFormatDirective;
 
  userForm = new FormGroup({
    tfsaAmount: new FormControl(FORM_CONFIG.defaults.tfsaAmount),
    rrspAmount: new FormControl(FORM_CONFIG.defaults.rrspAmount),
    income: new FormControl(FORM_CONFIG.defaults.income),
    margAmountPrincipal: new FormControl(FORM_CONFIG.defaults.margAmountPrincipal),
    margAmountCapitalGain: new FormControl(FORM_CONFIG.defaults.margAmountCapitalGain),
    dividendYield: new FormControl(FORM_CONFIG.defaults.dividendYield),
    interestRate: new FormControl(FORM_CONFIG.defaults.interestRate),
    inflationRate: new FormControl(FORM_CONFIG.defaults.inflationRate),
    amountPerYear: new FormControl(FORM_CONFIG.defaults.amountPerYear),
    variance: new FormControl(FORM_CONFIG.defaults.variance || 10),
    province: new FormControl(FORM_CONFIG.defaults.province)
  });
  currentValue = 0;

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
  isCalculatingMix = false;
 
  constructor(
    private elementRef: ElementRef,
    private dataService: DataService,
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private pipeHelper: PipeHelperService,
    private localOptimizer: LocalOptimizerService
  ) {
    // Grey out chart on user input change and trigger auto-optimization
    this.userForm.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((val) => {
      if (!this.isCalculatingMix && val.variance !== undefined) {
        this.updateMixFromVariance(Number(val.variance));
      }
      try {
        sessionStorage.setItem('userInputFormValues', JSON.stringify(val));
      } catch (e) {
        console.error("Failed to save form values to sessionStorage:", e);
      }
      this.sharedService.notifyChartIsObsolete(true);
      this.sharedDataService.updateInputData(this.userForm.value);
      this.sendForm();
    });}

  ngOnInit(): void {
    const savedValuesStr = sessionStorage.getItem('userInputFormValues');
    if (savedValuesStr) {
      try {
        const savedValues = JSON.parse(savedValuesStr);
        // Migrate old defaults (1,250,000 / 0), temporary (500k / 500k) or previous (1M / 500k) to final defaults (800k / 400k)
        const isOldDefault1 = (savedValues.margAmountPrincipal === 1250000 && (savedValues.margAmountCapitalGain === 0 || savedValues.margAmountCapitalGain === undefined));
        const isOldDefault2 = (savedValues.margAmountPrincipal === 500000 && savedValues.margAmountCapitalGain === 500000);
        const isOldDefault3 = (savedValues.margAmountPrincipal === 1000000 && savedValues.margAmountCapitalGain === 500000);
        let migrated = false;
        if (isOldDefault1 || isOldDefault2 || isOldDefault3) {
          savedValues.margAmountPrincipal = FORM_CONFIG.defaults.margAmountPrincipal;
          savedValues.margAmountCapitalGain = FORM_CONFIG.defaults.margAmountCapitalGain;
          migrated = true;
        }

        // Migrate old default inputs (0 income, 1% inflation, 80k/85k spend, 0% dividend) to new default values
        const isOldIncome = (savedValues.income === 0 || savedValues.income === undefined);
        const isOldInflation = (savedValues.inflationRate === 1.0 || savedValues.inflationRate === undefined);
        const isOldSpend = (savedValues.amountPerYear === 80000 || savedValues.amountPerYear === 85000 || savedValues.amountPerYear === undefined);
        const isOldDividend = (savedValues.dividendYield === 0.0 || savedValues.dividendYield === undefined);
        if (isOldIncome || isOldInflation || isOldSpend || isOldDividend) {
          if (isOldIncome) savedValues.income = FORM_CONFIG.defaults.income;
          if (isOldInflation) savedValues.inflationRate = FORM_CONFIG.defaults.inflationRate;
          if (isOldSpend) savedValues.amountPerYear = FORM_CONFIG.defaults.amountPerYear;
          if (isOldDividend) savedValues.dividendYield = FORM_CONFIG.defaults.dividendYield;
          migrated = true;
        }

        if (migrated) {
          try {
            sessionStorage.setItem('userInputFormValues', JSON.stringify(savedValues));
          } catch (se) {}
        }
        this.userForm.patchValue(savedValues, { emitEvent: false });
      } catch (e) {
        console.error("Failed to load form values from sessionStorage:", e);
      }
    }

    // Load custom asset mix from sessionStorage
    const savedMixStr = sessionStorage.getItem('userInputAssetMix');
    if (savedMixStr) {
      try {
        this.mix = JSON.parse(savedMixStr);
      } catch (e) {}
    }
    const savedMixExpandedStr = sessionStorage.getItem('userInputAssetMixExpanded');
    if (savedMixExpandedStr) {
      this.isAssetMixExpanded = savedMixExpandedStr === 'true';
    }

    // Subscribe to shared inputs to handle updates from bar-chart (slider/input badge)
    this.sharedDataService.currentInputData$.subscribe(data => {
      if (data) {
        const currentVals = this.userForm.value;
        const patchObj: any = {};
        let updated = false;

        if (data.variance !== undefined && Number(data.variance) !== Number(currentVals.variance)) {
          patchObj.variance = Number(data.variance);
          updated = true;
        }
        if (data.interestRate !== undefined && Number(data.interestRate) !== Number(currentVals.interestRate)) {
          patchObj.interestRate = Number(data.interestRate);
          updated = true;
        }
        if (data.dividendYield !== undefined && Number(data.dividendYield) !== Number(currentVals.dividendYield)) {
          patchObj.dividendYield = Number(data.dividendYield);
          updated = true;
        }

        if (updated) {
          this.userForm.patchValue(patchObj, { emitEvent: false });
          if (!this.isCalculatingMix) {
            this.updateMixFromVariance(Number(data.variance));
          }
          try {
            sessionStorage.setItem('userInputFormValues', JSON.stringify(this.userForm.value));
          } catch (e) {}
        }
      }
    });

    const formData = this.userForm.value;
    this.sharedDataService.updateInputData(formData);
 
    this.sharedService.inputUpdateNeeded$.subscribe(updateNeeded => {
      this.updateNeeded = updateNeeded;
      if (updateNeeded) {
        this.sharedService.notifyChartUsedNewData(true);
      }
    });
 
    // Run initial optimization on page load
    this.sendForm();
  }
 
  ngOnDestroy(): void {
  }
 
  getFormattedValue(value: number): string {
    return this.pipeHelper.formatCurrency(value);
  }

  onSubmit(){
    this.updateNeeded = false;
    this.sharedService.notifyChartUsedNewData(false);
    this.sendForm();
    this.sharedService.notifyCalculateTriggered();
  }

  sendForm() {
    this.isSubmitted = true;
    this.sharedService.notifyChartIsObsolete(false);

    const payload = {
      ...this.userForm.value,
      interestRate: Number(this.userForm.get('interestRate')?.value) / 100
    };

    /* Commented out HTTP request to backend to offload calculations to local frontend optimizer
    this.dataService.sendData(payload).subscribe(
      response => {
        console.log('Success!', response);
      },
      error => console.error('Error!', error)
    );

    this.http.post<any[]>('http://localhost:8081/submit-form', payload).subscribe(data => {
      this.sharedDataService.updateChartData(data);
    });
    */

    // Compute locally using the ported optimizer service
    const localData = this.localOptimizer.computeBurndownMinimization(payload);
    this.sharedDataService.updateChartData(localData);
  }

  toggleAssetMix() {
    this.isAssetMixExpanded = !this.isAssetMixExpanded;
    sessionStorage.setItem('userInputAssetMixExpanded', String(this.isAssetMixExpanded));
  }

  calculateVarianceFromMix() {
    this.isCalculatingMix = true;
    const hisaVal = Number(this.mix.hisa || 0);
    const bondsVal = Number(this.mix.bonds || 0);
    const usVal = Number(this.mix.usEquity || 0);
    const intlVal = Number(this.mix.intlEquity || 0);
    const specVal = Number(this.mix.speculative || 0);

    const total = hisaVal + bondsVal + usVal + intlVal + specVal;
    this.mixTotal = total;

    if (total > 0) {
      // Volatilities: HISA: 0%, Bonds: 5%, US: 15%, Intl: 18%, Spec: 25%
      const weightedSD = (hisaVal * 0 + bondsVal * 5 + usVal * 15 + intlVal * 18 + specVal * 25) / total;
      const weightedReturn = (hisaVal * 3.0 + bondsVal * 4.5 + usVal * 8.5 + intlVal * 7.5 + specVal * 10.0) / total;
      const weightedDividend = (hisaVal * 0.0 + bondsVal * 3.5 + usVal * 1.5 + intlVal * 2.5 + specVal * 0.0) / total;

      this.userForm.patchValue({
        variance: Math.round(weightedSD * 10) / 10,
        interestRate: Number(weightedReturn.toFixed(2)),
        dividendYield: Number(weightedDividend.toFixed(2))
      }, { emitEvent: false });
    } else {
      this.userForm.patchValue({
        variance: 0,
        interestRate: 3.0,
        dividendYield: 0.0
      }, { emitEvent: false });
    }

    try {
      sessionStorage.setItem('userInputAssetMix', JSON.stringify(this.mix));
      sessionStorage.setItem('userInputFormValues', JSON.stringify(this.userForm.value));
    } catch (e) {}

    this.sharedDataService.updateInputData(this.userForm.value);
    this.sendForm();
    this.isCalculatingMix = false;
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
    this.calculateVarianceFromMix();
  }

  updateMixFromVariance(v: number) {
    if (v === 0) {
      this.mix = { hisa: 100, bonds: 0, usEquity: 0, intlEquity: 0, speculative: 0 };
    } else if (v === 5) {
      this.mix = { hisa: 0, bonds: 100, usEquity: 0, intlEquity: 0, speculative: 0 };
    } else if (v === 10) {
      this.mix = { hisa: 10, bonds: 40, usEquity: 30, intlEquity: 20, speculative: 0 };
    } else if (v === 16) {
      this.mix = { hisa: 0, bonds: 10, usEquity: 60, intlEquity: 10, speculative: 20 };
    } else if (v === 25) {
      this.mix = { hisa: 0, bonds: 0, usEquity: 0, intlEquity: 0, speculative: 100 };
    } else {
      return;
    }
    this.mixTotal = 100;
    try {
      sessionStorage.setItem('userInputAssetMix', JSON.stringify(this.mix));
    } catch (e) {}
  }

  adjustValue(fieldName: string, delta: number) {
    const control = this.userForm.get(fieldName);
    if (control) {
      let currentVal = Number(control.value || 0);
      let newVal = Math.round((currentVal + delta) * 10) / 10;
      if (newVal < 0) newVal = 0;
      if (newVal > 25) newVal = 25; // standard sanity bounds
      control.setValue(newVal);
    }
  }
}
