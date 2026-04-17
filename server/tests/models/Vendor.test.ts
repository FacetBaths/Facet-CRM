import mongoose from 'mongoose';

import Vendor, { IVendor } from '../../src/models/Vendor';

describe('Vendor Model', () => {
  describe('Validation', () => {
    it('should require name', () => {
      const vendor = new Vendor({} as unknown as IVendor);
      const error = vendor.validateSync();
      expect(error?.errors['name']).toBeDefined();
    });

    it('should require type', () => {
      const vendor = new Vendor({ name: 'Test Vendor' } as unknown as IVendor);
      const error = vendor.validateSync();
      expect(error?.errors['type']).toBeDefined();
    });

    it('should validate type enum', () => {
      const vendor = new Vendor({ name: 'Test Vendor', type: 'invalid' } as unknown as IVendor);
      const error = vendor.validateSync();
      expect(error?.errors['type']).toBeDefined();
    });

    it('should pass with minimal fields', () => {
      const vendor = new Vendor({ name: 'Test Vendor', type: 'supplier' } as unknown as IVendor);
      const error = vendor.validateSync();
      expect(error).toBeUndefined();
    });

    it('should validate contacts sub-document', () => {
      const vendor = new Vendor({
        name: 'Test Vendor',
        type: 'supplier',
        contacts: [{ type: 'primary', name: 'Contact', phone: '123456' }]
      } as unknown as IVendor);
      const error = vendor.validateSync();
      expect(error).toBeUndefined();
    });

    it('should require fields in contacts', () => {
      const vendor = new Vendor({
        name: 'Test Vendor',
        type: 'supplier',
        contacts: [{ name: 'Contact' }]
      } as unknown as IVendor);
      const error = vendor.validateSync();
      expect(error?.errors['contacts.0.type']).toBeDefined();
      expect(error?.errors['contacts.0.phone']).toBeDefined();
    });
  });
});