import { Schema } from 'mongoose';
import { Subscription } from '../../src/models/Subscription';
const dummyCustomerId = new Schema.Types.ObjectId('000000000000000000000001');
describe('Subscription Model', () => {
    describe('Validation', () => {
        it('should require customerId', () => {
            const subscription = new Subscription({});
            const error = subscription.validateSync();
            expect(error?.errors['customerId']).toBeDefined();
        });
        it('should require plan', () => {
            const subscription = new Subscription({ customerId: dummyCustomerId });
            const error = subscription.validateSync();
            expect(error?.errors['plan']).toBeDefined();
        });
        it('should require billingFrequency', () => {
            const subscription = new Subscription({ customerId: dummyCustomerId, plan: 'edge' });
            const error = subscription.validateSync();
            expect(error?.errors['billingFrequency']).toBeDefined();
        });
        it('should require monthlyAmount', () => {
            const subscription = new Subscription({ customerId: dummyCustomerId, plan: 'edge', billingFrequency: 'monthly' });
            const error = subscription.validateSync();
            expect(error?.errors['monthlyAmount']).toBeDefined();
        });
        it('should require annualAmount', () => {
            const subscription = new Subscription({ customerId: dummyCustomerId, plan: 'edge', billingFrequency: 'monthly', monthlyAmount: 49 });
            const error = subscription.validateSync();
            expect(error?.errors['annualAmount']).toBeDefined();
        });
        it('should require nextBillDate', () => {
            const subscription = new Subscription({ customerId: dummyCustomerId, plan: 'edge', billingFrequency: 'monthly', monthlyAmount: 49, annualAmount: 499 });
            const error = subscription.validateSync();
            expect(error?.errors['nextBillDate']).toBeDefined();
        });
        it('should pass with minimal fields', () => {
            const subscription = new Subscription({
                customerId: dummyCustomerId,
                plan: 'edge',
                billingFrequency: 'monthly',
                monthlyAmount: 49,
                annualAmount: 499,
                nextBillDate: new Date()
            });
            const error = subscription.validateSync();
            expect(error).toBeUndefined();
        });
        it('should validate embedded services', () => {
            const subscription = new Subscription({
                customerId: dummyCustomerId,
                plan: 'edge',
                billingFrequency: 'monthly',
                monthlyAmount: 49,
                annualAmount: 499,
                nextBillDate: new Date(),
                services: [{ type: 'gutter_cleaning', status: 'scheduled' }]
            });
            const error = subscription.validateSync();
            expect(error).toBeUndefined();
        });
        it('should fail if service type is invalid', () => {
            const subscription = new Subscription({
                customerId: dummyCustomerId,
                plan: 'edge',
                billingFrequency: 'monthly',
                monthlyAmount: 49,
                annualAmount: 499,
                nextBillDate: new Date(),
                services: [{ type: 'invalid', status: 'scheduled' }]
            });
            const error = subscription.validateSync();
            expect(error?.errors['services.0.type']).toBeDefined();
        });
        it('should validate embedded payments', () => {
            const subscription = new Subscription({
                customerId: dummyCustomerId,
                plan: 'edge',
                billingFrequency: 'monthly',
                monthlyAmount: 49,
                annualAmount: 499,
                nextBillDate: new Date(),
                payments: [{ amount: 49, date: new Date(), method: 'card' }]
            });
            const error = subscription.validateSync();
            expect(error).toBeUndefined();
        });
        it('should fail if payment method is invalid', () => {
            const subscription = new Subscription({
                customerId: dummyCustomerId,
                plan: 'edge',
                billingFrequency: 'monthly',
                monthlyAmount: 49,
                annualAmount: 499,
                nextBillDate: new Date(),
                payments: [{ amount: 49, date: new Date(), method: 'invalid' }]
            });
            const error = subscription.validateSync();
            expect(error?.errors['payments.0.method']).toBeDefined();
        });
    });
});
//# sourceMappingURL=Subscription.test.js.map