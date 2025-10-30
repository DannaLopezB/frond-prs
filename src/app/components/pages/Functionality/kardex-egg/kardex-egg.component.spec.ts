import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KardexEggComponent } from './kardex-egg.component';

describe('KardexEggComponent', () => {
  let component: KardexEggComponent;
  let fixture: ComponentFixture<KardexEggComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KardexEggComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KardexEggComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
