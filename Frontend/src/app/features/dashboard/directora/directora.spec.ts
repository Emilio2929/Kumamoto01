import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Directora } from './directora';

describe('Directora', () => {
  let component: Directora;
  let fixture: ComponentFixture<Directora>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directora],
    }).compileComponents();

    fixture = TestBed.createComponent(Directora);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
