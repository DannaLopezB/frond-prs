import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HenComponent } from './hen.component';

describe('HenComponent', () => {
  let component: HenComponent;
  let fixture: ComponentFixture<HenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
