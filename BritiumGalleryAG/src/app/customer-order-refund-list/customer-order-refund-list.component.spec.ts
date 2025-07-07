import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOrderRefundListComponent } from './customer-order-refund-list.component';

describe('CustomerOrderRefundListComponent', () => {
  let component: CustomerOrderRefundListComponent;
  let fixture: ComponentFixture<CustomerOrderRefundListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerOrderRefundListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerOrderRefundListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
