const mongoose = require('mongoose');

const usersByRoundSchema = new mongoose.Schema({
  round: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  guessesLeft: {
    type: Number,
    required: true, 
    default: 3
  }
});

module.exports = mongoose.model('UsersByRound', usersByRoundSchema);
