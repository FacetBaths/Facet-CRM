import { authMiddleware, requireRole, requireAllRoles } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../src/models/User';

jest.mock('jsonwebtoken');
jest.mock('../src/models/User');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

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
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });
      (User.findById as jest.Mock).mockResolvedValue({ _id: '123', status: 'active' });

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
    });

    it('should return 401 if no token provided', async () => {
      mockRequest.headers = {};

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalidtoken' };
      (jwt.verify as jest.Mock).mockThrow(new Error('Invalid token'));

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid token' });
    });

    it('should return 401 if user not found', async () => {
      mockRequest.headers = { authorization: 'Bearer validtoken' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });
      (User.findById as jest.Mock).mockResolvedValue(null);

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: User not found or inactive' });
    });

    it('should return 401 if user is inactive', async () => {
      mockRequest.headers = { authorization: 'Bearer validtoken' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });
      (User.findById as jest.Mock).mockResolvedValue({ _id: '123', status: 'inactive' });

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized: User not found or inactive' });
    });
  });

  describe('requireRole', () => {
    it('should call next if user has at least one of the required roles', () => {
      mockRequest.user = { roles: ['admin'] } as any;
      const middleware = requireRole('admin', 'manager');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user does not have any of the required roles', () => {
      mockRequest.user = { roles: ['user'] } as any;
      const middleware = requireRole('admin', 'manager');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
    });

    it('should return 401 if no user', () => {
      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('requireAllRoles', () => {
    it('should call next if user has all required roles', () => {
      mockRequest.user = { roles: ['admin', 'manager'] } as any;
      const middleware = requireAllRoles('admin', 'manager');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user misses some required role', () => {
      mockRequest.user = { roles: ['admin'] } as any;
      const middleware = requireAllRoles('admin', 'manager');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
    });

    it('should return 401 if no user', () => {
      const middleware = requireAllRoles('admin');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });
});
