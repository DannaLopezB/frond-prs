import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelSaleComponent } from './model-sale.component';

describe('ModelSaleComponent', () => {
  let component: ModelSaleComponent;
  let fixture: ComponentFixture<ModelSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelSaleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModelSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
