import dotenv from "dotenv";
dotenv.config();

console.log("--- TESTING AUTH CONTROLLER IMPORT ---");
try {
    const authController = require("../controllers/auth.controller");
    console.log("SUCCESS: Auth controller imported successfully.");
    console.log("Exported functions:", Object.keys(authController));
} catch (error) {
    console.error("FAILURE: Auth controller failed to import!", error);
}
