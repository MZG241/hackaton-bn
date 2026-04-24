const axios = require('axios');

async function testEndpoints() {
    const API_KEY = "AIzaSyDWHMwYmuNLLnaVcBehirCavvf0l91jCOI";
    const models = ["gemini-1.5-flash", "gemini-pro"];
    const versions = ["v1", "v1beta"];

    console.log("--- TEST ENDPOINTS DIRECTS (AXIOS) ---");
    
    for (const v of versions) {
        for (const m of models) {
            console.log(`\n> Tentative : ${v} / ${m}`);
            const url = `https://generativeai.googleapis.com/${v}/models/${m}:generateContent?key=${API_KEY}`;
            try {
                const response = await axios.post(url, {
                    contents: [{ parts: [{ text: "hi" }] }]
                });
                console.log(`✅ SUCCÈS [${v}/${m}] !`);
                console.log("Réponse :", response.data.candidates[0].content.parts[0].text.substring(0, 50));
                return;
            } catch (error) {
                console.log(`❌ ÉCHEC [${v}/${m}] : ${error.response?.status || error.message}`);
                if (error.response?.data) {
                    console.log("   Détail :", JSON.stringify(error.response.data.error, null, 2));
                }
            }
        }
    }
}

testEndpoints();
