const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/campus');
    const user = await User.findOne({ email: 'admin@kongu.edu' }).lean();
    console.log('adminExists=', !!user);
    console.log(user);
    if (user) {
      const match = await bcrypt.compare('Admin@123', user.password);
      console.log('passwordMatch=', match);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
