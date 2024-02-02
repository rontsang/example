import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-optimal-strategy-widget',
  standalone: true,
  imports: [],
  templateUrl: './optimal-strategy-widget.component.html',
  styleUrl: './optimal-strategy-widget.component.css'
})
export class OptimalStrategyWidgetComponent {
  @Input() strategies: WithdrawalStrategy[] = []; // Array of strategy objects passed from parent
}

export interface WithdrawalStrategy {
  startYear: number;
  endYear: number;
  withdrawals: number[];
}
