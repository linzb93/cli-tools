import { Server } from "socket.io";
export default function (ws: Server) {
  ws.on("2", () => {});
}
