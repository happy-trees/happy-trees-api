const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({

  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  drawerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    required: true
  }
});

module.exports = mongoose.model('Round', roundSchema);

