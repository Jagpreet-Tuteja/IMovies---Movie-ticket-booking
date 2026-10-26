const { Server } = require('socket.io');

let io;

// Clients join a room per show and are told to refresh the seat map whenever it changes
function initSocket(httpServer, origin) {
  io = new Server(httpServer, { cors: { origin } });
  io.on('connection', (socket) => {
    socket.on('show:join', (showId) => socket.join(`show:${showId}`));
    socket.on('show:leave', (showId) => socket.leave(`show:${showId}`));
  });
}

function emitSeatUpdate(showId) {
  io?.to(`show:${showId}`).emit('seats:changed', { showId: String(showId) });
}

module.exports = { initSocket, emitSeatUpdate };
