import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationsPComponent } from './creations-p.component';

describe('CreationsPComponent', () => {
  let component: CreationsPComponent;
  let fixture: ComponentFixture<CreationsPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreationsPComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreationsPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
