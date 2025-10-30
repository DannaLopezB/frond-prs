import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EggProductionFormComponent } from './egg-production-form.component';

describe('EggProductionFormComponent', () => {
  let component: EggProductionFormComponent;
  let fixture: ComponentFixture<EggProductionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EggProductionFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EggProductionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
