import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KardexPrimalComponent } from './kardex-primal.component';

describe('KardexPrimalComponent', () => {
  let component: KardexPrimalComponent;
  let fixture: ComponentFixture<KardexPrimalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KardexPrimalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KardexPrimalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
