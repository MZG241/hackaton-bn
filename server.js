import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit"
import { DbConnection } from "./DbConfig/Database.js";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import jobRoute from "./routes/job.route.js";
import applicantRoute from "./routes/applicant.route.js";
import savedRoute from "./routes/saved.route.js";
import analyticRoute from "./routes/analytic.route.js";
import adminRoute from "./routes/admin.route.js";

dotenv.config();

const app = express();

//For production 2
const corsOptions = {
  origin: 'https://akazi-recruitment-agency.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(
corsOptions
))
app.use(express.json())
app.use(helmet())

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100, 
})

app.use(limiter);

app.use('/api/auth',authRoute);
app.use('/api/user',userRoute);
app.use('/api/admin',adminRoute);
app.use('/api/job',jobRoute);
app.use('/api/applicant',applicantRoute);
app.use('/api/saved',savedRoute);
app.use('/api/analytic',analyticRoute);

const port = process.env.PORT;


app.listen(port,async()=>{
console.log(`Your server is running on port ${port}.`);
await DbConnection()
})