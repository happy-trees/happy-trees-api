const mongoose = require('mongoose');

const strokesByRoundSchema = new mongoose.Schema({

  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  Px: {
    type: Number,
    required: true
  },
  Py: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('StrokesByRound', strokesByRoundSchema);
