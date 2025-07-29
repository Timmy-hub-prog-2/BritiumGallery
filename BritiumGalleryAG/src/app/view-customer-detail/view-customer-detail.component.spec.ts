import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCustomerDetailComponent } from './view-customer-detail.component';

describe('ViewCustomerDetailComponent', () => {
  let component: ViewCustomerDetailComponent;
  let fixture: ComponentFixture<ViewCustomerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewCustomerDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewCustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
