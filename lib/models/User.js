const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  nickName: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  hashedPassword: {
    type: String
  },
  isGuest: {
    type: Boolean
  },
  avatar: {
    type: String
  }
});

module.exports = mongoose.model('User', userSchema);
