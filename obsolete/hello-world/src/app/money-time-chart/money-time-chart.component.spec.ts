import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyTimeChartComponent } from './money-time-chart.component';

describe('MoneyTimeChartComponent', () => {
  let component: MoneyTimeChartComponent;
  let fixture: ComponentFixture<MoneyTimeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyTimeChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MoneyTimeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
