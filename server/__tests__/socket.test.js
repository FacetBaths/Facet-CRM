"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const globals_1 = require("@jest/globals");
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../src/index");
globals_1.jest.mock('../src/models/Project');
(0, globals_1.describe)('Socket.io Event Tests - Server Side', () => {
    let mockIo;
    (0, globals_1.beforeEach)(() => {
        mockIo = {
            to: globals_1.jest.fn().mockReturnThis(),
            emit: globals_1.jest.fn(),
        };
        index_1.app.use((req, res, next) => {
            req.io = mockIo;
            next();
        });
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should emit project:activity when adding an activity', async () => {
        const projectId = new mongoose_1.default.Types.ObjectId().toString();
        const mockProject = { n, _id: projectId, n, activities: [], n };
        n;
        mockProject.save = globals_1.jest.fn().mockResolvedValue(mockProject);
        // @ts-ignore\n(Project.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProject);
        const response = await (0, supertest_1.default)(index_1.app)
            .post(`/api/projects/${projectId}/activities`)
            .send({ type: 'note', content: 'Test note' })
            .set('Authorization', 'Bearer mocktoken');
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(mockIo.to).toHaveBeenCalledWith(`project:${projectId}`);
        (0, globals_1.expect)(mockIo.emit).toHaveBeenCalledWith('project:activity', globals_1.expect.objectContaining({
            type: 'note',
            content: 'Test note',
        }));
    });
    (0, globals_1.it)('should emit project:task when adding a task', async () => {
        const projectId = new mongoose_1.default.Types.ObjectId().toString();
        const mockProject = {
            _id: projectId,
            tasks: [],
            save: globals_1.jest.fn().mockResolvedValue(mockProject),
        };
        // @ts-ignore\n(Project.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProject);
        const response = await (0, supertest_1.default)(index_1.app)
            .post(`/api/projects/${projectId}/tasks`)
            .send({ title: 'Test task', description: 'Test desc', assignedTo: 'userId', dueDate: new Date() })
            .set('Authorization', 'Bearer mocktoken');
        (0, globals_1.expect)(response.status).toBe(201);
        (0, globals_1.expect)(mockIo.to).toHaveBeenCalledWith(`project:${projectId}`);
        (0, globals_1.expect)(mockIo.emit).toHaveBeenCalledWith('project:task', globals_1.expect.objectContaining({
            action: 'created',
            task: globals_1.expect.objectContaining({ title: 'Test task' }),
        }));
    });
});
//# sourceMappingURL=socket.test.js.map