const User = require('../lib/models/User');


module.exports = async() => {
  const createdUsers = await User.create([{ 
    nickname: 'seed-user-1', 
    avatar: 'someimgurl' 
  }, 
  { 
    nickname: 'seed-user-2', 
    avatar: 'someimgurl' 
  }]);

  return {
    users: createdUsers,
  };
};
