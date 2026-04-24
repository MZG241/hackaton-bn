const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';

const UserSchema = new mongoose.Schema({
    email: String,
    role: String
}, { strict: false });

const JobSchema = new mongoose.Schema({
    title: String, description: String, requirements: [String], location: String,
    category: String, type: String, postedBy: mongoose.Schema.Types.ObjectId,
    salaryMin: Number, salaryMax: Number, isClosed: Boolean,
    skillsRequired: [String], experienceLevel: String, educationLevel: String
}, { timestamps: true });

const jobTitles = [
    'Senior AI Engineer','Machine Learning Researcher','Chief Data Scientist',
    'Financial Analyst Director', 'VP of Marketing', 'Head of Software Development',
    'Cybersecurity Systems Lead', 'Blockchain Architect', 'Cloud Infrastructure Engineer',
    'Senior Product Manager', 'Growth Hacker', 'VP of Design', 'Lead UX/UI Designer',
    'Healthcare Administrator', 'Chief Medical Officer', 'Lead Technical Recruiter',
    'Full-Stack JavaScript Developer', 'Senior Python Engineer', 'DevOps Team Lead',
    'Enterprise Strategy Consultant'
];

async function addExtraJobs() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, {
        serverSelectionTimeoutMS: 5000,
        family: 4
    });
    console.log('✅ Connected!');

    const User = mongoose.model('User', UserSchema);
    const Job = mongoose.model('Job', JobSchema);

    // Get the first two employer accounts
    const employers = await User.find({ email: { $in: ['zanelekaberukaemp0@akazi.rw', 'claudinendongemp1@akazi.rw'] } });

    if (employers.length === 0) {
        console.log('❌ Primary test employers not found!');
        process.exit(1);
    }

    console.log(`📌 Found target employers. Injecting 40 premium jobs...`);

    const newJobs = [];
    for (let i = 0; i < 40; i++) {
        const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        const employer = employers[Math.floor(Math.random() * employers.length)];
        const minSal = Math.floor(Math.random() * 2000 + 500) * 100;
        
        newJobs.push({
            title: title + ` - Priority Requisition ${i+1}`,
            description: `<p>We are actively hiring for a crucial ${title} position. This is a high-visibility role requiring exceptional skill and dedication. Apply immediately.</p><p>As part of our rapid expansion across East Africa, you will be leading core initiatives shaping our technological landscape.</p><ul><li>Lead complex strategic systems</li><li>Manage high performing teams</li><li>Drive digital transformation</li></ul>`,
            requirements: ['Leadership', 'Problem-Solving', 'Strategic Planning', 'Technical Excellence'],
            location: 'Kigali, Rwanda',
            category: 'Technology',
            type: 'full-time',
            postedBy: employer._id,
            salaryMin: minSal,
            salaryMax: minSal + 400000,
            isClosed: false,
            skillsRequired: ['Management', 'Innovation', 'Analytics', 'Agile'],
            experienceLevel: 'senior',
            educationLevel: 'Master\'s Degree'
        });
    }

    await Job.insertMany(newJobs);
    console.log(`✅ successfully injected ${newJobs.length} new jobs for the active test employer.`);

    process.exit(0);
}

addExtraJobs();
