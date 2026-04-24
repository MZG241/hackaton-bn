const { GoogleGenerativeAI } = require("@google/generative-ai");

async function findSupportedModels() {
  const apiKey = "AIzaSyB_KwbMQsew5OTMx9GTrQHrgOtIVIjnnts";
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "non-existent-model" });
    await model.generateContent("test");
  } catch (e) {
    console.log("FULL ERROR MESSAGE:");
    console.log(e.message);
    
    // On cherche la liste des modèles supportés dans le message d'erreur
    const match = e.message.match(/Supported models are: \[(.*)\]/);
    if (match) {
      console.log("SUPPORTED MODELS FOUND:", match[1]);
    } else {
      console.log("Could not find supported models list in error message.");
    }
  }
}

findSupportedModels();
