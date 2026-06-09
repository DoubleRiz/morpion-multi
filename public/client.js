const socket = io();

const btnFind   = document.getElementById('btn-find');
const btnReplay = document.getElementById('btn-replay');
const statusEl  = document.getElementById('status');
const cells     = document.querySelectorAll('.cell');

let mySymbol  = null;
let roomId    = null;
let myTurn    = false;
let gameOver  = false;

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

function findWinningLine(board, winner) {
    return WINNING_LINES.find(([a, b, c]) =>
        board[a] === winner && board[b] === winner && board[c] === winner
    ) || [];
}

function resetBoard() {
    cells.forEach(cell => {
        cell.textContent = '';
        cell.disabled = true;
        cell.classList.remove('winning');
    });
    btnReplay.style.display = 'none';
    gameOver = false;
    myTurn   = false;
}

function setBoardActive(active) {
    cells.forEach(cell => {
        if (active && !cell.textContent) {
            cell.disabled = false;
        } else {
            cell.disabled = true;
        }
    });
}

// --- Boutons ---

btnFind.addEventListener('click', () => {
    resetBoard();
    mySymbol = null;
    roomId   = null;
    statusEl.textContent = "Recherche d'un adversaire...";
    btnFind.disabled = true;
    socket.emit('find-game');
});

btnReplay.addEventListener('click', () => {
    resetBoard();
    mySymbol = null;
    roomId   = null;
    statusEl.textContent = "Recherche d'un adversaire...";
    btnFind.disabled = true;
    socket.emit('find-game');
});

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        if (!myTurn || gameOver || cell.textContent) return;
        const index = parseInt(cell.dataset.index, 10);
        socket.emit('make-move', { index, roomId });
    });
});

// --- Événements serveur ---

socket.on('waiting', () => {
    statusEl.textContent = "En attente d'un autre joueur...";
});

socket.on('game-start', ({ symbol, roomId: id }) => {
    mySymbol = symbol;
    roomId   = id;
    myTurn   = symbol === 'X'; // X commence toujours
    statusEl.textContent = myTurn ? 'À vous de jouer !' : "Au tour de l'adversaire";
    setBoardActive(myTurn);
});

socket.on('move-made', ({ index, symbol, board }) => {
    cells[index].textContent = symbol;
    // Désactive la case jouée même si c'est notre tour après
    cells[index].disabled = true;

    // Détermine à qui c'est le tour pour le prochain coup
    const nextTurn = symbol === 'X' ? 'O' : 'X';
    myTurn = nextTurn === mySymbol;
    statusEl.textContent = myTurn ? 'À vous de jouer !' : "Au tour de l'adversaire";
    setBoardActive(myTurn);
});

socket.on('game-over', ({ winner, isDraw, board }) => {
    gameOver = true;
    setBoardActive(false);

    if (isDraw) {
        statusEl.textContent = 'Match nul !';
    } else if (winner === mySymbol) {
        statusEl.textContent = 'Vous avez gagné !';
    } else {
        statusEl.textContent = "Vous avez perdu.";
    }

    if (winner) {
        findWinningLine(board, winner).forEach(i => {
            cells[i].classList.add('winning');
        });
    }

    btnReplay.style.display = 'inline-block';
});

socket.on('opponent-left', () => {
    gameOver = true;
    setBoardActive(false);
    statusEl.textContent = 'Adversaire déconnecté.';
    btnReplay.style.display = 'inline-block';
});
