import { test, expect, vi } from 'vitest';
import { socket, joinProjectRoom, leaveProjectRoom } from '../src/boot/socket';
import { io } from 'socket.io-client';

vi.mock('socket.io-client', () => {
  const mockSocket = {
    emit: vi.fn(),
    connected: true,
  };
  return { io: vi.fn(() => mockSocket) };
});

test('joinProjectRoom emits join-project', () => {
  const projectId = 'testId';
  joinProjectRoom(projectId);
  expect(socket.emit).toHaveBeenCalledWith('join-project', projectId);
});

test('leaveProjectRoom emits leave-project', () => {
  const projectId = 'testId';
  leaveProjectRoom(projectId);
  expect(socket.emit).toHaveBeenCalledWith('leave-project', projectId);
});

// Test for receiving events, if there are listeners in other files, but since boot has on connect/disconnect, test those

test('socket has connect listener', () => {
  expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
});

test('socket has disconnect listener', () => {
  expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
});
