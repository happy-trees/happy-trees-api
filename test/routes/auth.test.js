const { getAgent } = require('../data-helpers');
const request = require('supertest');
const app = require('../../lib/app');

describe('auth routes', () => {
  it('creates and returns a user', () => {
    return request(app)
      .post('/api/v1/auth/guest')
      .send({ nickname: 'jack', avatar: 'someimgurl' })
      .then(res => {
        expect(res.body).toEqual({
          _id: expect.any(String),
          nickname: 'jack',
          isGuest: true,
          avatar: 'someimgurl',
          __v: 0
        });
      });
  });

  it('can verify that a user is signed in', () => {
    return getAgent()
      .get('/api/v1/auth/verify')
      .then(res => {
        expect(res.body).toEqual({
          _id: expect.any(String),
          nickname: 'guestuser',
          avatar: 'someimgurl',
          isGuest: true,
          __v: 0
        });
      });
  });
});