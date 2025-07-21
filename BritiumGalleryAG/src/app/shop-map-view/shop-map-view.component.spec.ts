import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopMapViewComponent } from './shop-map-view.component';

describe('ShopMapViewComponent', () => {
  let component: ShopMapViewComponent;
  let fixture: ComponentFixture<ShopMapViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopMapViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShopMapViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
