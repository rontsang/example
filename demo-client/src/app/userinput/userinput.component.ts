import {Component, ElementRef, ViewChild} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
// import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";
import { PipeHelperService } from '../services/PipeHelperService';

@Component({
  selector: 'app-userinput',
  templateUrl: './userinput.component.html',
  styleUrls: ['./userinput.component.css']
})
export class UserInputComponent {
  provinces = ['Ontario','Alberta','Yukon']; // Add actual province names

  repeat = 0;
  updateNeeded = false;
  isSubmitted = false;

  sliderValueTfsa = 0;
  sliderValueRrsp = 0;
  sliderValueMargPrincipal = 0;
  sliderValueMargCapitalGain = 0;
  sliderValueIncome = 0;
  sliderValueInterestRate = 0;
  sliderValueAmountPerYear = 0;

  inputValues = [
    { id: 1, value: 50 },
    // You can add more entries here as needed
  ];

  // @ViewChild('currencyFormatter') currencyFormatterDirective!: CurrencyFormatDirective;

  userForm = new FormGroup({
    tfsaAmount: new FormControl(500000),
    rrspAmount: new FormControl(650000),
    income: new FormControl(5000),
    margAmountPrincipal: new FormControl(500000),
    margAmountCapitalGain: new FormControl(500000),
    interestRate: new FormControl(0.04),
    amountPerYear: new FormControl(75000),
    province: new FormControl(this.provinces[0])
  });
  currentValue = 0;


  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService,
    private pipeHelper: PipeHelperService
  ) {
    // Grey out chart on user input change
    this.userForm.valueChanges.subscribe(() => {
      this.sharedService.notifyChartIsObsolete(true);
      this.sharedDataService.updateInputData(this.userForm.value);
    });}

  ngOnInit(): void {
    const formData = this.userForm.value;
    this.sharedDataService.updateInputData(formData);

    this.sharedService.inputUpdateNeeded$.subscribe(updateNeeded => {
      if (updateNeeded && this.repeat < 5) {
        this.updateNeeded = true;
        this.sharedService.notifyChartUsedNewData(true);

        console.log("is red 1: ", this.updateNeeded);
        const tfsaAmount = Number(this.userForm.get('tfsaAmount')?.value);
        const rrspAmount = Number(this.userForm.get('rrspAmount')?.value);
        const margAmountPrincipal = Number(this.userForm.get('margAmountPrincipal')?.value);
        const margAmountCapitalGain = Number(this.userForm.get('margAmountCapitalGain')?.value);
        const total = tfsaAmount + rrspAmount + margAmountPrincipal + margAmountCapitalGain;
        const interestRate = Number(this.userForm.get('interestRate')?.value);
        const newAmountPerYear = Number(this.userForm.get('amountPerYear')?.value) * 2;
        console.log("Yo whats up", newAmountPerYear);
        if (total * interestRate * 1.5 < Number(this.userForm.get('amountPerYear')?.value)) {
          console.log("Yo whats up 2");
          this.userForm.patchValue({
            amountPerYear: total * interestRate * 1.5
          });
        } else {
          console.log("Yo whats up 3");
          this.userForm.patchValue({
            amountPerYear: newAmountPerYear
          });
        }
        this.repeat++;
        this.sendForm();
      }
    });
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
    const textInput: HTMLInputElement | null = document.getElementById(textInputId) as HTMLInputElement;
    // if (textInput) {
      // textInput.value = formattedValue;
    // }
    textInput.value = this.getFormattedValue(numericValue);
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
  }

  sendForm() {
    this.isSubmitted = true;
    this.sharedService.notifyChartIsObsolete(false);
    this.dataService.sendData(this.userForm.value).subscribe(
      response => {
        console.log('Success!', response);
      },
      error => console.error('Error!', error)
    );

    this.http.post<any[]>('http://localhost:8081/submit-form', this.userForm.value).subscribe(data => {
      this.sharedDataService.updateChartData(data);
    });
  }
}
