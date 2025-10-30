import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumptionInternalComponent } from './consumption-internal.component';

describe('ConsumptionInternalComponent', () => {
  let component: ConsumptionInternalComponent;
  let fixture: ComponentFixture<ConsumptionInternalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsumptionInternalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsumptionInternalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
