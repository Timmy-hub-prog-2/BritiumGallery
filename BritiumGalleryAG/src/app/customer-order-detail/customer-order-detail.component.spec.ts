import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerOrderDetailComponent } from './customer-order-detail.component';

describe('CustomerOrderDetailComponent', () => {
  let component: CustomerOrderDetailComponent;
  let fixture: ComponentFixture<CustomerOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerOrderDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
