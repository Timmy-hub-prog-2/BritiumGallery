import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopaddresslistComponent } from './shopaddresslist.component';

describe('ShopaddresslistComponent', () => {
  let component: ShopaddresslistComponent;
  let fixture: ComponentFixture<ShopaddresslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopaddresslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopaddresslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
