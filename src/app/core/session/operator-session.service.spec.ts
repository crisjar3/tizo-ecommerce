import { TestBed } from '@angular/core/testing';

import { OperatorSessionService } from './operator-session.service';

describe('OperatorSessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('persists the selected operator for request attribution', () => {
    const service = TestBed.inject(OperatorSessionService);

    service.select({ id: 'op-test', name: 'Operadora Test', initials: 'OT' });

    expect(service.activeOperator?.id).toBe('op-test');
    expect(localStorage.getItem('tizo:active-operator:v1')).toContain('op-test');
  });

  it('clears the operational context explicitly', () => {
    const service = TestBed.inject(OperatorSessionService);
    service.select({ id: 'op-test', name: 'Operadora Test', initials: 'OT' });

    service.clear();

    expect(service.activeOperator).toBeNull();
  });
});
