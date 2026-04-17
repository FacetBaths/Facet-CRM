"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
const User_1 = __importDefault(require("../../src/models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Users Routes Integration Tests', () => {
    let adminToken;
    let salesToken;
    let adminId;
    let salesId;
    beforeEach(async () => {
        // Create admin user
        const adminPassword = await bcryptjs_1.default.hash('password123', 10);
        const admin = new User_1.default({
            email: 'admin@test.com',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            roles: ['admin'],
            status: 'active',
            employmentType: 'full_time',
            preferences: {}
        });
        await admin.save();
        adminId = admin._id.toString();
        // Login as admin
        const adminLogin = await (0, supertest_1.default)(index_1.app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'password123' });
        adminToken = adminLogin.body.token;
        // Create sales user
        const salesPassword = await bcryptjs_1.default.hash('password123', 10);
        const sales = new User_1.default({
            email: 'sales@test.com',
            passwordHash: salesPassword,
            firstName: 'Sales',
            lastName: 'User',
            roles: ['sales'],
            status: 'active',
            employmentType: 'full_time',
            preferences: {}
        });
        await sales.save();
        salesId = sales._id.toString();
        // Login as sales
        const salesLogin = await (0, supertest_1.default)(index_1.app)
            .post('/api/auth/login')
            .send({ email: 'sales@test.com', password: 'password123' });
        salesToken = salesLogin.body.token;
    });
    describe('GET /api/users', () => {
        it('should return list of users for admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
        it('should return 403 for non-admin', async () => {
            await (0, supertest_1.default)(index_1.app)
                .get('/api/users')
                .set('Authorization', `Bearer ${salesToken}`)
                .expect(403);
        });
    });
    describe('POST /api/users', () => {
        it('should create new user for admin', async () => {
            const newUser = {
                email: 'newuser@test.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
                roles: ['bdc'],
                status: 'active',
                employmentType: 'full_time'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUser)
                .expect(201);
            expect(res.body.email).toBe(newUser.email);
            expect(res.body.roles).toContain('bdc');
        });
        it('should return 400 for invalid data', async () => {
            const invalidUser = {
                email: 'invalid',
                password: 'short',
                firstName: 'Invalid'
            };
            await (0, supertest_1.default)(index_1.app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidUser)
                .expect(400);
        });
        it('should return 403 for non-admin', async () => {
            const newUser = {
                email: 'unauth@test.com',
                password: 'password123',
                firstName: 'Unauth',
                lastName: 'User',
                roles: ['sales']
            };
            await (0, supertest_1.default)(index_1.app)
                .post('/api/users')
                .set('Authorization', `Bearer ${salesToken}`)
                .send(newUser)
                .expect(403);
        });
    });
    describe('GET /api/users/:id', () => {
        it('should return user details for admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get(`/api/users/${salesId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(res.body.email).toBe('sales@test.com');
        });
        it('should return own details for non-admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get(`/api/users/${salesId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .expect(200);
            expect(res.body.email).toBe('sales@test.com');
        });
        it('should return 403 for non-own details as non-admin', async () => {
            await (0, supertest_1.default)(index_1.app)
                .get(`/api/users/${adminId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .expect(403);
        });
    });
    describe('PUT /api/users/:id', () => {
        it('should update own profile for non-admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .put(`/api/users/${salesId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send({ firstName: 'Updated Sales' })
                .expect(200);
            expect(res.body.firstName).toBe('Updated Sales');
        });
        it('should update any user for admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .put(`/api/users/${salesId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roles: ['sales', 'bdc'] })
                .expect(200);
            expect(res.body.roles).toContain('bdc');
        });
        it('should not allow non-admin to update others', async () => {
            await (0, supertest_1.default)(index_1.app)
                .put(`/api/users/${adminId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send({ firstName: 'Hacked' })
                .expect(403);
        });
        it('should not allow non-admin to change restricted fields', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .put(`/api/users/${salesId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send({ roles: ['admin'] })
                .expect(200);
            expect(res.body.roles).not.toContain('admin');
        });
        it('should allow self to change password', async () => {
            await (0, supertest_1.default)(index_1.app)
                .put(`/api/users/${salesId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send({ password: 'newpassword123' })
                .expect(200);
            const loginRes = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send({ email: 'sales@test.com', password: 'newpassword123' })
                .expect(200);
            expect(loginRes.body.token).toBeDefined();
        });
        it('should return 404 for non-existent user', async () => {
            await (0, supertest_1.default)(index_1.app)
                .put('/api/users/000000000000000000000000')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ firstName: 'Ghost' })
                .expect(404);
        });
    });
    // Add tests for other endpoints: DELETE /:id, GET /me/profile, PUT /me/preferences, GET /team/:teamId, GET /market/:marketId
    // For example, DELETE as admin
    it('DELETE /api/users/:id as admin should delete user', async () => {
        await (0, supertest_1.default)(index_1.app)
            .delete(`/api/users/${salesId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        const deleted = await User_1.default.findById(salesId);
        expect(deleted).toBeNull();
    });
    // And so on for others, including role checks
});
//# sourceMappingURL=users.test.js.map