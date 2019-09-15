const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  drawerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  word: {
    type: String,
    required: true
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  score: {
    type: Number,
  },
  isLive: {
    type: Boolean,
    required: true,
    default: true
  }
});

module.exports = mongoose.model('Round', roundSchema);

