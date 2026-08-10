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
    expect(localStorage.getItem('tizo:active-operator:v2')).toContain('op-test');
  });

  it('clears the operational context explicitly', () => {
    const service = TestBed.inject(OperatorSessionService);
    service.select({ id: 'op-test', name: 'Operadora Test', initials: 'OT' });

    service.clear();

    expect(service.activeOperator).toBeNull();
  });

  it('invalidates the operator selected by the legacy mock', () => {
    localStorage.setItem(
      'tizo:active-operator:v1',
      JSON.stringify({ id: 'op-mariana', name: 'Mariana Sosa', initials: 'MS' }),
    );

    const service = TestBed.inject(OperatorSessionService);

    expect(service.activeOperator).toBeNull();
    expect(localStorage.getItem('tizo:active-operator:v1')).toBeNull();
  });

  it('discards malformed persisted values', () => {
    localStorage.setItem('tizo:active-operator:v2', JSON.stringify({ id: 'op-001' }));

    const service = TestBed.inject(OperatorSessionService);

    expect(service.activeOperator).toBeNull();
    expect(localStorage.getItem('tizo:active-operator:v2')).toBeNull();
  });
});
