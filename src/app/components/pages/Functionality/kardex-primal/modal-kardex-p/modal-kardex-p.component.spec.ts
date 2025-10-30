import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalKardexPComponent } from './modal-kardex-p.component';

describe('ModalKardexPComponent', () => {
  let component: ModalKardexPComponent;
  let fixture: ComponentFixture<ModalKardexPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalKardexPComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalKardexPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
