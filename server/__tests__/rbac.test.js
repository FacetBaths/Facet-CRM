"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
const User_1 = __importDefault(require("../src/models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../src/middleware/auth");
describe('RBAC Integration Tests', () => {
    let adminUser;
    let salesUser;
    beforeEach(async () => {
        await User_1.default.deleteMany({});
        const passwordHash = await bcryptjs_1.default.hash('password', 10);
        adminUser = new User_1.default({
            email: 'admin@example.com',
            passwordHash,
            roles: ['admin'],
            status: 'active'
        });
        await adminUser.save();
        salesUser = new User_1.default({
            email: 'sales@example.com',
            passwordHash,
            roles: ['sales'],
            status: 'active'
        });
        await salesUser.save();
    });
    describe('Admin-only routes', () => {
        it('should allow admin to access /api/users', async () => {
            const token = (0, auth_1.generateToken)(adminUser._id.toString());
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('should not allow non-admin to access /api/users', async () => {
            const token = (0, auth_1.generateToken)(salesUser._id.toString());
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .expect(403);
            expect(res.body.error).toBe('Forbidden: Insufficient permissions');
        });
        it('should allow admin to create new user', async () => {
            const token = (0, auth_1.generateToken)(adminUser._id.toString());
            const newUserData = {
                email: 'new@user.com',
                password: 'pass123',
                firstName: 'New',
                lastName: 'User',
                roles: ['sales']
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send(newUserData)
                .expect(201);
            expect(res.body.email).toBe('new@user.com');
        });
        it('should not allow non-admin to create new user', async () => {
            const token = (0, auth_1.generateToken)(salesUser._id.toString());
            const newUserData = {
                email: 'new@user.com',
                password: 'pass123',
                firstName: 'New',
                lastName: 'User',
                roles: ['sales']
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send(newUserData)
                .expect(403);
            expect(res.body.error).toBe('Forbidden: Insufficient permissions');
        });
    });
});
//# sourceMappingURL=rbac.test.js.map