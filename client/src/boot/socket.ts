import { defineBoot } from '#q-app/wrappers';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default defineBoot(({ app }) => {
  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
    transports: ['websocket'],
    autoConnect: false,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.log('Socket connection error:', err.message);
  });

  app.config.globalProperties.$socket = socket;
});

export function connectSocket(token?: string) {
  if (socket && !socket.connected) {
    if (token) {
      socket.io.opts.extraHeaders = {
        Authorization: `Bearer ${token}`,
      };
    }
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

export function joinProjectRoom(projectId: string) {
  if (socket && socket.connected) {
    socket.emit('join-project', projectId);
    console.log('Joined project room:', projectId);
  }
}

export function leaveProjectRoom(projectId: string) {
  if (socket && socket.connected) {
    socket.emit('leave-project', projectId);
    console.log('Left project room:', projectId);
  }
}

export { socket };
