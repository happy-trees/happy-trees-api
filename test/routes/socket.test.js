const { getToken, getToken2 } = require('../data-helpers');
const io = require('socket.io-client');
const http = require('../../lib/app');

describe('auth routes', () => {
  let socket1;
  let socket2;
  beforeEach(async() => {
    http.listen(3001);

    const token = getToken();
    const token2 = getToken2();

    socket1 = io.connect('http://localhost:3001', {
      extraHeaders: { Cookie: token },
      'reconnection delay' : 0, 
      'reopen delay' : 0, 
      'force new connection' : true, 
      transports: ['websocket']
    });

    socket2 = io.connect('http://localhost:3001', {
      extraHeaders: { Cookie: token2 },
      'reconnection delay' : 0, 
      'reopen delay' : 0, 
      'force new connection' : true, 
      transports: ['websocket']
    });
  });

  afterEach(() => {
    http.close();
  });

  it('starts a game and sends a stroke', (done) => {
    socket2.on('stroke', (data) => {
      expect(data).toEqual({
        x: 0,
        y: 10,
        px: 30,
        py: 47,
        color: '#000000',
        strokeWidth: 5
      });
      socket1.close();
      socket2.close();
      done();
    });
    socket1.on('start game', startRound => {
      socket1.emit('stroke', { data, gameId: startRound.gameId });
    });
    const data = {
      x: 0,
      y: 10,
      px: 30,
      py: 47,
      color: '#000000',
      strokeWidth: 5
    };
    socket1.emit('find game');
    setTimeout(() => {
      socket2.emit('find game');
    }, 500);
  });

  it('starts a game and and sends a correct answer', (done) => {
    socket2.on('correct answer', ({ isCorrect }) => {
      expect(isCorrect).toEqual(true);
      socket1.close();
      socket2.close();
      done();
    });
    socket1.on('start game', (startRound) => {
      socket1.emit('answer', { 
        answer: 'trees', 
        roundId: startRound._id, 
        gameId: startRound.gameId,
        currentRoundNumber: startRound.roundNumber
      });
    });
    socket1.emit('find game');
    setTimeout(() => {
      socket2.emit('find game');
    }, 500);
  });

  it('starts the intermission timer after a correct answer', (done) => {
    socket2.on('correct answer', ({ isCorrect }) => {
      expect(isCorrect).toEqual(true);
    });
    socket2.on('intermission', ({ countdown }) => {
      expect(countdown).toEqual(9);
      socket1.close();
      socket2.close();
      done();
    });
    socket1.on('start game', (startRound) => {
      socket1.emit('answer', { 
        answer: 'trees', 
        roundId: startRound._id, 
        gameId: startRound.gameId,
        currentRoundNumber: startRound.roundNumber
      });
    });
    socket1.emit('find game');
    setTimeout(() => {
      socket2.emit('find game');
    }, 500);
  });

  // it('gets the start of new round event', (done) => {
  //   socket2.on('correct answer', ({ isCorrect }) => {
  //     expect(isCorrect).toEqual(true);
  //   });
  //   socket2.on('new round', (round) => {
  //     expect(round.roundNumber).toEqual(2);
  //     socket1.close();
  //     socket2.close();
  //     done();
  //   });
  //   socket1.on('start game', (startRound) => {
  //     socket1.emit('answer', { 
  //       answer: 'trees', 
  //       roundId: startRound._id, 
  //       gameId: startRound.gameId,
  //       currentRoundNumber: startRound.roundNumber
  //     });
  //   });
  //   socket1.emit('find game');
  //   setTimeout(() => {
  //     socket2.emit('find game');
  //   }, 100);
  // });
});
