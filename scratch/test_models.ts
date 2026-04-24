import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ override: true });

const apiKey = (process.env.GOOGLE_API_KEY || "").trim();
const ai = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("Listing models for API Key...");
    // There isn't a direct listModels in the simple SDK, usually it's through the generative service
    // But we can try to hit the endpoint or use the REST API
    
    // Let's try to just call gemini-1.5-flash with v1
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash (default v1beta)");
  } catch (err: any) {
    console.error("Failed with gemini-1.5-flash:", err.message);
    
    try {
      console.log("Trying with gemini-1.5-flash and v1...");
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
      const result = await model.generateContent("test");
      console.log("Success with gemini-1.5-flash and v1");
    } catch (err2: any) {
      console.error("Failed with v1:", err2.message);
    }
    
    try {
      console.log("Trying with gemini-1.0-pro...");
      const model = ai.getGenerativeModel({ model: "gemini-1.0-pro" });
      const result = await model.generateContent("test");
      console.log("Success with gemini-1.0-pro");
    } catch (err3: any) {
      console.error("Failed with gemini-1.0-pro:", err3.message);
    }
  }
}

listModels();
