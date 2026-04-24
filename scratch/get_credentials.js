const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi";

async function getCredentials() {
  try {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        family: 4
    });
    const db = mongoose.connection.db;
    
    console.log("\n--- ADMIN ACCOUNT ---");
    const admin = await db.collection('users').findOne({ role: 'admin' });
    if (admin) {
        console.log(`Email: ${admin.email}`);
    } else {
        console.log("No admin found in DB.");
    }

    console.log("\n--- EMPLOYER (RECRUITER) ACCOUNT ---");
    const employer = await db.collection('users').findOne({ role: 'employer' });
    if (employer) {
        console.log(`Email: ${employer.email}`);
        console.log(`Full Name: ${employer.fullname}`);
    } else {
        console.log("No employer found in DB.");
    }
    
    console.log("\nNote: Password for ALL users is likely 'Test@1234' based on seed.js\n");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

getCredentials();
