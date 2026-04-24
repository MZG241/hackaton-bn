const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URL = 'mongodb+srv://MOUKALA:Motsu241@applicant-api.bkjta.mongodb.net/akazi';
const HASHED_PASS = bcrypt.hashSync('Test@1234', 10);

const UserSchema = new mongoose.Schema({
  fullname: String, email: { type: String, unique: true }, password: String,
  role: String, isVerified: Boolean, headline: String, position: String,
  bio: String, location: String, phone: String, resume: String,
  companyName: String, companyDescription: String, companyPhone: String, companyLocation: String,
  skills: Array, languages: Array, experience: Array, education: Array,
  certifications: Array, projects: Array, availability: Object, socialLinks: Object,
  aiSummary: String
}, { timestamps: true });

const JobSchema = new mongoose.Schema({
  title: String, description: String, requirements: [String], location: String,
  category: String, type: String, postedBy: mongoose.Schema.Types.ObjectId,
  salaryMin: Number, salaryMax: Number, isClosed: Boolean,
  skillsRequired: [String], experienceLevel: String, educationLevel: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Job = mongoose.model('Job', JobSchema);

async function run() {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    // 1. Create Recruiters
    const recruiters = await User.insertMany([
        {
            fullname: 'Jean-Paul Mugisha',
            email: 'jeanpaul.mugisha@rwandatech.rw',
            password: HASHED_PASS,
            role: 'employer',
            isVerified: true,
            companyName: 'Rwanda Tech Hub',
            companyDescription: 'Leading innovation hub in Rwanda specializing in digital transformation.',
            location: 'Kigali, Rwanda',
            phone: '+250788100200'
        },
        {
            fullname: 'Angelique Umutoni',
            email: 'angelique.umutoni@kigali-inn.rw',
            password: HASHED_PASS,
            role: 'employer',
            isVerified: true,
            companyName: 'Kigali Innovation Center',
            companyDescription: 'Fostering tech entrepreneurship and talent development.',
            location: 'Kigali, Rwanda',
            phone: '+250788100300'
        }
    ]);
    console.log('Created 2 recruiters');

    // 2. Create Job Seekers
    const seekers = await User.insertMany([
        {
            fullname: 'Fabrice Niyomugabo',
            email: 'fabrice.niyomugabo@talent.rw',
            password: HASHED_PASS,
            role: 'jobseeker',
            isVerified: true,
            position: 'Software Engineer',
            location: 'Kigali, Rwanda',
            skills: [{ name: 'JavaScript', level: 'Expert' }, { name: 'Node.js', level: 'Advanced' }],
            bio: 'Passionate software engineer with focus on scalable web applications.'
        },
        {
            fullname: 'Solange Uwase',
            email: 'solange.uwase@talent.rw',
            password: HASHED_PASS,
            role: 'jobseeker',
            isVerified: true,
            position: 'UX Designer',
            location: 'Musanze, Rwanda',
            skills: [{ name: 'Figma', level: 'Expert' }, { name: 'UI Design', level: 'Expert' }],
            bio: 'Creative designer focused on user-centric digital experiences.'
        }
    ]);
    console.log('Created 2 job seekers');

    // 3. Create Jobs
    const jobs = await Job.insertMany([
        {
            title: 'Senior Java Developer',
            description: '<p>Join our team to build mission-critical Java applications.</p>',
            category: 'Technology',
            type: 'full-time',
            location: 'Kigali, Rwanda',
            postedBy: recruiters[0]._id,
            salaryMin: 1500,
            salaryMax: 2500,
            isClosed: false,
            skillsRequired: ['Java', 'Spring Boot', 'PostgreSQL']
        },
        {
            title: 'Frontend Specialist',
            description: '<p>Build beautiful user interfaces using React and Tailwind.</p>',
            category: 'Technology',
            type: 'full-time',
            location: 'Kigali, Rwanda',
            postedBy: recruiters[0]._id,
            salaryMin: 1200,
            salaryMax: 2000,
            isClosed: false,
            skillsRequired: ['React', 'Next.js', 'Tailwind CSS']
        },
        {
            title: 'Human Resources Officer',
            description: '<p>Manage talent acquisition and employee relations.</p>',
            category: 'Human Resources',
            type: 'full-time',
            location: 'Kigali, Rwanda',
            postedBy: recruiters[1]._id,
            salaryMin: 800,
            salaryMax: 1500,
            isClosed: false,
            skillsRequired: ['Recruitment', 'Employee Relations', 'HRIS']
        }
    ]);
    console.log('Created 3 jobs');

    await mongoose.disconnect();
    console.log('Done');
}

run().catch(console.error);
