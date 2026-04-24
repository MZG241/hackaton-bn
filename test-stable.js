const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const genAI = new GoogleGenerativeAI("AIzaSyBnP9XNle-Q67hSRPiEPsffJFaOo1tTlcY");
  
  const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-flash"];
  
  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`Testing ${modelName}...`);
      const result = await model.generateContent("Hello, respond with 'OK'");
      console.log(`SUCCESS: ${modelName} -> ${result.response.text()}`);
    } catch (e) {
      console.log(`ERROR: ${modelName} -> ${e.message}`);
    }
  }
}

test();
