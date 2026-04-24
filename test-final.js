const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testFinal() {
  const apiKey = (process.env.GOOGLE_API_KEY || "").trim();
  console.log(`FINAL TEST KEY: "${apiKey}"`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Hello, strictly return 'YES' if you work.");
    console.log("GEMINI RESULT:", result.response.text());
  } catch (err) {
    console.error("GEMINI FINAL TEST FAILED!");
    console.error("Message:", err.message);
  }
}

testFinal();
