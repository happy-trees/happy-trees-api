require('dotenv').config();
const connect = require('../lib/utils/connect');
const mongoose = require('mongoose');

beforeAll(() => {
  connect();
});

beforeEach(() => {
  return mongoose.connection.dropDatabase();
});

afterAll(() => {
  return mongoose.connection.close();
});
