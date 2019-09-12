const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(cors({
  origin: true
}));

io.on('connection', (socket) => {
  // eslint-disable-next-line no-console
  console.log('connection made', socket.id);

  // eslint-disable-next-line no-console
  socket.on('disconnect', () => console.log('Client has disconnected', socket.id));

  socket.on('stroke', data => {
    socket.broadcast.emit('stroke', data);
  });
});

app.use('/api/v1/auth', require('./routes/auth'));

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;
