const EventEmitter = require('events');

module.exports = class HappyTrees extends EventEmitter {
  constructor() {
    super();

    this.on('answer', this.answer);
  }

  async answer({ answer, roundId, gameId, currentRoundNumber }) {
    const round = await Round.findById(roundId);
    const userByRound = await UsersByRound
      .findOne({ user: socket.user._id, round: roundId });

    if (userByRound.guessesLeft > 0) {
      if (round.isLive && round.word.toLowerCase() === answer.toLowerCase()) {

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
          drawerScore: 2
        });

        if (currentRoundNumber < 5) {
          startIntermission(gameId, currentRoundNumber, socket);
        } else {
          scoreGame(gameId);
        }

      } else if (round.isLive && round.word.toLowerCase() !== answer.toLowerCase()) {

        const guesser = await UsersByRound.
          findOne({ user: socket.user._id, round: roundId });
        guesser.guessesLeft = guesser.guessesLeft - 1;
        guesser.save();

        this.emit('wrong answer', {
          gameId,
          data: {
            isCorrect: false,
            answer,
            userId: socket.user._id,
            nickname: socket.user.nickname,
            guessesLeft: guesser.guessesLeft
          }
        });
      }
    }
  }
}
