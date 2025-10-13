import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilityPanel } from './utility-panel';

describe('UtilityPanel', () => {
  let component: UtilityPanel;
  let fixture: ComponentFixture<UtilityPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilityPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UtilityPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
