"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_1 = __importStar(require("../../src/models/User"));
jest.mock('../../src/models/CompanySettings', () => ({
    CompanySettings: {
        generateEmployeeId: jest.fn().mockResolvedValue('IL-SALES0001')
    }
}));
describe('User Model', () => {
    describe('Validation', () => {
        it('should require email', () => {
            const user = new User_1.default({});
            const error = user.validateSync();
            expect(error?.errors['email']).toBeDefined();
        });
        it('should require passwordHash', () => {
            const user = new User_1.default({ email: 'test@example.com' });
            const error = user.validateSync();
            expect(error?.errors['passwordHash']).toBeDefined();
        });
        it('should require firstName', () => {
            const user = new User_1.default({ email: 'test@example.com', passwordHash: 'hash' });
            const error = user.validateSync();
            expect(error?.errors['firstName']).toBeDefined();
        });
        it('should require lastName', () => {
            const user = new User_1.default({ email: 'test@example.com', passwordHash: 'hash', firstName: 'Test' });
            const error = user.validateSync();
            expect(error?.errors['lastName']).toBeDefined();
        });
        it('should require roles', () => {
            const user = new User_1.default({ email: 'test@example.com', passwordHash: 'hash', firstName: 'Test', lastName: 'User' });
            const error = user.validateSync();
            expect(error?.errors['roles']).toBeDefined();
        });
        it('should validate email format', () => {
            const user = new User_1.default({ email: 'invalid', passwordHash: 'hash', firstName: 'Test', lastName: 'User', roles: ['sales'] });
            const error = user.validateSync();
            expect(error?.errors['email']).toBeDefined();
        });
        it('should pass validation with minimum required fields', () => {
            const user = new User_1.default({
                email: 'test@example.com',
                passwordHash: 'hashedpassword',
                firstName: 'Test',
                lastName: 'User',
                roles: ['sales']
            });
            const error = user.validateSync();
            expect(error).toBeUndefined();
        });
    });
    describe('Methods', () => {
        it('hasAnyRole should return true if user has any of the roles', () => {
            const user = { roles: ['admin', 'sales'] };
            expect((0, User_1.hasAnyRole)(user, ['sales', 'manager'])).toBe(true);
        });
        it('hasAnyRole should return false if user has none of the roles', () => {
            const user = { roles: ['contractor'] };
            expect((0, User_1.hasAnyRole)(user, ['admin', 'manager'])).toBe(false);
        });
    });
    describe('Pre-save hook', () => {
        it('should generate employeeId if new user and no employeeId', async () => {
            const user = new User_1.default({ email: 'test@example.com',
                passwordHash: 'hash',
                firstName: 'Test',
                lastName: 'User',
                roles: ['sales'],
                createdBy: new mongoose_1.Schema.Types.ObjectId('000000000000000000000001'),
                marketId: new mongoose_1.Schema.Types.ObjectId()
            });
            await user.save(); // This will trigger pre-save
            expect(user.employeeId).toBe('IL-SALES0001');
        });
    });
});
//# sourceMappingURL=User.test.js.map