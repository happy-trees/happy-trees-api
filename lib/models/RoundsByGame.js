const mongoose = require('mongoose');

const roundsByGameSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round'
  }
});

module.exports = mongoose.model('RoundsByGame', roundsByGameSchema);

