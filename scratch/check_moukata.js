const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi";

async function checkSpecific() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, family: 4 });
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: 'moukalazamg@gmail.com' });
    if (user) {
        console.log(`FOUND moukalazamg@gmail.com: Role=${user.role}`);
    } else {
        console.log("NOT FOUND moukalazamg@gmail.com");
    }
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
checkSpecific();
