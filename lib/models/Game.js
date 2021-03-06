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

gameSchema.methods.answer = async function({ socket, answer }) {
  const round = await this.model('Round')
    .findOne({
      game: this._id,
      roundNumber: this.currentRound,
      isLive: true
    });

  const userByRound = await this.model('UsersByRound')
    .findOne({
      round: round._id,
      user: socket.user._id
    });
  if(round.word.toLowerCase() === answer.toLowerCase()) {
    await this.model('Round')
      .findByIdAndUpdate(round._id, {
        isLive: false,
        winner: socket.user._id,
        score: userByRound.guessesLeft,
        drawerScore: 2 
      }, { new: true });
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
      guessesLeft: userByRound.guessesLeft
    };
  }
};

module.exports = mongoose.model('Game', gameSchema);
