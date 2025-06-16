import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseVerificationComponent } from './choose-verification.component';

describe('ChooseVerificationComponent', () => {
  let component: ChooseVerificationComponent;
  let fixture: ComponentFixture<ChooseVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChooseVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChooseVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
