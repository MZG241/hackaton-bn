const { GoogleGenerativeAI } = require("@google/generative-ai");

async function diagnose() {
  const apiKey = "AIzaSyB_KwbMQsew5OTMx9GTrQHrgOtIVIjnnts";
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
  
  for (const m of models) {
    try {
      console.log(`Trying ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Say 'HI'");
      console.log(`✅ ${m} WORKS! Response: ${result.response.text()}`);
    } catch (e) {
      console.log(`❌ ${m} FAILED: ${e.message}`);
    }
  }
}

diagnose();
