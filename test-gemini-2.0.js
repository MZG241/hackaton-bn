const { GoogleGenerativeAI } = require("@google/generative-ai");

async function flash20Test() {
  const apiKey = "AIzaSyB_KwbMQsew5OTMx9GTrQHrgOtIVIjnnts";
  console.log(`TESTING GEMINI 2.0 FLASH WITH KEY: "${apiKey}"`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // On teste les variantes du nom
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-exp"];

  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Respond with '2.0 ACTIVE' if you work.");
      console.log(`✅ SUCCESS with ${m} !`);
      console.log("Response:", result.response.text());
      return;
    } catch (e) {
      console.log(`❌ FAIL with ${m}: ${e.message}`);
    }
  }
}

flash20Test();
