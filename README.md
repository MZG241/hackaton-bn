# Akazi- AI Recruitment Backend 

Akazi Nexus is a high-performance recruitment intelligence platform powered by Google Gemini 2.5 Flash. It automates the entire recruitment lifecycle—from AI-driven job creation to neural candidate screening and career coaching.

## 🚀 Core Technologies
- **Runtime**: Node.js (v24+)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI Engine**: Google Gemini 2.5 Flash (Generative AI SDK)
- **File Storage**: Cloudinary (for resumes and profile images)
- **Security**: JWT Authentication, Helmet, Rate Limiting

## 🧠 Neural Architecture & Flow
1. **Intelligence Extraction**: Resumes are parsed using AI to extract structured data (skills, experience, education).
2. **Dynamic Matchmaking**: Candidates are screened against job requirements using a multi-dimensional scoring vector (Score, Category, Strengths, Risks).
3. **Automated Pipeline**: Recruiters use the AI Dashboard to process candidates with real-time sync between AI results and application status.
4. **Interactive Coaching**: Candidates receive AI-driven career guidance based on their specific profile and market trends.

## 🛠️ Environment Variables
Create a `.env` file in the root directory with the following parameters:
```env
PORT=5000
MONGO_URL=your_mongodb_uri
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
SECRET_KEY=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:3000
EMAIL_USER=your_smtp_user
EMAIL_PASSWORD=your_smtp_app_password
```

## 📡 API Endpoints (Neural Routes)

### 🔐 Authentication (`/api/auth`)
- `POST /register` - Secure node registration
- `POST /login` - Authentication and session deployment
- `GET /me` - Retrieve current session context

### 🤖 Intelligent Systems (`/api/ai`)
- `POST /parse-cv` - Extract intelligence from PDF/Word resumes
- `POST /generate-job` - Generate AI-driven mission proposals from natural language
- `POST /screen/:applicationId` - Execute deep neural screening for a specific candidate
- `GET /screening/:jobId` - Retrieve aggregate screening results for a mission
- `POST /rescan/:jobId` - Refresh neural analysis for an entire candidate pool
- `POST /compare` - Side-by-side technical comparison of candidate nodes
- `POST /quick-decision-sync/:applicationId` - Synchronize Hire/Reject decisions
- `POST /career-coach` - Initialize interactive AI guidance session

### 💼 Mission Management (`/api/job`)
- `POST /create` - Deploy new mission parameters
- `GET /all` - Global registry search
- `GET /:id` - Retrieve specific node parameters
- `PATCH /edit/:id` - Synchronize listing modifications

### 👥 Applicant Registry (`/api/applicant`)
- `POST /apply/:jobId` - Submit mission application
- `GET /my-applications` - Track personal engagement status
- `GET /job/:jobId` - Retrieve pool for a specific mission

## 🏗️ Deployment Instructions
1. **Local**: `npm install && npm run dev`
2. **Production (Render)**:
   - Root Directory: (Leave Blank)
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start` (Runs compiled code from `dist/`)

