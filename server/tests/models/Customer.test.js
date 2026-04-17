"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mongoose_mock_1 = __importDefault(require("mongoose-mock"));
const Customer_1 = require("../../src/models/Customer");
describe('Customer Model', () => {
    let mockConnection;
    beforeAll(() => {
        mockConnection = (0, mongoose_mock_1.default)();
    });
    describe('Validation', () => {
        it('should require firstName', () => {
            const customer = new Customer_1.Customer({});
            const error = customer.validateSync();
            expect(error?.errors['firstName']).toBeDefined();
        });
        it('should require lastName', () => {
            const customer = new Customer_1.Customer({ firstName: 'Test' });
            const error = customer.validateSync();
            expect(error?.errors['lastName']).toBeDefined();
        });
        it('should require createdBy', () => {
            const customer = new Customer_1.Customer({ firstName: 'Test', lastName: 'Customer' });
            const error = customer.validateSync();
            expect(error?.errors['createdBy']).toBeDefined();
        });
        it('should pass validation with minimum required fields', () => {
            const customer = new Customer_1.Customer({
                firstName: 'Test',
                lastName: 'Customer',
                createdBy: new mongoose_1.Schema.Types.ObjectId('000000000000000000000001')
            });
            const error = customer.validateSync();
            expect(error).toBeUndefined();
        });
        it('should validate embedded contacts', () => {
            const customer = new Customer_1.Customer({
                firstName: 'Test',
                lastName: 'Customer',
                createdBy: new mongoose_1.Schema.Types.ObjectId('000000000000000000000001'),
                contacts: [{
                        type: 'primary',
                        name: 'John Doe',
                        phone: '123-456-7890'
                    }]
            });
            const error = customer.validateSync();
            expect(error).toBeUndefined();
        });
        it('should fail if contact type is invalid', () => {
            const customer = new Customer_1.Customer({
                firstName: 'Test',
                lastName: 'Customer',
                createdBy: new mongoose_1.Schema.Types.ObjectId('000000000000000000000001'),
                contacts: [{
                        type: 'invalid',
                        name: 'John Doe',
                        phone: '123-456-7890'
                    }]
            });
            const error = customer.validateSync();
            expect(error?.errors['contacts.0.type']).toBeDefined();
        });
    });
});
//# sourceMappingURL=Customer.test.js.map