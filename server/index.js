const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const {
  createRoom,
  publicRoomState,
  placeStone,
  resetRoom,
} = require("./game");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const rooms = new Map();
const socketRoom = new Map();

app.use(express.static(path.join(__dirname, "../public")));

function generateRoomId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  if (rooms.has(id)) return generateRoomId();
  return id;
}

function getPlayerColor(room, socketId) {
  if (room.players.black === socketId) return 1;
  if (room.players.white === socketId) return 2;
  return 0;
}

function emitRoom(room) {
  io.to(room.id).emit("room:state", publicRoomState(room));
}

function leaveRoom(socket) {
  const roomId = socketRoom.get(socket.id);
  if (!roomId) return;

  const room = rooms.get(roomId);
  socketRoom.delete(socket.id);
  socket.leave(roomId);

  if (!room) return;

  const wasBlack = room.players.black === socket.id;
  const wasWhite = room.players.white === socket.id;

  if (wasBlack) room.players.black = null;
  if (wasWhite) room.players.white = null;
  room.rematchVotes.delete(socket.id);

  if (!room.players.black && !room.players.white) {
    rooms.delete(roomId);
    return;
  }

  if (room.status === "playing") {
    room.status = "abandoned";
    room.winner = wasBlack ? 2 : wasWhite ? 1 : room.winner;
  } else if (room.status === "waiting") {
    // keep waiting for another player
  }

  emitRoom(room);
  io.to(roomId).emit("room:notice", {
    message: "对手已离开房间",
  });
}

io.on("connection", (socket) => {
  socket.emit("hello", { id: socket.id });

  socket.on("room:create", (payload = {}, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};
    if (socketRoom.has(socket.id)) {
      respond({ ok: false, error: "你已在房间中" });
      return;
    }

    const roomId = generateRoomId();
    const room = createRoom(roomId, socket.id);
    rooms.set(roomId, room);
    socketRoom.set(socket.id, roomId);
    socket.join(roomId);

    respond({
      ok: true,
      roomId,
      color: 1,
      state: publicRoomState(room),
    });
  });

  socket.on("room:join", (payload = {}, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};
    const roomId = String(payload.roomId || "")
      .trim()
      .toUpperCase();

    if (!roomId) {
      respond({ ok: false, error: "请输入房间号" });
      return;
    }

    if (socketRoom.has(socket.id)) {
      respond({ ok: false, error: "你已在房间中" });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      respond({ ok: false, error: "房间不存在" });
      return;
    }

    if (room.players.black && room.players.white) {
      respond({ ok: false, error: "房间已满" });
      return;
    }

    let color = 0;
    if (!room.players.black) {
      room.players.black = socket.id;
      color = 1;
    } else {
      room.players.white = socket.id;
      color = 2;
    }

    if (room.players.black && room.players.white) {
      room.status = "playing";
      room.rematchVotes = new Set();
    }

    socketRoom.set(socket.id, roomId);
    socket.join(roomId);

    respond({
      ok: true,
      roomId,
      color,
      state: publicRoomState(room),
    });

    emitRoom(room);
    if (room.status === "playing") {
      io.to(roomId).emit("room:notice", { message: "双方已就位，黑棋先行" });
    }
  });

  socket.on("game:move", (payload = {}, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};
    const roomId = socketRoom.get(socket.id);
    const room = roomId ? rooms.get(roomId) : null;

    if (!room) {
      respond({ ok: false, error: "不在房间中" });
      return;
    }

    const row = Number(payload.row);
    const col = Number(payload.col);
    const result = placeStone(room, socket.id, row, col);

    if (!result.ok) {
      respond(result);
      return;
    }

    respond({ ok: true });
    emitRoom(room);
  });

  socket.on("game:rematch", (_payload, ack) => {
    const respond = typeof ack === "function" ? ack : () => {};
    const roomId = socketRoom.get(socket.id);
    const room = roomId ? rooms.get(roomId) : null;

    if (!room) {
      respond({ ok: false, error: "不在房间中" });
      return;
    }

    if (!getPlayerColor(room, socket.id)) {
      respond({ ok: false, error: "仅玩家可申请再战" });
      return;
    }

    if (room.status !== "finished" && room.status !== "abandoned") {
      respond({ ok: false, error: "对局尚未结束" });
      return;
    }

    if (!room.players.black || !room.players.white) {
      respond({ ok: false, error: "等待对手重新加入" });
      return;
    }

    room.rematchVotes.add(socket.id);
    respond({ ok: true, votes: room.rematchVotes.size });

    if (room.rematchVotes.size >= 2) {
      resetRoom(room);
      emitRoom(room);
      io.to(roomId).emit("room:notice", { message: "再战开始，黑棋先行" });
    } else {
      emitRoom(room);
      socket.to(roomId).emit("room:notice", { message: "对手申请再战，点击同意即可开始" });
    }
  });

  socket.on("room:leave", () => {
    leaveRoom(socket);
  });

  socket.on("disconnect", () => {
    leaveRoom(socket);
  });
});

server.listen(PORT, () => {
  console.log(`墨弈 · 五子棋已启动 http://localhost:${PORT}`);
});
