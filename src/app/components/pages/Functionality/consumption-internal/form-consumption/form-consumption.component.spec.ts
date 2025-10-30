import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormConsumptionComponent } from './form-consumption.component';

describe('FormConsumptionComponent', () => {
  let component: FormConsumptionComponent;
  let fixture: ComponentFixture<FormConsumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormConsumptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FormConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
