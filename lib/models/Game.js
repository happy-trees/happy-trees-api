const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  totalRounds: {
    type: Number,
    required: true,
    default: 5
  },
  isFinished: {
    type: Boolean,
    required: true,
    default: false
  },
  isStarted: {
    type: Boolean,
    required: true,
    default: false
  },
  currentRound: {
    type: Number,
    required: true,
    default: 1
  }
});

gameSchema.methods.answer = async function ({ answer, userId }) {
  const round = await this.model('Round')
    .findOne({
      game: this._id,
      roundNumber: this.currentRound,
      isLive: true
    });
  if (!round) {
    // what to do?
  }

  const userByRound = await this.model('UsersByRound')
    .findOne({
      round: round._id,
      user: userId
    });

  if (userByRound.guessesLeft <= 0) {
    // what to do??
  }

  if (round.word.toLowerCase() === answer) {
    await this.model('Round')
      .findByIdAndUpdate(round._id, {
        isLive: false,
        winner: userId,
        score: userByRound.guessesLeft,
        drawerScore: 2
      });
    if (this.currentRound >= this.totalRounds) {
      this.score();
    }

    return {
      isCorrect: true,
      answer,
      userId: socket.user._id,
      nickname: socket.user.nickname
    };
  } else {
    userByRound.guessesLeft -= 1;
    userByRound.save();

    return {
      isCorrect: false,
      answer,
      userId: socket.user._id,
      nickname: socket.user.nickname,
      guessesLeft: guesser.guessesLeft
    };
  }
}

gameSchema.methods.score = async function () {
  // score logic
  // return scores
}

module.exports = mongoose.model('Game', gameSchema);
