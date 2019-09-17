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
      socket.broadcast.to(gameId).emit('stroke', data);
    });

    socket.on('answer', async({ answer, roundId, gameId, currentRoundNumber, intervalId }) => {
      // console.log('INTERVALID ANSWER', intervalId);
      // clearInterval(socket.roundTimerId);
      const round = await Round.findById(roundId);
      if(round.isLive && round.word === answer) {
        resetInterval(socket);
        io.to(gameId).emit('correct answer', { 
          isCorrect: true, 
          answer, 
          userId: socket.user._id, 
          nickname: socket.user.nickname 
        });
        await Round.findByIdAndUpdate(roundId, { isLive: false, winnerId: socket.user._id, score: 3 });
        if(currentRoundNumber < 5) {
          startIntermission(gameId, currentRoundNumber, socket);
        }
      } else if(round.isLive && round.word !== answer) {
        io.to(gameId).emit('wrong answer', { 
          isCorrect: false, 
          answer, 
          userId: socket.user._id,
          nickname: socket.user.nickname
        });
      }
    });

    socket.on('find game', async() => {
      const waitingGames = await Game.find({ isStarted: false });
      const game = waitingGames[0];

      if(waitingGames.length) {
        socket.join(game._id);
        socket.emit('joined game', game._id);

        await UsersByGame.create({ userId: socket.user._id, gameId: game._id });
        const gameUsers = await UsersByGame.find({ gameId: game._id });
        await Game.findByIdAndUpdate(game._id, { isStarted: true });
        const round = await Round.create({ 
          gameId: game._id, 
          drawerId: gameUsers[0].userId,
          word: 'trees',
          roundNumber: 1
        });
        await UsersByGame.findOneAndUpdate({ userId: gameUsers[0].userId }, { hasDrawn: true });

        startRound(game._id, round, socket);

      } else {
        const game = await Game.create({});

        socket.join(game._id);
        socket.emit('joined game', game._id);

        await UsersByGame.create({ userId: socket.user._id, gameId: game._id });
      }
    });
  });

// const startFirstRound = (gameId, socket) => {
//   let countdown = 10;
//   let roundTimerId = setInterval(async() => {
//     countdown--;
//     const startRound = await Round.create({ 
//       gameId: game._id, 
//       drawerId: gameUsers[0].userId,
//       word: 'trees',
//       roundNumber: 1,
//       intervalId: roundTimerId
//     });
//   })
// }

const resetInterval = (socket) => {
  clearInterval(socket.roundTimerId);
  socket.roundTimerId = null;
};

const startRound = (gameId, round, socket) => {
  let countdown = 10;
  socket.roundTimerId = setInterval(async() => {
    if(countdown === 10)
      io.to(gameId).emit('start game', { round, intervalId: socket.roundTimerId });
    countdown--;
    io.to(gameId).emit('timer', { countdown, round });
    if(countdown === 0) {
      io.to(gameId).emit('round over');
      await Round.findByIdAndUpdate(round._id, { isLive: false, winnerId: socket.user._id, score: 3 });
      if(round.roundNumber < 5) {
        startIntermission(gameId, round.roundNumber, socket);
      } else {
        io.to(gameId).emit('game over');
      }
      resetInterval(socket);
    }
  }, 1000);
};

const startIntermission = (gameId, currentRoundNumber, socket) => {
  let countdown = 10;
  let intermissionTimerId = setInterval(async() => {
    countdown--;
    io.to(gameId).emit('intermission', { countdown });
    if(countdown === 0) {
      clearInterval(intermissionTimerId);
      const game = await Game.findByIdAndUpdate(gameId, { currentRound: currentRoundNumber + 1 });
      const gameUsers = await UsersByGame.find({ gameId: game._id, hasDrawn: false });
      const round = await Round.create({ 
        gameId, 
        drawerId: gameUsers[0].userId,
        roundNumber: currentRoundNumber + 1,
        word: 'trees'
      });
      io.to(gameId).emit('new round', { round });
      startRound(gameId, round, socket);
    }
  }, 1000);
};

module.exports = http;
