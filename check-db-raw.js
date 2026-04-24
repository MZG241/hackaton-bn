const mongoose = require('mongoose');
require('dotenv').config();

async function checkAccount() {
    await mongoose.connect(process.env.MONGO_URL);
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log("--- BDD ANALYSIS ---");
    users.forEach(u => {
        console.log(`- ${u.fullname} | ${u.email} | Role: ${u.role} | Verified: ${u.isVerified}`);
    });
    process.exit();
}

checkAccount();
