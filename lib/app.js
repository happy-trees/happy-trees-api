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

    socket.on('stroke', ({ data, gameId }) => {
      io.to(gameId).emit('stroke', data);
    });

    socket.on('answer', async({ answer, roundId, gameId }) => {
      const round = await Round.findById(roundId);
      if(round.isLive && round.word === answer) {
        io.to(gameId).emit('correct answer', { isCorrect: true });
        await Round.findByIdAndUpdate(roundId, { isLive: false, winnerId: socket.user._id, score: 3 });
      }
    });

    socket.on('find game', async() => {
      console.log('Looking for game that has not started');
      const waitingGames = await Game.find({ isStarted: false });
      const game = waitingGames[0];

      if(waitingGames.length) {
        console.log('There is a game you can join');
        socket.join(game._id);
        socket.emit('joined game', game._id);

        await UsersByGame.create({ userId: socket.user._id, gameId: game._id });
        const gameUsers = await UsersByGame.find({ gameId: game._id });
        await Game.findByIdAndUpdate(game._id, { isStarted: true });
        const startRound = await Round.create({ 
          gameId: game._id, 
          drawerId: gameUsers[0].userId,
          word: 'trees'
        });

        io.to(game._id).emit('start game', startRound);
        startRoundTimer(game._id);

      } else {
        console.log('There is not a game you can join');
        const game = await Game.create({});

        socket.join(game._id);
        socket.emit('joined game', game._id);

        await UsersByGame.create({ userId: socket.user._id, gameId: game._id });
      }
    });
  });

const startRoundTimer = (gameId) => {
  let countdown = 10;
  let intervalId = setInterval(function() {
    countdown--;
    io.to(gameId).emit('timer', countdown);
    if(countdown === 0) clearInterval(intervalId);
  }, 1000);
};

module.exports = http;
