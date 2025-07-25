import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRemainderListComponent } from './user-remainder-list.component';

describe('UserRemainderListComponent', () => {
  let component: UserRemainderListComponent;
  let fixture: ComponentFixture<UserRemainderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserRemainderListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRemainderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
