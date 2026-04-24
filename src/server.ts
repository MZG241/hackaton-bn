import dotenv from "dotenv";
dotenv.config();

// CORRECTIF RÉSEAU : Force l'utilisation d'un DNS fiable pour contourner le blocage du routeur local
import dns from "dns";
dns.setServers(['8.8.8.8', '8.8.4.4']);

import express from "express";
import cors from "cors";
import helmet from "helmet";
// import rateLimit from "express-rate-limit"
import { DbConnection } from "./DbConfig/Database";
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import jobRoute from "./routes/job.route";
import applicantRoute from "./routes/applicant.route";
import savedRoute from "./routes/saved.route";
import analyticRoute from "./routes/analytic.route";
import adminRoute from "./routes/admin.route";
import aiRoute from "./routes/ai.route";
import { setupSwagger } from "./config/swagger";

const app = express();
setupSwagger(app);

//For production 2
const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(
  corsOptions
))
app.use(express.json())
app.use(helmet())

// Rate limiter disabled for development/troubleshooting 429 errors
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, 
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
})

app.use("/api/", limiter);
*/

app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Akazi Nexus | Protocol</title>
            <style>
                body { 
                    margin: 0; padding: 0; 
                    background: #0a0a0a; 
                    color: white; 
                    font-family: 'Inter', system-ui, sans-serif;
                    display: flex; align-items: center; justify-content: center;
                    height: 100vh; overflow: hidden;
                }
                .container { text-align: center; max-width: 600px; padding: 20px; }
                h1 { font-size: 3rem; font-weight: 900; margin: 0; letter-spacing: -2px; text-transform: uppercase; }
                .accent { color: #3b82f6; }
                p { font-size: 1.1rem; opacity: 0.6; line-height: 1.6; margin-top: 1rem; }
                .badge { 
                    display: inline-block; padding: 4px 12px; 
                    background: rgba(59, 130, 246, 0.1); 
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    color: #3b82f6; border-radius: 20px; 
                    font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;
                    margin-bottom: 20px;
                }
                .status { margin-top: 40px; display: flex; gap: 20px; justify-content: center; }
                .status-item { font-size: 0.7rem; font-weight: 700; opacity: 0.4; text-transform: uppercase; }
                .dot { display: inline-block; width: 6px; height: 6px; background: #10b981; border-radius: 50%; margin-right: 6px; box-shadow: 0 0 10px #10b981; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="badge">Akazi Hiring Management based on AI</div>
                <h1>Akazi <span class="accent">Nexus.</span></h1>
                <p>The neural recruitment framework for high-stakes mission deployments. Unifying global talent through strategic node synchronization.</p>
                <div class="status">
                    <div class="status-item"><span class="dot"></span> Core Systems Operational</div>
                    <div class="status-item">Latency: 24ms</div>
                </div>
                <div style="margin-top: 30px;">
                    <a href="/api-docs" style="color: #3b82f6; text-decoration: none; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border: 1px solid rgba(59, 130, 246, 0.3); padding: 8px 20px; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background='transparent'">Access Neural Documentation</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.get('/api/ping', (req, res) => {
    console.log("[SERVER] Ping received!");
    res.json({ message: "pong", timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/admin', adminRoute);
app.use('/api/job', jobRoute);
app.use('/api/applicant', applicantRoute);
app.use('/api/saved', savedRoute);
app.use('/api/analytic', analyticRoute);
app.use('/api/ai', aiRoute);

const port = process.env.PORT;


app.listen(port, async () => {
  console.log(`Your server is running on port ${port}.`);
  await DbConnection()
})