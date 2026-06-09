const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { addToQueue, handleDisconnect, activeRooms, socketRooms } = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`Joueur connecté : ${socket.id}`);

  socket.on('find-game', () => {
    addToQueue(socket, io);
  });

  socket.on('make-move', ({ index }) => {
    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    const room = activeRooms.get(roomId);
    if (!room) return;

    // Vérifie que c'est bien le tour de ce joueur
    const symbol = Object.keys(room.players).find(s => room.players[s].id === socket.id);
    if (!symbol || symbol !== room.game.currentTurn) return;

    const result = room.game.makeMove(index);
    if (!result.valid) return;

    io.to(roomId).emit('move-made', {
      index,
      symbol: result.symbol,
      board: result.board,
    });

    if (result.winner || result.isDraw) {
      io.to(roomId).emit('game-over', {
        winner: result.winner,
        isDraw: result.isDraw,
        board: result.board,
      });
      activeRooms.delete(roomId);
      for (const player of Object.values(room.players)) {
        socketRooms.delete(player.id);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Joueur déconnecté : ${socket.id}`);
    handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
