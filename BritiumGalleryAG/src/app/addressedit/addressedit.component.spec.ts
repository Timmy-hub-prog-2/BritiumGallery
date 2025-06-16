import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddresseditComponent } from './addressedit.component';

describe('AddresseditComponent', () => {
  let component: AddresseditComponent;
  let fixture: ComponentFixture<AddresseditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddresseditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddresseditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
