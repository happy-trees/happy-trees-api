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
let token = null;
beforeEach(async() => {
  return await agent
    .post('/api/v1/auth/guest')
    .send({ nickname: 'guestuser', avatar: 'someimgurl' });
});

afterAll(() => {
  return mongoose.connection.close();
});

module.exports = {
  getAgent: () => agent,
  getToken: () => token
};
