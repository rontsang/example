import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormsModule } from '@angular/forms';
import { DataService } from './../data.service';

@Component({
  selector: 'app-userinput',
  templateUrl: './userinput.component.html',
  styleUrls: ['./userinput.component.css']
})
export class UserInputComponent {
  provinces = ['Ontario','Alberta','Yukon']; // Add actual province names
  tfsaAmount = 100000;

  sharedValue = 50;

  userForm = new FormGroup({
    linkedValue: new FormControl(),
    tfsaAmount: new FormControl(100000),
    rrspAmount: new FormControl(100000),
    margAmountPrincipal: new FormControl(50000),
    margAmountCapitalGain: new FormControl(50000),
    interestRate: new FormControl(0.05),
    amountPerYear: new FormControl(60000),
    province: new FormControl(this.provinces[0])
  });

  onInputChange() {
    this.userForm.get('linkedValue')?.updateValueAndValidity();
    // this.cdRef.detectChanges();
  }

  // onSliderChange(value: number) {
  //   console.log(value);
  //   this.tfsaAmount = this.logToLinear(value);
  //   console.log(this.tfsaAmount);
  // }
  logToLinear(logValue: number): number {
    return Math.pow(2, logValue / 2000);
  }
  sliderValue = 50; // Default value

  onSliderChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sliderValue = Number(input.value);
  }

  onTextChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sliderValue = Number(input.value);
  }

  constructor(private dataService: DataService) { }

  isSubmitted = false;

  onSubmit() {
    this.isSubmitted = true;
    console.log('submitted!');
    console.log(this.userForm.value);
    this.dataService.sendData(this.userForm.value).subscribe(
      response => {
        console.log('Success!', response);
      },
      error => console.error('Error!', error)
    );
  }
}
