import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KardexProcessComponent } from './kardex-process.component';

describe('KardexProcessComponent', () => {
  let component: KardexProcessComponent;
  let fixture: ComponentFixture<KardexProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KardexProcessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KardexProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
