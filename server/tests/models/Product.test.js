import { Product } from '../../src/models/Product';
describe('Product Model', () => {
    describe('Validation', () => {
        it('should require name', () => {
            const product = new Product({});
            const error = product.validateSync();
            expect(error?.errors['name']).toBeDefined();
        });
        it('should require category', () => {
            const product = new Product({ name: 'Test Product' });
            const error = product.validateSync();
            expect(error?.errors['category']).toBeDefined();
        });
        it('should require type', () => {
            const product = new Product({ name: 'Test Product', category: 'materials' });
            const error = product.validateSync();
            expect(error?.errors['type']).toBeDefined();
        });
        it('should validate category enum', () => {
            const product = new Product({ name: 'Test Product', category: 'invalid', type: 'physical' });
            const error = product.validateSync();
            expect(error?.errors['category']).toBeDefined();
        });
        it('should validate type enum', () => {
            const product = new Product({ name: 'Test Product', category: 'materials', type: 'invalid' });
            const error = product.validateSync();
            expect(error?.errors['type']).toBeDefined();
        });
        it('should pass with minimal fields', () => {
            const product = new Product({ name: 'Test Product', category: 'materials', type: 'physical' });
            const error = product.validateSync();
            expect(error).toBeUndefined();
        });
        it('should validate variants sub-document', () => {
            const product = new Product({
                name: 'Test Product',
                category: 'materials',
                type: 'physical',
                variants: [{ sku: 'SKU123', costPrice: 10, retailPrice: 20 }]
            });
            const error = product.validateSync();
            expect(error).toBeUndefined();
        });
        it('should require fields in variants', () => {
            const product = new Product({
                name: 'Test Product',
                category: 'materials',
                type: 'physical',
                variants: [{ costPrice: 10 }]
            });
            const error = product.validateSync();
            expect(error?.errors['variants.0.sku']).toBeDefined();
            expect(error?.errors['variants.0.retailPrice']).toBeDefined();
        });
    });
});
//# sourceMappingURL=Product.test.js.map