"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../src/index");
const User_1 = __importDefault(require("../src/models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Auth Routes', () => {
    beforeEach(async () => {
        await User_1.default.deleteMany({});
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                roles: ['admin']
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(userData.email.toLowerCase());
            expect(res.body.user.roles).toEqual(userData.roles);
            const savedUser = await User_1.default.findOne({ email: userData.email.toLowerCase() });
            expect(savedUser).toBeDefined();
            expect(savedUser?.firstName).toBe(userData.firstName);
        });
        it('should not register with existing email', async () => {
            const existingUser = new User_1.default({
                email: 'test@example.com',
                passwordHash: await bcryptjs_1.default.hash('pass', 10),
                firstName: 'Existing',
                lastName: 'User',
                roles: ['admin']
            });
            await existingUser.save();
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                roles: ['admin']
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);
            expect(res.body.error).toBe('Email already registered');
        });
        it('should not register with invalid data', async () => {
            const invalidData = {
                email: 'invalid',
                password: 'short',
                firstName: '',
                lastName: '',
                roles: []
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/register')
                .send(invalidData)
                .expect(400);
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });
    describe('POST /api/auth/login', () => {
        let testUser;
        beforeEach(async () => {
            const password = 'password123';
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            testUser = new User_1.default({
                email: 'test@example.com',
                passwordHash,
                firstName: 'Test',
                lastName: 'User',
                roles: ['admin'],
                status: 'active'
            });
            await testUser.save();
        });
        it('should login with valid credentials', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe(credentials.email);
            expect(res.body.user.roles).toEqual(testUser.roles);
        });
        it('should not login with invalid email', async () => {
            const credentials = {
                email: 'invalid@example.com',
                password: 'password123'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(401);
            expect(res.body.error).toBe('Invalid credentials');
        });
        it('should not login with invalid password', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(401);
            expect(res.body.error).toBe('Invalid credentials');
        });
        it('should not login with disabled account', async () => {
            await User_1.default.updateOne({ _id: testUser._id }, { status: 'inactive' });
            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send(credentials)
                .expect(401);
            expect(res.body.error).toBe('Account disabled');
        });
        it('should not login with invalid input', async () => {
            const invalidCredentials = {
                email: 'notanemail',
                password: ''
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send(invalidCredentials)
                .expect(400);
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=auth.routes.test.js.map