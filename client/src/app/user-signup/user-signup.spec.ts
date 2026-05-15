import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSignup } from './user-signup';

describe('UserSignup', () => {
  let component: UserSignup;
  let fixture: ComponentFixture<UserSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSignup],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSignup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
