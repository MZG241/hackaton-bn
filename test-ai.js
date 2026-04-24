const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

async function testAI() {
    console.log("Starting AI Diagnostic Test...");
    console.log(`Using model: ${modelName}`);
    
    if (!apiKey) {
        console.error("ERROR: GOOGLE_API_KEY is missing in .env");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "Hello AI, please confirm you are working by responding with 'SYSTEM_ONLINE' and a short joke about recruitment.";
        
        console.log("Sending prompt to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("\n--- AI RESPONSE ---");
        console.log(text);
        console.log("-------------------\n");
        
        if (text.includes("SYSTEM_ONLINE")) {
            console.log("SUCCESS: AI is responsive and working correctly!");
        } else {
            console.warn("WARNING: AI responded but did not follow the 'SYSTEM_ONLINE' instruction.");
        }
    } catch (error) {
        console.error("FAILED: AI service test failed!");
        console.error("Error details:", error.message || error);
        
        if (error.message && error.message.includes("404")) {
            console.error("\nSuggestion: The model name might be incorrect or unavailable for your API key.");
        }
    }
}

testAI();
