const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

// On charge explicitement le .env du dossier racine
dotenv.config({ path: path.resolve(__dirname, ".env") });

const API_KEY = (process.env.GOOGLE_API_KEY || "AIzaSyDWHMwYmuNLLnaVcBehirCavvf0l91jCOI").trim();

async function deepDiagPing() {
    console.log("--- DIAGNOSTIC PROFOND GEMINI ---");
    console.log(`Clé utilisée : "${API_KEY.substring(0, 10)}..." (Longueur: ${API_KEY.length})`);
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Liste des modèles à tester pour voir lequel répond
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    for (const modelName of modelsToTest) {
        console.log(`\n> Test du modèle : ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Ping");
            console.log(`✅ SUCCÈS [${modelName}] : ${result.response.text().substring(0, 30)}...`);
            return; // On s'arrête au premier succès
        } catch (error) {
            console.error(`❌ ÉCHEC [${modelName}] : ${error.message}`);
            if (error.status) console.error(`   Status Code: ${error.status}`);
            if (error.statusText) console.error(`   Status Text: ${error.statusText}`);
            // On continue sur le modèle suivant
        }
    }

    console.log("\n----------------------------------");
    console.log("BILAN : Aucun modèle n'a répondu. L'erreur 404 indique que soit la clé est erronée, soit l'API n'est pas activée sur ce compte spécifique.");
    console.log("----------------------------------");
}

deepDiagPing();
