import {Component, ElementRef, ViewChild} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
// import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";
import { PipeHelperService } from '../services/PipeHelperService';
import { debounceTime } from 'rxjs/operators';
import { LocalOptimizerService } from '../services/local-optimizer.service';

@Component({
  selector: 'app-userinput',
  templateUrl: './userinput.component.html',
  styleUrls: ['./userinput.component.css']
})
export class UserInputComponent {
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

  sliderValueTfsa = 0;
  sliderValueRrsp = 0;
  sliderValueMargPrincipal = 0;
  sliderValueMargCapitalGain = 0;
  sliderValueDividendYield = 0;
  sliderValueIncome = 0;
  sliderValueInterestRate = 0;
  sliderValueAmountPerYear = 0;

  inputValues = [
    { id: 1, value: 50 },
    // You can add more entries here as needed
  ];

  // @ViewChild('currencyFormatter') currencyFormatterDirective!: CurrencyFormatDirective;

  maxAdditionalIncomeSliderValue = 20000;

  userForm = new FormGroup({
    tfsaAmount: new FormControl(400000),
    rrspAmount: new FormControl(500000),
    income: new FormControl(0),
    margAmountPrincipal: new FormControl(1100000),
    margAmountCapitalGain: new FormControl(500000),
    dividendYield: new FormControl(0.0),
    interestRate: new FormControl(3.0),
    amountPerYear: new FormControl(60000),
    province: new FormControl(this.provinces[0])
  });
  currentValue = 0;


  syncSliderValues(val: any) {
    this.sliderValueTfsa = Number(val.tfsaAmount || 0);
    this.sliderValueRrsp = Number(val.rrspAmount || 0);
    this.sliderValueMargPrincipal = Number(val.margAmountPrincipal || 0);
    this.sliderValueMargCapitalGain = Number(val.margAmountCapitalGain || 0);
    this.sliderValueDividendYield = Number(val.dividendYield || 0);
    this.sliderValueIncome = Number(val.income || 0);
    this.maxAdditionalIncomeSliderValue = Math.max(20000, this.sliderValueIncome);
    this.sliderValueInterestRate = Number(val.interestRate || 0);
    this.sliderValueAmountPerYear = Number(val.amountPerYear || 0);
  }

  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private pipeHelper: PipeHelperService,
    private localOptimizer: LocalOptimizerService
  ) {
    // Sync slider values on load
    this.syncSliderValues(this.userForm.value);

    // Grey out chart on user input change and trigger auto-optimization
    this.userForm.valueChanges.pipe(
      debounceTime(300)
    ).subscribe((val) => {
      this.syncSliderValues(val);
      this.sharedService.notifyChartIsObsolete(true);
      this.sharedDataService.updateInputData(this.userForm.value);
      this.sendForm();
    });}

  ngOnInit(): void {
    const formData = this.userForm.value;
    this.syncSliderValues(formData);
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

  onSliderChange(event: Event, formControlName: string) {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value);

    // Update the form control value
    this.userForm.get(formControlName)?.setValue(numericValue);

    // Format the display value manually for now
    const formattedValue = this.getFormattedValue(numericValue);

    // Directly update the corresponding text input (if needed)
    const textInputId = `${formControlName}Number`; // Ensure the ID matches your input's ID
    const textInput = document.getElementById(textInputId) as HTMLInputElement;
    if (textInput) {
      textInput.value = this.getFormattedValue(numericValue);
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
}
