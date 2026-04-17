"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vendor_1 = __importDefault(require("../../src/models/Vendor"));
describe('Vendor Model', () => {
    describe('Validation', () => {
        it('should require name', () => {
            const vendor = new Vendor_1.default({});
            const error = vendor.validateSync();
            expect(error?.errors['name']).toBeDefined();
        });
        it('should require type', () => {
            const vendor = new Vendor_1.default({ name: 'Test Vendor' });
            const error = vendor.validateSync();
            expect(error?.errors['type']).toBeDefined();
        });
        it('should validate type enum', () => {
            const vendor = new Vendor_1.default({ name: 'Test Vendor', type: 'invalid' });
            const error = vendor.validateSync();
            expect(error?.errors['type']).toBeDefined();
        });
        it('should pass with minimal fields', () => {
            const vendor = new Vendor_1.default({ name: 'Test Vendor', type: 'supplier' });
            const error = vendor.validateSync();
            expect(error).toBeUndefined();
        });
        it('should validate contacts sub-document', () => {
            const vendor = new Vendor_1.default({
                name: 'Test Vendor',
                type: 'supplier',
                contacts: [{ type: 'primary', name: 'Contact', phone: '123456' }]
            });
            const error = vendor.validateSync();
            expect(error).toBeUndefined();
        });
        it('should require fields in contacts', () => {
            const vendor = new Vendor_1.default({
                name: 'Test Vendor',
                type: 'supplier',
                contacts: [{ name: 'Contact' }]
            });
            const error = vendor.validateSync();
            expect(error?.errors['contacts.0.type']).toBeDefined();
            expect(error?.errors['contacts.0.phone']).toBeDefined();
        });
    });
});
//# sourceMappingURL=Vendor.test.js.map