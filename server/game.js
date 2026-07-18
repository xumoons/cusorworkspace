const BOARD_SIZE = 15;
const WIN_COUNT = 5;

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0)
  );
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function findWin(board, row, col, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    const line = [[row, col]];

    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === player) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (inBounds(r, c) && board[r][c] === player) {
      line.unshift([r, c]);
      r -= dr;
      c -= dc;
    }

    if (line.length >= WIN_COUNT) {
      const idx = line.findIndex(([r, c]) => r === row && c === col);
      const start = Math.max(0, Math.min(idx - WIN_COUNT + 1, line.length - WIN_COUNT));
      return line.slice(start, start + WIN_COUNT);
    }
  }

  return null;
}

function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== 0));
}

function createRoom(roomId, hostId) {
  return {
    id: roomId,
    players: {
      black: hostId,
      white: null,
    },
    board: createEmptyBoard(),
    current: 1,
    status: "waiting",
    winner: null,
    winningLine: null,
    lastMove: null,
    rematchVotes: new Set(),
    createdAt: Date.now(),
  };
}

function publicRoomState(room) {
  return {
    id: room.id,
    board: room.board,
    current: room.current,
    status: room.status,
    winner: room.winner,
    winningLine: room.winningLine,
    lastMove: room.lastMove,
    players: {
      black: Boolean(room.players.black),
      white: Boolean(room.players.white),
    },
    rematchCount: room.rematchVotes.size,
  };
}

function placeStone(room, playerId, row, col) {
  if (room.status !== "playing") {
    return { ok: false, error: "对局尚未开始或已结束" };
  }

  const color = room.players.black === playerId ? 1 : room.players.white === playerId ? 2 : 0;
  if (!color) {
    return { ok: false, error: "你不是本局玩家" };
  }

  if (room.current !== color) {
    return { ok: false, error: "还没轮到你落子" };
  }

  if (!inBounds(row, col) || room.board[row][col] !== 0) {
    return { ok: false, error: "此处无法落子" };
  }

  room.board[row][col] = color;
  room.lastMove = { row, col, color };

  const win = findWin(room.board, row, col, color);
  if (win) {
    room.status = "finished";
    room.winner = color;
    room.winningLine = win;
    return { ok: true };
  }

  if (isBoardFull(room.board)) {
    room.status = "finished";
    room.winner = 0;
    room.winningLine = null;
    return { ok: true };
  }

  room.current = color === 1 ? 2 : 1;
  return { ok: true };
}

function resetRoom(room) {
  room.board = createEmptyBoard();
  room.current = 1;
  room.status = room.players.black && room.players.white ? "playing" : "waiting";
  room.winner = null;
  room.winningLine = null;
  room.lastMove = null;
  room.rematchVotes = new Set();
}

module.exports = {
  BOARD_SIZE,
  createRoom,
  publicRoomState,
  placeStone,
  resetRoom,
  cloneBoard,
};
