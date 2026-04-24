const mongoose = require('mongoose');

const uri = "mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi";

async function testIPv4() {
  console.log("Tentative avec IPv4 forcé (sans DNS Google)...");
  try {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        family: 4 
    });
    console.log("✅ Connexion Node.js RÉUSSIE (IPv4) !");
    process.exit(0);
  } catch (err) {
    console.error("❌ ÉCHEC IPv4 :", err.message);
    process.exit(1);
  }
}

testIPv4();
