import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PipeHelperService {
  constructor() { }

  formatCurrency(value: number): string {
    // Implementation based on your desired currency formatting logic
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
}
