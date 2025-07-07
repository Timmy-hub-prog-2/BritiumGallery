import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrderRefundComponent } from './admin-order-refund.component';

describe('AdminOrderRefundComponent', () => {
  let component: AdminOrderRefundComponent;
  let fixture: ComponentFixture<AdminOrderRefundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminOrderRefundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminOrderRefundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
