import type { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer) {
  io = server;
}

export function getSocketServer() {
  return io;
}

export function emitGenerationUpdate(
  assignmentId: string,
  payload: {
    status: string;
    progress: number;
    message: string;
  }
) {
  io?.to(`assignment:${assignmentId}`).emit("generation:update", {
    assignmentId,
    ...payload,
  });
}
