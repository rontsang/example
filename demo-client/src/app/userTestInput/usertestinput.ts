import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";
import {Subscription} from "rxjs";
import {ChartData} from "chart.js";
import { CommonModule } from '@angular/common';
import { LocalOptimizerService } from '../services/local-optimizer.service';

@Component({
  selector: 'app-userinput-test',
  templateUrl: './usertestinput.component.html',
  styleUrls: ['./usertestinput.component.css'],
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule, FormsModule]
})

export class Usertestinput {
  endStateForm = new FormGroup({
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
    province: new FormControl(),
    startingYear: new FormControl()
  });
  sliderValue = 50; // Default value
  subscription?: Subscription;
  data: ChartData[] = [];

  isInputTFSADisabled = false;
  isInputRRSPDisabled = false;
  isInputMARGDisabled = false;

  stage = 1;

  @Input() startState!: State; // Use the 'State' interface as the type
  @Output() notifyParent: EventEmitter<any> = new EventEmitter();


  ngOnInit(): void {
    this.stageOneLogic();
  }

  private stageOneLogic() {
    console.log("starting state: ", this.startState);
    this.subscription = this.sharedDataService.currentInputData$.subscribe((data) => {
      console.log("GOT HERE 2: ", this.data);
      this.userForm.patchValue({
        tfsaAmount: this.startState.tfsaAmount,
        rrspAmount: this.startState.rrspAmount,
        income: this.startState.income,
        margAmountPrincipal: this.startState.margAmountPrincipal,
        margAmountCapitalGain: this.startState.margAmountCapitalGain,
        interestRate: this.startState.interestRate,
        province: this.startState.province
      });
      this.data = data as any; // Data received from sibling1
      console.log("User test data received 2: ", this.data);
      console.log("USER TEST FORM: ", this.userForm.value);

      this.disableInputsIfZeroBalance();
    });
  }

