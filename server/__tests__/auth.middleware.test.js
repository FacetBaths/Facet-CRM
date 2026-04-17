"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../src/middleware/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../src/models/User"));
jest.mock('jsonwebtoken');
jest.mock('../src/models/User');
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction = jest.fn();
    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
    });
    describe('authMiddleware', () => {
        it('should call next if valid token and active user', async () => {
            mockRequest.headers = { authorization: 'Bearer validtoken' };
            jsonwebtoken_1.default.verify.mockReturnValue({ userId: '123' });
            User_1.default.findById.mockResolvedValue({ _id: '123', status: 'active' });
            await (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
            expect(mockRequest.user).toBeDefined();
        });
        it('should return 401 if no token provided', async () => {
            mockRequest.headers = {};
            await (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if invalid token', async () => {
            mockRequest.headers = { authorization: 'Bearer invalidtoken' };
            jsonwebtoken_1.default.verify.mockThrow(new Error('Invalid token'));
            await (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
        });
        it('should return 401 if user not found', async () => {
            mockRequest.headers = { authorization: 'Bearer validtoken' };
            jsonwebtoken_1.default.verify.mockReturnValue({ userId: '123' });
            User_1.default.findById.mockResolvedValue(null);
            await (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: User not found or inactive' });
        });
        it('should return 401 if user is inactive', async () => {
            mockRequest.headers = { authorization: 'Bearer validtoken' };
            jsonwebtoken_1.default.verify.mockReturnValue({ userId: '123' });
            User_1.default.findById.mockResolvedValue({ _id: '123', status: 'inactive' });
            await (0, auth_1.authMiddleware)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: User not found or inactive' });
        });
    });
    describe('requireRole', () => {
        it('should call next if user has at least one of the required roles', () => {
            mockRequest.user = { roles: ['admin'] };
            const middleware = (0, auth_1.requireRole)('admin', 'manager');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should return 403 if user does not have any of the required roles', () => {
            mockRequest.user = { roles: ['user'] };
            const middleware = (0, auth_1.requireRole)('admin', 'manager');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
        });
        it('should return 401 if no user', () => {
            const middleware = (0, auth_1.requireRole)('admin');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });
    describe('requireAllRoles', () => {
        it('should call next if user has all required roles', () => {
            mockRequest.user = { roles: ['admin', 'manager'] };
            const middleware = (0, auth_1.requireAllRoles)('admin', 'manager');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should return 403 if user misses some required role', () => {
            mockRequest.user = { roles: ['admin'] };
            const middleware = (0, auth_1.requireAllRoles)('admin', 'manager');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
        });
        it('should return 401 if no user', () => {
            const middleware = (0, auth_1.requireAllRoles)('admin');
            middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });
});
//# sourceMappingURL=auth.middleware.test.js.map