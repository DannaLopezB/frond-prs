import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VaccineApplicationsComponent } from './vaccine-aplications.component';



describe('VaccineApplicationsComponent', () => {
  let component: VaccineApplicationsComponent;
  let fixture: ComponentFixture<VaccineApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VaccineApplicationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VaccineApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
