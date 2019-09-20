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

    socket.on('answer', async({ answer, roundId, gameId, currentRoundNumber }) => {
      const round = await Round.findById(roundId);
      const userByRound = await UsersByRound
        .findOne({ user: socket.user._id, round: roundId });

      if(userByRound.guessesLeft > 0) {
        if(round.isLive && round.word.toLowerCase() === answer.toLowerCase()) {

          resetInterval(roundId);
          io.to(gameId).emit('correct answer', { 
            isCorrect: true, 
            answer, 
            userId: socket.user._id, 
            nickname: socket.user.nickname 
          });

          await Round.findByIdAndUpdate(roundId, { 
            isLive: false, 
            winner: socket.user._id, 
            score: userByRound.guessesLeft,
            drawerScore: 3
          });

          if(currentRoundNumber < 5) {
            startIntermission(gameId, currentRoundNumber, socket);
          } else {
            scoreGame(gameId);
          }

        } else if(round.isLive && round.word.toLowerCase() !== answer.toLowerCase()) {

          const guesser = await UsersByRound.
            findOne({ user: socket.user._id, round: roundId });
          guesser.guessesLeft = guesser.guessesLeft - 1;
          guesser.save();
  
  
          io.to(gameId).emit('wrong answer', { 
            isCorrect: false, 
            answer, 
            userId: socket.user._id,
            nickname: socket.user.nickname,
            guessesLeft: guesser.guessesLeft
          });
          
        }
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

const scoreGame = async(gameId) => {
  const rounds = await Round
    .find({ game: gameId })
    .populate('winner')
    .populate('drawer');
  const usersByGame = await UsersByGame
    .find({ game: gameId })
    .populate('user');

  const scores = rounds.reduce((acc, round) => {
    if(round.winner) {
      acc[round.winner._id] 
        ? acc[round.winner._id].score += round.score 
        : acc[round.winner._id] = {
          score: round.score,
          user: round.winner
        }; 
    }

    if(round.drawerScore) {
      acc[round.drawer._id]
        ? acc[round.drawer._id].score += round.drawerScore
        : acc[round.drawer._id] = {
          score: round.drawerScore,
          user: round.drawer
        };
    }

    return acc;
  }, {});

  usersByGame.forEach(userByGame => {
    if(!scores[userByGame.user._id]) {
      scores[userByGame.user._id] = {
        score: 0,
        user: userByGame.user
      };
    }
  });

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
    }
  }, 1000);
};

module.exports = http;
