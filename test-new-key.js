const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testNewKey() {
  const apiKey = "AIzaSyDWHMwYmuNLLnaVcBehirCavvf0l91jCOI";
  console.log(`TESTING NEW KEY: "${apiKey}"`);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Test Connection");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    console.error("FAILED HELP!:", error.message);
    if (error.status) console.error("STATUS:", error.status);
    if (error.statusText) console.error("STATUSTEXT:", error.statusText);
  }
}

testNewKey();
