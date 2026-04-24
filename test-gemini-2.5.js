const { GoogleGenerativeAI } = require("@google/generative-ai");

async function diagnoseGemini25() {
  const apiKey = "AIzaSyB_KwbMQsew5OTMx9GTrQHrgOtIVIjnnts";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent("genere moi une courte phrase pour tester le reseau");
    console.log("✅ RÉUSSITE (2.5) :", result.response.text());
  } catch (error) {
    console.error("❌ ERREUR 2.5 :");
    console.error(error.message);
  }
}

diagnoseGemini25();
