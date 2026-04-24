const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi";

async function createAdmin() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, family: 4 });
    const db = mongoose.connection.db;
    
    const adminEmail = "admin@akazi.rw";
    const hashedPassword = await bcrypt.hash("Test@1234", 10);
    
    // Check if exists
    const existing = await db.collection('users').findOne({ email: adminEmail });
    if (existing) {
        await db.collection('users').updateOne({ email: adminEmail }, { $set: { role: 'admin', isVerified: true } });
        console.log(`Updated existing user ${adminEmail} to ADMIN`);
    } else {
        await db.collection('users').insertOne({
            fullname: "System Administrator",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`Created NEW ADMIN: ${adminEmail}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err.message);
    process.exit(1);
  }
}
createAdmin();
