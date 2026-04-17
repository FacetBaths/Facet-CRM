import { Schema } from 'mongoose';
import { Customer, ICustomer } from '../../src/models/Customer';

const dummyUserId = new Schema.Types.ObjectId('000000000000000000000001');

describe('Customer Model', () => {
  describe('Validation', () => {
    it('should require firstName', () => {
      const customer = new Customer({} as unknown as ICustomer);
      const error = customer.validateSync();
      expect(error?.errors['firstName']).toBeDefined();
    });

    it('should require lastName', () => {
      const customer = new Customer({ firstName: 'Test' } as unknown as ICustomer);
      const error = customer.validateSync();
      expect(error?.errors['lastName']).toBeDefined();
    });

    it('should require createdBy', () => {
      const customer = new Customer({ firstName: 'Test', lastName: 'Customer' } as unknown as unknown as ICustomer);
      const error = customer.validateSync();
      expect(error?.errors['createdBy']).toBeDefined();
    });

    it('should pass validation with minimum required fields', () => {
      const customer = new Customer({
        firstName: 'Test',
        lastName: 'Customer',
        createdBy: dummyUserId
      } as unknown as unknown as ICustomer);
      const error = customer.validateSync();
      expect(error).toBeUndefined();
    });

    it('should validate embedded contacts', () => {
const customer = new Customer({
        firstName: 'Test',
        lastName: 'Customer',
        createdBy: dummyUserId
      } as unknown as unknown as ICustomer);
      const error = customer.validateSync();
      expect(error).toBeUndefined();
    });

    it('should fail if contact type is invalid', () => {
      const customer = new Customer({
        firstName: 'Test',
        lastName: 'Customer',
        createdBy: dummyUserId,
        contacts: [{
          type: 'invalid',
          name: 'John Doe',
          phone: '123-456-7890'
        }]
      } as unknown as ICustomer);
      const error = customer.validateSync();
      expect(error?.errors['contacts.0.type']).toBeDefined();
    });
  });
});