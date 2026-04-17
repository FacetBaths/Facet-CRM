"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
const User_1 = require("../../src/models/User");
const Customer_1 = require("../../src/models/Customer");
const Project_1 = require("../../src/models/Project");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Projects Routes Integration Tests', () => {
    let adminToken;
    let salesToken;
    let adminId;
    let salesId;
    let customerId;
    let projectId;
    beforeEach(async () => {
        // Create admin user
        const adminPassword = await bcryptjs_1.default.hash('password123', 10);
        const admin = new User_1.UserModel({
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
        const sales = new User_1.UserModel({
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
        // Create customer
        const customer = new Customer_1.CustomerModel({
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
            createdBy: admin._id
        });
        await customer.save();
        customerId = customer._id.toString();
        // Create a project for testing
        const project = new Project_1.Project({
            projectNumber: await index_1.app.generateProjectNumber(), // Assuming it's accessible or mock
            customerId: customer._id,
            type: 'renovation',
            title: 'Test Project',
            address: customer.address,
            createdBy: sales._id,
            assignedSalesId: sales._id
        });
        await project.save();
        projectId = project._id.toString();
    });
    describe('GET /api/projects', () => {
        it('should return all projects for admin', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
        it('should return assigned projects for sales', async () => {
            const res = await (0, supertest_1.default)(index_1.app)
                .get('/api/projects')
                .set('Authorization', `Bearer ${salesToken}`)
                .expect(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0]._id).toBe(projectId);
        });
    });
    describe('POST /api/projects', () => {
        it('should create new project', async () => {
            const newProject = {
                customerId,
                type: 'service',
                title: 'New Service Project',
                address: {
                    street: '456 New St',
                    city: 'New City',
                    state: 'NS',
                    zip: '67890'
                }
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${salesToken}`)
                .send(newProject)
                .expect(201);
            expect(res.body.title).toBe('New Service Project');
            expect(res.body.createdBy).toBe(salesId);
        });
        it('should return 400 for invalid data', async () => {
            const invalidProject = {
                type: 'invalid',
                title: ''
            };
            await (0, supertest_1.default)(index_1.app)
                .post('/api/projects')
                .set('Authorization', `Bearer ${salesToken}`)
                .send(invalidProject)
                .expect(400);
        });
    });
    describe('PUT /api/projects/:id', () => {
        it('should update project for assigned sales', async () => {
            const update = {
                status: 'qualified'
            };
            const res = await (0, supertest_1.default)(index_1.app)
                .put(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${salesToken}`)
                .send(update)
                .expect(200);
            expect(res.body.status).toBe('qualified');
        });
        it('should return 403 for non-assigned user', async () => {
            // Create another sales user
            const otherSales = new User_1.UserModel({
                email: 'other@test.com',
                passwordHash: await bcryptjs_1.default.hash('password123', 10),
                firstName: 'Other',
                lastName: 'Sales',
                roles: ['sales'],
                status: 'active',
                employmentType: 'full_time',
                preferences: {}
            });
            await otherSales.save();
            const otherLogin = await (0, supertest_1.default)(index_1.app)
                .post('/api/auth/login')
                .send({ email: 'other@test.com', password: 'password123' });
            const otherToken = otherLogin.body.token;
            await (0, supertest_1.default)(index_1.app)
                .put(`/api/projects/${projectId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ status: 'qualified' })
                .expect(403);
        });
    });
    // Add more tests for other sub-endpoints like activities, tasks, payments, etc.
    // For example, POST /:id/activities
    it('POST /api/projects/:id/activities should add activity', async () => {
        const activity = {
            type: 'note',
            content: 'Test note'
        };
        const res = await (0, supertest_1.default)(index_1.app)
            .post(`/api/projects/${projectId}/activities`)
            .set('Authorization', `Bearer ${salesToken}`)
            .send(activity)
            .expect(201);
        expect(res.body.type).toBe('note');
        expect(res.body.content).toBe('Test note');
    });
    // Similarly for tasks, payments, etc., including error cases and RBAC
});
//# sourceMappingURL=projects.test.js.map