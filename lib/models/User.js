const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true
  },
  email: {
    type: String, trim: true, index: {
      unique: true,
      partialFilterExpression: {email: {$type: "string"}}
    }
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

userSchema.virtual('password').set(function(clearPassword) {
  this.hashedPassword = bcrypt.hashSync(clearPassword);
});

userSchema.methods.compare = function(clearPassword) {
  return bcrypt.compareSync(clearPassword, this.hashedPassword);
};

userSchema.methods.authToken = function() {
  return jwt.sign(this.toJSON(), process.env.APP_SECRET, { expiresIn: '24h' });
};

userSchema.statics.findByToken = function(token) {
  try {
    const userPayload = jwt.verify(token, process.env.APP_SECRET);
    return this
      .findById(userPayload._id);
  } 
  catch(err) {
    throw new Error('invalid token');
  }
};


module.exports = mongoose.model('User', userSchema);
