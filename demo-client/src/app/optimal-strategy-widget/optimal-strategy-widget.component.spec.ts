import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptimalStrategyWidgetComponent } from './optimal-strategy-widget.component';

describe('OptimalStrategyWidgetComponent', () => {
  let component: OptimalStrategyWidgetComponent;
  let fixture: ComponentFixture<OptimalStrategyWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptimalStrategyWidgetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OptimalStrategyWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
