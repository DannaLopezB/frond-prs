import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalCostFormModalComponent } from './additional-cost-form-modal.component';

describe('AdditionalCostFormModalComponent', () => {
  let component: AdditionalCostFormModalComponent;
  let fixture: ComponentFixture<AdditionalCostFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalCostFormModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdditionalCostFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
