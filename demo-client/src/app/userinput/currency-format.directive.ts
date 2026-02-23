import {Directive, HostListener, ElementRef, Self, AfterViewInit, SimpleChanges, Input} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyFormat]',
  exportAs: 'appCurrencyFormat'  // Add this line
})
export class CurrencyFormatDirective implements AfterViewInit{
  constructor(@Self() private ngControl: NgControl, private el: ElementRef) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    this.ngControl.control?.setValue(numericValue, { emitEvent: false });
    const formattedValue = this.formatCurrency(numericValue);
    this.el.nativeElement.value = formattedValue;
  }

  private parseValue(value: string): number {
    return Number(value.replace(/[^0-9.-]/g, '')); // Remove non-numeric characters
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  public formatAndSetValue(value: number): void {
    console.log("formatAndSetValue: ", value);
    const formattedValue = this.formatCurrency(value);
    this.el.nativeElement.value = formattedValue;
    console.log(`Formatted value: ${formattedValue}`);
    // Update the form control's value without emitting an event to avoid an infinite loop
    this.ngControl.control?.setValue(value, { emitEvent: false });
  }

  @HostListener('blur')
  onBlur(): void {
    const value = this.ngControl.control?.value;
    this.el.nativeElement.value = this.formatCurrency(value);
  }

  @HostListener('focus')
  onFocus(): void {
    const value = this.ngControl.control?.value;
    this.el.nativeElement.value = value ? value.toString().replace(/[^0-9.-]/g, '') : '';
  }

  ngAfterViewInit(): void {
    this.ngControl.control?.valueChanges.subscribe(value => {
      const numericValue = this.parseValue(value);
      const formattedValue = this.formatCurrency(numericValue);
      this.el.nativeElement.value = formattedValue;
    });
    const initialValue = this.ngControl.control?.value;
    if (initialValue != null) {
      this.el.nativeElement.value = this.formatCurrency(initialValue);
    }
  }
}
