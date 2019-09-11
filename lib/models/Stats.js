const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gamesPlayed: {
    type: Number,
    required: true
  },
  guessesMade: {
    type: Number,
    required: true
  },
  gamesWon: {
    type: Number,
    required: true
  },
  correctGuesses: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Stats', statsSchema);
