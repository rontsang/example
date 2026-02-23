import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplaywindowComponent } from './displaywindow.component';

describe('DisplaywindowComponent', () => {
  let component: DisplaywindowComponent;
  let fixture: ComponentFixture<DisplaywindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplaywindowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DisplaywindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
