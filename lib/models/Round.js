const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  game: {
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
  winner: {
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
  },
  roundNumber: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Round', roundSchema);

