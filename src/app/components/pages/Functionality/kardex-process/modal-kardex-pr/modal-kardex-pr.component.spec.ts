import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalKardexPrComponent } from './modal-kardex-pr.component';

describe('ModalKardexPrComponent', () => {
  let component: ModalKardexPrComponent;
  let fixture: ComponentFixture<ModalKardexPrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalKardexPrComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalKardexPrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
