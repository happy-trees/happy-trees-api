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
const UsersByRound = require('./models/UsersByRound');
const WordsByGame = require('./models/WordsByGame');

const { words } = require('./data/words');

const roundIntervalDict = {};

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
  .use((socket, next) => ensureAuth(socket, next))
  .on('connection', (socket) => {
    socket.on('disconnect', (gameId) => socket.leave(gameId));

    socket.on('stroke', ({ data, gameId }) => {
      socket.broadcast.to(gameId).emit('stroke', data);
    });

    socket.on('answer', async({ answer, roundId, gameId, currentRoundNumber }) => {
      const game = await Game.findById(gameId);
      const result = await game.answer({ socket, answer });
      if(result && result.isCorrect) {
        io.to(gameId).emit('correct answer', result);
        resetInterval(roundId);
        if(currentRoundNumber < 5) {
          startIntermission(gameId, currentRoundNumber, socket);
        } else {
          scoreGame(gameId);
        }
      } else if(result && !result.isCorrect) {
        io.to(gameId).emit('wrong answer', result);
      }
    });

    socket.on('find game', async() => {
      const waitingGames = await Game.find({ isStarted: false });
      const game = waitingGames[0];

      if(waitingGames.length) {
        socket.join(game._id);
        socket.emit('joined game', game._id);

        await UsersByGame.create({ 
          user: socket.user._id,
          game: game._id,
          hasDrawn: 1
        });

        const wordsByGame = await WordsByGame.find({ game: game._id, round: 1 });

        await Game.findByIdAndUpdate(game._id, { isStarted: true });
        const round = await Round.create({ 
          game: game._id, 
          drawer: socket.user._id,
          word: wordsByGame[0].word,
          roundNumber: 1
        });

        const players = await UsersByGame.find({ game: game._id });
        await UsersByRound.create(players.map(player => ({
          user: player.user,
          round: round._id
        })));

        startRound(game._id, round, socket);

      } else {
        const game = await Game.create({});

        const randomWords = words.sort(() => 0.5 - Math.random()).slice(0, 5);
        await WordsByGame.create(randomWords.map((word, i) => ({
          word: word,
          game: game._id,
          round: i + 1
        })));

        socket.join(game._id);
        socket.emit('joined game', game._id);
        await UsersByGame.create({ user: socket.user._id, game: game._id });
      }
    });
  });

const ensureAuth = (socket, next) => {
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
};
  
const scoreGame = async(gameId) => {
  const rounds = await Round
    .find({ game: gameId })
    .populate('winner')
    .populate('drawer');
  const usersByGame = await UsersByGame
    .find({ game: gameId })
    .populate('user');

  const initialScores = usersByGame.reduce((acc, userByGame) => {
    acc[userByGame.user._id] = {
      score: 0,
      user: userByGame.user
    };
    return acc;
  }, {});

  const scores = rounds.reduce((acc, round) => {
    if(round.winner) acc[round.winner._id].score += round.score;
    if(round.drawerScore) acc[round.drawer._id].score += round.drawerScore;

    return acc;
  }, initialScores);

  const sortedScores = [...Object.values(scores)].sort((a, b) => b.score - a.score);
  io.to(gameId).emit('game scores', { scores: sortedScores });
};

const resetInterval = (roundId) => {
  clearInterval(roundIntervalDict[roundId]);
  roundIntervalDict[roundId] = null;
};

const startRound = (gameId, round, socket) => {
  let countdown = 10;

  roundIntervalDict[round._id] = setInterval(async() => {
    if(countdown === 10 && round.roundNumber === 1)
      io.to(gameId).emit('new round', { round, drawer: socket.user });

    countdown--;
    io.to(gameId).emit('timer', { countdown, round });

    if(countdown === 0) {
      io.to(gameId).emit('round over');

      await Round.findByIdAndUpdate(round._id, { isLive: false });

      if(round.roundNumber < 5) {
        startIntermission(gameId, round.roundNumber, socket);
      } else {
        scoreGame(gameId);
      }

      resetInterval(round._id);
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
      makeRound(gameId, currentRoundNumber, socket);
    }
  }, 1000);
};

const makeRound = async(gameId, currentRoundNumber, socket) => {
  const game = await Game.findByIdAndUpdate(gameId, { currentRound: currentRoundNumber + 1 });
  const gameUsers = await UsersByGame
    .find({ game: game._id })
    .populate('user')
    .sort({ hasDrawn: 1, updatedAt: 1 });
  const wordsByGame = await WordsByGame
    .find({ game: game._id, round: currentRoundNumber + 1 });

  const round = await Round.create({ 
    game: gameId, 
    drawer: gameUsers[0].user._id,
    roundNumber: currentRoundNumber + 1,
    word: wordsByGame[0].word
  });

  await UsersByGame
    .findByIdAndUpdate(gameUsers[0]._id, { 
      hasDrawn: gameUsers[0].hasDrawn + 1
    }, { new: true });

  await UsersByRound.create(gameUsers.map(player => ({
    user: player.user._id,
    round: round._id
  })));

  io.to(gameId).emit('new round', { round, drawer: gameUsers[0].user });
  startRound(gameId, round, socket);
};

module.exports = http;
