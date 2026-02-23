import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roundToTen',
  standalone: true
})

export class RoundToTenPipe implements PipeTransform {

  transform(value: number): number {
    return Math.round(value / 10) * 10;
  }

}
