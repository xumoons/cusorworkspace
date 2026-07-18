const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  createRoom,
  placeStone,
  resetRoom,
  publicRoomState,
} = require("../server/game");

describe("gomoku game logic", () => {
  it("creates a waiting room for the host as black", () => {
    const room = createRoom("ABC123", "host");
    const state = publicRoomState(room);
    assert.equal(state.status, "waiting");
    assert.equal(state.players.black, true);
    assert.equal(state.players.white, false);
    assert.equal(state.current, 1);
  });

  it("places stones in turn and detects a horizontal win", () => {
    const room = createRoom("WIN001", "p1");
    room.players.white = "p2";
    room.status = "playing";

    for (let col = 0; col < 4; col += 1) {
      assert.equal(placeStone(room, "p1", 7, col).ok, true);
      assert.equal(placeStone(room, "p2", 8, col).ok, true);
    }

    const result = placeStone(room, "p1", 7, 4);
    assert.equal(result.ok, true);
    assert.equal(room.status, "finished");
    assert.equal(room.winner, 1);
    assert.equal(room.winningLine.length, 5);
  });

  it("rejects out-of-turn moves", () => {
    const room = createRoom("TURN01", "p1");
    room.players.white = "p2";
    room.status = "playing";

    const result = placeStone(room, "p2", 7, 7);
    assert.equal(result.ok, false);
  });

  it("resets board for rematch", () => {
    const room = createRoom("AGAIN1", "p1");
    room.players.white = "p2";
    room.status = "finished";
    room.winner = 1;
    room.board[0][0] = 1;

    resetRoom(room);
    assert.equal(room.status, "playing");
    assert.equal(room.winner, null);
    assert.equal(room.board[0][0], 0);
    assert.equal(room.current, 1);
  });
});
