const { Router } = require('express');
const User = require('../models/User');
const ensureAuth = require('../middleware/ensure-auth');

module.exports = Router()
  .post('/guest', (req, res, next) => {
    const {
      nickname,
      avatar
    } = req.body;

    User
      .create({ isGuest: true, nickname, avatar })
      .then(user => {
        res.cookie('session', user.authToken(), {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000
        });
        res.send(user);
      })
      .catch(next);
  })

  .post('/signup', (req, res, next) => {
    const {
      nickname,
      email,
      password,
      avatar 
    } = req.body;

    User
      .create({ 
        isGuest: false,
        nickname,
        email,
        password,
        avatar
      })
      .then(user => {
        res.cookie('session', user.authToken(), {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000
        });
        res.send(user);
      })
      .catch(next);
  })

  .get('/verify', ensureAuth, (req, res) => {
    res.send(req.user);
  })

  .get('/logout', ensureAuth, (req, res) => {
    res.clearCookie('session');
    res.send(req.user);
  });
