const { GoogleGenerativeAI } = require("@google/generative-ai");

async function diagnoseGemini() {
  const apiKey = "AIzaSyB_KwbMQsew5OTMx9GTrQHrgOtIVIjnnts";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    console.log("Envoi du prompt...");
    const result = await model.generateContent("genere moi une description pour mon entreprise");
    console.log("RÉUSSITE :", result.response.text().substring(0, 50));
  } catch (error) {
    console.error("ERREUR CAPTURÉE :");
    console.error(error.message);
    if (error.response) console.error("Détails API:", JSON.stringify(error.response, null, 2));
    if (error.status) console.error("Status:", error.status);
  }
}

diagnoseGemini();
