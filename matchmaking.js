const { v4: uuidv4 } = require('uuid');
const TicTacToeGame = require('./game');

const queue = [];
const activeRooms = new Map();   // roomId -> { game, players: { X: socket, O: socket } }
const socketRooms = new Map();   // socketId -> roomId

function addToQueue(socket, io) {
    if (queue.length > 0) {
        const opponent = queue.shift();

        const roomId = uuidv4();
        const game = new TicTacToeGame();

        // Attribution aléatoire des symboles
        const [symbolA, symbolB] = Math.random() < 0.5 ? ['X', 'O'] : ['O', 'X'];

        activeRooms.set(roomId, {
            game,
            players: { [symbolA]: opponent, [symbolB]: socket },
        });
        socketRooms.set(opponent.id, roomId);
        socketRooms.set(socket.id, roomId);

        opponent.join(roomId);
        socket.join(roomId);

        opponent.emit('game-start', { symbol: symbolA, roomId });
        socket.emit('game-start', { symbol: symbolB, roomId });
    } else {
        queue.push(socket);
        socket.emit('waiting');
    }
}

function removeFromQueue(socket) {
    const index = queue.indexOf(socket);
    if (index !== -1) {
        queue.splice(index, 1);
    }
}

function handleDisconnect(socket, io) {
    removeFromQueue(socket);

    const roomId = socketRooms.get(socket.id);
    if (!roomId) return;

    const room = activeRooms.get(roomId);
    if (room) {
        // Prévient l'adversaire
        for (const [, player] of Object.entries(room.players)) {
            if (player.id !== socket.id) {
                player.emit('opponent-left');
            }
        }
        activeRooms.delete(roomId);
    }

    socketRooms.delete(socket.id);
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeRooms, socketRooms };
