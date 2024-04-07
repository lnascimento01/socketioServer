const url = 'http://localhost:8080';
const io = require('socket.io')(3000, {
  cors: {
    origin: ['http://localhost:8080', 'https://*.ngrok.io'],
    methods: ["GET", "POST"],
    credentials: true,
    path: 'socketio'
  }
});

const users = {};
const activeClients = new Map();

io.on('connection', (socket) => {
  console.log('Cliente conectado: ' + socket.id);

  socket.on('authenticate', (userId) => {
    activeClients.set(userId, socket);
    console.log('Cliente autenticado com sucesso: ' + userId);
  });

  socket.on('checkClientStatus', (clientId) => {
    sendPingToClient(clientId);
  });

  socket.on('join', (room) => {
    if (!users[room]) {
      users[room] = [];
    }
    socket.join(room);
    users[room].push(socket.id);
    console.log('Cliente ' + socket.id + ' entrou na sala ' + room);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado: ' + socket.id);
    Object.keys(users).forEach(room => {
      if (users[room].includes(socket.id)) {
        users[room] = users[room].filter(id => id !== socket.id);
      }
    });
  });

  socket.on('chat message', (data) => {
    const { room, msg } = data;
    console.log(JSON.stringify(users));
    console.log(room);
    const recipientSockets = users[room] || [];
    recipientSockets.forEach(recipientSocketId => {
      console.log(recipientSocketId);
      console.log(socket.id);
      if (recipientSocketId !== socket.id) {
        io.to(recipientSocketId).emit('chat message', msg);
      }
    });
  });
});

function sendPingToClient(clientId) {
  const socket = activeClients.get(clientId);
  if (socket) {
    socket.emit('ping', Date.now());
  }
}
