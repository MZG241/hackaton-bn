const mongoose = require('mongoose');

const uri = "mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi";

async function testConnection() {
  console.log("Tentative de connexion à MongoDB Atlas...");
  try {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // Timeout rapide de 5 secondes
    });
    console.log("✅ Connexion RÉUSSIE !");
    process.exit(0);
  } catch (err) {
    console.error("❌ ÉCHEC de la connexion !");
    console.error("Détails de l'erreur :");
    console.error(err.message);
    if (err.reason) console.error("Raison :", err.reason.message);
    process.exit(1);
  }
}

testConnection();
