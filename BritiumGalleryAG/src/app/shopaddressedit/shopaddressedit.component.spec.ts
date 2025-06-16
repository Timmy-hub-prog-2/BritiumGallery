import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopaddresseditComponent } from './shopaddressedit.component';

describe('ShopaddresseditComponent', () => {
  let component: ShopaddresseditComponent;
  let fixture: ComponentFixture<ShopaddresseditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopaddresseditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopaddresseditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
