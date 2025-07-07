import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOrderRefundComponent } from './customer-order-refund.component';

describe('CustomerOrderRefundComponent', () => {
  let component: CustomerOrderRefundComponent;
  let fixture: ComponentFixture<CustomerOrderRefundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerOrderRefundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerOrderRefundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
