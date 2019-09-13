const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({

  currentRound: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  },
  totalRounds: {
    type: Number, 
    required: true
  },
  isFinished: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Game', gameSchema);
