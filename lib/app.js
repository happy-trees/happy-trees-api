const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookie = require('cookie');

const User = require('./models/User');
const Game = require('./models/Game');
const Round = require('./models/Round');
const UsersByGame = require('./models/UsersByGame');

app.use(express.json());
app.use(require('cookie-parser')());
app.use(cors({
  origin: true,
  credentials: true
}));

app.use('/api/v1/auth', require('./routes/auth'));

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

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
    console.log('connection made by user', socket.id, socket.user.nickname);

    // eslint-disable-next-line no-console
    socket.on('disconnect', () => console.log('Client has disconnected', socket.id));

    socket.on('stroke', (data) => {
      socket.broadcast.emit('stroke', data);
    });

    socket.on('find game', async() => {
      console.log('Looking for game that has not started');
      const waitingGames = await Game.find({ isStarted: false });
      if(waitingGames.length) {
        console.log('There is a game you can join');
        socket.join(waitingGames[0]._id);
        socket.emit('joined game', waitingGames[0]._id);
        await UsersByGame.create({ userId: socket.user._id, gameId: waitingGames[0]._id });
        await Game.findByIdAndUpdate(waitingGames[0]._id, { isStarted: true });
        io.to(waitingGames[0]._id).emit('start game');
      } else {
        console.log('There is not a game you can join');
        const game = await Game.create({});
        socket.join(game._id);
        socket.emit('joined game', game._id);
        await UsersByGame.create({ userId: socket.user._id, gameId: game._id });
      }
    });
  });

module.exports = http;
