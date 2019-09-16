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

module.exports = mongoose.model('Game', gameSchema);
