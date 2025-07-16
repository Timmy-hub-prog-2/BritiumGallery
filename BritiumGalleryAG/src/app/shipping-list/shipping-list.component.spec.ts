import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShippingListComponent } from './shipping-list.component';

describe('ShippingListComponent', () => {
  let component: ShippingListComponent;
  let fixture: ComponentFixture<ShippingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShippingListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShippingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
