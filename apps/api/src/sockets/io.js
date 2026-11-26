let io;

export function setIo(instance) {
  io = instance;
}

export function getIo() {
  return io;
}

export function disconnectUserSockets(userId) {
  io?.in(`user:${userId}`).disconnectSockets(true);
}
