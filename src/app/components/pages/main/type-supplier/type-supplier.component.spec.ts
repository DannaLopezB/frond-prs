import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeSupplierComponent } from './type-supplier.component';

describe('TypeSupplierComponent', () => {
  let component: TypeSupplierComponent;
  let fixture: ComponentFixture<TypeSupplierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeSupplierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TypeSupplierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
