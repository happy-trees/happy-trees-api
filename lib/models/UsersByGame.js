const mongoose = require('mongoose');

const usersByGameSchema = new mongoose.Schema({

  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hasDrawn: {
    type: Boolean,
    required: true,
    default: false
  }
});

module.exports = mongoose.model('UsersByGame', usersByGameSchema);
