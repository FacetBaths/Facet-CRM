import { Schema } from 'mongoose';
import User, { IUser, hasAnyRole, UserRole } from '../../src/models/User';

jest.mock('../../src/models/CompanySettings', () => ({
  CompanySettings: {
    generateEmployeeId: jest.fn().mockResolvedValue('IL-SALES0001')
  }
}));

describe('User Model', () => {

  describe('Validation', () => {
    it('should require email', () => {
      const user = new User({} as IUser);
      const error = user.validateSync();
      expect(error?.errors['email']).toBeDefined();
    });

    it('should require passwordHash', () => {
      const user = new User({ email: 'test@example.com' } as IUser);
      const error = user.validateSync();
      expect(error?.errors['passwordHash']).toBeDefined();
    });

    it('should require firstName', () => {
      const user = new User({ email: 'test@example.com', passwordHash: 'hash' } as IUser);
      const error = user.validateSync();
      expect(error?.errors['firstName']).toBeDefined();
    });

    it('should require lastName', () => {
      const user = new User({ email: 'test@example.com', passwordHash: 'hash', firstName: 'Test' } as IUser);
      const error = user.validateSync();
      expect(error?.errors['lastName']).toBeDefined();
    });

    it('should require roles', () => {
      const user = new User({ email: 'test@example.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' } as IUser);
      const error = user.validateSync();
      expect(error?.errors['roles']).toBeDefined();
    });

    it('should validate email format', () => {
      const user = new User({ email: 'invalid', passwordHash: 'hash', firstName: 'Test', lastName: 'User', roles: ['sales'] } as IUser);
      const error = user.validateSync();
      expect(error?.errors['email']).toBeDefined();
    });

    it('should pass validation with minimum required fields', () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        roles: ['sales']
      } as IUser);
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('Methods', () => {
    it('hasAnyRole should return true if user has any of the roles', () => {
      const user = { roles: ['admin', 'sales'] } as IUser;
      expect(hasAnyRole(user, ['sales', 'manager'])).toBe(true);
    });

    it('hasAnyRole should return false if user has none of the roles', () => {
      const user = { roles: ['contractor'] } as IUser;
      expect(hasAnyRole(user, ['admin', 'manager'])).toBe(false);
    });
  });

  describe('Pre-save hook', () => {
    it('should generate employeeId if new user and no employeeId', async () => {

      const user = new User({
        email: 'test@example.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
        roles: ['sales'],
        createdBy: new Schema.Types.ObjectId('000000000000000000000001'),
        marketId: new Schema.Types.ObjectId()
      } as unknown as IUser);

      await user.save(); // This will trigger pre-save

      expect(user.employeeId).toBe('IL-SALES0001');
    });
  });
});