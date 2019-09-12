require('../data-helpers');
const request = require('supertest');
const app = require('../../lib/app');

describe('auth routes', () => {
  it('creates and returns a user', () => {
    return request(app)
      .post('/api/v1/auth/guest')
      .send({ nickname: 'jack', isGuest: true, avatar: 'someimgurl' })
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
});
