const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.applicant-api.bkjta.mongodb.net', (err, addresses) => {
  console.log("--- DNS SRV LOOKUP ---");
  if (err) {
    console.error("❌ ERREUR DNS :", err.message);
  } else {
    console.log("✅ RÉUSSITE. Adresses trouvées :");
    console.log(addresses);
  }
});
