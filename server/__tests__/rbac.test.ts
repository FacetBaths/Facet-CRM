import request from 'supertest';
import { app } from '../src/index';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/middleware/auth';

describe('RBAC Integration Tests', () => {
  let adminUser: any;
  let salesUser: any;

  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password', 10);

    adminUser = new User({
      email: 'admin@example.com',
      passwordHash,
      roles: ['admin'],
      status: 'active'
    });
    await adminUser.save();

    salesUser = new User({
      email: 'sales@example.com',
      passwordHash,
      roles: ['sales'],
      status: 'active'
    });
    await salesUser.save();
  });

  describe('Admin-only routes', () => {
    it('should allow admin to access /api/users', async () => {
      const token = generateToken(adminUser._id.toString());

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should not allow non-admin to access /api/users', async () => {
      const token = generateToken(salesUser._id.toString());

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.error).toBe('Forbidden: Insufficient permissions');
    });

    it('should allow admin to create new user', async () => {
      const token = generateToken(adminUser._id.toString());

      const newUserData = {
        email: 'new@user.com',
        password: 'pass123',
        firstName: 'New',
        lastName: 'User',
        roles: ['sales']
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData)
        .expect(201);

      expect(res.body.email).toBe('new@user.com');
    });

    it('should not allow non-admin to create new user', async () => {
      const token = generateToken(salesUser._id.toString());

      const newUserData = {
        email: 'new@user.com',
        password: 'pass123',
        firstName: 'New',
        lastName: 'User',
        roles: ['sales']
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData)
        .expect(403);

      expect(res.body.error).toBe('Forbidden: Insufficient permissions');
    });

    
  });
});