  private disableInputsIfZeroBalance() {
    const tfsaWithdraw = this.userForm.get('tfsaWithdraw');
    const rrspWithdraw = this.userForm.get('rrspWithdraw');
    const margWithdraw = this.userForm.get('margWithdraw');

    if (this.startState.tfsaAmount != null && this.startState.tfsaAmount < 100) {
      this.isInputTFSADisabled = true;
      tfsaWithdraw?.disable();
      tfsaWithdraw?.setValue(0);
    } else {
      this.isInputTFSADisabled = false;
      tfsaWithdraw?.enable();
    }
    if (this.startState.rrspAmount != null && this.startState.rrspAmount < 100) {
      this.isInputRRSPDisabled = true;
      rrspWithdraw?.disable();
      rrspWithdraw?.setValue(0);
    } else {
      this.isInputRRSPDisabled = false;
      rrspWithdraw?.enable();
    }
    if (this.startState.margAmountPrincipal != null && this.startState.margAmountCapitalGain != null
      && this.startState.margAmountPrincipal < 100 && this.startState.margAmountCapitalGain < 100) {
      this.isInputMARGDisabled = true;
      margWithdraw?.disable();
      margWithdraw?.setValue(0);
    } else {
      this.isInputMARGDisabled = false;
      margWithdraw?.enable();
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
    private sharedService: SharedService,
    private localOptimizer: LocalOptimizerService
  ) {
    this.userForm.valueChanges.subscribe(() => {
    // Notify that the chart needs to be updated (greyed out) on user input change
    this.sharedService.notifyChartIsObsolete(true); //change the chart that blanks
    console.log("User input changed user test side");
    const formData = this.userForm.value;
    // this.sharedDataService.updateInputData(formData); // Change this for new chart
  });}


  isSubmitted = false;
  endingState: State = {
    income: 0,
    interestRate: 0,
    margAmountCapitalGain: 0,
    margAmountPrincipal: 0,
    province: null,
    tfsaAmount: 0,
    rrspAmount: 0,
    startingYear: 0
  };

  onSubmit(){
    this.sendForm();
    this.sharedService.notifyCalculateTriggered();
  }

  sendStageToParent(stage: number) {
    this.notifyParent.emit(stage);
  }

  sendEndStateToParent(endingState: State) {
    this.notifyParent.emit(endingState);
  }

  roundToNearestHundred(value: number): number {
    return Math.round(value / 100) * 100;
  }

  sendForm() {
    this.isSubmitted = true;
    // this.sharedService.notifyChartUpdateNeeded(false);
    console.log('submitted!');
    console.log(this.userForm.value);

    const payload = {
      ...this.userForm.value,
      interestRate: Number(this.userForm.get('interestRate')?.value) / 100
    };

    /* Commented out HTTP request to backend to offload calculations to local frontend optimizer
    this.http.post<any[]>('http://localhost:8081/user-test', payload).subscribe(data => {
      console.log("returned data: ")
      console.log(data)
      this.sharedDataService.updateChartData2(data, this.stage);
      // update stage
      this.stage++;
      console.log("Stage is" + this.stage);
      // this.sendStageToParent(this.stage);

      // update end state form
      // need information from the previous user input
      // get last data object from the array
      const endState = data[data.length - 1];
      console.log("End state: ", endState);

      this.endingState = {
        tfsaAmount: 0,
        rrspAmount: 0,
        margAmountPrincipal: 0,
        margAmountCapitalGain: 0,
        income: endState.accountState.income,
        interestRate: endState.accountState.interestRate * 100,
        province: endState.accountState.province,
        startingYear: endState.year
      };
      endState.accountState.accounts.forEach((account: Account) => {
        // Using switch-case to match the account name and assign values accordingly
        switch (account.accountName) {
          case "TFSA":
            this.endingState.tfsaAmount = account.principalAmount;
            break;
          case "RRSP":
            this.endingState.rrspAmount = account.principalAmount;
            break;
          case "MARG":
            this.endingState.margAmountPrincipal = account.totalValue ?? (account.principalAmount + (account.capitalGainAmount ?? 0));
            // Assuming capitalGainAmount is optional, use nullish coalescing operator to default to 0
            this.endingState.margAmountCapitalGain = account.capitalGainAmount ?? 0;
            break;
          // Add cases for other account types as necessary
          default:
            // Handle unknown account names or log a warning
            console.warn(`Unknown account name: ${account.accountName}`);
        }
      });
      this.sendEndStateToParent(this.endingState);
    });
    */

    // Compute locally using the ported optimizer service
    const data = this.localOptimizer.computeBurndownSimulation(payload);
    if (data) {
      console.log("returned data: ");
      console.log(data);
      this.sharedDataService.updateChartData2(data, this.stage);
      // update stage
      this.stage++;
      console.log("Stage is" + this.stage);
      // this.sendStageToParent(this.stage);

      // update end state form
      // need information from the previous user input
      // get last data object from the array
      const endState = data[data.length - 1];
      console.log("End state: ", endState);

      this.endingState = {
        tfsaAmount: 0,
        rrspAmount: 0,
        margAmountPrincipal: 0,
        margAmountCapitalGain: 0,
        income: endState.accountState.income,
        interestRate: endState.accountState.interestRate * 100,
        province: endState.accountState.province,
        startingYear: endState.year
      };
      endState.accountState.accounts.forEach((account: Account) => {
        // Using switch-case to match the account name and assign values accordingly
        switch (account.accountName) {
          case "TFSA":
            this.endingState.tfsaAmount = account.principalAmount;
            break;
          case "RRSP":
            this.endingState.rrspAmount = account.principalAmount;
            break;
          case "MARG":
            this.endingState.margAmountPrincipal = account.totalValue ?? (account.principalAmount + (account.capitalGainAmount ?? 0));
            // Assuming capitalGainAmount is optional, use nullish coalescing operator to default to 0
            this.endingState.margAmountCapitalGain = account.capitalGainAmount ?? 0;
            break;
          // Add cases for other account types as necessary
          default:
            // Handle unknown account names or log a warning
            console.warn(`Unknown account name: ${account.accountName}`);
        }
      });
      this.sendEndStateToParent(this.endingState);
    } else {
      console.warn('Local optimizer simulation returned null/empty result.');
      this.sharedDataService.updateChartData2(null as any, this.stage);
    }
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

interface Account {
  accountName: string;
  type: string;
  principalAmount: number;
  capitalGainAmount?: number;
  totalValue?: number;
}
