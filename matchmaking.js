const { v4: uuidv4 } = require('uuid');
const TicTacToeGame = require('./game');

const queue = [];
const activeRooms = new Map();   // roomId -> { game, players: { X: socket, O: socket } }
const socketRooms = new Map();   // socketId -> roomId

function addToQueue(socket, io) {
    // Empêche un double-enregistrement et la jonction d'un joueur déjà en partie
    if (queue.includes(socket) || socketRooms.has(socket.id)) return;

    if (queue.length > 0) {
        const opponent = queue.shift();

        // L'adversaire peut s'être déconnecté entre-temps
        if (!opponent.connected) {
            return addToQueue(socket, io);
        }

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
        // Prévient l'adversaire et nettoie TOUTES les entrées socketRooms de la room
        for (const player of Object.values(room.players)) {
            if (player.id !== socket.id) {
                player.emit('opponent-left');
            }
            socketRooms.delete(player.id);
        }
        activeRooms.delete(roomId);
    } else {
        socketRooms.delete(socket.id);
    }
}

module.exports = { addToQueue, removeFromQueue, handleDisconnect, activeRooms, socketRooms };
