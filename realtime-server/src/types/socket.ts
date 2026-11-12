import { Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./events";

export interface SocketUser {
  id: string;
  email: string;
  tokenVersion?: number;
}

export interface SocketData {
  user: SocketUser;
  connectedAt: Date;
}

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

