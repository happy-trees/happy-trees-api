const { getToken } = require('../data-helpers');
const io = require('socket.io-client');
const http = require('../../lib/app');

describe('auth routes', () => {
  let socket1;
  let socket2;
  beforeEach(async() => {
    http.listen(3001);

    const token = getToken();

    socket1 = io.connect('http://localhost:3001', {
      extraHeaders: { Cookie: token },
      'reconnection delay' : 0, 
      'reopen delay' : 0, 
      'force new connection' : true, 
      transports: ['websocket']
    });

    socket2 = io.connect('http://localhost:3001', {
      extraHeaders: { Cookie: token },
      'reconnection delay' : 0, 
      'reopen delay' : 0, 
      'force new connection' : true, 
      transports: ['websocket']
    });
  });

  afterAll(() => {
    http.close();
  });

  it('connects to to socket.io and sends a stroke', (done) => {
    socket2.on('stroke', (data) => {
      expect(data).toEqual({
        x: 0,
        y: 10,
        px: 30,
        py: 47,
        color: '#000000',
        strokeWidth: 5
      });
      socket1.close();
      socket2.close();
      done();
    });
    const data = {
      x: 0,
      y: 10,
      px: 30,
      py: 47,
      color: '#000000',
      strokeWidth: 5
    };
    socket1.emit('stroke', data);
  });
});