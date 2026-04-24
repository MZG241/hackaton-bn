require('dotenv').config();
console.log(`SECRET_KEY: "${process.env.SECRET_KEY}"`);
console.log(`LENGTH: ${process.env.SECRET_KEY ? process.env.SECRET_KEY.length : 0}`);
