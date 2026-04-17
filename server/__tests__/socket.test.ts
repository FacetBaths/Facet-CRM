import { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Project } from '../src/models/Project';
import mongoose from 'mongoose';
import { app } from '../src/index';

jest.mock('../src/models/Project');

describe('Socket.io Event Tests - Server Side', () => {
  let mockIo: {
    to: jest.Mock;
    emit: jest.Mock;
  };

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    app.use((req: any, res: any, next: () => void) => {
      req.io = mockIo;
      next();
    });

    jest.clearAllMocks();
  });

  it('should emit project:activity when adding an activity', async () => {
    const projectId = new mongoose.Types.ObjectId().toString();
    const mockProject = {\n      _id: projectId,\n      activities: [],\n    } as unknown as typeof Project;\n    mockProject.save = jest.fn().mockResolvedValue(mockProject);

    // @ts-ignore\n(Project.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProject);

    const response = await request(app)
      .post(`/api/projects/${projectId}/activities`)
      .send({ type: 'note', content: 'Test note' })
      .set('Authorization', 'Bearer mocktoken');

    expect(response.status).toBe(201);
    expect(mockIo.to).toHaveBeenCalledWith(`project:${projectId}`);
    expect(mockIo.emit).toHaveBeenCalledWith('project:activity', expect.objectContaining({
      type: 'note',
      content: 'Test note',
    }));
  });

  it('should emit project:task when adding a task', async () => {
    const projectId = new mongoose.Types.ObjectId().toString();
    const mockProject = {
      _id: projectId,
      tasks: [],
      save: jest.fn().mockResolvedValue(mockProject),
    } as unknown as typeof Project;

    // @ts-ignore\n(Project.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProject);

    const response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Test task', description: 'Test desc', assignedTo: 'userId', dueDate: new Date() })
      .set('Authorization', 'Bearer mocktoken');

    expect(response.status).toBe(201);
    expect(mockIo.to).toHaveBeenCalledWith(`project:${projectId}`);
    expect(mockIo.emit).toHaveBeenCalledWith('project:task', expect.objectContaining({
      action: 'created',
      task: expect.objectContaining({ title: 'Test task' }),
    }));
  });
});
