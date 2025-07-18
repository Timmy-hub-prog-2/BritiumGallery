import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountedItemsComponent } from './discounted-items.component';

describe('DiscountedItemsComponent', () => {
  let component: DiscountedItemsComponent;
  let fixture: ComponentFixture<DiscountedItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountedItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiscountedItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
