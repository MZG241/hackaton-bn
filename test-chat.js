const { GoogleGenAI } = require('@google/genai');

async function test() {
  const ai = new GoogleGenAI({ apiKey: 'AIzaSyBnP9XNle-Q67hSRPiEPsffJFaOo1tTlcY' });
  
  try {
    const history = [
      { role: "user", parts: [{ text: "Hello" }] },
      { role: "model", parts: [{ text: "Hi there" }] }
    ];
    // try old shape
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: "You are an assistant",
        temperature: 0.7,
      }
    });

    const response = await chat.sendMessage({ message: "What did I say earlier?" });
    console.log("Chat response:", response.text);
  } catch (err) {
    console.error("Chat error:", err);
  }
}
test();
