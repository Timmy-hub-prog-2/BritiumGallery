import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrderRefundListComponent } from './admin-order-refund-list.component';

describe('AdminOrderRefundListComponent', () => {
  let component: AdminOrderRefundListComponent;
  let fixture: ComponentFixture<AdminOrderRefundListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminOrderRefundListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminOrderRefundListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
