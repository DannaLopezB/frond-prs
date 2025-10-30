import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalKardexComponent } from './modal-kardex.component';

describe('ModalKardexComponent', () => {
  let component: ModalKardexComponent;
  let fixture: ComponentFixture<ModalKardexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalKardexComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalKardexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
