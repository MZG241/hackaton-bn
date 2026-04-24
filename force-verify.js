const mongoose = require('mongoose');
require('dotenv').config();

async function forceVerify() {
    await mongoose.connect(process.env.MONGO_URL);
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
        { email: 'armand_test@gmail.com' },
        { $set: { isVerified: true } }
    );
    console.log(`--- FORCE VERIFY ---`);
    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    process.exit();
}

forceVerify();
