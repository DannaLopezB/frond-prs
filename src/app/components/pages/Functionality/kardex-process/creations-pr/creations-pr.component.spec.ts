import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationsPrComponent } from './creations-pr.component';

describe('CreationsPrComponent', () => {
  let component: CreationsPrComponent;
  let fixture: ComponentFixture<CreationsPrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreationsPrComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreationsPrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
