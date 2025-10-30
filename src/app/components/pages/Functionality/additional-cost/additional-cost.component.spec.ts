import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalCostComponent } from './additional-cost.component';

describe('AdditionalCostComponent', () => {
  let component: AdditionalCostComponent;
  let fixture: ComponentFixture<AdditionalCostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalCostComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdditionalCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
