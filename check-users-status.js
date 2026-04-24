const mongoose = require('mongoose');
const User = require('./src/models/user.model').default || require('./src/models/user.model');
const dotenv = require('dotenv');

dotenv.config();

async function checkUsers() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("--- BDD USERS CHECK ---");
  const users = await User.find({}).select('fullname email role isVerified');
  users.forEach(u => {
    console.log(`- ${u.fullname} (${u.email}) | Role: ${u.role} | Verified: ${u.isVerified}`);
  });
  process.exit();
}

checkUsers();
