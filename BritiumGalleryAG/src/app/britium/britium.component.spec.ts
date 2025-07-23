import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BritiumComponent } from './britium.component';

describe('BritiumComponent', () => {
  let component: BritiumComponent;
  let fixture: ComponentFixture<BritiumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BritiumComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BritiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
