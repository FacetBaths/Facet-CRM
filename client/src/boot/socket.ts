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

  app.config.globalProperties.$socket = socket;
});

export { socket };
