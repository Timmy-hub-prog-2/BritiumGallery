import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippingReturnsPolicyComponent } from './shipping-returns-policy.component';

describe('ShippingReturnsPolicyComponent', () => {
  let component: ShippingReturnsPolicyComponent;
  let fixture: ComponentFixture<ShippingReturnsPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShippingReturnsPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShippingReturnsPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
