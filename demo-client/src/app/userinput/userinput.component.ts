import {Component, ElementRef, ViewChild} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";

@Component({
  selector: 'app-userinput',
  templateUrl: './userinput.component.html',
  styleUrls: ['./userinput.component.css']
})
export class UserInputComponent {
  provinces = ['Ontario','Alberta','Yukon']; // Add actual province names
  tfsaAmount = 100000;
  sharedValue = 50;
  repeat = 0;
  updateNeeded = false;


  userForm = new FormGroup({
    linkedValue: new FormControl(),
    tfsaAmount: new FormControl(500000),
    rrspAmount: new FormControl(650000),
    income: new FormControl(5000),
    margAmountPrincipal: new FormControl(500000),
    margAmountCapitalGain: new FormControl(500000),
    interestRate: new FormControl(0.04),
    amountPerYear: new FormControl(75000),
    province: new FormControl(this.provinces[0])
  });

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

  onInputChange() {
    this.userForm.get('linkedValue')?.updateValueAndValidity();
    // this.cdRef.detectChanges();
    this.http.post<any[]>('http://localhost:8081/submit-form', this.userForm.value).subscribe(data => {
      console.log("returned data: ")
      console.log(data)
      this.sharedDataService.updateChartData(data);
    });
  }

  logToLinear(logValue: number): number {
    return Math.pow(2, logValue / 2000);
  }
  sliderValue = 50; // Default value

  @ViewChild('currencyInput') textInput!: ElementRef;

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  onSliderChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value);
    this.userForm.get('tfsaAmount')?.setValue(numericValue);
    this.formatTextInput(numericValue);
  }

  private formatTextInput(value: number): void {
    if (this.textInput) {
      this.textInput.nativeElement.value = this.formatCurrency(value);
    }
  }

  onTextChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sliderValue = Number(input.value);
  }

  constructor(
    private dataService: DataService,
    private http: HttpClient,
    private sharedDataService: SharedDataService,
    private sharedService: SharedService
  ) {
    this.userForm.valueChanges.subscribe(() => {
    // Notify that the chart needs to be updated (greyed out) on user input change
    this.sharedService.notifyChartUpdateNeeded(true);
    console.log("User input changed");
    const formData = this.userForm.value;
    this.sharedDataService.updateInputData(formData);
  });}


  isSubmitted = false;

  onSubmit(){
    this.updateNeeded = false;
    this.sharedService.notifyChartUsedNewData(false);
    this.sendForm();
  }

  sendForm() {
    console.log("isRed", this.updateNeeded);
    this.isSubmitted = true;
    this.sharedService.notifyChartUpdateNeeded(false);
    console.log('submitted!');
    console.log(this.userForm.value);
    this.dataService.sendData(this.userForm.value).subscribe(
      response => {
        console.log('Success!', response);
      },
      error => console.error('Error!', error)
    );
    console.log("isRed3", this.updateNeeded);

    this.http.post<any[]>('http://localhost:8081/submit-form', this.userForm.value).subscribe(data => {
      console.log("returned data: ")
      console.log(data)
      this.sharedDataService.updateChartData(data);
      console.log("isRed4", this.updateNeeded);
    });
    console.log("isRed5", this.updateNeeded);
  }
}
