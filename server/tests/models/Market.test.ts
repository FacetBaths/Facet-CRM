
import { Market, IMarket } from '../../src/models/Market';

describe('Market Model', () => {
  describe('Validation', () => {
    it('should require name', () => {
      const market = new Market({} as unknown as IMarket);
      const error = market.validateSync();
      expect(error?.errors['name']).toBeDefined();
    });

    it('should require code', () => {
      const market = new Market({ name: 'Test Market' } as unknown as IMarket);
      const error = market.validateSync();
      expect(error?.errors['code']).toBeDefined();
    });

    it('should require region', () => {
      const market = new Market({ name: 'Test Market', code: 'TM' } as unknown as IMarket);
      const error = market.validateSync();
      expect(error?.errors['region']).toBeDefined();
    });

    it('should require address.street', () => {
      const market = new Market({ name: 'Test Market', code: 'TM', region: 'Test Region', address: {} } as unknown as IMarket);
      const error = market.validateSync();
      expect(error?.errors['address.street']).toBeDefined();
    });

    

    it('should pass with minimal fields', () => {
      const market = new Market({
        name: 'Test Market',
        code: 'TM',
        region: 'Test Region',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'USA'
        }
      } as unknown as IMarket);
      const error = market.validateSync();
      expect(error).toBeUndefined();
    });
  });
});