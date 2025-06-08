import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddresslistComponent } from './addresslist.component';

describe('AddresslistComponent', () => {
  let component: AddresslistComponent;
  let fixture: ComponentFixture<AddresslistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddresslistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddresslistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
