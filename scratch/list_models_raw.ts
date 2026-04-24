import axios from "axios";
import dotenv from "dotenv";

dotenv.config({ override: true });

const apiKey = (process.env.GOOGLE_API_KEY || "").trim();

async function listModels() {
  try {
    console.log("Fetching models list from v1beta...");
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    console.log("Models found:");
    console.log(JSON.stringify(response.data.models.map((m: any) => m.name), null, 2));
  } catch (err: any) {
    console.error("Failed to fetch models from v1beta:", err.response?.data || err.message);
    
    try {
      console.log("Fetching models list from v1...");
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      console.log("Models found (v1):");
      console.log(JSON.stringify(response.data.models.map((m: any) => m.name), null, 2));
    } catch (err2: any) {
      console.error("Failed to fetch models from v1:", err2.response?.data || err2.message);
    }
  }
}

listModels();
