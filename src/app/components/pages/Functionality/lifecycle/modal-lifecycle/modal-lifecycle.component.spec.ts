import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalLifecycleComponent } from './modal-lifecycle.component';

describe('ModalLifecycleComponent', () => {
  let component: ModalLifecycleComponent;
  let fixture: ComponentFixture<ModalLifecycleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLifecycleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModalLifecycleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
