require('dotenv').config();
const connect = require('../lib/utils/connect');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../lib/app');


beforeAll(() => {
  connect();
});

beforeEach(() => {
  return mongoose.connection.dropDatabase();
});

let agent = request.agent(app);
let agent2 = request.agent(app);
let token = null;
let token2 = null;
let userId = null;
let userId2 = null;
let seededUsers = null;
beforeEach(async() => {

  return await agent
    .post('/api/v1/auth/guest')
    .send({ nickname: 'guestuser', avatar: 'someimgurl' })
    .then(res => {
      userId = res.body._id;
      token = res.header['set-cookie'][0];
    });
});

beforeEach(async() => {
  return await agent2
    .post('/api/v1/auth/guest')
    .send({ nickname: 'guestuser2', avatar: 'someimgurl' })
    .then(res => {
      userId2 = res.body._id;
      token2 = res.header['set-cookie'][0];
    });
});

afterAll(() => {
  return mongoose.connection.close();
});

module.exports = {
  getAgent: () => agent,
  getAgent2: () => agent2,
  getUserId: () => userId,
  getUserId2: () => userId2,
  getToken: () => token,
  getToken2: () => token2,
  getUsers: () => seededUsers
};
