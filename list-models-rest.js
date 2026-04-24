const axios = require('axios');

async function listModelsDirectly() {
    const API_KEY = "AIzaSyDWHMwYmuNLLnaVcBehirCavvf0l91jCOI";
    const url = `https://generativeai.googleapis.com/v1beta/models?key=${API_KEY}`;

    console.log("--- LIST MODELS (REST API) ---");
    try {
        const response = await axios.get(url);
        console.log("✅ SUCCÈS ! Modèles disponibles :");
        response.data.models.forEach(m => console.log(`- ${m.name}`));
    } catch (error) {
        console.log("❌ ÉCHEC :", error.response?.status || error.message);
        if (error.response?.data) {
            console.log("Détail :", JSON.stringify(error.response.data.error, null, 2));
        }
    }
}

listModelsDirectly();
