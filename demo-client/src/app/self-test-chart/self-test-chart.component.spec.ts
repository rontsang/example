import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfTestChartComponent } from './self-test-chart.component';

describe('SelfTestChartComponent', () => {
  let component: SelfTestChartComponent;
  let fixture: ComponentFixture<SelfTestChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelfTestChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelfTestChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
