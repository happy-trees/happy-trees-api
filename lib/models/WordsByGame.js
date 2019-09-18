const mongoose = require('mongoose');

const wordsByGameSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  round: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('WordsByGame', wordsByGameSchema);
