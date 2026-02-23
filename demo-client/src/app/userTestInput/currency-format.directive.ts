import {Directive, HostListener, ElementRef, Self, AfterViewInit} from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyFormat]'
})
export class CurrencyFormatDirective implements AfterViewInit{

  constructor(@Self() private ngControl: NgControl, private el: ElementRef) {}

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const numericValue = this.parseValue(value);
    const formattedValue = this.formatCurrency(numericValue);
    if (this.ngControl.valueAccessor) {
      this.ngControl.valueAccessor.writeValue(formattedValue);
    }
    this.ngControl.control?.setValue(numericValue, { emitEvent: false });
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
    const value = this.ngControl.control?.value;
    if (value != null) {
      this.el.nativeElement.value = this.formatCurrency(value);
    }
  }
}
