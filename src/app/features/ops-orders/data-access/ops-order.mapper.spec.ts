import type { OpsOrder } from '../../../core/api/api-contract';
import { createSeedDatabase } from '../../../../mocks/seeds';
import { mapOpsOrderDto, mapPaginatedOpsOrdersDto } from './ops-order.mapper';

describe('operations order DTO mapper', () => {
  it('maps the wire shape into an isolated domain object', () => {
    const dto = createSeedDatabase().orders[0] as OpsOrder;

    const result = mapOpsOrderDto(dto);

    expect(result).toEqual(dto);
    expect(result).not.toBe(dto);
    expect(result.items).not.toBe(dto.items);
    expect(result.items[0]?.lineTotal).not.toBe(dto.items[0]?.lineTotal);
  });

  it('maps a paginated response without leaking DTO item references', () => {
    const dto = createSeedDatabase().orders[0] as OpsOrder;

    const result = mapPaginatedOpsOrdersDto({ items: [dto], page: 2, total: 7 });

    expect(result.page).toBe(2);
    expect(result.total).toBe(7);
    expect(result.items[0]).toEqual(dto);
    expect(result.items[0]).not.toBe(dto);
  });
});
