import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FAQListComponent } from './faqlist.component';

describe('FAQListComponent', () => {
  let component: FAQListComponent;
  let fixture: ComponentFixture<FAQListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FAQListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FAQListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
