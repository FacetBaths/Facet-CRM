"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Project_1 = require("../../src/models/Project");
describe('Project Model', () => {
    describe('Validation', () => {
        it('should require projectNumber', () => {
            const project = new Project_1.Project({});
            const error = project.validateSync();
            expect(error?.errors['projectNumber']).toBeDefined();
        });
        it('should require customerId', () => {
            const project = new Project_1.Project({ projectNumber: 'PR26040001' });
            const error = project.validateSync();
            expect(error?.errors['customerId']).toBeDefined();
        });
        it('should require type', () => {
            const project = new Project_1.Project({ projectNumber: 'PR26040001', customerId: new mongoose_1.Schema.Types.ObjectId() });
            const error = project.validateSync();
            expect(error?.errors['type']).toBeDefined();
        });
        it('should require title', () => {
            const project = new Project_1.Project({ projectNumber: 'PR26040001', customerId: new mongoose_1.Schema.Types.ObjectId(), type: 'renovation' });
            const error = project.validateSync();
            expect(error?.errors['title']).toBeDefined();
        });
        it('should require createdBy', () => {
            const project = new Project_1.Project({ projectNumber: 'PR26040001', customerId: new mongoose_1.Schema.Types.ObjectId(), type: 'renovation', title: 'Test Project' });
            const error = project.validateSync();
            expect(error?.errors['createdBy']).toBeDefined();
        });
        it('should require address', () => {
            const project = new Project_1.Project({ projectNumber: 'PR26040001', customerId: new mongoose_1.Schema.Types.ObjectId(), type: 'renovation', title: 'Test Project', createdBy: new mongoose_1.Schema.Types.ObjectId() });
            const error = project.validateSync();
            expect(error?.errors['address.street']).toBeDefined();
        });
        it('should pass validation with minimum required fields', () => {
            const project = new Project_1.Project({
                projectNumber: 'PR26040001',
                customerId: new mongoose_1.Schema.Types.ObjectId('000000000000000000000001'),
                type: 'renovation',
                title: 'Test Project',
                createdBy: new mongoose_1.Schema.Types.ObjectId('000000000000000000000002'),
                address: {
                    street: '123 Test St',
                    city: 'Test City',
                    state: 'IL',
                    zip: '60601'
                }
            });
            const error = project.validateSync();
            expect(error).toBeUndefined();
        });
    });
    describe('Methods', () => {
        it('should calculate commission correctly for percentage method', () => {
            const project = new Project_1.Project({
                contractAmount: 10000,
                assignedSalesId: new mongoose_1.Schema.Types.ObjectId(),
                commission: { bdcRepId: new mongoose_1.Schema.Types.ObjectId() }
            });
            const result = project.calculateCommission('percentage', 10);
            expect(result.salesReps.length).toBe(1);
            expect(result.salesReps[0].amount).toBe(1000);
            expect(result.bdcAmount).toBe(100);
        });
        it('should calculate commission correctly for flat method', () => {
            const project = new Project_1.Project({
                contractAmount: 10000,
                assignedSalesId: new mongoose_1.Schema.Types.ObjectId(),
                commission: { bdcRepId: new mongoose_1.Schema.Types.ObjectId() }
            });
            const result = project.calculateCommission('flat', 500);
            expect(result.salesReps.length).toBe(1);
            expect(result.salesReps[0].amount).toBe(500);
            expect(result.bdcAmount).toBe(100);
        });
        it('should throw error if no sales rep assigned', () => {
            const project = new Project_1.Project({ contractAmount: 10000 });
            expect(() => project.calculateCommission('percentage', 10)).toThrow('No sales representatives assigned. Please assign at least one sales rep to the project before calculating commission.');
        });
    });
});
//# sourceMappingURL=Project.test.js.map