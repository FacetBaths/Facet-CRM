"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
const User_1 = __importDefault(require("../../src/models/User"));
const Customer_1 = require("../../src/models/Customer");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Customers Routes Integration Tests', () => {
    let adminToken;
    let salesToken;
    let adminId;
    let salesId;
    let customerId;
    beforeEach(async () => {
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
        const adminLogin = await (0, supertest_1.default)(index_1.app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'password123' });
        adminToken = adminLogin.body.token;
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
        const salesLogin = await (0, supertest_1.default)(index_1.app)
            .post('/api/auth/login')
            .send({ email: 'sales@test.com', password: 'password123' });
        salesToken = salesLogin.body.token;
        const customer = new Customer_1.Customer({
            firstName: 'Test',
            lastName: 'Customer',
            contacts: [{
                    type: 'primary',
                    name: 'Test Customer',
                    phone: '1234567890',
                    email: 'test@customer.com'
                }],
            address: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zip: '12345'
            },
            createdBy: admin._id,
            assignedSalesId: sales._id
        });
        await customer.save();
        customerId = customer._id.toString();
    });
    describe('GET /api/customers', () => {
        it('should return all customers for admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
        it('should return assigned customers for sales', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/customers')
                .set('Authorization', `Bearer ${salesToken}`)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0]._id).toBe(customerId);
        });
    });
    describe('POST /api/customers', () => {
        it('should create new customer for sales', async () => {
            const newCustomer = {
                firstName: 'New',
                lastName: 'Customer',
                contacts: [{
                        type: 'primary',
                        name: 'New Customer',
                        phone: '9876543210',
                        email: 'new@customer.com'
                    }],
                address: {
                    street: '456 New St',
                    city: 'New City',
                    state: 'NS',
                    zip: '67890'
                }
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${salesToken}`)
                .send(newCustomer)
                .expect(201);
            expect(res.body.firstName).toBe('New');
            expect(res.body.assignedSalesId.toString()).toBe(salesId);
        });
        it('should return 400 for invalid data', async () => {
            const invalidCustomer = {
                firstName: '',
                lastName: ''
            };
            await (0, supertest_1.default)(index_1.app)
                .post('/api/customers')
                .set('Authorization', `Bearer ${salesToken}`)
                .send(invalidCustomer)
                .expect(400);
        });
    });
    describe('PUT /api/customers/:id', () => {
        it('should update assigned customer for sales', async () => {
            const update = {
                firstName: 'Updated'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .put(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send(update)
                .expect(200);
            expect(res.body.firstName).toBe('Updated');
        });
        it('should return 403 for non-assigned customer', async () => {
            const otherCustomer = new Customer_1.Customer({
                firstName: 'Other',
                lastName: 'Customer',
                contacts: [{ type: 'primary', name: 'Other', phone: '111', email: 'other@com' }],
                address: { street: 'Other', city: 'Other', state: 'OT', zip: '00000' },
                createdBy: adminId
            });
            await otherCustomer.save();
            await (0, supertest_1.default)(index_1.app)
                .put(`/api/customers/${otherCustomer._id}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send({ firstName: 'Hacked' })
                .expect(403);
        });
        it('should update any customer for admin', async () => {
            const update = {
                lastName: 'AdminUpdated'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .put(`/api/customers/${customerId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(update)
                .expect(200);
            expect(res.body.lastName).toBe('AdminUpdated');
        });
    });
});
//# sourceMappingURL=customers.test.js.map