import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EggProductionComponent } from './egg-production.component';

describe('EggProductionComponent', () => {
  let component: EggProductionComponent;
  let fixture: ComponentFixture<EggProductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EggProductionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EggProductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
