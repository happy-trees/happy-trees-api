const { Router } = require('express');
const User = require('../models/User');

module.exports = Router()
  .post('/guest', (req, res, next) => {
    const {
      isGuest,
      nickname,
      avatar
    } = req.body;

    User
      .create({ isGuest, nickname, avatar })
      .then(user => {
        res.cookie('session', user.authToken(), {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000
        });
        res.send(user);
      })
      .catch(next);
  });
