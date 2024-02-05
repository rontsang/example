import {Component, ElementRef, ViewChild} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { DataService } from './../data.service';
import {HttpClient} from "@angular/common/http";
import {SharedDataService} from "../services/SharedDataService";
import { CurrencyFormatDirective } from './currency-format.directive';
import {SharedService} from "../services/SharedService";

@Component({
  selector: 'app-userinput-test',
  templateUrl: './usertestinput.component.html',
  styleUrls: ['./usertestinput.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule]
})

export class Usertestinput {
  userForm = new FormGroup({
    // linkedValue: new FormControl(),
    tfsaAmount: new FormControl(20000),
    rrspAmount: new FormControl(20000),
    margAmount: new FormControl(20000),
  });
  sliderValue = 50; // Default value
  ngOnInit(): void {
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
    this.sharedService.notifyChartUpdateNeeded(true);
    console.log("User input changed");
    const formData = this.userForm.value;
    this.sharedDataService.updateInputData(formData);
  });}


  isSubmitted = false;

  onSubmit(){
    this.sendForm();
  }

  sendForm() {
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

    this.http.post<any[]>('http://localhost:8081/submit-form', this.userForm.value).subscribe(data => {
      console.log("returned data: ")
      console.log(data)
      this.sharedDataService.updateChartData(data);
    });
  }
}
