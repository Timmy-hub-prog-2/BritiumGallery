import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentRegisterComponent } from './payment-register.component';

describe('PaymentRegisterComponent', () => {
  let component: PaymentRegisterComponent;
  let fixture: ComponentFixture<PaymentRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
