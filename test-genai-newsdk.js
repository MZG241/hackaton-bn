const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: 'AIzaSyBnP9XNle-Q67hSRPiEPsffJFaOo1tTlcY' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Hello, reply with '2.5 works!'",
    });
    console.log("SUCCESS length:", response.text.length, response.text);
  } catch (error) {
    console.log("ERROR:", error.message || error);
  }
}

test();
