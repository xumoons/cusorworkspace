(() => {
  const BOARD_SIZE = 15;
  const socket = io();

  const lobbyEl = document.getElementById("lobby");
  const gameEl = document.getElementById("game");
  const lobbyError = document.getElementById("lobby-error");
  const joinCodeInput = document.getElementById("join-code");
  const btnCreate = document.getElementById("btn-create");
  const btnJoin = document.getElementById("btn-join");
  const btnLeave = document.getElementById("btn-leave");
  const btnCopy = document.getElementById("btn-copy");
  const btnRematch = document.getElementById("btn-rematch");
  const roomCodeEl = document.getElementById("room-code");
  const statusText = document.getElementById("status-text");
  const noticeEl = document.getElementById("notice");
  const roleBlack = document.getElementById("role-black");
  const roleWhite = document.getElementById("role-white");
  const playerBlack = document.getElementById("player-black");
  const playerWhite = document.getElementById("player-white");
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");

  const state = {
    roomId: null,
    color: 0,
    board: null,
    current: 1,
    status: "lobby",
    winner: null,
    winningLine: null,
    lastMove: null,
    players: { black: false, white: false },
    rematchCount: 0,
  };

  let noticeTimer = null;
  let dpr = 1;

  function showError(message) {
    lobbyError.hidden = !message;
    lobbyError.textContent = message || "";
  }

  function showNotice(message, ms = 3200) {
    if (!message) {
      noticeEl.hidden = true;
      noticeEl.textContent = "";
      return;
    }
    noticeEl.hidden = false;
    noticeEl.textContent = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noticeEl.hidden = true;
    }, ms);
  }

  function showLobby() {
    lobbyEl.hidden = false;
    gameEl.hidden = true;
    state.roomId = null;
    state.color = 0;
    showError("");
  }

  function showGame() {
    lobbyEl.hidden = true;
    gameEl.hidden = false;
    resizeBoard();
    drawBoard();
  }

  function colorName(color) {
    if (color === 1) return "黑棋";
    if (color === 2) return "白棋";
    return "";
  }

  function updateRoles() {
    if (state.color === 1) {
      roleBlack.textContent = "你";
      roleWhite.textContent = state.players.white ? "对手" : "等待中";
    } else if (state.color === 2) {
      roleBlack.textContent = state.players.black ? "对手" : "等待中";
      roleWhite.textContent = "你";
    } else {
      roleBlack.textContent = state.players.black ? "已就位" : "空缺";
      roleWhite.textContent = state.players.white ? "已就位" : "空缺";
    }
  }

  function updateStatus() {
    playerBlack.classList.toggle("active", state.status === "playing" && state.current === 1);
    playerWhite.classList.toggle("active", state.status === "playing" && state.current === 2);

    if (state.status === "waiting") {
      statusText.textContent = "等待对手加入… 分享房间号即可开局";
      btnRematch.hidden = true;
      return;
    }

    if (state.status === "playing") {
      const mine = state.current === state.color;
      statusText.textContent = mine
        ? `轮到你（${colorName(state.color)}）落子`
        : `等待对手（${colorName(state.current)}）落子`;
      btnRematch.hidden = true;
      return;
    }

    if (state.status === "abandoned") {
      if (state.winner === state.color) {
        statusText.textContent = "对手离开，你获得胜利";
      } else {
        statusText.textContent = "对局已中断";
      }
      btnRematch.hidden = !(state.players.black && state.players.white);
      btnRematch.textContent =
        state.rematchCount > 0 ? `再战一局（${state.rematchCount}/2）` : "再战一局";
      return;
    }

    if (state.status === "finished") {
      if (state.winner === 0) {
        statusText.textContent = "平局 · 棋盘已满";
      } else if (state.winner === state.color) {
        statusText.textContent = "你赢了";
      } else {
        statusText.textContent = `${colorName(state.winner)}获胜`;
      }
      btnRematch.hidden = false;
      btnRematch.textContent =
        state.rematchCount > 0 ? `再战一局（${state.rematchCount}/2）` : "再战一局";
    }
  }

  function applyState(next) {
    state.board = next.board;
    state.current = next.current;
    state.status = next.status;
    state.winner = next.winner;
    state.winningLine = next.winningLine;
    state.lastMove = next.lastMove;
    state.players = next.players;
    state.rematchCount = next.rematchCount || 0;
    roomCodeEl.textContent = next.id;
    updateRoles();
    updateStatus();
    drawBoard();
  }

  function resizeBoard() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(1, Math.floor(rect.width * dpr));
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }
  }

  function cellMetrics() {
    const size = canvas.width;
    const padding = size * 0.06;
    const usable = size - padding * 2;
    const gap = usable / (BOARD_SIZE - 1);
    return { size, padding, gap };
  }

  function drawBoard() {
    resizeBoard();
    const { size, padding, gap } = cellMetrics();
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "rgba(139, 100, 54, 0.08)";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "rgba(62, 42, 18, 0.55)";
    ctx.lineWidth = Math.max(1, size * 0.0022);

    for (let i = 0; i < BOARD_SIZE; i += 1) {
      const pos = padding + i * gap;
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(size - padding, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, size - padding);
      ctx.stroke();
    }

    const starPoints = [
      [3, 3],
      [3, 11],
      [7, 7],
      [11, 3],
      [11, 11],
    ];
    ctx.fillStyle = "rgba(62, 42, 18, 0.7)";
    for (const [r, c] of starPoints) {
      ctx.beginPath();
      ctx.arc(padding + c * gap, padding + r * gap, Math.max(2, gap * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }

    if (!state.board) return;

    const stoneR = gap * 0.42;
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const cell = state.board[r][c];
        if (!cell) continue;
        const x = padding + c * gap;
        const y = padding + r * gap;
        drawStone(x, y, stoneR, cell);
      }
    }

    if (state.lastMove) {
      const { row, col, color } = state.lastMove;
      const x = padding + col * gap;
      const y = padding + row * gap;
      ctx.beginPath();
      ctx.arc(x, y, stoneR * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = color === 1 ? "rgba(255,255,255,0.85)" : "rgba(40,40,40,0.75)";
      ctx.fill();
    }

    if (state.winningLine && state.winningLine.length) {
      ctx.strokeStyle = "rgba(47, 122, 104, 0.9)";
      ctx.lineWidth = Math.max(2, gap * 0.12);
      ctx.lineCap = "round";
      ctx.beginPath();
      state.winningLine.forEach(([r, c], i) => {
        const x = padding + c * gap;
        const y = padding + r * gap;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }

  function drawStone(x, y, r, color) {
    const gradient = ctx.createRadialGradient(
      x - r * 0.35,
      y - r * 0.4,
      r * 0.1,
      x,
      y,
      r
    );
    if (color === 1) {
      gradient.addColorStop(0, "#5a5a5a");
      gradient.addColorStop(0.55, "#1a1a1a");
      gradient.addColorStop(1, "#050505");
    } else {
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.55, "#efefef");
      gradient.addColorStop(1, "#c8c8c8");
    }

    ctx.beginPath();
    ctx.arc(x + r * 0.08, y + r * 0.1, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function pointToCell(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;
    const { padding, gap } = cellMetrics();
    const col = Math.round((x - padding) / gap);
    const row = Math.round((y - padding) / gap);
    if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return null;
    const cx = padding + col * gap;
    const cy = padding + row * gap;
    const dist = Math.hypot(x - cx, y - cy);
    if (dist > gap * 0.45) return null;
    return { row, col };
  }

  function createRoom() {
    showError("");
    btnCreate.disabled = true;
    socket.emit("room:create", {}, (res) => {
      btnCreate.disabled = false;
      if (!res?.ok) {
        showError(res?.error || "创建失败");
        return;
      }
      state.roomId = res.roomId;
      state.color = res.color;
      applyState(res.state);
      showGame();
      showNotice("房间已创建，把房间号发给好友吧");
    });
  }

  function joinRoom() {
    const roomId = joinCodeInput.value.trim().toUpperCase();
    showError("");
    if (!roomId) {
      showError("请输入房间号");
      return;
    }
    btnJoin.disabled = true;
    socket.emit("room:join", { roomId }, (res) => {
      btnJoin.disabled = false;
      if (!res?.ok) {
        showError(res?.error || "加入失败");
        return;
      }
      state.roomId = res.roomId;
      state.color = res.color;
      applyState(res.state);
      showGame();
    });
  }

  function leaveRoom() {
    socket.emit("room:leave");
    showLobby();
  }

  async function copyRoomCode() {
    if (!state.roomId) return;
    try {
      await navigator.clipboard.writeText(state.roomId);
      showNotice("房间号已复制");
      btnCopy.textContent = "已复制";
      setTimeout(() => {
        btnCopy.textContent = "复制";
      }, 1500);
    } catch {
      showNotice(`房间号：${state.roomId}`);
    }
  }

  function requestRematch() {
    btnRematch.disabled = true;
    socket.emit("game:rematch", {}, (res) => {
      btnRematch.disabled = false;
      if (!res?.ok) {
        showNotice(res?.error || "无法再战");
      }
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (state.status !== "playing") return;
    if (state.current !== state.color) return;
    const cell = pointToCell(event.clientX, event.clientY);
    if (!cell) return;
    if (state.board?.[cell.row]?.[cell.col]) return;

    socket.emit("game:move", cell, (res) => {
      if (!res?.ok) {
        showNotice(res?.error || "落子失败");
      }
    });
  });

  btnCreate.addEventListener("click", createRoom);
  btnJoin.addEventListener("click", joinRoom);
  btnLeave.addEventListener("click", leaveRoom);
  btnCopy.addEventListener("click", copyRoomCode);
  btnRematch.addEventListener("click", requestRematch);

  joinCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinRoom();
  });

  joinCodeInput.addEventListener("input", () => {
    joinCodeInput.value = joinCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  });

  socket.on("room:state", (next) => {
    if (!state.roomId || next.id !== state.roomId) {
      state.roomId = next.id;
      showGame();
    }
    applyState(next);
  });

  socket.on("room:notice", ({ message }) => {
    showNotice(message);
  });

  socket.on("disconnect", () => {
    if (state.roomId) {
      showNotice("连接已断开，正在重连…");
    }
  });

  window.addEventListener("resize", () => {
    if (!gameEl.hidden) drawBoard();
  });
})();
