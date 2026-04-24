const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testHardcoded() {
  const apiKey = "AIzaSyBnP9XNle-Q67hSRPiEPsffJFaOo1tTlcY";
  console.log(`HARDCODED KEY: "${apiKey}" (LEN: ${apiKey.length})`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Test");
    console.log("SUCCESS:", result.response.text().substring(0, 50));
  } catch (err) {
    console.error("HARDCODED FAILED:", err.message);
  }
}

testHardcoded();
