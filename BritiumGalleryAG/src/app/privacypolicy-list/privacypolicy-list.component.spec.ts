import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacypolicyListComponent } from './privacypolicy-list.component';

describe('PrivacypolicyListComponent', () => {
  let component: PrivacypolicyListComponent;
  let fixture: ComponentFixture<PrivacypolicyListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacypolicyListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacypolicyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
