import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';
import { getToken } from './storage';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket'] });
  }
  return socket;
}

export async function connectSocket() {
  const token = await getToken();
  if (!token) return null;
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) socket.disconnect();
}
