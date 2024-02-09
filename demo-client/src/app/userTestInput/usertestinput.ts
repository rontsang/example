import {Component, ElementRef, ViewChild} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";
import {Subscription} from "rxjs";
import {ChartData} from "chart.js";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-userinput-test',
  templateUrl: './usertestinput.component.html',
  styleUrls: ['./usertestinput.component.css'],
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule]
})

export class Usertestinput {
  userForm = new FormGroup({
    // linkedValue: new FormControl(),
    tfsaWithdraw: new FormControl({value: 40000, disabled: false}),
    rrspWithdraw: new FormControl(40000),
    margWithdraw: new FormControl(40000),
    tfsaAmount: new FormControl(),
    rrspAmount: new FormControl(),
    income: new FormControl(),
    margAmountPrincipal: new FormControl(),
    margAmountCapitalGain: new FormControl(),
    interestRate: new FormControl(),
    province: new FormControl()
  });
  sliderValue = 50; // Default value
  subscription?: Subscription;
  data: ChartData[] = [];

  isInputTFSADisabled = false;
  isInputRRSPDisabled = false;
  isInputMARGDisabled = false;

  stage = 1;

  ngOnInit(): void {
    this.stageOneLogic();
  }

  private stageOneLogic() {
    this.subscription = this.sharedDataService.currentInputData$.subscribe((data) => {
      console.log("GOT HERE 2: ", this.data);
      this.userForm.patchValue({
        tfsaAmount: data.tfsaAmount,
        rrspAmount: data.rrspAmount,
        income: data.income,
        margAmountPrincipal: data.margAmountPrincipal,
        margAmountCapitalGain: data.margAmountCapitalGain,
        interestRate: data.interestRate,
        province: data.province
      });
      this.data = data; // Data received from sibling1
      console.log("User test data received 2: ", this.data);
      console.log("USER TEST FORM: ", this.userForm.value);

      this.disableInputsIfZeroBalance(data);
    });
  }

  private disableInputsIfZeroBalance(data: InputData) {
    const tfsaWithdraw = this.userForm.get('tfsaWithdraw');
    if (data.tfsaAmount != null && data.tfsaAmount == 0) {
      this.isInputTFSADisabled = true;
      tfsaWithdraw?.disable();
    } else {
      this.isInputTFSADisabled = false;
      tfsaWithdraw?.enable();
    }
    if (data.rrspAmount != null && data.rrspAmount == 0) {
      this.isInputRRSPDisabled = true;
    } else {
      this.isInputRRSPDisabled = false;
    }
    if (data.margAmountPrincipal != null && data.margAmountCapitalGain != null
      && data.margAmountPrincipal == 0 && data.margAmountCapitalGain == 0) {
      this.isInputMARGDisabled = true;
    } else {
      this.isInputMARGDisabled = false;
    }
  }

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
    this.sharedService.notifyChartUpdateNeeded(true); //change the chart that blanks
    console.log("User input changed user test side");
    const formData = this.userForm.value;
    // this.sharedDataService.updateInputData(formData); // Change this for new chart
  });}


  isSubmitted = false;

  onSubmit(){
    this.sendForm();
  }

  sendForm() {
    this.isSubmitted = true;
    // this.sharedService.notifyChartUpdateNeeded(false);
    console.log('submitted!');
    console.log(this.userForm.value);

    this.http.post<any[]>('http://localhost:8081/user-test', this.userForm.value).subscribe(data => {
      console.log("returned data: ")
      console.log(data)
      this.sharedDataService.updateChartData2(data, this.stage);
    });
  }
}

interface InputData {
  tfsaAmount?: number;
  rrspAmount?: number;
  income?: number;
  margAmountPrincipal?: number;
  margAmountCapitalGain?: number;
  interestRate?: number;
  province?: string;
}
