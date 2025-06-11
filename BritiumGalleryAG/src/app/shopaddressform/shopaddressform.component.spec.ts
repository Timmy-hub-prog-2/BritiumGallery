import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopaddressformComponent } from './shopaddressform.component';

describe('ShopaddressformComponent', () => {
  let component: ShopaddressformComponent;
  let fixture: ComponentFixture<ShopaddressformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopaddressformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopaddressformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
