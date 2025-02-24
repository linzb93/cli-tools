import { EventEmitter } from "node:events";
import type { Server as HTTPServer } from "node:http";
import { Server, Socket } from "socket.io";

const evt = new EventEmitter();

export default function (server: HTTPServer) {
  const io = new Server(server);
  io.on("connection", (socket: Socket) => {
    evt.on("socket-event", (data) => {
      io.emit(JSON.stringify(data));
    });
    socket.on("disconnect", () => {
      console.log("断开连接");
    });
    socket.on("message", (dataStr: string) => {
      const data = JSON.parse(dataStr);
      evt.emit("handle-socket-event", data);
    });
  });
}

export const socketInvoke = (eventName: string, data: any) =>
  new Promise((resolve) => {
    const fn = (params: any) => {
      if (params.eventName === eventName) {
        evt.off("handle-socket-event", fn);
        resolve(params);
      }
    };
    evt.on("handle-socket-event", fn);
    evt.emit("socket-event", {
      eventName,
      data,
    });
  });
