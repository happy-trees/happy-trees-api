const mongoose = require('mongoose');

const usersByGameSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hasDrawn: {
    type: Number,
    required: true,
    default: 0
  },
  points: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('UsersByGame', usersByGameSchema);
