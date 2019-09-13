const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookie = require('cookie');

const User = require('./models/User');

app.use(express.json());
app.use(require('cookie-parser')());
app.use(cors({
  origin: true,
  credentials: true
}));

io
  .use(function(socket, next) {
    const token = cookie.parse(socket.handshake.headers.cookie).session;
    if(!token) {
      const err = new Error('No session cookie');
      err.status = 401;
      return next(err);
    }
    User
      .findByToken(token)
      .then(user => {
        if(!user) {
          const err = new Error('Invalid token');
          err.status = 401;
          return next(err);
        }
        socket.user = user;
        next();
      })
      .catch(next);
  })
  .on('connection', (socket) => {
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
