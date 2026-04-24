const { GoogleGenerativeAI } = require("@google/generative-ai");

async function ultimateTest() {
  const apiKey = "AIzaSyB_KwbMQsew5OTMx9GTrQHrgOtIVIjnnts";
  const models = ["gemini-1.5-flash", "gemini-pro"];
  const versions = ["v1", "v1beta"];

  console.log(`ULTIMATE VERSION TEST FOR KEY: "${apiKey}"`);
  
  for (const v of versions) {
    for (const m of models) {
      console.log(`Testing ${v} / ${m}...`);
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // On force la version de l'API si possible (selon SDK)
        // Note: Le SDK actuel utilise v1beta par défaut ou v1 selon les versions.
        const model = genAI.getGenerativeModel({ model: m }, { apiVersion: v });
        const result = await model.generateContent("Test");
        console.log(`✅ SUCCESS with ${v} / ${m} !`);
        return;
      } catch (e) {
        console.log(`❌ FAIL with ${v} / ${m}: ${e.message}`);
      }
    }
  }
}

ultimateTest();
