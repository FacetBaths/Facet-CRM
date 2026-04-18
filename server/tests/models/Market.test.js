import { Market } from '../../src/models/Market';
jest.setTimeout(30000);
describe('Market Model', () => {
    describe('Validation', () => {
        it('should require name', () => {
            const market = new Market({});
            const error = market.validateSync();
            expect(error?.errors['name']).toBeDefined();
        });
        it('should require code', () => {
            const market = new Market({ name: 'Test Market' });
            const error = market.validateSync();
            expect(error?.errors['code']).toBeDefined();
        });
        it('should require region', () => {
            const market = new Market({ name: 'Test Market', code: 'TM' });
            const error = market.validateSync();
            expect(error?.errors['region']).toBeDefined();
        });
        it('should require address.street', () => {
            const market = new Market({ name: 'Test Market', code: 'TM', region: 'Test Region', address: {} });
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
            });
            const error = market.validateSync();
            expect(error).toBeUndefined();
        });
    });
});
//# sourceMappingURL=Market.test.js.map