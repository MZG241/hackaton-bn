const mongoose = require('mongoose');
const dns = require('dns');

// On force Node.js à utiliser les DNS de Google pour contourner le bug interne
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = "mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi";

async function testConnection() {
  console.log("Tentative avec DNS Google forcés...");
  try {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        family: 4 // Force l'utilisation d'IPv4 (souvent la cause des bugs DNS Node.js)
    });
    console.log("✅ Connexion Node.js RÉUSSIE !");
    process.exit(0);
  } catch (err) {
    console.error("❌ ÉCHEC :", err.message);
    process.exit(1);
  }
}

testConnection();
